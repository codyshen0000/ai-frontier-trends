/**
 * Offline avatar cache helpers. Build / publicize / CI must only copy and look up
 * committed files — never fetch. Missing keys stay empty (letter fallback).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const AVATAR_CACHE_DIR = join(root, "cache", "avatars");
export const AVATAR_ASSET_PREFIX = "assets/avatars";
export const MAX_AVATAR_FILE_BYTES = 3 * 1024;
export const MAX_AVATAR_DIR_BYTES = 400 * 1024;
export const MIN_ICON_PX = 16;

export function sourceKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/\./g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function loadAvatarManifest(dir = AVATAR_CACHE_DIR) {
  const file = join(dir, "manifest.json");
  if (!existsSync(file)) return {};
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

export function indexSourcesForAvatars(sources = []) {
  const byName = new Map();
  for (const row of sources) {
    if (row?.name) byName.set(row.name, row);
  }
  return byName;
}

export function candidateKeys(ref = {}, byName) {
  const row = (ref.name && byName?.get(ref.name)) || {};
  const home = ref.homepage || row.homepage || ref.sourceUrl || "";
  const keys = [];
  const host = hostOf(home);
  if (host) keys.push(sourceKey(host));
  if (ref.name) keys.push(sourceKey(ref.name));
  const sourceId = ref.sourceId || row.sourceId;
  if (sourceId) keys.push(sourceKey(sourceId));
  return [...new Set(keys.filter(Boolean))];
}

function sameOriginAsset(path) {
  const text = String(path || "").trim();
  if (!text || /^https?:\/\//i.test(text) || /^\/\//.test(text) || text.includes("://")) return "";
  return text;
}

/**
 * Same-origin icon paths only when manifest has file32 and the file is on disk.
 * Otherwise null → SourceAvatar letter fallback. Never invents a default image.
 */
export function publicIconFor(ref = {}, options = {}) {
  const cacheDir = options.cacheDir || AVATAR_CACHE_DIR;
  const manifest = options.manifest || loadAvatarManifest(cacheDir);
  const byName = options.byName || indexSourcesForAvatars(options.sources || []);
  for (const key of candidateKeys(ref, byName)) {
    const row = manifest[key];
    if (!row?.file32) continue;
    const file32 = join(cacheDir, row.file32);
    if (!existsSync(file32)) continue;
    const iconUrl = sameOriginAsset(`${AVATAR_ASSET_PREFIX}/${row.file32}`);
    if (!iconUrl) continue;
    const parts = [`${AVATAR_ASSET_PREFIX}/${row.file32} 32w`];
    if (row.file64 && existsSync(join(cacheDir, row.file64))) {
      parts.push(`${AVATAR_ASSET_PREFIX}/${row.file64} 64w`);
    }
    const iconSrcSet = sameOriginAsset(parts.join(", ")) ? parts.join(", ") : undefined;
    return {
      key,
      iconUrl,
      iconSrcSet,
      width: row.width || 32,
      height: row.height || 32,
    };
  }
  return null;
}

export function avatarDirBytes(dir = AVATAR_CACHE_DIR) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".webp")) continue;
    total += statSync(join(dir, name)).size;
  }
  return total;
}

/** Copy committed cache → `<dest>/assets/avatars/`. No fetch. */
export function copyAvatarCache(destRoot, cacheDir = AVATAR_CACHE_DIR) {
  const dest = join(destRoot, "assets", "avatars");
  if (!existsSync(cacheDir)) return { count: 0, dest };
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const name of readdirSync(cacheDir)) {
    const from = join(cacheDir, name);
    if (statSync(from).isDirectory()) continue;
    if (name === "manifest.json" || name.endsWith(".webp")) {
      cpSync(from, join(dest, name));
      if (name.endsWith(".webp")) count += 1;
    }
  }
  return { count, dest };
}
