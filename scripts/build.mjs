import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import { CHART_CSS, flux3Chart, homeCharts, signalsChart, timelineCharts, weightsChart } from "./charts.mjs";
import { PAPER_CSS, addExplainLinks, copyPaperAssets, loadPapers, papersBody } from "./papers.mjs";
import { casesGalleryBody, casesSummary, copyCaseAssets } from "./flux3_cases_page.mjs";
import {
  extractLiveSpotlight,
  extractThreads,
  ensureThreadAnchors,
} from "./extract.mjs";
import { extractLiveCards } from "./live_cards.mjs";
import { dailyPageBody } from "./daily_page.mjs";
import { curateLivePage, hotPageBody, morePageBody, stripLiveCurate } from "./live_curate.mjs";
import {
  assertPublicSafe,
  latestWeeklyCard,
  listWeeklyIssues,
  weeklyIndexBody,
  weeklyIssueChrome,
} from "./weekly.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const contentDir = join(root, "content");
const srcDir = join(root, "src");

const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const publicDeploy = process.env.PUBLIC_DEPLOY === "1";
const privatePages = new Set(config.privatePages ?? []);

const DS_CSS = "https://codyshen0000.github.io/assets/ds.css";
const PAPERS = loadPapers(contentDir);

const FLUX_TABS = [
  { tab: "cheatsheet", label: "速查表", path: "/flux3/" },
  { tab: "cases", label: "官方案例", path: "/flux3/cases/" },
  { tab: "examples", label: "示例库", path: "/flux3/examples/" },
  { tab: "camera", label: "相机术语", path: "/flux3/camera-terms/" },
];

const TREND_SUBNAV = [
  { id: "timeline", label: "时间线", path: "/timeline/" },
  { id: "weekly", label: "周报", path: "/weekly/" },
  { id: "signals", label: "信号表", path: "/signals/" },
  { id: "weights", label: "权重追踪", path: "/weights/" },
];

marked.setOptions({ gfm: true, breaks: false });

