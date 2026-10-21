/**
 * Manual avatar cache. CI / `build:public` must never run this with fetch.
 * Sources: content publications + weekly + engine-data sources / hot participants.
 * Never hotlinks; failed fetches fall back to initials at render time.
 * Do not invent placeholder files when a source fails the quality gate.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectPublications } from "./static_export.mjs";
import { listWeeklyIssues } from "./weekly.mjs";
import {
  AVATAR_CACHE_DIR,
  MAX_AVATAR_DIR_BYTES,
  MAX_AVATAR_FILE_BYTES,
  MIN_ICON_PX,
  avatarDirBytes,
  hostOf,
  loadAvatarManifest,
  sourceKey,
} from "./avatar_icons.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = AVATAR_CACHE_DIR;
const STALE_MS = 30 * 24 * 3600 * 1000;

function handleFromX(url) {
  const m = String(url).match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([^/?#]+)/i);
  if (!m) return "";
  const handle = m[1];
  if (!handle || handle === "i" || handle === "intent" || handle === "share") return "";
  return handle;
}

function defaultEngineDirs(env = process.env) {
  const dirs = [];
  const raw = env.FT_ENGINE_DIR;
  if (raw) dirs.push(isAbsolute(raw) ? raw : resolve(root, raw));
  dirs.push(resolve(root, "data/engine/v1"));
  dirs.push(resolve(root, "cache/engine-last-good"));
  dirs.push(resolve(root, "data/engine/last-good"));
  return [...new Set(dirs.filter((dir) => existsSync(dir)))];
}

function readJsonIfPresent(file) {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function asSourceRows(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.sources)) return raw.sources;
  return [];
}

function asHotParticipants(raw) {
  const rows = [];
  if (!raw || typeof raw !== "object") return rows;
  const entries = Array.isArray(raw) ? raw : raw.entries || raw.hot || [];
  for (const entry of entries) {
    for (const p of entry?.participants || []) {
      if (p && typeof p === "object") rows.push(p);
    }
  }
  return rows;
}

export function collectSources(options = {}) {
  const map = new Map();
  const add = (key, origin, kind) => {
    if (!key) return;
    const prev = map.get(key);
    if (!prev) map.set(key, { key, origin, kind });
    else if (!prev.origin && origin) prev.origin = origin;
  };

  const contentDir = options.contentDir || join(root, "content");
  for (const article of collectPublications(contentDir)) {
    const url = article.url || "";
    const x = handleFromX(url);
    if (x) add(sourceKey(x), url, "x");
    else if (url) add(sourceKey(hostOf(url) || article.sourceName), url, "site");
  }
  for (const issue of listWeeklyIssues(contentDir)) {
    const md = issue.markdownPath ? readFileSync(issue.markdownPath, "utf8") : "";
    for (const m of md.matchAll(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)/g)) {
      add(sourceKey(m[1]), m[0], "x");
    }
  }

  const nameToHome = new Map();
  const engineDirs = options.engineDirs || defaultEngineDirs(options.env || process.env);
  for (const dir of engineDirs) {
    for (const row of asSourceRows(readJsonIfPresent(join(dir, "sources.json")))) {
      if (row?.name && row?.homepage) nameToHome.set(row.name, row.homepage);
      const origin = row?.homepage || "";
      const key = sourceKey(hostOf(origin) || row?.name);
      add(key, origin, handleFromX(origin) ? "x" : "site");
    }
    for (const file of ["hot.json", "hot-strip.json"]) {
      for (const p of asHotParticipants(readJsonIfPresent(join(dir, file)))) {
        const origin = p.homepage || nameToHome.get(p.name) || "";
        const x = handleFromX(origin);
        if (x) add(sourceKey(x), origin, "x");
        else add(sourceKey(hostOf(origin) || p.name), origin, "site");
      }
    }
  }

  return [...map.values()];
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "FrontierTrendsBot/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

function attrFromTag(tag, name) {
  const quoted = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  if (quoted) return quoted[1];
  const bare = tag.match(new RegExp(`\\b${name}=([^\\s>]+)`, "i"));
  return bare ? bare[1].replace(/["']/g, "") : "";
}

function iconHrefsFromHtml(html) {
  const apple = [];
  const other = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attrFromTag(m[0], "rel");
    if (!/(?:apple-touch-icon|\bicon\b)/i.test(rel)) continue;
    const href = attrFromTag(m[0], "href");
    if (!href) continue;
    if (/apple-touch-icon/i.test(rel)) apple.push(href);
    else other.push(href);
  }
  return [...apple, ...other];
}

function isIco(buf) {
  return buf.length >= 6 && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1 && buf.readUInt16LE(4) >= 1 && buf.readUInt16LE(4) <= 64;
}

function extractIcoFrames(buf) {
  const count = buf.readUInt16LE(4);
  const frames = [];
  for (let i = 0; i < count; i += 1) {
    const o = 6 + i * 16;
    if (o + 16 > buf.length) break;
    const width = buf[o] || 256;
    const height = buf[o + 1] || 256;
    const bytesInRes = buf.readUInt32LE(o + 8);
    const imageOffset = buf.readUInt32LE(o + 12);
    if (imageOffset < 0 || bytesInRes < 16 || imageOffset + bytesInRes > buf.length) continue;
    const slice = buf.subarray(imageOffset, imageOffset + bytesInRes);
    const png = slice[0] === 0x89 && slice[1] === 0x50;
    const bitCount = slice.length >= 16 && slice.readUInt32LE(0) === 40 ? slice.readUInt16LE(14) : 0;
    frames.push({ width, height, slice, png, bitCount, score: width * height });
  }
  frames.sort((a, b) => b.score - a.score);
  return frames;
}

function dib32ToRaw(dib, width, height) {
  if (dib.length < 40 || dib.readUInt32LE(0) !== 40) return null;
  if (dib.readUInt16LE(14) !== 32) return null;
  const headerSize = dib.readUInt32LE(0);
  const rowSize = width * 4;
  if (headerSize + rowSize * height > dib.length) return null;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const srcY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const si = headerSize + srcY * rowSize + x * 4;
      const di = (y * width + x) * 4;
      rgba[di] = dib[si + 2];
      rgba[di + 1] = dib[si + 1];
      rgba[di + 2] = dib[si];
      rgba[di + 3] = dib[si + 3];
    }
  }
  return { data: rgba, width, height };
}

async function decodeForSharp(sharp, buf) {
  if (!buf || buf.length < 32) return null;
  try {
    const meta = await sharp(buf).metadata();
    if ((meta.width || 0) >= MIN_ICON_PX && (meta.height || 0) >= MIN_ICON_PX) {
      return { buf, meta };
    }
  } catch {
    /* ICO / next */
  }
  if (!isIco(buf)) return null;
  for (const frame of extractIcoFrames(buf)) {
    if (frame.width < MIN_ICON_PX || frame.height < MIN_ICON_PX) continue;
    if (frame.png) {
      try {
        const meta = await sharp(frame.slice).metadata();
        if ((meta.width || 0) >= MIN_ICON_PX && (meta.height || 0) >= MIN_ICON_PX) {
          return { buf: frame.slice, meta };
        }
      } catch {
        /* next frame */
      }
      continue;
    }
    const raw = dib32ToRaw(frame.slice, frame.width, frame.height);
    if (!raw) continue;
    try {
      const png = await sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } }).png().toBuffer();
      const meta = await sharp(png).metadata();
      if ((meta.width || 0) >= MIN_ICON_PX && (meta.height || 0) >= MIN_ICON_PX) {
        return { buf: png, meta };
      }
    } catch {
      /* next frame */
    }
  }
  return null;
}

