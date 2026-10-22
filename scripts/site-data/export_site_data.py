#!/usr/bin/env python3
"""L4 outbox + heat48h → 站点静态 JSON（契约：SITE-DATA-CONTRACT.md / site-data.schema.json 1.0）。

In-repo canonical copy of the box exporter (`/workspace/frontier-hotboard/site-data/`).
Task #57: timeline_fallback + cover_preserve live here with tests. Heat comes from
the heat.mjs port in heat48h.py (no align_hot_sparks_to_js post-step).

Full World / l4lib export is box-only. In-repo tests import timeline_fallback and
cover_preserve directly.

用法:
  export_site_data.py [--at ISO] [--preview] [--page-size 20] [--out DIR] [--skip-heat]
  --prev-tip DIR  保留上一版同域封面（#53；生产路径必填）
"""
import argparse, json, os, re, shutil, sys, tempfile
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from cover_preserve import preserve_covers  # noqa: E402
from timeline_fallback import timeline_fallback_views  # noqa: E402
import heat48h  # noqa: E402

try:
    from l4lib import (CST, IMAGE_VALUE, L4, SITE_DATA, TIER_ORDER, World, clean_public, cst, ev_gate,  # noqa: E402
                       hard_keys, homepage_of, iso_z, norm_url, ts)
    HAS_L4 = True
except Exception:
    HAS_L4 = False
    CST = heat48h.CST
    SITE_DATA = Path(".")
    L4 = Path(".")
    IMAGE_VALUE = {}
    TIER_ORDER = {}
    World = None

    def clean_public(text):
        return text, []

    def cst(at):
        return heat48h.cst(at)

    def ev_gate(_ev):
        return True

    def hard_keys(*_a):
        return set()

    def homepage_of(_url):
        return None

    def iso_z(at):
        return heat48h.iso_z(at)

    def norm_url(url):
        return url

    def ts(value):
        return heat48h.parse_iso(value)

CONTRACT_VERSION = "1.1"
_schema_path = HERE / "site-data.schema.json"
SCHEMA = json.loads(_schema_path.read_text()) if _schema_path.exists() else {"$schema": "", "$defs": {}}
CATEGORY = {"model_release": "model", "product_launch": "product", "tool_or_prompt": "product", "research_paper": "paper",
            "industry_event": "industry", "opinion_analysis": "opinion", "tutorial_explainer": "tutorial"}
CATEGORY_LABEL = {"model": "模型", "product": "产品", "industry": "行业", "paper": "论文", "tutorial": "教程", "opinion": "观点"}
MIN_IMAGE_HEIGHT = 240
FEED_LIMIT, SUMMARY_CAP, HOT_LIMIT, SNAPSHOT_HOURS = 50, 480, 10, 72
DENY_KEYS = {"body_text", "summary_raw", "gate_a", "prefilter", "evidence_grade", "composite", "rubric_version", "attention_scores",
             "recommend_reason", "claim_label", "chosen_by", "source_item_id", "source_page", "first_hand", "focus_slot",
             "heat48h", "import_log", "notes", "input_sha256", "raw", "engagement", "gate_a_passed",
             "reason_public", "value_reason", "participants_raw", "tos_ok", "tos_note"}
DENY_KEY_RX = re.compile(r"[Ss][Cc][Oo][Rr][Ee]|(^|_)gate|Gate|(^|_)attention|Attention")
PRIVATE = re.compile(r"(/workspace/|/home/|/cursor/|file://|sand-workflow:|\.sqlite|engine-data)", re.I)
R2_SLOTS = {"weekday": ["08:25", "12:25", "15:25", "19:25"], "weekend": ["08:25", "19:25"]}
LOG = []


def log(kind, msg):
    LOG.append({"kind": kind, "msg": msg})


def grounded(text, corpus):
    known = corpus.lower()
    if "hacker news" in known:
        known += " hn"
    has_pct = any(k in known for k in ("percent", "per cent", "%"))
    words = [w.rstrip(".+-") for w in re.findall(r"[A-Za-z][A-Za-z0-9.+-]*", text or "")]
    words = [w for w in words if re.search(r"[A-Z0-9]", w)]
    figs = [f for f in re.findall(r"\d+(?:\.\d+)?%?", text or "") if len(f) >= 3 or re.search(r"[.%]", f)]
    years = re.findall(r"20\d\d年?", text or "")
    bad = [w for w in words if w.lower() not in known]
    bad += [f for f in figs if f.lower() not in known and not (
        f.endswith("%") and has_pct and re.search(r"(?<![\d.])" + re.escape(f[:-1]) + r"(?![\d.])", known))]
    bad += [y for y in years if y[:4] not in known]
    return not bad, bad


