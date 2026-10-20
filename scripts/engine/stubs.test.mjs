import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { groupByEvent } from "./groupByEvent.mjs";
import { writeRedirects } from "../redirects.mjs";

describe("groupByEvent identity stub", () => {
  it("returns the same array reference", () => {
    const cards = [{ key: "synthetic-alpha" }, { key: "synthetic-beta" }];
    assert.equal(groupByEvent(cards), cards);
    assert.deepEqual(groupByEvent([]), []);
  });
});

describe("writeRedirects no-op stub", () => {
  it("writes nothing and reports written: 0", () => {
    const dist = mkdtempSync(join(tmpdir(), "b0-redirects-"));
    mkdirSync(join(dist, "events"), { recursive: true });
    try {
      const before = readdirSync(dist, { recursive: true }).sort();
      const result = writeRedirects(dist, {
        redirects: [{ from: "2026-10-19-synthetic-alias", to: "2026-10-19-synthetic-alpha" }],
      });
      assert.deepEqual(result, { written: 0 });
      assert.deepEqual(readdirSync(dist, { recursive: true }).sort(), before);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });
});
