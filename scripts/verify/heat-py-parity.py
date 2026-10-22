#!/usr/bin/env python3
"""Opt-in Python check for the py↔JS heat/spark parity fixture.

Not a verify:ia registry gate (this file is .py; the glob only loads .mjs
that export verify()). CI stays green on the JS side via heat.test.mjs.

Feeds:
  python3 scripts/verify/heat-py-parity.py
  python3 scripts/verify/heat-py-parity.py --fixture scripts/engine/__samples__/heat-parity/cases.json
  python3 scripts/verify/heat-py-parity.py --json

Implements the heat48h.py *subset* used by this fixture (left-open 48h
window, banker's round, unrounded ±0.1 trend, owner:/source: keys, UTC
hour spark). Does not import World/l4lib and does not call the box script.

TODO (full 10–12h align, not this slice):
  - Port site-data/heat48h.py onto the JS contract (closed window, half-up,
    trend after rounding, participantKeyFromReport / written participant_key).
  - Point HEAT48H_PY at the ported script and compare through that entry
    instead of this subset.
  - Retire site-data/align_hot_sparks_to_js.mjs.
  - Bring timeline_fallback / cover_preserve into this repo.

Exit: 0 when each case's computed Python fields match fixture.python
(documented diffs vs JS do not fail). 1 when the fixture is stale vs this
subset. 2 on usage / IO errors.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

WINDOW_H = 48
HALF_LIFE_H = 24
SPARK_H = 24
WEIGHTS = {"editorial": 1.0, "signal": 1.0}

HERE = Path(__file__).resolve()
DEFAULT_FIXTURE = HERE.parents[1] / "engine" / "__samples__" / "heat-parity" / "cases.json"


def parse_iso(value):
    if value is None:
        return None
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def idx(raw: float) -> float:
    """heat48h.py: round(raw*100)/10 — Python 3 banker's round."""
    return round(raw * 100) / 10


def python_key(row: dict) -> str:
    owner = row.get("owner")
    if owner:
        return f"owner:{owner}"
    key = row.get("participant_key") or row.get("source_id") or row.get("name") or ""
    return f"source:{key}" if key else ""


def as_signal(row: dict) -> dict | None:
    t = parse_iso(row.get("lastAt") or row.get("publishedAt") or row.get("published_at"))
    key = python_key(row)
    if t is None or not key:
        return None
    kind = row.get("kind") if row.get("kind") in ("editorial", "signal") else "editorial"
    first = parse_iso(row.get("firstAt") or row.get("first_at")) or t
    return {"key": key, "kind": kind, "t": t, "first": first, "name": row.get("name") or key}


def heat_at(sigs, at, weights=WEIGHTS):
    last = {}
    for s in sigs:
        if at - timedelta(hours=WINDOW_H) < s["t"] <= at and (s["key"] not in last or s["t"] > last[s["key"]]["t"]):
            last[s["key"]] = s
    raw = sum(weights[s["kind"]] * 0.5 ** ((at - s["t"]).total_seconds() / 3600 / HALF_LIFE_H) for s in last.values())
    return raw, last


def spark_for(sigs, at):
    end = at.replace(minute=0, second=0, microsecond=0)
    points = []
    for k in range(SPARK_H + 1):
        hr = end - timedelta(hours=SPARK_H - k)
        raw, last = heat_at(sigs, hr)
        points.append(idx(raw) if last else None)
    return points


def trend_of(heat, heat6):
    if heat6 is None or heat6 <= 0:
        return "new", None
    ratio = (heat - heat6) / heat6
    trend_pct = round(ratio * 1000) / 10
    if ratio > 0.1:
        return "up", trend_pct
    if ratio < -0.1:
        return "down", trend_pct
    return "flat", trend_pct


