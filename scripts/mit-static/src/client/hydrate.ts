/** First-screen hydrate for 精选 / 热点 / 日报 / 搜索 / 收藏. No React. */

import { cardHref as hrefCard } from "./site-href.mjs";

type Star = { id: string; title: string; url: string; source: string; date: string; savedAt: string };
type ThemePref = "light" | "dark" | "system";
type FtConfig = {
  base: string;
  page: "home" | "hot" | "daily" | "search" | "starred" | "more";
  dataAsOf: string;
  builtAt: string;
  hasTimeline: boolean;
  filter: string;
};

const STAR_KEY = "ft:starred:v1";
const THEME_KEY = "ft:theme";
const TIMELINE_PREFIX = "ft:timeline:";
const STAR_LIMIT = 500;
const AUTO_FETCHES = 3;
const PAGE_SIZE = 20;

const cfg: FtConfig = Object.assign(
  { base: "./", page: "home", dataAsOf: "", builtAt: "", hasTimeline: false, filter: "all" },
  (window as Window & { __FT__?: Partial<FtConfig> }).__FT__ || {},
);

const CATEGORIES = new Set(["model", "product", "industry", "paper", "tutorial", "opinion"]);

function announce(text: string) {
  const live = document.getElementById("ft-live");
  if (live) live.textContent = text;
}

function toast(text: string, ms = 3200) {
  const el = document.getElementById("ft-toast");
  if (!el) {
    announce(text);
    return;
  }
  el.hidden = false;
  el.textContent = text;
  announce(text);
  window.clearTimeout(Number(el.dataset.tid));
  el.dataset.tid = String(window.setTimeout(() => {
    el.hidden = true;
  }, ms));
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function session(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readJson<T>(store: Storage | null, key: string, fallback: T): T {
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(store: Storage | null, key: string, value: unknown): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function migrateTheme() {
  const ls = storage();
  if (!ls) return;
  if (ls.getItem(THEME_KEY)) return;
  const old = ls.getItem("theme");
  if (old === "light" || old === "dark" || old === "system") ls.setItem(THEME_KEY, old);
}

function themePref(): ThemePref {
  migrateTheme();
  const v = storage()?.getItem(THEME_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

function resolvedTheme(pref = themePref()): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(pref = themePref()) {
  const theme = resolvedTheme(pref);
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-ft-theme-pref", pref);
  document.querySelectorAll<HTMLButtonElement>("[data-ft-theme-choice]").forEach((btn) => {
    const on = btn.dataset.ftThemeChoice === pref;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.removeAttribute("aria-checked");
  });
}

function setTheme(pref: ThemePref) {
  const ls = storage();
  if (ls) ls.setItem(THEME_KEY, pref);
  else toast("这次会话内有效，浏览器不允许保存外观");
  applyTheme(pref);
}

function getStars(): Star[] {
  const parsed = readJson<Star[]>(storage(), STAR_KEY, []);
  return Array.isArray(parsed)
    ? parsed.filter((s) => s && typeof s.id === "string" && typeof s.title === "string").slice(0, STAR_LIMIT)
    : [];
}

function setStars(list: Star[]): boolean {
  return writeJson(storage(), STAR_KEY, list.slice(0, STAR_LIMIT));
}

function isStarred(id: string) {
  return getStars().some((s) => s.id === id);
}

function toggleStar(item: Omit<Star, "savedAt">): "on" | "off" | "fail" {
  if (!storage()) {
    toast("浏览器不允许保存收藏");
    return "fail";
  }
  const list = getStars();
  const exists = list.some((s) => s.id === item.id);
  const next = exists
    ? list.filter((s) => s.id !== item.id)
    : [{ ...item, savedAt: new Date().toISOString() }, ...list].slice(0, STAR_LIMIT);
  if (next.length >= STAR_LIMIT && !exists) next.pop();
  if (!setStars(next)) {
    toast("浏览器不允许保存收藏");
    return "fail";
  }
  return exists ? "off" : "on";
}

function syncStarButtons(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>("[data-ft-star]").forEach((btn) => {
    let item: Omit<Star, "savedAt"> | null = null;
    try {
      item = JSON.parse(btn.dataset.ftStar || "");
    } catch {
      item = null;
    }
    const id = item?.id || btn.closest("[data-item-id]")?.getAttribute("data-item-id") || "";
    const on = id ? isStarred(id) : false;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "取消收藏" : "收藏");
    btn.title = on ? "取消收藏" : "收藏";
    btn.classList.toggle("text-accent", on);
    btn.classList.toggle("text-ink-4", !on);
  });
}

function bindStars() {
  document.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-ft-star]");
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    let item: Omit<Star, "savedAt"> | null = null;
    try {
      item = JSON.parse(btn.dataset.ftStar || "");
    } catch {
      item = null;
    }
    const article = btn.closest<HTMLElement>("[data-ft-item]");
    if (article?.dataset.ftItem) {
      try {
        item = { ...JSON.parse(article.dataset.ftItem), ...item };
      } catch {
        /* keep */
      }
    }
    if (!item?.id || !item.title) return;
    const fallback = siteRel(
      item.url
      || article?.querySelector("a")?.getAttribute("href")
      || "",
    );
    const result = toggleStar({
      id: item.id,
      title: item.title,
      url: fallback,
      source: item.source || "",
      date: item.date || "",
    });
    if (result === "fail") return;
    syncStarButtons();
    announce(result === "on" ? "已收藏" : "已取消收藏");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === STAR_KEY || event.key === null) {
      syncStarButtons();
      if (cfg.page === "starred") renderStarred();
    }
  });
  syncStarButtons();
}

