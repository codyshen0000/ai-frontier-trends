import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HEAT_METHOD_COPY, formatHeat, heatMatches, sparkMatches } from "../engine/heat-copy.mjs";

export const id = "b1-heat";
export const owner = "B1";

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function pageFile(distDir, rel) {
  const nested = join(distDir, rel, "index.html");
  if (existsSync(nested)) return nested;
  const flat = join(distDir, rel === "." ? "index.html" : `${rel}.html`);
  return existsSync(flat) ? flat : null;
}

function attrForStory(html, publicId, attr) {
  const id = publicId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `data-ft-story="${id}"[^>]*${attr}="([^"]+)"|${attr}="([^"]+)"[^>]*data-ft-story="${id}"`,
  );
  const match = html.match(re);
  if (!match) return null;
  return match[1] ?? match[2];
}

function heatFromHtml(html, publicId) {
  const raw = attrForStory(html, publicId, "data-ft-heat");
  return raw == null ? null : Number(raw);
}

function trendFromHtml(html, publicId) {
  const raw = attrForStory(html, publicId, "data-ft-trend-pct");
  return raw == null ? null : Number(raw);
}

function sparkFromHtml(html, publicId) {
  const raw = attrForStory(html, publicId, "data-ft-spark");
  if (raw == null) return null;
  try {
    return JSON.parse(raw.replace(/&quot;/g, '"'));
  } catch {
    return null;
  }
}

function isHotRankingPage(file) {
  const norm = String(file).replaceAll("\\", "/");
  return /\/hot(?:\/|\.html$)/.test(norm) || /(?:^|\/)hot\.html$/.test(norm);
}

export async function verify(ctx) {
  const engineDir = ctx.engineDir;
  const hotFile = engineDir && join(engineDir, "hot.json");
  if (!hotFile || !existsSync(hotFile)) {
    return { ok: true, message: "no FT_ENGINE_DIR hot.json; skipped" };
  }
  const engineHot = readJson(hotFile);
  const entries = engineHot.entries || [];
  if (!entries.length) return { ok: true, message: "engine hot.json has 0 entries" };

  const distDir = ctx.distDir;
  const publicHotPath = join(distDir, "api", "v1", "hot.json");
  const hotHtml = pageFile(distDir, "hot");
  if (!existsSync(publicHotPath) && !hotHtml) {
    return { ok: true, message: "dist has no public hot artifacts yet; skipped" };
  }
  if (!existsSync(publicHotPath)) {
    return { ok: false, message: "engine has hot.json but dist is missing api/v1/hot.json" };
  }
  const publicHot = readJson(publicHotPath);
  const byId = new Map((publicHot.entries || []).map((row) => [row.story?.publicId, row]));

  for (const entry of entries) {
    const id = entry.story?.publicId;
    const pub = byId.get(id);
    if (!pub) return { ok: false, message: `public hot.json missing ${id}` };
    if (!heatMatches(pub.heat, entry.heat)) {
      return { ok: false, message: `heat rescaled for ${id}: engine ${entry.heat} vs public ${pub.heat}` };
    }
    if (entry.trendPct != null && !heatMatches(pub.trendPct, entry.trendPct)) {
      return { ok: false, message: `trendPct rescaled for ${id}: engine ${entry.trendPct} vs public ${pub.trendPct}` };
    }
    if (Array.isArray(entry.spark) && entry.spark.filter((v) => v != null).length >= 2) {
      if (!sparkMatches(pub.spark, entry.spark)) {
        return { ok: false, message: `spark does not match engine for ${id}` };
      }
    }
  }

  const previewDir = ctx.previewDir;
  const pages = [
    pageFile(distDir, "hot"),
    pageFile(distDir, "."),
    pageFile(distDir, "more"),
    previewDir && existsSync(join(previewDir, "hot.html")) ? join(previewDir, "hot.html") : null,
    previewDir && existsSync(join(previewDir, "index.html")) ? join(previewDir, "index.html") : null,
    previewDir && existsSync(join(previewDir, "more.html")) ? join(previewDir, "more.html") : null,
  ].filter(Boolean);

  for (const file of pages) {
    const html = readFileSync(file, "utf8");
    if (/实时/.test(html)) return { ok: false, message: `${file} still contains 实时` };
    if (/引擎已\s*1:1/.test(html)) return { ok: false, message: `${file} claims 引擎已 1:1` };
    if ((file.includes("hot") || file.includes("more")) && !html.includes(HEAT_METHOD_COPY)) {
      return { ok: false, message: `${file} is missing HEAT_METHOD_COPY` };
    }
    for (const entry of entries) {
      const id = entry.story?.publicId;
      if (!html.includes(id) && !html.includes(entry.story?.title || "")) continue;
      const shown = heatFromHtml(html, id);
      if (shown == null) {
        // Home/feed can mention a listed story without a heat chip (only the
        // strip paints data-ft-heat). Require a chip on the ranking page.
        if (isHotRankingPage(file)) {
          return { ok: false, message: `${file} missing data-ft-heat for ${id}` };
        }
        continue;
      }
      if (!heatMatches(shown, entry.heat)) {
        const label = formatHeat(entry.heat);
        if (!label || !html.includes(label)) {
          return { ok: false, message: `${file} heat for ${id} is ${shown}, engine ${entry.heat}` };
        }
        if (!heatMatches(Number(label), entry.heat)) {
          return { ok: false, message: `${file} displayed heat ${label} for ${id} vs engine ${entry.heat}` };
        }
      }
      if (entry.trendPct != null && file.includes("hot")) {
        const pct = trendFromHtml(html, id);
        if (pct != null && !heatMatches(pct, entry.trendPct)) {
          return { ok: false, message: `${file} trendPct for ${id} is ${pct}, engine ${entry.trendPct}` };
        }
      }
      if (Array.isArray(entry.spark) && entry.spark.filter((v) => v != null).length >= 2 && file.includes("hot")) {
        const spark = sparkFromHtml(html, id);
        if (spark && !sparkMatches(spark, entry.spark)) {
          return { ok: false, message: `${file} spark for ${id} does not match engine` };
        }
      }
    }
  }
  return { ok: true };
}
