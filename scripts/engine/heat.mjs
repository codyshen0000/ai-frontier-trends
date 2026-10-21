/**
 * B2 heat **recompute verifier** (not a production heat source).
 *
 * Production values live in site-data `hot.json` / `hot-snapshots` (heat48h.py).
 * This module recomputes `heat-v1-48h-halflife24h` from snapshot inputs
 * (per-event participant last-seen times) and fails when any listed value
 * differs from `hot.json` by more than HEAT_TOLERANCE (0.1).
 *
 * Formula (REMAINING-PRD-v1 §4.2 / SITE-DATA-CONTRACT 1.1):
 *   raw  = Σ 0.5^((T − last_at_h) / 24)   // one term per participant, 48h window
 *   heat = round(raw × 100) / 10
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const HEAT_RULE_VERSION = "heat-v1-48h-halflife24h";
export const WINDOW_HOURS = 48;
export const HALF_LIFE_HOURS = 24;
export const TREND_LAG_HOURS = 6;
export const SPARK_HOURS = 24;
export const SPARK_POINTS = 25;
export const HEAT_TOLERANCE = 0.1;
export const TOP_N = 10;

/** Page footnote for B1 to render unchanged (B2-08). Do not write 实时 / 引擎已 1:1. */
export const HEAT_METHOD_COPY = "按过去 48 小时独立来源计算，半衰期 24 小时";

const MS_HOUR = 3600 * 1000;

export function toMs(value) {
  if (value == null) return NaN;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : NaN;
}

export function displayHeat(raw) {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.round(raw * 100) / 10;
}

export function displayPct(ratio) {
  if (!Number.isFinite(ratio)) return null;
  return Math.round(ratio * 1000) / 10;
}

export function asHotKind(kind) {
  return kind === "editorial" ? "editorial" : "signal";
}

/**
 * @param {number} atMs
 * @param {number} lastAtMs
 * @returns {number | null} hours since last report, or null if outside the window
 */
export function hoursInWindow(atMs, lastAtMs, windowHours = WINDOW_HOURS) {
  if (!Number.isFinite(atMs) || !Number.isFinite(lastAtMs)) return null;
  const hours = (atMs - lastAtMs) / MS_HOUR;
  if (hours < 0 || hours > windowHours) return null;
  return hours;
}

export function rawContribution(hours, halfLifeHours = HALF_LIFE_HOURS) {
  return Math.pow(0.5, hours / halfLifeHours);
}

/**
 * Dedupe by participant_key; keep the most recent lastAt.
 * @param {Array<{ key: string, lastAt: string|number, kind?: string, name?: string, firstAt?: string|number }>} rows
 */
export function uniqueParticipants(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const key = String(row.key || row.participant_key || row.name || "").trim();
    if (!key) continue;
    const lastAt = toMs(row.lastAt ?? row.last_at ?? row.publishedAt ?? row.published_at);
    if (!Number.isFinite(lastAt)) continue;
    const firstAt = toMs(row.firstAt ?? row.first_at ?? lastAt);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        key,
        name: row.name || key,
        kind: asHotKind(row.kind),
        lastAt,
        firstAt: Number.isFinite(firstAt) ? firstAt : lastAt,
      });
      continue;
    }
    if (lastAt > prev.lastAt) prev.lastAt = lastAt;
    if (Number.isFinite(firstAt) && firstAt < prev.firstAt) prev.firstAt = firstAt;
    if (prev.kind !== "editorial" && asHotKind(row.kind) === "editorial") prev.kind = "editorial";
    if (row.name && prev.name === prev.key) prev.name = row.name;
  }
  return [...map.values()];
}

export function participantsAt(participants, atMs, windowHours = WINDOW_HOURS) {
  return uniqueParticipants(participants).filter((row) => hoursInWindow(atMs, row.lastAt, windowHours) != null);
}

export function rawHeat(participants, atMs, windowHours = WINDOW_HOURS) {
  let raw = 0;
  for (const row of participantsAt(participants, atMs, windowHours)) {
    raw += rawContribution(hoursInWindow(atMs, row.lastAt, windowHours));
  }
  return raw;
}

