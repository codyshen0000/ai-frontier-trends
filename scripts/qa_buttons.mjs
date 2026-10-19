/** Playwright: getByRole exact names for Remaining-A controls. */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const preview = join(root, "preview", "remaining-a");
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

async function expectButton(page, name) {
  const btn = page.getByRole("button", { name, exact: true });
  const count = await btn.count();
  if (count < 1) throw new Error(`missing button «${name}»`);
  await btn.first().waitFor({ state: "visible" });
  return btn.first();
}

const { server, port } = await serve(preview);
const browser = await chromium.launch({ headless: true });
let failed = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "networkidle" });
  for (const name of ["深色", "跟随系统", "浅色", "筛选", "搜索", "回到顶部"]) {
    try {
      await expectButton(page, name);
      console.log(`ok   home button ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL home button ${name}: ${err.message}`);
    }
  }
  const top = page.getByRole("button", { name: "回到顶部", exact: true }).first();
  await page.evaluate(() => window.scrollTo(0, 600));
  await top.click();
  const y = await page.evaluate(() => window.scrollY);
  if (y > 8) {
    failed += 1;
    console.error(`FAIL home 回到顶部 did not scroll (y=${y})`);
  } else console.log("ok   home 回到顶部 scrolls to top");

  await page.goto(`http://127.0.0.1:${port}/daily.html`, { waitUntil: "networkidle" });
  try {
    const toc = await expectButton(page, "本期目录");
    await toc.click();
    const open = await page.locator("[data-ft-outline]").first().isVisible();
    if (!open) throw new Error("outline stayed closed");
    console.log("ok   daily 本期目录 opens");
  } catch (err) {
    failed += 1;
    console.error(`FAIL daily 本期目录: ${err.message}`);
  }
  for (const name of ["深色", "跟随系统", "浅色", "回到顶部"]) {
    try {
      await expectButton(page, name);
      console.log(`ok   daily button ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL daily button ${name}: ${err.message}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (failed) {
  console.error(`\n${failed} button check(s) failed`);
  process.exit(1);
}
console.log("\nqa_buttons passed");
