# B 批文件归属（B0）

基线：`715f7f4`（#24 已合入 main）。B0 phase 1 只新增文件；**phase 2 接线已落在本 PR**（`verify_ia.mjs` glob、`package.json` scripts、`build.mjs` loader/redirect 钩子）。仍 **不要** 在 `pages.tsx` / `static_export.mjs` 里把 fixture 换成真实 engine 数据——那是 B1 的活。

合入顺序不变：`#24（已合） → B0 → B1 → B2 → W1`。B1 / B2 / W1 从本 PR 再开 stacked draft。

## 1. 各路独占 / 只交模块

| 文件 | 归属 | 说明 |
|---|---|---|
| `scripts/mit-static/src/pages.tsx` | **B1** | fixture → `loadEngineData()`；调用 `groupByEvent()`。B0 **未改消费** |
| `scripts/mit-static/src/fixture.ts` | **B1** | 删出生产路径；`PUBLIC_DEPLOY` 读到 fixture 即失败 |
| `scripts/mit-static/src/prerender.tsx` | **B1** | |
| `scripts/mit-static/src/react-router.tsx` | **B1** | |
| `scripts/mit-static/src/client/hydrate.ts` | **B1** | 已有 `data_as_of` |
| `vendor/mit/.../FeedItem.tsx` `parts.tsx` `routes/hot.tsx` `features/hot/*` | **B1** | 隐藏空字段和「原文」。B2 **不改** MIT 组件 |
| `scripts/static_export.mjs` | **B1** | feed / api / timeline 接真实数据。B0 只留注释钩子；`writeRedirects` 从 `build.mjs` 调 |
| `scripts/build.mjs` | **B0 已接线**；B1 把 fallback 做成真实回退 | `loadEngineForBuild()` + `writeRedirects(dist, engine)`。缺数据时 **不失败**（仍走 fixture），B1 收紧 |
| `scripts/engine/groupByEvent.mjs` | **B2** | B0 是恒等桩；B2 改实现，不改调用点 |
| `scripts/redirects.mjs` | **B2** | B0 是 no-op；B2 实现 `writeRedirects(dist, data)` |
| `scripts/engine/loader.mjs` `site-data.ts` | 公共（B0） | B1/B2 消费；不要各写一套类型 |
| `scripts/verify/*.mjs` | 按文件 | **只加载 `export function verify` 的模块**。Remaining-A 独立脚本（`starred-base.mjs` 等）走 `verify:remaining`，不进 glob |
| `scripts/verify_ia.mjs` | **B0 已接线** | 末尾 `runVerifyRegistry(ctx)`。A-4 旧断言仍留在文件里 |
| `.github/workflows/pages.yml` | **W1** | 独占。`workflow_dispatch` + 每小时 :40 cron |
| `package.json` scripts | **B0 已加** | `test:engine` / `test:b1` / `test:b2` / `build:ci`。不要改掉现有 scripts |

B2 需要的「另 N 家」展示走数据字段（`sourceCount` / `sourceNames` / `participants` / `group`），不改 MIT 组件。

## 2. 数据目录约定（W1 与 B1 共用）

| 项 | 约定 |
|---|---|
| 生产树 | `engine-data` 分支上的 `data/engine/v1/`（内容 = 盒子 `site-data/out/`，契约 1.1） |
| 构建读取 | `process.env.FT_ENGINE_DIR`，默认 `data/engine/v1`（相对仓库根） |
| CI | W1 把 `engine-data` checkout 到 `FT_ENGINE_DIR`，再跑 `build:public` |
| 本地 / QA | `FT_ENGINE_DIR=/path/to/snapshot` 指向固定快照；B0 合成样本在 `scripts/engine/__samples__/v1/`（标明 SYNTHETIC，不得当生产数据） |
| 格式 | 只认站点契约 1.1。公开 JSON **禁止 `score` 键**。封面 class 同时接受 `official_diagram` 与 `official_explainer` |
| 坏数据回退 | `loadEngineForBuild()` 捕获 `EngineDataError`。B1 把上一份合格导出接到这里：优先 **engine-data 的上一个提交**，否则 **Pages 上一份 artifact**。都没有且已不走 fixture → 公开构建失败，**禁止回退 fixture**。B0 阶段缺目录只 warn，继续 fixture 构建 |

## 3. phase 2 已接线的钩子

1. **`scripts/build.mjs`**：`loadEngineForBuild()` + `writeRedirects(distDir, engine)`（engine 为 `null` 时 no-op 仍安全）。
2. **`scripts/verify_ia.mjs`**：`await runVerifyRegistry({ root, distDir, engineDir })`。现有 Remaining-A 独立脚本不导出 `verify`，不会被 import。
3. **`package.json`**：
   - `"test:engine": "node --test scripts/engine/"`
   - `"test:b1"` / `"test:b2"`：glob `scripts/b1` / `scripts/b2` 下 `*.test.mjs`；零文件 exit 0
   - `"build:ci": "test:engine && test:b1 && test:b2 && build:public && verify:ia"`

## 4. 留给 B1 的冲突点

- `pages.tsx` 仍 `import { daily, dailyIndex, hot, timeline, today } from "./fixture"`。B1 换成 loader，并 `groupByEvent(timeline.cards)`。
- `static_export.mjs` 仍从 content/weekly 生成 feed/api；B1 改读 engine bundle。`writeRedirects` 不必再调一次（build.mjs 已调）。
- `loadEngineForBuild()` 缺数据时目前 **不 fail 公开构建**。B1 在生产路径去掉 fixture 后，应把「无上一份合格导出」升级为失败。
