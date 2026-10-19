import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.NODE_ENV = "production";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../preview/mit-static");
const tmpCss = path.join(here, ".tmp-css");
const tmpSsr = path.join(here, ".tmp-ssr");

await build({
  configFile: path.join(here, "vite.config.ts"),
  root: here,
  logLevel: "error",
  build: {
    outDir: tmpCss,
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.join(here, "src/css.ts"),
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: "assets/[name].js",
      },
    },
  },
});

const cssFile = fs.readdirSync(path.join(tmpCss, "assets")).find((f) => f.endsWith(".css"));
if (!cssFile) throw new Error("tailwind css was not emitted");

fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
fs.copyFileSync(path.join(tmpCss, "assets", cssFile), path.join(outDir, "assets", "app.css"));

const plates = path.resolve(here, "../../vendor/mit/site/brand/nameplates");
const plateOut = path.join(outDir, "assets", "nameplates");
fs.mkdirSync(plateOut, { recursive: true });
for (const f of fs.readdirSync(plates)) {
  if (f.endsWith(".svg")) fs.copyFileSync(path.join(plates, f), path.join(plateOut, f));
}

await build({
  configFile: path.join(here, "vite.config.ts"),
  root: here,
  logLevel: "error",
  build: {
    outDir: tmpSsr,
    emptyOutDir: true,
    ssr: path.join(here, "src/prerender.tsx"),
    rollupOptions: {
      output: { format: "es", entryFileNames: "prerender.js" },
    },
  },
  ssr: { noExternal: true },
});

function rewriteMitHtml(html) {
  return html
    .replaceAll(/\/assets\/[^"'\s]+\.svg/g, (m) => `assets/nameplates/${path.basename(m)}`)
    .replaceAll(/assets\/nameplates\/(daily|weekly|monthly|archive)-[A-Za-z0-9]+\.svg/g, "assets/nameplates/$1.svg")
    .replaceAll(/assets\/[^"'\s]+\/([^/"'\s]+\.svg)/g, "assets/nameplates/$1")
    .replaceAll(/assets\/nameplates\/(daily|weekly|monthly|archive)-[A-Za-z0-9]+\.svg/g, "assets/nameplates/$1.svg");
}

const mod = await import(pathToFileURL(path.join(tmpSsr, "prerender.js")).href);
for (const page of mod.pages) {
  const html = rewriteMitHtml(mod.renderPage(page.node, page.title, "assets/app.css"));
  fs.writeFileSync(path.join(outDir, page.file), html);
  console.log("wrote", page.file, html.length);
}

const compareDir = path.resolve(here, "../../preview/l2-realimg/compare");
fs.mkdirSync(compareDir, { recursive: true });
const comparePrefix = "../../mit-static/";
function toCompare(html) {
  return html.replace(/(href|src|srcSet|imageSrcSet)="([^"]*)"/g, (match, attr, val) => {
    if (!/(^|,\s*)(?:assets|data)\//.test(val)) return match;
    return `${attr}="${val.replace(/(^|,\s*)((?:assets|data)\/)/g, `$1${comparePrefix}$2`)}"`;
  });
}
for (const stale of ["source-hot.html", "source-daily.html"]) {
  const stalePath = path.join(compareDir, stale);
  if (fs.existsSync(stalePath)) fs.rmSync(stalePath);
}
fs.writeFileSync(path.join(compareDir, "ours-hot.html"), toCompare(fs.readFileSync(path.join(outDir, "hot.html"), "utf8")));
fs.writeFileSync(path.join(compareDir, "ours-daily.html"), toCompare(fs.readFileSync(path.join(outDir, "daily.html"), "utf8")));
fs.writeFileSync(
  path.join(compareDir, "index.html"),
  `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>L2 ours pages</title>
<style>
  body{font:15px/1.5 ui-sans-serif,system-ui;margin:24px;color:#111}
  a{color:#0b57d0}
  li{margin:6px 0}
</style>
</head>
<body>
<h1>L2 配图（ours）</h1>
<p>本目录只有我们站点的静态页副本，不是 aihot.news 源站渲染。</p>
<ul>
  <li><a href="ours-hot.html">ours /hot/</a></li>
  <li><a href="ours-daily.html">ours /daily/ 头条</a></li>
</ul>
</body>
</html>
`,
);
console.log("wrote compare ours pages");

fs.rmSync(tmpCss, { recursive: true, force: true });
fs.rmSync(tmpSsr, { recursive: true, force: true });
