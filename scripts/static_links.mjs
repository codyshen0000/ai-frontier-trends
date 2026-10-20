import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";

const UNBUILT_LABELS = /关于|反馈|更新日志|Agent 接入/;
const HOME_OK_LABELS = /精选|首页|前沿趋势|当前热点|完整榜单/;

function walkHtml(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function decode(value) {
  return String(value)
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function textOf(tag) {
  return decode(tag.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function collectAnchors(html) {
  const out = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = decode((m[1].match(/\bhref="([^"]*)"/i) || [])[1] || "");
    if (!href) continue;
    out.push({ href, text: textOf(m[2]), raw: m[0] });
  }
  return out;
}

export function collectExampleComHits(dir, { prefix = "" } = {}) {
  const hits = [];
  for (const file of walkHtml(dir)) {
    const html = readFileSync(file, "utf8");
    if (/example\.com/i.test(html)) {
      hits.push({ file: `${prefix}${relative(dir, file).split("\\").join("/")}`, word: "example.com" });
    }
  }
  return hits;
}

function resolveHref(pageFile, href, rootDir) {
  const [pathPart, hash = ""] = href.split("#");
  const [filePart, query = ""] = pathPart.split("?");
  if (!filePart || filePart.startsWith("mailto:") || filePart.startsWith("javascript:") || filePart.startsWith("data:")) {
    return { file: null, hash, query, external: false, skip: true };
  }
  if (/^https?:\/\//i.test(filePart) || filePart.startsWith("//")) {
    return { file: null, hash, query, external: true, skip: false };
  }
  const resolved = normalize(join(dirname(pageFile), filePart || "."));
  const asFile = statSync(resolved).isDirectory?.() || existsSync(join(resolved, "index.html"))
    ? (existsSync(resolved) && statSync(resolved).isFile() ? resolved : join(resolved, "index.html"))
    : resolved;
  const exists = existsSync(asFile) && statSync(asFile).isFile();
  const rel = relative(rootDir, asFile).split("\\").join("/");
  return { file: exists ? asFile : asFile, rel, exists, hash, query, external: false, skip: false };
}

function safeResolve(pageFile, href, rootDir) {
  try {
    return resolveHref(pageFile, href, rootDir);
  } catch {
    const [pathPart, hash = ""] = href.split("#");
    const [filePart, query = ""] = pathPart.split("?");
    if (/^https?:\/\//i.test(filePart) || filePart.startsWith("//")) {
      return { file: null, hash, query, external: true, skip: false };
    }
    const resolved = normalize(join(dirname(pageFile), filePart || "."));
    const asFile = existsSync(join(resolved, "index.html")) ? join(resolved, "index.html") : resolved;
    return { file: asFile, rel: relative(rootDir, asFile).split("\\").join("/"), exists: existsSync(asFile), hash, query, external: false, skip: false };
  }
}

function listedPages(dir, pages) {
  if (!pages?.length) return walkHtml(dir);
  return pages.map((rel) => join(dir, rel)).filter((p) => existsSync(p));
}

export function collectSelfLinkHits(dir, { prefix = "", pages } = {}) {
  const hits = [];
  for (const page of listedPages(dir, pages)) {
    const html = readFileSync(page, "utf8");
    for (const a of collectAnchors(html)) {
      if (/^https?:\/\//i.test(a.href) || a.href.startsWith("#") || a.href.startsWith("mailto:")) continue;
      const resolved = safeResolve(page, a.href, dir);
      if (resolved.skip || resolved.external) continue;
      if (resolved.hash || resolved.query) continue;
      if (resolved.file && normalize(resolved.file) === normalize(page)) {
        hits.push({
          file: `${prefix}${relative(dir, page).split("\\").join("/")}`,
          href: a.href,
          text: a.text,
        });
      }
    }
  }
  return hits;
}

function isHomeFile(file, rootDir) {
  return normalize(file) === normalize(join(rootDir, "index.html"));
}

export function collectHomeFallbackHits(dir, { prefix = "", pages } = {}) {
  const hits = [];
  for (const page of listedPages(dir, pages)) {
    const html = readFileSync(page, "utf8");
    for (const a of collectAnchors(html)) {
      if (/^https?:\/\//i.test(a.href) || a.href.startsWith("#")) continue;
      const resolved = safeResolve(page, a.href, dir);
      if (resolved.skip || resolved.external || !resolved.file) continue;
      if (!isHomeFile(resolved.file, dir)) continue;
      if (isHomeFile(page, dir)) continue;
      const unbuiltHref = /\/(topics|about|agent|changelog|feedback|monthly|all|daily\/archive)(\/|$)/i.test(a.href);
      if (unbuiltHref || (UNBUILT_LABELS.test(a.text) && !HOME_OK_LABELS.test(a.text))) {
        hits.push({
          file: `${prefix}${relative(dir, page).split("\\").join("/")}`,
          href: a.href,
          text: a.text,
        });
      }
    }
  }
  return hits;
}

export function assertPublicLinks(dir, { prefix = "dist/", pages } = {}) {
  const example = collectExampleComHits(dir, { prefix });
  if (example.length) {
    throw new Error(`example.com in ${example.map((h) => h.file).join(", ")}`);
  }
  const self = collectSelfLinkHits(dir, { prefix, pages });
  if (self.length) {
    throw new Error(`self-link ${self[0].file} «${self[0].text}» → ${self[0].href}`);
  }
  const home = collectHomeFallbackHits(dir, { prefix, pages });
  if (home.length) {
    throw new Error(`home-fallback ${home[0].file} «${home[0].text}» → ${home[0].href}`);
  }
}

export function inventoryPage(pageFile, rootDir) {
  const html = readFileSync(pageFile, "utf8");
  return collectAnchors(html).map((a) => {
    const resolved = safeResolve(pageFile, a.href, rootDir);
    let status = "skip";
    let target = a.href;
    if (a.href.startsWith("#")) {
      const id = a.href.slice(1);
      status = html.includes(`id="${id}"`) ? "anchor-found" : "anchor-missing";
      target = a.href;
    } else if (resolved.external) {
      status = /example\.com/i.test(a.href) ? "example.com" : "external";
      target = a.href;
    } else if (resolved.hash && resolved.exists) {
      const destHtml = readFileSync(resolved.file, "utf8");
      status = destHtml.includes(`id="${resolved.hash}"`) ? "anchor-found" : "200";
      target = resolved.rel + (resolved.hash ? `#${resolved.hash}` : "");
    } else if (resolved.exists) {
      status = "200";
      target = resolved.rel;
    } else {
      status = "missing";
      target = resolved.rel || a.href;
    }
    return { text: a.text, href: a.href, target, status };
  });
}
