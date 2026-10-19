/**
 * B2-01 heat recompute gate. Picked up by `runVerifyRegistry` (export verify).
 * Not a production heat source: hot.json remains the only shipped heat.
 * Missing engine / hot.json → skip (fixture builds must not fail).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveEngineDir } from "../engine/loader.mjs";
import { HEAT_METHOD_COPY, HEAT_TOLERANCE, verifyEngineHeat } from "../engine/heat.mjs";

export const id = "b2-hot-recompute";
export const owner = "B2";

function engineDirOf(ctx = {}) {
  return ctx.engineDir || resolveEngineDir(ctx.env || process.env);
}

/** @param {{ root?: string, distDir?: string, engineDir?: string, env?: NodeJS.ProcessEnv }} ctx */
export async function verify(ctx = {}) {
  const engineDir = engineDirOf(ctx);
  if (!existsSync(engineDir) || !existsSync(join(engineDir, "hot.json"))) {
    return { ok: true, skipped: true, message: `${id}: skip (no hot.json in ${engineDir})` };
  }
  let result;
  try {
    result = verifyEngineHeat(engineDir);
  } catch (err) {
    return { ok: false, message: `${id}: ${err.message}` };
  }
  if (!result.ok) {
    return {
      ok: false,
      message: `${id}: ${result.issues.length} mismatch(es) vs hot.json (tol ${HEAT_TOLERANCE})\n${result.issues.join("\n")}`,
    };
  }
  return {
    ok: true,
    message: `${id}: ${result.recomputed.length} hot.json heat values match recompute (±${HEAT_TOLERANCE}) at ${result.at}; ${HEAT_METHOD_COPY}`,
  };
}

const isMain =
  !process.env.NODE_TEST_CONTEXT &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const dir = process.argv[2];
  const result = await verify(dir ? { engineDir: dir } : {});
  console.log(result.message || (result.ok ? "ok" : "fail"));
  process.exit(result.ok ? 0 : 1);
}
