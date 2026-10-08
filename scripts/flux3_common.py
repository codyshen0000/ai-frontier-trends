"""Shared extractors for FLUX 3 pages. Official text only; no invented prompts."""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIT = Path("/tmp/flux3-audit")
DOCS = AUDIT / "docs"
DATA = Path(__file__).resolve().parent / "data" / "flux3"

PAGE_URL = {
    "api-reference_utility_generate-an-image-with-flux-3": "https://docs.bfl.ml/api-reference/utility/generate-an-image-with-flux-3",
    "api-reference_utility_generate-a-video-with-flux-3": "https://docs.bfl.ml/api-reference/utility/generate-a-video-with-flux-3",
    "cookbook_video_edit_recast_continue": "https://docs.bfl.ml/cookbook/video_edit_recast_continue",
    "cookbook_video_multishot_films": "https://docs.bfl.ml/cookbook/video_multishot_films",
    "cookbook_video_quickstart": "https://docs.bfl.ml/cookbook/video_quickstart",
    "cookbook_video_start_from_images": "https://docs.bfl.ml/cookbook/video_start_from_images",
    "flux_3_flux3_image_bounding_boxes": "https://docs.bfl.ml/flux_3/flux3_image_bounding_boxes",
    "flux_3_flux3_image_generate": "https://docs.bfl.ml/flux_3/flux3_image_generate",
    "flux_3_flux3_image_layout": "https://docs.bfl.ml/flux_3/flux3_image_layout",
    "flux_3_flux3_image_overview": "https://docs.bfl.ml/flux_3/flux3_image_overview",
    "flux_3_flux3_overview": "https://docs.bfl.ml/flux_3/flux3_overview",
    "flux_3_flux3_video": "https://docs.bfl.ml/flux_3/flux3_video",
    "guides_prompting_editing_multi_reference": "https://docs.bfl.ml/guides/prompting_editing_multi_reference",
    "guides_prompting_editing_overview": "https://docs.bfl.ml/guides/prompting_editing_overview",
    "guides_prompting_editing_single_reference": "https://docs.bfl.ml/guides/prompting_editing_single_reference",
    "guides_prompting_layout": "https://docs.bfl.ml/guides/prompting_layout",
    "guides_prompting_summary": "https://docs.bfl.ml/guides/prompting_summary",
    "guides_prompting_unified_basics": "https://docs.bfl.ml/guides/prompting_unified_basics",
    "guides_prompting_unified_building": "https://docs.bfl.ml/guides/prompting_unified_building",
    "guides_prompting_unified_reference": "https://docs.bfl.ml/guides/prompting_unified_reference",
    "guides_prompting_unified_style": "https://docs.bfl.ml/guides/prompting_unified_style",
    "guides_prompting_unified_technical": "https://docs.bfl.ml/guides/prompting_unified_technical",
    "guides_prompting_video_audio": "https://docs.bfl.ml/guides/prompting_video_audio",
    "guides_prompting_video_camera_terms": "https://docs.bfl.ml/guides/prompting_video_camera_terms",
    "guides_prompting_video_editing": "https://docs.bfl.ml/guides/prompting_video_editing",
    "guides_prompting_video_image_to_video": "https://docs.bfl.ml/guides/prompting_video_image_to_video",
    "guides_prompting_video_overview": "https://docs.bfl.ml/guides/prompting_video_overview",
    "guides_prompting_video_text_to_video": "https://docs.bfl.ml/guides/prompting_video_text_to_video",
}

GROUP_META = {
    "shot-sizes": ("Shot sizes", "景别与取景", "shot-sizes-and-framing"),
    "angles": ("Angles", "机位与角度", "camera-angles"),
    "composition": ("Composition", "构图", "composition-techniques"),
    "movements": ("Movements", "运镜", "camera-movements"),
    "focus": ("Focus", "焦点", "focus-techniques"),
    "lenses": ("Lenses", "镜头与光学", "lenses-and-optics"),
    "time": ("Shutter & time", "快门与时间", "shutter-and-time"),
    "lighting": ("Lighting", "光线", "lighting-styles"),
    "transitions": ("Transitions", "转场", "shot-transitions"),
    "pov": ("POV", "主观视角与特殊机位", "pov-and-specialty-rigs"),
    "format": ("Format", "画幅与格式", "aspect-and-format"),
    "vfx": ("VFX", "特效与变形", "vfx-and-transformation"),
    "art-direction": ("Art direction", "美术指导", "art-direction"),
    "animation": ("Animation", "动画与媒介", "animation-and-media"),
}

