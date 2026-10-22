#!/usr/bin/env python3
"""Port of scripts/engine/heat.mjs — sole spark/heat formula (Task #57).

heat.mjs is the source of truth. This file matches:
  - closed 48h window (0 ≤ hours ≤ 48)
  - half-up display heat (Math.round; not Python banker's round)
  - trend after rounding to 1 decimal, then ±10
  - participantKeyFromReport (no owner:/source: prefix)
  - listed heat === spark[-1] (floor UTC hour), including off-hour computedAt

World / l4lib is optional (box export). Parity tests only need this module.

Usage:
  heat48h.py --parity-case '{...json...}'
  heat48h.py [--at ISO] [--weights mit|spec] [--out PATH]   # box path, needs l4lib
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
RULE_VERSION = "heat-v1-48h-halflife24h"
WINDOW_H, HALF_LIFE_H, MIN_PARTICIPANTS, SPARK_H, HOT_LIMIT = 48, 24, 2, 24, 10
DELTA_MIN_GAP_H = 2
TREND_LAG_H = 6
KEEP_DAYS = 7
WEIGHTS = {"mit": {"editorial": 1.0, "signal": 1.0}, "spec": {"editorial": 1.0, "signal": 0.3}}

try:
    sys.path.insert(0, str(HERE))
    from l4lib import CST, SITE_DATA, TIER_ORDER, World, cst, iso_z, ts  # type: ignore  # noqa: E402
    HAS_L4 = True
except Exception:
    HAS_L4 = False
    CST = timezone(timedelta(hours=8))
    SITE_DATA = Path(".")
    TIER_ORDER = {"T1": 1, "T2": 2, "T3": 3}
    World = None

    def cst(at):
        return at.astimezone(CST).strftime("%Y-%m-%dT%H:%M:%S%z")

    def iso_z(at):
        if at is None:
            return None
        if isinstance(at, str):
            return at
        return at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    def ts(value):
        return parse_iso(value)


def parse_iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    text = str(value).strip()
    if not text:
        return None
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def display_heat(raw) -> float:
    """Math.round(raw*100)/10. raw≤0 or non-finite → 0."""
    if raw is None:
        return 0.0
    try:
        raw = float(raw)
    except (TypeError, ValueError):
        return 0.0
    if not math.isfinite(raw) or raw <= 0:
        return 0.0
    return math.floor(raw * 100 + 0.5) / 10


def display_pct(ratio):
    if ratio is None:
        return None
    try:
        ratio = float(ratio)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(ratio):
        return None
    # Math.round: half toward +∞ (same as floor(x+0.5) for both signs).
    return math.floor(ratio * 1000 + 0.5) / 10


def hours_in_window(at, last_at, window_h=WINDOW_H):
    if at is None or last_at is None:
        return None
    hours = (at - last_at).total_seconds() / 3600
    if hours < 0 or hours > window_h:
        return None
    return hours


def raw_contribution(hours, half_life_h=HALF_LIFE_H):
    return 0.5 ** (hours / half_life_h)


def participant_key_from_report(row: dict, sources_by_name=None, sources_by_id=None) -> str:
    """Port of heat.mjs participantKeyFromReport. Do not prefix owner:/source:."""
    sources_by_name = sources_by_name or {}
    sources_by_id = sources_by_id or {}
    source = row.get("source") if isinstance(row.get("source"), dict) else {}
    named = sources_by_name.get(source.get("name") or row.get("name")) or {}
    return str(
        row.get("participant_key")
        or row.get("participantKey")
        or row.get("user_id")
        or row.get("userId")
        or row.get("handle")
        or row.get("sourceId")
        or row.get("source_id")
        or source.get("id")
        or source.get("sourceId")
        or named.get("sourceId")
        or source.get("name")
        or row.get("name")
        or row.get("id")
        or ""
    ).strip()


def as_hot_kind(kind):
    return "editorial" if kind == "editorial" else "signal"


def unique_participants(rows):
    acc = {}
    for row in rows or []:
        key = str(row.get("key") or row.get("participant_key") or row.get("name") or "").strip()
        if not key:
            continue
        last_at = parse_iso(row.get("lastAt") or row.get("last_at") or row.get("publishedAt") or row.get("published_at") or row.get("t"))
        if last_at is None:
            continue
        first_at = parse_iso(row.get("firstAt") or row.get("first_at") or last_at) or last_at
        prev = acc.get(key)
        if not prev:
            acc[key] = {
                "key": key,
                "name": row.get("name") or key,
                "kind": as_hot_kind(row.get("kind")),
                "lastAt": last_at,
                "firstAt": first_at,
            }
            continue
        if last_at > prev["lastAt"]:
            prev["lastAt"] = last_at
        if first_at < prev["firstAt"]:
            prev["firstAt"] = first_at
        if prev["kind"] != "editorial" and as_hot_kind(row.get("kind")) == "editorial":
            prev["kind"] = "editorial"
        if row.get("name") and prev["name"] == prev["key"]:
            prev["name"] = row["name"]
    return list(acc.values())


def participants_at(participants, at, window_h=WINDOW_H):
    return [row for row in unique_participants(participants) if hours_in_window(at, row["lastAt"], window_h) is not None]


def raw_heat(participants, at, window_h=WINDOW_H):
    raw = 0.0
    for row in participants_at(participants, at, window_h):
        hours = hours_in_window(at, row["lastAt"], window_h)
        raw += raw_contribution(hours)
    return raw


def floor_utc_hour(at: datetime) -> datetime:
    return at.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)


def spark_hours(at, points=SPARK_H + 1):
    end = floor_utc_hour(at)
    return [end - timedelta(hours=points - 1 - i) for i in range(points)]


def spark_for(participants, at, points=SPARK_H + 1):
    out = []
    for hour in spark_hours(at, points):
        rows = participants_at(participants, hour)
        out.append(display_heat(raw_heat(rows, hour)) if rows else None)
    return out


def first_report_at(participants):
    times = [row["firstAt"] for row in unique_participants(participants)]
    return min(times) if times else None


def new_participants_6h(participants, at, lag_h=TREND_LAG_H):
    cut = at - timedelta(hours=lag_h)
    return sum(1 for row in participants_at(participants, at) if row["firstAt"] > cut)


def trend_of(cur_heat, prev_heat, existed_before=True):
    if not existed_before:
        return "new", None
    if prev_heat is None or not isinstance(prev_heat, (int, float)) or prev_heat <= 0:
        return "unknown", None
    trend_pct = display_pct((cur_heat - prev_heat) / prev_heat)
    if trend_pct is None:
        return "unknown", None
    if trend_pct > 10:
        return "up", trend_pct
    if trend_pct < -10:
        return "down", trend_pct
    return "flat", trend_pct


def badges_of(*, first_at, at, fresh, participant_count, trend_pct):
    badges = []
    surge = fresh >= 3 and participant_count > 0 and fresh / participant_count >= 0.5
    if surge:
        badges.append("surge")
    if first_at is not None and timedelta(0) <= (at - first_at) < timedelta(hours=TREND_LAG_H):
        badges.append("new")
    if not surge and trend_pct is not None and trend_pct > 15:
        badges.append("rising")
    return badges


def listed_heat_from_spark(participants, at):
    spark = spark_for(participants, at)
    spark_last = spark[-1]
    rows = participants_at(participants, at)
    exact = display_heat(raw_heat(rows, at)) if rows else 0.0
    heat = spark_last if spark_last is not None else exact
    return {"heat": heat, "exactHeat": exact, "spark": spark, "sparkLast": spark_last}


def recompute_entry(participants, at, *, prev_at=None, prev_heat=None, existed_before=None):
    at = parse_iso(at)
    rows = participants_at(participants, at)
    listed = listed_heat_from_spark(participants, at)
    heat = listed["heat"]
    prev_at = parse_iso(prev_at) if prev_at is not None else at - timedelta(hours=TREND_LAG_H)
    prev_rows = participants_at(participants, prev_at)
    if prev_heat is None:
        prev_heat = display_heat(raw_heat(prev_rows, prev_at)) if prev_rows else None
    if existed_before is None:
        existed_before = prev_heat is not None and len(prev_rows) > 0
    trend, trend_pct = trend_of(heat, prev_heat, existed_before)
    fresh = new_participants_6h(participants, at)
    return {
        "heat": heat,
        "exactHeat": listed["exactHeat"],
        "trend": trend,
        "trendPct": trend_pct,
        "badges": badges_of(
            first_at=first_report_at(participants),
            at=at,
            fresh=fresh,
            participant_count=len(rows),
            trend_pct=trend_pct,
        ),
        "participantCount": len(rows),
        "spark": listed["spark"],
        "sparkLast": listed["sparkLast"],
        "heatEqualsSparkEndpoint": heat == listed["sparkLast"],
        "eligible": len(rows) >= MIN_PARTICIPANTS and any(r["kind"] == "editorial" for r in rows),
        "newParticipants6h": fresh,
        "prevHeat": prev_heat,
        "keys": [p["key"] for p in unique_participants(participants)],
    }


def participant_from_fixture(row: dict) -> dict:
    t = parse_iso(row.get("lastAt") or row.get("publishedAt") or row.get("published_at"))
    first = parse_iso(row.get("firstAt") or row.get("first_at")) or t
    kind = row.get("kind") if row.get("kind") in ("editorial", "signal") else "editorial"
    return {
        "key": participant_key_from_report(row),
        "name": row.get("name") or participant_key_from_report(row),
        "kind": kind,
        "lastAt": t,
        "firstAt": first,
    }


def run_parity_case(spec: dict) -> dict:
    """Evaluate one heat-parity fixture case (JS-aligned)."""
    if spec.get("mode") == "displayHeat" or (spec.get("raw") is not None and spec.get("mode") != "recompute"):
        heat = display_heat(spec.get("raw"))
        if spec.get("mode") == "displayHeat":
            return {
                "heat": heat,
                "displayHeatOfRaw": heat,
                "sparkLast": None,
                "participantCount": 0,
                "heatEqualsSparkEndpoint": None,
            }
    if spec.get("mode") == "trendOf":
        trend, trend_pct = trend_of(spec["curHeat"], spec["prevHeat"], spec.get("existedBefore", True))
        return {
            "heat": spec["curHeat"],
            "prevHeat": spec["prevHeat"],
            "trend": trend,
            "trendPct": trend_pct,
            "sparkLast": None,
            "participantCount": 0,
            "heatEqualsSparkEndpoint": None,
        }

    at = parse_iso(spec["at"])
    parts = [participant_from_fixture(row) for row in spec.get("participants") or []]
    parts = [p for p in parts if p["key"] and p["lastAt"] is not None]
    row = recompute_entry(parts, at)
    out = {
        "heat": row["heat"],
        "exactHeat": row["exactHeat"],
        "spark": row["spark"],
        "sparkLast": row["sparkLast"],
        "participantCount": row["participantCount"],
        "keys": row["keys"],
        "keysInWindow": sorted(p["key"] for p in participants_at(parts, at)),
        "trend": row["trend"],
        "trendPct": row["trendPct"],
        "prevHeat": row["prevHeat"],
        "badges": row["badges"],
        "heatEqualsSparkEndpoint": row["heatEqualsSparkEndpoint"],
    }
    if spec.get("raw") is not None:
        out["displayHeatOfRaw"] = display_heat(spec["raw"])
    return out


# ---------- box World path (optional) ----------

def signals(world, at):
    """event_id -> signals; keys match participantKeyFromReport (no owner: prefix)."""
    out = {}
    for iid, eid in world.item_event.items():
        rec = world.items.get(iid)
        if not rec or not world.is_public_item(iid):
            continue
        if rec["first_known"] and rec["first_known"] > at:
            continue
        m = world.source_meta(iid)
        if m["mode"] == "isolated":
            continue
        t = m["published_at"] or m["collected_at"]
        if not t:
            continue
        kind = "editorial" if m["mode"] == "editorial" else "signal"
        obs = [o for o in rec["obs"] if o[0] and o[0] <= at]
        key = participant_key_from_report({
            "participant_key": m.get("participant_key"),
            "handle": m.get("handle"),
            "source_id": m.get("source_id"),
            "name": m.get("source_name"),
            "owner": m.get("owner"),
        })
        out.setdefault(eid, []).append({
            "item": iid, "key": key, "kind": kind, "t": t, "lastAt": t, "firstAt": t,
            "name": m["source_name"], "tier": m["tier"], "obs": obs,
        })
    for eid, rec in world.events.items():
        have_keys = {s["key"] for s in out.get(eid, [])}
        for p in (rec["event"] or {}).get("participants") or []:
            t = ts(p.get("published_at"))
            key = participant_key_from_report(p)
            if not t or not key or key in have_keys or t > at:
                continue
            have_keys.add(key)
            out.setdefault(eid, []).append({
                "item": None, "key": key, "kind": p.get("kind") if p.get("kind") in ("editorial", "signal") else "editorial",
                "t": t, "lastAt": t, "firstAt": t,
                "name": world.sources.get(p.get("source_id"), {}).get("name") or key,
                "tier": p.get("tier"), "obs": [],
            })
    return out


def engagement(sigs, at):
    pts = com = 0
    pts6 = com6 = 0
    seen = False
    for s in sigs:
        if not s.get("obs"):
            continue
        seen = True
        latest = max(s["obs"], key=lambda o: o[0])[1]
        old = [o for o in s["obs"] if o[0] <= at - timedelta(hours=6)]
        base = max(old, key=lambda o: o[0])[1] if old else min(s["obs"], key=lambda o: o[0])[1]
        pts += latest.get("points") or 0
        com += latest.get("comments") or 0
        pts6 += (latest.get("points") or 0) - (base.get("points") or 0)
        com6 += (latest.get("comments") or 0) - (base.get("comments") or 0)
    return {"points": pts, "comments": com, "points_delta_6h": pts6, "comments_delta_6h": com6} if seen else None


def prev_snapshot(at, history=None):
    hist = Path(history) if history else (SITE_DATA / "state" / "heat-history")
    best = None
    if not hist.exists():
        return None
    for f in sorted(hist.glob("*.json")):
        try:
            snap = json.loads(f.read_text())
        except Exception:
            continue
        t = ts(snap.get("computed_at"))
        if t and t <= at - timedelta(hours=DELTA_MIN_GAP_H):
            best = snap
    return best


def compute(world, at, weights_mode="mit"):
    if not HAS_L4:
        raise RuntimeError("heat48h.compute needs l4lib.World (box-only). Use recompute_entry / run_parity_case in-repo.")
    w = WEIGHTS[weights_mode]
    sig = signals(world, at)
    prev = prev_snapshot(at)
    prev_rank = {e["event_id"]: e for e in (prev or {}).get("ranked", [])}
    prev_all = {e["event_id"]: e for e in (prev or {}).get("events", [])}
    first_batch_at = min((b["collected_at"] for b in world.batches if b["collected_at"]), default=None)
    rows = []
    for eid, sigs in sig.items():
        parts = unique_participants(sigs)
        if not parts:
            continue
        listed = listed_heat_from_spark(parts, at)
        if listed["heat"] <= 0 and not participants_at(parts, at):
            continue
        row = recompute_entry(parts, at)
        last = {p["key"]: p for p in participants_at(parts, at)}
        editorial = sum(1 for s in last.values() if s["kind"] == "editorial")
        first = first_report_at(parts)
        hourly = []
        end = floor_utc_hour(at)
        for k in range(WINDOW_H + 1):
            hr = end - timedelta(hours=WINDOW_H - k)
            window_rows = participants_at(parts, hr)
            if window_rows:
                hourly.append({"hour": iso_z(hr), "heat": display_heat(raw_heat(window_rows, hr)), "participants": len(window_rows)})
        reporting = [s for s in sorted(last.values(), key=lambda s: -s["lastAt"].timestamp()) if s["kind"] == "editorial"]
        parts_sorted = sorted(last.values(), key=lambda s: (s["kind"] != "editorial", TIER_ORDER.get(s.get("tier"), 3), -s["lastAt"].timestamp()))
        rows.append({
            "event_id": eid, "heat": row["heat"], "raw": round(raw_heat(parts, floor_utc_hour(at)), 6),
            "heat_6h_ago": row["prevHeat"],
            "trend": row["trend"], "trendPct": row["trendPct"], "badges": row["badges"],
            "participantCount": row["participantCount"], "editorialCount": editorial, "sourceCount": len(reporting),
            "sourceNames": list(dict.fromkeys(s["name"] for s in reporting))[:8],
            "participants": [{"name": s["name"], "kind": s["kind"]} for s in parts_sorted][:40],
            "eligible": row["eligible"],
            "latest_at": iso_z(max(s["lastAt"] for s in last.values())) if last else None,
            "first_at": iso_z(first),
            "newParticipants6h": row["newParticipants6h"],
            "recentReports24h": sum(1 for s in sigs if hours_in_window(at, parse_iso(s.get("t") or s.get("lastAt")), 24) is not None),
            "observationComplete": bool(first_batch_at and first_batch_at <= at - timedelta(hours=WINDOW_H)),
            "spark": row["spark"], "hourly": hourly,
            "engagement": engagement(sigs, at),
        })
        _ = w  # weights reserved; mit=1.0 matches heat.mjs
    rows.sort(key=lambda r: (-r["heat"], -((r["engagement"] or {}).get("points") or 0), -((ts(r["latest_at"]) or at).timestamp())))
    eligible = [r for r in rows if r["eligible"]]
    for i, r in enumerate(eligible, 1):
        r["rank"] = i
    ranked = eligible[:HOT_LIMIT]
    for r in rows:
        r.setdefault("rank", None)
        p = prev_rank.get(r["event_id"])
        pa = prev_all.get(r["event_id"])
        if r["rank"] is not None:
            r["rankDelta"] = (p["rank"] - r["rank"]) if p else None
            r["enteredRanking"] = p is None and prev is not None
        if pa and pa.get("heat"):
            r["heatDeltaPct"] = display_pct((r["heat"] - pa["heat"]) / max(pa["heat"], 1e-6))
        chips = []
        if r["rank"] is not None and r["rank"] <= 3 and (r.get("heatDeltaPct") or 0) > 0:
            chips.append("爆")
        if prev is not None and pa is None:
            chips.append("新")
        if pa and r["participantCount"] > pa.get("participantCount", 0):
            chips.append("发酵")
        r["chips"] = chips
    return {
        "rule_version": f"{RULE_VERSION} (port of scripts/engine/heat.mjs)",
        "weights": weights_mode, "computed_at": cst(at), "computedAt": iso_z(at),
        "window_hours": WINDOW_H, "half_life_hours": HALF_LIFE_H, "spark_hours": SPARK_H, "spark_points": SPARK_H + 1,
        "min_participants": MIN_PARTICIPANTS, "delta_vs": (prev or {}).get("computed_at"),
        "batches": [b["batch_id"] for b in world.batches],
        "candidates": len(rows), "ranked_count": len(ranked),
        "ranked": [{k: r[k] for k in ("event_id", "rank", "heat", "participantCount")} for r in ranked],
        "events": rows,
    }


def save_snapshot(res, history=None):
    hist = Path(history) if history else (SITE_DATA / "state" / "heat-history")
    hist.mkdir(parents=True, exist_ok=True)
    at = ts(res["computed_at"])
    name = at.astimezone(CST).strftime("%Y%m%dT%H%M") + ".json"
    slim = {"computed_at": res["computed_at"], "rule_version": res["rule_version"], "weights": res["weights"],
            "ranked": res["ranked"],
            "events": [{"event_id": r["event_id"], "heat": r["heat"], "participantCount": r["participantCount"], "rank": r["rank"]} for r in res["events"]]}
    (hist / name).write_text(json.dumps(slim, ensure_ascii=False, indent=1) + "\n")
    cutoff = at - timedelta(days=KEEP_DAYS)
    for f in hist.glob("*.json"):
        try:
            if datetime.strptime(f.stem, "%Y%m%dT%H%M").replace(tzinfo=CST) < cutoff:
                f.unlink()
        except ValueError:
            pass
    return hist / name


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--at", help="ranking time, ISO (default: now CST)")
    ap.add_argument("--weights", choices=sorted(WEIGHTS), default="mit")
    ap.add_argument("--no-save", action="store_true")
    ap.add_argument("--out", default=None)
    ap.add_argument("--l4", default=None)
    ap.add_argument("--parity-case", help="JSON object or @path: run one fixture case and print JS-aligned output")
    a = ap.parse_args(argv)

    if a.parity_case:
        raw = a.parity_case
        if raw.startswith("@"):
            spec = json.loads(Path(raw[1:]).read_text(encoding="utf-8"))
        else:
            spec = json.loads(raw)
        if "cases" in spec and isinstance(spec["cases"], list):
            print(json.dumps({"cases": [run_parity_case(c) for c in spec["cases"]]}, ensure_ascii=False, indent=2))
        else:
            print(json.dumps(run_parity_case(spec), ensure_ascii=False, indent=2))
        return 0

    if not HAS_L4:
        print("heat48h.py: l4lib not available; formula helpers only. Use --parity-case for in-repo checks.", file=sys.stderr)
        return 2
    at = ts(a.at) if a.at else datetime.now(CST)
    world = World(**({"l4": a.l4} if a.l4 else {}), upto=at)
    res = compute(world, at, a.weights)
    out = Path(a.out or (SITE_DATA / "work" / "heat48h.json"))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, ensure_ascii=False, indent=1) + "\n")
    snap = None if a.no_save else save_snapshot(res)
    print(f"heat48h at {res['computed_at']} batches={len(res['batches'])} candidates={res['candidates']} ranked={res['ranked_count']} "
          f"delta_vs={res['delta_vs']} -> {out}" + (f" snapshot={snap.name}" if snap else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
