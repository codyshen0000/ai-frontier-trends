#!/usr/bin/env python3
"""py↔JS heat/spark parity — runs the in-repo heat48h.py port of heat.mjs.

CI / verify:ia (`b2-heat-parity.mjs`) call this. Exit 0 when each case matches
fixture.python **and** fixture.js (aligned). Remaining intentional gaps go in
knownDiffs / contractNote; none are expected after Task #57.

  python3 scripts/verify/heat-py-parity.py
  python3 scripts/verify/heat-py-parity.py --json
  HEAT48H_PY=scripts/site-data/heat48h.py python3 scripts/verify/heat-py-parity.py
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
DEFAULT_FIXTURE = HERE.parents[1] / "engine" / "__samples__" / "heat-parity" / "cases.json"
DEFAULT_HEAT48H = HERE.parents[1] / "site-data" / "heat48h.py"


def load_heat48h(path: Path):
    spec = importlib.util.spec_from_file_location("heat48h_parity", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


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


def compare(expected: dict, got: dict) -> list[str]:
    issues = []
    for key in ("heat", "sparkLast", "exactHeat", "participantCount", "trend", "trendPct", "prevHeat", "displayHeatOfRaw", "heatEqualsSparkEndpoint"):
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
        if key in js and key in got and not close(js[key], got[key]):
            diffs.append(key)
    return diffs


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fixture", default=str(DEFAULT_FIXTURE))
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--heat48h", default=os.getenv("HEAT48H_PY") or str(DEFAULT_HEAT48H))
    args = ap.parse_args(argv)

    heat_path = Path(args.heat48h)
    try:
        heat = load_heat48h(heat_path)
    except Exception as err:
        print(f"heat-py-parity: cannot import {heat_path}: {err}", file=sys.stderr)
        return 2

    path = Path(args.fixture)
    try:
        fixture = json.loads(path.read_text(encoding="utf-8"))
    except OSError as err:
        print(f"heat-py-parity: cannot read {path}: {err}", file=sys.stderr)
        return 2

    rows = []
    ok = True
    for spec in fixture.get("cases") or []:
        got = heat.run_parity_case(spec)
        py_issues = compare(spec.get("python") or {}, got)
        js_issues = compare(spec.get("js") or {}, got)
        if py_issues or js_issues:
            ok = False
        rows.append({
            "id": spec.get("id"),
            "parityStatus": spec.get("parityStatus"),
            "python": got,
            "expected": spec.get("python"),
            "js": spec.get("js"),
            "matchPythonExpected": not py_issues,
            "matchJs": not js_issues,
            "issues": py_issues + [f"js.{i}" for i in js_issues],
            "knownDiffs": spec.get("knownDiffs") or [],
            "observedJsDiffs": known_diff_fields(spec, got),
        })

    result = {
        "ok": ok,
        "skipped": False,
        "fixture": str(path),
        "heat48h": str(heat_path),
        "ruleVersion": fixture.get("ruleVersion"),
        "pythonProducer": fixture.get("pythonProducer"),
        "cases": rows,
        "note": "Python port must match fixture.python and fixture.js. knownDiffs must stay empty unless an intentional gap is documented.",
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        status = "ok" if ok else "FAIL"
        print(f"heat-py-parity {status} {len(rows)} case(s) via {heat_path}")
        for row in rows:
            mark = "ok" if row["matchPythonExpected"] and row["matchJs"] else "FAIL"
            print(f"  {mark} {row['id']} status={row['parityStatus']}")
            for issue in row["issues"]:
                print(f"    {issue}")
        leftover = [row["id"] for row in rows if row["knownDiffs"]]
        if leftover:
            print(f"documented gaps: {leftover}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
