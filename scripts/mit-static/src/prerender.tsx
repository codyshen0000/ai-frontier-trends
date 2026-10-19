import { renderToString } from "react-dom/server";
import { DailyScreen, HomeScreen, HotScreen, MoreScreen, SearchScreen, StarredScreen } from "./pages";
import { SITE } from "@aihot/site";
import generated from "./covers.generated.json";

export const pages = [
  { file: "index.html", title: "精选", pathname: "/", page: "home", node: <HomeScreen /> },
  { file: "hot.html", title: withSubjectSafe("热点榜"), pathname: "/hot", page: "hot", node: <HotScreen /> },
  { file: "daily.html", title: withSubjectSafe("日报"), pathname: "/daily", page: "daily", node: <DailyScreen /> },
  { file: "search.html", title: "搜索", pathname: "/search", page: "search", node: <SearchScreen /> },
  { file: "starred.html", title: "收藏", pathname: "/starred", page: "starred", node: <StarredScreen /> },
  { file: "more.html", title: "我的", pathname: "/more", page: "more", node: <MoreScreen /> },
  { file: "hot-empty.html", title: withSubjectSafe("热点榜"), pathname: "/hot", page: "hot", node: <HotScreen emptyCover /> },
  { file: "daily-empty.html", title: withSubjectSafe("日报"), pathname: "/daily", page: "daily", node: <DailyScreen emptyCover /> },
];

function withSubjectSafe(noun: string) {
  return /[A-Za-z0-9]$/.test(SITE.subject) ? `${SITE.subject} ${noun}` : `${SITE.subject}${noun}`;
}

const BOOT = `(function(){try{var t=localStorage.getItem("ft:theme");if(!t){var old=localStorage.getItem("theme");if(old==="light"||old==="dark"||old==="system"){t=old;localStorage.setItem("ft:theme",old)}}if(t!=="light"&&t!=="dark"&&t!=="system")t="system";var resolved=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;document.documentElement.setAttribute("data-theme",resolved);document.documentElement.setAttribute("data-ft-theme-pref",t);document.documentElement.classList.add("js");document.documentElement.classList.remove("no-js");}catch(e){document.documentElement.setAttribute("data-theme","light");document.documentElement.classList.add("js");document.documentElement.classList.remove("no-js");}})();`;

export function renderPage(node: JSX.Element, title: string, cssHref: string, extra: {
  page: string;
  hasTimeline?: boolean;
  hydrateHref?: string;
  rssHref?: string;
  dataAsOf?: string;
  builtAt?: string;
  base?: string;
} = { page: "home" }) {
  const markup = renderToString(node);
  const dataAsOf = extra.dataAsOf || generated.asOf || "";
  const builtAt = extra.builtAt || new Date().toISOString();
  const rss = extra.rssHref || "feed/weekly.xml";
  const hydrate = extra.hydrateHref || "assets/hydrate.js";
  const config = {
    base: extra.base || "./",
    page: extra.page,
    dataAsOf,
    builtAt,
    hasTimeline: !!extra.hasTimeline,
    filter: "all",
  };
  return `<!DOCTYPE html>
<html lang="zh-CN" class="no-js">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="color-scheme" content="light dark"/>
<title>${title} · ${SITE.name}</title>
<link rel="stylesheet" href="${cssHref}"/>
<link rel="alternate" type="application/rss+xml" title="前沿趋势 周报" href="${rss}"/>
<script>${BOOT}</script>
</head>
<body class="bg-bg text-ink antialiased">
<div id="ft-live" class="ft-live" aria-live="polite"></div>
<div id="ft-toast" class="ft-toast" hidden></div>
${markup}
<script>window.__FT__=${JSON.stringify(config)}</script>
<script src="${hydrate}" defer></script>
</body>
</html>
`;
}

export { pages as PAGES };
