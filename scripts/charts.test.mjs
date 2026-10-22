import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { signalRows, weightsStatus } from "./charts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("signalRows", () => {
  it("counts dated evidence rows under the four public signal tables", () => {
    const md = readFileSync(join(root, "content", "signals-tracker.md"), "utf8");
    const rows = signalRows(md);
    assert.equal(rows.length, 4);
    assert.match(rows[0].label, /无老师少步生成/);
    assert.equal(rows[0].value, 1);
    assert.match(rows[1].label, /差距在数据/);
    assert.equal(rows[1].value, 1);
    assert.match(rows[2].label, /绕开原版 DMD/);
    assert.equal(rows[2].value, 2);
    assert.match(rows[3].label, /世界模型里做 RL/);
    assert.equal(rows[3].value, 0);
  });
});

describe("weightsStatus", () => {
  it("treats store-style bold dates as delivered", () => {
    const md = `| 模型 | 宣布情况 | 官方承诺时间 | 实际交付日期 | 备注 |
|---|---|---|---|---|
| FLUX 3 | 开源 | coming weeks | **2026-10-15**（Klein） | x |
| Kling | 产品 | soon | **2026-10-15**（产品全量） | x |
| Praxis | 宣布 | months | 未交付 | x |
`;
    const { total, by } = weightsStatus(md);
    assert.equal(total, 3);
    assert.equal(by["已交付"], 2);
    assert.equal(by["未交付"], 1);
  });

  it("counts Klein / Kling / Step 5 as delivered on the public tracker", () => {
    const md = readFileSync(join(root, "content", "weights-tracker.md"), "utf8");
    const { total, by } = weightsStatus(md);
    assert.equal(total, 6);
    assert.equal(by["已交付"], 3);
    assert.equal(by["未交付"], 3);
  });
});