def run_case(spec: dict) -> dict:
    if spec.get("mode") == "trendOf":
        heat = spec["curHeat"]
        heat6 = spec["prevHeat"]
        trend, trend_pct = trend_of(heat, heat6)
        return {
            "heat": heat,
            "prevHeat": heat6,
            "trend": trend,
            "trendPct": trend_pct,
            "sparkLast": None,
            "participantCount": 0,
            "heatEqualsSparkEndpoint": None,
        }
    if spec.get("mode") == "displayHeat":
        heat = idx(spec["raw"])
        return {"heat": heat, "displayHeatOfRaw": heat, "sparkLast": None, "participantCount": 0}

    at = parse_iso(spec["at"])
    sigs = [s for s in (as_signal(row) for row in spec.get("participants") or []) if s]
    raw, last = heat_at(sigs, at)
    heat = idx(raw) if last else 0
    raw6, last6 = heat_at(sigs, at - timedelta(hours=6))
    heat6 = idx(raw6) if last6 else 0
    trend, trend_pct = trend_of(heat, heat6)
    spark = spark_for(sigs, at)
    spark_last = spark[-1]
    out = {
        "heat": heat,
        "sparkLast": spark_last,
        "participantCount": len(last),
        "keys": list(dict.fromkeys(python_key(row) for row in spec.get("participants") or [] if python_key(row))),
        "keysInWindow": sorted(last),
        "trend": trend,
        "trendPct": trend_pct,
        "prevHeat": heat6,
        "heatEqualsSparkEndpoint": heat == spark_last,
    }
    if spec.get("raw") is not None:
        out["displayHeatOfRaw"] = idx(spec["raw"])
    return out


def close(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) < 1e-9
    return a == b


def same_list(a, b):
    return list(a or []) == list(b or [])


def compare_python(expected: dict, got: dict) -> list[str]:
    issues = []
    for key in ("heat", "sparkLast", "participantCount", "trend", "trendPct", "prevHeat", "displayHeatOfRaw", "heatEqualsSparkEndpoint"):
        if key not in expected:
            continue
        if not close(expected[key], got.get(key)):
            issues.append(f"{key}: expected {expected[key]!r} got {got.get(key)!r}")
    if "keysInWindow" in expected and not same_list(sorted(expected["keysInWindow"]), sorted(got.get("keysInWindow") or [])):
        issues.append(f"keysInWindow: expected {expected['keysInWindow']!r} got {got.get('keysInWindow')!r}")
    if "keys" in expected and not same_list(expected["keys"], got.get("keys") or []):
        issues.append(f"keys: expected {expected['keys']!r} got {got.get('keys')!r}")
    return issues


def known_diff_fields(spec: dict, got: dict) -> list[str]:
    js = spec.get("js") or {}
    diffs = []
    for key in spec.get("knownDiffs") or []:
        if key == "keysInWindow":
            continue
        if key in js and key in got and not close(js[key], got[key]) and not same_list(js.get(key) if isinstance(js.get(key), list) else None, got.get(key) if isinstance(got.get(key), list) else None):
            diffs.append(key)
        elif key in js and key in got and js[key] != got[key]:
            diffs.append(key)
    return diffs


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fixture", default=str(DEFAULT_FIXTURE), help="parity fixture JSON")
    ap.add_argument("--json", action="store_true", help="print machine-readable result")
    args = ap.parse_args(argv)

    if os.getenv("HEAT48H_PY"):
        print(
            "TODO: HEAT48H_PY is set but this slice does not import heat48h.py "
            f"({os.getenv('HEAT48H_PY')}). Using the in-file subset. Full port is follow-on.",
            file=sys.stderr,
        )

    path = Path(args.fixture)
    try:
        fixture = json.loads(path.read_text(encoding="utf-8"))
    except OSError as err:
        print(f"heat-py-parity: cannot read {path}: {err}", file=sys.stderr)
        return 2

    rows = []
    ok = True
    for spec in fixture.get("cases") or []:
        got = run_case(spec)
        issues = compare_python(spec.get("python") or {}, got)
        if issues:
            ok = False
        rows.append({
            "id": spec.get("id"),
            "parityStatus": spec.get("parityStatus"),
            "python": got,
            "expected": spec.get("python"),
            "js": spec.get("js"),
            "matchPythonExpected": not issues,
            "issues": issues,
            "knownDiffs": spec.get("knownDiffs") or [],
            "observedJsDiffs": known_diff_fields(spec, got),
        })

    result = {
        "ok": ok,
        "skipped": False,
        "fixture": str(path),
        "ruleVersion": fixture.get("ruleVersion"),
        "pythonProducer": fixture.get("pythonProducer"),
        "cases": rows,
        "note": "Documented js≠python diffs do not fail. Stale fixture.python does.",
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        status = "ok" if ok else "FAIL"
        print(f"heat-py-parity {status} {len(rows)} case(s) vs {path}")
        for row in rows:
            mark = "ok" if row["matchPythonExpected"] else "STALE"
            diffs = ",".join(row["knownDiffs"]) or "none"
            print(f"  {mark} {row['id']} python-vs-js documented diffs: {diffs}")
            for issue in row["issues"]:
                print(f"    {issue}")
        if not ok:
            print("fixture.python is stale vs heat48h.py subset; update cases.json")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
