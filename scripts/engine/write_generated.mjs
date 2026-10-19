/** Write the publicized engine snapshot that MIT prerender reads. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { publicizeBundle } from "./publicize.mjs";
import { resolveEngineBundle } from "./resolve.mjs";

export function writeGeneratedSite(file, resolved) {
  const site = publicizeBundle(resolved.bundle, {
    source: resolved.source,
    warning: resolved.warning,
  });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(site, null, 2)}\n`);
  return site;
}

export function resolveAndWriteGeneratedSite(file, options = {}) {
  const resolved = resolveEngineBundle(options);
  const site = writeGeneratedSite(file, resolved);
  return { resolved, site };
}
