import assert from "node:assert/strict";
import {
  SPARK_HOURS,
  RANK_WINDOW_HOURS,
  UNKNOWN_WIDTH,
  MIN_COVER_HEIGHT,
  firstQualifyingImageV4,
  pickFirstValuableImage,
  classifyValue,
  isBadgeProxy,
  isNonArticleImage,
  queryHotCovers,
  leadCover,
  sortHotPublications,
  sortLeadPublications,
  V5_OG_LOGO_SAMPLES,
} from "./cover_rules.mjs";

assert.equal(SPARK_HOURS, 24);
assert.equal(RANK_WINDOW_HOURS, 48);
assert.equal(UNKNOWN_WIDTH, 800);
assert.equal(MIN_COVER_HEIGHT, 240);

const none = pickFirstValuableImage([]);
assert.equal(none.reason, "no_image");
assert.equal(none.image, null);

const summary = pickFirstValuableImage([{ kind: "image", url: "https://ex/arena-chart.png", width: 1200, height: 800 }], {
  bodyMode: "summary",
});
assert.equal(summary.reason, "summary_only");
assert.equal(summary.image, null);

const svgUnknownWidth = pickFirstValuableImage([
  { kind: "image", url: "https://github.com/ex/raw/main/assets/readme/download-en-light.svg", width: null, height: 44 },
]);
assert.equal(svgUnknownWidth.image, null);
assert.equal(svgUnknownWidth.reason, "svg");

const svgMime = pickFirstValuableImage([
  { kind: "image", url: "https://ex/icon", mime: "image/svg+xml", width: 1200, height: 800 },
]);
assert.equal(svgMime.image, null);
assert.equal(svgMime.reason, "svg");

const short239 = pickFirstValuableImage([
  { kind: "image", url: "https://ex/arena-chart.png", width: 800, height: 239 },
]);
assert.equal(short239.image, null);
assert.equal(short239.reason, "below_240");

const videoSkipped = pickFirstValuableImage([{ kind: "video", url: "https://ex/v.mp4", width: 1280 }]);
assert.equal(videoSkipped.reason, "no_image");

assert.equal(isBadgeProxy("https://img.shields.io/npm/v/@prismshadow/penguin-core"), true);
assert.equal(isBadgeProxy("https://camo.githubusercontent.com/abc/def"), true);
assert.equal(isNonArticleImage("https://img.shields.io/badge/license-MIT-blue.svg", 160, 20), true);

const shields = pickFirstValuableImage([
  { kind: "image", url: "https://img.shields.io/npm/v/@prismshadow/penguin-core", width: null, height: null },
]);
assert.equal(shields.image, null);
assert.equal(shields.reason, "badge");

const camoOnly = pickFirstValuableImage([
  {
    kind: "image",
    url: "https://camo.githubusercontent.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/bbbb",
    width: 800,
    height: 400,
  },
]);
assert.equal(camoOnly.image, null);
assert.equal(camoOnly.reason, "badge");

const arena = pickFirstValuableImage(
  [{ kind: "image", url: "https://lmarena.ai/assets/code-arena-bar.png", width: 1400, height: 900, alt: "Code Arena 条形榜" }],
  { title: "DeepSeek 登顶 Code Arena", summary: "开源模型在 WebDev 榜上领先。" },
);
assert.equal(arena.reason, "valuable");
assert.equal(arena.category, "eval_chart");
assert.equal(arena.image.url, "https://lmarena.ai/assets/code-arena-bar.png");

const ogThenArena = pickFirstValuableImage(
  [
    { kind: "image", url: "https://ex.example/og-image.png", width: 1200, height: 630, alt: "share" },
    { kind: "image", url: "https://ex.example/figures/eval-chart.png", width: 1400, height: 800, alt: "评测条形图" },
  ],
  { title: "新模型评测", summary: "对照表见正文。" },
);
assert.equal(ogThenArena.reason, "valuable");
assert.equal(ogThenArena.image.url, "https://ex.example/figures/eval-chart.png");

const onlyOg = pickFirstValuableImage(
  [{ kind: "image", url: "https://ex.example/og-image.png", width: 1200, height: 630 }],
  { title: "某实验室发布说明", ogImage: "https://ex.example/og-image.png" },
);
assert.equal(onlyOg.image, null);
assert.equal(onlyOg.reason, "og");

const unknownValuable = pickFirstValuableImage(
  [{ kind: "image", url: "https://arxiv.org/html/2610.12345/x1.png", width: null, height: null, alt: "Figure 1 architecture" }],
  { title: "新论文：架构示意图", firstParty: true, pageUrl: "https://arxiv.org/html/2610.12345" },
);
assert.equal(unknownValuable.reason, "valuable_unknown_width_as_800");
assert.equal(unknownValuable.image.width, null);

const unknownOgDoesNotPass = pickFirstValuableImage(
  [{ kind: "image", url: "https://ex.example/header.jpg", width: null, height: null }],
  { title: "随便一条新闻" },
);
assert.equal(unknownOgDoesNotPass.image, null);
assert.ok(["unsure", "og", "decor", "logo"].includes(unknownOgDoesNotPass.reason));

const v4Unknown = firstQualifyingImageV4([{ kind: "image", url: "https://ex.example/header.jpg", width: null, height: null }]);
assert.equal(v4Unknown.reason, "ok_unknown_width_as_800");
assert.equal(unknownOgDoesNotPass.image, null);

assert.equal(classifyValue({ url: "https://ex/logo.png", width: 800, height: 800 }).verdict, "reject");

