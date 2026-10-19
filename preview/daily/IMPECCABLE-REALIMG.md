# 前沿趋势日报 · Impeccable 自审（Tasks #6 源站真图）

目标：在已上线暖纸 `/daily/` 的头条与 `ft-daily-story` 下挂 **有价值源站真图**（演示 / 对比 / 评测图 / 架构 / 「发布了什么」主视觉）。  
对照：Cody 正例（热点卡旁 Arena/榜单条形图）；源站例 [BFL Flux 3](https://bfl.ai/blog/flux-3-image-klein)。  
明确不做：PR #14 汇总三槽、PR #15 字段小表、Logo/头像/无关 OG 凑覆盖率、AIHOT/MyHOT 品牌。

**开发自审结论：有条件通过（可交产品终审 + Cody）。**  
- 选图质量门通过：挂上的图能说明该条在做什么（评测图、对照表、架构/结果图、产品发布主视觉）。无 Logo 墙、无字段表。  
- 覆盖率 **9/13 = 69%**，略低于 ≥70%。失败 4 条均为诚实降级（趋势页无媒体、Nemotron 片头字标过小、两条小红书无说明性图），**未**用不合格图或元数据表凑数。须产品/Cody 再议是否放行。

---

## Critique（Assessment A）

**设计特异性：通过。** 图挂在该条目摘要下（头条桌面为文+图并排，对标 AIHOT 卡+说明图结构，未抄品牌）。不是刊头汇总，也不是栏目/标签小表。

### Nielsen（0–4）

| # | 启发 | 分 | 注 |
|---|---|---:|---|
| 1 | 系统状态可见 | 3 | 有图则 figure；无合用图整块省略，无「暂无配图」 |
| 2 | 符合现实 | 4 | 图来自主链/推文媒体/论文 HTML，可回溯 |
| 3 | 用户控制 | 3 | `onerror` 隐藏整 figure；外链仍在 chip |
| 4 | 一致性 | 4 | 暖纸边框/圆角/单色 teal；与日报壳一致 |
| 5 | 防错 | 4 | 价值门拒绝 Logo/data URI/站点默认 OG |
| 6 | 再认而非回忆 | 3 | 评测图/对照表让人一眼知道「发了什么、怎么比」 |
| 7 | 灵活高效 | 3 | lazy-load；桌面 max-height 280 |
| 8 | 美观克制 | 4 | 无多色渐变 CTA；无 *HOT |
| 9 | 纠错 | 3 | 坏链隐藏 figure，不回退字段表 |
| 10 | 帮助 | 2 | caption 仅源 host |

### 优势

1. 头条 Flux 3 挂 Elo 评测图，体感接近 Cody 正例。  
2. Muse Spark 挂多模型评测表；Liquid d1-ultra 挂对照点图。  
3. 无合用图的条目留白，没有硬塞感。

### 残留（非阻塞）

- **P2** 覆盖率 69% < 70%，取决于源站（X trending / 小红书 / 字标片头）。  
- **P2** 部分 X 条目是发布海报（Kling 4.0），合格为「发布了什么」主视觉，但信息密度低于评测图。  
- **P3** 论文条目可能叠真实 `<table>`，窄屏需横滑。

---

## Audit（Assessment B）

| 维 | 分 | 关键 |
|---|---:|---|
| Accessibility | 3 | figure+alt；onerror 隐藏；未加灰骨架 |
| Performance | 3 | 构建期解析+缓存；img lazy；远程热链 |
| Theming | 4 | 沿用 `--ft-line` / `--ft-r-8` / 暖纸 |
| Responsive | 3 | 1280 头条文图并排；960 以下单列；390 可读 |
| Implementation Integrity | 4 | 无字段表；无 PR14 槽；无 AIHOT/MyHOT 名 |
| **合计** | **17/20** | **Good**（覆盖率须 Cody 点头） |

---

## web-design-guidelines 要点

- 无合用图时不输出 viz，避免空 figure 噪音。  
- 图片 `object-fit: contain`，不裁切评测轴标签。  
- `prefers-reduced-motion` 仍关掉日报过渡（既有规则）。  
- caption 不编造说明文，只写源 host。

---

## 产品门禁对照

| 项 | 结果 |
|---|---|
| 每条 lead/story 尝试解析 + 价值筛选 | 通过 |
| 挂图能让人看出这条在讲什么 | 通过（抽样见 `COVERAGE-REALIMG.md`） |
| 无 Logo/头像/无关 OG 充数 | 通过（小红书 Logo、Nemotron 字标已拒） |
| 无字段元数据表 / 无 PR14 三槽 | 通过 |
| 空态省略 | 通过 |
| 1280 / 390 不撑破页壳 | 通过（截图） |
| ≥70% 有价值真图 | **未达（69%）** · 诚实列出失败 `data-id` |
| `npm run build` / `verify:ia` | 通过 |
| 无 *HOT | 通过 |

**结论：质量门通过，覆盖率差 1 条（9/13）。等待产品 Impeccable 终审 + Cody；勿 merge。**
