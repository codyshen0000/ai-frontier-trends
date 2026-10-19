/**
 * B0 phase 2: glob-load scripts/verify/*.mjs and call verify(ctx).
 *
 * Remaining-A files in that folder (starred-base.mjs, serve-base.mjs, …) are
 * standalone entry scripts for `verify:remaining`. They do not export `verify`,
 * so they are skipped — importing them would re-run top-level asserts / servers.
 * Empty registry is OK.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const EXPORTS_VERIFY_RE =
  /\bexport\s+(?:async\s+)?function\s+verify\b|\bexport\s+\{[^}]*\bverify\b/;

export function listVerifyGateFiles(verifyDir) {
  if (!existsSync(verifyDir) || !statSync(verifyDir).isDirectory()) return [];
  return readdirSync(verifyDir)
    .filter((name) => name.endsWith(".mjs"))
    .sort()
    .map((name) => join(verifyDir, name))
    .filter((file) => EXPORTS_VERIFY_RE.test(readFileSync(file, "utf8")));
}

/**
 * @param {{ root: string, distDir: string, engineDir: string, verifyDir?: string }} ctx
 * @returns {Promise<number>} number of failed gates
 */
export async function runVerifyRegistry(ctx) {
  const verifyDir = ctx.verifyDir || join(ctx.root, "scripts", "verify");
  const files = listVerifyGateFiles(verifyDir);
  if (!files.length) {
    console.log("ok   verify registry: 0 gates (empty glob is OK)");
    return 0;
  }
  let failed = 0;
  for (const file of files) {
    const name = file.split("/").pop();
    const rel = `scripts/verify/${name}`;
    try {
      const mod = await import(pathToFileURL(file).href);
      if (typeof mod.verify !== "function") {
        console.log(`ok   verify registry skip ${rel} (no verify())`);
        continue;
      }
      const result = await mod.verify(ctx);
      if (result && result.ok === false) {
        failed += 1;
        console.error(`FAIL verify ${mod.id || rel}: ${result.message || "ok=false"}`);
      } else {
        console.log(`ok   verify ${mod.id || rel}`);
      }
    } catch (err) {
      failed += 1;
      console.error(`FAIL verify ${rel}: ${err.message || err}`);
    }
  }
  return failed;
}
