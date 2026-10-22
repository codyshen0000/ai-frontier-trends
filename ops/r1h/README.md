# R1h / hot-tick（#58 D0+D1）

轻环只重算热点榜：读现有 engine 树（或盒子 `engine.sqlite` + 既有 site-data 导出），跑 **现有** `heat.mjs` 热度复算（或盒子 `FT_R1H_RANK_CMD`），写出 `hot.json` + 必要 meta，和 tip 去时间戳哈希比较。默认 **dry-run**：不 collect、不 import 编辑 outbox、不重写 daily/feeds、不写 `hot-snapshots`、**不 push `engine-data`、不 `repository_dispatch`**。

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

`--prev-tip` **必填**（cover preserve）。`ENABLE_PUSH` 默认视为 0。加 `--push` 也不会上站，除非同时设置 `ENABLE_PUSH=1` **和** `FT_R1H_ALLOW_LIVE=1`（本 PR 仍不执行 git push / dispatch）。

自检：

```bash
npm run test:r1h
```

证据 JSON 字段：`trigger_at` / `hash_before` / `hash_after` / `decision`（`dry_run` | `skipped_noop` | `throttled` | `skipped_r1_lock` | `skipped_window` | `push`）/ `pages_run_id`（dry-run 恒为 `null`）。

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

## 盒子（可选）

默认 **不**调用全量 `export_site_data.py`（避免轻环重写 daily/feeds）。仓库真源在 `scripts/site-data/`（heat.mjs port，无需 align）。若盒子仍走 **hot-only** 导出命令，显式设置：

```bash
export FT_R1H_RANK_CMD='python3 scripts/site-data/export_site_data.py --hot-only --prev-tip {prevTip} --out {out}'
# 盒子旧路径仍可用：/workspace/frontier-hotboard/site-data/export_site_data.py
```

占位：`{prevTip}` `{out}` `{at}`。未设置时走本仓库 `heat.mjs`。看到 `/workspace/l4-runtime/engine.sqlite` 只记入证据，不在本脚本里手写 SQL。

## 不要做的事

- 不要把 `ENABLE_PUSH=1` 写进 CI。
- 不要从本 PR 的默认路径推 `engine-data` 或打 Pages。
- 不要 merge main；合入归总控（D2）。
