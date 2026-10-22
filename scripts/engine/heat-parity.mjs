/**
 * JS side of the py↔JS heat/spark parity fixture.
 *
 * Fixture: scripts/engine/__samples__/heat-parity/cases.json
 * Python check (opt-in, not a verify:ia gate): scripts/verify/heat-py-parity.py
 * Numeric contract: docs/SITE-DATA-CONTRACT.md
 *
 * This module does not change heat.mjs. Full py port / align_hot_sparks_to_js
 * retirement is the 10–12h follow-on, not this slice.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  displayHeat,
  participantKeyFromReport,
  recomputeEntry,
  trendOf,
  uniqueParticipants,
} from "./heat.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export const HEAT_PARITY_FIXTURE = join(here, "__samples__", "heat-parity", "cases.json");

export const REQUIRED_COVERS = [
  "48h-boundary",
  "rounding-half",
  "trend-plus-10",
  "trend-minus-10",
  "key-collision",
  "heat-equals-spark-endpoint",
];

export function loadHeatParityFixture(path = HEAT_PARITY_FIXTURE) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function jsParticipantsFromFixture(rows) {
  return uniqueParticipants(
    (rows || []).map((row) => ({
      key: participantKeyFromReport(row),
      name: row.name,
      kind: row.kind,
      lastAt: row.lastAt ?? row.publishedAt,
      firstAt: row.firstAt ?? row.publishedAt ?? row.lastAt,
    })),
  );
}

export function runJsParityCase(spec) {
  if (spec.mode === "displayHeat") {
    const heat = displayHeat(spec.raw);
    return {
      heat,
      sparkLast: null,
      trend: null,
      trendPct: null,
      badges: [],
      participantCount: 0,
      heatEqualsSparkEndpoint: null,
    };
  }
  if (spec.mode === "trendOf") {
    const { trend, trendPct } = trendOf(spec.curHeat, spec.prevHeat, spec.existedBefore !== false);
    return {
      heat: spec.curHeat,
      prevHeat: spec.prevHeat,
      sparkLast: null,
      trend,
      trendPct,
      badges: [],
      participantCount: 0,
      heatEqualsSparkEndpoint: null,
    };
  }
  const participants = jsParticipantsFromFixture(spec.participants);
  const row = recomputeEntry(participants, spec.at);
  const sparkLast = row.spark.at(-1);
  return {
    heat: row.heat,
    prevHeat: row.prevHeat,
    spark: row.spark,
    sparkLast,
    trend: row.trend,
    trendPct: row.trendPct,
    badges: row.badges,
    participantCount: row.participantCount,
    keys: participants.map((p) => p.key),
    heatEqualsSparkEndpoint: row.heat === sparkLast,
  };
}
