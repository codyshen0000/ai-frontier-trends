import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  DEBOUNCE_MS,
  MAX_DEPLOYS_PER_HOUR,
  acquireLock,
  contentHash,
  evaluateThrottle,
  inBusinessWindow,
  patchHotMeta,
  rankHotFromEngine,
  readJson,
  releaseLock,
  requirePrevTip,
  shanghaiMinutes,
  stripVolatile,
} from "./lib.mjs";
import { runHotTick } from "./hot_tick.mjs";
import { recordPagesDeploy } from "./record_pages_deploy.mjs";
import {
  ENGINE_DATA_BRANCH,
  DISPATCH_EVENT,
  DEFAULT_DISPATCH_REPO,
  listHotOnlyCopies,
  tryLivePush,
} from "./live_push.mjs";
import { enableLivePush, refuseLiveSideEffects } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_1700 = join(here, "..", "engine", "__samples__", "out-1700");

function tmp() {
  return mkdtempSync(join(tmpdir(), "r1h-"));
}

function writeLock(dir, holder, since, pid = 1) {
  const path = join(dir, "l4-r1-lock");
  writeFileSync(path, `${JSON.stringify({ holder, since, pid, reason: "test" }, null, 2)}\n`);
  return path;
}

describe("content hash (strip computedAt / volatile timestamps)", () => {
  it("is unchanged when only computedAt / generated timestamps move", () => {
    const a = {
      computedAt: "2026-10-22T00:00:00.000Z",
      windowHours: 48,
      entries: [{ rank: 1, story: { publicId: "x" }, heat: 10, spark: [1, 2] }],
    };
    const b = {
      computedAt: "2026-10-22T00:15:00.000Z",
      windowHours: 48,
      entries: [{ rank: 1, story: { publicId: "x" }, heat: 10, spark: [1, 2] }],
    };
    assert.equal(contentHash(a), contentHash(b));
    assert.ok(!("computedAt" in stripVolatile(a)));
  });

  it("changes when heat / badges / rank change", () => {
    const a = { computedAt: "t", entries: [{ rank: 1, heat: 10, badges: [] }] };
    const b = { computedAt: "t", entries: [{ rank: 1, heat: 10.1, badges: [] }] };
    const c = { computedAt: "t", entries: [{ rank: 1, heat: 10, badges: ["rising"] }] };
    assert.notEqual(contentHash(a), contentHash(b));
    assert.notEqual(contentHash(a), contentHash(c));
  });
});

describe("throttle (debounce + max 4/h including R1)", () => {
  const t0 = Date.parse("2026-10-22T04:00:00.000Z");

  it("debounces when last success is inside 7.5 minutes", () => {
    const events = [{ at: new Date(t0 - 5 * 60 * 1000).toISOString(), source: "r1h", kind: "success" }];
    const got = evaluateThrottle({ events, now: t0, debounceMs: DEBOUNCE_MS });
    assert.equal(got.ok, false);
    assert.equal(got.decision, "throttled");
    assert.equal(got.reason, "debounce");
  });

  it("allows a tick after the debounce window", () => {
    const events = [{ at: new Date(t0 - DEBOUNCE_MS - 1000).toISOString(), source: "r1h", kind: "success" }];
    const got = evaluateThrottle({ events, now: t0 });
    assert.equal(got.ok, true);
  });

  it("counts R1 successes toward Max N=4", () => {
    const events = [10, 20, 30, 40].map((min) => ({
      at: new Date(t0 - min * 60 * 1000).toISOString(),
      source: "r1",
      kind: "success",
      pages_run_id: String(min),
    }));
    const got = evaluateThrottle({ events, now: t0, debounceMs: 0, maxPerHour: MAX_DEPLOYS_PER_HOUR });
    assert.equal(got.ok, false);
    assert.equal(got.reason, "max_deploys_per_hour");
    assert.equal(got.count, 4);
  });

  it("ignores successes older than one hour", () => {
    const events = [
      { at: new Date(t0 - 61 * 60 * 1000).toISOString(), source: "r1", kind: "success" },
      { at: new Date(t0 - 10 * 60 * 1000).toISOString(), source: "r1h", kind: "success" },
    ];
    const got = evaluateThrottle({ events, now: t0, debounceMs: 0 });
    assert.equal(got.ok, true);
    assert.equal(got.count, 1);
  });

  it("backs off after a Pages failure", () => {
    const events = [{ at: new Date(t0 - 5 * 60 * 1000).toISOString(), source: "r1h", kind: "failure" }];
    const got = evaluateThrottle({ events, now: t0, debounceMs: 0 });
    assert.equal(got.ok, false);
    assert.equal(got.reason, "failure_backoff");
  });
});

