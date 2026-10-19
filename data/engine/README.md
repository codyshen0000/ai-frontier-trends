# L4 v0 · out/engine — 发布端导出（MIT 静态壳数据）

生成：`import_export/pipeline.py`（`./import_export/run.sh` 跑真实 outbox，`./import_export/run.sh sample` 跑样本）。
形状对齐 `codyshen0000/ai-frontier-trends` main @ c1d9a5a 的 `scripts/mit-static/src/fixture.ts` 导出，
类型见 `vendor/mit/packages/contracts/src/site.ts`。字段名一字不改，可直接替换 fixture.ts 里的常量。

| 文件 | 对应 fixture.ts 导出 | 类型 |
|---|---|---|
| `timeline.json` | `timeline`（含 `.cards`、`.hot`） | `TimelineResponse` = `{filters:{channel,category,tag}, cards: TimelineCard[], nextCursor:null, hot: HotStripEntry[]|null, dayCounts: Record<YYYY-MM-DD,number>}` |
| `hot-strip.json` | `hotStrip` | `HotStripEntry[]` = `{rank,title,heat,trend,storyPublicId,itemId,participants:[{name,kind}],participantCount}`，前 5 |
| `hot.json` | `hot` | `HotResponse` = `{computedAt, windowHours:48, entries: HotEntryView[]}`；entry = `{rank,story:{publicId,title},heat,trend,trendPct,badges,participantCount,sourceCount,sourceNames,participants,spark,summary,latest,cover}`，前 10 |
| `daily.json` | `daily` | `ReportDetail` = `{kind:"daily",key,issueNumber,title,generatedAt,lead:{title,leadParagraph},leadItemId,overview,highlights:ReportCitation[],sections:[{label,summary,items}],flashes,cover:{url,width,height,caption}|null,metrics,readingMinutes,prev,next}` |
| `daily-index.json` | `dailyIndex` | `ReportNavigationEntry[]` = `{key,issueNumber,title,count}`，新→旧 |
| `fixture.json` | 全部 | `{timeline, hotStrip, hot, dailyIndex, daily, today}` 一次读入 |
| `meta.json` | （新增） | `{data_as_of (CST ISO), data_as_of_label「数据截至 …（北京时间）」, today, passed_count, fill_count, fill_label, hot_candidates, spark_points, batches[], import_log[]}` |

`TimelineCard` = `{key, anchorAt, item:{id,title,summary,reason,source:{name},publishedAt,timelineAt,category,score,selected,channel:"news",tags,x:null}, group:{factId,additionalSourceCount,reportCount,memberIds}|null}`；每个事件一张卡（代表稿）。

规则
- 热度：MIT `heat-v1-48h-halflife24h` 简版 —— 48h 窗口、每参与方（owner_entity_id 否则 source）只算最新一条、24h 半衰、显示值 `round(h*100)/10`、≥2 参与方且 ≥1 editorial、趋势比 6 小时前（±10%）、badges surge/new/rising。来源权重照 MIT = 1（`TIER_WEIGHT` 可调）。
- spark：SPARK_HOURS=24，照 MIT 输出 **25 个点**（整点前 24h…整点，含两端），无证据的小时为 null。
- 配图（L2 照搬）：候选取原文 `image_candidates` 第一张 `coalesce(width,800)>=480`；`/hot/` 只给 NO.01 出图，顺序照 queryHotCovers（代表稿→一手→入选→分高→id）；日报头条照 leadCover（头条稿→一手→分高→id）。summary-only（source `body_mode:"summary"`）、非 editorial、blocked/excluded 不借图。`cover.url` 是原图地址，构建期缩图后替换。
- 补位：未过门槛（`gate_a=false`）的事件标题强制带 `[低于门槛补位]`（已有不重复加）；`meta.passed_count / fill_count` 按事件计。热度、分数原样输出。

## 2026-10-19 11:30 CST · 真实批次 2026-10-19T1124
- 入口：`v0/import_export.py`（转发到 `import_export/pipeline.py`；旧骨架存为 `import_export.skeleton.py`）。命令：`./import_export.py --batch 2026-10-19T1124`。
- 只导入 outbox 中带 round.done.json 的批次；数据只读写 engine.sqlite 的 `pub_*` 表，不读采集器的 `items/queue_batches/articles`（49 条那次的残留不会进导出）。
- 事实核对（grounding，移植 MIT reports/compose.ts grounded()）：事件 title+summary、精选 title_zh+summary_zh、日报 title+one_line 里的英文专名、数字、年份，必须出现在原文语料里才放行。语料包括采集标题/摘要/正文、ingest snippet，以及 `l4/work/<batch>/body-read-evidence.json` 的正文摘录（read_mode=body 的条目）。v0 容差：「27 to 9 percent」可支撑「27%/9%」；来源是 Hacker News 时「HN」视为已知。
- 标签：`[低于门槛补位]`（以及日报 one_line 里的 `（低于门槛）`）原样保留。未过门槛、标题里还没有「低于门槛」字样的，导出时在标题前补 `[低于门槛补位]`。
- 静态站要读的字段：`timeline.cards[].item.title`、`hot.entries[].story.title`、`timeline.hot[].title`/`hot-strip[].title`、`daily.lead.title`、`daily.highlights[].title`、`daily.sections[].items[].title`、`daily.highlights[].summary`/`sections[].items[].summary`（含「（低于门槛）」）、`daily.flashes[].title`、`daily-index[].title`；`meta.data_as_of`（ISO +08:00）、`meta.data_as_of_label`、`meta.passed_count`、`meta.fill_count`、`meta.fill_label`。
