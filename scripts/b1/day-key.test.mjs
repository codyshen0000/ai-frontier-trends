import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cardDayKey, countDays, dayKey } from "../day-key.mjs";
import { writeTimelinePages } from "../static_export.mjs";

/** Same arithmetic as vendor/mit/packages/contracts/src/time.ts `beijingDate`. */
function beijingDate(instant) {
  const d = new Date(new Date(instant).getTime() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function card(key, anchorAt, extra = {}) {
  return {
    key,
    anchorAt,
    item: {
      id: `sha256:${key}`,
      title: extra.title || key,
      url: extra.url || `hot.html#s-${key}`,
      originalUrl: extra.originalUrl || "https://the-decoder.com/example",
      category: extra.category || "model",
      selected: extra.selected !== false,
      timelineAt: extra.timelineAt || anchorAt,
      publishedAt: extra.publishedAt || anchorAt,
    },
    group: extra.group ?? null,
  };
}

describe("dayKey Asia/Shanghai", () => {
  it("maps UTC evening onto the next Shanghai calendar day", () => {
    assert.equal(dayKey("2026-10-22T16:11:31Z"), "2026-10-23");
    assert.equal(dayKey("2026-10-22T16:00:00Z"), "2026-10-23");
    assert.equal(dayKey("2026-10-22T16:11:31.000Z"), "2026-10-23");
    assert.equal(dayKey("2026-10-22T15:59:59.999Z"), "2026-10-22");
    assert.equal(dayKey("2026-10-22T16:00:00.000Z"), "2026-10-23");
  });

  it("keeps UTC midnight on the same Shanghai morning (Uber CST still 10-22)", () => {
    assert.equal(dayKey("2026-10-22T00:00:00Z"), "2026-10-22");
    assert.equal(dayKey("2026-10-23T00:00:00+08:00"), "2026-10-23");
  });

  it("matches SSR beijingDate and ignores factId prefixes", () => {
    const olmo = "2026-10-22T16:11:31Z";
    const flint = "2026-10-22T16:00:00Z";
    const uber = "2026-10-22T00:00:00Z";
    assert.equal(dayKey(olmo), beijingDate(olmo));
    assert.equal(dayKey(flint), beijingDate(flint));
    assert.equal(dayKey(uber), beijingDate(uber));
    assert.equal(
      cardDayKey({
        key: "uber",
        anchorAt: uber,
        item: { id: "2026-10-23-uber-chatgpt-work-rollout", timelineAt: uber },
      }),
      "2026-10-22",
    );
  });

  it("returns empty for missing or invalid instants", () => {
    assert.equal(dayKey(""), "");
    assert.equal(dayKey(null), "");
    assert.equal(dayKey("not-a-date"), "");
    assert.equal(cardDayKey({}), "");
  });
});

describe("writeTimelinePages day_counts", () => {
  it("keys OlmoEarth / Flint under 2026-10-23, Uber under 2026-10-22", () => {
    const dir = mkdtempSync(join(tmpdir(), "tl-day-"));
    try {
      writeTimelinePages(
        dir,
        [
          card("olmo", "2026-10-22T16:11:31Z", { title: "OlmoEarth v1.3" }),
          card("flint", "2026-10-22T16:00:00Z", { title: "Flint-interactive" }),
          card("uber", "2026-10-22T00:00:00Z", { title: "Uber ChatGPT" }),
          card("older", "2026-10-21T12:00:00Z", { title: "Older" }),
        ],
        { builtAt: "2026-10-22T17:43:00.000Z", dataAsOf: "2026-10-23T01:38:48+08:00" },
      );
      const page = JSON.parse(readFileSync(join(dir, "data", "timeline", "all", "page-1.json"), "utf8"));
      assert.deepEqual(page.day_counts, {
        "2026-10-23": 2,
        "2026-10-22": 1,
        "2026-10-21": 1,
      });
      assert.ok(page.day_counts["2026-10-23"] >= 2);
      assert.equal(countDays(page.cards)["2026-10-23"], 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
