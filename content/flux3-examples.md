# FLUX 3 官方示例库

全部官方示例 prompt 来自 2026-10-08 抓取的 [BFL 文档](https://docs.bfl.ml/llms.txt)。**英文保持原文**；相机术语的 119 条示例在 [相机术语表](../camera-terms/)。

每条含一行中文说明、文档若标明则给出模型标签（FLUX 3 / FLUX.2）、以及来源链接。中文说明是阅读辅助，不是官方原文。

<p class="sister-nav">相关页：<a href="../">FLUX 3 提示词速查表</a> · <a href="../cases/">官方案例</a> · <a href="../camera-terms/">相机术语表</a></p>

<nav class="page-toc" aria-label="本页目录">
<p>本页目录</p>

- [文生图](#文生图)
  - [Image API 参考](#image-api-参考)
  - [FLUX 3 Image · generate](#flux-3-image-generate)
  - [FLUX 3 Image 概览](#flux-3-image-概览)
  - [提示词一页总览](#提示词一页总览)
  - [Prompting Basics](#prompting-basics)
  - [Building a Good Prompt](#building-a-good-prompt)
  - [Prompt Reference](#prompt-reference)
  - [Style, Aesthetics & Text](#style-aesthetics-text)
  - [Technical Parameters](#technical-parameters)
- [单图编辑](#单图编辑)
  - [编辑概览](#编辑概览)
  - [单参考编辑指南](#单参考编辑指南)
- [多参考编辑](#多参考编辑)
  - [多参考编辑指南](#多参考编辑指南)
- [bbox 布局 / 局部编辑](#bbox-布局-局部编辑)
  - [FLUX 3 Image · bounding boxes](#flux-3-image-bounding-boxes)
  - [FLUX 3 Image · layout](#flux-3-image-layout)
  - [布局提示词指南](#布局提示词指南)
- [视频 · 文生视频](#视频-文生视频)
  - [FLUX 3 总览](#flux-3-总览)
  - [FLUX 3 Video](#flux-3-video)
  - [视频提示词概览](#视频提示词概览)
  - [文生视频指南](#文生视频指南)
- [视频 · 图生视频](#视频-图生视频)
  - [图生视频指南](#图生视频指南)
- [视频 · 编辑](#视频-编辑)
  - [视频编辑指南](#视频编辑指南)
- [对白 / 音频](#对白-音频)
  - [视频音频与对白](#视频音频与对白)
- [Cookbook](#cookbook)
  - [Cookbook · 重演 / 续写](#cookbook-重演-续写)
  - [Cookbook · 多镜头](#cookbook-多镜头)
  - [Cookbook · 视频入门](#cookbook-视频入门)
  - [Cookbook · 从静帧开始](#cookbook-从静帧开始)

</nav>

## 文生图

### Image API 参考

来源：[api-reference_utility_generate-an-image-with-flux-3](https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3)

#### Image API 参考 · 官方 prompt：Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cli

<p class="ex-meta" id="ex-001">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3">来源</a></p>

```text
Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cliffs on one side, turquoise sea on the other, a single vintage car with headlights on, soft golden rim light
```

#### Image API 参考 · 官方 prompt：change the color of only one bird in the middle to #e01075

<p class="ex-meta" id="ex-002">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3">来源</a></p>

```text
change the color of only one bird in the middle to #e01075
```

#### Image API 参考 · 官方 prompt：Turn Image 1 in the Style of Image 2

<p class="ex-meta" id="ex-003">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3">来源</a></p>

```text
Turn Image 1 in the Style of Image 2
```

#### Image API 参考 · 官方 prompt：Minimalist graphic illustration featuring a black silhouette of a person

<p class="ex-meta" id="ex-004">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3">来源</a></p>

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame. The image relies entirely on the high-contrast relationship between the two colors, mimicking a digital recreation of a screen-printed or risograph aesthetic, with no discernible light source or shadow. [{"id":"background_1","bbox":[0,0,1000,1000],"desc":"A flat field of neon yellow-green possessing a subtle, tactile paper texture with fine, organic grain and slight variations in color saturation, giving the flat surface a sense of physical depth."},{"id":"silhouette_1","bbox":[150,150,850,850],"desc":"A black silhouette of a person in motion, composed of a dense, stippled texture that resembles physical ink on paper or a low-resolution digital dither. The leading edges, including the front of the head, chest, and forward leg, are relatively solid and opaque. The trailing edges, such as the back, outstretched rear arm, and lifted back leg, dissolve into a spray of coarse, square-shaped pixels and scattered dots. The black ink shows a slight textural irregularity, as if pressed onto a porous surface."}]
```

#### Image API 参考 · 官方 prompt：In <ref_image_0>, change the large tiger <animal_1> and the small glowin

<p class="ex-meta" id="ex-005">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3">来源</a></p>

```text
In <ref_image_0>, change the large tiger <animal_1> and the small glowing butterfly <insect_1> to be pink. Keep the massive fallen log <log_1>, the falling snow <snow_1>, and the dark background trees <trees_1> exactly unchanged. [{"id":"animal_1","from":null,"src_bbox":null,"tgt_bbox":[250,50,850,650],"desc":"Make both pink."},{"id":"insect_1","from":null,"src_bbox":null,"tgt_bbox":[650,680,750,750],"desc":"Make both pink."},{"id":"log_1","from":"ref_image_0","src_bbox":[600,0,1000,1000],"tgt_bbox":[600,0,1000,1000],"desc":"A massive, fallen tree log stretching horizontally across the foreground. The surface features deep, rough-textured bark, weathered cracks, and small pockets of frost."},{"id":"snow_1","from":"ref_image_0","src_bbox":[0,0,1000,1000],"tgt_bbox":[0,0,1000,1000],"desc":"Numerous white snowflakes of varying sizes falling across the scene. Some flakes are sharp and distinct, while others closer to the lens appear as blurred white streaks."},{"id":"trees_1","from":"ref_image_0","src_bbox":[0,0,650,1000],"tgt_bbox":[0,0,650,1000],"desc":"A dense stand of tall, dark, vertical tree trunks receding into the distance. A cool, blue misty light permeates the spaces between the trees, glowing most intensely from the right edge."}]
```

#### Image API 参考 · 官方 prompt：In <ref_image_0>, move the miniature grey amigurumi knight figure <knigh

<p class="ex-meta" id="ex-006">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3">来源</a></p>

```text
In <ref_image_0>, move the miniature grey amigurumi knight figure <knight_1> upwards and to the left along the yarn cliff <cliff_1>. Leave the polished steel tapestry needle <needle_1> in its original position in the air. Keep the rest of the image completely unchanged, preserving the blurred yarn backdrop <backdrop_1>, the large knitted dragon <dragon_1>, and the fiery orange thread <fire_1> suspended between them. [{"id":"knight_1","from":"ref_image_0","src_bbox":[500,150,850,350],"tgt_bbox":[194,55,544,255],"desc":"A miniature amigurumi knight figure crocheted from thick grey woolen yarn. It has visible, intricate stitches forming a rounded helmet shape and a cylindrical body, with tiny stubby arms reaching upwards against the cliff."},{"id":"backdrop_1","from":"ref_image_0","src_bbox":[0,0,1000,1000],"tgt_bbox":[0,0,1000,1000],"desc":"A soft, out-of-focus expanse of cream ivory and melange indigo knitted yarn, providing a blurred studio backdrop with tangible fiber fuzz catching the ambient light."},{"id":"cliff_1","from":"ref_image_0","src_bbox":[300,0,1000,450],"tgt_bbox":[300,0,1000,450],"desc":"A steep, uneven cliff face constructed from stacked, thick yarn skeins in rich shades of mustard yellow, terracotta, and melange indigo, featuring visible woven wool textures and loose, stray fiber strands."},{"id":"needle_1","from":"ref_image_0","src_bbox":[420,250,550,450],"tgt_bbox":[420,250,550,450],"desc":"A real, oversized polished steel tapestry needle, gleaming under the studio lighting. It features a blunt tip and an elongated eye, grasped like a weapon in the knight'
```

### FLUX 3 Image · generate

来源：[flux_3_flux3_image_generate](https://docs.bfl.ml/flux_3/flux3_image_generate)

#### FLUX 3 Image · generate · 官方 prompt：A two-color risograph narrative illustration with porous ink, soft misre

<p class="ex-meta" id="ex-059">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
A two-color risograph narrative illustration with porous ink, soft misregistration, and cheerful simple shapes: a rabbit rides a pumpkin along a winding path through three layers of rolling hills. No text.
```

#### FLUX 3 Image · generate · 官方 prompt：Two red pandas resting on bamboo beams, one looking relaxed and the othe

<p class="ex-meta" id="ex-060">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Two red pandas resting on bamboo beams, one looking relaxed and the other asleep. Their reddish-brown fur and white facial markings stand out against the soft, blurred natural background, suggesting a peaceful, sunny environment.
```

#### FLUX 3 Image · generate · 官方 prompt：Two red pandas resting on a bamboo structure. One is lying down with eye

<p class="ex-meta" id="ex-061">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Two red pandas resting on a bamboo structure. One is lying down with eyes partially open, while the other is fully asleep. Their reddish-brown fur contrasts with the light brown bamboo. The background is softly blurred with green and brown tones, suggesting a natural setting.
```

#### FLUX 3 Image · generate · 官方 prompt：A breathtaking mountain range bathed in the warm glow of a sunset. The p

<p class="ex-meta" id="ex-062">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
A breathtaking mountain range bathed in the warm glow of a sunset. The peaks, partially covered in snow, reflect hues of orange and pink. Fluffy clouds hover above, blending into a sky that transitions from golden to soft blue.
```

#### FLUX 3 Image · generate · 官方 prompt：A serene night scene with the Northern Lights casting a vibrant green an

<p class="ex-meta" id="ex-063">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
A serene night scene with the Northern Lights casting a vibrant green and purplish glow across the sky. Stars dot the background, adding a speckled effect. A silhouette of hilly terrain outlines the horizon, and the colorful aurora and stars perfectly reflect in a still body of water, creating a symmetrical and tranquil visual.
```

#### FLUX 3 Image · generate · 官方 prompt：Three prairie dogs stand upright on a small dirt mound, facing the camer

<p class="ex-meta" id="ex-064">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Three prairie dogs stand upright on a small dirt mound, facing the camera. The background is a blurred, sunlit field with golden hues, emphasizing the warm lighting. The prairie dogs appear alert, with a few green plants and scattered dry grass visible around them.
```

#### FLUX 3 Image · generate · 官方 prompt：A bustling urban street scene filled with bright, colorful signs in Japa

<p class="ex-meta" id="ex-065">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
A bustling urban street scene filled with bright, colorful signs in Japanese, featuring numerous people engaged in shopping and walking. The atmosphere is lively, with illuminated storefronts and a prominent lamp post casting a warm glow. A giant ramen sign and various food images contribute to the vibrant street market vibe. The setting captures a typical busy street market scene, likely in Japan, during the evening.
```

#### FLUX 3 Image · generate · 官方 prompt：An aerial view of a waterfall cascading through a dense, verdant forest.

<p class="ex-meta" id="ex-066">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
An aerial view of a waterfall cascading through a dense, verdant forest. The water flows down a rocky cliff into a pool, creating mist around the base. Lush, dark green trees surround the waterfall, contrasting with the lighter green grass visible in the bottom left. A pathway winds through the forest, leading towards the waterfall, suggesting a blend of untamed nature and human access.
```

#### FLUX 3 Image · generate · 官方 prompt：A tranquil autumn scene featuring a serene lake surrounded by vibrant, g

<p class="ex-meta" id="ex-067">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
A tranquil autumn scene featuring a serene lake surrounded by vibrant, golden-hued trees reflecting in the calm water. In the foreground, a wooden rowboat gently rocks near the shore, and a family of ducks glides gracefully across the surface. The sky is overcast, casting a soft, diffused light that enhances the rich colors of the foliage. The air is crisp and cool, suggesting the peaceful transition from fall to winter.
```

#### FLUX 3 Image · generate · 官方 prompt：Two vibrant clownfish swimming together in a dimly lit aquarium. The wat

<p class="ex-meta" id="ex-068">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Two vibrant clownfish swimming together in a dimly lit aquarium. The water reflects warm, earthy tones, and the background features soft orange coral formations, creating an underwater atmosphere.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 graphic design artwork for an original fictional d

<p class="ex-meta" id="ex-069">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 graphic design artwork for an original fictional design study. \n ART DIRECTION: Experimental music event poster: expressive typography with highly legible event details, luminous abstract forms, punchy spot colors, deliberate off-center rhythm. Midnight blue, coral and acid yellow. \n ORIGINAL VISUAL: a cluster of translucent tuning-fork sculptures. Balance a small isolated subject against very large type. \n EXACT VISIBLE TITLE: "Open Air Register" \n EXACT SUPPORTING COPY: "Outdoor listening / 05 December / 17:00" \n Use the supporting copy as a carefully typeset secondary block; slashes indicate line breaks. \n Create a coherent, distinctive new layout with readable text and intentional hierarchy. Full-bleed artwork, except for the requested packaging presentation. Keep important text at least 5 percent from all edges. Fine print texture and polished professional art direction. Use only the supplied visible copy. No real brands, logos, named artists, existing book covers, famous characters, copied campaign slogans, signatures, watermarks, QR codes or borrowed artwork. Invent all visual forms from this description; this is not a remake of a specific existing design.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 3:4 graphic design artwork for an original fictional d

<p class="ex-meta" id="ex-070">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 3:4 graphic design artwork for an original fictional design study. \n ART DIRECTION: Type-led graphic poster with a newly composed layout and striking scale contrasts. Typography is the visual subject; use only supplied copy. Crisp ink, subtle paper grain, two strong colors with a neutral ground. \n ORIGINAL VISUAL: title words at different scales joined by thin rules. Crop the main form boldly at one edge while keeping every word inside the trim. \n EXACT VISIBLE TITLE: "Room Between Words" \n EXACT SUPPORTING COPY: "A small study in visual rhythm" \n Use the supporting copy as a carefully typeset secondary block; slashes indicate line breaks. \n Create a coherent, distinctive new layout with readable text and intentional hierarchy. Full-bleed artwork, except for the requested packaging presentation. Keep important text at least 5 percent from all edges. Fine print texture and polished professional art direction. Use only the supplied visible copy. No real brands, logos, named artists, existing book covers, famous characters, copied campaign slogans, signatures, watermarks, QR codes or borrowed artwork. Invent all visual forms from this description; this is not a remake of a specific existing design.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 2:3 graphic design artwork for an original fictional d

<p class="ex-meta" id="ex-071">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 2:3 graphic design artwork for an original fictional design study. \n ART DIRECTION: Type-led graphic poster with a newly composed layout and striking scale contrasts. Typography is the visual subject; use only supplied copy. Crisp ink, subtle paper grain, two strong colors with a neutral ground. \n ORIGINAL VISUAL: rounded title lettering on a sharply divided color field. Balance a small isolated subject against very large type. \n EXACT VISIBLE TITLE: "Start Somewhere Soft" \n EXACT SUPPORTING COPY: "Open studio / All ideas welcome" \n Use the supporting copy as a carefully typeset secondary block; slashes indicate line breaks. \n Create a coherent, distinctive new layout with readable text and intentional hierarchy. Full-bleed artwork, except for the requested packaging presentation. Keep important text at least 5 percent from all edges. Fine print texture and polished professional art direction. Use only the supplied visible copy. No real brands, logos, named artists, existing book covers, famous characters, copied campaign slogans, signatures, watermarks, QR codes or borrowed artwork. Invent all visual forms from this description; this is not a remake of a specific existing design.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 graphic design artwork for an original fictional d

<p class="ex-meta" id="ex-072">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 graphic design artwork for an original fictional design study. \n ART DIRECTION: Invented community program poster: practical information paired with a playful custom illustration, sophisticated modular spacing without generic cards. Tomato, sky blue and natural paper. No actual organization identities. \n ORIGINAL VISUAL: a grid of glowing windows with one handwritten paper square. Balance a small isolated subject against very large type. \n EXACT VISIBLE TITLE: "Night Window Notes" \n EXACT SUPPORTING COPY: "A neighborhood writing evening / Thursday 19:00" \n Use the supporting copy as a carefully typeset secondary block; slashes indicate line breaks. \n Create a coherent, distinctive new layout with readable text and intentional hierarchy. Full-bleed artwork, except for the requested packaging presentation. Keep important text at least 5 percent from all edges. Fine print texture and polished professional art direction. Use only the supplied visible copy. No real brands, logos, named artists, existing book covers, famous characters, copied campaign slogans, signatures, watermarks, QR codes or borrowed artwork. Invent all visual forms from this description; this is not a remake of a specific existing design.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 4:3 original experimental graphic design artwork. \n D

<p class="ex-meta" id="ex-073">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 4:3 original experimental graphic design artwork. \n DESIGN LANGUAGE: Black and white optical geometry interrupted by one vivid orange plane. Thin parallel lines bend around negative-space lettering; use precise printing and a highly original spatial illusion. \n UNIQUE VISUAL IDEA: a long curved corridor whose striped walls become the negative space of the title. \n COMPOSITION: Build a strongly asymmetric composition with one enormous focal gesture and a tightly aligned small caption. Let this specific visual idea determine the layout. Preserve its conceptual surprise. \n EXACT TITLE: "BEND THE SILENCE" \n EXACT SECONDARY COPY: "Listening has a shape." \n Artwork fills the image; no framed poster mockup and no presentation board. \n The title must be confidently typeset and readable. The small supplied sentence is the only supporting copy. No invented filler paragraphs. Type should feel integral to the material, scene or composition, not automatically placed as a generic heading over a small centered object. Design a visually adventurous, professionally resolved piece with clear hierarchy, deliberate contrast and rich details. Use fresh invented imagery and original letter arrangements; do not reproduce any existing poster, brand, logo, artwork, artist signature, campaign, famous character or reference photograph. No reference image is supplied. No watermarks, web addresses or QR codes.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 3:4 original experimental graphic design artwork. \n D

<p class="ex-meta" id="ex-074">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 3:4 original experimental graphic design artwork. \n DESIGN LANGUAGE: Experimental flat double-page editorial spread. Giant letterforms cross the central gutter, tiny photographs interrupt the grid, one vivid field contrasts with a grayscale image field. Supplied copy only, no filler paragraphs. \n UNIQUE VISUAL IDEA: overhead photographs of an invented empty swimming pool interrupted by enormous circular letter counters. \n COMPOSITION: Make the visual and title physically interact across most of the canvas; use intentional overlap while preserving legibility. Let this specific visual idea determine the layout. Preserve its conceptual surprise. \n EXACT TITLE: "NOTES FROM AN EMPTY POOL" \n EXACT SECONDARY COPY: "Deep end / No water required." \n Show the complete designed double-page spread, filling the image, with a narrow visible gutter. \n The title must be confidently typeset and readable. The small supplied sentence is the only supporting copy. No invented filler paragraphs. Type should feel integral to the material, scene or composition, not automatically placed as a generic heading over a small centered object. Design a visually adventurous, professionally resolved piece with clear hierarchy, deliberate contrast and rich details. Use fresh invented imagery and original letter arrangements; do not reproduce any existing poster, brand, logo, artwork, artist signature, campaign, famous character or reference photograph. No reference image is supplied. No watermarks, web addresses or QR codes.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 4:3 original experimental graphic design artwork. \n D

<p class="ex-meta" id="ex-075">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 4:3 original experimental graphic design artwork. \n DESIGN LANGUAGE: Tactile sewn inflatable objects, exaggerated seams, theatrical hard lighting, a bold saturated background. Title made of inflated forms with visible air valves; assertive graphic framing. \n UNIQUE VISUAL IDEA: inflated pillar-shaped letters leaning together like a soft crowd. \n COMPOSITION: Make the visual and title physically interact across most of the canvas; use intentional overlap while preserving legibility. Let this specific visual idea determine the layout. Preserve its conceptual surprise. \n EXACT TITLE: "AIR IS TAKING A STAND" \n EXACT SECONDARY COPY: "Firm ideas / Flexible structure." \n Artwork fills the image; no framed poster mockup and no presentation board. \n The title must be confidently typeset and readable. The small supplied sentence is the only supporting copy. No invented filler paragraphs. Type should feel integral to the material, scene or composition, not automatically placed as a generic heading over a small centered object. Design a visually adventurous, professionally resolved piece with clear hierarchy, deliberate contrast and rich details. Use fresh invented imagery and original letter arrangements; do not reproduce any existing poster, brand, logo, artwork, artist signature, campaign, famous character or reference photograph. No reference image is supplied. No watermarks, web addresses or QR codes.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 original experimental graphic design artwork. \n D

<p class="ex-meta" id="ex-076">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 original experimental graphic design artwork. \n DESIGN LANGUAGE: A surreal photographic installation seen through colored filters. Several sharp incompatible shadows tell a second story. Monumental spare title with expansive saturated negative space. \n UNIQUE VISUAL IDEA: a bare metal chair whose three colored shadows form separate wing shapes. \n COMPOSITION: Make the visual and title physically interact across most of the canvas; use intentional overlap while preserving legibility. Let this specific visual idea determine the layout. Preserve its conceptual surprise. \n EXACT TITLE: "THE CHAIR REMEMBERS FLIGHT" \n EXACT SECONDARY COPY: "Sit with an impossible idea." \n Artwork fills the image; no framed poster mockup and no presentation board. \n The title must be confidently typeset and readable. The small supplied sentence is the only supporting copy. No invented filler paragraphs. Type should feel integral to the material, scene or composition, not automatically placed as a generic heading over a small centered object. Design a visually adventurous, professionally resolved piece with clear hierarchy, deliberate contrast and rich details. Use fresh invented imagery and original letter arrangements; do not reproduce any existing poster, brand, logo, artwork, artist signature, campaign, famous character or reference photograph. No reference image is supplied. No watermarks, web addresses or QR codes.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 long-form infographic poster. This is a TEXT-RICH 

<p class="ex-meta" id="ex-077">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 long-form infographic poster. This is a TEXT-RICH graphic design study. Give the artwork a memorable composition specific to its concept, with roughly half the area for legible longer text. Integrate the prose into the authored visual arrangement; do not default to repeated cards or a generic five-panel grid. \n ART DIRECTION: Warm risograph-like texture, burgundy and sage with visible paper grain, bold headlines and clean readable text. Invent a bespoke central diagram specifically for this concept: the garden of misplaced apostrophes. Shape the composition around the relationships in the brief, not a reusable card grid. The prose should occupy clear uncluttered areas alongside the diagram. Keep a strong reading sequence, large body text and no text over detailed illustration. \n VISUAL SUBJECT: A central, winding topiary path shaped like a giant comma. At each bend, stylized plants represent different grammatical rules. The Cyclops Fern has one large leaf, while the Neighbors' Ivy intertwines multiple stems. Faded burgundy shop signs float above the sage-colored foliage, with glowing red apostrophes highlighting the specific placement errors discussed in the text. \n SOURCE BRIEF FOR DIAGRAM CONTENT: Turn punctuation errors into a whimsical planted landscape; explain how placement changes ownership, omission and the reading of invented shop names. \n EXACT VISIBLE COPY, reproduce every sentence verbatim with correct spelling and punctuation. The headings below describe layout roles and are not extra printed words. \n TITLE: "THE GARDEN OF MISPLACED APOSTROPHES" \n INTRODUCTION: "Wander through a botanical sanctuary where errant punctuation sprouts into strange life, demonstrating how a single floating mark reshapes the ownership of every leaf." \n SECTION 1 HEADING: "The Singular Shift" \n SECTION 1 BODY: "Look at the Cyclops Fern. When the mark sits before the 's', the entire plant belongs to one lonely gardener. This possessive placement anchors the identity to a solitary figure, turning a communal thicket into a private, guarded specimen." \n SECTION 2 HEADING: "Plurality in Bloom" \n SECTION 2 BODY: "Beside the path, the Neighbors' Ivy displays the mark after the 's'. Here, the punctuation indicates shared ownership between multiple inhabitants. The vine stretches across fences, signifying a collective boundary that changes based entirely on where the tiny hook lands." \n SECTION 3 HEADING: "Vanishing Omissions" \n SECTION 3 BODY: "The 'Its' Orchid suffers when an apostrophe is forced into its name. A contraction implies the plant 'is' something else, while the clean, unmarked version claims true possession. Misplacing this speck creates a linguistic weed that chokes the intended meaning." \n SECTION 4 HEADING: "Signage and Shadows" \n SECTION 4 BODY: "Forged shop signs like 'Joes Pizzas' hang over the beds. Without the necessary mark, the name suggests a terrifying army of men named Joe rather than a single owner. The missing curve strips the personhood from the humble storefront." \n BOTTOM TAKEAWAY: "In this landscape, punctuation acts as the root system, dictating whether a noun stands alone or belongs to a crowd." \n FOOTER: "A creative design study" \n TYPESETTING: The 218 words of supplied prose are essential visual content, not instructions to summarize. Set complete paragraphs in comfortably readable body type, roughly 30–36 pixels at a 2K long edge. Short line lengths, generous leading and at least 5 percent exterior margins. Headings clearly larger than body text. Keep all 4 sections, introduction and takeaway fully visible. Add only the supplied diagram labels where needed. Avoid duplicate paragraphs, invented filler, ellipses, illegible pseudo-text or cut-off sentences. Keep diagram lines away from prose. A polished flat artwork filling the whole image, not a framed mockup.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 2:3 long-form infographic poster. This is a TEXT-RICH 

<p class="ex-meta" id="ex-078">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 2:3 long-form infographic poster. This is a TEXT-RICH graphic design study. Give the artwork a memorable composition specific to its concept, with roughly half the area for legible longer text. Integrate the prose into the authored visual arrangement; do not default to repeated cards or a generic five-panel grid. \n ART DIRECTION: Graphic woodcut-like silhouettes, saturated ochre and ink black, strong contours and undistracted text blocks. Invent a bespoke central diagram specifically for this concept: the history of an imaginary sport. Shape the composition around the relationships in the brief, not a reusable card grid. The prose should occupy clear uncluttered areas alongside the diagram. Keep a strong reading sequence, large body text and no text over detailed illustration. \n VISUAL SUBJECT: A central woodcut-style diagram features a stylized balance beam topped with jagged obsidian silhouettes. Saturated ochre paths spiral outward from the fulcrum, connecting the three text blocks. Thick ink-black contours define the copper discs and the brass chime, while the lunar phase boundaries divide the field into a bold, geometric composition. \n SOURCE BRIEF FOR DIAGRAM CONTENT: Invent a playful nonviolent tabletop sport with distinct equipment silhouettes, a symbolic field and an explicitly fictional origin story. \n EXACT VISIBLE COPY, reproduce every sentence verbatim with correct spelling and punctuation. The headings below describe layout roles and are not extra printed words. \n TITLE: "THE HISTORY OF AN IMAGINARY SPORT" \n INTRODUCTION: "Discover the peculiar evolution of Pebble-Staking, a tabletop pastime born from bored lighthouse keepers who balanced jagged obsidian shards atop rocking harbor buoys." \n SECTION 1 HEADING: "The Origin of the Fulcrum" \n SECTION 1 BODY: "Legend claims a stranded mariner carved the first 'Leaning Spire' from whalebone. Players used miniature leaden anchors to tip the central balance beam without toppling the precarious stacks of river stones, turning maritime physics into a tense parlor competition." \n SECTION 2 HEADING: "Evolution of the Pitch" \n SECTION 2 BODY: "Modern matches occur on a circular velvet field divided into lunar phases. Contestants slide flat copper discs toward the center, attempting to wedge their markers beneath the opponent’s base. One slip collapses the entire structure, ending the match instantly." \n SECTION 3 HEADING: "The Great Gong Tradition" \n SECTION 3 BODY: "Victory is declared only when the winner strikes a tiny brass chime with a feathered mallet. This ritual symbolizes the lighthouse bell, signaling safety through the fog. The sport remains a quiet test of steady hands and rhythmic breathing." \n BOTTOM TAKEAWAY: "Pebble-Staking celebrates the delicate balance between stillness and gravity using only friction and focus." \n FOOTER: "A creative design study" \n TYPESETTING: The 173 words of supplied prose are essential visual content, not instructions to summarize. Set complete paragraphs in comfortably readable body type, roughly 30–36 pixels at a 2K long edge. Short line lengths, generous leading and at least 5 percent exterior margins. Headings clearly larger than body text. Keep all 3 sections, introduction and takeaway fully visible. Add only the supplied diagram labels where needed. Avoid duplicate paragraphs, invented filler, ellipses, illegible pseudo-text or cut-off sentences. Keep diagram lines away from prose. A polished flat artwork filling the whole image, not a framed mockup.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: H

<p class="ex-meta" id="ex-079">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Hand-needlefelted wool miniature illustration, visible fibers, soft overcast light, moss green and warm peach, no glossy surfaces. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: badger bakery. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: An expansive environmental scene with foreground, middle distance and a tiny unexpected discovery in the background. \n Create an original illustrated cover with the exact title "BADGER BAKERY"; lettering belongs organically to the visual world, never a generic heading pasted over a stock image. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 4:3 original artwork. \n MEDIUM AND VISUAL LANGUAGE: H

<p class="ex-meta" id="ex-080">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 4:3 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Hand-scratched white lines on solid black board, dense crosshatching, tiny warm amber accents, fierce chiaroscuro. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: porcupine astronomer. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: A low viewpoint that makes the main subject monumental, with a tiny detail establishing scale. \n Integrate only the exact small title "PORCUPINE ASTRONOMER" using lettering appropriate to this medium; image remains dominant. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 2:3 original artwork. \n MEDIUM AND VISUAL LANGUAGE: L

<p class="ex-meta" id="ex-081">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 2:3 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Luminous stained-glass illustration with thick irregular lead divisions, jewel-colored panes, backlit bubbles and ancient glass imperfections. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: fox beneath an eclipse. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: A formally composed frontal view with rhythmic repetition and one surprising interruption. \n Create an original illustrated cover with the exact title "FOX BENEATH AN ECLIPSE"; lettering belongs organically to the visual world, never a generic heading pasted over a stock image. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 2:3 original artwork. \n MEDIUM AND VISUAL LANGUAGE: S

<p class="ex-meta" id="ex-082">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 2:3 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Strict pixel-art illustration with visible square pixels and limited 16-color palette, no blur, rich environmental storytelling. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: arctic seed vault. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: A low viewpoint that makes the main subject monumental, with a tiny detail establishing scale. \n Integrate only the exact small title "ARCTIC SEED VAULT" using lettering appropriate to this medium; image remains dominant. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: O

<p class="ex-meta" id="ex-083">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Opaque matte gouache illustration, visible broad brushwork, simplified intimate everyday scenes, dusty rose and cobalt. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: late summer picnic. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: A dense story-rich scene with several interacting elements, all subordinate to one unmistakable focal point. \n Create an original illustrated cover with the exact title "LATE SUMMER PICNIC"; lettering belongs organically to the visual world, never a generic heading pasted over a stock image. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 3:4 original artwork. \n MEDIUM AND VISUAL LANGUAGE: O

<p class="ex-meta" id="ex-084">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 3:4 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Obsessively detailed blue ballpoint drawing on pale paper, crosshatched shadows, scribbled energy and extreme fine-line density. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: ship built from leaves. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: A quiet asymmetric tableau balancing two different scales with a memorable silhouette. \n Integrate only the exact small title "SHIP BUILT FROM LEAVES" using lettering appropriate to this medium; image remains dominant. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: V

<p class="ex-meta" id="ex-085">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Vivid chalk pastel on rough dark pavement, powdery broken edges, overhead composition, playful handmade immediacy. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: street-length dragon. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: A formally composed frontal view with rhythmic repetition and one surprising interruption. \n This is a purely visual artwork. Do not include any text, lettering, captions, logos or words. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

#### FLUX 3 Image · generate · 官方 prompt：Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: C

<p class="ex-meta" id="ex-086">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_generate">来源</a></p>

```text
Create a finished 1:1 original artwork. \n MEDIUM AND VISUAL LANGUAGE: Chunky knitted soft sculpture scene, cable stitches and looped yarn, cozy imperfect forms, low winter light. Remain faithful to this specific medium, including its physical marks, lighting and limitations. \n SUBJECT AND STORY: scarf river. Invent the details from scratch and make the scene emotionally engaging and visually surprising. \n COMPOSITION: A winding visual path that leads through three spatial layers and returns to the subject. \n Create an original illustrated cover with the exact title "SCARF RIVER"; lettering belongs organically to the visual world, never a generic heading pasted over a stock image. \n Art direction: develop a coherent distinctive palette within this medium; use thoughtful contrast, beautifully observed texture and a memorable visual hierarchy. This must feel like a complete artwork, not a moodboard, not a sample grid and not a generic centered object poster. Fill the frame with the artwork. No decorative presentation border. Invent all characters and settings. Do not reproduce existing artworks, brands, mascots, recognizable franchise characters, signatures or campaigns. No reference image is supplied. No watermarks or web addresses.
```

### FLUX 3 Image 概览

来源：[flux_3_flux3_image_overview](https://docs.bfl.ml/flux_3/flux3_image_overview)

#### FLUX 3 Image 概览 · 编辑 record：In <ref_image_0>, change the large tiger <animal_1> and the small glowin

<p class="ex-meta" id="ex-099">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
In <ref_image_0>, change the large tiger <animal_1> and the small glowing butterfly <insect_1> to be pink. Keep the massive fallen log <log_1>, the falling snow <snow_1>, and the dark background trees <trees_1> exactly unchanged. [{"id":"animal_1","from":null,"src_bbox":null,"tgt_bbox":[250,50,850,650],"desc":"Make both pink."},{"id":"insect_1","from":null,"src_bbox":null,"tgt_bbox":[650,680,750,750],"desc":"Make both pink."},{"id":"log_1","from":"ref_image_0","src_bbox":[600,0,1000,1000],"tgt_bbox":[600,0,1000,1000],"desc":"A massive, fallen tree log stretching horizontally across the foreground. The surface features deep, rough-textured bark, weathered cracks, and small pockets of frost."},{"id":"snow_1","from":"ref_image_0","src_bbox":[0,0,1000,1000],"tgt_bbox":[0,0,1000,1000],"desc":"Numerous white snowflakes of varying sizes falling across the scene. Some flakes are sharp and distinct, while others closer to the lens appear as blurred white streaks."},{"id":"trees_1","from":"ref_image_0","src_bbox":[0,0,650,1000],"tgt_bbox":[0,0,650,1000],"desc":"A dense stand of tall, dark, vertical tree trunks receding into the distance. A cool, blue misty light permeates the spaces between the trees, glowing most intensely from the right edge."}]
```

#### FLUX 3 Image 概览 · 编辑 record：Modify <ref_image_0> by making three replacements. On the lower left pat

<p class="ex-meta" id="ex-100">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Modify <ref_image_0> by making three replacements. On the lower left path, replace the tiny anthropomorphic wolf with a cyberpunk dog <wolf_1>. On the lower right, replace the fallen frosted bamboo log with a fallen bamboo leaf made out of gold <log_1>. In the middle of the misty forest, replace the small dark bird perched on a branch with a bird made out of a robot <bird_1>. Keep the rest of the scene exactly unchanged, preserving the dense upper bamboo leaves <bamboo_1>, the vertical bamboo trunks <bamboo_2> receding into the fog, the frosted ground and lower stalks <bamboo_3>, the dramatic slanting sunbeams <light_1>, the thick foreground bamboo trunk <bamboo_4> on the right, the frozen stream <stream_1>, the stone lantern <lantern_1>, and the floating frost flakes <particles_1>.
```

#### FLUX 3 Image 概览 · 编辑 record：In <ref_image_0>, move the miniature grey amigurumi knight figure <knigh

<p class="ex-meta" id="ex-101">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
In <ref_image_0>, move the miniature grey amigurumi knight figure <knight_1> upwards and to the left along the yarn cliff <cliff_1>. Leave the polished steel tapestry needle <needle_1> in its original position in the air. Keep the rest of the image completely unchanged, preserving the blurred yarn backdrop <backdrop_1>, the large knitted dragon <dragon_1>, and the fiery orange thread <fire_1> suspended between them. [{"id":"knight_1","from":"ref_image_0","src_bbox":[500,150,850,350],"tgt_bbox":[194,55,544,255],"desc":"A miniature amigurumi knight figure crocheted from thick grey woolen yarn. It has visible, intricate stitches forming a rounded helmet shape and a cylindrical body, with tiny stubby arms reaching upwards against the cliff."},{"id":"backdrop_1","from":"ref_image_0","src_bbox":[0,0,1000,1000],"tgt_bbox":[0,0,1000,1000],"desc":"A soft, out-of-focus expanse of cream ivory and melange indigo knitted yarn, providing a blurred studio backdrop with tangible fiber fuzz catching the ambient light."},{"id":"cliff_1","from":"ref_image_0","src_bbox":[300,0,1000,450],"tgt_bbox":[300,0,1000,450],"desc":"A steep, uneven cliff face constructed from stacked, thick yarn skeins in rich shades of mustard yellow, terracotta, and melange indigo, featuring visible woven wool textures and loose, stray fiber strands."},{"id":"needle_1","from":"ref_image_0","src_bbox":[420,250,550,450],"tgt_bbox":[420,250,550,450],"desc":"A real, oversized polished steel tapestry needle, gleaming under the studio lighting. It features a blunt tip and an elongated eye, grasped like a weapon in the knight'
```

#### FLUX 3 Image 概览 · 编辑 record：In <ref_image_0>, replace the tiny anthropomorphic wolf standing on the 

<p class="ex-meta" id="ex-102">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
In <ref_image_0>, replace the tiny anthropomorphic wolf standing on the left side of the frosty path with a dog <wolf_1>. Keep the rest of the image exactly unchanged, including the illuminated upper bamboo leaves <bamboo_1>, the shadowed vertical trunks <bamboo_2>, the frost-covered lower stalks and ground <bamboo_3>, the slanting shafts of light <light_1>, the massive foreground trunk <bamboo_4>, the fallen hollow log <log_1>, the frozen stream <stream_1>, the stone lantern <lantern_1>, the floating frost flakes <particles_1>, and the small perched bird <bird_1>.
```

#### FLUX 3 Image 概览 · 编辑 record：In <ref_image_0>, change the bright red hooded jacket worn by the person

<p class="ex-meta" id="ex-103">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
In <ref_image_0>, change the bright red hooded jacket worn by the person <person_1> standing atop the rock pinnacle <rock_1> to blue. Keep everything else in the image exactly unchanged, including the text <En_Text_1>, the overcast sky <sky_1>, the distant hills <hills_1>, the composition, and the lighting.
```

#### FLUX 3 Image 概览 · 官方 caption：Minimalist graphic illustration featuring a black silhouette of a person

<p class="ex-meta" id="ex-104">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame. The image relies entirely on the high-contrast relationship between the two colors, mimicking a digital recreation of a screen-printed or risograph aesthetic, with no discernible light source or shadow. [{"id":"background_1","bbox":[0,0,1000,1000],"desc":"A flat field of neon yellow-green possessing a subtle, tactile paper texture with fine, organic grain and slight variations in color saturation, giving the flat surface a sense of physical depth."},{"id":"silhouette_1","bbox":[150,150,850,850],"desc":"A black silhouette of a person in motion, composed of a dense, stippled texture that resembles physical ink on paper or a low-resolution digital dither. The leading edges, including the front of the head, chest, and forward leg, are relatively solid and opaque. The trailing edges, such as the back, outstretched rear arm, and lifted back leg, dissolve into a spray of coarse, square-shaped pixels and scattered dots. The black ink shows a slight textural irregularity, as if pressed onto a porous surface."}]
```

#### FLUX 3 Image 概览 · 官方 caption：High-angle black and white photograph with a grainy film texture. In the

<p class="ex-meta" id="ex-105">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
High-angle black and white photograph with a grainy film texture. In the right foreground, a brightly lit, pale, flat rooftop <rooftop_1> anchors the composition. Four men in dark suits <person_1> <person_2> <person_3> <person_4> walk in mid-stride towards the right edge of the building, rendered almost entirely as silhouettes against the stark surface. They cast long, sharp diagonal shadows that stretch out before them under harsh, directional lighting. To the left, a plunging view reveals a deep urban canyon and a congested city street <street_1> far below, bisecting the dense architecture. The avenue is packed with a multitude of cars and buses <vehicle_collection_1> appearing as small dark shapes, alongside tiny figures of pedestrians <pedestrian_collection_1> dotting the sidewalks and crosswalks. The street is sharply split by light and shadow, with the left side plunged into deep darkness while the right catches intense sunlight. A faint haze or smoke <haze_1> drifts near the lower central portion of the canyon. The background is filled with towering, monolithic skyscrapers <skyscraper_collection_1> featuring repetitive grids of windows. The buildings recede into the distance, their details softening in the atmospheric perspective.
```

#### FLUX 3 Image 概览 · 官方 caption：A stylized digital illustration in a flat, graphic anime style, resembli

<p class="ex-meta" id="ex-106">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A stylized digital illustration in a flat, graphic anime style, resembling a modern pop-art poster with non-directional, uniform lighting. The composition is built on a vibrant background <background_1>. Framed in a medium close-up from the chest up, a young demonic woman <character_1> occupies the center, angled in a three-quarter view and looking back over her shoulder. Large, bold Japanese typography <Ja_Text_1> runs down the left side of the frame, while another block of typography <Ja_Text_2> is positioned in the upper right section. In the lower right corner rests a square seal <Ja_Text_3>. At the bottom center, a line of bright text <Ja_Text_4> sits directly above a smaller line of text <Unknown_Text_1>.
```

#### FLUX 3 Image 概览 · 官方 caption：Vertical 35mm photograph with fine grain and slightly soft focus. Center

<p class="ex-meta" id="ex-107">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Vertical 35mm photograph with fine grain and slightly soft focus. Centered at the top is a cream-colored title <Fr_Text_1>. A hazy, pale grey and green overcast sky <sky_1> sits above dark, rolling mountains <mountains_1> and a distant coastal town <town_1> on the right. In the dark water <water_1> of a bay stands a massive, pale concrete parabolic dome <dome_1>. The dome's arched opening faces the shore, radiating a warm, golden-orange glow from its interior. A dark rectangular monolith <monolith_1> sits deep inside at water level. The golden light reflects on the rippling water, where scattered silhouettes of people <swimmers_1> wade. In the foreground, a pale, pebbly beach <beach_1> holds a large crowd of seated onlookers <crowd_1> in casual, light-colored clothing. Their backs are to the slightly elevated camera as they gaze at the structure under blue hour lighting.
```

#### FLUX 3 Image 概览 · 官方 caption：Monochromatic graphic design poster framed by solid black letterbox bars

<p class="ex-meta" id="ex-108">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Monochromatic graphic design poster framed by solid black letterbox bars at the top <bar_1> and bottom <bar_2>. The background is a textured, off-white surface <background_1>. Dominating the left side of the vertical frame is a large, abstract black mass <mass_1>. To the right of this mass, stacked lowercase text is printed <En_Text_1>. Further down on the right side, a second block of text sits <En_Text_2>. Near the bottom center, positioned below the abstract mass and to the left of the lower text, is a pair of disembodied eyes <eyes_1>. The entire composition features a distressed, photocopy-like aesthetic with heavy grain, noise, and stark black-and-white contrast.
```

#### FLUX 3 Image 概览 · 官方 caption：Full-color graphic design on a solid black background <background_1>. Th

<p class="ex-meta" id="ex-109">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Full-color graphic design on a solid black background <background_1>. The composition features two tall, narrow rectangular panels styled as perforated postage stamps, separated by a vertical black gutter. The left panel <panel_1> is rendered in the style of a traditional Japanese ukiyo-e woodblock print with aged paper texture, subtle grain, and ink bleed, depicting dark, craggy rocks and lush green foreground foliage. Down the center of this panel, a cascading waterfall <waterfall_1> tumbles over the rocks. A small wooden bridge <bridge_1> spans the chasm in the middle ground, where two figures stand. On the left is a figure in a light blue kimono and straw hat <person_1>, and on the right is a figure in a purple kimono holding a red parasol <person_2>. White text overlays the left panel at the top <En_Text_1> and bottom <En_Text_2>. The right panel <panel_2> shares the same ukiyo-e style, perforated edges, and horizontal segment divisions, showing a serene landscape. At the top, a sloping mountain <mountain_1> sits under a gradient twilight sky with silhouetted pine trees. In the middle ground, a traditional Japanese house <house_1> rests on a rocky cliff, its windows emitting a warm yellow light. Below the cliff, a rushing turquoise river <river_1> filled with dark grey boulders flows through the foreground. White text is overlaid on the right panel at the top <En_Text_3>, middle <En_Text_4>, and bottom <En_Text_5>. Both panels feature bold outlines, flat areas of color, and high-angle perspectives.
```

#### FLUX 3 Image 概览 · 官方 caption：Full-color outdoor photograph with a shallow depth of field, taken under

<p class="ex-meta" id="ex-110">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Full-color outdoor photograph with a shallow depth of field, taken under overcast daytime light at a winter sporting event. A medium close-up captures a row of spectators, focusing on a woman <person_1> seated in the left foreground in profile, facing right. Tucked into her coat and held closely in her lap is a small Pomeranian dog <animal_1>. Seated slightly out of alignment next to her on the right is a man <person_2>, also in profile facing right, holding a Jack Russell Terrier <animal_2> in his lap. Extending to the left behind them is a row of softly blurred spectators, including two blonde women <person_3> <person_4> wearing winter attire. In the background, a hillside covered with dark evergreen trees <region_1> rises against a pale sky. To the upper right, event structures are visible, featuring a white flag <flag_3>, a German flag <flag_1>, a Swiss flag <flag_2>, and a blue banner <structure_1> bearing illegible white text. The composition contrasts the warm browns of the fur coats and dogs with the cooler blues of denim jeans and the muted winter landscape.
```

#### FLUX 3 Image 概览 · 官方 caption：Studio photograph of a fashion mood board arranged as a grid of fifteen 

<p class="ex-meta" id="ex-111">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Studio photograph of a fashion mood board arranged as a grid of fifteen rectangular images separated by clean white borders <board_1>. The top row contains five images: a woman sitting with a wide stance in a black leather jumpsuit <image_1>, a close-up of legs in red tights <image_2>, a blurred figure in a dark blue velvet garment <image_3>, a woman in a black ribbed turtleneck with closed eyes <image_4>, and a black-and-white shot of legs in high heels on a chair <image_5>. The middle row features a high-contrast face close-up <image_6>, a portrait of a woman with closed eyes and a pearl earring <image_7>, the back of a head with wavy hair being combed <image_8>, a motion-blurred facial profile <image_9>, and a figure mid-stride in a dark skirt and boots <image_10>. The bottom row displays a black-and-white profile of a bob haircut <image_11>, an extreme close-up of an eye and damp hair <image_12>, white flower petals on a black background <image_13>, a low-angle shot of a teal leather jacket and silver trousers <image_14>, and a close-up of a hand wearing silver rings <image_15>.
```

#### FLUX 3 Image 概览 · 官方 caption：Full-color indoor 35mm photograph with a slight film grain and a warm co

<p class="ex-meta" id="ex-112">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Full-color indoor 35mm photograph with a slight film grain and a warm color cast, lit by harsh, direct camera flash that casts sharp shadows against the background. A light-colored wooden bench <bench_1> sits against a wall of horizontal light-wood panels <wall_1>. On the floor beneath the bench is a vibrant moss-green rug <rug_1>. Seated on the left side of the bench is a man <person_1> captured mid-sip from a glass of amber liquid <glass_1>. In the center sits a humanoid figure <figure_1>. To the right, another man <person_2> sits with a slumped posture, looking downward at a second glass of amber liquid <glass_2> held in his hand. The framing is a full-body shot centered on the three figures, leaving a significant expanse of the wood-paneled wall visible above their heads.
```

#### FLUX 3 Image 概览 · 官方 caption：Digital composite image featuring a dense, sunlit forest <forest_1> as t

<p class="ex-meta" id="ex-113">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Digital composite image featuring a dense, sunlit forest <forest_1> as the background, shot at eye level. Centered in the foreground is a large, semi-transparent rectangular graphic overlay. Its upper section <region_4> is a subtle clear tint over the canopy. The middle section of the overlay is divided horizontally into two bands. The top band <region_1> consists of vertical stripes alternating between clear transparency and translucent chartreuse yellow, ending in a solid chartreuse square on the far right that contains a black directional sign <En_Text_1>. The lower band <region_2> mirrors this structure with alternating clear and chartreuse stripes, ending in a solid chartreuse square on the far left that holds another black directional sign <En_Text_2>. Below these striped bands, the overlay continues downwards as a dark, slightly distorted filter <region_3> covering the lower forest foliage, creating a sharp contrast between the organic textures of the woods and the crisp, straight edges of the rectangle.
```

#### FLUX 3 Image 概览 · 官方 caption：Formal digital collage serving as a fashion mood board, structured into 

<p class="ex-meta" id="ex-114">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Formal digital collage serving as a fashion mood board, structured into rectangular panels separated by thin white borders against a stark white background canvas. In the upper left, a square panel <panel_1> sits beside a taller rectangular panel <panel_2> in the upper middle, with another square panel <panel_3> on the upper right. Running vertically down the left margin is a text block <En_Text_1>. The middle section is dominated by a large, wide panel <panel_4>. Below this, a horizontal row contains four smaller detail panels: the first <panel_5> on the left, the second <panel_6> next to it, the third <panel_7> in the mid-right, and the fourth <panel_8> on the far right, which contains a visible woven label <En_Text_4>. Along the bottom edge, a block of sans-serif text <En_Text_2> sits on the left, while a large script signature <En_Text_3> spans the bottom right.
```

#### FLUX 3 Image 概览 · 官方 caption：Full-color outdoor photograph with a slight film grain and shallow depth

<p class="ex-meta" id="ex-115">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Full-color outdoor photograph with a slight film grain and shallow depth of field, captured from a ground-level, low-angle perspective in an urban park. Warm, directional late-afternoon sunlight filters through a dense canopy of deciduous trees <trees_1> in the background. Occupying the center and extending to the left is a white picnic blanket with thin red horizontal stripes <blanket_1>. A young girl of East Asian descent <girl_1> lies prone on the blanket, leaning forward on her elbows. Her left hand rests near her chest with fingers slightly curled, while her right hand extends toward the right edge of the frame. Just off the blanket on the green grass <grass_1> stands a small brown sparrow <sparrow_1> facing her. In the lower right foreground, a second sparrow <sparrow_2> is partially visible, heavily blurred by the shallow depth of field. Scattered on the left side of the blanket are several picnic items: a clear plastic water bottle with a blue cap <bottle_1>, a red cardboard box <box_1> displaying white text <En_Text_1>, scattered papers <papers_1>, and a small open snack container <container_1>. In the blurred background, a black lamppost <lamppost_1> stands among the trees, and several distant, out-of-focus figures <figures_1> are visible walking and sitting on benches.
```

#### FLUX 3 Image 概览 · 官方 caption：Digital graphic design mockup shot straight-on with a top-down view unde

<p class="ex-meta" id="ex-116">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Digital graphic design mockup shot straight-on with a top-down view under flat, even studio-style lighting. A flat, neutral gray background <background_1> fills the frame. Centered in the composition is a vertical, rectangular black poster <poster_1>, appearing to hover just above the surface due to a soft, diffuse drop shadow extending along its left and bottom edges. The poster displays the complete English alphabet rendered in stark white with a geometric glitch aesthetic, featuring horizontal shifts and missing angular slices. The letters are arranged systematically across five horizontal rows: the first row <En_Text_1>, the second row <En_Text_2>, the third row <En_Text_3>, the fourth row <En_Text_4>, and the fifth row <En_Text_5>. Centered near the bottom edge of the poster is a logo <graphic_1>. Immediately below this emblem, a small line of text <En_Text_6> completes the design.
```

#### FLUX 3 Image 概览 · 官方 caption：Full-color architectural photograph shot on 35mm film from a low-angle p

<p class="ex-meta" id="ex-117">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Full-color architectural photograph shot on 35mm film from a low-angle perspective at ground level, featuring bright, direct sunlight and visible film grain. Under a clear, pale blue sky <sky_1>, a Brutalist concrete structure <building_1> dominates the right and center of the frame. The building features three clusters of tall, nested parabolic arches. At the base of the central section, a flat concrete overhang <overhang_1> shelters a small, dark entrance <entrance_1>. Mounted on the overhang is a large, rectangular red sign <sign_1> displaying a circular emblem <emblem_1> on the left, a line of Georgian script <Ka_Text_1> on top, and English text <En_Text_1> below. Along the ledge behind the sign, several small flags on thin poles <flags_1> are visible. To the left stands a portion of an older, traditional building <building_2> with a slender, tiered tower topped by a metallic spire and a five-pointed star. In the foreground on the far left, a dark green coniferous tree <tree_1> partially obscures the lower levels of a glass-fronted building <building_3>. The structures sit behind a wide set of shallow concrete steps <steps_1> that lead down to a paved plaza made of grey stone blocks <plaza_1> filling the bottom of the frame.
```

#### FLUX 3 Image 概览 · 官方 idea：Night at a Japanese restaurant: two diners in red light at the table, a 

<p class="ex-meta" id="ex-118">类型：idea · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Night at a Japanese restaurant: two diners in red light at the table, a lit pine garden outside.
```

#### FLUX 3 Image 概览 · 官方 caption：High-angle, full-color 35mm indoor-outdoor film photograph captured at n

<p class="ex-meta" id="ex-119">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
High-angle, full-color 35mm indoor-outdoor film photograph captured at night, featuring visible grain, deep shadows, and a shallow depth of field that renders the foreground in an atmospheric blur. The composition divides a dimly lit interior dining area on the right from an illuminated exterior garden on the left. In the blurred foreground, bathed in deep, monochromatic red light, two silhouetted figures sit at a dining table <table_1>. A young child with dark hair <person_1> faces the camera as an out-of-focus red shape, while the profile of an adult <person_2> occupies the right edge. Between them, the table holds blurred dishes <dishes_1> and a small candle <candle_1> that provides a warm orange point of light. Through a large window on the left, the sharp exterior scene is set against a pitch-black night sky <sky_1>. A Japanese pine tree <tree_1> is illuminated by a cool, artificial green light, resolving its textured bark and dense needle clusters. Below the tree, a low bamboo fence <fence_1> runs horizontally. Further back, a stone-paved path <path_1> leads into the dark garden, dotted with a few scattered warm-toned lights <lights_1>.
```

#### FLUX 3 Image 概览 · 官方 idea：A magazine cover called Tools: a tower of wooden Kapla planks under big 

<p class="ex-meta" id="ex-120">类型：idea · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A magazine cover called Tools: a tower of wooden Kapla planks under big blue serif type.
```

#### FLUX 3 Image 概览 · 官方 caption：Studio photograph of a publication cover set against a seamless, stark w

<p class="ex-meta" id="ex-121">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Studio photograph of a publication cover set against a seamless, stark white background. Centered in the vertical frame is a tall architectural structure <structure_1> built from small, uniform wooden planks. Bright, even softbox lighting casts soft, subtle shadows at the base of the construction and within its gaps. Dominating the upper third of the composition is a large title <En_Text_1>, its lower edge partially obscured by the top of the wooden structure. At the bottom of the frame, a smaller subtitle <En_Text_2> stretches horizontally. Tucked into the bottom-left corner is a vertical barcode <barcode_1> accompanied by stacked price markings <En_Text_3>.
```

#### FLUX 3 Image 概览 · 官方 idea：A 4x4 sheet of minimalist poster layouts in sage green and black, each u

<p class="ex-meta" id="ex-122">类型：idea · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A 4x4 sheet of minimalist poster layouts in sage green and black, each using the letters CFHKNP.
```

#### FLUX 3 Image 概览 · 官方 caption：Flat, two-dimensional graphic design layout on a plain white background,

<p class="ex-meta" id="ex-123">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
Flat, two-dimensional graphic design layout on a plain white background, presenting a four-by-four grid of sixteen rectangular wireframe panels separated by even white margins. The minimalist study explores spatial relationships using a strictly limited palette of white, black, and muted sage green. The top row features four distinct compositions: a panel <panel_1> with a green circle and a central typographic anchor <En_Text_1>, a panel <panel_2> containing a green square and vertical text <En_Text_2>, a panel <panel_3> centered on an organic wavy blob beneath curved text <En_Text_3>, and a panel <panel_4> displaying a sage-green bottle silhouette beside spaced lettering <En_Text_4>. In the second row, a panel <panel_5> with an upward triangle and bottom-right text <En_Text_5> sits next to a panel <panel_6> holding twin rectangles and vertical text <En_Text_6>. Beside them, a panel <panel_7> splits a circle around central text <En_Text_7>, while the row ends with a panel <panel_8> balancing a rotated square above its text <En_Text_8>. The third row begins with a panel <panel_9> featuring a tall rectangular sidebar and top-right text <En_Text_9>, followed by a panel <panel_10> with a lower blob and vertical text <En_Text_10>. A panel <panel_11> pairs a top-right circle with downward-curving text <En_Text_11>, and a panel <panel_12> anchors a wide bottom rectangle under top-aligned text <En_Text_12>. The bottom row completes the grid with a panel <panel_13> pointing a triangle rightward beside vertical text <En_Text_13>, a panel <panel_14> centering a large rectangle and overlaid text <En_Text_14>, a panel <panel_15> with a bottom half-circle and top-aligned text <En_Text_15>, and a final panel <panel_16> presenting a tiny grid of squares next to vertical text <En_Text_16>. In every panel, varied densities of black horizontal lines simulate body text, interacting dynamically with the shapes and typography to create a balanced structural design.
```

#### FLUX 3 Image 概览 · 官方 prompt：A candid photograph from the wings of a theater, looking out at ballet d

<p class="ex-meta" id="ex-124">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A candid photograph from the wings of a theater, looking out at ballet dancers performing Swan Lake. Dark, blurred onlookers fill the foreground; on stage, ballerinas in white tutus are caught mid-motion under a strong central spotlight. Deep blacks, shadowy purples, and stark white. Grainy mid-20th-century color film, shallow depth of field.
```

#### FLUX 3 Image 概览 · 官方 prompt：A wide-angle photograph of a lone American bison walking through a misty

<p class="ex-meta" id="ex-125">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A wide-angle photograph of a lone American bison walking through a misty geothermal landscape. The dark brown bison stands in profile at the lower left, half hidden by white steam. A slate-blue stream winds past a tall dead tree, with evergreens fading into the mist behind. Muted, cool palette, soft overcast light.
```

#### FLUX 3 Image 概览 · 官方 prompt：A crowded public pool on a hot day, photographed from a high platform: e

<p class="ex-meta" id="ex-126">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A crowded public pool on a hot day, photographed from a high platform: eighty swimmers, each individually posed, arranged like a painting. In the lower left, one woman stares up at the camera with unexplained dread. Hyper-saturated candy colour, hard sunlight.
```

#### FLUX 3 Image 概览 · 官方 prompt：A Schlieren photograph that makes air visible: a dark silhouette in prof

<p class="ex-meta" id="ex-127">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A Schlieren photograph that makes air visible: a dark silhouette in profile at the right, exhaling. The breath spreads left as turbulent silvery grey plumes and curling vortices against a featureless grey disc of light.
```

#### FLUX 3 Image 概览 · 官方 prompt：A split-level photograph from a half-submerged dome port in a cold lake 

<p class="ex-meta" id="ex-128">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A split-level photograph from a half-submerged dome port in a cold lake at dawn. Below, a swimmer in a black cap hangs mid-stroke in dark green water; above, mist, a pine shoreline, and a pale orange sunrise.
```

#### FLUX 3 Image 概览 · 官方 prompt：A six-month solargraph from a pinhole camera: an industrial harbour in s

<p class="ex-meta" id="ex-129">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A six-month solargraph from a pinhole camera: an industrial harbour in soft inverted browns and mauves. More than a hundred white sun trails arc across the sky, with ghostly cranes, light leaks, and chemical stains.
```

#### FLUX 3 Image 概览 · 官方 prompt：A cemetery on colour infrared film at midday: foliage and grass glow can

<p class="ex-meta" id="ex-130">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A cemetery on colour infrared film at midday: foliage and grass glow candy pink, the sky turns deep cyan, and pale headstones stay neutral. A lone figure in a dark coat sits on a bench, facing away. Grainy and dreamlike.
```

#### FLUX 3 Image 概览 · 官方 prompt：A high-speed flash photograph against pure black: a ripe plum split open

<p class="ex-meta" id="ex-131">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A high-speed flash photograph against pure black: a ripe plum split open by a thrown pebble, a crown of sharp juice droplets suspended around it. Deep purple and gold, extreme macro detail.
```

#### FLUX 3 Image 概览 · 官方 prompt：A vast pink salt flat at low sun, cracked into hexagonal plates. Far out

<p class="ex-meta" id="ex-132">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A vast pink salt flat at low sun, cracked into hexagonal plates. Far out stands a figure in a glowing orange mesh coat and mirrored helmet, with three flamingos reflected in the water. Palette: burnt orange (#FF6B35), peach (#F7C59F), cream (#EFEFD0), and deep blue (#004E89).
```

#### FLUX 3 Image 概览 · 官方 prompt：A 1970s pedestrian underpass with a strong central vanishing point. A mo

<p class="ex-meta" id="ex-133">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A 1970s pedestrian underpass with a strong central vanishing point. A model in a silver sequin gown and oversized leather bomber stands against the left wall; at the far end, a fox looks back at her. Cold green strip lighting, 28mm, deadpan and cinematic.
```

#### FLUX 3 Image 概览 · 官方 prompt：replace the cartridge from image 1 with the van in image 2, adjust the l

<p class="ex-meta" id="ex-134">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
replace the cartridge from image 1 with the van in image 2, adjust the lighting on the van to integrate well within image 1
```

#### FLUX 3 Image 概览 · 官方 prompt：A photograph of this year's official Oktoberfest poster

<p class="ex-meta" id="ex-135">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">来源</a></p>

```text
A photograph of this year's official Oktoberfest poster
```

### 提示词一页总览

来源：[guides_prompting_summary](https://docs.bfl.ml/guides/prompting_summary)

#### 提示词一页总览 · 官方 prompt：Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cli

<p class="ex-meta" id="ex-238">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_summary">来源</a></p>

```text
Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cliffs on one side, turquoise sea on the other, a single vintage car with headlights on, soft golden rim light
```

### Prompting Basics

来源：[guides_prompting_unified_basics](https://docs.bfl.ml/guides/prompting_unified_basics)

#### Prompting Basics · 官方 caption：Minimalist graphic illustration featuring a black silhouette of a person

<p class="ex-meta" id="ex-239">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame. The image relies entirely on the high-contrast relationship between the two colors, mimicking a digital recreation of a screen-printed or risograph aesthetic, with no discernible light source or shadow. [{"id":"background_1","bbox":[0,0,1000,1000],"desc":"A flat field of neon yellow-green possessing a subtle, tactile paper texture with fine, organic grain and slight variations in color saturation, giving the flat surface a sense of physical depth."},{"id":"silhouette_1","bbox":[150,150,850,850],"desc":"A black silhouette of a person in motion, composed of a dense, stippled texture that resembles physical ink on paper or a low-resolution digital dither. The leading edges, including the front of the head, chest, and forward leg, are relatively solid and opaque. The trailing edges, such as the back, outstretched rear arm, and lifted back leg, dissolve into a spray of coarse, square-shaped pixels and scattered dots. The black ink shows a slight textural irregularity, as if pressed onto a porous surface."}]
```

#### Prompting Basics · 官方 caption：High-angle black and white photograph with a grainy film texture. In the

<p class="ex-meta" id="ex-240">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
High-angle black and white photograph with a grainy film texture. In the right foreground, a brightly lit, pale, flat rooftop <rooftop_1> anchors the composition. Four men in dark suits <person_1> <person_2> <person_3> <person_4> walk in mid-stride towards the right edge of the building, rendered almost entirely as silhouettes against the stark surface. They cast long, sharp diagonal shadows that stretch out before them under harsh, directional lighting. To the left, a plunging view reveals a deep urban canyon and a congested city street <street_1> far below, bisecting the dense architecture. The avenue is packed with a multitude of cars and buses <vehicle_collection_1> appearing as small dark shapes, alongside tiny figures of pedestrians <pedestrian_collection_1> dotting the sidewalks and crosswalks. The street is sharply split by light and shadow, with the left side plunged into deep darkness while the right catches intense sunlight. A faint haze or smoke <haze_1> drifts near the lower central portion of the canyon. The background is filled with towering, monolithic skyscrapers <skyscraper_collection_1> featuring repetitive grids of windows. The buildings recede into the distance, their details softening in the atmospheric perspective.
```

#### Prompting Basics · 官方 caption：A stylized digital illustration in a flat, graphic anime style, resembli

<p class="ex-meta" id="ex-241">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
A stylized digital illustration in a flat, graphic anime style, resembling a modern pop-art poster with non-directional, uniform lighting. The composition is built on a vibrant background <background_1>. Framed in a medium close-up from the chest up, a young demonic woman <character_1> occupies the center, angled in a three-quarter view and looking back over her shoulder. Large, bold Japanese typography <Ja_Text_1> runs down the left side of the frame, while another block of typography <Ja_Text_2> is positioned in the upper right section. In the lower right corner rests a square seal <Ja_Text_3>. At the bottom center, a line of bright text <Ja_Text_4> sits directly above a smaller line of text <Unknown_Text_1>.
```

#### Prompting Basics · 官方 caption：Vertical 35mm photograph with fine grain and slightly soft focus. Center

<p class="ex-meta" id="ex-242">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Vertical 35mm photograph with fine grain and slightly soft focus. Centered at the top is a cream-colored title <Fr_Text_1>. A hazy, pale grey and green overcast sky <sky_1> sits above dark, rolling mountains <mountains_1> and a distant coastal town <town_1> on the right. In the dark water <water_1> of a bay stands a massive, pale concrete parabolic dome <dome_1>. The dome's arched opening faces the shore, radiating a warm, golden-orange glow from its interior. A dark rectangular monolith <monolith_1> sits deep inside at water level. The golden light reflects on the rippling water, where scattered silhouettes of people <swimmers_1> wade. In the foreground, a pale, pebbly beach <beach_1> holds a large crowd of seated onlookers <crowd_1> in casual, light-colored clothing. Their backs are to the slightly elevated camera as they gaze at the structure under blue hour lighting.
```

#### Prompting Basics · 官方 caption：Monochromatic graphic design poster framed by solid black letterbox bars

<p class="ex-meta" id="ex-243">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Monochromatic graphic design poster framed by solid black letterbox bars at the top <bar_1> and bottom <bar_2>. The background is a textured, off-white surface <background_1>. Dominating the left side of the vertical frame is a large, abstract black mass <mass_1>. To the right of this mass, stacked lowercase text is printed <En_Text_1>. Further down on the right side, a second block of text sits <En_Text_2>. Near the bottom center, positioned below the abstract mass and to the left of the lower text, is a pair of disembodied eyes <eyes_1>. The entire composition features a distressed, photocopy-like aesthetic with heavy grain, noise, and stark black-and-white contrast.
```

#### Prompting Basics · 官方 caption：Full-color graphic design on a solid black background <background_1>. Th

<p class="ex-meta" id="ex-244">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Full-color graphic design on a solid black background <background_1>. The composition features two tall, narrow rectangular panels styled as perforated postage stamps, separated by a vertical black gutter. The left panel <panel_1> is rendered in the style of a traditional Japanese ukiyo-e woodblock print with aged paper texture, subtle grain, and ink bleed, depicting dark, craggy rocks and lush green foreground foliage. Down the center of this panel, a cascading waterfall <waterfall_1> tumbles over the rocks. A small wooden bridge <bridge_1> spans the chasm in the middle ground, where two figures stand. On the left is a figure in a light blue kimono and straw hat <person_1>, and on the right is a figure in a purple kimono holding a red parasol <person_2>. White text overlays the left panel at the top <En_Text_1> and bottom <En_Text_2>. The right panel <panel_2> shares the same ukiyo-e style, perforated edges, and horizontal segment divisions, showing a serene landscape. At the top, a sloping mountain <mountain_1> sits under a gradient twilight sky with silhouetted pine trees. In the middle ground, a traditional Japanese house <house_1> rests on a rocky cliff, its windows emitting a warm yellow light. Below the cliff, a rushing turquoise river <river_1> filled with dark grey boulders flows through the foreground. White text is overlaid on the right panel at the top <En_Text_3>, middle <En_Text_4>, and bottom <En_Text_5>. Both panels feature bold outlines, flat areas of color, and high-angle perspectives.
```

#### Prompting Basics · 官方 caption：Full-color outdoor photograph with a shallow depth of field, taken under

<p class="ex-meta" id="ex-245">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Full-color outdoor photograph with a shallow depth of field, taken under overcast daytime light at a winter sporting event. A medium close-up captures a row of spectators, focusing on a woman <person_1> seated in the left foreground in profile, facing right. Tucked into her coat and held closely in her lap is a small Pomeranian dog <animal_1>. Seated slightly out of alignment next to her on the right is a man <person_2>, also in profile facing right, holding a Jack Russell Terrier <animal_2> in his lap. Extending to the left behind them is a row of softly blurred spectators, including two blonde women <person_3> <person_4> wearing winter attire. In the background, a hillside covered with dark evergreen trees <region_1> rises against a pale sky. To the upper right, event structures are visible, featuring a white flag <flag_3>, a German flag <flag_1>, a Swiss flag <flag_2>, and a blue banner <structure_1> bearing illegible white text. The composition contrasts the warm browns of the fur coats and dogs with the cooler blues of denim jeans and the muted winter landscape.
```

#### Prompting Basics · 官方 caption：Studio photograph of a fashion mood board arranged as a grid of fifteen 

<p class="ex-meta" id="ex-246">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Studio photograph of a fashion mood board arranged as a grid of fifteen rectangular images separated by clean white borders <board_1>. The top row contains five images: a woman sitting with a wide stance in a black leather jumpsuit <image_1>, a close-up of legs in red tights <image_2>, a blurred figure in a dark blue velvet garment <image_3>, a woman in a black ribbed turtleneck with closed eyes <image_4>, and a black-and-white shot of legs in high heels on a chair <image_5>. The middle row features a high-contrast face close-up <image_6>, a portrait of a woman with closed eyes and a pearl earring <image_7>, the back of a head with wavy hair being combed <image_8>, a motion-blurred facial profile <image_9>, and a figure mid-stride in a dark skirt and boots <image_10>. The bottom row displays a black-and-white profile of a bob haircut <image_11>, an extreme close-up of an eye and damp hair <image_12>, white flower petals on a black background <image_13>, a low-angle shot of a teal leather jacket and silver trousers <image_14>, and a close-up of a hand wearing silver rings <image_15>.
```

#### Prompting Basics · 官方 caption：Full-color indoor 35mm photograph with a slight film grain and a warm co

<p class="ex-meta" id="ex-247">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Full-color indoor 35mm photograph with a slight film grain and a warm color cast, lit by harsh, direct camera flash that casts sharp shadows against the background. A light-colored wooden bench <bench_1> sits against a wall of horizontal light-wood panels <wall_1>. On the floor beneath the bench is a vibrant moss-green rug <rug_1>. Seated on the left side of the bench is a man <person_1> captured mid-sip from a glass of amber liquid <glass_1>. In the center sits a humanoid figure <figure_1>. To the right, another man <person_2> sits with a slumped posture, looking downward at a second glass of amber liquid <glass_2> held in his hand. The framing is a full-body shot centered on the three figures, leaving a significant expanse of the wood-paneled wall visible above their heads.
```

#### Prompting Basics · 官方 caption：Digital composite image featuring a dense, sunlit forest <forest_1> as t

<p class="ex-meta" id="ex-248">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Digital composite image featuring a dense, sunlit forest <forest_1> as the background, shot at eye level. Centered in the foreground is a large, semi-transparent rectangular graphic overlay. Its upper section <region_4> is a subtle clear tint over the canopy. The middle section of the overlay is divided horizontally into two bands. The top band <region_1> consists of vertical stripes alternating between clear transparency and translucent chartreuse yellow, ending in a solid chartreuse square on the far right that contains a black directional sign <En_Text_1>. The lower band <region_2> mirrors this structure with alternating clear and chartreuse stripes, ending in a solid chartreuse square on the far left that holds another black directional sign <En_Text_2>. Below these striped bands, the overlay continues downwards as a dark, slightly distorted filter <region_3> covering the lower forest foliage, creating a sharp contrast between the organic textures of the woods and the crisp, straight edges of the rectangle.
```

#### Prompting Basics · 官方 caption：Formal digital collage serving as a fashion mood board, structured into 

<p class="ex-meta" id="ex-249">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Formal digital collage serving as a fashion mood board, structured into rectangular panels separated by thin white borders against a stark white background canvas. In the upper left, a square panel <panel_1> sits beside a taller rectangular panel <panel_2> in the upper middle, with another square panel <panel_3> on the upper right. Running vertically down the left margin is a text block <En_Text_1>. The middle section is dominated by a large, wide panel <panel_4>. Below this, a horizontal row contains four smaller detail panels: the first <panel_5> on the left, the second <panel_6> next to it, the third <panel_7> in the mid-right, and the fourth <panel_8> on the far right, which contains a visible woven label <En_Text_4>. Along the bottom edge, a block of sans-serif text <En_Text_2> sits on the left, while a large script signature <En_Text_3> spans the bottom right.
```

#### Prompting Basics · 官方 caption：Full-color outdoor photograph with a slight film grain and shallow depth

<p class="ex-meta" id="ex-250">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Full-color outdoor photograph with a slight film grain and shallow depth of field, captured from a ground-level, low-angle perspective in an urban park. Warm, directional late-afternoon sunlight filters through a dense canopy of deciduous trees <trees_1> in the background. Occupying the center and extending to the left is a white picnic blanket with thin red horizontal stripes <blanket_1>. A young girl of East Asian descent <girl_1> lies prone on the blanket, leaning forward on her elbows. Her left hand rests near her chest with fingers slightly curled, while her right hand extends toward the right edge of the frame. Just off the blanket on the green grass <grass_1> stands a small brown sparrow <sparrow_1> facing her. In the lower right foreground, a second sparrow <sparrow_2> is partially visible, heavily blurred by the shallow depth of field. Scattered on the left side of the blanket are several picnic items: a clear plastic water bottle with a blue cap <bottle_1>, a red cardboard box <box_1> displaying white text <En_Text_1>, scattered papers <papers_1>, and a small open snack container <container_1>. In the blurred background, a black lamppost <lamppost_1> stands among the trees, and several distant, out-of-focus figures <figures_1> are visible walking and sitting on benches.
```

#### Prompting Basics · 官方 caption：Digital graphic design mockup shot straight-on with a top-down view unde

<p class="ex-meta" id="ex-251">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Digital graphic design mockup shot straight-on with a top-down view under flat, even studio-style lighting. A flat, neutral gray background <background_1> fills the frame. Centered in the composition is a vertical, rectangular black poster <poster_1>, appearing to hover just above the surface due to a soft, diffuse drop shadow extending along its left and bottom edges. The poster displays the complete English alphabet rendered in stark white with a geometric glitch aesthetic, featuring horizontal shifts and missing angular slices. The letters are arranged systematically across five horizontal rows: the first row <En_Text_1>, the second row <En_Text_2>, the third row <En_Text_3>, the fourth row <En_Text_4>, and the fifth row <En_Text_5>. Centered near the bottom edge of the poster is a logo <graphic_1>. Immediately below this emblem, a small line of text <En_Text_6> completes the design.
```

#### Prompting Basics · 官方 caption：Full-color architectural photograph shot on 35mm film from a low-angle p

<p class="ex-meta" id="ex-252">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Full-color architectural photograph shot on 35mm film from a low-angle perspective at ground level, featuring bright, direct sunlight and visible film grain. Under a clear, pale blue sky <sky_1>, a Brutalist concrete structure <building_1> dominates the right and center of the frame. The building features three clusters of tall, nested parabolic arches. At the base of the central section, a flat concrete overhang <overhang_1> shelters a small, dark entrance <entrance_1>. Mounted on the overhang is a large, rectangular red sign <sign_1> displaying a circular emblem <emblem_1> on the left, a line of Georgian script <Ka_Text_1> on top, and English text <En_Text_1> below. Along the ledge behind the sign, several small flags on thin poles <flags_1> are visible. To the left stands a portion of an older, traditional building <building_2> with a slender, tiered tower topped by a metallic spire and a five-pointed star. In the foreground on the far left, a dark green coniferous tree <tree_1> partially obscures the lower levels of a glass-fronted building <building_3>. The structures sit behind a wide set of shallow concrete steps <steps_1> that lead down to a paved plaza made of grey stone blocks <plaza_1> filling the bottom of the frame.
```

#### Prompting Basics · 官方 idea：Night at a Japanese restaurant: two diners in red light at the table, a 

<p class="ex-meta" id="ex-253">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Night at a Japanese restaurant: two diners in red light at the table, a lit pine garden outside.
```

#### Prompting Basics · 官方 caption：High-angle, full-color 35mm indoor-outdoor film photograph captured at n

<p class="ex-meta" id="ex-254">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
High-angle, full-color 35mm indoor-outdoor film photograph captured at night, featuring visible grain, deep shadows, and a shallow depth of field that renders the foreground in an atmospheric blur. The composition divides a dimly lit interior dining area on the right from an illuminated exterior garden on the left. In the blurred foreground, bathed in deep, monochromatic red light, two silhouetted figures sit at a dining table <table_1>. A young child with dark hair <person_1> faces the camera as an out-of-focus red shape, while the profile of an adult <person_2> occupies the right edge. Between them, the table holds blurred dishes <dishes_1> and a small candle <candle_1> that provides a warm orange point of light. Through a large window on the left, the sharp exterior scene is set against a pitch-black night sky <sky_1>. A Japanese pine tree <tree_1> is illuminated by a cool, artificial green light, resolving its textured bark and dense needle clusters. Below the tree, a low bamboo fence <fence_1> runs horizontally. Further back, a stone-paved path <path_1> leads into the dark garden, dotted with a few scattered warm-toned lights <lights_1>.
```

#### Prompting Basics · 官方 idea：A magazine cover called Tools: a tower of wooden Kapla planks under big 

<p class="ex-meta" id="ex-255">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
A magazine cover called Tools: a tower of wooden Kapla planks under big blue serif type.
```

#### Prompting Basics · 官方 caption：Studio photograph of a publication cover set against a seamless, stark w

<p class="ex-meta" id="ex-256">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Studio photograph of a publication cover set against a seamless, stark white background. Centered in the vertical frame is a tall architectural structure <structure_1> built from small, uniform wooden planks. Bright, even softbox lighting casts soft, subtle shadows at the base of the construction and within its gaps. Dominating the upper third of the composition is a large title <En_Text_1>, its lower edge partially obscured by the top of the wooden structure. At the bottom of the frame, a smaller subtitle <En_Text_2> stretches horizontally. Tucked into the bottom-left corner is a vertical barcode <barcode_1> accompanied by stacked price markings <En_Text_3>.
```

#### Prompting Basics · 官方 idea：A 4x4 sheet of minimalist poster layouts in sage green and black, each u

<p class="ex-meta" id="ex-257">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
A 4x4 sheet of minimalist poster layouts in sage green and black, each using the letters CFHKNP.
```

#### Prompting Basics · 官方 caption：Flat, two-dimensional graphic design layout on a plain white background,

<p class="ex-meta" id="ex-258">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Flat, two-dimensional graphic design layout on a plain white background, presenting a four-by-four grid of sixteen rectangular wireframe panels separated by even white margins. The minimalist study explores spatial relationships using a strictly limited palette of white, black, and muted sage green. The top row features four distinct compositions: a panel <panel_1> with a green circle and a central typographic anchor <En_Text_1>, a panel <panel_2> containing a green square and vertical text <En_Text_2>, a panel <panel_3> centered on an organic wavy blob beneath curved text <En_Text_3>, and a panel <panel_4> displaying a sage-green bottle silhouette beside spaced lettering <En_Text_4>. In the second row, a panel <panel_5> with an upward triangle and bottom-right text <En_Text_5> sits next to a panel <panel_6> holding twin rectangles and vertical text <En_Text_6>. Beside them, a panel <panel_7> splits a circle around central text <En_Text_7>, while the row ends with a panel <panel_8> balancing a rotated square above its text <En_Text_8>. The third row begins with a panel <panel_9> featuring a tall rectangular sidebar and top-right text <En_Text_9>, followed by a panel <panel_10> with a lower blob and vertical text <En_Text_10>. A panel <panel_11> pairs a top-right circle with downward-curving text <En_Text_11>, and a panel <panel_12> anchors a wide bottom rectangle under top-aligned text <En_Text_12>. The bottom row completes the grid with a panel <panel_13> pointing a triangle rightward beside vertical text <En_Text_13>, a panel <panel_14> centering a large rectangle and overlaid text <En_Text_14>, a panel <panel_15> with a bottom half-circle and top-aligned text <En_Text_15>, and a final panel <panel_16> presenting a tiny grid of squares next to vertical text <En_Text_16>. In every panel, varied densities of black horizontal lines simulate body text, interacting dynamically with the shapes and typography to create a balanced structural design.
```

#### Prompting Basics · 官方 prompt：A cozy breakfast spread on a wooden table

<p class="ex-meta" id="ex-259">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
A cozy breakfast spread on a wooden table
```

#### Prompting Basics · 官方 prompt：Two red pandas resting on bamboo beams, one looking relaxed and the othe

<p class="ex-meta" id="ex-260">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Two red pandas resting on bamboo beams, one looking relaxed and the other asleep. Their reddish-brown fur and white facial markings stand out against the soft, blurred natural background, suggesting a peaceful, sunny environment.
```

#### Prompting Basics · 弱示例：Four men in dark suits cross a sunlit rooftop, a busy avenue far below.

<p class="ex-meta" id="ex-261">类型：weak · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Four men in dark suits cross a sunlit rooftop, a busy avenue far below.
```

#### Prompting Basics · 强示例：High-angle black and white photograph with a grainy film texture. In the

<p class="ex-meta" id="ex-262">类型：strong · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
High-angle black and white photograph with a grainy film texture. In the right foreground, a brightly lit, pale, flat rooftop anchors the composition. Four men in dark suits walk in mid-stride towards the right edge of the building, rendered almost entirely as silhouettes against the stark surface. They cast long, sharp diagonal shadows that stretch out before them under harsh, directional lighting. To the left, a plunging view reveals a deep urban canyon and a congested city street far below, bisecting the dense architecture. The avenue is packed with a multitude of cars and buses appearing as small dark shapes, alongside tiny figures of pedestrians dotting the sidewalks and crosswalks. The street is sharply split by light and shadow, with the left side plunged into deep darkness while the right catches intense sunlight. A faint haze or smoke drifts near the lower central portion of the canyon. The background is filled with towering, monolithic skyscrapers featuring repetitive grids of windows. The buildings recede into the distance, their details softening in the atmospheric perspective.
```

#### Prompting Basics · 官方 prompt：A candid, eye-level photograph captured from the wings of a theater stag

<p class="ex-meta" id="ex-263">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
A candid, eye-level photograph captured from the wings of a theater stage, looking out at a group of ballet dancers performing a scene from Swan Lake. The foreground is dominated by the dark, out-of-focus silhouettes of observers or fellow dancers standing in the shadows of the stage left wing. These figures are heavily blurred, creating a voyeuristic sense of depth and framing the brightly lit action on the stage. To the far right, the profile of a young man’s face is partially visible in the shadows, his gaze directed toward the performance. \n  \n On the stage, several ballerinas are captured in mid-motion, dressed in traditional white classical tutus with stiff, tiered tulle skirts and white bodices. They wear white headpieces adorned with feathers and have their hair pulled back tightly. The dancers are arranged in various graceful poses; some have their arms raised elegantly above their heads in fifth position, while others are caught in mid-stride or en pointe. Their pale skin and white costumes contrast sharply against the dark, cavernous background of the stage. Small, white, orb-like lights or decorative elements appear to be suspended in the air around their raised hands, adding a dreamlike quality to the scene. \n  \n The lighting is dramatic and theatrical, with a strong spotlight illuminating the center of the stage, casting long, soft shadows and highlighting the texture of the dancers' tutus. The background beyond the performers is shrouded in deep shadow, with dark vertical curtains and structural elements of the stage barely visible. A single bright stage light is visible in the distance, creating a slight lens flare. The color palette is muted and cool, dominated by deep blacks, shadowy purples, and the brilliant, stark white of the costumes. The image has the grainy, soft-focus quality of mid-20th-century color film, with a shallow depth of field that emphasizes the distance between the hidden observers and the ethereal performance. The overall mood is one of quiet observation, capturing a fleeting, elegant moment from a hidden perspective.
```

#### Prompting Basics · 官方 prompt：A wide-angle, full shot photograph captures a lone American bison walkin

<p class="ex-meta" id="ex-264">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
A wide-angle, full shot photograph captures a lone American bison walking through a misty, geothermal landscape. In the lower-left quadrant, the large, dark brown bison is positioned in profile, facing right, its head lowered as it grazes or moves forward. Its thick, shaggy fur is a deep brown, almost black in the shadows, and its powerful frame is partially obscured by the thick plumes of white steam rising from the ground. The bison stands on a patch of damp, green grass interspersed with low-lying shrubs. \n  \n A narrow, winding stream flows from the upper right toward the lower center of the frame, cutting through the landscape. The water is a cool, slate blue, reflecting the overcast sky. Thick, white steam billows from the stream and the surrounding earth, creating a dense, ethereal fog that blankets the middle ground and rises into the upper portion of the image. To the right of the stream, the ground rises slightly into a grassy bank covered in dark green moss, low vegetation, and scattered, decaying logs. A tall, slender, dead tree trunk stands prominently just to the left of the stream's bend, its bare branches reaching upward, adding a stark, skeletal element to the scene. \n  \n In the background, a dense forest of tall, thin evergreen trees rises up a steep hillside. The trees are a mix of dark greens and grays, their forms softened and partially obscured by the rising steam and mist. The overall color palette is muted and cool, dominated by earthy tones of deep green, dark brown, slate blue, and the stark white of the steam. The lighting is soft and diffused, characteristic of an overcast day, which eliminates harsh shadows and enhances the atmospheric, moody quality of the scene. The camera angle is at eye-level with the landscape, providing a expansive view that emphasizes the vastness and primordial feel of the environment.
```

#### Prompting Basics · 官方 prompt：Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cli

<p class="ex-meta" id="ex-265">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cliffs on one side, turquoise sea on the other, a single vintage car with headlights on, soft golden rim light
```

#### Prompting Basics · 官方 prompt：Turn Image 1 in the Style of Image 2

<p class="ex-meta" id="ex-266">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Turn Image 1 in the Style of Image 2
```

#### Prompting Basics · 文档代码块：[Subject], [location], [style], [camera settings], [lighting], [colors],

<p class="ex-meta" id="ex-267">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
[Subject], [location], [style], [camera settings], [lighting], [colors], [effect], [additional elements]
```

#### Prompting Basics · 迭代 chain：A tall sharp-featured man in an oversized charcoal wool coat

<p class="ex-meta" id="ex-268">类型：chain · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
A tall sharp-featured man in an oversized charcoal wool coat
```

#### Prompting Basics · 迭代 chain：Move the man to a wet cobblestone street at night. Keep his face, hair, 

<p class="ex-meta" id="ex-269">类型：chain · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Move the man to a wet cobblestone street at night. Keep his face, hair, coat, and pose the same.
```

#### Prompting Basics · 迭代 chain：Put a small, worn teddy bear in the man's hands. Keep everything else th

<p class="ex-meta" id="ex-270">类型：chain · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Put a small, worn teddy bear in the man's hands. Keep everything else the same.
```

#### Prompting Basics · 迭代 chain：Add a dog walking beside the man on the cobblestones. Keep everything el

<p class="ex-meta" id="ex-271">类型：chain · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Add a dog walking beside the man on the cobblestones. Keep everything else the same.
```

#### Prompting Basics · 迭代 chain：Park a row of colorful vintage VW Beetles along the street behind him. K

<p class="ex-meta" id="ex-272">类型：chain · <a href="https://docs.bfl.ml/guides/prompting_unified_basics">来源</a></p>

```text
Park a row of colorful vintage VW Beetles along the street behind him. Keep everything else the same.
```

### Building a Good Prompt

来源：[guides_prompting_unified_building](https://docs.bfl.ml/guides/prompting_unified_building)

#### Building a Good Prompt · 官方 caption：Full-color indoor photograph with the grainy texture of mid-20th-century

<p class="ex-meta" id="ex-273">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_building">来源</a></p>

```text
Full-color indoor photograph with the grainy texture of mid-20th-century color film, captured at eye level from the dark wings of a theater stage. The foreground is heavily blurred due to a shallow depth of field, dominated on the left by the out-of-focus silhouettes of two observers <observer_1> <observer_2> standing in deep shadow. On the far right, the shadowed, out-of-focus profile of a young man <man_1> is partially visible, his gaze directed toward the center. Framed between these dark foreground elements is a brightly lit stage where three ballerinas <ballerina_1> <ballerina_2> <ballerina_3> perform. They are dressed in stark white classical tutus, contrasting sharply with the cool, muted color palette of deep purple and black shadows filling the cavernous space behind them. Small, glowing white orbs <orbs_1> are suspended in the air near the dancers' raised hands. A strong spotlight illuminates the center of the stage, casting long, soft shadows across the floor and highlighting the stiff tulle of the costumes. In the distant background, dark vertical curtains <curtains_1> are barely visible, while a single bright stage light <stage_light_1> shines through the gloom, creating a slight lens flare.
```

#### Building a Good Prompt · 官方 prompt：Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cli

<p class="ex-meta" id="ex-274">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_building">来源</a></p>

```text
Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cliffs on one side, turquoise sea on the other, a single vintage car with headlights on, soft golden rim light
```

#### Building a Good Prompt · 官方 prompt：Two red pandas resting on bamboo beams, one looking relaxed and the othe

<p class="ex-meta" id="ex-275">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_building">来源</a></p>

```text
Two red pandas resting on bamboo beams, one looking relaxed and the other asleep. Their reddish-brown fur and white facial markings stand out against the soft, blurred natural background, suggesting a peaceful, sunny environment.
```

#### Building a Good Prompt · 官方 prompt：A dog sitting in a sunny park

<p class="ex-meta" id="ex-276">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_building">来源</a></p>

```text
A dog sitting in a sunny park
```

#### Building a Good Prompt · 官方 prompt：A golden retriever mid-leap chasing a tennis ball across a sunlit hardwo

<p class="ex-meta" id="ex-277">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_building">来源</a></p>

```text
A golden retriever mid-leap chasing a tennis ball across a sunlit hardwood floor in a cozy living room, a trail of muddy paw prints on the floor behind it, leading back toward the open doorway, warm afternoon light streaming through sheer curtains, shallow depth of field, candid pet photography, 35mm lens
```

#### Building a Good Prompt · 文档代码块：Three ballerinas dancing Swan Lake, seen from the wings past the dark si

<p class="ex-meta" id="ex-278">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_unified_building">来源</a></p>

```text
Three ballerinas dancing Swan Lake, seen from the wings past the dark silhouettes of people watching.
```

#### Building a Good Prompt · 文档代码块：A young woman with curly red hair stands on a bustling city street, her 

<p class="ex-meta" id="ex-279">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_unified_building">来源</a></p>

```text
A young woman with curly red hair stands on a bustling city street, her hair blown sideways by the wind. Behind her, the city lights blur into soft circles. Soft golden hour light falls on her face from the left. Portrait framing at eye level with an 85mm lens and a shallow depth of field. Fashion editorial photography in warm amber and charcoal tones, with subtle film grain.
```

### Prompt Reference

来源：[guides_prompting_unified_reference](https://docs.bfl.ml/guides/prompting_unified_reference)

#### Prompt Reference · 官方 caption：Minimalist graphic illustration featuring a black silhouette of a person

<p class="ex-meta" id="ex-280">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame. The image relies entirely on the high-contrast relationship between the two colors, mimicking a digital recreation of a screen-printed or risograph aesthetic, with no discernible light source or shadow. [{"id":"background_1","bbox":[0,0,1000,1000],"desc":"A flat field of neon yellow-green possessing a subtle, tactile paper texture with fine, organic grain and slight variations in color saturation, giving the flat surface a sense of physical depth."},{"id":"silhouette_1","bbox":[150,150,850,850],"desc":"A black silhouette of a person in motion, composed of a dense, stippled texture that resembles physical ink on paper or a low-resolution digital dither. The leading edges, including the front of the head, chest, and forward leg, are relatively solid and opaque. The trailing edges, such as the back, outstretched rear arm, and lifted back leg, dissolve into a spray of coarse, square-shaped pixels and scattered dots. The black ink shows a slight textural irregularity, as if pressed onto a porous surface."}]
```

#### Prompt Reference · 官方 caption：High-angle black and white photograph with a grainy film texture. In the

<p class="ex-meta" id="ex-281">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
High-angle black and white photograph with a grainy film texture. In the right foreground, a brightly lit, pale, flat rooftop <rooftop_1> anchors the composition. Four men in dark suits <person_1> <person_2> <person_3> <person_4> walk in mid-stride towards the right edge of the building, rendered almost entirely as silhouettes against the stark surface. They cast long, sharp diagonal shadows that stretch out before them under harsh, directional lighting. To the left, a plunging view reveals a deep urban canyon and a congested city street <street_1> far below, bisecting the dense architecture. The avenue is packed with a multitude of cars and buses <vehicle_collection_1> appearing as small dark shapes, alongside tiny figures of pedestrians <pedestrian_collection_1> dotting the sidewalks and crosswalks. The street is sharply split by light and shadow, with the left side plunged into deep darkness while the right catches intense sunlight. A faint haze or smoke <haze_1> drifts near the lower central portion of the canyon. The background is filled with towering, monolithic skyscrapers <skyscraper_collection_1> featuring repetitive grids of windows. The buildings recede into the distance, their details softening in the atmospheric perspective.
```

#### Prompt Reference · 官方 caption：A stylized digital illustration in a flat, graphic anime style, resembli

<p class="ex-meta" id="ex-282">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
A stylized digital illustration in a flat, graphic anime style, resembling a modern pop-art poster with non-directional, uniform lighting. The composition is built on a vibrant background <background_1>. Framed in a medium close-up from the chest up, a young demonic woman <character_1> occupies the center, angled in a three-quarter view and looking back over her shoulder. Large, bold Japanese typography <Ja_Text_1> runs down the left side of the frame, while another block of typography <Ja_Text_2> is positioned in the upper right section. In the lower right corner rests a square seal <Ja_Text_3>. At the bottom center, a line of bright text <Ja_Text_4> sits directly above a smaller line of text <Unknown_Text_1>.
```

#### Prompt Reference · 官方 caption：Vertical 35mm photograph with fine grain and slightly soft focus. Center

<p class="ex-meta" id="ex-283">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Vertical 35mm photograph with fine grain and slightly soft focus. Centered at the top is a cream-colored title <Fr_Text_1>. A hazy, pale grey and green overcast sky <sky_1> sits above dark, rolling mountains <mountains_1> and a distant coastal town <town_1> on the right. In the dark water <water_1> of a bay stands a massive, pale concrete parabolic dome <dome_1>. The dome's arched opening faces the shore, radiating a warm, golden-orange glow from its interior. A dark rectangular monolith <monolith_1> sits deep inside at water level. The golden light reflects on the rippling water, where scattered silhouettes of people <swimmers_1> wade. In the foreground, a pale, pebbly beach <beach_1> holds a large crowd of seated onlookers <crowd_1> in casual, light-colored clothing. Their backs are to the slightly elevated camera as they gaze at the structure under blue hour lighting.
```

#### Prompt Reference · 官方 caption：Monochromatic graphic design poster framed by solid black letterbox bars

<p class="ex-meta" id="ex-284">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Monochromatic graphic design poster framed by solid black letterbox bars at the top <bar_1> and bottom <bar_2>. The background is a textured, off-white surface <background_1>. Dominating the left side of the vertical frame is a large, abstract black mass <mass_1>. To the right of this mass, stacked lowercase text is printed <En_Text_1>. Further down on the right side, a second block of text sits <En_Text_2>. Near the bottom center, positioned below the abstract mass and to the left of the lower text, is a pair of disembodied eyes <eyes_1>. The entire composition features a distressed, photocopy-like aesthetic with heavy grain, noise, and stark black-and-white contrast.
```

#### Prompt Reference · 官方 caption：Full-color graphic design on a solid black background <background_1>. Th

<p class="ex-meta" id="ex-285">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Full-color graphic design on a solid black background <background_1>. The composition features two tall, narrow rectangular panels styled as perforated postage stamps, separated by a vertical black gutter. The left panel <panel_1> is rendered in the style of a traditional Japanese ukiyo-e woodblock print with aged paper texture, subtle grain, and ink bleed, depicting dark, craggy rocks and lush green foreground foliage. Down the center of this panel, a cascading waterfall <waterfall_1> tumbles over the rocks. A small wooden bridge <bridge_1> spans the chasm in the middle ground, where two figures stand. On the left is a figure in a light blue kimono and straw hat <person_1>, and on the right is a figure in a purple kimono holding a red parasol <person_2>. White text overlays the left panel at the top <En_Text_1> and bottom <En_Text_2>. The right panel <panel_2> shares the same ukiyo-e style, perforated edges, and horizontal segment divisions, showing a serene landscape. At the top, a sloping mountain <mountain_1> sits under a gradient twilight sky with silhouetted pine trees. In the middle ground, a traditional Japanese house <house_1> rests on a rocky cliff, its windows emitting a warm yellow light. Below the cliff, a rushing turquoise river <river_1> filled with dark grey boulders flows through the foreground. White text is overlaid on the right panel at the top <En_Text_3>, middle <En_Text_4>, and bottom <En_Text_5>. Both panels feature bold outlines, flat areas of color, and high-angle perspectives.
```

#### Prompt Reference · 官方 caption：Full-color outdoor photograph with a shallow depth of field, taken under

<p class="ex-meta" id="ex-286">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Full-color outdoor photograph with a shallow depth of field, taken under overcast daytime light at a winter sporting event. A medium close-up captures a row of spectators, focusing on a woman <person_1> seated in the left foreground in profile, facing right. Tucked into her coat and held closely in her lap is a small Pomeranian dog <animal_1>. Seated slightly out of alignment next to her on the right is a man <person_2>, also in profile facing right, holding a Jack Russell Terrier <animal_2> in his lap. Extending to the left behind them is a row of softly blurred spectators, including two blonde women <person_3> <person_4> wearing winter attire. In the background, a hillside covered with dark evergreen trees <region_1> rises against a pale sky. To the upper right, event structures are visible, featuring a white flag <flag_3>, a German flag <flag_1>, a Swiss flag <flag_2>, and a blue banner <structure_1> bearing illegible white text. The composition contrasts the warm browns of the fur coats and dogs with the cooler blues of denim jeans and the muted winter landscape.
```

#### Prompt Reference · 官方 caption：Studio photograph of a fashion mood board arranged as a grid of fifteen 

<p class="ex-meta" id="ex-287">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Studio photograph of a fashion mood board arranged as a grid of fifteen rectangular images separated by clean white borders <board_1>. The top row contains five images: a woman sitting with a wide stance in a black leather jumpsuit <image_1>, a close-up of legs in red tights <image_2>, a blurred figure in a dark blue velvet garment <image_3>, a woman in a black ribbed turtleneck with closed eyes <image_4>, and a black-and-white shot of legs in high heels on a chair <image_5>. The middle row features a high-contrast face close-up <image_6>, a portrait of a woman with closed eyes and a pearl earring <image_7>, the back of a head with wavy hair being combed <image_8>, a motion-blurred facial profile <image_9>, and a figure mid-stride in a dark skirt and boots <image_10>. The bottom row displays a black-and-white profile of a bob haircut <image_11>, an extreme close-up of an eye and damp hair <image_12>, white flower petals on a black background <image_13>, a low-angle shot of a teal leather jacket and silver trousers <image_14>, and a close-up of a hand wearing silver rings <image_15>.
```

#### Prompt Reference · 官方 caption：Full-color indoor 35mm photograph with a slight film grain and a warm co

<p class="ex-meta" id="ex-288">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Full-color indoor 35mm photograph with a slight film grain and a warm color cast, lit by harsh, direct camera flash that casts sharp shadows against the background. A light-colored wooden bench <bench_1> sits against a wall of horizontal light-wood panels <wall_1>. On the floor beneath the bench is a vibrant moss-green rug <rug_1>. Seated on the left side of the bench is a man <person_1> captured mid-sip from a glass of amber liquid <glass_1>. In the center sits a humanoid figure <figure_1>. To the right, another man <person_2> sits with a slumped posture, looking downward at a second glass of amber liquid <glass_2> held in his hand. The framing is a full-body shot centered on the three figures, leaving a significant expanse of the wood-paneled wall visible above their heads.
```

#### Prompt Reference · 官方 caption：Digital composite image featuring a dense, sunlit forest <forest_1> as t

<p class="ex-meta" id="ex-289">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Digital composite image featuring a dense, sunlit forest <forest_1> as the background, shot at eye level. Centered in the foreground is a large, semi-transparent rectangular graphic overlay. Its upper section <region_4> is a subtle clear tint over the canopy. The middle section of the overlay is divided horizontally into two bands. The top band <region_1> consists of vertical stripes alternating between clear transparency and translucent chartreuse yellow, ending in a solid chartreuse square on the far right that contains a black directional sign <En_Text_1>. The lower band <region_2> mirrors this structure with alternating clear and chartreuse stripes, ending in a solid chartreuse square on the far left that holds another black directional sign <En_Text_2>. Below these striped bands, the overlay continues downwards as a dark, slightly distorted filter <region_3> covering the lower forest foliage, creating a sharp contrast between the organic textures of the woods and the crisp, straight edges of the rectangle.
```

#### Prompt Reference · 官方 caption：Formal digital collage serving as a fashion mood board, structured into 

<p class="ex-meta" id="ex-290">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Formal digital collage serving as a fashion mood board, structured into rectangular panels separated by thin white borders against a stark white background canvas. In the upper left, a square panel <panel_1> sits beside a taller rectangular panel <panel_2> in the upper middle, with another square panel <panel_3> on the upper right. Running vertically down the left margin is a text block <En_Text_1>. The middle section is dominated by a large, wide panel <panel_4>. Below this, a horizontal row contains four smaller detail panels: the first <panel_5> on the left, the second <panel_6> next to it, the third <panel_7> in the mid-right, and the fourth <panel_8> on the far right, which contains a visible woven label <En_Text_4>. Along the bottom edge, a block of sans-serif text <En_Text_2> sits on the left, while a large script signature <En_Text_3> spans the bottom right.
```

#### Prompt Reference · 官方 caption：Full-color outdoor photograph with a slight film grain and shallow depth

<p class="ex-meta" id="ex-291">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Full-color outdoor photograph with a slight film grain and shallow depth of field, captured from a ground-level, low-angle perspective in an urban park. Warm, directional late-afternoon sunlight filters through a dense canopy of deciduous trees <trees_1> in the background. Occupying the center and extending to the left is a white picnic blanket with thin red horizontal stripes <blanket_1>. A young girl of East Asian descent <girl_1> lies prone on the blanket, leaning forward on her elbows. Her left hand rests near her chest with fingers slightly curled, while her right hand extends toward the right edge of the frame. Just off the blanket on the green grass <grass_1> stands a small brown sparrow <sparrow_1> facing her. In the lower right foreground, a second sparrow <sparrow_2> is partially visible, heavily blurred by the shallow depth of field. Scattered on the left side of the blanket are several picnic items: a clear plastic water bottle with a blue cap <bottle_1>, a red cardboard box <box_1> displaying white text <En_Text_1>, scattered papers <papers_1>, and a small open snack container <container_1>. In the blurred background, a black lamppost <lamppost_1> stands among the trees, and several distant, out-of-focus figures <figures_1> are visible walking and sitting on benches.
```

#### Prompt Reference · 官方 caption：Digital graphic design mockup shot straight-on with a top-down view unde

<p class="ex-meta" id="ex-292">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Digital graphic design mockup shot straight-on with a top-down view under flat, even studio-style lighting. A flat, neutral gray background <background_1> fills the frame. Centered in the composition is a vertical, rectangular black poster <poster_1>, appearing to hover just above the surface due to a soft, diffuse drop shadow extending along its left and bottom edges. The poster displays the complete English alphabet rendered in stark white with a geometric glitch aesthetic, featuring horizontal shifts and missing angular slices. The letters are arranged systematically across five horizontal rows: the first row <En_Text_1>, the second row <En_Text_2>, the third row <En_Text_3>, the fourth row <En_Text_4>, and the fifth row <En_Text_5>. Centered near the bottom edge of the poster is a logo <graphic_1>. Immediately below this emblem, a small line of text <En_Text_6> completes the design.
```

#### Prompt Reference · 官方 caption：Full-color architectural photograph shot on 35mm film from a low-angle p

<p class="ex-meta" id="ex-293">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Full-color architectural photograph shot on 35mm film from a low-angle perspective at ground level, featuring bright, direct sunlight and visible film grain. Under a clear, pale blue sky <sky_1>, a Brutalist concrete structure <building_1> dominates the right and center of the frame. The building features three clusters of tall, nested parabolic arches. At the base of the central section, a flat concrete overhang <overhang_1> shelters a small, dark entrance <entrance_1>. Mounted on the overhang is a large, rectangular red sign <sign_1> displaying a circular emblem <emblem_1> on the left, a line of Georgian script <Ka_Text_1> on top, and English text <En_Text_1> below. Along the ledge behind the sign, several small flags on thin poles <flags_1> are visible. To the left stands a portion of an older, traditional building <building_2> with a slender, tiered tower topped by a metallic spire and a five-pointed star. In the foreground on the far left, a dark green coniferous tree <tree_1> partially obscures the lower levels of a glass-fronted building <building_3>. The structures sit behind a wide set of shallow concrete steps <steps_1> that lead down to a paved plaza made of grey stone blocks <plaza_1> filling the bottom of the frame.
```

#### Prompt Reference · 官方 idea：Night at a Japanese restaurant: two diners in red light at the table, a 

<p class="ex-meta" id="ex-294">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Night at a Japanese restaurant: two diners in red light at the table, a lit pine garden outside.
```

#### Prompt Reference · 官方 caption：High-angle, full-color 35mm indoor-outdoor film photograph captured at n

<p class="ex-meta" id="ex-295">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
High-angle, full-color 35mm indoor-outdoor film photograph captured at night, featuring visible grain, deep shadows, and a shallow depth of field that renders the foreground in an atmospheric blur. The composition divides a dimly lit interior dining area on the right from an illuminated exterior garden on the left. In the blurred foreground, bathed in deep, monochromatic red light, two silhouetted figures sit at a dining table <table_1>. A young child with dark hair <person_1> faces the camera as an out-of-focus red shape, while the profile of an adult <person_2> occupies the right edge. Between them, the table holds blurred dishes <dishes_1> and a small candle <candle_1> that provides a warm orange point of light. Through a large window on the left, the sharp exterior scene is set against a pitch-black night sky <sky_1>. A Japanese pine tree <tree_1> is illuminated by a cool, artificial green light, resolving its textured bark and dense needle clusters. Below the tree, a low bamboo fence <fence_1> runs horizontally. Further back, a stone-paved path <path_1> leads into the dark garden, dotted with a few scattered warm-toned lights <lights_1>.
```

#### Prompt Reference · 官方 idea：A magazine cover called Tools: a tower of wooden Kapla planks under big 

<p class="ex-meta" id="ex-296">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
A magazine cover called Tools: a tower of wooden Kapla planks under big blue serif type.
```

#### Prompt Reference · 官方 caption：Studio photograph of a publication cover set against a seamless, stark w

<p class="ex-meta" id="ex-297">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Studio photograph of a publication cover set against a seamless, stark white background. Centered in the vertical frame is a tall architectural structure <structure_1> built from small, uniform wooden planks. Bright, even softbox lighting casts soft, subtle shadows at the base of the construction and within its gaps. Dominating the upper third of the composition is a large title <En_Text_1>, its lower edge partially obscured by the top of the wooden structure. At the bottom of the frame, a smaller subtitle <En_Text_2> stretches horizontally. Tucked into the bottom-left corner is a vertical barcode <barcode_1> accompanied by stacked price markings <En_Text_3>.
```

#### Prompt Reference · 官方 idea：A 4x4 sheet of minimalist poster layouts in sage green and black, each u

<p class="ex-meta" id="ex-298">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
A 4x4 sheet of minimalist poster layouts in sage green and black, each using the letters CFHKNP.
```

#### Prompt Reference · 官方 caption：Flat, two-dimensional graphic design layout on a plain white background,

<p class="ex-meta" id="ex-299">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Flat, two-dimensional graphic design layout on a plain white background, presenting a four-by-four grid of sixteen rectangular wireframe panels separated by even white margins. The minimalist study explores spatial relationships using a strictly limited palette of white, black, and muted sage green. The top row features four distinct compositions: a panel <panel_1> with a green circle and a central typographic anchor <En_Text_1>, a panel <panel_2> containing a green square and vertical text <En_Text_2>, a panel <panel_3> centered on an organic wavy blob beneath curved text <En_Text_3>, and a panel <panel_4> displaying a sage-green bottle silhouette beside spaced lettering <En_Text_4>. In the second row, a panel <panel_5> with an upward triangle and bottom-right text <En_Text_5> sits next to a panel <panel_6> holding twin rectangles and vertical text <En_Text_6>. Beside them, a panel <panel_7> splits a circle around central text <En_Text_7>, while the row ends with a panel <panel_8> balancing a rotated square above its text <En_Text_8>. The third row begins with a panel <panel_9> featuring a tall rectangular sidebar and top-right text <En_Text_9>, followed by a panel <panel_10> with a lower blob and vertical text <En_Text_10>. A panel <panel_11> pairs a top-right circle with downward-curving text <En_Text_11>, and a panel <panel_12> anchors a wide bottom rectangle under top-aligned text <En_Text_12>. The bottom row completes the grid with a panel <panel_13> pointing a triangle rightward beside vertical text <En_Text_13>, a panel <panel_14> centering a large rectangle and overlaid text <En_Text_14>, a panel <panel_15> with a bottom half-circle and top-aligned text <En_Text_15>, and a final panel <panel_16> presenting a tiny grid of squares next to vertical text <En_Text_16>. In every panel, varied densities of black horizontal lines simulate body text, interacting dynamically with the shapes and typography to create a balanced structural design.
```

#### Prompt Reference · 官方 prompt：Shot on Hasselblad X2D, 80mm lens, f/2.8, natural lighting

<p class="ex-meta" id="ex-300">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
Shot on Hasselblad X2D, 80mm lens, f/2.8, natural lighting
```

#### Prompt Reference · 官方 prompt：soft, diffused natural light filtering through sheer curtains

<p class="ex-meta" id="ex-301">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
soft, diffused natural light filtering through sheer curtains
```

#### Prompt Reference · 官方 prompt：dramatic side lighting creating deep shadows and highlights

<p class="ex-meta" id="ex-302">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
dramatic side lighting creating deep shadows and highlights
```

#### Prompt Reference · 官方 prompt：golden hour backlighting with lens flare

<p class="ex-meta" id="ex-303">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
golden hour backlighting with lens flare
```

#### Prompt Reference · 官方 prompt：overcast light creating even, shadow-free illumination

<p class="ex-meta" id="ex-304">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_reference">来源</a></p>

```text
overcast light creating even, shadow-free illumination
```

### Style, Aesthetics & Text

来源：[guides_prompting_unified_style](https://docs.bfl.ml/guides/prompting_unified_style)

#### Style, Aesthetics & Text · 官方 caption：Full-color digital scan of a flat, vertical graphic design poster exhibi

<p class="ex-meta" id="ex-305">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Full-color digital scan of a flat, vertical graphic design poster exhibiting a minimalist, mid-century Japanese aesthetic and a two-dimensional, screen-printed quality. The composition is entirely bounded by a thick, matte black border <border_1> that encloses a solid, flat ultramarine blue background <background_1>. The lighting is perfectly even, with no gradients or shadows, emphasizing a restricted four-color palette of blue, golden yellow, black, and white. In the center, a stylized tiger <tiger_1> is depicted in a dynamic, downward-prowling pose. Typography is arranged cleanly around the central figure in a stark white sans-serif font. In the upper-right corner sits a date <En_Text_1>. Running vertically down the left edge is a series of stacked text <Ja_Text_1>. In the lower-right corner, a large, bold kanji character <Ja_Text_2> is prominently displayed. Finally, in the bottom-left corner, a small attribution line <En_Text_2> rests just inside the dark border.
```

#### Style, Aesthetics & Text · 官方 caption：Digital illustration character model sheet against a plain white backgro

<p class="ex-meta" id="ex-306">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Digital illustration character model sheet against a plain white background, featuring clean, thick linework and a color palette of red, green, and cream. Soft, pinkish-red rim lighting illuminates the edges of the figures, suggesting a low-sunlight environment. On the left, a young male character <character_1> stands on a patch of grassy earth, wearing a school uniform and smiling with his mouth closed as a white rugby ball <ball_1> floats above his upturned hand. In the upper-middle area, a close-up bust <character_2> shows him in the same uniform with a wide, teeth-baring grin. Below this is a headshot <character_3> of the character wearing a red jacket, looking upward with his mouth slightly open. The right side contains wide, exaggerated action poses: at the top right, he is shown in a horizontal mid-air dive <character_4>, reaching for another rugby ball <ball_2> in a green and white athletic kit. In the bottom right, he is depicted in a full-body sprint <character_5> across a grassy patch, leaning sharply forward in a red jacket and white shorts. Centered in the lower-middle area, a block of text <En_Text_1> sits above smaller subtext and a signature <En_Text_2>. Just below the text, a final profile headshot <character_6> shows the character with a calm, closed-mouth smile.
```

#### Style, Aesthetics & Text · 官方 caption：Flat-color digital illustration of a minimalist graphic design presented

<p class="ex-meta" id="ex-307">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Flat-color digital illustration of a minimalist graphic design presented against a solid black background. The composition is organized into a vertical list of horizontal rows separated by thin, crisp white lines that span the full width of the frame. The lighting is perfectly flat and even, with no shadows, gradients, or textures, emphasizing a high-contrast, Swiss-inspired geometric layout. The framing is a tight, medium-close shot focusing on the middle section of the list. At the top edge, a partially visible upper row <row_1> is cut off by the frame. Below it, the first fully visible row <row_2> spans the width. The list continues downwards with four more complete, identically structured rows: the second full row <row_3>, the third full row <row_4>, the fourth full row <row_5>, and the fifth full row <row_6>. Each full row places a vibrant, colored circular badge with a black two-digit number on the left, followed by a bold, white sans-serif text label on the right. At the very bottom, another partially cropped lower row <row_7> extends off the lower edge of the canvas.
```

#### Style, Aesthetics & Text · 官方 prompt：A close-up wildlife photograph of a soaking-wet tiger cub sheltering ben

<p class="ex-meta" id="ex-308">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
A close-up wildlife photograph of a soaking-wet tiger cub sheltering beneath a broad banana leaf in a rainy jungle. The leaf arches just above the cub, raindrops gather along its edge, and wet fur clumps into fine strands around the cub's eyes and muzzle. Soft daylight filtered through the canopy lights the face; the deeper green foliage falls out of focus behind it. The face and front paws remain clearly visible beneath the leaf.
```

#### Style, Aesthetics & Text · 官方 prompt：Sloth out drinking in Bangkok at night in a street full of party folks, 

<p class="ex-meta" id="ex-309">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Sloth out drinking in Bangkok at night in a street full of party folks, 2000s digicam style, people in the background fading
```

#### Style, Aesthetics & Text · 官方 prompt：A group of baby penguins in a trampoline park, having the time of their 

<p class="ex-meta" id="ex-310">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
A group of baby penguins in a trampoline park, having the time of their lives, 80s vintage photo
```

#### Style, Aesthetics & Text · 官方 prompt：An old faded family portrait photograph from the early 2000s showing a f

<p class="ex-meta" id="ex-311">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
An old faded family portrait photograph from the early 2000s showing a family of five standing stiffly in front of their modest wooden farmhouse
```

#### Style, Aesthetics & Text · 官方 prompt：A restrained 1990s fashion editorial photograph in a warm beige studio. 

<p class="ex-meta" id="ex-312">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
A restrained 1990s fashion editorial photograph in a warm beige studio. An adult woman with tousled shoulder-length brown hair sits barefoot on a large muted-green exercise ball. She wears a fitted rust-brown sleeveless crop top and matching high-waisted briefs. Her hands rest together in her lap; one leg extends diagonally toward the camera and the other bends beside the ball. Full-body framing with generous plain wall above her, soft directional daylight, gentle floor shadows, warm skin tones, slightly muted color print and fine film grain. The ribbed green ball remains fully readable beneath her.
```

#### Style, Aesthetics & Text · 官方 prompt：A surreal architectural photograph of exactly two large bison standing i

<p class="ex-meta" id="ex-313">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
A surreal architectural photograph of exactly two large bison standing inside a cobalt-blue room, seen symmetrically through a tall rounded archway. The bison face each other with their heads lowered near the center, their shaggy brown fur and pale curved horns sharply resolved. Pale oak floorboards, exposed honey-colored ceiling beams, a round wooden pendant centered overhead and a tall white rectangular recess on the back wall. Soft natural illumination reveals fur, wood grain and the matte blue walls. The arch, lamp and wall recess align on the central vertical axis, with believable animal scale and clean architectural perspective.
```

#### Style, Aesthetics & Text · 官方 prompt：A high-contrast golden-hour photograph of a lone person playing an acous

<p class="ex-meta" id="ex-314">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
A high-contrast golden-hour photograph of a lone person playing an acoustic guitar on a rocky rise. The person stands slightly right of center in a dark silhouette, with the guitar body and neck clearly separated from the torso and the neck angled upward to the right. The low orange sun sits just beside the person's head. A leafless tree frames the left edge; distant hills form quiet horizontal bands below a glowing amber sky. Jagged foreground rocks stay dark against the sunset. Portrait framing, natural backlighting and a warm saturated color print.
```

#### Style, Aesthetics & Text · 官方 prompt：Turn Image 1 in the Style of Image 2

<p class="ex-meta" id="ex-315">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Turn Image 1 in the Style of Image 2
```

#### Style, Aesthetics & Text · 官方 prompt：change the color of only one bird in the middle to #e01075

<p class="ex-meta" id="ex-316">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
change the color of only one bird in the middle to #e01075
```

#### Style, Aesthetics & Text · 官方 prompt：A Entry of a Sushi Restaurant, The text 'OPEN' appears in red neon lette

<p class="ex-meta" id="ex-317">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
A Entry of a Sushi Restaurant, The text 'OPEN' appears in red neon letters above the door
```

#### Style, Aesthetics & Text · 官方 prompt：Samsung Galaxy S25 Ultra product advertisement, 'Ultra-strong titanium' 

<p class="ex-meta" id="ex-318">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Samsung Galaxy S25 Ultra product advertisement, 'Ultra-strong titanium' headline, 'Shielded in a strong titanium frame, your Galaxy S25 Ultra always stays protected' subtext, close-up of phone edge showing titanium frame, dark gradient background, clean minimalist tech aesthetic, professional product photography
```

#### Style, Aesthetics & Text · 官方 prompt：Women's Health magazine cover, April 2025 issue, 'Spring forward' headli

<p class="ex-meta" id="ex-319">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Women's Health magazine cover, April 2025 issue, 'Spring forward' headline, woman in green outfit sitting on orange blocks, white sneakers, 'Covid: five years on' feature text, '15 skincare habits' callout, professional editorial photography, magazine layout with multiple text elements
```

#### Style, Aesthetics & Text · 官方 prompt：Groovy retro poster with the quote "If you love me let me sleep". Bold 7

<p class="ex-meta" id="ex-320">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Groovy retro poster with the quote "If you love me let me sleep". Bold 70s typography in deep red and warm pink tones. Cream background and bold orange doodle around the text. Funky layout with playful shadow. Style: bold vintage aesthetic, dopamine decor
```

#### Style, Aesthetics & Text · 文档代码块：Shot on Hasselblad X2D, 80mm lens, f/2.8, natural lighting

<p class="ex-meta" id="ex-321">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Shot on Hasselblad X2D, 80mm lens, f/2.8, natural lighting
```

#### Style, Aesthetics & Text · 文档代码块：Canon 5D Mark IV, 24-70mm at 35mm, golden hour, shallow depth of field

<p class="ex-meta" id="ex-322">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
Canon 5D Mark IV, 24-70mm at 35mm, golden hour, shallow depth of field
```

#### Style, Aesthetics & Text · 文档代码块：[Scene description]. Style: Country chic meets luxury lifestyle editoria

<p class="ex-meta" id="ex-323">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
[Scene description]. Style: Country chic meets luxury lifestyle editorial. \n Mood: Serene, romantic, grounded.
```

#### Style, Aesthetics & Text · 文档代码块：[Scene description]. Shot on 35mm film (Kodak Portra 400) with shallow \

<p class="ex-meta" id="ex-324">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_unified_style">来源</a></p>

```text
[Scene description]. Shot on 35mm film (Kodak Portra 400) with shallow \n depth of field: subject razor-sharp, background softly blurred.
```

### Technical Parameters

来源：[guides_prompting_unified_technical](https://docs.bfl.ml/guides/prompting_unified_technical)

#### Technical Parameters · 官方 prompt：A cozy breakfast spread on a wooden table

<p class="ex-meta" id="ex-325">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_technical">来源</a></p>

```text
A cozy breakfast spread on a wooden table
```

#### Technical Parameters · 官方 prompt：Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cli

<p class="ex-meta" id="ex-326">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_technical">来源</a></p>

```text
Ultra-wide cinematic shot of a fog-drenched coastal highway at dawn, cliffs on one side, turquoise sea on the other, a single vintage car with headlights on, soft golden rim light
```

#### Technical Parameters · 官方 prompt：An empty beach with palm trees and gentle waves at golden sunset. Wide c

<p class="ex-meta" id="ex-327">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_technical">来源</a></p>

```text
An empty beach with palm trees and gentle waves at golden sunset. Wide cinematic framing from the sand, a clean level horizon and the shoreline curving gently into the distance. Low sunlight lights the edges of the palm fronds, warm gold reflects on the ripples, and the shaded sand stays softly cool. The beach remains open and undisturbed, with fine sand texture visible in the foreground.
```

#### Technical Parameters · 官方 prompt：An empty beach with palm trees and gentle waves at golden sunset. Wide c

<p class="ex-meta" id="ex-328">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_unified_technical">来源</a></p>

```text
An empty beach with palm trees and gentle waves at golden sunset. Wide cinematic framing from the sand, a clean level horizon and the shoreline curving gently into the distance. Low sunlight lights the edges of the palm fronds, warm gold reflects on the ripples, and the shaded sand stays softly cool. The beach remains open and undisturbed, with fine sand texture visible in the foreground.
```

## 单图编辑

### 编辑概览

来源：[guides_prompting_editing_overview](https://docs.bfl.ml/guides/prompting_editing_overview)

#### 编辑概览 · 官方 prompt：The input image. Each tab sends this image with one instruction to FLUX 

<p class="ex-meta" id="ex-177">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_overview">来源</a></p>

```text
The input image. Each tab sends this image with one instruction to FLUX 3 Image.
```

#### 编辑概览 · 官方 prompt：Replace the white bird with a silver fox sitting in the same outdoor pud

<p class="ex-meta" id="ex-178">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_overview">来源</a></p>

```text
Replace the white bird with a silver fox sitting in the same outdoor puddle. The fox has thick silver-grey fur, a bushy tail and natural amber eyes. Keep the puddle, grass, butterfly, low camera viewpoint and warm golden light unchanged. The fox occupies the bird's position, with a coherent reflection and paws touching the water.
```

#### 编辑概览 · 官方 prompt：Use the white parakeet bathing in the puddle in the reference image as t

<p class="ex-meta" id="ex-179">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_overview">来源</a></p>

```text
Use the white parakeet bathing in the puddle in the reference image as the subject. Zoom out to a wider view of the same outdoor scene, showing more of the grassy banks, shallow puddle and woodland beyond. Preserve the bird's appearance and bathing pose, the hovering butterfly, water splashes, golden lighting and low viewpoint. The bird occupies less of the wider frame while keeping the same scale relative to the puddle.
```

#### 编辑概览 · 官方 prompt：Use the white parakeet bathing in the puddle in the reference image as t

<p class="ex-meta" id="ex-180">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_overview">来源</a></p>

```text
Use the white parakeet bathing in the puddle in the reference image as the subject. Change the bird's action so it stands upright in the same puddle with both wings fully spread, throwing a small arc of water droplets from each wing. Keep its white plumage, the long tail, grassy banks, butterfly, warm golden light and low camera viewpoint. Its feet touch the shallow water with a coherent reflection.
```

#### 编辑概览 · 官方 prompt：Use the white parakeet bathing in the puddle in the reference image as t

<p class="ex-meta" id="ex-181">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_overview">来源</a></p>

```text
Use the white parakeet bathing in the puddle in the reference image as the subject. Change only the environment into a cavernous abandoned factory with rusted machinery and soft light shafts through broken skylights. Keep the bird's appearance, bathing pose, butterfly, shallow puddle and camera framing. The puddle now lies on the concrete factory floor; industrial walls and machinery replace all surrounding grass and trees.
```

#### 编辑概览 · 官方 prompt：change the color of only one bird in the middle to #e01075

<p class="ex-meta" id="ex-182">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_overview">来源</a></p>

```text
change the color of only one bird in the middle to #e01075
```

#### 编辑概览 · 官方 prompt：Turn Image 1 in the Style of Image 2

<p class="ex-meta" id="ex-183">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_overview">来源</a></p>

```text
Turn Image 1 in the Style of Image 2
```

### 单参考编辑指南

来源：[guides_prompting_editing_single_reference](https://docs.bfl.ml/guides/prompting_editing_single_reference)

#### 单参考编辑指南 · 官方 prompt：In <ref_image_0>, change the large tiger <animal_1> and the small glowin

<p class="ex-meta" id="ex-184">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
In <ref_image_0>, change the large tiger <animal_1> and the small glowing butterfly <insect_1> to be pink. Keep the massive fallen log <log_1>, the falling snow <snow_1>, and the dark background trees <trees_1> exactly unchanged. [{"id":"animal_1","from":null,"src_bbox":null,"tgt_bbox":[250,50,850,650],"desc":"Make both pink."},{"id":"insect_1","from":null,"src_bbox":null,"tgt_bbox":[650,680,750,750],"desc":"Make both pink."},{"id":"log_1","from":"ref_image_0","src_bbox":[600,0,1000,1000],"tgt_bbox":[600,0,1000,1000],"desc":"A massive, fallen tree log stretching horizontally across the foreground. The surface features deep, rough-textured bark, weathered cracks, and small pockets of frost."},{"id":"snow_1","from":"ref_image_0","src_bbox":[0,0,1000,1000],"tgt_bbox":[0,0,1000,1000],"desc":"Numerous white snowflakes of varying sizes falling across the scene. Some flakes are sharp and distinct, while others closer to the lens appear as blurred white streaks."},{"id":"trees_1","from":"ref_image_0","src_bbox":[0,0,650,1000],"tgt_bbox":[0,0,650,1000],"desc":"A dense stand of tall, dark, vertical tree trunks receding into the distance. A cool, blue misty light permeates the spaces between the trees, glowing most intensely from the right edge."}]
```

#### 单参考编辑指南 · 官方 prompt：Modify <ref_image_0> by making three replacements. On the lower left pat

<p class="ex-meta" id="ex-185">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Modify <ref_image_0> by making three replacements. On the lower left path, replace the tiny anthropomorphic wolf with a cyberpunk dog <wolf_1>. On the lower right, replace the fallen frosted bamboo log with a fallen bamboo leaf made out of gold <log_1>. In the middle of the misty forest, replace the small dark bird perched on a branch with a bird made out of a robot <bird_1>. Keep the rest of the scene exactly unchanged, preserving the dense upper bamboo leaves <bamboo_1>, the vertical bamboo trunks <bamboo_2> receding into the fog, the frosted ground and lower stalks <bamboo_3>, the dramatic slanting sunbeams <light_1>, the thick foreground bamboo trunk <bamboo_4> on the right, the frozen stream <stream_1>, the stone lantern <lantern_1>, and the floating frost flakes <particles_1>.
```

#### 单参考编辑指南 · 官方 prompt：Place this can on top of a minimalistic black shiny surface on black bac

<p class="ex-meta" id="ex-186">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Place this can on top of a minimalistic black shiny surface on black background
```

#### 单参考编辑指南 · 官方 prompt：a professional high end product shot of this bottle in a pile of fresh w

<p class="ex-meta" id="ex-187">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
a professional high end product shot of this bottle in a pile of fresh wet strawberries on white background, studio lighting
```

#### 单参考编辑指南 · 官方 prompt：Replace the background with a warm cozy home environment.

<p class="ex-meta" id="ex-188">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Replace the background with a warm cozy home environment.
```

#### 单参考编辑指南 · 官方 prompt：Turn the image into an oil painting with thick, textured brushstrokes

<p class="ex-meta" id="ex-189">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Turn the image into an oil painting with thick, textured brushstrokes
```

#### 单参考编辑指南 · 官方 prompt：Transform the architectural illustration from image 1 into a fully reali

<p class="ex-meta" id="ex-190">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Transform the architectural illustration from image 1 into a fully realistic house, natural lighting, real textures for walls windows and roof, realistic landscaping around the house, accurate shadows, real materials such as wood stone and glass, high resolution photorealism, clean perspective, keep the proportions and layout exactly as in the illustration while turning every element into a believable real world version.
```

#### 单参考编辑指南 · 官方 prompt：Reskin this into a realistic mountain vista

<p class="ex-meta" id="ex-191">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Reskin this into a realistic mountain vista
```

#### 单参考编辑指南 · 官方 prompt：Remove all of the sprinkles while keeping the rest of the image unchange

<p class="ex-meta" id="ex-192">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Remove all of the sprinkles while keeping the rest of the image unchanged
```

#### 单参考编辑指南 · 官方 prompt：Replace the flower in image 1 with a slice of lemon

<p class="ex-meta" id="ex-193">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Replace the flower in image 1 with a slice of lemon
```

#### 单参考编辑指南 · 官方 prompt：Add small goblins climbing the right wall of the gorge

<p class="ex-meta" id="ex-194">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Add small goblins climbing the right wall of the gorge
```

#### 单参考编辑指南 · 官方 prompt：Replace the DJ with a polar bear without headphones

<p class="ex-meta" id="ex-195">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Replace the DJ with a polar bear without headphones
```

#### 单参考编辑指南 · 官方 prompt：Replace the cherries in the right-most jar with multi-colored sprinkles.

<p class="ex-meta" id="ex-196">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Replace the cherries in the right-most jar with multi-colored sprinkles. Change nothing else
```

#### 单参考编辑指南 · 官方 prompt：Remove all vegetation moss and greenery from the statues. Keep only the 

<p class="ex-meta" id="ex-197">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Remove all vegetation moss and greenery from the statues. Keep only the original stone structure with no plants no moss no algae no green tint. Reveal the raw stone texture with visible small cracks and natural erosion.
```

#### 单参考编辑指南 · 官方 prompt：Replace the bike with a rearing black horse

<p class="ex-meta" id="ex-198">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Replace the bike with a rearing black horse
```

#### 单参考编辑指南 · 官方 prompt：Replace all the feathers with rose petals

<p class="ex-meta" id="ex-199">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Replace all the feathers with rose petals
```

#### 单参考编辑指南 · 官方 prompt：Recolor only the white and black FUR of the cow. White fur becomes light

<p class="ex-meta" id="ex-200">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Recolor only the white and black FUR of the cow. White fur becomes light muted green-teal #8bc4bb, and black fur patches become warm red-orange #de4528. Keep the exact patch shapes, fur texture, original shadows and grazing pose. The smooth bare nose and muzzle stay their ORIGINAL pale pink-beige color; exclude them completely from recoloring. Keep the dark eyes, nose openings, collar, yellow ear tag and hooves unchanged. Recolor the fur on the legs and ears only where it is white or black, not their bare skin. Preserve the entire pasture, tree line, sky, camera framing and lighting.
```

#### 单参考编辑指南 · 官方 prompt：The butterfly is now made of shiny silver

<p class="ex-meta" id="ex-201">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
The butterfly is now made of shiny silver
```

#### 单参考编辑指南 · 官方 prompt：Change only the butterfly material to transparent frozen water. Its wing

<p class="ex-meta" id="ex-202">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change only the butterfly material to transparent frozen water. Its wings and body are clear ice, with pale internal ice fractures and distinct rounded melt-water droplets. All wing surfaces transmit the blue sky behind them. Preserve the original wing geometry, antennae, legs, position, size within the frame and cloudy background.
```

#### 单参考编辑指南 · 官方 prompt：Change it to Night

<p class="ex-meta" id="ex-203">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change it to Night
```

#### 单参考编辑指南 · 官方 prompt：Change this to Winter

<p class="ex-meta" id="ex-204">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change this to Winter
```

#### 单参考编辑指南 · 官方 prompt：Fix the lighting and make the entire scene appear in warm autumn colors 

<p class="ex-meta" id="ex-205">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Fix the lighting and make the entire scene appear in warm autumn colors with sunlight
```

#### 单参考编辑指南 · 官方 prompt：Change the text to Flux.2

<p class="ex-meta" id="ex-206">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change the text to Flux.2
```

#### 单参考编辑指南 · 官方 prompt：Change only the wording on the neon sign to the exact text "zum Schlappe

<p class="ex-meta" id="ex-207">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change only the wording on the neon sign to the exact text "zum Schlappen". Keep the original sign's placement, mounting, glow color, perspective and the surrounding nighttime street scene. The new letters use continuous neon tubing and remain readable, with lowercase 'zum' and an uppercase 'S' in 'Schlappen'.
```

#### 单参考编辑指南 · 官方 prompt：Replace the shop sign with a red-orange neon sign that says 'Night Bloom

<p class="ex-meta" id="ex-208">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Replace the shop sign with a red-orange neon sign that says 'Night Bloom', and add a green traffic light on the left side of the frame.
```

#### 单参考编辑指南 · 官方 prompt：Use this image to create an ad. Add the text 'Black Friday hasta -50%' o

<p class="ex-meta" id="ex-209">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Use this image to create an ad. Add the text 'Black Friday hasta -50%' on the right side, making sure it does not overlay the clothes. Add a call-to-action button that says 'Take me there'
```

#### 单参考编辑指南 · 官方 prompt：Change the woman's outfit to a bold fuchsia pink dress against a green s

<p class="ex-meta" id="ex-210">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change the woman's outfit to a bold fuchsia pink dress against a green studio gradient background.
```

#### 单参考编辑指南 · 官方 prompt：Add a short fluffy jacket on her colored #778899, and a hat in the same 

<p class="ex-meta" id="ex-211">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Add a short fluffy jacket on her colored #778899, and a hat in the same fluffy style, colored #98AFC7. Keep her pose
```

#### 单参考编辑指南 · 官方 prompt：Change the color of the woman's lace wedding dress to sky blue (light bl

<p class="ex-meta" id="ex-212">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change the color of the woman's lace wedding dress to sky blue (light blue, #87CEEB), while keeping all lace embroidery details white and fully visible. Preserve the original fabric texture, transparency, patterns, highlights, and natural folds.
```

#### 单参考编辑指南 · 官方 prompt：Open the owl's eyes naturally. Preserve its identity, head position, fea

<p class="ex-meta" id="ex-213">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Open the owl's eyes naturally. Preserve its identity, head position, feather pattern, pose, lighting and the rest of the scene. Both eyes have the natural iris color and round dark pupils of this owl, correctly seated within the existing eyelids, with small reflections consistent with the source lighting.
```

#### 单参考编辑指南 · 官方 prompt：The woman is now looking at the camera

<p class="ex-meta" id="ex-214">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
The woman is now looking at the camera
```

#### 单参考编辑指南 · 官方 prompt：Change the woman's pose to a model-style pose.

<p class="ex-meta" id="ex-215">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
Change the woman's pose to a model-style pose.
```

#### 单参考编辑指南 · 官方 prompt：On the top polaroid photo, diagonally, write in handwritten pink marker:

<p class="ex-meta" id="ex-216">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_single_reference">来源</a></p>

```text
On the top polaroid photo, diagonally, write in handwritten pink marker: "2020 <3"
```

## 多参考编辑

### 多参考编辑指南

来源：[guides_prompting_editing_multi_reference](https://docs.bfl.ml/guides/prompting_editing_multi_reference)

#### 多参考编辑指南 · 官方 prompt：replace the cartridge from image 1 with the van in image 2, adjust the l

<p class="ex-meta" id="ex-163">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
replace the cartridge from image 1 with the van in image 2, adjust the lighting on the van to integrate well within image 1
```

#### 多参考编辑指南 · 官方 prompt：Paint the artwork from images 2, 3, and 4 onto the coins in image 1.

<p class="ex-meta" id="ex-164">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Paint the artwork from images 2, 3, and 4 onto the coins in image 1.
```

#### 多参考编辑指南 · 官方 prompt：Make the building from image 2 appear to be sinking into the water from 

<p class="ex-meta" id="ex-165">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Make the building from image 2 appear to be sinking into the water from image 1.
```

#### 多参考编辑指南 · 官方 prompt：Take the shape of the knife from image 2 and recreate it entirely out of

<p class="ex-meta" id="ex-166">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Take the shape of the knife from image 2 and recreate it entirely out of Skittles like in image 1, keeping the full knife silhouette but formed from colorful Skittles arranged tightly together, on the same background of image 1.
```

#### 多参考编辑指南 · 官方 prompt：Replace the material of the heart so that it looks like the same wrinkle

<p class="ex-meta" id="ex-167">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Replace the material of the heart so that it looks like the same wrinkled white paper texture from the second image.
```

#### 多参考编辑指南 · 官方 prompt：Create a vintage image taken with a Kodak camera, with heavy grain and s

<p class="ex-meta" id="ex-168">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Create a vintage image taken with a Kodak camera, with heavy grain and slight light smudges. Use Image 2 as the location. Insert only the ice skates from Image 1 into Image 2, with the decorations and evening lighting vibe from Image 3. Add more people skating on the ice.
```

#### 多参考编辑指南 · 官方 prompt：Take the animal from image 2 and place it naturally inside the bathtub f

<p class="ex-meta" id="ex-169">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Take the animal from image 2 and place it naturally inside the bathtub from image 1. Fill the tub with water and bubbles, and add a rubber duck on the animal's head.
```

#### 多参考编辑指南 · 官方 prompt：Using the corals and fish from the underwater image, place them inside t

<p class="ex-meta" id="ex-170">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Using the corals and fish from the underwater image, place them inside the vintage room as if the entire room is submerged deep in the ocean. The specific coral formations from the first image should grow along the walls, ceiling, and floor, keeping their original shapes and colors.
```

#### 多参考编辑指南 · 官方 prompt：An impasto painting of a gigantic fluffy ginger-and-white cat walking th

<p class="ex-meta" id="ex-171">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
An impasto painting of a gigantic fluffy ginger-and-white cat walking through a narrow New York alley. Thick textured brushstrokes, bold color layers, expressive painterly details, and a dramatic sense of scale.
```

#### 多参考编辑指南 · 官方 prompt：Apply the colors, patterns, and surface tones of the animal in Image 2 t

<p class="ex-meta" id="ex-172">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Apply the colors, patterns, and surface tones of the animal in Image 2 to the animal in Image 1. Keep the pose, lighting, and overall composition of Image 1 unchanged.
```

#### 多参考编辑指南 · 官方 prompt：Apply the exact colors and repeating pattern from image 2 to the glazed 

<p class="ex-meta" id="ex-173">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Apply the exact colors and repeating pattern from image 2 to the glazed surface of the plate in image 1. Keep the plate's shape, rim, position, camera angle, table and lighting unchanged. The pattern follows the curved plate surface and appears fired into the ceramic glaze, with the existing glossy highlights remaining visible. Preserve the saturated burnt-orange, red-orange, ocher and near-black colors of image 2, especially away from reflected highlights.
```

#### 多参考编辑指南 · 官方 prompt：Fill the bottles in image 1 with the liquid from image 2, matching the c

<p class="ex-meta" id="ex-174">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Fill the bottles in image 1 with the liquid from image 2, matching the color, texture, and translucency of the liquid. Then replace the pile of foam in image 1 with a realistic puddle of the liquid from image 2.
```

#### 多参考编辑指南 · 官方 prompt：Engrave the logo from image 2 into the tree trunk in image 1

<p class="ex-meta" id="ex-175">类型：prompt · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Engrave the logo from image 2 into the tree trunk in image 1
```

#### 多参考编辑指南 · 官方 prompt：Shape the smoke in image 1 so that it forms the logo from image 2

<p class="ex-meta" id="ex-176">类型：prompt · 模型：<span class="badge">FLUX.2</span> · <a href="https://docs.bfl.ml/guides/prompting_editing_multi_reference">来源</a></p>

```text
Shape the smoke in image 1 so that it forms the logo from image 2
```

## bbox 布局 / 局部编辑

### FLUX 3 Image · bounding boxes

来源：[flux_3_flux3_image_bounding_boxes](https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes)

#### FLUX 3 Image · bounding boxes · 编辑 record：In <ref_image_0>, change the large tiger <animal_1> and the small glowin

<p class="ex-meta" id="ex-032">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
In <ref_image_0>, change the large tiger <animal_1> and the small glowing butterfly <insect_1> to be pink. Keep the massive fallen log <log_1>, the falling snow <snow_1>, and the dark background trees <trees_1> exactly unchanged. [{"id":"animal_1","from":null,"src_bbox":null,"tgt_bbox":[250,50,850,650],"desc":"Make both pink."},{"id":"insect_1","from":null,"src_bbox":null,"tgt_bbox":[650,680,750,750],"desc":"Make both pink."},{"id":"log_1","from":"ref_image_0","src_bbox":[600,0,1000,1000],"tgt_bbox":[600,0,1000,1000],"desc":"A massive, fallen tree log stretching horizontally across the foreground. The surface features deep, rough-textured bark, weathered cracks, and small pockets of frost."},{"id":"snow_1","from":"ref_image_0","src_bbox":[0,0,1000,1000],"tgt_bbox":[0,0,1000,1000],"desc":"Numerous white snowflakes of varying sizes falling across the scene. Some flakes are sharp and distinct, while others closer to the lens appear as blurred white streaks."},{"id":"trees_1","from":"ref_image_0","src_bbox":[0,0,650,1000],"tgt_bbox":[0,0,650,1000],"desc":"A dense stand of tall, dark, vertical tree trunks receding into the distance. A cool, blue misty light permeates the spaces between the trees, glowing most intensely from the right edge."}]
```

#### FLUX 3 Image · bounding boxes · 编辑 record：Modify <ref_image_0> by making three replacements. On the lower left pat

<p class="ex-meta" id="ex-033">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Modify <ref_image_0> by making three replacements. On the lower left path, replace the tiny anthropomorphic wolf with a cyberpunk dog <wolf_1>. On the lower right, replace the fallen frosted bamboo log with a fallen bamboo leaf made out of gold <log_1>. In the middle of the misty forest, replace the small dark bird perched on a branch with a bird made out of a robot <bird_1>. Keep the rest of the scene exactly unchanged, preserving the dense upper bamboo leaves <bamboo_1>, the vertical bamboo trunks <bamboo_2> receding into the fog, the frosted ground and lower stalks <bamboo_3>, the dramatic slanting sunbeams <light_1>, the thick foreground bamboo trunk <bamboo_4> on the right, the frozen stream <stream_1>, the stone lantern <lantern_1>, and the floating frost flakes <particles_1>.
```

#### FLUX 3 Image · bounding boxes · 编辑 record：In <ref_image_0>, move the miniature grey amigurumi knight figure <knigh

<p class="ex-meta" id="ex-034">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
In <ref_image_0>, move the miniature grey amigurumi knight figure <knight_1> upwards and to the left along the yarn cliff <cliff_1>. Leave the polished steel tapestry needle <needle_1> in its original position in the air. Keep the rest of the image completely unchanged, preserving the blurred yarn backdrop <backdrop_1>, the large knitted dragon <dragon_1>, and the fiery orange thread <fire_1> suspended between them. [{"id":"knight_1","from":"ref_image_0","src_bbox":[500,150,850,350],"tgt_bbox":[194,55,544,255],"desc":"A miniature amigurumi knight figure crocheted from thick grey woolen yarn. It has visible, intricate stitches forming a rounded helmet shape and a cylindrical body, with tiny stubby arms reaching upwards against the cliff."},{"id":"backdrop_1","from":"ref_image_0","src_bbox":[0,0,1000,1000],"tgt_bbox":[0,0,1000,1000],"desc":"A soft, out-of-focus expanse of cream ivory and melange indigo knitted yarn, providing a blurred studio backdrop with tangible fiber fuzz catching the ambient light."},{"id":"cliff_1","from":"ref_image_0","src_bbox":[300,0,1000,450],"tgt_bbox":[300,0,1000,450],"desc":"A steep, uneven cliff face constructed from stacked, thick yarn skeins in rich shades of mustard yellow, terracotta, and melange indigo, featuring visible woven wool textures and loose, stray fiber strands."},{"id":"needle_1","from":"ref_image_0","src_bbox":[420,250,550,450],"tgt_bbox":[420,250,550,450],"desc":"A real, oversized polished steel tapestry needle, gleaming under the studio lighting. It features a blunt tip and an elongated eye, grasped like a weapon in the knight'
```

#### FLUX 3 Image · bounding boxes · 编辑 record：In <ref_image_0>, replace the tiny anthropomorphic wolf standing on the 

<p class="ex-meta" id="ex-035">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
In <ref_image_0>, replace the tiny anthropomorphic wolf standing on the left side of the frosty path with a dog <wolf_1>. Keep the rest of the image exactly unchanged, including the illuminated upper bamboo leaves <bamboo_1>, the shadowed vertical trunks <bamboo_2>, the frost-covered lower stalks and ground <bamboo_3>, the slanting shafts of light <light_1>, the massive foreground trunk <bamboo_4>, the fallen hollow log <log_1>, the frozen stream <stream_1>, the stone lantern <lantern_1>, the floating frost flakes <particles_1>, and the small perched bird <bird_1>.
```

#### FLUX 3 Image · bounding boxes · 编辑 record：In <ref_image_0>, change the bright red hooded jacket worn by the person

<p class="ex-meta" id="ex-036">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
In <ref_image_0>, change the bright red hooded jacket worn by the person <person_1> standing atop the rock pinnacle <rock_1> to blue. Keep everything else in the image exactly unchanged, including the text <En_Text_1>, the overcast sky <sky_1>, the distant hills <hills_1>, the composition, and the lighting.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Minimalist graphic illustration featuring a black silhouette of a person

<p class="ex-meta" id="ex-037">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame. The image relies entirely on the high-contrast relationship between the two colors, mimicking a digital recreation of a screen-printed or risograph aesthetic, with no discernible light source or shadow. [{"id":"background_1","bbox":[0,0,1000,1000],"desc":"A flat field of neon yellow-green possessing a subtle, tactile paper texture with fine, organic grain and slight variations in color saturation, giving the flat surface a sense of physical depth."},{"id":"silhouette_1","bbox":[150,150,850,850],"desc":"A black silhouette of a person in motion, composed of a dense, stippled texture that resembles physical ink on paper or a low-resolution digital dither. The leading edges, including the front of the head, chest, and forward leg, are relatively solid and opaque. The trailing edges, such as the back, outstretched rear arm, and lifted back leg, dissolve into a spray of coarse, square-shaped pixels and scattered dots. The black ink shows a slight textural irregularity, as if pressed onto a porous surface."}]
```

#### FLUX 3 Image · bounding boxes · 官方 caption：High-angle black and white photograph with a grainy film texture. In the

<p class="ex-meta" id="ex-038">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
High-angle black and white photograph with a grainy film texture. In the right foreground, a brightly lit, pale, flat rooftop <rooftop_1> anchors the composition. Four men in dark suits <person_1> <person_2> <person_3> <person_4> walk in mid-stride towards the right edge of the building, rendered almost entirely as silhouettes against the stark surface. They cast long, sharp diagonal shadows that stretch out before them under harsh, directional lighting. To the left, a plunging view reveals a deep urban canyon and a congested city street <street_1> far below, bisecting the dense architecture. The avenue is packed with a multitude of cars and buses <vehicle_collection_1> appearing as small dark shapes, alongside tiny figures of pedestrians <pedestrian_collection_1> dotting the sidewalks and crosswalks. The street is sharply split by light and shadow, with the left side plunged into deep darkness while the right catches intense sunlight. A faint haze or smoke <haze_1> drifts near the lower central portion of the canyon. The background is filled with towering, monolithic skyscrapers <skyscraper_collection_1> featuring repetitive grids of windows. The buildings recede into the distance, their details softening in the atmospheric perspective.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：A stylized digital illustration in a flat, graphic anime style, resembli

<p class="ex-meta" id="ex-039">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
A stylized digital illustration in a flat, graphic anime style, resembling a modern pop-art poster with non-directional, uniform lighting. The composition is built on a vibrant background <background_1>. Framed in a medium close-up from the chest up, a young demonic woman <character_1> occupies the center, angled in a three-quarter view and looking back over her shoulder. Large, bold Japanese typography <Ja_Text_1> runs down the left side of the frame, while another block of typography <Ja_Text_2> is positioned in the upper right section. In the lower right corner rests a square seal <Ja_Text_3>. At the bottom center, a line of bright text <Ja_Text_4> sits directly above a smaller line of text <Unknown_Text_1>.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Vertical 35mm photograph with fine grain and slightly soft focus. Center

<p class="ex-meta" id="ex-040">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Vertical 35mm photograph with fine grain and slightly soft focus. Centered at the top is a cream-colored title <Fr_Text_1>. A hazy, pale grey and green overcast sky <sky_1> sits above dark, rolling mountains <mountains_1> and a distant coastal town <town_1> on the right. In the dark water <water_1> of a bay stands a massive, pale concrete parabolic dome <dome_1>. The dome's arched opening faces the shore, radiating a warm, golden-orange glow from its interior. A dark rectangular monolith <monolith_1> sits deep inside at water level. The golden light reflects on the rippling water, where scattered silhouettes of people <swimmers_1> wade. In the foreground, a pale, pebbly beach <beach_1> holds a large crowd of seated onlookers <crowd_1> in casual, light-colored clothing. Their backs are to the slightly elevated camera as they gaze at the structure under blue hour lighting.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Monochromatic graphic design poster framed by solid black letterbox bars

<p class="ex-meta" id="ex-041">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Monochromatic graphic design poster framed by solid black letterbox bars at the top <bar_1> and bottom <bar_2>. The background is a textured, off-white surface <background_1>. Dominating the left side of the vertical frame is a large, abstract black mass <mass_1>. To the right of this mass, stacked lowercase text is printed <En_Text_1>. Further down on the right side, a second block of text sits <En_Text_2>. Near the bottom center, positioned below the abstract mass and to the left of the lower text, is a pair of disembodied eyes <eyes_1>. The entire composition features a distressed, photocopy-like aesthetic with heavy grain, noise, and stark black-and-white contrast.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Full-color graphic design on a solid black background <background_1>. Th

<p class="ex-meta" id="ex-042">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Full-color graphic design on a solid black background <background_1>. The composition features two tall, narrow rectangular panels styled as perforated postage stamps, separated by a vertical black gutter. The left panel <panel_1> is rendered in the style of a traditional Japanese ukiyo-e woodblock print with aged paper texture, subtle grain, and ink bleed, depicting dark, craggy rocks and lush green foreground foliage. Down the center of this panel, a cascading waterfall <waterfall_1> tumbles over the rocks. A small wooden bridge <bridge_1> spans the chasm in the middle ground, where two figures stand. On the left is a figure in a light blue kimono and straw hat <person_1>, and on the right is a figure in a purple kimono holding a red parasol <person_2>. White text overlays the left panel at the top <En_Text_1> and bottom <En_Text_2>. The right panel <panel_2> shares the same ukiyo-e style, perforated edges, and horizontal segment divisions, showing a serene landscape. At the top, a sloping mountain <mountain_1> sits under a gradient twilight sky with silhouetted pine trees. In the middle ground, a traditional Japanese house <house_1> rests on a rocky cliff, its windows emitting a warm yellow light. Below the cliff, a rushing turquoise river <river_1> filled with dark grey boulders flows through the foreground. White text is overlaid on the right panel at the top <En_Text_3>, middle <En_Text_4>, and bottom <En_Text_5>. Both panels feature bold outlines, flat areas of color, and high-angle perspectives.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Full-color outdoor photograph with a shallow depth of field, taken under

<p class="ex-meta" id="ex-043">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Full-color outdoor photograph with a shallow depth of field, taken under overcast daytime light at a winter sporting event. A medium close-up captures a row of spectators, focusing on a woman <person_1> seated in the left foreground in profile, facing right. Tucked into her coat and held closely in her lap is a small Pomeranian dog <animal_1>. Seated slightly out of alignment next to her on the right is a man <person_2>, also in profile facing right, holding a Jack Russell Terrier <animal_2> in his lap. Extending to the left behind them is a row of softly blurred spectators, including two blonde women <person_3> <person_4> wearing winter attire. In the background, a hillside covered with dark evergreen trees <region_1> rises against a pale sky. To the upper right, event structures are visible, featuring a white flag <flag_3>, a German flag <flag_1>, a Swiss flag <flag_2>, and a blue banner <structure_1> bearing illegible white text. The composition contrasts the warm browns of the fur coats and dogs with the cooler blues of denim jeans and the muted winter landscape.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Studio photograph of a fashion mood board arranged as a grid of fifteen 

<p class="ex-meta" id="ex-044">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Studio photograph of a fashion mood board arranged as a grid of fifteen rectangular images separated by clean white borders <board_1>. The top row contains five images: a woman sitting with a wide stance in a black leather jumpsuit <image_1>, a close-up of legs in red tights <image_2>, a blurred figure in a dark blue velvet garment <image_3>, a woman in a black ribbed turtleneck with closed eyes <image_4>, and a black-and-white shot of legs in high heels on a chair <image_5>. The middle row features a high-contrast face close-up <image_6>, a portrait of a woman with closed eyes and a pearl earring <image_7>, the back of a head with wavy hair being combed <image_8>, a motion-blurred facial profile <image_9>, and a figure mid-stride in a dark skirt and boots <image_10>. The bottom row displays a black-and-white profile of a bob haircut <image_11>, an extreme close-up of an eye and damp hair <image_12>, white flower petals on a black background <image_13>, a low-angle shot of a teal leather jacket and silver trousers <image_14>, and a close-up of a hand wearing silver rings <image_15>.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Full-color indoor 35mm photograph with a slight film grain and a warm co

<p class="ex-meta" id="ex-045">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Full-color indoor 35mm photograph with a slight film grain and a warm color cast, lit by harsh, direct camera flash that casts sharp shadows against the background. A light-colored wooden bench <bench_1> sits against a wall of horizontal light-wood panels <wall_1>. On the floor beneath the bench is a vibrant moss-green rug <rug_1>. Seated on the left side of the bench is a man <person_1> captured mid-sip from a glass of amber liquid <glass_1>. In the center sits a humanoid figure <figure_1>. To the right, another man <person_2> sits with a slumped posture, looking downward at a second glass of amber liquid <glass_2> held in his hand. The framing is a full-body shot centered on the three figures, leaving a significant expanse of the wood-paneled wall visible above their heads.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Digital composite image featuring a dense, sunlit forest <forest_1> as t

<p class="ex-meta" id="ex-046">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Digital composite image featuring a dense, sunlit forest <forest_1> as the background, shot at eye level. Centered in the foreground is a large, semi-transparent rectangular graphic overlay. Its upper section <region_4> is a subtle clear tint over the canopy. The middle section of the overlay is divided horizontally into two bands. The top band <region_1> consists of vertical stripes alternating between clear transparency and translucent chartreuse yellow, ending in a solid chartreuse square on the far right that contains a black directional sign <En_Text_1>. The lower band <region_2> mirrors this structure with alternating clear and chartreuse stripes, ending in a solid chartreuse square on the far left that holds another black directional sign <En_Text_2>. Below these striped bands, the overlay continues downwards as a dark, slightly distorted filter <region_3> covering the lower forest foliage, creating a sharp contrast between the organic textures of the woods and the crisp, straight edges of the rectangle.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Formal digital collage serving as a fashion mood board, structured into 

<p class="ex-meta" id="ex-047">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Formal digital collage serving as a fashion mood board, structured into rectangular panels separated by thin white borders against a stark white background canvas. In the upper left, a square panel <panel_1> sits beside a taller rectangular panel <panel_2> in the upper middle, with another square panel <panel_3> on the upper right. Running vertically down the left margin is a text block <En_Text_1>. The middle section is dominated by a large, wide panel <panel_4>. Below this, a horizontal row contains four smaller detail panels: the first <panel_5> on the left, the second <panel_6> next to it, the third <panel_7> in the mid-right, and the fourth <panel_8> on the far right, which contains a visible woven label <En_Text_4>. Along the bottom edge, a block of sans-serif text <En_Text_2> sits on the left, while a large script signature <En_Text_3> spans the bottom right.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Full-color outdoor photograph with a slight film grain and shallow depth

<p class="ex-meta" id="ex-048">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Full-color outdoor photograph with a slight film grain and shallow depth of field, captured from a ground-level, low-angle perspective in an urban park. Warm, directional late-afternoon sunlight filters through a dense canopy of deciduous trees <trees_1> in the background. Occupying the center and extending to the left is a white picnic blanket with thin red horizontal stripes <blanket_1>. A young girl of East Asian descent <girl_1> lies prone on the blanket, leaning forward on her elbows. Her left hand rests near her chest with fingers slightly curled, while her right hand extends toward the right edge of the frame. Just off the blanket on the green grass <grass_1> stands a small brown sparrow <sparrow_1> facing her. In the lower right foreground, a second sparrow <sparrow_2> is partially visible, heavily blurred by the shallow depth of field. Scattered on the left side of the blanket are several picnic items: a clear plastic water bottle with a blue cap <bottle_1>, a red cardboard box <box_1> displaying white text <En_Text_1>, scattered papers <papers_1>, and a small open snack container <container_1>. In the blurred background, a black lamppost <lamppost_1> stands among the trees, and several distant, out-of-focus figures <figures_1> are visible walking and sitting on benches.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Digital graphic design mockup shot straight-on with a top-down view unde

<p class="ex-meta" id="ex-049">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Digital graphic design mockup shot straight-on with a top-down view under flat, even studio-style lighting. A flat, neutral gray background <background_1> fills the frame. Centered in the composition is a vertical, rectangular black poster <poster_1>, appearing to hover just above the surface due to a soft, diffuse drop shadow extending along its left and bottom edges. The poster displays the complete English alphabet rendered in stark white with a geometric glitch aesthetic, featuring horizontal shifts and missing angular slices. The letters are arranged systematically across five horizontal rows: the first row <En_Text_1>, the second row <En_Text_2>, the third row <En_Text_3>, the fourth row <En_Text_4>, and the fifth row <En_Text_5>. Centered near the bottom edge of the poster is a logo <graphic_1>. Immediately below this emblem, a small line of text <En_Text_6> completes the design.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Full-color architectural photograph shot on 35mm film from a low-angle p

<p class="ex-meta" id="ex-050">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Full-color architectural photograph shot on 35mm film from a low-angle perspective at ground level, featuring bright, direct sunlight and visible film grain. Under a clear, pale blue sky <sky_1>, a Brutalist concrete structure <building_1> dominates the right and center of the frame. The building features three clusters of tall, nested parabolic arches. At the base of the central section, a flat concrete overhang <overhang_1> shelters a small, dark entrance <entrance_1>. Mounted on the overhang is a large, rectangular red sign <sign_1> displaying a circular emblem <emblem_1> on the left, a line of Georgian script <Ka_Text_1> on top, and English text <En_Text_1> below. Along the ledge behind the sign, several small flags on thin poles <flags_1> are visible. To the left stands a portion of an older, traditional building <building_2> with a slender, tiered tower topped by a metallic spire and a five-pointed star. In the foreground on the far left, a dark green coniferous tree <tree_1> partially obscures the lower levels of a glass-fronted building <building_3>. The structures sit behind a wide set of shallow concrete steps <steps_1> that lead down to a paved plaza made of grey stone blocks <plaza_1> filling the bottom of the frame.
```

#### FLUX 3 Image · bounding boxes · 官方 idea：Night at a Japanese restaurant: two diners in red light at the table, a 

<p class="ex-meta" id="ex-051">类型：idea · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Night at a Japanese restaurant: two diners in red light at the table, a lit pine garden outside.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：High-angle, full-color 35mm indoor-outdoor film photograph captured at n

<p class="ex-meta" id="ex-052">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
High-angle, full-color 35mm indoor-outdoor film photograph captured at night, featuring visible grain, deep shadows, and a shallow depth of field that renders the foreground in an atmospheric blur. The composition divides a dimly lit interior dining area on the right from an illuminated exterior garden on the left. In the blurred foreground, bathed in deep, monochromatic red light, two silhouetted figures sit at a dining table <table_1>. A young child with dark hair <person_1> faces the camera as an out-of-focus red shape, while the profile of an adult <person_2> occupies the right edge. Between them, the table holds blurred dishes <dishes_1> and a small candle <candle_1> that provides a warm orange point of light. Through a large window on the left, the sharp exterior scene is set against a pitch-black night sky <sky_1>. A Japanese pine tree <tree_1> is illuminated by a cool, artificial green light, resolving its textured bark and dense needle clusters. Below the tree, a low bamboo fence <fence_1> runs horizontally. Further back, a stone-paved path <path_1> leads into the dark garden, dotted with a few scattered warm-toned lights <lights_1>.
```

#### FLUX 3 Image · bounding boxes · 官方 idea：A magazine cover called Tools: a tower of wooden Kapla planks under big 

<p class="ex-meta" id="ex-053">类型：idea · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
A magazine cover called Tools: a tower of wooden Kapla planks under big blue serif type.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Studio photograph of a publication cover set against a seamless, stark w

<p class="ex-meta" id="ex-054">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Studio photograph of a publication cover set against a seamless, stark white background. Centered in the vertical frame is a tall architectural structure <structure_1> built from small, uniform wooden planks. Bright, even softbox lighting casts soft, subtle shadows at the base of the construction and within its gaps. Dominating the upper third of the composition is a large title <En_Text_1>, its lower edge partially obscured by the top of the wooden structure. At the bottom of the frame, a smaller subtitle <En_Text_2> stretches horizontally. Tucked into the bottom-left corner is a vertical barcode <barcode_1> accompanied by stacked price markings <En_Text_3>.
```

#### FLUX 3 Image · bounding boxes · 官方 idea：A 4x4 sheet of minimalist poster layouts in sage green and black, each u

<p class="ex-meta" id="ex-055">类型：idea · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
A 4x4 sheet of minimalist poster layouts in sage green and black, each using the letters CFHKNP.
```

#### FLUX 3 Image · bounding boxes · 官方 caption：Flat, two-dimensional graphic design layout on a plain white background,

<p class="ex-meta" id="ex-056">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Flat, two-dimensional graphic design layout on a plain white background, presenting a four-by-four grid of sixteen rectangular wireframe panels separated by even white margins. The minimalist study explores spatial relationships using a strictly limited palette of white, black, and muted sage green. The top row features four distinct compositions: a panel <panel_1> with a green circle and a central typographic anchor <En_Text_1>, a panel <panel_2> containing a green square and vertical text <En_Text_2>, a panel <panel_3> centered on an organic wavy blob beneath curved text <En_Text_3>, and a panel <panel_4> displaying a sage-green bottle silhouette beside spaced lettering <En_Text_4>. In the second row, a panel <panel_5> with an upward triangle and bottom-right text <En_Text_5> sits next to a panel <panel_6> holding twin rectangles and vertical text <En_Text_6>. Beside them, a panel <panel_7> splits a circle around central text <En_Text_7>, while the row ends with a panel <panel_8> balancing a rotated square above its text <En_Text_8>. The third row begins with a panel <panel_9> featuring a tall rectangular sidebar and top-right text <En_Text_9>, followed by a panel <panel_10> with a lower blob and vertical text <En_Text_10>. A panel <panel_11> pairs a top-right circle with downward-curving text <En_Text_11>, and a panel <panel_12> anchors a wide bottom rectangle under top-aligned text <En_Text_12>. The bottom row completes the grid with a panel <panel_13> pointing a triangle rightward beside vertical text <En_Text_13>, a panel <panel_14> centering a large rectangle and overlaid text <En_Text_14>, a panel <panel_15> with a bottom half-circle and top-aligned text <En_Text_15>, and a final panel <panel_16> presenting a tiny grid of squares next to vertical text <En_Text_16>. In every panel, varied densities of black horizontal lines simulate body text, interacting dynamically with the shapes and typography to create a balanced structural design.
```

#### FLUX 3 Image · bounding boxes · 文档代码块：Minimalist graphic illustration featuring a black silhouette of a person

<p class="ex-meta" id="ex-057">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame. The image relies entirely on the high-contrast relationship between the two colors, mimicking a digital recreation of a screen-printed or risograph aesthetic, with no discernible light source or shadow. [{"id":"background_1","bbox":[0,0,1000,1000],"desc":"A flat field of neon yellow-green possessing a subtle, tactile paper texture with fine, organic grain and slight variations in color saturation, giving the flat surface a sense of physical depth."},{"id":"silhouette_1","bbox":[150,150,850,850],"desc":"A black silhouette of a person in motion, composed of a dense, stippled texture that resembles physical ink on paper or a low-resolution digital dither. The leading edges, including the front of the head, chest, and forward leg, are relatively solid and opaque. The trailing edges, such as the back, outstretched rear arm, and lifted back leg, dissolve into a spray of coarse, square-shaped pixels and scattered dots. The black ink shows a slight textural irregularity, as if pressed onto a porous surface."}]
```

#### FLUX 3 Image · bounding boxes · 文档代码块：In <ref_image_0>, move the miniature grey amigurumi knight figure <knigh

<p class="ex-meta" id="ex-058">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes">来源</a></p>

```text
In <ref_image_0>, move the miniature grey amigurumi knight figure <knight_1> upwards and to the left along the yarn cliff <cliff_1>. Keep the rest of the image completely unchanged, preserving the blurred yarn backdrop <backdrop_1>, the large knitted dragon <dragon_1>, and the fiery orange thread <fire_1>.
```

### FLUX 3 Image · layout

来源：[flux_3_flux3_image_layout](https://docs.bfl.ml/flux_3/flux3_image_layout)

#### FLUX 3 Image · layout · 编辑 record：Modify the sharply focused moth on the left side of the glowing light fi

<p class="ex-meta" id="ex-087">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
Modify the sharply focused moth on the left side of the glowing light fixture <light_fixture_1> in <ref_image_0>. Replace it with a new moth <moth_1> that features a distinct leopard print pattern on its wings, while maintaining the original flat triangular shape against the white background. Keep all other elements exactly unchanged, including the two sharp moths <moth_2> and <moth_3> on the upper right, the blurred flying moths <moth_4> and <moth_5>, and the scattered tiny insects and shadows <insect_swarm_1>.
```

#### FLUX 3 Image · layout · 编辑 record：In <ref_image_0>, change only the lavender-purple ribbon <purple_fabric>

<p class="ex-meta" id="ex-088">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
In <ref_image_0>, change only the lavender-purple ribbon <purple_fabric> across the middle to metallic purple silk, preserving its exact outline, folds, and position. Do not change the rose-red/pink cloth <pink_fabric> on the left, including its folds beside and underneath the purple ribbon. Leave the orange cloth <orange_fabric>, green cloth <green_fabric>, blue cloth <blue_fabric>, ocean <ocean_waves>, and beach <sandy_beach> pixel-for-pixel unchanged. The red/pink cloth must retain its original color, transparency, texture, and non-metallic finish.
```

#### FLUX 3 Image · layout · 编辑 record：In <ref_image_0>, change the flat-topped rocky mesa in the middle distan

<p class="ex-meta" id="ex-089">类型：record · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
In <ref_image_0>, change the flat-topped rocky mesa in the middle distance to a flat-topped mesa <central_mesa> made of polished black obsidian with a reflective surface. Ensure the glossy black material catches the ambient light and reflects the starry sky above. Keep the arching Milky Way <milky_way>, the eroded clay ridges <foreground_ridges> in the foreground, and the distant horizon <distant_horizon> completely untouched.
```

#### FLUX 3 Image · layout · 官方 prompt：In this image, change <owl_subject>, previously described as "a short-ea

<p class="ex-meta" id="ex-090">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
In this image, change <owl_subject>, previously described as "a short-eared owl in flight with brown and tan mottled feathers and yellow eyes", to: a short-eared owl in flight with striking snowy white and charcoal grey mottled feathers and bright yellow eyes. Keep everything else in the image — composition, other elements, lighting, background — exactly unchanged.
```

#### FLUX 3 Image · layout · 官方 prompt：change the color of only one bird in the middle to #e01075

<p class="ex-meta" id="ex-091">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
change the color of only one bird in the middle to #e01075
```

#### FLUX 3 Image · layout · 官方 prompt：replace the cartridge from image 1 with the van in image 2, adjust the l

<p class="ex-meta" id="ex-092">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
replace the cartridge from image 1 with the van in image 2, adjust the lighting on the van to integrate well within image 1
```

#### FLUX 3 Image · layout · 官方 prompt：Change the Lamp color to #34eb61

<p class="ex-meta" id="ex-093">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
Change the Lamp color to #34eb61
```

#### FLUX 3 Image · layout · 官方 prompt：Create a blanket using the exact texture from the uploaded image, photog

<p class="ex-meta" id="ex-094">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
Create a blanket using the exact texture from the uploaded image, photographed in a clean studio setup.
```

#### FLUX 3 Image · layout · 官方 prompt：Now they are in a snowy Japanese landscape with a Japanese Maple tree.

<p class="ex-meta" id="ex-095">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
Now they are in a snowy Japanese landscape with a Japanese Maple tree.
```

#### FLUX 3 Image · layout · 官方 prompt：use image 2 texture and shape to create a bag, and replace the bag in im

<p class="ex-meta" id="ex-096">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
use image 2 texture and shape to create a bag, and replace the bag in image 1. use #CC5500, #F5A623 #6B8E23 colors for the new bag.
```

#### FLUX 3 Image · layout · 官方 prompt：Use image 1 as the main image. Insert the lake from image 2 on the left 

<p class="ex-meta" id="ex-097">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
Use image 1 as the main image. Insert the lake from image 2 on the left side of image 1, and make sure it blends naturally with the surroundings as if it is part of the garden view. Insert the ducks from image 3 into image 1, and make them appear as if they are near the lake on the grass
```

#### FLUX 3 Image · layout · 官方 prompt：Furnish the exact room in image 1 with the following items: the bed from

<p class="ex-meta" id="ex-098">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_image_layout">来源</a></p>

```text
Furnish the exact room in image 1 with the following items: the bed from image 2 on the left side of the room near the wall. on top of the bed the cushion from image 3. on the floor the carpet from image 4
```

### 布局提示词指南

来源：[guides_prompting_layout](https://docs.bfl.ml/guides/prompting_layout)

#### 布局提示词指南 · 官方 caption：Minimalist graphic illustration featuring a black silhouette of a person

<p class="ex-meta" id="ex-217">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Minimalist graphic illustration featuring a black silhouette of a person <silhouette_1> centered against a solid, vibrant chartreuse background <background_1>. The figure is captured in a dynamic, mid-stride running pose, facing toward the left side of the frame. The image relies entirely on the high-contrast relationship between the two colors, mimicking a digital recreation of a screen-printed or risograph aesthetic, with no discernible light source or shadow. [{"id":"background_1","bbox":[0,0,1000,1000],"desc":"A flat field of neon yellow-green possessing a subtle, tactile paper texture with fine, organic grain and slight variations in color saturation, giving the flat surface a sense of physical depth."},{"id":"silhouette_1","bbox":[150,150,850,850],"desc":"A black silhouette of a person in motion, composed of a dense, stippled texture that resembles physical ink on paper or a low-resolution digital dither. The leading edges, including the front of the head, chest, and forward leg, are relatively solid and opaque. The trailing edges, such as the back, outstretched rear arm, and lifted back leg, dissolve into a spray of coarse, square-shaped pixels and scattered dots. The black ink shows a slight textural irregularity, as if pressed onto a porous surface."}]
```

#### 布局提示词指南 · 官方 caption：High-angle black and white photograph with a grainy film texture. In the

<p class="ex-meta" id="ex-218">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
High-angle black and white photograph with a grainy film texture. In the right foreground, a brightly lit, pale, flat rooftop <rooftop_1> anchors the composition. Four men in dark suits <person_1> <person_2> <person_3> <person_4> walk in mid-stride towards the right edge of the building, rendered almost entirely as silhouettes against the stark surface. They cast long, sharp diagonal shadows that stretch out before them under harsh, directional lighting. To the left, a plunging view reveals a deep urban canyon and a congested city street <street_1> far below, bisecting the dense architecture. The avenue is packed with a multitude of cars and buses <vehicle_collection_1> appearing as small dark shapes, alongside tiny figures of pedestrians <pedestrian_collection_1> dotting the sidewalks and crosswalks. The street is sharply split by light and shadow, with the left side plunged into deep darkness while the right catches intense sunlight. A faint haze or smoke <haze_1> drifts near the lower central portion of the canyon. The background is filled with towering, monolithic skyscrapers <skyscraper_collection_1> featuring repetitive grids of windows. The buildings recede into the distance, their details softening in the atmospheric perspective.
```

#### 布局提示词指南 · 官方 caption：A stylized digital illustration in a flat, graphic anime style, resembli

<p class="ex-meta" id="ex-219">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
A stylized digital illustration in a flat, graphic anime style, resembling a modern pop-art poster with non-directional, uniform lighting. The composition is built on a vibrant background <background_1>. Framed in a medium close-up from the chest up, a young demonic woman <character_1> occupies the center, angled in a three-quarter view and looking back over her shoulder. Large, bold Japanese typography <Ja_Text_1> runs down the left side of the frame, while another block of typography <Ja_Text_2> is positioned in the upper right section. In the lower right corner rests a square seal <Ja_Text_3>. At the bottom center, a line of bright text <Ja_Text_4> sits directly above a smaller line of text <Unknown_Text_1>.
```

#### 布局提示词指南 · 官方 caption：Vertical 35mm photograph with fine grain and slightly soft focus. Center

<p class="ex-meta" id="ex-220">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Vertical 35mm photograph with fine grain and slightly soft focus. Centered at the top is a cream-colored title <Fr_Text_1>. A hazy, pale grey and green overcast sky <sky_1> sits above dark, rolling mountains <mountains_1> and a distant coastal town <town_1> on the right. In the dark water <water_1> of a bay stands a massive, pale concrete parabolic dome <dome_1>. The dome's arched opening faces the shore, radiating a warm, golden-orange glow from its interior. A dark rectangular monolith <monolith_1> sits deep inside at water level. The golden light reflects on the rippling water, where scattered silhouettes of people <swimmers_1> wade. In the foreground, a pale, pebbly beach <beach_1> holds a large crowd of seated onlookers <crowd_1> in casual, light-colored clothing. Their backs are to the slightly elevated camera as they gaze at the structure under blue hour lighting.
```

#### 布局提示词指南 · 官方 caption：Monochromatic graphic design poster framed by solid black letterbox bars

<p class="ex-meta" id="ex-221">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Monochromatic graphic design poster framed by solid black letterbox bars at the top <bar_1> and bottom <bar_2>. The background is a textured, off-white surface <background_1>. Dominating the left side of the vertical frame is a large, abstract black mass <mass_1>. To the right of this mass, stacked lowercase text is printed <En_Text_1>. Further down on the right side, a second block of text sits <En_Text_2>. Near the bottom center, positioned below the abstract mass and to the left of the lower text, is a pair of disembodied eyes <eyes_1>. The entire composition features a distressed, photocopy-like aesthetic with heavy grain, noise, and stark black-and-white contrast.
```

#### 布局提示词指南 · 官方 caption：Full-color graphic design on a solid black background <background_1>. Th

<p class="ex-meta" id="ex-222">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Full-color graphic design on a solid black background <background_1>. The composition features two tall, narrow rectangular panels styled as perforated postage stamps, separated by a vertical black gutter. The left panel <panel_1> is rendered in the style of a traditional Japanese ukiyo-e woodblock print with aged paper texture, subtle grain, and ink bleed, depicting dark, craggy rocks and lush green foreground foliage. Down the center of this panel, a cascading waterfall <waterfall_1> tumbles over the rocks. A small wooden bridge <bridge_1> spans the chasm in the middle ground, where two figures stand. On the left is a figure in a light blue kimono and straw hat <person_1>, and on the right is a figure in a purple kimono holding a red parasol <person_2>. White text overlays the left panel at the top <En_Text_1> and bottom <En_Text_2>. The right panel <panel_2> shares the same ukiyo-e style, perforated edges, and horizontal segment divisions, showing a serene landscape. At the top, a sloping mountain <mountain_1> sits under a gradient twilight sky with silhouetted pine trees. In the middle ground, a traditional Japanese house <house_1> rests on a rocky cliff, its windows emitting a warm yellow light. Below the cliff, a rushing turquoise river <river_1> filled with dark grey boulders flows through the foreground. White text is overlaid on the right panel at the top <En_Text_3>, middle <En_Text_4>, and bottom <En_Text_5>. Both panels feature bold outlines, flat areas of color, and high-angle perspectives.
```

#### 布局提示词指南 · 官方 caption：Full-color outdoor photograph with a shallow depth of field, taken under

<p class="ex-meta" id="ex-223">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Full-color outdoor photograph with a shallow depth of field, taken under overcast daytime light at a winter sporting event. A medium close-up captures a row of spectators, focusing on a woman <person_1> seated in the left foreground in profile, facing right. Tucked into her coat and held closely in her lap is a small Pomeranian dog <animal_1>. Seated slightly out of alignment next to her on the right is a man <person_2>, also in profile facing right, holding a Jack Russell Terrier <animal_2> in his lap. Extending to the left behind them is a row of softly blurred spectators, including two blonde women <person_3> <person_4> wearing winter attire. In the background, a hillside covered with dark evergreen trees <region_1> rises against a pale sky. To the upper right, event structures are visible, featuring a white flag <flag_3>, a German flag <flag_1>, a Swiss flag <flag_2>, and a blue banner <structure_1> bearing illegible white text. The composition contrasts the warm browns of the fur coats and dogs with the cooler blues of denim jeans and the muted winter landscape.
```

#### 布局提示词指南 · 官方 caption：Studio photograph of a fashion mood board arranged as a grid of fifteen 

<p class="ex-meta" id="ex-224">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Studio photograph of a fashion mood board arranged as a grid of fifteen rectangular images separated by clean white borders <board_1>. The top row contains five images: a woman sitting with a wide stance in a black leather jumpsuit <image_1>, a close-up of legs in red tights <image_2>, a blurred figure in a dark blue velvet garment <image_3>, a woman in a black ribbed turtleneck with closed eyes <image_4>, and a black-and-white shot of legs in high heels on a chair <image_5>. The middle row features a high-contrast face close-up <image_6>, a portrait of a woman with closed eyes and a pearl earring <image_7>, the back of a head with wavy hair being combed <image_8>, a motion-blurred facial profile <image_9>, and a figure mid-stride in a dark skirt and boots <image_10>. The bottom row displays a black-and-white profile of a bob haircut <image_11>, an extreme close-up of an eye and damp hair <image_12>, white flower petals on a black background <image_13>, a low-angle shot of a teal leather jacket and silver trousers <image_14>, and a close-up of a hand wearing silver rings <image_15>.
```

#### 布局提示词指南 · 官方 caption：Full-color indoor 35mm photograph with a slight film grain and a warm co

<p class="ex-meta" id="ex-225">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Full-color indoor 35mm photograph with a slight film grain and a warm color cast, lit by harsh, direct camera flash that casts sharp shadows against the background. A light-colored wooden bench <bench_1> sits against a wall of horizontal light-wood panels <wall_1>. On the floor beneath the bench is a vibrant moss-green rug <rug_1>. Seated on the left side of the bench is a man <person_1> captured mid-sip from a glass of amber liquid <glass_1>. In the center sits a humanoid figure <figure_1>. To the right, another man <person_2> sits with a slumped posture, looking downward at a second glass of amber liquid <glass_2> held in his hand. The framing is a full-body shot centered on the three figures, leaving a significant expanse of the wood-paneled wall visible above their heads.
```

#### 布局提示词指南 · 官方 caption：Digital composite image featuring a dense, sunlit forest <forest_1> as t

<p class="ex-meta" id="ex-226">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Digital composite image featuring a dense, sunlit forest <forest_1> as the background, shot at eye level. Centered in the foreground is a large, semi-transparent rectangular graphic overlay. Its upper section <region_4> is a subtle clear tint over the canopy. The middle section of the overlay is divided horizontally into two bands. The top band <region_1> consists of vertical stripes alternating between clear transparency and translucent chartreuse yellow, ending in a solid chartreuse square on the far right that contains a black directional sign <En_Text_1>. The lower band <region_2> mirrors this structure with alternating clear and chartreuse stripes, ending in a solid chartreuse square on the far left that holds another black directional sign <En_Text_2>. Below these striped bands, the overlay continues downwards as a dark, slightly distorted filter <region_3> covering the lower forest foliage, creating a sharp contrast between the organic textures of the woods and the crisp, straight edges of the rectangle.
```

#### 布局提示词指南 · 官方 caption：Formal digital collage serving as a fashion mood board, structured into 

<p class="ex-meta" id="ex-227">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Formal digital collage serving as a fashion mood board, structured into rectangular panels separated by thin white borders against a stark white background canvas. In the upper left, a square panel <panel_1> sits beside a taller rectangular panel <panel_2> in the upper middle, with another square panel <panel_3> on the upper right. Running vertically down the left margin is a text block <En_Text_1>. The middle section is dominated by a large, wide panel <panel_4>. Below this, a horizontal row contains four smaller detail panels: the first <panel_5> on the left, the second <panel_6> next to it, the third <panel_7> in the mid-right, and the fourth <panel_8> on the far right, which contains a visible woven label <En_Text_4>. Along the bottom edge, a block of sans-serif text <En_Text_2> sits on the left, while a large script signature <En_Text_3> spans the bottom right.
```

#### 布局提示词指南 · 官方 caption：Full-color outdoor photograph with a slight film grain and shallow depth

<p class="ex-meta" id="ex-228">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Full-color outdoor photograph with a slight film grain and shallow depth of field, captured from a ground-level, low-angle perspective in an urban park. Warm, directional late-afternoon sunlight filters through a dense canopy of deciduous trees <trees_1> in the background. Occupying the center and extending to the left is a white picnic blanket with thin red horizontal stripes <blanket_1>. A young girl of East Asian descent <girl_1> lies prone on the blanket, leaning forward on her elbows. Her left hand rests near her chest with fingers slightly curled, while her right hand extends toward the right edge of the frame. Just off the blanket on the green grass <grass_1> stands a small brown sparrow <sparrow_1> facing her. In the lower right foreground, a second sparrow <sparrow_2> is partially visible, heavily blurred by the shallow depth of field. Scattered on the left side of the blanket are several picnic items: a clear plastic water bottle with a blue cap <bottle_1>, a red cardboard box <box_1> displaying white text <En_Text_1>, scattered papers <papers_1>, and a small open snack container <container_1>. In the blurred background, a black lamppost <lamppost_1> stands among the trees, and several distant, out-of-focus figures <figures_1> are visible walking and sitting on benches.
```

#### 布局提示词指南 · 官方 caption：Digital graphic design mockup shot straight-on with a top-down view unde

<p class="ex-meta" id="ex-229">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Digital graphic design mockup shot straight-on with a top-down view under flat, even studio-style lighting. A flat, neutral gray background <background_1> fills the frame. Centered in the composition is a vertical, rectangular black poster <poster_1>, appearing to hover just above the surface due to a soft, diffuse drop shadow extending along its left and bottom edges. The poster displays the complete English alphabet rendered in stark white with a geometric glitch aesthetic, featuring horizontal shifts and missing angular slices. The letters are arranged systematically across five horizontal rows: the first row <En_Text_1>, the second row <En_Text_2>, the third row <En_Text_3>, the fourth row <En_Text_4>, and the fifth row <En_Text_5>. Centered near the bottom edge of the poster is a logo <graphic_1>. Immediately below this emblem, a small line of text <En_Text_6> completes the design.
```

#### 布局提示词指南 · 官方 caption：Full-color architectural photograph shot on 35mm film from a low-angle p

<p class="ex-meta" id="ex-230">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Full-color architectural photograph shot on 35mm film from a low-angle perspective at ground level, featuring bright, direct sunlight and visible film grain. Under a clear, pale blue sky <sky_1>, a Brutalist concrete structure <building_1> dominates the right and center of the frame. The building features three clusters of tall, nested parabolic arches. At the base of the central section, a flat concrete overhang <overhang_1> shelters a small, dark entrance <entrance_1>. Mounted on the overhang is a large, rectangular red sign <sign_1> displaying a circular emblem <emblem_1> on the left, a line of Georgian script <Ka_Text_1> on top, and English text <En_Text_1> below. Along the ledge behind the sign, several small flags on thin poles <flags_1> are visible. To the left stands a portion of an older, traditional building <building_2> with a slender, tiered tower topped by a metallic spire and a five-pointed star. In the foreground on the far left, a dark green coniferous tree <tree_1> partially obscures the lower levels of a glass-fronted building <building_3>. The structures sit behind a wide set of shallow concrete steps <steps_1> that lead down to a paved plaza made of grey stone blocks <plaza_1> filling the bottom of the frame.
```

#### 布局提示词指南 · 官方 idea：Night at a Japanese restaurant: two diners in red light at the table, a 

<p class="ex-meta" id="ex-231">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Night at a Japanese restaurant: two diners in red light at the table, a lit pine garden outside.
```

#### 布局提示词指南 · 官方 caption：High-angle, full-color 35mm indoor-outdoor film photograph captured at n

<p class="ex-meta" id="ex-232">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
High-angle, full-color 35mm indoor-outdoor film photograph captured at night, featuring visible grain, deep shadows, and a shallow depth of field that renders the foreground in an atmospheric blur. The composition divides a dimly lit interior dining area on the right from an illuminated exterior garden on the left. In the blurred foreground, bathed in deep, monochromatic red light, two silhouetted figures sit at a dining table <table_1>. A young child with dark hair <person_1> faces the camera as an out-of-focus red shape, while the profile of an adult <person_2> occupies the right edge. Between them, the table holds blurred dishes <dishes_1> and a small candle <candle_1> that provides a warm orange point of light. Through a large window on the left, the sharp exterior scene is set against a pitch-black night sky <sky_1>. A Japanese pine tree <tree_1> is illuminated by a cool, artificial green light, resolving its textured bark and dense needle clusters. Below the tree, a low bamboo fence <fence_1> runs horizontally. Further back, a stone-paved path <path_1> leads into the dark garden, dotted with a few scattered warm-toned lights <lights_1>.
```

#### 布局提示词指南 · 官方 idea：A magazine cover called Tools: a tower of wooden Kapla planks under big 

<p class="ex-meta" id="ex-233">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
A magazine cover called Tools: a tower of wooden Kapla planks under big blue serif type.
```

#### 布局提示词指南 · 官方 caption：Studio photograph of a publication cover set against a seamless, stark w

<p class="ex-meta" id="ex-234">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Studio photograph of a publication cover set against a seamless, stark white background. Centered in the vertical frame is a tall architectural structure <structure_1> built from small, uniform wooden planks. Bright, even softbox lighting casts soft, subtle shadows at the base of the construction and within its gaps. Dominating the upper third of the composition is a large title <En_Text_1>, its lower edge partially obscured by the top of the wooden structure. At the bottom of the frame, a smaller subtitle <En_Text_2> stretches horizontally. Tucked into the bottom-left corner is a vertical barcode <barcode_1> accompanied by stacked price markings <En_Text_3>.
```

#### 布局提示词指南 · 官方 idea：A 4x4 sheet of minimalist poster layouts in sage green and black, each u

<p class="ex-meta" id="ex-235">类型：idea · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
A 4x4 sheet of minimalist poster layouts in sage green and black, each using the letters CFHKNP.
```

#### 布局提示词指南 · 官方 caption：Flat, two-dimensional graphic design layout on a plain white background,

<p class="ex-meta" id="ex-236">类型：caption · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
Flat, two-dimensional graphic design layout on a plain white background, presenting a four-by-four grid of sixteen rectangular wireframe panels separated by even white margins. The minimalist study explores spatial relationships using a strictly limited palette of white, black, and muted sage green. The top row features four distinct compositions: a panel <panel_1> with a green circle and a central typographic anchor <En_Text_1>, a panel <panel_2> containing a green square and vertical text <En_Text_2>, a panel <panel_3> centered on an organic wavy blob beneath curved text <En_Text_3>, and a panel <panel_4> displaying a sage-green bottle silhouette beside spaced lettering <En_Text_4>. In the second row, a panel <panel_5> with an upward triangle and bottom-right text <En_Text_5> sits next to a panel <panel_6> holding twin rectangles and vertical text <En_Text_6>. Beside them, a panel <panel_7> splits a circle around central text <En_Text_7>, while the row ends with a panel <panel_8> balancing a rotated square above its text <En_Text_8>. The third row begins with a panel <panel_9> featuring a tall rectangular sidebar and top-right text <En_Text_9>, followed by a panel <panel_10> with a lower blob and vertical text <En_Text_10>. A panel <panel_11> pairs a top-right circle with downward-curving text <En_Text_11>, and a panel <panel_12> anchors a wide bottom rectangle under top-aligned text <En_Text_12>. The bottom row completes the grid with a panel <panel_13> pointing a triangle rightward beside vertical text <En_Text_13>, a panel <panel_14> centering a large rectangle and overlaid text <En_Text_14>, a panel <panel_15> with a bottom half-circle and top-aligned text <En_Text_15>, and a final panel <panel_16> presenting a tiny grid of squares next to vertical text <En_Text_16>. In every panel, varied densities of black horizontal lines simulate body text, interacting dynamically with the shapes and typography to create a balanced structural design.
```

#### 布局提示词指南 · 文档代码块：An outdoor photograph under overcast winter light. A woman <person_1> si

<p class="ex-meta" id="ex-237">类型：fence · <a href="https://docs.bfl.ml/guides/prompting_layout">来源</a></p>

```text
An outdoor photograph under overcast winter light. A woman <person_1> sits in the left foreground, facing right, holding a small Pomeranian <animal_1> in her lap. Spectators <crowd_1> are softly blurred behind her.
```

## 视频 · 文生视频

### FLUX 3 总览

来源：[flux_3_flux3_overview](https://docs.bfl.ml/flux_3/flux3_overview)

#### FLUX 3 总览 · 官方 prompt：a fox running through dawn mist

<p class="ex-meta" id="ex-136">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_overview">来源</a></p>

```text
a fox running through dawn mist
```

#### FLUX 3 总览 · 官方 prompt：she takes his hand and pulls him laughing through the lantern-lit alley,

<p class="ex-meta" id="ex-137">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_overview">来源</a></p>

```text
she takes his hand and pulls him laughing through the lantern-lit alley, the camera chasing them, paper lanterns swaying overhead, their footsteps and laughter echoing off the walls
```

#### FLUX 3 总览 · 官方 prompt：from this frame the camera rises slowly above the alley as they rush awa

<p class="ex-meta" id="ex-138">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_overview">来源</a></p>

```text
from this frame the camera rises slowly above the alley as they rush away beneath the lanterns, their laughter fading into the night
```

#### FLUX 3 总览 · 官方 prompt：they sprint the length of the lantern-lit alley, lanterns blurring past,

<p class="ex-meta" id="ex-139">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_overview">来源</a></p>

```text
they sprint the length of the lantern-lit alley, lanterns blurring past, footsteps quick on the wet stones
```

#### FLUX 3 总览 · 官方 prompt：they burst out of the alley into a crowded night market, drums and stree

<p class="ex-meta" id="ex-140">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_overview">来源</a></p>

```text
they burst out of the alley into a crowded night market, drums and street chatter swelling, she pulls him into the lantern light
```

#### FLUX 3 总览 · 官方 prompt：Remove all the pedestrians and add a flock of pigeons around the fountai

<p class="ex-meta" id="ex-141">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_overview">来源</a></p>

```text
Remove all the pedestrians and add a flock of pigeons around the fountain.
```

#### FLUX 3 总览 · 结构拆解：flex-end100%nonenone-3px100%100%44pxcenter-2px-2px12px12px12px36pxcenter

<p class="ex-meta" id="ex-142">类型：anatomy · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_overview">来源</a></p>

```text
flex-end100%nonenone-3px100%100%44pxcenter-2px-2px12px12px12px36pxcenter
```

### FLUX 3 Video

来源：[flux_3_flux3_video](https://docs.bfl.ml/flux_3/flux3_video)

#### FLUX 3 Video · 官方 prompt：a fox running through dawn mist

<p class="ex-meta" id="ex-143">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
a fox running through dawn mist
```

#### FLUX 3 Video · 官方 prompt：an amateur recording of a night time walk through a forest, harsh white 

<p class="ex-meta" id="ex-144">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
an amateur recording of a night time walk through a forest, harsh white light from a headlamp, in the forest they find a very large unused gothic church, no windows, reclaimed by nature
```

#### FLUX 3 Video · 官方 prompt：A continuous helmet-mounted POV tails a woman on a dirt bike racing acro

<p class="ex-meta" id="ex-145">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
A continuous helmet-mounted POV tails a woman on a dirt bike racing across rolling desert dunes, her tracks the only marks on the wind-sculpted sand. The view dips and jolts over each crest as she kicks up golden arcs into the low, raking sun. The engine snarls and roars, the only sound in the sunlit void.
```

#### FLUX 3 Video · 官方 prompt：A split-screen view. It shows a living room. On the left side, the livin

<p class="ex-meta" id="ex-146">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
A split-screen view. It shows a living room. On the left side, the living room is filmed from above, looking down from the ceiling, and the right side shows a camera sitting on a shelf. A cat is sitting on another shelf, jumps across the room, and then lands on the camera. When it lands on the camera, the right side is obscured and shows a close-up of the cat. The left and right sides are completely synchronized.
```

#### FLUX 3 Video · 官方 prompt：Dashcam view of a moose crossing a snowy highway at dusk, wipers sweepin

<p class="ex-meta" id="ex-147">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
Dashcam view of a moose crossing a snowy highway at dusk, wipers sweeping, brake lights reflecting on ice, 10 seconds, 16:9
```

<p class="ex-meta">清单摘录（与文档对照用）：</p>

```text
Dashcam view of a moose crossing a snowy highway at dusk, wipers sweeping, brake lights reflecting on ice.
```

#### FLUX 3 Video · 官方 prompt：ONE continuous unbroken real-time shot, constant motion, no freezing. A 

<p class="ex-meta" id="ex-148">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
ONE continuous unbroken real-time shot, constant motion, no freezing. A DOLLY ZOOM, the classic vertigo effect, executed precisely: a man in a long dark coat stands with his back to us at the stone parapet of a rooftop garden, dead center frame, and he stays EXACTLY the same size in frame for the entire shot while the camera physically pulls backward and the lens zooms in: so the city skyline beyond him compresses, looms, and swells unnaturally toward us, towers flattening against each other, perspective warping around his motionless silhouette. And as the background compresses, the reveal: between the looming towers there are no streets: only open green ocean water, waves moving where avenues should be, ship wakes crossing between the buildings. He never moves. Ivy trembles on the parapet, his coat stirs in the wind. Muted twilight grade, sodium lights waking in the towers. Audio: a spiraling string figure that climbs and never resolves, wind at altitude, and beneath it: impossibly: the slow roll of surf echoing up between the buildings; no voices. No on-screen text.
```

#### FLUX 3 Video · 官方 prompt：1990s hand-drawn cel animation, original magical-transformation sequence

<p class="ex-meta" id="ex-149">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
1990s hand-drawn cel animation, original magical-transformation sequence resembling no existing show: sparkling painted backgrounds, ribbon light effects, bold ink lines, high-energy rotation: constant motion from the first frame. An ordinary EGG on a kitchen counter at dawn is chosen: it trembles, lifts off the counter into a swirling column of golden light, and undergoes a full dramatic magical-girl-style TRANSFORMATION SEQUENCE: spinning against a starry void, shell cracking in radiant petals, ribbons of yolk-light spiraling around it, flash-cuts of its silhouette evolving: into its final form: a magnificent gleaming FRIED EGG, sunny side up, wearing a tiny cape of crisped lace-edge, holding a heroic pose atop a slice of toast that rises beneath it like a pedestal, backlit by a radiant painted sunrise, butter-sparkles raining. The camera orbits the transformation in accelerating anime rotation, snap-zooms on the cracking shell, holds the final hero pose with wind machine drama as the cape's lacy edge flutters. The kitchen returns to normal around it; a fork and knife lie crossed before the toast pedestal like offered swords. No people anywhere. Audio: a full transformation jingle: harp glissandi, choir swell, synth fanfare: the shell's crystal cracks, the sizzle blooming exactly as the yolk-light condenses, the final TA-DAA chord, then quiet kitchen morning with one small heroic sizzle. No on-screen text, no logos, no subtitles, no credits.
```

#### FLUX 3 Video · 官方 prompt：Thermal infrared wildlife cinematography, false-color heat palette: a sa

<p class="ex-meta" id="ex-150">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
Thermal infrared wildlife cinematography, false-color heat palette: a savanna at absolute night rendered in blooming whites and deep blues: a pride of lions moving as white-hot ghosts through cold indigo grass, their breath curling as bright plumes, a heat-shimmer mirage where the day's warmth still rises off a rock, distant elephants as slow warm mountains, one lioness pausing to look toward the camera, her eyes flaring as the hottest points in frame. The palette shifts subtly as a cold wind passes through the grass. Audio: night insects, a distant lion contact call resonating, the wind, no music. No on-screen text.
```

#### FLUX 3 Video · 官方 prompt：A beekeeper lifts the lid off a hive in the last sunlight, and the risin

<p class="ex-meta" id="ex-151">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
A beekeeper lifts the lid off a hive in the last sunlight, and the rising bees become hundreds of golden sparks spiraling upward into the light. Phase 1 (0–3s): 85mm behind the hive into the low sun: the beekeeper's veiled silhouette rimmed in gold, the hum inside the box deepening as gloved hands grip the lid, smoke from the smoker drifting flat and luminous. Phase 2 (3–7s): The lid lifts: the hum blooms: and bees rise in a loose column, each one a burning point against the dark treeline, spiraling and weaving through the smoke like slow sparks from a fire. Phase 3 (7–10s): The beekeeper stands motionless in the glittering cloud, deadpan, holding the lid like a shield of light; the camera pushes in gently as the column bends toward the sun and the hum settles to a contented evening drone.
```

#### FLUX 3 Video · 官方 prompt：push forward through the trees

<p class="ex-meta" id="ex-152">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
push forward through the trees
```

#### FLUX 3 Video · 官方 prompt：SHOT ONE: wide aerial of a desert highway at dawn. HARD CUT. SHOT TWO: i

<p class="ex-meta" id="ex-153">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
SHOT ONE: wide aerial of a desert highway at dawn. HARD CUT. SHOT TWO: interior close-up of the driver. HARD CUT. SHOT THREE: the car shrinks into the heat haze. One music bed across all shots.
```

#### FLUX 3 Video · 官方 prompt：Overwrought 1990s telenovela scene, soft studio lighting, slightly warm 

<p class="ex-meta" id="ex-154">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
Overwrought 1990s telenovela scene, soft studio lighting, slightly warm video look: in a lavish hacienda living room, an elegant woman in red confronts a mustached man in a white suit: she gasps and turns to camera as ANOTHER identical mustached man in an identical white suit enters through the double doors, the camera CRASH-ZOOMS to her shocked face, then whip-pans between the two identical men, each raising one eyebrow in perfect sync, a dramatic organ sting on each zoom, her hand rising slowly to her mouth, a single tear. One of the twins narrows his eyes. Audio: melodramatic Spanish dialogue: her gasped accusation, the twins answering in unison: thunderous organ stings on every zoom, a swelling string section. No on-screen text.
```

#### FLUX 3 Video · 官方 prompt：A presenter speaks to the lens: "Storm season is here." Clean studio lig

<p class="ex-meta" id="ex-155">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
A presenter speaks to the lens: "Storm season is here." Clean studio lighting.
```

#### FLUX 3 Video · 官方 prompt：ONE continuous shot, constant motion, black studio void: two dancers mad

<p class="ex-meta" id="ex-156">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
ONE continuous shot, constant motion, black studio void: two dancers made ENTIRELY of wet paint: one cobalt blue, one cadmium orange: perform a violent, gorgeous duet: every spin flings arcing ribbons of themselves that hang in the air, every clash splashes both colors into short-lived green-brown blooms where they mix, limbs re-forming from the airborne paint as they pull it back into their bodies, a lift where the blue dancer pours upward through the orange one's arms and reconstitutes above. The floor accumulates their history as a growing action painting. High-speed clarity on every droplet. Audio: percussive modern dance score, wet impacts, the hiss of paint slicing air. No on-screen text.
```

#### FLUX 3 Video · 官方 prompt：Retro 1980s cel anime, hand-painted backgrounds, flat cel shading, visib

<p class="ex-meta" id="ex-157">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
Retro 1980s cel anime, hand-painted backgrounds, flat cel shading, visible film grain and slight gate weave, painted rain: a deserted night-market alley under paper lanterns in heavy rain, awnings dripping, neon reflections painted in the puddles. On a wooden counter a huge steaming bowl of ramen sits alone. The noodles begin to rise from the broth and coil upward into a long serpentine dragon made entirely of noodles, chopstick-thin whiskers, steam pouring off it as wings, egg halves for eyes; it coils once around the lantern above the stall, scattering painted raindrops, then dives back into the bowl with a splash of broth, the surface settling as if nothing happened. The camera whip-tilts up from the bowl to follow the rise, holds on the coil around the lantern, then whip-tilts down for the dive. Everything moves in cel-animation language: held frames, smears on the fast moves, painted splash shapes. This is rendered anime cel animation only, NOT live action, NOT photorealistic film. Audio: rain on canvas awnings, a low synth score sting as the dragon rises, a wet slurping whoosh on the dive, lantern creak. No people anywhere in the entire video, no human hands, no human voices. No on-screen text, no logos, no subtitles, no credits.
```

#### FLUX 3 Video · 官方 prompt：2D hand-drawn animation of a fox leaping through a paper-cut forest, bol

<p class="ex-meta" id="ex-158">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
2D hand-drawn animation of a fox leaping through a paper-cut forest, bold flat colors
```

#### FLUX 3 Video · 官方 prompt：Bold kinetic title card, the word "FLUX" assembling from light streaks o

<p class="ex-meta" id="ex-159">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
Bold kinetic title card, the word "FLUX" assembling from light streaks on a dark stage
```

#### FLUX 3 Video · 官方 prompt：a seed grows into a tree through the seasons

<p class="ex-meta" id="ex-160">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
a seed grows into a tree through the seasons
```

#### FLUX 3 Video · 官方 prompt：she takes his hand and pulls him laughing through the lantern-lit alley,

<p class="ex-meta" id="ex-161">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
she takes his hand and pulls him laughing through the lantern-lit alley, the camera chasing them, paper lanterns swaying overhead, their footsteps and laughter echoing off the walls
```

#### FLUX 3 Video · 官方 prompt：Remove all the pedestrians and add a flock of pigeons around the fountai

<p class="ex-meta" id="ex-162">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/flux_3/flux3_video">来源</a></p>

```text
Remove all the pedestrians and add a flock of pigeons around the fountain.
```

### 视频提示词概览

来源：[guides_prompting_video_overview](https://docs.bfl.ml/guides/prompting_video_overview)

#### 视频提示词概览 · 官方 prompt：an amateur recording of a night time walk through a forest, harsh white 

<p class="ex-meta" id="ex-355">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
an amateur recording of a night time walk through a forest, harsh white light from a headlamp, in the forest they find a very large unused gothic church, no windows, reclaimed by nature
```

#### 视频提示词概览 · 官方 prompt：A continuous helmet-mounted POV tails a woman on a dirt bike racing acro

<p class="ex-meta" id="ex-356">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A continuous helmet-mounted POV tails a woman on a dirt bike racing across rolling desert dunes, her tracks the only marks on the wind-sculpted sand. The view dips and jolts over each crest as she kicks up golden arcs into the low, raking sun. The engine snarls and roars, the only sound in the sunlit void.
```

#### 视频提示词概览 · 官方 prompt：A split-screen view. It shows a living room. On the left side, the livin

<p class="ex-meta" id="ex-357">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A split-screen view. It shows a living room. On the left side, the living room is filmed from above, looking down from the ceiling, and the right side shows a camera sitting on a shelf. A cat is sitting on another shelf, jumps across the room, and then lands on the camera. When it lands on the camera, the right side is obscured and shows a close-up of the cat. The left and right sides are completely synchronized.
```

#### 视频提示词概览 · 官方 prompt：Dashcam view of a moose crossing a snowy highway at dusk, wipers sweepin

<p class="ex-meta" id="ex-358">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
Dashcam view of a moose crossing a snowy highway at dusk, wipers sweeping, brake lights reflecting on ice, 10 seconds, 16:9
```

<p class="ex-meta">清单摘录（与文档对照用）：</p>

```text
Dashcam view of a moose crossing a snowy highway at dusk, wipers sweeping, brake lights reflecting on ice.
```

#### 视频提示词概览 · 官方 prompt：ONE continuous unbroken real-time shot, constant motion, no freezing. A 

<p class="ex-meta" id="ex-359">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
ONE continuous unbroken real-time shot, constant motion, no freezing. A DOLLY ZOOM, the classic vertigo effect, executed precisely: a man in a long dark coat stands with his back to us at the stone parapet of a rooftop garden, dead center frame, and he stays EXACTLY the same size in frame for the entire shot while the camera physically pulls backward and the lens zooms in — so the city skyline beyond him compresses, looms, and swells unnaturally toward us, towers flattening against each other, perspective warping around his motionless silhouette. And as the background compresses, the reveal: between the looming towers there are no streets — only open green ocean water, waves moving where avenues should be, ship wakes crossing between the buildings. He never moves. Ivy trembles on the parapet, his coat stirs in the wind. Muted twilight grade, sodium lights waking in the towers. Audio: a spiraling string figure that climbs and never resolves, wind at altitude, and beneath it — impossibly — the slow roll of surf echoing up between the buildings; no voices. No on-screen text.
```

#### 视频提示词概览 · 官方 prompt：1990s hand-drawn cel animation, original magical-transformation sequence

<p class="ex-meta" id="ex-360">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
1990s hand-drawn cel animation, original magical-transformation sequence resembling no existing show: sparkling painted backgrounds, ribbon light effects, bold ink lines, high-energy rotation — constant motion from the first frame. An ordinary EGG on a kitchen counter at dawn is chosen: it trembles, lifts off the counter into a swirling column of golden light, and undergoes a full dramatic magical-girl-style TRANSFORMATION SEQUENCE — spinning against a starry void, shell cracking in radiant petals, ribbons of yolk-light spiraling around it, flash-cuts of its silhouette evolving — into its final form: a magnificent gleaming FRIED EGG, sunny side up, wearing a tiny cape of crisped lace-edge, holding a heroic pose atop a slice of toast that rises beneath it like a pedestal, backlit by a radiant painted sunrise, butter-sparkles raining. The camera orbits the transformation in accelerating anime rotation, snap-zooms on the cracking shell, holds the final hero pose with wind machine drama as the cape's lacy edge flutters. The kitchen returns to normal around it; a fork and knife lie crossed before the toast pedestal like offered swords. No people anywhere. Audio: a full transformation jingle — harp glissandi, choir swell, synth fanfare — the shell's crystal cracks, the sizzle blooming exactly as the yolk-light condenses, the final TA-DAA chord, then quiet kitchen morning with one small heroic sizzle. No on-screen text, no logos, no subtitles, no credits.
```

#### 视频提示词概览 · 官方 prompt：Thermal infrared wildlife cinematography, false-color heat palette: a sa

<p class="ex-meta" id="ex-361">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
Thermal infrared wildlife cinematography, false-color heat palette: a savanna at absolute night rendered in blooming whites and deep blues — a pride of lions moving as white-hot ghosts through cold indigo grass, their breath curling as bright plumes, a heat-shimmer mirage where the day's warmth still rises off a rock, distant elephants as slow warm mountains, one lioness pausing to look toward the camera, her eyes flaring as the hottest points in frame. The palette shifts subtly as a cold wind passes through the grass. Audio: night insects, a distant lion contact call resonating, the wind, no music. No on-screen text.
```

#### 视频提示词概览 · 官方 prompt：A beekeeper lifts the lid off a hive in the last sunlight, and the risin

<p class="ex-meta" id="ex-362">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A beekeeper lifts the lid off a hive in the last sunlight, and the rising bees become hundreds of golden sparks spiraling upward into the light. Phase 1 (0–3s): 85mm behind the hive into the low sun: the beekeeper's veiled silhouette rimmed in gold, the hum inside the box deepening as gloved hands grip the lid, smoke from the smoker drifting flat and luminous. Phase 2 (3–7s): The lid lifts — the hum blooms — and bees rise in a loose column, each one a burning point against the dark treeline, spiraling and weaving through the smoke like slow sparks from a fire. Phase 3 (7–10s): The beekeeper stands motionless in the glittering cloud, deadpan, holding the lid like a shield of light; the camera pushes in gently as the column bends toward the sun and the hum settles to a contented evening drone.
```

#### 视频提示词概览 · 官方 prompt：A generous cream-colored fabric sofa falls from a bright sky and lands p

<p class="ex-meta" id="ex-363">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A generous cream-colored fabric sofa falls from a bright sky and lands perfectly in a minimalist living room. It descends in majestic slow motion through soft clouds, cushions rippling in the airstream and throw pillows trailing behind it like loyal satellites, then touches down on the wooden floor with a plush, weighty whumph — a dust ring blooming outward as the pillows land one-two-three into their exact corners and a folded blanket settles last over the armrest.
```

#### 视频提示词概览 · 官方 prompt：A highland meadow where a small herd of cumulus clouds has descended to 

<p class="ex-meta" id="ex-364">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A highland meadow where a small herd of cumulus clouds has descended to graze, drifting a meter above the grass, trailing thin wisps as they crop the turf bald in slow patches. Hold a static telephoto wildlife shot, heat-haze shimmer, absolutely matter-of-fact. Soft overcast light, muted greens. The only sound is wind, distant sheep bells, and a low woolly rumble whenever a cloud tears up grass.
```

#### 视频提示词概览 · 官方 prompt：An old tram crosses the frame through golden dust, and its lit windows p

<p class="ex-meta" id="ex-365">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
An old tram crosses the frame through golden dust, and its lit windows project a chain of light squares that slide along the housefronts, climbing steps and doorways as they travel. Phase 1 (0–3s): 85mm into the low sun down a cobbled street thick with backlit dust; rails glow like two golden wires, a tram bell dings once far off, evening swallows overhead. Phase 2 (3–7s): The tram rolls through frame as a dark silhouette rimmed in gold, and its window-light squares appear on the opposite facades — a procession of bright rectangles wandering across stucco, drainpipes, and a startled cat on a windowsill. Phase 3 (7–10s): The camera lets the tram leave and stays with the last light squares as they stretch, bend around a corner, and slip away; the rumble fades, dust keeps burning in the empty street.
```

#### 视频提示词概览 · 官方 prompt：In the Himalayan high country, a snow leopard that dissolves into snow m

<p class="ex-meta" id="ex-366">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
In the Himalayan high country, a snow leopard that dissolves into snow mid-leap and reassembles on landing. Phase 1: An 800mm shot across a wind-scoured couloir at first light; a snow leopard flows along a knife-edge ridge, breath steaming, tail heavy and low, stalking a blue sheep on the far crag. Phase 2: She launches across the void — and at the apex her body unravels into a spindrift of powder snow, rosettes scattering into individual snowflakes that hold her running shape as they cross the gap. Phase 3: The flurry lands and collapses inward, fur and muscle condensing from white powder back into cat, front paws hitting rock in full stride, one ember-green eye forming last; narrator whispers: "In these mountains... even the snow hunts."
```

#### 视频提示词概览 · 官方 prompt：The black horse bursts into a full gallop, mane and tail whipping in the

<p class="ex-meta" id="ex-367">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
The black horse bursts into a full gallop, mane and tail whipping in the wind, hooves kicking up huge plumes of dust as the sports car chases close behind with headlights flaring. The camera races alongside at ground level, shaking with speed. Thundering hoofbeats, roaring engine, rushing wind.
```

#### 视频提示词概览 · 文档代码块：A herd of African elephants walks steadily toward the camera across a dr

<p class="ex-meta" id="ex-368">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A herd of African elephants walks steadily toward the camera across a dry savanna beneath a huge hazy orange sunset, the animals growing larger in frame as the sun sinks lower behind them.
```

#### 视频提示词概览 · 文档代码块：An African penguin waddles across sun-warmed granite boulders behind swa

<p class="ex-meta" id="ex-369">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
An African penguin waddles across sun-warmed granite boulders behind swaying fynbos foliage, then hops down a rock shelf and pushes on between the boulders as the handheld camera follows.
```

#### 视频提示词概览 · 文档代码块：A low ground-level view of hiking boots and trekking poles stepping acro

<p class="ex-meta" id="ex-370">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A low ground-level view of hiking boots and trekking poles stepping across a rocky alpine ridge continues, a second hiker's boots following through the frame as the misty peak looms beyond.
```

#### 视频提示词概览 · 文档代码块：A thundering close view of massive waterfall curtains pounds on continuo

<p class="ex-meta" id="ex-371">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A thundering close view of massive waterfall curtains pounds on continuously, mist billowing from the plunge pool as a faint rainbow arc glimmers in and out of the drifting spray.
```

#### 视频提示词概览 · 文档代码块：A giraffe in dry scrubland, framed through soft out-of-focus branches, s

<p class="ex-meta" id="ex-372">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A giraffe in dry scrubland, framed through soft out-of-focus branches, surveys the plain and then begins an unhurried ambling walk across the frame behind the swaying foliage.
```

#### 视频提示词概览 · 文档代码块：A dark SUV drifting across a dusty construction flat in front of unfinis

<p class="ex-meta" id="ex-373">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
A dark SUV drifting across a dusty construction flat in front of unfinished high-rises swings through another wide slide toward the camera, dust boiling off its tires as it powers past.
```

#### 视频提示词概览 · 文档代码块：Remove all the pedestrians and add a flock of pigeons around the fountai

<p class="ex-meta" id="ex-374">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_overview">来源</a></p>

```text
Remove all the pedestrians and add a flock of pigeons around the fountain.
```

### 文生视频指南

来源：[guides_prompting_video_text_to_video](https://docs.bfl.ml/guides/prompting_video_text_to_video)

#### 文生视频指南 · 官方 prompt：A boxer trains alone in a dim gym. Rapid footwork on the canvas, gloves 

<p class="ex-meta" id="ex-375">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
A boxer trains alone in a dim gym. Rapid footwork on the canvas, gloves striking a worn punching bag, fluorescent lights buzzing overhead, handheld close follow shot, gritty documentary style.
```

#### 文生视频指南 · 文档代码块：A red fox leaping through fresh snow, telephoto.

<p class="ex-meta" id="ex-376">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
A red fox leaping through fresh snow, telephoto.
```

#### 文生视频指南 · 文档代码块：A cozy ramen shop on a rainy Tokyo night: steam rising from the broth, n

<p class="ex-meta" id="ex-377">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
A cozy ramen shop on a rainy Tokyo night: steam rising from the broth, neon reflections in the window puddles, the cook working calmly. The camera drifts slowly past the counter. Rain patter and quiet kitchen sounds.
```

#### 文生视频指南 · 文档代码块：SHOT ONE: wide aerial of a desert highway at dawn, a single red car spee

<p class="ex-meta" id="ex-378">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
SHOT ONE: wide aerial of a desert highway at dawn, a single red car speeding through. HARD CUT. SHOT TWO: interior close-up, the driver's hands drumming the wheel. HARD CUT. SHOT THREE: from the roadside, the car shrinks into the heat haze. One music bed across all three shots.
```

#### 文生视频指南 · 文档代码块：A weather presenter on camera in front of a stylized storm map, speaking

<p class="ex-meta" id="ex-379">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
A weather presenter on camera in front of a stylized storm map, speaking to the lens: "Storm season is here — and this time, we're ready." Confident delivery, clean studio lighting. No on-screen text, no subtitles.
```

#### 文生视频指南 · 文档代码块：A red fox stalks across a wide snowfield at dawn, low winter light, a da

<p class="ex-meta" id="ex-380">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
A red fox stalks across a wide snowfield at dawn, low winter light, a dark treeline fading into mist behind it. It slows, crouches, then leaps high and pounces into the fresh snow. Telephoto lens, shallow depth of field, locked-off camera panning gently to follow. Muffled paw steps and a soft breeze.
```

#### 文生视频指南 · 文档代码块：Core summary: A first-person and third-person mixed cinematic sequence f

<p class="ex-meta" id="ex-381">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
Core summary: A first-person and third-person mixed cinematic sequence follows a lone man traversing a scorching desert, from a wide dune crossing through a sandstorm, discovering an oasis, and collapsing in exhaustion before crawling toward the water. \n  \n Scene: \n   Shot 1: A vast desert landscape with rolling golden sand dunes stretching to the horizon. Harsh, bright midday sun casting sharp shadows and a heat-shimmer haze. Deep depth of field. \n   Shot 2: The same desert, now engulfed in a violent sandstorm with swirling orange-brown dust obscuring visibility. Muted, diffused lighting, grainy particles filling the air. Shallow depth of field. \n   Shot 3: A small oasis, a cluster of palm trees and a shallow turquoise pool surrounded by sand. Warm, golden-hour sunlight, soft and inviting. Deep depth of field. \n   Shot 4: A close, low-angle view of the sand near the oasis's edge, water gently rippling nearby. Warm, low light with soft reflections on the water. Shallow depth of field. \n  \n Subject description: A rugged traveler in a tattered, sand-colored linen tunic, a loose scarf wrapped around head and neck, leather sandals, and a worn canvas satchel. Sunburned, weathered skin; lips cracked from dehydration. \n  \n Dynamic narrative: \n   Shot 1 [0.0s-2.5s]: A wide, tracking shot follows the man trudging up a massive dune, his silhouette stark against the bright sky. Footsteps sink deep into the sand, kicking up small clouds with each labored step. \n   Shot 2 [2.5s-5.0s]: Hard cut to first-person as the sandstorm hits. He shields his eyes with his forearm, stumbling forward blindly as gusts of sand whip across the frame, nearly knocking him off balance. \n   Shot 3 [5.0s-7.5s]: The storm clears abruptly, revealing the oasis. A wide shot shows him breaking into a weak run toward the palm trees, his pace increasing with desperate energy. \n   Shot 4 [7.5s-10.0s]: He collapses at the water's edge, then drags himself forward on hands and knees. The camera pushes in close as his trembling hand touches the water, sending ripples outward. \n  \n Audio: \n   Shot 1: Low, dry desert wind, faint crunching footsteps on sand, sparse ambient silence emphasizing isolation. \n   Shot 2: Roaring, chaotic wind howl mixed with gritty sand-whipping sounds and the man's muffled, strained breathing. \n   Shot 3: Wind fades into a gentle breeze rustling palm fronds, faint birdsong, and the man's heavy, relieved panting. \n   Shot 4: Soft splashing water, the man's shaky exhale, a warm ambient hum fading into a peaceful silence. \n  \n Style and color: Realistic, high-fidelity cinematic sequence. Warm, sun-bleached palette of ochre, amber, and sandy beige, shifting to cool teal-blue during the oasis reveal. High dynamic range holds both blown-out sun highlights and deep shadow detail; fine grain adds gritty, tactile realism to the sand and dust.
```

#### 文生视频指南 · 文档代码块：[camera] shot of [subject] [action] in [environment]. [supporting visual

<p class="ex-meta" id="ex-382">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
[camera] shot of [subject] [action] in [environment]. [supporting visual and motion details]
```

#### 文生视频指南 · 文档代码块：Camera shot: wide shot, low angle \n Subject + action: a lone rider cros

<p class="ex-meta" id="ex-383">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
Camera shot: wide shot, low angle \n Subject + action: a lone rider crosses a shallow desert river \n Depth of field: shallow (sharp on subject, blurred background) \n Lighting + palette: warm backlight with soft rim — amber, cream, walnut \n Motion: water splashes around the horse's legs, orange dust hangs in the light \n Style: epic western realism
```

#### 文生视频指南 · 文档代码块：0.0–1.5s — locked wide of a still harbor at dawn, boats motionless on gl

<p class="ex-meta" id="ex-384">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
0.0–1.5s — locked wide of a still harbor at dawn, boats motionless on glassy water \n 1.5–3.0s — a slow push-in begins as gulls lift off the water \n 3.0–5.0s — the sun breaks the horizon, warm light spreads and the camera settles
```

#### 文生视频指南 · 文档代码块：a video of an eagle

<p class="ex-meta" id="ex-385">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
a video of an eagle
```

#### 文生视频指南 · 文档代码块：a closeup video of an eagle, the eagle sits on a tree in a forest

<p class="ex-meta" id="ex-386">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
a closeup video of an eagle, the eagle sits on a tree in a forest
```

#### 文生视频指南 · 文档代码块：a closeup video of an eagle, the eagle sits on a tree in a forest

<p class="ex-meta" id="ex-387">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
a closeup video of an eagle, the eagle sits on a tree in a forest
```

#### 文生视频指南 · 文档代码块：a cinematic closeup of an eagle perched on a pine branch in a misty fore

<p class="ex-meta" id="ex-388">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
a cinematic closeup of an eagle perched on a pine branch in a misty forest, feathers ruffling in the wind, slow push-in, golden-hour light
```

#### 文生视频指南 · 结构拆解：A low tracking shot of a fox sprinting through wet pine undergrowth at d

<p class="ex-meta" id="ex-389">类型：anatomy · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
A low tracking shot of a fox sprinting through wet pine undergrowth at dawn. Mist drifts between the trees as the camera keeps pace beside it. Cool blue morning light, fast but controlled motion, cinematic naturalism.
```

#### 文生视频指南 · 结构拆解：POV shot of a boxer weaving through a dim training gym. Gloved hands ris

<p class="ex-meta" id="ex-390">类型：anatomy · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_text_to_video">来源</a></p>

```text
POV shot of a boxer weaving through a dim training gym. Gloved hands rise into frame as the camera advances toward a heavy bag. Fluorescent lights buzz overhead, sharp footwork, quick bursts of impact, gritty documentary realism.
```

## 视频 · 图生视频

### 图生视频指南

来源：[guides_prompting_video_image_to_video](https://docs.bfl.ml/guides/prompting_video_image_to_video)

#### 图生视频指南 · 文档代码块：A wide waterfront city skyline transitions from bright midday to glitter

<p class="ex-meta" id="ex-350">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_image_to_video">来源</a></p>

```text
A wide waterfront city skyline transitions from bright midday to glittering night: daylight fades through dusk to dark, thousands of lights switching on across the towers and shimmering on the water.
```

#### 图生视频指南 · 文档代码块：Vivid clouds of colored ink billow and swirl through dark water: electri

<p class="ex-meta" id="ex-351">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_image_to_video">来源</a></p>

```text
Vivid clouds of colored ink billow and swirl through dark water: electric blue and crimson tendrils bloom, fold and diffuse, slowly transforming into deep magenta and violet plumes.
```

#### 图生视频指南 · 文档代码块：A wide long-exposure night sky over snowy northern mountains: the aurora

<p class="ex-meta" id="ex-352">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_image_to_video">来源</a></p>

```text
A wide long-exposure night sky over snowy northern mountains: the aurora borealis sweeps and ripples, shifting from soft magenta and violet into teal and finally vivid green above the frozen horizon.
```

#### 图生视频指南 · 文档代码块：The open sea builds through a rising storm: from grey choppy swells to a

<p class="ex-meta" id="ex-353">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_image_to_video">来源</a></p>

```text
The open sea builds through a rising storm: from grey choppy swells to a towering cresting wave under dramatic clouds and finally wild wind-whipped whitecaps and cold spray.
```

#### 图生视频指南 · 文档代码块：A city skyline over water cycles through a full day: bright blue midday,

<p class="ex-meta" id="ex-354">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_image_to_video">来源</a></p>

```text
A city skyline over water cycles through a full day: bright blue midday, then a golden-to-teal dusk with a rising moon, and finally a glittering night of city lights reflected on the water.
```

## 视频 · 编辑

### 视频编辑指南

来源：[guides_prompting_video_editing](https://docs.bfl.ml/guides/prompting_video_editing)

#### 视频编辑指南 · 官方 prompt：Remove the orange bucket.

<p class="ex-meta" id="ex-341">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Remove the orange bucket.
```

#### 视频编辑指南 · 官方 prompt：Add a seagull standing on the corner of the crate.

<p class="ex-meta" id="ex-342">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Add a seagull standing on the corner of the crate.
```

#### 视频编辑指南 · 官方 prompt：Make him say "Fresh mackerel, four for ten."

<p class="ex-meta" id="ex-343">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Make him say "Fresh mackerel, four for ten."
```

#### 视频编辑指南 · 官方 prompt：Add a lighthouse.

<p class="ex-meta" id="ex-344">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Add a lighthouse.
```

#### 视频编辑指南 · 官方 prompt：Add a tall white lighthouse with a red lantern room standing on the end 

<p class="ex-meta" id="ex-345">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Add a tall white lighthouse with a red lantern room standing on the end of the harbor wall to the right of the boats.
```

#### 视频编辑指南 · 官方 prompt：Render this previz chase as a desert convoy pursuit at golden hour: the 

<p class="ex-meta" id="ex-346">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Render this previz chase as a desert convoy pursuit at golden hour: the pillars become ruined highway columns in open dust, the lead car an armored pickup, the chaser a spiked buggy, both trailing dust plumes, heat shimmer. Same weave lines, same speeds, same camera overtake. V8 roar and wind.
```

#### 视频编辑指南 · 官方 prompt：Change the desert chase to deep night. Turn on the headlights and add a 

<p class="ex-meta" id="ex-347">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Change the desert chase to deep night. Turn on the headlights and add a huge low moon above the canyon.
```

#### 视频编辑指南 · 官方 prompt：Replace the cliff with the reflective windows of a high-rise building. A

<p class="ex-meta" id="ex-348">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Replace the cliff with the reflective windows of a high-rise building. Add narrow metal window ledges at the climber’s hand and foot contact points. Far below, traffic and illuminated buildings fill a dense city in blue-hour light.
```

#### 视频编辑指南 · 官方 prompt：Restyle this clip as live-action footage of a claw machine lifting a lav

<p class="ex-meta" id="ex-349">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_editing">来源</a></p>

```text
Restyle this clip as live-action footage of a claw machine lifting a lavender octopus plush. Fine velour fibers and sewn seams replace the ink outlines. The plush compresses gently where the metal claw grips it. Soft arcade lights reflect in the glass.
```

## 对白 / 音频

### 视频音频与对白

来源：[guides_prompting_video_audio](https://docs.bfl.ml/guides/prompting_video_audio)

#### 视频音频与对白 · 官方 prompt：A British man in his thirties with a warm low-mid voice, recorded close 

<p class="ex-meta" id="ex-329">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
A British man in his thirties with a warm low-mid voice, recorded close and dry. He sounds conversational and lightly amused, like he is letting a friend in on something. Imperfect human timing, one relaxed breath, no announcer delivery.
```

#### 视频音频与对白 · 官方 prompt：One continuous unbroken real-time ten-second cinematic shot inside a sma

<p class="ex-meta" id="ex-330">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
One continuous unbroken real-time ten-second cinematic shot inside a small dim basement jazz club, late set. A live trio — upright bass, brushed drums, and piano — plays a slow, smoky number continuously from the first frame to the last, never stopping. Slow dolly along the bar toward a bartender in a rolled-sleeve white shirt polishing a glass. Over the music, he leans toward a regular seated at the bar and says in a low, warm voice: "Last call was an hour ago. For you, the night is still young." The music keeps playing under and after his words. Audio: the jazz trio constant throughout, murmur of a few late patrons, the soft clink of the glass as he sets it down, and a faint espresso-machine hiss from the back. No on-screen text, no subtitles.
```

#### 视频音频与对白 · 官方 prompt：Medium close-up of a tired station attendant behind the glass. She looks

<p class="ex-meta" id="ex-331">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
Medium close-up of a tired station attendant behind the glass. She looks toward the stranded passenger and says, "The 6:10 is delayed again. They say ten minutes." Low, matter-of-fact delivery. Fluorescent room tone and rain against the platform roof. No on-screen text or subtitles.
```

#### 视频音频与对白 · 官方 prompt：Locked shot of a studio microphone in a small treated booth. An off-scre

<p class="ex-meta" id="ex-332">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
Locked shot of a studio microphone in a small treated booth. An off-screen voiceover says exactly once, "Most good tools have one thing in common. You stop noticing them." Close, dry recording. Rain against the window. No music, no second voice, no on-screen text or subtitles.
```

#### 视频音频与对白 · 弱示例：A confident and engaging presenter says, "Today, we are excited to embar

<p class="ex-meta" id="ex-333">类型：weak · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
A confident and engaging presenter says, "Today, we are excited to embark on a transformative journey that will redefine what is possible."
```

#### 视频音频与对白 · 强示例：A presenter checks the monitor, looks back to camera, and says, "That wa

<p class="ex-meta" id="ex-334">类型：strong · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
A presenter checks the monitor, looks back to camera, and says, "That was the hard part. Now we can see if it actually works." Dry, conversational delivery.
```

#### 视频音频与对白 · 官方 prompt：Medium close-up of an older man at a diner counter at night. He turns a 

<p class="ex-meta" id="ex-335">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
Medium close-up of an older man at a diner counter at night. He turns a chipped mug in both hands, then looks up and says, "Coffee's been cold for twenty minutes. I keep pretending that's why I'm still here." The camera drifts forward by a few inches. Rain ticks against the window. Distant traffic sits under the room tone. The mug clicks against the saucer when he sets it down. No music, no on-screen text, no subtitles.
```

#### 视频音频与对白 · 官方 prompt：One continuous unbroken real-time ten-second cinematic shot inside a ret

<p class="ex-meta" id="ex-336">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
One continuous unbroken real-time ten-second cinematic shot inside a retro-futurist glass observation train gliding beneath a vivid violet aurora above snow-covered mountains. Medium shot of one conductor standing alone at a brass intercom, clearly visible from the waist up as moving aurora light crosses the curved windows behind her. She looks toward the passengers beside camera and makes one calm announcement in two languages, in this exact order, using the same warm, lightly amused voice. First in English: "Next stop: the northern lights." Then, after a short natural pause, in German, spoken slowly and clearly at a relaxed, unhurried pace with a gentle rest between words: "Bitte halten Sie Ihre Träume fest." She takes her time with the German line and says each line only once with natural pronunciation. No other speech. Audio: steady rail rhythm, soft wind against the glass, one departure bell, and a restrained analog-synth shimmer kept below the voice. No on-screen text, no subtitles.
```

#### 视频音频与对白 · 官方 prompt：One continuous unbroken real-time ten-second cinematic shot inside an or

<p class="ex-meta" id="ex-337">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
One continuous unbroken real-time ten-second cinematic shot inside an orbital greenhouse during a meteor shower. Medium two-shot: an astronaut in an orange work suit steadies a glowing irrigation valve on the left while an astronaut in a blue work suit reaches for the petal-shaped roof controls on the right. The orange-suited astronaut speaks first in Spanish, practical and excited: "Las raíces están listas." After she finishes, the blue-suited astronaut replies in French, smiling with quiet wonder: "Alors, ouvrons le ciel." Keep the speakers distinct, the turns short and separate, with no overlap and no other speech. As the French line ends, the glass roof petals open and meteor light sweeps across rows of floating plants. Audio: soft ventilation, water moving through transparent pipes, roof servos, faint radio texture, and distant muted meteor impacts; no music. No on-screen text, no subtitles.
```

#### 视频音频与对白 · 官方 prompt：One continuous unbroken real-time ten-second cinematic close shot of a c

<p class="ex-meta" id="ex-338">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
One continuous unbroken real-time ten-second cinematic close shot of a chai vendor at his roadside tea stall on a rainy evening, framed chest-up under the warm tungsten bulb of the stall awning, his face large and clearly visible. Rain falls steadily beyond the awning. He pours steaming chai in a high arc between a steel pot and a glass, sets the glass down toward the camera, smiles, and says once in Hindi: "बारिश फिर शुरू हो गई। आइए, गरम चाय पीजिए।" Natural, warm Hindi delivery like an invitation to a regular customer; no announcer voice, no other speech. Audio: steady rain on the tarpaulin awning, the long pour of hot chai, the clink of the glass on the wooden counter, a distant auto-rickshaw passing; no music. No on-screen text, no subtitles.
```

#### 视频音频与对白 · 文档代码块：[Shot and action]. \n Dialogue or voiceover: [speaker and exact words]. 

<p class="ex-meta" id="ex-339">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
[Shot and action]. \n Dialogue or voiceover: [speaker and exact words]. \n Ambience: [place]. \n Effects: [visible actions]. \n Music: [style and role].
```

#### 视频音频与对白 · 文档代码块：The voiceover speaks once and aims to finish by 8 seconds. For the final

<p class="ex-meta" id="ex-340">类型：fence · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/guides/prompting_video_audio">来源</a></p>

```text
The voiceover speaks once and aims to finish by 8 seconds. For the final two seconds, only rain against the window.
```

## Cookbook

### Cookbook · 重演 / 续写

来源：[cookbook_video_edit_recast_continue](https://docs.bfl.ml/cookbook/video_edit_recast_continue)

#### Cookbook · 重演 / 续写 · 官方 caption：The source and its continuation cut together: one shot becomes two beats

<p class="ex-meta" id="ex-007">类型：caption · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_edit_recast_continue">来源</a></p>

```text
The source and its continuation cut together: one shot becomes two beats.
```

#### Cookbook · 重演 / 续写 · notebook / Python prompt：Medium shot of a small brass wind-up tin robot marching in a straight li

<p class="ex-meta" id="ex-008">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_edit_recast_continue">来源</a></p>

```text
Medium shot of a small brass wind-up tin robot marching in a straight line across a cluttered watchmaker's workbench at night, between loose gears and a magnifying lamp, its red wind-up key slowly turning in its back, its single amber eye lit. It moves like a wound-up machine, not a person: stiff even steps, a faint mechanical tremor on each footfall. The camera tracks smoothly alongside it, level with the bench. Audio: a steady clockwork ticking locked to its steps, the low hum of the lamp, a distant clock. One continuous unbroken shot, the marching never stops. No on-screen text.
```

#### Cookbook · 重演 / 续写 · notebook / Python prompt：The same brass wind-up tin robot from the source video, same red wind-up

<p class="ex-meta" id="ex-009">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_edit_recast_continue">来源</a></p>

```text
The same brass wind-up tin robot from the source video, same red wind-up key turning in its back, same single amber eye, marches in the same straight line across the same watchmaker's bench, same tracking camera alongside it. The whole scene is now a scratched 1928 silent film print: soft black-and-white, heavy grain, flickering exposure, gate weave, dust and hairline scratches, a slightly sped-up hand-cranked judder. The sound is recast to the medium: the clockwork ticking is gone, replaced by a lively solo upright-piano march that hits in time with the robot's steps, under the soft clatter of a film projector running in a quiet room. No on-screen text, no intertitle cards.
```

#### Cookbook · 重演 / 续写 · notebook / Python prompt：The same brass wind-up tin robot from the source video, same red wind-up

<p class="ex-meta" id="ex-010">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_edit_recast_continue">来源</a></p>

```text
The same brass wind-up tin robot from the source video, same red wind-up key turning in its back, same single amber eye and riveted brass seams, now marches across a giant marble chessboard floor in a vast empty hall, between chess pieces taller than it is, heading toward a toppled white king lying in its path. Cold shafts of light fall from high windows. It moves like a wound-up machine, stiff even steps, the key turning. Low tracking shot close to the floor, following just behind it. Audio: its clockwork ticking, faint footstep taps echoing in the huge stone room, a distant draught. One continuous unbroken shot. No on-screen text.
```

#### Cookbook · 重演 / 续写 · notebook / Python prompt：Continue this video from its final frames: the brass wind-up robot reach

<p class="ex-meta" id="ex-011">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_edit_recast_continue">来源</a></p>

```text
Continue this video from its final frames: the brass wind-up robot reaches the very edge of the workbench, its front foot steps out over nothing, and it keeps marching forward on the empty air, descending an invisible staircase step by step down toward the floor, red key still turning, amber eye level and unbothered. It moves like a machine, the same stiff even steps, now stepping down through open space. The camera cranes down smoothly to follow it. Audio: the clockwork ticking continues unbroken, each mid-air step landing on a soft wooden tap as if a stair were there, the lamp hum falling away below. One continuous shot. No on-screen text.
```

### Cookbook · 多镜头

来源：[cookbook_video_multishot_films](https://docs.bfl.ml/cookbook/video_multishot_films)

#### Cookbook · 多镜头 · notebook / Python prompt：SHOT ONE: extreme macro of a single wooden match dragging across a strik

<p class="ex-meta" id="ex-012">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_multishot_films">来源</a></p>

```text
SHOT ONE: extreme macro of a single wooden match dragging across a strike strip and bursting into flame, sulfur sparks flying, the wood blackening. HARD CUT. SHOT TWO: wide shot on a dark beach at night, that flame is now a tall bonfire, sparks climbing into the black, driftwood collapsing in the heat. HARD CUT. SHOT THREE: high aerial at night, the bonfire is one orange point among a long chain of bonfires burning down an entire dark coastline, waves faint below. One continuous low cello drone swells across all three shots without a break, and the sound of fire scales with the picture: a tiny crackle in shot one, a full roar in shot two, a vast distant wash of many fires in shot three. No on-screen text.
```

#### Cookbook · 多镜头 · notebook / Python prompt：Wide establishing shot down the dark central aisle of the glasshouse, mi

<p class="ex-meta" id="ex-013">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_multishot_films">来源</a></p>

```text
Wide establishing shot down the dark central aisle of the glasshouse, mist hanging between the benches, one slow drip falling. A single pale orchid on the nearest bench slowly turns its face to follow a shaft of moonlight. Audio: {MOTIF} enters quietly, under dripping water, creaking glass, and a faint night wind outside.
```

#### Cookbook · 多镜头 · notebook / Python prompt：Macro shot on a sensitive mimosa plant. A dandelion seed drifts down and

<p class="ex-meta" id="ex-014">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_multishot_films">来源</a></p>

```text
Macro shot on a sensitive mimosa plant. A dandelion seed drifts down and lands on one leaf, and the leaflets fold closed one after another along the stem, a slow chain reaction in the lamplight. Audio: {MOTIF} continues, warmer and a little fuller, over a soft ripple of tiny leaf-folds and the hum of a service lamp.
```

#### Cookbook · 多镜头 · notebook / Python prompt：Medium tracking shot along a row of tall potted sunflowers. As a securit

<p class="ex-meta" id="ex-015">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_multishot_films">来源</a></p>

```text
Medium tracking shot along a row of tall potted sunflowers. As a security lamp's beam sweeps past outside the glass, every sunflower head rotates in unison to follow it, then holds. Audio: {MOTIF} builds, another voice joining it, over the creak of many stems turning together and the low buzz of the lamp.
```

#### Cookbook · 多镜头 · notebook / Python prompt：Slow overhead shot looking down through the misted roof glass at the who

<p class="ex-meta" id="ex-016">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_multishot_films">来源</a></p>

```text
Slow overhead shot looking down through the misted roof glass at the whole glasshouse. One by one the plants settle still as the first grey daylight seeps into the panes. Audio: {MOTIF} resolves and fades to a single held note under the returning dawn birdsong through the glass.
```

#### Cookbook · 多镜头 · notebook / Python prompt：A carved wooden cuckoo bird snaps out of the little door of an antique c

<p class="ex-meta" id="ex-017">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_multishot_films">来源</a></p>

```text
A carved wooden cuckoo bird snaps out of the little door of an antique cuckoo clock on a workshop wall, sawdust in the air, dozens of other clocks ticking around it. It speaks on camera exactly once, its carved beak articulating each word, the complete sentence with no repetition and no other words in the entire shot: {spoken} {lock} The camera pushes in slowly on the little door. Audio: its spoken line, the massed ticking of the workshop clocks, one chain rattle as it retracts. No on-screen text, no subtitles.
```

### Cookbook · 视频入门

来源：[cookbook_video_quickstart](https://docs.bfl.ml/cookbook/video_quickstart)

#### Cookbook · 视频入门 · 官方 prompt：An old typewriter types by itself in an empty office, spooky atmosphere.

<p class="ex-meta" id="ex-018">类型：prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_quickstart">来源</a></p>

```text
An old typewriter types by itself in an empty office, spooky atmosphere.
```

#### Cookbook · 视频入门 · notebook / Python prompt：A single large Venus flytrap stands in a terracotta pot on a workbench i

<p class="ex-meta" id="ex-019">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_quickstart">来源</a></p>

```text
A single large Venus flytrap stands in a terracotta pot on a workbench in a humid Victorian greenhouse, condensation on the glass behind it, one fat trap raised toward the camera. The trap-lobes part like a mouth and it says, in a slow, honeyed whisper: "Come closer. I have been so terribly patient." The two lobes and their bristles open and close precisely on each word, a bead of nectar trembling on the rim. Slow dolly in to a tight close-up on the moving trap. Audio: dripping condensation, the wet click of the lobes on each syllable, a lone fly buzzing, distant greenhouse fans. No on-screen text, no subtitles.
```

#### Cookbook · 视频入门 · notebook / Python prompt：Wide underwater shot of a black lacquered grand piano sinking slowly thr

<p class="ex-meta" id="ex-020">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_quickstart">来源</a></p>

```text
Wide underwater shot of a black lacquered grand piano sinking slowly through the deep end of an empty swimming pool, tiled walls receding into blue, a column of silver bubbles streaming from between the keys. It settles upright on the pool floor, silt lifting around its legs; the keys depress one after another in a slow, warped chord as the water swallows the sound. Camera drifts down alongside the falling piano in one continuous move, then holds as it lands. Audio: the muffled, detuned notes bending underwater, the low groan of the frame under pressure, a steady hiss of escaping bubbles, no surface sound. No on-screen text.
```

#### Cookbook · 视频入门 · notebook / Python prompt：Close-up of an old black typewriter on a desk in a dark, empty office at

<p class="ex-meta" id="ex-021">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_quickstart">来源</a></p>

```text
Close-up of an old black typewriter on a desk in a dark, empty office at night, lit only by a green banker's lamp. Three keys strike by themselves, one after another, slow and deliberate. A pause. Then the carriage returns on its own with a sharp bell ding, and every key fires at once in a frantic burst. The camera pushes in slowly the whole time. Audio: each key strike as a dry mechanical clack, the single bright bell, then the clattering burst, under a low room hum and a faint fluorescent buzz. No on-screen text.
```

#### Cookbook · 视频入门 · notebook / Python prompt：Wide shot of fog rolling through a pine forest at dawn, pale light betwe

<p class="ex-meta" id="ex-022">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_quickstart">来源</a></p>

```text
Wide shot of fog rolling through a pine forest at dawn, pale light between the trunks. "Nothing here is asleep. It is all just waiting."
```

#### Cookbook · 视频入门 · notebook / Python prompt：Wide shot of fog rolling through a pine forest at dawn, pale light betwe

<p class="ex-meta" id="ex-023">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_quickstart">来源</a></p>

```text
Wide shot of fog rolling through a pine forest at dawn, pale light between the trunks, one crow lifting off a branch. A low, calm voiceover says exactly once: "Nothing here is asleep. It is all just waiting." These are the only words. Audio: the voiceover, wind through needles, the crow's wingbeats, a distant creak of wood. No on-screen text, no subtitles, no captions.
```

### Cookbook · 从静帧开始

来源：[cookbook_video_start_from_images](https://docs.bfl.ml/cookbook/video_start_from_images)

#### Cookbook · 从静帧开始 · notebook / Python prompt：A formal dining room photographed head-on: a long dark-wood table set fo

<p class="ex-meta" id="ex-024">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
A formal dining room photographed head-on: a long dark-wood table set for a dinner party, white cloth, tall lit candles in brass holders, crystal glasses half full of red wine, porcelain plates, folded napkins, a low floral centerpiece, warm chandelier light, deep shadows, photographic, shallow depth of field.outputs/02_input_table.jpg
```

#### Cookbook · 从静帧开始 · notebook / Python prompt：An ice sculpture of a swan with folded wings, carved from clear blue-tin

<p class="ex-meta" id="ex-025">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
An ice sculpture of a swan with folded wings, carved from clear blue-tinted ice, standing on a round black stone pedestal in a dark empty banquet hall, warm candlelight raking it from the left, photographic, shallow depth of field.outputs/02_input_swan_a.jpg
```

#### Cookbook · 从静帧开始 · notebook / Python prompt：Keep the same round black stone pedestal, the same dark banquet hall, th

<p class="ex-meta" id="ex-026">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
Keep the same round black stone pedestal, the same dark banquet hall, the same warm candlelight from the left and the same framing. The swan has fully melted: a wide pool of water spreads across the pedestal, and one last beak-shaped shard of clear ice stands upright in the middle of the pool.outputs/02_input_swan_b.jpg
```

#### Cookbook · 从静帧开始 · notebook / Python prompt：Character reference sheet: one stop-motion claymation badger naturalist 

<p class="ex-meta" id="ex-027">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
Character reference sheet: one stop-motion claymation badger naturalist shown twice on a single plain warm-grey studio background, full-body front view on the left and full-body side profile on the right, identical design in both views. Hand-sculpted modeling-clay texture with visible fingerprints and tool marks, black-and-white striped face, small round brass spectacles, a mustard tweed waistcoat with a pocket watch chain, stubby clay paws, soft even studio light, macro, photographic.outputs/02_input_badger_sheet.jpg
```

#### Cookbook · 从静帧开始 · notebook / Python prompt：The video begins exactly on the provided image, the fully set dinner tab

<p class="ex-meta" id="ex-028">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
The video begins exactly on the provided image, the fully set dinner table holding still for a beat. Then the entire room begins to rotate slowly clockwise, ninety degrees over the length of the clip, so the right-hand wall becomes the new floor. Everything on the table obeys the turning gravity at once: the candle flames swing to stay upright, the wine arcs sideways out of the glasses, plates and cutlery slide and then tumble and shatter against the wall, the cloth drags after them, a chair topples last. The camera is locked rigidly to the room so the world itself appears to tip. Audio: the long creak of the room turning, wine splashing, the staggered smash of porcelain landing on the wall, one chair thudding over. No on-screen text.
```

#### Cookbook · 从静帧开始 · notebook / Python prompt：The video begins exactly on the first provided image and ends exactly on

<p class="ex-meta" id="ex-029">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
The video begins exactly on the first provided image and ends exactly on the second: a locked-off time-lapse of the ice swan melting. The wings slump first, then the neck bows and thins, the body sags into itself, meltwater spreading across the black pedestal, until only one beak-shaped shard stands upright in the pool. The candlelight and the hall never change. Audio: soft dripping, slow at first then quickening, a low creak of settling ice, quiet hall room tone, never silent. No on-screen text.
```

#### Cookbook · 从静帧开始 · notebook / Python prompt：The stop-motion claymation badger from the reference images, same stripe

<p class="ex-meta" id="ex-030">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
The stop-motion claymation badger from the reference images, same striped face, same brass spectacles, same mustard tweed waistcoat and clay fingerprints, stands in a wind-bent meadow at dusk holding a tiny clay clipboard. He looks into the lens and says, clipped and severe: "The specimen you are looking for is behind you." His clay mouth reshapes on every syllable, the modeling marks catching the light as it moves. Handheld camera eases in to a chest-up framing. Audio: wind through dry grass, the creak of stiff clay as he turns, a single distant crow. No on-screen text, no subtitles.
```

#### Cookbook · 从静帧开始 · notebook / Python prompt：The same stop-motion claymation badger from the reference images, identi

<p class="ex-meta" id="ex-031">类型：py-prompt · 模型：<span class="badge">FLUX 3</span> · <a href="https://docs.bfl.ml/cookbook/video_start_from_images">来源</a></p>

```text
The same stop-motion claymation badger from the reference images, identical striped face, brass spectacles, mustard tweed waistcoat and visible clay fingerprints, rows a small clay boat across a black lake at night, a single oil lantern hooked on the bow throwing a warm circle on the water. He pulls the oars in slow, deliberate strokes, clay ripples spreading behind the boat. Low tracking shot gliding alongside at water level. Audio: oars dipping and creaking, water lapping the hull, night insects, the lantern's faint hiss. No on-screen text.
```
