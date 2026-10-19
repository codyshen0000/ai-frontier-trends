# GAP · MIT 静态移植 vs aihot.news

档位：**L2 配图已接**（MIT 选图规则 + 构建期缩略图）。不是 L3/L4。不得宣称引擎 1:1。

| 项 | 状态 |
|----|------|
| 桌面 180px 侧栏 + 手机底栏（精选/热点/日报/我的） | 用了 MIT `Sidebar`/`TabBar`/`nav.ts` |
| 当前热点条（色阶排名、faces、热度、走势箭头） | 用了 MIT `HotTopics`/`Faces`；数字是 fixture |
| 按日时间线 + 精选卡（来源、评分、推荐理由、另外 N 家） | 用了 MIT `Timeline`/`FeedItem`；未接无限滚动 API |
| 热点 NO.01 hero + 02–03 runner + 04–10 + spark | 用了 MIT `routes/hot.tsx` Lead/Runner/Row/`Sparkline`；热度/涨跌/spark 为 fixture，曲线标「示例」 |
| 日报刊头、往期栏、文图并排故事 | 用了 MIT `ReportLayout`/`ReportPaper`/`Nameplate` |
| L2 封面 | `/hot/` 仅 NO.01、`/daily/` 仅头条。选图照搬 MIT `queryHotCovers` / `leadCover` / first image `coalesce(width,800)≥480`。构建期 `sharp` 写出 720/1200/1600。下载或缩放失败 → **无图状态**，不热链原图 |
| **产品批准偏离：依据 v4 拉伸/发糊属阻塞** | 封面忽略 SVG（mime/扩展名）；已知高度 &lt;240px 不用；`camo.githubusercontent.com` / shields.io 记入非正文图拒绝列表。未知宽度仍按 800 |
| 搜索 / 筛选 / 收藏 / 深色 / 下拉刷新 | 控件在，静态页无后端 |
| 48h 热度引擎 / 聚类 | **未做（L3）** |
| 采集管道 / Docker / Postgres | **未做（L4，K1 禁止）** |

诚实：热度指数、涨跌%、spark、AI 评分、推荐理由均来自 fixture JSON，不是生产 worker。源站对照截图只作为本地 artifact，不进仓库、不上线。
