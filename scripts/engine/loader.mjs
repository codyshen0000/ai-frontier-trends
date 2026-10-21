/**
 * Read site-data 1.1 JSON from FT_ENGINE_DIR (default `data/engine/v1`).
 * Validates against scripts/engine/site-data.ts. On invalid data throws
 * EngineDataError so the build can fall back to the last good export.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const DEFAULT_ENGINE_DIR = "data/engine/v1";

export const COVER_VALUE_CLASSES = new Set([
  "model_sample",
  "paper_figure",
  "product_screenshot",
  "official_diagram",
  "official_explainer",
]);

/** PRD official_diagram ≡ contract §3.3 official_explainer. */
export function isOfficialDiagramClass(value) {
  return value === "official_diagram" || value === "official_explainer";
}

export function isAcceptedCoverClass(value) {
  return COVER_VALUE_CLASSES.has(value);
}

/**
 * Contract 1.1 propertyNames blacklist:
 * /[Ss][Cc][Oo][Rr][Ee]|(^|_)gate|Gate|(^|_)attention|Attention/
 */
export const FORBIDDEN_KEY_RE = /[Ss][Cc][Oo][Rr][Ee]|(^|_)gate|Gate|(^|_)attention|Attention/;

const INTERNAL_KEYS = new Set([
  "body_text",
  "summary_raw",
  "gate_a",
  "prefilter",
  "evidence_grade",
  "composite",
  "rubric_version",
  "attention_scores",
  "recommend_reason",
  "claim_label",
  "chosen_by",
  "source_item_id",
  "source_page",
  "first_hand",
  "focus_slot",
  "heat48h",
  "import_log",
  "notes",
  "input_sha256",
  "raw",
]);

export class EngineDataError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, path?: string, cause?: unknown }} [details]
   */
  constructor(message, details = {}) {
    super(message, details.cause !== undefined ? { cause: details.cause } : undefined);
    this.name = "EngineDataError";
    this.code = details.code || "INVALID_ENGINE_DATA";
    this.path = details.path;
  }
}

export function resolveEngineDir(env = process.env) {
  const raw = env.FT_ENGINE_DIR || DEFAULT_ENGINE_DIR;
  return isAbsolute(raw) ? raw : resolve(REPO_ROOT, raw);
}

function throwInvalid(message, path, code = "INVALID_ENGINE_DATA") {
  throw new EngineDataError(message, { code, path });
}

function readJsonFile(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (cause) {
    throw new EngineDataError(`cannot read ${file}`, { code: "READ_FAILED", path: file, cause });
  }
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new EngineDataError(`invalid JSON: ${file}`, { code: "INVALID_JSON", path: file, cause });
  }
}

function readOptionalJson(file) {
  if (!existsSync(file)) return undefined;
  if (!statSync(file).isFile()) throwInvalid(`not a file: ${file}`, file, "NOT_A_FILE");
  return readJsonFile(file);
}

function assertObject(value, path, label = "value") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throwInvalid(`${label} must be an object`, path, "INVALID_SHAPE");
  }
}

function assertArray(value, path, label = "value") {
  if (!Array.isArray(value)) throwInvalid(`${label} must be an array`, path, "INVALID_SHAPE");
}

function walkForbiddenKeys(value, path, seen = new Set()) {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, i) => walkForbiddenKeys(entry, `${path}[${i}]`, seen));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEY_RE.test(key) || INTERNAL_KEYS.has(key)) {
      throwInvalid(`forbidden key ${JSON.stringify(key)} at ${path}`, path, "FORBIDDEN_KEY");
    }
    walkForbiddenKeys(child, `${path}.${key}`, seen);
  }
}

function coverClassOf(cover) {
  if (!cover || typeof cover !== "object") return undefined;
  return cover.valueClass ?? cover.value_class ?? cover.value_category;
}

