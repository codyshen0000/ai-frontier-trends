# L4 v0 引擎导出契约

形状对齐 `scripts/mit-static/src/fixture.ts` 与 `vendor/mit/packages/contracts/src/site.ts`。字段名与导出文件一字不改；加载器适配这些文件，不要求改导出。

静态壳默认读 fixture。本目录出现下列 JSON 后，`npm run build:public` 预渲染改用导出。品牌只允许「前沿趋势」。不要写 AIHOT / MyHOT。不要调用付费 API。

## 文件

| 文件 | 对应 fixture.ts | 类型 |
| --- | --- | --- |
| `timeline.json` | `timeline`（含 `.cards`、`.hot`） | `TimelineResponse` |
| `hot-strip.json` | `hotStrip` | `HotStripEntry[]`（前 5） |
| `hot.json` | `hot` | `HotResponse`（前 10） |
| `daily.json` | `daily` | `ReportDetail` |
| `daily-index.json` | `dailyIndex` | `ReportNavigationEntry[]`，新→旧 |
| `fixture.json` | 全部 | `{timeline, hotStrip, hot, dailyIndex, daily, today}` 一次读入 |
| `meta.json` | （新增） | 见下 |
| `daily/YYYY-MM-DD.json` | 按日归档 | 与 `daily.json` 同形。本批有 `2026-10-19`–`2026-10-24`；根目录 `daily.json` 等于今天（`2026-10-24`）。加载器仍读根目录 `daily.json`。 |

分片文件优先于 `fixture.json` 同名切片。只有 `fixture.json` 也算引擎模式。

### `TimelineResponse`

`{filters:{channel,category,tag}, cards: TimelineCard[], nextCursor:null, hot: HotStripEntry[]|null, dayCounts}`

`TimelineCard` = `{key, anchorAt, item:{id,title,summary,reason,source:{name},publishedAt,timelineAt,category,score,selected,channel:"news",tags,x:null}, group:{factId,additionalSourceCount,reportCount,memberIds}|null}`

### `HotStripEntry`

`{rank,title,heat,trend,storyPublicId,itemId,participants:[{name,kind}],participantCount}`

### `HotResponse`

`{computedAt, windowHours:48, entries: HotEntryView[]}`

`HotEntryView` = `{rank,story:{publicId,title},heat,trend,trendPct,badges,participantCount,sourceCount,sourceNames,participants,spark,summary,latest,cover}`

`spark`：MIT 源是 **25 点**（24h 含两端，旧→新）。缺测点为 `null`。加载器按数组原样接受，不截成 24。

### `ReportDetail`

`{kind:"daily",key,issueNumber,title,generatedAt,lead:{title,leadParagraph},leadItemId,overview,highlights,sections,flashes,cover,metrics,readingMinutes,prev,next}`

`leadItemId` 必须能在 `sections[].items` 对上，头版和大图才走普通报纸布局。若只写在 `highlights`，加载器会抬进「头条」栏目。

### `meta.json`

```ts
interface EngineMeta {
  data_as_of: string;            // CST ISO，如 2026-10-19T11:28:46+08:00
  data_as_of_label: string;      // 「数据截至 2026-10-19 11:28（北京时间）」
  today: string;                 // YYYY-MM-DD
  passed_count: number;
  fill_count: number;
  fill_label?: string;           // 可选；缺省时加载器用「[低于门槛补位]」
  spark_points: number;          // 25
}
```

精选 `/`、热点 `/hot/`、日报 `/daily/` 必须**可见**渲染 `data_as_of_label`。

## 渲染规则（产品）

- 标题里的 `「[低于门槛补位]」`、日报摘要里的 `「（低于门槛）」` **原样保留**，不得剥离或隐藏。
- 新导出若只给 `belowThreshold: true`、标题不再带前缀：加载器在渲染前补上 `[低于门槛补位]` / `（低于门槛）`。
- 热度、分数原样进入壳层，不改写成 0、不因补位隐藏。
- 本批：过线 46 条 / 补位 0 条；热点 9 条。24 日日报头条：OpenAI 加固训练环境（metrics 14/12，`flashes=20`；T0919–T1222 无新精选）。

## 图片（MIT L2）

只两处大图：

1. 热点 **NO.01** 的 `cover`（本批为 `null`，走无图 + 24h spark 面板）
2. 日报头条 `cover`（本批 v5 价值门为 `null`，走无图报纸布局）

规则：第一张 `width >= 480`。`rank !== 1` 的 cover 丢弃。`url` 热链原文，不走付费代理；加载失败时壳层去掉该图（无图态）。

## 最小例子

导出真文件即规范。下面只标字段，不另造事实。

`timeline.json`：`filters` + `cards[]` + `dayCounts`  
`hot-strip.json`：最多 5 条 `{rank,title,heat,trend,storyPublicId,itemId,participants,participantCount}`  
`hot.json`：`entries[].spark` 长度 25；NO.01 `cover` 可 null  
`daily.json`：`lead` + `leadItemId` + `cover:{url,width,height,caption}`  
`daily-index.json`：`[{key,issueNumber,title,count}]`  
`meta.json`：`data_as_of_label` / `today` / `passed_count` / `fill_count`  
`fixture.json`：上述切片一次打包，另加 `today`
