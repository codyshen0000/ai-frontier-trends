#!/usr/bin/env python3
"""timeline_fallback fills an empty event timeline from the event title."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from timeline_fallback import report_view_from_event_title, timeline_fallback_views  # noqa: E402


class TimelineFallback(unittest.TestCase):
    def test_skips_member_without_timestamp(self):
        self.assertIsNone(report_view_from_event_title("x", "T", {}, selected=False))

    def test_builds_views_from_event_title(self):
        metas = {
            "a": {
                "source_name": "公开实验室",
                "published_at": "2026-10-19T11:00:00.000Z",
                "url": "https://example.invalid/a",
                "tier": "T1",
            },
            "b": {
                "source_name": "复现笔记",
                "collected_at": "2026-10-19T12:00:00.000Z",
                "evidence_grade": "一手",
            },
        }
        log = []
        views = timeline_fallback_views(
            "2026-10-19-synthetic-empty-timeline",
            "SYNTHETIC · 事件标题",
            ["a", "b", "no-time"],
            source_meta_fn=metas.get,
            is_selected_fn=lambda iid: iid == "a",
            log_fn=lambda kind, msg: log.append((kind, msg)),
        )
        self.assertEqual(len(views), 2)
        self.assertEqual(views[0]["title"], "SYNTHETIC · 事件标题")
        self.assertEqual(views[0]["id"], "a")
        self.assertTrue(views[0]["selected"])
        self.assertTrue(views[0]["source"]["firstParty"])
        self.assertEqual(views[0]["originalUrl"], "https://example.invalid/a")
        self.assertIsNone(views[1]["summary"])
        self.assertTrue(views[1]["source"]["firstParty"])
        self.assertEqual(log[0][0], "timeline_fallback")
        self.assertIn("2 views", log[0][1])

    def test_empty_members_yields_empty(self):
        self.assertEqual(timeline_fallback_views("e", "T", [], lambda _: {}, lambda _: False), [])


if __name__ == "__main__":
    unittest.main()
