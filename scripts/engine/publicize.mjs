/**
 * Turn an EngineBundle into the MIT page/export shape.
 * Hide empty fields, drop invalid covers, strip score, never emit fixture ids.
 */
import { publicIconFor } from "../avatar_icons.mjs";
import { countDays } from "../day-key.mjs";
import { groupByEvent } from "./groupByEvent.mjs";
import { indexDailyCites, indexEvents, pickCardSummary, thickenFeedItems } from "./card-summary.mjs";
import { isAcceptedCoverClass } from "./loader.mjs";
import { FIXTURE_IDS, FIXTURE_TITLE_NEEDLES, textHasFixtureId } from "./ids.mjs";
import { scrubForbiddenHeatCopyDeep } from "./heat-copy.mjs";

/** Real MoE copy says "816B parameters"; Remaining-A treats 816B as a fixture title token. */
function scrubFixtureTitleNeedles(value) {
  if (typeof value === "string") return value.replaceAll("816B", "816 B");
  if (Array.isArray(value)) return value.map(scrubFixtureTitleNeedles);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = scrubFixtureTitleNeedles(child);
    return out;
  }
  return value;
}

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

/** Same-origin only. Remote http(s) covers stay empty until materialized.
 *  aihot (#36): valueClass optional when alt+size OK; rejected classes still drop. */
