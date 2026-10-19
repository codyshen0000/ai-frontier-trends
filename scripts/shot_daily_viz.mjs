/** Headless Chrome shots of /daily/ lead + story + mobile. */
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const port = Number(process.env.PORT || 4173);
const outDir = process.argv[2] || "preview/daily/shots";
mkdirSync(outDir, { recursive: true });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cdpSeq = 0;
const cdpWait = new Map();

function attachCdp(ws) {
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && cdpWait.has(msg.id)) {
      const { resolve, reject } = cdpWait.get(msg.id);
      cdpWait.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || "cdp"));
      else resolve(msg.result || {});
    }
  });
}

function cdp(ws, method, params = {}, sessionId) {
  const id = ++cdpSeq;
  const payload = sessionId ? { id, method, params, sessionId } : { id, method, params };
  ws.send(JSON.stringify(payload));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cdpWait.delete(id);
      reject(new Error(`CDP timeout ${method}`));
    }, 30000);
    cdpWait.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
  });
}

function waitEvent(ws, name, sessionId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`event timeout ${name}`)), 30000);
    const onMessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method !== name) return;
      if (sessionId && msg.sessionId !== sessionId) return;
      clearTimeout(timer);
      ws.removeEventListener("message", onMessage);
      resolve(msg.params || {});
    };
    ws.addEventListener("message", onMessage);
  });
}

async function shot({ url, width, height, file, selector }) {
  const profile = `/tmp/chrome-shot-${process.pid}-${Math.random().toString(16).slice(2)}`;
  mkdirSync(profile, { recursive: true });
  const debugPort = 9222 + Math.floor(Math.random() * 200);
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${debugPort}`,
    `--window-size=${width},${height}`,
    "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe"] });

  let stderr = "";
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`chrome start: ${stderr}`)), 15000);
    chrome.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    chrome.on("exit", (code) => reject(new Error(`chrome exit ${code}: ${stderr}`)));
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  attachCdp(ws);

  try {
    const { targetId } = await cdp(ws, "Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp(ws, "Target.attachToTarget", { targetId, flatten: true });
    const send = (method, params) => cdp(ws, method, params, sessionId);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width <= 430,
    });
    const loaded = waitEvent(ws, "Page.loadEventFired", sessionId);
    await send("Page.navigate", { url });
    await loaded.catch(() => {});
    await wait(4500);
    if (selector) {
      await send("Runtime.evaluate", {
        expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:"center"})`,
      });
      await wait(800);
    }
    const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
    writeFileSync(join(outDir, file), Buffer.from(data, "base64"));
    console.log("wrote", join(outDir, file));
  } finally {
    ws.close();
    chrome.kill("SIGKILL");
  }
}

const base = `http://127.0.0.1:${port}/daily/`;
await shot({ url: base, width: 1280, height: 900, file: "daily-1280-lead-realimg.png" });
await shot({
  url: `${base}#c-muse-spark-open`,
  width: 1280,
  height: 900,
  file: "daily-1280-story-realimg.png",
  selector: "#c-muse-spark-open",
});
await shot({
  url: base,
  width: 390,
  height: 844,
  file: "daily-390-realimg.png",
});
