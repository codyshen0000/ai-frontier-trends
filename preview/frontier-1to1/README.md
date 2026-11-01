# frontier-1to1 组图壳

给后续截图用的薄样本，不是生产数据。

- `hot.html` — G2 Top 10 + G11「当前热度」/ 15 分钟重算文案 + G7 无图时诚实留空
- `index.html` — G6 精选卡「AI 评分」层
- `leaderboard.html` / `agent.html` / `changelog.html` / `feedback.html` — G9 竞品主 IA 静态占位（品牌「前沿趋势」）

本地打开即可，样式复用 `../lookalike/css/site.css`。

站点路由（合入并构建后才出现在 dist，本预览壳可先看）：`/leaderboard/` `/agent/` `/changelog/` `/feedback/`。`/about/` 仍走原来的 ds-wrap 关于页。

G8 TODO：引擎事件已有 `/story/{id}/`；竞品式聚簇故事深页本窗不做。