async function firstDecodableIcon(sharp, urls) {
  const seen = new Set();
  for (const src of urls) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    try {
      const decoded = await decodeForSharp(sharp, await fetchBuffer(src));
      if (decoded) return { ...decoded, origin_url: src };
    } catch {
      /* next */
    }
  }
  return null;
}

async function iconForSite(pageUrl, sharp) {
  if (!pageUrl || !/^https?:\/\//i.test(pageUrl) || !sharp) return null;
  let html = "";
  try {
    html = new TextDecoder().decode(await fetchBuffer(pageUrl));
  } catch {
    html = "";
  }
  const abs = iconHrefsFromHtml(html).map((h) => {
    try {
      return new URL(h, pageUrl).href;
    } catch {
      return "";
    }
  });
  const fallbacks = [
    new URL("/apple-touch-icon.png", pageUrl).href,
    new URL("/apple-touch-icon-precomposed.png", pageUrl).href,
    new URL("/favicon.png", pageUrl).href,
    new URL("/favicon.ico", pageUrl).href,
  ];
  return firstDecodableIcon(sharp, [...abs, ...fallbacks]);
}

async function iconForX(handle, sharp) {
  if (!sharp) return null;
  return firstDecodableIcon(sharp, [
    `https://unavatar.io/twitter/${handle}?fallback=false`,
    `https://unavatar.io/x/${handle}?fallback=false`,
  ]);
}

async function writeWebp(sharp, buf, dest, size) {
  const qualities = [72, 60, 48, 36];
  for (const quality of qualities) {
    await sharp(buf)
      .resize(size, size, { fit: "cover" })
      .webp({ quality })
      .toFile(dest);
    if (statSync(dest).size <= MAX_AVATAR_FILE_BYTES) return;
  }
  unlinkSync(dest);
  throw new Error(`webp ${size}px exceeds ${MAX_AVATAR_FILE_BYTES} bytes`);
}

export async function runAvatars(options = {}) {
  let fetchRemote = options.fetchRemote ?? true;
  if (process.env.PUBLIC_DEPLOY === "1" && fetchRemote) {
    console.warn("avatars: refusing remote fetch during PUBLIC_DEPLOY / build:public");
    fetchRemote = false;
  }
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, "manifest.json");
  const manifest = options.manifest || loadAvatarManifest(outDir);
  const sources = options.sources || collectSources(options);
  let sharp = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("sharp unavailable; writing manifest only");
  }

  const skipped = [];
  const cached = [];

  for (const src of sources) {
    const prev = manifest[src.key];
    const age = prev?.fetched_at ? Date.now() - Date.parse(prev.fetched_at) : Infinity;
    if (prev?.file32 && age < STALE_MS) {
      cached.push(src.key);
      continue;
    }
    if (!fetchRemote) continue;
    try {
      const got = src.kind === "x" ? await iconForX(src.key, sharp) : await iconForSite(src.origin, sharp);
      if (!got || !sharp) {
        skipped.push({ key: src.key, reason: !got ? "download fail" : "sharp unavailable" });
        if (prev?.file32) manifest[src.key] = prev;
        else delete manifest[src.key];
        continue;
      }
      const width = Number(got.meta?.width) || 0;
      const height = Number(got.meta?.height) || 0;
      if (width < MIN_ICON_PX || height < MIN_ICON_PX) {
        skipped.push({ key: src.key, reason: `<${MIN_ICON_PX}px (${width}x${height})` });
        if (prev?.file32) manifest[src.key] = prev;
        else delete manifest[src.key];
        continue;
      }
      const file32 = `${src.key}-32.webp`;
      const file64 = `${src.key}-64.webp`;
      const nextBytes = avatarDirBytes(outDir) + MAX_AVATAR_FILE_BYTES * 2;
      if (nextBytes > MAX_AVATAR_DIR_BYTES) {
        skipped.push({ key: src.key, reason: `avatars dir would exceed ${MAX_AVATAR_DIR_BYTES} bytes` });
        if (prev?.file32) manifest[src.key] = prev;
        continue;
      }
      await writeWebp(sharp, got.buf, join(outDir, file32), 32);
      await writeWebp(sharp, got.buf, join(outDir, file64), 64);
      manifest[src.key] = {
        file32,
        file64,
        origin_url: got.origin_url,
        fetched_at: new Date().toISOString(),
        sha256: createHash("sha256").update(got.buf).digest("hex"),
        width: 32,
        height: 32,
        source_width: width,
        source_height: height,
      };
      cached.push(src.key);
      console.log("cached", src.key, `${width}x${height}`);
    } catch (err) {
      console.warn("skip", src.key, err.message);
      skipped.push({ key: src.key, reason: err.message });
      if (prev?.file32) manifest[src.key] = prev;
      else delete manifest[src.key];
    }
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const dirBytes = avatarDirBytes(outDir);
  console.log(`avatars: ${cached.length} cached, ${skipped.length} skipped, dir ${dirBytes} bytes`);
  for (const row of skipped) console.log("  skip", row.key, row.reason);
  return { manifest, cached, skipped, dirBytes };
}

export { sourceKey, hostOf, collectSources as collectAvatarSources };

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  await runAvatars({ fetchRemote: !process.argv.includes("--offline") });
}
