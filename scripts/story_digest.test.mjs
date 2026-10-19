import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyStoryDigest,
  assertCoverRecords,
  assertNoBannedPublicCopyInDir,
  assertWeeklyMetaCopy,
  assertWeeklyReportCopy,
  assertWeeklyReports,
  coverAltProblem,
  findBannedMeta,
  loadStoryDigest,
  publicCopyFor,
  PUBLIC_COPY_SCAN_EXTS,
  assertNoRootAbsoluteUrls,
  walkPublicCopyFiles,
} from "./story_digest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const generated = JSON.parse(readFileSync(join(here, "mit-static/src/covers.generated.json"), "utf8"));
const table = loadStoryDigest();

assert.ok(table.items["flux-3-image-klein"], "Klein overlay exists");
const klein = publicCopyFor("flux-3-image-klein");
assert.equal(klein.title, "Black Forest Labs 开源 FLUX.3 Image Klein（5.6B）");
assert.match(klein.digest, /^Black Forest Labs 在 Hugging Face 放出/);
assert.doesNotMatch(klein.digest, /本条未覆盖/);
assert.equal(findBannedMeta(klein.digest), null);
assert.equal(findBannedMeta("完整非 Klein 版权重本条未覆盖。"), "本条未覆盖");
assert.equal(findBannedMeta("权重跟踪：Klein 记交付；六件套其余仍空。"), "权重跟踪");
assert.equal(findBannedMeta("PenguinHarness 挂观察，未写入信号表 4"), "挂观察");
assert.equal(findBannedMeta("旁证，不进正表。"), "不进正表");
assert.equal(findBannedMeta("权重追踪栏目名应放行"), null);

const ids = (generated.hotEntries || []).map((e) => e.itemId);
assert.ok(ids.length >= 5, "at least 5 hot cards");
for (const id of ids) {
  const copy = publicCopyFor(id);
  const first = copy.digest.split(/[。\n]/)[0];
  assert.ok(first && first.length >= 8, `${id} first sentence exists`);
  assert.equal(findBannedMeta(copy.title), null, `${id} title clean`);
  assert.equal(findBannedMeta(copy.digest), null, `${id} digest clean`);
}

const applied = applyStoryDigest(generated);
assert.equal(applied.hotEntries[0].title, klein.title);
assert.equal(applied.hotEntries[0].summary, klein.digest);
assert.equal(applied.daily.title, klein.title);
assert.ok(!findBannedMeta(applied.daily.leadParagraph));
assert.doesNotMatch(JSON.stringify({ t: applied.hotEntries.map((e) => e.title), s: applied.hotEntries.map((e) => e.summary) }), /权重跟踪|记交付|本批|六件套|低于门槛|补位|score=/);

assert.equal(klein.alt, "FLUX.3 Image Klein 模型生成样图拼贴");
assert.equal(applied.hotEntries[0].coverOurs.alt, klein.alt);
assert.equal(applied.daily.coverOurs.alt, klein.alt);
assertCoverRecords(generated);
assert.equal(coverAltProblem(""), "empty");
assert.equal(coverAltProblem("   "), "empty");
assert.equal(coverAltProblem("hot-flux-3-image-klein-1600.webp"), "filename");
assert.equal(coverAltProblem("assets/covers/hot-flux-3-image-klein-1600.webp"), "filename");
assert.equal(coverAltProblem("https://cdn.example/cover.webp"), "url");
assert.equal(coverAltProblem(klein.alt), null);

const missingAlt = structuredClone(generated);
delete missingAlt.hotEntries[0].coverOurs.alt;
delete missingAlt.daily.coverOurs.alt;
assert.throws(() => assertCoverRecords(missingAlt), /cover alt is empty/, "negative: missing cover alt fails");

const filenameAlt = structuredClone(generated);
filenameAlt.hotEntries[0].coverOurs.alt = "hot-flux-3-image-klein-1600.webp";
assert.throws(() => assertCoverRecords(filenameAlt), /filename/, "negative: filename cover alt fails");

const overlayWithoutAlt = structuredClone(loadStoryDigest());
delete overlayWithoutAlt.items["flux-3-image-klein"].alt;
assert.throws(
  () => applyStoryDigest(missingAlt, overlayWithoutAlt),
  /cover alt is empty/,
  "negative: applyStoryDigest fails when cover alt is removed",
);

