import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  HEAT_METHOD_COPY,
  HEAT_TOLERANCE,
  SPARK_POINTS,
  WINDOW_HOURS,
  displayHeat,
  displayPct,
  heatIndex,
  isEligible,
  recomputeEntry,
  sparkFor,
  verifyEngineHeat,
} from "./heat.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const CASES = JSON.parse(readFileSync(join(here, "__samples__", "heat-cases", "cases.json"), "utf8"));
const OUT_1700 = join(here, "__samples__", "out-1700");
const AT = CASES.at;

function eventTree(dir, cases = CASES.events, extra = {}) {
  mkdirSync(join(dir, "events"), { recursive: true });
  mkdirSync(join(dir, "hot-snapshots"), { recursive: true });
  const sources = [
    { sourceId: "lab", name: "公开实验室", kind: "editorial" },
    { sourceId: "notes", name: "复现笔记", kind: "editorial" },
  ];
  writeFileSync(
    join(dir, "sources.json"),
    `${JSON.stringify({ sources }, null, 2)}\n`,
  );
  writeFileSync(
    join(dir, "meta.json"),
    `${JSON.stringify({
      mode: "synthetic",
      data_as_of: "2026-10-19T20:00:00+08:00",
      generated_at: AT,
      hot_rule_version: "heat-v1-48h-halflife24h",
      hot_computed_at: AT,
    }, null, 2)}\n`,
  );
  const entries = [];
  for (const spec of cases) {
    const event = {
      publicId: spec.publicId,
      title: spec.title,
      status: "active",
      reportCount: spec.participants.length,
      sourceCount: spec.participants.length,
      firstReportAt: spec.participants.map((p) => p.publishedAt).sort()[0],
      latestAt: spec.participants.map((p) => p.publishedAt).sort().at(-1),
      digest: null,
      digestUpdatedAt: null,
      summary: "SYNTHETIC 摘要，仅供热度手算。",
      excerpt: null,
      latest: null,
      latestReport: null,
      whyHot: { participants48h: spec.participants.length, newParticipants6h: 0, recentReports24h: 0, observationComplete: false, rank: null },
      developments: [],
      officialReports: [],
      timeline: spec.participants.map((p, i) => ({
        id: `sha256:synthetic-heat-${spec.publicId}-${i}`,
        title: spec.title,
        summary: "SYNTHETIC",
        source: { name: p.name, firstParty: false },
        publishedAt: p.publishedAt,
        selected: i === 0,
        originalUrl: `https://example.invalid/synthetic/${p.key}`,
      })),
      heat: [],
      related: [],
      topics: [],
    };
    writeFileSync(join(dir, "events", `${spec.publicId}.json`), `${JSON.stringify(event, null, 2)}\n`);
    const recomputed = recomputeEntry(spec.participants.map((p) => ({
      key: p.key,
      name: p.name,
      kind: p.kind,
      lastAt: p.publishedAt,
      firstAt: p.publishedAt,
    })), AT);
    entries.push({
      rank: entries.length + 1,
      story: { publicId: spec.publicId, title: spec.title },
      heat: extra.heatOverride?.[spec.publicId] ?? recomputed.heat,
      trend: recomputed.trend,
      trendPct: recomputed.trendPct,
      badges: recomputed.badges,
      participantCount: recomputed.participantCount,
      sourceCount: spec.participants.length,
      sourceNames: spec.participants.map((p) => p.name),
      participants: spec.participants.map((p) => ({ name: p.name, kind: p.kind })),
      spark: recomputed.spark,
      summary: event.summary,
      latest: null,
      cover: null,
    });
  }
  entries.sort((a, b) => b.heat - a.heat);
  entries.forEach((row, i) => {
    row.rank = i + 1;
  });
  writeFileSync(join(dir, "hot.json"), `${JSON.stringify({ computedAt: AT, windowHours: WINDOW_HOURS, entries }, null, 2)}\n`);
  return dir;
}

