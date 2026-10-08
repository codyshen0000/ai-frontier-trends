# FLUX 3 提示词速查表

整理自 Black Forest Labs 官方文档。检索日期：**2026-10-08**。说明用中文，**示例 prompt 保持官方英文原文**。未在文档出现的参数、字段、上限或例子一律不写；若夹带自拟说明会标「示例（非官方）」。部分用例页写的是 FLUX.2，文中会标明。

- [一页总览](#1-一页总览)
- [文生图](#2-文生图)
- [编辑](#3-编辑)
- [bbox 布局](#4-bbox-布局)
- [视频](#5-视频)
- [常见错误与调参](#6-常见错误-调参流程)
- [来源](#7-来源)

## 1. 一页总览

来源：[FLUX Prompting Guide](https://docs.bfl.ml/guides/prompting_summary.md)、[Prompting Basics](https://docs.bfl.ml/guides/prompting_unified_basics.md)、[Technical Parameters](https://docs.bfl.ml/guides/prompting_unified_technical.md)、[Prompt Reference](https://docs.bfl.ml/guides/prompting_unified_reference.md)。

1. **用自然语言写完成图**：主体、场景、风格、光线、构图。短句也能生成；只把你要锁死的细节写进去（位置、光线、文字）。
2. **有用的词序习惯**：媒介/风格 → 主体与位置 → 光线、颜色、背景。最重要的放最前。不要堆 `masterpiece`、`beautiful`、`iconic`。
3. **没有负向字段**：FLUX 3 Image 没有 `negative_prompt`、`guidance`、`seed`、`prompt_upsampling`。未知字段返回 `422`。负向说法改成正向描述。
4. **引用参考图用位次**：`images` 最多 10 张，每张至少 256×256、至多 16 MP。提示词里写 `image 1` / `image 2`。没有单独的 `mode` 字段。
5. **要印出的字加引号**：写出位置和字体；`\n` 表示换行。多行海报给每块字单独 bbox。
6. **精确颜色用 hex，并绑到一个物体**：如 `change the color of only one bird in the middle to #e01075`。
7. **布局 = 正文 caption + JSON 元素表**：caption 里用 `<id>`，坐标 `[top, left, bottom, right]`，整数 0–1000。整段放进 `prompt`，没有单独的 box 参数。
8. **编辑写成指令**：点名改什么、改成什么、什么保持不变。`aspect_ratio: "auto"` 默认跟第一张参考图。
9. **视频当导演，不当物体清单**：写动作、运镜、节奏、声音。多镜头用 `HARD CUT`。六段 schema 只是可选格式。
10. **先低分辨率试词**：文生图用 `768sq` 最快；没有 `seed`，同一 prompt 两次可以不同。一次只改一个要点。

一句话文生图官方例：

| 说明 | 官方 prompt |
|---|---|
| 超宽海岸公路，配合 `21:9` | `Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cliffs on one side, turquoise sea on the other, a single vintage car with headlights on, soft golden rim light` |
| 短场景 | `Two red pandas resting on bamboo beams, one looking relaxed and the other asleep. Their reddish-brown fur and white facial markings stand out against the soft, blurred natural background, suggesting a peaceful, sunny environment.` |
| 风格迁移（image 1 主体，image 2 风格） | `Turn Image 1 in the Style of Image 2` |

## 2. 文生图

来源：[Building a Good Prompt](https://docs.bfl.ml/guides/prompting_unified_building.md)、[Style, Aesthetics & Text](https://docs.bfl.ml/guides/prompting_unified_style.md)、[Technical Parameters](https://docs.bfl.ml/guides/prompting_unified_technical.md)、[Prompt Reference](https://docs.bfl.ml/guides/prompting_unified_reference.md)。

### 结构与词序

文档给出的起步模板（不是死公式）：

```text
[Subject], [location], [style], [camera settings], [lighting], [colors], [effect], [additional elements]
```

FLUX 3 发布稿 caption 大致顺序：

1. 图像类型与媒介：`High-angle black and white photograph with a grainy film texture`
2. 主体：`Two red pandas resting on bamboo beams, one looking relaxed and the other asleep`
3. 场景：`a fog-drenched coastal highway, cliffs on one side, turquoise sea on the other`
4. 光线：`soft golden rim light`
5. 取景与细节：`ultra-wide shot`、`shallow depth of field`

| 组件 | 控制什么 | 官方例子 |
|---|---|---|
| Image type | 类别/取景 | `portrait`, `landscape`, `macro` |
| Subject | 主对象 | `a young woman with curly red hair` |
| Location | 环境 | `in a futuristic space station` |
| Style | 视觉方向 | `editorial photography`, `anime illustration` |
| Camera settings | 镜头与景深 | `85mm lens, shallow depth of field` |
| Lighting | 怎么打光 | `soft window light`, `golden hour sunlight` |
| Colors | 主色 | `muted earth tones`, `deep green and cream` |
| Effect | 额外处理 | `motion blur`, `film grain`, `soft bloom` |
| Additional elements | 陪体 | `wind-blown fabric, falling leaves` |

从短到长（官方逐步扩写）：

| 说明 | 官方 prompt |
|---|---|
| 只有类型+主体 | `portrait, a young woman with curly red hair` |
| 加地点 | `portrait, a young woman with curly red hair, in a bustling city street` |
| 加风格与镜头 | `portrait, a young woman with curly red hair, in a bustling city street, fashion editorial photography, 85mm lens, soft golden hour light` |
| 再加颜色与细节 | `portrait, a young woman with curly red hair, in a bustling city street, fashion editorial photography, 85mm lens, soft golden hour light, warm amber and charcoal tones, subtle film grain, wind-blown hair and blurred city lights` |
| 同一内容改成句子 | `A young woman with curly red hair stands on a bustling city street, her hair blown sideways by the wind. Behind her, the city lights blur into soft circles. Soft golden hour light falls on her face from the left. Portrait framing at eye level with an 85mm lens and a shallow depth of field. Fashion editorial photography in warm amber and charcoal tones, with subtle film grain.` |
| 简单 vs 有指向 | `A dog sitting in a sunny park` |
| 有指向（品种、动作、室内、镜头） | `A golden retriever mid-leap chasing a tennis ball across a sunlit hardwood floor in a cozy living room, a trail of muddy paw prints on the floor behind it, leading back toward the open doorway, warm afternoon light streaming through sheer curtains, shallow depth of field, candid pet photography, 35mm lens` |

取景若被环境带宽：把主体和景别放前面。

| 说明 | 官方 prompt |
|---|---|
| 容易拍得过宽 | `Person standing inside a forest fire, strong determined attitude, close-up shot, realistic` |
| 更可控 | `Person with a strong determined expression, forest fire in the background, close-up shot, realistic` |

16 词想法 vs 186 词 caption（芭蕾）：短句是 `Three ballerinas dancing Swan Lake, seen from the wings past the dark silhouettes of people watching.` 完整 caption 会先写媒介，再写从侧幕看的机位、浅景深虚化、白色 tutu、追光、冷紫黑阴影、手边白光球。文档强调：写能指到画面上的东西，不要靠剧名暗示。

短 prompt 与展开 caption 对照（官方）：

- 短：`Four men in dark suits cross a sunlit rooftop, a busy avenue far below.`
- 展开：`High-angle black and white photograph with a grainy film texture. In the right foreground, a brightly lit, pale, flat rooftop anchors the composition. Four men in dark suits walk in mid-stride towards the right edge of the building, rendered almost entirely as silhouettes against the stark surface. They cast long, sharp diagonal shadows that stretch out before them under harsh, directional lighting. To the left, a plunging view reveals a deep urban canyon and a congested city street far below, bisecting the dense architecture. The avenue is packed with a multitude of cars and buses appearing as small dark shapes, alongside tiny figures of pedestrians dotting the sidewalks and crosswalks. The street is sharply split by light and shadow, with the left side plunged into deep darkness while the right catches intense sunlight. A faint haze or smoke drifts near the lower central portion of the canyon. The background is filled with towering, monolithic skyscrapers featuring repetitive grids of windows. The buildings recede into the distance, their details softening in the atmospheric perspective.`

### 风格 / 相机 / 镜头 / 光线词汇

摄影风格表：

| 风格 | 官方关键词 |
|---|---|
| Modern Digital | `shot on Sony A7IV, clean sharp, high dynamic range` |
| 2000s Digicam | `early digital camera, slight noise, flash photography, candid, 2000s digicam style` |
| 80s Vintage | `film grain, warm color cast, soft focus, 80s vintage photo` |
| Analog Film | `shot on Kodak Portra 400, natural grain, organic colors` |

| 说明 | 官方 prompt |
|---|---|
| 现代写实野生动物 | `A close-up wildlife photograph of a soaking-wet tiger cub sheltering beneath a broad banana leaf in a rainy jungle. The leaf arches just above the cub, raindrops gather along its edge, and wet fur clumps into fine strands around the cub's eyes and muzzle. Soft daylight filtered through the canopy lights the face; the deeper green foliage falls out of focus behind it. The face and front paws remain clearly visible beneath the leaf.` |
| 2000s 数码相机 | `Sloth out drinking in Bangkok at night in a street full of party folks, 2000s digicam style, people in the background fading` |
| 80s 复古 | `A group of baby penguins in a trampoline park, having the time of their lives, 80s vintage photo` |
| 早期 2000s 家庭合影 | `An old faded family portrait photograph from the early 2000s showing a family of five standing stiffly in front of their modest wooden farmhouse` |
| 相机模拟 | `Shot on Hasselblad X2D, 80mm lens, f/2.8, natural lighting` |
| 相机模拟 | `Canon 5D Mark IV, 24-70mm at 35mm, golden hour, shallow depth of field` |
| 点名机身+镜头，不要写 professional photo | `Shot on Fujifilm X-T5, 35mm f/1.4` |

FLUX 3 发布稿开头句（设媒介）：

- `Full-color indoor 35mm photograph with a slight film grain and a warm color cast, lit by harsh, direct camera flash that casts sharp shadows against the background.`
- `High-angle, full-color 35mm indoor-outdoor film photograph captured at night, featuring visible grain, deep shadows, and a shallow depth of field that renders the foreground in an atmospheric blur.`
- Tokyo 海报：`A stylized digital illustration in a flat, graphic anime style, resembling a modern pop-art poster with non-directional, uniform lighting.`
- 虎海报：`Full-color digital scan of a flat, vertical graphic design poster exhibiting a minimalist, mid-century Japanese aesthetic and a two-dimensional, screen-printed quality.`

光线要写来源、方向、质地、色温、落在什么表面上：

| 官方光线句子 |
|---|
| `lit by harsh, direct camera flash that casts sharp shadows against the background` |
| `A strong spotlight illuminates the center of the stage, casting long, soft shadows across the floor and highlighting the stiff tulle of the costumes` |
| `Dappled natural sunlight filters through the trees, creating bright highlights against earthy brown and deep green shadows` |
| `under flat, even studio-style lighting` |
| `soft, diffused natural light filtering through sheer curtains` |
| `dramatic side lighting creating deep shadows and highlights` |
| `golden hour backlighting with lens flare` |
| `overcast light creating even, shadow-free illumination` |

下列光线短语标为**更早 FLUX 模型**文档例：`Portrait with Rembrandt lighting, key light at 45 degrees, dramatic chiaroscuro effect`；`Artistic portrait, split lighting, strong side illumination, dramatic contrast`；`Film noir detective scene, single practical desk lamp, strong chiaroscuro lighting`；`Cyberpunk street scene, neon signs and LED strips providing atmospheric lighting`。

相机与构图速查（[Prompt Reference](https://docs.bfl.ml/guides/prompting_unified_reference.md)）：

| 术语 | 效果 |
|---|---|
| `f/1.4` – `f/2.8` | 浅景深、背景虚 |
| `f/8` – `f/16` | 深景深、都清楚 |
| `24mm` | 广角，场面更大 |
| `35mm` | 纪实、自然透视 |
| `50mm` | 平视、中性 |
| `85mm` | 人像、轻度压缩 |
| `135mm+` | 长焦、强压缩 |
| `ISO 100` | 干净 |
| `ISO 1600–3200` | 更亮但有颗粒 |
| `Macro lens` | 极端特写 |
| `Anamorphic lens` | 宽银幕、椭圆焦外 |

| 光线词 | 效果 |
|---|---|
| Golden hour | 日出后/日落前，暖而柔 |
| Blue hour | 日出前/日落后，冷、情绪 |
| Overcast | 平、匀、少影，适合产品 |
| Rembrandt lighting | 脸上三角形光 |
| Split lighting | 半脸亮 |
| Chiaroscuro | 强明暗 |
| Backlit / rim light | 轮廓发光 |
| Soft box / key light | 棚拍可控 |
| Practical lighting | 画面里看得见灯 |
| Diffused light | 包裹、少影 |
| Harsh direct light | 硬影、高反差 |

构图短语：`composed using rule of thirds`；`diagonal lines leading to main entrance`；`strong foreground boulder, background mountains`；`low angle worm's eye view, dramatic diagonal lines`；`bird's eye view, geometric patterns of city blocks`；`dutch angle, psychological tension`；`perfectly symmetrical composition`；`minimalist composition with generous negative space`。

取景词（building 页）：`close-up`、`medium shot`、`wide shot`、`overhead view`、`point-of-view shot`、`dutch angle`、`low-angle shot`。

 realism 不要写 `highly detailed` / `ultrarealistic`，改写可见现象：`visible grain`、`slight chromatic aberration at the edges`、`the foreground rendered in an atmospheric blur`、`sharp texture detail on the bark`。

### 文字渲染

FLUX 3：每块字写三件事——**引号里的原文**、**位置**、**字体样子**。

| 步骤 | 官方说法 |
|---|---|
| 引用原文 | `"東京"`、`"Cabin"`、`"LE FESTIVAL DU SOLEIL"` |
| 位置 | `runs down the left side of the frame`；`At the bottom center, a line of bright text … sits directly above a smaller line of text` |
| 字体 | `Large, bold red kanji and katakana characters arranged vertically, featuring distressed, spray-paint-like edges`；`a clean, sans-serif black font` |

Tokyo 海报元素（caption 位置 + `desc` 原文）：

| Box | 位置（caption） | 字与字体（`desc`） |
|---|---|---|
| `Ja_Text_1` | runs down the left side of the frame | Large, bold red kanji and katakana characters arranged vertically, featuring distressed, spray-paint-like edges. The text reads `"ストリート\n悪魔"`. |
| `Ja_Text_2` | positioned in the upper right section | The text reads `"東京"`. |
| `Ja_Text_3` | In the lower right corner rests a square seal | The text reads `"印"`. |
| `Ja_Text_4` | At the bottom center | `"たうのさん"` in a vibrant yellow, clean, flat sans-serif font |
| `Unknown_Text_1` | 其下更小一行 | `"ORIGINAL ARTWORK"` |

`\n` 表示换行；`arranged vertically` 表示竖排。标题带 `LE FESTIVAL DU SOLEIL` 的细条 bbox 是 `[40, 200, 100, 800]`。无 bbox 时用文字写位置：`Below the scene, bold serif typography reads "…"`。

短字可以不配布局（后四条文档标为 FLUX.2 同模式）：

| 说明 | 官方 prompt |
|---|---|
| 霓虹 OPEN | `A Entry of a Sushi Restaurant, The text 'OPEN' appears in red neon letters above the door` |
| 产品广告 | `Samsung Galaxy S25 Ultra product advertisement, 'Ultra-strong titanium' headline, 'Shielded in a strong titanium frame, your Galaxy S25 Ultra always stays protected' subtext, close-up of phone edge showing titanium frame, dark gradient background, clean minimalist tech aesthetic, professional product photography` |
| 复古海报 | `Groovy retro poster with the quote "If you love me let me sleep". Bold 70s typography in deep red and warm pink tones. Cream background and bold orange doodle around the text. Funky layout with playful shadow. Style: bold vintage aesthetic, dopamine decor` |
| 杂志封面 | `Women's Health magazine cover, April 2025 issue, 'Spring forward' headline, woman in green outfit sitting on orange blocks, white sneakers, 'Covid: five years on' feature text, '15 skincare habits' callout, professional editorial photography, magazine layout with multiple text elements` |

字体效果对照：`raised chrome letters with realistic metal reflections`；`glowing neon text with electric blue light`；`weathered painted text with chipped paint and rust`；`carved directly into the ancient stone wall`；`printed on a newspaper being read by the character`。字体名可当比较：`a bold, white sans-serif typeface reminiscent of Helvetica or Inter`。

### 画幅与分辨率

`aspect_ratio` 为 15 个固定比，或 `auto`：`21:9`、`2:1`、`16:9`、`3:2`、`7:5`、`4:3`、`5:4`、`1:1`、`4:5`、`3:4`、`5:7`、`2:3`、`9:16`、`1:2`、`9:21`。

`auto` 跟 `images` 第一张；没有参考图时是 `1:1`，所以非正方形文生图要自己设。编辑时 `auto` 通常保持输入画幅。布局 prompt 必须设成你画框时用的那个比，网格会跟着画幅拉伸。

| 比例 | 形状 | 适合 |
|---|---|---|
| `21:9`, `2:1` | 超宽 | 电影感风景、全景、网站横幅 |
| `16:9` | 宽屏 | 横向运动、页头、幻灯、视频封面 |
| `3:2`, `7:5`, `4:3` | 横向照片 | 街拍、纪实、室内、群像 |
| `5:4`, `1:1`, `4:5` | 近方形 | 产品、单人像、社交帖、标志 |
| `3:4`, `5:7`, `2:3` | 竖幅 | 海报、杂志封面、全身时装 |
| `9:16`, `1:2`, `9:21` | 很高 | 手机屏、stories、竖幅、塔与瀑布 |

`21:9` 要在 prompt 里写满宽度：`cliffs on one side, turquoise sea on the other`。同一句放进 `9:16` 会把两侧挤进窄条。

| `resolution` | 用途 |
|---|---|
| `768sq` | 改词时的快草稿 |
| `1k` | 默认，多数网页/App |
| `2k` | 印刷、头图、要细节的裁切 |
| `4k` | 最大输出，可能要几分钟 |

提交响应里的 `output_mp` 是实际兆像素。改分辨率是一次新生成，构图可能和草稿不同。

### 负向 → 正向对照

没有负向提示字段。策略：认出不要的东西 → 问那块空间里该看见什么 → 直接写那个。

| 不要写 | 改写成 |
|---|---|
| “no people” | “empty”, “deserted”, “solitary” |
| “no colors” | “monochrome”, “black and white”, “grayscale” |
| “no text” | “clean surfaces”, “unmarked”, “blank” |
| “no background clutter” | “plain studio backdrop in one color” |
| “no modern elements” | “traditional”, “historical”, “period-accurate” |
| “not dark” | “brightly lit”, “sun-drenched” |
| “not sad” | “joyful”, “content” |
| “not running” | “walking slowly”, “standing still” |
| “not many” | “few”, “single”, “minimal” |

更多官方替换：`a street with no cars` → `a quiet pedestrian walkway with cobblestones`；`a landscape without buildings` → `untouched wilderness with open natural terrain`；`a room with no furniture` → `a spacious empty room with polished wooden floors`；`a person without a hat` → `a person with loose hair falling to the shoulders`；`a portrait with no glasses` → `a portrait showing clear, unobstructed eyes`；`not dark or scary` → `a warm, welcoming atmosphere with soft golden lighting`；`not too realistic` → `stylized illustration with simplified forms and bold color blocks`；`portrait with no background distractions` → `portrait with a smooth gradient background from deep blue to black`。

海滩递进（官方）：`A beach` → `An empty beach with palm trees and gentle waves` → `An empty beach with palm trees and gentle waves at golden sunset. Wide cinematic framing from the sand, a clean level horizon and the shoreline curving gently into the distance. Low sunlight lights the edges of the palm fronds, warm gold reflects on the ripples, and the shaded sand stays softly cool. The beach remains open and undisturbed, with fine sand texture visible in the foreground.`

正向仍失败时：把替代物写更具体、放到开场句、补材料/颜色/动作、给情境（`a deserted beach at dawn, before the first swimmers arrive`）。**编辑里**「去掉某物」是指令不是否定：`Remove the cat from the sofa`。

### 用例：hex、JSON、字体、产品、角色（哪些适用于 FLUX 3）

**FLUX 3 已写明的 hex**：绑到一个被点名的物体。

```text
change the color of only one bird in the middle to #e01075
```

**[HEX Color Code Prompting](https://docs.bfl.ml/guides/usecases_t2i_hex_color_prompting.md) 写的是 FLUX.2**。句法仍是 `color` / `hex` + 代码。官方例：

| 说明（FLUX.2 页） | 官方 prompt |
|---|---|
| 单色物体 | `a vintage illustration of an apple in color #0047AB with a heart-shaped cutout in the middle, on a white background` |
| 多物体各绑一色 | `A modern living room with warm terracotta walls in hex #C4725A, a large L-shaped sectional sofa in deep teal hex #1B6B6F, and golden amber hex #E8A847 accent pillows, throw blanket, and a velvet ottoman.` |
| 向日葵 | `sunflower in color #C92695` |
| 液体构图 | `An aesthetically pleasant liquid lucid composition of predominantly wintery colors with deep, rich and saturated #00FF2F #0D00FF #FF0000` |
| 渐变花瓶 | `A vase on a table in living room, the color of the vase is a gradient, starting with color #02eb3c and finishing with color #edfa3c. The flowers inside the vase have the color #ff0088` |
| 径向渐变靠垫 | `A round silk throw pillow resting on a light gray linen sofa, the fabric of the pillow shows a radial gradient from rich purple (#6A0DAD) at the center fading outward to warm gold (#FFD700) at the edges, even ambient indoor lighting, close-up perspective.` |

警告（官方）：`use #FF0000 somewhere` 这类含糊绑定会不稳定。

**[JSON Structured Prompting](https://docs.bfl.ml/guides/usecases_t2i_json_prompting.md) 写的是 FLUX.2**：把 JSON **字符串**放进 `prompt`。FLUX 3 的布局 JSON 是 caption 后的 **元素表**，不是这套 scene/subjects schema。FLUX.2 基模：

```json
{
  "scene": "overall scene description",
  "subjects": [
    {
      "description": "detailed subject description",
      "position": "where in frame",
      "action": "what they're doing"
    }
  ],
  "style": "artistic style",
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "lighting": "lighting description",
  "mood": "emotional tone",
  "background": "background details",
  "composition": "framing and layout",
  "camera": {
    "angle": "camera angle",
    "lens": "lens type",
    "depth_of_field": "focus behavior"
  }
}
```

**产品**：FLUX 3 多参考可写 `the bottle from image 3, label facing the camera`。[Product Mockups](https://docs.bfl.ml/guides/usecases_t2i_product_mockups.md) 页未标模型，官方例：

```text
Luxury glass perfume bottle on a sunlit stone ledge in a Moroccan courtyard, intricate zellige tilework in the background, warm golden hour light casting long shadows, soft bokeh of orange trees and a fountain, editorial product photography, shot on Hasselblad X2D, 90mm lens, f/2.8
```

**角色一致性**：FLUX 3 用多参考 + 点名角色（`the woman in image 2`）。[Character & Style Consistency](https://docs.bfl.ml/guides/usecases_editing_character_consistency.md) 写的是 FLUX.2 multi-reference。官方例：`The couple from Image 2 is now standing in the middle of the street of Image 1, holding the same object. Apply the style of Image 1 to them as well, make them blend in a smooth way into the image, keep image 1 colors.`

## 3. 编辑

来源：[Image Editing](https://docs.bfl.ml/guides/prompting_editing_overview.md)、[Single-Reference Editing](https://docs.bfl.ml/guides/prompting_editing_single_reference.md)、[Multi-Reference Editing](https://docs.bfl.ml/guides/prompting_editing_multi_reference.md)、[Bounding boxes](https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes.md)。

同一 endpoint。没有 edit mode / mask / strength；`prompt` 说明怎么用 `images`。

| 字段 | 送什么 |
|---|---|
| `images` | 1–10 张，URL 或 base64。第一张是 image 1 |
| `prompt` | 指令。多图用 image 1、image 2 |
| `aspect_ratio` | 默认 `auto`，输出跟 image 1 的画幅 |

### 单参考：改什么 / 留什么

指令三部分：1）点名唯一目标；2）说清从何改成何；3）点名必须留下的细节。

| 要得到 | 写法 | 官方例子 |
|---|---|---|
| 目标色 | hex | `change the color of only one bird in the middle to #e01075` |
| 精确文字 | 引号 + 位置 | `Change the text on the neon sign to 'zum Schlappen'` |
| 特定位置 | 画面区域 | `On the lower left path, replace the tiny wolf with a cyberpunk dog` |
| 保留细节 | 点名细节 | `keeping all lace embroidery details white and fully visible` |

多处同时改：写成 edit record——点名图和操作 → 每处 where / what / into what → 列出留下的东西。

```text
In <ref_image_0>, change the large tiger <animal_1> and the small glowing butterfly <insect_1> to be pink. Keep the massive fallen log <log_1>, the falling snow <snow_1>, and the dark background trees <trees_1> exactly unchanged.
```

说明：同时改虎和蝴蝶颜色；原文档带 box 行。纯文字编辑可去掉 `<id>` 代币，句子结构不变。

```text
Modify <ref_image_0> by making three replacements. On the lower left path, replace the tiny anthropomorphic wolf with a cyberpunk dog <wolf_1>. On the lower right, replace the fallen frosted bamboo log with a fallen bamboo leaf made out of gold <log_1>. In the middle of the misty forest, replace the small dark bird perched on a branch with a bird made out of a robot <bird_1>. Keep the rest of the scene exactly unchanged, preserving the dense upper bamboo leaves <bamboo_1>, the vertical bamboo trunks <bamboo_2> receding into the fog, the frosted ground and lower stalks <bamboo_3>, the dramatic slanting sunbeams <light_1>, the thick foreground bamboo trunk <bamboo_4> on the right, the frozen stream <stream_1>, the stone lantern <lantern_1>, and the floating frost flakes <particles_1>.
```

迭代链（每步是对上一张的编辑）：

1. 起点：`A tall sharp-featured man in an oversized charcoal wool coat`
2. `Move the man to a wet cobblestone street at night. Keep his face, hair, coat, and pose the same.`
3. `Put a small, worn teddy bear in the man's hands. Keep everything else the same.`
4. `Add a dog walking beside the man on the cobblestones. Keep everything else the same.`
5. `Park a row of colorful vintage VW Beetles along the street behind him. Keep everything else the same.`

单图改法目录（标 FLUX.2 的是该页原注）：

| 类型 | 官方 prompt |
|---|---|
| 背景（FLUX.2） | `Place this can on top of a minimalistic black shiny surface on black background` |
| 背景 | `a professional high end product shot of this bottle in a pile of fresh wet strawberries on white background, studio lighting` |
| 背景 | `Replace the background with a warm cozy home environment.` |
| 风格 | `Turn the image into an oil painting with thick, textured brushstrokes` |
| 风格 | `Transform the architectural illustration from image 1 into a fully realistic house, natural lighting, real textures for walls windows and roof, realistic landscaping around the house, accurate shadows, real materials such as wood stone and glass, high resolution photorealism, clean perspective, keep the proportions and layout exactly as in the illustration while turning every element into a believable real world version.` |
| 物体 | `Remove all of the sprinkles while keeping the rest of the image unchanged` |
| 物体 | `Replace the flower in image 1 with a slice of lemon` |
| 物体 | `Add small goblins climbing the right wall of the gorge` |
| 物体 | `Replace the DJ with a polar bear without headphones` |
| 物体 | `Replace the cherries in the right-most jar with multi-colored sprinkles. Change nothing else` |
| 颜色 | `Recolor only the white and black FUR of the cow. White fur becomes light muted green-teal #8bc4bb, and black fur patches become warm red-orange #de4528. Keep the exact patch shapes, fur texture, original shadows and grazing pose. The smooth bare nose and muzzle stay their ORIGINAL pale pink-beige color; exclude them completely from recoloring.` |
| 材质 | `The butterfly is now made of shiny silver` |
| 天气 | `Change it to Night` / `Change this to Winter` |
| 文字 | `On the top polaroid photo, diagonally, write in handwritten pink marker: "2020 <3"` |
| 文字 | `Change only the wording on the neon sign to the exact text "zum Schlappen". Keep the original sign's placement, mounting, glow color, perspective and the surrounding nighttime street scene.` |
| 试穿 | `Change the woman's outfit to a bold fuchsia pink dress against a green studio gradient background.` |
| 试穿+hex | `Add a short fluffy jacket on her colored #778899, and a hat in the same fluffy style, colored #98AFC7. Keep her pose` |
| 姿态 | `The woman is now looking at the camera` |

模糊 → 具体（官方）：

| 不要写 | 改写成 |
|---|---|
| Make it better | Warm the light to late-afternoon sun and soften the shadows on her face. Keep the background unchanged. |
| Change the shirt | Change the man’s grey T-shirt to #c0392b, keeping the print on the front. |
| Remove the car（画面有两辆） | Remove the white car parked on the right. Keep the red car and the street unchanged. |
| Add some text | Add the words ‘Open late’ in white sans-serif letters on the shop window. |

### 多参考：image N、谁定画幅

最多 10 张。始终用同一套叫法：image 1、image 2。`aspect_ratio: "auto"` 跟 **第一张**。要把某张图的画幅带进输出，就把它放第一，或显式设 `aspect_ratio`。

| 角色 | 提供什么 | 官方措辞 |
|---|---|---|
| Subject | 要能认出的人/动物 | `the woman in image 2` |
| Product | 形状、颜色、标签 | `the bottle from image 3, label facing the camera` |
| Setting | 场景 | `the kitchen in image 1` |
| Style | 调色、媒介、纹理、光 | `in the style of image 4` |

还要写关系，不只零件：`the woman in image 2 sits on the swing in image 1, with the cat from image 3 on her lap.`

| 说明 | 官方 prompt |
|---|---|
| 风格迁移 | `Turn Image 1 in the Style of Image 2` |
| 物体放进另一张，并跟光 | `replace the cartridge from image 1 with the van in image 2, adjust the lighting on the van to integrate well within image 1` |
| 四参考：画印到硬币 | `Paint the artwork from images 2, 3, and 4 onto the coins in image 1.` |
| 塔沉入海 | `Make the building from image 2 appear to be sinking into the water from image 1.` |
| 糖做的刀 | `Take the shape of the knife from image 2 and recreate it entirely out of Skittles like in image 1, keeping the full knife silhouette but formed from colorful Skittles arranged tightly together, on the same background of image 1.` |
| 只换材质 | `Replace the material of the heart so that it looks like the same wrinkled white paper texture from the second image.` |
| 动物进浴缸（FLUX 3） | `Take the animal from image 2 and place it naturally inside the bathtub from image 1. Fill the tub with water and bubbles, and add a rubber duck on the animal's head.` |
| 图案上釉（FLUX 3） | `Apply the exact colors and repeating pattern from image 2 to the glazed surface of the plate in image 1. Keep the plate's shape, rim, position, camera angle, table and lighting unchanged.` |
| 灌液体（FLUX 3） | `Fill the bottles in image 1 with the liquid from image 2, matching the color, texture, and translucency of the liquid. Then replace the pile of foam in image 1 with a realistic puddle of the liquid from image 2.` |
| 标志刻树（FLUX 3） | `Engrave the logo from image 2 into the tree trunk in image 1` |

模糊 → 具体：不要写 `Combine these images`，写 `Place the couple from image 2 at the table in image 4, with the view from image 1 through the window.`

### Box 行编辑：recolor / move / replace / remove

书面指令够用时：画面里只有一件东西对得上描述。改用 box 行，当：多件相似只要改一件；需要精确位置或尺寸；要移动/缩放并保持外观；要去掉一件并填洞；要钉住若干元素再改别的。

| 行类型 | `from` | `src_bbox` | `tgt_bbox` | 效果 |
|---|---|---|---|---|
| Keep | `"ref_image_0"` | 原框 | 同一框 | 留在原地 |
| Move | `"ref_image_0"` | 原框 | 新框 | 移动或缩放 |
| New | `null` | `null` | 目标框 | 在框里按 `desc` 生成：加、换、重上色 |
| Remove | `"ref_image_0"` | 原框 | `null` | 去掉，填上后面的内容 |

`ref_image_0` 是 `images` 第一张，`ref_image_1` 是第二张。

移动（官方 instruction）：

```text
In <ref_image_0>, move the miniature grey amigurumi knight figure <knight_1> upwards and to the left along the yarn cliff <cliff_1>. Keep the rest of the image completely unchanged, preserving the blurred yarn backdrop <backdrop_1>, the large knitted dragon <dragon_1>, and the fiery orange thread <fire_1>.
```

Move 行：

```json
{"id": "knight_1", "from": "ref_image_0", "src_bbox": [500, 150, 850, 350], "tgt_bbox": [194, 55, 544, 255], "desc": "A miniature amigurumi knight crocheted from thick grey woolen yarn."}
```

Replace / recolor（New 行，可多条）：

```json
[
  {"id": "wolf_1", "from": null, "src_bbox": null, "tgt_bbox": [817, 120, 950, 167], "desc": "a cyberpunk dog"},
  {"id": "log_1", "from": null, "src_bbox": null, "tgt_bbox": [850, 600, 950, 850], "desc": "a fallen bamboo leaf made out of gold"},
  {"id": "bird_1", "from": null, "src_bbox": null, "tgt_bbox": [450, 500, 480, 530], "desc": "a bird made out of a robot"}
]
```

Remove：

```json
{"id": "cat_1", "from": "ref_image_0", "src_bbox": [265, 40, 855, 400], "tgt_bbox": null, "desc": "An orange tabby cat sitting on a folded blanket."}
```

多参考放置：`from: "ref_image_1"` 表示从第二张取物；`src_bbox` 圈源，`tgt_bbox` 圈输出位置。文档里的房间+灯坐标标明是 **illustrative**，要在自己的图上量。放置是强提示不是硬约束，多参考时物体可能略超出框。

## 4. bbox 布局

来源：[Layout prompts](https://docs.bfl.ml/guides/prompting_layout.md)、[FLUX 3 Image Editing](https://docs.bfl.ml/flux_3/flux3_image_layout.md)、[Bounding boxes](https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes.md)。

### Caption + `<id>` + JSON

先写整图说明，在元素旁写 `<id>`（小写+数字），再空一格接 JSON 数组。全部放进 `prompt`。

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame.
```

```json
[
  {"id": "background_1", "bbox": [0, 0, 1000, 1000], "desc": "A flat field of neon yellow-green with a subtle paper texture and fine, organic grain."},
  {"id": "silhouette_1", "bbox": [150, 150, 850, 850], "desc": "A black silhouette of a person in motion, made of dense stippled ink. The leading edges are solid; the trailing arm and leg dissolve into coarse square pixels and scattered dots."}
]
```

`[150, 150, 850, 850]` 是画面中间约 70%。冬景 caption 官方例：

```text
An outdoor photograph under overcast winter light. A woman <person_1> sits in the left foreground, facing right, holding a small Pomeranian <animal_1> in her lap. Spectators <crowd_1> are softly blurred behind her.
```

文字行的 `desc` 要引用原文：

```json
{
  "id": "title_1",
  "bbox": [40, 200, 100, 800],
  "desc": "Centered text reading \"LE FESTIVAL DU SOLEIL\" in a thin serif typeface, light cream."
}
```

| 字段 | 生成 | 编辑 |
|---|---|---|
| `id` | caption 里的 `<id>` | 同 |
| `desc` | 长什么样 | 编辑后长什么样 |
| `bbox` | 输出位置 | 改用 `src_bbox` / `tgt_bbox` |
| `from` | 不用 | 源参考，如 `ref_image_0`；`null` 表示在 `tgt_bbox` 新生成 |
| `src_bbox` | 不用 | 源图位置；`from: null` 时为 `null` |
| `tgt_bbox` | 不用 | 输出位置；`null` 表示删除 |

### 坐标

每个框是 **`[top, left, bottom, right]`**，整数 **0–1000**，从左上角量。`[0, 0, 500, 500]` 是左上四分之一，与像素尺寸、画幅无关。`[0, 0, 1000, 1000]` 铺满。

像素 → 网格（官方）：

```python
def to_bbox(left, top, right, bottom, width, height):
    return [round(top / height * 1000), round(left / width * 1000),
            round(bottom / height * 1000), round(right / width * 1000)]

to_bbox(384, 108, 1536, 972, 1920, 1080)  # [100, 200, 900, 800]
```

注意函数参数顺序是 left, top, right, bottom，返回却是 top, left, bottom, right。

### 尺寸、重叠、排错

- 先定 `aspect_ratio` 再画框。框对齐元素的预期范围。
- 物体重叠则框重叠；狗坐腿上时，狗框放在人框里面。
- 远处人群通常一个集合框。背景可铺满或只盖出现的区域（如人群上方的天）。
- 网格单位按轴相对。`2:3` 图上，正方形大约要 **宽 150、高 100** 这种比例。
- 框是构图引导，**不是裁切蒙版**。元素可以略超出框。
- 官方测试：大约 **40×25** 网格单位的新元素常常不出现，要给新东西空间。
- 每行字单独一行，`desc` 引用原文，如 `text reading "Sauna"`。
- 指令和表必须一致：增删都要在句子里再说一遍。
- 必须钉住的元素加 Keep 行。
- 位置错了：检查 caption 代币是否等于 `id`、坐标是不是 **y 在前 x 在后**、框是否适配画幅；caption 里也用文字写位置。

## 5. 视频

来源：[Video overview](https://docs.bfl.ml/guides/prompting_video_overview.md)、[Text-to-video](https://docs.bfl.ml/guides/prompting_video_text_to_video.md)、[Audio](https://docs.bfl.ml/guides/prompting_video_audio.md)、[Image-to-video](https://docs.bfl.ml/guides/prompting_video_image_to_video.md)、[Video editing](https://docs.bfl.ml/guides/prompting_video_editing.md)、[Camera terms](https://docs.bfl.ml/guides/prompting_video_camera_terms.md)。

| 工作流 | 模式/工具 | 用途 |
|---|---|---|
| Text-to-Video | `t2v` | 从零生成 |
| Image-to-Video | `i2v` | 静帧变视频 |
| Keyframes | `i2v` | 按序穿过若干帧 |
| Video Continuation | `v2v` | 续已有片段 |
| FLUX Video Edit | FLUX Tool | 改已有片段 |
| Omni Reference | — | 文档标 Soon |

把 prompt 当**导演**：动作、运镜、气氛。短 prompt 探索，长 prompt 锁细节。长度本身不是目标。

|  | 短 | 长 |
|---|---|---|
| 控制 | 模型补取景、运动、情绪 | 你指定场景、相机、节奏、声音 |
| 适合 | 快试、单一主体 | 特定镜头、多元素、稳定外观 |
| 风险 | 关键细节交给运气 | 塞太满运动会散 |

### 一行模板

```text
[camera] shot of [subject] [action] in [environment]. [supporting visual and motion details]
```

| 说明 | 官方 prompt |
|---|---|
| 短 | `A red fox leaping through fresh snow, telephoto.` |
| 长自然语言 | `A cozy ramen shop on a rainy Tokyo night: steam rising from the broth, neon reflections in the window puddles, the cook working calmly. The camera drifts slowly past the counter. Rain patter and quiet kitchen sounds.` |
| 跟踪+自然 | `A low tracking shot of a fox sprinting through wet pine undergrowth at dawn. Mist drifts between the trees as the camera keeps pace beside it. Cool blue morning light, fast but controlled motion, cinematic naturalism.` |
| POV | `POV shot of a boxer weaving through a dim training gym. Gloved hands rise into frame as the camera advances toward a heavy bag. Fluorescent lights buzz overhead, sharp footwork, quick bursts of impact, gritty documentary realism.` |
| 气象主播出镜 | `A weather presenter on camera in front of a stylized storm map, speaking to the lens: "Storm season is here — and this time, we're ready." Confident delivery, clean studio lighting. No on-screen text, no subtitles.` |
| 短→长（狐狸） | `A red fox stalks across a wide snowfield at dawn, low winter light, a dark treeline fading into mist behind it. It slows, crouches, then leaps high and pounces into the fresh snow. Telephoto lens, shallow depth of field, locked-off camera panning gently to follow. Muffled paw steps and a soft breeze.` |

迭代（官方）：`a video of an eagle` → `a closeup video of an eagle` → `a closeup video of an eagle, the eagle sits on a tree in a forest` → `a cinematic closeup of an eagle perched on a pine branch in a misty forest, feathers ruffling in the wind, slow push-in, golden-hour light`。

### 带标签字段

```text
Camera shot: wide shot, low angle
Subject + action: a lone rider crosses a shallow desert river
Depth of field: shallow (sharp on subject, blurred background)
Lighting + palette: warm backlight with soft rim — amber, cream, walnut
Motion: water splashes around the horse's legs, orange dust hangs in the light
Style: epic western realism
```

### Timestep 与 HARD CUT

5 秒左右写两三个拍点。换机位标 **hard cut**。

```text
0.0–1.5s — locked wide of a still harbor at dawn, boats motionless on glassy water
1.5–3.0s — a slow push-in begins as gulls lift off the water
3.0–5.0s — the sun breaks the horizon, warm light spreads and the camera settles
```

多镜头官方例（沙漠公路）：

```text
SHOT ONE: wide aerial of a desert highway at dawn, a single red car speeding through. HARD CUT. SHOT TWO: interior close-up, the driver's hands drumming the wheel. HARD CUT. SHOT THREE: from the roadside, the car shrinks into the heat haze. One music bed across all three shots.
```

养蜂人分段（官方 Phase）：`Phase 1 (0–3s)` / `Phase 2 (3–7s)` / `Phase 3 (7–10s)`。

### 六段 schema（沙漠例，节录）

字段：`Core summary`、`Scene`、`Subject description`、`Dynamic narrative`、`Audio`、`Style and color`。这是可选格式，多镜头叙事要对齐时再用。

```yaml
Core summary: A first-person and third-person mixed cinematic sequence follows a lone man traversing a scorching desert, from a wide dune crossing through a sandstorm, discovering an oasis, and collapsing in exhaustion before crawling toward the water.

Scene:
  Shot 1: A vast desert landscape with rolling golden sand dunes … Harsh, bright midday sun … Deep depth of field.
  Shot 2: … violent sandstorm … Shallow depth of field.
  Shot 3: A small oasis … Warm, golden-hour sunlight … Deep depth of field.
  Shot 4: A close, low-angle view of the sand near the oasis's edge …

Subject description: A rugged traveler in a tattered, sand-colored linen tunic, a loose scarf wrapped around head and neck, leather sandals, and a worn canvas satchel. Sunburned, weathered skin; lips cracked from dehydration.

Dynamic narrative:
  Shot 1 [0.0s-2.5s]: A wide, tracking shot follows the man trudging up a massive dune …
  Shot 2 [2.5s-5.0s]: Hard cut to first-person as the sandstorm hits …
  Shot 3 [5.0s-7.5s]: The storm clears abruptly, revealing the oasis …
  Shot 4 [7.5s-10.0s]: He collapses at the water's edge … The camera pushes in close as his trembling hand touches the water …

Audio:
  Shot 1: Low, dry desert wind, faint crunching footsteps on sand …
  Shot 2: Roaring, chaotic wind howl …
  Shot 3: Wind fades into a gentle breeze rustling palm fronds …
  Shot 4: Soft splashing water, the man's shaky exhale …

Style and color: Realistic, high-fidelity cinematic sequence. Warm, sun-bleached palette of ochre, amber, and sandy beige, shifting to cool teal-blue during the oasis reveal.
```

`Subject description` 各镜保持同一段，用来稳住身份。完整四镜原文见 [Text-to-Video](https://docs.bfl.ml/guides/prompting_video_text_to_video.md)。

### 音频 / 对白 / 旁白

四层：Speech、Ambience、Effects、Music。不必全写。点名声源，不要只写 mood。与其 `quiet room tone`（可能变死静），不如 `Rain against the window`。

```text
[Shot and action].
Dialogue or voiceover: [speaker and exact words].
Ambience: [place].
Effects: [visible actions].
Music: [style and role].
```

| 说明 | 官方 prompt |
|---|---|
| 暗示声音的动作戏 | `A boxer trains alone in a dim gym. Rapid footwork on the canvas, gloves striking a worn punching bag, fluorescent lights buzzing overhead, handheld close follow shot, gritty documentary style.` |
| 出镜对白 | `Medium close-up of a tired station attendant behind the glass. She looks toward the stranded passenger and says, "The 6:10 is delayed again. They say ten minutes." Low, matter-of-fact delivery. Fluorescent room tone and rain against the platform roof. No on-screen text or subtitles.` |
| 画外旁白 | `Locked shot of a studio microphone in a small treated booth. An off-screen voiceover says exactly once, "Most good tools have one thing in common. You stop noticing them." Close, dry recording. Rain against the window. No music, no second voice, no on-screen text or subtitles.` |
| 爵士酒吧（对白+现场乐） | `One continuous unbroken real-time ten-second cinematic shot inside a small dim basement jazz club, late set. A live trio — upright bass, brushed drums, and piano — plays a slow, smoky number continuously from the first frame to the last, never stopping. Slow dolly along the bar toward a bartender in a rolled-sleeve white shirt polishing a glass. Over the music, he leans toward a regular seated at the bar and says in a low, warm voice: "Last call was an hour ago. For you, the night is still young." The music keeps playing under and after his words. Audio: the jazz trio constant throughout, murmur of a few late patrons, the soft clink of the glass as he sets it down, and a faint espresso-machine hiss from the back. No on-screen text, no subtitles.` |

可见说话人才能对口型。画外必须写 `voiceover` 或 `narration`，否则引号可能被当成画面上的字。加 `no on-screen text or subtitles`。

声音方向：人（年龄/口音）、声区、录音（近/干/电话/广播）、语气、禁区（`no announcer delivery`、`no sales voice`）。

```text
A British man in his thirties with a warm low-mid voice, recorded close and dry. He sounds conversational and lightly amused, like he is letting a friend in on something. Imperfect human timing, one relaxed breath, no announcer delivery.
```

对白要能说出口。官方弱/强对照：弱 `A confident and engaging presenter says, "Today, we are excited to embark on a transformative journey that will redefine what is possible."`；强 `A presenter checks the monitor, looks back to camera, and says, "That was the hard part. Now we can see if it actually works." Dry, conversational delivery.`

时间：短句配长片更安全。最后一词被切掉就缩短台词或加长 duration。时间指令只是目标：`The voiceover speaks once and aims to finish by 8 seconds. For the final two seconds, only rain against the window.`

多语：每句标语言、按顺序、同一说话人写 `same voice`。可用原文脚本。跨片段复用整段声音方向，但这是选角说明，不保证同一表演者。

### Image-to-video：首帧 / 首尾 / 关键帧

都走 `i2v` 的 `keyframes`。带时间戳或 3 帧以上要显式 `duration`。

| 形态 | 图像变成什么 |
|---|---|
| Startframe（一张） | 精确开场；prompt 往后演 |
| Start + end（两张） | 首尾钉死，中间补运动 |
| Keyframes（三张以上，或 `[seconds, image]`） | 按序经过航点，均分或钉时间 |

两帧要相关（同一主体/场景/机位）。差距越大越不可控。顺序就是时间线。

| 说明 | 官方 prompt |
|---|---|
| 首帧：马与车 | `The black horse bursts into a full gallop, mane and tail whipping in the wind, hooves kicking up huge plumes of dust as the sports car chases close behind with headlights flaring. The camera races alongside at ground level, shaking with speed. Thundering hoofbeats, roaring engine, rushing wind.` |
| 日→夜城市（首尾） | `A wide waterfront city skyline transitions from bright midday to glittering night: daylight fades through dusk to dark, thousands of lights switching on across the towers and shimmering on the water.` |
| 墨水（首尾） | `Vivid clouds of colored ink billow and swirl through dark water: electric blue and crimson tendrils bloom, fold and diffuse, slowly transforming into deep magenta and violet plumes.` |
| 极光关键帧（0 / 2.5 / 5s） | `A wide long-exposure night sky over snowy northern mountains: the aurora borealis sweeps and ripples, shifting from soft magenta and violet into teal and finally vivid green above the frozen horizon.` |

### 视频编辑措辞

FLUX Video Edit [fast] 的 prompt 描述**改动**，没写的保持原片。越短越好，细节加在改动上。

| 说明 | 官方 prompt |
|---|---|
| 去掉 | `Remove the orange bucket.` |
| 添加并定位 | `Add a seagull standing on the corner of the crate.` |
| 太短（灯塔位置失控） | `Add a lighthouse.` |
| 具体灯塔 | `Add a tall white lighthouse with a red lantern room standing on the end of the harbor wall to the right of the boats.` |
| 对白（新台词不能长过原说话时长） | `Make him say "Fresh mackerel, four for ten."` |
| 灰盒 previz → 完成片 | `Render this previz chase as a desert convoy pursuit at golden hour: the pillars become ruined highway columns in open dust, the lead car an armored pickup, the chaser a spiked buggy, both trailing dust plumes, heat shimmer. Same weave lines, same speeds, same camera overtake. V8 roar and wind.` |
| 第二次改：用上一次结果当输入 | `Change the desert chase to deep night. Turn on the headlights and add a huge low moon above the canyon.` |
| 换场景 | `Replace the cliff with the reflective windows of a high-rise building. Add narrow metal window ledges at the climber’s hand and foot contact points. Far below, traffic and illuminated buildings fill a dense city in blue-hour light.` |
| 换风格 | `Restyle this clip as live-action footage of a claw machine lifting a lavender octopus plush. Fine velour fibers and sewn seams replace the ink outlines. The plush compresses gently where the metal claw grips it. Soft arcade lights reflect in the glass.` |

无声片得到无声结果，没有对白可改。不改声音则保留源音频。

### 相机术语

[Camera terms](https://docs.bfl.ml/guides/prompting_video_camera_terms.md) 正文里的画廊是交互组件，`.md` 里没有逐条词表。下面只收该页 FAQ，以及文生视频页里出现过的相机短语。完整画廊看官方页。

官方 FAQ：

- 可以叠术语，但要有意。`low tracking shot` 清楚；`low aerial handheld orbit push-in` 通常不行。
- 通常先写主体和动作，再加取景、运动、风格。
- 不是每条都要相机语言；不写则模型自己推断。
- 这些是可复用短语，不是完整 prompt。
- 一条句子里：**一个取景词 + 一个运动词 + 一个清楚的主体动作**。

视频页出现过的官方短语：`telephoto`、`wide aerial`、`interior close-up`、`tracking shot`、`low tracking shot`、`POV shot`、`wide shot, low angle`、`locked wide`、`slow push-in`、`handheld close follow`、`locked-off camera panning gently`、`dolly`、`HARD CUT` / `Hard cut`。图像侧镜头表见上文「风格 / 相机」。

## 6. 常见错误 / 调参流程

**文生图**

1. `768sq` 起草。
2. 看对了什么、错了什么。
3. 一次只改主体 / 取景 / 光 / 风格之一。
4. 没有 `seed`，同一句多看几次再判断「没帮助」。
5. 接近了就改成编辑：送回结果，一条指令，其余保持。

负向反复出现：替代物写更具体、放到开场、补细节、给情境。

**编辑**

- 目标必须唯一匹配；两辆车不要只写 `Remove the car`。
- 列出留下的主要元素，不要只写 “the rest”。
- 相似物体、精确落点、移动/删除：上 box 行。
- hex 与文字改完要核对。

**布局**

- 代币 = `id`；坐标 y 在前；画幅与画框时一致。
- 新元素框太小会消失。
- 指令与表不一致会打架。

**视频**

- 短句探索，再加相机/运动/声音。
- 换镜写 `HARD CUT`。5 秒不要塞太多拍点。
- 对白变字幕：点名出镜者或写 `voiceover`，加 `no on-screen text or subtitles`。
- 广告腔：换成具体的人、录音、情境，加 `no announcer delivery`。
- 末词被切：缩短台词或加长片子。
- 视频编辑：第二次改用第一次结果，不要两条指令一起打在原始块上。

**音频排错（官方表）**

| 现象 | 改法 |
|---|---|
| 台词变成画面字 | 点名说话人或写 `voiceover`，引号原文，加 `no on-screen text or subtitles` |
| 读得像广告 | 换具体的人/录音/情境；`no announcer delivery` / `no sales voice` |
| 唱诵节奏 | 简化标点，要放松口语 |
| 词含糊 | 去掉争抢的人声 |
| 最后一词被切 | 缩短或加长 duration |
| 声景空泛 | 点名声源，效果绑可见动作 |
| 混音太挤 | 只留一两层 |

## 7. 来源

文档检索日期 **2026-10-08**。索引：[https://docs.bfl.ml/llms.txt](https://docs.bfl.ml/llms.txt)。

| 本节 | 文档 |
|---|---|
| 总览 | [prompting_summary](https://docs.bfl.ml/guides/prompting_summary.md) |
| 文生图基础 | [prompting_unified_basics](https://docs.bfl.ml/guides/prompting_unified_basics.md) |
| 结构与组件 | [prompting_unified_building](https://docs.bfl.ml/guides/prompting_unified_building.md) |
| 风格、光、字 | [prompting_unified_style](https://docs.bfl.ml/guides/prompting_unified_style.md) |
| 画幅、分辨率、负向 | [prompting_unified_technical](https://docs.bfl.ml/guides/prompting_unified_technical.md) |
| 相机/光线/构图词 | [prompting_unified_reference](https://docs.bfl.ml/guides/prompting_unified_reference.md) |
| 布局 caption | [prompting_layout](https://docs.bfl.ml/guides/prompting_layout.md) |
| 图像编辑请求 | [flux3_image_layout](https://docs.bfl.ml/flux_3/flux3_image_layout.md) |
| bbox 生成与编辑 | [flux3_image_bounding_boxes](https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes.md) |
| 编辑总览 | [prompting_editing_overview](https://docs.bfl.ml/guides/prompting_editing_overview.md) |
| 单参考 | [prompting_editing_single_reference](https://docs.bfl.ml/guides/prompting_editing_single_reference.md) |
| 多参考 | [prompting_editing_multi_reference](https://docs.bfl.ml/guides/prompting_editing_multi_reference.md) |
| 视频总览 | [prompting_video_overview](https://docs.bfl.ml/guides/prompting_video_overview.md) |
| 文生视频 | [prompting_video_text_to_video](https://docs.bfl.ml/guides/prompting_video_text_to_video.md) |
| 图生视频 | [prompting_video_image_to_video](https://docs.bfl.ml/guides/prompting_video_image_to_video.md) |
| 音频 | [prompting_video_audio](https://docs.bfl.ml/guides/prompting_video_audio.md) |
| 视频编辑 | [prompting_video_editing](https://docs.bfl.ml/guides/prompting_video_editing.md) |
| 视频相机术语 | [prompting_video_camera_terms](https://docs.bfl.ml/guides/prompting_video_camera_terms.md) |
| 用例索引（例为 FLUX.2） | [prompting_unified_usecases](https://docs.bfl.ml/guides/prompting_unified_usecases.md) |
| 字体（FLUX.2） | [usecases_t2i_typography_design](https://docs.bfl.ml/guides/usecases_t2i_typography_design.md) |
| Hex（FLUX.2） | [usecases_t2i_hex_color_prompting](https://docs.bfl.ml/guides/usecases_t2i_hex_color_prompting.md) |
| JSON（FLUX.2） | [usecases_t2i_json_prompting](https://docs.bfl.ml/guides/usecases_t2i_json_prompting.md) |
| 产品 | [usecases_t2i_product_mockups](https://docs.bfl.ml/guides/usecases_t2i_product_mockups.md)、[usecases_editing_product_consistency](https://docs.bfl.ml/guides/usecases_editing_product_consistency.md) |
| 角色（FLUX.2） | [usecases_editing_character_consistency](https://docs.bfl.ml/guides/usecases_editing_character_consistency.md) |