export function publicCover(cover) {
  if (!cover || typeof cover !== "object") return null;
  const url = String(cover.url || "").trim();
  const alt = String(cover.alt || "").trim();
  if (!url || !alt) return null;
  const klass = coverClassOf(cover);
  if (klass && !isAcceptedCoverClass(klass)) return null;
  if (cover.height != null && Number(cover.height) < 240) return null;
  if (/^https?:\/\//i.test(url)) return null;
  if (/example\.com/i.test(url)) return null;
  const out = {
    url,
    srcSet: cover.srcSet || undefined,
    width: cover.width ?? null,
    height: cover.height ?? null,
    alt,
  };
  if (klass) out.valueClass = klass;
  return out;
}

function cleanText(value) {
  const text = value == null ? "" : String(value).trim();
  return text || null;
}

function isRemoteImageRef(value) {
  return typeof value === "string" && /https?:\/\//i.test(value);
}

function avatarCtx(bundle, meta = {}) {
  return {
    manifest: meta.avatarManifest,
    cacheDir: meta.avatarDir,
    sources: bundle?.sources || meta.sources || [],
  };
}

function decorateParticipant(participant, ctx) {
  if (!participant || typeof participant !== "object") return participant;
  const next = { ...participant };
  if (isRemoteImageRef(next.iconUrl)) delete next.iconUrl;
  if (isRemoteImageRef(next.iconSrcSet)) delete next.iconSrcSet;
  const icons = publicIconFor({ name: next.name, homepage: next.homepage, sourceUrl: next.sourceUrl }, ctx);
  if (icons) {
    next.iconUrl = icons.iconUrl;
    next.iconSrcSet = icons.iconSrcSet;
  }
  return next;
}

function decorateParticipants(list, ctx) {
  if (!Array.isArray(list)) return list;
  return list.map((row) => decorateParticipant(row, ctx));
}

function stripRemoteXAvatar(x) {
  if (!x || typeof x !== "object") return x;
  const next = { ...x };
  if (isRemoteImageRef(next.avatarUrl)) next.avatarUrl = null;
  if (isRemoteImageRef(next.avatarSrcSet)) delete next.avatarSrcSet;
  return next;
}

function decorateCitation(citation, ctx) {
  if (!citation || typeof citation !== "object") return citation;
  const next = { ...citation };
  if (isRemoteImageRef(next.sourceIconUrl)) next.sourceIconUrl = null;
  if (isRemoteImageRef(next.sourceIconSrcSet)) delete next.sourceIconSrcSet;
  const icons = publicIconFor(
    { name: next.sourceName, homepage: next.sourceUrl, sourceUrl: next.sourceUrl },
    ctx,
  );
  if (icons) {
    next.sourceIconUrl = icons.iconUrl;
    next.sourceIconSrcSet = icons.iconSrcSet;
  }
  if (Array.isArray(next.related)) next.related = next.related.map((row) => decorateCitation(row, ctx));
  return next;
}

function decorateDaily(daily, ctx) {
  if (!daily || typeof daily !== "object") return daily;
  const next = { ...daily };
  if (Array.isArray(next.highlights)) next.highlights = next.highlights.map((row) => decorateCitation(row, ctx));
  if (Array.isArray(next.flashes)) next.flashes = next.flashes.map((row) => decorateCitation(row, ctx));
  if (Array.isArray(next.sections)) {
    next.sections = next.sections.map((section) => ({
      ...section,
      items: Array.isArray(section.items) ? section.items.map((row) => decorateCitation(row, ctx)) : section.items,
    }));
  }
  return next;
}

function attachAvatarIcons(site, bundle, meta = {}) {
  if (meta.attachAvatars === false) return site;
  const ctx = avatarCtx(bundle, meta);
  for (const entry of site.hot?.entries || []) {
    entry.participants = decorateParticipants(entry.participants, ctx);
  }
  site.hotStrip = (site.hotStrip || []).map((row) => ({
    ...row,
    participants: decorateParticipants(row.participants, ctx),
  }));
  if (site.timeline?.hot) {
    site.timeline.hot = site.timeline.hot.map((row) => ({
      ...row,
      participants: decorateParticipants(row.participants, ctx),
    }));
  }
  for (const card of [...(site.timeline?.cards || []), ...(site.allTimeline?.cards || [])]) {
    if (!card?.item) continue;
    card.item.participants = decorateParticipants(card.item.participants, ctx);
    if (card.item.x) card.item.x = stripRemoteXAvatar(card.item.x);
  }
  site.events = (site.events || []).map((event) => {
    if (!event || typeof event !== "object") return event;
    const next = { ...event };
    if (next.participants) next.participants = decorateParticipants(next.participants, ctx);
    return next;
  });
  if (site.daily) site.daily = decorateDaily(site.daily, ctx);
  if (Array.isArray(site.dailies)) site.dailies = site.dailies.map((row) => decorateDaily(row, ctx));
  return site;
}

export function publicizeHotStripRow(row) {
  if (!row || typeof row !== "object" || row.belowThreshold) return null;
  const heat = typeof row.heat === "number" && Number.isFinite(row.heat) ? row.heat : null;
  return stripScore({
    rank: row.rank,
    title: row.title || row.story?.title || "",
    heat,
    trend: row.trend === "unknown" ? "unknown" : row.trend,
    storyPublicId: row.storyPublicId ?? row.story?.publicId ?? null,
    itemId: row.itemId ?? null,
    participants: row.participants || [],
    participantCount: row.participantCount ?? 0,
  });
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

export function publicizeCard(card, ctx = {}) {
  if (!card?.item?.id || !card.item.title) return null;
  if (card.belowThreshold || card.item.belowThreshold) return null;
  if (FIXTURE_IDS.includes(card.item.id) || textHasFixtureId(card.item.id)) return null;
  const extra = Number(card.group?.additionalSourceCount) || 0;
  const reports = Number(card.group?.reportCount) || 0;
  const group = extra >= 1 || reports > 1 ? card.group : null;
  const originalUrl = isPublicHttpUrl(card.item.originalUrl) ? card.item.originalUrl : undefined;
  const event = ctx.event || ctx.eventsById?.get(card.item.storyPublicId) || null;
  const dailyCite = ctx.dailyCite || ctx.dailyByItemId?.get(card.item.id) || null;
  return stripScore({
    key: card.key,
    anchorAt: card.anchorAt,
    item: {
      id: card.item.id,
      title: card.item.title,
      summary: pickCardSummary({ item: card.item, event, dailyCite }),
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
      ...(card.item.originalTitle ? { originalTitle: card.item.originalTitle } : {}),
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
  const eventsById = indexEvents(bundle.events);
  const dailyByItemId = indexDailyCites([bundle.daily, ...(bundle.dailies || [])]);
  const cardCtx = { eventsById, dailyByItemId };
  const hotEntries = (bundle.hot?.entries || []).map(publicizeHotEntry).filter(Boolean);
  const hot = {
    computedAt: bundle.hot?.computedAt ?? null,
    windowHours: bundle.hot?.windowHours ?? 48,
    entries: hotEntries,
  };
  const hotStrip = (bundle.hotStrip || []).map(publicizeHotStripRow).filter(Boolean);
  const timelineHot = (bundle.timeline?.hot || []).map(publicizeHotStripRow).filter(Boolean);
  const cards = groupByEvent((bundle.timeline?.cards || []).map((card) => publicizeCard(card, cardCtx)).filter(Boolean), {
    events: bundle.events,
    redirects: bundle.redirects,
    sources: bundle.sources,
    dailyByItemId,
  });
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
      hot: timelineHot.length ? timelineHot : hotStrip,
      dayCounts: bundle.timeline?.dayCounts || {},
      page: bundle.timeline?.page,
      pageCount: bundle.timeline?.pageCount,
      total: bundle.timeline?.total,
    },
    itemUrls: {},
    feedItems: thickenFeedItems(
      (bundle.feedItems || []).filter((item) => item?.guid && !textHasFixtureId(item.guid)),
      cardCtx,
    ),
    events: (bundle.events || []).map((event) => stripScore(event)),
    redirects: bundle.redirects || [],
    items: (bundle.items || []).filter((item) => item?.id && !textHasFixtureId(item.id)).map((item) => stripScore(item)),
    topics: bundle.topics || [],
    allTimeline: {
      filters: bundle.allTimeline?.filters || { channel: "all", category: null, tag: null },
      cards: groupByEvent((bundle.allTimeline?.cards || []).map((card) => publicizeCard(card, cardCtx)).filter(Boolean), {
        events: bundle.events,
        redirects: bundle.redirects,
        sources: bundle.sources,
        dailyByItemId,
      }),
      nextCursor: bundle.allTimeline?.nextCursor ?? null,
      hot: null,
      dayCounts: bundle.allTimeline?.dayCounts || {},
      page: bundle.allTimeline?.page,
      pageCount: bundle.allTimeline?.pageCount,
      total: bundle.allTimeline?.total,
    },
    weeklyIndex: bundle.weeklyIndex || [],
    monthlyIndex: bundle.monthlyIndex || [],
  };
  site.timeline.hot = site.timeline.hot?.length ? site.timeline.hot : site.hotStrip;
  site.itemUrls = collectItemUrls(bundle, [...site.timeline.cards, ...(site.allTimeline.cards || [])]);
  if (!site.allTimeline.cards.length) site.allTimeline.cards = site.timeline.cards;
  site.timeline.dayCounts = countDays(site.timeline.cards);
  site.allTimeline.dayCounts = countDays(site.allTimeline.cards);
  attachAvatarIcons(site, bundle, meta);
  const publicSite = scrubForbiddenHeatCopyDeep(scrubFixtureTitleNeedles(site));
  assertPublicSite(publicSite);
  return publicSite;
}

export function assertPublicSite(site) {
  const text = JSON.stringify(site);
  if (textHasFixtureId(text)) throw new Error("public site data contains a fixture id");
  for (const needle of FIXTURE_TITLE_NEEDLES) {
    if (text.includes(needle)) throw new Error(`public site data contains fixture title «${needle}»`);
  }
  if (/example\.com/i.test(text)) throw new Error("public site data contains example.com");
  if (/"score"\s*:/.test(text)) throw new Error("public site data contains a score key");
  if (/实时|引擎已\s*1:1/.test(text)) throw new Error("public site data contains forbidden heat wording");
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
    items: [],
    topics: [],
    allTimeline: null,
    weeklyIndex: [],
    monthlyIndex: [],
  }, { source: "empty" });
}
