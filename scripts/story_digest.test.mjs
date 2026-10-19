import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyStoryDigest, findBannedMeta, loadStoryDigest, publicCopyFor } from "./story_digest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const generated = JSON.parse(readFileSync(join(here, "mit-static/src/covers.generated.json"), "utf8"));
const table = loadStoryDigest();

assert.ok(table.items["flux-3-image-klein"], "Klein overlay exists");
const klein = publicCopyFor("flux-3-image-klein");
assert.equal(klein.title, "Black Forest Labs 开源 FLUX.3 Image Klein（5.6B）");
assert.match(klein.digest, /^Black Forest Labs 在 Hugging Face 放出/);
assert.equal(findBannedMeta(klein.digest), null);
assert.equal(findBannedMeta("权重跟踪：Klein 记交付；六件套其余仍空。"), "权重跟踪");

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

console.log("story_digest tests passed");
