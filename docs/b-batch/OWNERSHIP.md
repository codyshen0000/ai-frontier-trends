# B 批文件归属（B0）

基线：`8b09f25`（#24 当时 tip）。#24 仍在改下列「禁动」文件；B0 **只新增文件**。phase 2 等 #24 QA 通过后再把钩子接到那些文件上。

合入顺序不变：`#24 → B1 → B2 → W1`。B1 / B2 / W1 都从本 PR（B0）再开 stacked draft。

## 1. 禁动（phase 1）

另一路正在改，B0 / B1 / B2 / W1 在 #24 合入前都不要碰：

| 文件 | 当前谁在改 |
|---|---|
| `scripts/verify_ia.mjs` | #24 A-4 新门 |
| `scripts/mit-static/src/client/hydrate.ts` | #24 点击返工 |
| `package.json` | #24 + 三路都想加 scripts |
| `scripts/mit-static/src/pages.tsx` | #24；随后 B1 独占 |
| `scripts/static_export.mjs` | #24；随后 B1 独占 |
| `scripts/build.mjs` | #24；随后 B1 接 loader，B2 经钩子调用 |

## 2. 各路独占 / 只交模块

| 文件 | 归属 | 说明 |
|---|---|---|
| `scripts/mit-static/src/pages.tsx` | **B1** | fixture → `loadEngineData()`；调用 `groupByEvent()` |
| `scripts/mit-static/src/fixture.ts` | **B1** | 删出生产路径；`PUBLIC_DEPLOY` 读到 fixture 即失败 |
| `scripts/mit-static/src/prerender.tsx` | **B1** | |
| `scripts/mit-static/src/react-router.tsx` | **B1** | |
| `scripts/mit-static/src/client/hydrate.ts` | **B1** | #24 合入后；已有 `data_as_of` |
| `vendor/mit/.../FeedItem.tsx` `parts.tsx` `routes/hot.tsx` `features/hot/*` | **B1** | 隐藏空字段和「原文」。B2 **不改** MIT 组件 |
| `scripts/static_export.mjs` | **B1** | feed / api / timeline 接真实数据；调用 `writeRedirects()` |
| `scripts/build.mjs` | **B1** 接线；B2 只改自己的模块 | `try { loadEngineData() } catch (EngineDataError) { 回退 }`；再调 `writeRedirects` |
| `scripts/engine/groupByEvent.mjs` | **B2** | B0 是恒等桩；B2 改实现，不改调用点 |
| `scripts/redirects.mjs` | **B2** | B0 是 no-op；B2 实现 `writeRedirects(dist, data)` |
| `scripts/engine/loader.mjs` `site-data.ts` | 公共（B0 已落） | B1/B2 消费；不要各写一套类型 |
| `scripts/verify/*.mjs` | 按文件 | 每路只加自己的门；见 `scripts/verify/README.md` |
| `.github/workflows/pages.yml` | **W1** | 独占。`workflow_dispatch` + 每小时 :40 cron；不要用 engine-data 的 `push` 事件 |
| `package.json` scripts | phase 2 一次性加 | `test:b1` / `test:b2` / `build:ci`；测试按 glob。B0 **不改** package.json |

B2 需要的「另 N 家」展示走数据字段（`sourceCount` / `sourceNames` / `participants` / `group`），不改 MIT 组件。

## 3. 数据目录约定（W1 与 B1 共用）

| 项 | 约定 |
|---|---|
| 生产树 | `engine-data` 分支上的 `data/engine/v1/`（内容 = 盒子 `site-data/out/`，契约 1.1） |
| 构建读取 | `process.env.FT_ENGINE_DIR`，默认 `data/engine/v1`（相对仓库根） |
| CI | W1 把 `engine-data` checkout 到 `FT_ENGINE_DIR`，再跑 `build:public` |
| 本地 / QA | `FT_ENGINE_DIR=/path/to/snapshot` 指向固定快照；B0 合成样本在 `scripts/engine/__samples__/v1/`（标明 SYNTHETIC，不得当生产数据） |
| 格式 | 只认站点契约 1.1。公开 JSON **禁止 `score` 键**。封面 class 同时接受 `official_diagram` 与 `official_explainer` |
| 坏数据回退 | loader 抛 `EngineDataError`。上一份合格导出优先取 **engine-data 的上一个提交**；没有则 **Pages 上一份 artifact**。都没有 → 公开构建失败，**禁止回退 fixture** |

## 4. phase 2 接线钩子（#24 QA 通过后）

只改调用点，模块已在本 PR：

1. **`scripts/build.mjs`**
   ```js
   import { loadEngineData, EngineDataError } from "./engine/loader.mjs";
   import { writeRedirects } from "./redirects.mjs";
   try {
     engine = loadEngineData();
   } catch (err) {
     if (err?.name === "EngineDataError") { /* 回退上一份合格导出 */ }
     else throw err;
   }
   writeRedirects(distDir, engine);
   ```
2. **`scripts/mit-static/src/pages.tsx`**：用 loader 结果替换 `fixture` 的 `timeline` / `hot` / `daily`；渲染前 `groupByEvent(timeline.cards)`。
3. **`scripts/static_export.mjs`**：feed.xml、`/feed/daily.xml`、`/api/v1/hot.json`、timeline 分页读 engine bundle；末尾 `writeRedirects(dist, data)`。
4. **`scripts/verify_ia.mjs`**：`glob scripts/verify/*.mjs` 后调用每个 `verify(ctx)`。A-4 旧断言先留在文件里。
5. **`package.json`**（此时 #24 已不再改它）：
   - `"test:engine": "node --test scripts/engine/"`
   - `"test:b1"` / `"test:b2"` / `"build:ci"` 按 glob 收集

本 phase 1 不改以上任何现有文件。
