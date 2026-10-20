/**
 * Load site-data 1.1 via the B0 loader, then fall back to the last good export.
 * Never falls back to Remaining-A fixture data.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EngineDataError, loadEngineData, resolveEngineDir } from "./loader.mjs";
import { FIXTURE_IDS, textHasFixtureId } from "./ids.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export { FIXTURE_IDS, EngineDataError };

export const LAST_GOOD_REL = "cache/engine-last-good";

export function lastGoodCandidates(env = process.env) {
  const out = [];
  const raw = env.FT_ENGINE_LAST_GOOD;
  if (raw) out.push(isAbsolute(raw) ? raw : resolve(REPO_ROOT, raw));
  out.push(resolve(REPO_ROOT, LAST_GOOD_REL));
  out.push(resolve(REPO_ROOT, "data/engine/last-good"));
  return [...new Set(out)];
}

export function persistLastGood(fromDir, dest = resolve(REPO_ROOT, LAST_GOOD_REL)) {
  if (!fromDir || fromDir === dest || !existsSync(fromDir)) return dest;
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(fromDir, dest, { recursive: true });
  return dest;
}

export function assertNoFixtureIds(value, label = "engine") {
  if (textHasFixtureId(JSON.stringify(value))) {
    throw new EngineDataError(`fixture id leaked into ${label}`, { code: "FIXTURE_IN_ENGINE" });
  }
}

function emptyBundle(dir) {
  const now = new Date().toISOString();
  return {
    dir,
    meta: { data_as_of: now, generated_at: now, mode: "empty" },
    data_as_of: now,
    built_at: now,
    hot: { computedAt: null, windowHours: 48, entries: [] },
    hotStrip: [],
    daily: null,
    dailyIndex: [],
    dailies: [],
    feed: null,
    feedItems: [],
    events: [],
    eventsIndex: [],
    timeline: {
      filters: { channel: "all", category: null, tag: null },
      cards: [],
      nextCursor: null,
      hot: [],
      dayCounts: {},
    },
    timelineIndex: null,
    redirects: [],
    sources: [],
    search: null,
    items: [],
    topics: [],
    allTimeline: null,
    weeklyIndex: [],
    monthlyIndex: [],
  };
}

/**
 * @param {{ dir?: string, env?: NodeJS.ProcessEnv, persistLastGood?: boolean, allowEmpty?: boolean }} [options]
 * @returns {{ bundle: import("./site-data.ts").EngineBundle, source: "primary"|"last-good"|"empty", warning: string|null }}
 */
export function resolveEngineBundle(options = {}) {
  const env = options.env || process.env;
  const publicDeploy = env.PUBLIC_DEPLOY === "1";
  const persist = options.persistLastGood ?? env.FT_ENGINE_PERSIST_LAST_GOOD === "1";
  const primary = options.dir || resolveEngineDir(env);

  const tryLoad = (dir) => {
    const bundle = loadEngineData({ dir, env });
    assertNoFixtureIds(bundle, dir);
    if (publicDeploy && bundle.meta?.mode === "synthetic") {
      throw new EngineDataError("PUBLIC_DEPLOY must not use the synthetic sample", {
        code: "SYNTHETIC_IN_PUBLIC",
        path: dir,
      });
    }
    return bundle;
  };

  let warning = null;
  let bundle = null;
  let source = "primary";

  try {
    bundle = tryLoad(primary);
  } catch (err) {
    if (err?.name !== "EngineDataError") throw err;
    warning = `engine data invalid (${err.code || err.message}); falling back to last good export`;
    console.warn(`[engine] ${warning}`);
    for (const cand of lastGoodCandidates(env)) {
      if (!existsSync(cand)) continue;
      try {
        bundle = tryLoad(cand);
        source = "last-good";
        warning = `${warning}; using ${cand}`;
        break;
      } catch {
        /* try next candidate */
      }
    }
    if (!bundle) {
      if (publicDeploy || options.allowEmpty === false) {
        throw new EngineDataError(
          `public build failed: no valid engine data and no last-good export (refused fixture fallback). last error: ${err.message}`,
          { code: "NO_LAST_GOOD", path: primary, cause: err },
        );
      }
      bundle = emptyBundle(primary);
      source = "empty";
      warning = `${warning}; no last-good, using empty pages (not fixture)`;
    }
  }

  if (persist && source === "primary" && bundle?.dir) {
    try {
      persistLastGood(bundle.dir);
    } catch (cause) {
      console.warn("[engine] persist last-good failed", cause);
    }
  }

  return { bundle, source, warning };
}
