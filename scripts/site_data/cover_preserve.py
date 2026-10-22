"""#53 v1 cover durability: a full site-data sync must not wipe same-origin covers already on the engine-data tip.

Rule: when the new value of `cover` is empty/absent or not same-origin (not `assets/covers/...`), and the previous
tip file at the same path carries a same-origin cover for the same story, keep the previous cover.
Scope: hot.json NO.01 (matched by story.publicId; v5 keeps covers only on NO.01), events/<id>.json,
daily.json and daily/<day>.json top-level `cover`. Never invents a cover; never keeps a remote URL.
"""
import json
from pathlib import Path

SAME_ORIGIN_PREFIX = "assets/covers/"


def is_same_origin(cover):
    return isinstance(cover, dict) and str(cover.get("url") or "").startswith(SAME_ORIGIN_PREFIX)


def _load(prev_dir, name):
    f = Path(prev_dir) / name
    try:
        return json.loads(f.read_text())
    except (OSError, ValueError):
        return None


def _hot_lead_id(obj):
    e = ((obj or {}).get("entries") or [None])[0] or {}
    return (e.get("story") or {}).get("publicId"), e


def preserve_covers(files, prev_dir, log=None):
    """files: {relative name: obj}. Mutates in place. Returns list of names whose cover was preserved."""
    kept = []
    if not prev_dir or not Path(prev_dir).is_dir():
        return kept
    for name, obj in files.items():
        if not isinstance(obj, dict):
            continue
        prev = _load(prev_dir, name)
        if not isinstance(prev, dict):
            continue
        if name == "hot.json":
            nid, ne = _hot_lead_id(obj)
            pid, pe = _hot_lead_id(prev)
            if nid and nid == pid and not is_same_origin(ne.get("cover")) and is_same_origin(pe.get("cover")):
                ne["cover"] = pe["cover"]
                kept.append(name)
        elif name.startswith("events/") or name == "daily.json" or name.startswith("daily/"):
            same = (obj.get("publicId") == prev.get("publicId")) if name.startswith("events/") else (obj.get("key", name) == prev.get("key", name))
            if same and not is_same_origin(obj.get("cover")) and is_same_origin(prev.get("cover")):
                obj["cover"] = prev["cover"]
                kept.append(name)
    if log:
        for n in kept:
            log("cover_preserved", f"{n}: kept same-origin cover from previous tip")
    return kept
