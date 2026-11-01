import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HEAT_CADENCE_COPY,
  HEAT_METHOD_COPY,
  HEAT_STATUS_LABEL,
  HOT_TOP_N,
  assertHeatCopy,
  formatHeat,
  formatTrendPct,
  heatComputedStale,
  heatMatches,
  scrubForbiddenHeatCopy,
  sparkMatches,
} from "./heat-copy.mjs";

describe("HEAT_METHOD_COPY", () => {
  it("is the exact B2-08 one-liner and has no forbidden wording", () => {
    assert.equal(HEAT_METHOD_COPY, "按过去 48 小时独立来源计算，半衰期 24 小时");
    assertHeatCopy(HEAT_METHOD_COPY);
    assert.doesNotMatch(HEAT_METHOD_COPY, /实时|引擎已\s*1:1/);
  });

  it("keeps honest Top10 / cadence copy without 实时", () => {
    assert.equal(HOT_TOP_N, 10);
    assert.equal(HEAT_STATUS_LABEL, "当前热度");
    assertHeatCopy(HEAT_STATUS_LABEL);
    assertHeatCopy(HEAT_CADENCE_COPY);
    assert.doesNotMatch(HEAT_CADENCE_COPY, /实时/);
    assert.match(HEAT_CADENCE_COPY, /15 分钟/);
    assert.equal(heatComputedStale("2026-10-29T00:00:00.000Z", Date.parse("2026-10-29T07:00:00.000Z")), true);
    assert.equal(heatComputedStale("2026-10-29T06:30:00.000Z", Date.parse("2026-10-29T07:00:00.000Z")), false);
  });

  it("rejects 实时 and 引擎已 1:1", () => {
    assert.throws(() => assertHeatCopy("实时热度"), /实时/);
    assert.throws(() => assertHeatCopy("引擎已 1:1"), /引擎已/);
  });

  it("scrubs 实时 down to existing 语音智能体 wording", () => {
    assert.equal(
      scrubForbiddenHeatCopy("Mistral 发布 Voxtral 3：实时语音智能体 SDK 与语音模型"),
      "Mistral 发布 Voxtral 3：语音智能体 SDK 与语音模型",
    );
    assert.equal(scrubForbiddenHeatCopy("引擎已 1:1"), "");
  });
});

describe("formatHeat / heatMatches", () => {
  it("does not rescale tenths the way Math.round would", () => {
    assert.equal(formatHeat(5.5), "5.5");
    assert.notEqual(formatHeat(5.5), String(Math.round(5.5)));
    assert.equal(formatHeat(12.3), "12.3");
    assert.equal(formatHeat(6), "6");
    assert.equal(formatTrendPct(-15.4), "15.4");
  });

  it("matches engine values within ±0.1", () => {
    assert.equal(heatMatches(5.5, 5.5), true);
    assert.equal(heatMatches(5.55, 5.5), true);
    assert.equal(heatMatches(6, 5.5), false);
    assert.equal(sparkMatches([11.1, 5.5], [11.1, 5.5]), true);
    assert.equal(sparkMatches([11, 6], [11.1, 5.5]), false);
  });
});
