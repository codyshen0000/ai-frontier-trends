/** Build-time charts. Every number is counted from repo content at build time, so charts
 *  update on every deploy (live/timeline syncs trigger a rebuild). Inline SVG, no JS. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const strip = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

export const CHART_CSS = `.chart-fig{margin:24px 0;padding:20px 20px 14px;background:var(--ds-bg-elevated,#fff);border:1px solid var(--ds-hairline,#e5e5ea);border-radius:var(--ds-radius-md,14px);max-width:860px}
.chart-fig h3{margin:0 0 4px;font-size:17px;line-height:1.35;color:var(--ds-text,#1d1d1f)}
.chart-fig .chart-sub{margin:0 0 10px;font-size:13px;color:var(--ds-text-secondary,#6e6e73)}
.cb{display:grid;gap:8px}
.cb-row{display:grid;grid-template-columns:minmax(0,38%) 1fr auto;align-items:center;gap:10px;font-size:13px;color:var(--ds-text,#1d1d1f)}
.cb-lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cb-track{height:14px;border-radius:7px;background:var(--ds-surface-3,#f2f2f7);overflow:hidden}
.cb-bar{display:block;height:100%;min-width:3px;border-radius:7px;background:var(--ds-accent,#0058b0)}
.cb-bar.b2{background:#34c759}.cb-bar.b3{background:#ff9f0a}.cb-bar.b4{background:#8e8e93;min-width:0}
.cb-val{font-weight:600;font-variant-numeric:tabular-nums;min-width:3.5em;text-align:right}
@media (max-width:734px){.chart-fig{padding:16px 14px 12px}.cb-row{grid-template-columns:1fr auto;gap:2px 8px}.cb-lbl{grid-column:1/-1;white-space:normal}.cb-track{grid-column:1}}
.chart-fig figcaption{margin-top:8px;font-size:12px;color:var(--ds-text-secondary,var(--ft-ink,#4f5b61))}
.chart-fig figcaption a{color:inherit;text-decoration:underline}
.chart-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.chart-grid .chart-fig{margin:0}`;

/** Horizontal bar chart as HTML/CSS (text stays readable on phones). rows: [{label, value, cls?}] */
export function barChart({ title, sub = "", rows, unit = "", source, aria }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const bars = rows.map((r) => `<div class="cb-row" title="${esc(r.label)}：${r.value}${esc(unit)}"><span class="cb-lbl">${esc(r.label)}</span><span class="cb-track"><span class="cb-bar ${r.cls || ""}" style="width:${((100 * r.value) / max).toFixed(1)}%"></span></span><span class="cb-val">${r.value}${esc(unit)}</span></div>`).join("");
  return `<figure class="chart-fig"><h3>${esc(title)}</h3>${sub ? `<p class="chart-sub">${esc(sub)}</p>` : ""}
<div class="cb" role="img" aria-label="${esc(aria || title)}">${bars}</div>
<figcaption>${source}</figcaption></figure>`;
}

/* ---------- data readers (counted from repo content, never typed in) ---------- */

/** Timeline: number of distinct source links cited under each 主线 heading. */
export function timelineSources(html) {
  const parts = String(html).split(/<h3\b[^>]*>(?=\s*主线\s*\d+)/i).slice(1);
  return parts.map((part) => {
    const head = part.match(/^\s*主线\s*(\d+)\s*[：:]([\s\S]*?)<\/h3>/i);
    const body = part.split(/<h[23]\b/i)[0];
    const links = new Set([...body.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]));
    const short = head ? strip(head[2]).replace(/【[^】]*】/g, "").split(/[：:，,——]/)[0].trim() : "";
    return head ? { n: Number(head[1]), label: `主线 ${head[1]} ${short}`, value: links.size } : null;
  }).filter(Boolean);
}

/** Timeline: number of change items per dated 变更 section. */
export function timelineChanges(html) {
  return [...String(html).matchAll(/<h2\b[^>]*>([^<]*变更[^<]*)<\/h2>\s*<ul>([\s\S]*?)<\/ul>/gi)].map((m) => {
    const d = (m[1].match(/\d{4}-\d{2}-\d{2}/) || [""])[0];
    return { label: d + (/周报/.test(m[1]) ? "（周报）" : ""), value: (m[2].match(/<li\b/gi) || []).length };
  }).filter((r) => r.label);
}

/** Markdown tables under ## headings: rows per section. */
export function signalRows(md) {
  return String(md).split(/^## /m).slice(1).map((sec) => {
    const title = sec.split("\n")[0].trim();
    const rows = sec.split("\n").filter((l) => /^\|\s*\d{4}-\d{2}-\d{2}/.test(l)).length;
    return { label: title.replace(/（[^）]*）/g, ""), value: rows };
  });
}

