/** Map live cards onto public title/digest. Ban internal editorial meta. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const digestPath = join(here, "..", "content", "l2-covers", "story-digest.json");
const FILENAME_ALT = /^(?:[\w./~:@%+-]+)\.(?:webp|png|jpe?g|gif|svg|avif)(?:\?.*)?$/i;
const URL_ALT = /^(?:https?:)?\/\/|^https?:\/\//i;

export const BANNED_PUBLIC_COPY =
  /权重跟踪|记交付|本批|六件套|低于门槛|\[低于门槛补位\]|补位|score=|闸分|闸\s*[AB]|资料是否齐全|本条材料未披露故|本条未覆盖|不进信号表|不进正表|不升档|趋势分析已定性|不碰训练配方|不进训练方法主线|挂主线|挂 RSI|挂观察|日常降为简讯|不当推理机/;
export const PUBLIC_COPY_SCAN_EXTS = new Set([".html", ".json", ".xml", ".md", ".svg", ".js"]);

let cached = null;

export function loadStoryDigest() {
  if (cached) return cached;
  cached = JSON.parse(readFileSync(digestPath, "utf8"));
  return cached;
}

function bannedCopyGlobal() {
  return new RegExp(BANNED_PUBLIC_COPY.source, `${BANNED_PUBLIC_COPY.flags.replace("g", "")}g`);
}

export function findBannedMeta(text) {
  const match = String(text || "").match(BANNED_PUBLIC_COPY);
  return match ? match[0] : null;
}

export function findAllBannedMeta(text) {
  return [...String(text || "").matchAll(bannedCopyGlobal())].map((match) => match[0]);
}

export function assertNoInternalMeta(text, label) {
  const hit = findBannedMeta(text);
  if (hit) throw new Error(`${label} contains internal meta «${hit}»`);
}

export function publicCopyFor(itemId, fallback = {}) {
  const table = loadStoryDigest().items || {};
  const row = table[itemId];
  if (!row) {
    throw new Error(`missing story-digest overlay for ${itemId}`);
  }
  const title = String(row.title || "").trim();
  const digest = String(row.digest || "").trim();
  const dailyAbstract = String(row.daily_abstract || digest.replace(/\n+/g, "")).trim();
  const latest = row.latest_progress == null || row.latest_progress === "" ? null : String(row.latest_progress).trim();
  if (!title || !digest) throw new Error(`story-digest ${itemId} missing title/digest`);
  assertNoInternalMeta(title, `${itemId}.title`);
  assertNoInternalMeta(digest, `${itemId}.digest`);
  assertNoInternalMeta(dailyAbstract, `${itemId}.daily_abstract`);
  if (latest) assertNoInternalMeta(latest, `${itemId}.latest_progress`);
  const alt = row.alt == null || row.alt === "" ? "" : String(row.alt).trim();
  if (alt) assertNoInternalMeta(alt, `${itemId}.alt`);
  return {
    title,
    digest,
    dailyAbstract,
    latest,
    alt,
    fallbackTitle: fallback.title || "",
  };
}

export function coverAltProblem(alt) {
  const text = String(alt ?? "").trim();
  if (!text) return "empty";
  if (URL_ALT.test(text) || /^data:/i.test(text)) return "url";
  if (FILENAME_ALT.test(text)) return "filename";
  return null;
}

export function assertCoverAlt(alt, label) {
  const problem = coverAltProblem(alt);
  if (problem) throw new Error(`${label} cover alt is ${problem}`);
}

export function coverEntries(generated) {
  const rows = [];
  for (const [i, entry] of (generated?.hotEntries || []).entries()) {
    rows.push([`hotEntries[${i}]/${entry.itemId || "?"}`, entry]);
  }
  if (generated?.daily) rows.push([`daily/${generated.daily.itemId || "?"}`, generated.daily]);
  return rows;
}

export function assertCoverRecords(generated) {
  for (const [label, entry] of coverEntries(generated)) {
    if (!entry?.coverOurs) continue;
    assertCoverAlt(entry.coverOurs.alt, label);
  }
}

export function applyCoverAlts(generated, table = loadStoryDigest()) {
  for (const [label, entry] of coverEntries(generated)) {
    if (!entry?.coverOurs) continue;
    const overlay = String(table.items?.[entry.itemId]?.alt || "").trim();
    if (overlay) entry.coverOurs.alt = overlay;
    assertCoverAlt(entry.coverOurs.alt, label);
  }
  return generated;
}

function stripHtml(html) {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function weeklyReportSurfaces(md, html) {
  const surfaces = [];
  if (md != null) surfaces.push({ kind: "md", text: String(md) });
  if (html != null) {
    const raw = String(html);
    for (const match of raw.matchAll(/\balt="([^"]*)"/g)) {
      surfaces.push({ kind: "img-alt", text: match[1] });
    }
    for (const match of raw.matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi)) {
      surfaces.push({ kind: "figcaption", text: stripHtml(match[1]) });
    }
    surfaces.push({ kind: "html-text", text: stripHtml(raw) });
  }
  return surfaces;
}

export function assertWeeklyReportCopy(md, html, label) {
  for (const surface of weeklyReportSurfaces(md, html)) {
    assertNoInternalMeta(surface.text, `${label} ${surface.kind}`);
  }
}

export function assertWeeklyReports(rootDir = join(here, "..")) {
  const weeklyDir = join(rootDir, "content", "weekly");
  if (!existsSync(weeklyDir)) return;
  for (const name of readdirSync(weeklyDir)) {
    const dir = join(weeklyDir, name);
    const mdPath = join(dir, "report.md");
    const htmlPath = join(dir, "report.html");
    const metaPath = join(dir, "meta.json");
    const timelinePath = join(dir, "timeline.md");
    if (!existsSync(mdPath) && !existsSync(htmlPath) && !existsSync(metaPath) && !existsSync(timelinePath)) continue;
    const md = existsSync(mdPath) ? readFileSync(mdPath, "utf8") : "";
    const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
    if (existsSync(mdPath) || existsSync(htmlPath)) {
      assertWeeklyReportCopy(md, html, `weekly/${name}`);
    }
    if (existsSync(timelinePath)) {
      assertNoInternalMeta(readFileSync(timelinePath, "utf8"), `content/weekly/${name}/timeline.md`);
    }
    if (existsSync(metaPath)) {
      assertWeeklyMetaCopy(readFileSync(metaPath, "utf8"), `content/weekly/${name}/meta.json`);
    }
  }
}

export function assertWeeklyMetaCopy(raw, label) {
  const text = String(raw ?? "");
  assertNoInternalMeta(text, label);
  try {
    const meta = JSON.parse(text);
    if (meta && typeof meta.summary === "string") {
      assertNoInternalMeta(meta.summary, `${label} summary`);
    }
  } catch (err) {
    if (err instanceof SyntaxError) return;
    throw err;
  }
}

export function walkPublicCopyFiles(rootDir, extensions = PUBLIC_COPY_SCAN_EXTS, acc = []) {
  if (!existsSync(rootDir)) return acc;
  for (const name of readdirSync(rootDir)) {
    const full = join(rootDir, name);
    if (statSync(full).isDirectory()) walkPublicCopyFiles(full, extensions, acc);
    else if (extensions.has(extname(name).toLowerCase())) acc.push(full);
  }
  return acc;
}

export function collectBannedPublicCopyHits(rootDir, { extensions = PUBLIC_COPY_SCAN_EXTS, prefix = "" } = {}) {
  const hits = [];
  for (const full of walkPublicCopyFiles(rootDir, extensions)) {
    const rel = `${prefix}${relative(rootDir, full).split("\\").join("/")}`;
    for (const word of findAllBannedMeta(readFileSync(full, "utf8"))) {
      hits.push({ file: rel, word });
    }
  }
  return hits;
}

export function assertNoBannedPublicCopyInDir(rootDir, options = {}) {
  const hits = collectBannedPublicCopyHits(rootDir, options);
  if (!hits.length) return hits;
  const lines = hits.map((hit) => `${hit.file} contains internal meta «${hit.word}»`);
  throw new Error(lines.join("\n"));
}

export function assertWeeklyMetaSources(rootDir = join(here, "..")) {
  const weeklyDir = join(rootDir, "content", "weekly");
  if (!existsSync(weeklyDir)) return;
  for (const name of readdirSync(weeklyDir)) {
    const metaPath = join(weeklyDir, name, "meta.json");
    if (!existsSync(metaPath)) continue;
    assertWeeklyMetaCopy(readFileSync(metaPath, "utf8"), `content/weekly/${name}/meta.json`);
  }
}

export function assertDistPublicCopy(distDir, options = {}) {
  return assertNoBannedPublicCopyInDir(distDir, { prefix: "dist/", ...options });
}

export function applyStoryDigest(generated, table = loadStoryDigest()) {
  const next = structuredClone(generated);
  for (const entry of next.hotEntries || []) {
    const copy = publicCopyFor(entry.itemId, entry);
    entry.title = copy.title;
    entry.summary = copy.digest;
    entry.latest = copy.latest;
  }
  if (next.daily?.itemId) {
    const copy = publicCopyFor(next.daily.itemId, next.daily);
    next.daily.title = copy.title;
    next.daily.leadParagraph = copy.dailyAbstract;
  }
  applyCoverAlts(next, table);
  const publicBlobs = [
    ...(next.hotEntries || []).flatMap((e) => [e.title, e.summary, e.latest, e.coverOurs?.alt]),
    next.daily?.title,
    next.daily?.leadParagraph,
    next.daily?.coverOurs?.alt,
  ];
  publicBlobs.forEach((text, i) => assertNoInternalMeta(text, `generated public field ${i}`));
  return next;
}
