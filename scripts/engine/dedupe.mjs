/**
 * Event_id / URL uniqueness helpers for B2 (timeline + hot + redirects).
 * Used by groupByEvent and scripts/verify/b2-event-id.mjs.
 */

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i;

export function normalizeUrl(url) {
  if (url == null) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    u.hash = "";
    u.hostname = u.hostname.replace(/^www\./i, "").toLowerCase();
    u.protocol = u.protocol.toLowerCase();
    const drop = [];
    for (const key of u.searchParams.keys()) {
      if (TRACKING_PARAMS.test(key)) drop.push(key);
    }
    for (const key of drop) u.searchParams.delete(key);
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    u.searchParams.sort();
    return u.toString();
  } catch {
    return raw.replace(/\/+$/, "").toLowerCase() || null;
  }
}

/** Keep the first row per normalized URL. Rows without a URL stay. */
export function uniqueByNormalizedUrl(rows, urlOf = (row) => row?.originalUrl) {
  const seen = new Set();
  const out = [];
  for (const row of rows || []) {
    const norm = normalizeUrl(urlOf(row));
    if (norm) {
      if (seen.has(norm)) continue;
      seen.add(norm);
    }
    out.push(row);
  }
  return out;
}

export function eventIdOf(card) {
  return (
    card?.item?.storyPublicId ||
    card?.item?.story?.publicId ||
    card?.item?.event_id ||
    card?.storyPublicId ||
    null
  );
}

export function cardUrl(card) {
  return (
    card?.item?.originalUrl ||
    card?.item?.links?.original ||
    card?.item?.url ||
    card?.originalUrl ||
    null
  );
}

export function resolveRedirectMap(redirects) {
  const rows = Array.isArray(redirects) ? redirects : redirects?.redirects || [];
  const hops = new Map();
  for (const row of rows) {
    const from = String(row?.from || "").trim();
    const to = String(row?.to || "").trim();
    if (!from || !to || from === to) continue;
    hops.set(from, to);
  }
  const resolved = new Map();
  for (const from of hops.keys()) {
    const seen = new Set();
    let cur = from;
    while (hops.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = hops.get(cur);
    }
    if (hops.has(cur) && seen.has(cur)) continue; // cycle: drop
    resolved.set(from, cur);
  }
  return resolved;
}

export function canonicalEventId(id, redirectMap) {
  if (!id) return id;
  return redirectMap.get(id) || id;
}

/**
 * Scan timeline cards, hot entries, search docs for duplicate event_id / URL
 * and leftover merged_into ids.
 *
 * @param {{ timeline?: { cards?: object[] }, hot?: { entries?: object[] }, search?: { docs?: object[] }, redirects?: object[]|object, events?: object[] }} bundle
 */
export function findDedupeIssues(bundle = {}) {
  const issues = [];
  const redirectMap = resolveRedirectMap(bundle.redirects || []);
  const mergedAway = new Set(redirectMap.keys());

  function scan(label, rows, idOf, urlOf) {
    const eventSeen = new Map();
    const urlSeen = new Map();
    for (const [i, row] of rows.entries()) {
      const where = `${label}[${i}]`;
      const id = idOf(row);
      if (id) {
        const canon = canonicalEventId(id, redirectMap);
        if (mergedAway.has(id) && canon !== id) {
          issues.push(`${where}: merged id ${id} still present (canonical ${canon})`);
        }
        const prev = eventSeen.get(canon);
        if (prev) issues.push(`${where}: duplicate event_id ${canon} (also ${prev})`);
        else eventSeen.set(canon, where);
      }
      const norm = normalizeUrl(urlOf(row));
      if (norm) {
        const prev = urlSeen.get(norm);
        if (prev) issues.push(`${where}: duplicate URL ${norm} (also ${prev})`);
        else urlSeen.set(norm, where);
      }
    }
    return { eventCount: eventSeen.size, urlCount: urlSeen.size };
  }

  const cards = bundle.timeline?.cards || bundle.cards || [];
  const timeline = scan("timeline.cards", cards, eventIdOf, cardUrl);
  const hot = scan(
    "hot.entries",
    bundle.hot?.entries || [],
    (entry) => entry?.story?.publicId,
    (entry) => entry?.primaryUrl || entry?.cover?.url || null,
  );
  const searchItems = (bundle.search?.docs || []).filter((doc) => doc?.kind === "item");
  const search = scan("search.docs", searchItems, () => null, (doc) => doc.originalUrl);

  return {
    ok: issues.length === 0,
    issues,
    eventCount: timeline.eventCount + hot.eventCount,
    urlCount: timeline.urlCount + search.urlCount,
    timeline,
    hot,
    search,
  };
}