export function heatIndex(participants, at, windowHours = WINDOW_HOURS) {
  return displayHeat(rawHeat(participants, toMs(at), windowHours));
}

export function isEligible(participants, at) {
  const rows = participantsAt(participants, toMs(at));
  if (rows.length < 2) return false;
  return rows.some((row) => row.kind === "editorial");
}

export function floorUtcHour(atMs) {
  const d = new Date(atMs);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime();
}

/** 25 hourly instants covering the 24h up to the last whole hour of `at` (inclusive). */
export function sparkHours(at, points = SPARK_POINTS) {
  const end = floorUtcHour(toMs(at));
  const hours = [];
  for (let i = points - 1; i >= 0; i--) hours.push(end - i * MS_HOUR);
  return hours;
}

export function sparkFor(participants, at, points = SPARK_POINTS) {
  return sparkHours(at, points).map((hourMs) => {
    const rows = participantsAt(participants, hourMs);
    if (!rows.length) return null;
    return displayHeat(rawHeat(rows, hourMs));
  });
}

export function newParticipants6h(participants, at, lagHours = TREND_LAG_HOURS) {
  const atMs = toMs(at);
  const cut = atMs - lagHours * MS_HOUR;
  return participantsAt(participants, atMs).filter((row) => row.firstAt > cut).length;
}

export function firstReportAt(participants) {
  let min = Infinity;
  for (const row of uniqueParticipants(participants)) {
    if (row.firstAt < min) min = row.firstAt;
  }
  return Number.isFinite(min) ? min : null;
}

export function trendOf(curHeat, prevHeat, existedBefore) {
  if (!existedBefore) return { trend: "new", trendPct: null };
  if (!Number.isFinite(prevHeat) || prevHeat <= 0) return { trend: "unknown", trendPct: null };
  const trendPct = displayPct((curHeat - prevHeat) / prevHeat);
  if (trendPct == null) return { trend: "unknown", trendPct: null };
  if (trendPct > 10) return { trend: "up", trendPct };
  if (trendPct < -10) return { trend: "down", trendPct };
  return { trend: "flat", trendPct };
}

export function badgesOf({ firstAt, at, newParticipants6h: fresh, participantCount, trendPct }) {
  const badges = [];
  const atMs = toMs(at);
  const surge = fresh >= 3 && participantCount > 0 && fresh / participantCount >= 0.5;
  if (surge) badges.push("surge");
  if (firstAt != null && atMs - firstAt >= 0 && atMs - firstAt < TREND_LAG_HOURS * MS_HOUR) {
    badges.push("new");
  }
  if (!surge && trendPct != null && trendPct > 15) badges.push("rising");
  return badges;
}

/**
 * Recompute one story at `at`. `prevHeat` is the heat_index 6h earlier (or null).
 * `existedBefore` defaults to prevHeat != null.
 */
export function recomputeEntry(participants, at, options = {}) {
  const atMs = toMs(at);
  const rows = participantsAt(participants, atMs);
  const heat = displayHeat(rawHeat(rows, atMs));
  const prevAt = options.prevAt != null ? options.prevAt : atMs - TREND_LAG_HOURS * MS_HOUR;
  const prevRows = participantsAt(participants, toMs(prevAt));
  const prevHeat = options.prevHeat != null ? options.prevHeat : prevRows.length ? displayHeat(rawHeat(prevRows, toMs(prevAt))) : null;
  const existedBefore = options.existedBefore != null ? options.existedBefore : prevHeat != null && prevRows.length > 0;
  const { trend, trendPct } = trendOf(heat, prevHeat, existedBefore);
  const fresh = newParticipants6h(participants, atMs);
  return {
    heat,
    trend,
    trendPct,
    badges: badgesOf({
      firstAt: firstReportAt(participants),
      at: atMs,
      newParticipants6h: fresh,
      participantCount: rows.length,
      trendPct,
    }),
    participantCount: rows.length,
    spark: sparkFor(participants, atMs),
    eligible: isEligible(participants, atMs),
    newParticipants6h: fresh,
    prevHeat,
  };
}

