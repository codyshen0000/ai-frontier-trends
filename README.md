# AI前沿趋势

公开静态站：实时热点看板、趋势时间线、升级/推翻信号表、待交付权重追踪、FLUX 3 提示词速查表 / 官方示例库 / 相机术语表。

站点地址：<https://codyshen0000.github.io/ai-frontier-trends/>

实时热点看板：<https://codyshen0000.github.io/ai-frontier-trends/live/>

趋势时间线（结论置顶 + 谱系图）：<https://codyshen0000.github.io/ai-frontier-trends/timeline/>

FLUX 3 四页：

- 速查表：<https://codyshen0000.github.io/ai-frontier-trends/flux3/>
- 官方案例：<https://codyshen0000.github.io/ai-frontier-trends/flux3/cases/>
- 官方示例库：<https://codyshen0000.github.io/ai-frontier-trends/flux3/examples/>
- 相机术语表：<https://codyshen0000.github.io/ai-frontier-trends/flux3/camera-terms/>

视觉语言跟个人主页同一套 [共享设计系统](https://github.com/codyshen0000/codyshen0000.github.io/blob/main/DESIGN.md)（`ds.css`）。站点页用 `ds-page` / `ds-nav` / `ds-hero` / `ds-card` / `ds-prose` / `ds-footer`；浅色/深色由 `ds.css` 的 `data-theme` 与 `prefers-color-scheme` 处理。

## 本地

```bash
npm install
npm run build:public
npm run preview
```

`PUBLIC_DEPLOY=1` 或 `npm run build:public` 会按 `site.config.json` 的 `privatePages` 排除不公开页面。本仓库只收录公开内容。

预览默认在 `http://127.0.0.1:4173/`。若要模拟 GitHub Pages 子路径：

```bash
SITE_BASE=/ai-frontier-trends npm run preview
```

## 部署

推送到 `main` 后，GitHub Actions 会构建公开站点并发布到 GitHub Pages。

## 刷新 /live/ 与其它 htmlFile 页

`site.config.json` 里带 `htmlFile` 的页面（目前是 `content/live.html` → `/live/`、`content/timeline.html` → `/timeline/`）由另一台机器上的脚本每隔约 30 分钟整份覆盖，并通过 GitHub contents API 推送。这些文件是自包含单页，**不要改它们的内部 markup**，也不要把站点模板拆进去。

构建器仍然按 `htmlFile` **拷贝**源文件，然后**幂等地注入**一层站点皮肤（已注入则跳过，不会叠两份）：

1. 在 `</head>` 前插入  
   `<link rel="stylesheet" href="https://codyshen0000.github.io/assets/ds.css">`  
   以及相对路径的 `assets/skin-raw.css`（只调和字体、背景、强调色、圆角、链接色；不改图表/控件几何）。
2. 在 `<body>` 后插入一条 `ds-nav` 磨砂顶栏（含「个人主页」「看板 Studio」和本站各页），以及一小段主题/移动菜单脚本。

因此未来只要在 `site.config.json` 增加新的 `htmlFile` 页，就会自动带上同一套导航和皮肤，无需改源 HTML。

脚本插入的 `← 返回首页` 必须保留在固定锚点 `#back-home`（指向 `../`）。注入的导航在视觉上取代它；`#back-home` 仍留在 DOM 里，链接继续可用。

发布前检查：不要包含本机路径（`/workspace`、`/cursor/`、`/home/box`）、百度链接、token，或私有「收藏」内容。
