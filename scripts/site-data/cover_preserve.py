#!/usr/bin/env python3
"""Restore materialized same-origin covers from a previous engine-data tip (#53 / #57).

Export validation stays https-only. After that gate, copy `assets/covers/…`
covers from `--prev-tip` onto this export so a full sync does not drop them.

Used by export_site_data.py and covered by scripts/site-data/tests/test_cover_preserve.py.
"""
from __future__ import annotations

import json
from pathlib import Path

SAME_ORIGIN_PREFIX = "assets/covers/"


def is_same_origin_cover(cover) -> bool:
    return isinstance(cover, dict) and str(cover.get("url") or "").startswith(SAME_ORIGIN_PREFIX)


def overlay_cover(next_obj, prev_obj):
    """Keep prev same-origin cover when next is missing or remote-only."""
    if not isinstance(next_obj, dict) or not isinstance(prev_obj, dict):
        return False
    prev_cover = prev_obj.get("cover")
    next_cover = next_obj.get("cover")
    keep = (not next_cover and prev_cover) or (
        not is_same_origin_cover(next_cover) and is_same_origin_cover(prev_cover)
    )
    if keep:
        next_obj["cover"] = prev_cover
        return True
    return False


def _read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _listed_id(entry) -> str | None:
    if not isinstance(entry, dict):
        return None
    story = entry.get("story") or {}
    return entry.get("publicId") or story.get("publicId") or entry.get("event_id")


def _append_log(log, kind, msg):
    if log is None:
        return
    row = {"kind": kind, "msg": msg}
    if callable(log):
        log(kind, msg)
    elif isinstance(log, list):
        log.append(row)


def preserve_covers(files: dict, prev_tip, log=None) -> list[str]:
    """Overlay same-origin covers from prev_tip onto an in-memory export tree.

    `files` maps relative paths (`hot.json`, `events/<id>.json`, `daily.json`, …)
    to JSON objects (mutated in place). Returns the list of kept targets.
    """
    tip = Path(prev_tip)
    kept: list[str] = []
    if not tip.is_dir():
        _append_log(log, "cover_preserve", f"prev-tip missing: {prev_tip}")
        return kept

    prev_hot = _read_json(tip / "hot.json") or {}
    prev_by_id = {}
    for entry in prev_hot.get("entries") or []:
        pid = _listed_id(entry)
        if pid:
            prev_by_id[pid] = entry

    hot = files.get("hot.json")
    if isinstance(hot, dict):
        for entry in hot.get("entries") or []:
            pid = _listed_id(entry)
            if pid and overlay_cover(entry, prev_by_id.get(pid) or {}):
                kept.append(f"hot.json:{pid}")
                _append_log(log, "cover_preserve", f"hot {pid}: kept same-origin cover")

    prev_daily = _read_json(tip / "daily.json")
    daily = files.get("daily.json")
    if isinstance(daily, dict) and overlay_cover(daily, prev_daily or {}):
        kept.append("daily.json")
        _append_log(log, "cover_preserve", "daily.json: kept same-origin cover")

    events_dir = tip / "events"
    for name, obj in list(files.items()):
        if not name.startswith("events/") or not name.endswith(".json") or name.endswith("index.json"):
            continue
        if not isinstance(obj, dict):
            continue
        prev_event = _read_json(events_dir / Path(name).name)
        if overlay_cover(obj, prev_event or {}):
            kept.append(name)
            _append_log(log, "cover_preserve", f"{name}: kept same-origin cover")
            pid = obj.get("publicId")
            if pid and isinstance(hot, dict):
                for entry in hot.get("entries") or []:
                    if _listed_id(entry) == pid and overlay_cover(entry, {"cover": obj.get("cover")}):
                        tag = f"hot.json:{pid}"
                        if tag not in kept:
                            kept.append(tag)

    return kept
