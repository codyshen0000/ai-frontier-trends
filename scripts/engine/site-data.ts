/**
 * Site-data 1.1 shapes consumed by B1 (render/export) and B2 (heat check / merge / redirects).
 *
 * Source of field names: SITE-DATA-CONTRACT 1.1. These types add fields to the MIT
 * site contracts; they do not rename or drop MIT fields, except that **no public
 * shape includes a `score` key** (or score_avg / attention_score / gate scores).
 *
 * Cover class: PRD `official_diagram` and contract §3.3 `official_explainer` are
 * the same valid class; both must be accepted.
 *
 * Runtime validation: `scripts/engine/loader.mjs`. Do not edit existing MIT
 * `vendor/mit/packages/contracts/src/site.ts` in B0 (phase 2 may re-export).
 */

/** Public category keys (content_type → category). */
export type SiteCategoryKey =
  | "model"
  | "product"
  | "industry"
  | "paper"
  | "tutorial"
  | "opinion";

export type SiteChannelKey = "all" | "news" | "x" | "firstParty";

export type SiteTrend = "up" | "down" | "flat" | "new" | "unknown";

export type SiteHotBadge = "surge" | "new" | "rising";

export type SiteStoryStatus = "active" | "watching" | "settled";

/**
 * v5 value-gate classes on `cover.valueClass`.
 * `official_diagram` (PRD) and `official_explainer` (contract §3.3) are aliases.
 */
export const COVER_VALUE_CLASSES = [
  "model_sample",
  "paper_figure",
  "product_screenshot",
  "official_diagram",
  "official_explainer",
] as const;

export type CoverValueClass = (typeof COVER_VALUE_CLASSES)[number];

export const OFFICIAL_DIAGRAM_ALIASES = ["official_diagram", "official_explainer"] as const;

export type OfficialDiagramClass = (typeof OFFICIAL_DIAGRAM_ALIASES)[number];

export function isOfficialDiagramClass(value: string | null | undefined): value is OfficialDiagramClass {
  return value === "official_diagram" || value === "official_explainer";
}

export function isAcceptedCoverClass(value: string | null | undefined): value is CoverValueClass {
  return (
    value === "model_sample" ||
    value === "paper_figure" ||
    value === "product_screenshot" ||
    isOfficialDiagramClass(value)
  );
}

export interface SiteSourceRef {
  name: string;
}

export interface SiteCover {
  url: string;
  srcSet?: string;
  width: number | null;
  height: number | null;
  alt: string;
  /** Canonical 1.1 field. */
  valueClass?: CoverValueClass;
  /** Input alias from R2 `value_class`. */
  value_class?: CoverValueClass;
  /** Product-name alias `value_category`. */
  value_category?: CoverValueClass;
}

export interface SiteHotParticipant {
  name: string;
  kind: "editorial" | "signal";
  iconUrl?: string | null;
  iconSrcSet?: string;
}

/**
 * Timeline / feed card item (MIT FeedItemSummary **without** `score`).
 * Extension fields are omitted entirely when there is no data.
 */
export interface SiteFeedItem {
  id: string;
  title: string;
  summary: string | null;
  reason: string | null;
  source: SiteSourceRef;
  publishedAt: string | null;
  timelineAt: string;
  category: SiteCategoryKey | null;
  tags: string[];
  selected: boolean;
  channel: "news" | "x";
  x: SiteFeedXView | null;
  sameEvent?: { id: string; title: string } | null;
  originalUrl?: string;
  originalTitle?: string | null;
  storyPublicId?: string;
  belowThreshold?: true;
  /** B2 display fields; MIT hot cards already render these. */
  sourceCount?: number;
  sourceNames?: string[];
  participants?: SiteHotParticipant[];
  /** Public-layer AI 评分. Never a `score` key. */
  aiRating?: number;
}

export interface SiteFeedXView {
  authorName: string;
  handle: string;
  avatarUrl: string | null;
  avatarSrcSet?: string;
  media: Array<{
    kind: "image" | "video";
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
    poster: string | null;
  }>;
  quoted: { authorName: string; handle: string; text: string; translation: string | null } | null;
}

export interface SiteGroupInfo {
  factId: string;
  additionalSourceCount: number;
  reportCount: number;
  memberIds?: string[];
}

export interface SiteTimelineCard {
  key: string;
  anchorAt: string;
  item: SiteFeedItem;
  group: SiteGroupInfo | null;
}