function assertCover(cover, path) {
  if (cover == null) return;
  assertObject(cover, path, "cover");
  if (!cover.url || typeof cover.url !== "string") throwInvalid("cover.url required", path, "INVALID_COVER");
  if (typeof cover.alt !== "string" || !cover.alt.trim()) {
    throwInvalid("cover.alt required", path, "INVALID_COVER");
  }
  const klass = coverClassOf(cover);
  if (klass != null && !isAcceptedCoverClass(klass)) {
    throwInvalid(`cover class ${JSON.stringify(klass)} is not accepted`, path, "INVALID_COVER_CLASS");
  }
  if (cover.height != null && Number(cover.height) < 240) {
    throwInvalid("cover.height < 240 must not be exported", path, "INVALID_COVER");
  }
}

function walkCovers(value, path, seen = new Set()) {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, i) => walkCovers(entry, `${path}[${i}]`, seen));
    return;
  }
  if ("cover" in value) assertCover(value.cover, `${path}.cover`);
  for (const [key, child] of Object.entries(value)) {
    if (key === "cover") continue;
    walkCovers(child, `${path}.${key}`, seen);
  }
}

function validateMeta(meta, path) {
  assertObject(meta, path, "meta.json");
  if (typeof meta.data_as_of !== "string" || !meta.data_as_of.trim()) {
    throwInvalid("meta.data_as_of required", path, "INVALID_META");
  }
  const built = meta.built_at || meta.generated_at;
  if (typeof built !== "string" || !built.trim()) {
    throwInvalid("meta.built_at or meta.generated_at required", path, "INVALID_META");
  }
}

function validateHot(hot, path) {
  assertObject(hot, path, "hot.json");
  if (hot.computedAt != null && typeof hot.computedAt !== "string") {
    throwInvalid("hot.computedAt must be string|null", path, "INVALID_HOT");
  }
  if (typeof hot.windowHours !== "number") throwInvalid("hot.windowHours required", path, "INVALID_HOT");
  assertArray(hot.entries, path, "hot.entries");
  for (const [i, entry] of hot.entries.entries()) {
    const p = `${path}.entries[${i}]`;
    assertObject(entry, p, "hot entry");
    if (typeof entry.rank !== "number") throwInvalid("rank required", p, "INVALID_HOT");
    assertObject(entry.story, `${p}.story`, "story");
    if (typeof entry.story.publicId !== "string" || typeof entry.story.title !== "string") {
      throwInvalid("story.publicId and story.title required", p, "INVALID_HOT");
    }
    if (typeof entry.heat !== "number") throwInvalid("heat required", p, "INVALID_HOT");
    if (typeof entry.sourceCount !== "number") throwInvalid("sourceCount required", p, "INVALID_HOT");
    assertArray(entry.sourceNames || [], `${p}.sourceNames`, "sourceNames");
    assertArray(entry.participants || [], `${p}.participants`, "participants");
    assertArray(entry.spark || [], `${p}.spark`, "spark");
  }
}

function validateDaily(daily, path) {
  assertObject(daily, path, "daily.json");
  if (daily.kind != null && daily.kind !== "daily") throwInvalid("daily.kind must be \"daily\"", path, "INVALID_DAILY");
  if (typeof daily.key !== "string" || typeof daily.title !== "string") {
    throwInvalid("daily.key and daily.title required", path, "INVALID_DAILY");
  }
}

function validateEvent(event, path) {
  assertObject(event, path, "event");
  const publicId = event.publicId || event.event_id;
  if (typeof publicId !== "string" || !publicId) throwInvalid("publicId required", path, "INVALID_EVENT");
  if (typeof event.title !== "string") throwInvalid("title required", path, "INVALID_EVENT");
  if (event.status != null && !["active", "watching", "settled"].includes(event.status)) {
    throwInvalid(`invalid status ${JSON.stringify(event.status)}`, path, "INVALID_EVENT");
  }
}

function validateRedirects(value, path) {
  const list = Array.isArray(value) ? value : value?.redirects;
  if (!Array.isArray(list)) throwInvalid("redirects.json must be an array or { redirects: [] }", path, "INVALID_REDIRECTS");
  for (const [i, row] of list.entries()) {
    assertObject(row, `${path}[${i}]`, "redirect");
    if (typeof row.from !== "string" || typeof row.to !== "string") {
      throwInvalid("redirect.from and redirect.to required", `${path}[${i}]`, "INVALID_REDIRECTS");
    }
  }
  return list;
}

