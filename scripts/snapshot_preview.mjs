/** Copy dist pages into preview/ and emit jsDelivr-absolute standalone.html files. */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const previewDir = join(root, "preview");
const repo = "codyshen0000/ai-frontier-trends";

function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((item) => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : "";
}

const sha = argValue("sha") || process.env.PREVIEW_SHA || execSync("git rev-parse HEAD", { cwd: root }).toString().trim();
const cdn = `https://cdn.jsdelivr.net/gh/${repo}@${sha}`;

function copyPage(name) {
  const src = join(distDir, name, "index.html");
  if (!existsSync(src)) return false;
  mkdirSync(join(previewDir, name), { recursive: true });
  cpSync(src, join(previewDir, name, "index.html"));
  return true;
}

function toStandalone(html) {
  return html
    .replaceAll('href="../assets/skin-raw.css"', `href="${cdn}/src/skin-raw.css"`)
    .replaceAll('href="../styles.css"', `href="${cdn}/src/styles.css"`)
    .replaceAll('src="../theme.js"', `src="${cdn}/src/theme.js"`);
}

const pages = ["daily", "live", "hot", "more", "timeline"].filter(copyPage);
mkdirSync(join(previewDir, "assets"), { recursive: true });
cpSync(join(distDir, "assets", "skin-raw.css"), join(previewDir, "assets", "skin-raw.css"));
cpSync(join(distDir, "styles.css"), join(previewDir, "styles.css"));
cpSync(join(distDir, "theme.js"), join(previewDir, "theme.js"));

const standalones = [];
for (const name of ["daily", "live", "hot", "more"]) {
  const src = join(distDir, name, "index.html");
  if (!existsSync(src)) continue;
  const html = toStandalone(readFileSync(src, "utf8"));
  if (!html.includes(`${cdn}/src/skin-raw.css`)) {
    throw new Error(`${name} standalone rewrite missed skin-raw.css`);
  }
  mkdirSync(join(previewDir, name), { recursive: true });
  writeFileSync(join(previewDir, name, "standalone.html"), html);
  standalones.push(name);
}

const daily = readFileSync(join(distDir, "daily", "index.html"), "utf8");
const stagedDir = join(root, "staging", "daily-preview");
mkdirSync(stagedDir, { recursive: true });
const staged = daily
  .replaceAll('href="../assets/skin-raw.css"', 'href="./skin-raw.css"')
  .replaceAll('href="../styles.css"', 'href="./styles.css"')
  .replaceAll('src="../theme.js"', 'src="./theme.js"');
writeFileSync(join(stagedDir, "index.html"), staged);
cpSync(join(distDir, "assets", "skin-raw.css"), join(stagedDir, "skin-raw.css"));
cpSync(join(distDir, "styles.css"), join(stagedDir, "styles.css"));
cpSync(join(distDir, "theme.js"), join(stagedDir, "theme.js"));

console.log(`snapshot preview pages=${pages.join(",")} sha=${sha}`);
console.log(`standalone ${standalones.join(",")}`);
console.log(`staging ${join(stagedDir, "index.html")}`);
