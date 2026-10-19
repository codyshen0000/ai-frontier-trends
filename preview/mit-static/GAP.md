# GAP · MIT 静态移植 vs aihot.news

档位：**L1 壳层接近（源码移植）**。不是 L2/L3/L4。不得宣称引擎 1:1。

| 项 | 状态 |
|----|------|
| 桌面 180px 侧栏 + 手机底栏（精选/热点/日报/我的） | 用了 MIT `Sidebar`/`TabBar`/`nav.ts` |
| 当前热点条（色阶排名、faces、热度、走势箭头） | 用了 MIT `HotTopics`/`Faces`；数字是 fixture |
| 按日时间线 + 精选卡（来源、评分、推荐理由、另外 N 家） | 用了 MIT `Timeline`/`FeedItem`；未接无限滚动 API |
| 热点 NO.01 hero + 02–03 runner + 04–10 + spark | 用了 MIT `routes/hot.tsx` Lead/Runner/Row/`Sparkline`；热度/涨跌/spark 为 fixture |
| 日报刊头、往期栏、文图并排故事 | 用了 MIT `ReportLayout`/`ReportPaper`/`Nameplate`；**无 L2 说明性真图**（cover=null） |
| 搜索 / 筛选 / 收藏 / 深色 / 下拉刷新 | 控件在，静态页无后端 |
| 48h 热度引擎 / 聚类 | **未做（L3）** |
| 采集管道 / Docker / Postgres | **未做（L4，K1 禁止）** |

诚实：热度指数、涨跌%、spark、AI 评分、推荐理由默认来自 fixture JSON，不是生产 worker。`data/engine/` 若有契约 JSON（见 `data/engine/CONTRACT.md`），预渲染改用导出切片；仍不是采集管道或 48h 实算。