export interface SiteTimelineFilters {
  channel: SiteChannelKey;
  category: SiteCategoryKey | null;
  tag: string | null;
}

export interface SiteHotStripEntry {
  rank: number;
  title: string;
  heat: number;
  trend: SiteTrend;
  storyPublicId: string | null;
  itemId: string | null;
  participants: SiteHotParticipant[];
  participantCount: number;
}

/** MIT TimelineResponse + 1.1 pagination fields. */
export interface SiteTimelinePage {
  filters: SiteTimelineFilters;
  cards: SiteTimelineCard[];
  nextCursor: string | null;
  hot: SiteHotStripEntry[] | null;
  dayCounts: Record<string, number>;
  page?: number;
  pageCount?: number;
  total?: number;
}

export interface SiteTimelineIndex {
  page_size?: number;
  pageCount?: number;
  pages?: number;
  total?: number;
  data_as_of?: string;
  built_at?: string;
}

export interface SiteHotEntry {
  rank: number;
  story: { publicId: string; title: string };
  heat: number;
  trend: SiteTrend;
  trendPct: number | null;
  badges: SiteHotBadge[];
  participantCount: number;
  sourceCount: number;
  sourceNames: string[];
  participants: SiteHotParticipant[];
  spark: Array<number | null>;
  summary: string | null;
  latest: string | null;
  cover: SiteCover | null;
  rankDelta?: number;
  heatDeltaPct?: number;
  belowThreshold?: true;
}

export interface SiteHotResponse {
  computedAt: string | null;
  windowHours: number;
  limit?: number;
  entries: SiteHotEntry[];
}

export interface SiteReportCitation {
  itemId: string | null;
  title: string;
  summary: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceIconUrl: string | null;
  sourceIconSrcSet?: string;
  firstParty: boolean;
  publishedAt: string | null;
  available: boolean;
  otherSources?: number;
  related?: SiteReportCitation[];
  followUp?: string;
}

export interface SiteDailyCover extends SiteCover {
  caption: string | null;
}

/** MIT ReportDetail for daily issues. */
export interface SiteDailyReport {
  kind: "daily";
  key: string;
  issueNumber: number;
  title: string;
  generatedAt: string;
  lead: { title: string; leadParagraph: string } | null;
  leadItemId: string | null;
  overview: string | null;
  highlights: SiteReportCitation[];
  sections: Array<{ label: string; summary: string | null; items: SiteReportCitation[] }>;
  flashes: SiteReportCitation[];
  cover: SiteDailyCover | null;
  metrics: Record<string, number>;
  readingMinutes: number;
  prev: string | null;
  next: string | null;
}

export interface SiteDailyIndexEntry {
  key: string;
  issueNumber: number;
  title?: string | null;
  count?: number;
}

export interface SiteHeatPoint {
  hour: string;
  heat: number;
  participants: number;
}

export interface SiteStoryReport {
  id: string;
  title: string;
  summary: string | null;
  source: SiteSourceRef & { firstParty: boolean };
  publishedAt: string;
  selected: boolean;
  originalUrl?: string;
}

export interface SiteStoryFact {
  factId: string;
  title: string;
  firstReportAt: string;
  reportCount: number;
  representative: SiteStoryReport;
}

/**
 * Event page (MIT StoryDetail + 1.1 extensions). No `story.score`.
 * `publicId` is the R2 event id (`YYYY-MM-DD-slug`).
 */
export interface SiteEvent {
  publicId: string;
  title: string;
  status: SiteStoryStatus;
  reportCount: number;
  sourceCount: number;
  firstReportAt: string | null;
  latestAt: string | null;
  digest: string | null;
  digestUpdatedAt: string | null;
  summary: string | null;
  excerpt: { text: string; sourceName: string } | null;
  latest: string | null;
  latestReport: { id: string } | null;
  whyHot: {
    participants48h: number;
    newParticipants6h: number;
    recentReports24h: number;
    observationComplete: boolean;
    rank: number | null;
  };
  developments: SiteStoryFact[];
  officialReports: SiteStoryReport[];
  timeline: SiteStoryReport[];
  heat: SiteHeatPoint[];
  related: Array<{ publicId: string; title: string; relation: "storyline" | "related" }>;
  topics: Array<{ slug: string; name: string }>;
  recommendReason?: string;
  cover?: SiteCover | null;
  claim?: "rumor";
  primaryUrl?: string;
  rankDelta?: number;
  belowThreshold?: true;
  participants?: SiteHotParticipant[];
}

