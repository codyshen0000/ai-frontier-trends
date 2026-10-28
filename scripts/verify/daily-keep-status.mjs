/**
 * Manual probe: calendar today vs KEEP tip, and the /daily/ status copy.
 *
 *   node --experimental-strip-types --no-warnings scripts/verify/daily-keep-status.mjs
 *   node --experimental-strip-types --no-warnings scripts/verify/daily-keep-status.mjs --base https://codyshen0000.github.io/ai-frontier-trends
 *
 * 404: today.json missing → 尚未生成
 * BELOW: today.json 200 but sources<14 or first_party<11 or flashes<20 → 未达发布门槛
 */
import { dayKey } from "../day-key.mjs";
import { dailyIssueMetrics, meetsPublishFloors, resolveDailyStatus } from "../mit-static/src/daily-status.ts";

const args = process.argv.slice(2);
const baseIdx = args.indexOf("--base");
const base = (baseIdx >= 0 ? args[baseIdx + 1] : "https://codyshen0000.github.io/ai-frontier-trends").replace(/\/$/, "");

const calendarToday = dayKey(Date.now());
const latestUrl = `${base}/api/v1/daily/latest.json`;
const todayUrl = `${base}/api/v1/daily/${calendarToday}.json`;

const latestRes = await fetch(latestUrl, { cache: "no-store" });
if (!latestRes.ok) {
  console.error(`tip probe failed: ${latestUrl} → ${latestRes.status}`);
  process.exit(1);
}
const latest = await latestRes.json();
const tipKey = latest.key;
const todayRes = await fetch(todayUrl, { cache: "no-store" });
const todayIssue = todayRes.ok ? await todayRes.json() : null;
const copy = resolveDailyStatus({
  calendarToday,
  tipKey,
  todayHttpStatus: todayRes.status,
  todayIssue,
});
const metrics = todayIssue ? dailyIssueMetrics(todayIssue) : null;

console.log(JSON.stringify({
  calendarToday,
  tipKey,
  todayUrl,
  todayHttpStatus: todayRes.status,
  todayMetrics: metrics,
  meetsFloors: todayIssue ? meetsPublishFloors(todayIssue) : false,
  expectedCopy: copy || "(none — today is tip, or today meets floors, or non-404 error)",
  howToVerify: {
    missing: `curl -s -o /dev/null -w '%{http_code}' ${base}/api/v1/daily/${calendarToday}.json  → 404, page shows 尚未生成`,
    below: "today.json 200 and sources<14 or first_party<11 or flashes<20, page shows 未达发布门槛",
    where: "/daily/ paper column, [data-ft-daily-status], tip date as M月D日 not 今天",
  },
}, null, 2));
