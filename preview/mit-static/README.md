# 前沿趋势 · MIT 源码静态移植

主线预览（对照 `preview/lookalike/`）。从上游 MIT `apps/web` + `site` + `packages/contracts` 移植壳层，fixture 填数据，Vite 预渲染三页 HTML。

- 精选：`index.html`
- 热点：`hot.html`
- 日报：`daily.html`

品牌为「前沿趋势」。无 Docker / Postgres。热度为 fixture，不是 48h 实算。

本地：`python3 -m http.server 8767 --directory preview/mit-static`

复用清单见 `REUSED-SOURCES.md`。差距见 `GAP.md`。