TERM_ZH = {
    "Macro": "微距：贴近极小主体",
    "Close-up": "特写：脸、质感或单一物体",
    "Medium shot": "中景：人与环境各占一半",
    "Wide shot": "全景：全身加更多环境",
    "Establishing shot": "建立镜头：先交代地点与尺度",
    "Extreme close-up": "大特写：单点细节充满画面",
    "Cowboy shot": "牛仔景：从大腿中段往上",
    "Full shot": "全身景：从头到脚",
    "Two shot": "双人景：两人同框",
    "Aerial": "航拍：从高处俯看场景",
    "Low angle": "仰角：镜头上望，强调体量",
    "High angle": "俯角：镜头下望，压缩或暴露",
    "POV": "主观镜头：从角色眼睛看出去",
    "Over-the-shoulder": "过肩：越过前景人物看动作",
    "Dutch angle": "荷兰角：地平线倾斜，制造不安",
    "Worm's eye": "虫视：极低机位向上看",
    "Bird's eye (top-down)": "鸟瞰：垂直向下",
    "Eye level": "平视：与眼睛同高",
    "Ground level": "贴地：镜头贴地面横看",
    "Profile shot": "侧面：严格侧对主体",
    "Tableau": "舞台式：静止对称的宽构图",
    "Fourth wall": "破第四面墙：直视镜头说话",
    "Object POV": "物体视角：从物件内部看出",
    "Voyeur": "偷窥机位：被遮挡的暗中观察",
    "Leading lines": "引导线：用线条把视线引向主体",
    "Center framing": "居中构图：主体锁在正中",
    "Rule of thirds": "三分法：主体偏置",
    "Symmetry": "对称",
    "Negative space": "负空间：留白压主体",
    "Frame within frame": "框中框",
    "Foreground occlusion": "前景遮挡",
    "Silhouette": "剪影",
    "Reflection framing": "反射构图",
    "Pan": "横摇",
    "Tilt": "俯仰摇",
    "Dolly in": "推轨靠近",
    "Tracking shot": "跟踪镜头",
    "Orbit": "环绕",
    "Crane / boom": "摇臂 / 升降",
    "Handheld": "手持",
    "Whip pan": "甩摇",
    "Dolly zoom": "希区柯克变焦",
    "Steadicam follow": "稳定器跟随",
    "Push through": "穿过前景推进",
    "Snorricam": "胸挂主观",
    "Camera roll": "滚转",
    "Arc shot": "弧线环绕",
    "Pedestal": "升降座",
    "Trucking": "横向移动",
    "Locked-on": "锁死机位",
    "Lazy Susan": "转盘旋转",
    "Shallow depth of field": "浅景深",
    "Deep focus": "深焦",
    "Rack focus": "焦点转移",
    "Split diopter": "分裂屈光",
    "Focus breathing reveal": "呼吸对焦揭示",
    "Tilt shift": "移轴",
    "Wide angle (24mm)": "广角 24mm",
    "Telephoto compression": "长焦压缩",
    "Fisheye": "鱼眼",
    "Anamorphic flares": "变形宽银幕光斑",
    "Macro lens": "微距镜头",
    "Probe lens": "探针镜头",
    "Halation": "光晕",
    "Parallax": "视差",
    "Vignette": "暗角",
    "Slow motion": "慢动作",
    "Speed ramp": "变速坡",
    "Timelapse": "延时",
    "Long exposure look": "长曝光观感",
    "Bullet time": "子弹时间",
    "Freeze frame": "定格",
    "Boomerang": "来回循环",
    "Step printing": "跳帧印片",
    "Fast motion": "快动作",
    "Cinemagraph": "动态静帧",
    "Rim light": "轮廓光",
    "Chiaroscuro": "明暗对照",
    "Golden hour": "黄金时刻",
    "Neon practicals": "现场霓虹",
    "Volumetric light": "体积光",
    "Hard light": "硬光",
    "Haze": "雾霾散射",
    "Spotlight": "聚光",
    "Light flash": "闪光",
    "Projections": "投影光",
    "Underwater light": "水下光",
    "Match cut": "匹配剪辑",
    "Whip transition": "甩摇转场",
    "Foreground wipe": "前景擦除转场",
    "Jump cut": "跳切",
    "Object portal": "物体门洞转场",
    "Pass-through": "穿过转场",
    "Quick cuts": "快切",
    "Screen-in-screen": "画中画",
    "Drone FPV": "穿越机第一人称",
    "Bodycam": "身体相机",
    "Dashcam": "行车记录仪",
    "Mirror POV": "镜面主观",
    "Cinemascope (21:9)": "宽银幕 21:9",
    "Vertical (9:16)": "竖屏 9:16",
    "Vintage (4:3)": "复古 4:3",
    "Split screen": "分屏",
    "Double exposure": "双重曝光",
    "Datamosh": "数据马赛克",
    "Kaleidoscope": "万花筒",
    "Morphing": "变形过渡",
    "Slit scan": "狭缝扫描",
    "X-ray": "X 光",
    "Levitation": "悬浮",
    "Dreamcore": "梦核",
    "Dystopian": "反乌托邦",
    "Magical realism": "魔幻现实",
    "Maximalism": "极繁",
    "Diorama": "立体模型景",
    "Stop motion": "定格动画",
    "Pixel art": "像素艺术",
    "Zoetrope": "西洋镜",
    "Kinetic typography": "动态字体",
}