assertWeeklyReports(join(here, ".."));
assert.throws(
  () => assertWeeklyMetaCopy(JSON.stringify({ summary: "挂观察，不进信号表 4" }), "content/weekly/neg/meta.json"),
  /挂观察|不进信号表/,
  "negative: banned word in weekly meta.json summary fails",
);
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-banned-json-"));
  try {
    writeFileSync(join(tmp, "sitemap.json"), '{"note":"不进正表"}');
    assert.throws(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /sitemap\.json[\s\S]*不进正表/,
      "negative: banned word in a dist json file fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-banned-page-"));
  try {
    mkdirSync(join(tmp, "timeline"), { recursive: true });
    writeFileSync(join(tmp, "timeline", "index.html"), "<p>仍不升档</p>");
    assert.throws(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /timeline\/index\.html[\s\S]*不升档/,
      "negative: banned word in a non-weekly page fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
assert.throws(
  () => assertWeeklyReportCopy("交付，不进信号表", "<p>ok</p>", "neg-md"),
  /不进信号表/,
  "negative: banned 不进信号表 in weekly md fails",
);
assert.throws(
  () => assertWeeklyReportCopy("# ok", '<p>正文</p><img alt="挂 RSI 观察">', "neg-alt"),
  /挂 RSI/,
  "negative: banned 挂 RSI in weekly img alt fails",
);
assert.throws(
  () => assertWeeklyReportCopy("# ok", "<p>ok</p><figcaption>不进信号表</figcaption>", "neg-fig"),
  /不进信号表/,
  "negative: banned copy in weekly figcaption fails",
);

assert.ok([".html", ".json", ".xml", ".md", ".svg", ".js", ".map"].every((ext) => PUBLIC_COPY_SCAN_EXTS.has(ext)));
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-banned-md-"));
  try {
    writeFileSync(join(tmp, "note.md"), "正文不进正表。");
    assert.throws(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /note\.md[\s\S]*不进正表/,
      "negative: banned word in a dist md file fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-banned-svg-"));
  try {
    writeFileSync(join(tmp, "mark.svg"), "<svg><text>挂观察</text></svg>");
    assert.throws(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /mark\.svg[\s\S]*挂观察/,
      "negative: banned word in a dist svg file fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-banned-js-"));
  try {
    writeFileSync(join(tmp, "app.js"), 'const note = "不进信号表";');
    assert.throws(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /app\.js[\s\S]*不进信号表/,
      "negative: banned word in a dist js file fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-weekly-timeline-"));
  try {
    mkdirSync(join(tmp, "content", "weekly", "neg"), { recursive: true });
    writeFileSync(join(tmp, "content", "weekly", "neg", "timeline.md"), "- 旁证，不进正表。\n");
    assert.throws(
      () => assertWeeklyReports(tmp),
      /content\/weekly\/neg\/timeline\.md[\s\S]*不进正表/,
      "negative: banned word in weekly timeline.md fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-banned-map-"));
  try {
    writeFileSync(join(tmp, "hydrate.js.map"), '{"note":"本批"}');
    writeFileSync(join(tmp, "ok.png"), "not-text");
    const files = walkPublicCopyFiles(tmp);
    assert.ok(files.some((file) => file.endsWith("hydrate.js.map")), "default walk includes .map");
    assert.ok(!files.some((file) => file.endsWith(".png")), "default walk skips binary png");
    assert.throws(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /hydrate\.js\.map[\s\S]*本批/,
      "negative: banned word in a dist .map file fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-root-abs-"));
  try {
    writeFileSync(join(tmp, "starred.html"), '<a href="/weekly/2026-10-18/">周报</a>');
    assert.throws(
      () => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }),
      /starred\.html[\s\S]*\/weekly\/2026-10-18\//,
      "negative: root-absolute in-site URL fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-root-xml-"));
  try {
    writeFileSync(join(tmp, "weekly.xml"), "<rss><channel><item><link>/weekly/2026-10-18/</link></item></channel></rss>");
    assert.throws(
      () => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }),
      /weekly\.xml[\s\S]*\/weekly\/2026-10-18\//,
      "negative: RSS <link> text root-absolute fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-root-md-"));
  try {
    writeFileSync(join(tmp, "note.md"), "[x](/weekly/2026-10-18/)");
    assert.throws(
      () => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }),
      /note\.md[\s\S]*\/weekly\/2026-10-18\//,
      "negative: Markdown link root-absolute fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "digest-root-js-"));
  try {
    writeFileSync(join(tmp, "app.js"), 'fetch("/data/meta.json")');
    assert.throws(
      () => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }),
      /app\.js[\s\S]*\/data\/meta\.json/,
      "negative: JS string root-absolute fails",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log("story_digest tests passed");
