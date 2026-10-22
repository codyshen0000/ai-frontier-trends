#!/usr/bin/env python3
"""export_site_data.py wires timeline_fallback + cover_preserve (no l4 required)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
import export_site_data as exp  # noqa: E402
from cover_preserve import preserve_covers  # noqa: E402
from timeline_fallback import timeline_fallback_views  # noqa: E402


class ExportPatchesWired(unittest.TestCase):
    def test_exporter_imports_without_l4(self):
        self.assertFalse(exp.HAS_L4)
        self.assertIs(exp.timeline_fallback_views, timeline_fallback_views)
        self.assertTrue(callable(exp.apply_cover_preserve))
        self.assertTrue(callable(exp.preserve_covers if hasattr(exp, "preserve_covers") else preserve_covers))

    def test_apply_cover_preserve_uses_files_tuple_shape(self):
        import tempfile
        import json
        with tempfile.TemporaryDirectory() as tmp:
            tip = Path(tmp)
            (tip / "hot.json").write_text(json.dumps({
                "entries": [{"story": {"publicId": "e1"}, "cover": {"url": "assets/covers/x.webp", "alt": "x"}}],
            }), encoding="utf-8")
            files = {
                "hot.json": ("hot", {"entries": [{"story": {"publicId": "e1"}, "cover": None}]}),
            }
            kept = exp.apply_cover_preserve(files, tip, [])
            self.assertIn("hot.json:e1", kept)
            self.assertEqual(files["hot.json"][1]["entries"][0]["cover"]["url"], "assets/covers/x.webp")

    def test_cli_without_l4_exits_2(self):
        self.assertEqual(exp.main([]), 2)


if __name__ == "__main__":
    unittest.main()
