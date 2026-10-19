declare module "virtual:engine-data" {
  export type EnginePayload = {
    present: string[];
    timeline: unknown | null;
    hotStrip: unknown | null;
    hot: unknown | null;
    daily: unknown | null;
    dailyIndex: unknown | null;
    meta: {
      today?: string;
      data_as_of?: string;
      data_as_of_label?: string;
      passed_count?: number;
      fill_count?: number;
      fill_label?: string;
    } | null;
  };
  export const enginePayload: EnginePayload;
}
