/** Build-time cover resolver: MIT extract/queryHotCovers/leadCover + static imgproxy (sharp). */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  HERO_MODES,
  IMAGE_WIDTHS,
  MAX_MEDIA_CONSIDERED,
  MIN_COVER_HEIGHT,
  RANK_WINDOW_HOURS,
  SPARK_HOURS,
  leadCover,
  queryHotCovers,
} from "./cover_rules.mjs";
import { extractLiveCards, rankHot } from "./live_cards.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "content", "l2-covers");
const cacheDir = join(outDir, "fetch-cache");
const coverAssetDir = join(root, "preview", "mit-static", "assets", "covers");
const generatedPath = join(root, "scripts", "mit-static", "src", "covers.generated.json");

const UA =
  "Mozilla/5.0 (compatible; frontier-trends-l2-covers/1.0; +https://github.com/codyshen0000/ai-frontier-trends)";
const TIMEOUT_MS = 15_000;
const HOST_GAP_MS = 250;
const lastHostHit = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sha1(text) {
  return createHash("sha1").update(String(text)).digest("hex").slice(0, 16);
}

function attr(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (match) return match[1];
  const bare = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare ? bare[1].replace(/["']/g, "") : "";
}

function unwrapImageUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("/_next/image") && parsed.searchParams.get("url")) {
      return unwrapImageUrl(decodeURIComponent(parsed.searchParams.get("url")));
    }
  } catch {
    /* keep */
  }
  return url;
}

function absUrl(maybe, base) {
  if (!maybe) return "";
  const raw = String(maybe).trim().replace(/&amp;/g, "&");
  if (!raw || raw.startsWith("data:")) return "";
  try {
    return unwrapImageUrl(new URL(raw, base).href);
  } catch {
    return "";
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function tweetId(url) {
  const text = String(url);
  const status = text.match(/(?:x\.com|twitter\.com)\/(?:[^/]+\/)?status\/(\d+)/i);
  return status ? status[1] : "";
}

function arxivId(url) {
  const match = String(url).match(/arxiv\.org\/(?:abs|html|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/i);
  return match ? match[1].replace(/v\d+$/, "") : "";
}

function cachePath(url) {
  return join(cacheDir, `${sha1(url)}.json`);
}

function loadCache(url) {
  const path = cachePath(url);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function saveCache(url, payload) {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cachePath(url), JSON.stringify(payload));
}

async function fetchText(url) {
  const cached = loadCache(url);
  if (cached) return cached;
  const host = hostOf(url);
  const last = lastHostHit.get(host) || 0;
  const wait = HOST_GAP_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  lastHostHit.set(host, Date.now());
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "text/html,application/json,*/*" },
      redirect: "follow",
    });
    const type = res.headers.get("content-type") || "";
    const text = await res.text();
    const payload = { ok: res.ok, status: res.status, url: res.url || url, type, text };
    saveCache(url, payload);
    return payload;
  } catch (error) {
    const payload = { ok: false, status: 0, url, type: "", text: "", error: String(error) };
    saveCache(url, payload);
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function extractImagesFromHtml(html, pageUrl) {
  const images = [];
  const re = /<img\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const src = attr(tag, "src") || attr(tag, "data-src") || attr(tag, "data-original");
    const url = absUrl(src, pageUrl);
    if (!url) continue;
    const w = attr(tag, "width");
    const h = attr(tag, "height");
    images.push({
      kind: "image",
      url,
      width: w && /^\d+$/.test(w) ? Number(w) : null,
      height: h && /^\d+$/.test(h) ? Number(h) : null,
    });
    if (images.length >= MAX_MEDIA_CONSIDERED) break;
  }
  return images;
}

async function extractWithReadability(html, pageUrl) {
  try {
    const { parseHTML } = await import("linkedom");
    const { Readability } = await import("@mozilla/readability");
    const { document } = parseHTML(html);
    const base = document.createElement("base");
    base.setAttribute("href", pageUrl);
    document.head?.appendChild(base);
    const article = new Readability(document, { charThreshold: 140, keepClasses: false }).parse();
    if (!article?.content) return { images: extractImagesFromHtml(html, pageUrl), via: "html-fallback", textLen: 0 };
    return {
      images: extractImagesFromHtml(article.content, pageUrl),
      via: "readability",
      textLen: String(article.textContent || "").length,
    };
  } catch {
    return { images: extractImagesFromHtml(html, pageUrl), via: "html-fallback", textLen: 0 };
  }
}

