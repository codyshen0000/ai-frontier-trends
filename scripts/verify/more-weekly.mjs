/** B-7: /more/ 研究主页 · 本周主线 points at the latest weekly issue. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const more = readFileSync(join(root, "dist", "more", "index.html"), "utf8");
const href = (more.match(/<a class="ft-more-card" href="([^"]+)"[^>]*>\s*<h3>研究主页 · 本周主线<\/h3>/) || [])[1];

assert.ok(href, "more page renders 研究主页 · 本周主线");
assert.match(href, /weekly\/2026-10-18/);
assert.notEqual(href, "../");
assert.notEqual(href, "./");

console.log(`verify/more-weekly: B-7 本周主线 → ${href}`);
