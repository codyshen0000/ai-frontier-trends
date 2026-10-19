import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractLiveSpotlight, extractThreads, extractTimelineLede, ensureThreadAnchors } from "./extract.mjs";
import { clipSummary, extractLiveCards, rankHot, selectPins } from "./live_cards.mjs";
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
assert(selectPins(liveCards, 5).length === 5, "pinned 当前热点 is Top 5");
assert(rankHot(liveCards).every((card) => card.sourceCount >= 1), "hot rank uses source counts");
assert(rankHot(liveCards).length <= 10, "hot rank caps at 10");
assert(
  clipSummary("短句。") === "短句。" &&
    clipSummary("先 GRPO，再让策略写事后技能，并对齐各层隐状态（非词概率）。Qwen2.5-3B 相对 GRPO：ALFWorld All +4.7pp。").length <= 120,
  "clipSummary shortens research-wall copy",
);

const paths = [
  "/",
  "/live/",
  "/hot/",
  "/daily/",
  "/more/",
  "/timeline/",
  "/weekly/",
  "/weekly/2026-10-12/",
  "/weekly/2026-10-18/",
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

assert(existsSync(join(distDir, "assets", "app.css")), "dist has mit-static app.css");
assert(existsSync(join(distDir, "assets", "nameplates", "daily.svg")), "dist has daily nameplate");
assert(existsSync(join(distDir, "data", "fixture-note.json")), "dist has fixture data");

const leftoverHtmlHref = /(?:href|src|action)="(?:index|hot|daily)\.html/;
const home = readFileSync(join(distDir, "index.html"), "utf8");
assert(home.includes("精选 · 前沿趋势"), "home is the 精选 feed");
assert(home.includes("当前热点"), "home has 当前热点");
assert(home.includes("完整榜单"), "home links into the ranking");
assert(home.includes('href="assets/app.css"'), "home CSS is relative assets/app.css");
assert(home.includes('href="./hot/"') && home.includes('href="./daily/"'), "home links to /hot/ and /daily/");
assert(!leftoverHtmlHref.test(home), "home has no leftover .html page hrefs");
assert(!home.includes("AIHOT") && !home.includes("MyHOT"), "home has no *HOT product brand");
assert(home.includes("前沿趋势"), "home brand is 前沿趋势");

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
assert(livePage.includes("精选 · 前沿趋势"), "/live/ is the 精选 feed");
assert(livePage.includes("当前热点") && livePage.includes("完整榜单"), "/live/ has 当前热点 panel");
assert(livePage.includes('href="../assets/app.css"'), "/live/ CSS is ../assets/app.css");
assert(livePage.includes('href="../hot/"') && livePage.includes('href="../daily/"'), "/live/ links to /hot/ and /daily/");
assert(livePage.includes(">精选<") && livePage.includes(">热点<") && livePage.includes(">日报<"), "/live/ tab bar is 精选 / 热点 / 日报");
assert(!leftoverHtmlHref.test(livePage), "/live/ has no leftover .html page hrefs");
assert(!livePage.includes("AIHOT") && !livePage.includes("MyHOT"), "live has no *HOT product brand");
assert(liveRaw.includes('id="back-home"'), "live source keeps #back-home");
for (const needle of ["/workspace", "/home/box", "/cursor/stores"]) {
  assert(!livePage.includes(needle), `live has no ${needle}`);
}

const hotPage = readFileSync(join(distDir, "hot", "index.html"), "utf8");
assert(hotPage.includes("AI 热点榜 · 前沿趋势") || hotPage.includes("热点榜"), "hot page title");
assert(hotPage.includes('href="../assets/app.css"'), "/hot/ CSS is ../assets/app.css");
assert(hotPage.includes('href="../"') && hotPage.includes('href="../daily/"'), "/hot/ links to 精选 and /daily/");
assert(hotPage.includes("发酵中"), "hot page keeps fixture 发酵中 chips");
assert(hotPage.includes("48") && hotPage.includes("小时"), "hot ranking window remains 48h");
assert(hotPage.includes("24 小时") || hotPage.includes("24小时"), "hot sparkline window is 24h");
const hotLeadImgs = [...hotPage.matchAll(/<img\b[^>]*>/g)].filter((m) => /aspect-\[16\/9\]/.test(m[0]));
assert(hotLeadImgs.length === 1, `hot paints exactly one lead picture (${hotLeadImgs.length})`);
assert(hotLeadImgs[0][0].includes("720w") && hotLeadImgs[0][0].includes("1200w") && hotLeadImgs[0][0].includes("1600w"), "hot lead srcSet is MIT hero 720/1200/1600");
assert(hotLeadImgs[0][0].includes("../assets/covers/"), "hot lead pictures are local build-time thumbs");
assert((hotPage.match(/<img\b/g) || []).length === 1, "hot page has a single <img> (NO.01 only)");
assert(!leftoverHtmlHref.test(hotPage), "/hot/ has no leftover .html page hrefs");
assert(!hotPage.includes("AIHOT") && !hotPage.includes("MyHOT"), "hot page has no *HOT product brand");

const morePage = readFileSync(join(distDir, "more", "index.html"), "utf8");
assert(morePage.includes("看板 Studio"), "Studio stays under 更多");
assert(morePage.includes("推翻信号") && morePage.includes("权重待交付"), "signals and weights are under 更多");
assert(morePage.includes("时间线"), "timeline is reachable from 更多");
assert(morePage.includes("日报"), "more page lists 日报");
assert(!morePage.includes("AIHOT") && !morePage.includes("MyHOT"), "more page has no *HOT product brand");

const dailyPage = readFileSync(join(distDir, "daily", "index.html"), "utf8");
assert(dailyPage.includes("AI 日报 · 前沿趋势"), "daily title uses 前沿趋势");
assert(dailyPage.includes('href="../assets/app.css"'), "/daily/ CSS is ../assets/app.css");
assert(dailyPage.includes("../assets/nameplates/daily.svg"), "/daily/ nameplate is a relative asset");
assert(dailyPage.includes('href="../"') && dailyPage.includes('href="../hot/"'), "/daily/ links to 精选 and /hot/");
assert(dailyPage.includes(">日报<") && dailyPage.includes('aria-current="page"'), "daily marks 日报 current");
assert(!leftoverHtmlHref.test(dailyPage), "/daily/ has no leftover .html page hrefs");
assert(!dailyPage.includes("AIHOT") && !dailyPage.includes("MyHOT"), "daily has no *HOT product brand");
const dailyStoryImgs = [...dailyPage.matchAll(/<article\b[^>]*class="[^"]*flex min-w-0[^"]*"[^>]*>[\s\S]*?<\/article>/g)]
  .filter((m) => /<img\b/.test(m[0]));
assert(dailyStoryImgs.length === 0, "daily section stories have no pictures");
const dailyImgs = [...dailyPage.matchAll(/<img\b[^>]*>/g)];
assert(dailyImgs.length === 1, `daily paints exactly one headline picture (${dailyImgs.length})`);
assert(dailyImgs[0][0].includes("720w") && dailyImgs[0][0].includes("1200w") && dailyImgs[0][0].includes("1600w"), "daily headline srcSet is MIT hero 720/1200/1600");
assert(dailyImgs[0][0].includes("../assets/covers/"), "daily headline uses local build-time thumbs");
assert(dailyImgs[0][0].includes('loading="eager"'), "daily headline is eager LCP");

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
assert(weeklyIndex.includes("weekly/2026-10-12/") || weeklyIndex.includes("./2026-10-12/"), "weekly index links to 2026-10-12");
assert(weeklyIndex.includes("2026-10-18"), "weekly index lists 2026-10-18");
assert(weeklyIndex.includes("weekly/2026-10-18/") || weeklyIndex.includes("./2026-10-18/"), "weekly index links to 2026-10-18");
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
assert(!/Noto Serif/.test(skinRaw) && !/#8B1E1E/.test(skinRaw), "daily CSS stays on the shared sans/teal tokens");
assert(skinRaw.includes("@media (max-width: 960px)"), "shell collapses to a bottom tab bar below 961px");
assert(!/ft-daily-rail\s*\{[^}]*position:\s*sticky/.test(skinRaw), "daily 今日看点 rail is not sticky");
assert(/\.ft-daily-card\s*\{[^}]*border:/.test(skinRaw), "daily calendar is a bordered card");
assert(/\.ft-daily-chrome\s*\{\s*display:\s*none;/.test(skinRaw), "mobile hides 往期 chrome so the calendar keeps the nameplate");
assert(/\.ft-daily-dot\s*\{[^}]*width:\s*22px/.test(skinRaw), "calendar dots have a 22px hit target");
assert(
  /\.ft-daily-dots\s*\{[^}]*minmax\(0,\s*1fr\)/.test(skinRaw),
  "calendar dots use shrinking columns so 1280 nameplate does not overflow",
);
assert(weeklyIndex.includes('class="ds-wrap'), "weekly index uses the centered ds-wrap shell");

const weeklyIssue = readFileSync(join(distDir, "weekly", "2026-10-12", "index.html"), "utf8");
const weeklyNav = weeklyIssue.match(/data-ds-injected="nav"[\s\S]*?<\/aside>/)?.[0] || "";
assert(weeklyNav.includes(">精选<") && weeklyNav.includes(">热点<") && weeklyNav.includes(">日报<") && weeklyNav.includes(">更多<"), "weekly injected nav is the 4-item IA");
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
  assert(existsSync(join(distDir, "weekly", "2026-10-12", file)), `weekly 2026-10-12 ships ${file}`);
  assert(existsSync(join(distDir, "weekly", "2026-10-18", file)), `weekly 2026-10-18 ships ${file}`);
}
assert(existsSync(join(distDir, "weekly", "2026-10-12", "charts", "2026-10-12-evidence-by-line.png")), "weekly 2026-10-12 ships chart pngs");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-evidence-by-line.png")), "weekly 2026-10-18 ships chart pngs");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-signal-candidates.png")), "weekly 2026-10-18 ships signal chart");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-weights-delivery.png")), "weekly 2026-10-18 ships weights chart");

const injected = injectHtmlFile(liveRaw, { currentId: "live", path: "/live/" });
assert(injectHtmlFile(injected, { currentId: "live", path: "/live/" }) === injected, "injectHtmlFile is idempotent");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nIA verification passed");
