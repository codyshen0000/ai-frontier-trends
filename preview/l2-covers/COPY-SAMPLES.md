# 热点卡文案抽样（v5.1 §3）

对照：`frontier-story-digest` · 验收 `daily-viz-realimg-acceptance.md` §3.2–3.4。  
字段：卡片 `title` ← JSON `title`；正文 ← `digest`；可选「最新进展」← `latest_progress`（本批均为空，整块省略）。

| 卡 | 标题 | 第一句（答案前置） | 对照 v5.1 §3 |
|---|---|---|---|
| **NO.01** flux-3-image-klein | Black Forest Labs 开源 FLUX.3 Image Klein（5.6B） | Black Forest Labs 在 Hugging Face 放出 FLUX.3 Image Klein 开源权重（约 5.6B），面向单消费级 GPU，支持原生 4K 与 bbox 编辑。 | **Klein 已改。** 旧文「权重跟踪：Klein 记交付；完整非-Klein FLUX 3 Image 仍非本批。六件套其余仍空。」已删除。标题主体+动作+结果；第一句可独立引用；后段只写材料里的产品线分开与范围。 |
| NO.02 openui-1.0 | OpenUI 1.0 开源 Agent 界面框架 | OpenUI 1.0 开源了一套 Agent 交互界面协议与运行时：智能体用 schema 和 OpenUI Lang 组合地图、表单、图表与按钮，并支持 React、Vue、Svelte、Angular。 | 去掉「午间栏空 / 不碰训练配方」内部备注；保留仓库与框架事实。 |
| NO.03 jev-1-14-preview | TypeSafe 开放 Jev 1.14 实验性预览 | TypeSafe 在托管端开放 Jev 1.14 预览（jev-preview，约一周后切到 jev-latest），含多语微调；图像、box 框与长上下文需加 danger-zone 请求头。 | 去掉「不进信号表」；评测数字留在第二段，并写明是独立评测口径。 |
| NO.04 jev-35b | JEV-35B 开源单次前向决策头 | JEV-35B 基于 Qwen3.5-35B-A3B 开源（Apache-2.0），约 35B 总参、3B 激活，做单次前向结构化决策，而不是逐 token 生成。 | 去掉「不进训练方法主线」；自报 Decision Index 标明未进官方榜。 |
| NO.05 llamafactory-rsi | LlamaFactory 开源 RSI 工具链 | LlamaFactory 维护者称 GitHub 仓库过 7 万星后，开始做递归自改进方向的工具链。 | 去掉「不进信号表 4、不升档」；三件仓库与星标来自原卡。 |
| NO.06 pr-opd | PR-OPD：事后技能对齐隐藏状态 | PR-OPD 先做 GRPO，再让策略写事后技能，并对齐各层隐藏状态，而不是对齐词概率。 | 去掉「挂主线 / 不升档」；表 1 数字保留。 |

日报头条与 NO.01 同一事件：标题同上；摘要为 article-summary 量级（约 80–160 字），不强制最新进展行。

本批 10 张热点卡均已 overlay；闸分、补位、`recommend_reason` 未写入 `title` / `digest` / `one_line`。