function cellText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\*+/g, "")
    .replace(/`+/g, "")
    .trim();
}

export function weightsStatus(md) {
  const rows = String(md).split("\n").filter((l) => l.startsWith("|") && !/^\|\s*(模型|---)/.test(l));
  const by = {};
  for (const r of rows) {
    const c = r.split("|").map((s) => s.trim());
    const v = cellText(c[4]);
    const k = /^\d{4}-|^\d{1,2}-\d{1,2}|已交付|已上线/.test(v) ? "已交付" : v || "未填";
    by[k] = (by[k] || 0) + 1;
  }
  return { total: rows.length, by };
}

export function flux3Categories(root) {
  const recs = readFileSync(join(root, "flux3-official-cases", "manifest.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const names = { t2i: "文生图", layout: "版式/框选布局", edit: "编辑", multi_ref: "多参考图" };
  const by = {};
  for (const r of recs) by[r.category] = (by[r.category] || 0) + 1;
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: names[k] || k, value: v }));
  return { total: recs.length, rows };
}

/* ---------- page blocks ---------- */

export function homeCharts({ timelineHtml, href }) {
  const src = timelineSources(timelineHtml);
  const best = src.reduce((a, b) => (b.value > a.value ? b : a), { value: -1 });
  const ch = timelineChanges(timelineHtml);
  const blocks = [];
  if (ch.length) blocks.push(barChart({
    title: `首版后 ${ch.length} 次修订，共改了 ${ch.reduce((a, b) => a + b.value, 0)} 处`,
    sub: "时间线每次变更记录里的条目数", rows: ch, unit: " 处",
    source: `数据：<a href="${href("/timeline/")}">趋势时间线</a> 各“变更”小节，构建时自动统计。`,
  }));
  if (src.length) blocks.push(barChart({
    title: `${best.label.split(" ").slice(0, 2).join(" ")} 引用的一手来源最多（${best.value} 个）`,
    sub: "时间线里每条主线引用的不同链接数",
    rows: src.map((r) => ({ label: r.label, value: r.value })), unit: " 个",
    source: `数据：<a href="${href("/timeline/")}">趋势时间线</a> 每条主线下的去重链接，构建时自动统计。`,
  }));
  return `<section class="ds-section" id="charts"><div class="ds-section-header"><h2 class="ds-section-title">一图看主线</h2></div><div class="chart-grid">${blocks.join("")}</div></section>`;
}

export function timelineCharts(html) {
  const ch = timelineChanges(html), src = timelineSources(html);
  const out = [];
  if (ch.length) {
    const total = ch.reduce((a, b) => a + b.value, 0);
    out.push(barChart({ title: `首版后 ${ch.length} 次修订，共改了 ${total} 处`, sub: "每次变更记录里的条目数", rows: ch, unit: " 处",
      source: "数据：本页各“变更”小节的条目，构建时自动统计。" }));
  }
  if (src.length) {
    const best = src.reduce((a, b) => (b.value > a.value ? b : a));
    out.push(barChart({ title: `主线 ${best.n} 的证据链最长（${best.value} 个来源）`, sub: "每条主线下引用的不同链接数", rows: src, unit: " 个",
      source: "数据：本页每条主线下的去重链接，构建时自动统计。" }));
  }
  return out.length ? `<aside class="ds-wrap chart-block" data-ds-injected="charts"><style>${CHART_CSS}</style><div class="chart-grid">${out.join("")}</div></aside>` : "";
}

export function signalsChart(md) {
  const rows = signalRows(md);
  if (!rows.length) return "";
  const hit = rows.filter((r) => r.value > 0).length;
  return barChart({ title: `${rows.length} 个信号里 ${hit} 个已出现证据`, sub: "每个信号下已记录的证据条数（0 = 尚未出现）",
    rows: rows.map((r) => ({ ...r, cls: r.value ? "" : "b4" })), unit: " 条", source: "数据：本页各信号表的已记录行数，构建时自动统计。" });
}

export function weightsChart(md) {
  const { total, by } = weightsStatus(md);
  if (!total) return "";
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v, cls: k === "已交付" ? "b2" : "b3" }));
  const done = by["已交付"] || 0;
  return barChart({ title: `已宣布的 ${total} 个模型里 ${done} 个已交付`, sub: "按“实际交付日期”一列归类", rows, unit: " 个",
    source: "数据：本页权重追踪表，构建时自动统计。" });
}

export function flux3Chart(root, href) {
  const { total, rows } = flux3Categories(root);
  return barChart({ title: `BFL 官方 ${total} 个 FLUX 3 案例里，${rows[0].label}占 ${rows[0].value} 个`, sub: "按案例类型分",
    rows, unit: " 个", source: `数据：<a href="https://docs.bfl.ml/flux_3/flux3_image_overview">BFL 官方文档</a> 抓取的案例清单（见<a href="${href("/flux3/cases/")}">官方案例</a>页），构建时自动统计。` });
}
