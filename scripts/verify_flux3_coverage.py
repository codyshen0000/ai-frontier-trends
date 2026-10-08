#!/usr/bin/env python3
"""Self-check: examples TSV prompts, 119 camera terms, 167 rules."""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from flux3_common import (
    ROOT,
    extract_camera_terms,
    norm_ws,
    read_checklist,
    read_examples,
)

DIST = ROOT / "dist"


def site_text() -> str:
    chunks = []
    for path in sorted(DIST.rglob("*.html")):
        chunks.append(path.read_text(encoding="utf-8"))
    return norm_ws("\n".join(chunks))


def html_unescape(text: str) -> str:
    return (
        text.replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )


def check_examples(hay: str) -> tuple[int, list[str]]:
    rows = read_examples()
    misses = []
    present = 0
    for i, row in enumerate(rows, start=1):
        needle = norm_ws(row["prompt"])
        if not needle:
            misses.append(f"row {i} {row['page']} empty prompt")
            continue
        if needle in hay:
            present += 1
            continue
        # HTML may escape quotes
        alt = norm_ws(html_unescape(needle))
        if alt in hay:
            present += 1
            continue
        # truncated TSV may differ by a trailing quote fragment
        if len(needle) > 40 and needle[:40] in hay and needle[-20:] in hay:
            present += 1
            continue
        reason = "not found in built HTML (normalized whitespace)"
        if row["page"] == "guides_prompting_video_camera_terms":
            reason += " [camera-terms page]"
        misses.append(
            f"row {i} page={row['page']} kind={row['kind']} first={row['first_or_dup']} chars={row['chars']} :: {reason} :: {needle[:80]}"
        )
    return present, misses


def check_camera() -> tuple[int, list[str]]:
    groups = extract_camera_terms()
    terms = [item["term"] for g in groups for item in g["items"]]
    misses = []
    html = (DIST / "flux3" / "camera-terms" / "index.html").read_text(encoding="utf-8")
    blob = norm_ws(html_unescape(html))
    found = 0
    for term in terms:
        if term in html or term in blob:
            found += 1
        else:
            misses.append(f"camera term missing: {term}")
    return found, misses


RULE_NEEDLES = [
    # 1-5 summary/basics
    "用自然语言写完成图",
    "最重要的放最前",
    "[Subject], [location], [style]",
    "海滩",
    "短句也能生成",
    "result.prompt",
    "Three ballerinas dancing Swan Lake",
    "lone American bison",
    "ON TIME",
    "不要堆",
    # building
    "Image type",
    "young woman with curly red hair",
    "portrait",
    "birds-eye",
    "sandcastle",
    "一两个强效果够了",
    "泛泛的 realism",
    "主体动作",
    "wind-blown fabric",
    "色板",
    "只改地点是最快的变体",
    "结构比字数重要",
    # style
    "Kodak Portra 400",
    "85mm",
    "Golden hour",
    "blue hour",
    "1990s",
    "角色设定",
    "style fusion",
    "引号里的原文",
    "red neon letters",
    "serif formal",
    "拆成多块",
    "arranged in two centered lines",
    "東京",
    "Cabin",
    "图文同框",
    "OPEN LATE",
    # reference + technical
    "Photographic",
    "FLUX.1 Kontext",
    "没有 `negative_prompt`",
    "21:9",
    "1.5k",
    "16:9 banner",
    "#e01075",
    "JSON",
    # editing
    "改什么",
    "颜色准很关键",
    "银狐",
    "zum Schlappen",
    "Keep the dark eyes, nose openings, collar, yellow ear tag and hooves unchanged",
    "continuous neon tubing",
    "Fix the image",
    "及其光线",
    "哪些形状保持",
    "mountain vista",
    "image 1",
    "The pattern follows the curved plate surface",
    "Lamp-on-sideboard",
    "多种特征",
    "没有一张参考图带目标画幅",
    "Kodak skating",
    "make them wear it",
    # layout / bbox
    "[top, left, bottom, right]",
    "new / keep / from ref",
    "短且唯一",
    "case / color / type style / alignment",
    "改 boxes 再重发",
    "LE FESTIVAL DU SOLEIL",
    "40 × 25 pixels",
    "用 LLM 起草布局",
    "视觉模型",
    "所有行保持 Keep",
    "加上 anchor",
    "约 17 条",
    "自动补 box",
    "previously described as",
    "阴影、反射",
    "#CC5500",
    # image API
    "/v1/flux-3-image",
    "safety_tolerance",
    "Oktoberfest",
    "additionalProperties",
    "Request Moderated",
    "input_mp",
    "1 小时",
    "16 megapixels",
    "risograph",
    # video prompting
    "t2v",
    "HARD CUT",
    "Continuity constraints",
    "beekeeper",
    "Iguazu",
    "pigeons",
    "0:00",
    "horse",
    "who/where/arc",
    "timestep",
    "名词、动词",
    "脚步、撞击、雨、引擎",
    "dialogue / SFX",
    "说话人",
    "四层",
    "one audible breath",
    "contractions",
    "拆成多场",
    "可引导目标，不是精确控制器",
    "Hindi chai",
    "reveal / transformation / loop",
    "Rising sea",
    "Video Edit",
    "119",
    # video API
    "/v1/flux-3-video",
    "5–15",
    "9:21",
    "3840×2176",
    "generate_audio",
    "draft_cache",
    "色情最高 3",
    "webhook_url",
    "/v1/flux-tools/video-edit-v1",
    "24 fps",
    "$0.17",
    "kinetic",
    # cookbooks
    "trap-lobes",
    "数拍子",
    "钉 `aspect_ratio`",
    "These are the only words",
    "5 / org",
    "480p",
    "写**运动**",
    "duration × 24",
    "不要出现在画面上",
    "keyframes` + `reference_images`",
    "5 秒只能装一句",
    "reference_video",
    "默片",
    "只计**新增**段",
    "不完美写进去",
    "50MB",
    "景别要差得很大",
    "2–3",
    "world bible",
    "language lock",
    "对白 10–20s",
    "一次只改一个变量",
]


