#!/usr/bin/env python3
"""timeline_fallback (#46/#53 / Task #57).

Per-report title grounding can drop every view while the event title (checked
against the union corpus) still publishes. That leaves hot NO.01 with an empty
timeline and fails b2-hot-recompute.

Fall back to the event title + source published_at so heat can recompute and
the event page is not empty.
"""
from __future__ import annotations

from datetime import datetime, timezone


def iso_z(value):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return str(value)


def is_first_party(meta: dict) -> bool:
    return meta.get("evidence_grade") == "一手" or meta.get("tier") == "T1" or bool(meta.get("firstParty"))


def report_view_from_event_title(iid, title, meta: dict, *, selected: bool) -> dict | None:
    t = meta.get("published_at") or meta.get("collected_at") or meta.get("publishedAt")
    if not t:
        return None
    view = {
        "id": iid,
        "title": title,
        "summary": None,
        "source": {
            "name": meta.get("source_name") or meta.get("name") or "",
            "firstParty": is_first_party(meta),
        },
        "publishedAt": iso_z(t),
        "selected": bool(selected),
    }
    url = meta.get("url") or meta.get("originalUrl")
    if url:
        view["originalUrl"] = url
    return view


def timeline_fallback_views(eid, title, members, source_meta_fn, is_selected_fn, log_fn=None) -> list[dict]:
    """Build timeline views from the event title when report titles were dropped."""
    views = []
    for iid in members or []:
        meta = source_meta_fn(iid) or {}
        view = report_view_from_event_title(iid, title, meta, selected=bool(is_selected_fn(iid)))
        if view:
            views.append(view)
    if views and log_fn:
        log_fn("timeline_fallback", f"{eid}: {len(views)} views from event title (report titles ungrounded)")
    return views
