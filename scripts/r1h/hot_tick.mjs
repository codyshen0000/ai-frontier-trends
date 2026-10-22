#!/usr/bin/env node
/**
 * R1h / hot-tick (Task #58 D0+D1).
 *
 * Default is dry-run: recompute hot.json, hash-compare against --prev-tip,
 * apply debounce / Max N, write evidence. Never collect, never import
 * editorial outbox, never push origin/engine-data, never dispatch Pages.
 *
 * Live push requires ENABLE_PUSH=1 AND FT_R1H_ALLOW_LIVE=1 AND --push
 * (still refused unless all three are set; this PR keeps that off).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  MAX_DEPLOYS_PER_HOUR,
  acquireLock,
  appendDeployEvent,
  contentHash,
  defaultEngineDir,
  enableLivePush,
  evaluateThrottle,
  inBusinessWindow,
  listBoxHints,
  parseArgs,
  patchHotMeta,
  rankHotFromEngine,
  readDeployEvents,
  readJson,
  refuseLiveSideEffects,
  releaseLock,
  requirePrevTip,
  resolveCounterPath,
  resolveEvidenceDir,
  resolveLockPath,
  writeEvidence,
  writeJson,
} from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

function usage() {
  return `R1h / hot-tick — recompute hot.json only (no collect, no outbox import).

Usage:
  node scripts/r1h/hot_tick.mjs --prev-tip <engine-dir> [options]

Required:
  --prev-tip DIR     Current tip / last good site-data (MUST; cover preserve)

Options:
  --engine-dir DIR   Local engine tree to read (default: --prev-tip, else data/engine/v1)
  --out DIR          Staging dir for hot.json + meta.json (default: <evidence>/staging)
  --at ISO           Recompute timestamp (default: now / tip computedAt)
  --evidence-dir DIR Evidence JSON directory
  --lock PATH        Shared R1/R1h lock (default: /workspace/ops/l4-r1-lock)
  --counter PATH     Pages deploy JSONL (default: /workspace/ops/r1h/pages-deploys.jsonl)
  --rescan-events    Also rank eligible events not already on the board
  --write-snapshots  Opt-in hot-snapshots write (default: no)
  --force-window     Ignore 08:00–23:00 Asia/Shanghai (still no push by default)
  --skip-lock        Test-only: do not take the shared lock
  --push             Request live push (still needs ENABLE_PUSH=1 and FT_R1H_ALLOW_LIVE=1)
  --json             Print the evidence record as JSON

Default ENABLE_PUSH=0. Dry-run never git-pushes or repository_dispatches.
`;
}

function resolveOutDir(args, evidenceDir) {
  if (args.out) return args.out;
  return join(evidenceDir, "staging");
}

function writeHotOnly(outDir, hot, meta) {
  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, "hot.json"), hot);
  if (meta) writeJson(join(outDir, "meta.json"), meta);
}

function runBoxRank(cmd, { prevTip, outDir, at }) {
  const expanded = cmd
    .replaceAll("{prevTip}", prevTip)
    .replaceAll("{out}", outDir)
    .replaceAll("{at}", at || "");
  const result = spawnSync(expanded, {
    shell: true,
    encoding: "utf8",
    cwd: repoRoot,
    env: process.env,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    cmd: expanded,
  };
}

function tryLivePush(_ctx) {
  // Intentionally not implemented as a silent network action in this PR.
  // Triple-gated; even when requested we refuse unless FT_R1H_ALLOW_LIVE=1,
  // and then we still only document the existing R1 publish-no-wait commands
  // rather than executing them from CI or a default cron.
  return {
    pushed: false,
    dispatched: false,
    pages_run_id: null,
    note: "live push is gated off in this PR; use R1 publish-no-wait after 总控 enable",
  };
}

export function runHotTick(rawArgv = process.argv.slice(2), env = process.env, { now = Date.now(), cwd = repoRoot } = {}) {
  const args = parseArgs(rawArgv, {});
  if (args.help || args.h) {
    return { ok: true, help: usage() };
  }

  const prevTip = args["prev-tip"] || args.prevTip;
  requirePrevTip(prevTip);

  const engineDir = args["engine-dir"] || args.engineDir || prevTip || defaultEngineDir(env, cwd);
  if (!existsSync(join(engineDir, "hot.json"))) {
    throw new Error(`engine-dir missing hot.json: ${engineDir}`);
  }

  const evidenceDir = args["evidence-dir"] || args.evidenceDir || resolveEvidenceDir(env, cwd);
  const counterPath = args.counter || resolveCounterPath(env, cwd);
  const lockPath = args.lock || resolveLockPath(env, cwd);
  const outDir = resolveOutDir(args, evidenceDir);
  const triggerAt = new Date(now).toISOString();
  const box = listBoxHints(env);
  const windowOk = args["force-window"] || inBusinessWindow(new Date(now));

  const record = {
    trigger_at: triggerAt,
    hash_before: null,
    hash_after: null,
    decision: null,
    pages_run_id: null,
    window_ok: Boolean(windowOk),
    enable_push: env.ENABLE_PUSH === "1",
    allow_live: env.FT_R1H_ALLOW_LIVE === "1",
    prev_tip: prevTip,
    engine_dir: engineDir,
    out_dir: outDir,
    lock_path: lockPath,
    counter_path: counterPath,
    box,
    collected: false,
    imported_outbox: false,
    wrote_hot_snapshots: false,
    wrote_daily_or_feeds: false,
  };

  let lockHeld = false;
  try {
    if (!args["skip-lock"]) {
      const lock = acquireLock(lockPath, { holder: "r1h", now, reason: "hot-tick" });
      if (!lock.ok) {
        record.decision = "skipped_r1_lock";
        record.lock = lock;
        record.pages_run_id = null;
        writeEvidence(evidenceDir, record);
        return { ok: true, record, evidence: join(evidenceDir, "latest.json") };
      }
      lockHeld = true;
    }

    const tipHot = readJson(join(prevTip, "hot.json"));
    record.hash_before = contentHash(tipHot);

    const at = args.at || undefined;
    let hot;
    if (box.rankCmd) {
      const ran = runBoxRank(box.rankCmd, { prevTip, outDir, at });
      record.box_rank = { ok: ran.ok, status: ran.status, cmd: ran.cmd };
      if (!ran.ok) {
        record.decision = "error";
        record.error = ran.stderr || ran.stdout || "FT_R1H_RANK_CMD failed";
        writeEvidence(evidenceDir, record);
        return { ok: false, record };
      }
      hot = readJson(join(outDir, "hot.json"));
    } else {
      hot = rankHotFromEngine(engineDir, {
        at,
        rescanEvents: Boolean(args["rescan-events"]),
        prevTipDir: prevTip,
      });
    }

    if (args["write-snapshots"]) {
      record.wrote_hot_snapshots = true;
    }

    const tipMeta = existsSync(join(prevTip, "meta.json")) ? readJson(join(prevTip, "meta.json")) : {};
    const meta = patchHotMeta(tipMeta, {
      computedAt: hot.computedAt,
      hotEntries: (hot.entries || []).length,
    });

    writeHotOnly(outDir, hot, meta);
    record.hash_after = contentHash(hot);
    record.hot_entries = (hot.entries || []).length;
    record.computed_at = hot.computedAt;

    if (record.hash_before === record.hash_after) {
      record.decision = "skipped_noop";
      record.pages_run_id = null;
      record.push = refuseLiveSideEffects();
      writeEvidence(evidenceDir, record);
      return { ok: true, record, evidence: join(evidenceDir, "latest.json") };
    }

    if (!windowOk) {
      record.decision = "skipped_window";
      record.pages_run_id = null;
      record.push = refuseLiveSideEffects();
      writeEvidence(evidenceDir, record);
      return { ok: true, record, evidence: join(evidenceDir, "latest.json") };
    }

    const events = readDeployEvents(counterPath);
    const throttle = evaluateThrottle({
      events,
      now,
      maxPerHour: Number(env.FT_R1H_MAX_N || MAX_DEPLOYS_PER_HOUR),
    });
    record.throttle = throttle;
    if (!throttle.ok) {
      record.decision = "throttled";
      record.pages_run_id = null;
      record.push = refuseLiveSideEffects();
      writeEvidence(evidenceDir, record);
      return { ok: true, record, evidence: join(evidenceDir, "latest.json") };
    }

    const live = enableLivePush(env, args);
    if (!live) {
      record.decision = "dry_run";
      record.pages_run_id = null;
      record.push = refuseLiveSideEffects();
      writeEvidence(evidenceDir, record);
      return { ok: true, record, evidence: join(evidenceDir, "latest.json") };
    }

    const pushed = tryLivePush({ prevTip, outDir, hot, env, args });
    record.decision = pushed.pushed ? "push" : "dry_run";
    record.pages_run_id = pushed.pages_run_id;
    record.push = pushed;
    if (pushed.pushed) {
      appendDeployEvent(counterPath, {
        at: triggerAt,
        source: "r1h",
        kind: "success",
        pages_run_id: pushed.pages_run_id,
      });
    }
    writeEvidence(evidenceDir, record);
    return { ok: true, record, evidence: join(evidenceDir, "latest.json") };
  } finally {
    if (lockHeld) releaseLock(lockPath);
  }
}

const isMain =
  !process.env.NODE_TEST_CONTEXT &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    const result = runHotTick();
    if (result.help) {
      process.stdout.write(result.help);
      process.exit(0);
    }
    if (process.argv.includes("--json") || process.argv.includes("--json=true")) {
      process.stdout.write(`${JSON.stringify(result.record, null, 2)}\n`);
    } else {
      const r = result.record;
      process.stdout.write(
        `R1h ${r.decision} trigger_at=${r.trigger_at} hash_before=${r.hash_before} hash_after=${r.hash_after} pages_run_id=${r.pages_run_id}\n`,
      );
    }
    process.exit(result.ok ? 0 : 1);
  } catch (err) {
    process.stderr.write(`R1h error: ${err.message}\n`);
    process.exit(2);
  }
}