function tweetMedia(json) {
  const tweet = json?.tweet || json;
  const photos = tweet?.media?.photos || tweet?.media?.all?.filter((m) => m.type === "photo") || [];
  return photos.map((photo) => ({
    kind: "image",
    url: photo.url || photo.src || "",
    width: typeof photo.width === "number" ? photo.width : null,
    height: typeof photo.height === "number" ? photo.height : null,
  })).filter((m) => m.url);
}

async function extractArticle(url) {
  const tid = tweetId(url);
  if (tid) {
    const fx = await fetchText(`https://api.fxtwitter.com/status/${tid}`);
    try {
      const json = JSON.parse(fx.text || "{}");
      const images = tweetMedia(json);
      return {
        url,
        finalUrl: fx.url,
        bodyMode: images.length || (json?.tweet?.text || json?.text) ? "full" : "summary",
        via: "fxtwitter",
        media: images,
        ok: fx.ok,
      };
    } catch {
      return { url, finalUrl: url, bodyMode: "summary", via: "fxtwitter", media: [], ok: false };
    }
  }

  const aid = arxivId(url);
  const pageUrl = aid ? `https://arxiv.org/html/${aid}` : url;
  const page = await fetchText(pageUrl);
  if (!page.ok || !/html/i.test(page.type || "text/html")) {
    return { url, finalUrl: page.url, bodyMode: "summary", via: "fetch-failed", media: [], ok: false };
  }
  const got = await extractWithReadability(page.text, page.url || pageUrl);
  const bodyMode = got.textLen >= 140 || got.images.length > 0 ? "full" : "summary";
  return { url, finalUrl: page.url, bodyMode, via: got.via, media: got.images, ok: true };
}

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    return null;
  }
}

async function fetchBinary(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "image/avif,image/webp,image/*,*/*" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) return null;
    return buf;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function noneRendition(fallback, original, bytes = 0) {
  return { local: null, fallback, bytes, actualWidth: original.width, actualHeight: original.height, files: [] };
}

async function emitRenditions(id, original, sharp) {
  mkdirSync(coverAssetDir, { recursive: true });
  const buf = await fetchBinary(original.url);
  if (!buf) return noneRendition("download_failed", original);
  if (!sharp) return noneRendition("resize_failed", original, buf.length);
  let meta;
  try {
    meta = await sharp(buf, { failOn: "none" }).metadata();
  } catch {
    return noneRendition("resize_failed", original, buf.length);
  }
  const format = String(meta.format || "").toLowerCase();
  if (format === "svg" || format === "svg+xml") return noneRendition("svg", original, buf.length);
  const actualWidth = meta.width || original.width;
  const actualHeight = meta.height || original.height;
  if (actualHeight != null && Number(actualHeight) < MIN_COVER_HEIGHT) {
    return noneRendition("below_240", original, buf.length);
  }
  const files = [];
  let bytes = 0;
  try {
    for (const mode of HERO_MODES) {
      const targetW = IMAGE_WIDTHS[mode];
      const width = actualWidth ? Math.min(targetW, actualWidth) : targetW;
      const pipeline = sharp(buf, { failOn: "none" }).rotate().resize({
        width,
        withoutEnlargement: true,
        fit: "inside",
      });
      const webpBuf = await pipeline.clone().webp({ quality: 78 }).toBuffer();
      const webpName = `${id}-${targetW}.webp`;
      writeFileSync(join(coverAssetDir, webpName), webpBuf);
      bytes += webpBuf.length;
      files.push({ mode, width: targetW, webp: `assets/covers/${webpName}`, bytes: webpBuf.length });
    }
  } catch {
    return noneRendition("resize_failed", original, buf.length);
  }
  const full = files.find((f) => f.mode === "full");
  const srcSet = files.map((f) => `${f.webp} ${f.width}w`).join(", ");
  const fullW = Math.min(IMAGE_WIDTHS.full, actualWidth || IMAGE_WIDTHS.full);
  const fullH = actualWidth && actualHeight ? Math.round((fullW * actualHeight) / actualWidth) : actualHeight;
  return {
    local: {
      url: full.webp,
      srcSet,
      width: fullW ?? null,
      height: fullH ?? null,
    },
    fallback: "none",
    bytes,
    actualWidth,
    actualHeight,
    files,
  };
}

