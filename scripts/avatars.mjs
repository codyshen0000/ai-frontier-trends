/**
 * Manual avatar cache. CI / `build:public` must never run this.
 * Sources: existing publications (including X authors already in the data).
 * Never hotlinks; failed fetches fall back to initials at render time.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectPublications } from "./static_export.mjs";
import { listWeeklyIssues } from "./weekly.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "cache", "avatars");
const STALE_MS = 30 * 24 * 3600 * 1000;

function sourceKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function handleFromX(url) {
  const m = String(url).match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([^/?#]+)/i);
  if (!m) return "";
  const handle = m[1];
  if (!handle || handle === "i" || handle === "intent" || handle === "share") return "";
  return handle;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function collectSources() {
  const map = new Map();
  const add = (key, origin, kind) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, { key, origin, kind });
  };
  for (const article of collectPublications(join(root, "content"))) {
    const url = article.url || "";
    const x = handleFromX(url);
    if (x) add(sourceKey(x), url, "x");
    else if (url) add(sourceKey(hostOf(url) || article.sourceName), url, "site");
  }
  for (const issue of listWeeklyIssues(join(root, "content"))) {
    const md = issue.markdownPath ? readFileSync(issue.markdownPath, "utf8") : "";
    for (const m of md.matchAll(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)/g)) {
      add(sourceKey(m[1]), m[0], "x");
    }
  }
  return [...map.values()];
}

async function fetchBuffer(url) {
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "FrontierTrendsBot/1.0" } });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

async function iconForSite(pageUrl) {
  const html = new TextDecoder().decode(await fetchBuffer(pageUrl));
  const hrefs = [...html.matchAll(/<link[^>]+rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]*>/gi)]
    .map((m) => {
      const href = m[0].match(/href=["']([^"']+)["']/i);
      return href ? href[1] : "";
    })
    .filter(Boolean);
  const abs = hrefs.map((h) => new URL(h, pageUrl).href);
  const candidates = [...abs, new URL("/apple-touch-icon.png", pageUrl).href, new URL("/favicon.ico", pageUrl).href];
  for (const src of candidates) {
    try {
      const buf = await fetchBuffer(src);
      if (buf.length >= 32) return { buf, origin_url: src };
    } catch {
      /* next */
    }
  }
  return null;
}

async function iconForX(handle) {
  const tries = [
    `https://unavatar.io/twitter/${handle}?fallback=false`,
    `https://unavatar.io/x/${handle}?fallback=false`,
  ];
  for (const src of tries) {
    try {
      const buf = await fetchBuffer(src);
      if (buf.length >= 32) return { buf, origin_url: src };
    } catch {
      /* next */
    }
  }
  return null;
}

async function writeWebp(sharp, buf, dest, size) {
  await sharp(buf)
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 72 })
    .toFile(dest);
}

export async function runAvatars({ fetchRemote = true } = {}) {
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, "manifest.json");
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
  const sources = collectSources();
  let sharp = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("sharp unavailable; writing manifest only");
  }

  for (const src of sources) {
    const prev = manifest[src.key];
    const age = prev?.fetched_at ? Date.now() - Date.parse(prev.fetched_at) : Infinity;
    if (prev?.file32 && age < STALE_MS) continue;
    if (!fetchRemote) continue;
    try {
      const got = src.kind === "x" ? await iconForX(src.key) : await iconForSite(src.origin);
      if (!got || !sharp) {
        manifest[src.key] = prev || { file32: null, file64: null, origin_url: src.origin, fetched_at: new Date().toISOString(), sha256: null };
        continue;
      }
      const file32 = `${src.key}-32.webp`;
      const file64 = `${src.key}-64.webp`;
      await writeWebp(sharp, got.buf, join(outDir, file32), 32);
      await writeWebp(sharp, got.buf, join(outDir, file64), 64);
      manifest[src.key] = {
        file32,
        file64,
        origin_url: got.origin_url,
        fetched_at: new Date().toISOString(),
        sha256: createHash("sha256").update(got.buf).digest("hex"),
      };
      console.log("cached", src.key);
    } catch (err) {
      console.warn("skip", src.key, err.message);
      if (prev) manifest[src.key] = prev;
    }
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  await runAvatars({ fetchRemote: !process.argv.includes("--offline") });
}
