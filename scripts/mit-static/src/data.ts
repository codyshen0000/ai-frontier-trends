import { enginePayload } from "virtual:engine-data";
import { resolveSiteData } from "../engine.mjs";
import { daily as fixtureDaily, dailyIndex as fixtureDailyIndex, hot as fixtureHot, timeline as fixtureTimeline, today as fixtureToday } from "./fixture";

const resolved = resolveSiteData({
  fixture: {
    timeline: fixtureTimeline,
    hot: fixtureHot,
    daily: fixtureDaily,
    dailyIndex: fixtureDailyIndex,
    today: fixtureToday,
  },
  engine: enginePayload,
});

export const timeline = resolved.timeline;
export const hot = resolved.hot;
export const daily = resolved.daily;
export const dailyIndex = resolved.dailyIndex;
export const today = resolved.today;
export const dataSource = resolved.source;
export const engineFiles = resolved.present;
export const asOfLabel = resolved.asOfLabel;
export const asOf = resolved.asOf;
export const passedCount = resolved.passedCount;
export const fillCount = resolved.fillCount;
export const fillLabel = resolved.fillLabel;