function heatTemplate() {
  const rise = [18, 20, 22, 28, 35, 40, 48, 55, 62, 70, 78, 88, 95, 100, 92, 90, 88, 85, 86, 90, 94, 97, 99, 100];
  const spark = (peak) => {
    const max = Math.max(...rise, 1);
    return rise.map((v) => Math.round((v / max) * peak));
  };
  const faces = (names) => names.map((name, i) => ({ name, kind: i === 0 ? "editorial" : "signal" }));
  return [
    { heat: 333, trend: "down", trendPct: 11, badges: ["rising"], people: 47, sources: 15 },
    { heat: 150, trend: "down", trendPct: 29, badges: [], people: 39, sources: 9 },
    { heat: 86, trend: "up", trendPct: 11, badges: [], people: 17, sources: 7 },
    { heat: 80, trend: "up", trendPct: 709, badges: [], people: 14, sources: 6 },
    { heat: 74, trend: "down", trendPct: 16, badges: [], people: 11, sources: 5 },
    { heat: 71, trend: "up", trendPct: 8, badges: [], people: 9, sources: 4 },
    { heat: 64, trend: "flat", trendPct: null, badges: [], people: 8, sources: 4 },
    { heat: 58, trend: "down", trendPct: 4, badges: [], people: 6, sources: 3 },
    { heat: 52, trend: "up", trendPct: 6, badges: [], people: 7, sources: 3 },
    { heat: 48, trend: "flat", trendPct: null, badges: [], people: 5, sources: 3 },
  ].map((row) => ({ ...row, spark: spark(row.heat), participants: faces(["数字前沿", "跟进源", "评测组"]) }));
}

function coverView(resolved, rendition) {
  if (!resolved?.cover || !rendition?.local) return null;
  return rendition.local;
}