function slugify(text) {
  return String(text)
    .replace(/<[^>]+>/g, "")
    .trim()
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const renderer = new marked.Renderer();
renderer.heading = function heading({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  const id = slugify(text);
  return `<h${depth} id="${escapeHtml(id)}">${text}</h${depth}>\n`;
};
marked.use({ renderer });

function decorateTags(html) {
  return html.replace(/【(证实|推断|叙事|未证实)[^】]*】/g, (match, kind) => {
    const cls =
      kind === "证实"
        ? "tag-confirmed"
        : kind === "推断"
          ? "tag-inferred"
          : kind === "未证实"
            ? "tag-unverified"
            : "tag-narrative";
    return `<span class="tag ${cls}">${match}</span>`;
  });
}

function wrapTables(html) {
  return html
    .replace(/<table>/g, '<div class="ds-table-wrap"><table class="ds-table">')
    .replace(/<\/table>/g, "</table></div>");
}

function prepareMarkdown(text) {
  return text.replace(/\*\*(【(?:证实|推断|叙事|未证实)[^】]*】)\*\*/g, "<strong>$1</strong>");
}

function hrefBetween(fromPath, toPath) {
  const hashIndex = String(toPath).indexOf("#");
  const hash = hashIndex >= 0 ? toPath.slice(hashIndex) : "";
  const clean = hashIndex >= 0 ? toPath.slice(0, hashIndex) || "/" : toPath;
  const fromParts = fromPath.split("/").filter(Boolean);
  const toParts = clean.split("/").filter(Boolean);
  const prefix = fromParts.length === 0 ? "./" : "../".repeat(fromParts.length);
  if (toParts.length === 0) return `${prefix}${hash}`;
  return `${prefix}${toParts.join("/")}/${hash}`;
}

function assetHref(fromPath, fileName) {
  const fromParts = fromPath.split("/").filter(Boolean);
  const prefix = fromParts.length === 0 ? "./" : "../".repeat(fromParts.length);
  return `${prefix}${fileName}`;
}

function pageById(id) {
  return config.pages.find((page) => page.id === id);
}

function primaryActiveId(currentId) {
  const nav = config.nav?.primary ?? [];
  for (const item of nav) {
    if (item.id === currentId) return item.id;
    if (item.children?.some((child) => child.id === currentId)) return item.id;
    if (item.match?.includes(currentId)) return item.id;
  }
  return currentId;
}

const NAV_EXTRA_CSS = PAPER_CSS;

const ICONS = {
  brand:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12 20 4l-5 16-3.5-6.5Z"/></svg>',
  live: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><path d="M13 16h7M13 20h4"/></svg>',
  hot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s4 4.4 4 8.2A4 4 0 1 1 8 11.1C8 7.3 12 3 12 3Z"/><path d="M10 18c0 1.2.9 2 2 2s2-.8 2-2"/></svg>',
  timeline:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18V6"/><path d="m4 18 5-6 4 3 7-8"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="7" cy="7" r="1.35"/><circle cx="17" cy="7" r="1.35"/><circle cx="7" cy="17" r="1.35"/><circle cx="17" cy="17" r="1.35"/></svg>',
  daily:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2V5Z"/><path d="M18 7h1.5A1.5 1.5 0 0 1 21 8.5V18a3 3 0 0 1-3 3"/><path d="M8 10h7M8 14h7"/></svg>',
};

function navLink(href, label, { current = false, extraClass = "" } = {}) {
  const cls = [current ? "active" : "", extraClass].filter(Boolean).join(" ");
  const attrs = [
    `href="${href}"`,
    cls ? `class="${cls}"` : "",
    current ? 'aria-current="page"' : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<a ${attrs}>${escapeHtml(label)}</a>`;
}

function editionIds() {
  return new Set((config.nav?.editions ?? []).map((item) => item.id));
}

function isChromeActive(item, currentId) {
  if (editionIds().has(currentId)) return item.id === currentId;
  return item.id === primaryActiveId(currentId);
}

function shellLink(item, currentId, fromPath, { active } = {}) {
  const href = hrefBetween(fromPath, item.path);
  const current = active ?? isChromeActive(item, currentId);
  const icon = ICONS[item.id] || ICONS.more;
  return `<a href="${href}" class="${current ? "active" : ""}"${current ? ' aria-current="page"' : ""}>${icon}<span>${escapeHtml(item.label)}</span></a>`;
}

function shellLinks(currentId, fromPath) {
  return (config.nav?.primary ?? []).map((item) => shellLink(item, currentId, fromPath)).join("");
}

function tabbarItems() {
  return config.nav?.primary ?? [];
}

function tabbarLinks(currentId, fromPath) {
  return tabbarItems()
    .map((item) => shellLink(item, currentId, fromPath, { active: isChromeActive(item, currentId) }))
    .join("");
}

function editionLinks(currentId, fromPath) {
  return (config.nav?.editions ?? [])
    .map((item) => {
      const href = hrefBetween(fromPath, item.path);
      const current = item.id === currentId;
      const icon = ICONS[item.id] || ICONS.daily;
      return `<a href="${href}" class="${current ? "active" : ""}"${current ? ' aria-current="page"' : ""}>${icon}<span>${escapeHtml(item.label)}</span></a>`;
    })
    .join("");
}

function navBar({ currentId, fromPath }) {
  const brand = escapeHtml(config.brand || config.title);
  const homeHref = hrefBetween(fromPath, "/live/");
  const editions = editionLinks(currentId, fromPath);
  const editionNav = editions
    ? `<nav class="ft-side-editions" aria-label="成刊"><p class="ft-side-kicker">成刊</p>${editions}</nav>`
    : "";
  return `<style data-ds-injected="nav-css">${NAV_EXTRA_CSS}</style>
  <aside class="ft-sidebar" id="nav" data-ds-injected="nav">
    <a class="ft-brand" href="${homeHref}">${ICONS.brand}<span>${brand}</span></a>
    <nav class="ft-side-links" aria-label="站点导航">${shellLinks(currentId, fromPath)}</nav>
    ${editionNav}
    <div class="ft-side-tools">
      <button type="button" class="ft-theme-toggle" aria-label="切换配色">☾</button>
    </div>
  </aside>
  <header class="ft-topbar" data-ds-injected="topbar">
    <a class="ft-brand" href="${homeHref}">${ICONS.brand}<span>${brand}</span></a>
    <button type="button" class="ft-theme-toggle" aria-label="切换配色">☾</button>
  </header>
  <nav class="ft-tabbar" data-ds-injected="tabbar" aria-label="底部导航">${tabbarLinks(currentId, fromPath)}</nav>`;
}

function crumbBar(page) {
  if (!page || page.home || page.id === "home") return "";
  const parts = [];
  if (page.section) parts.push(page.section);
  if (page.topic === "flux3" && page.crumb && page.crumb !== "FLUX 3") {
    parts.push("FLUX 3");
  }
  if (page.crumb && page.crumb !== page.section) parts.push(page.crumb);
  if (!parts.length) return "";
  return `<nav class="trend-crumb" aria-label="当前位置">${parts
    .map((part) => `<span>${escapeHtml(part)}</span>`)
    .join("")}</nav>`;
}

function trendSubnav(currentId, fromPath) {
  const links = TREND_SUBNAV.map((item) =>
    navLink(hrefBetween(fromPath, item.path), item.label, { current: item.id === currentId }),
  ).join("");
  return `<nav class="trend-subnav" aria-label="趋势栏目">${links}</nav>`;
}

function fluxTabs(currentTab, fromPath) {
  const links = FLUX_TABS.map((item) =>
    navLink(hrefBetween(fromPath, item.path), item.label, { current: item.tab === currentTab }),
  ).join("");
  return `<nav class="trend-tabs" aria-label="FLUX 3">${links}</nav>`;
}

function pageChrome(page, fromPath) {
  if (!page || page.id === "daily") return "";
  const bits = [crumbBar(page)];
  if (page.group === "trends") bits.push(trendSubnav(page.id, fromPath));
  if (page.topic === "flux3") bits.push(fluxTabs(page.tab, fromPath));
  return bits.filter(Boolean).join("");
}

const THEME_BOOT =
  '<script data-ds-injected="theme">(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.classList.add("ds-page","ft-shell");}catch(e){document.documentElement.classList.add("ds-page","ft-shell");}})();</script>';

const RAW_NAV_UI =
  '<script data-ds-injected="ui">(function(){var root=document.documentElement;function apply(t){root.dataset.theme=t;document.querySelectorAll(".ft-theme-toggle").forEach(function(btn){var d=t==="dark";btn.setAttribute("aria-pressed",d?"true":"false");btn.setAttribute("aria-label",d?"切换到浅色模式":"切换到深色模式");btn.textContent=d?"☀":"☾";});}function pref(){try{var s=localStorage.getItem("theme");if(s==="light"||s==="dark")return s;}catch(e){}return matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}apply(pref());document.querySelectorAll(".ft-theme-toggle").forEach(function(btn){btn.addEventListener("click",function(){var n=root.dataset.theme==="dark"?"light":"dark";try{localStorage.setItem("theme",n);}catch(e){}apply(n);});});function applyBoard(){var board=location.hash==="#board";var curate=document.querySelector(\'[data-ds-injected="live-curate"]\');var archive=document.querySelector(\'[data-ds-injected="live-archive"]\');if(!curate||!archive)return;curate.hidden=board;archive.hidden=!board;root.classList.toggle("ft-board",board);}window.addEventListener("hashchange",applyBoard);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",applyBoard);else applyBoard();})();</script>';

function stripInjected(html) {
  return stripLiveCurate(
    String(html)
      .replace(/<link[^>]*data-ds-injected="css"[^>]*>\s*/gi, "")
      .replace(/<link[^>]*data-ds-injected="skin"[^>]*>\s*/gi, "")
      .replace(/<style[^>]*data-ds-injected="nav-css"[^>]*>[\s\S]*?<\/style>\s*/gi, "")
      .replace(/<script[^>]*data-ds-injected="theme"[^>]*>[\s\S]*?<\/script>\s*/gi, "")
      .replace(/<aside[^>]*data-ds-injected="nav"[^>]*>[\s\S]*?<\/aside>\s*/gi, "")
      .replace(/<header[^>]*data-ds-injected="nav"[^>]*>[\s\S]*?<\/header>\s*/gi, "")
      .replace(/<header[^>]*data-ds-injected="topbar"[^>]*>[\s\S]*?<\/header>\s*/gi, "")
      .replace(/<nav[^>]*data-ds-injected="tabbar"[^>]*>[\s\S]*?<\/nav>\s*/gi, "")
      .replace(/<div[^>]*data-ds-injected="more"[^>]*>[\s\S]*?<\/div>\s*/gi, "")
      .replace(/<script[^>]*data-ds-injected="ui"[^>]*>[\s\S]*?<\/script>\s*/gi, "")
      .replace(/<a class="paper-explain" data-ds-injected="pf"[^>]*>图解<\/a>/g, "")
      .replace(/<aside[^>]*data-ds-injected="charts"[^>]*>[\s\S]*?<\/aside>\s*/gi, "")
      .replace(/<div[^>]*data-ds-injected="weekly"[^>]*>[\s\S]*?<\/div>\s*/gi, "")
      .replace(/(<body\b[^>]*>)\s+/i, "$1"),
  );
}

function injectBeforeHeadEnd(html, snippet) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${snippet}</head>`);
  return `${snippet}${html}`;
}

function injectAfterBodyOpen(html, snippet) {
  if (/<body\b[^>]*>/i.test(html)) return html.replace(/<body\b[^>]*>/i, (open) => `${open}${snippet}`);
  return `${snippet}${html}`;
}

export function injectHtmlFile(raw, { currentId, path, extraBody = "" }) {
  const skinHref = assetHref(path, "assets/skin-raw.css");
  const cssLink = `<link rel="stylesheet" href="${DS_CSS}" data-ds-injected="css">`;
  const skinLink = `<link rel="stylesheet" href="${skinHref}" data-ds-injected="skin">`;
  let html = stripInjected(raw);
  if (PAPERS.length) html = addExplainLinks(html, PAPERS, hrefBetween(path, "/papers/"));
  if (path === "/timeline/") html = ensureThreadAnchors(html);
  if (path === "/live/") html = curateLivePage(html, { hrefBetween, escapeHtml });
  html = injectBeforeHeadEnd(html, cssLink);
  html = injectBeforeHeadEnd(html, skinLink);
  html = injectBeforeHeadEnd(html, THEME_BOOT);
  html = injectAfterBodyOpen(html, `${navBar({ currentId, fromPath: path })}${RAW_NAV_UI}${extraBody}`);
  return html;
}

function renderPage({ id, title, path, body, extraClass = "", description = config.description }) {
  const cssHref = assetHref(path, "styles.css");
  const jsHref = assetHref(path, "theme.js");
  const pageTitle = id === "home" ? config.title : `${title} · ${config.title}`;
  const page = pageById(id);

  const skinHref = assetHref(path, "assets/skin-raw.css");
  return `<!DOCTYPE html>
<html lang="zh-CN" class="ds-page ft-shell">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="${DS_CSS}">
  <link rel="stylesheet" href="${skinHref}">
  <link rel="stylesheet" href="${cssHref}">
  <style>${CHART_CSS}</style>
  <script>
    (function () {
      try {
        var t = localStorage.getItem("theme");
        if (t !== "light" && t !== "dark") {
          t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.dataset.theme = t;
      } catch (e) {}
    })();
  </script>
</head>
<body>
  <a class="ds-skip" href="#main">跳到正文</a>
  ${navBar({ currentId: id, fromPath: path })}
  <main id="main" class="${["ds-wrap", extraClass].filter(Boolean).join(" ")}">
    ${pageChrome(page, path)}
    ${body}
  </main>
  <footer class="ds-footer">
    <div class="ds-wrap ds-footer-inner">
      <p>材料来自公开论文、官方博客和公开热帖。看板每 30 分钟检查一次；时间线每晚更新。</p>
      <p><a href="${hrefBetween(path, "/about/")}">关于这个站</a></p>
    </div>
  </footer>
  <div class="lightbox" id="lightbox" hidden>
    <button type="button" aria-label="关闭">×</button>
    <img alt="">
  </div>
  <script src="${jsHref}"></script>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function writePage(pagePath, html) {
  const outPath =
    pagePath === "/" ? join(distDir, "index.html") : join(distDir, pagePath.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

function mitAssetPrefix(fromPath) {
  const depth = String(fromPath).split("/").filter(Boolean).length;
  return depth === 0 ? "" : "../".repeat(depth);
}

function rewriteMitStatic(html, fromPath) {
  const prefix = mitAssetPrefix(fromPath);
  return html
    .replace(/(href|src|action)="((?:index|hot|daily)\.html)([^"]*)"/g, (_, attr, file, suffix) => {
      const page = file.replace(/\.html$/, "");
      const dest = page === "index" ? "/" : `/${page}/`;
      return `${attr}="${hrefBetween(fromPath, dest)}${suffix}"`;
    })
    .replace(/(href|src|srcSet|imageSrcSet)="([^"]*)"/g, (match, attr, val) => {
      if (!/(^|,\s*)(?:assets|data)\//.test(val)) return match;
      return `${attr}="${val.replace(/(^|,\s*)((?:assets|data)\/)/g, `$1${prefix}$2`)}"`;
    });
}

function publishMitStatic() {
  const src = join(root, "preview", "mit-static");
  const required = ["index.html", "hot.html", "daily.html", join("assets", "app.css")];
  for (const rel of required) {
    if (!existsSync(join(src, rel))) {
      throw new Error(`publishMitStatic: missing preview/mit-static/${rel}`);
    }
  }

  mkdirSync(join(distDir, "assets"), { recursive: true });
  cpSync(join(src, "assets", "app.css"), join(distDir, "assets", "app.css"));
  const nameplates = join(src, "assets", "nameplates");
  if (existsSync(nameplates)) {
    cpSync(nameplates, join(distDir, "assets", "nameplates"), { recursive: true });
  }
  const dataDir = join(src, "data");
  if (existsSync(dataDir)) {
    mkdirSync(join(distDir, "data"), { recursive: true });
    cpSync(dataDir, join(distDir, "data"), { recursive: true });
  }
  const coversDir = join(src, "assets", "covers");
  if (existsSync(coversDir)) {
    mkdirSync(join(distDir, "assets", "covers"), { recursive: true });
    cpSync(coversDir, join(distDir, "assets", "covers"), { recursive: true });
  }

  const indexHtml = readFileSync(join(src, "index.html"), "utf8");
  const hotHtml = readFileSync(join(src, "hot.html"), "utf8");
  const dailyHtml = readFileSync(join(src, "daily.html"), "utf8");
  writePage("/", rewriteMitStatic(indexHtml, "/"));
  writePage("/live/", rewriteMitStatic(indexHtml, "/live/"));
  writePage("/hot/", rewriteMitStatic(hotHtml, "/hot/"));
  writePage("/daily/", rewriteMitStatic(dailyHtml, "/daily/"));
}

function chipClass(status) {
  if (status === "加强") return "ds-tag";
  if (status === "待验证") return "ds-tag-outline";
  return "ds-chip";
}

function homeBody({ live, threads, lede, weekly, threadSource, timelineRaw }) {
  const today = live.conclusion
    ? `<div class="ds-card trend-today">
        <p class="trend-today-kicker">今天</p>
        <p class="trend-today-concl">${escapeHtml(live.conclusion)}</p>
        ${live.updatedAt ? `<p class="ds-dim">更新于 ${escapeHtml(live.updatedAt)}</p>` : ""}
      </div>`
    : "";

  const ledeHtml = lede ? `<p class="ds-muted trend-thread-lede">${escapeHtml(lede)}</p>` : "";
  const cards = threads
    .map((thread) => {
      const href = `${hrefBetween("/", "/timeline/")}#${encodeURIComponent(thread.anchor)}`;
      return `<a class="ds-card trend-thread-card" href="${href}">
        <span class="${chipClass(thread.status)}">${escapeHtml(thread.status)}</span>
        <p>${escapeHtml(thread.sentence)}</p>
      </a>`;
    })
    .join("");

  return `<section class="ds-hero trend-hero">
    <h1 class="trend-hero-title">${escapeHtml(config.heroLine || config.description)}</h1>
    ${today}
    <div class="ds-hero-actions">
      <a class="ds-btn-fill" href="${hrefBetween("/", "/live/")}">看精选 ›</a>
    </div>
  </section>
  <section class="ds-section" id="threads">
    <div class="ds-section-header">
      <h2 class="ds-section-title">本周主线</h2>
      <a href="${hrefBetween("/", "/timeline/")}">看完整时间线</a>
    </div>
    ${ledeHtml}
    <div class="trend-thread-grid">${cards}</div>
  </section>
  ${homeCharts({ threads, threadSource, timelineHtml: timelineRaw, href: (p) => hrefBetween("/", p) })}
  ${latestWeeklyCard(weekly, { hrefBetween, escapeHtml })}
  <section class="ds-section" id="topics">
    <div class="ds-section-header">
      <h2 class="ds-section-title">专题</h2>
    </div>
    <a class="ds-card trend-topic-card" href="${hrefBetween("/", "/flux3/")}">
      <h3>FLUX 3</h3>
      <p class="ds-muted">官方提示词规则、案例、示例和相机术语，集中在一处。</p>
    </a>
  </section>
  <section class="ds-section" id="how">
    <div class="ds-section-header">
      <h2 class="ds-section-title">怎么读这个站</h2>
    </div>
    <div class="ds-card trend-howto">
      <ul>
        <li><strong>加强</strong>：新证据让这条判断更站得住。</li>
        <li><strong>持平</strong>：判断没变。</li>
        <li><strong>待验证</strong>：还缺能拍板的证据。</li>
        <li><strong>【未证实】</strong>：还没找到一手来源。</li>
        <li><strong>【推断】</strong>：我们的归纳，有间接证据。</li>
      </ul>
      <p>看板每 30 分钟检查一次，有变化就更新。时间线每晚更新。周报按周发布。</p>
    </div>
  </section>`;
}

