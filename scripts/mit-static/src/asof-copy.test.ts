import assert from "node:assert/strict";
import { asofParts, asofPlainText, asofStale, formatBeijing } from "./asof-copy.ts";

assert.equal(formatBeijing("2026-10-21T12:27:39+08:00"), "2026-10-21 12:27");
assert.equal(formatBeijing("2026-10-21T05:27:39.000Z"), "2026-10-21 13:27");
assert.equal(formatBeijing(""), "");

const both = asofParts("2026-10-21T12:27:39+08:00", "2026-10-21T13:20:00+08:00");
assert.equal(both.dataLine, "数据截至 2026-10-21 12:27（北京时间）");
assert.equal(both.publishLine, "上次发布 2026-10-21 13:20（北京时间）");
assert.equal(both.stale, false);

const onlyData = asofParts("2026-10-21T12:27:39+08:00", "");
assert.equal(onlyData.dataLine, "数据截至 2026-10-21 12:27（北京时间）");
assert.equal(onlyData.publishLine, "");
assert.equal(onlyData.stale, false);

const stale = asofParts("2026-10-21T06:00:00+08:00", "2026-10-21T13:00:01+08:00");
assert.equal(stale.stale, true);
assert.equal(
  asofPlainText("2026-10-21T06:00:00+08:00", "2026-10-21T13:00:01+08:00"),
  "数据截至 2026-10-21 06:00（北京时间） · 上次发布 2026-10-21 13:00（北京时间） · 数据可能已过期",
);
assert.equal(asofStale("2026-10-21T06:00:00+08:00", "2026-10-21T12:00:00+08:00"), false);
assert.equal(asofStale("2026-10-21T06:00:00+08:00", "2026-10-21T12:00:01+08:00"), true);

console.log("asof-copy.test.ts ok");
