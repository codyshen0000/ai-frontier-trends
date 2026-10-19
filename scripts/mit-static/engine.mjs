import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Locked filenames under data/engine/. See data/engine/CONTRACT.md. */
export const ENGINE_FILES = {
  timeline: "timeline.json",
  hotStrip: "hot-strip.json",
  hot: "hot.json",
  daily: "daily.json",
  dailyIndex: "daily-index.json",
  meta: "meta.json",
};

export const PRIMARY_ENGINE_FILES = [
  ENGINE_FILES.timeline,
  ENGINE_FILES.hotStrip,
  ENGINE_FILES.hot,
  ENGINE_FILES.daily,
];

/** MIT L2: first image used as a cover must be at least 480px wide. */
export const MIN_COVER_WIDTH = 480;

export function engineDirFromRoot(repoRoot) {
  return path.join(repoRoot, "data", "engine");
}

export function listPresentEngineFiles(dir) {
  return Object.values(ENGINE_FILES).filter((name) => existsSync(path.join(dir, name)));
}

export function readJsonIfPresent(filePath) {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${filePath}: ${err instanceof Error ? err.message : err}`);
  }
}

export function readEngineDir(dir) {
  const present = listPresentEngineFiles(dir);
  return {
    present,
    timeline: readJsonIfPresent(path.join(dir, ENGINE_FILES.timeline)),
    hotStrip: readJsonIfPresent(path.join(dir, ENGINE_FILES.hotStrip)),
    hot: readJsonIfPresent(path.join(dir, ENGINE_FILES.hot)),
    daily: readJsonIfPresent(path.join(dir, ENGINE_FILES.daily)),
    dailyIndex: readJsonIfPresent(path.join(dir, ENGINE_FILES.dailyIndex)),
    meta: readJsonIfPresent(path.join(dir, ENGINE_FILES.meta)),
  };
}

export function dataSourceOf(present) {
  if (present.length === 0) return "fixture";
  const hasPrimary = PRIMARY_ENGINE_FILES.some((name) => present.includes(name));
  if (!hasPrimary) return "fixture";
  const hasAllPrimary = PRIMARY_ENGINE_FILES.every((name) => present.includes(name));
  return hasAllPrimary ? "engine" : "mixed";
}

/** Keep a cover only when it already satisfies L2 (width >= 480). Null width is accepted if the exporter set cover. */
export function pickL2Cover(cover) {
  if (!cover || typeof cover !== "object") return null;
  const url = typeof cover.url === "string" ? cover.url.trim() : "";
  if (!url) return null;
  if (typeof cover.width === "number" && cover.width < MIN_COVER_WIDTH) return null;
  return {
    url,
    srcSet: cover.srcSet,
    width: cover.width ?? null,
    height: cover.height ?? null,
    caption: cover.caption ?? null,
  };
}

/** First image whose declared width is >= 480. Images without width are skipped. */
export function firstQualifyingImage(images) {
  if (!Array.isArray(images)) return null;
  for (const img of images) {
    if (!img || typeof img !== "object") continue;
    const url = typeof img.url === "string" ? img.url.trim() : "";
    if (!url) continue;
    if (typeof img.width !== "number" || img.width < MIN_COVER_WIDTH) continue;
    return {
      url,
      srcSet: img.srcSet,
      width: img.width,
      height: img.height ?? null,
      caption: img.caption ?? img.alt ?? null,
    };
  }
  return null;
}

export function resolveCover(entry) {
  if (!entry || typeof entry !== "object") return null;
  return pickL2Cover(entry.cover) ?? firstQualifyingImage(entry.images ?? entry.media);
}

export function normalizeSpark(spark) {
  if (!Array.isArray(spark)) return [];
  return spark.map((point) => {
    if (point == null) return null;
    if (typeof point === "number" && Number.isFinite(point)) return point;
    if (typeof point === "object" && typeof point.heat === "number" && Number.isFinite(point.heat)) return point.heat;
    return null;
  });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("timeline card is missing item");
  }
  if (typeof raw.id !== "string" || !raw.id) throw new Error("timeline item.id is required");
  if (typeof raw.title !== "string" || !raw.title) throw new Error(`timeline item ${raw.id} is missing title`);
  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary ?? null,
    reason: raw.reason ?? null,
    source: raw.source && typeof raw.source === "object" ? { name: String(raw.source.name ?? "未署名") } : { name: "未署名" },
    publishedAt: raw.publishedAt ?? raw.timelineAt ?? null,
    timelineAt: raw.timelineAt ?? raw.publishedAt ?? new Date().toISOString(),
    category: raw.category ?? null,
    tags: asArray(raw.tags),
    score: typeof raw.score === "number" ? raw.score : null,
    selected: raw.selected !== false,
    channel: raw.channel === "x" ? "x" : "news",
    x: raw.x ?? null,
    sameEvent: raw.sameEvent ?? null,
  };
}

function normalizeCard(raw) {
  const itemSource = raw?.item ?? raw;
  const item = normalizeItem(itemSource);
  return {
    key: typeof raw?.key === "string" && raw.key ? raw.key : item.id,
    anchorAt: raw?.anchorAt ?? item.timelineAt,
    item,
    group: raw?.group ?? null,
  };
}

function deriveDayCounts(cards) {
  const counts = {};
  for (const card of cards) {
    const day = String(card.anchorAt || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    counts[day] = (counts[day] || 0) + 1;
  }
  return counts;
}

export function normalizeTimeline(raw) {
  const cardsRaw = Array.isArray(raw) ? raw : asArray(raw?.cards);
  if (cardsRaw.length === 0) throw new Error("timeline.json must contain a cards array");
  const cards = cardsRaw.map((card, i) => normalizeCard(card, i));
  return {
    filters: raw?.filters ?? { channel: "all", category: null, tag: null },
    cards,
    nextCursor: raw?.nextCursor ?? null,
    hot: Array.isArray(raw?.hot) ? raw.hot.map(normalizeStripEntry) : null,
    dayCounts: raw?.dayCounts && typeof raw.dayCounts === "object" ? raw.dayCounts : deriveDayCounts(cards),
  };
}

function normalizeParticipant(raw, index) {
  const name = typeof raw === "string" ? raw : String(raw?.name ?? `来源${index + 1}`);
  const kind = raw?.kind === "signal" ? "signal" : "editorial";
  return {
    name,
    kind,
    iconUrl: raw?.iconUrl ?? null,
    iconSrcSet: raw?.iconSrcSet,
  };
}

export function normalizeStripEntry(raw, index = 0) {
  if (!raw || typeof raw !== "object") throw new Error("hot-strip entry must be an object");
  const title = String(raw.title ?? raw.story?.title ?? "");
  if (!title) throw new Error(`hot-strip entry #${index + 1} is missing title`);
  return {
    rank: typeof raw.rank === "number" ? raw.rank : index + 1,
    title,
    heat: typeof raw.heat === "number" ? raw.heat : 0,
    trend: raw.trend ?? "unknown",
    storyPublicId: raw.storyPublicId ?? raw.story?.publicId ?? null,
    itemId: raw.itemId ?? null,
    participants: asArray(raw.participants).map(normalizeParticipant),
    participantCount: typeof raw.participantCount === "number" ? raw.participantCount : asArray(raw.participants).length,
  };
}