function assertNoLocalPaths(html, label) {
  for (const needle of ["/workspace", "/home/box", "/cursor/stores"]) {
    if (html.includes(needle)) {
      throw new Error(`${label} contains forbidden path ${needle}`);
    }
  }
}

function writeWeeklyIssue(issue) {
  const raw = readFileSync(issue.htmlPath, "utf8");
  const extraBody = weeklyIssueChrome({ hrefBetween, trendSubnav, fromPath: issue.path });
  const injected = injectHtmlFile(raw, {
    currentId: "weekly",
    path: issue.path,
    extraBody,
  });
  verifyRawInjection({ id: `weekly-${issue.date}`, currentId: "weekly", path: issue.path }, raw, injected, extraBody);
  assertPublicSafe(injected, `weekly ${issue.date}`);
  if (issue.markdownPath) assertPublicSafe(readFileSync(issue.markdownPath, "utf8"), `weekly ${issue.date} markdown`);
  if (issue.timelinePath) assertPublicSafe(readFileSync(issue.timelinePath, "utf8"), `weekly ${issue.date} timeline`);

  writePage(issue.path, injected);
  const destDir = join(distDir, "weekly", issue.date);
  mkdirSync(destDir, { recursive: true });
  cpSync(issue.htmlPath, join(destDir, "report.html"));
  if (issue.markdownPath) cpSync(issue.markdownPath, join(destDir, "report.md"));
  if (issue.timelinePath) cpSync(issue.timelinePath, join(destDir, "timeline.md"));
  if (issue.chartsDir) cpSync(issue.chartsDir, join(destDir, "charts"), { recursive: true });
}