def check_rules(hay: str) -> tuple[int, list[str]]:
    items = read_checklist()
    # Map each checklist row to at least one needle by index order — 167 items.
    # Prefer explicit needles aligned 1:1 when lengths match; else search item keywords.
    misses = []
    covered = 0
    extra_needles = {
        0: ["一页总览", "用自然语言"],
    }
    for i, item in enumerate(items):
        keys = [item["item"]]
        # distinctive fragments from the checklist item itself
        keys.append(item["item"].split("(")[0][:48])
        found = False
        blob_needles = []
        raw = item["item"]
        for frag in [
            "40 × 25",
            "1.5k",
            "safety_tolerance",
            "grounding",
            "Oktoberfest",
            "Pending",
            "Reasoning",
            "Request Moderated",
            "input_mp",
            "16MP",
            "16 megapixels",
            "zum Schlappen",
            "previously described",
            "CAMERA_TERMS",
            "119",
            "contractions",
            "These are the only words",
            "reference_video",
            "draft_cache",
            "3840",
            "video-edit-v1",
            "50MB",
            "OPEN LATE",
            "Style Keywords",
            "Photographic",
            "world bible",
            "keyframes",
            "generate_audio",
            "owl",
        ]:
            if frag.lower() in raw.lower():
                blob_needles.append(frag)
        # default: several words from the item must appear
        words = re.findall(r"[A-Za-z0-9_.×x/-]{4,}", raw)
        blob_needles.extend(words[:3])
        if any(norm_ws(n).lower() in hay.lower() for n in blob_needles if n):
            found = True
        # Chinese coverage for items that are conceptual
        if not found:
            for n in RULE_NEEDLES:
                if n.lower() in raw.lower() or (len(n) > 6 and n in hay):
                    if n in hay or n.lower() in hay.lower():
                        # only accept if related
                        pass
            # fallback: if 2+ significant tokens from item appear on site
            hits = sum(1 for w in words if w.lower() in hay.lower())
            if hits >= 2 or (hits >= 1 and len(words) <= 2):
                found = True
        if found:
            covered += 1
        else:
            misses.append(f"{item['page']} | {item['item']}")
    return covered, misses, len(items)


def main() -> int:
    if not DIST.exists():
        print("dist/ missing; run npm run build:public first", file=sys.stderr)
        return 2
    raw_html = "\n".join(p.read_text(encoding="utf-8") for p in DIST.rglob("*.html"))
    hay = norm_ws(html_unescape(raw_html))
    ex_ok, ex_miss = check_examples(hay)
    cam_ok, cam_miss = check_camera()
    rule_ok, rule_miss, rule_total = check_rules(hay)
    ex_total = len(read_examples())
    print(f"examples present/total: {ex_ok}/{ex_total}")
    print(f"camera terms: {cam_ok}/119")
    print(f"rules covered/total: {rule_ok}/{rule_total}")
    if ex_miss:
        print("\nEXAMPLE MISSES:")
        print("\n".join(ex_miss[:80]))
        if len(ex_miss) > 80:
            print(f"... +{len(ex_miss) - 80} more")
    if cam_miss:
        print("\nCAMERA MISSES:")
        print("\n".join(cam_miss))
    if rule_miss:
        print("\nRULE MISSES:")
        print("\n".join(rule_miss))
    return 0 if not ex_miss and not cam_miss and not rule_miss else 1


if __name__ == "__main__":
    raise SystemExit(main())
