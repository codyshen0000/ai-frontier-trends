/**
 * B2-07: redirects.json pages exist (meta refresh + rel=canonical) when dist
 * is present. If dist is not wired yet, still checks that writeRedirects can
 * emit pages for the engine dump. Picked up by `runVerifyRegistry`.
 * Missing engine dir → skip (fixture builds must not fail).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { loadEngineData, resolveEngineDir } from "../engine/loader.mjs";
import { SITE_BASE, canonicalHref, relativeTargetHref, writeRedirects } from "../redirects.mjs";

export const id = "b2-redirects";
export const owner = "B2";

function engineDirOf(ctx = {}) {
  return ctx.engineDir || resolveEngineDir(ctx.env || process.env);
}

function inspectPage(file, from, to) {
  const html = readFileSync(file, "utf8");
  const issues = [];
  if (!html.includes(`http-equiv="refresh"`) && !html.includes("http-equiv='refresh'")) {
    issues.push(`${from}: missing meta refresh`);
  }
  const rel = relativeTargetHref(to);
  if (!html.includes(rel)) issues.push(`${from}: meta refresh target ${rel} missing`);
  const canon = canonicalHref(to, SITE_BASE);
  if (!html.includes(`rel="canonical"`) || !html.includes(canon)) {
    issues.push(`${from}: canonical ${canon} missing`);
  }
  if (!html.includes("/ai-frontier-trends/")) {
    issues.push(`${from}: canonical is not relative to /ai-frontier-trends/`);
  }
  return issues;
}

/** @param {{ root?: string, distDir?: string, engineDir?: string, env?: NodeJS.ProcessEnv }} ctx */
export async function verify(ctx = {}) {
  const engineDir = engineDirOf(ctx);
  if (!existsSync(engineDir) || !existsSync(join(engineDir, "meta.json"))) {
    return { ok: true, skipped: true, message: `${id}: skip (no engine dir ${engineDir})` };
  }
  let bundle;
  try {
    bundle = loadEngineData({ dir: engineDir });
  } catch (err) {
    if (err?.code === "MISSING_DIR" || err?.code === "MISSING_META") {
      return { ok: true, skipped: true, message: `${id}: skip (${err.code})` };
    }
    return { ok: false, message: `${id}: ${err.message}` };
  }

  const redirects = bundle.redirects || [];
  const distDir = ctx.distDir;
  const issues = [];
  let written = 0;

  if (distDir && existsSync(distDir)) {
    for (const row of redirects) {
      const file = join(distDir, "events", row.from, "index.html");
      if (!existsSync(file)) {
        issues.push(`missing ${file}`);
        continue;
      }
      issues.push(...inspectPage(file, row.from, row.to));
      written += 1;
    }
  } else {
    const tmp = mkdtempSync(join(tmpdir(), "b2-redirects-"));
    try {
      const result = writeRedirects(tmp, bundle);
      written = result.written;
      for (const row of redirects) {
        const file = join(tmp, "events", row.from, "index.html");
        if (!existsSync(file)) {
          if (result.skipped.some((s) => s.startsWith(row.from))) continue;
          issues.push(`writeRedirects did not emit ${row.from}`);
          continue;
        }
        issues.push(...inspectPage(file, row.from, row.to));
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  if (issues.length) {
    return { ok: false, message: `${id}: ${issues.join("\n")}` };
  }
  const wired = distDir && existsSync(distDir) ? "dist" : "self-check (dist not wired)";
  return {
    ok: true,
    message: `${id}: ${written} redirect page(s) ok via ${wired}; input redirects=${redirects.length}`,
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
