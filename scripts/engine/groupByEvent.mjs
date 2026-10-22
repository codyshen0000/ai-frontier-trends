/**
 * Same-event grouping for the timeline: one card per event_id.
 *
 * B1 calls this (pages.tsx). B2 owns the implementation. MIT components are
 * not edited — they already render `group.additionalSourceCount` as「另 N 家」
 * (`另外 ${N} 家也报道了`) and hot faces from `sourceCount` / `sourceNames` /
 * `participants`.
 *
 * Optional second argument (engine bundle) supplies event member lists,
 * source kinds, and redirects.json so merged_into aliases fold into the
 * surviving event. Cards alone still collapse duplicate event_id / URL.
 */
import { asHotKind, indexSources } from "./heat.mjs";
import { pickCardSummary } from "./card-summary.mjs";
import {
  canonicalEventId,
  cardUrl,
  eventIdOf,
  normalizeUrl,
  resolveRedirectMap,
} from "./dedupe.mjs";

function sourceNameOf(item) {
  return item?.source?.name || item?.x?.authorName || item?.x?.handle || null;
}

function sourceKindOf(item, byName) {
  const name = sourceNameOf(item);
  const fromTable = name && byName.get(name);
  const kind = item?.source?.kind || item?.kind || fromTable?.kind;
  return asHotKind(kind);
}

function publishedMs(card) {
  const raw = card?.anchorAt || card?.item?.timelineAt || card?.item?.publishedAt;
  const ms = Date.parse(raw || "");
  return Number.isFinite(ms) ? ms : 0;
}

function pickRepresentative(cards, event) {
  const wanted =
    event?.latestReport?.id ||
    event?.developments?.[0]?.representative?.id ||
    event?.primaryItemId ||
    null;
  if (wanted) {
    const hit = cards.find((card) => card?.item?.id === wanted);
    if (hit) return hit;
  }
  const selected = cards.filter((card) => card?.item?.selected);
  const pool = selected.length ? selected : cards;
  return [...pool].sort((a, b) => publishedMs(b) - publishedMs(a) || String(b?.key || "").localeCompare(String(a?.key || "")))[0];
}

function eventById(events) {
  const map = new Map();
  for (const event of events || []) {
    const id = event?.publicId || event?.event_id;
    if (id) map.set(id, event);
  }
  return map;
}

function membersFromEvent(event) {
  const rows = [];
  const seen = new Set();
  const push = (row) => {
    if (!row?.id || seen.has(row.id)) return;
    seen.add(row.id);
    rows.push(row);
  };
  for (const row of event?.timeline || []) push(row);
  for (const row of event?.officialReports || []) push(row);
  for (const fact of event?.developments || []) {
    if (fact?.representative) push(fact.representative);
  }
  return rows;
}

function mergeIcon(prev, extra) {
  if (!prev.iconUrl && extra.iconUrl) prev.iconUrl = extra.iconUrl;
  if (!prev.iconSrcSet && extra.iconSrcSet) prev.iconSrcSet = extra.iconSrcSet;
}

function uniqueSources(members, cards, byName) {
  const map = new Map();
  const add = (name, kind, extra = {}) => {
    if (!name) return;
    const prev = map.get(name);
    const nextKind = asHotKind(kind);
    if (!prev) map.set(name, { name, kind: nextKind, ...extra });
    else {
      if (prev.kind !== "editorial" && nextKind === "editorial") prev.kind = "editorial";
      mergeIcon(prev, extra);
    }
  };
  for (const card of cards) {
    const item = card.item;
    add(sourceNameOf(item), sourceKindOf(item, byName), {
      iconUrl: item?.source?.iconUrl,
      iconSrcSet: item?.source?.iconSrcSet,
    });
    for (const participant of item?.participants || []) {
      add(participant.name, participant.kind || sourceKindOf({ source: { name: participant.name } }, byName), {
        iconUrl: participant.iconUrl,
        iconSrcSet: participant.iconSrcSet,
      });
    }
  }
  for (const row of members) {
    add(row.source?.name || row.name, row.source?.kind || row.kind || byName.get(row.source?.name)?.kind, {
      iconUrl: row.source?.iconUrl || row.iconUrl,
      iconSrcSet: row.source?.iconSrcSet || row.iconSrcSet,
    });
  }
  return [...map.values()];
}

