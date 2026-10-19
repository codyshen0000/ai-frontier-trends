# /daily/ 源站真图覆盖率（2026-10-16）

- 可见 lead + story：**9/13** 挂上有价值真图（**69%**）
- 门禁：≥70% 有价值真图；表不计入覆盖率；禁止字段小表凑数
- 版式：有图条目同一卡内左文右图（`.ft-daily-split` / `.has-media`）；无图条目仍两栏纯文
- 结论：未达 70% — 失败项为诚实降级，未用 Logo/字段表凑数

## 成功 `data-id`

- `flux-3-image-klein`
- `liquid-d1-ultra`
- `muse-spark-open`
- `kling-4-0-ga`
- `gpt-live-1.1`
- `terminal-rsi`
- `repforcing`
- `rsi-nav`
- `speculative-forcing`

## 失败 `data-id`（粗分）

- `no_og`: 1
- `non_image`: 1
- `no_valuable_image`: 2

| data-id | reason | hosts | 说明 |
|---|---|---|---|
| `mai-base-2` | no_og | x.com | 主链无 OG / 正文图 |
| `nemotron-35-super-vl` | non_image | x.com | 候选均未过价值门（non_image） |
| `agent-reflex` | no_valuable_image | xiaohongshu.com | 主链为小红书/无图页等，未找到说明性配图，诚实不挂 |
| `argon-pro-rollout` | no_valuable_image | xiaohongshu.com | 主链为小红书/无图页等，未找到说明性配图，诚实不挂 |

## 抽样 ≥5（钩子 → 为何挂 / 为何不挂）

- **flux-3-image-klein**
  - 钩子：BFL FLUX 3 Image Klein：开源权重落地（5.6B）：单消费级 GPU、原生 4K、bbox 编辑
  - 源：https://bfl.ai/blog/flux-3-image-klein
  - 图：https://cdn.sanity.io/images/2gpum2i6/production/1cc58ca0649334f7f1557c983b3b219f2bef9379-1888x788.png
  - 说明：主链正文图支撑钩子「BFL FLUX 3 Image Klein：开源权重落地（5.6B）：单消费级 GPU、原生 4K、bbox 编辑」（score 100）
- **liquid-d1-ultra**
  - 钩子：Liquid AI d1-ultra：决策模型上线：Artificial Analysis Decision Index #1（65）【官方自报】
  - 源：https://x.com/liquidai/status/2110777964489285875
  - 图：https://pbs.twimg.com/media/HUr4frya0AImlay.jpg?name=orig
  - 说明：源站推文配图支撑钩子「Liquid AI d1-ultra：决策模型上线：Artificial Analysis Decision Index #1（65）【官方自报】」（score 48）
- **muse-spark-open**
  - 钩子：Meta Muse Spark Open：开源权重落地：总参约 816B、激活约 42B、上下文 1M
  - 源：https://x.com/AIatMeta/status/2110779754274292212
  - 图：https://pbs.twimg.com/media/HUr8VZAbcAAF9yn.jpg?name=orig
  - 说明：源站推文配图支撑钩子「Meta Muse Spark Open：开源权重落地：总参约 816B、激活约 42B、上下文 1M」（score 64）
- **kling-4-0-ga**
  - 钩子：Kling 4.0：产品全量上线（非开源权重）：新 UI + MCP/CLI
  - 源：https://x.com/Kling_ai/status/2110747537187709424
  - 图：https://pbs.twimg.com/media/HUrcseNbQAAYZiF.jpg?name=orig
  - 说明：源站推文配图支撑钩子「Kling 4.0：产品全量上线（非开源权重）：新 UI + MCP/CLI」（score 64）
- **mai-base-2**
  - 钩子：Microsoft MAI-Base-2：预训练完成：报道 MoE 约 80B active / 2
  - 源：https://x.com/i/trending/2110798757025702396
  - 图：（不挂）
  - 说明：主链无 OG / 正文图
- **nemotron-35-super-vl**
  - 钩子：NVIDIA Nemotron 3.5 Super VL（+Bolt 开源簇）：视觉+推理+工具，面向 agent
  - 源：https://x.com/nvidia/status/2110750157272719562
  - 图：（不挂）
  - 说明：候选均未过价值门（non_image）
