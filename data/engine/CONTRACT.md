# L4 v0 引擎导出契约

静态壳（精选 `/` `/live/`、热点 `/hot/`、日报 `/daily/`）默认读 `scripts/mit-static/src/fixture.ts`。

若本目录出现下列**具名 JSON**，`npm run build:public`（以及 `npm run build:mit-static`）在预渲染时用它们替换对应切片；缺的切片仍用 fixture。不要把示例文件直接放进本目录，否则会触发引擎模式。

品牌文案只允许「前沿趋势」。不要写 AIHOT / MyHOT。不要调用付费 API。图片热链原文 URL，不要本地下载或走代理。

类型真源：`vendor/mit/packages/contracts/src/site.ts`。下面是壳层实际读取的字段。

## 开关

| 条件 | 数据源 |
| --- | --- |
| 本目录没有任何下表 JSON | 全部 fixture |
| 出现任一个主文件 | 该文件替换对应切片，其余 fixture（`mixed`） |
| 四个主文件都在 | 全部引擎（`engine`） |

主文件：`timeline.json`、`hot-strip.json`、`hot.json`、`daily.json`。  
辅文件：`daily-index.json`、`meta.json`（有则用，无则从日报/时间线推导）。

构建后 `preview/mit-static/data/fixture-note.json` 的 `source` / `engineFiles` 记录实际用了什么。

## 图片（MIT L2）

只允许两处大图：

1. 热点榜 **NO.01** 头图（`hot.json` → `entries` 里 `rank === 1` 的 `cover`）
2. 日报头条（`daily.json` → `cover`）

规则：在候选图里取**第一张 `width >= 480`** 的图。更窄的图丢弃。`rank !== 1` 的热点条目即使带了 `cover` 也会在加载时被清空。

可直接给已选好的 `cover`，或给 `images` 数组让加载器按 L2 挑选：

```json
"cover": {
  "url": "https://example.com/original.jpg",
  "width": 1200,
  "height": 675,
  "caption": null
}
```

`url` 必须是原文热链（`https://…`）。不要 `srcSet` 指向代理。日报可用 `caption`；热点头图不用图注。

---

## 1. `timeline.json` — 精选时间线 / 入选条目

TypeScript：`TimelineResponse`（也接受只含 `cards` 的对象，或 `cards` 数组本身）。

```ts
type CategoryKey = "model" | "product" | "industry" | "paper" | "tutorial" | "opinion";

interface FeedItemSummary {
  id: string;
  title: string;
  summary: string | null;
  reason: string | null;          // 推荐理由；精选卡会显示
  source: { name: string };
  publishedAt: string | null;     // ISO 8601
  timelineAt: string;             // ISO 8601；按北京日期分组
  category: CategoryKey | null;
  tags: string[];                 // 可 []
  score: number | null;
  selected: boolean;
  channel: "news" | "x";          // 缺省 "news"
  x: null;                        // 本预览保持 null；不要靠列表大图
}

interface TimelineCard {
  key: string;
  anchorAt: string;               // 通常 = item.timelineAt
  item: FeedItemSummary;
  group: {
    factId: string;
    additionalSourceCount: number; // 「另外 N 家」
    reportCount: number;
  } | null;
}

interface TimelineResponse {
  filters: { channel: "all" | "news" | "x" | "firstParty"; category: CategoryKey | null; tag: string | null };
  cards: TimelineCard[];
  nextCursor: string | null;
  hot: HotStripEntry[] | null;    // 可选；有 hot-strip.json 或 hot.json 时不必重复
  dayCounts: Record<string, number>; // "YYYY-MM-DD" → 条数；可省略，加载器按 cards 统计
}
```

最小例子：

```json
{
  "filters": { "channel": "all", "category": null, "tag": null },
  "cards": [
    {
      "key": "flash",
      "anchorAt": "2026-10-18T10:53:00.000Z",
      "item": {
        "id": "flash-api",
        "title": "Flash 变体发布：检索 API 开放",
        "summary": "官方同步放出权重与 API。",
        "reason": "一手发布 + 多源跟进。",
        "source": { "name": "数字前沿观察" },
        "publishedAt": "2026-10-18T10:53:00.000Z",
        "timelineAt": "2026-10-18T10:53:00.000Z",
        "category": "model",
        "tags": [],
        "score": 67,
        "selected": true,
        "channel": "news",
        "x": null
      },
      "group": { "factId": "fact-flash", "additionalSourceCount": 12, "reportCount": 13 }
    }
  ],
  "nextCursor": null,
  "hot": null,
  "dayCounts": { "2026-10-18": 1 }
}
```

