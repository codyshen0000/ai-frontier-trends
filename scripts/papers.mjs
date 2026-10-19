/** Paper explainer cards. Data comes from content/papers/cache/<id>/meta.json written by
 *  scripts/fetch_papers.py (figure only when the arXiv licence allows reuse) and the
 *  hand-written one-line captions in content/papers/summaries.json. Missing = skipped. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function loadPapers(contentDir) {
  const cache = join(contentDir, "papers", "cache");
  if (!existsSync(cache)) return [];
  const sumPath = join(contentDir, "papers", "summaries.json");
  const sums = existsSync(sumPath) ? JSON.parse(readFileSync(sumPath, "utf8")) : {};
  return readdirSync(cache)
    .filter((id) => existsSync(join(cache, id, "meta.json")))
    .map((id) => ({ ...JSON.parse(readFileSync(join(cache, id, "meta.json"), "utf8")), summary: sums[id] || "" }))
    .filter((p) => p.title)
    .sort((a, b) => b.id.localeCompare(a.id));
}

export const PAPER_CSS = `.paper-card{margin:0 0 28px;padding:20px;background:var(--ds-bg-elevated,#fff);border:1px solid var(--ds-hairline,#e5e5ea);border-radius:var(--ds-radius-md,14px);scroll-margin-top:80px}
.paper-card h3{margin:0 0 6px;font-size:18px;line-height:1.35}.paper-card .paper-id{font-size:12px;color:var(--ds-text-tertiary,#8e8e93)}
.paper-card .paper-sum{margin:8px 0 12px;font-size:15px;line-height:1.6}
.paper-card figure{margin:0}.paper-card img{display:block;width:100%;height:auto;border-radius:8px;background:#fff;cursor:zoom-in}
.paper-card figcaption{margin-top:6px;font-size:12px;color:var(--ds-text-tertiary,#8e8e93);line-height:1.5}
.paper-card figcaption a{color:inherit;text-decoration:underline}
.paper-nofig{font-size:13px;color:var(--ds-text-secondary,#6e6e73)}
a.paper-explain{margin-left:4px;font-size:.78em;padding:1px 6px;border-radius:999px;background:var(--ds-surface-3,#e8e8ed);color:var(--ds-accent,#0058b0)!important;text-decoration:none;white-space:nowrap}`;

export function papersBody(papers) {
  const withFig = papers.filter((p) => p.fig_file).length;
  const cards = papers.map((p) => {
    const fig = p.fig_file
      ? `<figure><a href="${esc(p.fig_src)}"><img loading="lazy" src="./${esc(p.id)}/${esc(p.fig_file)}" alt="${esc(p.title)} Figure ${p.fig_no}"></a>
<figcaption>图：论文 Figure ${p.fig_no}${p.fig_caption ? `（原图注：${esc(p.fig_caption)}）` : ""}。来源 <a href="${esc(p.abs)}">arXiv ${esc(p.id)}</a>，许可 <a href="${esc(p.license)}">${esc(p.license.replace(/^https:\/\/creativecommons\.org\//, "CC "))}</a>，原图未改动。</figcaption></figure>`
      : `<p class="paper-nofig">未转载图：${p.reuse_ok ? esc(p.fig_error || "取不到图") : "该论文用 arXiv 默认许可，不允许转载"}。请看 <a href="${esc(p.abs)}">arXiv 原文</a>。</p>`;
    const sum = p.summary
      ? `<p class="paper-sum">${esc(p.summary)}</p>`
      : p.abstract_first ? `<p class="paper-sum">摘要首句（原文）：${esc(p.abstract_first)}</p>` : "";
    return `<article class="paper-card" id="p-${esc(p.id)}"><h3>${esc(p.title)}</h3><span class="paper-id"><a href="${esc(p.abs)}">arXiv ${esc(p.id)}</a></span>${sum}${fig}</article>`;
  }).join("");
  return `<article class="ds-prose"><h1>论文图解</h1><p>站内引用的 ${papers.length} 篇 arXiv 论文，${withFig} 篇附了论文自己的主图。每篇一句话说明：解决什么问题、用什么方法、主要收益。数字只取自论文摘要，取不到就写“见论文”。只转载 CC 许可的论文图，并标明图号和许可。</p></article>${cards}`;
}

export function copyPaperAssets(contentDir, distDir) {
  const cache = join(contentDir, "papers", "cache");
  if (!existsSync(cache)) return 0;
  let n = 0;
  for (const id of readdirSync(cache)) {
    const m = join(cache, id, "meta.json");
    if (!existsSync(m)) continue;
    const meta = JSON.parse(readFileSync(m, "utf8"));
    if (!meta.fig_file) continue;
    mkdirSync(join(distDir, "papers", id), { recursive: true });
    cpSync(join(cache, id, meta.fig_file), join(distDir, "papers", id, meta.fig_file));
    n++;
  }
  return n;
}

/** Add a small “图解” link after every arXiv link whose paper has a card. Marked for stripInjected. */
export function addExplainLinks(html, papers, hrefToPapers) {
  const known = new Set(papers.map((p) => p.id));
  return String(html).replace(/(<a\b[^>]*href="https?:\/\/arxiv\.org\/(?:abs|html|pdf)\/(\d{4}\.\d{4,5})[^"]*"[^>]*>[\s\S]*?<\/a>)/g, (m, link, id) =>
    known.has(id) ? `${link}<a class="paper-explain" data-ds-injected="pf" href="${hrefToPapers}#p-${id}">图解</a>` : m);
}
