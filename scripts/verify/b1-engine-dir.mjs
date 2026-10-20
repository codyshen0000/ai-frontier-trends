import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { FIXTURE_IDS } from "../engine/ids.mjs";

export const id = "b1-engine-dir";
export const owner = "B1";

function walkHtml(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, files);
    else if (name.endsWith(".html")) files.push(full);
  }
  return files;
}

export async function verify(ctx) {
  const engineDir = ctx.engineDir;
  if (!engineDir || !existsSync(join(engineDir, "meta.json"))) {
    return { ok: true, message: "no FT_ENGINE_DIR snapshot; skipped" };
  }
  const pages = ["index.html", "hot.html", "daily.html"]
    .map((name) => join(ctx.distDir || "", name))
    .filter((file) => existsSync(file));
  if (ctx.previewDir) {
    for (const name of ["index.html", "hot.html", "daily.html"]) {
      const file = join(ctx.previewDir, name);
      if (existsSync(file)) pages.push(file);
    }
  }
  for (const file of pages.length ? pages : walkHtml(ctx.distDir || ".")) {
    const html = readFileSync(file, "utf8");
    for (const id of FIXTURE_IDS) {
      if (html.includes(id)) {
        return { ok: false, message: `${file} still renders fixture id ${id} while FT_ENGINE_DIR is set` };
      }
    }
    if (/example\.com/i.test(html)) {
      return { ok: false, message: `${file} still contains example.com while FT_ENGINE_DIR is set` };
    }
  }
  return { ok: true };
}