function verifyRawInjection(page, raw, injected, extraBody = "") {
  if (!injected.includes(DS_CSS)) throw new Error(`${page.id}: missing ds.css`);
  if (!injected.includes("skin-raw.css")) throw new Error(`${page.id}: missing skin-raw.css`);
  if (!injected.includes('data-ds-injected="nav"')) throw new Error(`${page.id}: missing injected nav`);
  if (!injected.includes(">精选<") || !injected.includes(">热点<") || !injected.includes(">日报<") || !injected.includes(">更多<")) {
    throw new Error(`${page.id}: injected nav missing primary items`);
  }
  const currentId = page.currentId || page.id;
  const twice = injectHtmlFile(injected, { currentId, path: page.path, extraBody });
  if (twice !== injected) {
    throw new Error(`${page.id}: raw injection is not idempotent`);
  }
  assertNoLocalPaths(injected, page.id);
}

function readHomeData() {
  const liveRaw = readFileSync(join(contentDir, "live.html"), "utf8");
  const timelineRaw = readFileSync(join(contentDir, "timeline.html"), "utf8");
  const live = extractLiveSpotlight(liveRaw);
  const extracted = extractThreads(timelineRaw, config.threadsFallback, 5);
  return { live, threads: extracted.threads, lede: extracted.lede, threadSource: extracted.source, timelineRaw };
}

