import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  MIN_COVER_WIDTH,
  dataSourceOf,
  firstQualifyingImage,
  pickL2Cover,
  readEngineDir,
  resolveSiteData,
} from "./engine.mjs";

const wide = { url: "https://example.com/wide.jpg", width: 480, height: 270 };
const wider = { url: "https://example.com/wider.jpg", width: 1200, height: 675 };
const narrow = { url: "https://example.com/narrow.jpg", width: 320, height: 180 };

assert.equal(MIN_COVER_WIDTH, 480);
assert.equal(pickL2Cover(narrow), null);
assert.equal(pickL2Cover({ url: "", width: 1200 }), null);
assert.deepEqual(pickL2Cover(wide)?.url, wide.url);
assert.equal(firstQualifyingImage([narrow, wider])?.url, wider.url);
assert.equal(firstQualifyingImage([narrow]), null);
assert.equal(firstQualifyingImage([{ url: "https://example.com/unk.jpg", width: null }]), null);

const fixture = {
  timeline: {
    filters: { channel: "all", category: null, tag: null },
    cards: [{ key: "fix", anchorAt: "2026-10-01T00:00:00.000Z", item: { id: "fix", title: "fixture card", summary: null, reason: null, source: { name: "F" }, publishedAt: "2026-10-01T00:00:00.000Z", timelineAt: "2026-10-01T00:00:00.000Z", category: "model", tags: [], score: 1, selected: true, channel: "news", x: null }, group: null }],
    nextCursor: null,
    hot: [{ rank: 1, title: "fixture strip", heat: 1, trend: "flat", storyPublicId: "st-fix", itemId: "fix", participants: [], participantCount: 0 }],
    dayCounts: { "2026-10-01": 1 },
  },
  hot: { computedAt: null, windowHours: 48, entries: [{ rank: 1, story: { publicId: "st-fix", title: "fixture hot" }, heat: 1, trend: "flat", trendPct: null, badges: ["rising"], participantCount: 0, sourceCount: 1, sourceNames: ["F"], participants: [], spark: [1, 2, 3], summary: null, latest: null, cover: null }] },
  daily: { kind: "daily", key: "2026-10-01", issueNumber: 1, title: "fixture daily", generatedAt: "2026-10-01T00:00:00.000Z", lead: { title: "fixture daily", leadParagraph: "p" }, leadItemId: "fix", overview: null, highlights: [], sections: [], flashes: [], cover: null, metrics: { totalEvents: 1 }, readingMinutes: 1, prev: null, next: null },
  dailyIndex: [{ key: "2026-10-01", issueNumber: 1, title: "fixture daily", count: 1 }],
  today: "2026-10-01",
};

const emptyEngine = { present: [], timeline: null, hotStrip: null, hot: null, daily: null, dailyIndex: null, meta: null };
const fromFixture = resolveSiteData({ fixture, engine: emptyEngine });
assert.equal(fromFixture.source, "fixture");
assert.equal(fromFixture.timeline.cards[0].item.title, "fixture card");

const dir = mkdtempSync(path.join(tmpdir(), "engine-"));
try {
  writeFileSync(path.join(dir, "hot.json"), JSON.stringify({
    computedAt: "2026-10-18T00:20:00.000Z",
    windowHours: 48,
    entries: [
      {
        rank: 1,
        story: { publicId: "st-1", title: "engine lead" },
        heat: 99,
        trend: "up",
        spark: [1, 2, 3, 4],
        images: [narrow, wider],
        participants: [{ name: "A" }],
        sourceNames: ["A"],
        sourceCount: 1,
      },
      {
        rank: 2,
        story: { publicId: "st-2", title: "engine runner" },
        heat: 10,
        cover: wider,
        spark: [1, 2, 3],
      },
    ],
  }));
  writeFileSync(path.join(dir, "daily.json"), JSON.stringify({
    kind: "daily",
    key: "2026-10-19",
    title: "engine daily",
    lead: { title: "engine lead", leadParagraph: "p" },
    leadItemId: "lead-1",
    highlights: [{ itemId: "lead-1", title: "engine lead", sourceName: "E", sourceUrl: "https://example.com/d", firstParty: true }],
    cover: { url: "https://example.com/daily.jpg", width: 960, height: 540 },
  }));
  const payload = readEngineDir(dir);
  assert.deepEqual(payload.present, ["hot.json", "daily.json"]);
  assert.equal(dataSourceOf(payload.present), "mixed");
  const mixed = resolveSiteData({ fixture, engine: payload });
  assert.equal(mixed.daily.sections[0].items[0].itemId, "lead-1");
  assert.equal(mixed.daily.cover.url, "https://example.com/daily.jpg");
  assert.equal(mixed.source, "mixed");
  assert.equal(mixed.hot.entries[0].story.title, "engine lead");
  assert.equal(mixed.hot.entries[0].cover.url, wider.url);
  assert.equal(mixed.hot.entries[1].cover, null);
  assert.equal(mixed.timeline.cards[0].item.title, "fixture card");
  assert.equal(mixed.timeline.hot[0].title, "engine lead");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("ok   engine data switch and L2 cover policy");
