import assert from "node:assert/strict";
import {
  SPARK_HOURS,
  RANK_WINDOW_HOURS,
  UNKNOWN_WIDTH,
  MIN_COVER_HEIGHT,
  firstQualifyingImage,
  queryHotCovers,
  leadCover,
  sortHotPublications,
  sortLeadPublications,
} from "./cover_rules.mjs";

assert.equal(SPARK_HOURS, 24);
assert.equal(RANK_WINDOW_HOURS, 48);
assert.equal(UNKNOWN_WIDTH, 800);
assert.equal(MIN_COVER_HEIGHT, 240);

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

const svgUnknownWidth = firstQualifyingImage([
  { kind: "image", url: "https://github.com/ex/raw/main/assets/readme/download-en-light.svg", width: null, height: 44 },
]);
assert.equal(svgUnknownWidth.image, null);
assert.equal(svgUnknownWidth.reason, "svg");

const svgMime = firstQualifyingImage([
  { kind: "image", url: "https://ex/icon", mime: "image/svg+xml", width: 1200, height: 800 },
]);
assert.equal(svgMime.image, null);
assert.equal(svgMime.reason, "svg");

const short239 = firstQualifyingImage([
  { kind: "image", url: "https://ex/short.jpg", width: 800, height: 239 },
]);
assert.equal(short239.image, null);
assert.equal(short239.reason, "below_240");

const tall240 = firstQualifyingImage([
  { kind: "image", url: "https://ex/ok-h.jpg", width: 800, height: 240 },
]);
assert.equal(tall240.reason, "ok");
assert.equal(tall240.image.url, "https://ex/ok-h.jpg");

const svgThenRaster = firstQualifyingImage([
  { kind: "image", url: "https://ex/tiny.svg", width: null, height: 44 },
  { kind: "image", url: "https://ex/photo.jpg", width: 900, height: 600 },
]);
assert.equal(svgThenRaster.reason, "ok");
assert.equal(svgThenRaster.image.url, "https://ex/photo.jpg");

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