function emitReason(rendition) {
  if (!rendition) return null;
  if (rendition.local) return null;
  return rendition.fallback || "resize_failed";
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const liveRaw = readFileSync(join(root, "content", "live.html"), "utf8");
  const cards = extractLiveCards(liveRaw);
  const ranked = rankHot(cards);
  const byId = new Map(cards.map((c) => [c.id, c]));
  const articleCache = new Map();

  async function publicationsFor(card) {
    const pubs = [];
    const sources = card.sources?.length ? card.sources : [];
    for (const [i, source] of sources.entries()) {
      const key = source.href;
      if (!articleCache.has(key)) articleCache.set(key, extractArticle(key));
      const extracted = await articleCache.get(key);
      pubs.push({
        articleId: `${card.id}::${i}::${hostOf(source.href) || i}`,
        url: source.href,
        sourceName: source.name || hostOf(source.href),
        firstParty: Boolean(card.firstParty) && i === 0,
        selected: Boolean(card.focus) && i === 0,
        score: 0,
        listed: true,
        bodyMode: extracted.bodyMode,
        via: extracted.via,
        media: extracted.media,
      });
    }
    if (pubs.length === 0) {
      pubs.push({
        articleId: `${card.id}::none`,
        url: "",
        sourceName: "",
        firstParty: Boolean(card.firstParty),
        selected: Boolean(card.focus),
        score: 0,
        listed: true,
        bodyMode: "summary",
        via: "no-source",
        media: [],
      });
    }
    return pubs;
  }

  const heats = heatTemplate();
  const sharp = await loadSharp();
  const hotStories = [];
  for (const [i, card] of ranked.entries()) {
    const publications = await publicationsFor(card);
    const representativeItemId = publications[0]?.articleId;
    const picked = queryHotCovers({ representativeItemId, publications });
    hotStories.push({ card, publications, representativeItemId, picked, heat: heats[i] });
  }

  const latestDay = cards.reduce((max, card) => (card.day > max ? card.day : max), "");
  const dayCards = cards.filter((card) => card.day === latestDay);
  const dailyLeadCard =
    [...dayCards].sort(
      (a, b) =>
        Number(b.focus) - Number(a.focus) ||
        Number(b.firstParty) - Number(a.firstParty) ||
        b.sourceCount - a.sourceCount ||
        a.title.localeCompare(b.title, "zh"),
    )[0] || ranked[0];

  const dailyPubs = await publicationsFor(dailyLeadCard);
  const dailyPicked = leadCover(dailyPubs[0]?.articleId, dailyPubs);

  const needIds = new Set();
  if (hotStories[0]?.picked.cover) needIds.add(`hot-${hotStories[0].card.id}`);
  if (dailyPicked.cover) needIds.add(`daily-${dailyLeadCard.id}`);

  const renditions = {};
  if (hotStories[0]?.picked.cover) {
    renditions[`hot-${hotStories[0].card.id}`] = await emitRenditions(
      `hot-${hotStories[0].card.id}`,
      hotStories[0].picked.cover,
      sharp,
    );
  }
  if (dailyPicked.cover) {
    const dailyKey = `daily-${dailyLeadCard.id}`;
    if (hotStories[0]?.card.id === dailyLeadCard.id && renditions[`hot-${hotStories[0].card.id}`]) {
      renditions[dailyKey] = renditions[`hot-${hotStories[0].card.id}`];
    } else {
      renditions[dailyKey] = await emitRenditions(dailyKey, dailyPicked.cover, sharp);
    }
  }

  const hotEntries = hotStories.map((row, i) => {
    const names = row.card.sources?.map((s) => s.name).filter(Boolean) || [];
    const leadRendition = i === 0 ? renditions[`hot-${row.card.id}`] : null;
    const coverOurs = i === 0 ? coverView(row.picked, leadRendition) : null;
    return {
      rank: i + 1,
      itemId: row.card.id,
      storyPublicId: `st-${row.card.id}`,
      title: row.card.title,
      summary: row.card.summary || null,
      latest: null,
      sourceCount: Math.max(row.card.sourceCount, names.length, 1),
      sourceNames: names.slice(0, 2),
      firstParty: Boolean(row.card.firstParty),
      selected: Boolean(row.card.focus),
      representativeItemId: row.representativeItemId,
      coverReason: (i === 0 && emitReason(leadRendition)) || row.picked.reason,
      coverArticleId: row.picked.articleId,
      coverOriginal: row.picked.cover,
      coverOurs,
      pickLog: row.picked.log,
      heat: row.heat.heat,
      trend: row.heat.trend,
      trendPct: row.heat.trendPct,
      badges: row.heat.badges,
      participantCount: row.heat.people,
      participants: names.length
        ? names.slice(0, 4).map((name, idx) => ({ name, kind: idx === 0 ? "editorial" : "signal" }))
        : row.heat.participants,
      spark: row.heat.spark,
    };
  });

  const dailyRendition = renditions[`daily-${dailyLeadCard.id}`];
  const generated = {
    sparkHours: SPARK_HOURS,
    rankWindowHours: RANK_WINDOW_HOURS,
    asOf: "2026-10-18T00:20:00.000Z",
    day: latestDay,
    sharp: Boolean(sharp),
    hotEntries,
    daily: {
      itemId: dailyLeadCard.id,
      title: dailyLeadCard.title,
      leadParagraph: dailyLeadCard.summary || dailyLeadCard.title,
      sourceName: dailyLeadCard.sources?.[0]?.name || "",
      sourceUrl: dailyLeadCard.sources?.[0]?.href || "",
      firstParty: Boolean(dailyLeadCard.firstParty),
      publishedAt: `${latestDay}T00:00:00.000Z`,
      otherSources: Math.max(0, (dailyLeadCard.sourceCount || 1) - 1),
      coverReason: emitReason(dailyRendition) || dailyPicked.reason,
      coverArticleId: dailyPicked.articleId,
      coverOriginal: dailyPicked.cover,
      coverOurs: coverView(dailyPicked, dailyRendition),
      pickLog: dailyPicked.log,
    },
    renditions: Object.fromEntries(
      Object.entries(renditions).map(([id, value]) => [
        id,
        {
          fallback: value.fallback,
          bytes: value.bytes,
          actualWidth: value.actualWidth,
          actualHeight: value.actualHeight,
          files: value.files || [],
        },
      ]),
    ),
  };

  const coverage = {
    sparkHours: SPARK_HOURS,
    rankWindowHours: RANK_WINDOW_HOURS,
    hot: {
      total: hotEntries.length,
      withCover: hotEntries.filter((e) => e.coverOriginal).length,
      render: hotEntries[0]?.coverOurs ? 1 : 0,
      renderNote: "MIT UI only paints the picture on NO.01; runners/rows keep sparkline only. Download/resize failure → no-image, never hotlink.",
    },
    daily: {
      headlineHasCover: Boolean(generated.daily.coverOurs),
      renders: Boolean(generated.daily.coverOurs),
      noSparklineWhenMissing: true,
    },
    missing: hotEntries
      .filter((e) => !e.coverOriginal)
      .map((e) => ({
        id: e.itemId,
        rank: e.rank,
        title: e.title,
        reason: e.coverReason,
      })),
    dailyMissingReason: generated.daily.coverOriginal ? null : generated.daily.coverReason,
    samples: hotEntries.slice(0, 5).map((e) => ({
      id: e.itemId,
      rank: e.rank,
      representative: e.representativeItemId,
      winner: e.coverArticleId,
      reason: e.coverReason,
      image: e.coverOriginal?.url || null,
      log: e.pickLog,
    })),
    sizeBudget: {
      coverFilesBytes: (() => {
        const seen = new Set();
        let bytes = 0;
        for (const [id, r] of Object.entries(generated.renditions)) {
          const key = (r.files || []).map((f) => f.webp).join("|") || id;
          if (seen.has(key)) continue;
          seen.add(key);
          bytes += r.bytes || 0;
        }
        return bytes;
      })(),
      uniqueRenditions: new Set(
        Object.values(generated.renditions).map((r) => (r.files || []).map((f) => f.webp).join("|")),
      ).size,
      modes: HERO_MODES.map((mode) => ({ mode, width: IMAGE_WIDTHS[mode] })),
      note: "Build-time sharp = MIT image-proxy static equivalent. hero srcSet widths thumb/720, image-1200/1200, full/1600. webp only, withoutEnlargement. Fail → no-image (never hotlink). Product-approved: skip SVG, known height < 240, and camo.githubusercontent.com / shields.io badge proxies.",
    },
  };

  writeFileSync(join(outDir, "coverage.json"), JSON.stringify(coverage, null, 2));
  writeFileSync(join(outDir, "articles.json"), JSON.stringify(
    {
      hot: hotStories.map((row) => ({
        id: row.card.id,
        representativeItemId: row.representativeItemId,
        publications: row.publications,
        picked: row.picked,
      })),
      daily: { id: dailyLeadCard.id, publications: dailyPubs, picked: dailyPicked },
    },
    null,
    2,
  ));
  writeFileSync(generatedPath, JSON.stringify(generated, null, 2));
  if (existsSync(coverAssetDir)) {
    for (const name of readdirSync(coverAssetDir)) {
      if (/\.(jpe?g)$/i.test(name)) unlinkSync(join(coverAssetDir, name));
    }
  }
  console.log("l2_covers hot", hotEntries.length, "lead", hotEntries[0]?.itemId, hotEntries[0]?.coverReason, hotEntries[0]?.coverOriginal?.url || "none");
  console.log("l2_covers daily", generated.daily.itemId, generated.daily.coverReason, generated.daily.coverOriginal?.url || "none");
  console.log("l2_covers sharp", Boolean(sharp), "bytes", coverage.sizeBudget.coverFilesBytes);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

export { main as buildCovers };