export function normalizeHotStrip(raw) {
  const entries = Array.isArray(raw) ? raw : asArray(raw?.entries);
  if (entries.length === 0) throw new Error("hot-strip.json must be a non-empty array");
  return entries.map(normalizeStripEntry);
}

function stripFromHotEntries(entries) {
  return entries.slice(0, 5).map((entry, i) =>
    normalizeStripEntry({
      rank: entry.rank ?? i + 1,
      title: entry.story?.title ?? entry.title,
      heat: entry.heat,
      trend: entry.trend,
      storyPublicId: entry.story?.publicId ?? null,
      itemId: entry.itemId ?? null,
      participants: entry.participants,
      participantCount: entry.participantCount,
    }),
  );
}

export function normalizeHot(raw) {
  const entriesRaw = asArray(raw?.entries);
  if (entriesRaw.length === 0) throw new Error("hot.json must contain an entries array");
  return {
    computedAt: raw.computedAt ?? null,
    windowHours: typeof raw.windowHours === "number" ? raw.windowHours : 48,
    entries: entriesRaw.map((entry, i) => {
      const title = String(entry.story?.title ?? entry.title ?? "");
      if (!title) throw new Error(`hot entry #${i + 1} is missing story.title`);
      const rank = typeof entry.rank === "number" ? entry.rank : i + 1;
      return {
        rank,
        story: {
          publicId: String(entry.story?.publicId ?? entry.storyPublicId ?? `st-${rank}`),
          title,
        },
        heat: typeof entry.heat === "number" ? entry.heat : 0,
        trend: entry.trend ?? "unknown",
        trendPct: typeof entry.trendPct === "number" ? entry.trendPct : null,
        badges: asArray(entry.badges),
        participantCount: typeof entry.participantCount === "number" ? entry.participantCount : asArray(entry.participants).length,
        sourceCount: typeof entry.sourceCount === "number" ? entry.sourceCount : 0,
        sourceNames: asArray(entry.sourceNames),
        participants: asArray(entry.participants).map(normalizeParticipant),
        spark: normalizeSpark(entry.spark),
        summary: entry.summary ?? null,
        latest: entry.latest ?? null,
        cover: rank === 1 ? resolveCover(entry) : null,
        images: undefined,
      };
    }),
  };
}