export function participantKeyFromReport(row, sourcesByName = new Map(), sourcesById = new Map()) {
  return (
    row.participant_key ||
    row.participantKey ||
    row.user_id ||
    row.userId ||
    row.handle ||
    row.sourceId ||
    row.source_id ||
    row.source?.id ||
    row.source?.sourceId ||
    sourcesByName.get(row.source?.name || row.name)?.sourceId ||
    row.source?.name ||
    row.name ||
    row.id ||
    ""
  );
}

export function kindFromReport(row, sourcesByName = new Map(), sourcesById = new Map()) {
  const id = row.sourceId || row.source_id || row.source?.id || row.source?.sourceId;
  const name = row.source?.name || row.name;
  const fromTable = (id && sourcesById.get(id)) || (name && sourcesByName.get(name));
  return asHotKind(row.kind || row.source?.kind || fromTable?.kind);
}

function pushReport(acc, row, sourcesByName, sourcesById) {
  const publishedAt = row.publishedAt || row.published_at || row.lastAt || row.last_at;
  if (!publishedAt) return;
  const name = row.source?.name || row.name || "unknown";
  acc.push({
    key: String(participantKeyFromReport(row, sourcesByName, sourcesById)),
    name,
    kind: kindFromReport(row, sourcesByName, sourcesById),
    lastAt: publishedAt,
    firstAt: publishedAt,
  });
}

export function indexSources(sources) {
  const list = Array.isArray(sources) ? sources : sources?.sources || [];
  const byName = new Map();
  const byId = new Map();
  for (const row of list) {
    if (row?.name) byName.set(row.name, row);
    if (row?.sourceId) byId.set(row.sourceId, row);
    if (row?.source_id) byId.set(row.source_id, row);
  }
  return { list, byName, byId };
}

/** Collect participant last/first times from an event (timeline + developments + explicit participants). */
export function participantsFromEvent(event, sources = []) {
  const { byName, byId } = indexSources(sources);
  const acc = [];
  for (const row of event?.timeline || []) pushReport(acc, row, byName, byId);
  for (const fact of event?.developments || []) {
    if (fact?.representative) pushReport(acc, fact.representative, byName, byId);
  }
  for (const row of event?.officialReports || []) pushReport(acc, row, byName, byId);
  for (const row of event?.participants || []) {
    if (row?.publishedAt || row?.published_at || row?.lastAt) pushReport(acc, row, byName, byId);
  }
  return uniqueParticipants(acc);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function listJson(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(dir, name));
}

export function loadHotSnapshots(dir) {
  const snapDir = join(dir, "hot-snapshots");
  const out = [];
  for (const file of listJson(snapDir)) {
    const raw = readJson(file);
    const name = file.split("/").pop().replace(/\.json$/, "");
    out.push({
      file,
      hour: name,
      computedAt: raw.computedAt || raw.computed_at || null,
      computedAtMs: toMs(raw.computedAt || raw.computed_at),
      entries: raw.entries || [],
    });
  }
  out.sort((a, b) => a.computedAtMs - b.computedAtMs);
  return out;
}

/** Prefer a stored snapshot within 30 minutes of T−6h; otherwise null (caller recomputes). */
export function snapshotNear(snapshots, atMs, maxDeltaMs = 30 * 60 * 1000) {
  let best = null;
  let bestDelta = Infinity;
  for (const snap of snapshots || []) {
    if (!Number.isFinite(snap.computedAtMs)) continue;
    const delta = Math.abs(snap.computedAtMs - atMs);
    if (delta < bestDelta) {
      best = snap;
      bestDelta = delta;
    }
  }
  return bestDelta <= maxDeltaMs ? best : null;
}

function eventPublicId(event) {
  return event?.publicId || event?.event_id || event?.story?.publicId || null;
}

