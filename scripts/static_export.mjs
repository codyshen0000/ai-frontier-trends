/** Build-time static API, RSS, search index, timeline pages, avatars copy. No fixture leaks. */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { BANNED_PUBLIC_COPY, findBannedMeta } from "./story_digest.mjs";
import { listWeeklyIssues } from "./weekly.mjs";
import { extractLiveCards } from "./live_cards.mjs";
import { extractTimelineLede } from "./extract.mjs";
import { isValuableCoverClass } from "./cover_rules.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "前沿趋势";
const SITE_URL = "https://codyshen0000.github.io/ai-frontier-trends";
const FILTERS = ["all", "firstParty", "model", "product", "industry", "paper", "tutorial", "opinion"];
const FIXTURE_IDS = [
  "flash-api",
  "mm-816b",
  "edge-nb",
  "agent-2",
  "api-price",
  "longctx-eval",
];
const PAGE_SIZE = 20;
const MAX_PAGES = 50;

export function beijingNow(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(" ", "T");
}

export function rfc822(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return d.toUTCString();
}

export function stripScore(value) {
  if (Array.isArray(value)) return value.map(stripScore);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "score") continue;
    out[k] = stripScore(v);
  }
  return out;
}

function assertPublicText(text, label) {
  const hit = findBannedMeta(text);
  if (hit) throw new Error(`${label} contains banned copy «${hit}»`);
}

function publicRel(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return String(url).replace(/^\//, "");
}

function clip(text, max) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[，、；：.\s]+$/u, "")}`;
}

function weeklyDocs(contentDir) {
  const out = [];
  for (const issue of listWeeklyIssues(contentDir)) {
    const title = String(issue.title || "").trim();
    if (!title || findBannedMeta(title)) continue;
    let summary = clip(issue.summary, 120);
    if (findBannedMeta(summary)) summary = "";
    out.push({
      id: `weekly-${issue.date}`,
      t: "weekly",
      title,
      summary,
      source: SITE,
      category: null,
      date: `${issue.date}T00:00:00+08:00`,
      url: publicRel(issue.path),
    });
  }
  return out;
}

function liveDocs(contentDir) {
  const livePath = join(contentDir, "live.html");
  if (!existsSync(livePath)) return [];
  const cards = extractLiveCards(readFileSync(livePath, "utf8"));
  const out = [];
  for (const card of cards) {
    if (FIXTURE_IDS.includes(card.id)) continue;
    const title = String(card.title || "").trim();
    const summary = clip(card.summary, 120);
    if (!title) continue;
    if (findBannedMeta(`${title} ${summary}`)) continue;
    const section = String(card.section || "");
    const category =
      /论文|研究/.test(section) ? "paper"
      : /产品|工具/.test(section) ? "product"
      : /模型|生图|生视频|大模型/.test(section) ? "model"
      : null;
    const x = (card.sources || []).find((s) => s.host === "x.com");
    out.push({
      id: `live-${card.id}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80),
      t: "card",
      title,
      summary,
      source: x ? `@${String(x.href).replace(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i, "").split("/")[0]}` : (card.sources?.[0]?.name || ""),
      category,
      date: card.day ? `${card.day}T00:00:00+08:00` : "",
      url: publicRel(card.sources?.[0]?.href || "live/"),
    });
  }
  return out;
}

function timelineDocs(contentDir) {
  const timelinePath = join(contentDir, "timeline.html");
  if (!existsSync(timelinePath)) return [];
  const raw = readFileSync(timelinePath, "utf8");
  const lede = extractTimelineLede(raw);
  if (!lede || findBannedMeta(lede)) return [];
  return [{
    id: "timeline-lede",
    t: "event",
    title: "时间线",
    summary: clip(lede, 120),
    source: SITE,
    category: null,
    date: "",
    url: "timeline/",
  }];
}

export function collectPublications(contentDir) {
  const articlesPath = join(contentDir, "l2-covers", "articles.json");
  if (!existsSync(articlesPath)) return [];
  const data = JSON.parse(readFileSync(articlesPath, "utf8"));
  const rows = [];
  for (const group of Object.values(data)) {
    if (!Array.isArray(group)) continue;
    for (const story of group) {
      for (const article of story.publications || story.articles || []) rows.push(article);
    }
  }
  return rows;
}

