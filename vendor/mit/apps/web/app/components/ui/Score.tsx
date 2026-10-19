import { ITEM_COPY } from "@aihot/site";

/**
 * Site-data removed R2 attention `score` (events story.score, timeline card.item.score).
 * MIT FeedItemSummary used to require it; callers may still pass undefined/null.
 * Never render a number, NaN, or an empty slot. The public figure is heat, not score.
 */
void ITEM_COPY;

export function shownScore(_score?: number | null): number | null {
  return null;
}

export function ScoreLabel(_props: { score?: number | null; compact?: boolean }) {
  return null;
}
