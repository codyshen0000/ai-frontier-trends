# #58 规格草案 · 热点榜日内刷新（父 #13）

> D0+D1 实现入口：`scripts/r1h/hot_tick.mjs`；例程草案：`ops/r1h/ROUTINE-BRIEF.md`；本地 dry-run：`ops/r1h/README.md`。本文件仍是已拍规格，实现未另开架构。

- 作者：开发工程师
- 时间：2026-10-23 ~01:10 Asia/Shanghai
- 状态：**草案**（不合 main；不改现网）
- 任务：https://app.notion.com/p/401b70ba59bd81549c2edd9874c0c956
- 依据：`aihot-gap-full.md`；`night-push-board-2026-10-23.md`；R1 例程（:17 采集 / publish-no-wait / engine-data 可推 / 合 main 归总控 / 不付费）

## 结论（先读）

1. **推荐默认频率：15 分钟**（业务窗内）。先于 5 分钟上线；指标稳后再考虑 5 分钟。
2. **新开轻环 `R1h`（hot-tick）**：只重算 `hot.rank` + 导出 `hot.json`（及必要 meta）→ 有条件再推 `engine-data` → Pages。**不做**采集，**不**重复 import 编辑 outbox。
3. **R1 小时轮保留**：:17 采集；发现 `round.done` 则按 publish-no-wait 立刻 import → 全量 site-data → 推送。日报/精选/周报仍跟 R1（及 R2），不进轻环。
4. **Pages 必须节流**：内容哈希不变则跳过推送；debounce；每小时最多 **4** 次成功部署（可调）。任何会同步的 site-data 导出仍强制 `--prev-tip`（cover preserve）。
5. **不付费**。实现前本文件需总控/产品点头后再开 PR。

---

## 1. 目标：什么叫「日内刷新」

| 对象 | 今日含义 | 不包含 |
|------|----------|--------|
| **热点榜**（`/hot/`、`/api/v1/hot.json`） | 业务日内多次重算 heat / trend / badges / spark；`computedAt` 明显新于「仅早上一批」 | 不保证条目数到 10（跟 #51 补源） |
| **日报**（`/daily/`） | 仍按 R1/R2 编辑闸与早轮/补推节奏 | 不仿参照站每 30 分钟 compose |
| **完整 R1** | 采集 +（有 done 时）import + 全量 site-data + 推送 | 轻环不替代 R1 |

成功体感（对标参照约 5min，本阶段可弱于参照）：

- 用户白天两次打开 `/hot/`，`computedAt` 间隔大致等于所选频率（有跳过时允许更长）。
- 涨跌/徽章相对「约 6 小时前」快照有意义，不再因整天只算一次而几乎全是 down。

现网基线（写规格时）：`hot.json` `computedAt=2026-10-22T15:04:00.000Z`（约 23:04 CST），条目 8；曾出现数小时不刷新（见 `aihot-gap-full.md`）。

---

## 2. 频率选项：5 / 15 / 30 分钟

假设：业务窗 **08:00–23:00 Asia/Shanghai**（15h）；窗外可降频到 1h 或只靠 R1。轻环每次 box 负载 ≈ 重算 + 小导出（秒～1 分钟级，待实现测）。Pages 成功部署按历史约 **2–5 分钟** GitHub Actions 计（公开仓分钟通常够用，仍要防队列与 thrash）。

| 档 | 理论触发/业务日 | 新鲜度 | Pages 分钟（无节流最坏） | Box 负载 | Thrash 风险 |
|----|-----------------|--------|---------------------------|----------|-------------|
| **5 min** | ≈ 180 次 | 接近参照；徽章最灵 | 180×(2–5) ≈ **360–900 min/日** | 高；与 R1 :17 易撞 | **高**：队列堆积、连续 dispatch |
| **15 min** | ≈ 60 次 | 够用：日内多次；6h 比较仍有效 | 60×(2–5) ≈ **120–300 min/日** | 中 | **中**；加节流后通常个位数～十几次真部署/日 |
| **30 min** | ≈ 30 次 | 明显好于「日更一次」；弱于参照 | 30×(2–5) ≈ **60–150 min/日** | 低 | **低** |

节流后真实部署次数 ≪ 理论触发（见 §3）。表中「最坏」只用于选型上限。