function xDocsFromArticles(contentDir) {
  const docs = [];
  const seen = new Set();
  for (const article of collectPublications(contentDir)) {
    const url = String(article.url || "");
    if (!/x\.com|twitter\.com/i.test(url)) continue;
    const handle = url.replace(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i, "").split("/")[0];
    if (!handle || handle === "i") continue;
    const title = String(article.title || "").trim();
    if (!title || findBannedMeta(title)) continue;
    let summary = clip(article.summary, 120);
    if (findBannedMeta(summary)) summary = "";
    const id = `x-${handle}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
    if (seen.has(id)) continue;
    seen.add(id);
    docs.push({
      id,
      t: "card",
      title,
      summary,
      source: `@${handle}`,
      category: null,
      date: "",
      url,
    });
  }
  return docs;
}

export function buildSearchIndex({ contentDir, builtAt, dataAsOf }) {
  const docs = [];
  const seen = new Set();
  for (const doc of [...weeklyDocs(contentDir), ...liveDocs(contentDir), ...timelineDocs(contentDir), ...xDocsFromArticles(contentDir)]) {
    if (!doc.id || seen.has(doc.id)) continue;
    if (FIXTURE_IDS.some((id) => doc.id.includes(id))) continue;
    seen.add(doc.id);
    docs.push({ ...doc, url: publicRel(doc.url) });
  }
  docs.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  return { v: 1, built_at: builtAt, data_as_of: dataAsOf, docs };
}

function publicSummary(text, fallback = "") {
  const summary = clip(text, 300);
  if (!summary || findBannedMeta(summary)) return clip(fallback, 300);
  return summary;
}

function weeklyApi(issue) {
  return {
    date: issue.date,
    title: issue.title,
    summary: publicSummary(issue.summary, issue.title),
    issue: issue.issue,
    path: publicRel(issue.path),
    url: `${SITE_URL}${issue.path}`,
  };
}

function weeklyRss(issues) {
  const items = issues.map((issue) => {
    const desc = publicSummary(issue.summary, issue.title);
    return `    <item>
      <title>${xml(issue.title)}</title>
      <link>${SITE_URL}${issue.path}</link>
      <guid isPermaLink="false">weekly-${issue.date}</guid>
      <pubDate>${rfc822(`${issue.date}T00:00:00+08:00`)}</pubDate>
      <description>${xml(desc)}</description>
      <category>周报</category>
    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>前沿趋势</title>
    <link>${SITE_URL}/weekly/</link>
    <description>前沿趋势周报</description>
    <language>zh-cn</language>
${items}
  </channel>
</rss>
`;
}

function xml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function copyAvatars(distDir) {
  const cache = join(root, "cache", "avatars");
  const dest = join(distDir, "assets", "avatars");
  if (!existsSync(cache)) return { count: 0 };
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(cache)) {
    const from = join(cache, name);
    if (statSync(from).isDirectory()) continue;
    if (name === "manifest.json" || name.endsWith(".webp")) {
      cpSync(from, join(dest, name));
    }
  }
  return { count: readdirSync(dest).filter((n) => n.endsWith(".webp")).length };
}

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function gzipSize(file) {
  return gzipSync(readFileSync(file)).length;
}

function assertNoFixture(dir, label) {
  if (!existsSync(dir)) return;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(json|xml|html|txt|js|webp)$/i.test(name)) {
        const text = readFileSync(full, "utf8");
        for (const id of FIXTURE_IDS) {
          if (text.includes(id)) throw new Error(`${label} leaked fixture id ${id} in ${full}`);
        }
      }
    }
  };
  walk(dir);
}

export function writeTimelinePages(outDir, cards, { builtAt, dataAsOf }) {
  const byFilter = Object.fromEntries(FILTERS.map((f) => [f, []]));
  for (const card of cards) {
    const clean = stripScore(card);
    byFilter.all.push(clean);
    if (clean.item?.category && byFilter[clean.item.category]) byFilter[clean.item.category].push(clean);
    if (clean.item?.selected || clean.item?.firstParty) byFilter.firstParty.push(clean);
  }
  for (const filter of FILTERS) {
    const list = byFilter[filter]
      .slice()
      .sort((a, b) => String(b.anchorAt || b.item?.publishedAt || "").localeCompare(String(a.anchorAt || a.item?.publishedAt || "")))
      .slice(0, PAGE_SIZE * MAX_PAGES)
      .map((card) => {
        const item = card.item || {};
        const url = item.url || item.links?.original || `hot.html#s-${item.id || card.key}`;
        return { ...card, item: { ...item, url } };
      });
    const dir = join(outDir, "data", "timeline", filter);
    mkdirSync(dir, { recursive: true });
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const day_counts = {};
    for (const card of list) {
      const day = String(card.anchorAt || "").slice(0, 10);
      if (day) day_counts[day] = (day_counts[day] || 0) + 1;
    }
    writeJson(join(dir, "index.json"), {
      v: 1,
      filter,
      page_size: PAGE_SIZE,
      pages: Math.min(pages, MAX_PAGES),
      total: list.length,
      data_as_of: dataAsOf,
      built_at: builtAt,
    });
    for (let i = 0; i < Math.min(pages, MAX_PAGES); i++) {
      const slice = list.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
      const file = join(dir, `page-${i + 1}.json`);
      writeJson(file, {
        v: 1,
        page: i + 1,
        cards: slice,
        day_counts,
        next: i + 1 < Math.min(pages, MAX_PAGES) ? `page-${i + 2}.json` : null,
      });
      if (gzipSize(file) > 12 * 1024) {
        throw new Error(`${filter} page-${i + 1}.json gzip ${gzipSize(file)} > 12KB`);
      }
    }
  }
}

