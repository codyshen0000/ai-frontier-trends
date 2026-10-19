/** 375-wide figure crops for weekly charts after the WebP change. */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outDir = join(root, "preview", "remaining-a", "lighthouse", "charts");
mkdirSync(outDir, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
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

const pages = [
  { date: "2026-10-18", names: ["evidence-by-line", "signal-candidates", "weights-delivery"] },
  { date: "2026-10-12", names: ["evidence-by-line", "signal-candidates", "semi-opd-overlap"] },
];

const { server, port } = await serve(join(root, "dist"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 812, deviceScaleFactor: 2 } });

try {
  for (const issue of pages) {
    await page.goto(`http://127.0.0.1:${port}/weekly/${issue.date}/`, { waitUntil: "networkidle" });
    const figures = page.locator("figure");
    const count = await figures.count();
    if (count !== issue.names.length) {
      throw new Error(`${issue.date}: expected ${issue.names.length} figures, got ${count}`);
    }
    for (let i = 0; i < count; i++) {
      const fig = figures.nth(i);
      const alt = await fig.locator("img").getAttribute("alt");
      const src = await fig.locator("img").evaluate((img) => img.currentSrc || img.src);
      await fig.scrollIntoViewIfNeeded();
      const dest = join(outDir, `${issue.date}-${issue.names[i]}-375.png`);
      await fig.screenshot({ path: dest });
      console.log(issue.date, issue.names[i], "alt=", alt, "src=", src, "->", dest);
    }
  }
} finally {
  await browser.close();
  server.close();
}
