# R1h / hot-tick（#58 D0–D2）

轻环只重算热点榜：读现有 engine 树（或盒子 `engine.sqlite` + 既有 site-data 导出），跑 **现有** `heat.mjs` 热度复算（或盒子 `FT_R1H_RANK_CMD`），写出 `hot.json` + 必要 meta，和 tip 去时间戳哈希比较。默认 **dry-run**：不 collect、不 import 编辑 outbox、不重写 daily/feeds、不写 `hot-snapshots`、**不 push `engine-data`、不 `repository_dispatch`**。

**D2 live path 已实现**，但仍须三门禁同时打开才会上站：`ENABLE_PUSH=1` + `FT_R1H_ALLOW_LIVE=1` + `--push`。缺一即 dry-run。不要把这三项写进 CI 或未经总控批准的 cron。

与 R1 共用锁 `/workspace/ops/l4-r1-lock`。R1 需要全量导出时占锁，轻环本拍记 `skipped_r1_lock`。

## 本地 dry-run

仓库根目录（本机没有盒子 SQLite 时，用 tip / fixture 即可）：

```bash
# 用仓库里的真实 site-data 快照（out-1700）
node scripts/r1h/hot_tick.mjs \
  --prev-tip scripts/engine/__samples__/out-1700 \
  --engine-dir scripts/engine/__samples__/out-1700 \
  --at 2026-10-19T08:27:00.000Z \
  --evidence-dir /tmp/r1h-evidence \
  --out /tmp/r1h-staging \
  --lock /tmp/r1h-lock \
  --counter /tmp/r1h-pages-deploys.jsonl \
  --force-window \
  --json

# 或对当前检出的 data/engine/v1（若有 hot.json）
ENABLE_PUSH=0 node scripts/r1h/hot_tick.mjs \
  --prev-tip data/engine/v1 \
  --engine-dir data/engine/v1 \
  --json
```

`--prev-tip` **必填**（cover preserve）。`ENABLE_PUSH` 默认视为 0。只加 `--push`、或只设其中一个环境变量，都不会上站。

自检：

```bash
npm run test:r1h
```

证据 JSON 字段：`trigger_at` / `hash_before` / `hash_after` / `decision`（`dry_run` | `skipped_noop` | `throttled` | `skipped_r1_lock` | `skipped_window` | `push` | `error`）/ `pages_run_id`（dry-run 恒为 `null`；live 成功时为 Pages run id）。

## D2 live（三门禁）

`--prev-tip` 必须指向 **`engine-data` 分支工作树** 里的 engine 目录（盒子上一般是 `/workspace/ops/engine-data-push/repo/data/engine/v1`）。本仓 `main` 检出里的 `data/engine/v1` / fixture **会被拒绝**，避免误 commit。

门禁通过且 hash 变、业务窗与节流 OK 时：

1. 拷 staging 的 `hot.json` + 已 patch 的 `meta.json` 进 `--prev-tip`（不重写 daily/feeds；`hot-snapshots` 仅当 `--write-snapshots` 且 staging 已有）
2. 只在 `engine-data` 上 `git add` / `commit` / `git push origin refs/heads/engine-data:refs/heads/engine-data`
3. `gh api` `repository_dispatch` `engine-data-updated` → `codyshen0000/ai-frontier-trends`
4. 返回 `{ pushed, dispatched, pages_run_id, note }`，并自动调用 `record_pages_deploy.mjs --source r1h`

```bash
# 形状示意——不要在 CI 或未批准的 cron 里跑
ENABLE_PUSH=1 FT_R1H_ALLOW_LIVE=1 node scripts/r1h/hot_tick.mjs \
  --prev-tip /workspace/ops/engine-data-push/repo/data/engine/v1 \
  --push --json
```

单测里 git / `gh` 全部 mock，CI 不打真实网络。

## 节流

| 规则 | 默认 |
|------|------|
| 内容哈希不变 | `skipped_noop`，不 push |
| Debounce | 距上次成功 Pages **7.5 min**（间隔的 50%） |
| Max N | **4** 次成功部署 / 小时（**含 R1**） |
| 失败退避 | 15 → 30 → 60 min |
| 业务窗 | 08:00–23:00 `Asia/Shanghai`；窗外 `skipped_window` |

计数文件（默认同盒子 ops）：

`/workspace/ops/r1h/pages-deploys.jsonl`

R1 publish-no-wait 在成功 `repository_dispatch` 后追加一行（不改 R1 现有脚本本体，由例程 brief 接线）：

```bash
node scripts/r1h/record_pages_deploy.mjs --source r1 --kind success --pages-run-id "$PAGES_RUN_ID"
```

失败：

```bash
node scripts/r1h/record_pages_deploy.mjs --source r1 --kind failure
```

R1h live 成功/失败后会自己写 `--source r1h`，不必再包一层。

## 盒子（可选）

默认 **不**调用全量 `export_site_data.py`（避免轻环重写 daily/feeds）。仓库真源在 `scripts/site-data/`（heat.mjs port，无需 align）。若盒子仍走 **hot-only** 导出命令，显式设置：

```bash
export FT_R1H_RANK_CMD='python3 scripts/site-data/export_site_data.py --hot-only --prev-tip {prevTip} --out {out}'
# 盒子旧路径仍可用：/workspace/frontier-hotboard/site-data/export_site_data.py
```

占位：`{prevTip}` `{out}` `{at}`。未设置时走本仓库 `heat.mjs`。看到 `/workspace/l4-runtime/engine.sqlite` 只记入证据，不在本脚本里手写 SQL。

## 不要做的事

- 不要把 `ENABLE_PUSH=1` / `FT_R1H_ALLOW_LIVE=1` 写进 CI。
- 不要从本 PR 改现网 crontab；启用归总控。
- 不要 merge `engine-data` 进 main；合入应用代码归总控。
