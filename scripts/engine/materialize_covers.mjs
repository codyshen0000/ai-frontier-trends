/**
 * Build-time daily cover materialization.
 * Value gate first (cover_rules), then download → sharp → assets/covers/<id>-{720,1200,1600}.webp.
 * publicCover only accepts the same-origin result. Empty slot if nothing qualifies — never hotlink.
 */
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { leadCover } from "../cover_rules.mjs";
import { emitRenditions, extractArticle, fetchBinary, loadSharp } from "../l2_covers.mjs";
import { isAcceptedCoverClass } from "./loader.mjs";
import { coverAltProblem } from "../story_digest.mjs";

const SAME_ORIGIN = "assets/covers/";

export function isSameOriginCover(cover) {
  return Boolean(cover?.url && String(cover.url).startsWith(SAME_ORIGIN));
}

export function isRemoteCover(cover) {
  return Boolean(cover?.url && /^https?:\/\//i.test(String(cover.url)));
}

export function leadCitation(report) {
  if (!report || typeof report !== "object") return null;
  const rows = [
    ...(report.highlights || []),
    ...(report.sections || []).flatMap((section) => section.items || []),
  ];
  if (report.leadItemId) {
    const hit = rows.find((row) => row?.itemId === report.leadItemId);
    if (hit) return hit;
  }
  return rows.find((row) => row?.sourceUrl) || rows[0] || null;
}

export function publicationsFromDaily(report, fetched = null) {
  const pubs = [];
  const cite = leadCitation(report);
  const title = report.lead?.title || cite?.title || report.title || "";
  const summary = report.lead?.leadParagraph || cite?.summary || "";
  const pageUrl = cite?.sourceUrl || fetched?.finalUrl || fetched?.url || "";
  const cover = report.cover;
  const media = [];
  if (isRemoteCover(cover)) {
    media.push({
      kind: "image",
      url: cover.url,
      width: typeof cover.width === "number" ? cover.width : null,
      height: typeof cover.height === "number" ? cover.height : null,
      alt: cover.alt || "",
    });
  }
  if (fetched?.media?.length) {
    for (const item of fetched.media) {
      if (!item?.url) continue;
      if (media.some((row) => row.url === item.url)) continue;
      media.push(item.kind ? item : { kind: "image", ...item });
    }
  }
  if (!media.length && !fetched) return pubs;
  pubs.push({
    articleId: report.leadItemId || cite?.itemId || "daily-lead",
    firstParty: Boolean(cite?.firstParty),
    selected: true,
    score: 1,
    listed: true,
    bodyMode: fetched?.bodyMode || "full",
    url: pageUrl,
    ogImage: fetched?.ogImage || null,
    title,
    summary,
    media,
  });
  return pubs;
}

function coverAltFor(report, picked) {
  const candidates = [
    picked?.cover?.alt,
    report.cover?.alt,
    report.lead?.title && `${report.lead.title} 配图`,
    report.title && `${report.title} 配图`,
  ];
  for (const alt of candidates) {
    const text = String(alt || "").trim();
    if (text && !coverAltProblem(text)) return text;
  }
  return "日报头条配图";
}

/** Low-edge geometric / color-block heroes (Voxtral-class). Empty slot beats decor. */
export async function isDecorativeHero(buf, sharp) {
  if (!buf || !sharp) return false;
  let data;
  let info;
  try {
    const raw = await sharp(buf, { failOn: "none" })
      .resize(96, 96, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    data = raw.data;
    info = raw.info;
  } catch {
    return false;
  }
  const w = info.width;
  const h = info.height;
  if (w < 8 || h < 8) return false;
  const luma = (x, y) => {
    const i = (y * w + x) * 3;
    return data[i] + data[i + 1] + data[i + 2];
  };
  let edges = 0;
  for (let y = 0; y < h - 1; y += 1) {
    for (let x = 0; x < w - 1; x += 1) {
      if (Math.abs(luma(x, y) - luma(x + 1, y)) > 36 || Math.abs(luma(x, y) - luma(x, y + 1)) > 36) {
        edges += 1;
      }
    }
  }
  return edges / ((w - 1) * (h - 1)) < 0.16;
}

function pruneIssueCovers(assetDir, key) {
  const prefix = `daily-${key}-`;
  try {
    for (const name of readdirSync(assetDir)) {
      if (name.startsWith(prefix) && name.endsWith(".webp")) unlinkSync(join(assetDir, name));
    }
  } catch {
    /* dest may not exist yet */
  }
}

function publicValueClass(report, picked) {
  const existing = report.cover?.valueClass || report.cover?.value_class || report.cover?.value_category;
  if (isAcceptedCoverClass(existing)) return existing;
  const category = picked?.category;
  if (isAcceptedCoverClass(category)) return category;
  if (category === "eval_chart") return "paper_figure";
  if (category === "product_ui") return "product_screenshot";
  return undefined;
}

function publicLocalCover(report, picked, rendition) {
  if (!picked?.cover || !rendition?.local) return null;
  const alt = coverAltFor(report, picked);
  const out = {
    url: rendition.local.url,
    srcSet: rendition.local.srcSet,
    width: rendition.local.width ?? null,
    height: rendition.local.height ?? null,
    alt,
    caption: null,
  };
  const klass = publicValueClass(report, picked);
  if (klass) out.valueClass = klass;
  return out;
}

async function materializeOne(report, sharp, assetDir) {
  const key = report.key;
  const cite = leadCitation(report);
  let fetched = null;
  if (cite?.sourceUrl && /^https?:\/\//i.test(cite.sourceUrl)) {
    fetched = await extractArticle(cite.sourceUrl);
  }
  const pubs = publicationsFromDaily(report, fetched);
  const picked = leadCover(report.leadItemId || "", pubs, {
    title: report.lead?.title || cite?.title || report.title || "",
    summary: report.lead?.leadParagraph || cite?.summary || "",
    pageUrl: cite?.sourceUrl || "",
    firstParty: Boolean(cite?.firstParty),
    image: isRemoteCover(report.cover)
      ? {
          url: report.cover.url,
          width: report.cover.width ?? null,
          height: report.cover.height ?? null,
          alt: report.cover.alt || "",
        }
      : null,
    candidates: fetched?.media || [],
    sourceUrl: cite?.sourceUrl || "",
  });
  if (!picked?.cover) {
    pruneIssueCovers(assetDir, key);
    return { key, status: "empty", reason: picked?.reason || "no_image", cover: null };
  }
  const raw = await fetchBinary(picked.cover.url);
  if (raw && (await isDecorativeHero(raw, sharp))) {
    pruneIssueCovers(assetDir, key);
    return { key, status: "empty", reason: "decor_hero", cover: null };
  }
  const id = `daily-${key}`;
  const rendition = await emitRenditions(id, picked.cover, sharp, assetDir);
  if (!rendition?.local) {
    pruneIssueCovers(assetDir, key);
    return { key, status: "empty", reason: rendition?.fallback || "resize_failed", cover: null };
  }
  return {
    key,
    status: "materialized",
    reason: picked.reason,
    category: picked.category || null,
    cover: publicLocalCover(report, picked, rendition),
  };
}

export async function materializeEngineCovers(bundle, { assetDir, keys } = {}) {
  if (!bundle || !assetDir) return [];
  mkdirSync(assetDir, { recursive: true });
  const reports = [];
  if (bundle.daily) reports.push(bundle.daily);
  for (const row of bundle.dailies || []) {
    if (row && !reports.some((item) => item.key === row.key)) reports.push(row);
  }
  const wanted = keys ? new Set(keys) : null;
  const sharp = await loadSharp();
  const log = [];
  for (const report of reports) {
    if (!report?.key) continue;
    if (wanted && !wanted.has(report.key)) continue;
    if (isSameOriginCover(report.cover)) {
      log.push({ key: report.key, status: "already-local", url: report.cover.url, cover: report.cover });
      continue;
    }
    const result = await materializeOne(report, sharp, assetDir);
    log.push(result);
    report.cover = result.cover;
  }
  if (bundle.daily?.key) {
    const match = reports.find((row) => row.key === bundle.daily.key);
    if (match) bundle.daily.cover = match.cover;
  }
  return log;
}
