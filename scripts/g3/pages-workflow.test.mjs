import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { DISPATCH_EVENT } from "./skip_scheduled_noop.mjs";
import { DISPATCH_EVENT as LIVE_DISPATCH_EVENT } from "../r1h/live_push.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const yaml = readFileSync(join(root, ".github", "workflows", "pages.yml"), "utf8");

describe("pages.yml G3 free-path hooks", () => {
  it("keeps repository_dispatch wired to R1h / R1 event_type", () => {
    assert.match(yaml, /repository_dispatch:/);
    assert.match(yaml, /types:\s*\[engine-data-updated\]/);
    assert.equal(DISPATCH_EVENT, LIVE_DISPATCH_EVENT);
    assert.match(yaml, new RegExp(DISPATCH_EVENT));
  });

  it("uses 15 min business-hour cron and a coarser night cron", () => {
    assert.match(yaml, /cron:\s*"0,15,30,45 0-15 \* \* \*"/);
    assert.match(yaml, /cron:\s*"40 16-23 \* \* \*"/);
    assert.doesNotMatch(yaml, /cron:\s*"40 \* \* \* \*"/);
    assert.doesNotMatch(yaml, /实时热度|真·5min/);
  });

  it("skips scheduled no-op via the G3 helper and still deploys on dispatch", () => {
    assert.match(yaml, /scripts\/g3\/skip_scheduled_noop\.mjs/);
    assert.match(yaml, /steps\.g3\.outputs\.skip/);
    assert.match(yaml, /needs\.build\.outputs\.skip/);
    assert.match(yaml, /cancel-in-progress:\s*false/);
  });
});