function bindTheme() {
  applyTheme();
  document.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-ft-theme-choice]");
    if (!btn?.dataset.ftThemeChoice) return;
    event.preventDefault();
    const key = btn.dataset.ftThemeChoice;
    if (key === "light" || key === "dark" || key === "system") setTheme(key);
  });
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (themePref() === "system") applyTheme("system");
    });
  } catch {
    /* ignore */
  }
}

function currentParams() {
  return new URLSearchParams(location.search);
}

function filterFromParams(sp: URLSearchParams) {
  const channel = sp.get("channel");
  const category = sp.get("category");
  const tag = sp.get("tag");
  if (channel === "firstParty") return { filter: "firstParty", category: null as string | null, channel, tag };
  if (category && CATEGORIES.has(category)) return { filter: category, category, channel: null as string | null, tag };
  return { filter: "all", category: null as string | null, channel: null as string | null, tag };
}

function hrefWith(patch: Record<string, string | null>) {
  const sp = currentParams();
  for (const [k, v] of Object.entries(patch)) {
    if (!v) sp.delete(k);
    else sp.set(k, v);
  }
  if (!CATEGORIES.has(sp.get("category") || "")) sp.delete("category");
  if (sp.get("channel") !== "firstParty") sp.delete("channel");
  const q = sp.toString();
  return q ? `${location.pathname}?${q}` : location.pathname;
}

function reduceMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

type PageJson = {
  v: 1;
  page: number;
  cards: Array<{
    key: string;
    anchorAt: string;
    item: {
      id: string;
      title: string;
      summary: string | null;
      reason?: string | null;
      source?: { name?: string };
      publishedAt: string | null;
      category: string | null;
      channel?: string;
      url?: string;
      originalUrl?: string;
      links?: { original?: string };
      x?: { authorName?: string; handle?: string; avatarUrl?: string | null; text?: string } | null;
      /** site-data removed this; tolerate leftover keys and never render. */
      score?: unknown;
    };
    group: { additionalSourceCount: number } | null;
  }>;
  day_counts: Record<string, number>;
  next: string | null;
};

function dropScore<T extends { score?: unknown }>(value: T): Omit<T, "score"> {
  const { score: _ignored, ...rest } = value;
  void _ignored;
  return rest;
}