export interface SiteEventsIndexEntry {
  publicId: string;
  title?: string;
}

export interface SiteEventsIndex {
  items: SiteEventsIndexEntry[];
}

/** `merged_into` / `merged_from` → static redirect pages (B2). */
export interface SiteRedirect {
  from: string;
  to: string;
  via?: "merged_into" | "merged_from";
}

export interface SiteSourceRow {
  sourceId: string;
  name: string;
  tier?: string;
  kind?: string;
  homepage?: string | null;
}

export interface SiteFeedSourceItem {
  guid: string;
  title: string;
  summary: string | null;
  originalUrl?: string;
  pubDate: string;
  sourceName: string;
  category: SiteCategoryKey | null;
  categoryLabel?: string;
  eventPublicId?: string;
}

export interface SiteFeedSource {
  feed: {
    id: string;
    path: string;
    title: string;
    limit: number;
    description?: string;
  };
  items: SiteFeedSourceItem[];
}

/**
 * Engine `meta.json`.
 * `data_as_of` = latest collected batch time (not export time).
 * `built_at` = site convention for export/build time; contract name is `generated_at`.
 * Loader requires `data_as_of` and at least one of `built_at` | `generated_at`.
 */
export interface SiteEngineMeta {
  data_as_of: string;
  data_as_of_label?: string;
  built_at?: string;
  generated_at?: string;
  next_round?: string;
  hot_rule_version?: string;
  hot_computed_at?: string;
  window_hours?: number;
  spark_points?: number;
  page_size?: number;
  counts?: Record<string, number>;
  last_round?: unknown;
  batches?: unknown;
  mode?: "production" | "preview" | "synthetic";
  files?: string[];
}

export interface SiteSearchDoc {
  kind: "event" | "item";
  id: string;
  title: string;
  summary: string | null;
  publishedAt?: string;
  sourceNames?: string[];
  sourceName?: string;
  path?: string;
  category?: SiteCategoryKey | null;
  selected?: boolean;
  eventPublicId?: string;
  originalUrl?: string;
}

export interface SiteSearchSource {
  generatedAt: string;
  docs: SiteSearchDoc[];
}

/** Public item detail. No `score`. Body is only present when the engine supplied it. */
export interface SiteItemPublic {
  id: string;
  title: string;
  originalTitle?: string | null;
  summary: string | null;
  reason: string | null;
  source: SiteSourceRef;
  originalUrl?: string;
  publishedAt: string | null;
  timelineAt: string;
  category: SiteCategoryKey | null;
  tags: string[];
  selected: boolean;
  channel: "news" | "x";
  x: SiteFeedXView | null;
  storyPublicId?: string;
  handle?: string | null;
  topics: Array<{ slug: string; name: string }>;
  hasTranslation: boolean;
  bodyLanguage?: "zh" | "original";
  readingMode?: "full" | "summary-only";
  body: {
    zh: string | null;
    original: string | null;
    zhKind: "translation" | "original" | null;
    complete: boolean;
  } | null;
  relatedStories?: Array<{ publicId: string; title: string }>;
}

export interface SiteTopic {
  slug: string;
  name: string;
  count: number;
}

/**
 * Typed object returned by `loadEngineData()`.
 * `data_as_of` / `built_at` are always resolved strings (built_at falls back to generated_at).
 */
export interface EngineBundle {
  dir: string;
  meta: SiteEngineMeta;
  data_as_of: string;
  built_at: string;
  hot: SiteHotResponse;
  hotStrip: SiteHotStripEntry[];
  daily: SiteDailyReport | null;
  dailyIndex: SiteDailyIndexEntry[];
  dailies: SiteDailyReport[];
  feed: SiteFeedSource | null;
  feedItems: SiteFeedSourceItem[];
  events: SiteEvent[];
  eventsIndex: SiteEventsIndexEntry[];
  timeline: SiteTimelinePage | null;
  timelineIndex: SiteTimelineIndex | null;
  redirects: SiteRedirect[];
  sources: SiteSourceRow[];
  search: SiteSearchSource | null;
  items: SiteItemPublic[];
  topics: SiteTopic[];
  allTimeline: SiteTimelinePage | null;
  weeklyIndex: SiteDailyIndexEntry[];
  monthlyIndex: SiteDailyIndexEntry[];
}

/** Thrown by the loader so `build.mjs` (phase 2) can catch and fall back. */
export interface EngineDataErrorShape {
  name: "EngineDataError";
  code: string;
  path?: string;
  message: string;
}
