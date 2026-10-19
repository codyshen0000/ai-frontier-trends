# L2 封面 v5 · 开发自审（Huashu ≥7.0 · anti-slop · Impeccable）

目标：MIT 静态壳 `/hot/` `/daily/` 的封面槽执行 **有用才放，没有就不放**。  
本地：`http://127.0.0.1:4173/hot/` · `/daily/` · 1280×800 / 390×844  
品牌：**前沿趋势**。无 AIHOT / MyHOT。

**开发自审结论：通过（交测试审校）。** 无 P0。产品未签字，本 PR 保持 draft。

---

## Critique（Assessment A）

**设计特异性：通过。** 热点仍是 NO.01 大卡 + 编号列表；日报仍是刊头 + 头条。封面只出现在源码规定的两个槽；无图时槽空着，热度曲线留在原来的热度控件位。

### Nielsen（0–4）

| # | 启发 | 分 | 注 |
|---|---|---:|---|
| 1 | 系统状态可见 | 3 | 更新时间、NO.01、热度指数；spark 标「示例」（L3 未过） |
| 2 | 符合现实 | 4 | 无用图不放；不拿 sparkline / OG / Logo 充封面 |
| 3 | 用户控制 | 3 | skip link；封面无独立 lightbox（与 MIT 壳一致） |
| 4 | 一致性 | 4 | 与精选同壳；封面 `object-cover` + width/height |
| 5 | 防错 | 4 | 失败无热链、无破图；空槽无「暂无配图」剧场 |
| 6 | 再认而非回忆 | 3 | NO.01 / 头条位置不变 |
| 7 | 灵活高效 | 3 | 有图 srcSet 720/1200/1600；浏览器只拉一档 |
| 8 | 美观克制 | 4 | 暖纸、单色 teal、无渐变 CTA |
| 9 | 纠错 | 3 | 图加载失败由构建期直接变成无图 |
| 10 | 帮助 | 3 | 页末热度算法说明；封面分类表在交件里 |

**概念：过关。** 1280 首屏：有图时封面在 MIT 封面位；无图时文字 + 底部热度区，不出现大块热度面板顶替封面。

### 优势

1. 价值门可解释；拿不准默认空。  
2. 空态诚实，不把 L3 曲线搬进封面槽。  
3. 已挂封面能归入样张/论文图/产品截图/解说图。

### 残留（非阻塞）

- **P2** spark 数值仍是 fixture（L3）。  
- **P2** 无图样例页 `hot-empty.html` / `daily-empty.html` 只在 preview，不进正式 `/hot/` `/daily/` 路由。  
- **P3** 封面 `alt=""` 跟 MIT 壳（图是装饰性封面位）；分类理由写在交件表。

---

## Audit（Assessment B）

| 维 | 分 | 关键 |
|---|---:|---|
| Accessibility | 3 | skip、`h1`/`h2`、封面 `alt=""`、focus-visible、spark `aria-label` |
| Performance | 3 | 本地 webp srcSet；LCP preload；无热链 |
| Theming | 4 | 暖纸 `#faf9f6`；暗色 cyan token 未改 |
| Responsive | 3 | 390 头条先标题后图（日报）；热点封面 `order-first` 小屏在上 |
| Implementation Integrity | 4 | 仅两槽出图；NO.02 起无封面；价值门单测；无 *HOT |
| **合计** | **17/20** | **Good** |

---

## Huashu ≥7.0

版式仍是 MIT Lead / FrontPage，不是新发明的卡片墙。有图时图在规定封面位且带宽高；无图时不补灰骨架、不补字段表。评分自估 **7.5**（信息密度与源码壳一致，空态克制）。

## anti-slop

- 不从库存/AI 生图补洞。  
- 不把 badges、OG、Logo、Unsplash 当英雄图。  
- 不把 sparkline 放大进封面槽。  
- 文案品牌只有「前沿趋势」。

## WEB-UI / Impeccable 要点

- skip link、`main` landmark 仍在。  
- 封面 `width`/`height` + `aspect-ratio` 类，避免 CLS。  
- hover 缩放 200ms。  
- `prefers-reduced-motion` 仍走 MIT 壳既有规则。  
- 触摸目标：底栏未改。

---

## 产品门禁对照（v5 §4 A）

| 项 | 结果 |
|---|---|
| `/hot/` 仅 NO.01 可能有封面 | 通过（`verify:ia` 至多 1 张 `assets/covers`） |
| `/daily/` 仅头条可能有封面 | 通过 |
| 已挂封面 ∈ 有用类 | 通过：FLUX 3 Image Klein 模型样张拼贴 |
| 无封面槽不是 sparkline 顶上 | 通过：Lead 不再渲染 HeatPanel |
| 无热链 | 通过；失败直接无图 |
| 无拉伸模糊（待截图） | 构建 `fit:inside` + withoutEnlargement；1280/~390 截图见本目录 |

`npm run test:covers` · `npm run build` · `npm run build:public` · `npm run verify:ia` 通过。