function cardHtml(card: PageJson["cards"][number]) {
  const item = dropScore(card.item || { id: "", title: "", summary: null, source: { name: "" }, publishedAt: null, category: null });
  if (!item.id || !item.title) return "";
  const x = item.channel === "x" ? item.x : null;
  const sourceName = x
    ? x.authorName || x.handle || ""
    : item.source?.name || "";
  const source = x
    ? `<span class="ft-x-line">${x.authorName ? `<span>${escapeHtml(x.authorName)}</span>` : ""}${x.handle ? `<span class="ft-x-handle">@${escapeHtml(x.handle)}</span>` : ""}</span>`
    : sourceName
      ? escapeHtml(sourceName)
      : "";
  const excerpt = x && (x.text || item.summary)
    ? `<p class="ft-x-excerpt">${escapeHtml(x.text || item.summary || "")}</p>`
    : item.summary
      ? `<p class="mt-1 line-clamp-2 text-[14.5px] leading-[1.7] text-ink-3">${escapeHtml(item.summary)}</p>`
      : "";
  const more = card.group && card.group.additionalSourceCount >= 1
    ? `<span class="text-ink-4">另 ${card.group.additionalSourceCount} 家</span>`
    : "";
  const reason = item.reason
    ? `<p class="mt-1 text-[12.5px] text-ink-4">${escapeHtml(item.reason)}</p>`
    : "";
  const href = hrefCard(cfg.base, item);
  const snapshot = escapeHtml(JSON.stringify({
    id: item.id,
    title: item.title,
    url: siteRel(item.originalUrl || item.links?.original || href),
    source: sourceName,
    date: item.publishedAt || "",
  }));
  return `<li data-card-key="${escapeHtml(card.key)}" class="group/slot bleed">
    <article class="relative min-w-0 lg:card lg:px-[18px] lg:pb-[14px] lg:pt-[15px]" data-item-id="${escapeHtml(item.id)}" data-ft-item='${snapshot}'>
      <header class="flex min-h-[22px] items-center gap-1.5 text-[12.5px] text-ink-4">
        ${source}
        <span class="ml-auto inline-flex">
          <button type="button" class="inline-flex size-11 items-center justify-center rounded-control text-ink-4 lg:size-[26px]" data-ft-star='${snapshot}' aria-pressed="false" aria-label="收藏">☆</button>
        </span>
      </header>
      <h3 class="mt-1.5 text-[17px] font-[650] leading-[1.5] text-ink"><a href="${escapeHtml(href)}">${escapeHtml(item.title)}</a></h3>
      ${excerpt}${reason}${more}
    </article>
  </li>`;
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return `${m}月${d}日`;
}

const timelineState = {
  filter: "all",
  pages: 1,
  next: null as string | null,
  keys: new Set<string>(),
  days: new Map<string, { count: number; cards: PageJson["cards"] }>(),
  original: "",
  loading: false,
  error: false,
  fetches: 0,
};

function timelineRoot() {
  return document.querySelector<HTMLElement>("[data-ft-timeline]");
}

function emptyStateHtml(filter = "all") {
  const title = filter === "all"
    ? "过去 48 小时没有达到上榜条件的事件。"
    : "暂无符合条件的内容";
  return `<div class="lg:card"><div class="flex flex-col items-center px-6 py-14 text-center"><div class="text-[15px] font-semibold text-ink-2">${title}</div><p class="ft-asof mt-2">${asofLine()}</p></div></div>`;
}

function renderTimeline() {
  const root = timelineRoot();
  if (!root) return;
  if (!timelineState.days.size) {
    root.innerHTML = emptyStateHtml(timelineState.filter);
    return;
  }
  const sections = [...timelineState.days.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, pack]) => {
      pack.cards.sort((a, b) => String(b.anchorAt || "").localeCompare(String(a.anchorAt || "")));
      return `<section aria-label="${escapeHtml(day)}">
      <div class="bleed sticky top-[var(--bar-h)] z-20 bg-daybar lg:bg-bg">
        <div class="flex h-11 items-center gap-2 text-[14px] font-bold text-ink">${escapeHtml(dayLabel(day))}<span class="ml-auto text-[12.5px] font-normal text-ink-4">${pack.count} 条</span></div>
      </div>
      <ol>${pack.cards.map(cardHtml).join("")}</ol>
    </section>`;
    })
    .join("");
  const end = timelineState.loading
    ? `<div class="ft-feed-end"><span class="ft-feed-end-note">正在加载</span></div>`
    : timelineState.error
      ? `<div class="ft-feed-end"><button type="button" class="ft-feed-btn is-error" data-ft-retry>加载失败 · 重试</button></div>`
      : timelineState.next
        ? (timelineState.fetches >= AUTO_FETCHES || reduceMotion()
          ? `<div class="ft-feed-end"><button type="button" class="ft-feed-btn" data-ft-more>加载更多</button></div>`
          : `<div class="ft-feed-end" data-ft-sentinel aria-hidden="true"></div>`)
        : `<div class="ft-feed-end"><span class="ft-feed-end-note">已经到底了</span></div>`;
  root.innerHTML = `${sections}${end}`;
  syncStarButtons(root);
}

