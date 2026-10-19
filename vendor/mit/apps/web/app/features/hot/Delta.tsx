import type { HotEntryView } from "@aihot/contracts/site";
import { formatTrendPct } from "@ft/heat-copy";

/** Change against six hours before the ranking: up in the hot tone, down quiet, new stories marked new, none while sources are behind. */
export function Delta({
  trend,
  pct,
  className = "",
  storyPublicId,
}: {
  trend: HotEntryView["trend"];
  pct: number | null;
  className?: string;
  storyPublicId?: string;
}) {
  const base = `inline-flex h-[22px] shrink-0 items-center gap-0.5 rounded-full px-2 text-[11.5px] font-medium tabular-nums ${className}`;
  const attrs = storyPublicId && pct != null ? { "data-ft-story": storyPublicId, "data-ft-trend-pct": String(pct) } : {};
  if (trend === "unknown") return null;
  if (trend === "new") return <span className={`${base} bg-accent-soft text-accent`}>新上榜</span>;
  if (pct == null) return null;
  if (trend === "flat") return <span {...attrs} className={`${base} bg-well text-ink-4`} title="较 6 小时前">持平</span>;
  const up = trend === "up";
  const shown = formatTrendPct(pct);
  return (
    <span {...attrs} className={`${base} ${up ? "bg-hot-soft text-hot" : "bg-well text-ink-4"}`} title="较 6 小时前">
      {up ? "↑" : "↓"} {shown}%
    </span>
  );
}
