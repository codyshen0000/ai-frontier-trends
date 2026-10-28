import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DAILY_PUBLISH_FLOORS,
  dailyIssueMetrics,
  dailyStatusBannerHtml,
  dailyStatusCopy,
  meetsPublishFloors,
  resolveDailyStatus,
  tipMonthDay,
} from "./daily-status.ts";

assert.deepEqual(DAILY_PUBLISH_FLOORS, { sources: 14, firstParty: 11, flashes: 20 });
assert.equal(tipMonthDay("2026-10-24"), "10月24日");
assert.equal(tipMonthDay("2026-01-05"), "1月5日");
assert.equal(tipMonthDay("bad"), "");

assert.equal(
  dailyStatusCopy("missing", "2026-10-24"),
  "今日日报尚未生成，当前展示最近达标日（10月24日）",
);
assert.equal(
  dailyStatusCopy("below", "2026-10-24"),
  "今日日报未达发布门槛，当前展示最近达标日（10月24日）",
);
assert.equal(dailyStatusCopy("below", ""), "");

const pass = {
  metrics: { sourcesCount: 14, firstPartyEvents: 11 },
  flashes: Array.from({ length: 20 }, (_, i) => ({ title: `f${i}` })),
};
const below = {
  metrics: { sourcesCount: 11, firstPartyEvents: 11 },
  flashes: Array.from({ length: 10 }, (_, i) => ({ title: `t${i}` })),
};

assert.deepEqual(dailyIssueMetrics(below), { sources: 11, firstParty: 11, flashes: 10 });
assert.equal(meetsPublishFloors(pass), true);
assert.equal(meetsPublishFloors(below), false);
assert.equal(meetsPublishFloors({ metrics: { sourcesCount: 14, firstPartyEvents: 11 }, flashes: Array(19) }), false);
assert.equal(meetsPublishFloors({ metrics: { sourcesCount: 13, firstPartyEvents: 11 }, flashes: Array(20) }), false);
assert.equal(meetsPublishFloors({ metrics: { sourcesCount: 14, firstPartyEvents: 10 }, flashes: Array(20) }), false);
assert.equal(meetsPublishFloors(null), false);

assert.equal(
  resolveDailyStatus({
    calendarToday: "2026-10-28",
    tipKey: "2026-10-24",
    todayHttpStatus: 404,
  }),
  "今日日报尚未生成，当前展示最近达标日（10月24日）",
);
assert.equal(
  resolveDailyStatus({
    calendarToday: "2026-10-28",
    tipKey: "2026-10-24",
    todayHttpStatus: 200,
    todayIssue: below,
  }),
  "今日日报未达发布门槛，当前展示最近达标日（10月24日）",
);
assert.equal(
  resolveDailyStatus({
    calendarToday: "2026-10-28",
    tipKey: "2026-10-24",
    todayHttpStatus: 200,
    todayIssue: pass,
  }),
  "",
  "at/above floors but not tip: KEEP, no banner",
);
assert.equal(
  resolveDailyStatus({
    calendarToday: "2026-10-24",
    tipKey: "2026-10-24",
    todayHttpStatus: 404,
  }),
  "",
  "calendar today is tip: no banner",
);
assert.equal(
  resolveDailyStatus({
    calendarToday: "2026-10-28",
    tipKey: "2026-10-24",
    todayIssue: null,
  }),
  "今日日报尚未生成，当前展示最近达标日（10月24日）",
);
assert.equal(
  resolveDailyStatus({
    calendarToday: "2026-10-28",
    tipKey: "2026-10-24",
    todayHttpStatus: 500,
  }),
  "",
  "non-404/200 transport errors stay silent",
);

const html = dailyStatusBannerHtml("今日日报尚未生成，当前展示最近达标日（10月24日）");
assert.match(html, /data-ft-daily-status/);
assert.match(html, /role="status"/);
assert.match(html, /ft-daily-status/);
assert.match(html, /尚未生成/);
assert.equal(dailyStatusBannerHtml(""), "");

const here = dirname(fileURLToPath(import.meta.url));
const pages = readFileSync(join(here, "pages.tsx"), "utf8");
const hydrate = readFileSync(join(here, "client/hydrate.ts"), "utf8");
const site = readFileSync(join(here, "site.ts"), "utf8");
assert.match(pages, /data-ft-daily-status-host/, "tip /daily/ renders a status host");
assert.match(pages, /!dated/, "dated /daily/YYYY-MM-DD/ pages skip the host");
assert.match(hydrate, /bindDailyStatus/, "hydrate re-checks today.json vs tip");
assert.match(hydrate, /api\/v1\/daily\/\$\{/, "hydrate fetches api/v1/daily/<today>.json");
assert.match(site, /dayKey\(dataAsOf\)/, "today is calendar day from dataAsOf, not tip key");

console.log("daily-status.test.ts ok");
