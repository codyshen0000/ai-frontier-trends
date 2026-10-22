# 例程草案 · R1h hot-tick（15 分钟 / 业务窗）

状态：**草案**。默认 **不启用推送**（`ENABLE_PUSH=0`）。D2 现网复验 + 总控批准前不要改现网 cron、不要推 `engine-data`、不要 dispatch Pages。

## 错峰

| 环 | 时刻（Asia/Shanghai） | 做什么 |
|----|----------------------|--------|
| **R1** | 每小时 **:17** | 采集；有 `round.done` 则 publish-no-wait：import → **全量** site-data（`--prev-tip`）→ `engine-data` → Pages |
| **R1h** | **:00 / :15 / :30 / :45**，仅 08:00–23:00 | 不采集、不 import；只重算/导出 `hot.json` + 必要 meta；节流后才考虑推送（默认仍 dry-run） |
| 窗外 | 23:01–07:59 | 轻环不推；跟 R1（约 1h） |

推荐 cron（UTC；CST+8。脚本仍自检业务窗）：

```cron
# R1h dry-run. Do NOT set ENABLE_PUSH=1 until 总控 enables D2.
0,15,30,45 0-14 * * * ENABLE_PUSH=0 FT_R1H_ALLOW_LIVE=0 /usr/bin/node /path/to/ai-frontier-trends/scripts/r1h/hot_tick.mjs --prev-tip /workspace/ops/engine-data-push/repo/data/engine/v1 --json >> /workspace/ops/r1h/cron.log 2>&1
0 15 * * * ENABLE_PUSH=0 FT_R1H_ALLOW_LIVE=0 /usr/bin/node /path/to/ai-frontier-trends/scripts/r1h/hot_tick.mjs --prev-tip /workspace/ops/engine-data-push/repo/data/engine/v1 --json >> /workspace/ops/r1h/cron.log 2>&1
```

`0-14` + `0 15` 覆盖 CST 08:00–23:00。`--prev-tip` 换成盒子上当前 tip 检出目录。

## 与 R1 publish-no-wait 共用

1. **锁** `/workspace/ops/l4-r1-lock`  
   R1 在 import / `export_site_data --prev-tip` / 推送前写入 `{ "holder": "r1", "since": "<iso>", "pid": N, "reason": "publish-no-wait" }`，结束后删除。  
   R1h 见新鲜 `holder=r1` → 本拍 `skipped_r1_lock`（**R1 赢**）。
2. **计数** `/workspace/ops/r1h/pages-deploys.jsonl`  
   R1 成功 dispatch 后：

   ```bash
   node scripts/r1h/record_pages_deploy.mjs --source r1 --kind success --pages-run-id "$PAGES_RUN_ID"
   ```

   失败记 `--kind failure`（轻环按 15→30→60 min 退避）。不改 R1 既有 collect / import / 全量导出逻辑。
3. **Cover** 凡会同步 tip 的路径必须 `--prev-tip`（与 #53 相同）。R1h CLI 缺省即拒绝。
4. **不要**让 R1h 跑 collect 或重复 import。有 `round.done` 仍只走 R1。

## 节流（写入脚本，总控可改 N）

- 哈希（去 `computedAt` / 易变时间戳）相同 → `skipped_noop`
- Debounce = 间隔 × 50% = **7.5 min**（R1 全量推送可打断：R1 自己不走这把锁的 debounce）
- Max **N=4** 成功 Pages / 小时（含 R1）；`FT_R1H_MAX_N` 可改
- 仅 `generated_at` 变、榜不变 → 视为 noop

## 启用推送（D2 以后，本草案默认关）

同时满足才会考虑 live：`ENABLE_PUSH=1`、`FT_R1H_ALLOW_LIVE=1`、`--push`。本 PR **不**把这三项写进 CI 或默认 cron。上线时仍只推 `origin/engine-data`，再走现有 `repository_dispatch` / `engine-data-updated`（与 R1 相同），**不合 main**。
