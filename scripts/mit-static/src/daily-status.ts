/**
 * /daily/ KEEP-tip status copy (G4 D-001 / #94).
 * Calendar today is Asia/Shanghai YYYY-MM-DD. Tip is latest.json / daily.json key.
 * Floors stay 14 / 11 / 20 — this module only decides on-page copy.
 */

export const DAILY_PUBLISH_FLOORS = Object.freeze({
  sources: 14,
  firstParty: 11,
  flashes: 20,
});

export type DailyStatusReason = "missing" | "below";

export type DailyIssueLike = {
  metrics?: {
    sourcesCount?: number | null;
    firstPartyEvents?: number | null;
  } | null;
  flashes?: unknown[] | null;
};

function asCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function dailyIssueMetrics(issue: DailyIssueLike | null | undefined) {
  const metrics = issue?.metrics || {};
  return {
    sources: asCount(metrics.sourcesCount),
    firstParty: asCount(metrics.firstPartyEvents),
    flashes: Array.isArray(issue?.flashes) ? issue.flashes.length : 0,
  };
}

export function meetsPublishFloors(issue: DailyIssueLike | null | undefined): boolean {
  if (!issue) return false;
  const m = dailyIssueMetrics(issue);
  return (
    m.sources >= DAILY_PUBLISH_FLOORS.sources &&
    m.firstParty >= DAILY_PUBLISH_FLOORS.firstParty &&
    m.flashes >= DAILY_PUBLISH_FLOORS.flashes
  );
}

/** Tip day as「M月D日」, never labeled 今天. */
export function tipMonthDay(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || "").trim());
  if (!m) return "";
  return `${Number(m[2])}月${Number(m[3])}日`;
}

export function dailyStatusCopy(reason: DailyStatusReason, tipKey: string): string {
  const day = tipMonthDay(tipKey);
  if (!day) return "";
  if (reason === "missing") return `今日日报尚未生成，当前展示最近达标日（${day}）`;
  return `今日日报未达发布门槛，当前展示最近达标日（${day}）`;
}

export function resolveDailyStatus(input: {
  calendarToday?: string | null;
  tipKey?: string | null;
  todayHttpStatus?: number | null;
  todayIssue?: DailyIssueLike | null;
}): string {
  const calendarToday = String(input.calendarToday || "").trim();
  const tipKey = String(input.tipKey || "").trim();
  if (!calendarToday || !tipKey || calendarToday === tipKey) return "";

  const status = input.todayHttpStatus;
  if (status === 404) return dailyStatusCopy("missing", tipKey);
  if (status === 200) {
    return meetsPublishFloors(input.todayIssue) ? "" : dailyStatusCopy("below", tipKey);
  }
  if (status == null && input.todayIssue === null) return dailyStatusCopy("missing", tipKey);
  if (input.todayIssue && !meetsPublishFloors(input.todayIssue)) {
    return dailyStatusCopy("below", tipKey);
  }
  return "";
}

export function dailyStatusBannerHtml(copy: string): string {
  if (!copy) return "";
  return `<p data-ft-daily-status role="status" class="ft-daily-status">${escapeStatusHtml(copy)}</p>`;
}

function escapeStatusHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
