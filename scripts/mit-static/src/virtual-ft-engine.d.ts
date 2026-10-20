declare module "virtual:ft-engine" {
  const data: {
    data_as_of: string;
    built_at: string;
    source: string;
    warning: string | null;
    hasSelectedFeed: boolean;
    hot: {
      computedAt: string | null;
      windowHours: number;
      entries: unknown[];
    };
    hotStrip: unknown[];
    daily: unknown;
    dailyIndex: unknown[];
    dailies: unknown[];
    timeline: {
      filters: { channel: string; category: string | null; tag: string | null };
      cards: unknown[];
      nextCursor: string | null;
      hot: unknown[] | null;
      dayCounts: Record<string, number>;
    };
    itemUrls: Record<string, string>;
    feedItems: unknown[];
    events: unknown[];
    redirects: unknown[];
    items: unknown[];
    topics: Array<{ slug: string; name: string; count: number }>;
    allTimeline: {
      filters: { channel: string; category: string | null; tag: string | null };
      cards: unknown[];
      nextCursor: string | null;
      hot: unknown[] | null;
      dayCounts: Record<string, number>;
    };
    weeklyIndex: unknown[];
    monthlyIndex: unknown[];
  };
  export default data;
}
