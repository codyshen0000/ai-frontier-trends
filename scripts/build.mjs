import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import { casesGalleryBody, casesSummary, copyCaseAssets } from "./flux3_cases_page.mjs";
import {
  extractLiveSpotlight,
  extractThreads,
  ensureThreadAnchors,
} from "./extract.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const contentDir = join(root, "content");
const srcDir = join(root, "src");

const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const publicDeploy = process.env.PUBLIC_DEPLOY === "1";
const privatePages = new Set(config.privatePages ?? []);

const DS_CSS = "https://codyshen0000.github.io/assets/ds.css";

const FLUX_TABS = [
  { tab: "cheatsheet", label: "速查表", path: "/flux3/" },
  { tab: "cases", label: "官方案例", path: "/flux3/cases/" },
  { tab: "examples", label: "示例库", path: "/flux3/examples/" },
  { tab: "camera", label: "相机术语", path: "/flux3/camera-terms/" },
];

const TREND_SUBNAV = [
  { id: "timeline", label: "时间线", path: "/timeline/" },
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
  const fromParts = fromPath.split("/").filter(Boolean);
  const toParts = toPath.split("/").filter(Boolean);
  const prefix = fromParts.length === 0 ? "./" : "../".repeat(fromParts.length);
  if (toParts.length === 0) return prefix;
  return `${prefix}${toParts.join("/")}/`;
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

const NAV_EXTRA_CSS = `.trend-dd{position:relative;display:flex;align-items:center}
.trend-dd-menu{display:none;position:absolute;top:calc(100% + 8px);left:0;min-width:148px;padding:8px;background:var(--ds-bg-elevated);border:1px solid var(--ds-hairline);border-radius:var(--ds-radius-sm);box-shadow:var(--ds-shadow-2);z-index:60;flex-direction:column;gap:2px}
.trend-dd:hover .trend-dd-menu,.trend-dd:focus-within .trend-dd-menu{display:flex}
.trend-dd-menu a{padding:8px 10px;font-size:13px;color:var(--ds-text-secondary)!important;border-radius:8px}
.trend-dd-menu a:hover,.trend-dd-menu a.active{color:var(--ds-text)!important;background:var(--ds-surface-3)}
@media (max-width:734px){
.trend-dd{flex-direction:column;align-items:stretch}
.trend-dd-menu{display:flex;position:static;border:0;box-shadow:none;padding:0 0 0 12px;background:transparent;min-width:0}
.trend-dd-menu a{padding:12px 4px;font-size:17px;border-bottom:1px solid var(--ds-hairline);border-radius:0}
}`;

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

function siteNavLinks(currentId, fromPath) {
  const active = primaryActiveId(currentId);
  const primary = (config.nav?.primary ?? []).map((item) => {
    const href = hrefBetween(fromPath, item.path);
    const current = item.id === active;
    if (item.children?.length) {
      const childLinks = item.children
        .map((child) =>
          navLink(hrefBetween(fromPath, child.path), child.label, {
            current: child.id === currentId,
          }),
        )
        .join("");
      return `<div class="trend-dd">
        ${navLink(href, item.label, { current, extraClass: "trend-dd-trigger" })}
        <div class="trend-dd-menu">${childLinks}</div>
      </div>`;
    }
    return navLink(href, item.label, { current });
  });

  const external = (config.nav?.external ?? []).map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`);
  return `${primary.join("")}<span class="ds-nav-sep" aria-hidden="true"></span>${external.join("")}`;
}

function navBar({ currentId, fromPath }) {
  return `<style data-ds-injected="nav-css">${NAV_EXTRA_CSS}</style>
  <header class="ds-nav" id="nav" data-ds-injected="nav">
    <div class="ds-nav-inner">
      <a class="ds-nav-brand" href="${hrefBetween(fromPath, "/")}">${escapeHtml(config.title)}</a>
      <nav class="ds-nav-links" aria-label="站点导航">
        ${siteNavLinks(currentId, fromPath)}
      </nav>
      <div class="ds-nav-tools">
        <button type="button" id="theme-toggle" aria-label="切换配色">☾</button>
        <button type="button" class="ds-nav-menu" id="nav-menu" aria-label="打开菜单" aria-expanded="false"><span></span></button>
      </div>
    </div>
  </header>`;
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
  if (!page) return "";
  const bits = [crumbBar(page)];
  if (page.group === "trends") bits.push(trendSubnav(page.id, fromPath));
  if (page.topic === "flux3") bits.push(fluxTabs(page.tab, fromPath));
  return bits.filter(Boolean).join("");
}

const THEME_BOOT =
  '<script data-ds-injected="theme">(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.classList.add("ds-page");}catch(e){document.documentElement.classList.add("ds-page");}})();</script>';

const RAW_NAV_UI =
  '<script data-ds-injected="ui">(function(){var root=document.documentElement,nav=document.getElementById("nav"),menu=document.getElementById("nav-menu"),btn=document.getElementById("theme-toggle");function apply(t){root.dataset.theme=t;if(!btn)return;var d=t==="dark";btn.setAttribute("aria-pressed",d?"true":"false");btn.setAttribute("aria-label",d?"切换到浅色模式":"切换到深色模式");btn.textContent=d?"☀":"☾";}function pref(){try{var s=localStorage.getItem("theme");if(s==="light"||s==="dark")return s;}catch(e){}return matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}apply(pref());btn&&btn.addEventListener("click",function(){var n=root.dataset.theme==="dark"?"light":"dark";try{localStorage.setItem("theme",n);}catch(e){}apply(n);});function setMenu(o){if(!nav)return;nav.classList.toggle("is-open",o);menu&&menu.setAttribute("aria-expanded",o?"true":"false");menu&&menu.setAttribute("aria-label",o?"关闭菜单":"打开菜单");}menu&&menu.addEventListener("click",function(){setMenu(!nav.classList.contains("is-open"));});nav&&nav.querySelectorAll(".ds-nav-links a").forEach(function(a){a.addEventListener("click",function(){setMenu(false);});});window.addEventListener("resize",function(){if(window.innerWidth>734)setMenu(false);});function onScroll(){nav&&nav.classList.toggle("scrolled",window.scrollY>8);}window.addEventListener("scroll",onScroll,{passive:true});onScroll();})();</script>';

function stripInjected(html) {
  return String(html)
    .replace(/<link[^>]*data-ds-injected="css"[^>]*>\s*/gi, "")
    .replace(/<link[^>]*data-ds-injected="skin"[^>]*>\s*/gi, "")
    .replace(/<style[^>]*data-ds-injected="nav-css"[^>]*>[\s\S]*?<\/style>\s*/gi, "")
    .replace(/<script[^>]*data-ds-injected="theme"[^>]*>[\s\S]*?<\/script>\s*/gi, "")
    .replace(/<header[^>]*data-ds-injected="nav"[^>]*>[\s\S]*?<\/header>\s*/gi, "")
    .replace(/<script[^>]*data-ds-injected="ui"[^>]*>[\s\S]*?<\/script>\s*/gi, "")
    .replace(/(<body\b[^>]*>)\s+/i, "$1");
}

function injectBeforeHeadEnd(html, snippet) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${snippet}</head>`);
  return `${snippet}${html}`;
}

