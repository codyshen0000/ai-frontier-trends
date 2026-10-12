import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractLiveSpotlight, extractThreads, ensureThreadAnchors } from "./extract.mjs";
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

const broken = extractThreads("<html><body><p>no threads</p></body></html>", config.threadsFallback, 5);
assert(broken.source === "fallback", "fallback when parsing fails");
assert(broken.threads.length >= 3, "fallback list is short but usable");

const anchored = ensureThreadAnchors(timelineRaw);
assert(anchored.includes('id="thread-1"'), "thread anchors added in output");
assert(ensureThreadAnchors(anchored) === anchored, "thread anchors are idempotent");

const paths = [
  "/",
  "/live/",
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
assert(home.includes(config.heroLine), "home hero uses site one-liner");
assert(home.includes(live.conclusion), "home shows today's conclusion");
assert(home.includes("看今天的热点"), "home CTA to /live/");
assert(home.includes("本周主线"), "home has 本周主线");
assert(home.includes("怎么读这个站"), "home has reader guide");
assert(home.includes("周报"), "home links to weekly");
assert(home.includes("/weekly/2026-10-12/") || home.includes("weekly/2026-10-12/"), "home links to latest weekly issue");
assert(home.includes(">FLUX 3<") || home.includes("FLUX 3"), "home has one FLUX 3 topic card");
assert((home.match(/class="ds-card trend-thread-card"/g) || []).length >= 3, "home has 3–5 thread cards");
assert(!home.includes("谱系"), "home avoids 谱系 jargon");
assert(!home.includes("待交付权重"), "home avoids 待交付 jargon");

const about = readFileSync(join(distDir, "about", "index.html"), "utf8");
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
const liveNav = livePage.match(/data-ds-injected="nav"[\s\S]*?<\/header>/)?.[0] || "";
assert(liveNav.includes(">今日<") && liveNav.includes(">趋势<") && liveNav.includes(">专题<") && liveNav.includes(">关于<"), "live injected nav is the 4-item IA");
assert(!liveNav.includes(">案例<") && !liveNav.includes(">示例库<") && !liveNav.includes(">相机术语<"), "live nav is not 11 flat links");
assert(liveRaw.includes('id="back-home"'), "live source keeps #back-home");
for (const needle of ["/workspace", "/home/box", "/cursor/stores"]) {
  assert(!livePage.includes(needle), `live has no ${needle}`);
}

const timelinePage = readFileSync(join(distDir, "timeline", "index.html"), "utf8");
assert(timelinePage.includes('id="thread-1"'), "timeline output has thread anchors");
for (const needle of ["/workspace", "/home/box", "/cursor/stores"]) {
  assert(!timelinePage.includes(needle), `timeline has no ${needle}`);
}

const weeklyIndex = readFileSync(join(distDir, "weekly", "index.html"), "utf8");
assert(weeklyIndex.includes("趋势栏目"), "weekly index has trend sub-nav");
assert(weeklyIndex.includes("2026-10-12"), "weekly index lists 2026-10-12");
assert(weeklyIndex.includes("weekly/2026-10-12/") || weeklyIndex.includes("./2026-10-12/"), "weekly index links to the issue");
assert(weeklyIndex.includes(">周报<"), "weekly tab is in trend sub-nav");

const weeklyIssue = readFileSync(join(distDir, "weekly", "2026-10-12", "index.html"), "utf8");
const weeklyNav = weeklyIssue.match(/data-ds-injected="nav"[\s\S]*?<\/header>/)?.[0] || "";
assert(weeklyNav.includes(">今日<") && weeklyNav.includes(">趋势<") && weeklyNav.includes(">专题<") && weeklyNav.includes(">关于<"), "weekly injected nav is the 4-item IA");
assert(weeklyNav.includes(">周报<"), "weekly dropdown includes 周报");
assert(weeklyIssue.includes("一句话结论"), "weekly issue keeps the report lede");
assert(weeklyIssue.includes("data-ds-injected=\"weekly\""), "weekly issue has download chrome");
assert(weeklyIssue.includes("./report.md") && weeklyIssue.includes("./timeline.md"), "weekly issue links markdown downloads");
assert(weeklyIssue.includes("https://codyshen0000.github.io/assets/ds.css"), "weekly issue uses shared ds.css");
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
