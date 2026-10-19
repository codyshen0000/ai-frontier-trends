import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { publicizeBundle, publicizeCard, publicizeHotEntry } from "../engine/publicize.mjs";
import { EngineDataError } from "../engine/loader.mjs";
import { resolveEngineBundle } from "../engine/resolve.mjs";
import { groupByEvent } from "../engine/groupByEvent.mjs";
import { FIXTURE_IDS } from "../engine/ids.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("B1 wiring", () => {
  it("groupByEvent is the call site hook (identity until B2)", () => {
    const cards = [{ key: "a" }, { key: "b" }];
    assert.equal(groupByEvent(cards), cards);
  });

  it("PUBLIC_DEPLOY with no engine and no last-good fails closed", () => {
    assert.throws(
      () =>
        resolveEngineBundle({
          dir: join(root, "does-not-exist-engine"),
          env: { PUBLIC_DEPLOY: "1", FT_ENGINE_LAST_GOOD: join(root, "does-not-exist-last-good") },
        }),
      (err) => err instanceof EngineDataError && err.code === "NO_LAST_GOOD",
    );
  });

  it("drops fixture cards and never emits score", () => {
    const dropped = publicizeCard({
      key: "flash",
      anchorAt: "2026-10-18T00:00:00.000Z",
      item: {
        id: "flash-api",
        title: "Flash 变体",
        summary: "x",
        reason: "y",
        source: { name: "x" },
        publishedAt: null,
        timelineAt: "2026-10-18T00:00:00.000Z",
        category: "model",
        tags: [],
        selected: true,
        channel: "news",
        x: null,
      },
      group: null,
    });
    assert.equal(dropped, null);
    const cleaned = publicizeHotEntry({
      rank: 1,
      story: { publicId: "ok", title: "真实事件" },
      heat: 3,
      trend: "flat",
      trendPct: 0,
      badges: [],
      participantCount: 2,
      sourceCount: 2,
      sourceNames: ["公开实验室"],
      participants: [],
      spark: [1, 2],
      summary: "摘要",
      latest: "进展",
      cover: null,
    });
    assert.equal("score" in cleaned, false);
  });

  it("in-repo synthetic sample publicizes without fixture ids", () => {
    const sample = join(root, "scripts", "engine", "__samples__", "v1");
    if (!existsSync(join(sample, "meta.json"))) return;
    const resolved = resolveEngineBundle({ dir: sample, env: { PUBLIC_DEPLOY: "0" } });
    const site = publicizeBundle(resolved.bundle);
    const text = JSON.stringify(site);
    for (const id of FIXTURE_IDS) assert.equal(text.includes(id), false);
    assert.doesNotMatch(text, /"score"\s*:/);
  });
});