function injectAfterBodyOpen(html, snippet) {
  if (/<body\b[^>]*>/i.test(html)) return html.replace(/<body\b[^>]*>/i, (open) => `${open}${snippet}`);
  return `${snippet}${html}`;
}

export function injectHtmlFile(raw, { currentId, path }) {
  const skinHref = assetHref(path, "assets/skin-raw.css");
  const cssLink = `<link rel="stylesheet" href="${DS_CSS}" data-ds-injected="css">`;
  const skinLink = `<link rel="stylesheet" href="${skinHref}" data-ds-injected="skin">`;
  let html = stripInjected(raw);
  if (path === "/timeline/") html = ensureThreadAnchors(html);
  html = injectBeforeHeadEnd(html, cssLink);
  html = injectBeforeHeadEnd(html, skinLink);
  html = injectBeforeHeadEnd(html, THEME_BOOT);
  html = injectAfterBodyOpen(html, `${navBar({ currentId, fromPath: path })}${RAW_NAV_UI}`);
  return html;
}

function renderPage({ id, title, path, body, extraClass = "", description = config.description }) {
  const cssHref = assetHref(path, "styles.css");
  const jsHref = assetHref(path, "theme.js");
  const pageTitle = id === "home" ? config.title : `${title} · ${config.title}`;
  const page = pageById(id);

  return `<!DOCTYPE html>
<html lang="zh-CN" class="ds-page">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="${DS_CSS}">
  <link rel="stylesheet" href="${cssHref}">
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

function chipClass(status) {
  if (status === "加强") return "ds-tag";
  if (status === "待验证") return "ds-tag-outline";
  return "ds-chip";
}

function homeBody({ live, threads, lede }) {
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
      <a class="ds-btn-fill" href="${hrefBetween("/", "/live/")}">看今天的热点 ›</a>
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
      <p>看板每 30 分钟检查一次，有变化就更新。时间线每晚更新。</p>
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

function verifyRawInjection(page, raw, injected) {
  if (!injected.includes(DS_CSS)) throw new Error(`${page.id}: missing ds.css`);
  if (!injected.includes("skin-raw.css")) throw new Error(`${page.id}: missing skin-raw.css`);
  if (!injected.includes('data-ds-injected="nav"')) throw new Error(`${page.id}: missing injected nav`);
  if (!injected.includes(">今日<") || !injected.includes(">趋势<") || !injected.includes(">专题<") || !injected.includes(">关于<")) {
    throw new Error(`${page.id}: injected nav missing primary items`);
  }
  const twice = injectHtmlFile(injected, { currentId: page.id, path: page.path });
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
  return { live, threads: extracted.threads, lede: extracted.lede, threadSource: extracted.source };
}

export function buildSite() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  const contentPages = [];

  for (const page of config.pages) {
    if (publicDeploy && privatePages.has(page.id)) continue;
    if (page.home) continue;

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
      const injected = injectHtmlFile(raw, { currentId: page.id, path: page.path });
      verifyRawInjection(page, raw, injected);
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
      decorateTags(marked.parse(source)).replace(
        /详见权重追踪页/g,
        `详见<a href="${hrefBetween(page.path, "/weights/")}">权重追踪页</a>`,
      ),
    );
    contentPages.push({
      ...page,
      summary: page.summary || page.title,
      html,
    });

    const extraClass = ["ds-section", page.topic === "flux3" ? "trend-has-tabs" : ""].filter(Boolean).join(" ");
    writePage(
      page.path,
      renderPage({
        id: page.id,
        title: page.title,
        path: page.path,
        extraClass,
        description: page.summary || config.description,
        body: `<article class="ds-prose">${html}</article>`,
      }),
    );
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
        body: homeBody(homeData),
      }),
    );
  }

  mkdirSync(join(distDir, "assets"), { recursive: true });
  cpSync(join(srcDir, "styles.css"), join(distDir, "styles.css"));
  cpSync(join(srcDir, "theme.js"), join(distDir, "theme.js"));
  cpSync(join(srcDir, "skin-raw.css"), join(distDir, "assets", "skin-raw.css"));
  const copiedImages = copyCaseAssets(root, distDir);
  writeFileSync(join(distDir, ".nojekyll"), "");

  console.log(`Built ${contentPages.length + 1} pages → dist/ (public=${publicDeploy}, case images=${copiedImages})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildSite();
}
