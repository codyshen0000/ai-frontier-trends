/**
 * Public heat-method copy. B2 `heat.mjs` should re-export this instead of
 * inventing a second string.
 */
export const HEAT_METHOD_COPY = "按过去 48 小时独立来源计算，半衰期 24 小时";

const FORBIDDEN_HEAT_COPY = /实时|引擎已\s*1:1/;

export function assertHeatCopy(text, label = "heat copy") {
  const hit = String(text || "").match(FORBIDDEN_HEAT_COPY);
  if (hit) throw new Error(`${label} contains forbidden heat wording «${hit[0]}»`);
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
