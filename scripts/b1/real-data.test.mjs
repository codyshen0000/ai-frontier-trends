import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { publicizeBundle, publicizeCard, publicizeHotEntry } from "../engine/publicize.mjs";
import { HEAT_METHOD_COPY, formatHeat, heatMatches } from "../engine/heat-copy.mjs";
import { morePageBody } from "../live_curate.mjs";
import { verify as verifyHeat } from "../verify/b1-heat.mjs";
import { EngineDataError } from "../engine/loader.mjs";
import { resolveEngineBundle } from "../engine/resolve.mjs";
import { groupByEvent } from "../engine/groupByEvent.mjs";
import { FIXTURE_IDS } from "../engine/ids.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("B1 wiring", () => {
  it("groupByEvent is the call site hook (B2 implementation, not identity)", () => {
    const cards = [{ key: "a" }, { key: "b" }];
    const out = groupByEvent(cards);
    assert.notEqual(out, cards);
    assert.equal(out.length, 2);
    const keys = new Set(out.map((card) => card.key));
    assert.equal(keys.has("a") && keys.has("b"), true);
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

  it("exports HEAT_METHOD_COPY and does not rescale tenths", () => {
    assert.equal(HEAT_METHOD_COPY, "按过去 48 小时独立来源计算，半衰期 24 小时");
    assert.equal(formatHeat(5.5), "5.5");
    assert.equal(heatMatches(5.5, 5.5), true);
    assert.equal(heatMatches(6, 5.5), false);
    const more = morePageBody({
      hrefBetween: () => "#",
      escapeHtml: (value) => value,
    });
    assert.equal(more.includes(HEAT_METHOD_COPY), true);
    assert.equal(/实时/.test(more), false);
  });

  it("b1-heat verify matches rendered heat to engine hot.json", async () => {
    const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const dist = mkdtempSync(join(tmpdir(), "b1-heat-"));
    const engine = mkdtempSync(join(tmpdir(), "b1-heat-eng-"));
    try {
      mkdirSync(join(dist, "hot"), { recursive: true });
      mkdirSync(join(dist, "more"), { recursive: true });
      mkdirSync(join(dist, "api", "v1"), { recursive: true });
      const entry = {
        rank: 1,
        story: { publicId: "2026-10-19-deepseek-v41-flash-1017", title: "DeepSeek" },
        heat: 5.5,
        trendPct: -15.4,
        spark: [11.1, 5.5],
      };
      writeFileSync(join(engine, "hot.json"), JSON.stringify({ entries: [entry] }));
      writeFileSync(join(dist, "api", "v1", "hot.json"), JSON.stringify({ entries: [entry] }));
      writeFileSync(
        join(dist, "hot", "index.html"),
        `<html><p data-ft-heat-method>${HEAT_METHOD_COPY}</p><span data-ft-story="${entry.story.publicId}" data-ft-heat="5.5">5.5</span><span data-ft-story="${entry.story.publicId}" data-ft-trend-pct="-15.4">↓ 15.4%</span><svg data-ft-story="${entry.story.publicId}" data-ft-spark="[11.1,5.5]"></svg></html>`,
      );
      writeFileSync(join(dist, "index.html"), `<html><span data-ft-story="${entry.story.publicId}" data-ft-heat="5.5">5.5</span></html>`);
      writeFileSync(join(dist, "more", "index.html"), `<html><p data-ft-heat-method>${HEAT_METHOD_COPY}</p></html>`);
      const ok = await verifyHeat({ distDir: dist, engineDir: engine, root: dist });
      assert.equal(ok.ok, true);

      writeFileSync(
        join(dist, "hot", "index.html"),
        `<html><p data-ft-heat-method>${HEAT_METHOD_COPY}</p><span data-ft-story="${entry.story.publicId}" data-ft-heat="6">6</span></html>`,
      );
      const bad = await verifyHeat({ distDir: dist, engineDir: engine, root: dist });
      assert.equal(bad.ok, false);

      const watch = {
        rank: 6,
        story: { publicId: "2026-10-19-minimax-m31-flash", title: "MiniMax" },
        heat: 8.4,
      };
      writeFileSync(join(engine, "hot.json"), JSON.stringify({ entries: [entry, watch] }));
      writeFileSync(join(dist, "api", "v1", "hot.json"), JSON.stringify({ entries: [entry, watch] }));
      writeFileSync(
        join(dist, "hot", "index.html"),
        `<html><p data-ft-heat-method>${HEAT_METHOD_COPY}</p><span data-ft-story="${entry.story.publicId}" data-ft-heat="5.5">5.5</span><span data-ft-story="${watch.story.publicId}" data-ft-heat="8.4">8.4</span></html>`,
      );
      writeFileSync(
        join(dist, "index.html"),
        `<html><span data-ft-story="${entry.story.publicId}" data-ft-heat="5.5">5.5</span><a href="./story/${watch.story.publicId}/">${watch.story.title}</a></html>`,
      );
      const feedOnly = await verifyHeat({ distDir: dist, engineDir: engine, root: dist });
      assert.equal(feedOnly.ok, true, feedOnly.message);
    } finally {
      rmSync(dist, { recursive: true, force: true });
      rmSync(engine, { recursive: true, force: true });
    }
  });
});
