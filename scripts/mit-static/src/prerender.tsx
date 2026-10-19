import { renderToString } from "react-dom/server";
import { DailyScreen, HomeScreen, HotScreen } from "./pages";
import { SITE } from "@aihot/site";

export const pages = [
  { file: "index.html", title: "精选", pathname: "/", node: <HomeScreen /> },
  { file: "hot.html", title: withSubjectSafe("热点榜"), pathname: "/hot", node: <HotScreen /> },
  { file: "daily.html", title: withSubjectSafe("日报"), pathname: "/daily", node: <DailyScreen /> },
  { file: "hot-empty.html", title: withSubjectSafe("热点榜"), pathname: "/hot", node: <HotScreen emptyCover /> },
  { file: "daily-empty.html", title: withSubjectSafe("日报"), pathname: "/daily", node: <DailyScreen emptyCover /> },
];

function withSubjectSafe(noun: string) {
  return /[A-Za-z0-9]$/.test(SITE.subject) ? `${SITE.subject} ${noun}` : `${SITE.subject}${noun}`;
}

export function renderPage(node: JSX.Element, title: string, cssHref: string) {
  const markup = renderToString(node);
  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="color-scheme" content="light"/>
<title>${title} · ${SITE.name}</title>
<link rel="stylesheet" href="${cssHref}"/>
</head>
<body class="bg-bg text-ink antialiased">
${markup}
</body>
</html>
`;
}

export { pages as PAGES };