const pubs = [
  { articleId: "c", firstParty: false, selected: true, score: 9, media: [{ kind: "image", url: "https://ex/c-eval-chart.png", width: 800, height: 500 }] },
  { articleId: "b", firstParty: true, selected: false, score: 1, media: [{ kind: "image", url: "https://ex/b-eval-chart.png", width: 800, height: 500 }] },
  { articleId: "a", firstParty: false, selected: false, score: 99, media: [{ kind: "image", url: "https://ex/a-eval-chart.png", width: 800, height: 500 }] },
  { articleId: "r", firstParty: false, selected: false, score: 0, media: [{ kind: "image", url: "https://ex/r-eval-chart.png", width: 800, height: 500 }] },
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
  title: "评测对照",
  representativeItemId: "r",
  publications: [
    {
      articleId: "r",
      bodyMode: "summary",
      listed: true,
      firstParty: true,
      selected: true,
      score: 10,
      media: [{ kind: "image", url: "https://ex/sum-eval-chart.png", width: 1200, height: 800 }],
    },
    {
      articleId: "x",
      bodyMode: "full",
      listed: true,
      firstParty: false,
      selected: false,
      score: 0,
      media: [{ kind: "image", url: "https://ex/x-eval-chart.png", width: 900, height: 600 }],
    },
  ],
});
assert.equal(hot.articleId, "x");
assert.equal(hot.cover.url, "https://ex/x-eval-chart.png");

const lead = leadCover("lead", [
  {
    articleId: "other",
    firstParty: true,
    score: 1,
    bodyMode: "full",
    listed: true,
    media: [{ kind: "image", url: "https://ex/fp-eval-chart.png", width: 700, height: 400 }],
  },
  {
    articleId: "lead",
    firstParty: false,
    score: 0,
    bodyMode: "full",
    listed: true,
    media: [{ kind: "image", url: "https://ex/lead-eval-chart.png", width: 700, height: 400 }],
  },
]);
assert.equal(lead.articleId, "lead");
assert.equal(lead.cover.url, "https://ex/lead-eval-chart.png");

const borrowed = leadCover("lead", [
  { articleId: "lead", firstParty: false, score: 0, bodyMode: "full", listed: true, media: [] },
  {
    articleId: "other",
    firstParty: true,
    score: 1,
    bodyMode: "full",
    listed: true,
    media: [{ kind: "image", url: "https://ex/fp-eval-chart.png", width: 700, height: 400 }],
  },
]);
assert.equal(borrowed.articleId, "other");

assert.ok(V5_OG_LOGO_SAMPLES.length >= 5, "at least 5 OG/Logo samples");
for (const sample of V5_OG_LOGO_SAMPLES) {
  const v4 = firstQualifyingImageV4(sample.publications[0].media, sample.publications[0]);
  const v5 = queryHotCovers({ representativeItemId: sample.publications[0].articleId, publications: sample.publications, title: sample.title, summary: sample.summary });
  assert.equal(v4.reason === "ok" || v4.reason === "ok_unknown_width_as_800", true, `${sample.id} v4 should hang a cover (${v4.reason})`);
  assert.equal(v5.cover, null, `${sample.id} v5 must be empty`);
  assert.equal(v5.reason, sample.v5, `${sample.id} v5 reason ${v5.reason} != ${sample.v5}`);
}

const officialFlux = pickFirstValuableImage(
  [{ kind: "image", url: "https://bfl.ai/blog/flux-3-image-klein/hero.jpg", width: 2000, height: 1344 }],
  {
    title: "Black Forest Labs 开源 FLUX.3 Image Klein（5.6B）",
    summary: "Black Forest Labs 在 Hugging Face 放出 FLUX.3 Image Klein 开源权重（约 5.6B），面向单消费级 GPU，支持原生 4K 与 bbox 编辑。",
    pageUrl: "https://bfl.ai/blog/flux-3-image-klein",
    firstParty: true,
  },
);
assert.equal(officialFlux.reason, "valuable");
assert.ok(["model_sample", "product_ui", "official_explainer"].includes(officialFlux.category));

const { rewriteMitStatic, prefixLocalAssetUrls } = await import("./build.mjs");
assert.equal(
  prefixLocalAssetUrls("assets/covers/a-720.webp 720w, assets/covers/a-1600.webp 1600w", "../"),
  "../assets/covers/a-720.webp 720w, ../assets/covers/a-1600.webp 1600w",
);
const rewritten = rewriteMitStatic(
  `<link imageSrcSet="assets/covers/a-720.webp 720w, assets/covers/a-1200.webp 1200w, assets/covers/a-1600.webp 1600w"/><img src="assets/covers/a-1600.webp" srcSet="assets/covers/a-720.webp 720w, assets/covers/a-1200.webp 1200w, assets/covers/a-1600.webp 1600w"/>`,
  "/hot/",
);
assert.match(rewritten, /src="\.\.\/assets\/covers\/a-1600\.webp"/);
assert.match(rewritten, /srcSet="\.\.\/assets\/covers\/a-720\.webp 720w, \.\.\/assets\/covers\/a-1200\.webp 1200w, \.\.\/assets\/covers\/a-1600\.webp 1600w"/);
assert.match(rewritten, /imageSrcSet="\.\.\/assets\/covers\/a-720\.webp 720w, \.\.\/assets\/covers\/a-1200\.webp 1200w, \.\.\/assets\/covers\/a-1600\.webp 1600w"/);
assert.doesNotMatch(rewritten, /(?:src|srcSet|imageSrcSet)="assets\//);
const atRoot = rewriteMitStatic(`<img src="assets/covers/a.webp" srcSet="assets/covers/a.webp 1600w"/>`, "/");
assert.match(atRoot, /src="assets\/covers\/a\.webp"/);
assert.doesNotMatch(atRoot, /src="\.\.\/assets\//);

console.log("cover_rules tests passed");