WORKFLOW_ORDER = [
    ("t2i", "文生图"),
    ("edit-single", "单图编辑"),
    ("edit-multi", "多参考编辑"),
    ("bbox", "bbox 布局 / 局部编辑"),
    ("video-t2v", "视频 · 文生视频"),
    ("video-i2v", "视频 · 图生视频"),
    ("video-v2v", "视频 · 续写"),
    ("video-edit", "视频 · 编辑"),
    ("audio", "对白 / 音频"),
    ("cookbook", "Cookbook"),
    ("other", "其他官方摘录"),
]

PAGE_WORKFLOW = {
    "api-reference_utility_generate-an-image-with-flux-3": "t2i",
    "flux_3_flux3_image_generate": "t2i",
    "flux_3_flux3_image_overview": "t2i",
    "guides_prompting_summary": "t2i",
    "guides_prompting_unified_basics": "t2i",
    "guides_prompting_unified_building": "t2i",
    "guides_prompting_unified_style": "t2i",
    "guides_prompting_unified_reference": "t2i",
    "guides_prompting_unified_technical": "t2i",
    "guides_prompting_editing_overview": "edit-single",
    "guides_prompting_editing_single_reference": "edit-single",
    "guides_prompting_editing_multi_reference": "edit-multi",
    "guides_prompting_layout": "bbox",
    "flux_3_flux3_image_bounding_boxes": "bbox",
    "flux_3_flux3_image_layout": "bbox",
    "guides_prompting_video_text_to_video": "video-t2v",
    "guides_prompting_video_overview": "video-t2v",
    "api-reference_utility_generate-a-video-with-flux-3": "video-t2v",
    "flux_3_flux3_video": "video-t2v",
    "flux_3_flux3_overview": "video-t2v",
    "guides_prompting_video_image_to_video": "video-i2v",
    "guides_prompting_video_editing": "video-edit",
    "guides_prompting_video_audio": "audio",
    "cookbook_video_quickstart": "cookbook",
    "cookbook_video_start_from_images": "cookbook",
    "cookbook_video_edit_recast_continue": "cookbook",
    "cookbook_video_multishot_films": "cookbook",
}

