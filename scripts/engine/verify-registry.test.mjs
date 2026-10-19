import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { listVerifyGateFiles, runVerifyRegistry } from "../verify-registry.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const verifyDir = join(root, "scripts", "verify");

describe("verify registry", () => {
  it("skips Remaining-A standalone scripts that do not export verify()", () => {
    const files = listVerifyGateFiles(verifyDir);
    const names = files.map((file) => file.split("/").pop());
    assert.equal(names.includes("starred-base.mjs"), false);
    assert.equal(names.includes("serve-base.mjs"), false);
    assert.equal(names.includes("handoff-matrix.mjs"), false);
    assert.equal(names.includes("b0-registry-smoke.mjs"), true);
  });

  it("runs the real scripts/verify registry without failures", async () => {
    const failed = await runVerifyRegistry({
      root,
      distDir: join(root, "dist"),
      engineDir: join(root, "data", "engine", "v1"),
    });
    assert.equal(failed, 0);
  });

  it("runs exported verify() and keeps going after a failure", async () => {
    const dir = mkdtempSync(join(tmpdir(), "b0-gates-"));
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(
        join(dir, "ok-gate.mjs"),
        `export const id = "ok-gate";\nexport async function verify() { return { ok: true }; }\n`,
      );
      writeFileSync(
        join(dir, "fail-gate.mjs"),
        `export const id = "fail-gate";\nexport async function verify() { return { ok: false, message: "nope" }; }\n`,
      );
      writeFileSync(
        join(dir, "throw-gate.mjs"),
        `export const id = "throw-gate";\nexport async function verify() { throw new Error("boom"); }\n`,
      );
      writeFileSync(join(dir, "standalone.mjs"), `console.log("side effect");\n`);
      const failed = await runVerifyRegistry({
        root,
        distDir: join(root, "dist"),
        engineDir: join(root, "data", "engine", "v1"),
        verifyDir: dir,
      });
      assert.equal(failed, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
