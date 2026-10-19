# GAP · MIT 静态移植 vs aihot.news

档位：**L2 配图已接（v5 有用才放）+ 热点卡文案（v5.1 story-digest）**。不是 L3/L4。不得宣称引擎 1:1。

| 项 | 状态 |
|----|------|
| 桌面 180px 侧栏 + 手机底栏（精选/热点/日报/我的） | 用了 MIT `Sidebar`/`TabBar`/`nav.ts` |
| 当前热点条（色阶排名、faces、热度、走势箭头） | 用了 MIT `HotTopics`/`Faces`；数字是 fixture |
| 按日时间线 + 精选卡（来源、评分、推荐理由、另外 N 家） | 用了 MIT `Timeline`/`FeedItem`；未接无限滚动 API |
| 热点 NO.01 hero + 02–03 runner + 04–10 + spark | 用了 MIT `routes/hot.tsx` Lead/Runner/Row/`Sparkline`；热度/涨跌/spark 为 fixture，曲线标「示例」 |
| 日报刊头、往期栏、文图并排故事 | 用了 MIT `ReportLayout`/`ReportPaper`/`Nameplate` |
| L2 封面（v5） | `/hot/` 仅 NO.01、`/daily/` 仅头条。MIT 借用顺序之后走**价值门**；无用图 → 无图。废除「第一张 ≥480 自动挂」。构建期 `sharp` 写出 720/1200/1600 webp。下载/缩放失败 → **无图**，不热链。无图时**不**把 sparkline 填进封面槽 |
| L2 文案（v5.1） | 热点卡与日报头条用 `title` + `digest`（可选 `latest_progress`）。自洽标题、答案前置、事实展开；**禁止**内部元话语进入 fixture/正文 |
| 产品偏离 | 跳过 SVG、已知高度 &lt;240、明显 Logo/徽章 URL；未知宽度仅在价值门通过后按 800 计是否 ≥480 |
| 搜索 / 筛选 / 收藏 / 深色 / 下拉刷新 | 控件在，静态页无后端 |
| 48h 热度引擎 / 聚类 | **未做（L3）** |
| 采集管道 / Docker / Postgres | **未做（L4，K1 禁止）** |

诚实：热度指数、涨跌%、spark、AI 评分、推荐理由均来自 fixture JSON，不是生产 worker。
