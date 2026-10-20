/** Static-site route table. Unknown paths never fall back to home. */
import generated from "./covers.generated.json";
import { itemUrls } from "./site";

export const PAGE_FILE = {
  "/": "index.html",
  "/hot": "hot.html",
  "/daily": "daily.html",
  "/weekly": "weekly.html",
  "/search": "search.html",
  "/starred": "starred.html",
  "/more": "more.html",
} as const;

export const UNBUILT_PATHS = new Set([
  "/topics",
  "/about",
  "/agent",
  "/changelog",
  "/feedback",
  "/monthly",
  "/all",
  "/daily/archive",
]);

export const WEEKLY_ISSUES = ["2026-10-12", "2026-10-18"] as const;

const ITEM_URLS = new Map<string, string>();

function isPublicHttpUrl(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url) && !/example\.com/i.test(url);
}

function remember(id: string | null | undefined, url: string | null | undefined) {
  if (!id || !isPublicHttpUrl(url)) return;
  ITEM_URLS.set(id, url);
}

for (const row of generated.hotEntries ?? []) {
  const pick = (row.pickLog ?? []).find((p) => isPublicHttpUrl(p.url));
  remember(row.itemId, pick?.url);
  remember(row.storyPublicId, pick?.url);
}
if (generated.daily) {
  remember(generated.daily.itemId, generated.daily.sourceUrl);
}
for (const [id, url] of Object.entries(itemUrls || {})) remember(id, url);

export function isPublicHttpUrlExport(url: string | null | undefined): url is string {
  return isPublicHttpUrl(url);
}

export function itemSourceUrl(id: string | null | undefined): string | null {
  if (!id) return null;
  return ITEM_URLS.get(id) ?? null;
}

export function itemAnchorId(id: string): string {
  return `s-${id}`;
}

export type ResolvedHref =
  | { kind: "unbuilt"; href: "" }
  | { kind: "external"; href: string }
  | { kind: "page"; href: string }
  | { kind: "hash"; href: string };

function pageFileFor(pathname: string): string | null {
  if (pathname === "/" || pathname === "") return PAGE_FILE["/"];
  if (pathname in PAGE_FILE) return PAGE_FILE[pathname as keyof typeof PAGE_FILE];
  if (pathname.startsWith("/hot")) return PAGE_FILE["/hot"];
  if (pathname.startsWith("/daily")) return PAGE_FILE["/daily"];
  if (pathname.startsWith("/weekly")) return PAGE_FILE["/weekly"];
  if (pathname.startsWith("/search")) return PAGE_FILE["/search"];
  if (pathname.startsWith("/starred")) return PAGE_FILE["/starred"];
  if (pathname.startsWith("/more")) return PAGE_FILE["/more"];
  return null;
}

function samePageFile(href: string, currentPath: string): boolean {
  const bare = href.split("#")[0].split("?")[0];
  const current = pageFileFor(currentPath);
  return !!current && bare === current;
}

export function resolveHref(
  to: string | { pathname?: string; search?: string; hash?: string },
  currentPath = "/",
): ResolvedHref {
  if (typeof to !== "string") {
    const path = to.pathname ?? "/";
    const extra = `${to.search ?? ""}${to.hash ?? ""}`;
    return resolveHref(`${path}${extra}`, currentPath);
  }

  if (/^https?:\/\//i.test(to)) {
    if (/example\.com/i.test(to)) return { kind: "unbuilt", href: "" };
    return { kind: "external", href: to };
  }
  if (to.startsWith("#")) return { kind: "hash", href: to };

  const [pathAndQuery, hash = ""] = to.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const q = query ? `?${query}` : "";
  const h = hash ? `#${hash}` : "";

  if (path.startsWith("/story/") || path.startsWith("/items/")) {
    const id = path.split("/").filter(Boolean)[1] || "";
    const url = itemSourceUrl(id);
    if (url) return { kind: "external", href: url };
    const dest = `${PAGE_FILE["/hot"]}#${itemAnchorId(id)}`;
    return { kind: "hash", href: dest };
  }

  if (path.startsWith("/weekly/")) {
    const key = path.slice("/weekly/".length).replace(/\/$/, "");
    if ((WEEKLY_ISSUES as readonly string[]).includes(key)) {
      return { kind: "page", href: `weekly/${key}.html${q}${h}` };
    }
    return { kind: "unbuilt", href: "" };
  }

  if (path.startsWith("/daily/")) {
    const key = path.slice("/daily/".length).replace(/\/$/, "");
    if (!key || key === "archive") return { kind: "unbuilt", href: "" };
    const dest = `${PAGE_FILE["/daily"]}#d-${key}`;
    return { kind: "hash", href: dest };
  }

  if (path.startsWith("/monthly")) return { kind: "unbuilt", href: "" };
  if (UNBUILT_PATHS.has(path)) return { kind: "unbuilt", href: "" };

  const mapped = PAGE_FILE[path as keyof typeof PAGE_FILE];
  if (!mapped) return { kind: "unbuilt", href: "" };

  const href = `${mapped}${q}${h}`;
  if (!h && !q && samePageFile(href, currentPath)) {
    return { kind: "hash", href: currentPath.startsWith("/daily") ? "#report-start" : "#main" };
  }
  if (h) return { kind: "hash", href };
  return { kind: "page", href };
}