function ingestPage(page: PageJson) {
  for (const card of page.cards || []) {
    if (!card?.key || !card.item?.id || timelineState.keys.has(card.key)) continue;
    timelineState.keys.add(card.key);
    const day = (card.anchorAt || "").slice(0, 10);
    if (!day) continue;
    const pack = timelineState.days.get(day) || { count: page.day_counts?.[day] || 0, cards: [] };
    pack.cards.push({ ...card, item: dropScore(card.item) });
    pack.cards.sort((a, b) => String(b.anchorAt || "").localeCompare(String(a.anchorAt || "")));
    pack.count = page.day_counts?.[day] || pack.cards.length;
    timelineState.days.set(day, pack);
  }
  timelineState.next = page.next;
  timelineState.pages = page.page;
}

async function fetchPage(filter: string, page: number): Promise<PageJson | null> {
  const url = `${cfg.base}data/timeline/${filter}/page-${page}.json`;
  const res = await fetch(url, { cache: page === 1 ? "no-store" : "default" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<PageJson>;
}

async function loadMore() {
  if (!timelineState.next || timelineState.loading) return;
  const nextPage = timelineState.pages + 1;
  timelineState.loading = true;
  timelineState.error = false;
  renderTimeline();
  try {
    const page = await fetchPage(timelineState.filter, nextPage);
    if (!page) throw new Error("empty");
    ingestPage(page);
    timelineState.fetches += 1;
    timelineState.loading = false;
    saveTimelinePos();
    renderTimeline();
    observeSentinel();
  } catch {
    timelineState.loading = false;
    timelineState.error = true;
    renderTimeline();
  }
}

function observeSentinel() {
  const el = document.querySelector("[data-ft-sentinel]");
  if (!el || !timelineState.next || timelineState.fetches >= AUTO_FETCHES || reduceMotion()) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      void loadMore();
    }
  }, { rootMargin: "600px 0px" });
  io.observe(el);
}

function visibleCardKey() {
  const cards = [...document.querySelectorAll<HTMLElement>("[data-card-key]")];
  const mid = window.innerHeight * 0.35;
  return cards.find((el) => {
    const top = el.getBoundingClientRect().top;
    return top >= 0 && top <= mid;
  })?.dataset.cardKey || cards.find((el) => el.getBoundingClientRect().bottom > 0)?.dataset.cardKey || null;
}

function saveTimelinePos() {
  const store = session();
  if (!store || !timelineRoot()) return;
  writeJson(store, TIMELINE_PREFIX + timelineState.filter, {
    pages: timelineState.pages,
    fetches: timelineState.fetches,
    next: timelineState.next,
    anchor: visibleCardKey(),
    y: window.scrollY,
  });
}

async function restoreTimeline(filter: string) {
  const snap = readJson<{ pages: number; fetches: number; next: string | null; anchor: string | null; y: number } | null>(
    session(),
    TIMELINE_PREFIX + filter,
    null,
  );
  if (!snap?.pages || snap.pages < 2) return false;
  for (let p = 2; p <= snap.pages; p++) {
    try {
      const page = await fetchPage(filter, p);
      if (page) ingestPage(page);
    } catch {
      break;
    }
  }
  timelineState.fetches = snap.fetches || Math.max(0, snap.pages - 1);
  renderTimeline();
  if (typeof snap.y === "number") window.scrollTo(0, snap.y);
  const target = snap.anchor && document.querySelector(`[data-card-key="${CSS.escape(snap.anchor)}"]`);
  if (target && Math.abs((target as HTMLElement).getBoundingClientRect().top) > window.innerHeight) {
    target.scrollIntoView();
  }
  return true;
}

async function applyFilter(filter: string, push = true) {
  timelineState.filter = filter;
  timelineState.pages = 1;
  timelineState.next = null;
  timelineState.keys = new Set();
  timelineState.days = new Map();
  timelineState.loading = false;
  timelineState.error = false;
  timelineState.fetches = 0;
  if (push) history.pushState({ ftFilter: filter }, "", hrefWith(filter === "firstParty"
    ? { channel: "firstParty", category: null }
    : filter === "all"
      ? { channel: null, category: null }
      : { category: filter, channel: null }));
  document.querySelectorAll("a[data-ft-filter], button[data-ft-filter]").forEach((el) => {
    if (el.closest("[data-ft-timeline]")) return;
    const on = el.getAttribute("data-ft-filter") === filter;
    if (on) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  const root = timelineRoot();
  if (!root) return;
  if (!cfg.hasTimeline) {
    if (filter === "all" && timelineState.original) {
      root.innerHTML = timelineState.original;
      syncStarButtons(root);
      return;
    }
    root.innerHTML = emptyStateHtml(filter);
    return;
  }
  try {
    const page = await fetchPage(filter, 1);
    if (!page) throw new Error("empty");
    ingestPage(page);
    renderTimeline();
    const restored = await restoreTimeline(filter);
    if (!restored) observeSentinel();
  } catch {
    root.innerHTML = emptyStateHtml(filter);
  }
}

function asofLine() {
  const stamp = beijingStamp(cfg.dataAsOf || cfg.builtAt);
  const stale = cfg.dataAsOf && cfg.builtAt && Date.parse(cfg.builtAt) - Date.parse(cfg.dataAsOf) > 6 * 3600 * 1000;
  return `数据截至 ${stamp}（北京时间）${stale ? " · 数据可能已过期" : ""}`;
}

function beijingStamp(iso: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso)).replace(/\//g, "-");
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function isFilterControl(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof Element)) return false;
  const control = el.closest("a[data-ft-filter], button[data-ft-filter]");
  if (!control) return false;
  if (control.closest("[data-ft-timeline]")) return false;
  return true;
}