def body_evidence():
    out = {}
    if not HAS_L4:
        return out
    for f in (L4 / "work").glob("*/body-read-evidence.json"):
        try:
            for v in json.loads(f.read_text()).values():
                if isinstance(v, dict) and v.get("url"):
                    out[norm_url(v["url"])] = v.get("excerpt") or ""
        except Exception:
            pass
    return out


class Exporter:
    def __init__(self, world, heat, at, preview, page_size):
        self.w, self.heat, self.at, self.preview, self.page_size = world, heat, at, preview, page_size
        self.heat_by_event = {r["event_id"]: r for r in heat["events"]}
        self.evidence = body_evidence()
        self.files = {}

    def corpus(self, iids):
        parts = []
        for i in iids:
            rec = self.w.items.get(i) or {}
            inb = rec.get("inbox") or {}
            ing = (rec.get("scored") or {}).get("ingest") or {}
            url = inb.get("url") or ing.get("url") or ""
            parts += [inb.get("title") or ing.get("title") or "", inb.get("summary") or "", inb.get("body_text") or "",
                      ing.get("snippet") or "", url, inb.get("source_name") or "", self.evidence.get(norm_url(url), "")]
        return " ".join(parts)

    def public_text(self, what, text, iids, required=False):
        t, bad = clean_public(text)
        if bad:
            log("meta_dropped", f"{what}: {bad}")
            return None
        if t is None:
            return None
        ok, miss = grounded(t, self.corpus(iids))
        if not ok:
            log("ungrounded_dropped", f"{what}: {miss[:6]}")
            return None
        return t

    def event_public_members(self, eid):
        rec = self.w.events[eid]
        return sorted(m for m in rec["members"] if m in self.w.items and self.w.is_public_item(m))

    def gate_a(self, eid):
        return ev_gate(self.w.events[eid]["event"] or {})

    def published_event(self, eid):
        return eid in self.w.events and (self.preview or self.gate_a(eid))

    def reason_for(self, eid, members, sel):
        ev = self.w.events[eid]["event"] or {}
        for what, val in (("reason_public", ev.get("reason_public")), ("reason_public", (sel or {}).get("reason_public")),
                          ("recommend_reason", ev.get("recommend_reason")), ("recommend_reason", (sel or {}).get("recommend_reason"))):
            if val:
                t = self.public_text(f"event {eid} {what}", val, members)
                if t:
                    return t
        return None

    def cover(self, ev):
        img = ev.get("image") or {}
        if not img:
            return None
        vc = IMAGE_VALUE.get(img.get("value_class") or img.get("value_category") or "")
        alt, _ = clean_public(img.get("alt") or img.get("alt_zh"))
        h = img.get("height") if isinstance(img.get("height"), int) else None
        url = str(img.get("url") or "")
        why = None if vc else "no value_class" if not (img.get("value_class") or img.get("value_category")) else "value_class not in 4 classes"
        why = why or (None if alt else "no alt") or (None if url.startswith("https://") else "not https") or \
            (None if h is None or h >= MIN_IMAGE_HEIGHT else f"height {h}<{MIN_IMAGE_HEIGHT}")
        if why:
            log("cover_withheld", f"{ev['id']}: {why} → 空槽")
            return None
        return {"url": url, "width": img.get("width") if isinstance(img.get("width"), int) else None, "height": h,
                "alt": alt, "valueClass": vc}

    def is_selected(self, iid):
        eid = self.w.item_event.get(iid)
        return iid in self.w.selected and eid in self.w.events and (self.preview or self.gate_a(eid))

    def report_view(self, iid):
        rec = self.w.items[iid]
        sc = rec.get("scored") or {}
        m = self.w.source_meta(iid)
        title = self.public_text(f"report {iid} title", sc.get("title_zh"), [iid])
        if not title:
            return None
        rv = {"id": iid, "title": title, "summary": self.public_text(f"report {iid} summary", sc.get("summary_zh"), [iid]),
              "source": {"name": m["source_name"], "firstParty": m["evidence_grade"] == "一手" or m["tier"] == "T1"},
              "publishedAt": iso_z(m["published_at"] or m["collected_at"]), "selected": self.is_selected(iid)}
        if m["url"]:
            rv["originalUrl"] = m["url"]
        return rv

    def build_story(self, eid, rank):
        ev = self.w.events[eid]["event"]
        members = self.event_public_members(eid)
        if not members:
            return None
        title = self.public_text(f"event {eid} title", ev["title"], members)
        if not title:
            log("event_dropped", f"{eid}: title not publishable")
            return None
        summary = self.public_text(f"event {eid} digest", ev.get("digest"), members) if ev.get("digest") else None
        summary = summary or self.public_text(f"event {eid} summary", ev.get("summary"), members)
        latest = self.public_text(f"event {eid} latest", ev.get("latest_progress"), members)
        views = [v for v in (self.report_view(i) for i in members) if v]
        # #46/#53: per-report title grounding can drop every view while the event title
        # still publishes — empty timeline fails b2-hot-recompute. Fall back to the
        # event title + source published_at (extracted: timeline_fallback.py).
        if not views:
            views = timeline_fallback_views(
                eid, title, members,
                source_meta_fn=self.w.source_meta,
                is_selected_fn=self.is_selected,
                log_fn=log,
            )
        views.sort(key=lambda v: (v["publishedAt"] or ""), reverse=True)
        h = self.heat_by_event.get(eid) or {}
        times = [ts(v["publishedAt"]) for v in views if v["publishedAt"]]
        latest_at = max(times) if times else None
        age = (self.at - latest_at) if latest_at else None
        status = "active" if age is not None and age <= timedelta(hours=48) else "watching" if age is not None and age <= timedelta(days=7) else "settled"
        rep_id = ev.get("representative_item_id")
        rep = next((v for v in views if v["id"] == rep_id), views[0] if views else None)
        story = {
            "publicId": eid, "title": title, "status": status, "reportCount": len(views),
            "sourceCount": len({v["source"]["name"] for v in views}),
            "firstReportAt": iso_z(min(times)) if times else None, "latestAt": iso_z(latest_at),
            "digest": None, "digestUpdatedAt": None, "summary": summary, "excerpt": None,
            "latest": latest, "latestReport": None,
            "whyHot": {"participants48h": h.get("participantCount", 0), "newParticipants6h": h.get("newParticipants6h", 0),
                       "recentReports24h": h.get("recentReports24h", 0), "observationComplete": bool(h.get("observationComplete")),
                       "rank": rank},
            "developments": ([{"factId": f"fact-{eid}", "title": title, "firstReportAt": iso_z(min(times)) if times else None,
                               "reportCount": len(views), "representative": rep}] if rep else []),
            "officialReports": [v for v in views if v["source"]["firstParty"]],
            "timeline": views, "heat": h.get("hourly", []), "related": [], "topics": [],
        }
        sels = [self.w.selected[i]["sel"] for i in members if self.is_selected(i)]
        sels.sort(key=lambda x: (x["item_id"] != rep_id, not x.get("is_representative"), -(x.get("score_avg") or 0), x["item_id"]))
        sel = sels[0] if sels else None
        if sel:
            rr = self.reason_for(eid, members, sel)
            if rr:
                story["recommendReason"] = rr
        cov = self.cover(ev)
        if cov:
            story["cover"] = cov
        if ev.get("claim_label") == "传闻":
            story["claim"] = "rumor"
        if self.preview and not self.gate_a(eid):
            story["belowThreshold"] = True
        if rep and rep.get("originalUrl"):
            story["primaryUrl"] = rep["originalUrl"]
        return story

    def build_cards(self):
        by_event = {}
        for iid, s in self.w.selected.items():
            sel = s["sel"]
            eid = self.w.item_event.get(iid) or sel.get("event_id")
            if eid not in self.w.events:
                log("card_dropped", f"{iid}: event {eid} unknown")
                continue
            if not self.gate_a(eid) and not self.preview:
                continue
            by_event.setdefault(eid, []).append(sel)
        cards = []
        for eid, sels in by_event.items():
            sels.sort(key=lambda s: (not s.get("is_representative"), -(s.get("score_avg") or 0), s["item_id"]))
            s = sels[0]
            iid = s["item_id"]
            members = self.event_public_members(eid) or [iid]
            title = self.public_text(f"card {iid} title", s.get("title_zh"), [iid])
            if not title:
                log("card_dropped", f"{iid}: title not publishable")
                continue
            m = self.w.source_meta(iid)
            t = m["published_at"] or ts(s.get("published_at")) or m["collected_at"]
            others = len({self.w.source_meta(x)["source_name"] for x in members} - {m["source_name"]})
            item = {"id": iid, "title": title,
                    "summary": self.public_text(f"card {iid} summary", s.get("summary_zh"), [iid]),
                    "reason": self.reason_for(eid, members, s),
                    "source": {"name": m["source_name"] or s.get("source_name") or ""},
                    "publishedAt": iso_z(t), "timelineAt": iso_z(t), "category": CATEGORY.get(s.get("content_type") or ""),
                    "tags": [g for g in (s.get("tags") or []) if g not in CATEGORY],
                    "selected": True, "channel": "news", "x": None, "storyPublicId": eid}
            if m["url"] or s.get("url"):
                item["originalUrl"] = m["url"] or s.get("url")
            if self.preview and not self.gate_a(eid):
                item["belowThreshold"] = True
            cards.append({"key": iid, "anchorAt": iso_z(t), "item": item,
                          "group": {"factId": f"fact-{eid}", "additionalSourceCount": others, "reportCount": len(members),
                                    "memberIds": [x["item_id"] for x in sels]} if others > 0 else None})
        cards.sort(key=lambda c: (c["anchorAt"], c["key"]), reverse=True)
        return cards

    def build_hot(self, stories):
        entries = []
        prev_order = self.prev_public_order()
        for r in sorted((r for r in self.heat["events"] if r["rank"]), key=lambda r: r["rank"]):
            if len(entries) >= HOT_LIMIT:
                break
            if not self.published_event(r["event_id"]):
                continue
            st = stories.get(r["event_id"])
            if not st:
                log("hot_dropped", f"{r['event_id']}: no publishable story")
                continue
            summ = st["summary"]
            if summ and len(summ) > SUMMARY_CAP:
                summ = summ[:SUMMARY_CAP] + "…"
            e = {"rank": len(entries) + 1, "story": {"publicId": st["publicId"], "title": st["title"]}, "heat": r["heat"],
                 "trend": r["trend"], "trendPct": r["trendPct"], "badges": r["badges"], "participantCount": r["participantCount"],
                 "sourceCount": r["sourceCount"], "sourceNames": r["sourceNames"], "participants": r["participants"],
                 "spark": r["spark"], "summary": summ, "latest": st["latest"],
                 "cover": st.get("cover") if not entries else None}
            if prev_order is not None and r["event_id"] in prev_order:
                e["rankDelta"] = prev_order[r["event_id"]] - e["rank"]
            if isinstance(r.get("heatDeltaPct"), (int, float)):
                e["heatDeltaPct"] = r["heatDeltaPct"]
            if st.get("belowThreshold"):
                e["belowThreshold"] = True
            entries.append(e)
        strip = [{"rank": e["rank"], "title": e["story"]["title"], "heat": e["heat"], "trend": e["trend"],
                  "storyPublicId": e["story"]["publicId"],
                  "itemId": (self.w.events[e["story"]["publicId"]]["event"] or {}).get("representative_item_id"),
                  "participants": e["participants"], "participantCount": e["participantCount"]} for e in entries[:5]]
        return {"computedAt": self.heat["computedAt"], "windowHours": 48, "entries": entries}, strip

    def prev_public_order(self):
        prev = heat48h.prev_snapshot(self.at)
        if not prev:
            return None
        rows = sorted((e for e in prev.get("events", []) if e.get("rank")), key=lambda e: e["rank"])
        order, n = {}, 0
        for e in rows:
            eid = self.w.aliases.get(e["event_id"], e["event_id"])
            if self.published_event(eid) and eid not in order:
                n += 1
                order[eid] = n
        return order

    def build_snapshots(self, stories):
        out = {}
        history = getattr(heat48h, "HISTORY", None) or (SITE_DATA / "state" / "heat-history")
        if not Path(history).exists():
            return out
        for f in sorted(Path(history).glob("*.json")):
            try:
                snap = json.loads(f.read_text())
            except Exception:
                continue
            t = ts(snap.get("computed_at"))
            if not t or t > self.at or self.at - t > timedelta(hours=SNAPSHOT_HOURS):
                continue
            rows, n = [], 0
            for e in sorted((e for e in snap.get("events", []) if e.get("rank")), key=lambda e: e["rank"]):
                eid = self.w.aliases.get(e["event_id"], e["event_id"])
                if eid in stories and n < HOT_LIMIT:
                    n += 1
                    rows.append({"rank": n, "publicId": eid, "heat": e["heat"], "participantCount": e.get("participantCount")})
            key = t.astimezone(CST).strftime("%Y-%m-%dT%H")
            out[key] = {"computedAt": iso_z(t), "entries": rows}
        return out

    def build_redirects(self, stories):
        rows = []
        for old, new in sorted(self.w.aliases.items()):
            if new in stories and old != new:
                rows.append({"from": old, "to": new, "fromPath": f"/events/{old}/", "toPath": f"/events/{new}/"})
        return {"note": "由 merged_into / merged_from 生成；构建为 meta refresh + canonical 静态跳转页", "redirects": rows}

    def build_sources(self, stories):
        used = {}
        for iid in self.public_item_ids(stories):
            m = self.w.source_meta(iid)
            sid = m["source_id"]
            if not sid or sid in used:
                continue
            s = self.w.sources.get(sid, {})
            home = homepage_of(s.get("url"))
            used[sid] = {"sourceId": sid, "name": m["source_name"], "tier": m["tier"],
                         "kind": "signal" if m["mode"] == "hot_signal" else "editorial"}
            if home:
                used[sid]["homepage"] = home
        return {"sources": sorted(used.values(), key=lambda x: x["sourceId"])}

    def public_item_ids(self, stories):
        ids = []
        for iid in sorted(self.w.items):
            if not self.w.is_public_item(iid):
                continue
            eid = self.w.item_event.get(iid)
            if not self.preview and eid not in stories:
                continue
            ids.append(iid)
        return ids

    def build_search(self, stories):
        docs = []
        for st in stories.values():
            docs.append({"id": st["publicId"], "kind": "event", "title": st["title"], "summary": st["summary"],
                         "publishedAt": st["latestAt"], "sourceNames": sorted({v["source"]["name"] for v in st["timeline"]}),
                         "path": f"/events/{st['publicId']}/"})
        for iid in self.public_item_ids(stories):
            eid = self.w.item_event.get(iid)
            rv = self.report_view(iid)
            if not rv:
                continue
            sc = self.w.items[iid]["scored"] or {}
            d = {"id": iid, "kind": "item", "title": rv["title"], "summary": rv["summary"], "publishedAt": rv["publishedAt"],
                 "sourceName": rv["source"]["name"], "category": CATEGORY.get(sc.get("content_type") or ""),
                 "selected": self.is_selected(iid)}
            if eid in stories:
                d["eventPublicId"] = eid
            if rv.get("originalUrl"):
                d["originalUrl"] = rv["originalUrl"]
            docs.append(d)
        docs.sort(key=lambda d: (d["publishedAt"] or "", d["id"]), reverse=True)
        return {"generatedAt": iso_z(self.at), "docs": docs}

    def build_feed(self, cards):
        items = []
        for c in cards[:FEED_LIMIT]:
            it = c["item"]
            if not it.get("originalUrl"):
                continue
            items.append({"guid": it["id"], "title": it["title"], "summary": it["summary"] or "", "originalUrl": it["originalUrl"],
                          "pubDate": it["publishedAt"], "sourceName": it["source"]["name"], "category": it["category"],
                          "categoryLabel": CATEGORY_LABEL.get(it["category"] or ""), "eventPublicId": it["storyPublicId"]})
        return {"feed": {"id": "selected", "path": "/feed.xml", "title": "前沿趋势 — 精选", "limit": FEED_LIMIT,
                         "description": f"最新 {FEED_LIMIT} 条前沿趋势精选摘要，保留标题、摘要与原文入口。"}, "items": items}

    def next_round(self):
        t = self.at.astimezone(CST)
        for d in range(0, 4):
            day = (t + timedelta(days=d)).date()
            slots = R2_SLOTS["weekend" if day.weekday() >= 5 else "weekday"]
            for s in slots:
                hh, mm = map(int, s.split(":"))
                cand = datetime(day.year, day.month, day.day, hh, mm, tzinfo=CST)
                if cand > t:
                    return cand
        return None

    def run(self):
        ranked = {r["event_id"]: r["rank"] for r in self.heat["events"] if r["rank"]}
        cards = self.build_cards()
        want = {e for e in ranked if self.published_event(e)} | {c["item"]["storyPublicId"] for c in cards}
        if self.preview:
            want |= {e for e in self.w.events if self.event_public_members(e)}
        stories = {}
        for eid in sorted(want):
            st = self.build_story(eid, ranked.get(eid))
            if st:
                stories[eid] = st
        cards = [c for c in cards if c["item"]["storyPublicId"] in stories]
        hot, strip = self.build_hot(stories)
        pub_rank = {e["story"]["publicId"]: e["rank"] for e in hot["entries"]}
        pub_delta = {e["story"]["publicId"]: e["rankDelta"] for e in hot["entries"] if "rankDelta" in e}
        for eid, st in stories.items():
            st["whyHot"]["rank"] = pub_rank.get(eid)
            if eid in pub_delta:
                st["rankDelta"] = pub_delta[eid]
        day_counts = {}
        for c in cards:
            k = ts(c["anchorAt"]).astimezone(CST).strftime("%Y-%m-%d")
            day_counts[k] = day_counts.get(k, 0) + 1
        n = max(1, -(-len(cards) // self.page_size))
        pages = []
        for p in range(1, n + 1):
            chunk = cards[(p - 1) * self.page_size: p * self.page_size]
            self.files[f"timeline/page-{p}.json"] = ("timelinePage", {
                "filters": {"channel": "all", "category": None, "tag": None}, "cards": chunk,
                "nextCursor": f"timeline/page-{p + 1}.json" if p < n else None,
                "hot": (strip or None) if p == 1 else None, "dayCounts": day_counts if p == 1 else {},
                "page": p, "pageCount": n, "total": len(cards)})
            pages.append({"page": p, "path": f"timeline/page-{p}.json", "count": len(chunk),
                          "firstAnchorAt": chunk[0]["anchorAt"] if chunk else None, "lastAnchorAt": chunk[-1]["anchorAt"] if chunk else None})
        self.files["timeline/index.json"] = ("timelineIndex", {"pageSize": self.page_size, "pageCount": n, "total": len(cards), "pages": pages})
        self.files["hot.json"] = ("hot", hot)
        self.files["hot-strip.json"] = ("hotStrip", strip)
        for eid, st in stories.items():
            self.files[f"events/{eid}.json"] = ("story", st)
        self.files["events/index.json"] = ("eventsIndex", {"events": sorted(
            [{"publicId": s["publicId"], "title": s["title"], "latestAt": s["latestAt"], "reportCount": s["reportCount"],
              "hotRank": s["whyHot"]["rank"]} for s in stories.values()], key=lambda x: (x["latestAt"] or ""), reverse=True)})
        self.files["search/source.json"] = ("searchSource", self.build_search(stories))
        self.files["feed/selected.json"] = ("feedSource", self.build_feed(cards))
        self.files["redirects.json"] = ("redirects", self.build_redirects(stories))
        self.files["sources.json"] = ("sourcesPublic", self.build_sources(stories))
        for k, snap in self.build_snapshots(stories).items():
            self.files[f"hot-snapshots/{k}.json"] = ("hotSnapshot", snap)
        endpoints = [{"path": "meta.json", "type": "meta"}, {"path": "hot.json", "type": "HotResponse(+rankDelta,heatDeltaPct)"},
                     {"path": "hot-strip.json", "type": "HotStripEntry[]"}, {"path": "timeline/index.json", "type": "timelineIndex"},
                     {"path": "timeline/page-{n}.json", "type": "TimelineResponse(+page,pageCount,total)"},
                     {"path": "events/index.json", "type": "eventsIndex"}, {"path": "events/{publicId}.json", "type": "StoryDetail(+ext)"},
                     {"path": "search/source.json", "type": "searchSource"}, {"path": "feed/selected.json", "type": "feedSource"},
                     {"path": "redirects.json", "type": "redirects"}, {"path": "sources.json", "type": "sourcesPublic"},
                     {"path": "hot-snapshots/{YYYY-MM-DDTHH}.json", "type": "hotSnapshot（72h）"}]
        self.files["api/index.json"] = ("apiIndex", {"version": CONTRACT_VERSION, "base": "/api/v1/", "endpoints": endpoints,
                                                     "note": "静态文件即 API；开发构建时原样复制到 /api/v1/。"})
        last = max(self.w.batches, key=lambda b: b["batch_id"])
        data_as_of = self.w.data_as_of() or self.at
        nr = self.next_round()
        meta = {"site": "前沿趋势", "contract_version": CONTRACT_VERSION, "mode": "preview" if self.preview else "production",
                "data_as_of": cst(data_as_of), "data_as_of_label": data_as_of.astimezone(CST).strftime("数据截至 %Y-%m-%d %H:%M（北京时间）"),
                "generated_at": cst(self.at), "hot_rule_version": self.heat["rule_version"], "hot_computed_at": cst(ts(self.heat["computed_at"])),
                "window_hours": 48, "spark_points": 25, "page_size": self.page_size,
                "counts": {"cards": len(cards), "pages": n, "events": len(stories), "hot_entries": len(hot["entries"]),
                           "search_docs": len(self.files["search/source.json"][1]["docs"]),
                           "feed_items": len(self.files["feed/selected.json"][1]["items"]),
                           "passed_events": sum(1 for e in stories if self.gate_a(e)),
                           "below_threshold_events": sum(1 for e in stories if not self.gate_a(e)),
                           "redirects": len(self.files["redirects.json"][1]["redirects"]),
                           "hot_snapshots": sum(1 for k in self.files if k.startswith("hot-snapshots/")),
                           "covers": sum(1 for s in stories.values() if s.get("cover"))},
                "last_round": {"batch_id": last["batch_id"], "status": last["status"], "finished_at": cst(last["finished_at"])},
                "batches": [{"batch_id": b["batch_id"], "status": b["status"]} for b in self.w.batches], "files": []}
        if nr:
            meta["next_round"] = cst(nr)
        self.files["meta.json"] = ("meta", meta)
        meta["files"] = sorted(self.files)
        return stories


def validator():
    try:
        import jsonschema
    except ImportError:
        jsonschema = None

    def check(defname, obj):
        errs = []
        if jsonschema and SCHEMA.get("$defs"):
            sub = {"$schema": SCHEMA.get("$schema"), "$defs": SCHEMA["$defs"], "$ref": f"#/$defs/{defname}"}
            errs += [f"{'/'.join(map(str, e.path))}: {e.message}" for e in jsonschema.Draft202012Validator(sub).iter_errors(obj)]
        else:
            d = SCHEMA.get("$defs", {}).get(defname) or {}
            if isinstance(obj, dict):
                errs += [f"missing {k}" for k in d.get("required", []) if k not in obj]
        return errs
    return check, bool(jsonschema)


PUBLIC_TEXT_KEYS = {"title", "summary", "reason", "latest", "recommendReason", "alt", "digest"}


def semantic_errors(name, obj, path=""):
    errs = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in DENY_KEYS:
                errs.append(f"{name}{path}/{k}: internal key")
            elif DENY_KEY_RX.search(k):
                errs.append(f"{name}{path}/{k}: score/gate key banned (产品 15:51)")
            if k in PUBLIC_TEXT_KEYS and isinstance(v, str):
                _, bad = clean_public(v)
                if bad or v != (clean_public(v)[0] or ""):
                    errs.append(f"{name}{path}/{k}: internal meta {bad}")
            errs += semantic_errors(name, v, f"{path}/{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            errs += semantic_errors(name, v, f"{path}[{i}]")
    elif isinstance(obj, str) and PRIVATE.search(obj):
        errs.append(f"{name}{path}: private path/token")
    return errs


def write_event_index(world, heat, at):
    hb = {r["event_id"]: r for r in heat["events"]}
    rows = []
    for eid, rec in world.events.items():
        ev = rec["event"]
        members = sorted(rec["members"])
        metas = [world.source_meta(m) for m in members if m in world.items]
        times = [m["published_at"] for m in metas if m["published_at"]]
        latest = max(times) if times else ts(ev.get("updated_at"))
        if latest and at - latest > timedelta(days=7):
            continue
        keys, urls = set(), set()
        for m_id, m in zip([x for x in members if x in world.items], metas):
            inb = world.items[m_id].get("inbox") or {}
            keys |= hard_keys(m["url"], inb.get("summary") or "")
            if m["url"]:
                urls.add(norm_url(m["url"]))
        for s in ev.get("sources") or []:
            keys |= hard_keys(s.get("url"))
            if s.get("url"):
                urls.add(norm_url(s.get("url")))
        rows.append({"event_id": eid, "title": ev["title"], "summary": (ev.get("summary") or "")[:160],
                     "first_seen_at": ev.get("first_seen_at"), "updated_at": ev.get("updated_at"),
                     "first_published_at": iso_z(min(times)) if times else None, "latest_published_at": iso_z(latest),
                     "content_type": (world.items.get(ev.get("representative_item_id"), {}).get("scored") or {}).get("content_type"),
                     "grade": ev.get("grade"), "gate_a": bool((ev.get("scores") or {}).get("gate_a")),
                     "selected": any(m in world.selected for m in members),
                     "hard_keys": sorted(keys), "urls": sorted(urls), "member_item_ids": members,
                     "sources": sorted({m["source_name"] for m in metas if m["source_name"]}),
                     "heat": (hb.get(eid) or {}).get("heat"), "hot_rank": (hb.get(eid) or {}).get("rank"),
                     "batches": rec["batches"]})
    rows.sort(key=lambda r: r["latest_published_at"] or "", reverse=True)
    f = SITE_DATA / "state" / "event-index-7d.json"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps({"generated_at": cst(at), "window_days": 7, "count": len(rows), "events": rows}, ensure_ascii=False, indent=1) + "\n")


def apply_cover_preserve(files, prev_tip, log_fn=log):
    """Post-validation hook used by main() and by in-repo tests."""
    kept = preserve_covers({n: o for n, (_, o) in files.items()}, prev_tip, log_fn)
    return kept


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--at", help="export/ranking time ISO (default now CST)")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--page-size", type=int, default=20)
    ap.add_argument("--out", default=None)
    ap.add_argument("--skip-heat", action="store_true", help="reuse site-data/work/heat48h.json instead of recomputing")
    ap.add_argument("--no-snapshot", action="store_true", help="compute heat without writing a history snapshot")
    ap.add_argument("--l4", default=None, help="l4 dir (default /workspace/frontier-hotboard/l4); for tests/replays")
    ap.add_argument("--prev-tip", default=os.environ.get("SITE_DATA_PREV_TIP"),
                    help="engine-data tip dir (…/data/engine/v1); same-origin covers there survive a full sync (#53)")
    ap.add_argument("--index-only", action="store_true", help="only refresh state/event-index-7d.json (for R2); no out/, no snapshot")
    a = ap.parse_args(argv)
    if not HAS_L4:
        print("export_site_data.py: l4lib not available in this checkout; full export is box-only. "
              "timeline_fallback / cover_preserve are imported from this package and covered by tests.", file=sys.stderr)
        return 2
    at = ts(a.at) if a.at else datetime.now(CST).replace(second=0, microsecond=0)
    world = World(**({"l4": a.l4} if a.l4 else {}), upto=at)
    if not world.batches:
        print("no done batches; keep previous output", file=sys.stderr)
        return 2
    if a.index_only:
        write_event_index(world, heat48h.compute(world, at), at)
        print(f"event index ok → {SITE_DATA / 'state' / 'event-index-7d.json'}")
        return 0
    if a.skip_heat:
        heat = json.loads((SITE_DATA / "work" / "heat48h.json").read_text())
    else:
        heat = heat48h.compute(world, at)
        (SITE_DATA / "work").mkdir(parents=True, exist_ok=True)
        (SITE_DATA / "work" / "heat48h.json").write_text(json.dumps(heat, ensure_ascii=False, indent=1) + "\n")
        if not a.no_snapshot:
            heat48h.save_snapshot(heat)
    ex = Exporter(world, heat, at, a.preview, a.page_size)
    ex.run()
    check, full = validator()
    errors = []
    for name, (defname, obj) in sorted(ex.files.items()):
        errors += [f"{name}: {e}" for e in check(defname, obj)]
        errors += semantic_errors(name, obj)
    names = list(ex.files)
    if len(set(names)) != len(names):
        errors.append("duplicate file names")
    out = Path(a.out or (SITE_DATA / ("out-preview" if a.preview else "out")))
    (SITE_DATA / "work").mkdir(parents=True, exist_ok=True)
    (SITE_DATA / "work" / f"export-log-{'preview' if a.preview else 'production'}.json").write_text(json.dumps(
        {"at": cst(at), "mode": "preview" if a.preview else "production", "schema_validator": "jsonschema" if full else "required-only",
         "errors": errors, "log": LOG}, ensure_ascii=False, indent=1) + "\n")
    if errors:
        print(f"VALIDATION FAILED ({len(errors)}): keep previous {out}", file=sys.stderr)
        for e in errors[:20]:
            print("  " + e, file=sys.stderr)
        return 1
    if a.prev_tip:
        kept = apply_cover_preserve(ex.files, a.prev_tip, log)
        print(f"cover_preserve: {len(kept)} kept from {a.prev_tip}: {kept}")
    elif not a.preview:
        print("WARN cover_preserve: no --prev-tip; full sync may drop same-origin covers (#53)", file=sys.stderr)
    tmp = Path(tempfile.mkdtemp(prefix=".out-", dir=out.parent))
    os.chmod(tmp, 0o755)
    for name, (_, obj) in ex.files.items():
        f = tmp / name
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps(obj, ensure_ascii=False, indent=1, sort_keys=False) + "\n")
    old = out.parent / (out.name + ".prev")
    if old.exists():
        shutil.rmtree(old)
    if out.exists():
        out.rename(old)
    tmp.rename(out)
    if old.exists():
        shutil.rmtree(old)
    write_event_index(world, heat, at)
    m = ex.files["meta.json"][1]
    print(f"export ok ({m['mode']}, validator={'jsonschema' if full else 'required-only'}) → {out}: {m['counts']}; "
          f"dropped/withheld={len(LOG)} (see work/export-log-<mode>.json)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
