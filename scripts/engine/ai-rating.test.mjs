import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicAiRating } from "./ai-rating.mjs";
import { attachAiRating, publicizeBundle, stripScore } from "./publicize.mjs";
import { HOT_TOP_N } from "./heat-copy.mjs";
import { TOP_N } from "./heat.mjs";

function baseBundle(extra = {}) {
  return {
    dir: "",
    meta: { data_as_of: "", generated_at: "" },
    data_as_of: "",
    built_at: "",
    hot: { computedAt: null, windowHours: 48, entries: extra.hotEntries || [] },
    hotStrip: [],
    daily: null,
    dailyIndex: [],
    dailies: [],
    feed: null,
    feedItems: [],
    events: extra.events || [],
    eventsIndex: [],
    timeline: {
      filters: { channel: "all", category: null, tag: null },
      cards: extra.cards || [],
      nextCursor: null,
      hot: [],
      dayCounts: {},
    },
    timelineIndex: null,
    redirects: [],
    sources: [],
    search: null,
    items: [],
    topics: [],
    allTimeline: null,
    weeklyIndex: [],
    monthlyIndex: [],
  };
}

describe("publicAiRating", () => {
  it("returns null without public signals", () => {
    assert.equal(publicAiRating({}), null);
  });

  it("stays in 55–95 and prefers selected + reason + sources", () => {
    const n = publicAiRating({
      selected: true,
      reason: "值得看",
      sourceCount: 3,
      reportCount: 3,
      firstParty: true,
      heat: 13.1,
    });
    assert.equal(typeof n, "number");
    assert.ok(n >= 70 && n <= 95);
  });
});

describe("attachAiRating / publicize", () => {
  it("does not emit a score key", () => {
    const card = attachAiRating({
      key: "k",
      item: {
        id: "sha256:abc",
        title: "标题",
        reason: "推荐",
        selected: true,
        sourceCount: 2,
        storyPublicId: "2026-10-21-mistral-voxtral-3",
      },
      group: { additionalSourceCount: 1, reportCount: 2 },
    });
    assert.ok(card.item.aiRating >= 55);
    assert.equal("score" in card.item, false);
    assert.equal("score" in stripScore(card.item), false);
  });

  it("caps public hot.json at HOT_TOP_N and records limit", () => {
    assert.equal(TOP_N, HOT_TOP_N);
    assert.equal(HOT_TOP_N, 10);
    const entries = Array.from({ length: 12 }, (_, i) => ({
      rank: i + 1,
      story: { publicId: `2026-10-21-story-${i + 1}`, title: `事件 ${i + 1}` },
      heat: 20 - i,
      spark: [1, 2],
    }));
    const site = publicizeBundle(baseBundle({ hotEntries: entries }));
    assert.equal(site.hot.limit, 10);
    assert.equal(site.hot.entries.length, 10);
    assert.equal(site.hot.entries[9].rank, 10);
  });

  it("puts aiRating on selected timeline cards", () => {
    const site = publicizeBundle(baseBundle({
      cards: [
        {
          key: "k1",
          anchorAt: "2026-10-21T00:00:00.000Z",
          item: {
            id: "sha256:card1",
            title: "精选一条",
            summary: "摘要",
            reason: "推荐理由正文",
            source: { name: "公开实验室", firstParty: true },
            publishedAt: "2026-10-21T00:00:00.000Z",
            timelineAt: "2026-10-21T00:00:00.000Z",
            category: "model",
            tags: [],
            selected: true,
            channel: "news",
            x: null,
            storyPublicId: "2026-10-21-story-1",
          },
          group: { factId: "f", additionalSourceCount: 2, reportCount: 3 },
        },
      ],
      hotEntries: [
        {
          rank: 1,
          story: { publicId: "2026-10-21-story-1", title: "精选一条" },
          heat: 13.1,
          spark: [1, 2],
        },
      ],
    }));
    assert.ok(site.timeline.cards[0].item.aiRating >= 70);
    assert.doesNotMatch(JSON.stringify(site), /"score"\s*:/);
  });
});
