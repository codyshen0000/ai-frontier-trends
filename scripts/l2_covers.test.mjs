import assert from "node:assert/strict";
import {
  SPARK_HOURS,
  RANK_WINDOW_HOURS,
  UNKNOWN_WIDTH,
  firstQualifyingImage,
  queryHotCovers,
  leadCover,
  sortHotPublications,
  sortLeadPublications,
} from "./cover_rules.mjs";

assert.equal(SPARK_HOURS, 24);
assert.equal(RANK_WINDOW_HOURS, 48);
assert.equal(UNKNOWN_WIDTH, 800);

const none = firstQualifyingImage([]);
assert.equal(none.reason, "no_image");

const summary = firstQualifyingImage([{ kind: "image", url: "https://ex/a.jpg", width: 1200 }], { bodyMode: "summary" });
assert.equal(summary.reason, "summary_only");
assert.equal(summary.image, null);

const small = firstQualifyingImage([
  { kind: "image", url: "https://ex/small.jpg", width: 240, height: 200 },
  { kind: "image", url: "https://ex/ok.jpg", width: 480, height: 320 },
]);
assert.equal(small.reason, "ok");
assert.equal(small.image.url, "https://ex/ok.jpg");

const unknown = firstQualifyingImage([{ kind: "image", url: "https://ex/u.jpg", width: null, height: null }]);
assert.equal(unknown.reason, "ok_unknown_width_as_800");
assert.equal(unknown.image.width, null);

const below = firstQualifyingImage([{ kind: "image", url: "https://ex/b.jpg", width: 479, height: 400 }]);
assert.equal(below.reason, "below_480");

const videoSkipped = firstQualifyingImage([{ kind: "video", url: "https://ex/v.mp4", width: 1280 }]);
assert.equal(videoSkipped.reason, "no_image");

const pubs = [
  { articleId: "c", firstParty: false, selected: true, score: 9, media: [{ kind: "image", url: "https://ex/c.jpg", width: 800 }] },
  { articleId: "b", firstParty: true, selected: false, score: 1, media: [{ kind: "image", url: "https://ex/b.jpg", width: 800 }] },
  { articleId: "a", firstParty: false, selected: false, score: 99, media: [{ kind: "image", url: "https://ex/a.jpg", width: 800 }] },
  { articleId: "r", firstParty: false, selected: false, score: 0, media: [{ kind: "image", url: "https://ex/r.jpg", width: 800 }] },
];
assert.deepEqual(
  sortHotPublications(pubs, "r").map((p) => p.articleId),
  ["r", "b", "c", "a"],
);
assert.deepEqual(
  sortLeadPublications(pubs, "a").map((p) => p.articleId),
  ["a", "b", "c", "r"],
);

const hot = queryHotCovers({
  representativeItemId: "r",
  publications: [
    { articleId: "r", bodyMode: "summary", listed: true, firstParty: true, selected: true, score: 10, media: [{ kind: "image", url: "https://ex/sum.jpg", width: 1200 }] },
    { articleId: "x", bodyMode: "full", listed: true, firstParty: false, selected: false, score: 0, media: [{ kind: "image", url: "https://ex/x.jpg", width: 900 }] },
  ],
});
assert.equal(hot.articleId, "x");
assert.equal(hot.cover.url, "https://ex/x.jpg");

const lead = leadCover("lead", [
  { articleId: "other", firstParty: true, score: 1, bodyMode: "full", listed: true, media: [{ kind: "image", url: "https://ex/fp.jpg", width: 700 }] },
  { articleId: "lead", firstParty: false, score: 0, bodyMode: "full", listed: true, media: [{ kind: "image", url: "https://ex/lead.jpg", width: 700 }] },
]);
assert.equal(lead.articleId, "lead");
assert.equal(lead.cover.url, "https://ex/lead.jpg");

const borrowed = leadCover("lead", [
  { articleId: "lead", firstParty: false, score: 0, bodyMode: "full", listed: true, media: [] },
  { articleId: "other", firstParty: true, score: 1, bodyMode: "full", listed: true, media: [{ kind: "image", url: "https://ex/fp.jpg", width: 700 }] },
]);
assert.equal(borrowed.articleId, "other");

console.log("cover_rules tests passed");
