/**
 * Public MIT page data. Prepared by the B0 loader (prerender writes virtual:ft-engine).
 * pages.tsx must call groupByEvent() on the timeline cards.
 */
import generated from "virtual:ft-engine";
import { groupByEvent } from "../../engine/groupByEvent.mjs";
import type { HotResponse, ReportDetail, ReportNavigationEntry, TimelineResponse } from "@aihot/contracts/site";

export const dataAsOf = generated.data_as_of || "";
export const builtAt = generated.built_at || "";
export const hasSelectedFeed = !!generated.hasSelectedFeed;
export const itemUrls = generated.itemUrls || {};

export const hot = generated.hot as HotResponse;
export const hotStrip = generated.hotStrip as TimelineResponse["hot"];
export const daily = (generated.daily || null) as ReportDetail | null;
export const dailyIndex = (generated.dailyIndex || []) as ReportNavigationEntry[];
export const today = daily?.key || "";

const cards = groupByEvent(generated.timeline?.cards || []) as TimelineResponse["cards"];

export const timeline: TimelineResponse = {
  filters: (generated.timeline?.filters || { channel: "all", category: null, tag: null }) as TimelineResponse["filters"],
  cards,
  nextCursor: generated.timeline?.nextCursor ?? null,
  hot: (generated.timeline?.hot as TimelineResponse["hot"]) || hotStrip,
  dayCounts: generated.timeline?.dayCounts || {},
};
