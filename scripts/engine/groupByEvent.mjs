/**
 * Identity stub for B0. B2 replaces this with same-event grouping
 * (`one event → one card`, leftover sources as `group.additionalSourceCount`).
 *
 * B1 must call this; B2 must not edit `pages.tsx`.
 *
 * @param {unknown} cards
 * @returns {unknown}
 */
export function groupByEvent(cards) {
  return cards;
}