**推荐：15 min。** 理由：

- Notion 完成标准允许「先 15–30min，再靠近 5min」。
- 相对 30min，更好支撑 surge/rising；相对 5min，Pages/队列风险可控。
- 与 R1 小时轮错开（例：`:00/:15/:30/:45` 轻环；`:17` R1），冲突面小。

---

## 3. Pages 节流（防刷爆）

推送链保持现状：**只推 `origin/engine-data`**（不 merge main）→ `repository_dispatch` / Pages 检出版本 → `build:public`。

硬规则（实现时写入脚本/例程 brief）：

1. **Skip if unchanged**  
   比较将推送的 `hot.json` 与 tip 上文件：去掉 `computedAt` / 易变时间戳后做稳定哈希。哈希相同 → **不 push、不 dispatch**；只写本地证据（`skipped_noop`）。
2. **Debounce**  
   轻环触发后若距上次成功 Pages 开始 &lt; 频率的 50%（15min 档 → 约 7.5min），合并为一次；R1 全量推送可打断 debounce（优先有稿上站）。
3. **Max N deploys / hour**  
   默认 **N=4**（含 R1 触发的部署）。超额 → 跳过轻环推送，记 `throttled`；下一小时或 R1 再试。总控可改 N。
4. **Hot-first / 小 diff 优先**  
   轻环尽量只更新 `hot.json`、`meta.json` 中与热榜相关字段、可选 `hot-snapshots/YYYY-MM-DDTHH.json`；**不**重写整包 daily/feeds（除非同轮并入 R1 全量）。
5. **Meta-only 不单独上站**  
   仅 `generated_at` 变化、榜内容不变 → 视为 noop（同规则 1），避免「空转」耗分钟。
6. **失败退避**  
   Pages failure → 指数退避（15→30→60min），并 ping 总控；不在同小时内连打。

验收辅助：证据目录记 `trigger_at / hash_before / hash_after / push|skip|throttle / pages_run_id`。

---

## 4. 与 R1 的关系

```
R1（小时 :17，及 publish-no-wait）
  collect →（仅当 round.done）import editorial outbox
        → 全量 site-data（MUST --prev-tip）→ engine-data → Pages

R1h / hot-tick（推荐 15min，业务窗）
  读现有 engine.sqlite（不 collect、不 import）
        → 只跑 hot.rank + 相关导出（MUST --prev-tip 若走 site-data 同步路径）
        → 节流后或可推 engine-data → Pages
```

| 事项 | R1 | R1h（新） |
|------|----|-----------|
| 采集 :17 | 是 | 否 |
| Import 编辑 outbox | 仅 done；禁止重复 import | **永不** |
| 日报 / 精选 / RSS 全量 | 是 | 否 |
| `hot.rank` | 可顺带算 | **主责** |
| `--prev-tip` cover preserve | 全量导出强制 | 凡会同步到 tip 的导出同样强制 |
| 合 main | 否（仅 engine-data） | 否 |

冲突策略：

- R1 与 R1h 同时需要导出 → **R1 优先**；轻环本拍跳过或等 R1 结束。
- 锁文件：`/workspace/ops/l4-r1-lock`（或现有锁）两端共用。

---

## 5. 推荐默认 + 为何

**默认：业务窗 15 分钟轻环 + 窗外跟随 R1（约 1h）+ §3 节流。**

为何不直接 5 分钟：参照站有常驻 worker；我们靠 box 定时 + Pages。5 分钟无强节流易刷爆队列，且对「条目偏少」无帮助（那是 #51）。  
为何不先 30 分钟：能上，但涨跌体感偏钝；15 分钟成本可接受，更接近产品「对标参照」方向。

调档路径：上线 15min → 测 2 个业务日真实 push 次数与 Actions 分钟 → 总控批准后再试 5min（须保持 N 与 skip 规则）。

---

## 6. 验收标准（产品 / 测试可现网验）

1. **新鲜度**  
   业务日任取两点，间隔约 1–2 小时：  
   `curl -sS https://codyshen0000.github.io/ai-frontier-trends/api/v1/hot.json | jq .computedAt`  
   两次 `computedAt` 均落在当日，且差值大致 ≤ 所选频率 × 2（允许 skip/throttle）。  
   证据：两次输出 + 时间戳截图或文本落盘。
