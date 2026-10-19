/** Headless Chrome shots for v5 with-cover and empty-cover states. */
import { mkdirSync, unlinkSync, createReadStream, existsSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.SHOT_PORT || 4177);
const chrome = process.env.CHROME || "google-chrome";
const outDir = join(root, "preview", "l2-covers");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function serve(dir) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      if (pathname.endsWith("/")) pathname += "index.html";
      const candidate = normalize(join(dir, pathname.replace(/^\/+/, "")));
      if (!candidate.startsWith(dir + sep) && candidate !== dir) {
        res.writeHead(403);
        res.end("forbidden");
        return;
      }
      let file = candidate;
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
      createReadStream(file).pipe(res);
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function shot(url, out, width, height = 2200) {
  return new Promise((resolve, reject) => {
    try {
      if (existsSync(out)) unlinkSync(out);
    } catch {
      /* ignore */
    }
    const args = [
      "20",
      chrome,
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-sandbox",
      "--force-device-scale-factor=1",
      "--run-all-compositor-stages-before-draw",
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      "--virtual-time-budget=12000",
      url,
    ];
    const child = spawn("timeout", args, { stdio: "ignore" });
    child.on("exit", () => {
      if (existsSync(out) && statSync(out).size > 1024) resolve();
      else reject(new Error(`chrome failed ${url} -> ${out}`));
    });
  });
}

mkdirSync(outDir, { recursive: true });
const server = await serve(root);
const prefix = `http://127.0.0.1:${port}`;
const jobs = [
  ["preview/mit-static/hot.html", "hot-1280-cover.png", 1280, 2200],
  ["preview/mit-static/hot-empty.html", "hot-1280-empty.png", 1280, 2200],
  ["preview/mit-static/daily.html", "daily-1280-cover.png", 1280, 2600],
  ["preview/mit-static/daily-empty.html", "daily-1280-empty.png", 1280, 2600],
  ["preview/mit-static/hot.html", "hot-390.png", 390, 2600],
  ["preview/mit-static/daily.html", "daily-390.png", 390, 3200],
];

try {
  for (const [rel, name, width, height] of jobs) {
    const dest = join(outDir, name);
    await shot(`${prefix}/${rel}`, dest, width, height);
    console.log("shot", name, statSync(dest).size);
  }
} finally {
  server.close();
}

console.log("shots written under preview/l2-covers/");
