/** Build-time source-image resolver for /daily/ lead + story blocks.
 *  Fetches main-link HTML (og/twitter/body) + tweet media + arXiv HTML figures,
 *  then keeps only images that support the item's theme hook. Failures are silent.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildEdition, editionDays } from "./daily_page.mjs";

const UA =
  "Mozilla/5.0 (compatible; ai-frontier-trends-daily-viz/1.0; +https://github.com/codyshen0000/ai-frontier-trends)";
const TIMEOUT_MS = 12_000;
const HOST_GAP_MS = 400;
const MAX_BODY_IMGS = 24;
const PASS_SCORE = 28;
const MIN_IMAGE_BYTES = 20_000;
const CACHE_VERSION = 3;

const POSITIVE_RE =
  /\b(chart|plot|graph|figure|teaser|pipeline|architecture|overview|framework|compar(?:e|ison)|before[-_ ]?after|result|demo|sample|generated|output|qualitative|ablation|benchmark|leaderboard|elo|arena|metric|heatmap|collage|example|screenshot|preview|poster|capability|method|eval|rating|latency|gpu|grid|qual)\b|对比|评测|结果|架构|演示|效果|榜单|示意|生成/;

const REJECT_RE =
  /logo|icon|favicon|avatar|sprite|wordmark|badge|shields?\.io|emoji|apple-touch|profile_images|og-default|default[-_]social|brand-mark|smileybones|arxiv-logo|github-mark|huggingface_logo|simpleicons|brand-icons|\/logos?\/|wordmark|site[-_]logo|identity|favicon|footer|spinner/;

const IMAGE_EXT_RE = /\.(?:png|jpe?g|webp|gif|avif)(?:$|\?)/i;

const lastHostHit = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sha1(text) {
  return createHash("sha1").update(String(text)).digest("hex").slice(0, 20);
}

function absUrl(maybe, base) {
  if (!maybe) return "";
  const raw = String(maybe).trim().replace(/&amp;/g, "&");
  if (!raw || raw.startsWith("data:")) return raw.startsWith("data:image") ? raw : "";
  try {
    return new URL(raw, base).href;
  } catch {
    return "";
  }
}

function unwrapImageUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("/_next/image") && parsed.searchParams.get("url")) {
      return unwrapImageUrl(decodeURIComponent(parsed.searchParams.get("url")));
    }
  } catch {
    /* keep */
  }
  return url;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function tweetId(url) {
  const text = String(url);
  const status = text.match(/(?:x\.com|twitter\.com)\/(?:[^/]+\/)?status\/(\d+)/i);
  if (status) return status[1];
  const trending = text.match(/(?:x\.com|twitter\.com)\/i\/trending\/(\d+)/i);
  return trending ? trending[1] : "";
}

function arxivId(url) {
  const match = String(url).match(/arxiv\.org\/(?:abs|html|pdf)\/(\d{4}\.\d{4,5})/i);
  return match ? match[1] : "";
}

function githubRepo(url) {
  const match = String(url).match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) return null;
  const repo = match[2].replace(/\.git$/, "");
  if (["orgs", "users", "settings", "explore"].includes(match[1])) return null;
  return { owner: match[1], repo };
}

export function themeHook(card) {
  const title = String(card.title || "").replace(/\s+/g, " ").trim();
  const summary = String(card.summary || "").replace(/\s+/g, " ").trim();
  const first = summary.split(/[。；.!?\n]/)[0] || summary;
  const hook = first && first.length > 8 && !title.includes(first.slice(0, 10)) ? `${title}：${first}` : title;
  return hook.slice(0, 140);
}

function tokens(text) {
  const out = new Set();
  const raw = String(text || "").toLowerCase();
  for (const word of raw.match(/[a-z][a-z0-9+._-]{2,}|[0-9]+[a-z][a-z0-9._-]*|[\u4e00-\u9fff]{2,}/g) || []) {
    if (word.length < 3 && !/[\u4e00-\u9fff]/.test(word)) continue;
    if (["the", "and", "for", "with", "from", "http", "https", "www", "com"].includes(word)) continue;
    out.add(word);
  }
  return out;
}

function attr(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (match) return match[1];
  const bare = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare ? bare[1] : "";
}

