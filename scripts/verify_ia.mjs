import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractLiveSpotlight, extractThreads, extractTimelineLede, ensureThreadAnchors } from "./extract.mjs";
import { clipSummary, extractLiveCards, rankHot, selectPins } from "./live_cards.mjs";
import { injectHtmlFile } from "./build.mjs";
import {
  BANNED_PUBLIC_COPY,
  assertCoverRecords,
  assertDistPublicCopy,
  assertNoBannedPublicCopyInDir,
  assertNoRootAbsoluteUrls,
  assertWeeklyMetaCopy,
  assertWeeklyMetaSources,
  assertWeeklyReports,
  collectBannedPublicCopyHits,
  collectRootAbsoluteUrlHits,
  coverAltProblem,
  coverEntries,
  walkPublicCopyFiles,
} from "./story_digest.mjs";
import { assertStandaloneReportCharts } from "./weekly_charts.mjs";
import {
  assertPublicLinks,
  collectExampleComHits,
  collectHomeFallbackHits,
  collectSelfLinkHits,
} from "./static_links.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const liveRaw = readFileSync(join(root, "content", "live.html"), "utf8");
const timelineRaw = readFileSync(join(root, "content", "timeline.html"), "utf8");
const distDir = join(root, "dist");
const generatedCovers = JSON.parse(readFileSync(join(root, "scripts", "mit-static", "src", "covers.generated.json"), "utf8"));

