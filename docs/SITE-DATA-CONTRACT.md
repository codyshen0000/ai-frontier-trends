# SITE-DATA-CONTRACT（热度切片）

公开 JSON 字段名仍以 `scripts/engine/site-data.ts` 为准。本页只补 **heat-v1-48h-halflife24h** 的数值口径，以及 py↔JS parity 的未完成项。

规范实现：**`scripts/engine/heat.mjs`**（`b2-hot-recompute.mjs` 复用同一条路径）。生产 `hot.json` 现网已用 `align_hot_sparks_to_js.mjs` 盖成 JS 口径；盒子里的 `site-data/heat48h.py` 不再是唯一真源。

共享 fixture：`scripts/engine/__samples__/heat-parity/cases.json`。

## heat-v1-48h-halflife24h（JS）

| 项 | 口径 |
|---|---|
| 窗口 | `0 ≤ (at − lastAt) / 1h ≤ 48`（两端闭；恰好 48h 的报道计入） |
| 半衰期 | 24h；`raw = Σ 0.5^(hours/24)`，每个参与方只留窗口内最新一条 |
| 显示热度 | `heat = Math.round(raw × 100) / 10`（.5 向上）；`raw ≤ 0` → `0` |
| spark | UTC 整点向下取整，25 桶（24h 含两端），无证据为 `null` |
| **heat === spark 终点** | `listed.heat` 必须等于 `spark.at(-1)`。现网 hot #3 曾出现 14.6 vs 14.7，因为 heat 用精确 `computedAt`、spark 最后一点用 `floorUtcHour`。fixture `spark-endpoint-off-hour` 记下这笔失败；全量对齐时要收口 |
| trend | 先把 `(heat − heat6) / heat6` 舍入到 1 位小数，再 `>10` up / `<-10` down；`existedBefore` 为假 → `new`；`prev ≤ 0` → `unknown` |
| badges | surge / new 看 `firstAt`（不是 last.t） |
| 参与方键 | `participantKeyFromReport`：`participant_key → handle → source_id → 源名 → …` |
| 权重 | 一律 1.0（`--weights spec` 的 signal 0.3 只存在于 py，默认 mit 不走） |

## 已知 py 差异（fixture 已覆盖）

| 项 | heat48h.py | heat.mjs | fixture |
|---|---|---|---|
| 48h 边界 | `at−48h < t ≤ at`（左开） | 两端闭 | `boundary-48h` |
| .5 舍入 | 银行家（.5 取偶） | `Math.round`（.5 向上） | `rounding-half-up` |
| trend ±10 | 未舍入比值 vs `±0.1` | 先舍入再比 `±10` | `trend-plus-10` / `trend-minus-10` |
| 参与方键 | `owner:` / `source:` | `participantKeyFromReport` | `key-collision` |
| heat vs spark 终点 | 非整点同样可能 drift | 同左 | `spark-endpoint-on-hour`（过）/ `spark-endpoint-off-hour`（记下失败） |

## 怎么跑

```bash
node --test scripts/engine/heat.test.mjs
python3 scripts/verify/heat-py-parity.py --json
```

Python 不进 `verify:ia` 注册表（无 `export function verify`）。没有 `heat48h.py` / `l4lib` 时，检查脚本用本仓库里的 heat48h **子集**对照 `fixture.python`。JS 测试只断言 `fixture.js`，CI 绿。

## TODO（全量对齐，10–12h follow-on，本切片不做）

1. 把 `heat48h.py` 迁到上表 JS 口径：闭窗口、half-up（`Decimal` 或 `math.floor(x+0.5)`）、trend 先舍入再比 ±10、new/unknown、surge 用 firstAt；参与方键对齐 `participantKeyFromReport`（或导出时写好 `participant_key`）。
2. 退役 `site-data/align_hot_sparks_to_js.mjs`：导出后直接跑 b2，不再改写 `hot.json`。
3. 把盒子里的 `timeline_fallback` / `cover_preserve` 补丁收进本仓库。
4. heat 与 spark 终点在非整点 `computedAt` 上也要 `===`（收口 `spark-endpoint-off-hour`）。
5. 子集检查换成真正的 ported `heat48h.py`（`HEAT48H_PY=`），parity 进 CI。
