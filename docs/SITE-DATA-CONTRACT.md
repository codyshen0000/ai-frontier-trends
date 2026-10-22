# SITE-DATA-CONTRACT（热度）

公开 JSON 字段名仍以 `scripts/engine/site-data.ts` 为准。本页是 **heat-v1-48h-halflife24h** 的数值口径。

规范实现：**`scripts/engine/heat.mjs`**（唯一真源）。Python port：`scripts/site-data/heat48h.py`。`b2-hot-recompute.mjs` 与 R1h `rankHotFromEngine` 复用同一条路径。

`align_hot_sparks_to_js.mjs` **已退役**（`ALIGN_HOT_SPARKS` 默认关）。导出后直接跑 b2，不再改写 `hot.json`。

共享 fixture：`scripts/engine/__samples__/heat-parity/cases.json`。

## heat-v1-48h-halflife24h

| 项 | 口径 |
|---|---|
| 窗口 | `0 ≤ (at − lastAt) / 1h ≤ 48`（两端闭；恰好 48h 的报道计入） |
| 半衰期 | 24h；`raw = Σ 0.5^(hours/24)`，每个参与方只留窗口内最新一条 |
| 显示热度 | `heat = Math.round(raw × 100) / 10`（.5 向上）；`raw ≤ 0` → `0`。Python：`math.floor(raw*100+0.5)/10` |
| spark | UTC 整点向下取整，25 桶（24h 含两端），无证据为 `null` |
| **heat === spark 终点** | `listed.heat === spark.at(-1)`。listed heat 取 `floorUtcHour(at)` 那一桶。`exactHeat`（精确 `computedAt`）只留给尚未重导的旧 tip，b2 仍接受 |
| trend | 先把 `(heat − heat6) / heat6` 舍入到 1 位小数，再 `>10` up / `<-10` down；`existedBefore` 为假 → `new`；`prev ≤ 0` → `unknown` |
| badges | surge / new 看 `firstAt`（不是 last.t） |
| 参与方键 | `participantKeyFromReport`：`participant_key → handle → source_id → 源名 → …`（**不用** `owner:` 前缀） |
| 权重 | 一律 1.0（`--weights spec` 的 signal 0.3 只留 CLI，默认 mit 不走） |

## 已收口的 py 差异（fixture 现为 pass）

| 项 | 旧 heat48h.py | 现在（port / heat.mjs） | fixture |
|---|---|---|---|
| 48h 边界 | `at−48h < t ≤ at`（左开） | 两端闭 | `boundary-48h` |
| .5 舍入 | 银行家（.5 取偶） | half-up | `rounding-half-up` |
| trend ±10 | 未舍入比值 vs `±0.1` | 先舍入再比 `±10` | `trend-plus-10` / `trend-minus-10` |
| 参与方键 | `owner:` / `source:` | `participantKeyFromReport` | `key-collision` |
| heat vs spark 终点 | 非整点 drift | listed = spark[-1] | `spark-endpoint-on-hour` / `spark-endpoint-off-hour` |

无剩余故意口径差。现网 `engine-data` tip 在下次全量导出前仍可能带着旧 exact-at heat；b2 对 listed heat 同时接受 spark 终点与 exactHeat，避免未推 engine-data 时 CI 误红。

## 导出补丁（本仓库）

- `timeline_fallback`：报道标题 grounding 全挂时，用事件标题 + `published_at` 补时间线（否则 b2 无时间戳）。
- `cover_preserve`：校验之后从 `--prev-tip` 写回 `assets/covers/` 同域封面。

## 怎么跑

```bash
node --test scripts/engine/heat.test.mjs scripts/site-data/align_hot_sparks_to_js.test.mjs
python3 scripts/verify/heat-py-parity.py --json
python3 -m unittest discover -s scripts/site-data/tests -p 'test_*.py'
FT_ENGINE_DIR=scripts/engine/__samples__/out-1700 node scripts/verify/b2-hot-recompute.mjs
```

`b2-heat-parity.mjs` 已进 `verify:ia` 注册表。
