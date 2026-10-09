# FLUX 3 相机术语表

整理自 Black Forest Labs 官方 [Examples & Cheatsheet](https://docs.bfl.ml/guides/prompting_video_camera_terms) 页内的 `CAMERA_TERMS` 数据。检索日期：**2026-10-08**。

共 **119** 个术语、**14** 组。每条含官方英文术语、中文说明、官方 description、官方 example prompt（英文原文）。中文翻译是阅读辅助，不是文档原文。

<p class="sister-nav">相关页：<a href="../">FLUX 3 提示词速查表</a> · <a href="../examples/">官方示例库</a> · <a href="../cases/">官方案例</a></p>

<nav class="page-toc" aria-label="本页目录">
<p>本页目录</p>

- [景别与取景（Shot sizes）](#shot-sizes-and-framing)
- [机位与角度（Angles）](#camera-angles)
- [构图（Composition）](#composition-techniques)
- [运镜（Movements）](#camera-movements)
- [焦点（Focus）](#focus-techniques)
- [镜头与光学（Lenses）](#lenses-and-optics)
- [快门与时间（Shutter & time）](#shutter-and-time)
- [光线（Lighting）](#lighting-styles)
- [转场（Transitions）](#shot-transitions)
- [主观视角与特殊机位（POV）](#pov-and-specialty-rigs)
- [画幅与格式（Format）](#aspect-and-format)
- [特效与变形（VFX）](#vfx-and-transformation)
- [美术指导（Art direction）](#art-direction)
- [动画与媒介（Animation）](#animation-and-media)

</nav>

## 景别与取景（Shot sizes)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Macro` | 微距：贴近极小主体 | Extreme detail on a very small subject area | `macro close-up of dew forming on a pine needle` |
| `Close-up` | 特写：脸、质感或单一物体 | Emphasizes face, texture, or a single object | `close-up of a boxer tightening taped hands` |
| `Medium shot` | 中景：人与环境各占一半 | Balanced view of subject and surroundings | `medium shot of a chef plating food at the pass` |
| `Wide shot` | 全景：全身加更多环境 | Shows full body and more of the environment | `wide shot of a rider crossing a dry riverbed at sunset` |
| `Establishing shot` | 建立镜头：先交代地点与尺度 | Sets location and scale before action | `establishing shot of neon towers above a rainy avenue` |
| `Extreme close-up` | 大特写：单点细节充满画面 | Fills the frame with a single tiny detail | `Extreme close-up of a weathered eye, flickering campfire flames reflected in the iris, embers drifting in darkness, 10 seconds, 16:9` |
| `Cowboy shot` | 牛仔景：从大腿中段往上 | Frames the subject from mid-thigh up | `Cowboy shot of a stern sheriff, hand resting on his gun belt, dusty street shimmering behind him, 10 seconds, 16:9` |
| `Full shot` | 全身景：从头到脚 | Shows the whole body head to toe | `Full shot of a ballerina frozen mid-leap in an empty sunlit studio, dust motes floating around her, 10 seconds, 16:9` |
| `Two shot` | 双人景：两人同框 | Two subjects sharing one frame | `Two shot of two detectives arguing across a diner table, neon light flickering, coffee cups steaming between them, 10 seconds, 16:9` |

### Macro

<p class="ex-meta"><span class="term-zh">微距：贴近极小主体</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
macro close-up of dew forming on a pine needle
```

### Close-up

<p class="ex-meta"><span class="term-zh">特写：脸、质感或单一物体</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
close-up of a boxer tightening taped hands
```

### Medium shot

<p class="ex-meta"><span class="term-zh">中景：人与环境各占一半</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
medium shot of a chef plating food at the pass
```

### Wide shot

<p class="ex-meta"><span class="term-zh">全景：全身加更多环境</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
wide shot of a rider crossing a dry riverbed at sunset
```

### Establishing shot

<p class="ex-meta"><span class="term-zh">建立镜头：先交代地点与尺度</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
establishing shot of neon towers above a rainy avenue
```

### Extreme close-up

<p class="ex-meta"><span class="term-zh">大特写：单点细节充满画面</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Extreme close-up of a weathered eye, flickering campfire flames reflected in the iris, embers drifting in darkness, 10 seconds, 16:9
```

### Cowboy shot

<p class="ex-meta"><span class="term-zh">牛仔景：从大腿中段往上</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Cowboy shot of a stern sheriff, hand resting on his gun belt, dusty street shimmering behind him, 10 seconds, 16:9
```

### Full shot

<p class="ex-meta"><span class="term-zh">全身景：从头到脚</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Full shot of a ballerina frozen mid-leap in an empty sunlit studio, dust motes floating around her, 10 seconds, 16:9
```

### Two shot

<p class="ex-meta"><span class="term-zh">双人景：两人同框</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Two shot of two detectives arguing across a diner table, neon light flickering, coffee cups steaming between them, 10 seconds, 16:9
```

## 机位与角度（Angles)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Aerial` | 航拍：从高处俯看场景 | View from high above the scene | `aerial view of a fishing boat cutting through rough water` |
| `Low angle` | 仰角：镜头上望，强调体量 | Camera looks upward to add scale or dominance | `low angle on a runner exploding off the starting blocks` |
| `High angle` | 俯角：镜头下望，压缩或暴露 | Camera looks downward to compress or expose | `high angle on commuters crossing a flooded plaza` |
| `POV` | 主观镜头：从角色眼睛看出去 | Shot from the subject's perspective | `POV weaving through a crowded night market` |
| `Over-the-shoulder` | 过肩：越过前景人物看动作 | Frames action past a foreground subject | `over-the-shoulder view of a detective reading a case board` |
| `Dutch angle` | 荷兰角：地平线倾斜，制造不安 | Tilted horizon for unease or tension | `Dutch angle of a panicked man running down a tilting fluorescent corridor, shadows sliding across walls, 10 seconds, 16:9` |
| `Worm's eye` | 虫视：极低机位向上看 | Extreme low angle looking straight up | `Worm's eye view of glass skyscrapers converging overhead, clouds racing between the towers, sunlight flaring downward, 10 seconds, 16:9` |
| `Bird's eye (top-down)` | 鸟瞰：垂直向下 | Straight-down overhead view | `Bird's eye top-down view of synchronized swimmers forming a blooming flower pattern in turquoise pool water, 10 seconds, 16:9` |
| `Eye level` | 平视：与眼睛同高 | Neutral height matching the subject's eyes | `Eye level shot of a barista sliding a latte across the counter, steam rising, morning light through windows, 10 seconds, 16:9` |
| `Ground level` | 贴地：镜头贴地面横看 | Camera at the ground looking across the scene | `Ground level shot, camera resting on wet asphalt as marching parade shoes stomp through puddles, splashes flying, confetti settling, low perspective of celebration, brassy afternoon light, 10 seconds, 16:9` |
| `Profile shot` | 侧面：严格侧对主体 | Strict side-on view of the subject | `Profile shot, strict side view of a pensive woman by a train window, passing landscape reflected on glass, flickering sunlight strobing across her face, contemplative journey, 10 seconds, 16:9` |
| `Tableau` | 舞台式：静止对称的宽构图 | Static, symmetrical, staged wide frame | `Tableau shot, static perfectly symmetrical wide frame of a pastel hotel lobby staged like a Wes Anderson set, uniformed staff standing in neat formation, deadpan whimsical composition, 10 seconds, 16:9` |
| `Fourth wall` | 破第四面墙：直视镜头说话 | Subject looks and speaks directly to the camera | `Breaking the fourth wall, a charismatic detective mid-investigation suddenly notices the camera, turns, raises an eyebrow and speaks directly to the lens, moody office lamplight, 10 seconds, 16:9` |
| `Object POV` | 物体视角：从物件内部看出 | View from an object's perspective | `Object POV shot from inside a refrigerator, door swings open revealing a sleepy man in warm kitchen light, he reaches toward the camera for milk, cool blue glow, 10 seconds, 16:9` |
| `Voyeur` | 偷窥机位：被遮挡的暗中观察 | Hidden, obstructed view spying on the subject | `Voyeur shot, hidden camera peering through half-closed venetian blinds at a man pacing in his apartment, slats framing the view, grainy suspense, secretive nocturnal tension, 10 seconds, 16:9` |

### Aerial

<p class="ex-meta"><span class="term-zh">航拍：从高处俯看场景</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
aerial view of a fishing boat cutting through rough water
```

### Low angle

<p class="ex-meta"><span class="term-zh">仰角：镜头上望，强调体量</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
low angle on a runner exploding off the starting blocks
```

### High angle

<p class="ex-meta"><span class="term-zh">俯角：镜头下望，压缩或暴露</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
high angle on commuters crossing a flooded plaza
```

### POV

<p class="ex-meta"><span class="term-zh">主观镜头：从角色眼睛看出去</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
POV weaving through a crowded night market
```

### Over-the-shoulder

<p class="ex-meta"><span class="term-zh">过肩：越过前景人物看动作</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
over-the-shoulder view of a detective reading a case board
```

### Dutch angle

<p class="ex-meta"><span class="term-zh">荷兰角：地平线倾斜，制造不安</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Dutch angle of a panicked man running down a tilting fluorescent corridor, shadows sliding across walls, 10 seconds, 16:9
```

### Worm's eye

<p class="ex-meta"><span class="term-zh">虫视：极低机位向上看</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Worm's eye view of glass skyscrapers converging overhead, clouds racing between the towers, sunlight flaring downward, 10 seconds, 16:9
```

### Bird's eye (top-down)

<p class="ex-meta"><span class="term-zh">鸟瞰：垂直向下</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Bird's eye top-down view of synchronized swimmers forming a blooming flower pattern in turquoise pool water, 10 seconds, 16:9
```

### Eye level

<p class="ex-meta"><span class="term-zh">平视：与眼睛同高</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Eye level shot of a barista sliding a latte across the counter, steam rising, morning light through windows, 10 seconds, 16:9
```

### Ground level

<p class="ex-meta"><span class="term-zh">贴地：镜头贴地面横看</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Ground level shot, camera resting on wet asphalt as marching parade shoes stomp through puddles, splashes flying, confetti settling, low perspective of celebration, brassy afternoon light, 10 seconds, 16:9
```

### Profile shot

<p class="ex-meta"><span class="term-zh">侧面：严格侧对主体</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Profile shot, strict side view of a pensive woman by a train window, passing landscape reflected on glass, flickering sunlight strobing across her face, contemplative journey, 10 seconds, 16:9
```

### Tableau

<p class="ex-meta"><span class="term-zh">舞台式：静止对称的宽构图</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Tableau shot, static perfectly symmetrical wide frame of a pastel hotel lobby staged like a Wes Anderson set, uniformed staff standing in neat formation, deadpan whimsical composition, 10 seconds, 16:9
```

### Fourth wall

<p class="ex-meta"><span class="term-zh">破第四面墙：直视镜头说话</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Breaking the fourth wall, a charismatic detective mid-investigation suddenly notices the camera, turns, raises an eyebrow and speaks directly to the lens, moody office lamplight, 10 seconds, 16:9
```

### Object POV

<p class="ex-meta"><span class="term-zh">物体视角：从物件内部看出</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Object POV shot from inside a refrigerator, door swings open revealing a sleepy man in warm kitchen light, he reaches toward the camera for milk, cool blue glow, 10 seconds, 16:9
```

### Voyeur

<p class="ex-meta"><span class="term-zh">偷窥机位：被遮挡的暗中观察</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Voyeur shot, hidden camera peering through half-closed venetian blinds at a man pacing in his apartment, slats framing the view, grainy suspense, secretive nocturnal tension, 10 seconds, 16:9
```

## 构图（Composition)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Leading lines` | 引导线：用线条把视线引向主体 | Uses lines in the frame to guide the eye | `leading lines of train tracks pulling toward a distant station` |
| `Center framing` | 居中构图：主体锁在正中 | Keeps the subject locked in the middle | `center-framed portrait of a dancer under a spotlight` |
| `Rule of thirds` | 三分法：主体偏置 | Places the subject off-center for balance | `runner framed on the left third against a vast coastline` |
| `Symmetry` | 对称 | Mirrors shapes for precision or tension | `symmetrical hotel corridor with a child standing still at the center` |
| `Negative space` | 负空间：留白压主体 | Leaves open space around the subject | `small sailboat isolated against a wide grey horizon` |
| `Frame within frame` | 框中框 | Uses an in-scene opening to frame the subject | `Frame within frame composition, a lone traveler seen through a rain-streaked train window, city lights smearing past, 10 seconds, 16:9` |
| `Foreground occlusion` | 前景遮挡 | Blurred foreground objects add depth | `Foreground occlusion shot, two friends conversing glimpsed past out-of-focus market stalls, hanging lanterns and vendors drifting by, 10 seconds, 16:9` |
| `Silhouette` | 剪影 | Subject rendered dark against bright light | `Silhouette of a climber pulling over a ridge against the rising sun, golden haze swallowing the mountains, 10 seconds, 16:9` |
| `Reflection framing` | 反射构图 | Composes the subject in a reflective surface | `Reflection framing of a dancer spinning inside a cracked ballroom mirror, fractured images multiplying with each turn, 10 seconds, 16:9` |

### Leading lines

<p class="ex-meta"><span class="term-zh">引导线：用线条把视线引向主体</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
leading lines of train tracks pulling toward a distant station
```

### Center framing

<p class="ex-meta"><span class="term-zh">居中构图：主体锁在正中</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
center-framed portrait of a dancer under a spotlight
```

### Rule of thirds

<p class="ex-meta"><span class="term-zh">三分法：主体偏置</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
runner framed on the left third against a vast coastline
```

### Symmetry

<p class="ex-meta"><span class="term-zh">对称</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
symmetrical hotel corridor with a child standing still at the center
```

### Negative space

<p class="ex-meta"><span class="term-zh">负空间：留白压主体</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
small sailboat isolated against a wide grey horizon
```

### Frame within frame

<p class="ex-meta"><span class="term-zh">框中框</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Frame within frame composition, a lone traveler seen through a rain-streaked train window, city lights smearing past, 10 seconds, 16:9
```

### Foreground occlusion

<p class="ex-meta"><span class="term-zh">前景遮挡</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Foreground occlusion shot, two friends conversing glimpsed past out-of-focus market stalls, hanging lanterns and vendors drifting by, 10 seconds, 16:9
```

### Silhouette

<p class="ex-meta"><span class="term-zh">剪影</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Silhouette of a climber pulling over a ridge against the rising sun, golden haze swallowing the mountains, 10 seconds, 16:9
```

### Reflection framing

<p class="ex-meta"><span class="term-zh">反射构图</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Reflection framing of a dancer spinning inside a cracked ballroom mirror, fractured images multiplying with each turn, 10 seconds, 16:9
```

## 运镜（Movements)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Pan` | 横摇 | Camera rotates left or right from a fixed point | `slow pan across pine trees to reveal a lake at dawn` |
| `Tilt` | 俯仰摇 | Camera rotates up or down | `tilt up from muddy boots to a storm-lit face` |
| `Dolly in` | 推轨靠近 | Camera physically pushes closer to the subject | `dolly in toward a violinist before the first note` |
| `Tracking shot` | 跟踪镜头 | Camera moves alongside the subject | `tracking shot beside a fox sprinting through brush` |
| `Orbit` | 环绕 | Camera circles the subject | `slow orbit around a statue in blowing ash` |
| `Crane / boom` | 摇臂 / 升降 | Camera rises or lowers on a boom arm | `Crane boom shot rising from street level up a brick facade to a rooftop garden party glowing with string lights, 10 seconds, 16:9` |
| `Handheld` | 手持 | Loose, organic camera motion | `Handheld camera trailing a nervous performer through a cramped backstage corridor, crew rushing past, stage lights ahead, 10 seconds, 16:9` |
| `Whip pan` | 甩摇 | Fast pan that blurs between subjects | `Whip pan from the pitcher's explosive windup to the batter swinging, stadium crowd blurring between them, 10 seconds, 16:9` |
| `Dolly zoom` | 希区柯克变焦 | Zoom and dolly opposed for a warping effect | `Dolly zoom on a man's stunned face in a long hallway as he realizes the truth, walls stretching unnaturally, 10 seconds, 16:9` |
| `Steadicam follow` | 稳定器跟随 | Smooth stabilized shot following the subject | `Steadicam follow shot tracking a chef weaving through a busy kitchen, flames flaring, plates passing hand to hand, 10 seconds, 16:9` |
| `Push through` | 穿过前景推进 | Camera pushes through a gap into a new space | `Push through a brass keyhole into a candlelit library, towering shelves emerging, flames trembling over ancient books, 10 seconds, 16:9` |
| `Snorricam` | 胸挂主观 | Rig mounts the camera to the subject so the world sways | `Snorricam shot, camera rigged to the actor's chest keeping his weary face pin-sharp while neon city streets tumble and sway wildly behind him, drunken disorienting night walk, 10 seconds, 16:9` |
| `Camera roll` | 滚转 | Camera rotates around its own lens axis | `Camera roll technique, lens rotating a full 360 degrees around its own axis as a skateboarder leaps a concrete gap, golden sunset flares, gravity-defying dizziness, 10 seconds, 16:9` |
| `Arc shot` | 弧线环绕 | Camera sweeps a semicircle around the subject | `Arc shot, camera glides in a smooth semicircle around a couple kissing under heavy rain, streetlamps sparkling in falling droplets, slow romantic orbit, cinematic night atmosphere, 10 seconds, 16:9` |
| `Pedestal` | 升降座 | Camera moves straight up or down in space | `Pedestal shot, camera rises vertically along a towering antique library bookshelf, dust motes drifting in warm lamplight, leather spines passing frame by frame, quiet scholarly grandeur, 10 seconds, 16:9` |
| `Trucking` | 横向移动 | Camera slides laterally alongside the scene | `Trucking shot, camera slides laterally past a bustling street market, vendors handing over fruit, awnings flapping, steam rising from food stalls, layered crowds in warm afternoon light, 10 seconds, 16:9` |
| `Locked-on` | 锁死机位 | Rig fixes the subject steady while the background blurs | `Locked-on shot, camera rigidly fixed to a runner's determined face, perfectly stable, while the blurred subway station whips past behind her at chaotic speed, tense urgency, 10 seconds, 16:9` |
| `Lazy Susan` | 转盘旋转 | Subject rotates on a turntable, camera fixed | `Lazy Susan shot, a vintage rotary telephone spinning slowly on a rotating turntable while the camera stays completely fixed, moody studio spotlight, black backdrop, product-film elegance, 10 seconds, 16:9` |

### Pan

<p class="ex-meta"><span class="term-zh">横摇</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
slow pan across pine trees to reveal a lake at dawn
```

### Tilt

<p class="ex-meta"><span class="term-zh">俯仰摇</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
tilt up from muddy boots to a storm-lit face
```

### Dolly in

<p class="ex-meta"><span class="term-zh">推轨靠近</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
dolly in toward a violinist before the first note
```

### Tracking shot

<p class="ex-meta"><span class="term-zh">跟踪镜头</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
tracking shot beside a fox sprinting through brush
```

### Orbit

<p class="ex-meta"><span class="term-zh">环绕</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
slow orbit around a statue in blowing ash
```

### Crane / boom

<p class="ex-meta"><span class="term-zh">摇臂 / 升降</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Crane boom shot rising from street level up a brick facade to a rooftop garden party glowing with string lights, 10 seconds, 16:9
```

### Handheld

<p class="ex-meta"><span class="term-zh">手持</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Handheld camera trailing a nervous performer through a cramped backstage corridor, crew rushing past, stage lights ahead, 10 seconds, 16:9
```

### Whip pan

<p class="ex-meta"><span class="term-zh">甩摇</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Whip pan from the pitcher's explosive windup to the batter swinging, stadium crowd blurring between them, 10 seconds, 16:9
```

### Dolly zoom

<p class="ex-meta"><span class="term-zh">希区柯克变焦</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Dolly zoom on a man's stunned face in a long hallway as he realizes the truth, walls stretching unnaturally, 10 seconds, 16:9
```

### Steadicam follow

<p class="ex-meta"><span class="term-zh">稳定器跟随</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Steadicam follow shot tracking a chef weaving through a busy kitchen, flames flaring, plates passing hand to hand, 10 seconds, 16:9
```

### Push through

<p class="ex-meta"><span class="term-zh">穿过前景推进</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Push through a brass keyhole into a candlelit library, towering shelves emerging, flames trembling over ancient books, 10 seconds, 16:9
```

### Snorricam

<p class="ex-meta"><span class="term-zh">胸挂主观</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Snorricam shot, camera rigged to the actor's chest keeping his weary face pin-sharp while neon city streets tumble and sway wildly behind him, drunken disorienting night walk, 10 seconds, 16:9
```

### Camera roll

<p class="ex-meta"><span class="term-zh">滚转</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Camera roll technique, lens rotating a full 360 degrees around its own axis as a skateboarder leaps a concrete gap, golden sunset flares, gravity-defying dizziness, 10 seconds, 16:9
```

### Arc shot

<p class="ex-meta"><span class="term-zh">弧线环绕</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Arc shot, camera glides in a smooth semicircle around a couple kissing under heavy rain, streetlamps sparkling in falling droplets, slow romantic orbit, cinematic night atmosphere, 10 seconds, 16:9
```

### Pedestal

<p class="ex-meta"><span class="term-zh">升降座</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Pedestal shot, camera rises vertically along a towering antique library bookshelf, dust motes drifting in warm lamplight, leather spines passing frame by frame, quiet scholarly grandeur, 10 seconds, 16:9
```

### Trucking

<p class="ex-meta"><span class="term-zh">横向移动</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Trucking shot, camera slides laterally past a bustling street market, vendors handing over fruit, awnings flapping, steam rising from food stalls, layered crowds in warm afternoon light, 10 seconds, 16:9
```

### Locked-on

<p class="ex-meta"><span class="term-zh">锁死机位</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Locked-on shot, camera rigidly fixed to a runner's determined face, perfectly stable, while the blurred subway station whips past behind her at chaotic speed, tense urgency, 10 seconds, 16:9
```

### Lazy Susan

<p class="ex-meta"><span class="term-zh">转盘旋转</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Lazy Susan shot, a vintage rotary telephone spinning slowly on a rotating turntable while the camera stays completely fixed, moody studio spotlight, black backdrop, product-film elegance, 10 seconds, 16:9
```

## 焦点（Focus)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Shallow depth of field` | 浅景深 | Subject stays sharp while background softens | `shallow depth of field on raindrops sliding down a taxi window` |
| `Deep focus` | 深焦 | Foreground and background both stay sharp | `deep focus across a crowded antique shop from front shelf to back door` |
| `Rack focus` | 焦点转移 | Focus shifts from one subject plane to another | `rack focus from a coffee cup in the foreground to a woman at the window` |
| `Split diopter` | 分裂屈光 | Near and far planes both stay sharp | `Split diopter shot keeping a hiding spy razor sharp in foreground and a distant opening door equally sharp, 10 seconds, 16:9` |
| `Focus breathing reveal` | 呼吸对焦揭示 | Blur slowly resolves to reveal the subject | `Focus breathing reveal, soft blur slowly resolving into a stranger's face approaching through fog under streetlights, 10 seconds, 16:9` |
| `Tilt shift` | 移轴 | Selective focus for a miniature look | `Tilt shift shot of a miniature-looking harbor town, tiny boats gliding, toy-like cars crossing the quay, 10 seconds, 16:9` |

### Shallow depth of field

<p class="ex-meta"><span class="term-zh">浅景深</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
shallow depth of field on raindrops sliding down a taxi window
```

### Deep focus

<p class="ex-meta"><span class="term-zh">深焦</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
deep focus across a crowded antique shop from front shelf to back door
```

### Rack focus

<p class="ex-meta"><span class="term-zh">焦点转移</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
rack focus from a coffee cup in the foreground to a woman at the window
```

### Split diopter

<p class="ex-meta"><span class="term-zh">分裂屈光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Split diopter shot keeping a hiding spy razor sharp in foreground and a distant opening door equally sharp, 10 seconds, 16:9
```

### Focus breathing reveal

<p class="ex-meta"><span class="term-zh">呼吸对焦揭示</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Focus breathing reveal, soft blur slowly resolving into a stranger's face approaching through fog under streetlights, 10 seconds, 16:9
```

### Tilt shift

<p class="ex-meta"><span class="term-zh">移轴</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Tilt shift shot of a miniature-looking harbor town, tiny boats gliding, toy-like cars crossing the quay, 10 seconds, 16:9
```

## 镜头与光学（Lenses)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Wide angle (24mm)` | 广角 24mm | Exaggerated space and edge distortion | `Wide angle 24mm lens follows a runner sprinting through a narrow alley, walls distorting and looming, handheld chase energy, 10 seconds, 16:9` |
| `Telephoto compression` | 长焦压缩 | Flattens depth and stacks planes together | `Telephoto compression stacks a wall of yellow taxis into flattened layers, heat shimmer, dense city traffic crawling forward, 10 seconds, 16:9` |
| `Fisheye` | 鱼眼 | Extreme curved wide-angle distortion | `Fisheye lens inside a skate bowl, skater carves past mid-trick, curved concrete horizon bending around the camera, 10 seconds, 16:9` |
| `Anamorphic flares` | 变形宽银幕光斑 | Horizontal streaks and oval bokeh | `Anamorphic flares streak horizontally across a night runway as a jet taxis past, blue flares cutting the darkness, 10 seconds, 16:9` |
| `Macro lens` | 微距镜头 | Extreme magnification of tiny detail | `Macro lens on a ticking watch mechanism, gears and escapement moving in extreme close-up, shallow focus glinting brass, 10 seconds, 16:9` |
| `Probe lens` | 探针镜头 | Snorkel lens weaves low through tight spaces | `Probe lens shot, snorkel camera weaving low through a breakfast still life, gliding between coffee cups, toast towers and dripping honey, macro detail, warm morning sunlight, 10 seconds, 16:9` |
| `Halation` | 光晕 | Glowing bloom halos around bright highlights | `Halation film look, glowing red-orange halos blooming around candle flames on a dinner table, soft vintage 35mm bloom over every highlight, dreamy nostalgic warmth, gentle flicker, 10 seconds, 16:9` |
| `Parallax` | 视差 | Depth layers slide against each other at different speeds | `Parallax shot, camera tracks sideways as foreground fence posts, midground trees and distant mountains slide against each other at different speeds, layered depth, misty dawn light, 10 seconds, 16:9` |
| `Vignette` | 暗角 | Darkened edges frame a bright center | `Heavy vignette, dark edges closing around a candlelit portrait of an old woman reading letters, only her illuminated face in the bright center, intimate chiaroscuro mood, 10 seconds, 16:9` |

### Wide angle (24mm)

<p class="ex-meta"><span class="term-zh">广角 24mm</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Wide angle 24mm lens follows a runner sprinting through a narrow alley, walls distorting and looming, handheld chase energy, 10 seconds, 16:9
```

### Telephoto compression

<p class="ex-meta"><span class="term-zh">长焦压缩</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Telephoto compression stacks a wall of yellow taxis into flattened layers, heat shimmer, dense city traffic crawling forward, 10 seconds, 16:9
```

### Fisheye

<p class="ex-meta"><span class="term-zh">鱼眼</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Fisheye lens inside a skate bowl, skater carves past mid-trick, curved concrete horizon bending around the camera, 10 seconds, 16:9
```

### Anamorphic flares

<p class="ex-meta"><span class="term-zh">变形宽银幕光斑</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Anamorphic flares streak horizontally across a night runway as a jet taxis past, blue flares cutting the darkness, 10 seconds, 16:9
```

### Macro lens

<p class="ex-meta"><span class="term-zh">微距镜头</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Macro lens on a ticking watch mechanism, gears and escapement moving in extreme close-up, shallow focus glinting brass, 10 seconds, 16:9
```

### Probe lens

<p class="ex-meta"><span class="term-zh">探针镜头</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Probe lens shot, snorkel camera weaving low through a breakfast still life, gliding between coffee cups, toast towers and dripping honey, macro detail, warm morning sunlight, 10 seconds, 16:9
```

### Halation

<p class="ex-meta"><span class="term-zh">光晕</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Halation film look, glowing red-orange halos blooming around candle flames on a dinner table, soft vintage 35mm bloom over every highlight, dreamy nostalgic warmth, gentle flicker, 10 seconds, 16:9
```

### Parallax

<p class="ex-meta"><span class="term-zh">视差</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Parallax shot, camera tracks sideways as foreground fence posts, midground trees and distant mountains slide against each other at different speeds, layered depth, misty dawn light, 10 seconds, 16:9
```

### Vignette

<p class="ex-meta"><span class="term-zh">暗角</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Heavy vignette, dark edges closing around a candlelit portrait of an old woman reading letters, only her illuminated face in the bright center, intimate chiaroscuro mood, 10 seconds, 16:9
```

## 快门与时间（Shutter & time)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Slow motion` | 慢动作 | Action stretched below real time | `Slow motion hummingbird shaking rain off its feathers, droplets exploding outward in glistening arcs, soft gray light, 10 seconds, 16:9` |
| `Speed ramp` | 变速坡 | Speed shifts within a single shot | `Speed ramp as a boxer's punch connects, time slowing at impact then snapping back, sweat spraying under ring lights, 10 seconds, 16:9` |
| `Timelapse` | 延时 | Long spans compressed into seconds | `Timelapse of fog rolling over a mountain pass, clouds pouring like liquid between ridgelines, shifting dawn light, 10 seconds, 16:9` |
| `Long exposure look` | 长曝光观感 | Motion smears into glowing light trails | `Long exposure look, night cyclist weaving through city streets, headlights and taillights smearing into glowing light trails, 10 seconds, 16:9` |
| `Bullet time` | 子弹时间 | Frozen instant while the camera orbits through it | `Bullet time shot, a confetti explosion frozen mid-air around a leaping dancer while the camera orbits smoothly through suspended particles, studio strobes, impossible frozen instant, 10 seconds, 16:9` |
| `Freeze frame` | 定格 | Subject freezes while the camera keeps moving | `Freeze frame, a skateboarder halts mid-air completely frozen while the camera keeps dollying around his suspended body, dust hanging motionless, skatepark at golden hour, 10 seconds, 16:9` |
| `Boomerang` | 来回循环 | Short action plays forward then reverses on loop | `Boomerang loop, a champagne cork pops and foam bursts upward, then reverses back into the bottle, forward and backward endlessly repeating, celebratory sparkler light, playful rhythm, 10 seconds, 16:9` |
| `Step printing` | 跳帧印片 | Stuttering, smeared motion trails | `Step printing effect, a dancer in a neon-lit Hong Kong alley leaving ghostly stuttering motion trails, smeared frames dragging behind each gesture, dreamy Wong Kar-wai mood, 10 seconds, 16:9` |
| `Fast motion` | 快动作 | Undercranked, accelerated action | `Fast motion, undercranked footage of a grand railway station hall, commuters zipping across the marble floor in accelerated streams while one still traveler stands motionless, 10 seconds, 16:9` |
| `Cinemagraph` | 动态静帧 | A still frame with one small looping motion | `Cinemagraph, an entirely frozen diner scene, patrons and waitress motionless, while only the steam from a coffee cup rises and curls endlessly, subtle hypnotic stillness, 10 seconds, 16:9` |

### Slow motion

<p class="ex-meta"><span class="term-zh">慢动作</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Slow motion hummingbird shaking rain off its feathers, droplets exploding outward in glistening arcs, soft gray light, 10 seconds, 16:9
```

### Speed ramp

<p class="ex-meta"><span class="term-zh">变速坡</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Speed ramp as a boxer's punch connects, time slowing at impact then snapping back, sweat spraying under ring lights, 10 seconds, 16:9
```

### Timelapse

<p class="ex-meta"><span class="term-zh">延时</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Timelapse of fog rolling over a mountain pass, clouds pouring like liquid between ridgelines, shifting dawn light, 10 seconds, 16:9
```

### Long exposure look

<p class="ex-meta"><span class="term-zh">长曝光观感</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Long exposure look, night cyclist weaving through city streets, headlights and taillights smearing into glowing light trails, 10 seconds, 16:9
```

### Bullet time

<p class="ex-meta"><span class="term-zh">子弹时间</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Bullet time shot, a confetti explosion frozen mid-air around a leaping dancer while the camera orbits smoothly through suspended particles, studio strobes, impossible frozen instant, 10 seconds, 16:9
```

### Freeze frame

<p class="ex-meta"><span class="term-zh">定格</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Freeze frame, a skateboarder halts mid-air completely frozen while the camera keeps dollying around his suspended body, dust hanging motionless, skatepark at golden hour, 10 seconds, 16:9
```

### Boomerang

<p class="ex-meta"><span class="term-zh">来回循环</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Boomerang loop, a champagne cork pops and foam bursts upward, then reverses back into the bottle, forward and backward endlessly repeating, celebratory sparkler light, playful rhythm, 10 seconds, 16:9
```

### Step printing

<p class="ex-meta"><span class="term-zh">跳帧印片</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Step printing effect, a dancer in a neon-lit Hong Kong alley leaving ghostly stuttering motion trails, smeared frames dragging behind each gesture, dreamy Wong Kar-wai mood, 10 seconds, 16:9
```

### Fast motion

<p class="ex-meta"><span class="term-zh">快动作</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Fast motion, undercranked footage of a grand railway station hall, commuters zipping across the marble floor in accelerated streams while one still traveler stands motionless, 10 seconds, 16:9
```

### Cinemagraph

<p class="ex-meta"><span class="term-zh">动态静帧</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Cinemagraph, an entirely frozen diner scene, patrons and waitress motionless, while only the steam from a coffee cup rises and curls endlessly, subtle hypnotic stillness, 10 seconds, 16:9
```

## 光线（Lighting)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Rim light` | 轮廓光 | Backlight outlines the subject's edge | `Rim light outlines a boxer breathing heavily in a dark gym, sweat glowing along his shoulders, background falling black, 10 seconds, 16:9` |
| `Chiaroscuro` | 明暗对照 | Strong contrast of light and deep shadow | `Chiaroscuro lighting, a violinist playing under a single beam, deep black shadows carving the face and bow strokes, 10 seconds, 16:9` |
| `Golden hour` | 黄金时刻 | Warm, low-sun backlight | `Golden hour backlight over wheat fields, wind rippling the stalks in waves, warm sun flaring low on the horizon, 10 seconds, 16:9` |
| `Neon practicals` | 现场霓虹 | In-scene colored light sources | `Neon practicals wash a face in shifting pink and cyan light, signs flickering outside a rainy window at night, 10 seconds, 16:9` |
| `Volumetric light` | 体积光 | Visible beams and god rays through haze | `Volumetric light, god rays slicing through a dusty barn, motes drifting as a farmer walks through the glowing beams, 10 seconds, 16:9` |
| `Hard light` | 硬光 | Harsh, sharp-edged shadows and high contrast | `Hard light noir, harsh sunbeams slicing through venetian blinds casting razor-sharp shadow stripes across a detective's face and smoky office, high contrast, cigarette smoke drifting, 10 seconds, 16:9` |
| `Haze` | 雾霾散射 | Thick atmosphere reveals volumetric light shafts | `Atmospheric haze, dusty warehouse interior with thick volumetric light shafts cutting through fog from high windows, a lone figure walking through glowing cones, moody silence, 10 seconds, 16:9` |
| `Spotlight` | 聚光 | A single beam isolates the subject in darkness | `A single spotlight follows a lone singer across an empty dark stage, the harsh circular beam carving her silhouette from blackness, dust drifting through the light cone, dramatic theatrical solitude, 10 seconds, 16:9` |
| `Light flash` | 闪光 | Strobing flashbulb bursts freeze motion | `Rapid paparazzi light flash bursts strobe across a red carpet as an actress poses, each camera flash freezing her gestures in blinding white pulses, glamorous chaotic press-night energy, 10 seconds, 16:9` |
| `Projections` | 投影光 | Projected imagery plays across the subject | `Vintage film projections dance across a woman's calm face in a dark room, flickering movie scenes and subtitles wrapping over her skin and eyes, nostalgic cinematic intimacy, 10 seconds, 16:9` |
| `Underwater light` | 水下光 | Rippling caustics dance across surfaces | `Shimmering underwater light caustics ripple across the turquoise floor of a swimming pool as a swimmer glides through, sunbeams refracting into dancing web patterns, serene aquatic calm, 10 seconds, 16:9` |

### Rim light

<p class="ex-meta"><span class="term-zh">轮廓光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Rim light outlines a boxer breathing heavily in a dark gym, sweat glowing along his shoulders, background falling black, 10 seconds, 16:9
```

### Chiaroscuro

<p class="ex-meta"><span class="term-zh">明暗对照</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Chiaroscuro lighting, a violinist playing under a single beam, deep black shadows carving the face and bow strokes, 10 seconds, 16:9
```

### Golden hour

<p class="ex-meta"><span class="term-zh">黄金时刻</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Golden hour backlight over wheat fields, wind rippling the stalks in waves, warm sun flaring low on the horizon, 10 seconds, 16:9
```

### Neon practicals

<p class="ex-meta"><span class="term-zh">现场霓虹</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Neon practicals wash a face in shifting pink and cyan light, signs flickering outside a rainy window at night, 10 seconds, 16:9
```

### Volumetric light

<p class="ex-meta"><span class="term-zh">体积光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Volumetric light, god rays slicing through a dusty barn, motes drifting as a farmer walks through the glowing beams, 10 seconds, 16:9
```

### Hard light

<p class="ex-meta"><span class="term-zh">硬光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Hard light noir, harsh sunbeams slicing through venetian blinds casting razor-sharp shadow stripes across a detective's face and smoky office, high contrast, cigarette smoke drifting, 10 seconds, 16:9
```

### Haze

<p class="ex-meta"><span class="term-zh">雾霾散射</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Atmospheric haze, dusty warehouse interior with thick volumetric light shafts cutting through fog from high windows, a lone figure walking through glowing cones, moody silence, 10 seconds, 16:9
```

### Spotlight

<p class="ex-meta"><span class="term-zh">聚光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A single spotlight follows a lone singer across an empty dark stage, the harsh circular beam carving her silhouette from blackness, dust drifting through the light cone, dramatic theatrical solitude, 10 seconds, 16:9
```

### Light flash

<p class="ex-meta"><span class="term-zh">闪光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Rapid paparazzi light flash bursts strobe across a red carpet as an actress poses, each camera flash freezing her gestures in blinding white pulses, glamorous chaotic press-night energy, 10 seconds, 16:9
```

### Projections

<p class="ex-meta"><span class="term-zh">投影光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Vintage film projections dance across a woman's calm face in a dark room, flickering movie scenes and subtitles wrapping over her skin and eyes, nostalgic cinematic intimacy, 10 seconds, 16:9
```

### Underwater light

<p class="ex-meta"><span class="term-zh">水下光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Shimmering underwater light caustics ripple across the turquoise floor of a swimming pool as a swimmer glides through, sunbeams refracting into dancing web patterns, serene aquatic calm, 10 seconds, 16:9
```

## 转场（Transitions)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Match cut` | 匹配剪辑 | Shape or motion carries across the cut | `Match cut from a spinning coin on a table to a spinning planet in space, seamless rotation carrying the transition, 10 seconds, 16:9` |
| `Whip transition` | 甩摇转场 | A whip pan hides the cut between scenes | `Whip transition, camera whips from a busy kitchen blurring into motion, landing smoothly in a candlelit dining room, 10 seconds, 16:9` |
| `Foreground wipe` | 前景擦除转场 | A passing object wipes to a new scene | `Foreground wipe as a passing bus fills the frame, revealing a completely new street scene once it clears, 10 seconds, 16:9` |
| `Jump cut` | 跳切 | Abrupt discontinuous cuts in the same framing | `A man delivers an anxious monologue to camera with abrupt jump cut edits, his position and gestures snapping discontinuously between phrases, same framing, restless confessional vlog rhythm, 10 seconds, 16:9` |
| `Object portal` | 物体门洞转场 | Camera dives into an object into a new scene | `The camera dives into a steaming coffee cup as an object portal, plunging through swirling brown liquid that dissolves into a golden autumn forest scene, seamless magical transition, 10 seconds, 16:9` |
| `Pass-through` | 穿过转场 | One continuous move threading through spaces | `A gliding pass-through shot threads the camera through a brass keyhole into a candlelit study, then out its window into rainy night streets, one continuous impossible move, 10 seconds, 16:9` |
| `Quick cuts` | 快切 | Rapid rhythmic montage of short shots | `Energetic quick cuts chop a morning breakfast routine into eight snappy shots, toast popping, coffee pouring, eggs cracking, jacket zipping, rhythmic percussive montage of everyday momentum, 10 seconds, 16:9` |
| `Screen-in-screen` | 画中画 | Recursive screen-within-screen loop | `An infinite screen-in-screen recursion shows a woman watching herself on a television that contains the same scene repeating inward endlessly, glowing screens tunneling into darkness, uncanny loop, 10 seconds, 16:9` |

### Match cut

<p class="ex-meta"><span class="term-zh">匹配剪辑</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Match cut from a spinning coin on a table to a spinning planet in space, seamless rotation carrying the transition, 10 seconds, 16:9
```

### Whip transition

<p class="ex-meta"><span class="term-zh">甩摇转场</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Whip transition, camera whips from a busy kitchen blurring into motion, landing smoothly in a candlelit dining room, 10 seconds, 16:9
```

### Foreground wipe

<p class="ex-meta"><span class="term-zh">前景擦除转场</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Foreground wipe as a passing bus fills the frame, revealing a completely new street scene once it clears, 10 seconds, 16:9
```

### Jump cut

<p class="ex-meta"><span class="term-zh">跳切</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A man delivers an anxious monologue to camera with abrupt jump cut edits, his position and gestures snapping discontinuously between phrases, same framing, restless confessional vlog rhythm, 10 seconds, 16:9
```

### Object portal

<p class="ex-meta"><span class="term-zh">物体门洞转场</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
The camera dives into a steaming coffee cup as an object portal, plunging through swirling brown liquid that dissolves into a golden autumn forest scene, seamless magical transition, 10 seconds, 16:9
```

### Pass-through

<p class="ex-meta"><span class="term-zh">穿过转场</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A gliding pass-through shot threads the camera through a brass keyhole into a candlelit study, then out its window into rainy night streets, one continuous impossible move, 10 seconds, 16:9
```

### Quick cuts

<p class="ex-meta"><span class="term-zh">快切</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Energetic quick cuts chop a morning breakfast routine into eight snappy shots, toast popping, coffee pouring, eggs cracking, jacket zipping, rhythmic percussive montage of everyday momentum, 10 seconds, 16:9
```

### Screen-in-screen

<p class="ex-meta"><span class="term-zh">画中画</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
An infinite screen-in-screen recursion shows a woman watching herself on a television that contains the same scene repeating inward endlessly, glowing screens tunneling into darkness, uncanny loop, 10 seconds, 16:9
```

## 主观视角与特殊机位（POV)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Drone FPV` | 穿越机第一人称 | Fast, agile first-person drone flight | `Drone FPV dives off a waterfall into a misty gorge, skimming spray and rock walls at breathtaking speed, 10 seconds, 16:9` |
| `Bodycam` | 身体相机 | Chest-mounted POV bobbing with motion | `Bodycam POV jogging through a stadium tunnel toward blinding daylight, footsteps echoing, camera bobbing with each stride, 10 seconds, 16:9` |
| `Dashcam` | 行车记录仪 | Fixed in-car view of the road ahead | `Dashcam view of a moose crossing a snowy highway at dusk, wipers sweeping, brake lights reflecting on ice, 10 seconds, 16:9` |
| `Mirror POV` | 镜面主观 | Subject seen via a mirror reflection | `Mirror POV, a man shaving looks directly into the bathroom mirror, razor strokes through foam, steamy morning light, 10 seconds, 16:9` |

### Drone FPV

<p class="ex-meta"><span class="term-zh">穿越机第一人称</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Drone FPV dives off a waterfall into a misty gorge, skimming spray and rock walls at breathtaking speed, 10 seconds, 16:9
```

### Bodycam

<p class="ex-meta"><span class="term-zh">身体相机</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Bodycam POV jogging through a stadium tunnel toward blinding daylight, footsteps echoing, camera bobbing with each stride, 10 seconds, 16:9
```

### Dashcam

<p class="ex-meta"><span class="term-zh">行车记录仪</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Dashcam view of a moose crossing a snowy highway at dusk, wipers sweeping, brake lights reflecting on ice, 10 seconds, 16:9
```

### Mirror POV

<p class="ex-meta"><span class="term-zh">镜面主观</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Mirror POV, a man shaving looks directly into the bathroom mirror, razor strokes through foam, steamy morning light, 10 seconds, 16:9
```

## 画幅与格式（Format)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Cinemascope (21:9)` | 宽银幕 21:9 | Ultra-wide anamorphic frame | `Cinemascope 21:9 frame, two gunslingers face off at high noon in a desert town, heat haze and drifting dust, 10 seconds, 21:9` |
| `Vertical (9:16)` | 竖屏 9:16 | Tall frame for mobile-first video | `Vertical 9:16 frame, climber ascending a firetower ladder, camera tilting up the endless rungs toward open sky, 10 seconds, 9:16` |
| `Vintage (4:3)` | 复古 4:3 | Boxy retro camcorder framing | `Vintage 4:3 home video of a 90s birthday party, grainy camcorder look, kids cheering around flickering candles, 10 seconds, 4:3` |
| `Split screen` | 分屏 | Two shots side by side in one frame | `Split screen shows two callers in different cities, one rainy, one sunny, laughing on the phone simultaneously, 10 seconds, 16:9` |

### Cinemascope (21:9)

<p class="ex-meta"><span class="term-zh">宽银幕 21:9</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Cinemascope 21:9 frame, two gunslingers face off at high noon in a desert town, heat haze and drifting dust, 10 seconds, 21:9
```

### Vertical (9:16)

<p class="ex-meta"><span class="term-zh">竖屏 9:16</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Vertical 9:16 frame, climber ascending a firetower ladder, camera tilting up the endless rungs toward open sky, 10 seconds, 9:16
```

### Vintage (4:3)

<p class="ex-meta"><span class="term-zh">复古 4:3</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Vintage 4:3 home video of a 90s birthday party, grainy camcorder look, kids cheering around flickering candles, 10 seconds, 4:3
```

### Split screen

<p class="ex-meta"><span class="term-zh">分屏</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Split screen shows two callers in different cities, one rainy, one sunny, laughing on the phone simultaneously, 10 seconds, 16:9
```

## 特效与变形（VFX)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Double exposure` | 双重曝光 | Two images blended into one frame | `Elegant double exposure blends a pensive man's profile portrait with a misty pine forest, treetops and fog drifting inside his silhouette against white sky, melancholic poetic layering, 10 seconds, 16:9` |
| `Datamosh` | 数据马赛克 | Glitched, smearing pixel corruption | `A dancer hits the beat drop and the frame erupts in datamosh corruption, pixels smearing and melting into glitched motion trails, colors bleeding chaotically, raw digital energy, 10 seconds, 16:9` |
| `Kaleidoscope` | 万花筒 | Mirrored, symmetrical repeating patterns | `Overhead kaleidoscope symmetry multiplies a troupe of dancers into shifting mirrored mandala patterns, costumes blooming like folding flowers with each choreographed move, hypnotic Busby Berkeley geometry, 10 seconds, 16:9` |
| `Morphing` | 变形过渡 | One subject fluidly reshapes into another | `Seamless morphing transforms one face through four generations, child to teenager to mother to grandmother, features fluidly reshaping under soft studio light, tender meditation on time, 10 seconds, 16:9` |
| `Slit scan` | 狭缝扫描 | Motion smeared into flowing time ribbons | `A galloping horse stretches into slit-scan time distortion, its body smeared into flowing temporal ribbons across the frame, mane trailing warped streaks over prairie light, surreal velocity, 10 seconds, 16:9` |
| `X-ray` | X 光 | See-through view of inner structure | `An x-ray view reveals the inner skeleton of a mechanical hand flexing its fingers, gears and pistons glowing blue-white against black, translucent layers shifting, clinical futuristic precision, 10 seconds, 16:9` |
| `Levitation` | 悬浮 | Objects or subjects float weightlessly | `Quiet levitation lifts books, teacups and a floor lamp drifting slowly through a sunlit living room, objects rotating weightlessly around an unbothered reading woman, dreamlike domestic magic, 10 seconds, 16:9` |

### Double exposure

<p class="ex-meta"><span class="term-zh">双重曝光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Elegant double exposure blends a pensive man's profile portrait with a misty pine forest, treetops and fog drifting inside his silhouette against white sky, melancholic poetic layering, 10 seconds, 16:9
```

### Datamosh

<p class="ex-meta"><span class="term-zh">数据马赛克</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A dancer hits the beat drop and the frame erupts in datamosh corruption, pixels smearing and melting into glitched motion trails, colors bleeding chaotically, raw digital energy, 10 seconds, 16:9
```

### Kaleidoscope

<p class="ex-meta"><span class="term-zh">万花筒</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Overhead kaleidoscope symmetry multiplies a troupe of dancers into shifting mirrored mandala patterns, costumes blooming like folding flowers with each choreographed move, hypnotic Busby Berkeley geometry, 10 seconds, 16:9
```

### Morphing

<p class="ex-meta"><span class="term-zh">变形过渡</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Seamless morphing transforms one face through four generations, child to teenager to mother to grandmother, features fluidly reshaping under soft studio light, tender meditation on time, 10 seconds, 16:9
```

### Slit scan

<p class="ex-meta"><span class="term-zh">狭缝扫描</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A galloping horse stretches into slit-scan time distortion, its body smeared into flowing temporal ribbons across the frame, mane trailing warped streaks over prairie light, surreal velocity, 10 seconds, 16:9
```

### X-ray

<p class="ex-meta"><span class="term-zh">X 光</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
An x-ray view reveals the inner skeleton of a mechanical hand flexing its fingers, gears and pistons glowing blue-white against black, translucent layers shifting, clinical futuristic precision, 10 seconds, 16:9
```

### Levitation

<p class="ex-meta"><span class="term-zh">悬浮</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Quiet levitation lifts books, teacups and a floor lamp drifting slowly through a sunlit living room, objects rotating weightlessly around an unbothered reading woman, dreamlike domestic magic, 10 seconds, 16:9
```

## 美术指导（Art direction)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Dreamcore` | 梦核 | Liminal, nostalgic, quietly unsettling spaces | `Dreamcore emptiness fills endless pastel hallways under a blown-out overexposed sky, doors leading nowhere, a lone swing swaying without wind, liminal dream logic, quietly unsettling nostalgia, 10 seconds, 16:9` |
| `Dystopian` | 反乌托邦 | Bleak, oppressive futuristic world | `A dystopian megacity glistens under relentless rain, surveillance drones sweeping searchlights across neon-soaked crowds and towering propaganda screens, steam rising from grates, oppressive cyberpunk gloom, 10 seconds, 16:9` |
| `Magical realism` | 魔幻现实 | Gentle magic within an ordinary scene | `Gentle magical realism fills an ordinary corner café where paper lanterns float freely above chatting customers, drifting between tables as waiters ignore them, warm everyday enchantment, 10 seconds, 16:9` |
| `Maximalism` | 极繁 | Dense, ornate, overloaded set design | `Opulent maximalism crowds a baroque salon with gilded mirrors, stacked oil paintings, velvet drapes, marble busts and cascading flowers, camera slowly gliding through ornate sensory overload, 10 seconds, 16:9` |
| `Diorama` | 立体模型景 | Tilt-shift miniature model world | `A charming diorama miniature small town awakens, tilt-shift model railways, tiny felt cars and handcrafted houses under warm lamp lighting, camera craning over the scale-model streets, whimsical, 10 seconds, 16:9` |

### Dreamcore

<p class="ex-meta"><span class="term-zh">梦核</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Dreamcore emptiness fills endless pastel hallways under a blown-out overexposed sky, doors leading nowhere, a lone swing swaying without wind, liminal dream logic, quietly unsettling nostalgia, 10 seconds, 16:9
```

### Dystopian

<p class="ex-meta"><span class="term-zh">反乌托邦</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A dystopian megacity glistens under relentless rain, surveillance drones sweeping searchlights across neon-soaked crowds and towering propaganda screens, steam rising from grates, oppressive cyberpunk gloom, 10 seconds, 16:9
```

### Magical realism

<p class="ex-meta"><span class="term-zh">魔幻现实</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Gentle magical realism fills an ordinary corner café where paper lanterns float freely above chatting customers, drifting between tables as waiters ignore them, warm everyday enchantment, 10 seconds, 16:9
```

### Maximalism

<p class="ex-meta"><span class="term-zh">极繁</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Opulent maximalism crowds a baroque salon with gilded mirrors, stacked oil paintings, velvet drapes, marble busts and cascading flowers, camera slowly gliding through ornate sensory overload, 10 seconds, 16:9
```

### Diorama

<p class="ex-meta"><span class="term-zh">立体模型景</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A charming diorama miniature small town awakens, tilt-shift model railways, tiny felt cars and handcrafted houses under warm lamp lighting, camera craning over the scale-model streets, whimsical, 10 seconds, 16:9
```

## 动画与媒介（Animation)

| 术语 | 中文说明 | 官方 description | 官方 example prompt |
|---|---|---|---|
| `Stop motion` | 定格动画 | Handmade frame-by-frame claymation | `Playful stop motion claymation shows a breakfast table setting itself, plasticine toast hopping onto plates, clay butter spreading in jerky handmade frames, fingerprint textures visible, cozy charm, 10 seconds, 16:9` |
| `Pixel art` | 像素艺术 | Retro low-res 16-bit aesthetic | `Retro pixel art depicts a 16-bit city at sunset, dithered orange gradients behind blocky skyscrapers, tiny sprite pedestrians crossing streets, animated neon signs flickering, nostalgic SNES atmosphere, 10 seconds, 16:9` |
| `Zoetrope` | 西洋镜 | Pre-cinema spinning-drum animation | `A spinning zoetrope drum flickers galloping horse sprites to life through its slits, warm workshop lamplight strobing the painted figures into fluid motion, Victorian pre-cinema wonder, 10 seconds, 16:9` |
| `Kinetic typography` | 动态字体 | Animated text as the main visual | `Kinetic typography builds a city skyline from animated words, letters stacking into skyscrapers, sentences flowing as traffic below, bold type rising against dusk gradient, energetic motion-graphic design, 10 seconds, 16:9` |

### Stop motion

<p class="ex-meta"><span class="term-zh">定格动画</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Playful stop motion claymation shows a breakfast table setting itself, plasticine toast hopping onto plates, clay butter spreading in jerky handmade frames, fingerprint textures visible, cozy charm, 10 seconds, 16:9
```

### Pixel art

<p class="ex-meta"><span class="term-zh">像素艺术</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Retro pixel art depicts a 16-bit city at sunset, dithered orange gradients behind blocky skyscrapers, tiny sprite pedestrians crossing streets, animated neon signs flickering, nostalgic SNES atmosphere, 10 seconds, 16:9
```

### Zoetrope

<p class="ex-meta"><span class="term-zh">西洋镜</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
A spinning zoetrope drum flickers galloping horse sprites to life through its slits, warm workshop lamplight strobing the painted figures into fluid motion, Victorian pre-cinema wonder, 10 seconds, 16:9
```

### Kinetic typography

<p class="ex-meta"><span class="term-zh">动态字体</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>

```text
Kinetic typography builds a city skyline from animated words, letters stacking into skyscrapers, sentences flowing as traffic below, bold type rising against dusk gradient, energetic motion-graphic design, 10 seconds, 16:9
```
