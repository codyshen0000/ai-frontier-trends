import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { loadEngineData } from "../engine/loader.mjs";
import { publicizeBundle } from "../engine/publicize.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ENGINE = join(root, "data", "engine", "v1");

describe("engine-v1 preview mapping 1.1", () => {
  it("loads the embedded production snapshot without score, localhost, or attribution", () => {
    if (!existsSync(join(ENGINE, "meta.json"))) return;
    const bundle = loadEngineData({ dir: ENGINE });
    const site = publicizeBundle(bundle);
    const text = JSON.stringify({
      bundle: { items: bundle.items, topics: bundle.topics, all: bundle.allTimeline, daily: bundle.daily, hot: bundle.hot },
      site,
    });
    assert.equal(/"score"\s*:/.test(text), false);
    assert.equal(text.includes("127.0.0.1"), false);
    assert.equal(/MyHOT|AIHOT/.test(text), false);
    const counts = bundle.meta?.counts || {};
    assert.equal(bundle.meta?.mode, "production");
    assert.equal(bundle.hot.entries.length, counts.hot_entries ?? bundle.hot.entries.length);
    assert.equal((bundle.timeline?.cards || []).length, counts.cards ?? (bundle.timeline?.cards || []).length);
    assert.ok(Array.isArray(bundle.dailies));
    assert.equal(bundle.dailies.length, site.dailies.length);
    if (counts.hot_entries === 0) assert.equal(site.hot.entries.length, 0);
    if (!bundle.daily) {
      assert.equal(site.daily, null);
    } else {
      assert.ok(bundle.daily.key);
      assert.equal(site.daily?.key, bundle.daily.key);
    }
    const sample = (bundle.timeline?.cards || []).map((card) => card.item).find((row) => row?.selected);
    if (sample) {
      assert.ok(sample.originalTitle || sample.summary || sample.title);
      assert.equal(Object.prototype.hasOwnProperty.call(sample, "score"), false);
    }
    const event = bundle.events[0];
    assert.ok(event);
    assert.ok(Array.isArray(event.timeline));
    assert.ok(event.timeline.length >= 1);
    assert.ok(event.sourceCount >= 1);
    assert.ok(Array.isArray(bundle.topics));
  });
});
