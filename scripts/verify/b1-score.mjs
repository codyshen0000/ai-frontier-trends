import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const id = "b1-score";
export const owner = "B1";

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

export async function verify(ctx) {
  const roots = [ctx.distDir, ctx.previewDir].filter((dir) => dir && existsSync(dir));
  for (const root of roots) {
    for (const file of walk(root)) {
      if (!/\.(html|json|xml)$/i.test(file)) continue;
      if (file.includes("/LICENSES/")) continue;
      const text = readFileSync(file, "utf8");
      if (/"score"\s*:/.test(text) || /score=/.test(text)) {
        return { ok: false, message: `score leaked in ${file}` };
      }
    }
  }
  return { ok: true };
}
