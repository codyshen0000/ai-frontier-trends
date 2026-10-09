# FLUX 3 提示词速查表

整理自 Black Forest Labs 官方文档。检索日期：**2026-10-08**。说明用中文；**官方 prompt 保持英文原文**。完整长 prompt 在 [官方示例库](./examples/)，本页若缩短会标 **…** 并给出链接。未在文档出现的参数、上限或例子一律不写；自拟内容会标「示例（非官方）」。

<p class="sister-nav">相关页：<a href="./examples/">官方示例库</a> · <a href="./cases/">官方案例</a> · <a href="./camera-terms/">相机术语表</a></p>

<nav class="page-toc" aria-label="本页目录">
<p>本页目录</p>

- [文档自相矛盾处](#文档自相矛盾处)
- [一页总览](#1-一页总览)
- [文生图规则](#2-文生图规则)
- [编辑](#3-编辑)
- [布局与 bbox](#4-布局与-bbox)
- [Image API](#5-image-api)
- [视频提示词](#6-视频提示词)
- [Video API](#7-video-api)
- [Cookbook](#8-cookbook)
- [常见错误与调参](#9-常见错误与调参)
- [来源](#10-来源)

</nav>

## 文档自相矛盾处

<div class="callout">

**官方文档自身不一致（照原文并列，不自行裁决）。**

1. **`aspect_ratio: "auto"`（图像）**  
   - [Image API](https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3)：prompt 里点名的比例优先，否则跟第一张参考图；没有参考图时由 prompt 决定，再否则 `1:1`。  
   - [Technical Parameters](https://docs.bfl.ml/guides/prompting_unified_technical) / Image 概览表：无参考图时为 `1:1`，有参考图则跟第一张。

2. **图生视频 duration**  
   - [Video API](https://docs.bfl.ml/api-reference/utility/generate-a-video-with-flux-3)：`keyframes` 用 `[seconds, image]` 且 `duration: "auto"` 时，片子跑到最后一对的秒数并向上取整（最长 20s）。  
   - [图生视频指南](https://docs.bfl.ml/guides/prompting_video_image_to_video)：带时间戳或 3 帧以上要**显式**写 `duration`。

3. **Cookbook 请求形 vs 主 Video API**  
   - Cookbook 客户端打 `flux-3-preview-high`，分辨率写 `480p` / `720p`，关键帧是 `{image_url, frame_index}`，另有 `reference_images` / `reference_video`。Cookbook 的 `aspect_ratio` 表**没有** `2:1`。  
   - 主 API `POST /v1/flux-3-video` 用 `mode`：`t2v` / `i2v` / `v2v` / `draft_enhance`；分辨率 `hd` / `fhd` / `qhd` / `uhd`（含 `2:1`）；`i2v` 用 URL/base64 或 `[seconds, image]`，`v2v` 用 `start_video`。

</div>

## 1. 一页总览

来源：[FLUX Prompting Guide](https://docs.bfl.ml/guides/prompting_summary)、[Prompting Basics](https://docs.bfl.ml/guides/prompting_unified_basics)、[Technical Parameters](https://docs.bfl.ml/guides/prompting_unified_technical)、[Prompt Reference](https://docs.bfl.ml/guides/prompting_unified_reference)。

1. **用自然语言写完成图**：主体、场景、风格、光线、构图。短句也能生成；只把要锁死的细节写进去。
2. **词序有用**：媒介/风格 → 主体与位置 → 光线、颜色、背景。最重要的放最前。不要堆 `masterpiece`、`beautiful`、`iconic`。
3. **没有负向字段**：FLUX 3 Image 没有 `negative_prompt`、`guidance`、`seed`、`prompt_upsampling`。未知字段返回 `422`。负向说法改成正向描述。
4. **参考图用位次**：`images` 1–10 张，每张至少 256×256、至多 16 MP。提示词写 `image 1` / `image 2`。没有单独的 `mode` 字段。
5. **要印出的字加引号**：写出位置和字体；`\n` 表示换行。多行海报给每块字单独 bbox。
6. **精确颜色用 hex，并绑到物体**：如 `change the color of only one bird in the middle to #e01075`。
7. **布局 = caption + JSON 元素表**：caption 用 `<id>`，坐标 `[top, left, bottom, right]`，整数 0–1000。整段放进 `prompt`。
8. **编辑写成指令**：点名改什么、改成什么、什么保持不变。
9. **视频当导演**：写动作、运镜、节奏、声音。多镜头用 `HARD CUT`。
10. **先低分辨率试词**：文生图 `768sq` 最快；没有 `seed`，同一 prompt 两次可以不同。一次只改一个要点。

## 2. 文生图规则

### 结构、长度、展开

文档起步模板（不是死公式）：

```text
[Subject], [location], [style], [camera settings], [lighting], [colors], [effect], [additional elements]
```

| 组件 | 控制什么 | 官方例子 |
|---|---|---|
| Image type | 类别/取景 | `portrait`, `landscape`, `birds-eye`, `macro`, `abstract` |
| Subject | 主对象 | `a young woman with curly red hair` |
| Location | 环境 | `in a futuristic space station` |
| Style | 视觉方向 | `editorial photography`, `anime illustration` |
| Camera settings | 镜头与景深 | `85mm lens, shallow depth of field` |
| Lighting | 怎么打光 | `soft window light`, `golden hour sunlight` |
| Colors | 主色 | `muted earth tones`, `deep green and cream` |
| Effect | 额外处理 | `motion blur`, `film grain`, `soft bloom` |
| Additional elements | 陪体 | `wind-blown fabric, falling leaves` |

**FLUX 3 会先展开短 prompt 再生成**，展开结果在 `result.prompt`。短句只写要锁死的位置、外观、光线或文字。

| 长度 | 文档说法 |
|---|---|
| 短 | 主体 + 场景，适合试方向 |
| 中 | 再加风格、光线、一两处关键细节 |
| 长 | 写得见的东西：机位、质感、文字、颜色；结构比字数重要 |

只改地点是最快的变体；主体动作、情绪、气氛写清楚。**一两个强效果够了**；泛泛的 realism 词写一个就够，不要堆 `highly detailed` / `ultrarealistic`。

海滩短到长的官方扩写、芭蕾 / bison 长 caption、以及用字面 `\n` 的准时海报，全文在 [示例库 · Prompting Basics](./examples/#prompting-basics)。

短例：`Three ballerinas dancing Swan Lake, seen from the wings past the dark silhouettes of people watching.`  
bison 短线索：`A wide-angle photograph of a lone American bison walking through a misty geothermal landscape.` …

换行海报（官方）：caption 里写 `"ON TIME.\nEVERY TIME."` 这类带 `\n` 的字符串，模型按换行排字。

### 五种艺术形式与调色

Building 页给出的 art-form 方向（全文见示例库）：

| 方向 | 官方线索 |
|---|---|
| 沙堡摄影 | `A child playing on a sunny beach, building a sandcastle, action photography, high shutter speed, soft warm light` |
| 印象派机器人 | impressionist + robot |
| 儿童画恐龙 | childlike dinosaurs |
| lo-fi 便利店 | lo-fi convenience store |
| 燃烧建筑胶片静帧 | burning buildings film still |

色板：写方案，不要只写一个色名。改地点通常比改主体更快得到新图。

### 风格、环境光、文字

来源：[Style, Aesthetics & Text](https://docs.bfl.ml/guides/prompting_unified_style)。

环境光品质（窗口 / 金色时刻 / 蓝色时刻 / 顶光）：`window light`、`golden hour`、`blue hour`、`overhead`。

三则重新生成的艺术向 prompt（1990s 编辑、bison 钴蓝房间、金色时刻吉他手）以及角色设定/设计类别的开场句，全文在 [示例库 · Style](./examples/#style-aesthetics--text)。

两段历史模板（文档标明适用更早模型 / FLUX.2 klein，不是 FLUX 3 Image 字段）：

```text
style fusion
```

```text
Style: …
Mood: …
```

文字要点：

| 规则 | 文档说法 |
|---|---|
| 引用原文 | 每个要印出的字符串加引号，含大小写与标点 |
| 位置 / 层级 | 写在画面哪里、谁大谁小 |
| 颜色与效果 | 如 red neon letters、gold serif、chalk on blackboard |
| 字体性格 | serif formal / sans modern / script elegant / display bold |
| 长文拆块 | 拆成多块并校对每一处引号内文字 |
| 两行居中 | `arranged in two centered lines` |
| 图文同框 | 图形和字写在同一个 box 的 `desc` 里 |

短字可不配布局：`a paper poster on the wall that reads "OPEN LATE"`。双语印章面板、Cabin / Sauna 布局见示例库。Tokyo 多语种表见下。

| Box | 位置 | 字 |
|---|---|---|
| `Ja_Text_1` | 左侧竖排 | `"ストリート\n悪魔"` |
| `Ja_Text_2` | 右上 | `"東京"` |
| `Ja_Text_3` | 右下印章 | `"印"` |
| `Ja_Text_4` | 底中 | `"たうのさん"` |
| `Unknown_Text_1` | 其下 | `"ORIGINAL ARTWORK"` |

### Style Keywords 与参考表

来源：[Prompt Reference](https://docs.bfl.ml/guides/prompting_unified_reference) 的 **Style Keywords** 表（官方英文关键词原文）。

| Category | Keywords |
|---|---|
| **Photographic** | “shot on Kodak Portra 400”, “35mm film”, “IMAX camera”, “Sony A7IV”, “Hasselblad X2D”, “Canon 5D” |
| **Cinematic** | “cinematic”, “anamorphic lens flare”, “teal and orange color grading”, “film noir”, “Roger Deakins cinematography” |
| **Artistic** | “oil painting”, “watercolor”, “pencil sketch”, “impasto texture”, “Art Nouveau”, “Bauhaus” |
| **Digital art** | “concept art”, “matte painting”, “octane render”, “unreal engine”, “stylized 3D” |
| **Illustration** | “flat design”, “vector illustration”, “comic art”, “anime style”, “graphic novel”, “whimsical” |
| **Vintage** | “80s vintage photo”, “2000s digicam”, “VHS aesthetic”, “polaroid”, “sepia tone” |

Camera/lens/film cues 同页：`f/1.4`–`f/2.8` 浅景深，`85mm` 人像压缩，`shot on Kodak Portra 400`、`35mm film`、Hasselblad / Canon 机身。光线 / 构图表：Golden hour / Blue hour / Rembrandt / Split / Chiaroscuro 等。

**Model-specific notes（仅提及，非 FLUX 3 Image 字段）**：同页 Accordion 还列了 FLUX.2（多语、参考图数量按变体 4/6/8/10）和 FLUX.1 Kontext。FLUX 3 Image：参考图按位次 `image 1`，最多 10；未知字段 `422`。

### 技术参数

`aspect_ratio`（15 + `auto`）：`21:9`、`2:1`、`16:9`、`3:2`、`7:5`、`4:3`、`5:4`、`1:1`、`4:5`、`3:4`、`5:7`、`2:3`、`9:16`、`1:2`、`9:21`、`auto`。

`resolution`（Image API / 概览）：`768sq`、`1k`、`1.5k`、`2k`、`4k`。默认 `1k`。  
[Technical Parameters](https://docs.bfl.ml/guides/prompting_unified_technical) 用途表只列了 **4 档**（`768sq` / `1k` / `2k` / `4k`），**没有写出 `1.5k`**——以 Image API 与 Image 概览的五档为准，并在此标注文档不一致。

编辑若要**改画幅**：显式设 `aspect_ratio`，并描述多出来的空间（例如方图产品改 `16:9` banner）。

HEX 绑物体。JSON 结构化 prompt 可与 bbox 表连用。负向 → 正向：不写 `no blur`，改写 `sharp focus on the eyes`。

## 3. 编辑

来源：[Editing overview](https://docs.bfl.ml/guides/prompting_editing_overview)、[single reference](https://docs.bfl.ml/guides/prompting_editing_single_reference)、[multi reference](https://docs.bfl.ml/guides/prompting_editing_multi_reference)。

原则：说清楚**改什么**、**改成什么**、**什么留下**。颜色准很关键时要检查结果（grounding / hex 仍可能偏）。迭代写成 edit records。

EditingShowcase 四条（银狐、拉远、改动作、改环境）全文在 [示例库 · 编辑概览](./examples/#编辑概览)。

### 单参考：FLUX 3 vs FLUX.2

该页**只有 6 条标为 FLUX 3 结果**，其余是 **FLUX.2 结果**。

| 标签 | 主题 |
|---|---|
| **FLUX 3** | bottle in strawberry；cow hex recolor；neon `zum Schlappen`；outfit swap；ice butterfly；owl eyes open |
| **FLUX.2** | 场景替换、油画、插画转照片、糖粒、柠檬、goblin、polar bear、樱桃罐、银色蝴蝶、Night/Winter、polaroid `2020 <3`、外套 hex、gaze 等 |

三条曾被截断的官方全文（本页不截，示例库收录）：

- cow hex recolor：`Recolor only the white and black FUR of the cow.` … 含 `Keep the dark eyes, nose openings, collar, yellow ear tag and hooves unchanged`。[全文](./examples/#单参考编辑指南)
- neon `zum Schlappen`：含 `The new letters use continuous neon tubing and remain readable, with lowercase 'zum' and an uppercase 'S'`。[全文](./examples/#单参考编辑指南)
- 多参考 plate pattern：含 `The pattern follows the curved plate surface` 与 `Preserve the saturated burnt-orange`。[全文](./examples/#多参考编辑指南)

清单行：`Fix the image` → `Open the owl's eyes`。换背景要写新场景**及其光线**；风格迁移要写**哪些形状保持**。

另 12 条单参考例（mountain vista、remove vegetation、bike→horse、feathers→petals、ice butterfly、autumn colors、Flux.2 text、Night Bloom、Black Friday、`#87CEEB` wedding dress、owl eyes、model pose）见示例库。

### 多参考

用 `image 1` / `image 2`。一张参考图可以同时提供多种特征。**没有一张参考图带目标画幅时，显式设 `aspect_ratio`。**

清单行：apply style of the other one；add the product；make them wear it。

五条文档标明的 **FLUX.2** 例：Kodak skating、underwater room、impasto cat、animal pattern、smoke logo。Lamp-on-sideboard 的 record 与 rows 原文在示例库。

## 4. 布局与 bbox

坐标 `[top, left, bottom, right]`，整数 **0–1000**。`id` 要**短且唯一**。行类型：new / keep / from ref。caption 用 `<id>` 引用。整段放进 `prompt`，没有单独 box 参数。

文字行：写清 **case / color / type style / alignment**，并引用原文。改已规划布局：改 boxes 再重发。

**小框上限是像素，不是网格单位。** Bounding boxes Tips 与 layout 页原文：*a new element in a box of about 40 × 25 pixels often did not appear*。给新元素更大的框。

其他 Tips：

- 用 LLM 起草布局。
- 用视觉模型列出要改的元素。
- 编辑时**所有行保持 Keep**，只改正在编辑的行。
- 未列出的区域通常不变；加上 anchor 更明确。
- 框外像素通常不变，但阴影、反射、邻近光线可能变。

FLUX 3 常会**展开编辑指令并自动补 box**，结果写在 `result.prompt`。

Owl 快改模板：`In this image, change <owl_subject>, previously described as …`

多图布局例：包 `#CC5500` / `#F5A623` / `#6B8E23`；湖 + ducks；furnish room；`wears the jacket from image 2`。Launch 的约 17 条 bbox 编辑 / 6 条布局（soleil、panels、spectators、garden dinner、Tools、4x4 grid）全文在示例库。

Coordinates 0-1000 normalized。`to_bbox` conversion：`to_bbox(left, top, right, bottom, width, height)` 把像素转到 0-1000 网格。先定 `aspect_ratio` 再画框。

## 5. Image API

`POST https://api.bfl.ai/v1/flux-3-image`，请求头 `x-key`。OpenAPI schema `Flux3ImageInputs`，`additionalProperties: false`，未知字段 → **422**。

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `prompt` | string | 必填 | 生成或编辑；bbox JSON 接在末尾 |
| `images` | string 或 list | | 1–10，URL 或 base64，256×256–16 MP |
| `aspect_ratio` | enum + `auto` | `auto` | 15 个固定比或 `auto`（见上节矛盾处） |
| `resolution` | enum | `1k` | `768sq` / `1k` / `1.5k` / `2k` / `4k` |
| `safety_tolerance` | integer 0–4 | `2` | 0 最严 |
| `grounding` | boolean | `true` | 默认真：web + image search；`false` 更快、只靠 prompt。官方对照：`A photograph of this year's official Oktoberfest poster` |
| `version` | `latest` | `latest` | 当前发布；日后可钉日期标签 |

没有 `negative_prompt` / `seed` / `guidance` / `prompt_upsampling`。

提交立即返回：`id`、`polling_url`、`cost`（credits）、`input_mp`、`output_mp`。**用返回的 `polling_url`，不要自己拼。**

| Status | 含义 |
|---|---|
| `Pending` / `Reasoning` / `Generating` | 进行中，继续 poll |
| `Ready` | 完成；`result.sample` **1 小时内**下载；另有 `result.prompt`（展开后的 prompt）、`result.duration` |
| `Request Moderated` | 输入被拦，改输入再提交 |
| `Content Moderated` | 输出被拦，改 prompt |
| `Error` | 失败，看 body |
| `Task not found` | id 未知或过期 |

| HTTP | 原因 |
|---|---|
| `400` | 参考图大于 16 megapixels |
| `422` | 未知字段、空 prompt、非法值、图小于 256×256 |
| `503` | 失败任务也可能 HTTP 503 + 正常 JSON，先读 body 的 `status` |
| `402` / `429` | 欠费 / 限流（全站共用，见 Errors 页） |

图像侧计价以提交响应的 `cost` / `input_mp` / `output_mp` 为准（文档未另给按分辨率美元表）。

Quickstart 兔 risograph + generate 页约 26 条 gallery（photoreal / typography / infographic / illustration）见 [示例库 · generate](./examples/#flux-3-image--generate)。

## 6. 视频提示词

工作流：`t2v` / `i2v` / `v2v` / 独立的 Video Edit。一句话模板 + 标注字段；多镜头用时间步或 `HARD CUT`。

强 prompt 五点清单：

1. 主体与动作（镜头能看见的名词、动词）
2. 场景 / 光 / 景深
3. 带时间的运镜
4. **Motion qualities**：Slow, abrupt, weightless, chaotic, precise, cinematic, documentary
5. **Continuity constraints**：整段必须稳住的东西，尤其编辑或续写

六段 schema（who/where/arc；setting/light/DOF；timecoded camera；per-shot audio；realism/palette/grain；格式选用时机）：短片用 one-liner；要锁镜头与声音用标注字段；要卡点用 timestep。脚步、撞击、雨、引擎能给音频更清楚的材料。沙漠 schema、Phase（beekeeper / tram）全文、12 条 t2v gallery、关键帧 `0:00` / `0:03` / `0:07` / `0:10`、6 条 v2v continuation（elephants, penguin, hikers, Iguazu, giraffe, SUV）、pigeons 视频编辑，均在示例库。

### 对白与音频

四层：dialogue / SFX / ambience / music。引号台词 + 说话人。只写会改变听感的细节；形容词堆叠会互抢；`one audible breath` 会把呼吸推得太响。

五条对白写法：

1. 角色会用缩写就用 contractions
2. 砍掉听众已经看见的开场
3. 不要每句以口号收尾
4. 给说话人一个对场内某人开口的理由
5. 标点从简，太多停顿会唱起来

短片不要硬塞多名说话人或长剧本，拆成多场。多人归属复查成本高；对白是焦点时让其他人闭嘴。多语多人：按**看得见的角色**绑定语言，不要叠词；口音搭配节奏与情绪。这些是**可引导目标，不是精确控制器**。

diner、aurora EN/DE、greenhouse ES/FR、Hindi chai 全文见 [示例库 · 音频](./examples/#视频音频与对白)。

### 图生视频

| 模式 | 用法 |
|---|---|
| 单张 startframe | 从静帧出发 |
| start + end | reveal / transformation / loop |
| 多关键帧 | 中间帧均分；或 `[seconds, image]` 钉时间 |

帧距要现实，风格前后一致。Rising sea、city day-cycle 全文见示例库。显式 duration 见上节矛盾处。

## 7. Video API

`POST https://api.bfl.ai/v1/flux-3-video`。`mode`：`t2v`（`text-to-video`）、`i2v`（`image-continuation`）、`v2v`（`video-continuation`）、`draft_enhance`（`draft-enhance`）。拼写别名与短键都接受。

| 字段 | 适用 | 说明 |
|---|---|---|
| `prompt` | t2v/i2v/v2v | 必填（enhance 靠 bundle） |
| `duration` | t2v/i2v：5–20 或 `auto`；v2v：5–15 或 `auto` | 整秒 |
| `aspect_ratio` | | `auto` / `21:9` / `2:1` / `16:9` / `4:3` / `1:1` / `3:4` / `9:16` / `9:21` |
| `resolution` | | `hd`（默认）/ `fhd` / `qhd` / `uhd`；尺寸为 32 的倍数。`uhd` 16:9 = **3840×2176**（不是 3840×2160） |
| `generate_audio` | | 默认 `true` |
| `safety_tolerance` | 0–4，默认 2 | 色情最高 3，仇恨最高 2 |
| `draft` | | `true` 返回 hd 预览 + `draft_cache`；约 **1/3** 全价。draft 只能 `hd` |
| `draft_cache` | `draft_enhance` | 预览 bundle；enhance 默认 `fhd` |
| `keyframes` | i2v | 1–10；或 `[seconds, image]` 对 |
| `start_video` | v2v | mp4，URL 或 base64 |
| `user` | | 调用方提供的不透明用户 id，1–256 |
| `version` | | `latest` |
| `webhook_url` | Cookbook / webhook 响应 | 完成时 POST，可代替轮询 |

FLUX Video Edit [fast]：**独立**端点 `POST /v1/flux-tools/video-edit-v1`，字段是 `video` + `prompt`，**没有 `mode`**。

输出 24 fps，预览模型，最长约 20s、最高约 4K。**Omni Reference with images and videos** 即将提供。结果 URL 签名，**约 2 小时**过期。

| Mode | 你发送 | 时长 | 全价 / 秒（hd / fhd / qhd / uhd） | Draft |
|---|---|---|---|---|
| Text to Video | prompt | 5–20 s | $0.17 / $0.29 / $0.40 / $0.80 | $0.06/s |
| Image to Video | prompt + 1–10 images | 5–20 s | $0.17 / $0.29 / $0.40 / $0.80 | $0.06/s |
| Video Continuation | prompt + clip | 5–15 s | $0.41 / $0.53 / $0.65 / $0.95 | $0.12/s |

分辨率表（官方）：

| Aspect | hd | fhd | qhd | uhd |
|---|---|---|---|---|
| 21:9 | 1440×608 | 2176×928 | 2912×1248 | 4352×1856 |
| 2:1 | 1344×672 | 2016×1024 | 2720×1376 | 4032×2048 |
| 16:9 | 1280×704 | 1920×1088 | 2560×1440 | 3840×2176 |
| 4:3 | 1088×800 | 1632×1216 | 2176×1632 | 3264×2432 |
| 1:1 | 960×960 | 1440×1440 | 1920×1920 | 2880×2880 |
| 3:4 | 800×1088 | 1216×1632 | 1632×2176 | 2432×3264 |
| 9:16 | 704×1280 | 1088×1920 | 1440×2560 | 2176×3840 |
| 9:21 | 608×1440 | 928×2176 | 1248×2912 | 1856×4352 |

API 示例（alley t2v/i2v/v2v、fox、seed→tree、2D fox、FLUX kinetic title）见示例库。

相机术语 **119** 条、**14** 组（各含 description + example prompt）在 [相机术语表](./camera-terms/)，数据来自该页 `CAMERA_TERMS`，不是「文档没有列表」。

## 8. Cookbook

四篇 cookbook 走 `flux-3-preview-high`，形与主 API 不同（见矛盾处）。状态流同样经过 `Pending` → `Reasoning` → `Generating` → `Ready`。

### quickstart

- 说话者需要**被描述的嘴**（或会开合的部位）：捕蝇草例把 trap-lobes 当嘴。
- **数拍子**是承重技巧：打字机「自己打」vs 一键一拍的对照。
- 只在能说出理由时钉 `aspect_ratio` / `duration` / `resolution`。
- 语音陷阱：改成 voiceover + `"These are the only words"`，并写 no captions / no subtitles，避免字幕烧进画面。
- 并发 **5 / org**，超出 → `429 (too many active tasks)`。延迟以分钟计。可用 `webhook_url`。
- 设定表：`480p` / `720p`（默认 720p）；`duration` 5–20 或 auto。

### start_from_images

- 写**运动**，不要重述已经在图里的场景。
- 双关键帧钉结尾仍偏实验；收束帧 = `duration × 24`；duration 用整数。
- `reference_images`：多视角设定表，重列锚点，**不要出现在画面上**。
- `keyframes` + `reference_images` 同时发送 → **422**。
- 5 秒只能装一句短台词。

### recast_continue

- `reference_video`（重演/换媒介/换场景）vs 主 API 的 `start_video`（从末帧续）。
- 换媒介要重述调度（默片换声）；同一卡司新镜头可省略旧调度。
- 续写：先点名末帧；`duration` 只计**新增**段；声音穿过接缝。
- 机械主体要把不完美写进去。
- 输入 ≤ **50MB**、≤ **15s**；默认 720p 的 `reference_video` 输出封顶 15s。

### multishot_films

- 相邻镜头景别要差得很大。
- 一条音频床；每次生成 **2–3** 个镜头。
- world bible **原文粘贴**；每镜布置音频母题；一镜一拍。
- exactly-once 指令；language lock。
- 动作约 5s，对白 10–20s。

flytrap、typewriter 对照及其他 cookbook prompt 全文在 [示例库 · Cookbook](./examples/#cookbook)。

## 9. 常见错误与调参

| 问题 | 文档对策 |
|---|---|
| 未知字段 / 空 prompt / 图 <256 | `422`，看 `detail` |
| 参考图 >16MP | `400`，先缩小 |
| 小框里的新物体消失 | 框大约 40 × 25 **pixels** 常不出现 |
| 颜色不准 | 检查结果；hex 绑到物体；需要事实时保持 `grounding: true` |
| 视频对白变字幕 | 描述嘴 + `These are the only words` + no captions |
| 短片塞太多说话人 | 拆场 |
| 并发打满 | 等槽，不要死循环重试 429 |
| 结果链失效 | 图 1h；视频约 2h |
| cookbook 与主 API 混用字段 | 见矛盾处，按你实际打的端点选字段 |

一次只改一个变量。先 `768sq` 或视频 `draft: true`。

## 10. 来源

索引：[https://docs.bfl.ml/llms.txt](https://docs.bfl.ml/llms.txt)（2026-10-08）。

- Image：[overview](https://docs.bfl.ml/flux_3/flux3_image_overview) · [generate](https://docs.bfl.ml/flux_3/flux3_image_generate) · [layout](https://docs.bfl.ml/flux_3/flux3_image_layout) · [bounding boxes](https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes) · [API](https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3)
- Prompting：[summary](https://docs.bfl.ml/guides/prompting_summary) · [basics](https://docs.bfl.ml/guides/prompting_unified_basics) · [building](https://docs.bfl.ml/guides/prompting_unified_building) · [style](https://docs.bfl.ml/guides/prompting_unified_style) · [reference](https://docs.bfl.ml/guides/prompting_unified_reference) · [technical](https://docs.bfl.ml/guides/prompting_unified_technical) · [layout](https://docs.bfl.ml/guides/prompting_layout) · editing overview / single / multi
- Video：[overview](https://docs.bfl.ml/guides/prompting_video_overview) · t2v / i2v / audio / editing / [camera terms](https://docs.bfl.ml/guides/prompting_video_camera_terms) · [FLUX 3 Video](https://docs.bfl.ml/flux_3/flux3_video) · [FLUX 3 overview](https://docs.bfl.ml/flux_3/flux3_overview) · [Video API](https://docs.bfl.ml/api-reference/utility/generate-a-video-with-flux-3)
- Cookbook：quickstart · start_from_images · recast_continue · multishot_films
