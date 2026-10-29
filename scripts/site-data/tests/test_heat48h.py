#!/usr/bin/env python3
"""heat48h.py matches heat.mjs on the shared parity fixture."""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from heat48h import HOT_LIMIT, display_heat, hours_in_window, parse_iso, run_parity_case  # noqa: E402

FIXTURE = HERE.parent / "engine" / "__samples__" / "heat-parity" / "cases.json"


class Heat48hParity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.by_id = {c["id"]: c for c in cls.fixture["cases"]}

    def test_every_case_matches_js(self):
        for spec in self.fixture["cases"]:
            got = run_parity_case(spec)
            expected = spec["js"]
            for key in ("heat", "sparkLast", "trend", "trendPct", "participantCount", "heatEqualsSparkEndpoint"):
                if key in expected:
                    self.assertEqual(got.get(key), expected[key], f"{spec['id']} {key}")
            if expected.get("keys"):
                self.assertEqual(got.get("keys"), expected["keys"], spec["id"])
            if spec.get("raw") is not None and "displayHeatOfRaw" in expected:
                self.assertEqual(got["displayHeatOfRaw"], expected["displayHeatOfRaw"], spec["id"])
            self.assertEqual(spec.get("parityStatus"), "pass", spec["id"])
            self.assertFalse(spec.get("knownDiffs"), spec["id"])

    def test_hot_limit_is_top10(self):
        self.assertEqual(HOT_LIMIT, 10)

    def test_closed_48h_window(self):
        at = parse_iso("2026-10-19T12:00:00.000Z")
        edge = parse_iso("2026-10-17T12:00:00.000Z")
        self.assertEqual(hours_in_window(at, edge), 48.0)
        got = run_parity_case(self.by_id["boundary-48h"])
        self.assertEqual(got["heat"], 19.6)
        self.assertEqual(got["participantCount"], 3)

    def test_half_up_not_banker(self):
        self.assertEqual(display_heat(1.445), 14.5)
        got = run_parity_case(self.by_id["rounding-half-up"])
        self.assertEqual(got["displayHeatOfRaw"], 14.5)

    def test_trend_after_round(self):
        up = run_parity_case(self.by_id["trend-plus-10"])
        down = run_parity_case(self.by_id["trend-minus-10"])
        self.assertEqual(up["trend"], "flat")
        self.assertEqual(down["trend"], "flat")

    def test_key_no_owner_prefix(self):
        got = run_parity_case(self.by_id["key-collision"])
        self.assertEqual(got["participantCount"], 3)
        self.assertEqual(got["keys"], ["verge", "verge-nightly", "notes"])

    def test_off_hour_heat_equals_spark_last(self):
        got = run_parity_case(self.by_id["spark-endpoint-off-hour"])
        self.assertEqual(got["heat"], 14.7)
        self.assertEqual(got["sparkLast"], 14.7)
        self.assertTrue(got["heatEqualsSparkEndpoint"])


if __name__ == "__main__":
    unittest.main()
