declare module "@ft/heat-copy" {
  export const HEAT_METHOD_COPY: string;
  export function assertHeatCopy(text: string, label?: string): void;
  export function formatHeat(value: unknown): string | null;
  export function formatTrendPct(value: unknown): string | null;
  export function heatMatches(shown: unknown, expected: unknown, eps?: number): boolean;
  export function sparkMatches(shown: unknown, expected: unknown, eps?: number): boolean;
}