export function loadEvents(dir) {
  const events = [];
  for (const file of listJson(join(dir, "events"))) {
    if (file.endsWith("index.json")) continue;
    events.push(readJson(file));
  }
  return events;
}

export function loadHeatInputs(dir) {
  const hotPath = join(dir, "hot.json");
  if (!existsSync(hotPath)) {
    throw new Error(`hot.json missing in ${dir}`);
  }
  const hot = readJson(hotPath);
  const meta = existsSync(join(dir, "meta.json")) ? readJson(join(dir, "meta.json")) : {};
  const sourcesRaw = existsSync(join(dir, "sources.json")) ? readJson(join(dir, "sources.json")) : [];
  const sources = Array.isArray(sourcesRaw) ? sourcesRaw : sourcesRaw.sources || [];
  const events = loadEvents(dir);
  const snapshots = loadHotSnapshots(dir);
  const search = existsSync(join(dir, "search", "source.json")) ? readJson(join(dir, "search", "source.json")) : null;
  const byId = new Map();
  for (const event of events) {
    const id = eventPublicId(event);
    if (id) byId.set(id, event);
  }
  return {
    dir,
    hot,
    meta,
    sources,
    events,
    eventsById: byId,
    snapshots,
    search,
    computedAt: hot.computedAt || meta.hot_computed_at || meta.generated_at || meta.built_at,
  };
}

function reportsFromSearch(search, publicId, sources) {
  const { byName, byId } = indexSources(sources);
  const acc = [];
  for (const doc of search?.docs || []) {
    if (doc.kind !== "item") continue;
    if ((doc.eventPublicId || doc.event_id) !== publicId) continue;
    pushReport(
      acc,
      {
        id: doc.id,
        name: doc.sourceName,
        source: { name: doc.sourceName },
        publishedAt: doc.publishedAt,
        originalUrl: doc.originalUrl,
      },
      byName,
      byId,
    );
  }
  return uniqueParticipants(acc);
}

export function participantsForStory(inputs, publicId) {
  const event = inputs.eventsById.get(publicId);
  const acc = [];
  if (event) acc.push(...participantsFromEvent(event, inputs.sources));
  if (inputs.search) acc.push(...reportsFromSearch(inputs.search, publicId, inputs.sources));
  return uniqueParticipants(acc);
}

function sameBadges(a, b) {
  const left = [...(a || [])].sort();
  const right = [...(b || [])].sort();
  return left.length === right.length && left.every((x, i) => x === right[i]);
}

function close(a, b, tol = HEAT_TOLERANCE) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(Number(a) - Number(b)) <= tol;
}

export function compareEntry(listed, recomputed, { tolerance = HEAT_TOLERANCE, id = "" } = {}) {
  const issues = [];
  if (!recomputed.eligible) {
    issues.push(`${id}: not eligible (need ≥2 participants and ≥1 editorial)`);
  }
  if (!close(listed.heat, recomputed.heat, tolerance)) {
    issues.push(`${id}: heat ${listed.heat} ≠ recomputed ${recomputed.heat} (tol ${tolerance})`);
  }
  if (listed.trend && listed.trend !== recomputed.trend) {
    issues.push(`${id}: trend ${listed.trend} ≠ recomputed ${recomputed.trend}`);
  }
  if (listed.trendPct != null && !close(listed.trendPct, recomputed.trendPct, tolerance)) {
    issues.push(`${id}: trendPct ${listed.trendPct} ≠ recomputed ${recomputed.trendPct}`);
  }
  if (listed.badges && !sameBadges(listed.badges, recomputed.badges)) {
    issues.push(`${id}: badges [${(listed.badges || []).join(",")}] ≠ [${recomputed.badges.join(",")}]`);
  }
  const spark = listed.spark;
  if (spark != null) {
    if (!Array.isArray(spark) || spark.length !== SPARK_POINTS) {
      issues.push(`${id}: spark length ${spark?.length ?? "missing"} ≠ ${SPARK_POINTS}`);
    } else {
      recomputed.spark.forEach((point, i) => {
        if (point == null && spark[i] == null) return;
        if (point == null || spark[i] == null || !close(spark[i], point, tolerance)) {
          issues.push(`${id}: spark[${i}] ${spark[i]} ≠ recomputed ${point}`);
        }
      });
    }
  }
  return issues;
}

