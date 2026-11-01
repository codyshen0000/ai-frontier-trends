/** site-data removed events story.score and timeline card.item.score. */
import assert from "node:assert/strict";
import { stripScore } from "./static_export.mjs";

const card = {
  key: "k1",
  anchorAt: "2026-10-18T10:00:00.000Z",
  item: {
    id: "n1",
    title: "无分卡片",
    summary: "摘要",
    source: { name: "公开笔记" },
    publishedAt: "2026-10-18T10:00:00.000Z",
    category: "model",
    selected: true,
    channel: "news",
  },
  group: null,
};

assert.equal("score" in card.item, false, "fixture-like card has no item.score");
assert.deepEqual(stripScore(card).item, card.item);
assert.equal("score" in stripScore({ ...card, item: { ...card.item, score: 88 } }).item, false);
assert.equal("score" in stripScore({ story: { title: "e", score: 3 } }).story, false);
assert.equal(stripScore({ item: { title: "t", score: 1, aiRating: 82 } }).item.aiRating, 82, "public aiRating survives stripScore");

const rendered = JSON.stringify(stripScore({ ...card, item: { ...card.item, score: Number.NaN } }));
assert.doesNotMatch(rendered, /"score"/);
assert.doesNotMatch(rendered, /NaN/);

console.log("score_absent tests passed");