function bindFilters() {
  const root = timelineRoot();
  if (root) timelineState.original = root.innerHTML;
  document.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (!isFilterControl(target)) return;
    const control = target.closest("a[data-ft-filter], button[data-ft-filter]") as HTMLElement;
    const key = control.getAttribute("data-ft-filter") || "all";
    if (key === "featured") return;
    const href = control.getAttribute("href") || "";
    if (key === "all" && /(?:^|[/?])all(?:\/|$|\.html)/.test(href)) return;
    event.preventDefault();
    void applyFilter(key === "featured" ? "all" : key);
  });
  document.addEventListener("click", (event) => {
    const more = (event.target as HTMLElement).closest("[data-ft-more], [data-ft-retry]");
    if (!more) return;
    event.preventDefault();
    void loadMore();
  });
  document.addEventListener("click", (event) => {
    const open = (event.target as HTMLElement).closest("[data-ft-filters-open]");
    if (open) {
      event.preventDefault();
      const sheet = document.querySelector<HTMLElement>("[data-ft-filter-sheet]");
      if (sheet) {
        sheet.hidden = false;
        document.querySelectorAll("[data-ft-filters-open]").forEach((btn) => btn.setAttribute("aria-expanded", "true"));
      }
      return;
    }
    const close = (event.target as HTMLElement).closest("[data-ft-filters-close]");
    if (close) {
      event.preventDefault();
      const sheet = document.querySelector<HTMLElement>("[data-ft-filter-sheet]");
      if (sheet) sheet.hidden = true;
      document.querySelectorAll("[data-ft-filters-open]").forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }
  });
  document.addEventListener("click", (event) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-card-key]");
    if (card?.dataset.cardKey) {
      const store = session();
      if (store) {
        const prev = readJson<Record<string, unknown>>(store, TIMELINE_PREFIX + timelineState.filter, {});
        writeJson(store, TIMELINE_PREFIX + timelineState.filter, { ...prev, anchor: card.dataset.cardKey, y: window.scrollY, pages: timelineState.pages, fetches: timelineState.fetches, next: timelineState.next });
      }
    }
  });
  window.addEventListener("popstate", () => {
    void applyFilter(filterFromParams(currentParams()).filter, false);
  });
  window.addEventListener("pagehide", saveTimelinePos);
  const initial = filterFromParams(currentParams()).filter;
  void (async () => {
    if (!cfg.hasTimeline) {
      try {
        cfg.hasTimeline = (await fetch(asset("data/timeline/all/index.json"))).ok;
      } catch {
        cfg.hasTimeline = false;
      }
    }
    if (initial !== "all" || cfg.hasTimeline) await applyFilter(initial, false);
  })();
}

function asset(path: string) {
  return `${cfg.base}${path.replace(/^\//, "")}`;
}

/** Site-root-relative path (no leading ./ or /) so /starred/ can resolve weekly links. */
function siteRel(url: string) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("#") || raw.startsWith("mailto:")) return raw;
  return raw.replace(/^\.\//, "").replace(/^\//, "");
}

function pageHref(name: "search" | "starred" | "index" | "hot" | "daily" | "more" | "weekly") {
  if (cfg.base === "./" || cfg.base === "") return `${name === "index" ? "index" : name}.html`;
  if (name === "index") return cfg.base;
  return `${cfg.base}${name}/`;
}

