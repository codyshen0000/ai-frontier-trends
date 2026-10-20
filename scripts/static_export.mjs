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
import { publicizeBundle, isPublicHttpUrl, stripScore as stripScoreDeep } from "./engine/publicize.mjs";

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
  return stripScoreDeep(value);
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
        const url = isPublicHttpUrl(item.originalUrl)
          ? item.originalUrl
          : isPublicHttpUrl(item.links?.original)
            ? item.links.original
            : isPublicHttpUrl(item.url)
              ? item.url
              : `hot/#s-${item.id || card.key}`;
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

const CATEGORY_LABELS = {
  model: "模型",
  product: "产品",
  industry: "产业",
  paper: "论文",
  tutorial: "教程",
  opinion: "观点",
};

function selectedRss(items) {
  const rows = items.slice(0, 50).map((item) => {
    const link = isPublicHttpUrl(item.originalUrl) ? item.originalUrl : `${SITE_URL}/`;
    return `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="false">${xml(item.guid)}</guid>
      <pubDate>${rfc822(item.pubDate)}</pubDate>
      <description>${xml(publicSummary(item.summary, item.title))}</description>
      ${item.category ? `<category>${xml(item.categoryLabel || CATEGORY_LABELS[item.category] || item.category)}</category>` : ""}
    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>前沿趋势</title>
    <link>${SITE_URL}/</link>
    <description>前沿趋势精选</description>
    <language>zh-cn</language>
${rows}
  </channel>
</rss>
`;
}

function dailyRss(dailies) {
  const rows = dailies.slice(0, 30).map((issue) => `    <item>
      <title>${xml(issue.title)}</title>
      <link>${SITE_URL}/daily/#d-${xml(issue.key)}</link>
      <guid isPermaLink="false">daily-${xml(issue.key)}</guid>
      <pubDate>${rfc822(issue.generatedAt || `${issue.key}T00:00:00+08:00`)}</pubDate>
      <description>${xml(publicSummary(issue.overview || issue.lead?.leadParagraph, issue.title))}</description>
      <category>日报</category>
    </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>前沿趋势</title>
    <link>${SITE_URL}/daily/</link>
    <description>前沿趋势日报</description>
    <language>zh-cn</language>
${rows}
  </channel>
</rss>
`;
}

function categoryRss(key, items) {
  const rows = items.slice(0, 50).map((item) => {
    const link = isPublicHttpUrl(item.originalUrl) ? item.originalUrl : `${SITE_URL}/`;
    return `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="false">${xml(item.guid || item.id)}</guid>
      <pubDate>${rfc822(item.pubDate || item.publishedAt)}</pubDate>
      <description>${xml(publicSummary(item.summary, item.title))}</description>
      <category>${xml(CATEGORY_LABELS[key] || key)}</category>
    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>前沿趋势</title>
    <link>${SITE_URL}/</link>
    <description>前沿趋势 · ${CATEGORY_LABELS[key] || key}</description>
    <language>zh-cn</language>
${rows}
  </channel>
</rss>
`;
}

function engineSearchDocs(site) {
  const docs = [];
  for (const card of site.timeline?.cards || []) {
    const item = card.item || {};
    if (!item.id || !item.title) continue;
    docs.push({
      id: item.id,
      t: "card",
      title: item.title,
      summary: clip(item.summary, 120),
      source: item.source?.name || "",
      category: item.category || null,
      date: item.publishedAt || "",
      url: item.originalUrl && isPublicHttpUrl(item.originalUrl)
        ? item.originalUrl
        : publicRel(item.storyPublicId ? `hot/#s-${item.storyPublicId}` : "/"),
    });
  }
  for (const entry of site.hot?.entries || []) {
    const id = entry.story?.publicId;
    if (!id || docs.some((d) => d.id === id)) continue;
    docs.push({
      id,
      t: "event",
      title: entry.story.title,
      summary: clip(entry.summary, 120),
      source: (entry.sourceNames || []).join("、"),
      category: null,
      date: "",
      url: publicRel(`hot/#s-${id}`),
    });
  }
  if (site.daily?.key) {
    docs.push({
      id: `daily-${site.daily.key}`,
      t: "daily",
      title: site.daily.title,
      summary: clip(site.daily.overview || site.daily.lead?.leadParagraph, 120),
      source: SITE,
      category: null,
      date: `${site.daily.key}T00:00:00+08:00`,
      url: publicRel("daily/"),
    });
  }
  return docs.filter((doc) => !FIXTURE_IDS.some((id) => doc.id.includes(id)));
}

function writeEngineOutputs(distDir, engine, site, { asOf, built }) {
  const feedItems = site.feedItems || [];
  if (feedItems.length) {
    writeFileSync(join(distDir, "feed.xml"), selectedRss(feedItems));
  }
  if ((site.dailies || []).length) {
    mkdirSync(join(distDir, "feed"), { recursive: true });
    writeFileSync(join(distDir, "feed", "daily.xml"), dailyRss(site.dailies));
  }
  const byCat = {};
  for (const card of site.timeline?.cards || []) {
    const key = card.item?.category;
    if (!key || !FILTERS.includes(key)) continue;
    byCat[key] ||= [];
    byCat[key].push({
      guid: card.item.id,
      title: card.item.title,
      summary: card.item.summary,
      originalUrl: card.item.originalUrl,
      pubDate: card.item.publishedAt,
      category: key,
    });
  }
  for (const [key, items] of Object.entries(byCat)) {
    if (!items.length) continue;
    mkdirSync(join(distDir, "feed", "category"), { recursive: true });
    writeFileSync(join(distDir, "feed", "category", `${key}.xml`), categoryRss(key, items));
  }

  writeJson(join(distDir, "api", "v1", "hot.json"), stripScore({
    v: 1,
    schema_version: "1.1.0",
    data_as_of: asOf,
    ...site.hot,
  }));
  if (site.timeline?.cards?.length) {
    writeJson(join(distDir, "api", "v1", "timeline", "latest.json"), stripScore({
      v: 1,
      schema_version: "1.1.0",
      data_as_of: asOf,
      ...site.timeline,
      page: 1,
    }));
  }
  if (site.daily) {
    writeJson(join(distDir, "api", "v1", "daily", "latest.json"), stripScore({
      v: 1,
      schema_version: "1.1.0",
      data_as_of: asOf,
      ...site.daily,
    }));
    writeJson(join(distDir, "api", "v1", "daily", `${site.daily.key}.json`), stripScore({
      v: 1,
      schema_version: "1.1.0",
      data_as_of: asOf,
      ...site.daily,
    }));
  }
}

export async function exportStatic({ distDir, contentDir, dataset = "", dataAsOf, builtAt, engine = null, site = null }) {
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
  const publicSite = site || (engine ? publicizeBundle(engine) : null);
  if (publicSite) {
    for (const doc of engineSearchDocs(publicSite)) {
      if (!index.docs.some((row) => row.id === doc.id)) index.docs.push(doc);
    }
  }
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
    { path: "api/v1/index.json", note: "接口目录", schema_version: "1.0.0" },
    { path: "api/v1/meta.json", note: "站点元数据", schema_version: "1.0.0" },
    { path: "api/v1/weekly/index.json", note: "周报目录", schema_version: "1.0.0" },
    ...weeklySummaries.map((issue) => ({
      path: `api/v1/weekly/${issue.date}.json`,
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
  if (publicSite) {
    if (publicSite.hot?.entries?.length) {
      listed.push({ path: "api/v1/hot.json", note: "热点榜", schema_version: "1.1.0" });
    }
    if (publicSite.timeline?.cards?.length) {
      listed.push({ path: "api/v1/timeline/latest.json", note: "时间线最新一页", schema_version: "1.1.0" });
    }
    if (publicSite.daily) {
      listed.push({ path: "api/v1/daily/latest.json", note: "最新日报", schema_version: "1.1.0" });
      listed.push({ path: `api/v1/daily/${publicSite.daily.key}.json`, note: `日报 ${publicSite.daily.key}`, schema_version: "1.1.0" });
    }
  }
  writeJson(join(distDir, "api", "v1", "index.json"), {
    schema_version: "1.0.0",
    data_as_of: asOf,
    path_base: "site",
    paths: "relative to the site base path (GitHub Pages prefix /ai-frontier-trends/), not to this JSON file",
    files: listed,
  });

  copyAvatars(distDir);

  if (dataset === "test-paging") {
    const { buildTestPagingCards } = await import("./test-data/paging.mjs");
    const cards = buildTestPagingCards();
    if (cards.length < 65) throw new Error("test-paging needs ≥65 items");
    writeTimelinePages(distDir, cards, { builtAt: built, dataAsOf: asOf });
  } else if (publicSite?.timeline?.cards?.length) {
    writeTimelinePages(distDir, publicSite.timeline.cards, { builtAt: built, dataAsOf: asOf });
  }

  if (publicSite && engine) {
    writeEngineOutputs(distDir, engine, publicSite, { asOf, built });
  }

  assertNoFixture(join(distDir, "data"), "/data");
  assertNoFixture(join(distDir, "api"), "/api");
  assertNoFixture(join(distDir, "feed"), "/feed");
  assertNoFixture(join(distDir, "assets", "avatars"), "/assets/avatars");
  if (existsSync(join(distDir, "feed.xml"))) {
    const text = readFileSync(join(distDir, "feed.xml"), "utf8");
    for (const id of FIXTURE_IDS) {
      if (text.includes(id)) throw new Error(`/feed.xml leaked fixture id ${id}`);
    }
  }
  void isValuableCoverClass;
  void BANNED_PUBLIC_COPY;
  void createHash;
  // B1: replace content/fixture feeds with loadEngineData(). writeRedirects(dist, data) is wired from build.mjs.

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
