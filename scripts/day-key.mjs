/**
 * Single calendar day-key for timeline groups and `day_counts`.
 *
 * Rule: Asia/Shanghai (UTC+8, no DST) YYYY-MM-DD of the instant.
 * Same arithmetic as `beijingDate` in vendor/mit/packages/contracts/src/time.ts
 * (SSR Timeline / DayList). Do not slice the UTC ISO prefix — a UTC evening
 * instant belongs to the next Shanghai morning.
 *
 * Instant source is `anchorAt` / `timelineAt`, not the factId prefix.
 * A card like Uber `2026-10-23-*` with `2026-10-22T00:00:00Z` stays on
 * `2026-10-22` (CST 08:00).
 */
const OFFSET_MS = 8 * 3600 * 1000;

/** YYYY-MM-DD in Asia/Shanghai, or "" if the instant is missing / unparseable. */
export function dayKey(instant) {
  if (instant == null || instant === "") return "";
  const t = new Date(instant).getTime();
  if (!Number.isFinite(t)) return "";
  return new Date(t + OFFSET_MS).toISOString().slice(0, 10);
}

export function cardDayKey(card) {
  return dayKey(card?.anchorAt || card?.item?.timelineAt || card?.item?.publishedAt || "");
}

export function countDays(cards) {
  const counts = {};
  for (const card of cards || []) {
    const day = cardDayKey(card);
    if (day) counts[day] = (counts[day] || 0) + 1;
  }
  return counts;
}
