import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
  hoursInWindow,
  isEligible,
  recomputeEntry,
  sparkFor,
  sparkForOpenWindow,
  verifyEngineHeat,
} from "./heat.mjs";
import {
  HEAT_PARITY_FIXTURE,
  REQUIRED_COVERS,
  loadHeatParityFixture,
  runJsParityCase,
} from "./heat-parity.mjs";

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

  it("does not fail live hot.json watching rows that drop below the eligibility gate", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-watch-"));
    try {
      const one = CASES.events.find((e) => e.publicId.endsWith("heat-fresh"));
      eventTree(dir, [one]);
      const hotPath = join(dir, "hot.json");
      const hot = JSON.parse(readFileSync(hotPath, "utf8"));
      const atMs = Date.parse(hot.computedAt);
      const outside = new Date(atMs - 49 * 3600 * 1000).toISOString();
      const eventPath = join(dir, "events", `${one.publicId}.json`);
      const event = JSON.parse(readFileSync(eventPath, "utf8"));
      event.timeline = [
        { ...event.timeline[0], publishedAt: event.timeline[0].publishedAt },
        { ...event.timeline[1] || event.timeline[0], id: "sha256:synthetic-heat-aged", publishedAt: outside },
      ];
      event.developments = [];
      event.officialReports = [];
      writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
      const watching = recomputeEntry(
        [
          { key: "lab", name: "公开实验室", kind: "editorial", lastAt: event.timeline[0].publishedAt },
          { key: "notes", name: "复现笔记", kind: "editorial", lastAt: outside },
        ],
        hot.computedAt,
      );
      assert.equal(watching.eligible, false);
      hot.entries[0].heat = watching.heat;
      hot.entries[0].spark = watching.spark;
      hot.entries[0].trend = watching.trend;
      hot.entries[0].trendPct = watching.trendPct;
      hot.entries[0].badges = watching.badges;
      hot.entries[0].participantCount = 1;
      writeFileSync(hotPath, `${JSON.stringify(hot, null, 2)}\n`);
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, true, result.issues.join("\n"));
      assert.match(result.skipped.join("\n"), /skip eligibility/);
      assert.equal(result.recomputed[0].eligible, false);

      hot.entries[0].heat = watching.heat + 3;
      writeFileSync(hotPath, `${JSON.stringify(hot, null, 2)}\n`);
      const bad = verifyEngineHeat(dir);
      assert.equal(bad.ok, false);
      assert.match(bad.issues.join("\n"), /heat /);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips hot.json rows whose event tree is missing listed participant timestamps", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-incomplete-"));
    try {
      const one = CASES.events.find((e) => e.publicId.endsWith("heat-fresh"));
      eventTree(dir, [one]);
      const eventPath = join(dir, "events", `${one.publicId}.json`);
      const event = JSON.parse(readFileSync(eventPath, "utf8"));
      event.timeline = event.timeline.slice(0, 1);
      event.developments = [];
      event.officialReports = [];
      writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, true, result.issues.join("\n"));
      assert.equal(result.recomputed.length, 0);
      assert.match(result.skipped.join("\n"), /skip \(engine tree has 1 timestamp/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips when listed N is higher than unique in-window participants", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-inwindow-"));
    try {
      const one = CASES.events.find((e) => e.publicId.endsWith("heat-fresh"));
      eventTree(dir, [one]);
      const hotPath = join(dir, "hot.json");
      const hot = JSON.parse(readFileSync(hotPath, "utf8"));
      const atMs = Date.parse(hot.computedAt);
      const aged = new Date(atMs - 60 * 3600 * 1000).toISOString();
      const eventPath = join(dir, "events", `${one.publicId}.json`);
      const event = JSON.parse(readFileSync(eventPath, "utf8"));
      event.timeline = [
        { ...event.timeline[0], publishedAt: event.timeline[0].publishedAt },
        { ...event.timeline[1] || event.timeline[0], id: "sha256:synthetic-heat-aged-n", publishedAt: aged },
      ];
      event.developments = [];
      event.officialReports = [];
      writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
      hot.entries[0].participantCount = 2;
      hot.entries[0].heat = 16.2;
      writeFileSync(hotPath, `${JSON.stringify(hot, null, 2)}\n`);
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, true, result.issues.join("\n"));
      assert.match(result.skipped.join("\n"), /in-window tree has 1 timestamp/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts a live spark endpoint written with the leftover left-open 48h window", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-open48-"));
    try {
      const one = CASES.events.find((e) => e.publicId.endsWith("heat-day"));
      eventTree(dir, [one]);
      const hotPath = join(dir, "hot.json");
      const hot = JSON.parse(readFileSync(hotPath, "utf8"));
      const eventPath = join(dir, "events", `${one.publicId}.json`);
      const event = JSON.parse(readFileSync(eventPath, "utf8"));
      const atMs = Date.parse(hot.computedAt);
      const edge = new Date(atMs - 48 * 3600 * 1000).toISOString();
      event.timeline = event.timeline.map((row, i) => (i === 0 ? { ...row, publishedAt: edge } : row));
      writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
      const participants = event.timeline.map((row, i) => ({
        key: i === 0 ? "lab" : "notes",
        name: row.source.name,
        kind: "editorial",
        lastAt: row.publishedAt,
      }));
      const closed = recomputeEntry(participants, hot.computedAt);
      const openSpark = sparkForOpenWindow(participants, hot.computedAt);
      assert.notEqual(closed.spark.at(-1), openSpark.at(-1));
      hot.entries[0].heat = closed.exactHeat;
      hot.entries[0].spark = openSpark;
      hot.entries[0].trend = closed.trend;
      hot.entries[0].trendPct = closed.trendPct;
      hot.entries[0].badges = closed.badges;
      writeFileSync(hotPath, `${JSON.stringify(hot, null, 2)}\n`);
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, true, result.issues.join("\n"));
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

  it("does not fail live hot.json when the T−6h snapshot heat is stale", () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-heat-stale-snap-"));
    try {
      const day = CASES.events.find((e) => e.publicId.endsWith("heat-day"));
      eventTree(dir, [day]);
      writeFileSync(
        join(dir, "hot-snapshots", "2026-10-19T06.json"),
        `${JSON.stringify({
          computedAt: "2026-10-19T06:00:00.000Z",
          entries: [{ rank: 1, publicId: day.publicId, heat: 20.0, participantCount: 2 }],
        }, null, 2)}\n`,
      );
      const result = verifyEngineHeat(dir);
      assert.equal(result.ok, true, result.issues.join("\n"));
      assert.equal(result.prevSnap, "2026-10-19T06");
      assert.ok(
        (result.skipped || []).some((row) => row.includes(day.publicId) && row.includes("stale")),
        result.skipped?.join("\n"),
      );
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

describe("py↔JS heat/spark parity fixture (Task #57)", () => {
  const fixture = loadHeatParityFixture();
  const byId = Object.fromEntries(fixture.cases.map((spec) => [spec.id, spec]));

  it("is SYNTHETIC and covers the required edges", () => {
    assert.equal(fixture.synthetic, true);
    assert.match(readFileSync(join(here, "__samples__", "heat-parity", "SYNTHETIC"), "utf8"), /SYNTHETIC/);
    assert.equal(HEAT_PARITY_FIXTURE.endsWith("heat-parity/cases.json"), true);
    const covers = new Set(fixture.cases.map((spec) => spec.covers));
    for (const need of REQUIRED_COVERS) {
      assert.ok(covers.has(need), `missing cover ${need}`);
    }
  });

  it("JS heat path matches fixture.js on every case", () => {
    for (const spec of fixture.cases) {
      const got = runJsParityCase(spec);
      const expected = spec.js;
      assert.equal(got.heat, expected.heat, spec.id);
      if (expected.sparkLast !== undefined) assert.equal(got.sparkLast, expected.sparkLast, `${spec.id} sparkLast`);
      if (expected.trend !== undefined) assert.equal(got.trend, expected.trend, `${spec.id} trend`);
      if (expected.trendPct !== undefined) assert.equal(got.trendPct, expected.trendPct, `${spec.id} trendPct`);
      if (expected.participantCount !== undefined) {
        assert.equal(got.participantCount, expected.participantCount, `${spec.id} count`);
      }
      if (expected.badges) assert.deepEqual(got.badges, expected.badges, `${spec.id} badges`);
      if (expected.keys) assert.deepEqual(got.keys, expected.keys, `${spec.id} keys`);
      if (expected.heatEqualsSparkEndpoint != null) {
        assert.equal(got.heatEqualsSparkEndpoint, expected.heatEqualsSparkEndpoint, `${spec.id} heat===spark`);
      }
      if (expected.exactHeat != null) {
        assert.equal(got.exactHeat, expected.exactHeat, `${spec.id} exactHeat`);
      }
      if (spec.raw != null && expected.displayHeatOfRaw != null) {
        assert.equal(displayHeat(spec.raw), expected.displayHeatOfRaw, `${spec.id} displayHeat(raw)`);
      }
    }
  });

  it("on-hour cases assert heat === last spark point", () => {
    const onHour = fixture.cases.filter((spec) => spec.mode === "recompute" && !/off-hour/.test(spec.id));
    assert.ok(onHour.length >= 1);
    for (const spec of onHour) {
      const got = runJsParityCase(spec);
      assert.equal(got.heat, got.sparkLast, spec.id);
      assert.equal(got.heatEqualsSparkEndpoint, true, spec.id);
    }
    const endpoint = byId["spark-endpoint-on-hour"];
    const got = runJsParityCase(endpoint);
    assert.equal(got.heat, 14.7);
    assert.equal(got.sparkLast, 14.7);
  });

  it("closes off-hour contract: listed heat === spark[-1] (floor hour)", () => {
    const spec = byId["spark-endpoint-off-hour"];
    const got = runJsParityCase(spec);
    assert.equal(got.heat, 14.7);
    assert.equal(got.sparkLast, 14.7);
    assert.equal(got.exactHeat, 14.6);
    assert.equal(got.heatEqualsSparkEndpoint, true);
    assert.equal(spec.parityStatus, "pass");
    assert.match(spec.contractNote, /Closed/);
  });

  it("py fixture rows match JS on every aligned case", () => {
    for (const spec of fixture.cases) {
      assert.equal(spec.parityStatus, "pass", spec.id);
      assert.equal((spec.knownDiffs || []).length, 0, spec.id);
      for (const field of ["heat", "sparkLast", "trend", "trendPct", "participantCount", "heatEqualsSparkEndpoint"]) {
        if (field in spec.js && field in spec.python) {
          assert.deepEqual(spec.js[field], spec.python[field], `${spec.id} ${field}`);
        }
      }
    }
    const at = Date.parse(byId["boundary-48h"].at);
    const edge = Date.parse("2026-10-17T12:00:00.000Z");
    assert.equal(hoursInWindow(at, edge), 48, "JS includes the exact-48h member");
    assert.equal(displayHeat(1.445), 14.5);
    assert.equal(byId["rounding-half-up"].python.displayHeatOfRaw, 14.5);
  });

  it("python heat48h.py matches JS (skip if no python3)", (t) => {
    const result = spawnSync("python3", [join(here, "..", "verify", "heat-py-parity.py"), "--json"], {
      encoding: "utf8",
    });
    if (result.error && result.error.code === "ENOENT") {
      t.skip("python3 not on PATH");
      return;
    }
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, true, JSON.stringify(payload.cases?.flatMap((row) => row.issues)));
    const stale = (payload.cases || []).filter((row) => !row.matchPythonExpected || !row.matchJs);
    assert.equal(stale.length, 0);
    const withDiffs = (payload.cases || []).filter((row) => (row.knownDiffs || []).length);
    assert.equal(withDiffs.length, 0);
  });

  it("Python-produced hot.json passes b2-hot-recompute without align", (t) => {
    const spec = byId["spark-endpoint-off-hour"];
    const py = spawnSync(
      "python3",
      ["-c", "import json,sys; sys.path.insert(0,'scripts/site-data'); from heat48h import run_parity_case; print(json.dumps(run_parity_case(json.load(sys.stdin))))"],
      { encoding: "utf8", input: JSON.stringify(spec), cwd: join(here, "..", "..") },
    );
    if (py.error && py.error.code === "ENOENT") {
      t.skip("python3 not on PATH");
      return;
    }
    assert.equal(py.status, 0, py.stderr || py.stdout);
    const produced = JSON.parse(py.stdout);
    const dir = mkdtempSync(join(tmpdir(), "b2-no-align-"));
    try {
      eventTree(dir, [{
        publicId: "2026-10-19-synthetic-off-hour",
        title: "SYNTHETIC · off-hour no align",
        participants: spec.participants.map((p) => ({
          key: p.source_id,
          name: p.name,
          kind: p.kind,
          publishedAt: p.publishedAt,
        })),
      }]);
      const hot = JSON.parse(readFileSync(join(dir, "hot.json"), "utf8"));
      hot.computedAt = spec.at;
      hot.entries[0].heat = produced.heat;
      hot.entries[0].spark = produced.spark;
      hot.entries[0].trend = produced.trend;
      hot.entries[0].trendPct = produced.trendPct;
      writeFileSync(join(dir, "hot.json"), `${JSON.stringify(hot, null, 2)}\n`);
      const result = verifyEngineHeat(dir, { at: spec.at });
      assert.equal(result.ok, true, result.issues.join("\n"));
      assert.equal(result.recomputed[0].heat, produced.heat);
      assert.equal(result.recomputed[0].heat, result.recomputed[0].spark.at(-1));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

