import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "align_hot_sparks_to_js.mjs");
const OUT_1700 = join(here, "..", "engine", "__samples__", "out-1700");

describe("align_hot_sparks_to_js retired (default-off)", () => {
  it("does not rewrite when ALIGN_HOT_SPARKS is unset", () => {
    const result = spawnSync(process.execPath, [script, OUT_1700], {
      encoding: "utf8",
      env: { ...process.env, ALIGN_HOT_SPARKS: "" },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.retired, true);
    assert.equal(payload.rewritten, false);
  });
});
