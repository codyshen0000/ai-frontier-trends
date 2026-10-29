# G3 · 免费压极限（本分支说明 · 不合 main）

分支：`cursor/frontier-1to1-20261029`。本文件只解释本 PR 里的 cron / dispatch 补丁怎么验、AC-S4 要什么证据。**不要合 main。不要推生产 Pages。不要买托管。**

## 审计（现成免费钩子）

| 钩子 | 本分支补丁前 | 本分支补丁后 | 谁触发 |
|---|---|---|---|
| `pages.yml` schedule | 小时 `:40` UTC | 业务日 UTC `0,15,30,45 0-15`（CST 08:00–23:45 每 15 分）；夜间 UTC `40 16-23`（CST 约每小时） | GitHub cron（只跑 **默认分支** 上的 workflow 文件） |
| `repository_dispatch` `engine-data-updated` | 已接 | 仍接；**始终构建**（不走 skip） | R1h live `tryLivePush`；R1 `round.done` publish-no-wait |
| R1h | 08:00–23:00 CST 每 15 分；Max N=4/h；debounce 7.5 分；默认 dry-run | 不改门禁、不改盒子 crontab | 盒子例程（三门禁仍关） |
| skip-noop | 无 | **仅 schedule**：tip `hot.json.computedAt` === 现网 `api/v1/hot.json.computedAt` 则跳过空构建 | `scripts/g3/skip_scheduled_noop.mjs` |

`DISPATCH_EVENT` 真源：`scripts/r1h/live_push.mjs`（`engine-data-updated`）。Pages workflow 的 `types` 必须与它对齐，单测锁死。

## 为什么空 cron 不能前进 `computedAt`

公开 `hot.json` 的 `computedAt` 来自 **engine-data tip**，不是构建时钟。只重跑 Pages、tip 没变 → 戳不动，还烧 Actions。所以：

1. R1h / R1 先 push `engine-data`（热文件或全量），再 `gh api repos/<repo>/dispatches -f event_type=engine-data-updated`。
2. dispatch 进 `pages.yml`，检出 tip，重建，**戳前进**。
3. 定时备份只在 tip 已比现网新时才构建。

R1h live 仍须三门禁：`ENABLE_PUSH=1` + `FT_R1H_ALLOW_LIVE=1` + `--push`。本 PR **不**打开门禁、不改现网 crontab。

## 期望间隔（不是测得的现网曲线）

| 条件 | 期望 |
|---|---|
| 仅本分支 cron（未合 main） | **现网不变**。GitHub 只跑默认分支 workflow。 |
| 合 main 后、仅 cron、R1h 仍 dry-run | 业务日约 15 分一次构建机会；若 tip 未前进则 skip。现网戳仍可能数小时不动。 |
| 合 main 且 R1h live 打开 | 数据重算约 15 分；dispatch 后再加构建 4–8 分 + 队列。体感中位大约 **15–25 分**。 |
| 真·中位 ≤10 分（AC-S4 A） | **免费 Actions 单独做不到可靠中位**。GH cron 尽力而为、Max N=4/h、构建时长、队列都会拉开。 |

文案继续 G11：**当前热度** + 「业务日内约每 15 分钟重算（静态发布）」。未达真·5min **不写「实时」**。

## EX-01 建议：**是**

免费路径压到 15 分档后，仍无法把中位稳定压到竞品×2（~10min）。请产品1 找 Cody 过一眼 EX-01（5min 活站刷新 = 付费/常驻引擎例外）。**不要买托管。**

AC-S4 走 **(B)**：例外过眼后本条按例外 PASS。未过眼且未达 A = FAIL/BLOCKED。

## 本地怎么验（不打生产）

```bash
# 1. workflow 形状 + skip 决策 + 与 R1h event_type 对齐
node --test scripts/g3/*.test.mjs scripts/r1h/hot_tick.test.mjs

# 2. 热文案仍诚实
node --test scripts/engine/heat-copy.test.mjs

# 3. skip 助手（schedule + 同戳 → skip；dispatch → 必构建）
GITHUB_EVENT_NAME=repository_dispatch \
  FT_ENGINE_DIR=data/engine/v1 \
  node scripts/g3/skip_scheduled_noop.mjs
# 期望：{"skip":false,"reason":"not-schedule",...}

# 4. R1h 仍默认 dry-run（不会 dispatch）
ENABLE_PUSH=0 node scripts/r1h/hot_tick.mjs \
  --prev-tip scripts/engine/__samples__/out-1700 \
  --engine-dir scripts/engine/__samples__/out-1700 \
  --json
```

不要对生产仓库发真实 `repository_dispatch`。不要 `ENABLE_PUSH=1`。

## AC-S4 证据表（留给执行2 / 产品1，禁止编造戳）

连续 3 次采样，写入 `/workspace/app-dev/qa/t96-g3-free-*.md`（本仓外）。本分支 **不填假时间戳**。

| # | 采样时钟（CST） | 现网 HTML 更新行 | `api/v1/hot.json` `computedAt` | `data_as_of` | 原始 HTML/JSON 路径 |
|---|---|---|---|---|---|
| t1 | （实测填写） | （读页） | （curl 读回） | （curl 读回） | `ours-hot-t1.html` / `ours-hot-t1.json` |
| t2 | t1 + ~2–15min | | | | |
| t3 | t2 + ~2–15min | | | | |

判定：中位间隔 ≤10min → 候选 A；否则交 EX-01（本文件建议 **是**）。

对照竞品同方法只作倍数，不把竞品戳写进我方产物。
