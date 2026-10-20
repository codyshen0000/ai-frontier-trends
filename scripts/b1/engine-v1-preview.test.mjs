import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { loadEngineData } from "../engine/loader.mjs";
import { publicizeBundle } from "../engine/publicize.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ENGINE = join(root, "data", "engine", "v1");

describe("engine-v1 preview mapping 1.1", () => {
  it("loads extra public fields without score, localhost, or attribution", () => {
    if (!existsSync(join(ENGINE, "meta.json"))) return;
    const bundle = loadEngineData({ dir: ENGINE });
    const site = publicizeBundle(bundle);
    const text = JSON.stringify({ bundle: { items: bundle.items, topics: bundle.topics, all: bundle.allTimeline, daily: bundle.daily }, site });
    assert.equal(/"score"\s*:/.test(text), false);
    assert.equal(text.includes("127.0.0.1"), false);
    assert.equal(/MyHOT|AIHOT/.test(text), false);
    assert.equal(bundle.hot.entries.length, 0);
    assert.equal(bundle.daily, null);
    assert.ok(Array.isArray(bundle.dailies));
    assert.equal(bundle.dailies.length, 0);
    assert.ok((bundle.items || []).length >= (bundle.timeline?.cards || []).length);
    assert.ok((bundle.allTimeline?.cards || []).length >= (bundle.timeline?.cards || []).length);
    const sample = (bundle.items || []).find((row) => row.selected);
    if (sample) {
      assert.ok(sample.originalTitle || sample.summary);
      assert.equal(Object.prototype.hasOwnProperty.call(sample, "score"), false);
    }
    const event = bundle.events[0];
    assert.ok(event);
    assert.ok(Array.isArray(event.timeline));
    assert.ok(event.timeline.length >= 1);
    assert.ok(event.sourceCount >= 1);
    assert.ok((bundle.topics || []).length >= 1);
  });
});
