#!/usr/bin/env node
/**
 * RETIRED (Task #57). Default-off.
 *
 * heat48h.py now ports scripts/engine/heat.mjs, so exports already match
 * b2-hot-recompute. Do not rewrite hot.json after export.
 *
 * Emergency rollback only:
 *   ALIGN_HOT_SPARKS=1 node scripts/site-data/align_hot_sparks_to_js.mjs <out-dir>
 *
 * Removal path: delete this file after one green R1 / b2-hot-recompute
 * without the flag. Do not re-enable in cron.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoHeat = join(here, "..", "engine", "heat.mjs");

if (process.env.ALIGN_HOT_SPARKS !== "1") {
  console.log(
    JSON.stringify({
      retired: true,
      rewritten: false,
      reason: "ALIGN_HOT_SPARKS!=1; heat48h.py matches heat.mjs; no post-align",
    }),
  );
  process.exit(0);
}

const dir = process.argv[2] || "out";
const siteHeat = process.env.SITE_HEAT_MJS || repoHeat;
const { verifyEngineHeat } = await import(pathToFileURL(siteHeat).href);
const result = verifyEngineHeat(dir);
if (!result.recomputed?.length) {
  console.error("no recomputed entries", result);
  process.exit(1);
}
const hotPath = `${dir.replace(/\/$/, "")}/hot.json`;
const hot = JSON.parse(readFileSync(hotPath, "utf8"));
const byId = new Map(result.recomputed.map((r) => [r.publicId, r]));
let fixed = 0;
for (const entry of hot.entries) {
  const next = byId.get(entry.story.publicId);
  if (!next) continue;
  entry.spark = next.spark;
  if (next.heat != null) entry.heat = next.heat;
  if (next.trend) entry.trend = next.trend;
  if (next.trendPct != null) entry.trendPct = next.trendPct;
  if (Array.isArray(next.badges)) entry.badges = next.badges;
  fixed++;
}
writeFileSync(hotPath, JSON.stringify(hot, null, 1) + "\n");
const after = verifyEngineHeat(dir);
console.log(JSON.stringify({ retired: false, fixed, beforeOk: result.ok, afterOk: after.ok, issues: after.issues?.length || 0 }));
process.exit(after.ok ? 0 : 1);
