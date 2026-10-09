# FLUX 3 Image 官方案例包

抓取时间：2026-10-09 09:31:27 CST

来源：Black Forest Labs 文档（Mintlify）。以 [FLUX 3 Image Overview](https://docs.bfl.ml/flux_3/flux3_image_overview) 为主，并覆盖 generate / layout / bounding boxes 与 prompting 相关页。

**未调用** BFL 生成 API；图片为文档 CDN 原字节（未重编码）。Sanity URL 文件名含原始像素尺寸；相对路径 `/images/...` 已解析为 `https://docs.bfl.ml/images/...`。

## 数量

| 类别 | 有图案例 |
|------|----------|
| text-to-image (`t2i`) | 43 |
| edit | 13 |
| multi-reference | 3 |
| layout | 21 |
| **合计** | **80** |

- 图片文件数：99（约 30.9 MB）
- 仅 prompt、无图：0
- Overview 四类 showcase 均已配对：t2i / edit / multi-ref / layout（overview 来源 34 条）

## 目录

- `text-to-image/` `edit/` `multi-reference/` `layout/`：每案例一子目录，含 `prompt.txt`、`meta.json`、原图
- `edit/`：`before.*` + `after.*`（个别历史命名已校正）
- `multi-reference/`：`refN.*` + `result.*`
- `manifest.jsonl`：每行一个案例
- `_raw/`：HTML / 发现用 JSON
- `prompts-only/`：当前为空

## Overview 样例标题

- [t2i] A cemetery on colour infrared film: candy-pink trees and grass, pale headstones,
- [t2i] A crowded pink-tiled public pool seen from above, dozens of swimmers in red, gre
- [t2i] A green-tiled 1970s pedestrian underpass where a model in a silver sequin gown a
- [t2i] A high-speed flash photograph of a plum bursting open as a pebble strikes it, ju
- [t2i] A lone American bison walking past a steaming river in a misty geothermal landsc
- [t2i] A pink salt flat cracked into hexagonal plates, with three flamingos in shallow 
- [t2i] A Schlieren photograph of a person in silhouette exhaling, the breath visible as
- [t2i] A solargraph of an industrial harbour in faded browns and mauves, with dozens of
- [t2i] A split over-under shot of a swimmer in a black cap mid-stroke in dark green lak
- [t2i] Ballet dancers in white tutus performing Swan Lake on a spotlit stage, seen from
- [t2i] Oktoberfest poster grounding comparison
- [edit] Three replacements at once
- [edit] Swap the subject
- [edit] Recolor, keep the text
- [edit] Move a box
- [edit] Recolor two boxes
- [multi_ref] Replace cartridge with van
- [layout] Alphabet poster
- [layout] Concrete arches
- [layout] Three on a bench
- [layout] Cabin, Sauna
- [layout] Dinner by the garden
- [layout] Sixteen layouts
- [layout] Fashion moodboard
- [layout] You'll do everything on time
- [layout] Two tall panels
- [layout] Picnic in the park
- [layout] Portrait grid
- [layout] Four on a rooftop
- [layout] Stippled runner
- [layout] Le Festival du Soleil
- [layout] Winter spectators
- [layout] Tokyo poster
- [layout] Tools, the magazine

## 样例（全包）

- t2i: A cemetery on colour infrared film: candy-pink trees and grass, pale h
- edit: Three replacements at once
- multi_ref: FLUX 3 Image result: a miniature van in place of the cartridge
- layout: Alphabet poster

## 相关源页

- https://docs.bfl.ml/flux_3/flux3_image_overview
- https://docs.bfl.ml/flux_3/flux3_image_generate
- https://docs.bfl.ml/flux_3/flux3_image_layout
- https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes
- https://docs.bfl.ml/guides/prompting_editing_overview
- https://docs.bfl.ml/guides/prompting_editing_single_reference
- https://docs.bfl.ml/guides/prompting_editing_multi_reference
- https://docs.bfl.ml/guides/prompting_layout
- https://docs.bfl.ml/guides/prompting_unified_basics
- https://docs.bfl.ml/guides/prompting_unified_building
- https://docs.bfl.ml/guides/prompting_unified_style
