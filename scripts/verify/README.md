# Verify 门禁注册表（B0 phase 2 已接线）

`scripts/verify_ia.mjs` 末尾调用 `runVerifyRegistry()`（实现：`scripts/verify-registry.mjs`）：

```text
scripts/verify/*.mjs   ← 只加载 export 了 verify() 的模块
scripts/verify_ia.mjs  ← 原有 A-4 断言 + 汇总退出码
```

## 约定

每个**注册表门**是一个 ESM 模块，文件名 `scripts/verify/<owner>-<id>.mjs`。

```js
export const id = "b1-fixture";
export const owner = "B1";

/** @param {{ root: string, distDir: string, engineDir: string }} ctx */
export async function verify(ctx) {
  // 失败：throw new Error("…") 或 return { ok: false, message }
  return { ok: true };
}
```

- glob：`scripts/verify/*.mjs`（不递归、不加载 README）。
- **只 import 源码里 `export function verify` / `export { verify }` 的文件。** Remaining-A 独立入口（`starred-base.mjs`、`api-paths.mjs`、`serve-base.mjs`、`handoff-matrix.mjs` 等）有顶层副作用，走 `npm run verify:remaining`，不进注册表。`*.test.mjs` 不导出 `verify`，同样跳过。
- 加载顺序：文件名排序。某一门抛错不阻止后续门跑完，最后汇总退出。
- 零个门：打印 `ok verify registry: 0 gates` 并继续（empty glob OK）。`b0-registry-smoke.mjs` 证明接线。B1 门 `b1-fixture` / `b1-engine-dir` / `b1-score` / `b1-heat` 已落地，由 glob 加载。

独立跑 B2 门（不经 verify_ia）：

```bash
FT_ENGINE_DIR=scripts/engine/__samples__/out-1700 node scripts/verify/b2-hot-recompute.mjs
FT_ENGINE_DIR=scripts/engine/__samples__/out-1700 node scripts/verify/b2-event-id.mjs
FT_ENGINE_DIR=scripts/engine/__samples__/v1 node scripts/verify/b2-redirects.mjs
```

无 engine 目录时 B2 门 **skip**（fixture 构建不失败）。有 `hot.json` 时复算误差 >0.1 失败。

## 各路要加的门

| 文件 | 路 | 内容 |
|---|---|---|
| `b0-registry-smoke.mjs` | B0 | 已加；恒 `{ ok: true }` |
| `b1-fixture.mjs` | B1 | 已落：公开产物不得有 Remaining-A fixture id / example.com |
| `b1-engine-dir.mjs` | B1 | 已落：`FT_ENGINE_DIR` 有数据时页面不得再渲染 fixture 卡 |
| `b1-score.mjs` | B1 | 已落：公开 html/json/xml 不得出现 `score` 键 |
| `b1-heat.mjs` | B1 | 已落：`FT_ENGINE_DIR` 有 `hot.json` 时，公开 HTML/JSON 热度与引擎一致（±0.1），页面须出现 `HEAT_METHOD_COPY`，不得写「实时」/「引擎已 1:1」 |
| `b2-event-id.mjs` | B2 | **已加。** `event_id` / URL 去重 |
| `b2-redirects.mjs` | B2 | **已加。** `redirects.json` → 静态跳转页存在且可跟 |
| `b2-hot-recompute.mjs` | B2 | **已加。** 复算校验器：与 `hot.json` 误差 ≤0.1；不是生产热度源 |

W1 不往这里加 JS 门。归属见 [`docs/b-batch/OWNERSHIP.md`](../../docs/b-batch/OWNERSHIP.md)。
