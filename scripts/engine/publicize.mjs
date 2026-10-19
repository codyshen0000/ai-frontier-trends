/**
 * Turn an EngineBundle into the MIT page/export shape.
 * Hide empty fields, drop invalid covers, strip score, never emit fixture ids.
 */
import { groupByEvent } from "./groupByEvent.mjs";
import { isAcceptedCoverClass } from "./loader.mjs";
import { FIXTURE_IDS, textHasFixtureId } from "./ids.mjs";

export function isPublicHttpUrl(url) {
  return !!url && /^https?:\/\//i.test(url) && !/example\.com/i.test(url);
}

export function stripScore(value, seen = new WeakSet()) {
  if (Array.isArray(value)) return value.map((entry) => stripScore(entry, seen));
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (/[Ss][Cc][Oo][Rr][Ee]/.test(key)) continue;
    out[key] = stripScore(child, seen);
  }
  return out;
}

export function coverClassOf(cover) {
  if (!cover || typeof cover !== "object") return undefined;
  return cover.valueClass ?? cover.value_class ?? cover.value_category;
}

/** Same-origin only. Remote http(s) covers stay empty until materialized. */
export function publicCover(cover) {
  if (!cover || typeof cover !== "object") return null;
  const url = String(cover.url || "").trim();
  const alt = String(cover.alt || "").trim();
  if (!url || !alt) return null;
  const klass = coverClassOf(cover);
  if (!klass || !isAcceptedCoverClass(klass)) return null;
  if (cover.height != null && Number(cover.height) < 240) return null;
  if (/^https?:\/\//i.test(url)) return null;
  if (/example\.com/i.test(url)) return null;
  return {
    url,
    srcSet: cover.srcSet || undefined,
    width: cover.width ?? null,
    height: cover.height ?? null,
    alt,
    valueClass: klass,
  };
}

function cleanText(value) {
  const text = value == null ? "" : String(value).trim();
  return text || null;
}

export function publicizeHotEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  if (entry.belowThreshold) return null;
  const spark = Array.isArray(entry.spark) ? entry.spark : [];
  const observed = spark.filter((v) => v != null);
  const heat = typeof entry.heat === "number" && Number.isFinite(entry.heat) ? entry.heat : null;
  const trend = entry.trend === "unknown" ? "unknown" : entry.trend;
  const trendPct = typeof entry.trendPct === "number" && Number.isFinite(entry.trendPct) ? entry.trendPct : null;
  return stripScore({
    rank: entry.rank,
    story: entry.story,
    heat,
    trend,
    trendPct,
    badges: Array.isArray(entry.badges) ? entry.badges : [],
    participantCount: entry.participantCount ?? 0,
    sourceCount: entry.sourceCount ?? 0,
    sourceNames: entry.sourceNames || [],
    participants: entry.participants || [],
    spark: observed.length < 2 ? [] : spark,
    summary: cleanText(entry.summary),
    latest: cleanText(entry.latest),
    cover: publicCover(entry.cover),
    rankDelta: entry.rankDelta,
    heatDeltaPct: entry.heatDeltaPct,
  });
}

export function publicizeCard(card) {
  if (!card?.item?.id || !card.item.title) return null;
  if (card.belowThreshold || card.item.belowThreshold) return null;
  if (FIXTURE_IDS.includes(card.item.id) || textHasFixtureId(card.item.id)) return null;
  const extra = Number(card.group?.additionalSourceCount) || 0;
  const reports = Number(card.group?.reportCount) || 0;
  const group = extra >= 1 || reports > 1 ? card.group : null;
  const originalUrl = isPublicHttpUrl(card.item.originalUrl) ? card.item.originalUrl : undefined;
  return stripScore({
    key: card.key,
    anchorAt: card.anchorAt,
    item: {
      id: card.item.id,
      title: card.item.title,
      summary: cleanText(card.item.summary),
      reason: cleanText(card.item.reason),
      source: card.item.source || { name: "" },
      publishedAt: card.item.publishedAt ?? null,
      timelineAt: card.item.timelineAt || card.anchorAt,
      category: card.item.category ?? null,
      tags: card.item.tags || [],
      selected: !!card.item.selected,
      channel: card.item.channel || "news",
      x: card.item.x ?? null,
      sameEvent: card.item.sameEvent ?? null,
      ...(originalUrl ? { originalUrl } : {}),
      ...(card.item.storyPublicId ? { storyPublicId: card.item.storyPublicId } : {}),
    },
    group,
  });
}