PAGE_TITLE = {
    "api-reference_utility_generate-an-image-with-flux-3": "Image API 参考",
    "api-reference_utility_generate-a-video-with-flux-3": "Video API 参考",
    "cookbook_video_edit_recast_continue": "Cookbook · 重演 / 续写",
    "cookbook_video_multishot_films": "Cookbook · 多镜头",
    "cookbook_video_quickstart": "Cookbook · 视频入门",
    "cookbook_video_start_from_images": "Cookbook · 从静帧开始",
    "flux_3_flux3_image_bounding_boxes": "FLUX 3 Image · bounding boxes",
    "flux_3_flux3_image_generate": "FLUX 3 Image · generate",
    "flux_3_flux3_image_layout": "FLUX 3 Image · layout",
    "flux_3_flux3_image_overview": "FLUX 3 Image 概览",
    "flux_3_flux3_overview": "FLUX 3 总览",
    "flux_3_flux3_video": "FLUX 3 Video",
    "guides_prompting_editing_multi_reference": "多参考编辑指南",
    "guides_prompting_editing_overview": "编辑概览",
    "guides_prompting_editing_single_reference": "单参考编辑指南",
    "guides_prompting_layout": "布局提示词指南",
    "guides_prompting_summary": "提示词一页总览",
    "guides_prompting_unified_basics": "Prompting Basics",
    "guides_prompting_unified_building": "Building a Good Prompt",
    "guides_prompting_unified_reference": "Prompt Reference",
    "guides_prompting_unified_style": "Style, Aesthetics & Text",
    "guides_prompting_unified_technical": "Technical Parameters",
    "guides_prompting_video_audio": "视频音频与对白",
    "guides_prompting_video_editing": "视频编辑指南",
    "guides_prompting_video_image_to_video": "图生视频指南",
    "guides_prompting_video_overview": "视频提示词概览",
    "guides_prompting_video_text_to_video": "文生视频指南",
}

FLUX3_SINGLE_MARKERS = (
    "bottle in a pile of fresh wet strawberries",
    "Recolor only the white and black FUR of the cow",
    'exact text "zum Schlappen"',
    "Change the woman's outfit to a bold fuchsia pink dress",
    "transparent frozen water",
    "Open the owl's eyes naturally",
)

FLUX2_MULTI_MARKERS = (
    "Kodak",
    "underwater",
    "impasto",
    "animal pattern",
    "smoke",
)


def unescape_js(s: str) -> str:
    return bytes(s, "utf-8").decode("unicode_escape") if "\\" in s else s


def extract_camera_terms() -> list[dict]:
    text = (DOCS / "guides_prompting_video_camera_terms.md").read_text()
    match = re.search(r"const CAMERA_TERMS = (\{.*?\});\n", text, re.S)
    if not match:
        raise SystemExit("CAMERA_TERMS not found")
    raw = match.group(1)
    parts = re.split(r'"([a-z0-9-]+)":\s*\[', raw)
    groups = []
    for i in range(1, len(parts), 2):
        key = parts[i]
        content = parts[i + 1]
        items = []
        for term, desc, prompt in re.findall(
            r'term:\s*"((?:\\.|[^"\\])*)",\s*desc:\s*"((?:\\.|[^"\\])*)",\s*prompt:\s*"((?:\\.|[^"\\])*)"',
            content,
        ):
            items.append(
                {
                    "term": unescape_js(term),
                    "desc": unescape_js(desc),
                    "prompt": unescape_js(prompt),
                }
            )
        groups.append({"key": key, "items": items})
    return groups


def read_examples() -> list[dict]:
    path = DATA / "examples_checklist.tsv"
    if not path.exists():
        path = AUDIT / "examples_checklist.tsv"
    rows = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter="\t")
        header = next(reader)
        assert header[:6] == ["page", "kind", "in_cheatsheet", "first_or_dup", "chars", "prompt"]
        for raw in reader:
            if not raw:
                continue
            page, kind, covered, first_or_dup, chars = raw[:5]
            prompt = "\t".join(raw[5:]) if len(raw) > 6 else (raw[5] if len(raw) > 5 else "")
            rows.append(
                {
                    "page": page,
                    "kind": kind,
                    "in_cheatsheet": covered,
                    "first_or_dup": first_or_dup,
                    "chars": chars,
                    "prompt": prompt,
                }
            )
    return rows


