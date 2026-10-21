import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { EngineDataError, loadEngineData } from "./loader.mjs";
import { publicCover, publicizeBundle, publicizeCard, publicizeHotEntry, publicizeHotStripRow, stripScore } from "./publicize.mjs";
import { assertNoFixtureIds, resolveEngineBundle } from "./resolve.mjs";
import { FIXTURE_IDS } from "./ids.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "__samples__", "v1");
const REAL_SNAP = "/tmp/site-data-1700/out";

function tmpCopy(src = SAMPLE) {
  const dir = mkdtempSync(join(tmpdir(), "b1-engine-"));
  cpSync(src, dir, { recursive: true });
  const metaPath = join(dir, "meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.mode = "production";
  writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  return dir;
}

describe("B1 publicize", () => {
  it("hides empty reason / 1-point spark / null trendPct and drops invalid covers", () => {
    const entry = publicizeHotEntry({
      rank: 1,
      story: { publicId: "2026-10-19-synthetic-alpha", title: "SYNTHETIC" },
      heat: 4,
      trend: "unknown",
      trendPct: null,
      badges: [],
      participantCount: 2,
      sourceCount: 2,
      sourceNames: ["公开实验室"],
      participants: [],
      spark: [3],
      summary: "摘要",
      latest: "  ",
      cover: { url: "https://cdn.example.com/x.png", width: 1200, height: 800, alt: "x", valueClass: "model_sample" },
    });
    assert.equal(entry.latest, null);
    assert.deepEqual(entry.spark, []);
    assert.equal(entry.trendPct, null);
    assert.equal(entry.cover, null);

    const card = publicizeCard({
      key: "k",
      anchorAt: "2026-10-19T00:00:00.000Z",
      item: {
        id: "sha256:abc",
        title: "标题",
        summary: "摘要",
        reason: "",
        source: { name: "公开实验室" },
        publishedAt: "2026-10-19T00:00:00.000Z",
        timelineAt: "2026-10-19T00:00:00.000Z",
        category: "model",
        tags: [],
        selected: true,
        channel: "news",
        x: null,
        originalUrl: "https://example.com/nope",
      },
      group: { factId: "f", additionalSourceCount: 0, reportCount: 1 },
    });
    assert.equal(card.item.reason, null);
    assert.equal(card.item.originalUrl, undefined);
    assert.equal(card.group, null);
  });

  it("keeps official_diagram and official_explainer covers only when same-origin", () => {
    const ok = {
      url: "assets/covers/demo.webp",
      width: 1200,
      height: 800,
      alt: "官方架构图",
      valueClass: "official_diagram",
    };
    assert.equal(publicCover(ok).valueClass, "official_diagram");
    assert.equal(
      publicCover({ ...ok, valueClass: undefined, value_category: "official_explainer" }).valueClass,
      "official_explainer",
    );
    assert.equal(publicCover({ ...ok, valueClass: "og" }), null);
    assert.equal(publicCover({ ...ok, url: "https://cdn.example.invalid/x.png" }), null);
  });

  it("strips score keys and fixture cards", () => {
    const cleaned = stripScore({ item: { id: "n1", title: "t", score: 9 }, extra: { score_avg: 1 } });
    assert.equal("score" in cleaned.item, false);
    assert.equal("score_avg" in cleaned.extra, false);
    const dropped = publicizeCard({
      key: "flash",
      anchorAt: "2026-10-18T00:00:00.000Z",
      item: { id: "flash-api", title: "Flash 变体", summary: "x", reason: "y", source: { name: "x" }, publishedAt: null, timelineAt: "2026-10-18T00:00:00.000Z", category: "model", tags: [], selected: true, channel: "news", x: null },
      group: null,
    });
    assert.equal(dropped, null);
  });

  it("scrubs 实时 from public titles so CI engine-data cannot leak it", () => {
    const site = publicizeBundle({
      dir: "",
      meta: { data_as_of: "", generated_at: "" },
      data_as_of: "",
      built_at: "",
      hot: {
        computedAt: null,
        windowHours: 48,
        entries: [
          {
            rank: 1,
            story: { publicId: "2026-10-21-mistral-voxtral-3", title: "Mistral 发布 Voxtral 3：实时语音智能体 SDK 与语音模型" },
            heat: 13.1,
            spark: [1, 2],
          },
        ],
      },
      hotStrip: [{ rank: 1, title: "Mistral 发布 Voxtral 3：实时语音智能体 SDK 与语音模型", heat: 13.1 }],
      daily: null,
      dailyIndex: [],
      dailies: [],
      feed: null,
      feedItems: [],
      events: [],
      eventsIndex: [],
      timeline: { filters: { channel: "all", category: null, tag: null }, cards: [], nextCursor: null, hot: [], dayCounts: {} },
      timelineIndex: null,
      redirects: [],
      sources: [],
      search: null,
      items: [],
      topics: [],
      allTimeline: null,
      weeklyIndex: [],
      monthlyIndex: [],
    });
    const text = JSON.stringify(site);
    assert.equal(text.includes("实时"), false);
    assert.equal(site.hot.entries[0].story.title, "Mistral 发布 Voxtral 3：语音智能体 SDK 与语音模型");
    assert.equal(site.hotStrip[0].title, "Mistral 发布 Voxtral 3：语音智能体 SDK 与语音模型");
  });

  it("drops belowThreshold preview rows", () => {
    assert.equal(publicizeHotEntry({ rank: 9, story: { publicId: "x", title: "补位预览" }, belowThreshold: true }), null);
    assert.equal(
      publicizeCard({
        key: "bt",
        anchorAt: "2026-10-19T00:00:00.000Z",
        belowThreshold: true,
        item: { id: "sha256:bt", title: "未过闸", summary: "x", reason: "y", source: { name: "x" }, publishedAt: null, timelineAt: "2026-10-19T00:00:00.000Z", category: "model", tags: [], selected: false, channel: "news", x: null },
        group: null,
      }),
      null,
    );
  });
});

describe("B1 resolve fallback", () => {
  it("falls back to last good export and never to fixture", () => {
    const good = tmpCopy();
    const bad = tmpCopy();
    writeFileSync(join(bad, "hot.json"), "{not json");
    const resolved = resolveEngineBundle({
      dir: bad,
      env: { FT_ENGINE_LAST_GOOD: good, PUBLIC_DEPLOY: "1" },
    });
    assert.equal(resolved.source, "last-good");
    assert.match(resolved.warning, /last good/);
    assert.equal(resolved.bundle.events[0].publicId, "2026-10-19-synthetic-alpha");
    const serialized = JSON.stringify(resolved.bundle);
    for (const id of FIXTURE_IDS) assert.equal(serialized.includes(id), false);
    rmSync(good, { recursive: true, force: true });
    rmSync(bad, { recursive: true, force: true });
  });

  it("PUBLIC_DEPLOY fails when engine is invalid and no last-good exists", () => {
    const bad = mkdtempSync(join(tmpdir(), "b1-bad-"));
    try {
      assert.throws(
        () => resolveEngineBundle({ dir: bad, env: { PUBLIC_DEPLOY: "1", FT_ENGINE_LAST_GOOD: join(bad, "missing") } }),
        (err) => err instanceof EngineDataError && err.code === "NO_LAST_GOOD",
      );
    } finally {
      rmSync(bad, { recursive: true, force: true });
    }
  });

  it("empty hot.json is valid and does not fall back", () => {
    const dir = tmpCopy();
    writeFileSync(
      join(dir, "hot.json"),
      JSON.stringify({ computedAt: "2026-10-19T08:00:00.000Z", windowHours: 48, entries: [] }),
    );
    const resolved = resolveEngineBundle({ dir, env: { PUBLIC_DEPLOY: "1" } });
    assert.equal(resolved.source, "primary");
    assert.equal(resolved.bundle.hot.entries.length, 0);
    const site = publicizeBundle(resolved.bundle);
    assert.equal(site.hot.entries.length, 0);
    rmSync(dir, { recursive: true, force: true });
  });

  it("PUBLIC_DEPLOY rejects an engine tree that still has fixture ids", () => {
    const dir = tmpCopy();
    const page = JSON.parse(readFileSync(join(dir, "timeline", "page-1.json"), "utf8"));
    page.cards[0].item.id = "flash-api";
    writeFileSync(join(dir, "timeline", "page-1.json"), JSON.stringify(page));
    assert.throws(() => assertNoFixtureIds(loadEngineData({ dir }), dir), (err) => {
      return err instanceof EngineDataError && err.code === "FIXTURE_IN_ENGINE";
    });
    assert.throws(
      () => resolveEngineBundle({ dir, env: { PUBLIC_DEPLOY: "1", FT_ENGINE_LAST_GOOD: join(dir, "missing") } }),
      (err) => err instanceof EngineDataError && err.code === "NO_LAST_GOOD",
    );
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("B1 real snapshot", () => {
  it("loads the 1700 production dump when present", { skip: !existsSync(join(REAL_SNAP, "meta.json")) }, () => {
    const bundle = loadEngineData({ dir: REAL_SNAP });
    assert.equal(bundle.meta.mode, "production");
    assert.equal(bundle.hot.entries.length, 1);
    assert.equal(bundle.timeline.cards.length, 1);
    assert.equal(bundle.daily, null);
    const site = publicizeBundle(bundle);
    assert.match(site.timeline.cards[0].item.title, /DeepSeek/);
    assert.match(site.timeline.cards[0].item.originalUrl, /the-decoder\.com/);
    assert.equal(site.hot.entries[0].cover, null);
    assert.equal(site.hot.entries[0].heat, 5.5);
    assert.equal(site.hot.entries[0].trendPct, -15.4);
    assert.deepEqual(site.hot.entries[0].spark.slice(0, 2), [11.1, 10.7]);
    assert.equal(site.timeline.hot[0].heat, 5.5);
    assert.equal(publicizeHotStripRow({ rank: 1, title: "x", heat: 5.5, trend: "down" }).heat, 5.5);
    const text = JSON.stringify(site);
    for (const id of FIXTURE_IDS) assert.equal(text.includes(id), false);
    assert.doesNotMatch(text, /example\.com/i);
    assert.doesNotMatch(text, /"score"\s*:/);
  });
});