---

## 2. `hot-strip.json` — 精选页「当前热点」条

TypeScript：`HotStripEntry[]`。首页只渲染前 5 条。

若缺此文件：优先用 `timeline.json` 的 `hot`；再否则从 `hot.json` 的前 5 条推导。

```ts
interface HotParticipant {
  name: string;
  kind: "editorial" | "signal";
  iconUrl?: string | null;        // 头像也热链原文；可省略
}

interface HotStripEntry {
  rank: number;
  title: string;
  heat: number;
  trend: "up" | "down" | "flat" | "new" | "unknown";
  storyPublicId: string | null;
  itemId: string | null;
  participants: HotParticipant[];
  participantCount: number;
}
```

最小例子：

```json
[
  {
    "rank": 1,
    "title": "开源模型侧发布 Flash 变体并开放检索 API",
    "heat": 333,
    "trend": "up",
    "storyPublicId": "st-flash",
    "itemId": "flash-api",
    "participants": [
      { "name": "数字前沿", "kind": "editorial" },
      { "name": "评测组", "kind": "signal" }
    ],
    "participantCount": 47
  }
]
```

---

## 3. `hot.json` — 热点榜（含 24h spark）

TypeScript：`HotResponse`。

`spark`：截止排名时刻往前 **24 小时**、**从旧到新** 的整点热度。缺测点用 `null`（曲线在此处断开，不当 0）。也接受 `{ "hour": "2026-10-18T00:00:00.000Z", "heat": 12 }` 对象，加载器只取 `heat`。

`cover` **只给 NO.01**。其它名次不要放图。

```ts
interface HotEntryView {
  rank: number;
  story: { publicId: string; title: string };
  heat: number;
  trend: "up" | "down" | "flat" | "new" | "unknown";
  trendPct: number | null;
  badges: Array<"surge" | "new" | "rising">;  // rising → 「发酵中」
  participantCount: number;
  sourceCount: number;
  sourceNames: string[];          // 展示前两个
  participants: HotParticipant[];
  spark: Array<number | null>;    // 建议长度 24
  summary: string | null;
  latest: string | null;          // 一行最新进展
  cover: { url: string; srcSet?: string; width: number | null; height: number | null } | null;
}

interface HotResponse {
  computedAt: string | null;      // ISO 8601
  windowHours: number;            // 通常 48
  entries: HotEntryView[];
}
```

最小例子（spark 仅示意 24 点；NO.01 带 L2 头图）：

```json
{
  "computedAt": "2026-10-18T00:20:00.000Z",
  "windowHours": 48,
  "entries": [
    {
      "rank": 1,
      "story": { "publicId": "st-flash", "title": "开源模型侧发布 Flash 变体并开放检索 API" },
      "heat": 333,
      "trend": "down",
      "trendPct": 11,
      "badges": ["rising"],
      "participantCount": 47,
      "sourceCount": 15,
      "sourceNames": ["数字前沿观察", "Yuchen Jin"],
      "participants": [
        { "name": "数字前沿观察", "kind": "editorial" },
        { "name": "Yuchen Jin", "kind": "signal" }
      ],
      "spark": [18, 20, 22, 28, 35, 40, 48, 55, 62, 70, 78, 88, 95, 100, 92, 90, 88, 85, 86, 90, 94, 97, 99, 100],
      "summary": "官方将 Flash 升级为检索增强变体，网页端与 API 同步替换。",
      "latest": "第三方复测称该变体约 1/3 成本达到更强基线的编码表现。",
      "cover": {
        "url": "https://example.com/flash-1200.jpg",
        "width": 1200,
        "height": 675
      }
    }
  ]
}
```

---

## 4. `daily.json` — 日报（含头条 lead 与封面）

TypeScript：`ReportDetail`（`kind` 必须是 `"daily"`）。

头条文案走 `lead`；头条链接走 `leadItemId`。壳层只把 **`sections[].items` 里** 同 `itemId` 的条目当头条；若只写在 `highlights` 里，加载器会自动抬进一个「头条」栏目，否则会被当成无稿日、**封面不会出现**。封面走 `cover`（L2，仅头条）。