function normalizeCitation(raw, index = 0) {
  if (!raw || typeof raw !== "object") throw new Error(`report citation #${index + 1} must be an object`);
  if (typeof raw.title !== "string" || !raw.title) throw new Error(`report citation #${index + 1} is missing title`);
  return {
    itemId: raw.itemId ?? null,
    title: raw.title,
    summary: raw.summary ?? null,
    sourceName: String(raw.sourceName ?? "未署名"),
    sourceUrl: String(raw.sourceUrl ?? ""),
    sourceIconUrl: raw.sourceIconUrl ?? null,
    sourceIconSrcSet: raw.sourceIconSrcSet,
    firstParty: !!raw.firstParty,
    publishedAt: raw.publishedAt ?? null,
    available: raw.available !== false,
    otherSources: raw.otherSources,
    related: Array.isArray(raw.related) ? raw.related.map(normalizeCitation) : undefined,
    followUp: raw.followUp,
  };
}

export function normalizeDaily(raw) {
  if (!raw || typeof raw !== "object") throw new Error("daily.json must be an object");
  if (typeof raw.key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.key)) {
    throw new Error("daily.json key must be YYYY-MM-DD");
  }
  if (typeof raw.title !== "string" || !raw.title) throw new Error("daily.json title is required");
  const lead = raw.lead && typeof raw.lead === "object"
    ? { title: String(raw.lead.title ?? raw.title), leadParagraph: String(raw.lead.leadParagraph ?? "") }
    : raw.lead === null ? null : { title: raw.title, leadParagraph: String(raw.overview ?? "") };
  const leadItemId = raw.leadItemId ?? null;
  const highlights = asArray(raw.highlights).map(normalizeCitation);
  let sections = asArray(raw.sections).map((section) => ({
    label: String(section.label ?? "栏目"),
    summary: section.summary ?? null,
    items: asArray(section.items).map(normalizeCitation),
  }));
  // MIT ReportPaper only treats an item in sections as the lead. Lift it from highlights so a
  // headline + cover export is not rendered as a quiet day.
  if (leadItemId && !sections.some((section) => section.items.some((item) => item.itemId === leadItemId))) {
    const lifted = highlights.find((item) => item.itemId === leadItemId);
    if (lifted) sections = [{ label: "头条", summary: null, items: [lifted] }, ...sections];
  }
  return {
    kind: "daily",
    key: raw.key,
    issueNumber: typeof raw.issueNumber === "number" ? raw.issueNumber : 1,
    title: raw.title,
    generatedAt: raw.generatedAt ?? `${raw.key}T00:00:00.000Z`,
    lead,
    leadItemId,
    overview: raw.overview ?? null,
    highlights,
    sections,
    flashes: asArray(raw.flashes).map(normalizeCitation),
    cover: resolveCover(raw),
    metrics: raw.metrics && typeof raw.metrics === "object" ? raw.metrics : { totalEvents: 0 },
    readingMinutes: typeof raw.readingMinutes === "number" ? raw.readingMinutes : 3,
    prev: raw.prev ?? null,
    next: raw.next ?? null,
  };
}

