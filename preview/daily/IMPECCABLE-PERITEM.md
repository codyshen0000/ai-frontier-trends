# 前沿趋势日报 · Impeccable 自审（Tasks #6 per-item 图/表）

目标：每条 `ft-daily-lead` / `ft-daily-story` 摘要下挂 `ft-daily-item-viz`（本条表或图，不是刊头/右栏汇总）。  
本地：`http://127.0.0.1:4173/daily/` · 1280×800 / 390×844 实测  
对照：`daily-viz-peritem-acceptance.md`（取代汇总三槽方案）；PR #14 否决不合。  

**开发自审结论：通过（可交产品终审）。** 无 P0。当日可见 lead+story **13/13（100%）** 有 ③ 要点表；三期合计 **43/43（100%）**。无省略 `data-id`。无图路径（live 卡 article 级 `<img>` / cover = 0），故无配图截图。

---

## Critique（Assessment A）

**设计特异性：通过。** 可视块贴在该条标题/摘要下面，和 chip 同一条目，不是页顶总表，也不是右栏条形图。和 `/live/` 卡片流、`/hot/` 榜单仍不同物。

### Nielsen（0–4）

| # | 启发 | 分 | 注 |
|---|---|---:|---|
| 1 | 系统状态可见 | 3 | 表内栏目/标签/来源/一手来自本卡；chip 仍标一手 |
| 2 | 符合现实 | 4 | 项/值只复述已有字段或原文短语；无 heat / 基准分 |
| 3 | 用户控制 | 3 | 表不挡原文 chip；外链仍新窗口 |
| 4 | 一致性 | 4 | 暖纸 hairline、12px 小于 dek；无新色、无 *HOT |
| 5 | 防错 | 3 | 无图不输出 figure；无内容不输出整块；图失败 `onerror` 藏 figure |
| 6 | 再认而非回忆 | 3 | 列名固定（项/值 或 来源名/host/角色） |
| 7 | 灵活高效 | 2 | 扫读变快；多数表字段重复，摘要数字才是增量 |
| 8 | 美观克制 | 3 | 单色表、无渐变 CTA；双栏故事里表偏高，占垂直空间 |
| 9 | 纠错 | 3 | 缺 sources 则整块省略（本刊未发生） |
| 10 | 帮助 | 2 | caption 仅屏幕阅读器可见；无「怎么读这张表」 |

**概念：过关。** 1280 首屏能在头条摘要下看到该条自己的表，右栏仍是今日看点/本期版面。390 首屏刊头较高，表需下滚；滚到条目后表+chip 完整可读。

### 优势

1. 挂载点正确：dek/摘要 → viz → chips。头条与各版块故事一致。  
2. 没有 PR #14 的版面条形图、本期定档总表、头条旁对照表。  
3. 数据对齐字段盘点：`tags` / `firstParty` / enclosing `section` 回填 / `sources[]`。  
4. 无库存图、无 AI 生图、无空白骨架。

### 残留（非阻塞）

- **P2** ③ 表前几行（栏目/标签/来源/一手/主链）跨条重复，扫读增量主要在摘要抽出的「键：值」。  
- **P2** 双栏故事里表比摘要块更高，竖向变密。  
- **P2** 390 首屏刊头+日历把头条表推到折线以下（下滚即见，不撑破页壳）。  
- **P3** 无图可升 ②；正文 `<table>` 今日 0，① 未上场。  
- **P3** 「另外 N 家」仍只在 `title`（既有，非本单）。

---

## Audit（Assessment B）

| 维 | 分 | 关键 |
|---|---:|---|
| Accessibility | 3 | 表有 `<caption class="ft-daily-sr">`；图无假 caption；未 `outline: none` |
| Performance | 3 | 无新字体、无内容图请求；表是静态 HTML |
| Theming | 4 | 复用 `--ft-line` / `--ft-elev` / `--ft-muted`；暗色 token 跟随壳 |
| Responsive | 3 | `minmax(0,1fr)` + `overflow-x:auto`；1280/390 无页壳横撑；390 表完整可读 |
| Implementation Integrity | 4 | 只读本卡字段；`verify:ia` 断言无页级槽、覆盖率 ≥90%、无 热度 |
| **合计** | **17/20** | **Good** |

### 数据诚实抽查（10-16 头条 / 大模型首条）

| 条 | 表内 | 能否在本卡核对 |
|---|---|---|
| `flux-3-image-klein` | 栏目 生图/生视频；标签 官方自报；独立来源 3；一手 是；主链 bfl.ai；权重跟踪 Klein 记交付 | 是（section 回填 / tags / sources×3 / 摘要原文） |
| `mai-base-2` | 栏目 大模型；标签 新闻；独立来源 1；一手 否；主链 x.com；MoE 约 80B | 是（摘要「MoE 约 80B」） |

未写入 heat、未出现的竞品对照、未算基准分。`openSourceFromCard` / 页级 `deliverableRows` **未**从 PR #14 搬入。

### 字段透传（对照产品盘点）

`origin/main` 的 `live_cards.mjs` **已经**导出 `tags[]`、`firstParty`、`enclosingSection` 回填（随 #11 日报上线，与盘点文「main 尚无」不一致）。本分支：

- 保留上述三者；`span.tag` 作 `【…】` 空时的回退。  
- 新增仅本卡的 `tablesHtml` / `cover`（今日全空，接线留给以后）。  
- **未**移植 PR #14 的 `sectionChart` / `rosterTable` / `leadCompareTable`。

`sources[]` 在去重后的 52 张卡上全非空；可见 lead+story 全有 ③，④ 未被迫上场。

---

## 验收对照

| 项 | 结果 |
|---|---|
| 每条 lead/story 摘要下有本条表或图 | 通过（③） |
| 不是页顶/右栏汇总三槽 | 通过 |
| 桌面 1280 / 手机 390 可读、不撑破 | 通过（见截图） |
| ≥90% 可见条目有 ①–④ | **100%**（13/13 当日；43/43 三期） |
| 无图不留灰框；无 *HOT | 通过 |
| `npm run build` / `verify:ia` | 通过 |
| 无图截图 | 不适用（0 条真实图 URL） |

---

## 截图

- `preview/daily/shots/daily-1280-lead.png` — 1280 头条要点表在 dek 与 chip 之间  
- `preview/daily/shots/daily-1280-story.png` — 1280 大模型两条故事各有小表  
- `preview/daily/shots/daily-390-lead.png` — 390 头条表+chip  
- `preview/daily/shots/daily-390-story.png` — 390 故事表+chip  

无配图样本，故无 image-path 截图。
