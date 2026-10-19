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

const mod = await import(pathToFileURL(path.join(tmpSsr, "prerender.js")).href);
for (const page of mod.pages) {
  let html = mod.renderPage(page.node, page.title, "assets/app.css");
  html = html.replaceAll(/\/assets\/[^"'\s]+\.svg/g, (m) => `assets/nameplates/${path.basename(m)}`);
  html = html.replaceAll(/assets\/nameplates\/(daily|weekly|monthly|archive)-[A-Za-z0-9]+\.svg/g, "assets/nameplates/$1.svg");
  html = html.replaceAll(/assets\/[^"'\s]+\/([^/"'\s]+\.svg)/g, "assets/nameplates/$1");
  html = html.replaceAll(/assets\/nameplates\/(daily|weekly|monthly|archive)-[A-Za-z0-9]+\.svg/g, "assets/nameplates/$1.svg");
  fs.writeFileSync(path.join(outDir, page.file), html);
  console.log("wrote", page.file, html.length);
}

fs.rmSync(tmpCss, { recursive: true, force: true });
fs.rmSync(tmpSsr, { recursive: true, force: true });
