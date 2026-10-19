/** Headless Chrome shots of /daily/ split cards + labeled ours-vs-aihot. */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const port = Number(process.env.PORT || 4173);
const outDir = process.argv[2] || "preview/daily/shots";
mkdirSync(outDir, { recursive: true });
mkdirSync("preview/daily/refs", { recursive: true });

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
    const timer = setTimeout(() => reject(new Error(`event timeout ${name}`)), 45000);
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

async function withChrome(fn) {
  const profile = `/tmp/chrome-shot-${process.pid}-${Math.random().toString(16).slice(2)}`;
  mkdirSync(profile, { recursive: true });
  const debugPort = 9222 + Math.floor(Math.random() * 200);
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--allow-file-access-from-files",
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${debugPort}`,
      "--window-size=1440,1200",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

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
    return await fn(ws);
  } finally {
    ws.close();
    chrome.kill("SIGKILL");
  }
}

async function shot(ws, { url, width, height, file, selector, clipSelector, waitMs = 4500 }) {
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
  await wait(waitMs);
  if (selector) {
    await send("Runtime.evaluate", {
      expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:"center"})`,
    });
    await wait(800);
  }
  let clip;
  if (clipSelector) {
    const box = await send("Runtime.evaluate", {
      expression: `(function(){
        var el = document.querySelector(${JSON.stringify(clipSelector)});
        if (!el) return null;
        el.scrollIntoView({block:"nearest"});
        var r = el.getBoundingClientRect();
        return {x: r.x, y: r.y, width: r.width, height: r.height};
      })()`,
      returnByValue: true,
    });
    const rect = box.result?.value;
    if (rect && rect.width > 40 && rect.height > 40) {
      clip = {
        x: Math.max(0, Math.round(rect.x - 8)),
        y: Math.max(0, Math.round(rect.y - 8)),
        width: Math.max(1, Math.round(Math.min(width, rect.width + 16))),
        height: Math.max(1, Math.round(Math.min(height, rect.height + 16))),
        scale: 1,
      };
    }
  }
  const params = { format: "png", fromSurface: true };
  if (clip) params.clip = clip;
  const { data } = await send("Page.captureScreenshot", params);
  const dest = join(outDir, file);
  writeFileSync(dest, Buffer.from(data, "base64"));
  console.log("wrote", dest);
  await cdp(ws, "Target.closeTarget", { targetId }).catch(() => {});
  return dest;
}

const CURL_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

function curlTo(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  execFileSync("curl", ["-sL", "-m", "25", "-A", CURL_UA, "-o", dest, url]);
}

function materializeAihot(pageUrl, dir) {
  mkdirSync(dir, { recursive: true });
  const htmlPath = join(dir, "index.html");
  curlTo(pageUrl, htmlPath);
  let html = readFileSync(htmlPath, "utf8");
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  for (const match of html.matchAll(/href="(\/assets\/[^"]+\.css[^"]*)"/g)) {
    const href = match[1];
    const local = join(dir, href.replace(/^\//, "").split("?")[0]);
    try {
      curlTo(`https://aihot.news${href.split("?")[0]}`, local);
      html = html.replaceAll(href, "./" + href.replace(/^\//, "").split("?")[0]);
    } catch (error) {
      console.warn("css miss", href, error.message);
    }
  }
  const imgs = new Set();
  for (const match of html.matchAll(/\/api\/img-proxy\?[^"'<\s]+/g)) {
    imgs.add(match[0].replace(/&amp;/g, "&"));
  }
  let i = 0;
  for (const src of [...imgs].slice(0, 8)) {
    i += 1;
    const dest = join(dir, `img-${i}`);
    try {
      curlTo(`https://aihot.news${src}`, dest);
      html = html.split(src).join(`./img-${i}`);
      html = html.split(src.replace(/&/g, "&amp;")).join(`./img-${i}`);
    } catch (error) {
      console.warn("img miss", src.slice(0, 80), error.message);
    }
  }
  writeFileSync(htmlPath, html);
  return resolve(htmlPath);
}

function labelPair(left, right, out, leftLabel, rightLabel) {
  if (!existsSync(join(outDir, left)) || !existsSync(join(outDir, right))) {
    console.warn("missing pair", left, right);
    return;
  }
  const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
  const dest = join(outDir, out);
  const esc = (text) => text.replace(/[:\\']/g, "\\$&");
  execFileSync("ffmpeg", [
    "-y",
    "-i",
    join(outDir, left),
    "-i",
    join(outDir, right),
    "-filter_complex",
    `[0:v]scale=880:620:force_original_aspect_ratio=decrease,pad=880:620:(ow-iw)/2:0:color=0xfaf9f6,pad=880:668:0:48:color=0x202020,drawtext=fontfile=${font}:text='${esc(leftLabel)}':fontcolor=0xfaf9f6:fontsize=18:x=14:y=14[l];[1:v]scale=880:620:force_original_aspect_ratio=decrease,pad=880:620:(ow-iw)/2:0:color=0xfaf9f6,pad=880:668:0:48:color=0x202020,drawtext=fontfile=${font}:text='${esc(rightLabel)}':fontcolor=0xfaf9f6:fontsize=18:x=14:y=14[r];[l][r]hstack=inputs=2`,
    dest,
  ], { stdio: "inherit" });
  console.log("wrote", dest);
  writeFileSync(join("preview/daily/refs", out), readFileSync(dest));
}

const base = `http://127.0.0.1:${port}/daily/`;

await withChrome(async (ws) => {
  await shot(ws, { url: base, width: 1280, height: 900, file: "daily-1280-lead-realimg.png" });
  await shot(ws, {
    url: base,
    width: 1280,
    height: 1600,
    file: "daily-1280-cards-realimg.png",
  });
  await shot(ws, {
    url: `${base}#c-muse-spark-open`,
    width: 1280,
    height: 900,
    file: "daily-1280-story-realimg.png",
    selector: "#c-muse-spark-open",
  });
  await shot(ws, {
    url: base,
    width: 390,
    height: 844,
    file: "daily-390-realimg.png",
  });
  await shot(ws, {
    url: base,
    width: 1280,
    height: 900,
    file: "ours-lead-card.png",
    clipSelector: ".ft-daily-lead.has-media",
  });
  await shot(ws, {
    url: `${base}#c-muse-spark-open`,
    width: 1280,
    height: 900,
    file: "ours-story-card.png",
    selector: "#c-muse-spark-open",
    clipSelector: "#c-muse-spark-open",
  });

  const aihotHotHtml = materializeAihot("https://aihot.news/hot", "/tmp/aihot-snap/hot");
  const aihotDailyHtml = materializeAihot("https://aihot.news/daily", "/tmp/aihot-snap/daily");
  await shot(ws, {
    url: `file://${aihotHotHtml}`,
    width: 1280,
    height: 900,
    file: "aihot-hot-top.png",
    waitMs: 2500,
  });
  await shot(ws, {
    url: `file://${aihotDailyHtml}`,
    width: 1280,
    height: 1100,
    file: "aihot-daily-top.png",
    waitMs: 2500,
  });
});

labelPair(
  "ours-lead-card.png",
  "aihot-hot-top.png",
  "layout-vs-aihot-hot.png",
  "OURS /daily/ lead - title+dek | figure in one card",
  "AIHOT /hot NO.01 - title+dek | cover in one card",
);
labelPair(
  "daily-1280-cards-realimg.png",
  "aihot-daily-top.png",
  "layout-vs-aihot-daily.png",
  "OURS /daily/ lead + image stories as split cards",
  "AIHOT daily - newspaper lead with dek | figure",
);