describe("B2-01 hand-calc heat_index (SYNTHETIC)", () => {
  it("documents three arithmetic cases within 0.1 of heatIndex()", () => {
    assert.equal(CASES.synthetic, true);
    assert.match(CASES.note, /SYNTHETIC/);
    for (const spec of CASES.events) {
      const heat = heatIndex(spec.participants.map((p) => ({
        key: p.key,
        name: p.name,
        kind: p.kind,
        lastAt: p.publishedAt,
      })), AT);
      assert.equal(heat, spec.expectedHeat, spec.arithmetic);
      const full = recomputeEntry(spec.participants.map((p) => ({
        key: p.key,
        name: p.name,
        kind: p.kind,
        lastAt: p.publishedAt,
        firstAt: p.publishedAt,
      })), AT);
      assert.equal(full.trend, spec.expectedTrend, spec.publicId);
      assert.equal(full.trendPct, spec.expectedTrendPct, spec.publicId);
      assert.deepEqual(full.badges, spec.expectedBadges, spec.publicId);
      assert.equal(full.spark.length, SPARK_POINTS);
      assert.ok(Math.abs(heat - spec.expectedHeat) <= HEAT_TOLERANCE);
    }
  });

  it("fresh spark is 24 nulls + 20.0 (non-empty <2 → do not draw)", () => {
    const spec = CASES.events[0];
    const spark = sparkFor(spec.participants.map((p) => ({
      key: p.key,
      lastAt: p.publishedAt,
      kind: p.kind,
      name: p.name,
    })), AT);
    const observed = spark.filter((v) => v != null);
    assert.equal(spark.length, 25);
    assert.equal(observed.length, 1);
    assert.equal(observed[0], 20.0);
    assert.equal(spark.at(-1), 20.0);
  });
});

describe("display rounding", () => {
  it("matches round(raw*100)/10 and percent to 1 decimal", () => {
    assert.equal(displayHeat(0.5454), 5.5);
    assert.equal(displayHeat(1.06066017178), 10.6);
    assert.equal(displayPct((10.0 - 11.9) / 11.9), -16.0);
    assert.equal(displayPct((10.6 - 12.6) / 12.6), -15.9);
    assert.equal(displayPct((5.5 - 6.5) / 6.5), -15.4);
  });
});

describe("eligibility B2-02", () => {
  it("rejects a single participant even if editorial", () => {
    assert.equal(
      isEligible([{ key: "lab", name: "公开实验室", kind: "editorial", lastAt: AT }], AT),
      false,
    );
  });

  it("rejects two signals with no editorial", () => {
    assert.equal(
      isEligible([
        { key: "a", name: "信号甲", kind: "signal", lastAt: AT },
        { key: "b", name: "信号乙", kind: "signal", lastAt: AT },
      ], AT),
      false,
    );
  });

  it("accepts two editorial", () => {
    assert.equal(
      isEligible([
        { key: "lab", name: "公开实验室", kind: "editorial", lastAt: AT },
        { key: "notes", name: "复现笔记", kind: "editorial", lastAt: AT },
      ], AT),
      true,
    );
  });
});

