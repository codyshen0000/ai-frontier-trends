# 搜索库缺口 QA · 2026-10-21

**Branch:** `cursor/search-xhs-x-gap-f344`  
**范围:** `buildSearchIndex` 扩源（articles 小红书 + 稳定 X id + engine v1 ≤90d）+ `search.ts` 对 source/category 分词  
**闸门:** draft PR only · 不合 main · 无 AIHOT · 无付费 X API · 不发明卡片 · 不改 T2

## 根因（已核）

1. `xDocsFromArticles` 只收 `x.com` / `twitter.com`，`articles.json` 里 4 条小红书 pub 被 `continue`。
2. X 去重 id 为 `x-${handle}`，同账号多 paper 只留首条；`x.com/i/trending/...` 因 handle=`i` 被整条丢掉。
3. `score` 只 tokenize `title`+`summary`，搜「小红书」打不到 `source=小红书` 的卡。
4. R1 把 engine-data 拷到 `data/engine/v1` 后，`buildSearchIndex` 仍只读 `content/`，精选/事件/热点不进站搜。

## before → after

现网 before 取自 https://codyshen0000.github.io/ai-frontier-trends/data/search-index.json  
（`built_at` 2026-10-21T19:57:00+08:00，docs=46）。

本地 after：`exportStatic({ contentDir: content/ })`，工作区已含 `data/engine/v1`。

| 检查 | before（现网） | after（本分支本地 export） |
|---|---|---|
| docs 数量 | 46 | **48** |
| query `opd` | 7 | **8**（≥7；新增 `xhs-6ad132870000000018007ca1` PR-OPD） |
| query `小红书` | 差/空（tokenizer 不读 source；source=小红书仅 2 张 live 卡且标题多无该词） | **6**（其中 source=小红书 **5** 张） |
| source=小红书 | 2（Agent-Reflex、Argon Pro，均 live 固化卡） | **5**（上 2 + JEV-35B / PR-OPD / JevAny） |
| X 文档 id | `x-bfl_ai` 等 handle | `x-status-<id>`；无 status 则 `x-<url sha12>`；同 URL 仍去重 |
| gzip(search-index) | ~7.2KB | **7335 B（7.16KB）** ≤ 200KB |
| 无 AIHOT / 无假数据 / 无 `score` 键 | — | pass |

### 本分支 `buildSearchIndex` 新增（相对现网 content 路径）

| 来源 | 条数 | 说明 |
|---|---|---|
| articles 小红书 | +3 | Agent-Reflex 与 live 卡同 URL，按 URL 去重未再计 1 条 |
| articles X | +1 | 补上原被 handle=`i` 丢掉的 OpenUI trending；Kling 与 live 卡同 URL 去重 |
| engine v1 fold | 已计入 48 | `feed/selected.json` + `events/*.json` + `hot.json`，近 90 天，按 id/URL 对 content 去重 |

### query 明细（after）

**`opd`（8）:** weekly-2026-10-18, live-pr-opd, live-agent-reflex, live-tt-opd, live-opd-failure-negative, weekly-2026-10-12, timeline-lede, **xhs-6ad132870000000018007ca1（PR-OPD / 小红书）**

**`小红书`（6）:** live-agent-reflex, live-argon-pro-rollout, live-tt-opd（摘要含「小红书」）, xhs-6acf3113000000001c02d62d, xhs-6ad132870000000018007ca1, xhs-6ac0bb1c000000001901f5be

## 未做

- 不合 main / 不改 Pages 生产
- 不重开 X 公开 re-display、不接付费 X API
- 不发明 title/summary；banned meta 仍走 `findBannedMeta` / `clip`
- 不降 T2 / 采集门槛

## 回归

`node scripts/static_export.search.test.mjs`：同 handle 两篇 X 均保留；小红书 note id 稳定；engine fold；query「小红书」打到 source；query `opd` 含 PR-OPD。
