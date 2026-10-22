# 信号表

新证据会让某条判断更站得住，或把它推翻。本页对照时间线，记下这些证据。

升级信号：出现了，判断更站得住。推翻信号：出现了，原来的判断要改或撤回。

最近核对：2026-10-16 傍晚。表 1–4 无翻转。公开页与研究跟踪表对齐，只记正表行和已公开定性的观察。

## 1. 无老师少步生成（MeanFlow / shortcut / iMF 等）
信号：前沿视频模型不靠老师蒸馏、用少步目标从头训练并上线 → 推翻"轨迹蒸馏+对抗精修成默认"
| 日期 | 来源 | 内容 | 链接 |
|---|---|---|---|
| 2026-09-13 | 小红书 #62 | MeanFlow 学习平均速度一步生成（26 赞） | https://www.xiaohongshu.com/explore/6aa6b74f000000002502fef7 |

备注：MF-RAE 等仍属「MeanFlow 目标 + 仍有 flow-matching 教师」，不满足推翻信号。Few-Step MeanFlow（arXiv 2610.20071）只改推理 horizon，未写入正表。

## 2. 生图"差距在数据"
信号：同架构、同算法、只换数据的对照实验 → 从"叙事"升级
| 日期 | 来源 | 内容 | 链接 |
|---|---|---|---|
| 2026-10-10 | Arena T2I 奖励论文（HF Daily 10-09） | 同一 RL 配方，只把奖励模型偏好数据从 1 万对加到约 560 万对，胜率 0.537→0.642（单 seed）；过滤后的 1 万条 prompt 胜过未过滤的 10 万条。只是后训练/奖励数据，不是预训练数据，算部分证据【推断】 | https://arxiv.org/abs/2610.02967 |

观察（未写入正表）：
- **Sora100K**（arXiv 2610.11770）：同 LTX-2、各 3000 条微调，Panda 70.41→Sora100K 76.43。和 Arena 一样算部分证据，规模小、多轮第二轮还掉。https://arxiv.org/abs/2610.11770
- **UltraText Bench**（arXiv 2610.09823）：测蒸馏副作用（更清楚、更不准），不是「只换数据」对照。
- **FineEnvs/openai-math**：369 个 Lean RL 环境；尚无人用它训权重，也不计入表 4。

「GPT Image 2.5 靠预训练数据」仍是叙事。

## 3. 视频少步蒸馏绕开原版 DMD
| 日期 | 来源 | 内容 | 链接 |
|---|---|---|---|
| 2026-10-06 | Kandinsky 6.0 报告 | DMD/DMD2/SID 视频上坍缩，改 π-Flow 10 步 + 对抗精修 | https://arxiv.org/abs/2610.05608 |
| 2026-10-08 | PTD（NVIDIA+EPFL） | 纯轨迹蒸馏、无分布匹配损失；33B MiniMax-H3 上 4 步对 DMD 学生 LightX2V Turbo：多样性 1.55→2.81，整体人评偏好 63.4%（p=0.010），画质持平；Wan 上对 PDD 55.1% 不显著（p=0.36）。仍有老师，不触发表 1 推翻信号 | https://arxiv.org/abs/2610.11498 |

仍在 DMD 上修、不算绕开（未写入正表）：
- **PDMD**（arXiv 2609.35768）：投影掉 critic 残差方向。Wan2.1 四步 VBench 83.73，比同设置 DMD 高 1.03。
- **DMAD**（arXiv 2610.02188）：把分布匹配改写成对抗分类，等价梯度视角仍来自 DMD。
- **DuoMatching**（arXiv 2610.03543）：joint DMD + marginal DMD（图像教师），仍在 DMD 家族。
- **Salt++**（arXiv 2609.36995）：Causal Self-Flow + context-aligned AR DMD。可作「DMD 因果化」旁证。
- **MBDMD**（arXiv 2610.10989）：证明 DMD ≡ 特定核下的 Drifting Model，说明「修 DMD」还在主路上。
- **RepForcing**（arXiv 2610.20111）：表征空间 teacher forcing 换中间 AR 老师 + 因果 ODE 初始化，随后仍做 asymmetric DMD。4 步 chunk VBench Total 84.04→84.66。属「修初始化、仍走 DMD」。
- **Glance Forcing**（arXiv 2610.20220）、**SMD**（arXiv 2610.18472）：少步旁证，未写入正表。

VAE / 因果生成观察（不是表 3）：
- **CRP / Optica**（arXiv 2610.11479）：无双向老师是真的，但跑 50 步，不触发表 1，也不是少步绕开。
- **CoVA**（arXiv 2610.13322）：组合 VAE 表征。
- **Omni-Diffusion-Distill**（arXiv 2610.10990）：离散 token 的统一 dLLM，不是连续扩散，也不涉及 DMD。

## 4. 世界模型里做 RL 训权重
升级信号：有人把「代码世界」（可执行规则/环境，如 Memento 3、Trace2Env、STS）当 RL 环境来更新权重 → 主线 3 再升一档。
推翻信号：「像素世界」（生成视频，如 WorldGuide、OuroWorld）不靠学出来的评审就能稳定判定任务完成。
| 日期 | 来源 | 内容 | 链接 |
|---|---|---|---|

正表仍空。Memento 3 全程冻结 LLM（arXiv 2610.11794）；WorldGuide 只做分阶段 SFT（arXiv 2610.12459）；DreamTrue（arXiv 2610.12468）改的是预测本身，评审仍靠人标缺陷。均未写入正表。

结构样本（主线等级不变，未写入正表）：
- **RIWANav**（arXiv 2610.08640）：在 Cosmos 像素世界模型里用 GRPO 训导航策略权重，共 19 轮。UrbanNav 未见区成功率：冻结世界模型 80.31%，RIWANav 88.25%（3 seed，作者自报）。学术单篇、离线数据、单一任务，升级需独立复现或大厂报告。

RSI / harness 观察（未写入表 4；2026-10-16 傍晚核对）：
- **Terminal-RSI**（arXiv 2610.22192）：终端环境里交替更新策略权重；可验证终端，但不是 learned 世界模型内 RL。
- **LlamaFactory RSI / PenguinHarness**：model 固定、演进 harness。
- **ClawLoop**（arXiv 2610.14118）：会 SFT/GRPO 更新权重并多轮留存（SkillsBench 46.3→57.2，作者自报）【证实】，但是 harness 沙箱自进化，不是世界模型内 RL。
- 同窗旁证：RSI-Anything（2610.13912）、Harness²（2610.14224）、AdaRSI（2610.20474）、SwarmRSI（2610.20431）、VideoHarness-SRSI（2610.19424）、RSI-Nav（2610.15782）、AReaL-RSI（2610.18083，明确不更新 backbone）。

flow-RL / 视频稳定性观察（未写入表 1–3）：
- **DiffusionART**（arXiv 2610.12572，NUS+可灵）：HunyuanVideo-13B 上 GPU 时少约 12× 追平 DiffusionNFT / Flow-GRPO-Fast 后期奖励。可灵署名不等于线上在用。
- **GraftOOD**（arXiv 2610.13470）：只优化 HPSv3 时 DD 48.6→4.86；混外部视频 SFT 后 DD 44.41。仅 Wan2.1-1.3B。