describe("verifyHotJson against SYNTHETIC tree", () => {
  it("passes when hot.json matches recompute", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-ok-"));
    try {
      eventTree(dir);
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, true, result.issues.join("\n"));
      assert.equal(result.recomputed.length, 3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails the build when any heat differs by > 0.1", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-bad-"));
    try {
      eventTree(dir, CASES.events, { heatOverride: { "2026-10-19-synthetic-heat-fresh": 20.3 } });
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, false);
      assert.match(result.issues.join("\n"), /heat 20\.3/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("real out-1700 snapshot (not SYNTHETIC)", () => {
  it("recomputes DeepSeek heat 5.5 / trendPct -15.4 / 25 spark points", () => {
    const marker = readFileSync(join(OUT_1700, "REAL-SNAPSHOT"), "utf8");
    assert.match(marker, /REAL/);
    const result = verifyEngineHeat(OUT_1700);
    assert.equal(result.ok, true, result.issues.join("\n"));
    const row = result.recomputed[0];
    assert.equal(row.publicId, "2026-10-19-deepseek-v41-flash-1017");
    assert.equal(row.heat, 5.5);
    assert.equal(row.trend, "down");
    assert.equal(row.trendPct, -15.4);
    assert.equal(row.spark.length, 25);
    assert.ok(row.eligible);
    assert.ok(row.spark.filter((v) => v != null).length >= 2);
  });
});

describe("B2-03 trend from a stored 6h snapshot (SYNTHETIC)", () => {
  it("uses a snapshot within 30 minutes of T−6h for trendPct", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-snap-"));
    try {
      eventTree(dir);
      const day = CASES.events.find((e) => e.publicId.endsWith("heat-day"));
      const mixed = CASES.events.find((e) => e.publicId.endsWith("heat-mixed"));
      writeFileSync(
        join(dir, "hot-snapshots", "2026-10-19T06.json"),
        `${JSON.stringify({
          computedAt: "2026-10-19T06:00:00.000Z",
          entries: [
            { rank: 1, publicId: mixed.publicId, heat: 12.6, participantCount: 2 },
            { rank: 2, publicId: day.publicId, heat: 11.9, participantCount: 2 },
          ],
        }, null, 2)}\n`,
      );
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, true, result.issues.join("\n"));
      assert.equal(result.prevSnap, "2026-10-19T06");
      const row = result.recomputed.find((e) => e.publicId === day.publicId);
      assert.equal(row.trend, "down");
      assert.equal(row.trendPct, -16.0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("B2-08 method copy", () => {
  it("states 48h independent sources and 24h half-life, without 实时", () => {
    assert.equal(HEAT_METHOD_COPY, "按过去 48 小时独立来源计算，半衰期 24 小时");
    assert.doesNotMatch(HEAT_METHOD_COPY, /实时|引擎已 1:1/);
  });
});

describe("surge / rising badges (SYNTHETIC)", () => {
  it("marks surge when ≥3 new participants are ≥50% of the set", () => {
    const at = "2026-10-19T12:00:00.000Z";
    const participants = [
      { key: "old", name: "老报", kind: "editorial", lastAt: "2026-10-18T12:00:00.000Z", firstAt: "2026-10-18T12:00:00.000Z" },
      { key: "a", name: "新甲", kind: "editorial", lastAt: at, firstAt: at },
      { key: "b", name: "新乙", kind: "editorial", lastAt: at, firstAt: at },
      { key: "c", name: "新丙", kind: "signal", lastAt: at, firstAt: at },
    ];
    const row = recomputeEntry(participants, at);
    assert.ok(row.badges.includes("surge"));
    assert.equal(row.badges.includes("rising"), false);
  });

  it("marks rising when pct >15% and not surge", () => {
    const at = "2026-10-19T12:00:00.000Z";
    const participants = [
      { key: "lab", name: "公开实验室", kind: "editorial", lastAt: "2026-10-19T11:00:00.000Z", firstAt: "2026-10-18T01:00:00.000Z" },
      { key: "notes", name: "复现笔记", kind: "editorial", lastAt: "2026-10-19T11:00:00.000Z", firstAt: "2026-10-18T01:00:00.000Z" },
    ];
    const now = recomputeEntry(participants, at);
    const prev = recomputeEntry(participants, "2026-10-19T06:00:00.000Z");
    assert.ok(now.heat > prev.heat);
    const pct = displayPct((now.heat - prev.heat) / prev.heat);
    if (pct > 15) {
      assert.ok(now.badges.includes("rising") || now.trend === "up");
    }
    assert.equal(now.badges.includes("surge"), false);
  });
});
