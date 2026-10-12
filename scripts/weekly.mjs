import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function fromHtml(html, date) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const lead = html.match(/<div class=["']lead["'][^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>/i);
  const title = h1 ? stripTags(h1[1]) : `AI 前沿趋势周报 · ${date}`;
  const rawLead = lead ? stripTags(lead[1]) : "";
  const summary = rawLead.replace(/【[^】]*】/g, "").replace(/\s+/g, " ").trim();
  const issueMatch = title.match(/第\s*(\d+)\s*期/);
  return {
    title,
    summary,
    issue: issueMatch ? Number(issueMatch[1]) : null,
  };
}

export function listWeeklyIssues(contentDir) {
  const weeklyDir = join(contentDir, "weekly");
  if (!existsSync(weeklyDir)) return [];

  return readdirSync(weeklyDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && DATE_DIR.test(entry.name))
    .map((entry) => {
      const dir = join(weeklyDir, entry.name);
      const htmlPath = join(dir, "report.html");
      if (!existsSync(htmlPath)) {
        throw new Error(`weekly ${entry.name}: missing report.html`);
      }
      const html = readFileSync(htmlPath, "utf8");
      const extracted = fromHtml(html, entry.name);
      let meta = {};
      const metaPath = join(dir, "meta.json");
      if (existsSync(metaPath)) {
        meta = JSON.parse(readFileSync(metaPath, "utf8"));
      }
      return {
        date: entry.name,
        dir,
        path: `/weekly/${entry.name}/`,
        title: meta.title || extracted.title,
        summary: meta.summary || extracted.summary,
        issue: meta.issue ?? extracted.issue,
        htmlPath,
        markdownPath: existsSync(join(dir, "report.md")) ? join(dir, "report.md") : "",
        timelinePath: existsSync(join(dir, "timeline.md")) ? join(dir, "timeline.md") : "",
        chartsDir: existsSync(join(dir, "charts")) ? join(dir, "charts") : "",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function weeklyIssueChrome({ hrefBetween, trendSubnav, fromPath }) {
  return `<div class="weekly-chrome" data-ds-injected="weekly">
    ${trendSubnav("weekly", fromPath)}
    <p class="weekly-dl">
      <a href="${hrefBetween(fromPath, "/weekly/")}">全部周报</a>
      · <a href="./report.md">Markdown</a>
      · <a href="./timeline.md">本周时间线</a>
      · <a href="./report.html">单页 HTML</a>
    </p>
  </div>`;
}

export function weeklyIndexBody(issues, { hrefBetween, escapeHtml }) {
  const cards = issues.length
    ? issues
        .map((issue) => {
          const kicker = issue.issue
            ? `${escapeHtml(issue.date)} · 第 ${escapeHtml(String(issue.issue))} 期`
            : escapeHtml(issue.date);
          return `<a class="ds-card trend-topic-card" href="${hrefBetween("/weekly/", issue.path)}">
            <p class="trend-today-kicker">${kicker}</p>
            <h3>${escapeHtml(issue.title)}</h3>
            ${issue.summary ? `<p class="ds-muted">${escapeHtml(issue.summary)}</p>` : ""}
          </a>`;
        })
        .join("")
    : `<p class="ds-muted">还没有周报。</p>`;

  return `<article class="ds-prose">
    <h1>周报</h1>
    <p>按周归纳主线升降、改写和下周要盯的信号。今日看板和时间线仍按原节奏更新。</p>
  </article>
  <div class="weekly-list">${cards}</div>`;
}

export function latestWeeklyCard(issue, { hrefBetween, escapeHtml }) {
  if (!issue) return "";
  const kicker = issue.issue
    ? `${escapeHtml(issue.date)} · 第 ${escapeHtml(String(issue.issue))} 期`
    : escapeHtml(issue.date);
  return `<section class="ds-section" id="weekly">
    <div class="ds-section-header">
      <h2 class="ds-section-title">周报</h2>
      <a href="${hrefBetween("/", "/weekly/")}">全部周报</a>
    </div>
    <a class="ds-card trend-topic-card" href="${hrefBetween("/", issue.path)}">
      <p class="trend-today-kicker">${kicker}</p>
      <h3>${escapeHtml(issue.title)}</h3>
      ${issue.summary ? `<p class="ds-muted">${escapeHtml(issue.summary)}</p>` : ""}
    </a>
  </section>`;
}

export function assertPublicSafe(text, label) {
  for (const needle of ["/workspace", "/home/box", "/cursor/stores", "收藏"]) {
    if (String(text).includes(needle)) {
      throw new Error(`${label} contains forbidden token ${needle}`);
    }
  }
}
