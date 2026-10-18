import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractLiveSpotlight, extractThreads, extractTimelineLede, ensureThreadAnchors } from "./extract.mjs";
import { extractLiveCards, rankHot, selectPins } from "./live_cards.mjs";
import { injectHtmlFile } from "./build.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const liveRaw = readFileSync(join(root, "content", "live.html"), "utf8");
const timelineRaw = readFileSync(join(root, "content", "timeline.html"), "utf8");
const distDir = join(root, "dist");

let failed = 0;
function assert(cond, message) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL ${message}`);
  } else {
    console.log(`ok   ${message}`);
  }
}

const live = extractLiveSpotlight(liveRaw);
assert(live.conclusion.includes("少步蒸馏") || live.conclusion.length > 8, "live conclusion from meta description");
assert(/2026-\d{2}-\d{2}/.test(live.updatedAt), `live update time parsed (${live.updatedAt})`);

const extracted = extractThreads(timelineRaw, config.threadsFallback, 5);
assert(extracted.source === "timeline", "threads parsed from timeline.html");
assert(extracted.threads.length >= 3 && extracted.threads.length <= 5, `thread count ${extracted.threads.length}`);
assert(
  extracted.threads.every((t) => ["加强", "持平", "待验证"].includes(t.status)),
  "thread status chips are allowed values",
);
assert(
  extracted.threads.every((t) => t.sentence && !t.sentence.includes("主线 N")),
  "thread sentences reuse heading text",
);
assert(extracted.lede.includes("主线无推翻") || extracted.lede.length > 8, "timeline lede from 一句话结论");

function threadSample(lists) {
  const heads = [1, 2, 3, 4, 5]
    .map((n) => `<h3>主线 ${n}：标题${n}　【推断】</h3>`)
    .join("");
  return (
    heads +
    lists
      .map(([date, items]) => `<h2>${date} 变更</h2><ul>${items}</ul>`)
      .join("")
  );
}

const harden = extractThreads(threadSample([["2026-10-09", "<li>主线 1 加固：OPD 能锐化分布。</li>"]]), [], 5);
assert(harden.threads.find((t) => t.anchor === "thread-1")?.status === "加强", "主线 1 加固 → 加强");

const evidence = extractThreads(threadSample([["2026-10-09", "<li>主线 4 补证据：世界动作模型升温。</li>"]]), [], 5);
assert(evidence.threads.find((t) => t.anchor === "thread-4")?.status === "加强", "主线 4 补证据 → 加强");

const pairSample = threadSample([
  [
    "2026-10-09",
    "<li>主线 3、4 补证据：世界动作模型升温。</li><li>傍晚补丁：主线 3 写入 Rubric-CEPR；主线 5 注明 BudgetPix。</li>",
  ],
]);
const pair = extractThreads(pairSample, [], 5);
assert(pair.threads.find((t) => t.anchor === "thread-4")?.status === "加强", "主线 3、4 补证据 applies to both numbers");
assert(pair.threads.find((t) => t.anchor === "thread-3")?.status === "加强", "evening 写入 clause does not downgrade 主线 3");

const hold = extractThreads(
  threadSample([
    [
      "2026-10-11",
      "<li>主线 1 补充：ReSPO 修复用 rollout 时 clip 的不对称；等级不变。</li><li>主线 4 补充：STS、ETM 数据引擎；等级不变。</li>",
    ],
  ]),
  [],
  5,
);
assert(hold.threads.find((t) => t.anchor === "thread-1")?.status === "持平", "主线 1 补充…等级不变 → 持平");
assert(hold.threads.find((t) => t.anchor === "thread-4")?.status === "持平", "主线 4 补充…等级不变 → 持平");

const bump = extractThreads(threadSample([["2026-10-10", "<li>主线 3 升级一档：Arena 奖励增益。</li>"]]), [], 5);
assert(bump.threads.find((t) => t.anchor === "thread-3")?.status === "加强", "主线 3 升级一档 → 加强");

const inherit = extractThreads(
  threadSample([
    ["2026-10-09", "<li>主线 4 补证据：世界动作模型升温。</li>"],
    ["2026-10-10", "<li>主线 4：生图后训练侧出现首个只换数据对照。</li>"],
  ]),
  [],
  5,
);
assert(inherit.threads.find((t) => t.anchor === "thread-4")?.status === "加强", "主线 4： with no verb keeps 补证据");

assert(
  extractTimelineLede("<p><strong>一句话结论：主线无升降级；batch RL 修稳定性。</strong></p>") ===
    "主线无升降级；batch RL 修稳定性。",
  "plain 一句话结论 lede",
);

const weeklyEditionLede = extractTimelineLede(
  "<p><strong>一句话结论（2026-10-12 周报版）：对比 10-08 首版，评审进 RL 升一档并扩到视频。</strong></p>",
);
assert(
  weeklyEditionLede === "对比 10-08 首版，评审进 RL 升一档并扩到视频。",
  "weekly-edition 一句话结论（…） lede",
);

const futureEdition = extractThreads(
  `<p><strong>一句话结论（2026-10-19 周报版）：下周括号标签仍应抽出结论句。</strong></p>${threadSample([])}`,
  [],
  5,
);
assert(
  futureEdition.lede === "下周括号标签仍应抽出结论句。",
  "future 一句话结论（日期 周报版） still extracts lede",
);

const broken = extractThreads("<html><body><p>no threads</p></body></html>", config.threadsFallback, 5);
assert(broken.source === "fallback", "fallback when parsing fails");
assert(broken.threads.length >= 3, "fallback list is short but usable");

const anchored = ensureThreadAnchors(timelineRaw);
assert(anchored.includes('id="thread-1"'), "thread anchors added in output");
assert(ensureThreadAnchors(anchored) === anchored, "thread anchors are idempotent");

const liveCards = extractLiveCards(liveRaw);
assert(liveCards.length >= 8, `live cards extracted (${liveCards.length})`);
assert(liveCards.every((card) => card.title && card.day && card.summary), "live cards have title/day/summary");
assert(selectPins(liveCards, 4).length === 4, "pinned 当前热点 is Top 4");
assert(rankHot(liveCards).every((card) => card.sourceCount >= 1), "hot rank uses source counts");

const paths = [
  "/",
  "/live/",
  "/hot/",
  "/daily/",
  "/more/",
  "/timeline/",
  "/weekly/",
  "/weekly/2026-10-12/",
  "/signals/",
  "/weights/",
  "/flux3/",
  "/flux3/cases/",
  "/flux3/examples/",
  "/flux3/camera-terms/",
  "/about/",
];
for (const path of paths) {
  const file = path === "/" ? join(distDir, "index.html") : join(distDir, path.replace(/^\//, ""), "index.html");
  assert(existsSync(file), `dist has ${path}`);
}

const home = readFileSync(join(distDir, "index.html"), "utf8");
assert(home.includes('class="ds-wrap trend-home"') || home.includes('class="ds-wrap'), "home uses the centered ds-wrap shell");
assert(home.includes(config.heroLine), "home hero uses site one-liner");
assert(home.includes(live.conclusion), "home shows today's conclusion");
assert(home.includes("看精选"), "home CTA to /live/");
assert(home.includes("本周主线"), "home has 本周主线");
assert(home.includes("怎么读这个站"), "home has reader guide");
assert(home.includes("周报"), "home links to weekly");
assert(home.includes("/weekly/2026-10-12/") || home.includes("weekly/2026-10-12/"), "home links to latest weekly issue");
assert(home.includes(">FLUX 3<") || home.includes("FLUX 3"), "home has one FLUX 3 topic card");
assert((home.match(/class="ds-card trend-thread-card"/g) || []).length >= 3, "home has 3–5 thread cards");
assert(!home.includes("谱系"), "home avoids 谱系 jargon");
assert(!home.includes("待交付权重"), "home avoids 待交付 jargon");

const about = readFileSync(join(distDir, "about", "index.html"), "utf8");
assert(about.includes('class="ds-wrap'), "about uses the centered ds-wrap shell");
assert(about.includes("公开论文"), "about lists sources");
assert(about.includes("少步蒸馏"), "about explains 少步蒸馏");
assert(about.includes("当前位置") && about.includes("关于"), "about has section label");

const flux3 = readFileSync(join(distDir, "flux3", "index.html"), "utf8");
assert(flux3.includes("速查表") && flux3.includes("官方案例") && flux3.includes("示例库") && flux3.includes("相机术语"), "flux3 hub tabs");
assert(flux3.includes('aria-current="page"') && flux3.includes("速查表"), "flux3 速查表 tab is current");

const cases = readFileSync(join(distDir, "flux3", "cases", "index.html"), "utf8");
assert(cases.includes("trend-tabs"), "cases page keeps tab bar");

const signals = readFileSync(join(distDir, "signals", "index.html"), "utf8");
assert(signals.includes("升级信号：出现了"), "signals intro is plain language");
assert(signals.includes("趋势栏目"), "signals has trend sub-nav");
assert(signals.includes(">周报<"), "signals trend sub-nav includes 周报");

const livePage = readFileSync(join(distDir, "live", "index.html"), "utf8");
const liveNav = livePage.match(/data-ds-injected="nav"[\s\S]*?<\/aside>/)?.[0] || "";
const liveTab = livePage.match(/data-ds-injected="tabbar"[\s\S]*?<\/nav>/)?.[0] || "";
assert(liveNav.includes(">精选<") && liveNav.includes(">热点<") && liveNav.includes(">趋势<") && liveNav.includes(">更多<"), "live injected nav is the 4-item IA");
assert(liveNav.includes(">日报<"), "desktop sidebar surfaces 日报 under 成刊");
assert((liveTab.match(/<a /g) || []).length === 4 && !liveTab.includes(">日报<"), "mobile tab bar stays 精选/热点/趋势/更多");
assert(!liveNav.includes(">案例<") && !liveNav.includes(">示例库<") && !liveNav.includes(">相机术语<"), "live nav is not 11 flat links");
assert(!liveNav.includes("AIHOT") && !liveNav.includes("MyHOT"), "live nav has no *HOT product brand");
assert(livePage.includes("当前热点"), "live curated homepage has 当前热点");
assert(livePage.includes("data-ds-injected=\"live-curate\""), "live has curated transform");
assert(livePage.includes("data-ds-injected=\"live-archive\""), "live keeps original board in archive");
assert(livePage.includes("data-ds-injected=\"tabbar\""), "live has mobile tab bar");
assert(livePage.includes("ft-story"), "live maps cards into the date feed");
assert(livePage.includes('id="back-home"'), "live output keeps #back-home");
assert(liveRaw.includes('id="back-home"'), "live source keeps #back-home");
assert(livePage.includes("Hub 趋势") && livePage.includes("已宣布、待交付"), "research blocks remain in the live archive");
assert(livePage.includes("DOMContentLoaded") && livePage.includes("#board"), "live board view waits for DOM before hash switch");
const curatedBlock = livePage.match(/<!--ds-live-curate:start-->[\s\S]*?<!--ds-live-curate:end-->/)?.[0] || "";
assert(curatedBlock.includes("当前热点"), "curated block is marked for strip/rebuild");
assert(!curatedBlock.includes("paper-explain"), "curated feed does not inject 图解 into new cards");
for (const needle of ["/workspace", "/home/box", "/cursor/stores"]) {
  assert(!livePage.includes(needle), `live has no ${needle}`);
}

const hotPage = readFileSync(join(distDir, "hot", "index.html"), "utf8");
assert(hotPage.includes("热点榜"), "hot page title");
assert(hotPage.includes("独立来源"), "hot page explains source-count heat");
assert(hotPage.includes("ft-rank"), "hot page is a ranked list");
assert(!hotPage.includes("AIHOT") && !hotPage.includes("MyHOT"), "hot page has no *HOT product brand");

const morePage = readFileSync(join(distDir, "more", "index.html"), "utf8");
assert(morePage.includes("看板 Studio"), "Studio stays under 更多");
assert(morePage.includes("推翻信号") && morePage.includes("权重待交付"), "signals and weights are under 更多");
assert(morePage.includes("时间线"), "timeline is reachable from 更多");
assert(morePage.includes("日报"), "more page lists 日报");
assert(!morePage.includes("AIHOT") && !morePage.includes("MyHOT"), "more page has no *HOT product brand");

const dailyPage = readFileSync(join(distDir, "daily", "index.html"), "utf8");
const dailyNav = dailyPage.match(/data-ds-injected="nav"[\s\S]*?<\/aside>/)?.[0] || "";
const dailyTab = dailyPage.match(/data-ds-injected="tabbar"[\s\S]*?<\/nav>/)?.[0] || "";
assert(dailyPage.includes("前沿趋势日报"), "daily masthead uses 前沿趋势日报");
assert(dailyPage.includes("件大事") && dailyPage.includes("个来源"), "daily has derived stats strip");
assert(dailyPage.includes("头条"), "daily has 头条");
assert(dailyPage.includes("往期") && dailyPage.includes("ft-daily-chrome"), "daily has left 往期 chrome");
assert(dailyPage.includes("ft-daily-card") && dailyPage.includes("ft-daily-dots"), "daily calendar card sits in the nameplate");
assert(dailyPage.includes("前沿热点看板"), "daily dateline uses 前沿热点看板");
assert(dailyPage.includes("今日看点") && dailyPage.includes("本期版面"), "daily front rail has 今日看点 / 本期版面");
assert(dailyPage.includes("（本期完）"), "daily ends with 本期完");
assert(dailyPage.includes("ft-daily-kinds") && dailyPage.includes(">周报<"), "daily chrome has 日报/周报/月报");
assert(dailyPage.includes("ft-daily-issue") && dailyPage.includes("data-ft-issue"), "daily renders edition(s) from live cards");
assert(dailyPage.includes("data-ds-generated=\"daily\""), "daily is generated at build time");
assert(dailyNav.includes(">日报<") && dailyNav.includes("aria-current=\"page\""), "sidebar 日报 is current on /daily/");
assert((dailyTab.match(/<a /g) || []).length === 4, "daily keeps the 4-item mobile tab bar");
assert(!dailyPage.includes("AIHOT") && !dailyPage.includes("MyHOT"), "daily has no *HOT product brand");
assert(!dailyPage.includes("第180期") && !dailyPage.includes("AI日报"), "daily does not copy aihot masthead copy");
assert(dailyPage.includes("Noto Serif SC") && dailyPage.includes("Noto Sans SC"), "daily loads Noto Serif/Sans SC");
assert(dailyPage.includes("#F7F4EC") && dailyPage.includes("#8B1E1E") && dailyPage.includes("#1F3A5F"), "daily embeds E-Ink paper tokens");
assert(dailyPage.includes('data-ds-injected="daily-skin"'), "daily injects editorial skin");
{
  const dailySkin = dailyPage.match(/data-ds-injected="daily-skin"[\s\S]*?<\/style>/)?.[0] || "";
  assert(dailySkin && !/Inter/.test(dailySkin), "daily skin stack has no Inter");
}
assert(livePage.includes("data-ds-injected=\"live-curate\""), " /live/ curated homepage remains");

assert(/body\{[^}]*max-width:\s*\d+px;[^}]*margin:[^;]*auto/.test(timelineRaw), "timeline source keeps a centered reading column");
assert(/main\{[^}]*max-width:\s*\d+px;[^}]*margin:[^;]*auto/.test(liveRaw), "live source keeps a centered main column");

const timelinePage = readFileSync(join(distDir, "timeline", "index.html"), "utf8");
assert(timelinePage.includes('id="thread-1"'), "timeline output has thread anchors");
assert(timelinePage.includes("skin-raw.css"), "timeline loads skin-raw.css");
for (const needle of ["/workspace", "/home/box", "/cursor/stores"]) {
  assert(!timelinePage.includes(needle), `timeline has no ${needle}`);
}

const weeklyIndex = readFileSync(join(distDir, "weekly", "index.html"), "utf8");
assert(weeklyIndex.includes("趋势栏目"), "weekly index has trend sub-nav");
assert(weeklyIndex.includes("2026-10-12"), "weekly index lists 2026-10-12");
assert(weeklyIndex.includes("weekly/2026-10-12/") || weeklyIndex.includes("./2026-10-12/"), "weekly index links to the issue");
assert(weeklyIndex.includes(">周报<"), "weekly tab is in trend sub-nav");

const skinRaw = readFileSync(join(root, "src", "skin-raw.css"), "utf8");
assert(
  /html\.ds-page\s+body\s*\{[^}]*margin-inline:\s*auto/.test(skinRaw),
  "skin-raw restores body centering after ds.css margin reset",
);
assert(
  /html\.ds-page\s+main\s*\{[^}]*margin-inline:\s*auto/.test(skinRaw),
  "skin-raw keeps live's main{margin:auto} column after inject",
);
assert(
  !/html\.ds-page\s+body\s*\{[^}]*max-width/.test(skinRaw),
  "skin-raw does not force a body max-width onto live",
);
assert(skinRaw.includes("#faf9f6") && skinRaw.includes("#f3f3ef"), "skin-raw defines warm-paper tokens");
assert(skinRaw.includes("--ft-teal") && !/#0071e3/.test(skinRaw), "reading shell uses a single teal accent");
assert(skinRaw.includes("@media (max-width: 960px)"), "shell collapses to a bottom tab bar below 961px");
assert(!/ft-daily-rail\s*\{[^}]*position:\s*sticky/.test(skinRaw), "daily 今日看点 rail is not sticky");
assert(/\.ft-daily-card\s*\{[^}]*border:/.test(skinRaw), "daily calendar is a bordered card");
assert(/\.ft-daily-chrome\s*\{\s*display:\s*none;/.test(skinRaw), "mobile hides 往期 chrome so the calendar keeps the nameplate");
assert(weeklyIndex.includes('class="ds-wrap'), "weekly index uses the centered ds-wrap shell");

const weeklyIssue = readFileSync(join(distDir, "weekly", "2026-10-12", "index.html"), "utf8");
const weeklyNav = weeklyIssue.match(/data-ds-injected="nav"[\s\S]*?<\/aside>/)?.[0] || "";
assert(weeklyNav.includes(">精选<") && weeklyNav.includes(">热点<") && weeklyNav.includes(">趋势<") && weeklyNav.includes(">更多<"), "weekly injected nav is the 4-item IA");
assert(weeklyIssue.includes(">周报<"), "weekly issue still exposes 周报");
assert(weeklyIssue.includes("一句话结论"), "weekly issue keeps the report lede");
assert(weeklyIssue.includes("data-ds-injected=\"weekly\""), "weekly issue has download chrome");
assert(weeklyIssue.includes("./report.md") && weeklyIssue.includes("./timeline.md"), "weekly issue links markdown downloads");
assert(weeklyIssue.includes("https://codyshen0000.github.io/assets/ds.css"), "weekly issue uses shared ds.css");
assert(weeklyIssue.includes("skin-raw.css"), "weekly issue loads skin-raw.css");
assert(/body\{[^}]*max-width:\s*\d+px;[^}]*margin:[^;]*auto/.test(weeklyIssue), "weekly issue source keeps a reading-column max-width");
for (const needle of ["/workspace", "/home/box", "/cursor/stores", "收藏"]) {
  assert(!weeklyIssue.includes(needle), `weekly issue has no ${needle}`);
  assert(!weeklyIndex.includes(needle), `weekly index has no ${needle}`);
}

for (const file of ["report.md", "timeline.md", "report.html"]) {
  assert(existsSync(join(distDir, "weekly", "2026-10-12", file)), `weekly issue ships ${file}`);
}
assert(existsSync(join(distDir, "weekly", "2026-10-12", "charts", "2026-10-12-evidence-by-line.png")), "weekly issue ships chart pngs");

const injected = injectHtmlFile(liveRaw, { currentId: "live", path: "/live/" });
assert(injectHtmlFile(injected, { currentId: "live", path: "/live/" }) === injected, "injectHtmlFile is idempotent");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nIA verification passed");