function pickSrcset(srcset) {
  if (!srcset) return "";
  let best = "";
  let bestW = -1;
  for (const part of String(srcset).split(",")) {
    const bits = part.trim().split(/\s+/);
    const url = bits[0];
    const w = Number(String(bits[1] || "").replace(/w$/i, "")) || 0;
    if (url && w >= bestW) {
      best = url;
      bestW = w;
    }
  }
  return best || String(srcset).split(",")[0].trim().split(/\s+/)[0];
}

function looksLikeImageUrl(url) {
  if (!url) return false;
  if (url.startsWith("data:image/")) return url.length > 800;
  if (IMAGE_EXT_RE.test(url)) return true;
  if (/pbs\.twimg\.com\/(media|amplify_video_thumb)\//.test(url)) return true;
  if (/cdn\.sanity\.io\/images\//.test(url)) return true;
  if (/\/api\/og\//.test(url)) return true;
  if (/og\/|opengraph|twimg|googleusercontent|githubusercontent/.test(url)) return true;
  return false;
}

export function rejectReason(candidate) {
  const url = String(candidate.url || "");
  const blob = `${url} ${candidate.alt || ""} ${candidate.caption || ""}`.toLowerCase();
  if (url.startsWith("data:")) return "logo_or_avatar";
  if (/xiaohongshu|xhscdn|picasso-static|sns-webpic|fe-static\.xhscdn/.test(blob)) return "logo_or_avatar";
  if (/profile_images|avatar|apple-touch-icon|favicon|smileybones|arxiv-logo-primary|github-logo|hf-logo\.png/.test(blob)) {
    return "logo_or_avatar";
  }
  if (REJECT_RE.test(blob)) return "logo_or_avatar";
  if (/opengraph\.githubassets\.com/.test(url)) return "no_valuable_image";
  if (/arxiv\.org\/static\//.test(url)) return "logo_or_avatar";
  if (/huggingface\.co\/front\/assets/.test(url)) return "logo_or_avatar";
  if (/pbs\.twimg\.com\/card_img\//.test(url) && candidate.kind !== "tweet_photo") return "no_valuable_image";
  const width = Number(candidate.width) || 0;
  const height = Number(candidate.height) || 0;
  if ((width && width < 240 && height && height < 240) || (width && width < 80) || (height && height < 80)) {
    return "logo_or_avatar";
  }
  if (!looksLikeImageUrl(url) && candidate.kind === "og") return "non_image";
  return "";
}

export function scoreCandidate(candidate, hook, card) {
  const banned = rejectReason(candidate);
  if (banned) return { score: 0, pass: false, reason: banned };
  const hay = `${candidate.url} ${candidate.alt || ""} ${candidate.caption || ""} ${candidate.kind}`;
  const hookTok = tokens(`${hook} ${card?.title || ""} ${card?.id || ""}`);
  const hayTok = tokens(hay);
  let overlap = 0;
  for (const token of hookTok) if (hayTok.has(token)) overlap += 1;

  let score = 0;
  if (candidate.kind === "paper" || candidate.kind === "body") score += 36;
  else if (candidate.kind === "tweet_photo") score += 34;
  else if (candidate.kind === "tweet_video") score += 22;
  else if (candidate.kind === "readme") score += 22;
  else if (candidate.kind === "card") score += 28;
  else if (candidate.kind === "og" || candidate.kind === "twitter") score += 8;
  const height = Number(candidate.height) || 0;
  const width = Number(candidate.width) || 0;
  if (height > width * 1.12 && height >= 900) score += 16;

  if (POSITIVE_RE.test(hay)) score += 26;
  score += Math.min(32, overlap * 8);
  if (width >= 480) score += 8;
  if (width >= 1000) score += 6;
  if (candidate.caption) score += 8;
  if ((candidate.kind === "og" || candidate.kind === "twitter") && overlap === 0 && !POSITIVE_RE.test(hay)) {
    score -= 18;
  }
  if (/\/api\/og\//.test(candidate.url) && overlap === 0) score -= 10;
  return { score, pass: score >= PASS_SCORE, reason: score >= PASS_SCORE ? "ok" : "no_valuable_image" };
}

function metaContents(html, names) {
  const found = [];
  const re =
    /<meta\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const property = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
    if (!names.includes(property)) continue;
    const content = attr(tag, "content");
    if (content) found.push(content);
  }
  return found;
}

export function extractFromHtml(html, pageUrl) {
  const candidates = [];
  const push = (url, extra) => {
    const href = unwrapImageUrl(absUrl(url, pageUrl));
    if (!href || href.startsWith("data:image") && href.length < 800) return;
    candidates.push({ url: href, pageUrl, alt: "", caption: "", width: 0, height: 0, kind: "body", ...extra });
  };

  for (const content of metaContents(html, ["og:image", "og:image:url", "og:image:secure_url"])) {
    push(content, { kind: "og" });
  }
  for (const content of metaContents(html, ["twitter:image", "twitter:image:src"])) {
    push(content, { kind: "twitter" });
  }

  const figures = html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi);
  for (const figure of figures) {
    const cap = figure[1].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
    const caption = cap ? cap[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) : "";
    const img = figure[1].match(/<img\b[^>]*>/i);
    if (!img) continue;
    const src = attr(img[0], "src") || pickSrcset(attr(img[0], "srcset")) || attr(img[0], "data-src");
    push(src, {
      kind: "body",
      alt: attr(img[0], "alt") || "",
      caption,
      width: Number(attr(img[0], "width")) || 0,
      height: Number(attr(img[0], "height")) || 0,
    });
  }

  const imgs = html.matchAll(/<img\b[^>]*>/gi);
  let count = 0;
  for (const img of imgs) {
    if (count >= MAX_BODY_IMGS) break;
    const tag = img[0];
    const src = attr(tag, "src") || pickSrcset(attr(tag, "srcset")) || attr(tag, "data-src");
    if (!src) continue;
    count += 1;
    push(src, {
      kind: "body",
      alt: attr(tag, "alt") || "",
      width: Number(attr(tag, "width")) || 0,
      height: Number(attr(tag, "height")) || 0,
    });
  }

  const seen = new Set();
  const unique = [];
  for (const candidate of candidates) {
    if (!candidate.url || seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    unique.push(candidate);
  }
  return unique;
}

export function extractTables(html) {
  const out = [];
  const re = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let match;
  while ((match = re.exec(html))) {
    const inner = match[1];
    if (/\brole=["']presentation["']/.test(match[0])) continue;
    const rows = [...inner.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)];
    if (rows.length < 2) continue;
    const cols = (rows[0][0].match(/<(?:th|td)\b/gi) || []).length;
    if (cols < 2) continue;
    const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 24) continue;
    if (/栏目|独立来源|一手|主链 host|标签：/.test(text) && text.length < 80) continue;
    const clipped = rows.length > 8 ? `${rows.slice(0, 8).join("")}` : inner;
    out.push(`<table>${clipped}</table>`);
    if (out.length >= 1) break;
  }
  return out;
}

function extractFromTweet(payload, pageUrl) {
  const tweet = payload?.tweet || payload;
  if (!tweet || typeof tweet !== "object") return { candidates: [], links: [] };
  const media = tweet.media || {};
  const candidates = [];
  for (const photo of media.photos || []) {
    if (!photo?.url) continue;
    candidates.push({
      url: String(photo.url).replace(/name=\w+$/, "name=orig"),
      alt: photo.altText || photo.alt || "",
      caption: "",
      width: Number(photo.width) || 0,
      height: Number(photo.height) || 0,
      kind: "tweet_photo",
      pageUrl,
    });
  }
  for (const video of media.videos || []) {
    const thumb = video.thumbnail_url || video.thumbnail || "";
    if (!thumb) continue;
    candidates.push({
      url: thumb,
      alt: "",
      caption: "",
      width: Number(video.width) || 0,
      height: Number(video.height) || 0,
      kind: "tweet_video",
      pageUrl,
    });
  }
  const links = [];
  for (const item of tweet.urls || tweet.external_urls || []) {
    const href = typeof item === "string" ? item : item.expanded_url || item.url;
    if (href && /^https?:/i.test(href)) links.push(href);
  }
  const blob = `${tweet.text || ""} ${typeof tweet.raw_text === "string" ? tweet.raw_text : tweet.raw_text?.text || ""}`;
  for (const match of blob.match(/https?:\/\/[^\s<>"]+/g) || []) {
    const href = match.replace(/[),.;]+$/g, "");
    if (/^https?:\/\//i.test(href) && !/x\.com|twitter\.com|t\.co|fxtwitter/i.test(href)) links.push(href);
  }
  const quote = tweet.quote;
  if (quote) {
    const nested = extractFromTweet({ tweet: quote }, quote.url || pageUrl);
    candidates.push(...nested.candidates);
    links.push(...nested.links);
  }
  return { candidates, links };
}

function extractReadmeImages(markdown, baseRaw) {
  const candidates = [];
  const re = /!\[[^\]]*\]\(([^)]+)\)|<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(markdown))) {
    const src = match[1] || match[2];
    if (!src) continue;
    const alt = (match[0].match(/\[([^\]]*)\]/) || match[0].match(/alt=["']([^"']*)["']/) || [, ""])[1];
    const url = absUrl(src, baseRaw);
    if (!url) continue;
    candidates.push({
      url,
      alt: alt || "",
      caption: "",
      width: 0,
      height: 0,
      kind: "readme",
      pageUrl: baseRaw,
    });
  }
  return candidates;
}

async function gatedFetch(url, { accept = "*/*" } = {}) {
  const host = hostOf(url) || "unknown";
  const last = lastHostHit.get(host) || 0;
  const wait = last + HOST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastHostHit.set(host, Date.now());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: accept,
        "Accept-Language": "en-US,en;q=0.8,zh;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, finalUrl: response.url || url };
  } catch (error) {
    const timeout = error?.name === "AbortError" || /timeout|abort/i.test(String(error));
    return { ok: false, status: 0, text: "", finalUrl: url, timeout, error: error?.name || "fetch_error" };
  } finally {
    clearTimeout(timer);
  }
}

function cachePath(dir, key) {
  return join(dir, `${sha1(key)}.json`);
}

function readCache(dir, key) {
  const file = cachePath(dir, key);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeCache(dir, key, value) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(cachePath(dir, key), JSON.stringify(value));
}

async function fetchPage(url, cacheDir) {
  const cached = readCache(cacheDir, url);
  if (cached && cached.url === url) return cached;
  const fetched = await gatedFetch(url, { accept: "text/html,application/json;q=0.9,*/*;q=0.8" });
  const record = {
    url,
    ok: fetched.ok,
    status: fetched.status,
    timeout: Boolean(fetched.timeout),
    error: fetched.error || "",
    finalUrl: fetched.finalUrl,
    body: fetched.ok ? fetched.text.slice(0, 900_000) : "",
  };
  writeCache(cacheDir, url, { ...record, body: record.body.slice(0, 450_000) });
  return record;
}

function cardImages(card) {
  const out = [];
  for (const img of card.images || []) {
    if (!img?.src) continue;
    out.push({
      url: img.src,
      alt: img.alt || "",
      caption: img.caption || "",
      width: Number(img.width) || 0,
      height: Number(img.height) || 0,
      kind: "card",
      pageUrl: card.sources[0]?.href || "",
    });
  }
  for (const field of ["cover", "image", "ogImage"]) {
    if (card[field]) {
      const value = typeof card[field] === "string" ? card[field] : card[field].url;
      if (value) {
        out.push({
          url: value,
          alt: "",
          caption: "",
          width: 0,
          height: 0,
          kind: "card",
          pageUrl: card.sources[0]?.href || "",
        });
      }
    }
  }
  return out;
}

function paperFigures(card, papers) {
  const out = [];
  for (const source of card.sources || []) {
    const id = arxivId(source.href);
    if (!id) continue;
    const paper = papers.get(id);
    if (paper?.fig_src) {
      out.push({
        url: paper.fig_src,
        alt: paper.fig_caption || paper.title || "",
        caption: paper.fig_caption || "",
        width: 0,
        height: 0,
        kind: "paper",
        pageUrl: `https://arxiv.org/html/${id}`,
      });
    }
  }
  return out;
}

function sourceQueue(card) {
  const sources = card.sources || [];
  const ranked = [...sources].sort((a, b) => {
    const aOfficial = card.firstParty && a === sources[0] ? 1 : 0;
    const bOfficial = card.firstParty && b === sources[0] ? 1 : 0;
    const rank = (s) => {
      const host = s.host || hostOf(s.href);
      if (host === "bfl.ai" || /\.ai$/.test(host) && !["x.com", "arxiv.org"].includes(host)) return 0;
      if (host === "huggingface.co") return 1;
      if (host === "arxiv.org") return 2;
      if (host === "github.com") return 3;
      if (host === "x.com") return 4;
      if (host.includes("xiaohongshu")) return 6;
      return 5;
    };
    return rank(a) - rank(b) || bOfficial - aOfficial;
  });
  const urls = [];
  for (const source of ranked) {
    const href = source.href;
    if (!href) continue;
    const id = arxivId(href);
    if (id) {
      urls.push(`https://arxiv.org/html/${id}`);
      urls.push(`https://arxiv.org/abs/${id}`);
      continue;
    }
    const tid = tweetId(href);
    if (tid) {
      urls.push(`https://api.fxtwitter.com/status/${tid}`);
      continue;
    }
    if (/xiaohongshu\.com|xhscdn/.test(hostOf(href))) continue;
    const repo = githubRepo(href);
    if (repo) {
      urls.push(href);
      urls.push(`https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/main/README.md`);
      urls.push(`https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/master/README.md`);
      continue;
    }
    urls.push(href);
  }
  return [...new Set(urls)];
}

function pickBest(candidates, card) {
  const hook = themeHook(card);
  const rejected = [];
  const scored = [];
  for (const candidate of candidates) {
    const result = scoreCandidate(candidate, hook, card);
    if (!result.pass) {
      rejected.push({ url: candidate.url, reason: result.reason, score: result.score, kind: candidate.kind });
      continue;
    }
    scored.push({ candidate, ...result });
  }
  scored.sort((a, b) => b.score - a.score);
  return { hook, best: scored[0] || null, rejected, scored };
}

function failReason(rejected, fetches) {
  if (!fetches.length && !rejected.length) return "no_valuable_image";
  if (fetches.length && fetches.every((item) => !item.ok)) {
    if (fetches.some((item) => item.timeout)) return "timeout";
    return "no_og";
  }
  if (rejected.length && rejected.every((item) => item.reason === "logo_or_avatar")) return "logo_or_avatar";
  if (rejected.length && rejected.every((item) => item.reason === "non_image")) return "non_image";
  if (!rejected.length) return "no_og";
  return "no_valuable_image";
}

function captionFor(candidate) {
  let host = hostOf(candidate.pageUrl || candidate.url);
  if (/fxtwitter|twimg/.test(host)) host = "x.com";
  return host ? `配图 · ${host}` : "配图";
}

async function resolveCard(card, { pageCache, papers }) {
  const candidates = [...cardImages(card), ...paperFigures(card, papers)];
  const tables = [...(card.tables || [])];
  const fetches = [];
  const extra = [];

  for (const url of sourceQueue(card)) {
    const page = await fetchPage(url, pageCache);
    fetches.push({ url, ok: page.ok, timeout: page.timeout, status: page.status });
    if (!page.ok || !page.body) continue;
    const finalUrl = page.finalUrl || url;
    if (/fxtwitter\.com\/status\//.test(url) || page.body.trim().startsWith("{")) {
      try {
        const json = JSON.parse(page.body);
        const tweet = extractFromTweet(json, finalUrl);
        candidates.push(...tweet.candidates);
        extra.push(...tweet.links.filter((href) => !/x\.com|twitter\.com|fxtwitter/.test(href)));
        continue;
      } catch {
        /* not json */
      }
    }
    if (/raw\.githubusercontent\.com/.test(url) || /README\.md(\?|$)/.test(url)) {
      const repo = githubRepo(card.sources.find((s) => githubRepo(s.href))?.href || "");
      const base = repo ? `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/main/` : finalUrl;
      candidates.push(...extractReadmeImages(page.body, base));
      continue;
    }
    const pageHost = hostOf(finalUrl);
    if (/^(x|twitter)\.com$/.test(pageHost) || /xiaohongshu|xhscdn/.test(pageHost)) continue;
    candidates.push(...extractFromHtml(page.body, finalUrl));
    tables.push(...extractTables(page.body));
    if (extra.length >= 2 && candidates.length > 4) break;
  }

  for (const href of extra.slice(0, 2)) {
    const page = await fetchPage(href, pageCache);
    fetches.push({ url: href, ok: page.ok, timeout: page.timeout, status: page.status });
    if (page.ok && page.body && !page.body.trim().startsWith("{")) {
      candidates.push(...extractFromHtml(page.body, page.finalUrl || href));
      tables.push(...extractTables(page.body));
    }
  }

  const picked = pickBest(candidates, card);
  const tableHtml = tables[0] || "";
  const ranked = picked.scored || [];
  let chosen = null;
  for (const item of ranked) {
    const ok = await confirmImage(item.candidate);
    if (!ok) {
      picked.rejected.push({
        url: item.candidate.url,
        reason: "non_image",
        score: item.score,
        kind: item.candidate.kind,
      });
      continue;
    }
    chosen = item;
    break;
  }
  if (chosen) {
    const image = chosen.candidate;
    return {
      id: card.id,
      hook: picked.hook,
      image: {
        url: image.url,
        alt: image.alt || card.title,
        caption: captionFor(image),
        kind: image.kind,
        pageUrl: image.pageUrl,
        width: image.width || 0,
        height: image.height || 0,
      },
      tableHtml,
      reason: "ok",
      why: whyPicked(image, picked.hook, chosen.score),
      rejected: picked.rejected.slice(0, 8),
      fetches,
    };
  }
  return {
    id: card.id,
    hook: picked.hook,
    image: null,
    tableHtml,
    reason: failReason(picked.rejected, fetches),
    why: whyOmitted(picked.rejected, fetches),
    rejected: picked.rejected.slice(0, 8),
    fetches,
  };
}

function whyPicked(image, hook, score) {
  const kind =
    image.kind === "tweet_photo"
      ? "源站推文配图"
      : image.kind === "tweet_video"
        ? "源站演示视频帧"
        : image.kind === "paper"
          ? "论文主图/架构图"
          : image.kind === "body"
            ? "主链正文图"
            : image.kind === "readme"
              ? "仓库 README 图"
              : "主链候选图";
  return `${kind}支撑钩子「${hook}」（score ${score}）`;
}

function whyOmitted(rejected, fetches) {
  if (!fetches.length && !rejected.length) {
    return "主链为小红书/无图页等，未找到说明性配图，诚实不挂";
  }
  if (fetches.some((item) => item.timeout) && !rejected.length) return "主链超时，未取到候选图";
  if (!rejected.length) return "主链无 OG / 正文图";
  const reasons = [...new Set(rejected.map((item) => item.reason))];
  return `候选均未过价值门（${reasons.join(", ")}）`;
}

export function visibleEditionItems(cards, day) {
  const edition = buildEdition(cards, day);
  return [edition.lead, ...edition.sections.flatMap((section) => section.items)].filter(Boolean);
}

function cardFingerprint(card) {
  return sha1(`${CACHE_VERSION}\n${card.id}\n${card.title}\n${(card.sources || []).map((source) => source.href).join("\n")}`);
}

async function confirmImage(candidate) {
  const url = candidate.url;
  if (!url || url.startsWith("data:")) return false;
  try {
    const host = hostOf(url) || "unknown";
    const last = lastHostHit.get(host) || 0;
    const wait = last + HOST_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastHostHit.set(host, Date.now());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": UA, Accept: "image/*,*/*;q=0.8" },
        redirect: "follow",
        signal: controller.signal,
      });
      const type = String(response.headers.get("content-type") || "");
      const len = Number(response.headers.get("content-length") || 0);
      if (type && !/^image\//i.test(type) && !/octet-stream/i.test(type)) return false;
      if (len && len < MIN_IMAGE_BYTES) return false;
      return response.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return true;
  }
}

