import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 4173);
const basePath = (process.env.SITE_BASE || "").replace(/\/$/, "");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function resolvePath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    pathname = pathname.slice(basePath.length) || "/";
  }
  if (pathname.endsWith("/")) pathname += "index.html";
  const candidate = normalize(join(root, pathname.replace(/^\/+/, "")));
  if (!candidate.startsWith(root + sep) && candidate !== root) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const asIndex = join(candidate, "index.html");
  if (existsSync(asIndex) && statSync(asIndex).isFile()) return asIndex;
  return null;
}

const server = createServer((req, res) => {
  if (basePath && (req.url === "/" || req.url === "")) {
    res.writeHead(302, { Location: `${basePath}/` });
    res.end();
    return;
  }

  const filePath = resolvePath(req.url || "/");
  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  const url = basePath ? `http://127.0.0.1:${port}${basePath}/` : `http://127.0.0.1:${port}/`;
  console.log(`Preview ${url}`);
});
