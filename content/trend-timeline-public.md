# AI 前沿趋势时间线（前沿趋势分析维护）

> 标注规则：**【证实】**有对照实验或官方一手数据；**【推断】**我们的归纳，有间接证据；**【叙事】**常见说法，缺少能区分的证据。
> 每条主线都写明"升级信号"（出现就上调置信度）和"推翻信号"（出现就撤回或改写）。有新证据时直接对照，不用从头再争。
> 数据来源：每日热点汇总（X、小红书、官方博客、arXiv、HF Daily Papers）。

---

## 2026-10-08 首版（经前沿追踪群讨论修订，总控bot 主持，AI热点追踪 担任反方）

### 主线 1：大语言模型后训练配方收敛到"先 OPD 或 SFT，再 RL"　【证实（文本任务）】
- 证据：
  - Sequential Beats Joint（[arXiv 2609.04108](https://arxiv.org/abs/2609.04108)）：OPD 和 RLVR 在同一步里融合会互相干扰，先 OPD 再 RL 最好。
  - RL Starts before RL（复旦/京东）：OPD 作为 RL 预热，RL 后 8 个文本基准比直接 RL 高 7.28；评论区质疑只跑了单 seed。
  - OPD Before RL（[arXiv 2610.02781](https://arxiv.org/abs/2610.02781)）：换评分器重新打分后，SFT+RL 从 0.830 掉到 0.404，RP-OPD+RL 只从 0.894 降到 0.889。
  - Reflection Beam 用多教师 OPD 把 RL 教师和安全教师合并（[Reflection 博客](https://reflection.ai/blog/introducing-beam)）。
- 限定：
  - Purdue《Does OPD Really Distill?》（[arXiv 2608.31046](https://arxiv.org/abs/2608.31046)）认为增益主要来自压低学生自采的低概率 token，而不是老师的信号。
  - 剑桥 On-/Off-Policy（[arXiv 2609.35259](https://arxiv.org/abs/2609.35259)）：只有反向 KL 偏好学生自己的 rollout，前向 KL 几乎不敏感；on-policy 带来的泛化优势接上 RLVR 后不一定还在。
- 升级信号：Beam 或 Mistral Large 4 放权重时公开的后训练配方也是"OPD 或 SFT 冷启动，然后 RL"；多 seed 复现。
- 推翻信号：出现大规模对照，同步融合（joint）稳定优于先后串行；或者 OPD 预热的增益在多 seed 下消失。

### 主线 2：两个领域共同的设计原则是"用模式寻找型目标时，在学生自己的样本上学"　【推断】
- 原说法"生图在重走大语言模型的路、晚半年到一年"**已撤回**：扩散模型是先做少步蒸馏（LCM、DMD，2023 年前后），后来才引入 RL（Flow-GRPO），顺序和大语言模型相反。
- 修订后：反向 KL 或模式寻找型目标（大语言模型 OPD、DMD 系）更适合在学生自己的样本上训练。π-Flow 一类属于轨迹模仿，**不和 DMD 归为同一类**。
- 证据：剑桥 2609.35259（KL 方向才是主要变量）；DMAD（[arXiv 2610.02188](https://arxiv.org/abs/2610.02188)）在学生样本上做对抗化的 DMD；Kandinsky 6.0（[arXiv 2610.05608](https://arxiv.org/abs/2610.05608)）用 π-Flow 在学生 rollout 上模仿老师。
- 反方意见（保留）：扩散 OPD（GFD-OPD [arXiv 2609.39692](https://arxiv.org/abs/2609.39692) 处理 CFG 放大误差，MILD [arXiv 2609.34371](https://arxiv.org/abs/2609.34371) 做跨模态老师）和大语言模型 OPD 要解决的问题不同，只是名字相同。
- 升级信号：有人在扩散 OPD 上做 Purdue 式的归因审计，并发现同样的"增益来自压低学生自身错误模式"。
- 推翻信号：扩散侧的对照实验显示，前向和反向目标对样本来源同样不敏感。

### 主线 3：视觉的可验证"环境"会先出现在生成链路的两端，不会出现在纯文生图里　【推断】
- 两端指：（a）VLM 看渲染结果、再回头修改的闭环；（b）任务成败能客观判定的世界动作模型（Runway Praxis-1、Meta ProWAM、RealtimeWAM [arXiv 2610.06617](https://arxiv.org/abs/2610.06617)）。
- 依据：纯生图里能自动判分的奖励已经接近饱和（GFD-OPD 学生 GenEval 0.963，超过老师的 0.949）；拉开差距的是美感和物理合理性，只能靠偏好判断。Kandinsky 6.0 用了 8 个奖励，自家人评里画面仍然输给 MiniMax H3 和 Seedance 2.0。
- 升级信号：出现开源的"VLM 评审 + 生成器"闭环 RL 训练框架或技术报告，并给出相对纯偏好奖励的增益；世界动作模型用模拟器成功率做 RL，且公开数据。
- 推翻信号：纯文生图出现新的、可规模化的可验证奖励（不是 OCR、计数这一类），并带来显著的人评提升。

### 主线 4："差距在数据"：大语言模型后训练【证实】；生图【叙事】
- 大语言模型（有"同模型、同流程、只换数据"的对照）：腾讯混元 RSR（[arXiv 2610.02826](https://arxiv.org/abs/2610.02826)）原始轨迹 SFT 在 Terminal-Bench 2 上 53.4%，改写后 74.2%；HF × Liquid 多 harness RL（[博客](https://huggingface.co/spaces/FineEnvs/multi-harness-rl)）中模仿 27B 老师轨迹做 SFT 不如在目标 harness 里做 RL；DeepSeek V4.1 Flash 公开了算法之后再说增益来自数据和环境管线。
- 生图：GPT Image 2.5"靠数据"来自博主综合披露文件和访谈，没有消融；Qwen-Image 2.1 反而公开了大量架构细节。
- 升级信号（生图）：出现"同架构、同算法、只换数据"的生图对照实验。
- 推翻信号（生图）：开源技术报告显示，同等数据下架构改动带来的差距大于数据改动。

### 主线 5：少步生成——VAE/latent 改进和蒸馏会叠加使用；"轨迹蒸馏加对抗精修"只是候选默认方案　【推断】
- 证据：Qwen-Image 2.1 已改成 16 倍压缩的 VAE，仍在做 8 步蒸馏版；fv-loss 的提速是训练收敛变快，不是采样步数变少；RealtimeWAM 一步出动作仍靠一致性蒸馏；Kandinsky 实测 DMD、DMD2、SID 在视频上容易坍缩，改用 π-Flow 加 Sim-LADD；DMAD 去掉了 DMD 的 fake score。CFG 是 GFD-OPD 和 IB-Flow 共同在对付的瓶颈。
- 真正可能取代蒸馏的是 MeanFlow、shortcut 这类不需要老师、训练目标本身支持少步的方法（社区里属于持续的小热度，不是爆点）。
- 升级信号（轨迹蒸馏加对抗精修成为默认）：Kling、Wan 下一代或其他大厂视频技术报告也采用这套组合。
- 推翻信号：出现不靠老师、直接用 MeanFlow 这类少步目标从头训练就上线的前沿视频模型。

### 主线 6：生图和视频的竞争从画质转向可控，控制接口在结构化　【推断，产品侧已证实】
- 证据：FLUX 3 Image 支持多轮编辑只改指定区域、JSON 边界框排版、最多 10 张参考图；Nano Banana 2.1 支持 mask 编辑、14 张参考图（[DeepMind 模型卡](https://deepmind.google/models/model-cards/nano-banana-2-1/)）；Seedance 2.5 按时间轴写提示词、给参考图分槽位（[Seed 博客](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5)）。可灵 4.0 的"15 个参考位、10 个关键帧"**产品还没上线，只是宣传口径**。
- 推论：训练数据需要越来越多带框、时间轴、参考图对应关系的结构化条件。
- 升级信号：技术报告公开结构化条件数据的构造方法；多轮编辑漂移的第三方评测成为常规基准。
- 推翻信号：下一批旗舰发布重新以画质或分辨率为主要卖点。

### 主线 7：决策模型或结构化输出正在成为一个品类　【推断，热度待观察】
- 证据：Jev（TypeSafe，9-15）；Liquid d1-3B 和 d1-omni（[Liquid 博客](https://www.liquid.ai/blog/d1-open)）；EmbeddingGemma 2 加 MediaPipe Decision Task；Cloudflare Clef 和 AWS Strands Decider 2B 都直接兼容 Jev 的 `/v1/systemone` 接口（厂商自报）。
- 限定：社区讨论集中在 9 月中下旬发布前后，之后明显降温，目前更像发布脉冲。
- 升级信号：第三方在同一基准上横评 Jev、d1、Clef；主流推理框架原生支持这个接口。
- 推翻信号：一两个月内没有新的模型或接口跟进，热度归零。

---

## 跟踪中的"已宣布未交付"（权重或产品）
详见权重追踪页。重点：FLUX 3 Image 开源权重（官方说几周内）、Runway Praxis-1 权重（未来几个月）、可灵 4.0 完整版（10 月）、Mistral Large 4 权重（月底，各家报 10/27–10/31）、Reflection Beam 权重和技术报告（本月晚些时候）。热度判断以实际交付日期为准。
