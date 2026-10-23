import { renderToString } from "react-dom/server";
import {
  AllScreen,
  DailyArchiveScreen,
  DailyScreen,
  EventScreen,
  HomeScreen,
  HotScreen,
  ItemScreen,
  MonthlyScreen,
  MoreScreen,
  SearchScreen,
  StarredScreen,
  TopicsScreen,
  WeeklyScreen,
} from "./pages";
import { SITE } from "@aihot/site";
import { DAILY_HASH_REDIRECT_JS } from "../../daily_paths.mjs";
import { builtAt, dailyByKey, dailyIndex, dataAsOf, eventById, events, hasSelectedFeed, items } from "./site";
import { dailyPageFile, eventPageFile, itemPageFile } from "./routes";

export const pages = [
  { file: "index.html", title: "精选", pathname: "/", page: "home", node: <HomeScreen /> },
  { file: "all.html", title: "全部动态", pathname: "/all", page: "all", node: <AllScreen /> },
  { file: "topics.html", title: "主题", pathname: "/topics", page: "topics", node: <TopicsScreen /> },
  { file: "hot.html", title: withSubjectSafe("热点榜"), pathname: "/hot", page: "hot", node: <HotScreen /> },
  { file: "daily.html", title: withSubjectSafe("日报"), pathname: "/daily", page: "daily", node: <DailyScreen /> },
  { file: "daily-archive.html", title: "日报合订本", pathname: "/daily/archive", page: "daily-archive", node: <DailyArchiveScreen /> },
  { file: "weekly.html", title: withSubjectSafe("周报"), pathname: "/weekly", page: "weekly", node: <WeeklyScreen /> },
  { file: "monthly.html", title: withSubjectSafe("月报"), pathname: "/monthly", page: "monthly", node: <MonthlyScreen /> },
  { file: "search.html", title: "搜索", pathname: "/search", page: "search", node: <SearchScreen /> },
  { file: "starred.html", title: "收藏", pathname: "/starred", page: "starred", node: <StarredScreen /> },
  { file: "more.html", title: "我的", pathname: "/more", page: "more", node: <MoreScreen /> },
  { file: "hot-empty.html", title: withSubjectSafe("热点榜"), pathname: "/hot", page: "hot", node: <HotScreen emptyCover /> },
  { file: "daily-empty.html", title: withSubjectSafe("日报"), pathname: "/daily", page: "daily", node: <DailyScreen emptyCover /> },
];

for (const item of items) {
  const event = item.storyPublicId ? eventById.get(item.storyPublicId) || null : null;
  pages.push({
    file: itemPageFile(item.id),
    title: item.title,
    pathname: `/items/${item.id}`,
    page: "item",
    node: <ItemScreen item={item} event={event} />,
  });
}

for (const event of events) {
  pages.push({
    file: eventPageFile(event.publicId),
    title: event.title,
    pathname: `/story/${event.publicId}`,
    page: "event",
    node: <EventScreen event={event} />,
  });
}

for (const entry of dailyIndex) {
  const report = dailyByKey(entry.key);
  if (!report) continue;
  pages.push({
    file: dailyPageFile(entry.key),
    title: withSubjectSafe(`日报 · ${entry.key}`),
    pathname: `/daily/${entry.key}`,
    page: "daily",
    node: <DailyScreen report={report} dated />,
  });
}

function withSubjectSafe(noun: string) {
  return /[A-Za-z0-9]$/.test(SITE.subject) ? `${SITE.subject} ${noun}` : `${SITE.subject}${noun}`;
}

const BOOT = `(function(){try{var t=localStorage.getItem("ft:theme");if(!t){var old=localStorage.getItem("theme");if(old==="light"||old==="dark"||old==="system"){t=old;localStorage.setItem("ft:theme",old)}}if(t!=="light"&&t!=="dark"&&t!=="system")t="system";var resolved=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;document.documentElement.setAttribute("data-theme",resolved);document.documentElement.setAttribute("data-ft-theme-pref",t);document.documentElement.classList.add("js");document.documentElement.classList.remove("no-js");}catch(e){document.documentElement.setAttribute("data-theme","light");document.documentElement.classList.add("js");document.documentElement.classList.remove("no-js");}})();`;

export function renderPage(node: JSX.Element, title: string, cssHref: string, extra: {
  page: string;
  hasTimeline?: boolean;
  hydrateHref?: string;
  rssHref?: string;
  weeklyRss?: string;
  selectedRss?: string;
  dataAsOf?: string;
  builtAt?: string;
  base?: string;
} = { page: "home" }) {
  const markup = renderToString(node);
  const asOf = extra.dataAsOf || dataAsOf || "";
  const built = extra.builtAt || builtAt || new Date().toISOString();
  const weeklyRss = extra.weeklyRss || extra.rssHref || "feed/weekly.xml";
  const selectedRss = extra.selectedRss ?? (hasSelectedFeed ? "feed.xml" : "");
  const hydrate = extra.hydrateHref || "assets/hydrate.js";
  const config = {
    base: extra.base || "./",
    page: extra.page,
    dataAsOf: asOf,
    builtAt: built,
    hasTimeline: !!extra.hasTimeline,
    filter: extra.page === "all" ? "all" : "all",
  };
  return `<!DOCTYPE html>
<html lang="zh-CN" class="no-js">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="color-scheme" content="light dark"/>
<title>${escapeHtml(title)} · ${SITE.name}</title>
<link rel="stylesheet" href="${cssHref}"/>
<link rel="alternate" type="application/rss+xml" title="前沿趋势 周报" href="${weeklyRss}"/>
${selectedRss ? `<link rel="alternate" type="application/rss+xml" title="前沿趋势" href="${selectedRss}"/>` : ""}
<script>${BOOT}</script>
</head>
<body class="bg-bg text-ink antialiased">
<div id="ft-live" class="ft-live" aria-live="polite"></div>
<div id="ft-toast" class="ft-toast" hidden></div>
${markup}
${extra.page === "daily" ? `<script>${DAILY_HASH_REDIRECT_JS}</script>` : ""}
<script>window.__FT__=${JSON.stringify(config)}</script>
<script src="${hydrate}" defer></script>
</body>
</html>
`;
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export { pages as PAGES };