export function normalizeDailyIndex(raw, daily) {
  const items = Array.isArray(raw) ? raw : asArray(raw?.items);
  if (items.length > 0) {
    return items.map((entry, i) => ({
      key: String(entry.key ?? ""),
      issueNumber: typeof entry.issueNumber === "number" ? entry.issueNumber : i + 1,
      title: entry.title ?? null,
      count: entry.count,
    })).filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.key));
  }
  if (!daily) return null;
  return [{
    key: daily.key,
    issueNumber: daily.issueNumber,
    title: daily.title,
    count: daily.metrics?.totalEvents,
  }];
}

export function applyImagePolicy(data) {
  return {
    ...data,
    hot: {
      ...data.hot,
      entries: data.hot.entries.map((entry) => ({
        ...entry,
        cover: entry.rank === 1 ? pickL2Cover(entry.cover) : null,
      })),
    },
    daily: {
      ...data.daily,
      cover: pickL2Cover(data.daily.cover),
    },
  };
}

export function resolveSiteData({ fixture, engine }) {
  const present = engine?.present ?? [];
  const source = dataSourceOf(present);

  const timeline = engine?.timeline != null ? normalizeTimeline(engine.timeline) : fixture.timeline;
  const hot = engine?.hot != null ? normalizeHot(engine.hot) : fixture.hot;
  const daily = engine?.daily != null ? normalizeDaily(engine.daily) : fixture.daily;

  let hotStrip = null;
  if (engine?.hotStrip != null) hotStrip = normalizeHotStrip(engine.hotStrip);
  else if (engine?.timeline != null && Array.isArray(engine.timeline.hot)) hotStrip = timeline.hot;
  else if (engine?.hot != null) hotStrip = stripFromHotEntries(hot.entries);
  else hotStrip = fixture.timeline.hot;

  const mergedTimeline = {
    ...timeline,
    hot: hotStrip,
  };

  const dailyIndex =
    engine?.dailyIndex != null || engine?.daily != null
      ? (normalizeDailyIndex(engine?.dailyIndex, daily) ?? fixture.dailyIndex)
      : fixture.dailyIndex;

  const today =
    (typeof engine?.meta?.today === "string" && engine.meta.today) ||
    (engine?.daily != null ? daily.key : null) ||
    fixture.today;

  return applyImagePolicy({
    source,
    present,
    timeline: mergedTimeline,
    hot,
    daily,
    dailyIndex,
    today,
  });
}

export function fixtureNote({ source, present, asOf }) {
  const notes = {
    fixture: "fixture mock · 热度/涨跌/spark/评分不是 48h 实算",
    mixed: "部分切片来自 data/engine JSON，缺的切片仍用 fixture",
    engine: "data/engine JSON · 热度/涨跌/spark 以导出为准",
  };
  return {
    site: "前沿趋势",
    asOf,
    source,
    engineFiles: present,
    note: notes[source] ?? notes.fixture,
    pages: ["index.html", "hot.html", "daily.html"],
  };
}
