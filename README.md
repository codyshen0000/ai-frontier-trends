# AI前沿趋势

每天追踪 AI 生成、蒸馏与后训练的公开变化，先给结论。

站点地址：<https://codyshen0000.github.io/ai-frontier-trends/>

- 今日：<https://codyshen0000.github.io/ai-frontier-trends/live/>
- 趋势时间线：<https://codyshen0000.github.io/ai-frontier-trends/timeline/>
- 专题 FLUX 3：<https://codyshen0000.github.io/ai-frontier-trends/flux3/>
- 关于：<https://codyshen0000.github.io/ai-frontier-trends/about/>

导航只有四项：今日、趋势（信号表 / 权重追踪为栏目内二级）、专题、关于。FLUX 3 的速查表、官方案例、示例库、相机术语仍走原来的 URL，顶上用同一组分段控件切换。

视觉语言跟个人主页同一套 [共享设计系统](https://github.com/codyshen0000/codyshen0000.github.io/blob/main/DESIGN.md)（`ds.css`）。

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
- 本周主线：`content/timeline.html` 的「主线 N」标题和「一句话结论」。状态芯片（加强 / 持平 / 待验证）只根据标题里的「待观察」和最近一次「变更」列表里的用词（加固、补证据、下调、等级不变等）映射。解析失败则退回 `site.config.json` 的 `threadsFallback`。

## 刷新 /live/ 与其它 htmlFile 页

`site.config.json` 里带 `htmlFile` 的页面（目前是 `content/live.html` → `/live/`、`content/timeline.html` → `/timeline/`）由另一台机器上的脚本每隔约 30 分钟整份覆盖，并通过 GitHub contents API 推送。这些文件是自包含单页，**不要改它们的内部 markup**，也不要把站点模板拆进去。

构建器仍然按 `htmlFile` **拷贝**源文件，然后**幂等地注入**一层站点皮肤（先去掉旧注入再写入同一套标记，跑两次结果相同）：

1. 在 `</head>` 前插入  
   `<link rel="stylesheet" href="https://codyshen0000.github.io/assets/ds.css">`  
   以及相对路径的 `assets/skin-raw.css`（只调和字体、背景、强调色、圆角、链接色；不改图表/控件几何）。
2. 在 `<body>` 后插入一条 `ds-nav` 磨砂顶栏（今日 / 趋势 / 专题 / 关于，右侧个人主页、看板 Studio、主题切换），以及一小段主题/移动菜单脚本。
3. `/timeline/` 的输出会给「主线 N」标题补上 `id="thread-N"`，方便首页卡片跳转；源文件不动。

脚本插入的 `← 返回首页` 必须保留在固定锚点 `#back-home`（指向 `../`）。注入的导航在视觉上取代它；`#back-home` 仍留在 DOM 里，链接继续可用。

发布前检查：不要包含本机路径（`/workspace`、`/cursor/`、`/home/box`）、百度链接、token，或私有「收藏」内容。
