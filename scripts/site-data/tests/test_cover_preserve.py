#!/usr/bin/env python3
"""cover_preserve keeps same-origin assets/covers from --prev-tip."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from cover_preserve import is_same_origin_cover, overlay_cover, preserve_covers  # noqa: E402


def cover(url, alt="keep"):
    return {"url": url, "width": 800, "height": 400, "alt": alt, "valueClass": "product_screenshot"}


class CoverPreserve(unittest.TestCase):
    def test_same_origin_predicate(self):
        self.assertTrue(is_same_origin_cover(cover("assets/covers/deepseek-v41.webp")))
        self.assertFalse(is_same_origin_cover(cover("https://cdn.example/x.png")))
        self.assertFalse(is_same_origin_cover(None))

    def test_overlay_keeps_tip_when_export_empty_or_remote(self):
        local = cover("assets/covers/a.webp")
        nxt = {"cover": None}
        self.assertTrue(overlay_cover(nxt, {"cover": local}))
        self.assertEqual(nxt["cover"]["url"], "assets/covers/a.webp")
        nxt = {"cover": cover("https://cdn.example/x.png")}
        self.assertTrue(overlay_cover(nxt, {"cover": local}))
        self.assertEqual(nxt["cover"]["url"], "assets/covers/a.webp")

    def test_overlay_does_not_clobber_existing_same_origin(self):
        nxt = {"cover": cover("assets/covers/new.webp")}
        self.assertFalse(overlay_cover(nxt, {"cover": cover("assets/covers/old.webp")}))
        self.assertEqual(nxt["cover"]["url"], "assets/covers/new.webp")

    def test_preserve_hot_and_event_from_prev_tip(self):
        with tempfile.TemporaryDirectory() as tmp:
            tip = Path(tmp) / "tip"
            (tip / "events").mkdir(parents=True)
            pid = "2026-10-19-synthetic-cover"
            local = cover("assets/covers/keep.webp", "keep me")
            (tip / "hot.json").write_text(json.dumps({
                "computedAt": "2026-10-19T12:00:00.000Z",
                "entries": [{"rank": 1, "story": {"publicId": pid}, "cover": local}],
            }), encoding="utf-8")
            (tip / "events" / f"{pid}.json").write_text(json.dumps({
                "publicId": pid, "cover": local,
            }), encoding="utf-8")
            (tip / "daily.json").write_text(json.dumps({
                "title": "daily", "cover": cover("assets/covers/daily.webp"),
            }), encoding="utf-8")

            files = {
                "hot.json": {
                    "entries": [{"rank": 1, "story": {"publicId": pid}, "cover": cover("https://cdn.example/drop.png")}],
                },
                f"events/{pid}.json": {"publicId": pid, "cover": None},
                "daily.json": {"title": "daily", "cover": None},
            }
            log = []
            kept = preserve_covers(files, tip, log)
            self.assertIn(f"hot.json:{pid}", kept)
            self.assertIn(f"events/{pid}.json", kept)
            self.assertIn("daily.json", kept)
            self.assertEqual(files["hot.json"]["entries"][0]["cover"]["url"], "assets/covers/keep.webp")
            self.assertEqual(files[f"events/{pid}.json"]["cover"]["alt"], "keep me")
            self.assertEqual(files["daily.json"]["cover"]["url"], "assets/covers/daily.webp")
            self.assertTrue(any(row["kind"] == "cover_preserve" for row in log))


if __name__ == "__main__":
    unittest.main()
