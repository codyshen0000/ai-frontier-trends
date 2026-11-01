import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  DISPATCH_EVENT,
  readStamp,
  readTipStamp,
  shouldSkipScheduled,
  runSkipScheduledNoop,
} from "./skip_scheduled_noop.mjs";
import { DISPATCH_EVENT as LIVE_DISPATCH_EVENT } from "../r1h/live_push.mjs";

describe("G3 skip scheduled no-op", () => {
  it("matches R1h repository_dispatch event_type", () => {
    assert.equal(DISPATCH_EVENT, "engine-data-updated");
    assert.equal(DISPATCH_EVENT, LIVE_DISPATCH_EVENT);
  });

  it("reads computedAt and ignores empty stamps", () => {
    assert.equal(readStamp({ computedAt: "2026-10-29T07:00:00.000Z" }), "2026-10-29T07:00:00.000Z");
    assert.equal(readStamp({ computed_at: "t2" }), "t2");
    assert.equal(readStamp({ data_as_of: "meta-only" }), null);
    assert.equal(readStamp({}), null);
  });

  it("never skips dispatch / push / workflow_dispatch", () => {
    const same = {
      tipStamp: "t1",
      liveStamp: "t1",
      liveFetchOk: true,
    };
    assert.deepEqual(shouldSkipScheduled({ eventName: "repository_dispatch", ...same }), {
      skip: false,
      reason: "not-schedule",
    });
    assert.deepEqual(shouldSkipScheduled({ eventName: "workflow_dispatch", ...same }), {
      skip: false,
      reason: "not-schedule",
    });
    assert.deepEqual(shouldSkipScheduled({ eventName: "push", ...same }), {
      skip: false,
      reason: "not-schedule",
    });
  });

  it("skips only when schedule and tip computedAt already equals live", () => {
    assert.deepEqual(
      shouldSkipScheduled({
        eventName: "schedule",
        tipStamp: "t1",
        liveStamp: "t1",
        liveFetchOk: true,
      }),
      { skip: true, reason: "same-computedAt" },
    );
    assert.deepEqual(
      shouldSkipScheduled({
        eventName: "schedule",
        tipStamp: "t2",
        liveStamp: "t1",
        liveFetchOk: true,
      }),
      { skip: false, reason: "tip-ahead" },
    );
    assert.deepEqual(
      shouldSkipScheduled({
        eventName: "schedule",
        tipStamp: "t1",
        liveStamp: null,
        liveFetchOk: false,
      }),
      { skip: false, reason: "live-unavailable-build" },
    );
  });

  it("reads tip stamp from a real hot.json file", () => {
    const dir = mkdtempSync(join(tmpdir(), "g3-tip-"));
    const path = join(dir, "hot.json");
    writeFileSync(path, `${JSON.stringify({ computedAt: "2026-10-21T05:20:00.000Z", entries: [] }, null, 2)}\n`);
    assert.equal(readTipStamp(path), "2026-10-21T05:20:00.000Z");
    assert.equal(readTipStamp(join(dir, "missing.json")), null);
  });

  it("CLI decision uses env event name and mocked live fetch", async () => {
    const dir = mkdtempSync(join(tmpdir(), "g3-run-"));
    writeFileSync(
      join(dir, "hot.json"),
      `${JSON.stringify({ computedAt: "same-stamp", entries: [] }, null, 2)}\n`,
    );
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ computedAt: "same-stamp" }),
    });
    const skipped = await runSkipScheduledNoop({
      env: {
        GITHUB_EVENT_NAME: "schedule",
        FT_ENGINE_DIR: dir,
        GITHUB_PAGES_HOT_URL: "https://example.test/hot.json",
      },
      cwd: dir,
      fetchImpl,
    });
    assert.equal(skipped.skip, true);
    assert.equal(skipped.reason, "same-computedAt");

    const dispatched = await runSkipScheduledNoop({
      env: {
        GITHUB_EVENT_NAME: "repository_dispatch",
        FT_ENGINE_DIR: dir,
      },
      cwd: dir,
      fetchImpl,
    });
    assert.equal(dispatched.skip, false);
    assert.equal(dispatched.reason, "not-schedule");
  });
});