function memberIdsFrom(cards, members) {
  const ids = [];
  const seen = new Set();
  for (const card of cards) {
    const id = card?.item?.id;
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  for (const row of members) {
    if (row?.id && !seen.has(row.id)) {
      seen.add(row.id);
      ids.push(row.id);
    }
  }
  return ids;
}

function decorateCard(representative, { id, sources, memberIds, reportCount, event, dailyCite }) {
  const sourceCount = sources.length;
  const additionalSourceCount = Math.max(0, sourceCount - 1);
  const item = {
    ...representative.item,
    storyPublicId: id || representative.item?.storyPublicId,
    summary: pickCardSummary({ item: representative.item, event, dailyCite }),
    sourceCount,
    sourceNames: sources.map((row) => row.name),
    participants: sources.map((row) => ({
      name: row.name,
      kind: row.kind,
      ...(row.iconUrl ? { iconUrl: row.iconUrl } : {}),
      ...(row.iconSrcSet ? { iconSrcSet: row.iconSrcSet } : {}),
    })),
  };
  const group = {
    factId: id || representative.group?.factId || representative.key,
    additionalSourceCount,
    reportCount: Math.max(reportCount, memberIds.length, 1),
    memberIds,
  };
  return {
    ...representative,
    item,
    group,
  };
}

/**
 * @param {unknown} cards
 * @param {{ events?: object[], redirects?: object[]|object, sources?: object[]|object }} [data]
 * @returns {unknown}
 */
export function groupByEvent(cards, data = {}) {
  if (!Array.isArray(cards)) return cards;
  const redirectMap = resolveRedirectMap(data.redirects || data.redirectsJson || []);
  const events = eventById(data.events);
  const dailyByItemId = data.dailyByItemId instanceof Map ? data.dailyByItemId : new Map();
  const { byName } = indexSources(data.sources || []);

  const buckets = new Map();
  const ungrouped = [];
  const firstIndex = [];

  for (const [i, card] of cards.entries()) {
    const rawId = eventIdOf(card);
    const id = rawId ? canonicalEventId(rawId, redirectMap) : null;
    if (!id) {
      ungrouped.push(card);
      continue;
    }
    if (!buckets.has(id)) {
      buckets.set(id, []);
      firstIndex.push({ id, i });
    }
    buckets.get(id).push(card);
  }

  const grouped = [];
  for (const { id } of firstIndex) {
    const groupCards = buckets.get(id);
    const event = events.get(id);
    const representative = pickRepresentative(groupCards, event);
    const members = event ? membersFromEvent(event) : [];
    const sources = uniqueSources(members, groupCards, byName);
    const memberIds = memberIdsFrom(groupCards, members);
    grouped.push(
      decorateCard(representative, {
        id,
        sources,
        memberIds,
        reportCount: Math.max(members.length, groupCards.length, memberIds.length),
        event,
        dailyCite: dailyByItemId.get(representative.item?.id),
      }),
    );
  }

  const usedUrls = new Set();
  for (const card of grouped) {
    const norm = normalizeUrl(cardUrl(card));
    if (norm) usedUrls.add(norm);
  }

  const leftovers = [];
  const leftoverUrl = new Map();
  for (const card of ungrouped) {
    const norm = normalizeUrl(cardUrl(card));
    if (norm && (usedUrls.has(norm) || leftoverUrl.has(norm))) continue;
    if (norm) leftoverUrl.set(norm, card);
    const name = sourceNameOf(card.item);
    leftovers.push(
      decorateCard(card, {
        id: eventIdOf(card),
        sources: name ? [{ name, kind: sourceKindOf(card.item, byName) }] : [],
        memberIds: card.item?.id ? [card.item.id] : [],
        reportCount: 1,
        event: events.get(eventIdOf(card)),
        dailyCite: dailyByItemId.get(card.item?.id),
      }),
    );
  }

  const merged = [...grouped, ...leftovers];
  merged.sort((a, b) => publishedMs(b) - publishedMs(a) || String(b.key).localeCompare(String(a.key)));
  return merged;
}

export { eventIdOf, cardUrl, normalizeUrl };
