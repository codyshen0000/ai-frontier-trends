# 静态预览快照（非生产）

给 Cody 验收用的自包含静态包。

**现行预览（v5.1）：** `preview/mit-static/`（热点 / 日报 / 精选）。  
`preview/hot/`、`preview/daily/`、`preview/live/` 是 Tasks #6 之前的旧壳，页顶标「旧版·已作废」，文案未走 story-digest，不要当现行验收。

**jsDelivr 的 `.html` 是 `text/plain` + nosniff，Chrome 只显示源码，不要把 HTML 预览链指过去。** CSS/JS 的 MIME 正常。可渲染页用各目录 `standalone.html`（绝对 jsDelivr `.css`/`.js`），给 htmlpreview 等会按 HTML 渲染的代理用。

可点击 HTML（GitHub Pages，合入后）：

- 精选：`https://codyshen0000.github.io/ai-frontier-trends/live/`
- 热点：`https://codyshen0000.github.io/ai-frontier-trends/hot/`
- 日报：`https://codyshen0000.github.io/ai-frontier-trends/daily/`
- 本目录 `live/standalone.html`、`hot/standalone.html`、`daily/standalone.html`

Impeccable 门禁（markdown，jsDelivr 可用）：

- `preview/daily/IMPECCABLE.md`
- `preview/daily/CRITIQUE.md`（旧自评）

相对资源：`assets/ds.css`、`assets/skin-raw.css`、`styles.css`、`theme.js`。品牌文案是「前沿趋势 / 前沿热点看板」，没有 `*HOT` 产品名。
