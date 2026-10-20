import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HEAT_METHOD_COPY,
  assertHeatCopy,
  formatHeat,
  formatTrendPct,
  heatMatches,
  sparkMatches,
} from "./heat-copy.mjs";

describe("HEAT_METHOD_COPY", () => {
  it("is the exact B2-08 one-liner and has no forbidden wording", () => {
    assert.equal(HEAT_METHOD_COPY, "按过去 48 小时独立来源计算，半衰期 24 小时");
    assertHeatCopy(HEAT_METHOD_COPY);
    assert.doesNotMatch(HEAT_METHOD_COPY, /实时|引擎已\s*1:1/);
  });

  it("rejects 实时 and 引擎已 1:1", () => {
    assert.throws(() => assertHeatCopy("实时热度"), /实时/);
    assert.throws(() => assertHeatCopy("引擎已 1:1"), /引擎已/);
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
