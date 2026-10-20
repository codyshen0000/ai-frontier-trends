/**
 * Public Pages publishes pretty directories (`/hot/index.html`), not root `hot.html`.
 * Home `__FT__.base` is `"./"` — never emit `*.html` page fallbacks from that base.
 */

export function normalizeBase(base) {
  if (!base || base === "./") return "./";
  return String(base).endsWith("/") ? String(base) : `${base}/`;
}

/** Site-root-relative path (no leading ./ or /) so /starred/ can resolve weekly links. */
export function siteRel(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("#") || raw.startsWith("mailto:")) return raw;
  return raw.replace(/^\.\//, "").replace(/^\//, "");
}

export function asset(base, path) {
  return `${normalizeBase(base)}${String(path || "").replace(/^\//, "")}`;
}

/**
 * Directory-style page href matching published Pages paths.
 * `pageHref("./", "hot")` → `./hot/` (never `hot.html`).
 */
export function pageHref(base, name) {
  const root = normalizeBase(base);
  if (name === "index") return root;
  return `${root}${name}/`;
}

function isPublicHttp(url) {
  return !!url && /^https?:\/\//i.test(url) && !/example\.com/i.test(url);
}

/** Turn leftover `hot.html#s-…` (or any site .html) into a pretty directory href. */
export function siteHref(base, url) {
  const rel = siteRel(url);
  if (!rel) return pageHref(base, "hot");
  if (isPublicHttp(rel) || rel.startsWith("#") || rel.startsWith("mailto:")) return rel;
  if (rel.includes(".html")) {
    const [file, hash = ""] = rel.split("#");
    const page = file.replace(/\.html$/, "").replace(/^\.\//, "");
    const prefix = normalizeBase(base);
    return `${prefix}${page === "index" ? "" : `${page}/`}${hash ? `#${hash}` : ""}`;
  }
  return asset(base, rel);
}

/**
 * Card title href: prefer the real external URL, never `hot.html#s-…`.
 * Internal fallback is directory-style `hot/#s-<id>` relative to base.
 */
export function cardHref(base, item = {}) {
  const original = item.originalUrl || item.links?.original;
  if (isPublicHttp(original)) return original;
  if (isPublicHttp(item.url)) return item.url;
  if (item.url) return siteHref(base, item.url);
  return `${pageHref(base, "hot")}#s-${item.id || ""}`;
}
