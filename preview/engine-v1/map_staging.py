#!/usr/bin/env python3
"""Map private-engine staging export -> site-data 1.1 (preview). Strips score/links.aihot/attribution."""
import json, sys, os, hashlib, re
from datetime import datetime, timezone, timedelta
SRC, OUT = sys.argv[1], sys.argv[2]
CST = timezone(timedelta(hours=8))
L = lambda p: json.load(open(os.path.join(SRC, p)))
CAT = {"ai-models":"model","ai-products":"product","industry":"industry","paper":"paper","opinion":"opinion","tip":"tutorial"}
LBL = {"model":"模型","product":"产品","industry":"产业","paper":"论文","tutorial":"教程","opinion":"观点"}
tl = L("v1/timeline/page-1.json"); pool = L("raw/api_site_pool.json")["items"]; meta0 = L("v1/meta.json")
items = {i["id"]: i for i in L("raw/api_v1_items.json")["items"]}
def url(i):
    u = (items.get(i["id"], {}).get("links") or {}).get("original")
    return u if u and u.startswith("http") and "127.0.0.1" not in u else None
def pid(it):
    d = it["publishedAt"][:10]; h = hashlib.sha1(it["id"].encode()).hexdigest()[:8]
    return f"{d}-eng-{h}"
def clean(it, selected):
    c = CAT.get(it.get("category")); u = url(it)
    o = {"id": it["id"], "title": it["title"], "summary": it.get("summary"), "reason": it.get("reason"),
         "source": {"name": it["source"]["name"]}, "publishedAt": it["publishedAt"], "timelineAt": it.get("timelineAt") or it["publishedAt"],
         "category": c, "tags": it.get("tags") or [], "selected": selected, "channel": it.get("channel") or "news", "x": None}
    if selected: o["storyPublicId"] = pid(it)
    if u: o["originalUrl"] = u
    return o
cards = []
for c in tl["cards"]:
    it = clean(c["item"], True)
    cards.append({"key": it["id"], "anchorAt": c["anchorAt"], "item": it, "group": None})
cards.sort(key=lambda c: c["anchorAt"], reverse=True)
now = datetime.now(CST).replace(microsecond=0)
data_as_of = datetime.fromisoformat(meta0["generated_at"])
def w(p, o):
    f = os.path.join(OUT, p); os.makedirs(os.path.dirname(f), exist_ok=True)
    json.dump(o, open(f, "w"), ensure_ascii=False, indent=1)
w("timeline/page-1.json", {"filters": {"channel":"all","category":None,"tag":None}, "cards": cards, "nextCursor": None,
   "dayCounts": tl.get("dayCounts"), "hot": None, "page": 1, "pageCount": 1, "total": len(cards)})
w("timeline/index.json", {"pageSize": 20, "pageCount": 1, "total": len(cards), "pages": [{"page":1,"path":"timeline/page-1.json","count":len(cards),
   "firstAnchorAt": cards[0]["anchorAt"], "lastAnchorAt": cards[-1]["anchorAt"]}]})
hot = L("v1/hot.json")
w("hot.json", {"computedAt": hot.get("computedAt"), "windowHours": hot.get("windowHours", 48), "entries": []})
w("hot-strip.json", [])
evs = []
for c in cards:
    it = c["item"]; rep = {k: it.get(k) for k in ("id","title","summary","publishedAt","selected")}
    rep["source"] = {"name": it["source"]["name"], "firstParty": False}
    if it.get("originalUrl"): rep["originalUrl"] = it["originalUrl"]
    ev = {"publicId": it["storyPublicId"], "title": it["title"], "status": "active", "reportCount": 1, "sourceCount": 1,
          "firstReportAt": it["publishedAt"], "latestAt": it["publishedAt"], "digest": None, "digestUpdatedAt": None,
          "summary": it["summary"], "excerpt": None, "latest": None, "latestReport": None,
          "whyHot": {"participants48h": 1, "newParticipants6h": 0, "recentReports24h": 0, "observationComplete": False, "rank": None},
          "developments": [{"factId": "fact-" + it["storyPublicId"], "title": it["title"], "firstReportAt": it["publishedAt"], "reportCount": 1, "representative": rep}],
          "officialReports": [], "timeline": [rep], "heat": []}
    w(f"events/{ev['publicId']}.json", ev); evs.append(ev)
