#!/usr/bin/env node
/**
 * G3 free-path: skip a *scheduled* Pages rebuild when the engine-data tip
 * already matches the live public hot.json stamp. An empty rebuild does not
 * advance computedAt and still burns Actions minutes.
 *
 * repository_dispatch / workflow_dispatch / push always build so R1h live
 * and R1 round.done publish-no-wait can move the stamp.
 *
 * Never merge main. Never enable ENABLE_PUSH from this script.
 */
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

export const DISPATCH_EVENT = "engine-data-updated";
export const DEFAULT_LIVE_HOT_URL =
  "https://codyshen0000.github.io/ai-frontier-trends/api/v1/hot.json";

export function readStamp(hot) {
  if (!hot || typeof hot !== "object") return null;
  const stamp = hot.computedAt || hot.computed_at || null;
  return typeof stamp === "string" && stamp.trim() ? stamp.trim() : null;
}

export function shouldSkipScheduled({ eventName, tipStamp, liveStamp, liveFetchOk } = {}) {
  if (eventName !== "schedule") {
    return { skip: false, reason: "not-schedule" };
  }
  if (!liveFetchOk) {
    return { skip: false, reason: "live-unavailable-build" };
  }
  if (!tipStamp || !liveStamp) {
    return { skip: false, reason: "missing-stamp-build" };
  }
  if (tipStamp === liveStamp) {
    return { skip: true, reason: "same-computedAt" };
  }
  return { skip: false, reason: "tip-ahead" };
}

export function resolveTipHotPath(env = process.env, cwd = repoRoot) {
  const engineDir = env.FT_ENGINE_DIR || join(cwd, "data", "engine", "v1");
  return join(engineDir, "hot.json");
}

export function readTipStamp(hotPath) {
  if (!hotPath || !existsSync(hotPath)) return null;
  try {
    return readStamp(JSON.parse(readFileSync(hotPath, "utf8")));
  } catch {
    return null;
  }
}

export async function fetchLiveStamp(url, fetchImpl = globalThis.fetch) {
  if (!url || typeof fetchImpl !== "function") {
    return { ok: false, stamp: null };
  }
  try {
    const res = await fetchImpl(url, {
      headers: { accept: "application/json", "user-agent": "frontier-g3-skip-noop/1" },
    });
    if (!res.ok) return { ok: false, stamp: null, status: res.status };
    const body = await res.json();
    return { ok: true, stamp: readStamp(body), status: res.status };
  } catch {
    return { ok: false, stamp: null };
  }
}

export function writeGithubOutput(values, outputPath = process.env.GITHUB_OUTPUT) {
  if (!outputPath) return false;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}\n`);
  appendFileSync(outputPath, lines.join(""));
  return true;
}

export async function runSkipScheduledNoop({
  env = process.env,
  cwd = repoRoot,
  fetchImpl = globalThis.fetch,
} = {}) {
  const eventName = env.GITHUB_EVENT_NAME || env.FT_G3_EVENT_NAME || "";
  const liveUrl = env.GITHUB_PAGES_HOT_URL || DEFAULT_LIVE_HOT_URL;
  const tipPath = resolveTipHotPath(env, cwd);
  const tipStamp = readTipStamp(tipPath);
  const live = eventName === "schedule" ? await fetchLiveStamp(liveUrl, fetchImpl) : { ok: false, stamp: null };
  const decision = shouldSkipScheduled({
    eventName,
    tipStamp,
    liveStamp: live.stamp,
    liveFetchOk: live.ok,
  });
  writeGithubOutput({
    skip: decision.skip ? "true" : "false",
    reason: decision.reason,
  });
  return {
    ...decision,
    eventName,
    tipStamp,
    liveStamp: live.stamp || null,
    liveUrl,
    tipPath,
  };
}

const isMain =
  !process.env.NODE_TEST_CONTEXT &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const result = await runSkipScheduledNoop();
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.skip) {
    process.stdout.write("g3: skip scheduled no-op (tip computedAt already live)\n");
  } else {
    process.stdout.write(`g3: build (${result.reason})\n`);
  }
}
