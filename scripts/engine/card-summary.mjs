/**
 * Homepage featured-card summary picker.
 *
 * Prefer event.digest / long summary already present on the event or daily cite.
 * Never invent text. Never paste title, reason, or one_line as the card summary.
 */
export function cleanSummary(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    const nested = value.text ?? value.summary ?? value.digest ?? "";
    return String(nested).replace(/\s+/g, " ").trim();
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function compact(value) {
  return cleanSummary(value)
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .toLowerCase();
}

/** True when `text` is the title / reason / one_line restated, not a digest. */
export function isTitleEcho(text, other) {
  const a = compact(text);
  const b = compact(other);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length < 8) return false;
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.62) return true;
  return false;
}

function pushCandidate(list, text, source) {
  const clean = cleanSummary(text);
  if (!clean) return;
  list.push({ text: clean, source });
}

export function collectExistingSummaries(item, event, dailyCite) {
  const out = [];
  pushCandidate(out, event?.digest, "event.digest");
  pushCandidate(out, event?.summary, "event.summary");
  pushCandidate(out, event?.excerpt, "event.excerpt");
  for (const row of event?.officialReports || []) pushCandidate(out, row?.summary, "event.officialReports");
  for (const row of event?.timeline || []) pushCandidate(out, row?.summary, "event.timeline");
  for (const fact of event?.developments || []) {
    pushCandidate(out, fact?.representative?.summary, "event.developments");
  }
  pushCandidate(out, dailyCite?.summary, "daily.cite");
  pushCandidate(out, item?.digest, "item.digest");
  pushCandidate(out, item?.summary, "item.summary");
  return out;
}

function isBannedEcho(text, item, event) {
  const title = item?.title || event?.title || "";
  const reason = item?.reason || event?.recommendReason || "";
  const oneLine = item?.one_line || item?.oneLine || event?.one_line || event?.oneLine || "";
  return isTitleEcho(text, title) || isTitleEcho(text, reason) || isTitleEcho(text, oneLine);
}

const DIGEST_SOURCES = new Set(["event.digest", "item.digest"]);
const LONG_SOURCES = new Set([
  "event.summary",
  "event.excerpt",
  "event.officialReports",
  "event.timeline",
  "event.developments",
  "daily.cite",
]);

/**
 * Pick a homepage card summary from existing fields only.
 * Digest first, then the longest event/daily long summary, then item.summary.
 * @returns {string|null}
 */
export function pickCardSummary({ item, event, dailyCite } = {}) {
  const usable = collectExistingSummaries(item, event, dailyCite)
    .filter((row) => !isBannedEcho(row.text, item, event));
  if (!usable.length) return null;

  const digest = usable.find((row) => DIGEST_SOURCES.has(row.source));
  if (digest) return digest.text;

  const longs = usable.filter((row) => LONG_SOURCES.has(row.source));
  let picked = longs.length
    ? longs.reduce((best, row) => (row.text.length > best.length ? row.text : best), longs[0].text)
    : usable[0].text;

  // Re-group (SSR pages.tsx / site.ts) may omit dailyByItemId. Keep an already
  // publicized longer digest/cite (not a short one_line) instead of event.summary.
  const current = cleanSummary(item?.summary);
  if (
    current
    && current.length >= 80
    && !isBannedEcho(current, item, event)
    && current.length > picked.length
  ) {
    return current;
  }
  return picked;
}

export function indexEvents(events) {
  const map = new Map();
  for (const event of events || []) {
    const id = event?.publicId || event?.event_id;
    if (id) map.set(id, event);
  }
  return map;
}

export function indexDailyCites(dailies) {
  const map = new Map();
  const rows = [];
  for (const daily of dailies || []) {
    if (!daily || typeof daily !== "object") continue;
    for (const cite of daily.highlights || []) rows.push(cite);
    for (const cite of daily.flashes || []) rows.push(cite);
    for (const section of daily.sections || []) {
      for (const cite of section.items || []) rows.push(cite);
    }
  }
  for (const cite of rows) {
    const id = cite?.itemId || cite?.id;
    const summary = cleanSummary(cite?.summary);
    if (!id || !summary) continue;
    const prev = map.get(id);
    if (!prev || summary.length > prev.summary.length) {
      map.set(id, { ...cite, summary });
    }
  }
  return map;
}

export function thickenCardItem(item, { eventsById, dailyByItemId } = {}) {
  if (!item || typeof item !== "object") return item;
  const event = eventsById?.get(item.storyPublicId || item.eventPublicId) || null;
  const dailyCite = dailyByItemId?.get(item.id || item.guid) || null;
  const summary = pickCardSummary({ item, event, dailyCite });
  if (summary === (item.summary ?? null)) return item;
  return { ...item, summary };
}

export function thickenCards(cards, ctx) {
  if (!Array.isArray(cards)) return cards;
  return cards.map((card) => {
    if (!card?.item) return card;
    const item = thickenCardItem(card.item, ctx);
    return item === card.item ? card : { ...card, item };
  });
}

export function thickenFeedItems(items, ctx) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => thickenCardItem(item, ctx));
}
