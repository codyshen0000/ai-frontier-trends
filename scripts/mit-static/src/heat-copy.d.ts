declare module "@ft/heat-copy" {
  export const HEAT_METHOD_COPY: string;
  export const HOT_TOP_N: number;
  export const HEAT_STATUS_LABEL: string;
  export const HEAT_CADENCE_COPY: string;
  export const HEAT_STALE_MS: number;
  export function heatComputedStale(computedAt: string | null | undefined, now?: number, staleMs?: number): boolean;
  export function assertHeatCopy(text: string, label?: string): void;
  export function formatHeat(value: unknown): string | null;
  export function formatTrendPct(value: unknown): string | null;
  export function heatMatches(shown: unknown, expected: unknown, eps?: number): boolean;
  export function sparkMatches(shown: unknown, expected: unknown, eps?: number): boolean;
}
