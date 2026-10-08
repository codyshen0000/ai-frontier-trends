import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const contentDir = join(root, "content");
const srcDir = join(root, "src");

const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const publicDeploy = process.env.PUBLIC_DEPLOY === "1";
const privatePages = new Set(config.privatePages ?? []);

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

function navItems(currentId, fromPath) {
  return config.pages
    .filter((page) => !publicDeploy || !privatePages.has(page.id))
    .map((page) => {
      const href = hrefBetween(fromPath, page.path);
      const current = page.id === currentId ? ' aria-current="page"' : "";
      return `<a href="${href}"${current}>${page.nav}</a>`;
    })
    .join("");
}

function renderPage({ id, title, path, body, extraClass = "" }) {
  const cssHref = assetHref(path, "styles.css");
  const jsHref = assetHref(path, "theme.js");
  const pageTitle = id === "home" ? config.title : `${title} · ${config.title}`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(config.description)}">
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
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="${hrefBetween(path, "/")}">${escapeHtml(config.title)}</a>
      <nav class="site-nav" aria-label="站点导航">${navItems(id, path)}</nav>
      <button type="button" id="theme-toggle" class="theme-toggle" aria-label="切换配色">
        <span class="theme-icon theme-icon-light" aria-hidden="true">☀</span>
        <span class="theme-icon theme-icon-dark" aria-hidden="true">☾</span>
      </button>
    </div>
  </header>
  <main id="main" class="site-main ${extraClass}">
    ${body}
  </main>
  <footer class="site-footer">
    <p>公开页。内容来自公开时间线、信号表、权重追踪与 FLUX 3 提示词速查、示例库、相机术语表。</p>
  </footer>
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
      return `<a class="card" href="${href}">
        <h2>${escapeHtml(page.title)}</h2>
        <p>${escapeHtml(page.summary)}</p>
      </a>`;
    })
    .join("");

  return `<section class="hero">
    <p class="eyebrow">公开整理</p>
    <h1>${escapeHtml(config.title)}</h1>
    <p class="lede">${escapeHtml(config.description)}</p>
  </section>
  <section class="card-grid" aria-label="页面列表">${cards}</section>`;
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const contentPages = [];

for (const page of config.pages) {
  if (publicDeploy && privatePages.has(page.id)) continue;

  if (page.htmlFile) {
    const raw = readFileSync(join(contentDir, page.htmlFile), "utf8");
    writePage(page.path, raw);
    contentPages.push({
      ...page,
      summary: page.summary || page.title,
    });
    continue;
  }

  if (!page.file) continue;

  const source = prepareMarkdown(readFileSync(join(contentDir, page.file), "utf8"));
  const html = decorateTags(marked.parse(source)).replace(
    /详见权重追踪页/g,
    `详见<a href="${hrefBetween(page.path, "/weights/")}">权重追踪页</a>`,
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
      extraClass: "prose",
      body: `<article class="doc">${html}</article>`,
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
      extraClass: "home",
      body: homeBody(contentPages),
    }),
  );
}

cpSync(join(srcDir, "styles.css"), join(distDir, "styles.css"));
cpSync(join(srcDir, "theme.js"), join(distDir, "theme.js"));
writeFileSync(join(distDir, ".nojekyll"), "");

console.log(`Built ${contentPages.length + 1} pages → dist/ (public=${publicDeploy})`);
