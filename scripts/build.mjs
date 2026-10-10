import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { casesGalleryBody, casesSummary, copyCaseAssets } from "./flux3_cases_page.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const contentDir = join(root, "content");
const srcDir = join(root, "src");

const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const publicDeploy = process.env.PUBLIC_DEPLOY === "1";
const privatePages = new Set(config.privatePages ?? []);

const DS_CSS = "https://codyshen0000.github.io/assets/ds.css";
const HUB_LINKS = [
  { href: "https://codyshen0000.github.io/", label: "个人主页" },
  { href: "https://codyshen0000.github.io/studio/", label: "看板 Studio" },
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
  return html.replace(/【(证实|推断|叙事)[^】]*】/g, (match, kind) => {
    const cls =
      kind === "证实" ? "tag-confirmed" : kind === "推断" ? "tag-inferred" : "tag-narrative";
    return `<span class="tag ${cls}">${match}</span>`;
  });
}

function wrapTables(html) {
  return html
    .replace(/<table>/g, '<div class="ds-table-wrap"><table class="ds-table">')
    .replace(/<\/table>/g, "</table></div>");
}

function prepareMarkdown(text) {
  return text.replace(/\*\*(【(?:证实|推断|叙事)[^】]*】)\*\*/g, "<strong>$1</strong>");
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

function siteNavLinks(currentId, fromPath) {
  return config.pages
    .filter((page) => !publicDeploy || !privatePages.has(page.id))
    .map((page) => {
      const href = hrefBetween(fromPath, page.path);
      const current = page.id === currentId;
      const attrs = current ? ' class="active" aria-current="page"' : "";
      return `<a href="${href}"${attrs}>${page.nav}</a>`;
    })
    .join("");
}

function hubNavLinks() {
  return HUB_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join("");
}

function navBar({ currentId, fromPath }) {
  return `<header class="ds-nav" id="nav" data-ds-injected="nav">
    <div class="ds-nav-inner">
      <a class="ds-nav-brand" href="${hrefBetween(fromPath, "/")}">${escapeHtml(config.title)}</a>
      <nav class="ds-nav-links" aria-label="站点导航">
        ${hubNavLinks()}
        <span class="ds-nav-sep" aria-hidden="true"></span>
        ${siteNavLinks(currentId, fromPath)}
      </nav>
      <div class="ds-nav-tools">
        <button type="button" id="theme-toggle" aria-label="切换配色">☾</button>
        <button type="button" class="ds-nav-menu" id="nav-menu" aria-label="打开菜单" aria-expanded="false"><span></span></button>
      </div>
    </div>
  </header>`;
}

const THEME_BOOT =
  '<script data-ds-injected="theme">(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.classList.add("ds-page");}catch(e){document.documentElement.classList.add("ds-page");}})();</script>';

const RAW_NAV_UI =
  '<script data-ds-injected="ui">(function(){var root=document.documentElement,nav=document.getElementById("nav"),menu=document.getElementById("nav-menu"),btn=document.getElementById("theme-toggle");function apply(t){root.dataset.theme=t;if(!btn)return;var d=t==="dark";btn.setAttribute("aria-pressed",d?"true":"false");btn.setAttribute("aria-label",d?"切换到浅色模式":"切换到深色模式");btn.textContent=d?"☀":"☾";}function pref(){try{var s=localStorage.getItem("theme");if(s==="light"||s==="dark")return s;}catch(e){}return matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}apply(pref());btn&&btn.addEventListener("click",function(){var n=root.dataset.theme==="dark"?"light":"dark";try{localStorage.setItem("theme",n);}catch(e){}apply(n);});function setMenu(o){if(!nav)return;nav.classList.toggle("is-open",o);menu&&menu.setAttribute("aria-expanded",o?"true":"false");}menu&&menu.addEventListener("click",function(){setMenu(!nav.classList.contains("is-open"));});nav&&nav.querySelectorAll(".ds-nav-links a").forEach(function(a){a.addEventListener("click",function(){setMenu(false);});});window.addEventListener("resize",function(){if(window.innerWidth>734)setMenu(false);});function onScroll(){nav&&nav.classList.toggle("scrolled",window.scrollY>8);}window.addEventListener("scroll",onScroll,{passive:true});onScroll();})();</script>';

function injectBeforeHeadEnd(html, snippet, alreadyPresent) {
  if (alreadyPresent(html)) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${snippet}</head>`);
  return `${snippet}${html}`;
}

function injectAfterBodyOpen(html, snippet, alreadyPresent) {
  if (alreadyPresent(html)) return html;
  if (/<body\b[^>]*>/i.test(html)) return html.replace(/<body\b[^>]*>/i, (open) => `${open}${snippet}`);
  return `${snippet}${html}`;
}

export function injectHtmlFile(raw, { currentId, path }) {
  const skinHref = assetHref(path, "assets/skin-raw.css");
  const cssLink = `<link rel="stylesheet" href="${DS_CSS}" data-ds-injected="css">`;
  const skinLink = `<link rel="stylesheet" href="${skinHref}" data-ds-injected="skin">`;
  let html = raw;
  html = injectBeforeHeadEnd(
    html,
    cssLink,
    (src) => src.includes('data-ds-injected="css"') || src.includes(DS_CSS),
  );
  html = injectBeforeHeadEnd(
    html,
    skinLink,
    (src) => src.includes('data-ds-injected="skin"') || src.includes("skin-raw.css"),
  );
  html = injectBeforeHeadEnd(
    html,
    THEME_BOOT,
    (src) => src.includes('data-ds-injected="theme"'),
  );
  html = injectAfterBodyOpen(
    html,
    `${navBar({ currentId, fromPath: path })}${RAW_NAV_UI}`,
    (src) => src.includes('data-ds-injected="nav"') || src.includes('id="ds-raw-nav"'),
  );
  return html;
}

function renderPage({ id, title, path, body, extraClass = "" }) {
  const cssHref = assetHref(path, "styles.css");
  const jsHref = assetHref(path, "theme.js");
  const pageTitle = id === "home" ? config.title : `${title} · ${config.title}`;

  return `<!DOCTYPE html>
<html lang="zh-CN" class="ds-page">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(config.description)}">
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
    ${body}
  </main>
  <footer class="ds-footer">
    <div class="ds-wrap ds-footer-inner">
      <p>公开页。内容来自公开时间线、信号表、权重追踪与 FLUX 3 提示词速查、示例库、相机术语表、官方案例。</p>
      <p><a href="https://codyshen0000.github.io/">个人主页</a></p>
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

function homeBody(contentPages) {
  const cards = contentPages
    .map((page) => {
      const href = hrefBetween("/", page.path);
      return `<a class="ds-card" href="${href}">
        <h2>${escapeHtml(page.title)}</h2>
        <p class="ds-muted">${escapeHtml(page.summary)}</p>
      </a>`;
    })
    .join("");

  return `<section class="ds-hero">
    <p class="ds-hero-kicker">公开整理</p>
    <h1 class="ds-hero-title">${escapeHtml(config.title)}</h1>
    <p class="ds-hero-sub">${escapeHtml(config.description)}</p>
  </section>
  <section class="card-grid" aria-label="页面列表">${cards}</section>`;
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
  if (!injected.includes("#back-home") && !raw.includes('id="back-home"')) {
    /* pages without the script anchor are still valid */
  }
  const twice = injectHtmlFile(injected, { currentId: page.id, path: page.path });
  if (twice !== injected) {
    throw new Error(`${page.id}: raw injection is not idempotent`);
  }
  assertNoLocalPaths(injected, page.id);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const contentPages = [];

for (const page of config.pages) {
  if (publicDeploy && privatePages.has(page.id)) continue;

  if (page.gallery === "flux3-cases") {
    writePage(
      page.path,
      renderPage({
        id: page.id,
        title: page.title,
        path: page.path,
        extraClass: "ds-section trend-cases",
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

  writePage(
    page.path,
    renderPage({
      id: page.id,
      title: page.title,
      path: page.path,
      extraClass: "ds-section",
      body: `<article class="ds-prose">${html}</article>`,
    }),
  );
}

if (!publicDeploy || !privatePages.has("home")) {
  writePage(
    "/",
    renderPage({
      id: "home",
      title: config.title,
      path: "/",
      extraClass: "",
      body: homeBody(contentPages),
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