export function collectItemUrls(bundle, cards = []) {
  const urls = {};
  const remember = (id, url) => {
    if (!id || !isPublicHttpUrl(url)) return;
    urls[id] = url;
  };
  for (const card of cards) {
    remember(card.item?.id, card.item?.originalUrl);
    remember(card.item?.storyPublicId, card.item?.originalUrl);
  }
  for (const item of bundle.feedItems || []) {
    remember(item.guid, item.originalUrl);
    remember(item.eventPublicId, item.originalUrl);
  }
  for (const event of bundle.events || []) {
    remember(event.publicId, event.primaryUrl);
    for (const row of event.timeline || []) remember(row.id, row.originalUrl);
  }
  return urls;
}

/**
 * @param {import("./site-data.ts").EngineBundle} bundle
 * @param {{ source?: string, warning?: string|null }} [meta]
 */
export function publicizeBundle(bundle, meta = {}) {
  const hotEntries = (bundle.hot?.entries || []).map(publicizeHotEntry).filter(Boolean);
  const hot = {
    computedAt: bundle.hot?.computedAt ?? null,
    windowHours: bundle.hot?.windowHours ?? 48,
    entries: hotEntries,
  };
  const hotStrip = (bundle.hotStrip || []).filter((row) => !row?.belowThreshold).map((row) =>
    stripScore({
      rank: row.rank,
      title: row.title,
      heat: typeof row.heat === "number" && Number.isFinite(row.heat) ? row.heat : null,
      trend: row.trend === "unknown" ? "unknown" : row.trend,
      storyPublicId: row.storyPublicId ?? null,
      itemId: row.itemId ?? null,
      participants: row.participants || [],
      participantCount: row.participantCount ?? 0,
    }),
  );
  const cards = groupByEvent((bundle.timeline?.cards || []).map(publicizeCard).filter(Boolean));
  const daily = bundle.daily ? stripScore(bundle.daily) : null;
  if (daily?.cover) daily.cover = publicCover(daily.cover);
  const site = {
    data_as_of: bundle.data_as_of || "",
    built_at: bundle.built_at || "",
    source: meta.source || "primary",
    warning: meta.warning ?? null,
    hasSelectedFeed: (bundle.feedItems || []).length > 0,
    hot,
    hotStrip: hotStrip.length ? hotStrip : hotEntries.slice(0, 5).map((entry) => ({
      rank: entry.rank,
      title: entry.story?.title || "",
      heat: entry.heat,
      trend: entry.trend,
      storyPublicId: entry.story?.publicId ?? null,
      itemId: entry.story?.publicId ?? null,
      participants: entry.participants || [],
      participantCount: entry.participantCount ?? 0,
    })),
    daily,
    dailyIndex: bundle.dailyIndex || [],
    dailies: bundle.dailies || [],
    timeline: {
      filters: bundle.timeline?.filters || { channel: "all", category: null, tag: null },
      cards,
      nextCursor: bundle.timeline?.nextCursor ?? null,
      hot: bundle.timeline?.hot || hotStrip,
      dayCounts: bundle.timeline?.dayCounts || {},
      page: bundle.timeline?.page,
      pageCount: bundle.timeline?.pageCount,
      total: bundle.timeline?.total,
    },
    itemUrls: {},
    feedItems: (bundle.feedItems || []).filter((item) => item?.guid && !textHasFixtureId(item.guid)),
    events: bundle.events || [],
    redirects: bundle.redirects || [],
  };
  site.timeline.hot = site.timeline.hot?.length ? site.timeline.hot : site.hotStrip;
  site.itemUrls = collectItemUrls(bundle, site.timeline.cards);
  assertPublicSite(site);
  return site;
}

export function assertPublicSite(site) {
  const text = JSON.stringify(site);
  if (textHasFixtureId(text)) throw new Error("public site data contains a fixture id");
  if (/example\.com/i.test(text)) throw new Error("public site data contains example.com");
  if (/"score"\s*:/.test(text)) throw new Error("public site data contains a score key");
}

export function emptyPublicSite() {
  return publicizeBundle({
    dir: "",
    meta: { data_as_of: "", generated_at: "" },
    data_as_of: "",
    built_at: "",
    hot: { computedAt: null, windowHours: 48, entries: [] },
    hotStrip: [],
    daily: null,
    dailyIndex: [],
    dailies: [],
    feed: null,
    feedItems: [],
    events: [],
    eventsIndex: [],
    timeline: {
      filters: { channel: "all", category: null, tag: null },
      cards: [],
      nextCursor: null,
      hot: [],
      dayCounts: {},
    },
    timelineIndex: null,
    redirects: [],
    sources: [],
    search: null,
  }, { source: "empty" });
}
