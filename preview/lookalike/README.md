# 前沿趋势 · L1 lookalike（紧急静态预览）

对照 aihot.news 壳层观感的**本地纯静态**演示，站点名「前沿趋势」。无 AIHOT / MyHOT 品牌。fixture 数据，不起 Docker/Postgres。

## 本地预览

```bash
python3 -m http.server 8766 --directory /workspace/ops/l1-urgent/lookalike
```

- Base：http://127.0.0.1:8766/
- 精选：http://127.0.0.1:8766/index.html
- 热点：http://127.0.0.1:8766/hot.html
- 日报：http://127.0.0.1:8766/daily.html

（8765 已被占用，本预览实际跑在 8766。）

## 文件

| 路径 | 说明 |
|------|------|
| `index.html` | 精选：侧栏/底栏、当前热点条、按日时间线卡片 |
| `hot.html` | 热点：NO.01 hero + 02–03 + 04–10 |
| `daily.html` | 日报：刊头 + 往期栏 + 文图并排故事 |
| `css/site.css` | 设计 token / 壳层 / 卡片（对齐 MIT `app.css` 语义色） |
| `data/fixture.json` | mock 榜单 |
| `shots/` | 无头截图（若已生成） |

## 与 aihot.news 差多少（诚实）

| 项 | 状态 |
|----|------|
| IA：精选 / 热点 / 日报 + 桌面侧栏 + 手机底栏 | 接近 |
| 色板 / 圆角 / 暖纸底 / 强调青 | 接近（抄 MIT token） |
| 当前热点条 + 日时间线卡片密度 | 结构接近；动效/未读/真实头像弱 |
| 热点 NO.01–10 布局 | 结构接近；**无真实 48h 热度/涨跌/spark**（用「独立来源 N」） |
| 日报刊头 + 文图并排 | 结构接近；图为 SVG 示意，非真说明性配图 |
| 搜索 / 主题 / 收藏 / 深色 / 下拉刷新 | 未做或仅占位 |
| 管道 / 聚类 / 实时数据 | **未做**（K1：管道后补） |

**档位：L1 partial（壳像、可点）· 非 L2/L3/L4。**

## 硬禁自检

- 全文无 `AIHOT` / `MyHOT` 字符串（站点名「前沿趋势」）
- 未改 github 仓；未启 Docker/Postgres

## 截图

- `shots/home-1280.png` 精选桌面
- `shots/hot-1280.png` 热点桌面
- `shots/daily-1280.png` 日报桌面
- `shots/home-390.png` 精选手机