function siteHref(url: string) {
  const rel = siteRel(url);
  if (!rel) return pageHref("hot");
  if (/^https?:\/\//i.test(rel) || rel.startsWith("#") || rel.startsWith("mailto:")) return rel;
  if (rel.includes(".html")) {
    if (cfg.base === "./" || cfg.base === "") return rel.startsWith("./") ? rel : rel;
    const [file, hash = ""] = rel.split("#");
    const page = file.replace(/\.html$/, "").replace(/^\.\//, "");
    return `${cfg.base}${page === "index" ? "" : `${page}/`}${hash ? `#${hash}` : ""}`;
  }
  return asset(rel);
}

let searchModuleLoaded = false;
let searchIndex: { v: 1; docs: Array<{ id: string; t: string; title: string; summary: string; source: string; category: string | null; date: string; url: string }> } | null = null;
let searchIndexFailed = false;

function loadSearchModule() {
  if (searchModuleLoaded) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = asset("assets/search.js");
    s.onload = () => {
      searchModuleLoaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error("search module"));
    document.head.appendChild(s);
  });
}

async function loadSearchIndex() {
  if (searchIndex || searchIndexFailed) return searchIndex;
  try {
    const res = await fetch(asset("data/search-index.json"));
    if (!res.ok) throw new Error(String(res.status));
    searchIndex = await res.json();
  } catch {
    searchIndexFailed = true;
    searchIndex = null;
  }
  return searchIndex;
}

function renderHits(host: HTMLElement, q: string, docs: Array<{ title: string; summary: string; url: string; source: string; date: string }>) {
  if (!q.trim()) {
    host.innerHTML = `<p class="text-[14px] text-ink-4">输入关键词搜索标题和摘要。</p>`;
    announce("请输入搜索词");
    return;
  }
  if (!docs.length) {
    host.innerHTML = `<p class="text-[14px] text-ink-2">没有找到「${escapeHtml(q)}」相关内容</p>`;
    announce(`没有找到${q}相关内容`);
    return;
  }
  host.innerHTML = `<p class="mb-3 text-[13px] text-ink-4" aria-live="polite">${docs.length} 条结果</p>${docs
    .slice(0, 20)
    .map((d) => {
      const href = /^https?:\/\//i.test(d.url) ? d.url : asset(String(d.url || "").replace(/^\//, ""));
      return `<a class="ft-search-hit" href="${escapeHtml(href)}"><h3>${escapeHtml(d.title)}</h3>${d.summary ? `<p>${escapeHtml(d.summary)}</p>` : ""}${d.source || d.date ? `<p>${escapeHtml([d.source, d.date].filter(Boolean).join(" · "))}</p>` : ""}</a>`;
    })
    .join("")}`;
  announce(`${Math.min(docs.length, 20)} 条结果`);
}

async function runSearch(q: string, host: HTMLElement) {
  try {
    await loadSearchModule();
    const index = await loadSearchIndex();
    if (!index) {
      host.innerHTML = `<p class="text-[14px] text-ink-2">搜索暂时不可用，请稍后再试</p>`;
      announce("搜索暂时不可用");
      return;
    }
    const api = (window as Window & { __FT_SEARCH__?: { searchDocs: (index: unknown, q: string) => typeof index extends never ? never : Array<{ title: string; summary: string; url: string; source: string; date: string }> } }).__FT_SEARCH__;
    const docs = api ? api.searchDocs(index, q) : [];
    renderHits(host, q, docs);
  } catch {
    host.innerHTML = `<p class="text-[14px] text-ink-2">搜索暂时不可用，请稍后再试</p>`;
  }
}

