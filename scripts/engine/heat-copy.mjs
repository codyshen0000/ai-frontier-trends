/**
 * Public heat-method copy. B2 `heat.mjs` should re-export this instead of
 * inventing a second string.
 */
export const HEAT_METHOD_COPY = "按过去 48 小时独立来源计算，半衰期 24 小时";

/** Ranking / page-copy cap. Must stay aligned with heat.mjs TOP_N and heat48h.py HOT_LIMIT. */
export const HOT_TOP_N = 10;

/** Honest status chip. Do not write 实时 — Pages + R1h are not a live 5min engine. */
export const HEAT_STATUS_LABEL = "当前热度";

/** Cadence that matches free Actions / R1h (08:00–23:00, :00/:15/:30/:45). */
export const HEAT_CADENCE_COPY = "业务日内约每 15 分钟重算（静态发布）";

export const HEAT_STALE_MS = 6 * 3600 * 1000;

export function heatComputedStale(computedAt, now = Date.now(), staleMs = HEAT_STALE_MS) {
  const ms = Date.parse(computedAt);
  if (!Number.isFinite(ms)) return false;
  return now - ms > staleMs;
}

const FORBIDDEN_HEAT_COPY = /实时|引擎已\s*1:1/;

export function assertHeatCopy(text, label = "heat copy") {
  const hit = String(text || "").match(FORBIDDEN_HEAT_COPY);
  if (hit) throw new Error(`${label} contains forbidden heat wording «${hit[0]}»`);
}

/** Drop banned heat claims. 「实时语音智能体」 becomes the existing 「语音智能体」. */
export function scrubForbiddenHeatCopy(text) {
  return String(text ?? "").replaceAll("实时", "").replace(/引擎已\s*1:1/g, "");
}

export function scrubForbiddenHeatCopyDeep(value) {
  if (typeof value === "string") return scrubForbiddenHeatCopy(value);
  if (Array.isArray(value)) return value.map(scrubForbiddenHeatCopyDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = scrubForbiddenHeatCopyDeep(child);
    return out;
  }
  return value;
}

/** Display the engine heat value without rescaling. One decimal if needed. */
export function formatHeat(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const tenths = Math.round(value * 10) / 10;
  return Number.isInteger(tenths) ? String(tenths) : tenths.toFixed(1);
}

export function formatTrendPct(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const tenths = Math.round(Math.abs(value) * 10) / 10;
  return Number.isInteger(tenths) ? String(tenths) : tenths.toFixed(1);
}

export function heatMatches(shown, expected, eps = 0.1) {
  if (typeof expected !== "number" || !Number.isFinite(expected)) return shown == null;
  if (typeof shown !== "number" || !Number.isFinite(shown)) return false;
  return Math.abs(shown - expected) <= eps;
}

export function sparkMatches(shown, expected, eps = 0.1) {
  const a = Array.isArray(shown) ? shown : [];
  const b = Array.isArray(expected) ? expected : [];
  if (a.length !== b.length) return false;
  return a.every((value, i) => {
    if (value == null && b[i] == null) return true;
    if (typeof value !== "number" || typeof b[i] !== "number") return false;
    return Math.abs(value - b[i]) <= eps;
  });
}
