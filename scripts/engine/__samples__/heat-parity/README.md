# heat-parity fixture（SYNTHETIC）

Task #57：`heat.mjs` 与仓库内 `scripts/site-data/heat48h.py` 共用边界用例。**不是**生产 engine-data。

| 文件 | 作用 |
|---|---|
| `cases.json` | 共享输入 + 两侧期望。48h 边界、.5 舍入、trend ±10%、键冲突、`heat === spark[-1]`（含非整点）现均为 **pass** |
| `SYNTHETIC` | 标记：禁止当生产数据 |

口径：[`docs/SITE-DATA-CONTRACT.md`](../../../../docs/SITE-DATA-CONTRACT.md)。

```bash
node --test scripts/engine/heat.test.mjs
python3 scripts/verify/heat-py-parity.py --json
```
