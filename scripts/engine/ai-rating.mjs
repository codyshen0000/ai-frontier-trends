/**
 * Public-layer AI 评分 for 精选 cards (G6).
 *
 * Internal R2 gate / attention `score` keys stay stripped. This number is
 * derived only from signals already on the public card: selected, reason,
 * source/report counts, first-party, and listed heat when present.
 */
export function publicAiRating({
  selected = false,
  reason = "",
  sourceCount = 0,
  reportCount = 0,
  firstParty = false,
  heat = null,
} = {}) {
  const sources = Math.max(0, Number(sourceCount) || 0);
  const reports = Math.max(0, Number(reportCount) || 0);
  const hasReason = Boolean(String(reason || "").trim());
  const listedHeat = typeof heat === "number" && Number.isFinite(heat) ? heat : null;
  if (!selected && !hasReason && sources < 1 && listedHeat == null) return null;

  let n = selected ? 70 : 58;
  n += Math.min(14, sources * 3);
  if (reports > sources) n += Math.min(4, reports - sources);
  if (firstParty) n += 7;
  if (hasReason) n += 5;
  if (listedHeat != null && listedHeat > 0) n += Math.min(8, Math.round(listedHeat / 3));
  return Math.max(55, Math.min(95, Math.round(n)));
}
