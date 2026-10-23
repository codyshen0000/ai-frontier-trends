/** Static-site route table. Unknown paths never fall back to home. */
import generated from "./covers.generated.json";
import { dailyIssueFile, isDailyIssueKey } from "../../daily_paths.mjs";
import { daily, dailyIndex, eventIds, itemIds, itemUrls } from "./site";

export const PAGE_FILE = {
  "/": "index.html",
  "/hot": "hot.html",
  "/daily": "daily.html",
  "/daily/archive": "daily-archive.html",
  "/weekly": "weekly.html",
  "/monthly": "monthly.html",
  "/search": "search.html",
  "/starred": "starred.html",
  "/more": "more.html",
  "/all": "all.html",
  "/topics": "topics.html",
} as const;

export const UNBUILT_PATHS = new Set([
  "/about",
  "/agent",
  "/changelog",
  "/feedback",
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

function safePageId(id: string): string {
  return String(id || "").replaceAll(":", "-");
}

export function itemPageFile(id: string): string {
  return `item-${safePageId(id)}.html`;
}

export function eventPageFile(id: string): string {
  return `event-${safePageId(id)}.html`;
}

export function dailyPageFile(key: string): string {
  return dailyIssueFile(key);
}

const DAILY_KEYS = new Set(
  [daily?.key, ...(dailyIndex || []).map((row) => row.key)].filter((key): key is string => isDailyIssueKey(key)),
);

export type ResolvedHref =
  | { kind: "unbuilt"; href: "" }
  | { kind: "external"; href: string }
  | { kind: "page"; href: string }
  | { kind: "hash"; href: string };

function pageFileFor(pathname: string): string | null {
  if (pathname === "/" || pathname === "") return PAGE_FILE["/"];
  if (pathname in PAGE_FILE) return PAGE_FILE[pathname as keyof typeof PAGE_FILE];
  if (pathname.startsWith("/hot")) return PAGE_FILE["/hot"];
  if (pathname.startsWith("/daily/archive")) return PAGE_FILE["/daily/archive"];
  const dailyKey = pathname.match(/^\/daily\/(\d{4}-\d{2}-\d{2})\/?$/);
  if (dailyKey && DAILY_KEYS.has(dailyKey[1])) return dailyPageFile(dailyKey[1]);
  if (pathname.startsWith("/daily")) return PAGE_FILE["/daily"];
  if (pathname.startsWith("/weekly")) return PAGE_FILE["/weekly"];
  if (pathname.startsWith("/monthly")) return PAGE_FILE["/monthly"];
  if (pathname.startsWith("/search")) return PAGE_FILE["/search"];
  if (pathname.startsWith("/starred")) return PAGE_FILE["/starred"];
  if (pathname.startsWith("/more")) return PAGE_FILE["/more"];
  if (pathname.startsWith("/all")) return PAGE_FILE["/all"];
  if (pathname.startsWith("/topics")) return PAGE_FILE["/topics"];
  if (pathname.startsWith("/items/")) {
    const id = pathname.split("/").filter(Boolean)[1] || "";
    return itemIds.has(id) ? itemPageFile(id) : null;
  }
  if (pathname.startsWith("/story/") || pathname.startsWith("/events/")) {
    const id = pathname.split("/").filter(Boolean)[1] || "";
    return eventIds.has(id) ? eventPageFile(id) : null;
  }
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

  if (path.startsWith("/items/")) {
    const id = path.split("/").filter(Boolean)[1] || "";
    if (itemIds.has(id)) {
      const href = `${itemPageFile(id)}${q}${h}`;
      if (!h && !q && samePageFile(href, currentPath)) return { kind: "hash", href: "#main" };
      return { kind: "page", href };
    }
    return { kind: "unbuilt", href: "" };
  }

  if (path.startsWith("/story/") || path.startsWith("/events/")) {
    const id = path.split("/").filter(Boolean)[1] || "";
    if (eventIds.has(id)) {
      const href = `${eventPageFile(id)}${q}${h}`;
      if (!h && !q && samePageFile(href, currentPath)) return { kind: "hash", href: "#main" };
      return { kind: "page", href };
    }
    return { kind: "unbuilt", href: "" };
  }

  if (path.startsWith("/weekly/")) {
    const key = path.slice("/weekly/".length).replace(/\/$/, "");
    if ((WEEKLY_ISSUES as readonly string[]).includes(key)) {
      return { kind: "page", href: `weekly/${key}.html${q}${h}` };
    }
    return { kind: "page", href: `${PAGE_FILE["/weekly"]}${q}${h}` };
  }

  if (path === "/daily/archive" || path.startsWith("/daily/archive/")) {
    return { kind: "page", href: `${PAGE_FILE["/daily/archive"]}${q}${h}` };
  }

  if (path.startsWith("/daily/")) {
    const key = path.slice("/daily/".length).replace(/\/$/, "");
    if (!key) return { kind: "page", href: `${PAGE_FILE["/daily"]}${q}${h}` };
    if (isDailyIssueKey(key) && DAILY_KEYS.has(key)) {
      const dest = `${dailyPageFile(key)}${q}${h}`;
      if (!h && !q && samePageFile(dest, currentPath)) {
        return { kind: "hash", href: "#report-start" };
      }
      return { kind: "page", href: dest };
    }
    if (isDailyIssueKey(key)) {
      return { kind: "page", href: `${PAGE_FILE["/daily"]}#d-${key}` };
    }
    return { kind: "unbuilt", href: "" };
  }

  if (UNBUILT_PATHS.has(path)) return { kind: "unbuilt", href: "" };

  const mapped = PAGE_FILE[path as keyof typeof PAGE_FILE];
  if (!mapped) return { kind: "unbuilt", href: "" };

  const href = `${mapped}${q}${h}`;
  if (!h && !q && samePageFile(href, currentPath)) {
    if (path === "/" || mapped === PAGE_FILE["/"]) {
      return { kind: "page", href: PAGE_FILE["/"] };
    }
    return { kind: "hash", href: /^\/(daily|weekly|monthly)/.test(currentPath) ? "#report-start" : "#main" };
  }
  if (h) return { kind: "hash", href };
  return { kind: "page", href };
}