function bindSearch() {
  const desk = document.querySelector<HTMLFormElement>('[data-ft-search="desk"]');
  const input = desk?.querySelector<HTMLInputElement>("input[name=q]");
  input?.addEventListener("focus", () => {
    void loadSearchModule();
  });
  desk?.addEventListener("submit", (event) => {
    const q = input?.value.trim() || "";
    if (!q) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    location.href = `${pageHref("search")}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement).isContentEditable)) {
      event.preventDefault();
      if (input) input.focus();
      else openPhoneSearch();
    }
    if (event.key === "Escape") closePhoneSearch(true);
  });

  document.querySelectorAll("[data-ft-search=phone]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      openPhoneSearch(btn as HTMLElement);
    });
  });

  if (cfg.page === "search") {
    const host = document.getElementById("ft-search-page");
    const q = currentParams().get("q") || "";
    const field = document.querySelector<HTMLInputElement>("#ft-search-q");
    if (field) field.value = q;
    if (host) void runSearch(q, host);
    field?.addEventListener("input", () => {
      const next = field.value.trim();
      history.replaceState(null, "", next ? `?q=${encodeURIComponent(next)}` : location.pathname);
      void runSearch(next, host!);
    });
  }
}

let searchReturn: HTMLElement | null = null;

function openPhoneSearch(from?: HTMLElement) {
  searchReturn = from || (document.activeElement as HTMLElement | null);
  let layer = document.getElementById("ft-search-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "ft-search-layer";
    layer.className = "ft-search-layer";
    layer.innerHTML = `<div class="ft-search-head"><label class="sr-only" for="ft-search-mobile">搜索</label><input id="ft-search-mobile" type="search" placeholder="搜索标题、摘要…" maxlength="200" /><button type="button" class="ft-search-cancel" data-ft-search-close>取消</button></div><div id="ft-search-mobile-hits" class="ft-search-results"></div>`;
    document.body.appendChild(layer);
    layer.querySelector("[data-ft-search-close]")?.addEventListener("click", () => closePhoneSearch(true));
    const field = layer.querySelector<HTMLInputElement>("#ft-search-mobile");
    field?.addEventListener("focus", () => void loadSearchModule());
    field?.addEventListener("input", () => {
      const q = field.value.trim();
      void runSearch(q, document.getElementById("ft-search-mobile-hits")!);
    });
  }
  layer.hidden = false;
  layer.querySelector<HTMLInputElement>("#ft-search-mobile")?.focus();
  void loadSearchModule();
}

function closePhoneSearch(restore: boolean) {
  const layer = document.getElementById("ft-search-layer");
  if (!layer || layer.hidden) return;
  layer.hidden = true;
  if (restore) searchReturn?.focus();
}

function renderStarred() {
  const host = document.getElementById("ft-starred");
  if (!host) return;
  const items = getStars();
  if (!items.length) {
    host.innerHTML = `<div class="flex flex-col items-center px-6 py-14 text-center"><div class="text-[15px] font-semibold text-ink-2">还没有收藏</div><p class="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-4">在卡片上点星标，条目会保存在这台浏览器里。</p></div>`;
    return;
  }
  host.innerHTML = items.map((item) => {
    const href = siteHref(item.url);
    const link = href
      ? `<a href="${escapeHtml(href)}" class="text-[17px] font-[650] text-ink">${escapeHtml(item.title)}</a>`
      : `<span class="text-[17px] font-[650] text-ink">${escapeHtml(item.title)}</span>`;
    const meta = [item.source, item.date].filter(Boolean).join(" · ");
    return `<article class="border-b border-line-soft py-4" data-item-id="${escapeHtml(item.id)}">
      <div class="flex items-start gap-3">${link}<button type="button" class="ml-auto inline-flex size-11 items-center justify-center text-accent" data-ft-star='${escapeHtml(JSON.stringify(item))}' aria-pressed="true" aria-label="取消收藏">★</button></div>
      ${meta ? `<p class="mt-1 text-[12.5px] text-ink-4">${escapeHtml(meta)}</p>` : ""}
    </article>`;
  }).join("");
  syncStarButtons(host);
}

async function refreshFromMeta() {
  const stamp = () => beijingStamp(cfg.dataAsOf).slice(-5) || "--:--";
  try {
    const res = await fetch(asset("data/meta.json"), { cache: "no-store" });
    if (!res.ok) throw new Error("meta");
    const meta = await res.json() as { data_as_of?: string };
    if (meta.data_as_of && cfg.dataAsOf && meta.data_as_of > cfg.dataAsOf && cfg.hasTimeline) {
      cfg.dataAsOf = meta.data_as_of;
      await applyFilter(timelineState.filter, false);
      toast(`已更新 · 数据截至 ${beijingStamp(meta.data_as_of).slice(-5)}`);
    } else {
      toast(`已是最新 · 数据截至 ${stamp()}`);
    }
  } catch {
    toast(`刷新失败，显示的是 ${stamp()} 的数据`);
  }
}

function bindTop() {
  document.querySelectorAll<HTMLButtonElement>("[data-ft-top]").forEach((btn) => {
    const sync = () => {
      const canScroll = document.documentElement.scrollHeight > window.innerHeight + 8;
      const show = canScroll && window.scrollY > 80;
      btn.hidden = !show;
      btn.classList.toggle("is-on", show);
      btn.classList.toggle("translate-y-2", !show);
    };
    btn.hidden = true;
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.scrollTo({ top: 0, left: 0, behavior: reduceMotion() ? "auto" : "smooth" });
    });
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });
}

function bindToc() {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-ft-toc]")];
  const panel = document.querySelector<HTMLElement>("[data-ft-outline]");
  if (!buttons.length || !panel) return;
  const close = () => {
    panel.hidden = true;
    buttons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
  };
  const open = () => {
    panel.hidden = false;
    buttons.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
  };
  buttons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      if (panel.hidden) open();
      else close();
    });
  });
  panel.querySelector("[data-ft-outline-close]")?.addEventListener("click", (event) => {
    event.preventDefault();
    close();
    buttons[0]?.focus();
  });
  panel.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => close());
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      close();
      buttons[0]?.focus();
    }
  });
}

function bindFaces() {
  let openBtn: HTMLButtonElement | null = null;
  const close = () => {
    if (!openBtn) return;
    const id = openBtn.getAttribute("aria-controls");
    const pop = id ? document.getElementById(id) : null;
    if (pop?.hasAttribute("data-ft-faces-pop")) pop.remove();
    openBtn.setAttribute("aria-expanded", "false");
    openBtn = null;
  };
  const open = (btn: HTMLButtonElement) => {
    close();
    const names = btn.getAttribute("title") || "";
    const label = btn.getAttribute("aria-label") || "";
    const total = Number((label.match(/(\d+)\s*位/) || [])[1] || 0);
    const listed = names.split("、").map((s) => s.trim()).filter(Boolean);
    const more = total > listed.length ? total - listed.length : 0;
    let id = btn.getAttribute("aria-controls") || "";
    if (!id) {
      id = `ft-faces-${Math.random().toString(36).slice(2, 8)}`;
      btn.setAttribute("aria-controls", id);
    }
    const pop = document.createElement("div");
    pop.id = id;
    pop.setAttribute("data-ft-faces-pop", "");
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "参与讨论的来源");
    pop.className = "fixed z-50 max-h-[240px] w-[240px] overflow-y-auto rounded-control border border-line bg-raised p-3 text-[12.5px] leading-relaxed text-ink-2";
    const r = btn.getBoundingClientRect();
    const below = window.innerHeight - r.bottom > 240;
    pop.style.top = `${below ? r.bottom + 6 : Math.max(8, r.top - 246)}px`;
    pop.style.left = `${Math.min(Math.max(8, r.left), document.documentElement.clientWidth - 248)}px`;
    pop.innerHTML = `${listed.length ? `<p>${escapeHtml(listed.join("、"))}</p>` : ""}${more > 0 ? `<p class="mt-2 text-[11.5px] text-ink-4">另有 ${more} 位未列出</p>` : ""}`;
    document.body.appendChild(pop);
    btn.setAttribute("aria-expanded", "true");
    openBtn = btn;
  };
  document.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("button[aria-label*='位参与者']");
    if (btn) {
      event.preventDefault();
      event.stopPropagation();
      if (openBtn === btn) close();
      else open(btn);
      return;
    }
    if (openBtn && !(event.target as HTMLElement).closest("[data-ft-faces-pop]")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !openBtn) return;
    const btn = openBtn;
    close();
    btn.focus();
  });
  window.addEventListener("scroll", close, { passive: true });
  window.addEventListener("resize", close);
}

function bindHotMethod() {
  document.querySelectorAll("[data-ft-hot-method]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const method = document.getElementById("hot-method");
      if (!(method instanceof HTMLDetailsElement)) return;
      method.open = true;
      method.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    });
  });
}

function bindPtr() {
  let startY = 0;
  let pulling = false;
  document.addEventListener("touchstart", (event) => {
    if (window.scrollY > 0) return;
    startY = event.touches[0]?.clientY || 0;
    pulling = true;
  }, { passive: true });
  document.addEventListener("touchend", (event) => {
    if (!pulling) return;
    pulling = false;
    const y = event.changedTouches[0]?.clientY || 0;
    if (window.scrollY <= 0 && y - startY >= 64) void refreshFromMeta();
  }, { passive: true });

  document.querySelectorAll("nav[aria-label='底部导航'] [aria-current='page']").forEach((tab) => {
    tab.addEventListener("click", (event) => {
      if (window.scrollY > 0) return;
      event.preventDefault();
      void refreshFromMeta();
    });
  });
}

function boot() {
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");
  bindTheme();
  bindStars();
  bindFilters();
  bindSearch();
  bindPtr();
  bindTop();
  bindToc();
  bindHotMethod();
  bindFaces();
  if (cfg.page === "starred") renderStarred();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
