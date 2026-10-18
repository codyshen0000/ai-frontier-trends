# 前沿趋势

每天追踪 AI 生成、蒸馏与后训练的公开变化，先给结论。

站点地址：<https://codyshen0000.github.io/ai-frontier-trends/>

- 精选：<https://codyshen0000.github.io/ai-frontier-trends/live/>
- 日报：<https://codyshen0000.github.io/ai-frontier-trends/daily/>
- 热点榜：<https://codyshen0000.github.io/ai-frontier-trends/hot/>
- 趋势时间线：<https://codyshen0000.github.io/ai-frontier-trends/timeline/>
- 周报：<https://codyshen0000.github.io/ai-frontier-trends/weekly/>
- 2026-10-12 周报：<https://codyshen0000.github.io/ai-frontier-trends/weekly/2026-10-12/>
- 更多：<https://codyshen0000.github.io/ai-frontier-trends/more/>
- 专题 FLUX 3：<https://codyshen0000.github.io/ai-frontier-trends/flux3/>
- 关于：<https://codyshen0000.github.io/ai-frontier-trends/about/>

导航四项：**精选 / 热点 / 趋势 / 更多**。桌面是左侧栏；宽度小于 961px 时换成底栏，并加上 **日报**（精选 / 热点 / 日报 / 趋势 / 更多）。品牌文案是「前沿趋势 / 前沿热点看板」，不用任何 `*HOT` 产品名。桌面侧栏「成刊」下另挂 **日报** → `/daily/`。

- **精选**（`/live/`）：顶置「当前热点」+ 按日精选卡片流。
- **日报**（`/daily/`）：从同一批 live 卡片按存档日生成的报纸版（刊头、月历、统计条、头条与栏目）。不改 `content/live.html`。
- **热点**（`/hot/`）：存档窗内按独立来源数排序，不用点赞当热度。
- **趋势**（`/timeline/`）：本周主线、时间线修订史；周报 / 信号表 / 权重追踪仍是栏目内二级。
- **更多**：Studio、信号、权重、专题、关于、个人主页。Studio 不占首页。

研究主页 `/` 仍是结论先行的主线页。FLUX 3 的速查表、官方案例、示例库、相机术语仍走原来的 URL，页内用同一组分段控件切换。

新的一周放到 `content/weekly/YYYY-MM-DD/`：`report.html`（单页周报）、`report.md`、`timeline.md`，可选 `meta.json` 和 `charts/`。构建时会生成 `/weekly/` 列表和 `/weekly/YYYY-MM-DD/`。

视觉：共享 [设计系统](https://github.com/codyshen0000/codyshen0000.github.io/blob/main/DESIGN.md)（`ds.css`）之上，趋势子站覆盖暖纸阅读 token。对照见 [`docs/reading-tokens.md`](docs/reading-tokens.md)。

## 本地

```bash
npm install
npm run build:public
npm run verify:ia
npm run preview
```

`PUBLIC_DEPLOY=1` 或 `npm run build:public` 会按 `site.config.json` 的 `privatePages` 排除不公开页面。本仓库只收录公开内容。

预览默认在 `http://127.0.0.1:4173/`。若要模拟 GitHub Pages 子路径：

```bash
SITE_BASE=/ai-frontier-trends npm run preview
```

## 首页怎么自动填

构建时从现有文件抽句子，不另写事实：

- 今天的一句话：`content/live.html` 的 `<meta name="description">`；更新时间取正文里的「构建于 …」。
- 本周主线：`content/timeline.html` 的「主线 N」标题和「一句话结论」（标签后可带「（日期 周报版）」这类括号，抽取冒号后的结论句）。状态芯片（加强 / 持平 / 待验证）根据标题里的「待观察」和各次「变更」列表用词映射（加固 / 补证据 / 升级 → 加强，下调 / 等级不变 → 持平）。后一次覆盖前一次；没有用词的行保持原状态。同一条里分句写出的「等级不变」仍算到该主线。解析失败则退回 `site.config.json` 的 `threadsFallback`。

## 刷新 /live/ 与其它 htmlFile 页

`site.config.json` 里带 `htmlFile` 的页面（目前是 `content/live.html` → `/live/`、`content/timeline.html` → `/timeline/`）由另一台机器上的脚本每隔约 30 分钟整份覆盖，并通过 GitHub contents API 推送。这些文件是自包含单页，**不要改它们的内部 markup**，也不要把站点模板拆进去。

构建器仍然按 `htmlFile` **拷贝**源文件，然后**幂等地注入**一层站点皮肤（先去掉旧注入再写入同一套标记，跑两次结果相同）：

1. 在 `</head>` 前插入  
   `<link rel="stylesheet" href="https://codyshen0000.github.io/assets/ds.css">`  
   以及相对路径的 `assets/skin-raw.css`（暖纸 token、侧栏/底栏、字体与强调色；并在注入后把阅读栏水平居中加回去：周报/时间线走 `body` 栏，`/live/` 走源文件自己的 `main{max-width:1000px;margin:0 auto}`。不改图表/控件几何，也不改这些源 HTML）。
2. 在 `<body>` 后插入阅读站壳层：左侧栏 + 手机顶栏/底栏（精选 / 热点 / 日报 / 趋势 / 更多）和主题脚本。
3. `/live/` 额外跑一遍幂等的精选变换（`scripts/live_curate.mjs`）：从 `article.card[data-id][data-day]` 抽出标题、中文摘要、来源、日期，生成顶置「当前热点」和按日精选流；原文（Hub / 主线表 / 待交付 / 过滤器）包进 `#board` 档案，不删。`/live/#board` 仍可看原始看板。
4. `/timeline/` 的输出会给「主线 N」标题补上 `id="thread-N"`，方便首页卡片跳转；源文件不动。
5. `/hot/`、`/more/`、`/daily/` 由构建器生成，不写进被同步覆盖的 `live.html`。`/daily/` 用 `scripts/daily_page.mjs` 按存档日分组，统计条只从卡片来源数、【官方自报】和「大模型」栏目推导。

脚本插入的 `← 返回首页` 必须保留在固定锚点 `#back-home`（指向 `../`）。注入的导航在视觉上取代它；`#back-home` 仍留在 DOM 里，链接继续可用。

### 同步脚本若要原生输出精选形

外部生成器可以继续输出当前 `live.html` 形（`article.card` + `data-day` + `h3` + 摘要 `p` + `.meta` 来源链接）。构建期变换会映射成精选首页。

若生成器日后直接出精选 markup，建议：

- 卡片：`[data-ft-card][data-id][data-day]`，内含标题、中文摘要、来源链接、时间。
- 热度只暴露独立来源数，不要写可刷的赞数当主序。
- 仍保留 `#back-home`。
- 不要写入 AIHOT / MyHOT 名称或 Logo。

构建变换按注释哨兵拆装，重复注入结果相同。

发布前检查：不要包含本机路径（`/workspace`、`/cursor/`、`/home/box`）、百度链接、token，或私有「收藏」内容。