/**
 * Recompute every hot.json entry from snapshot participant times.
 * @returns {{ ok: boolean, issues: string[], recomputed: object[] }}
 */
export function verifyHotJson(inputs, options = {}) {
  const tolerance = options.tolerance ?? HEAT_TOLERANCE;
  const at = options.at || inputs.computedAt;
  const atMs = toMs(at);
  if (!Number.isFinite(atMs)) {
    return { ok: false, issues: ["hot.computedAt / meta timestamp missing"], recomputed: [] };
  }
  const listed = inputs.hot?.entries || [];
  const issues = [];
  const skipped = [];
  const recomputed = [];
  const seen = new Set();

  if (inputs.hot?.windowHours != null && inputs.hot.windowHours !== WINDOW_HOURS) {
    issues.push(`hot.windowHours ${inputs.hot.windowHours} ≠ ${WINDOW_HOURS}`);
  }

  const prevTarget = atMs - TREND_LAG_HOURS * MS_HOUR;
  const prevSnap = snapshotNear(inputs.snapshots, prevTarget);

  for (const [i, entry] of listed.entries()) {
    const id = entry?.story?.publicId || `#${i}`;
    if (seen.has(id)) issues.push(`${id}: duplicate event_id on hot list`);
    seen.add(id);
    const participants = participantsForStory(inputs, id);
    const listedCount =
      Number(entry.participantCount) ||
      (Array.isArray(entry.participants) ? entry.participants.length : 0) ||
      (Array.isArray(entry.sourceNames) ? entry.sourceNames.length : 0);
    if (!participants.length) {
      issues.push(`${id}: no participant timestamps in events/search (cannot recompute)`);
      continue;
    }
    // Live engine-data may list heat participants that the exported event/search
    // tree does not include. Incomplete timestamps are a skip, not a false mismatch.
    if (listedCount > participants.length) {
      skipped.push(
        `${id}: skip (engine tree has ${participants.length} timestamp(s); hot.json lists ${listedCount})`,
      );
      continue;
    }
    let prevHeat;
    let existedBefore;
    if (prevSnap) {
      const row = (prevSnap.entries || []).find((e) => (e.publicId || e.story?.publicId) === id);
      if (row && row.heat != null) {
        prevHeat = row.heat;
        existedBefore = true;
      } else {
        existedBefore = false;
      }
    }
    const next = recomputeEntry(participants, atMs, {
      prevHeat,
      existedBefore,
      prevAt: prevTarget,
    });
    let entryIssues = compareEntry(entry, next, { tolerance, id });
    // heat48h.py recomputes T−6h from current participant times. A stored
    // snapshot within 30 minutes can still carry a stale heat (participants
    // updated after that hour was frozen). If heat itself matches and the
    // participant recompute matches hot.json, do not fail the live overlay.
    const trendOnly = entryIssues.length > 0 && entryIssues.every((msg) => /: trend/.test(msg));
    if (trendOnly && prevHeat != null) {
      const fromParticipants = recomputeEntry(participants, atMs, { prevAt: prevTarget });
      if (compareEntry(entry, fromParticipants, { tolerance, id }).length === 0) {
        skipped.push(`${id}: skip trend vs stale T−6h snapshot (participant recompute matches hot.json)`);
        entryIssues = [];
      }
    }
    recomputed.push({ publicId: id, ...next });
    issues.push(...entryIssues);
  }

  if (listed.length > TOP_N) {
    issues.push(`hot list has ${listed.length} entries; cap is ${TOP_N}`);
  }

  return {
    ok: issues.length === 0,
    issues,
    skipped,
    recomputed,
    at: new Date(atMs).toISOString(),
    prevSnap: prevSnap?.hour || null,
  };
}

export function verifyEngineHeat(dir, options = {}) {
  return verifyHotJson(loadHeatInputs(dir), options);
}
