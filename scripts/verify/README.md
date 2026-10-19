# Verify 门禁注册表（B0 规划，尚未接线）

B1 / B2 / Remaining-A 都会改 `scripts/verify_ia.mjs`。B0 **不改** 该文件（#24 仍在改）。phase 2（#24 QA 通过后）把 `verify_ia.mjs` 收成加载器：

```text
scripts/verify/*.mjs   ← 按 glob 加载，每路只加自己的文件
scripts/verify_ia.mjs  ← 只负责收集失败、打印、退出码
```

## 约定

每个门是一个 ESM 模块，文件名 `scripts/verify/<owner>-<id>.mjs`。

```js
export const id = "b1-fixture";
export const owner = "B1";

/** @param {{ root: string, distDir: string, engineDir: string }} ctx */
export async function verify(ctx) {
  // 失败：throw new Error("…") 或 return { ok: false, message }
  return { ok: true };
}
```

- glob：`scripts/verify/*.mjs`（不递归、不加载本 README）。
- 加载顺序：文件名排序。某一门抛错不阻止后续门跑完，最后汇总退出。
- **本 PR 不接线、不放任何 `.mjs` 门**，避免半成品被误加载。

## 各路要加的门（phase 2+）

| 文件 | 路 | 内容 |
|---|---|---|
| `b1-fixture.mjs` | B1 | `PUBLIC_DEPLOY=1` 读到 Remaining-A fixture id 即失败 |
| `b1-engine-dir.mjs` | B1 | `FT_ENGINE_DIR` 有数据时页面不得再渲染 fixture 卡 |
| `b2-event-id.mjs` | B2 | `event_id` / URL 去重 |
| `b2-redirects.mjs` | B2 | `redirects.json` → 静态跳转页（meta refresh + canonical）存在且可跟 |
| `b2-hot-recompute.mjs` | B2 | 复算校验器：与 `hot.json` 误差 ≤0.1，超出则构建失败（不另出生产热度源） |
| （#24 A-4 已有门） | Remaining-A | 暂留 `verify_ia.mjs`；#24 合入后再视情况拆到 `a4-*.mjs` |

W1 不往这里加 JS 门；它只动 `.github/workflows/`。

接线钩子见 [`docs/b-batch/OWNERSHIP.md`](../../docs/b-batch/OWNERSHIP.md)。
