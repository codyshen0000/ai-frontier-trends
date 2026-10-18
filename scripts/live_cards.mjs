/** Parse curated cards out of live.html without touching the source file. */
import { decodeHtml } from "./extract.mjs";

export function stripTags(html) {
  return decodeHtml(String(html).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function attr(attrs, name) {
  const match = String(attrs).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}

function sourceHost(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "twitter.com" || host === "x.com") return "x.com";
    return host;
  } catch {
    return String(url).replace(/^https?:\/\//, "").split("/")[0] || url;
  }
}

function sourceLabel(host) {
  const map = {
    "x.com": "X",
    "arxiv.org": "arXiv",
    "github.com": "GitHub",
    "huggingface.co": "Hugging Face",
    "xiaohongshu.com": "小红书",
    "bfl.ai": "BFL",
    "modelscope.cn": "ModelScope",
  };
  return map[host] || host.replace(/\.[a-z]+$/, "");
}

export function formatZhDate(iso) {
  const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return iso;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00Z`);
  const week = ["日", "一", "二", "三", "四", "五", "六"][date.getUTCDay()];
  return {
    short: `${Number(match[2])}月${Number(match[3])}日`,
    long: `${Number(match[2])}月${Number(match[3])}日星期${week}`,
    iso,
  };
}

export function shiftDay(iso, delta) {
  const [year, month, day] = String(iso).split("-").map(Number);
  if (!year || !month || !day) return iso;
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return date.toISOString().slice(0, 10);
}

function parseCard(attrs, inner) {
  const id = attr(attrs, "data-id") || "";
  const day = attr(attrs, "data-day") || "";
  const cls = attr(attrs, "class") || "";
  const old = /\bold\b/.test(cls);
  const h3 = inner.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
  const titleHtml = h3 ? h3[1] : "";
  const focus = /<span\b[^>]*class=["'][^"']*\bbadge\b[^"']*["'][^>]*>\s*重点/.test(titleHtml);
  const title = stripTags(titleHtml.replace(/<span\b[^>]*>[\s\S]*?<\/span>/gi, ""));
  const paragraphs = [...inner.matchAll(/<p(\b[^>]*)>([\s\S]*?)<\/p>/gi)];
  let section = "";
  const summaries = [];
  for (const part of paragraphs) {
    const text = stripTags(part[2]);
    if (!text) continue;
    if (/\bclass=["'][^"']*\bnote\b/.test(part[1])) {
      const column = text.match(/栏目：\s*([^\s·]+)/);
      if (column) section = column[1];
      continue;
    }
    summaries.push(text);
  }
  const meta = inner.match(/<div class=["']meta["'][^>]*>([\s\S]*?)<\/div>/i);
  const metaHtml = meta ? meta[1] : inner;
  const timeMatch = stripTags(metaHtml).match(/📅\s*([^\s🔗]+(?:\s*（[^）]*）)?)/);
  const links = [...metaHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .filter((item) => /^https?:\/\//i.test(item[1]) && !/paper-explain/.test(item[0]))
    .map((item) => ({
      href: item[1],
      label: stripTags(item[2]),
      host: sourceHost(item[1]),
    }));
  const seen = new Set();
  const sources = [];
  for (const link of links) {
    if (!link.host || seen.has(link.host)) continue;
    seen.add(link.host);
    sources.push({ ...link, name: sourceLabel(link.host) });
  }
  return {
    id: id || title,
    day,
    old,
    focus,
    title,
    summary: summaries.join(" ").trim(),
    section,
    time: timeMatch ? timeMatch[1].trim() : day,
    sources,
    sourceCount: sources.length,
  };
}

function richness(card) {
  return (card.focus ? 4 : 0) + (card.section ? 2 : 0) + (card.old ? -3 : 0) + card.sourceCount + (card.summary ? 1 : 0);
}

export function extractLiveCards(html) {
  const found = [];
  const articleRe = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
  let match;
  while ((match = articleRe.exec(html))) {
    if (!/\bclass=["'][^"']*\bcard\b/.test(match[1])) continue;
    const card = parseCard(match[1], match[2]);
    if (!card.title || !card.day) continue;
    found.push(card);
  }
  const byId = new Map();
  for (const card of found) {
    const prev = byId.get(card.id);
    if (!prev || richness(card) > richness(prev)) byId.set(card.id, card);
  }
  return [...byId.values()];
}

export function selectPins(cards, limit = 4) {
  const latest = cards.reduce((max, card) => (card.day > max ? card.day : max), "");
  return [...cards]
    .map((card) => ({
      card,
      score:
        card.sourceCount * 10 +
        (card.focus ? 6 : 0) +
        (card.day === latest ? 5 : 0) +
        (card.old ? -8 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.card.day.localeCompare(a.card.day))
    .slice(0, limit)
    .map((item) => item.card);
}

export function rankHot(cards, { windowDays = 2, minItems = 8 } = {}) {
  const days = [...new Set(cards.map((card) => card.day))].sort().reverse();
  const latest = days[0];
  if (!latest) return [];
  const cutoff = shiftDay(latest, -(windowDays - 1));
  let pool = cards.filter((card) => card.day >= cutoff);
  if (pool.length < minItems) {
    const keep = new Set(days.slice(0, 3));
    pool = cards.filter((card) => keep.has(card.day));
  }
  return [...pool].sort(
    (a, b) =>
      b.sourceCount - a.sourceCount ||
      Number(b.focus) - Number(a.focus) ||
      b.day.localeCompare(a.day) ||
      a.title.localeCompare(b.title, "zh"),
  );
}

export function groupByDay(cards, excludeIds = new Set()) {
  const map = new Map();
  for (const card of cards) {
    if (excludeIds.has(card.id)) continue;
    if (!map.has(card.day)) map.set(card.day, []);
    map.get(card.day).push(card);
  }
  for (const list of map.values()) {
    list.sort((a, b) => Number(b.focus) - Number(a.focus) || b.sourceCount - a.sourceCount || a.title.localeCompare(b.title, "zh"));
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}