export function buildSite() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  const contentPages = [];
  const weeklyIssues = listWeeklyIssues(contentDir);
  const liveRaw = readFileSync(join(contentDir, "live.html"), "utf8");
  const liveCards = extractLiveCards(liveRaw);
  const liveMeta = extractLiveSpotlight(liveRaw);

  for (const page of config.pages) {
    if (publicDeploy && privatePages.has(page.id)) continue;
    if (page.home) continue;

    if (page.generated === "daily") {
      writePage(
        page.path,
        renderPage({
          id: page.id,
          title: page.title,
          path: page.path,
          extraClass: "ds-section ft-page ft-daily-wrap",
          description: page.summary || config.description,
          body: dailyPageBody(liveCards, liveMeta, { escapeHtml, hrefBetween }),
        }),
      );
      contentPages.push({ ...page, summary: page.summary || page.title });
      continue;
    }

    if (page.generated === "hot") {
      writePage(
        page.path,
        renderPage({
          id: page.id,
          title: page.title,
          path: page.path,
          extraClass: "ds-section ft-page",
          description: page.summary || config.description,
          body: hotPageBody(liveCards, liveMeta, { escapeHtml }),
        }),
      );
      contentPages.push({ ...page, summary: page.summary || page.title });
      continue;
    }

    if (page.generated === "more") {
      writePage(
        page.path,
        renderPage({
          id: page.id,
          title: page.title,
          path: page.path,
          extraClass: "ds-section ft-page",
          description: page.summary || config.description,
          body: morePageBody({ hrefBetween, escapeHtml }),
        }),
      );
      contentPages.push({ ...page, summary: page.summary || page.title });
      continue;
    }

    if (page.weeklyIndex) {
      const body = weeklyIndexBody(weeklyIssues, { hrefBetween, escapeHtml });
      writePage(
        page.path,
        renderPage({
          id: page.id,
          title: page.title,
          path: page.path,
          extraClass: "ds-section",
          description: page.summary || config.description,
          body,
        }),
      );
      contentPages.push({
        ...page,
        summary: page.summary || page.title,
      });
      continue;
    }

    if (page.gallery === "flux3-cases") {
      writePage(
        page.path,
        renderPage({
          id: page.id,
          title: page.title,
          path: page.path,
          extraClass: "ds-section trend-cases trend-has-tabs",
          description: page.summary || config.description,
          body: casesGalleryBody(root),
        }),
      );
      contentPages.push({
        ...page,
        summary: page.summary || casesSummary(root),
      });
      continue;
    }

    if (page.htmlFile) {
      const raw = readFileSync(join(contentDir, page.htmlFile), "utf8");
      const extraBody = page.id === "timeline" ? timelineCharts(raw) : "";
      const injected = injectHtmlFile(raw, { currentId: page.id, path: page.path, extraBody });
      verifyRawInjection(page, raw, injected, extraBody);
      writePage(page.path, injected);
      contentPages.push({
        ...page,
        summary: page.summary || page.title,
      });
      continue;
    }

    if (!page.file) continue;

    const source = prepareMarkdown(readFileSync(join(contentDir, page.file), "utf8"));
    const html = wrapTables(
      addExplainLinks(decorateTags(marked.parse(source)), PAPERS, hrefBetween(page.path, "/papers/")).replace(
        /详见权重追踪页/g,
        `详见<a href="${hrefBetween(page.path, "/weights/")}">权重追踪页</a>`,
      ),
    );
    contentPages.push({
      ...page,
      summary: page.summary || page.title,
      html,
    });

    const rawMd = readFileSync(join(contentDir, page.file), "utf8");
    const chart =
      page.id === "signals" ? signalsChart(rawMd)
      : page.id === "weights" ? weightsChart(rawMd)
      : page.id === "flux3" ? flux3Chart(root, (p) => hrefBetween(page.path, p))
      : "";
    const extraClass = ["ds-section", page.topic === "flux3" ? "trend-has-tabs" : ""].filter(Boolean).join(" ");
    writePage(
      page.path,
      renderPage({
        id: page.id,
        title: page.title,
        path: page.path,
        extraClass,
        description: page.summary || config.description,
        body: `${chart}<article class="ds-prose">${html}</article>`,
      }),
    );
  }

  for (const issue of weeklyIssues) {
    writeWeeklyIssue(issue);
    contentPages.push({
      id: `weekly-${issue.date}`,
      title: issue.title,
      path: issue.path,
      summary: issue.summary,
    });
  }

  if (!publicDeploy || !privatePages.has("home")) {
    const homeData = readHomeData();
    writePage(
      "/",
      renderPage({
        id: "home",
        title: config.title,
        path: "/",
        extraClass: "trend-home",
        description: homeData.live.conclusion || config.description,
        body: homeBody({ ...homeData, weekly: weeklyIssues[0] || null }),
      }),
    );
  }

  if (PAPERS.length) {
    writePage("/papers/", renderPage({ id: "papers", title: "论文图解", path: "/papers/", extraClass: "ds-section",
      description: "站内引用论文的主图和一句话说明", body: papersBody(PAPERS) }));
    copyPaperAssets(contentDir, distDir);
    contentPages.push({ id: "papers", title: "论文图解", path: "/papers/", summary: "论文图解" });
  }
  mkdirSync(join(distDir, "assets"), { recursive: true });
  cpSync(join(srcDir, "styles.css"), join(distDir, "styles.css"));
  cpSync(join(srcDir, "theme.js"), join(distDir, "theme.js"));
  cpSync(join(srcDir, "skin-raw.css"), join(distDir, "assets", "skin-raw.css"));
  const copiedImages = copyCaseAssets(root, distDir);
  writeFileSync(join(distDir, ".nojekyll"), "");
  publishMitStatic();

  console.log(`Built ${contentPages.length + 1} pages → dist/ (public=${publicDeploy}, case images=${copiedImages}, mit-static overlay)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildSite();
}
