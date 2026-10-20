/**
 * Static jump pages from `redirects.json` (`merged_into` / `merged_from`).
 *
 * Each `from` id gets `dist/events/<from>/index.html` with:
 *   - meta refresh to the canonical event (relative path)
 *   - rel=canonical under `/ai-frontier-trends/events/<to>/`
 *
 * Hook (phase 2, after #24 QA): `static_export.mjs` / `build.mjs` call
 * `writeRedirects(dist, data)` after a successful engine load.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveRedirectMap } from "./engine/dedupe.mjs";

export const SITE_BASE = "/ai-frontier-trends/";
const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/i;

function asRedirects(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.redirects)) return data.redirects;
  if (Array.isArray(data.redirects?.redirects)) return data.redirects.redirects;
  return [];
}

function siteBaseOf(data) {
  const raw = data?.basePath || data?.siteBase || SITE_BASE;
  const trimmed = String(raw || SITE_BASE).trim() || SITE_BASE;
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export function isSafeEventId(id) {
  return typeof id === "string" && SAFE_ID.test(id) && !id.includes("..");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** Relative href from `events/<from>/index.html` to `events/<to>/`. */
export function relativeTargetHref(to) {
  return `../${encodeURIComponent(to)}/`;
}

export function canonicalHref(to, base = SITE_BASE) {
  const root = base.endsWith("/") ? base : `${base}/`;
  return `${root}events/${encodeURIComponent(to)}/`;
}

export function redirectPageHtml({ from, to, via, base = SITE_BASE }) {
  const rel = relativeTargetHref(to);
  const canon = canonicalHref(to, base);
  const title = "事件已合并 · 前沿趋势";
  const viaAttr = via ? ` data-ft-via="${escapeHtml(via)}"` : "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<meta http-equiv="refresh" content="0; url=${escapeHtml(rel)}"/>
<link rel="canonical" href="${escapeHtml(canon)}"/>
</head>
<body>
<p data-ft-redirect="${escapeHtml(from)}" data-ft-redirect-to="${escapeHtml(to)}"${viaAttr}>本事件已合并，请看<a href="${escapeHtml(rel)}">新事件</a>。</p>
</body>
</html>
`;
}

/**
 * @param {string} dist output root (e.g. dist/)
 * @param {unknown} data engine bundle or `{ redirects }` / raw array
 * @returns {{ written: number, paths: string[], skipped: string[] }}
 */
export function writeRedirects(dist, data) {
  if (!dist) return { written: 0, paths: [], skipped: ["missing dist"] };
  const base = siteBaseOf(data);
  const rows = asRedirects(data);
  const map = resolveRedirectMap(rows);
  const viaOf = new Map(rows.map((row) => [row.from, row.via]));
  const paths = [];
  const skipped = [];

  for (const [from, to] of map) {
    if (!isSafeEventId(from) || !isSafeEventId(to)) {
      skipped.push(`${from}→${to}`);
      continue;
    }
    const html = redirectPageHtml({ from, to, via: viaOf.get(from), base });
    const file = join(dist, "events", from, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    paths.push(file);
  }

  return { written: paths.length, paths, skipped };
}