export async function resolveDailyViz(cards, { root, papers = [] } = {}) {
  const cacheRoot = join(root, "content", "daily-viz");
  const pageCache = join(cacheRoot, "pages");
  const resolvedPath = join(cacheRoot, "resolved.json");
  mkdirSync(pageCache, { recursive: true });
  const paperMap = new Map((papers || []).map((paper) => [paper.id, paper]));
  const prior = existsSync(resolvedPath) ? JSON.parse(readFileSync(resolvedPath, "utf8")) : {};
  const resolved = new Map();
  for (const card of cards) {
    const fingerprint = cardFingerprint(card);
    const cached = prior[card.id];
    if (cached && cached.fingerprint === fingerprint && (cached.image?.url || cached.reason)) {
      resolved.set(card.id, cached);
      card.viz = cached;
      continue;
    }
    try {
      const result = await resolveCard(card, { pageCache, papers: paperMap });
      result.fingerprint = fingerprint;
      resolved.set(card.id, result);
      card.viz = result;
    } catch {
      const fallback = {
        id: card.id,
        fingerprint,
        hook: themeHook(card),
        image: null,
        tableHtml: "",
        reason: "fetch_error",
        why: "解析异常，整条跳过",
        rejected: [],
        fetches: [],
      };
      resolved.set(card.id, fallback);
      card.viz = fallback;
    }
  }
  const days = editionDays(cards);
  const latest = days[0] || "";
  const visible = latest ? visibleEditionItems(cards, latest) : [];
  const success = visible.filter((card) => card.viz?.image?.url);
  const fail = visible.filter((card) => !card.viz?.image?.url);
  const reasonCounts = {};
  for (const card of fail) {
    const reason = card.viz?.reason || "no_valuable_image";
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  }
  const report = {
    day: latest,
    total: visible.length,
    success: success.length,
    coverage: visible.length ? success.length / visible.length : 0,
    successIds: success.map((card) => card.id),
    fail: fail.map((card) => ({
      id: card.id,
      reason: card.viz?.reason || "no_valuable_image",
      hook: card.viz?.hook || themeHook(card),
      why: card.viz?.why || "",
      hosts: (card.sources || []).map((source) => source.host),
    })),
    reasonCounts,
    samples: sampleRationales(visible, 6),
  };
  mkdirSync(cacheRoot, { recursive: true });
  writeFileSync(join(cacheRoot, "coverage.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(cacheRoot, "resolved.json"),
    JSON.stringify(Object.fromEntries([...resolved.entries()]), null, 2),
  );
  return { resolved, report };
}

function sampleRationales(visible, n) {
  const withImg = visible.filter((card) => card.viz?.image);
  const without = visible.filter((card) => !card.viz?.image);
  const picks = [...withImg.slice(0, Math.max(3, n - 2)), ...without.slice(0, 2)].slice(0, n);
  if (picks.length < n) {
    for (const card of visible) {
      if (!picks.includes(card)) picks.push(card);
      if (picks.length >= n) break;
    }
  }
  return picks.map((card) => ({
    id: card.id,
    hook: card.viz?.hook || themeHook(card),
    source: card.sources?.[0]?.href || "",
    image: card.viz?.image?.url || "",
    why: card.viz?.why || "",
    reason: card.viz?.reason || "",
  }));
}

export function formatCoverageMarkdown(report) {
  const pct = report.total ? Math.round(report.coverage * 100) : 0;
  const failRows =
    report.fail
      .map((item) => `| \`${item.id}\` | ${item.reason} | ${(item.hosts || []).join(", ") || "—"} | ${item.why || ""} |`)
      .join("\n") || "| — | — | — | — |";
  const okRows = report.successIds.map((id) => `- \`${id}\``).join("\n") || "- （无）";
  const samples = report.samples
    .map(
      (item) =>
        `- **${item.id}**\n  - 钩子：${item.hook}\n  - 源：${item.source || "—"}\n  - 图：${item.image || "（不挂）"}\n  - 说明：${item.why || item.reason}`,
    )
    .join("\n");
  const reasons = Object.entries(report.reasonCounts || {})
    .map(([reason, count]) => `- \`${reason}\`: ${count}`)
    .join("\n");
  return `# /daily/ 源站真图覆盖率（${report.day}）

- 可见 lead + story：**${report.success}/${report.total}** 挂上有价值真图（**${pct}%**）
- 门禁：≥70% 有价值真图；表不计入覆盖率；禁止字段小表凑数
- 版式：有图条目同一卡内左文右图（\`.ft-daily-split\` / \`.has-media\`）；无图条目仍两栏纯文
- 结论：${pct >= 70 ? "达到 ≥70%" : "未达 70% — 失败项为诚实降级，未用 Logo/字段表凑数"}

## 成功 \`data-id\`

${okRows}

## 失败 \`data-id\`（粗分）

${reasons || "- （无失败）"}

| data-id | reason | hosts | 说明 |
|---|---|---|---|
${failRows}

## 抽样 ≥5（钩子 → 为何挂 / 为何不挂）

${samples}
`;
}
