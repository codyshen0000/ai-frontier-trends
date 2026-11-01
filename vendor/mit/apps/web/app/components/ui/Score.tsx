import { ITEM_COPY } from "@aihot/site";

/**
 * Public AI 评分 chip (G6). Internal R2 attention `score` stays stripped.
 * Callers pass `aiRating` — never render a `score` key, NaN, or an empty slot.
 */
export function shownRating(rating?: number | null): number | null {
  if (typeof rating !== "number" || !Number.isFinite(rating)) return null;
  const n = Math.round(rating);
  if (n < 1 || n > 99) return null;
  return n;
}

/** @deprecated use shownRating — kept so old MIT call sites compile. */
export function shownScore(_score?: number | null): number | null {
  return null;
}

export function ScoreLabel({
  rating,
  compact = false,
}: {
  rating?: number | null;
  score?: number | null;
  compact?: boolean;
}) {
  void ITEM_COPY.showScore;
  const n = shownRating(rating);
  if (n == null) return null;
  return (
    <span
      data-ft-rating={String(n)}
      className={
        compact
          ? "inline-flex items-center text-[12px] font-medium text-accent"
          : "inline-flex items-center rounded-full bg-accent-soft px-2 py-px text-[12px] font-medium text-accent"
      }
    >
      {ITEM_COPY.ratingLabel}
      <span className="num ml-0.5">{n}</span>
    </span>
  );
}