def read_checklist() -> list[dict]:
    path = DATA / "checklist.tsv"
    if not path.exists():
        path = AUDIT / "checklist.tsv"
    rows = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        for row in reader:
            rows.append(row)
    return rows


def official_prompt_corpus() -> list[str]:
    blobs = []
    if DOCS.exists():
        for path in DOCS.glob("*.md"):
            blobs.append(path.read_text())
    text = "\n".join(blobs)
    found = []
    for match in re.finditer(r'prompt:\s*"((?:\\.|[^"\\])*)"', text):
        found.append(unescape_js(match.group(1)))
    for match in re.finditer(r'"prompt":\s*"((?:\\.|[^"\\])*)"', text):
        found.append(unescape_js(match.group(1)))
    for match in re.finditer(r"```(?:text|python|bash|javascript)?[^\n]*\n(.*?)```", text, re.S):
        body = match.group(1).strip()
        if 20 <= len(body) <= 20000:
            found.append(body)
    return found


def recover_full_prompt(tsv_prompt: str, corpus: list[str]) -> str:
    needle = tsv_prompt.rstrip()
    if not needle:
        return tsv_prompt
    best = tsv_prompt
    for cand in corpus:
        if cand == needle or cand.startswith(needle):
            if len(cand) > len(best):
                best = cand
            continue
        # truncated mid-token: TSV is a long prefix of cand
        if len(needle) > 80 and cand.startswith(needle[:80]) and len(cand) > len(needle):
            # require high prefix overlap
            n = min(len(needle), len(cand))
            same = 0
            for a, b in zip(needle, cand):
                if a == b:
                    same += 1
                else:
                    break
            if same / n > 0.92 and len(cand) > len(best):
                best = cand
    return best


def norm_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def fence(text: str) -> str:
    ticks = "```"
    while ticks in text:
        ticks += "`"
    return f"{ticks}text\n{text}\n{ticks}"


def model_label(page: str, prompt: str) -> str:
    if page == "guides_prompting_editing_single_reference":
        low = prompt
        if any(m in low for m in FLUX3_SINGLE_MARKERS):
            return "FLUX 3"
        return "FLUX.2"
    if page == "guides_prompting_editing_multi_reference":
        if any(m.lower() in prompt.lower() for m in FLUX2_MULTI_MARKERS):
            return "FLUX.2"
        return ""
    if page.startswith("flux_3_") or page.startswith("api-reference_") or page.startswith("cookbook_"):
        return "FLUX 3"
    if page.startswith("guides_prompting_video_"):
        return "FLUX 3"
    return ""


def one_line_zh(page: str, kind: str, prompt: str) -> str:
    head = prompt.strip().split("\n", 1)[0]
    clip = re.sub(r"\s+", " ", head)[:72]
    kind_zh = {
        "prompt": "官方 prompt",
        "caption": "官方 caption",
        "fence": "文档代码块",
        "py-prompt": "notebook / Python prompt",
        "idea": "官方 idea",
        "record": "编辑 record",
        "chain": "迭代 chain",
        "anatomy": "结构拆解",
        "weak": "弱示例",
        "strong": "强示例",
    }.get(kind, kind)
    page_zh = PAGE_TITLE.get(page, page)
    return f"{page_zh} · {kind_zh}：{clip}"


def slugify(text: str) -> str:
    value = re.sub(r"<[^>]+>", "", text).strip().lower()
    value = value.replace(".", "")
    value = re.sub(r"[^\w\s-]", "", value, flags=re.UNICODE)
    value = re.sub(r"\s+", "-", value)
    return re.sub(r"-+", "-", value)


def dump_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