w("events/index.json", {"events": [{"publicId": e["publicId"], "title": e["title"], "latestAt": e["latestAt"], "reportCount": 1, "hotRank": None} for e in evs]})
w("feed/selected.json", {"feed": {"id":"selected","path":"/feed.xml","title":"前沿趋势 — 精选","limit":50,"description":"最新 50 条前沿趋势精选摘要，保留标题、摘要与原文入口。"},
   "items": [{"guid": c["item"]["id"], "title": c["item"]["title"], "summary": c["item"]["summary"], "originalUrl": c["item"].get("originalUrl"),
              "pubDate": c["item"]["publishedAt"], "sourceName": c["item"]["source"]["name"], "category": c["item"]["category"],
              "categoryLabel": LBL.get(c["item"]["category"]), "eventPublicId": c["item"]["storyPublicId"]} for c in cards]})
docs = []; seen = set()
for c in cards:
    it = c["item"]; seen.add(it["id"])
    d = {"id": it["id"], "kind": "item", "title": it["title"], "summary": it["summary"], "publishedAt": it["publishedAt"], "sourceName": it["source"]["name"],
         "category": it["category"], "selected": True, "eventPublicId": it["storyPublicId"]}
    if it.get("originalUrl"): d["originalUrl"] = it["originalUrl"]
    docs.append(d)
    docs.append({"id": it["storyPublicId"], "kind": "event", "title": it["title"], "summary": it["summary"], "publishedAt": it["publishedAt"],
                 "sourceNames": [it["source"]["name"]], "path": f"/events/{it['storyPublicId']}/"})
poolN = 0
for p in pool:
    if p["id"] in seen: continue
    it = clean(p, False); poolN += 1
    d = {"id": it["id"], "kind": "item", "title": it["title"], "summary": it["summary"], "publishedAt": it["publishedAt"], "sourceName": it["source"]["name"],
         "category": it["category"], "selected": False}
    if it.get("originalUrl"): d["originalUrl"] = it["originalUrl"]
    docs.append(d)
w("search/source.json", {"generatedAt": now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"), "docs": docs})
srcs = sorted({c["item"]["source"]["name"] for c in cards})
w("sources.json", {"sources": [{"sourceId": "eng-" + hashlib.sha1(s.encode()).hexdigest()[:8], "name": s, "tier": "T2", "kind": "editorial", "homepage": None} for s in srcs]})
w("redirects.json", {"note": "preview: none", "redirects": []})
counts = {"cards": len(cards), "pages": 1, "events": len(evs), "hot_entries": 0, "search_docs": len(docs), "feed_items": len(cards),
          "passed_events": len(evs), "below_threshold_events": 0, "redirects": 0, "hot_snapshots": 0, "covers": 0}
w("meta.json", {"site": "前沿趋势", "contract_version": "1.1", "mode": "preview", "data_as_of": data_as_of.isoformat(),
   "data_as_of_label": data_as_of.strftime("数据截至 %Y-%m-%d %H:%M（北京时间）"), "generated_at": now.isoformat(),
   "hot_rule_version": "private-engine staging (hot empty)", "hot_computed_at": None, "window_hours": 48, "spark_points": 25, "page_size": 20,
   "counts": counts, "preview": {"export_stamp": meta0["export_stamp"], "pool_items_in_search": poolN, "note": "engine-v1 preview, not production"}})
w("api/index.json", L("/dev/null") if False else {"version": "1.1", "base": "/api/v1/", "endpoints": [], "note": "preview"})
print(json.dumps(counts, ensure_ascii=False), "pool_in_search", poolN)
