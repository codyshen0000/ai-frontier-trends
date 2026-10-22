# heat-parity fixture（SYNTHETIC）

Task #57 今日切片：给 `heat.mjs` 和盒子里的 `heat48h.py` 准备同一份边界用例。**不是**生产 engine-data，也不是 Remaining-A fixture。

| 文件 | 作用 |
|---|---|
| `cases.json` | 共享输入 + 两侧期望。覆盖 48h 边界、.5 舍入、trend ±10%、键冲突、`heat === spark[-1]` |
| `SYNTHETIC` | 标记：禁止当生产数据 |

口径与未完成项：[`docs/SITE-DATA-CONTRACT.md`](../../../../docs/SITE-DATA-CONTRACT.md)。

```bash
# JS（进 npm run test:engine；断言 fixture.js）
node --test scripts/engine/heat.test.mjs

# Python 子集（不进 verify:ia；断言 fixture.python；js≠py 只打印）
python3 scripts/verify/heat-py-parity.py --json
```
