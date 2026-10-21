#!/usr/bin/env node
/** Copy MIT prerender into preview/engine-v1/standalone with inlined CSS for htmlpreview. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "preview", "mit-static");
const dest = join(root, "preview", "engine-v1", "standalone");
const cssPath = join(src, "assets", "app.css");
if (!existsSync(join(src, "index.html")) || !existsSync(cssPath)) {
  throw new Error("run mit-static prerender first");
}
const css = readFileSync(cssPath, "utf8");
mkdirSync(dest, { recursive: true });
if (existsSync(dest)) {
  for (const name of readdirSync(dest)) {
    if ((name.startsWith("item-") || name.startsWith("event-") || name === "item.html" || name === "event.html") && name.endsWith(".html")) {
      unlinkSync(join(dest, name));
    }
  }
}

const keep = new Set([
  "index.html",
  "all.html",
  "topics.html",
  "hot.html",
  "daily.html",
  "daily-archive.html",
  "weekly.html",
  "monthly.html",
  "search.html",
  "starred.html",
  "more.html",
]);

function inline(html) {
  let out = html.replace(
    /<link rel="stylesheet" href="assets\/app\.css"\s*\/?>/,
    `<style>${css}</style><!-- engine-v1 preview standalone; not production -->`,
  );
  // htmlpreview has no timeline JSON; keep the prerendered cards.
  out = out.replace(/<script src="assets\/hydrate\.js"[^>]*><\/script>\s*/g, "");
  if (!out.includes("engine-v1 preview standalone")) {
    out = out.replace("</title>", "</title>\n<!-- engine-v1 preview standalone; not production -->");
  }
  return out;
}

for (const name of readdirSync(src)) {
  if (!name.endsWith(".html")) continue;
  if (keep.has(name) || name.startsWith("item-") || name.startsWith("event-")) {
    writeFileSync(join(dest, name), inline(readFileSync(join(src, name), "utf8")));
  }
}

function sampleNames() {
  const engine = join(root, "data", "engine", "v1");
  let itemName = null;
  let eventName = null;
  try {
    const page = JSON.parse(readFileSync(join(engine, "timeline", "page-1.json"), "utf8"));
    const first = page.cards?.[0]?.item;
    const itemFile = first?.id ? `item-${String(first.id).replaceAll(":", "-")}.html` : null;
    const eventFile = first?.storyPublicId ? `event-${String(first.storyPublicId).replaceAll(":", "-")}.html` : null;
    if (itemFile && existsSync(join(src, itemFile))) itemName = itemFile;
    if (eventFile && existsSync(join(src, eventFile))) eventName = eventFile;
  } catch {
    /* fall through */
  }
  const items = readdirSync(src).filter((n) => n.startsWith("item-") && n.endsWith(".html")).sort();
  const events = readdirSync(src).filter((n) => n.startsWith("event-") && n.endsWith(".html")).sort();
  return { item: itemName || items[0], event: eventName || events[0] };
}
const samples = sampleNames();
if (samples.item) writeFileSync(join(dest, "item.html"), inline(readFileSync(join(src, samples.item), "utf8")));
if (samples.event) writeFileSync(join(dest, "event.html"), inline(readFileSync(join(src, samples.event), "utf8")));

const timeline = join(root, "preview", "engine-v1", "standalone", "timeline.html");
void timeline;

const assetsSrc = join(src, "assets");
const assetsDest = join(dest, "assets");
if (existsSync(assetsSrc)) {
  mkdirSync(assetsDest, { recursive: true });
  for (const extra of ["search.js", "favicon.svg", "favicon.png"]) {
    const from = join(assetsSrc, extra);
    if (existsSync(from)) cpSync(from, join(assetsDest, extra));
  }
  const plates = join(assetsSrc, "nameplates");
  if (existsSync(plates)) cpSync(plates, join(assetsDest, "nameplates"), { recursive: true });
}

console.log("standalone", dest, "html", readdirSync(dest).filter((n) => n.endsWith(".html")).length);
