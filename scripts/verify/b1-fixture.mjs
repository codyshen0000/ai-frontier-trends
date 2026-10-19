import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { FIXTURE_IDS, FIXTURE_TITLE_NEEDLES } from "../engine/ids.mjs";

export const id = "b1-fixture";
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
  const needles = [...FIXTURE_IDS, ...FIXTURE_TITLE_NEEDLES, "example.com"];
  const hits = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      if (!/\.(html|json|xml|txt|js|css|md)$/i.test(file)) continue;
      const text = readFileSync(file, "utf8");
      for (const needle of needles) {
        if (text.includes(needle)) hits.push(`${file}: ${needle}`);
      }
    }
  }
  if (ctx.env?.PUBLIC_DEPLOY === "1" && hits.length) {
    return { ok: false, message: `PUBLIC_DEPLOY fixture/example.com leak: ${hits[0]}` };
  }
  if (hits.length) return { ok: false, message: `fixture/example.com on public pages: ${hits[0]}` };
  return { ok: true };
}
