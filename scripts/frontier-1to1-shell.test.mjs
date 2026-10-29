import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hot = readFileSync(join(root, "preview/frontier-1to1/hot.html"), "utf8");
const home = readFileSync(join(root, "preview/frontier-1to1/index.html"), "utf8");

assert.match(hot, /讨论最多的 10 件事/);
assert.match(hot, /当前热度/);
assert.match(hot, /业务日内约每 15 分钟重算/);
assert.doesNotMatch(hot, /实时/);
assert.match(hot, /NO\.01/);
assert.match(hot, />10</);

assert.match(home, /AI 评分/);
assert.match(home, /data-ft-rating="86"/);
assert.match(home, /推荐理由/);
assert.doesNotMatch(home, /data-score|score-label|ft-score|"score"\s*:/);

console.log("frontier-1to1 shell sample ok");