function validateFeed(feed, path) {
  assertObject(feed, path, "feed/selected.json");
  if (feed.feed) assertObject(feed.feed, `${path}.feed`, "feed");
  assertArray(feed.items || [], `${path}.items`, "feed.items");
  return feed.items || [];
}

function listJsonFiles(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(dir, name));
}

function asRedirects(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : value.redirects || [];
}

function asSources(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.sources)) return value.sources;
  return [];
}

function asDailyIndex(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.items)) return value.items;
  return [];
}

function asEventsIndex(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((row) => (typeof row === "string" ? { publicId: row } : row));
  }
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.events)) return value.events;
  if (Array.isArray(value.publicIds)) return value.publicIds.map((publicId) => ({ publicId }));
  return [];
}

/**
 * @param {{ dir?: string, env?: NodeJS.ProcessEnv }} [options]
 * @returns {import("./site-data.ts").EngineBundle}
 */
export function loadEngineData(options = {}) {
  const dir = options.dir || resolveEngineDir(options.env || process.env);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new EngineDataError(`engine dir missing: ${dir}`, { code: "MISSING_DIR", path: dir });
  }

  const metaPath = join(dir, "meta.json");
  if (!existsSync(metaPath)) {
    throw new EngineDataError(`meta.json missing in ${dir}`, { code: "MISSING_META", path: metaPath });
  }

  const meta = readJsonFile(metaPath);
  walkForbiddenKeys(meta, "meta.json");
  validateMeta(meta, "meta.json");

  const hotPath = join(dir, "hot.json");
  const hotRaw = readOptionalJson(hotPath);
  let hot = { computedAt: null, windowHours: 48, entries: [] };
  if (hotRaw !== undefined) {
    walkForbiddenKeys(hotRaw, "hot.json");
    walkCovers(hotRaw, "hot.json");
    validateHot(hotRaw, "hot.json");
    hot = hotRaw;
  }

  const stripRaw = readOptionalJson(join(dir, "hot-strip.json"));
  let hotStrip = [];
  if (stripRaw !== undefined) {
    walkForbiddenKeys(stripRaw, "hot-strip.json");
    const rows = Array.isArray(stripRaw) ? stripRaw : stripRaw.entries || [];
    assertArray(rows, "hot-strip.json", "hot-strip");
    hotStrip = rows;
  } else {
    hotStrip = (hot.entries || []).slice(0, 5).map((entry) => ({
      rank: entry.rank,
      title: entry.story.title,
      heat: entry.heat,
      trend: entry.trend,
      storyPublicId: entry.story.publicId,
      itemId: entry.story.publicId,
      participants: entry.participants || [],
      participantCount: entry.participantCount,
    }));
  }

  const dailyRaw = readOptionalJson(join(dir, "daily.json"));
  let daily = null;
  if (dailyRaw !== undefined) {
    walkForbiddenKeys(dailyRaw, "daily.json");
    walkCovers(dailyRaw, "daily.json");
    validateDaily(dailyRaw, "daily.json");
    daily = { kind: "daily", ...dailyRaw, kind: "daily" };
  }

  const dailyIndexRaw = readOptionalJson(join(dir, "daily-index.json"));
  if (dailyIndexRaw !== undefined) walkForbiddenKeys(dailyIndexRaw, "daily-index.json");
  const dailyIndex = asDailyIndex(dailyIndexRaw);
  if (daily && !dailyIndex.some((row) => row.key === daily.key)) {
    dailyIndex.unshift({ key: daily.key, issueNumber: daily.issueNumber, title: daily.title });
  }

  const dailies = [];
  if (daily) dailies.push(daily);
  const dailyDir = join(dir, "daily");
  for (const file of listJsonFiles(dailyDir)) {
    const raw = readJsonFile(file);
    const rel = `daily/${file.slice(dailyDir.length + 1)}`;
    walkForbiddenKeys(raw, rel);
    walkCovers(raw, rel);
    validateDaily(raw, rel);
    if (!dailies.some((row) => row.key === raw.key)) dailies.push({ kind: "daily", ...raw, kind: "daily" });
  }

  const redirectsRaw = readOptionalJson(join(dir, "redirects.json"));
  if (redirectsRaw !== undefined) {
    walkForbiddenKeys(redirectsRaw, "redirects.json");
    validateRedirects(redirectsRaw, "redirects.json");
  }
  const redirects = asRedirects(redirectsRaw);

  const sourcesRaw = readOptionalJson(join(dir, "sources.json"));
  if (sourcesRaw !== undefined) walkForbiddenKeys(sourcesRaw, "sources.json");
  const sources = asSources(sourcesRaw);

  const feedRaw = readOptionalJson(join(dir, "feed", "selected.json"));
  let feed = null;
  let feedItems = [];
  if (feedRaw !== undefined) {
    walkForbiddenKeys(feedRaw, "feed/selected.json");
    feedItems = validateFeed(feedRaw, "feed/selected.json");
    feed = feedRaw;
  }

  const searchRaw = readOptionalJson(join(dir, "search", "source.json"));
  if (searchRaw !== undefined) walkForbiddenKeys(searchRaw, "search/source.json");

  const eventsIndexRaw = readOptionalJson(join(dir, "events", "index.json"));
  if (eventsIndexRaw !== undefined) walkForbiddenKeys(eventsIndexRaw, "events/index.json");
  const eventsIndex = asEventsIndex(eventsIndexRaw);

  const events = [];
  const seenEvent = new Set();
  const eventFiles = listJsonFiles(join(dir, "events")).filter((file) => !file.endsWith("index.json"));
  const wanted = new Set(eventsIndex.map((row) => row.publicId).filter(Boolean));
  for (const file of eventFiles) {
    const rel = `events/${file.split("/").pop()}`;
    const raw = readJsonFile(file);
    walkForbiddenKeys(raw, rel);
    walkCovers(raw, rel);
    validateEvent(raw, rel);
    const publicId = raw.publicId || raw.event_id;
    if (!raw.publicId && raw.event_id) raw.publicId = raw.event_id;
    if (wanted.size && !wanted.has(publicId)) continue;
    if (seenEvent.has(publicId)) continue;
    seenEvent.add(publicId);
    events.push(raw);
  }

  const timelineIndexRaw = readOptionalJson(join(dir, "timeline", "index.json"));
  if (timelineIndexRaw !== undefined) walkForbiddenKeys(timelineIndexRaw, "timeline/index.json");
  const page1Raw = readOptionalJson(join(dir, "timeline", "page-1.json"));
  let timeline = null;
  if (page1Raw !== undefined) {
    walkForbiddenKeys(page1Raw, "timeline/page-1.json");
    walkCovers(page1Raw, "timeline/page-1.json");
    assertObject(page1Raw, "timeline/page-1.json", "timeline page");
    assertArray(page1Raw.cards || [], "timeline/page-1.json.cards", "cards");
    for (const [i, card] of (page1Raw.cards || []).entries()) {
      const p = `timeline/page-1.json.cards[${i}]`;
      assertObject(card, p, "card");
      assertObject(card.item, `${p}.item`, "card.item");
      if (typeof card.item.id !== "string" || typeof card.item.title !== "string") {
        throwInvalid("card.item.id and card.item.title required", p, "INVALID_FEED_ITEM");
      }
    }
    timeline = {
      filters: page1Raw.filters || { channel: "all", category: null, tag: null },
      cards: page1Raw.cards || [],
      nextCursor: page1Raw.nextCursor ?? null,
      hot: page1Raw.hot ?? hotStrip,
      dayCounts: page1Raw.dayCounts || page1Raw.day_counts || {},
      page: page1Raw.page,
      pageCount: page1Raw.pageCount,
      total: page1Raw.total,
    };
  }

  for (const file of listJsonFiles(join(dir, "hot-snapshots"))) {
    const rel = `hot-snapshots/${file.split("/").pop()}`;
    const raw = readJsonFile(file);
    walkForbiddenKeys(raw, rel);
    walkCovers(raw, rel);
  }

  const itemsRaw = readOptionalJson(join(dir, "items.json"));
  if (itemsRaw !== undefined) walkForbiddenKeys(itemsRaw, "items.json");
  let items = [];
  if (Array.isArray(itemsRaw)) items = itemsRaw;
  else if (Array.isArray(itemsRaw?.items)) items = itemsRaw.items;
  const itemsDir = join(dir, "items");
  if (existsSync(itemsDir) && statSync(itemsDir).isDirectory()) {
    const seenItem = new Set(items.map((row) => row?.id).filter(Boolean));
    for (const file of listJsonFiles(itemsDir)) {
      const rel = `items/${file.split("/").pop()}`;
      const raw = readJsonFile(file);
      walkForbiddenKeys(raw, rel);
      if (!raw?.id || seenItem.has(raw.id)) continue;
      seenItem.add(raw.id);
      items.push(raw);
    }
  }

  const topicsRaw = readOptionalJson(join(dir, "topics.json"));
  if (topicsRaw !== undefined) walkForbiddenKeys(topicsRaw, "topics.json");
  const topics = Array.isArray(topicsRaw) ? topicsRaw : topicsRaw?.topics || [];

  const allRaw = readOptionalJson(join(dir, "timeline", "all.json"));
  let allTimeline = null;
  if (allRaw !== undefined) {
    walkForbiddenKeys(allRaw, "timeline/all.json");
    walkCovers(allRaw, "timeline/all.json");
    assertObject(allRaw, "timeline/all.json", "timeline all");
    assertArray(allRaw.cards || [], "timeline/all.json.cards", "cards");
    allTimeline = {
      filters: allRaw.filters || { channel: "all", category: null, tag: null },
      cards: allRaw.cards || [],
      nextCursor: allRaw.nextCursor ?? null,
      hot: allRaw.hot ?? null,
      dayCounts: allRaw.dayCounts || allRaw.day_counts || {},
      page: allRaw.page,
      pageCount: allRaw.pageCount,
      total: allRaw.total,
    };
  }

  const weeklyIndexRaw = readOptionalJson(join(dir, "weekly-index.json"));
  if (weeklyIndexRaw !== undefined) walkForbiddenKeys(weeklyIndexRaw, "weekly-index.json");
  const monthlyIndexRaw = readOptionalJson(join(dir, "monthly-index.json"));
  if (monthlyIndexRaw !== undefined) walkForbiddenKeys(monthlyIndexRaw, "monthly-index.json");

  return {
    dir,
    meta,
    data_as_of: meta.data_as_of,
    built_at: meta.built_at || meta.generated_at,
    hot,
    hotStrip,
    daily,
    dailyIndex,
    dailies,
    feed,
    feedItems,
    events,
    eventsIndex,
    timeline,
    timelineIndex: timelineIndexRaw || null,
    redirects,
    sources,
    search: searchRaw || null,
    items,
    topics,
    allTimeline,
    weeklyIndex: asDailyIndex(weeklyIndexRaw),
    monthlyIndex: asDailyIndex(monthlyIndexRaw),
  };
}

/**
 * Build-time hook: never throws EngineDataError.
 * Missing / invalid engine data → `{ ok: false, engine: null, error }` so the
 * build can keep the fixture path (B1) and still call writeRedirects.
 * Non-engine errors still throw.
 *
 * @param {{ dir?: string, env?: NodeJS.ProcessEnv }} [options]
 */
export function loadEngineForBuild(options = {}) {
  try {
    return { ok: true, engine: loadEngineData(options), error: null };
  } catch (error) {
    if (error instanceof EngineDataError || error?.name === "EngineDataError") {
      return { ok: false, engine: null, error };
    }
    throw error;
  }
}
