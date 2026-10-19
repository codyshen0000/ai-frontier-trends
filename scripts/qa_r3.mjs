/** R-3: before/after button clicks, JS on and off. Saves preview/remaining-a/r3/. */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outDir = join(root, "preview", "remaining-a", "r3");
const afterDir = join(root, "preview", "remaining-a");
const beforeDir = join(root, ".tmp-r3-8b09f25");
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

function extractBefore() {
  mkdirSync(beforeDir, { recursive: true });
  execSync(`git archive 8b09f25 preview/remaining-a | tar -x --strip-components=2 -C ${beforeDir}`, { cwd: root });
}

function inventoryDaily(dir, label) {
  const file = join(dir, "daily.html");
  const html = readFileSync(file, "utf8");
  const rows = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = ((m[1].match(/\bhref="([^"]*)"/i) || [])[1] || "");
    if (!/(^|\/)index\.html(\?|#|$)/.test(href) && href !== "./" && href !== ".") continue;
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const real = /前沿趋势|精选|首页/.test(text);
    rows.push({ page: "daily.html", text, href, resolved: href, kind: real ? "real-nav" : "review", label });
  }
  return rows;
}

async function shot(page, name) {
  const dest = join(outDir, `${name}.png`);
  await page.screenshot({ path: dest, fullPage: false });
  return dest;
}

async function runSuite(browser, dir, tag, javaScriptEnabled) {
  const { server, port } = await serve(dir);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    javaScriptEnabled,
  });
  const page = await context.newPage();
  const js = javaScriptEnabled ? "json" : "jsoff";
  const log = [];
  try {
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: javaScriptEnabled ? "networkidle" : "domcontentloaded" });
    await shot(page, `${tag}-home-1280-${js}-before`);
    for (const name of ["深色", "跟随系统", "浅色", "筛选", "搜索", "回到顶部"]) {
      const btn = page.getByRole("button", { name, exact: true });
      const n = await btn.count();
      let after = "missing";
      if (n) {
        const first = btn.first();
        const visible = await first.isVisible().catch(() => false);
        if (visible && javaScriptEnabled) {
          if (name === "回到顶部") await page.evaluate(() => window.scrollTo(0, 800));
          await first.click({ timeout: 2000 }).catch(() => {});
          if (name === "回到顶部") {
            const y = await page.evaluate(() => window.scrollY);
            after = y <= 8 ? "scrolled-top" : `y=${y}`;
          } else if (name === "深色" || name === "浅色" || name === "跟随系统") {
            after = await page.evaluate(() => document.documentElement.getAttribute("data-theme") || "");
          } else if (name === "筛选") {
            after = await page.locator("[data-ft-filter-sheet]").first().isVisible().catch(() => false) ? "sheet-open" : "clicked";
          } else if (name === "搜索") {
            after = await page.locator("#ft-search-layer, #ft-search-mobile").first().isVisible().catch(() => false) ? "search-open" : "clicked";
          }
        } else after = visible ? "visible-nojs" : "not-visible";
      }
      log.push({ tag, page: "home", button: name, js: javaScriptEnabled, after });
    }
    await shot(page, `${tag}-home-1280-${js}-after`);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: javaScriptEnabled ? "networkidle" : "domcontentloaded" });
    await shot(page, `${tag}-home-375-${js}-before`);
    for (const name of ["筛选", "搜索"]) {
      const btn = page.getByRole("button", { name, exact: true });
      if (await btn.count()) await btn.first().click({ timeout: 2000 }).catch(() => {});
    }
    await shot(page, `${tag}-home-375-${js}-after`);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${port}/daily.html`, { waitUntil: javaScriptEnabled ? "networkidle" : "domcontentloaded" });
    await shot(page, `${tag}-daily-1280-${js}-before`);
    const toc = page.getByRole("button", { name: "本期目录", exact: true });
    let tocAfter = "missing";
    if (await toc.count()) {
      await toc.first().click({ timeout: 2000 }).catch(() => {});
      tocAfter = await page.locator("[data-ft-outline]").first().isVisible().catch(() => false) ? "open" : "clicked";
    }
    log.push({ tag, page: "daily", button: "本期目录", js: javaScriptEnabled, after: tocAfter });
    await shot(page, `${tag}-daily-1280-${js}-after`);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`http://127.0.0.1:${port}/daily.html`, { waitUntil: javaScriptEnabled ? "networkidle" : "domcontentloaded" });
    await shot(page, `${tag}-daily-375-${js}-before`);
    const tocM = page.getByRole("button", { name: "本期目录", exact: true });
    if (await tocM.count()) await tocM.first().click({ timeout: 2000 }).catch(() => {});
    await shot(page, `${tag}-daily-375-${js}-after`);
  } finally {
    await context.close();
    server.close();
  }
  return log;
}

extractBefore();
const browser = await chromium.launch({ headless: true });
const log = [];
try {
  log.push(...await runSuite(browser, beforeDir, "before-8b09f25", true));
  log.push(...await runSuite(browser, beforeDir, "before-8b09f25", false));
  log.push(...await runSuite(browser, afterDir, "after", true));
  log.push(...await runSuite(browser, afterDir, "after", false));
} finally {
  await browser.close();
}

const inventory = [
  ...inventoryDaily(beforeDir, "8b09f25"),
  ...inventoryDaily(afterDir, "after"),
];
writeFileSync(join(outDir, "clicks.json"), JSON.stringify(log, null, 2));
writeFileSync(join(outDir, "daily-index-links.json"), JSON.stringify(inventory, null, 2));
writeFileSync(join(outDir, "README.md"), `# R-3 点击前后（8b09f25 vs tip）

- JS on / JS off
- 1280 与 375
- 按钮：深色 / 跟随系统 / 浅色 / 本期目录 / 筛选 / 搜索 / 回到顶部

见 \`clicks.json\` 与同目录 PNG。

## daily.html → index.html

${inventory.filter((r) => r.label === "after").map((r) => `- 「${r.text || "(logo)"}」 \`${r.href}\` · ${r.kind === "real-nav" ? "真实导航（logo/精选）" : "需复核"}`).join("\n")}
`);
console.log("r3 wrote", outDir, "events", log.length);
