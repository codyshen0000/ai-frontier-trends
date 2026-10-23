/**
 * R1h D2 live push (Task #58).
 *
 * Same chain R1 publish-no-wait uses on the box:
 *   copy hot-only files into the engine-data worktree
 *   → git commit + push origin/engine-data only
 *   → gh api repository_dispatch event_type=engine-data-updated
 *
 * Never merges, never checks out, never pushes main. Triple gate is
 * re-checked here even though hot_tick already gated the call.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { enableLivePush, refuseLiveSideEffects } from "./lib.mjs";

export const ENGINE_DATA_BRANCH = "engine-data";
export const DISPATCH_EVENT = "engine-data-updated";
export const DEFAULT_DISPATCH_REPO = "codyshen0000/ai-frontier-trends";
export const PAGES_WORKFLOW = "pages.yml";

const HOT_FILE = "hot.json";
const META_FILE = "meta.json";
const SNAP_DIR = "hot-snapshots";

export function defaultRun(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
  return {
    status: result.status ?? (result.error ? 1 : 0),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error || null,
  };
}

export function sleepSync(ms) {
  const wait = Number(ms);
  if (!Number.isFinite(wait) || wait <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait);
}

export function dispatchRepo(env = process.env) {
  return env.FT_R1H_DISPATCH_REPO || env.GITHUB_REPOSITORY || DEFAULT_DISPATCH_REPO;
}

export function findGitRoot(startDir) {
  let dir = resolve(startDir);
  for (let i = 0; i < 16; i++) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function posixRel(from, to) {
  return relative(from, to).split(sep).join("/");
}

function isHotOnlyRel(rel) {
  const norm = String(rel || "").replaceAll("\\", "/");
  if (!norm || norm.startsWith("..") || norm.includes("/../")) return false;
  if (norm === HOT_FILE || norm.endsWith(`/${HOT_FILE}`)) return true;
  if (norm === META_FILE || norm.endsWith(`/${META_FILE}`)) return true;
  if (norm === SNAP_DIR || norm.startsWith(`${SNAP_DIR}/`) || norm.includes(`/${SNAP_DIR}/`)) return true;
  return false;
}

export function listHotOnlyCopies(outDir, destDir, { writeSnapshots = false } = {}) {
  if (!outDir || !destDir) {
    throw new Error("live push: outDir and destDir are required");
  }
  const copies = [];
  const hotSrc = join(outDir, HOT_FILE);
  if (!existsSync(hotSrc)) {
    throw new Error(`live push: outDir missing ${HOT_FILE}: ${outDir}`);
  }
  copies.push({ from: hotSrc, to: join(destDir, HOT_FILE) });
  const metaSrc = join(outDir, META_FILE);
  if (existsSync(metaSrc)) {
    copies.push({ from: metaSrc, to: join(destDir, META_FILE) });
  }
  if (writeSnapshots) {
    const srcSnap = join(outDir, SNAP_DIR);
    if (existsSync(srcSnap) && statSync(srcSnap).isDirectory()) {
      for (const name of readdirSync(srcSnap)) {
        const from = join(srcSnap, name);
        if (!statSync(from).isFile()) continue;
        copies.push({ from, to: join(destDir, SNAP_DIR, name) });
      }
    }
  }
  return copies;
}

function copyListed(copies) {
  for (const item of copies) {
    mkdirSync(dirname(item.to), { recursive: true });
    copyFileSync(item.from, item.to);
  }
}

function git(run, gitRoot, args, extraEnv = {}) {
  return run("git", ["-C", gitRoot, ...args], {
    env: { ...process.env, ...extraEnv },
  });
}

function fail(note, extra = {}) {
  return {
    pushed: false,
    dispatched: false,
    pages_run_id: null,
    note,
    ...extra,
  };
}

export function inspectEngineDataRepo(prevTip, run = defaultRun) {
  if (!prevTip || !existsSync(prevTip) || !statSync(prevTip).isDirectory()) {
    return { ok: false, note: `--prev-tip is not a directory: ${prevTip}` };
  }
  const gitRoot = findGitRoot(prevTip);
  if (!gitRoot) {
    return { ok: false, note: `--prev-tip is not inside a git worktree: ${prevTip}` };
  }
  const branchOut = git(run, gitRoot, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branchOut.status !== 0) {
    return {
      ok: false,
      gitRoot,
      note: `git rev-parse failed in ${gitRoot}: ${(branchOut.stderr || branchOut.stdout || "").trim()}`,
    };
  }
  const branch = (branchOut.stdout || "").trim();
  if (branch !== ENGINE_DATA_BRANCH) {
    return {
      ok: false,
      gitRoot,
      branch,
      note: `refusing to commit: HEAD is '${branch || "unknown"}', not ${ENGINE_DATA_BRANCH} (never merge or push main)`,
    };
  }
  return { ok: true, gitRoot, branch };
}

function parseRunList(stdout) {
  const text = String(stdout || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pickPagesRunId(runs, sinceMs) {
  const slack = 15_000;
  const candidates = (runs || [])
    .map((row) => ({
      id: row.databaseId ?? row.id ?? null,
      createdAt: Date.parse(row.createdAt || row.created_at || ""),
    }))
    .filter((row) => row.id != null && Number.isFinite(row.createdAt))
    .sort((a, b) => b.createdAt - a.createdAt);
  const fresh = candidates.find((row) => row.createdAt + slack >= sinceMs);
  const chosen = fresh || candidates[0] || null;
  return chosen ? String(chosen.id) : null;
}

export function lookupPagesRunId({
  run = defaultRun,
  repo,
  sinceMs = Date.now(),
  sleep = sleepSync,
  pollTries = 5,
  pollMs = 1000,
} = {}) {
  let last = "";
  for (let i = 0; i < pollTries; i++) {
    const listed = run("gh", [
      "run",
      "list",
      "--repo",
      repo,
      "--workflow",
      PAGES_WORKFLOW,
      "--event",
      "repository_dispatch",
      "--limit",
      "5",
      "--json",
      "databaseId,createdAt,event,status,displayTitle",
    ]);
    last = `${listed.stdout || ""}\n${listed.stderr || ""}`.trim();
    if (listed.status === 0) {
      const id = pickPagesRunId(parseRunList(listed.stdout), sinceMs);
      if (id) return { id, raw: listed.stdout };
    }
    if (i + 1 < pollTries) sleep(pollMs);
  }
  return { id: null, raw: last };
}

/**
 * @param {object} ctx
 * @param {string} ctx.prevTip engine-data tree (…/data/engine/v1)
 * @param {string} ctx.outDir staging with hot.json + patched meta.json
 * @param {object} [ctx.hot]
 * @param {object} [ctx.env]
 * @param {object} [ctx.args]
 * @param {Function} [ctx.run] spawnSync-compatible mock (git/gh); CI must mock network
 * @param {Function} [ctx.sleep]
 * @returns {{pushed:boolean, dispatched:boolean, pages_run_id:string|null, note:string}}
 */
