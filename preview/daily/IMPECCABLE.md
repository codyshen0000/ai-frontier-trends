# 前沿趋势日报 · Impeccable 自审（Tasks #6 UI 门禁）

目标：`/daily/`（`scripts/daily_page.mjs` + `src/skin-raw.css` 日报段 + 壳层 token）  
本地：`http://127.0.0.1:4173/daily/` · 1280×800 / 390×844 实测  
对照：aihot `/daily` 版式节奏；自有品牌「前沿趋势日报 / 前沿热点看板」  
Assessment A / B 分派独立子代理后在此综合。`npx impeccable detect` 文件模式有纸面误判（把 `html` 当纯黑），以浏览器实测为准。

**开发自审结论：通过（可交产品终审）。** 无 P0。自审中发现的 P1（7px 日历点、页内 hash 打回最新期）已在本轮修掉。

---

## Critique（Assessment A）

**设计特异性：通过。** 这是一份中文报纸，不是精选卡片流，也不是热点榜。刊头「日报」+ 期号日期卡 + 左往期 + 统计条 + 头条，和 `/live/` `/hot/` 同壳不同物。

### Nielsen（0–4）

| # | 启发 | 分 | 注 |
|---|---|---:|---|
| 1 | 系统状态可见 | 3 | 往期当前、日历今日点、成刊 `aria-current`；月报灰显 |
| 2 | 符合现实 | 4 | 头条 / 往期 / 一手 / 本期版面 / （本期完） |
| 3 | 用户控制 | 3 | 桌面往期 + 日历 + 前一日；外链新窗口 |
| 4 | 一致性 | 4 | 与 live/hot 同暖纸 token；日报内部是报刊栅格 |
| 5 | 防错 | 3 | 月报是 `span` 不是假链；未知 hash 回退最新期 |
| 6 | 再认而非回忆 | 3 | 本期版面索引；日历点无日期数字（大号日期承担） |
| 7 | 灵活高效 | 3 | 版面锚点、hash 换期、阅读时长 |
| 8 | 美观克制 | 4 | `#faf9f6`、白卡 hairline、无衬线、单色 teal |
| 9 | 纠错 | 3 | 空日后退；月报原因在 `title` |
| 10 | 帮助 | 2 | 有 colophon；无「怎么读这份报」 |

**概念：过关。** 1280×800 首屏含刊头、日期卡、统计条、头条摘要、来源 chip、今日看点/本期版面，不空不散。

### 优势

1. 自有刊头，无 *HOT。  
2. 报纸 IA 完整且由 live 卡片生成，不是空壳。  
3. 与精选/热点同一阅读站，但内部不是那两页的换皮。

### 残留（非阻塞）

- **P2** 「另外 N 家」只在 `title`，点不开名单。  
- **P2** 头条「原文」与主来源同 URL（对标 aihot 结构，略冗余）。  
- **P3** 右栏标题在窄列会折行；单条栏目会留下空列。  
- **P3** 暗色壳层强调是 cyan（`docs/reading-tokens.md` 既定），浅色日报是 teal。

---

## Audit（Assessment B）

| 维 | 分 | 关键 |
|---|---:|---|
| Accessibility | 3 | skip、landmark、标题序、`aria-current`、focus-visible、减动、muted 5.15:1；日历点 22px 命中（手机 16px） |
| Performance | 3 | 无 Google 字体、无内容图；hash 脚本很小；共用页仍内联无用 CHART_CSS |
| Theming | 4 | 日报不再覆盖 E-Ink；暗色 token 存在 |
| Responsive | 3 | 960 断点；底栏 4 项含日报且当前高亮；手机藏往期、日历+邻日等价可达 |
| Implementation Integrity | 3 | `#d-` 换期；`#s-`/`#c-` 会留在所属存档日（已修） |
| **合计** | **16/20** | **Good** |

修掉的 P1：

1. 日历可点区域从 7px 提到 22px（手机 16px），并补 `aria-label`。  
2. `SWITCH_JS`：非 `#d-` 的页内 hash 通过 `closest([data-ft-issue])` 留在当期。

---

## web-design-guidelines 要点

- 有 skip link、`main`、侧栏/底栏 landmark；图标 `aria-hidden`。  
- 日报当前项 `aria-current="page"`；往期/日历今日 `aria-current="true"`。  
- `:focus-visible` 2px teal；未对交互元素 `outline: none`。  
- `prefers-reduced-motion` 关掉日报过渡。  
- 标题 `text-wrap: balance`；数字 `tabular-nums`。  
- 月报不可用为 `span.is-off`，不是死链。  
- 底栏 `touch-action: manipulation`、`min-width: 44px`。  
- `color-scheme` 随 `data-theme`。  
- 已知：`.ft-brand` 未单独写 focus 环（走浏览器默认）；主题钮 36px；共用 lightbox 空 `img`。

---

## 与 aihot `/daily` 取舍（≤10）

1. 品牌是「前沿趋势日报」，不写 AI日报 / 第180期 / AIHOT。  
2. 统计条用自有口径（大事 / 来源 / 一手 / 新模型），不是上游管道字段。  
3. 头条不放评测大表（看板没有可靠表数据）。  
4. 右栏是「今日看点 / 本期版面」，不是 aihot 的旁路新闻模块。  
5. 栏目名用大模型 / 生图视频 / 产品和工具 / 研究论文。  
6. 手机底栏 4 项（精选 / 热点 / 日报 / 更多）；时间线收进「更多」。  
7. 往期只有当前 live 存档日（现 3 天），按月分组但没有多年折叠。  
8. 月报结构在、数据无则灰显；周报链到现有 `/weekly/`。  
9. 暗色强调走整站 cyan token，不给日报单独配暗红。  
10. 手机藏左往期，用刊头日历（加大点击）+ 文末邻日，对标 aihot 窄屏而不是复制其品牌日历。

---

## 产品门禁对照

| 项 | 结果 |
|---|---|
| 刊头 + 期号日期 | 通过 |
| 统计条 | 通过 |
| 头条摘要 + 一手/另外 N 家/原文 | 通过 |
| 往期（桌面或等价） | 通过 |
| 日报/周报/月报 | 通过（月报灰显） |
| 1280 首屏紧凑 | 通过（实测） |
| 侧栏/底栏「日报」 | 通过 |
| live/hot/timeline/more 暖纸壳 | 通过（P1 只改档案蓝链为 teal） |
| 无 *HOT / Inter / 多色渐变 CTA | 通过 |
| 非 Pro Max 整站换脸 | 通过（撤回 E-Ink 衬线/暗红） |

`npm run build:public` 与 `npm run verify:ia` 通过。
