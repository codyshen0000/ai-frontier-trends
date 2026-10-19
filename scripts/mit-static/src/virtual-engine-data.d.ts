declare module "virtual:engine-data" {
  export type EnginePayload = {
    present: string[];
    timeline: unknown | null;
    hotStrip: unknown | null;
    hot: unknown | null;
    daily: unknown | null;
    dailyIndex: unknown | null;
    meta: { today?: string } | null;
  };
  export const enginePayload: EnginePayload;
}
