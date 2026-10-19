/** Serve a dist directory under /ai-frontier-trends/. */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";

const root = normalize(process.argv[2] || join(process.cwd(), "dist"));
const port = Number(process.argv[3] || process.env.PORT || 8261);
const basePath = "/ai-frontier-trends";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function resolvePath(urlPath) {
  let pathname = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (pathname === basePath || pathname.startsWith(`${basePath}/`)) {
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
  if (req.url === "/" || req.url === "") {
    res.writeHead(302, { Location: `${basePath}/` });
    res.end();
    return;
  }
  const filePath = resolvePath(req.url);
  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview http://127.0.0.1:${port}${basePath}/  root=${root}`);
});
