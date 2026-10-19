# REUSED-SOURCES · MIT 文件复用清单

来源：附件 `aihot-mit-web-site-full.tgz`（上游 AIHOT 引擎 MIT，仅复用前端壳，去品牌）。

落点：`vendor/mit/`（源）→ `scripts/mit-static` 预渲染 → `preview/mit-static/`（可点静态包）。

## `apps/web`（几乎原样，少量静态适配）

| 文件 | 用途 |
|------|------|
| `app/app.css` | 设计 token / `.card` / 侧栏宽度 / lg=961 |
| `app/components/shell/Sidebar.tsx` | 桌面侧栏 |
| `app/components/shell/TabBar.tsx` | 手机底栏 |
| `app/components/shell/nav.ts` | 精选/热点榜/日报… 导航 |
| `app/components/shell/PhoneBar.tsx` | 手机顶栏 |
| `app/components/shell/ThemeSwitch.tsx` | 外观开关（静态不切主题） |
| `app/components/shell/Chrome.tsx` | 回到顶部 |
| `app/components/shell/screens.ts` `transitions.ts` | 壳状态（shim 后仍编译） |
| `app/components/icons.tsx` | 导航图标 |
| `app/components/ui/*` | Badge / Score / Tabs / Sheet / Page / SourceAvatar / Kicker / OutlineSheet / Presence / Controls / Lightbox |
| `app/features/feed/HotTopics.tsx` | 当前热点 |
| `app/features/feed/Timeline.tsx` `FeedItem.tsx` `Filters.tsx` `parts.tsx` `ReadingGroup.tsx` | 精选流 |
| `app/features/hot/Faces.tsx` `Sparkline.tsx` `Delta.tsx` `curve.ts` | 热点卡 |
| `app/features/report/ReportLayout.tsx` `ReportPaper.tsx` `ReportNav.tsx` `Nameplate.tsx` `Halftone.tsx` `IssueDots.tsx` `format.ts` | 日报 |
| `app/routes/hot.tsx` | 热点页 Lead/Runner/Row（去掉 loader） |
| `app/lib/format.ts` `time` 依赖、`local-state.ts` `hydration.ts` `motion.ts` `restore.ts` `seo.ts` | 支撑库 |

## `site`（`@aihot/site`）

| 文件 | 用途 |
|------|------|
| `site.ts` | 站名改「前沿趋势」；去掉 MyHOT/AIHOT 对外文案 |
| `brand/Logo.tsx` | Wordmark（圆点+站名，无上游 Logo 图） |
| `brand/nameplates/*.svg` | 「AI日报」刊头字标（行业词，不是 *HOT 品牌） |

未拷：`site/brand/logo.svg`、`icon.png`、`favicon.ico`、`apple-icon.png`、changelog 里的 AIHOT 自我介绍。

## `packages/contracts`

`site.ts` `taxonomy.ts` `time.ts` `site-config.ts` 类型与日历辅助。

## 本仓新增（不是 MIT）

| 文件 | 用途 |
|------|------|
| `scripts/mit-static/src/react-router.tsx` | 把 `Link` 编成 `index.html`/`hot.html`/`daily.html` |
| `scripts/mit-static/src/industry-taxonomy.ts` | 补缺失的 `@aihot/industry` |
| `scripts/mit-static/src/fixture.ts` | mock 精选/热点/日报 JSON |
| `scripts/mit-static/src/pages.tsx` `prerender.tsx` | 三页装配 + SSR |
| `IntentLink.tsx` / `Filings.tsx` / `SearchOverlay.tsx` 覆盖 | 去掉预取、备案图、搜索浮层 |

`preview/lookalike/` 仍保留作对照，不是本刀主线。