export async function exportStatic({ distDir, contentDir, dataset = "", dataAsOf, builtAt }) {
  mkdirSync(distDir, { recursive: true });
  const leakNote = join(distDir, "data", "fixture-note.json");
  if (existsSync(leakNote)) rmSync(leakNote);
  const contentStamp = (() => {
    try {
      const covers = JSON.parse(readFileSync(join(root, "scripts", "mit-static", "src", "covers.generated.json"), "utf8"));
      if (covers.asOf) return covers.asOf;
    } catch {
      /* ignore */
    }
    const issues = listWeeklyIssues(contentDir);
    return issues[0] ? `${issues[0].date}T00:00:00+08:00` : null;
  })();
  const asOf = dataAsOf || contentStamp || `${beijingNow()}:00+08:00`;
  const built = builtAt || new Date().toISOString();

  const index = buildSearchIndex({ contentDir, builtAt: built, dataAsOf: asOf });
  writeJson(join(distDir, "data", "search-index.json"), index);
  if (gzipSync(Buffer.from(JSON.stringify(index))).length > 200 * 1024) {
    throw new Error("search-index.json gzip exceeds 200KB");
  }

  writeJson(join(distDir, "data", "meta.json"), {
    v: 1,
    data_as_of: asOf,
    built_at: built,
    site: SITE,
  });

  const issues = listWeeklyIssues(contentDir);
  mkdirSync(join(distDir, "feed"), { recursive: true });
  writeFileSync(join(distDir, "feed", "weekly.xml"), weeklyRss(issues));
  if (existsSync(join(distDir, "feed.xml"))) rmSync(join(distDir, "feed.xml"));

  const weeklySummaries = issues.map(weeklyApi);
  writeJson(join(distDir, "api", "v1", "weekly", "index.json"), {
    v: 1,
    schema_version: "1.0.0",
    data_as_of: asOf,
    items: weeklySummaries,
  });
  for (const issue of weeklySummaries) {
    writeJson(join(distDir, "api", "v1", "weekly", `${issue.date}.json`), {
      v: 1,
      schema_version: "1.0.0",
      data_as_of: asOf,
      ...issue,
    });
  }

  const listed = [
    { path: "index.json", note: "接口目录", schema_version: "1.0.0" },
    { path: "meta.json", note: "站点元数据", schema_version: "1.0.0" },
    { path: "weekly/index.json", note: "周报目录", schema_version: "1.0.0" },
    ...weeklySummaries.map((issue) => ({
      path: `weekly/${issue.date}.json`,
      note: `周报 ${issue.date}`,
      schema_version: "1.0.0",
    })),
  ];
  writeJson(join(distDir, "api", "v1", "meta.json"), {
    data_as_of: asOf,
    built_at: built,
    site: SITE,
    rules_version: "remaining-a-v1",
    schema_version: "1.0.0",
  });
  writeJson(join(distDir, "api", "v1", "index.json"), {
    schema_version: "1.0.0",
    data_as_of: asOf,
    files: listed,
  });

  copyAvatars(distDir);

  if (dataset === "test-paging") {
    const { buildTestPagingCards } = await import("./test-data/paging.mjs");
    const cards = buildTestPagingCards();
    if (cards.length < 65) throw new Error("test-paging needs ≥65 items");
    writeTimelinePages(distDir, cards, { builtAt: built, dataAsOf: asOf });
  }

  assertNoFixture(join(distDir, "data"), "/data");
  assertNoFixture(join(distDir, "api"), "/api");
  assertNoFixture(join(distDir, "feed"), "/feed");
  assertNoFixture(join(distDir, "assets", "avatars"), "/assets/avatars");
  void isValuableCoverClass;
  void BANNED_PUBLIC_COPY;
  void createHash;

  return { searchDocs: index.docs.length, weekly: issues.length, dataset };
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  const dataset = (process.argv.find((a) => a.startsWith("--dataset=")) || "").slice(10);
  await exportStatic({
    distDir: join(root, "dist"),
    contentDir: join(root, "content"),
    dataset,
  });
}