describe("shared R1 lock", () => {
  it("skips when R1 holds a fresh lock", () => {
    const dir = tmp();
    try {
      const lockPath = writeLock(dir, "r1", new Date().toISOString(), 99);
      const got = acquireLock(lockPath, { holder: "r1h", now: Date.now() });
      assert.equal(got.ok, false);
      assert.equal(got.reason, "r1_holds");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("steals a stale lock and releases its own", () => {
    const dir = tmp();
    try {
      const lockPath = writeLock(dir, "r1", new Date(Date.now() - 40 * 60 * 1000).toISOString(), 99);
      const got = acquireLock(lockPath, { holder: "r1h", now: Date.now() });
      assert.equal(got.ok, true);
      assert.equal(releaseLock(lockPath), true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("business window", () => {
  it("is closed at 07:59 and open at 08:00 Asia/Shanghai", () => {
    assert.equal(inBusinessWindow(new Date("2026-10-22T23:59:00.000Z")), false); // 07:59 CST
    assert.equal(inBusinessWindow(new Date("2026-10-23T00:00:00.000Z")), true); // 08:00 CST
    assert.equal(inBusinessWindow(new Date("2026-10-23T15:00:00.000Z")), true); // 23:00 CST
    assert.equal(inBusinessWindow(new Date("2026-10-23T15:01:00.000Z")), false); // 23:01 CST
    assert.ok(shanghaiMinutes(new Date("2026-10-23T00:00:00.000Z")) === 8 * 60);
  });
});

describe("rankHotFromEngine (heat.mjs equivalent)", () => {
  it("recomputes out-1700 at its own computedAt without dropping the story", () => {
    const tip = readJson(join(OUT_1700, "hot.json"));
    const hot = rankHotFromEngine(OUT_1700, { at: tip.computedAt, prevTipDir: OUT_1700 });
    assert.equal(hot.entries.length, 1);
    assert.equal(hot.entries[0].story.publicId, "2026-10-19-deepseek-v41-flash-1017");
    assert.equal(typeof hot.entries[0].heat, "number");
  });
});

describe("prev-tip is mandatory", () => {
  it("throws without --prev-tip", () => {
    assert.throws(() => requirePrevTip(undefined), /prev-tip/);
  });
});

describe("hot_tick dry-run CLI", () => {
  it("writes evidence and never pushes; second tick with same staging is skipped_noop", () => {
    const dir = tmp();
    try {
      const evidenceDir = join(dir, "evidence");
      const lock = join(dir, "lock");
      const counter = join(dir, "counter.jsonl");
      const out = join(dir, "out");
      const tip = readJson(join(OUT_1700, "hot.json"));
      const common = [
        "--engine-dir",
        OUT_1700,
        "--at",
        tip.computedAt,
        "--evidence-dir",
        evidenceDir,
        "--lock",
        lock,
        "--counter",
        counter,
        "--out",
        out,
        "--force-window",
      ];
      const first = runHotTick(["--prev-tip", OUT_1700, ...common], { ENABLE_PUSH: "0" }, { now: Date.parse("2026-10-23T04:00:00.000Z") });
      assert.equal(first.ok, true);
      assert.ok(["skipped_noop", "dry_run"].includes(first.record.decision));
      assert.equal(first.record.pages_run_id, null);
      assert.equal(first.record.collected, false);
      assert.equal(first.record.imported_outbox, false);
      assert.equal(first.record.wrote_daily_or_feeds, false);
      assert.equal(first.record.push.pushed, false);
      assert.equal(first.record.push.dispatched, false);
      const second = runHotTick(["--prev-tip", out, ...common], { ENABLE_PUSH: "0" }, { now: Date.parse("2026-10-23T04:01:00.000Z") });
      assert.equal(second.ok, true);
      assert.equal(second.record.decision, "skipped_noop");
      assert.equal(second.record.hash_before, second.record.hash_after);
      assert.equal(second.record.pages_run_id, null);
      const latest = JSON.parse(readFileSync(join(evidenceDir, "latest.json"), "utf8"));
      assert.equal(latest.decision, "skipped_noop");
      assert.ok(latest.trigger_at);
      assert.ok(latest.hash_before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ENABLE_PUSH=1 without FT_R1H_ALLOW_LIVE still does not push", () => {
    const dir = tmp();
    try {
      const later = "2026-10-19T14:00:00.000Z";
      const result = runHotTick(
        [
          "--prev-tip",
          OUT_1700,
          "--engine-dir",
          OUT_1700,
          "--at",
          later,
          "--evidence-dir",
          join(dir, "evidence"),
          "--lock",
          join(dir, "lock"),
          "--counter",
          join(dir, "counter.jsonl"),
          "--out",
          join(dir, "out"),
          "--force-window",
          "--push",
        ],
        { ENABLE_PUSH: "1" },
        { now: Date.parse("2026-10-23T04:00:00.000Z") },
      );
      assert.equal(result.ok, true);
      assert.ok(["dry_run", "skipped_noop"].includes(result.record.decision));
      assert.equal(result.record.pages_run_id, null);
      assert.equal(result.record.push.pushed, false);
      assert.equal(result.record.allow_live, false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stays dry_run (no push/dispatch) when content changes and ENABLE_PUSH is unset", () => {
    const dir = tmp();
    try {
      const later = "2026-10-19T14:00:00.000Z";
      const result = runHotTick(
        [
          "--prev-tip",
          OUT_1700,
          "--engine-dir",
          OUT_1700,
          "--at",
          later,
          "--evidence-dir",
          join(dir, "evidence"),
          "--lock",
          join(dir, "lock"),
          "--counter",
          join(dir, "counter.jsonl"),
          "--out",
          join(dir, "out"),
          "--force-window",
          "--push",
        ],
        { ENABLE_PUSH: "0" },
        { now: Date.parse("2026-10-23T04:00:00.000Z") },
      );
      assert.equal(result.ok, true);
      assert.ok(["dry_run", "skipped_noop"].includes(result.record.decision));
      if (result.record.decision === "dry_run") {
        assert.notEqual(result.record.hash_before, result.record.hash_after);
      }
      assert.equal(result.record.pages_run_id, null);
      assert.equal(result.record.push.pushed, false);
      assert.equal(result.record.push.dispatched, false);
      assert.ok(existsSync(join(dir, "out", "hot.json")));
      assert.ok(existsSync(join(dir, "out", "meta.json")));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throttles when the shared counter already has 4 successes this hour", () => {
    const dir = tmp();
    try {
      const now = Date.parse("2026-10-23T04:00:00.000Z");
      const counter = join(dir, "counter.jsonl");
      for (const source of ["r1", "r1", "r1h", "r1"]) {
        recordPagesDeploy(
          ["--source", source, "--kind", "success", "--counter", counter, "--at", new Date(now - 20 * 60 * 1000).toISOString()],
          {},
          { now, cwd: dir },
        );
      }
      const later = "2026-10-19T14:00:00.000Z";
      const result = runHotTick(
        [
          "--prev-tip",
          OUT_1700,
          "--engine-dir",
          OUT_1700,
          "--at",
          later,
          "--evidence-dir",
          join(dir, "evidence"),
          "--lock",
          join(dir, "lock"),
          "--counter",
          counter,
          "--out",
          join(dir, "out"),
          "--force-window",
        ],
        { ENABLE_PUSH: "0" },
        { now },
      );
      assert.equal(result.ok, true);
      if (result.record.hash_before === result.record.hash_after) {
        assert.equal(result.record.decision, "skipped_noop");
      } else {
        assert.equal(result.record.decision, "throttled");
        assert.equal(result.record.throttle.reason, "max_deploys_per_hour");
      }
      assert.equal(result.record.pages_run_id, null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips when R1 holds the shared lock", () => {
    const dir = tmp();
    try {
      const lock = writeLock(dir, "r1", new Date().toISOString(), 4242);
      const result = runHotTick(
        [
          "--prev-tip",
          OUT_1700,
          "--engine-dir",
          OUT_1700,
          "--evidence-dir",
          join(dir, "evidence"),
          "--lock",
          lock,
          "--counter",
          join(dir, "counter.jsonl"),
          "--out",
          join(dir, "out"),
          "--force-window",
        ],
        { ENABLE_PUSH: "0" },
        { now: Date.now() },
      );
      assert.equal(result.record.decision, "skipped_r1_lock");
      assert.equal(result.record.pages_run_id, null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips light-loop push outside the business window", () => {
    const dir = tmp();
    try {
      const later = "2026-10-19T14:00:00.000Z";
      const result = runHotTick(
        [
          "--prev-tip",
          OUT_1700,
          "--engine-dir",
          OUT_1700,
          "--at",
          later,
          "--evidence-dir",
          join(dir, "evidence"),
          "--lock",
          join(dir, "lock"),
          "--counter",
          join(dir, "counter.jsonl"),
          "--out",
          join(dir, "out"),
        ],
        { ENABLE_PUSH: "0" },
        { now: Date.parse("2026-10-22T23:30:00.000Z") }, // 07:30 CST
      );
      assert.equal(result.ok, true);
      assert.ok(["skipped_window", "skipped_noop"].includes(result.record.decision));
      if (result.record.decision === "skipped_window") {
        assert.equal(result.record.window_ok, false);
      }
      assert.equal(result.record.pages_run_id, null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses to run without --prev-tip", () => {
    assert.throws(() => runHotTick(["--engine-dir", OUT_1700], { ENABLE_PUSH: "0" }), /prev-tip/);
  });
});

describe("meta patch is hot-only", () => {
  it("updates hot_computed_at / generated_at / counts.hot_entries and leaves data_as_of", () => {
    const next = patchHotMeta(
      { data_as_of: "keep", generated_at: "old", hot_computed_at: "old", counts: { cards: 6, hot_entries: 4 } },
      { computedAt: "new", hotEntries: 8 },
    );
    assert.equal(next.data_as_of, "keep");
    assert.equal(next.hot_computed_at, "new");
    assert.equal(next.generated_at, "new");
    assert.equal(next.counts.hot_entries, 8);
    assert.equal(next.counts.cards, 6);
  });
});

describe("cover preserve from --prev-tip", () => {
  it("keeps a same-origin tip cover on the listed story", () => {
    const dir = tmp();
    try {
      cpSync(OUT_1700, dir, { recursive: true });
      const tipHot = readJson(join(dir, "hot.json"));
      tipHot.entries[0].cover = {
        url: "assets/covers/deepseek-v41.webp",
        width: 800,
        height: 400,
        alt: "keep me",
        valueClass: "product_screenshot",
      };
      writeFileSync(join(dir, "hot.json"), `${JSON.stringify(tipHot, null, 2)}\n`);
      const hot = rankHotFromEngine(dir, { at: tipHot.computedAt, prevTipDir: dir });
      assert.equal(hot.entries[0].cover.url, "assets/covers/deepseek-v41.webp");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("record_pages_deploy", () => {
  it("appends a JSONL line R1 can share with R1h", () => {
    const dir = tmp();
    try {
      mkdirSync(dir, { recursive: true });
      const counter = join(dir, "pages-deploys.jsonl");
      const got = recordPagesDeploy(
        ["--source", "r1", "--kind", "success", "--pages-run-id", "39822780150", "--counter", counter],
        {},
        { now: Date.parse("2026-10-23T01:05:00.000Z"), cwd: dir },
      );
      assert.equal(got.event.source, "r1");
      assert.equal(got.event.pages_run_id, "39822780150");
      const lines = readFileSync(counter, "utf8").trim().split("\n");
      assert.equal(lines.length, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("D2 live push (mocked git/gh, no network)", () => {
  const liveEnv = { ENABLE_PUSH: "1", FT_R1H_ALLOW_LIVE: "1" };
  const liveArgs = { push: true };

  function seedTip(dir) {
    const tip = join(dir, "data", "engine", "v1");
    mkdirSync(tip, { recursive: true });
    writeFileSync(join(tip, "hot.json"), `${JSON.stringify({ computedAt: "old", entries: [{ heat: 1 }] }, null, 2)}\n`);
    writeFileSync(join(tip, "meta.json"), `${JSON.stringify({ data_as_of: "keep", generated_at: "old" }, null, 2)}\n`);
    writeFileSync(join(tip, "daily.json"), `${JSON.stringify({ keep: true }, null, 2)}\n`);
    writeFileSync(join(tip, "feed.json"), `${JSON.stringify({ keep: true }, null, 2)}\n`);
    return tip;
  }

  function seedStaging(dir, { snapshots = false } = {}) {
    const out = join(dir, "staging");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "hot.json"), `${JSON.stringify({ computedAt: "new", entries: [{ heat: 9 }] }, null, 2)}\n`);
    writeFileSync(join(out, "meta.json"), `${JSON.stringify({ data_as_of: "keep", generated_at: "new", hot_computed_at: "new" }, null, 2)}\n`);
    writeFileSync(join(out, "daily.json"), `${JSON.stringify({ leaked: true }, null, 2)}\n`);
    if (snapshots) {
      mkdirSync(join(out, "hot-snapshots"), { recursive: true });
      writeFileSync(join(out, "hot-snapshots", "2026-10-23T04.json"), `${JSON.stringify({ snap: true }, null, 2)}\n`);
    }
    return out;
  }

  function mockGitGh({ branch = ENGINE_DATA_BRANCH, pagesRunId = "42424242" } = {}) {
    const calls = [];
    const run = (cmd, args = []) => {
      calls.push([cmd, ...args]);
      if (cmd === "git" && args.includes("rev-parse") && args.includes("--abbrev-ref")) {
        return { status: 0, stdout: `${branch}\n`, stderr: "" };
      }
      if (cmd === "git" && args.includes("rev-parse") && args.includes("HEAD")) {
        return { status: 0, stdout: "abc123def\n", stderr: "" };
      }
      if (cmd === "git" && args.includes("status")) {
        return { status: 0, stdout: "M data/engine/v1/hot.json\n", stderr: "" };
      }
      if (cmd === "git") {
        return { status: 0, stdout: "ok\n", stderr: "" };
      }
      if (cmd === "gh" && args[0] === "api") {
        return { status: 0, stdout: "", stderr: "" };
      }
      if (cmd === "gh" && args[0] === "run") {
        return {
          status: 0,
          stdout: JSON.stringify([
            { databaseId: Number(pagesRunId), createdAt: new Date().toISOString(), event: "repository_dispatch", status: "queued" },
          ]),
          stderr: "",
        };
      }
      return { status: 1, stdout: "", stderr: `unexpected ${cmd}` };
    };
    return { calls, run };
  }

  it("enableLivePush still requires the three flags together", () => {
    assert.equal(enableLivePush({ ENABLE_PUSH: "1", FT_R1H_ALLOW_LIVE: "1" }, { push: true }), true);
    assert.equal(enableLivePush({ ENABLE_PUSH: "1", FT_R1H_ALLOW_LIVE: "1" }, {}), false);
    assert.equal(enableLivePush({ ENABLE_PUSH: "1" }, { push: true }), false);
    assert.equal(enableLivePush({ FT_R1H_ALLOW_LIVE: "1" }, { push: true }), false);
  });

  it("tryLivePush without the triple gate still refuses (not a live stub)", () => {
    const refused = tryLivePush({ prevTip: OUT_1700, outDir: OUT_1700, env: { ENABLE_PUSH: "0" }, args: { push: true } });
    assert.equal(refused.pushed, false);
    assert.equal(refused.dispatched, false);
    assert.equal(refused.pages_run_id, null);
    assert.equal(refused.note, refuseLiveSideEffects().note);
    assert.ok(!/gated off in this PR/i.test(refused.note));
  });

  it("copies only hot.json + meta.json and pushes engine-data + dispatch", () => {
    const dir = tmp();
    try {
      writeFileSync(join(dir, ".git"), "gitdir: fake\n");
      const tip = seedTip(dir);
      const out = seedStaging(dir, { snapshots: true });
      const dailyBefore = readFileSync(join(tip, "daily.json"), "utf8");
      const feedBefore = readFileSync(join(tip, "feed.json"), "utf8");
      const { calls, run } = mockGitGh();
      const got = tryLivePush({
        prevTip: tip,
        outDir: out,
        hot: { computedAt: "2026-10-23T04:00:00.000Z" },
        env: liveEnv,
        args: liveArgs,
        run,
        sleep: () => {},
        pollTries: 1,
        pollMs: 0,
      });
      assert.equal(got.pushed, true);
      assert.equal(got.dispatched, true);
      assert.equal(got.pages_run_id, "42424242");
      assert.ok(!/gated off in this PR/i.test(got.note));
      assert.match(got.note, /engine-data/);
      assert.equal(JSON.parse(readFileSync(join(tip, "hot.json"), "utf8")).entries[0].heat, 9);
      assert.equal(JSON.parse(readFileSync(join(tip, "meta.json"), "utf8")).hot_computed_at, "new");
      assert.equal(readFileSync(join(tip, "daily.json"), "utf8"), dailyBefore);
      assert.equal(readFileSync(join(tip, "feed.json"), "utf8"), feedBefore);
      assert.ok(!existsSync(join(tip, "hot-snapshots", "2026-10-23T04.json")));
      const joined = calls.map((row) => row.join(" "));
      assert.ok(calls.some((row) => row[0] === "git" && row.includes("push") && row.some((a) => String(a).includes(`refs/heads/${ENGINE_DATA_BRANCH}:refs/heads/${ENGINE_DATA_BRANCH}`))));
      assert.ok(!calls.some((row) => row[0] === "git" && row.includes("merge")));
      assert.ok(!calls.some((row) => row[0] === "git" && row.includes("push") && row.some((a) => a === "main" || String(a).includes("/main"))));
      assert.ok(joined.some((line) => line.includes("gh api") && line.includes(`event_type=${DISPATCH_EVENT}`)));
      assert.ok(joined.some((line) => line.includes(`repos/${DEFAULT_DISPATCH_REPO}/dispatches`)));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("copies hot-snapshots only when --write-snapshots is already set", () => {
    const dir = tmp();
    try {
      writeFileSync(join(dir, ".git"), "gitdir: fake\n");
      const tip = seedTip(dir);
      const out = seedStaging(dir, { snapshots: true });
      const { run } = mockGitGh();
      const got = tryLivePush({
        prevTip: tip,
        outDir: out,
        hot: { computedAt: "2026-10-23T04:00:00.000Z" },
        env: liveEnv,
        args: { push: true, "write-snapshots": true },
        run,
        sleep: () => {},
        pollTries: 1,
        pollMs: 0,
      });
      assert.equal(got.pushed, true);
      assert.equal(JSON.parse(readFileSync(join(tip, "hot-snapshots", "2026-10-23T04.json"), "utf8")).snap, true);
      assert.ok(got.files.some((rel) => rel.includes("hot-snapshots")));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses when --prev-tip sits on a non-engine-data branch (does not copy)", () => {
    const dir = tmp();
    try {
      writeFileSync(join(dir, ".git"), "gitdir: fake\n");
      const tip = seedTip(dir);
      const out = seedStaging(dir);
      const hotBefore = readFileSync(join(tip, "hot.json"), "utf8");
      const { calls, run } = mockGitGh({ branch: "main" });
      const got = tryLivePush({
        prevTip: tip,
        outDir: out,
        env: liveEnv,
        args: liveArgs,
        run,
        sleep: () => {},
      });
      assert.equal(got.pushed, false);
      assert.equal(got.dispatched, false);
      assert.equal(got.pages_run_id, null);
      assert.match(got.note, /not engine-data/);
      assert.equal(readFileSync(join(tip, "hot.json"), "utf8"), hotBefore);
      assert.ok(!calls.some((row) => row[0] === "git" && row.includes("push")));
      assert.ok(!calls.some((row) => row[0] === "gh"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("listHotOnlyCopies never includes daily/feeds; snapshots only when flagged", () => {
    const dir = tmp();
    try {
      const dest = seedTip(dir);
      const out = seedStaging(dir, { snapshots: true });
      const basic = listHotOnlyCopies(out, dest, { writeSnapshots: false }).map((c) => c.to);
      assert.ok(basic.some((p) => p.endsWith("hot.json")));
      assert.ok(basic.some((p) => p.endsWith("meta.json")));
      assert.ok(basic.every((p) => !p.endsWith("daily.json") && !p.endsWith("feed.json")));
      const withSnap = listHotOnlyCopies(out, dest, { writeSnapshots: true }).map((c) => c.to);
      assert.ok(withSnap.some((p) => p.includes("hot-snapshots")));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("hot_tick live path records r1h via record_pages_deploy and is not the gated-off stub", () => {
    const dir = tmp();
    try {
      writeFileSync(join(dir, ".git"), "gitdir: fake\n");
      const tip = join(dir, "tip");
      cpSync(OUT_1700, tip, { recursive: true });
      writeFileSync(join(tip, "daily.json"), `${JSON.stringify({ keep: true }, null, 2)}\n`);
      const { run } = mockGitGh({ pagesRunId: "555666777" });
      const later = "2026-10-19T14:00:00.000Z";
      const result = runHotTick(
        [
          "--prev-tip",
          tip,
          "--engine-dir",
          OUT_1700,
          "--at",
          later,
          "--evidence-dir",
          join(dir, "evidence"),
          "--lock",
          join(dir, "lock"),
          "--counter",
          join(dir, "counter.jsonl"),
          "--out",
          join(dir, "out"),
          "--force-window",
          "--push",
        ],
        { ENABLE_PUSH: "1", FT_R1H_ALLOW_LIVE: "1", FT_R1H_DISPATCH_POLL_TRIES: "1", FT_R1H_DISPATCH_POLL_MS: "0" },
        { now: Date.parse("2026-10-23T04:00:00.000Z"), run, sleep: () => {} },
      );
      assert.notEqual(result.record.hash_before, result.record.hash_after);
      assert.equal(result.ok, true);
      assert.equal(result.record.decision, "push");
      assert.equal(result.record.pages_run_id, "555666777");
      assert.equal(result.record.push.pushed, true);
      assert.equal(result.record.push.dispatched, true);
      assert.ok(!/gated off in this PR/i.test(result.record.push.note));
      assert.equal(JSON.parse(readFileSync(join(tip, "daily.json"), "utf8")).keep, true);
      const lines = readFileSync(join(dir, "counter.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
      assert.equal(lines.at(-1).source, "r1h");
      assert.equal(lines.at(-1).kind, "success");
      assert.equal(lines.at(-1).pages_run_id, "555666777");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
