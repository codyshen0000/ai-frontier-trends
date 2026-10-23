import assert from "node:assert/strict";
import {
  DAILY_HASH_REDIRECT_JS,
  dailyIssueFile,
  dailyIssuePath,
  isDailyIssueKey,
  parseDailyIssueKey,
} from "./daily_paths.mjs";

assert.equal(isDailyIssueKey("2026-10-22"), true);
assert.equal(isDailyIssueKey("2026-10-2"), false);
assert.equal(isDailyIssueKey("archive"), false);
assert.equal(dailyIssueFile("2026-10-22"), "daily-2026-10-22.html");
assert.equal(dailyIssuePath("2026-10-22"), "/daily/2026-10-22/");
assert.equal(parseDailyIssueKey("/daily/2026-10-22"), "2026-10-22");
assert.equal(parseDailyIssueKey("/daily/2026-10-22/"), "2026-10-22");
assert.equal(parseDailyIssueKey("daily-2026-10-22.html"), "2026-10-22");
assert.equal(parseDailyIssueKey("/daily/archive"), null);
assert.equal(parseDailyIssueKey("/daily/"), null);
assert.match(DAILY_HASH_REDIRECT_JS, /#d-/);
assert.match(DAILY_HASH_REDIRECT_JS, /getElementById/);
assert.match(DAILY_HASH_REDIRECT_JS, /location\.replace/);

console.log("daily_paths tests passed");
