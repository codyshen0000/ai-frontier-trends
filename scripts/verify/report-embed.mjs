/** report.html charts are WebP data URIs; no external image src. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertStandaloneReportCharts,
  collectReportImageSrcs,
  embedWeeklyChartsAsDataUri,
} from "../weekly_charts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const weeklyDir = join(root, "dist", "weekly");

{
  const webp = Buffer.from("webpfake");
  const html = embedWeeklyChartsAsDataUri(
    '<picture><source type="image/webp" srcset="charts/demo.webp"><img alt="demo" src="charts/demo.png"></picture>',
    [{ webpName: "demo.webp", pngName: "demo.png", webp }],
  );
  assertStandaloneReportCharts(html, [{ webpName: "demo.webp", pngName: "demo.png", webp }]);
  assert.throws(
    () => assertStandaloneReportCharts('<img alt="demo" src="charts/demo.png">'),
    /external image src/,
  );
}

const dates = readdirSync(weeklyDir).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name));
assert.ok(dates.length, "dist has weekly issues");
for (const date of dates) {
  const report = readFileSync(join(weeklyDir, date, "report.html"), "utf8");
  const online = readFileSync(join(weeklyDir, date, "index.html"), "utf8");
  assertStandaloneReportCharts(report);
  const srcs = collectReportImageSrcs(report);
  assert.ok(srcs.length, `${date}/report.html has charts`);
  for (const src of srcs) {
    assert.ok(src.startsWith("data:image/webp;base64,"), `${date} chart is WebP data URI`);
    assert.ok(!/^https?:/i.test(src) && !src.startsWith("charts/"), `${date} chart is not an external src`);
  }
  assert.match(report, /<picture><source type="image\/webp" srcset="data:image\/webp;base64,/);
  assert.match(online, /srcset="charts\/[^"]+\.webp"/);
  assert.doesNotMatch(online, /srcset="data:image\/webp;base64,/);
}

console.log(`verify/report-embed: ${dates.length} report.html files embed WebP data URIs; online weekly keeps file WebP`);
