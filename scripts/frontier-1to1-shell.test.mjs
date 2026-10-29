import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { morePageBody } from "./live_curate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hot = readFileSync(join(root, "preview/frontier-1to1/hot.html"), "utf8");
const home = readFileSync(join(root, "preview/frontier-1to1/index.html"), "utf8");
const leaderboard = readFileSync(join(root, "preview/frontier-1to1/leaderboard.html"), "utf8");
const agent = readFileSync(join(root, "preview/frontier-1to1/agent.html"), "utf8");
const changelog = readFileSync(join(root, "preview/frontier-1to1/changelog.html"), "utf8");
const feedback = readFileSync(join(root, "preview/frontier-1to1/feedback.html"), "utf8");
const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));

assert.match(hot, /讨论最多的 10 件事/);
assert.match(hot, /当前热度/);
assert.match(hot, /业务日内约每 15 分钟重算/);
assert.doesNotMatch(hot, /实时/);
assert.match(hot, /NO\.01/);
assert.match(hot, />10</);
assert.match(hot, /data-ft-cover="empty"/);
assert.match(hot, /无说明性配图/);

assert.match(home, /AI 评分/);
assert.match(home, /data-ft-rating="86"/);
assert.match(home, /推荐理由/);
assert.doesNotMatch(home, /data-score|score-label|ft-score|"score"\s*:/);

for (const [name, html] of [
  ["hot", hot],
  ["home", home],
  ["leaderboard", leaderboard],
  ["agent", agent],
  ["changelog", changelog],
  ["feedback", feedback],
]) {
  assert.match(html, /前沿趋势/, `${name} brands 前沿趋势`);
  assert.doesNotMatch(html, /AIHOT|MyHOT/, `${name} has no *HOT product brand`);
  assert.doesNotMatch(html, /实时/, `${name} has no fake 实时`);
}

assert.match(leaderboard, /静态占位/);
assert.match(leaderboard, /EX-03/);
assert.match(agent, /Agent 接入/);
assert.match(agent, /EX-04/);
assert.match(changelog, /更新日志/);
assert.match(feedback, /反馈/);
assert.match(feedback, /Issues/);

const stubIds = ["leaderboard", "agent", "changelog", "feedback"];
const pageIds = new Set((config.pages || []).map((page) => page.id));
for (const id of stubIds) {
  assert.equal(pageIds.has(id), true, `site.config pages includes ${id}`);
  const md = readFileSync(join(root, `content/${id}.md`), "utf8");
  assert.doesNotMatch(md, /AIHOT|MyHOT|实时/);
  assert.doesNotMatch(md, /\]\(\//, `${id}.md has no root-absolute markdown links`);
}

const more = morePageBody({
  hrefBetween: (_from, to) => to,
  escapeHtml: (value) => value,
});
assert.match(more, /\/leaderboard\//);
assert.match(more, /\/agent\//);
assert.match(more, /\/changelog\//);
assert.match(more, /\/feedback\//);
assert.match(more, /\/about\//);
assert.doesNotMatch(more, /实时|AIHOT|MyHOT/);

console.log("frontier-1to1 shell sample ok");
