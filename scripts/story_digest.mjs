/** Map live cards onto public title/digest. Ban internal editorial meta. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const digestPath = join(here, "..", "content", "l2-covers", "story-digest.json");

export const BANNED_PUBLIC_COPY =
  /权重跟踪|记交付|本批|六件套|低于门槛|\[低于门槛补位\]|补位|score=|闸分|闸\s*[AB]|资料是否齐全|本条材料未披露故|不进信号表|不升档|趋势分析已定性|不碰训练配方|不进训练方法主线|挂主线|挂 RSI|日常降为简讯|不当推理机/;

let cached = null;

export function loadStoryDigest() {
  if (cached) return cached;
  cached = JSON.parse(readFileSync(digestPath, "utf8"));
  return cached;
}

export function findBannedMeta(text) {
  const match = String(text || "").match(BANNED_PUBLIC_COPY);
  return match ? match[0] : null;
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
  return {
    title,
    digest,
    dailyAbstract,
    latest,
    fallbackTitle: fallback.title || "",
  };
}

export function applyStoryDigest(generated) {
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
  const publicBlobs = [
    ...(next.hotEntries || []).flatMap((e) => [e.title, e.summary, e.latest]),
    next.daily?.title,
    next.daily?.leadParagraph,
  ];
  publicBlobs.forEach((text, i) => assertNoInternalMeta(text, `generated public field ${i}`));
  return next;
}
