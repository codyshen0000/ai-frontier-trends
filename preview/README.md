# 静态预览快照（非生产）

给 Cody 验收用的自包含静态包：精选 `/live/`、日报 `/daily/`、热点 `/hot/`、更多 `/more/`，以及皮肤 CSS/JS。

**jsDelivr 的 `.html` 是 `text/plain` + nosniff，Chrome 只显示源码，不要把 HTML 预览链指过去。** CSS/JS 的 MIME 正常，日报可渲染页用 `standalone.html`（绝对 jsDelivr `.css`/`.js`）。

可点击 HTML（GitHub Pages，合 staging 预览 PR 后）：

- 日报：`https://codyshen0000.github.io/ai-frontier-trends/daily/`
- 本目录 `daily/standalone.html`：给 htmlpreview 等会按 HTML 渲染的代理用，样式走 jsDelivr。

Impeccable 门禁（markdown，jsDelivr 可用）：

- `preview/daily/IMPECCABLE.md`
- `preview/daily/IMPECCABLE-VIZ.md`（Tasks #6 图/表返工自审）
- `preview/daily/CRITIQUE.md`（旧自评）

相对资源：`assets/ds.css`、`assets/skin-raw.css`、`styles.css`、`theme.js`。品牌文案是「前沿趋势 / 前沿热点看板」，没有 `*HOT` 产品名。
