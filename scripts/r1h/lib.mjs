/**
 * R1h / hot-tick helpers (Task #58).
 *
 * Reuses scripts/engine/heat.mjs (existing hot recompute). Does not collect,
 * does not import editorial outbox, does not rewrite daily/feeds, and does
 * not write hot-snapshots unless the caller opts in (default: no).
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  TOP_N,
  isEligible,
  loadHeatInputs,
  participantsForStory,
  recomputeEntry,
  toMs,
} from "../engine/heat.mjs";

export const INTERVAL_MS = 15 * 60 * 1000;
export const DEBOUNCE_MS = INTERVAL_MS / 2; // 7.5 min at the 15 min cadence
export const MAX_DEPLOYS_PER_HOUR = 4;
export const BACKOFF_MS = [15 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];
export const LOCK_STALE_MS = 20 * 60 * 1000;
export const SHANGHAI = "Asia/Shanghai";
export const WINDOW_START_MIN = 8 * 60; // 08:00
export const WINDOW_END_MIN = 23 * 60; // 23:00 inclusive as a start minute

const VOLATILE_KEYS = new Set([
  "computedAt",
  "computed_at",
  "generated_at",
  "built_at",
  "hot_computed_at",
  "exported_at",
  "exportedAt",
]);

const SAME_ORIGIN_PREFIX = "assets/covers/";

export function eventPublicId(event) {
  return event?.publicId || event?.event_id || event?.story?.publicId || null;
}

export function stripVolatile(value) {
  if (Array.isArray(value)) return value.map(stripVolatile);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (VOLATILE_KEYS.has(key)) continue;
      out[key] = stripVolatile(value[key]);
    }
    return out;
  }
  return value;
}

export function contentHash(hot) {
  const body = JSON.stringify(stripVolatile(hot ?? {}));
  return createHash("sha256").update(body).digest("hex");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function isSameOriginCover(cover) {
  return Boolean(cover && typeof cover === "object" && String(cover.url || "").startsWith(SAME_ORIGIN_PREFIX));
}

export function shanghaiMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHANGHAI,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** Business window 08:00–23:00 Asia/Shanghai (start at 23:00 allowed; 23:01+ follows R1 only). */
export function inBusinessWindow(now = new Date()) {
  const minutes = shanghaiMinutes(now);
  return minutes >= WINDOW_START_MIN && minutes <= WINDOW_END_MIN;
}

export function resolveLockPath(env = process.env, cwd = process.cwd()) {
  if (env.FT_R1_LOCK) return env.FT_R1_LOCK;
  if (existsSync("/workspace/ops")) return "/workspace/ops/l4-r1-lock";
  return join(cwd, "ops/l4-r1-lock");
}

export function resolveCounterPath(env = process.env, cwd = process.cwd()) {
  if (env.FT_R1H_COUNTER) return env.FT_R1H_COUNTER;
  if (existsSync("/workspace/ops")) return "/workspace/ops/r1h/pages-deploys.jsonl";
  return join(cwd, "ops/r1h/pages-deploys.jsonl");
}

export function resolveEvidenceDir(env = process.env, cwd = process.cwd()) {
  if (env.FT_R1H_EVIDENCE) return env.FT_R1H_EVIDENCE;
  if (existsSync("/workspace/ops")) return "/workspace/ops/r1h/evidence";
  return join(cwd, "ops/r1h/evidence");
}

export function readLock(lockPath) {
  if (!existsSync(lockPath)) return null;
  try {
    return JSON.parse(readFileSync(lockPath, "utf8"));
  } catch {
    return { holder: "unknown", since: new Date(0).toISOString(), raw: true };
  }
}

export function acquireLock(lockPath, { holder = "r1h", now = Date.now(), staleMs = LOCK_STALE_MS, reason = "hot-tick" } = {}) {
  mkdirSync(dirname(lockPath), { recursive: true });
  const existing = readLock(lockPath);
  if (existing?.since) {
    const age = now - Date.parse(existing.since);
    const fresh = Number.isFinite(age) && age >= 0 && age < staleMs;
    if (fresh && existing.holder === "r1") {
      return { ok: false, reason: "r1_holds", existing };
    }
    if (fresh && existing.holder === "r1h" && existing.pid && existing.pid !== process.pid) {
      return { ok: false, reason: "r1h_holds", existing };
    }
  }
  const record = {
    holder,
    pid: process.pid,
    since: new Date(now).toISOString(),
    reason,
  };
  writeFileSync(lockPath, `${JSON.stringify(record, null, 2)}\n`);
  return { ok: true, record };
}

export function releaseLock(lockPath, { pid = process.pid } = {}) {
  const existing = readLock(lockPath);
  if (!existing) return false;
  if (existing.pid && existing.pid !== pid) return false;
  rmSync(lockPath, { force: true });
  return true;
}

