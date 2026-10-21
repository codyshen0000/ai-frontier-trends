import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { copyAvatarCache } from "../avatar_icons.mjs";
import { resolveAndWriteGeneratedSite } from "../engine/write_generated.mjs";

process.env.NODE_ENV = "production";

const here = path.dirname(fileURLToPath(import.meta.url));
const engineSiteFile = path.join(here, ".engine-site.json");
const { resolved: engineResolved, site: engineSite } = resolveAndWriteGeneratedSite(engineSiteFile);
if (engineResolved.warning) console.warn("[engine]", engineResolved.warning);
console.log("engine", engineResolved.source, "cards", engineSite.timeline.cards.length, "hot", engineSite.hot.entries.length);

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
copyAvatarCache(outDir);

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

for (const name of ["hydrate", "search"]) {
  const dest = path.join(tmpCss, `client-${name}`);
  await build({
    configFile: path.join(here, "vite.config.ts"),
    root: here,
    logLevel: "error",
    build: {
      outDir: dest,
      emptyOutDir: true,
      minify: true,
      lib: {
        entry: path.join(here, `src/client/${name}.ts`),
        name: name === "search" ? "FTSearch" : "FTHydrate",
        formats: ["iife"],
        fileName: () => `${name}.js`,
      },
    },
  });
  fs.copyFileSync(path.join(dest, `${name}.js`), path.join(outDir, "assets", `${name}.js`));
}

const { exportStatic } = await import("../static_export.mjs");
const builtAt = new Date().toISOString();
const exported = await exportStatic({
  distDir: outDir,
  contentDir: path.resolve(here, "../../content"),
  dataset: process.env.FT_DATASET || "",
  dataAsOf: engineSite.data_as_of || undefined,
  builtAt,
  engine: engineResolved.bundle,
  site: engineSite,
});

const hasTimeline = exported.dataset === "test-paging" || engineSite.timeline.cards.length > 0;
const mod = await import(pathToFileURL(path.join(tmpSsr, "prerender.js")).href);
for (const page of mod.pages) {
  const html = rewriteMitHtml(mod.renderPage(page.node, page.title, "assets/app.css", {
    page: page.page,
    hasTimeline,
    hydrateHref: "assets/hydrate.js",
    weeklyRss: "feed/weekly.xml",
    selectedRss: engineSite.hasSelectedFeed ? "feed.xml" : "",
    dataAsOf: engineSite.data_as_of,
    builtAt: engineSite.built_at || builtAt,
    base: "./",
  }));
  fs.writeFileSync(path.join(outDir, page.file), html);
  console.log("wrote", page.file, html.length);
}

const compareDir = path.resolve(here, "../../preview/l2-covers");
fs.mkdirSync(compareDir, { recursive: true });
const comparePrefix = "../mit-static/";
function toCompare(html) {
  return html.replace(/(href|src|srcSet|imageSrcSet)="([^"]*)"/g, (match, attr, val) => {
    if (!/(^|,\s*)(?:assets|data)\//.test(val)) return match;
    return `${attr}="${val.replace(/(^|,\s*)((?:assets|data)\/)/g, `$1${comparePrefix}$2`)}"`;
  });
}
fs.writeFileSync(path.join(compareDir, "ours-hot.html"), toCompare(fs.readFileSync(path.join(outDir, "hot.html"), "utf8")));
fs.writeFileSync(path.join(compareDir, "ours-daily.html"), toCompare(fs.readFileSync(path.join(outDir, "daily.html"), "utf8")));
fs.writeFileSync(path.join(compareDir, "ours-hot-empty.html"), toCompare(fs.readFileSync(path.join(outDir, "hot-empty.html"), "utf8")));
fs.writeFileSync(path.join(compareDir, "ours-daily-empty.html"), toCompare(fs.readFileSync(path.join(outDir, "daily-empty.html"), "utf8")));
fs.writeFileSync(
  path.join(compareDir, "index.html"),
  `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>L2 有用才放 · ours</title>
<style>
  body{font:15px/1.55 ui-sans-serif,system-ui;margin:24px;color:#111;max-width:42em}
  a{color:#0b57d0}
  li{margin:6px 0}
</style>
</head>
<body>
<h1>L2 封面 v5（ours）</h1>
<p>有用才放，没有就不放。本目录只有我们站点的静态页副本。</p>
<ul>
  <li><a href="ours-hot.html">/hot/ NO.01（价值门后的真实槽）</a></li>
  <li><a href="ours-hot-empty.html">/hot/ 无图样例（同一壳，封面置空）</a></li>
  <li><a href="ours-daily.html">/daily/ 头条（价值门后的真实槽）</a></li>
  <li><a href="ours-daily-empty.html">/daily/ 无图样例</a></li>
  <li><a href="CLASSIFICATION.md">分类表</a></li>
</ul>
</body>
</html>
`,
);
console.log("wrote preview/l2-covers ours pages");

fs.rmSync(tmpCss, { recursive: true, force: true });
fs.rmSync(tmpSsr, { recursive: true, force: true });
