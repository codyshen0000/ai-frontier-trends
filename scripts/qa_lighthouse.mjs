/** Lighthouse median: current dist vs live main@1ff0e9e. */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outDir = join(root, "preview", "remaining-a", "lighthouse");
mkdirSync(outDir, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function serve(dir) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = join(dir, url === "/" ? "index.html" : url.replace(/^\//, ""));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

function median(nums) {
  const a = nums.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function runLh(url, formFactor, outBase) {
  const extra = formFactor === "mobile"
    ? ["--form-factor=mobile", "--screenEmulation.mobile=true", "--screenEmulation.width=375", "--screenEmulation.height=667", "--screenEmulation.deviceScaleFactor=2"]
    : ["--preset=desktop", "--form-factor=desktop", "--screenEmulation.mobile=false", "--screenEmulation.width=1350", "--screenEmulation.height=940", "--screenEmulation.deviceScaleFactor=1"];
  return new Promise((resolve, reject) => {
    const args = [
      "lighthouse", url,
      "--quiet",
      "--chrome-flags=--headless --no-sandbox --disable-gpu",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      "--output=html",
      `--output-path=${outBase}`,
      ...extra,
    ];
    const child = spawn("npx", ["--yes", ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => { err += d; });
    child.on("exit", (code) => {
      if (code !== 0) reject(new Error(err || `lighthouse ${code}`));
      else resolve(JSON.parse(readFileSync(`${outBase}.report.json`, "utf8")));
    });
  });
}

function pick(lhr) {
  const a = lhr.audits || {};
  return {
    performance: Math.round((lhr.categories.performance?.score || 0) * 100),
    accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((lhr.categories["best-practices"]?.score || 0) * 100),
    seo: Math.round((lhr.categories.seo?.score || 0) * 100),
    lcp: a["largest-contentful-paint"]?.numericValue || 0,
    cls: a["cumulative-layout-shift"]?.numericValue || 0,
    tbt: a["total-blocking-time"]?.numericValue || 0,
    bytes: a["total-byte-weight"]?.numericValue || 0,
  };
}

const pages = [
  { id: "home", path: "/" },
  { id: "weekly", path: "/weekly/" },
  { id: "timeline", path: "/timeline/" },
  { id: "event", path: "/weekly/2026-10-18/" },
];

const LIVE = "https://codyshen0000.github.io/ai-frontier-trends";
const head = await serve(join(root, "dist"));
const results = [];

async function measure(label, url, page, form) {
  const runs = [];
  for (let i = 1; i <= 3; i++) {
    const outBase = join(outDir, `${label}-${page.id}-${form}-run${i}`);
    const lhr = await runLh(url, form, outBase);
    runs.push(pick(lhr));
    console.log(label, page.id, form, i, runs[runs.length - 1]);
  }
  const keys = Object.keys(runs[0]);
  const med = Object.fromEntries(keys.map((k) => [k, median(runs.map((r) => r[k]))]));
  const mid = runs
    .map((r, i) => ({ i, d: Math.abs(r.performance - med.performance) }))
    .sort((a, b) => a.d - b.d)[0].i;
  results.push({ label, page: page.id, form, url, runs, median: med, medianRun: mid + 1 });
}

try {
  for (const page of pages) {
    for (const form of ["mobile", "desktop"]) {
      await measure("head", `http://127.0.0.1:${head.port}${page.path}`, page, form);
      await measure("base", `${LIVE}${page.path}`, page, form);
    }
  }
} finally {
  head.server.close();
}

writeFileSync(join(outDir, "median.json"), JSON.stringify(results, null, 2));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
for (const row of results) {
  const html = join(outDir, `${row.label}-${row.page}-${row.form}-run${row.medianRun}.report.html`);
  if (!existsSync(html)) continue;
  await page.goto(`file://${html}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, `${row.label}-${row.page}-${row.form}-median.png`), fullPage: false });
}
await browser.close();
console.log("lighthouse wrote", join(outDir, "median.json"), results.length);
