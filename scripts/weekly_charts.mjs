/** Convert weekly chart PNGs to WebP and rewrite base64 embeds to <picture>. */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

export function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

export async function convertWeeklyCharts(chartsDir) {
  if (!chartsDir || !existsSync(chartsDir)) return [];
  const pngs = readdirSync(chartsDir).filter((name) => name.endsWith(".png")).sort();
  const index = [];
  for (const pngName of pngs) {
    const pngPath = join(chartsDir, pngName);
    const png = readFileSync(pngPath);
    const webpName = pngName.replace(/\.png$/i, ".webp");
    const webpPath = join(chartsDir, webpName);
    const meta = await sharp(png).metadata();
    const webpBuf = existsSync(webpPath)
      ? readFileSync(webpPath)
      : await sharp(png).webp({ quality: 88, effort: 6 }).toBuffer();
    if (!existsSync(webpPath)) writeFileSync(webpPath, webpBuf);
    index.push({
      pngName,
      webpName,
      png,
      webp: webpBuf,
      width: meta.width,
      height: meta.height,
      shaPng: sha256(png),
      shaWebp: sha256(webpBuf),
      bytesPng: png.length,
      bytesWebp: webpBuf.length,
    });
  }
  return index;
}

export function pictureForChart(alt, chart, { eager = false } = {}) {
  const loading = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture><source type="image/webp" srcset="charts/${chart.webpName}"><img alt="${alt}" title="${alt}" src="charts/${chart.pngName}" width="${chart.width}" height="${chart.height}" ${loading}></picture>`;
}

export function rewriteWeeklyChartEmbeds(html, charts) {
  if (!charts.length) return html;
  let n = 0;
  const next = String(html).replace(/<img\s+alt="([^"]+)"\s+src="data:image\/png;base64,([^"]+)"\s*\/?>/g, (full, alt, b64) => {
    const buf = Buffer.from(b64, "base64");
    const hit = charts.find((chart) => chart.png.equals(buf));
    if (!hit) {
      throw new Error(`weekly chart embed alt="${alt}" has no matching PNG in charts/`);
    }
    return pictureForChart(alt, hit, { eager: n++ === 0 });
  });
  return next;
}

export function embedWeeklyChartsAsDataUri(html, charts) {
  let out = String(html);
  for (const chart of charts) {
    const uri = `data:image/webp;base64,${chart.webp.toString("base64")}`;
    out = out.replaceAll(`srcset="charts/${chart.webpName}"`, `srcset="${uri}"`);
    out = out.replaceAll(`src="charts/${chart.pngName}"`, `src="${uri}"`);
  }
  return out;
}

function parseSrcsetUrls(value) {
  const raw = String(value).trim();
  if (/^data:/i.test(raw)) {
    return [raw.replace(/\s+(?:\d+(?:\.\d+)?x|\d+w)\s*$/i, "").trim()].filter(Boolean);
  }
  return raw
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

export function collectReportImageSrcs(html) {
  const urls = [];
  for (const tag of String(html).matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    for (const attr of tag[0].matchAll(/\b(?:src|srcset|imagesrcset)=["']([^"']+)["']/gi)) {
      urls.push(...parseSrcsetUrls(attr[1]));
    }
  }
  return urls;
}

export function assertStandaloneReportCharts(html, charts = []) {
  const urls = collectReportImageSrcs(html);
  if (!urls.length) throw new Error("report.html has no chart images");
  for (const url of urls) {
    if (!url.startsWith("data:image/webp;base64,")) {
      throw new Error(`report.html has external image src «${url.slice(0, 96)}»`);
    }
  }
  for (const chart of charts) {
    const uri = `data:image/webp;base64,${chart.webp.toString("base64")}`;
    if (!String(html).includes(`srcset="${uri}"`) || !String(html).includes(`src="${uri}"`)) {
      throw new Error(`report.html missing WebP data URI for ${chart.webpName || chart.pngName}`);
    }
  }
}

export function assertWeeklyChartPictures(html, charts) {
  for (const chart of charts) {
    if (!html.includes(`srcset="charts/${chart.webpName}"`)) {
      throw new Error(`missing webp source ${chart.webpName}`);
    }
    if (!html.includes(`src="charts/${chart.pngName}"`)) {
      throw new Error(`missing png fallback ${chart.pngName}`);
    }
  }
  if (html.includes("data:image/png;base64")) {
    throw new Error("weekly HTML still embeds PNG data URIs");
  }
}