function decodeHtmlAttr(value) {
  return String(value)
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

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
assert(!existsSync(join(distDir, "data", "fixture-note.json")), "dist/data has no fixture-note");
assert(existsSync(join(distDir, "assets", "favicon.svg")), "dist has favicon.svg");
assert(existsSync(join(distDir, "assets", "favicon.png")), "dist has favicon.png");
assert(existsSync(join(distDir, "favicon.ico")), "dist has favicon.ico");
assert(existsSync(join(distDir, "search", "index.html")), "dist has /search/");
assert(existsSync(join(distDir, "starred", "index.html")), "dist has /starred/");
assert(existsSync(join(distDir, "feed", "weekly.xml")), "dist has /feed/weekly.xml");
assert(!existsSync(join(distDir, "feed.xml")), "dist has no fixture feed.xml");
assert(existsSync(join(distDir, "api", "v1", "index.json")), "dist has /api/v1/index.json");
assert(existsSync(join(distDir, "data", "meta.json")), "dist has /data/meta.json");
assert(existsSync(join(distDir, "data", "search-index.json")), "dist has search index");
assert(existsSync(join(distDir, "assets", "hydrate.js")), "dist has hydrate.js");

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
assert(hotPage.includes("24 小时") || hotPage.includes("24小时") || hotPage.includes("小时走势"), "hot sparkline window is 24h");
const hotCoverImgs = [...hotPage.matchAll(/<img\b[^>]*>/g)].filter((m) => /assets\/covers\//.test(m[0]));
assert(hotCoverImgs.length <= 1, `hot paints at most one cover (${hotCoverImgs.length})`);
if (hotCoverImgs.length === 1) {
  assert(hotCoverImgs[0][0].includes("720w") && hotCoverImgs[0][0].includes("1200w") && hotCoverImgs[0][0].includes("1600w"), "hot lead srcset is MIT hero 720/1200/1600");
  assert(/src="\.\.\/assets\/covers\//.test(hotCoverImgs[0][0]), "hot lead src is ../assets/covers");
  assert(/\bsrcset="\.\.\/assets\/covers\//.test(hotCoverImgs[0][0]), "hot lead srcset uses the same ../assets/covers prefix");
  assert(/\bsizes="/.test(hotCoverImgs[0][0]), "hot lead img has sizes");
  assert(/\bimagesrcset="\.\.\/assets\/covers\//.test(hotPage), "hot preload imagesrcset uses ../assets/covers");
  assert(/\bimagesizes="/.test(hotPage), "hot preload has imagesizes");
  assert(!/(?:src|srcset|imagesrcset)="assets\/covers\//i.test(hotPage), "hot cover attrs do not keep unprefixed assets/covers");
  assert(/\bwidth="\d+"/.test(hotCoverImgs[0][0]) && /\bheight="\d+"/.test(hotCoverImgs[0][0]), "hot cover has width/height");
  assert(!/src="https?:\/\//.test(hotCoverImgs[0][0]), "hot cover is not a hotlink");
  const hotAlt = decodeHtmlAttr((hotCoverImgs[0][0].match(/\balt="([^"]*)"/) || [])[1] || "");
  assert(Boolean(generatedCovers.hotEntries?.[0]?.coverOurs?.alt), "hot cover data has alt");
  assert(hotAlt === generatedCovers.hotEntries[0].coverOurs.alt, "hot cover img alt matches cover data");
  assert(!coverAltProblem(hotAlt), "hot cover alt is not empty, a filename, or a URL");
} else {
  assert(!/>24 小时热度</.test(hotPage), "empty hot cover slot is not filled with a heat panel");
}
assert(!leftoverHtmlHref.test(hotPage), "/hot/ has no leftover .html page hrefs");
assert(!hotPage.includes("AIHOT") && !hotPage.includes("MyHOT"), "hot page has no *HOT product brand");
assert(hotPage.includes("Black Forest Labs 开源 FLUX.3 Image Klein"), "hot NO.01 uses story-digest Klein title");
assert(hotPage.includes("在 Hugging Face 放出"), "hot NO.01 digest is answer-first");
for (const needle of ["权重跟踪", "记交付", "六件套", "低于门槛", "本批", "本条未覆盖", "score=", "闸分", "补位"]) {
  assert(!hotPage.includes(needle), `/hot/ public copy has no ${needle}`);
}
assert(!/>示例</.test(hotPage), "hot sparkline no longer writes 示例");
assert(!/text-\[10px\] leading-none text-ink-4">示例/.test(hotPage), "hot sparkline 示例 is not 10px");

const morePage = readFileSync(join(distDir, "more", "index.html"), "utf8");
assert(morePage.includes("看板 Studio"), "Studio stays under 更多");
assert(morePage.includes("推翻信号") && morePage.includes("权重待交付"), "signals and weights are under 更多");
assert(morePage.includes("时间线"), "timeline is reachable from 更多");
assert(morePage.includes("日报"), "more page lists 日报");
assert(!morePage.includes("AIHOT") && !morePage.includes("MyHOT"), "more page has no *HOT product brand");

const dailyPage = readFileSync(join(distDir, "daily", "index.html"), "utf8");
assert(dailyPage.includes("AI 日报 · 前沿趋势"), "daily title uses 前沿趋势");
assert(dailyPage.includes('href="../assets/app.css"'), "/daily/ CSS is ../assets/app.css");
assert(dailyPage.includes('href="../feed/weekly.xml"'), "/daily/ RSS is ../feed/weekly.xml");
assert(home.includes('href="feed/weekly.xml"'), "home RSS is feed/weekly.xml");
assert(hotPage.includes('href="../feed/weekly.xml"'), "/hot/ RSS is ../feed/weekly.xml");
assert(dailyPage.includes("../assets/nameplates/daily.svg"), "/daily/ nameplate is a relative asset");
assert(dailyPage.includes('href="../"') && dailyPage.includes('href="../hot/"'), "/daily/ links to 精选 and /hot/");
assert(dailyPage.includes(">日报<") && dailyPage.includes('aria-current="page"'), "daily marks 日报 current");
assert(!leftoverHtmlHref.test(dailyPage), "/daily/ has no leftover .html page hrefs");
assert(!dailyPage.includes("AIHOT") && !dailyPage.includes("MyHOT"), "daily has no *HOT product brand");
assert(dailyPage.includes("Black Forest Labs 开源 FLUX.3 Image Klein"), "daily headline uses story-digest Klein title");
for (const needle of ["权重跟踪", "记交付", "六件套", "低于门槛", "本批", "本条未覆盖", "score=", "闸分", "补位"]) {
  assert(!dailyPage.includes(needle), `/daily/ public copy has no ${needle}`);
}
const dailyCoverImgs = [...dailyPage.matchAll(/<img\b[^>]*>/g)].filter((m) => /assets\/covers\//.test(m[0]));
const emptyHotPreview = join(root, "preview", "mit-static", "hot-empty.html");
const emptyDailyPreview = join(root, "preview", "mit-static", "daily-empty.html");
if (existsSync(emptyHotPreview)) {
  const emptyHot = readFileSync(emptyHotPreview, "utf8");
  assert(!emptyHot.includes("assets/covers/"), "hot-empty preview has no cover assets");
  assert(!/>24 小时热度</.test(emptyHot), "hot-empty preview does not fill the cover slot with HeatPanel");
}
if (existsSync(emptyDailyPreview)) {
  const emptyDaily = readFileSync(emptyDailyPreview, "utf8");
  assert(!emptyDaily.includes("assets/covers/"), "daily-empty preview has no cover assets");
}
assert(dailyCoverImgs.length <= 1, `daily paints at most one headline cover (${dailyCoverImgs.length})`);
if (dailyCoverImgs.length === 1) {
  assert(dailyCoverImgs[0][0].includes("720w") && dailyCoverImgs[0][0].includes("1200w") && dailyCoverImgs[0][0].includes("1600w"), "daily headline srcset is MIT hero 720/1200/1600");
  assert(/src="\.\.\/assets\/covers\//.test(dailyCoverImgs[0][0]), "daily headline src is ../assets/covers");
  assert(/\bsrcset="\.\.\/assets\/covers\//.test(dailyCoverImgs[0][0]), "daily headline srcset uses the same ../assets/covers prefix");
  assert(/\bsizes="/.test(dailyCoverImgs[0][0]), "daily headline img has sizes");
  assert(/\bimagesrcset="\.\.\/assets\/covers\//.test(dailyPage), "daily preload imagesrcset uses ../assets/covers");
  assert(/\bimagesizes="/.test(dailyPage), "daily preload has imagesizes");
  assert(!/(?:src|srcset|imagesrcset)="assets\/covers\//i.test(dailyPage), "daily cover attrs do not keep unprefixed assets/covers");
  assert(/\bwidth="\d+"/.test(dailyCoverImgs[0][0]) && /\bheight="\d+"/.test(dailyCoverImgs[0][0]), "daily cover has width/height");
  assert(!/src="https?:\/\//.test(dailyCoverImgs[0][0]), "daily cover is not a hotlink");
  const dailyAlt = decodeHtmlAttr((dailyCoverImgs[0][0].match(/\balt="([^"]*)"/) || [])[1] || "");
  assert(Boolean(generatedCovers.daily?.coverOurs?.alt), "daily cover data has alt");
  assert(dailyAlt === generatedCovers.daily.coverOurs.alt, "daily cover img alt matches cover data");
  assert(!coverAltProblem(dailyAlt), "daily cover alt is not empty, a filename, or a URL");
}

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
assert(weeklyIssue.includes("skin-weekly.css"), "weekly issue loads weekly-only skin");
assert(!weeklyIssue.includes("skin-raw.css"), "weekly issue does not load Remaining-A skin-raw.css");
assert(!weeklyIssue.includes("app.css") && !weeklyIssue.includes("hydrate.js"), "weekly issue does not load Remaining-A assets");
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
assert(existsSync(join(distDir, "weekly", "2026-10-12", "charts", "2026-10-12-evidence-by-line.webp")), "weekly 2026-10-12 ships chart webp");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-evidence-by-line.png")), "weekly 2026-10-18 ships chart pngs");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-evidence-by-line.webp")), "weekly 2026-10-18 ships evidence webp");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-signal-candidates.png")), "weekly 2026-10-18 ships signal chart");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-signal-candidates.webp")), "weekly 2026-10-18 ships signal webp");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-weights-delivery.png")), "weekly 2026-10-18 ships weights chart");
assert(existsSync(join(distDir, "weekly", "2026-10-18", "charts", "2026-10-18-weights-delivery.webp")), "weekly 2026-10-18 ships weights webp");
{
  const weeklyReport = readFileSync(join(root, "content", "weekly", "2026-10-18", "report.html"), "utf8");
  const weeklyMd = readFileSync(join(root, "content", "weekly", "2026-10-18", "report.md"), "utf8");
  const weeklyDist = readFileSync(join(distDir, "weekly", "2026-10-18", "index.html"), "utf8");
  assert(weeklyReport.includes('alt="本周证据写入：交付与 OPD/RSI 观察最多；主线等级全不变"'), "evidence chart alt matches the image title");
  assert(weeklyReport.includes("<figcaption>本周证据写入：交付与 OPD/RSI 观察最多；主线等级全不变</figcaption>"), "evidence chart figcaption matches the image title");
  assert(weeklyReport.includes('alt="信号表 1–4：本周续核多篇，正表零新增；一周无翻转"'), "signal chart alt matches the image title");
  assert(weeklyReport.includes("<figcaption>信号表 1–4：本周续核多篇，正表零新增；一周无翻转</figcaption>"), "signal chart figcaption matches the image title");
  assert(weeklyReport.includes('alt="权重与产品：本周兑现 3 项，仍空 3 项（截至 2026-10-16 傍晚）"'), "weights chart alt matches the image title");
  assert(weeklyReport.includes("<figcaption>权重与产品：本周兑现 3 项，仍空 3 项（截至 2026-10-16 傍晚）</figcaption>"), "weights chart figcaption matches the image title");
  assert(!weeklyReport.includes("正表仍零新增") && !weeklyMd.includes("正表仍零新增"), "weekly copy no longer says 正表仍零新增");
  assert(weeklyMd.includes("![本周证据写入：交付与 OPD/RSI 观察最多；主线等级全不变]"), "weekly md evidence alt matches the image");
  assert(weeklyMd.includes("![信号表 1–4：本周续核多篇，正表零新增；一周无翻转]"), "weekly md signal alt matches the image");
  for (const name of ["2026-10-18-evidence-by-line", "2026-10-18-signal-candidates", "2026-10-18-weights-delivery"]) {
    assert(weeklyDist.includes(`srcset="charts/${name}.webp"`), `dist weekly uses ${name}.webp`);
    assert(weeklyDist.includes(`src="charts/${name}.png"`), `dist weekly keeps ${name}.png fallback`);
    assert(weeklyReport.includes(`srcset="charts/${name}.webp"`) || weeklyReport.includes(`src="charts/${name}.png"`), `content weekly report references ${name}`);
  }
  assert(!weeklyDist.includes("data:image/png;base64"), "dist weekly issue no longer embeds PNG data URIs");
  for (const date of ["2026-10-12", "2026-10-18"]) {
    const reportDist = readFileSync(join(distDir, "weekly", date, "report.html"), "utf8");
    try {
      assertStandaloneReportCharts(reportDist);
      assert(true, `dist weekly ${date}/report.html embeds WebP data URIs`);
    } catch (err) {
      assert(false, err.message);
    }
    assert(
      /<picture><source type="image\/webp" srcset="data:image\/webp;base64,/.test(reportDist),
      `dist weekly ${date}/report.html keeps weekly <picture> + WebP data URI format`,
    );
    assert(
      !/\b(?:src|srcset|imagesrcset)=["'](?!data:image\/webp;base64,)[^"']+["']/.test(
        reportDist.replace(/<script\b[\s\S]*?<\/script>/gi, ""),
      ),
      `dist weekly ${date}/report.html has no external image src`,
    );
  }
}

try {
  assertCoverRecords(generatedCovers);
  assert(true, "cover records in generated data have usable alt");
} catch (err) {
  assert(false, err.message);
}
try {
  assertWeeklyReports(root);
  assert(true, "weekly report.md/html/timeline.md/meta.json have no banned public copy");
} catch (err) {
  assert(false, err.message);
}
try {
  assertWeeklyMetaSources(root);
  assert(true, "content weekly meta.json sources have no banned public copy");
} catch (err) {
  assert(false, err.message);
}

function expectThrow(fn, re, message) {
  try {
    fn();
    assert(false, message);
  } catch (err) {
    assert(re.test(String(err.message)), `${message} (got: ${err.message})`);
  }
}

{
  const tmp = mkdtempSync(join(tmpdir(), "ia-banned-json-"));
  try {
    writeFileSync(join(tmp, "feed.json"), JSON.stringify({ summary: "本条未覆盖" }));
    expectThrow(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /feed\.json[\s\S]*本条未覆盖/,
      "negative: banned word in a dist json file fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
expectThrow(
  () => assertWeeklyMetaCopy(JSON.stringify({ summary: "PenguinHarness 挂观察" }), "content/weekly/neg/meta.json"),
  /挂观察/,
  "negative: banned word in a weekly meta.json summary fails verify:ia",
);
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-banned-page-"));
  try {
    mkdirSync(join(tmp, "about"), { recursive: true });
    writeFileSync(join(tmp, "about", "index.html"), "<p>评级讨论：不升档</p>");
    expectThrow(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /about\/index\.html[\s\S]*不升档/,
      "negative: banned word in a non-weekly page fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-banned-md-"));
  try {
    writeFileSync(join(tmp, "note.md"), "正文写了不进正表。");
    expectThrow(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /note\.md[\s\S]*不进正表/,
      "negative: banned word in a dist md file fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-banned-svg-"));
  try {
    writeFileSync(join(tmp, "mark.svg"), `<svg xmlns="http://www.w3.org/2000/svg"><text>挂观察</text></svg>`);
    expectThrow(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /mark\.svg[\s\S]*挂观察/,
      "negative: banned word in a dist svg file fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-banned-js-"));
  try {
    writeFileSync(join(tmp, "app.js"), `const note = "不进信号表";`);
    expectThrow(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /app\.js[\s\S]*不进信号表/,
      "negative: banned word in a dist js file fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-banned-css-"));
  try {
    writeFileSync(join(tmp, "skin-raw.css"), "/* 挂观察 */ body{color:red}");
    expectThrow(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /skin-raw\.css[\s\S]*挂观察/,
      "negative: banned word in a dist css file fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-brand-css-"));
  try {
    writeFileSync(join(tmp, "skin-raw.css"), "/* aihot daily IA */ body{color:red}");
    let hits = 0;
    for (const file of walkPublicCopyFiles(tmp)) {
      if (/aihot|myhot/i.test(readFileSync(file, "utf8"))) hits += 1;
    }
    assert(hits > 0, "negative: aihot in skin-raw.css fails the brand scan");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const distCopyFiles = walkPublicCopyFiles(distDir);
const distCopyHits = collectBannedPublicCopyHits(distDir, { prefix: "dist/" });
for (const hit of distCopyHits) {
  console.error(`FAIL banned «${hit.word}» in ${hit.file}`);
}
assert(
  distCopyHits.length === 0,
  `dist text files (including .map) have 0 banned-word hits (${distCopyHits.length} hits across ${distCopyFiles.length} files)`,
);
try {
  assertDistPublicCopy(distDir);
  assert(true, "assertDistPublicCopy matches the all-text dist scan including .map");
} catch (err) {
  assert(false, err.message);
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-banned-map-"));
  try {
    writeFileSync(join(tmp, "hydrate.js.map"), '{"mappings":"","note":"本批"}');
    expectThrow(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /hydrate\.js\.map[\s\S]*本批/,
      "negative: banned word in a dist .map file fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-root-abs-"));
  try {
    writeFileSync(join(tmp, "starred.html"), '<a href="/weekly/2026-10-18/">周报</a>');
    expectThrow(
      () => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }),
      /starred\.html[\s\S]*\/weekly\/2026-10-18\//,
      "negative: injected root-absolute in-site URL fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const rootAbs = collectRootAbsoluteUrlHits(distDir, { prefix: "dist/" });
  for (const hit of rootAbs) {
    console.error(`FAIL root-absolute ${hit.kind} «${hit.value}» in ${hit.file}`);
  }
  assert(rootAbs.length === 0, `in-site URLs in dist do not start with / (${rootAbs.length})`);
}

function walkHtmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtmlFiles(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function parseSrcsetUrls(value) {
  return String(value)
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function localAssetUrlsFromHtml(html) {
  const urls = [];
  const attrRe = /\b(src|srcset|imagesrcset)="([^"]*)"/gi;
  let match;
  while ((match = attrRe.exec(html))) {
    const attr = match[1].toLowerCase();
    const value = match[2];
    if (attr === "srcset" || attr === "imagesrcset") urls.push(...parseSrcsetUrls(value));
    else if (value) urls.push(value.trim());
  }
  return urls;
}

function skipRemoteOrEmpty(url) {
  if (!url || url.startsWith("#") || url.startsWith("data:") || url.startsWith("mailto:") || url.startsWith("javascript:")) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return true;
  if (url.startsWith("//")) return true;
  return false;
}

function resolveInDist(pageFile, url) {
  const clean = url.split("#")[0].split("?")[0];
  const resolved = normalize(join(dirname(pageFile), clean));
  const rel = relative(distDir, resolved);
  if (!rel || rel.startsWith("..") || rel.startsWith(`..${sep}`)) return { ok: false, resolved, outside: true };
  return { ok: existsSync(resolved) && statSync(resolved).isFile(), resolved, outside: false };
}

const htmlPages = walkHtmlFiles(distDir);
assert(htmlPages.length > 0, "dist has HTML pages to scan");
let missingAssets = 0;
for (const pageFile of htmlPages) {
  const html = readFileSync(pageFile, "utf8");
  const relPage = relative(distDir, pageFile);
  for (const url of localAssetUrlsFromHtml(html)) {
    if (skipRemoteOrEmpty(url)) continue;
    const hit = resolveInDist(pageFile, url);
    if (!hit.ok) {
      missingAssets += 1;
      console.error(`FAIL missing asset on ${relPage}: ${url} → ${relative(distDir, hit.resolved)}`);
    }
  }
}
assert(missingAssets === 0, `every img src/srcset/imagesrcset on dist HTML resolves (${missingAssets} missing)`);

let missingFavicons = 0;
for (const pageFile of htmlPages) {
  const html = readFileSync(pageFile, "utf8");
  const relPage = relative(distDir, pageFile);
  const icons = [...html.matchAll(/<link\b[^>]*rel="(?:icon|alternate icon|shortcut icon)"[^>]*>/gi)];
  if (!icons.length) {
    missingFavicons += 1;
    console.error(`FAIL ${relPage} has no favicon link`);
    continue;
  }
  for (const tag of icons) {
    const href = (tag[0].match(/\bhref="([^"]+)"/i) || [])[1];
    if (!href || skipRemoteOrEmpty(href)) continue;
    const hit = resolveInDist(pageFile, href);
    if (!hit.ok) {
      missingFavicons += 1;
      console.error(`FAIL favicon on ${relPage}: ${href} → ${relative(distDir, hit.resolved)}`);
    }
  }
}
assert(missingFavicons === 0, `every dist HTML page has a resolving favicon (${missingFavicons} missing)`);

const expectedCoverAlts = new Set(
  coverEntries(generatedCovers)
    .map(([, entry]) => String(entry?.coverOurs?.alt || "").trim())
    .filter(Boolean),
);
let coverImgMismatches = 0;
for (const pageFile of htmlPages) {
  const html = readFileSync(pageFile, "utf8");
  const relPage = relative(distDir, pageFile);
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/assets\/covers\//.test(match[0])) continue;
    const alt = decodeHtmlAttr((match[0].match(/\balt="([^"]*)"/) || [])[1] || "");
    if (coverAltProblem(alt) || !expectedCoverAlts.has(alt)) {
      coverImgMismatches += 1;
      console.error(`FAIL cover img alt on ${relPage}: ${JSON.stringify(alt)}`);
    }
  }
}
assert(coverImgMismatches === 0, `every dist cover <img> alt is non-empty and matches cover data (${coverImgMismatches} bad)`);

const retiredPreview = [
  "preview/hot/index.html",
  "preview/hot/standalone.html",
  "preview/daily/index.html",
  "preview/daily/standalone.html",
  "preview/live/index.html",
  "preview/live/standalone.html",
];
const retiredMeta = /权重跟踪|记交付|本批|六件套/;
for (const rel of retiredPreview) {
  const html = readFileSync(join(root, rel), "utf8");
  if (retiredMeta.test(html)) {
    assert(html.includes("旧版·已作废"), `${rel} still has internal meta and must carry 旧版·已作废`);
    assert(html.includes("mit-static"), `${rel} banner links to preview/mit-static`);
  }
}

const injected = injectHtmlFile(liveRaw, { currentId: "live", path: "/live/" });
assert(injectHtmlFile(injected, { currentId: "live", path: "/live/" }) === injected, "injectHtmlFile is idempotent");

const FIXTURE_IDS = ["flash-api", "mm-816b", "edge-nb", "agent-2", "api-price", "longctx-eval"];
const BRAND_RE = /aihot|myhot/i;

function walkFiles(dir, pred, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "LICENSES") continue;
      walkFiles(full, pred, acc);
    } else if (pred(name, full)) acc.push(full);
  }
  return acc;
}

let brandHits = 0;
for (const file of walkPublicCopyFiles(distDir)) {
  const text = readFileSync(file, "utf8");
  const rel = `dist/${relative(distDir, file).split("\\").join("/")}`;
  const brand = text.match(BRAND_RE);
  if (brand) {
    brandHits += 1;
    console.error(`FAIL brand «${brand[0]}» in ${rel}`);
  }
}
assert(brandHits === 0, `brand aihot/myhot scan of all dist text (including .map) is 0 (${brandHits})`);
void BANNED_PUBLIC_COPY;

let fixtureLeaks = 0;
for (const zone of ["data", "api", "feed", join("assets", "avatars")]) {
  const dir = join(distDir, zone);
  for (const file of walkFiles(dir, () => true)) {
    const text = readFileSync(file);
    const body = text.toString("utf8");
    for (const id of FIXTURE_IDS) {
      if (body.includes(id)) {
        fixtureLeaks += 1;
        console.error(`FAIL fixture id ${id} in ${relative(distDir, file)}`);
      }
    }
  }
}
assert(fixtureLeaks === 0, `fixture ids in /data /api /feed /assets/avatars are 0 (${fixtureLeaks})`);

let externalImgs = 0;
for (const file of walkFiles(distDir, (name) => /\.(html|xml|json)$/i.test(name))) {
  const text = readFileSync(file, "utf8");
  if (/\b(?:src|srcset|imagesrcset|enclosure)=["']https?:\/\//i.test(text) || /"url"\s*:\s*"https?:\/\/[^"]+\.(?:png|jpe?g|webp|gif|svg)/i.test(text)) {
    if (/twitter\.com|x\.com|twimg/.test(text) && /\.(png|jpe?g|webp|gif|svg)/i.test(text)) {
      externalImgs += 1;
      console.error(`FAIL external image in ${relative(distDir, file)}`);
    }
    const hits = text.match(/\b(?:src|srcset|imagesrcset)=["']https?:\/\//gi) || [];
    if (hits.length) {
      externalImgs += hits.length;
      console.error(`FAIL hotlink image attr in ${relative(distDir, file)}`);
    }
  }
}
assert(externalImgs === 0, `external images in dist are 0 (${externalImgs})`);

const searchIndex = JSON.parse(readFileSync(join(distDir, "data", "search-index.json"), "utf8"));
assert(!JSON.stringify(searchIndex).includes('"score"'), "search index does not copy score");
assert(searchIndex.docs.some((d) => /FLUX/i.test(d.title) || /FLUX/i.test(d.summary)), "search index contains FLUX from real weekly/covers");
assert(typeof searchIndex.data_as_of === "string" && searchIndex.data_as_of.length > 8, "search index has data_as_of");
assert(typeof searchIndex.built_at === "string" && searchIndex.built_at.length > 8, "search index has built_at");
assert(searchIndex.data_as_of !== searchIndex.built_at, "data_as_of is content time, not the same as built_at");
const metaJson = JSON.parse(readFileSync(join(distDir, "data", "meta.json"), "utf8"));
assert(metaJson.data_as_of && metaJson.built_at && metaJson.data_as_of !== metaJson.built_at, "meta.json separates data_as_of and built_at");
assert(!String(searchIndex.docs.map((d) => d.url).join(" ")).includes("/ai-frontier-trends/"), "search urls are not hard-coded to the Pages prefix");
assert(searchIndex.docs.every((d) => !String(d.url || "").startsWith("/")), "search urls are relative (no root /)");

function jsonHasScoreKey(value) {
  if (Array.isArray(value)) return value.some(jsonHasScoreKey);
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, "score")) return true;
  return Object.values(value).some(jsonHasScoreKey);
}

let publicScoreKeys = 0;
for (const zone of ["data", "api", "feed"]) {
  for (const file of walkFiles(join(distDir, zone), (name) => /\.json$/i.test(name))) {
    const body = JSON.parse(readFileSync(file, "utf8"));
    if (jsonHasScoreKey(body)) {
      publicScoreKeys += 1;
      console.error(`FAIL public JSON still has score key: ${relative(distDir, file)}`);
    }
  }
}
assert(publicScoreKeys === 0, `public JSON has no score keys (${publicScoreKeys})`);

const homeHtml = readFileSync(join(distDir, "index.html"), "utf8");
assert(!/\bNaN\b/.test(homeHtml), "home HTML has no NaN from absent score");
assert(!/data-score|score-label|item-score|ft-score/i.test(homeHtml), "home HTML has no score slot");
assert(!/class="[^"]*score/.test(homeHtml), "home HTML has no score class slot");

assert(existsSync(join(distDir, "more", "index.html")), "dist has /more/");
for (const rel of ["index.html", join("hot", "index.html"), join("daily", "index.html")]) {
  const html = readFileSync(join(distDir, rel), "utf8");
  assert(html.includes("hydrate.js"), `${rel} ships hydrate.js`);
  assert(html.includes("<script"), `${rel} has a script tag`);
  for (const id of FIXTURE_IDS) {
    assert(!html.includes(id), `${rel} does not render fixture id ${id}`);
  }
}

{
  const tmp = mkdtempSync(join(tmpdir(), "ia-example-"));
  try {
    writeFileSync(join(tmp, "daily.html"), `<a href="https://example.com/flash">原文</a>`);
    expectThrow(
      () => {
        const hits = collectExampleComHits(tmp, { prefix: "dist/" });
        if (hits.length) throw new Error(`example.com in ${hits[0].file}`);
      },
      /example\.com/,
      "negative: example.com URL fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-selflink-"));
  try {
    writeFileSync(join(tmp, "daily.html"), `<a href="daily.html">17 周六</a>`);
    expectThrow(
      () => {
        const hits = collectSelfLinkHits(tmp, { prefix: "dist/" });
        if (hits.length) throw new Error(`self-link ${hits[0].file} «${hits[0].text}» → ${hits[0].href}`);
      },
      /self-link/,
      "negative: link resolving to the current page fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "ia-homefall-"));
  try {
    writeFileSync(join(tmp, "index.html"), `<h1>home</h1>`);
    writeFileSync(join(tmp, "daily.html"), `<a href="index.html">关于</a>`);
    expectThrow(
      () => {
        const hits = collectHomeFallbackHits(tmp, { prefix: "dist/" });
        if (hits.length) throw new Error(`home-fallback ${hits[0].file} «${hits[0].text}» → ${hits[0].href}`);
      },
      /home-fallback/,
      "negative: unknown route falling back to home fails verify:ia",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

try {
  assertPublicLinks(distDir, {
    prefix: "dist/",
    pages: ["index.html", "hot/index.html", "daily/index.html", "search/index.html", "starred/index.html", "live/index.html"],
  });
  assert(true, "dist public links: no example.com, no self-page href, no home fallback");
} catch (err) {
  assert(false, err.message);
}

{
  const hydrate = readFileSync(join(distDir, "assets", "hydrate.js"), "utf8");
  const starred = readFileSync(join(distDir, "starred", "index.html"), "utf8");
  assert(/replace\(\/\^\\\.\//.test(hydrate) && /replace\(\/\^\//.test(hydrate), "hydrate strips leading ./ and / from saved starred urls");
  assert(starred.includes('"base":"../"') || starred.includes('"base": "../"'), "starred page uses site-root base ../");
  assert(hydrate.includes("暂无符合条件的内容"), "hydrate empty filter copy is 暂无符合条件的内容");
  assert(!hydrate.includes("全部动态"), "hydrate empty state has no fake 全部动态 link");
}

{
  const apiIndex = JSON.parse(readFileSync(join(distDir, "api", "v1", "index.json"), "utf8"));
  const weeklyIndex = JSON.parse(readFileSync(join(distDir, "api", "v1", "weekly", "index.json"), "utf8"));
  const weeklyItem = JSON.parse(readFileSync(join(distDir, "api", "v1", "weekly", "2026-10-18.json"), "utf8"));
  for (const file of apiIndex.files || []) {
    assert(file.path && !String(file.path).startsWith("/"), `api/v1/index.json path is relative (${file.path})`);
  }
  for (const item of weeklyIndex.items || []) {
    assert(item.path && !String(item.path).startsWith("/"), `weekly/index.json item.path is relative (${item.path})`);
  }
  assert(weeklyItem.path && !String(weeklyItem.path).startsWith("/"), "weekly/2026-10-18.json path is relative");
}

{
  const more = readFileSync(join(distDir, "more", "index.html"), "utf8");
  const href = (more.match(/<a class="ft-more-card" href="([^"]+)"[^>]*>\s*<h3>研究主页 · 本周主线<\/h3>/) || [])[1];
  assert(href, "more page has 研究主页 · 本周主线");
  assert(href.includes("weekly/2026-10-18"), `more 本周主线 points at latest weekly (got ${href})`);
  assert(href !== "../" && href !== "./", "more 本周主线 is not the home href");
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nIA verification passed");
console.log("verify:ia remaining-a: banned=0 brand=0 fixture=0 external-img=0");