export function readDeployEvents(counterPath) {
  if (!counterPath || !existsSync(counterPath)) return [];
  return readFileSync(counterPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function appendDeployEvent(counterPath, event) {
  mkdirSync(dirname(counterPath), { recursive: true });
  const line = `${JSON.stringify(event)}\n`;
  writeFileSync(counterPath, existsSync(counterPath) ? `${readFileSync(counterPath, "utf8")}${line}` : line);
}

export function lastByTime(events, predicate = () => true) {
  let best = null;
  let bestTs = -Infinity;
  for (const event of events || []) {
    if (!predicate(event)) continue;
    const ts = Date.parse(event.at);
    if (!Number.isFinite(ts)) continue;
    if (ts >= bestTs) {
      best = event;
      bestTs = ts;
    }
  }
  return best;
}

export function consecutiveTrailingFailures(events, now = Date.now()) {
  const ordered = [...(events || [])]
    .filter((e) => e.kind === "success" || e.kind === "failure")
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const out = [];
  for (let i = ordered.length - 1; i >= 0; i--) {
    const event = ordered[i];
    if (Date.parse(event.at) > now) continue;
    if (event.kind === "success") break;
    if (event.kind === "failure") out.push(event);
  }
  return out;
}

/**
 * Debounce + max-N + failure backoff. R1 full publish is not gated here
 * (it may interrupt debounce); R1h counts R1 successes toward Max N.
 */
export function evaluateThrottle({
  events = [],
  now = Date.now(),
  debounceMs = DEBOUNCE_MS,
  maxPerHour = MAX_DEPLOYS_PER_HOUR,
} = {}) {
  const hourAgo = now - 60 * 60 * 1000;
  const successes = events.filter((e) => e.kind === "success" && Date.parse(e.at) >= hourAgo && Date.parse(e.at) <= now);
  if (successes.length >= maxPerHour) {
    return {
      ok: false,
      decision: "throttled",
      reason: "max_deploys_per_hour",
      count: successes.length,
      maxPerHour,
    };
  }
  const lastSuccess = lastByTime(events, (e) => e.kind === "success" && Date.parse(e.at) <= now);
  if (lastSuccess && now - Date.parse(lastSuccess.at) < debounceMs) {
    return {
      ok: false,
      decision: "throttled",
      reason: "debounce",
      lastAt: lastSuccess.at,
      debounceMs,
    };
  }
  const failures = consecutiveTrailingFailures(events, now);
  if (failures.length) {
    const backoffMs = BACKOFF_MS[Math.min(failures.length - 1, BACKOFF_MS.length - 1)];
    const lastFail = Date.parse(failures[0].at);
    if (now - lastFail < backoffMs) {
      return {
        ok: false,
        decision: "throttled",
        reason: "failure_backoff",
        backoffMs,
        lastAt: failures[0].at,
      };
    }
  }
  return { ok: true, count: successes.length };
}

function listedId(entry) {
  return entry?.story?.publicId || entry?.publicId || null;
}

function overlayCover(next, prev) {
  if (!prev) return next;
  const keep =
    (!next.cover && prev.cover) ||
    (!isSameOriginCover(next.cover) && isSameOriginCover(prev.cover));
  if (keep) next.cover = prev.cover;
  return next;
}

function buildEntry(listed, recomputed, { rank, prevRank, prevHeat }) {
  const heatChanged = listed?.heat != null && recomputed.heat !== listed.heat;
  const rankChanged = prevRank != null && rank != null && rank !== prevRank;
  const heatDeltaPct = heatChanged && Number.isFinite(prevHeat) && prevHeat > 0
    ? Math.round(((recomputed.heat - prevHeat) / prevHeat) * 1000) / 10
    : listed?.heatDeltaPct ?? null;
  const rankDelta = rankChanged ? prevRank - rank : listed?.rankDelta ?? 0;
  return overlayCover(
    {
      ...(listed || {}),
      rank,
      heat: recomputed.heat,
      trend: recomputed.trend,
      trendPct: recomputed.trendPct,
      badges: recomputed.badges,
      participantCount: recomputed.participantCount,
      sourceCount: listed?.sourceCount ?? recomputed.participantCount,
      spark: recomputed.spark,
      rankDelta,
      heatDeltaPct,
    },
    listed,
  );
}

/**
 * Recompute the current hot board from tip / engine JSON (heat.mjs).
 * Default: listed entries only. `--rescan-events` adds newly eligible stories.
 */
export function rankHotFromEngine(engineDir, { at, rescanEvents = false, prevTipDir = null } = {}) {
  const inputs = loadHeatInputs(engineDir);
  const prevInputs = prevTipDir && prevTipDir !== engineDir ? loadHeatInputs(prevTipDir) : inputs;
  const atIso = at || inputs.computedAt || new Date().toISOString();
  const atMs = toMs(atIso);
  if (!Number.isFinite(atMs)) {
    throw new Error("rankHotFromEngine: computedAt / --at is not a valid timestamp");
  }

  const listed = [...(inputs.hot?.entries || [])];
  const prevById = new Map((prevInputs.hot?.entries || []).map((entry) => [listedId(entry), entry]));
  const candidates = new Map();
  for (const entry of listed) {
    const id = listedId(entry);
    if (id) candidates.set(id, entry);
  }
  if (rescanEvents) {
    for (const event of inputs.events || []) {
      const id = eventPublicId(event);
      if (id && !candidates.has(id)) candidates.set(id, null);
    }
  }

  const rows = [];
  for (const [id, listedEntry] of candidates) {
    const participants = participantsForStory(inputs, id);
    if (!participants.length) {
      if (listedEntry) {
        rows.push({ listed: listedEntry, recomputed: null, id, skip: "no_participants" });
      }
      continue;
    }
    if (!listedEntry && !isEligible(participants, atMs)) continue;
    const recomputed = recomputeEntry(participants, atMs);
    if (!listedEntry && !recomputed.eligible) continue;
    const prev = prevById.get(id) || listedEntry;
    rows.push({
      id,
      listed: listedEntry || prev || { story: { publicId: id, title: id } },
      recomputed,
      prev,
    });
  }

  const ranked = rows
    .filter((row) => row.recomputed)
    .sort((a, b) => b.recomputed.heat - a.recomputed.heat || String(a.id).localeCompare(String(b.id)))
    .slice(0, TOP_N)
    .map((row, index) => {
      const rank = index + 1;
      return buildEntry(row.listed, row.recomputed, {
        rank,
        prevRank: row.prev?.rank ?? row.listed?.rank ?? null,
        prevHeat: row.prev?.heat ?? row.listed?.heat ?? null,
      });
    });

  return {
    computedAt: new Date(atMs).toISOString(),
    windowHours: inputs.hot?.windowHours ?? 48,
    entries: ranked,
  };
}

export function patchHotMeta(meta, { computedAt, hotEntries, now = computedAt } = {}) {
  const next = { ...(meta || {}) };
  next.hot_computed_at = computedAt;
  next.generated_at = now;
  if (next.counts && typeof next.counts === "object") {
    next.counts = { ...next.counts, hot_entries: hotEntries };
  }
  return next;
}

export function writeEvidence(evidenceDir, record) {
  mkdirSync(evidenceDir, { recursive: true });
  const stamp = String(record.trigger_at || new Date().toISOString()).replace(/[:.]/g, "-");
  const path = join(evidenceDir, `${stamp}.json`);
  writeJson(path, record);
  const latest = join(evidenceDir, "latest.json");
  writeJson(latest, record);
  return path;
}

export function parseArgs(argv, defaults = {}) {
  const out = { ...defaults, _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--") {
      out._.push(...argv.slice(i + 1));
      break;
    }
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next == null || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

export function enableLivePush(env = process.env, args = {}) {
  return env.ENABLE_PUSH === "1" && env.FT_R1H_ALLOW_LIVE === "1" && Boolean(args.push);
}

export function refuseLiveSideEffects() {
  return {
    pushed: false,
    dispatched: false,
    pages_run_id: null,
    note: "dry-run / ENABLE_PUSH=0: never git-push engine-data, never repository_dispatch",
  };
}

export function listBoxHints(env = process.env, cwd = process.cwd()) {
  const sqlite = env.FT_ENGINE_SQLITE || "/workspace/l4-runtime/engine.sqlite";
  const inRepoExport = join(cwd, "scripts/site-data/export_site_data.py");
  const inRepoHeat = join(cwd, "scripts/site-data/heat48h.py");
  const boxExport = "/workspace/frontier-hotboard/site-data/export_site_data.py";
  const boxHeat = "/workspace/frontier-hotboard/site-data/heat48h.py";
  const exportPy = env.FT_SITE_DATA_EXPORT || (existsSync(inRepoExport) ? inRepoExport : boxExport);
  const heatPy = env.HEAT48H_PY || (existsSync(inRepoHeat) ? inRepoHeat : boxHeat);
  return {
    sqlite: existsSync(sqlite) ? sqlite : null,
    exportPy: existsSync(exportPy) ? exportPy : null,
    heatPy: existsSync(heatPy) ? heatPy : null,
    rankCmd: env.FT_R1H_RANK_CMD || null,
  };
}

export function requirePrevTip(prevTip) {
  if (!prevTip) {
    throw new Error("R1h requires --prev-tip (cover preserve). Refusing to export without it.");
  }
  if (!existsSync(prevTip) || !statSync(prevTip).isDirectory()) {
    throw new Error(`--prev-tip is not a directory: ${prevTip}`);
  }
  if (!existsSync(join(prevTip, "hot.json"))) {
    throw new Error(`--prev-tip missing hot.json: ${prevTip}`);
  }
}

export function defaultEngineDir(env = process.env, cwd = process.cwd()) {
  if (env.FT_ENGINE_DIR) return env.FT_ENGINE_DIR;
  const local = join(cwd, "data/engine/v1");
  if (existsSync(join(local, "hot.json"))) return local;
  return local;
}
