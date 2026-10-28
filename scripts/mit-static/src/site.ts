/**
 * Public MIT page data. Prepared by the B0 loader (prerender writes virtual:ft-engine).
 * pages.tsx must call groupByEvent() on the timeline cards.
 */
import generated from "virtual:ft-engine";
import { groupByEvent } from "../../engine/groupByEvent.mjs";
import { indexDailyCites } from "../../engine/card-summary.mjs";
import { dayKey } from "../../day-key.mjs";
import type { HotResponse, ReportDetail, ReportNavigationEntry, TimelineResponse } from "@aihot/contracts/site";
import type { SiteEvent, SiteItemPublic, SiteTopic } from "../../engine/site-data.ts";

export const dataAsOf = generated.data_as_of || "";
export const builtAt = generated.built_at || "";
export const hasSelectedFeed = !!generated.hasSelectedFeed;
export const itemUrls = generated.itemUrls || {};

export const hot = generated.hot as HotResponse;
export const hotStrip = generated.hotStrip as TimelineResponse["hot"];
export const daily = (generated.daily || null) as ReportDetail | null;
export const dailies = (generated.dailies || []) as ReportDetail[];
export const dailyIndex = (generated.dailyIndex || []) as ReportNavigationEntry[];
export const weeklyIndex = (generated.weeklyIndex || []) as ReportNavigationEntry[];
export const monthlyIndex = (generated.monthlyIndex || []) as ReportNavigationEntry[];
/** Calendar today in Asia/Shanghai from the build stamp — not the KEEP tip key. */
export const today = dayKey(dataAsOf);

export function dailyByKey(key: string): ReportDetail | null {
  if (!key) return null;
  if (daily?.key === key) return daily;
  return dailies.find((row) => row.key === key) || null;
}

export const events = (generated.events || []) as SiteEvent[];
export const dailyByItemId = indexDailyCites([daily, ...dailies]);

type LooseItem = Partial<SiteItemPublic> & {
  id?: string;
  title?: string;
  sourceName?: string;
  eventPublicId?: string;
};

function asItem(raw: LooseItem | null | undefined, extra: Partial<SiteItemPublic> = {}): SiteItemPublic | null {
  if (!raw?.id || !raw.title) return null;
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const topics = Array.isArray(raw.topics) && raw.topics.length
    ? raw.topics
    : tags.map((name) => ({ slug: name, name }));
  return {
    id: raw.id,
    title: raw.title,
    originalTitle: raw.originalTitle ?? null,
    summary: raw.summary ?? null,
    reason: raw.reason ?? null,
    source: raw.source || { name: raw.sourceName || "" },
    originalUrl: raw.originalUrl,
    publishedAt: raw.publishedAt ?? null,
    timelineAt: raw.timelineAt || raw.publishedAt || "",
    category: raw.category ?? null,
    tags,
    selected: !!raw.selected,
    channel: raw.channel === "x" ? "x" : "news",
    x: raw.x ?? null,
    storyPublicId: raw.storyPublicId || extra.storyPublicId || raw.eventPublicId,
    handle: raw.handle ?? raw.x?.handle ?? null,
    topics,
    hasTranslation: !!raw.hasTranslation,
    bodyLanguage: raw.bodyLanguage,
    readingMode: raw.readingMode,
    body: raw.body ?? null,
    relatedStories: raw.relatedStories,
  };
}

function collectItems(): SiteItemPublic[] {
  const seen = new Map<string, SiteItemPublic>();
  const add = (item: SiteItemPublic | null) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.set(item.id, item);
  };
  for (const item of (generated.items || []) as LooseItem[]) add(asItem(item));
  for (const card of generated.timeline?.cards || []) add(asItem((card as { item?: LooseItem }).item));
  for (const card of generated.allTimeline?.cards || []) add(asItem((card as { item?: LooseItem }).item));
  for (const event of events) {
    for (const row of event.timeline || []) add(asItem(row as LooseItem, { storyPublicId: event.publicId }));
    for (const row of event.officialReports || []) add(asItem(row as LooseItem, { storyPublicId: event.publicId }));
  }
  return [...seen.values()];
}

function collectTopics(fromItems: SiteItemPublic[]): SiteTopic[] {
  if ((generated.topics || []).length) return generated.topics as SiteTopic[];
  const counts = new Map<string, SiteTopic>();
  const bump = (name: string, slug?: string) => {
    const key = String(name || "").trim();
    if (!key) return;
    const cur = counts.get(key);
    if (cur) cur.count += 1;
    else counts.set(key, { slug: slug || key, name: key, count: 1 });
  };
  for (const item of fromItems) {
    for (const topic of item.topics || []) bump(topic.name, topic.slug);
    for (const tag of item.tags || []) bump(tag);
  }
  for (const event of events) {
    for (const topic of event.topics || []) bump(topic.name, topic.slug);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh"));
}

/** Production 1.1 may omit items.json / topics.json; project from cards + events only. */
export const items = collectItems();
export const topics = collectTopics(items);

const groupOpts = { events, redirects: generated.redirects, sources: [], dailyByItemId };

const cards = groupByEvent(generated.timeline?.cards || [], groupOpts) as TimelineResponse["cards"];

export const timeline: TimelineResponse = {
  filters: (generated.timeline?.filters || { channel: "all", category: null, tag: null }) as TimelineResponse["filters"],
  cards,
  nextCursor: generated.timeline?.nextCursor ?? null,
  hot: (generated.timeline?.hot as TimelineResponse["hot"]) || hotStrip,
  dayCounts: generated.timeline?.dayCounts || {},
};

const allRaw = generated.allTimeline?.cards?.length ? generated.allTimeline.cards : generated.timeline?.cards || [];
export const allTimeline: TimelineResponse = {
  filters: (generated.allTimeline?.filters || { channel: "all", category: null, tag: null }) as TimelineResponse["filters"],
  cards: groupByEvent(allRaw, groupOpts) as TimelineResponse["cards"],
  nextCursor: generated.allTimeline?.nextCursor ?? null,
  hot: null,
  dayCounts: generated.allTimeline?.dayCounts || {},
};

export const itemById = new Map(items.map((item) => [item.id, item]));
export const eventById = new Map(events.map((event) => [event.publicId, event]));
export const itemIds = new Set(items.map((item) => item.id));
export const eventIds = new Set(events.map((event) => event.publicId));