export function tryLivePush(ctx = {}) {
  const env = ctx.env || process.env;
  const args = ctx.args || {};
  const run = ctx.run || defaultRun;
  const sleep = ctx.sleep || sleepSync;
  if (!enableLivePush(env, args)) {
    return refuseLiveSideEffects();
  }

  const prevTip = ctx.prevTip;
  const outDir = ctx.outDir;
  const inspected = inspectEngineDataRepo(prevTip, run);
  if (!inspected.ok) {
    return fail(inspected.note, { gitRoot: inspected.gitRoot || null, branch: inspected.branch || null });
  }

  const { gitRoot, branch } = inspected;
  const writeSnapshots = Boolean(args["write-snapshots"] || args.writeSnapshots);
  let copies;
  try {
    copies = listHotOnlyCopies(outDir, prevTip, { writeSnapshots });
  } catch (err) {
    return fail(err.message);
  }
  if (!copies.length) {
    return fail("live push: no hot-only artifacts to copy");
  }

  const rels = [];
  for (const item of copies) {
    const rel = posixRel(gitRoot, item.to);
    if (!isHotOnlyRel(rel)) {
      return fail(`refusing to stage non-hot path: ${rel}`);
    }
    rels.push(rel);
  }

  copyListed(copies);

  const headBefore = git(run, gitRoot, ["rev-parse", "HEAD"]);
  const beforeSha = headBefore.status === 0 ? headBefore.stdout.trim() : null;

  const add = git(run, gitRoot, ["add", "--", ...rels]);
  if (add.status !== 0) {
    return fail(`git add failed: ${(add.stderr || add.stdout || "").trim()}`, { files: rels });
  }

  const status = git(run, gitRoot, ["status", "--porcelain", "--", ...rels]);
  if (status.status !== 0) {
    return fail(`git status failed: ${(status.stderr || status.stdout || "").trim()}`, { files: rels });
  }
  if (!status.stdout.trim()) {
    return fail("nothing to commit after hot-only copy (worktree already matches staging)", { files: rels, sha: beforeSha });
  }

  const computedAt = ctx.hot?.computedAt || "hot-tick";
  const message = `r1h: hot-tick ${computedAt}\n\n#58 D2 live push (${rels.join(", ")} only). Branch ${ENGINE_DATA_BRANCH} only; do not merge main.`;
  const commit = git(run, gitRoot, ["commit", "-m", message, "--", ...rels]);
  if (commit.status !== 0) {
    return fail(`git commit failed: ${(commit.stderr || commit.stdout || "").trim()}`, { files: rels });
  }

  const headAfter = git(run, gitRoot, ["rev-parse", "HEAD"]);
  const sha = headAfter.status === 0 ? headAfter.stdout.trim() : null;

  const push = git(run, gitRoot, ["push", "origin", `refs/heads/${ENGINE_DATA_BRANCH}:refs/heads/${ENGINE_DATA_BRANCH}`]);
  if (push.status !== 0) {
    if (beforeSha) git(run, gitRoot, ["reset", "--hard", beforeSha]);
    return fail(`git push origin ${ENGINE_DATA_BRANCH} failed: ${(push.stderr || push.stdout || "").trim()}`, {
      files: rels,
      sha,
      branch,
    });
  }

  const repo = dispatchRepo(env);
  const sinceMs = Date.now();
  const payload = [
    "--method",
    "POST",
    `repos/${repo}/dispatches`,
    "-f",
    `event_type=${DISPATCH_EVENT}`,
    "-f",
    "client_payload[source]=r1h",
  ];
  if (sha) {
    payload.push("-f", `client_payload[sha]=${sha}`);
  }
  if (computedAt) {
    payload.push("-f", `client_payload[computed_at]=${computedAt}`);
  }
  const dispatched = run("gh", ["api", ...payload]);
  if (dispatched.status !== 0) {
    return {
      pushed: true,
      dispatched: false,
      pages_run_id: null,
      note: `pushed origin/${ENGINE_DATA_BRANCH}@${sha || "unknown"} but repository_dispatch failed: ${(dispatched.stderr || dispatched.stdout || "").trim()}`,
      sha,
      branch,
      repo,
      files: rels,
    };
  }

  const pollTries = Number(ctx.pollTries ?? env.FT_R1H_DISPATCH_POLL_TRIES ?? 5);
  const pollMs = Number(ctx.pollMs ?? env.FT_R1H_DISPATCH_POLL_MS ?? 1000);
  const looked = lookupPagesRunId({
    run,
    repo,
    sinceMs,
    sleep,
    pollTries: Number.isFinite(pollTries) && pollTries > 0 ? pollTries : 1,
    pollMs: Number.isFinite(pollMs) ? pollMs : 0,
  });

  return {
    pushed: true,
    dispatched: true,
    pages_run_id: looked.id,
    note: looked.id
      ? `pushed origin/${ENGINE_DATA_BRANCH}@${sha || "unknown"} and dispatched ${DISPATCH_EVENT} (pages_run_id=${looked.id})`
      : `pushed origin/${ENGINE_DATA_BRANCH}@${sha || "unknown"} and dispatched ${DISPATCH_EVENT}; Pages run id not yet visible`,
    sha,
    branch,
    repo,
    files: rels,
  };
}