2. **页面可见**  
   打开 https://codyshen0000.github.io/ai-frontier-trends/hot/ （或首页热点区）可见更新时间与榜；截图桌面一帧。
3. **节流有效**  
   连续两拍内容无变时，证据记 `skipped_noop`，且该时段 **无** 新的成功 Pages run（或 run 数不增）。
4. **不破坏封面**  
   轻环上站后抽查 ≥1 条热点封面仍 200（`--prev-tip` 未丢）。对照：此前无 prev-tip 会掉同域封面。
5. **不重复编辑闸**  
   轻环日志无 outbox import；精选条数不因轻环单独增加（有 done 仍只走 R1）。
6. **自查进任务**  
   开发写自查后再交测试→产品；合 main 若有代码 PR 仍归总控（engine-data 推送按现权）。

---

## 7. 范围外 / 非目标

- 不付费 API、不买 Actions 分钟包、不上参照站闭源服务。
- 不把日报改成 30 分钟合成。
- 不在本任务把热点条目做到稳定 10 条（#51）。
- 不在本任务修 Py/JS spark 公式对齐（#57）。
- 不 merge `engine-data` 进 `main`；不擅自合应用代码进 main。
- 不改 T2=76；不降编辑闸。
- 本文件只规格，**不**直接改现网。

---

## 8. 待产品 / 总控拍板

1. **频率默认是否锁定 15min？** 或首周先 30min 再升？  
2. **业务窗是否 08:00–23:00 CST？** 窗外是否完全交给 R1？  
3. **Max N=4 成功部署/小时是否可接受？** 需要更高新鲜度时 N 提到多少？  
4. （可选）轻环是否允许写 `hot-snapshots` 小时快照（利于徽章对照），还是只覆写 `hot.json`？

---

## 9. 估时（实现阶段，供总控排期；非本草案范围）

| 切片 | 估时 |
|------|------|
| 规格（本文） | ~0.5–1h（已交） |
| R1h 脚本 + 锁 + skip/hash + 证据 | ~3–4h |
| 例程/brief 接线 + 与 R1 错峰 | ~1–2h |
| 自查 + 测试/产品验收 | ~2h |
| **合计实现** | **约 1 天**（与 `aihot-gap-full` 粗估一致） |

与 #55 叠层小 PR：**#55 合入优先**；规格已并行。实现开 PR 时避开同一文件冲突。

---

## 10. 下一步（开发）

1. 等总控/产品对 §8 问题回复（或默许 §5）。  
2. 实现开 draft PR + 例程草案；先 staging/证据，再申请推 engine-data。  
3. 自查清单写入 Notion #58 后再交测试审校。

---

## 已拍板（总控 · 2026-10-23 ~01:11 Asia/Shanghai）

规格状态由「草案」升为 **已拍可实现**（#55 PR#42 仍优先合；本任务实现可并行写代码，合入不抢 #55）。

1. **频率**：锁定 **15 分钟**（不先 30）。稳定跑满 **2 个业务日** 后再议是否试 5 分钟；试 5min 仍须保持 skip/hash 与 Max N。
2. **业务窗**：**08:00–23:00 Asia/Shanghai**；窗外只跟 R1（约 1h），不跑轻环推送。
3. **Pages Max N**：**4** 次成功部署 / 小时（**含 R1**）。`hash` 不变跳过 + debounce **必须**落地。
4. **不付费**。实现估时仍按约 1 天。

### 分日交付点

| 日 | 交付 |
|----|------|
| **D0**（今晚/今晨） | R1h 脚本骨架：只重算/导出 hot（不 collect、不 import outbox）；`--prev-tip`；与 tip `hot.json` 去时间戳哈希比较；dry-run **不 push / 不 dispatch** |
| **D1** | throttle（debounce + max 4/h 含 R1）+ draft PR + 例程 15min 业务窗排程（仍默认不启用推送） |
| **D2** | 测试→产品现网复验（URL/截图）→ 总控批准合入并启用例程 |

可选未拍：轻环是否写 `hot-snapshots` 小时快照 — 实现默认 **只覆写 `hot.json`（及必要 meta）**，快照另开切片再议。
