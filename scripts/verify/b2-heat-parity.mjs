/**
 * B2 py↔JS heat parity gate. Loads heat48h.py against the shared fixture.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const id = "b2-heat-parity";
export const owner = "B2";

const here = dirname(fileURLToPath(import.meta.url));

export async function verify(ctx = {}) {
  const script = join(ctx.root || join(here, "..", ".."), "scripts", "verify", "heat-py-parity.py");
  const result = spawnSync("python3", [script, "--json"], { encoding: "utf8" });
  if (result.error && result.error.code === "ENOENT") {
    return { ok: true, skipped: true, message: `${id}: skip (no python3)` };
  }
  if (result.status !== 0) {
    return {
      ok: false,
      message: `${id}: heat-py-parity failed\n${result.stderr || result.stdout}`,
    };
  }
  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch (err) {
    return { ok: false, message: `${id}: invalid JSON from heat-py-parity (${err.message})` };
  }
  if (!payload.ok) {
    const issues = (payload.cases || []).flatMap((row) => row.issues || []);
    return { ok: false, message: `${id}: ${issues.join("\n") || "python≠js"}` };
  }
  return {
    ok: true,
    message: `${id}: ${payload.cases?.length || 0} cases match heat.mjs via ${payload.heat48h}`,
  };
}

const isMain =
  !process.env.NODE_TEST_CONTEXT &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const result = await verify({});
  console.log(result.message || (result.ok ? "ok" : "fail"));
  process.exit(result.ok ? 0 : 1);
}