```ts
interface ReportCitation {
  itemId: string | null;
  title: string;
  summary: string | null;
  sourceName: string;
  sourceUrl: string;              // 原文 URL
  sourceIconUrl: string | null;
  firstParty: boolean;
  publishedAt: string | null;
  available: boolean;
  otherSources?: number;
}

interface ReportDetail {
  kind: "daily";
  key: string;                    // YYYY-MM-DD
  issueNumber: number;
  title: string;
  generatedAt: string;
  lead: { title: string; leadParagraph: string } | null;
  leadItemId: string | null;
  overview: string | null;
  highlights: ReportCitation[];
  sections: Array<{ label: string; summary: string | null; items: ReportCitation[] }>;
  flashes: ReportCitation[];
  cover: { url: string; srcSet?: string; width: number | null; height: number | null; caption: string | null } | null;
  metrics: Record<string, number>;
  readingMinutes: number;
  prev: string | null;            // 上期 key
  next: string | null;
}
```

最小例子：

```json
{
  "kind": "daily",
  "key": "2026-10-18",
  "issueNumber": 18,
  "title": "Flash 变体发布，检索 API 开放",
  "generatedAt": "2026-10-18T00:00:00.000Z",
  "lead": {
    "title": "Flash 变体发布，多基准成绩提升且 API 价格不变",
    "leadParagraph": "官方将上一版 Flash 升级为检索增强变体，网页端与 API 同步更新。"
  },
  "leadItemId": "flash-api",
  "overview": "今天的主线是开源侧一次可复现的模型升级。",
  "highlights": [
    {
      "itemId": "flash-api",
      "title": "Flash 变体发布，检索 API 开放",
      "summary": "权重与 API 同步放出，价格不变。",
      "sourceName": "数字前沿观察",
      "sourceUrl": "https://example.com/flash",
      "sourceIconUrl": null,
      "firstParty": true,
      "publishedAt": "2026-10-18T10:53:00.000Z",
      "available": true,
      "otherSources": 12
    }
  ],
  "sections": [
    {
      "label": "模型",
      "summary": "开源权重与评测口径同步更新。",
      "items": [
        {
          "itemId": "flash-api",
          "title": "Flash 变体：检索增强且定价不变",
          "summary": "官方同步网页、App 与 API。",
          "sourceName": "数字前沿观察",
          "sourceUrl": "https://example.com/flash",
          "sourceIconUrl": null,
          "firstParty": true,
          "publishedAt": "2026-10-18T10:53:00.000Z",
          "available": true,
          "otherSources": 12
        }
      ]
    }
  ],
  "flashes": [],
  "cover": {
    "url": "https://example.com/daily-lead-1200.jpg",
    "width": 1200,
    "height": 800,
    "caption": null
  },
  "metrics": { "totalEvents": 6, "sourcesCount": 15, "firstPartyEvents": 2, "modelsReleased": 1 },
  "readingMinutes": 4,
  "prev": "2026-10-17",
  "next": null
}
```

---

## 5. `daily-index.json`（可选）— 往期栏

TypeScript：`ReportNavigationEntry[]`。缺省时用当前 `daily.json` 生成一期。

```ts
interface ReportNavigationEntry {
  key: string;                    // YYYY-MM-DD
  issueNumber: number;
  title?: string | null;
  count?: number;
}
```

最小例子：

```json
[
  { "key": "2026-10-18", "issueNumber": 18, "title": "Flash 变体发布，检索 API 开放", "count": 6 },
  { "key": "2026-10-17", "issueNumber": 17, "title": "多模态开源与边缘本对齐", "count": 5 }
]
```

---

## 6. `meta.json`（可选）

```ts
interface EngineMeta {
  today: string;                  // YYYY-MM-DD，精选「今天」分组
}
```

缺省：`daily.json` 的 `key`，再缺则用 fixture 的日期。

最小例子：

```json
{ "today": "2026-10-18" }
```

---

## Phase B 怎么用

1. 把导出 JSON 按上述文件名放进 `data/engine/`（不要改文件名）。
2. `npm run build:public`（会先预渲染 MIT 壳再写入 `dist/`）。
3. 打开 `dist/data/fixture-note.json` 确认 `"source": "engine"` 或 `"mixed"`。
