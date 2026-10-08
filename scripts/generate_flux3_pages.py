#!/usr/bin/env python3
"""Generate FLUX 3 examples + camera-terms markdown from official audit data."""

from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from flux3_common import (
    GROUP_META,
    PAGE_TITLE,
    PAGE_URL,
    PAGE_WORKFLOW,
    ROOT,
    TERM_ZH,
    WORKFLOW_ORDER,
    extract_camera_terms,
    fence,
    model_label,
    one_line_zh,
    official_prompt_corpus,
    read_examples,
    recover_full_prompt,
    slugify,
)

CONTENT = ROOT / "content"


def write_camera_page() -> list[dict]:
    groups = extract_camera_terms()
    total = sum(len(g["items"]) for g in groups)
    if total != 119:
        raise SystemExit(f"expected 119 camera terms, got {total}")

    toc = "\n".join(
        f'- [{GROUP_META[g["key"]][1]}（{GROUP_META[g["key"]][0]}）](#{GROUP_META[g["key"]][2]})'
        for g in groups
    )
    parts = [
        "# FLUX 3 相机术语表",
        "",
        "整理自 Black Forest Labs 官方 [Examples & Cheatsheet](https://docs.bfl.ml/guides/prompting_video_camera_terms) 页内的 `CAMERA_TERMS` 数据。检索日期：**2026-10-08**。",
        "",
        "共 **119** 个术语、**14** 组。每条含官方英文术语、中文说明、官方 description、官方 example prompt（英文原文）。中文翻译是阅读辅助，不是文档原文。",
        "",
        '<p class="sister-nav">相关页：<a href="../">FLUX 3 提示词速查表</a> · <a href="../examples/">官方示例库</a></p>',
        "",
        '<nav class="page-toc" aria-label="本页目录">',
        "<p>本页目录</p>",
        "",
        toc,
        "",
        "</nav>",
        "",
    ]
    for group in groups:
        en, zh, hid = GROUP_META[group["key"]]
        parts.append(f"## {zh}（{en})")
        parts.append("")
        parts.append("| 术语 | 中文说明 | 官方 description | 官方 example prompt |")
        parts.append("|---|---|---|---|")
        for item in group["items"]:
            term = item["term"].replace("|", "\\|")
            zh_note = TERM_ZH.get(item["term"], item["desc"]).replace("|", "\\|")
            desc = item["desc"].replace("|", "\\|")
            prompt = item["prompt"].replace("|", "\\|").replace("\n", " ")
            parts.append(f"| `{term}` | {zh_note} | {desc} | `{prompt}` |")
        parts.append("")
        # also emit full prompts outside the table so whitespace-normalized match is robust
        for item in group["items"]:
            hid_term = slugify(item["term"])
            parts.append(f'### {item["term"]}')
            parts.append("")
            parts.append(f'<p class="ex-meta"><span class="term-zh">{TERM_ZH.get(item["term"], "")}</span> · 来源：<a href="https://docs.bfl.ml/guides/prompting_video_camera_terms">prompting_video_camera_terms</a> · 模型：<span class="badge">FLUX 3</span></p>')
            parts.append("")
            parts.append(fence(item["prompt"]))
            parts.append("")
    (CONTENT / "flux3-camera-terms.md").write_text("\n".join(parts), encoding="utf-8")
    return groups


def write_examples_page() -> list[dict]:
    rows = read_examples()
    corpus = official_prompt_corpus()
    usable = [r for r in rows if r["page"] != "guides_prompting_video_camera_terms"]
    # keep all rows (first + dup) so each source page lists its prompts
    grouped: dict[str, list[dict]] = defaultdict(list)
    for idx, row in enumerate(usable, start=1):
        full = recover_full_prompt(row["prompt"], corpus)
        row = {
            **row,
            "full": full,
            "ex_id": f"ex-{idx:03d}",
            "label": model_label(row["page"], full or row["prompt"]),
            "zh": one_line_zh(row["page"], row["kind"], full or row["prompt"]),
            "workflow": PAGE_WORKFLOW.get(row["page"], "other"),
        }
        grouped[row["page"]].append(row)

    toc_lines = []
    for wf_id, wf_title in WORKFLOW_ORDER:
        pages = [p for p, items in grouped.items() if items and items[0]["workflow"] == wf_id]
        if not pages:
            continue
        toc_lines.append(f"- [{wf_title}](#{slugify(wf_title)})")
        for page in pages:
            toc_lines.append(f'  - [{PAGE_TITLE.get(page, page)}](#{slugify(PAGE_TITLE.get(page, page))})')

    parts = [
        "# FLUX 3 官方示例库",
        "",
        "全部官方示例 prompt 来自 2026-10-08 抓取的 [BFL 文档](https://docs.bfl.ml/llms.txt)。**英文保持原文**；相机术语的 119 条示例在 [相机术语表](../camera-terms/)。",
        "",
        "每条含一行中文说明、文档若标明则给出模型标签（FLUX 3 / FLUX.2）、以及来源链接。中文说明是阅读辅助，不是官方原文。",
        "",
        '<p class="sister-nav">相关页：<a href="../">FLUX 3 提示词速查表</a> · <a href="../camera-terms/">相机术语表</a></p>',
        "",
        '<nav class="page-toc" aria-label="本页目录">',
        "<p>本页目录</p>",
        "",
        "\n".join(toc_lines),
        "",
        "</nav>",
        "",
    ]

    emitted = []
    for wf_id, wf_title in WORKFLOW_ORDER:
        pages = [p for p in grouped if grouped[p] and grouped[p][0]["workflow"] == wf_id]
        if not pages:
            continue
        parts.append(f"## {wf_title}")
        parts.append("")
        for page in pages:
            items = grouped[page]
            title = PAGE_TITLE.get(page, page)
            url = PAGE_URL.get(page, "https://docs.bfl.ml/llms.txt")
            parts.append(f"### {title}")
            parts.append("")
            parts.append(f"来源：[{page}]({url})")
            parts.append("")
            for item in items:
                label = f' · 模型：<span class="badge">{item["label"]}</span>' if item["label"] else ""
                kind = item["kind"]
                parts.append(f'#### {item["zh"]}')
                parts.append("")
                parts.append(
                    f'<p class="ex-meta" id="{item["ex_id"]}">类型：{kind}{label} · <a href="{url}">来源</a></p>'
                )
                parts.append("")
                parts.append(fence(item["full"]))
                parts.append("")
                if item["full"] != item["prompt"] and item["prompt"] not in item["full"]:
                    parts.append("<p class=\"ex-meta\">清单摘录（与文档对照用）：</p>")
                    parts.append("")
                    parts.append(fence(item["prompt"]))
                    parts.append("")
                emitted.append(item)
    (CONTENT / "flux3-examples.md").write_text("\n".join(parts), encoding="utf-8")
    return emitted


def main() -> None:
    CONTENT.mkdir(parents=True, exist_ok=True)
    groups = write_camera_page()
    examples = write_examples_page()
    print(f"camera terms {sum(len(g['items']) for g in groups)}")
    print(f"example rows written {len(examples)}")


if __name__ == "__main__":
    main()
