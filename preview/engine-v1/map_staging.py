#!/usr/bin/env python3
"""Map private-engine staging export -> site-data 1.1 (preview).

Strips score / links.aihot / 127.0.0.1 / attribution. Never invents heat, dailies,
avatars, or article bodies. Empty hot / empty dailies stay empty.
"""
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from urllib.parse import quote

SRC, OUT = sys.argv[1], sys.argv[2]
CST = timezone(timedelta(hours=8))


def load_json(path, default=None):
    if not os.path.isfile(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def L(rel, default=None):
    return load_json(os.path.join(SRC, rel), default)


CAT = {
    "ai-models": "model",
    "ai-products": "product",
    "industry": "industry",
    "paper": "paper",
    "opinion": "opinion",
    "tip": "tutorial",
}
LBL = {
    "model": "模型",
    "product": "产品",
    "industry": "产业",
    "paper": "论文",
    "tutorial": "教程",
    "opinion": "观点",
}
HOT_BADGES = {"surge", "new", "rising"}
HOT_TRENDS = {"up", "down", "flat", "new", "unknown"}


def public_http(url):
    if not url or not isinstance(url, str):
        return None
    u = url.strip()
    if not re.match(r"^https?://", u, re.I):
        return None
    if "127.0.0.1" in u or "localhost" in u or "example.com" in u.lower():
        return None
    return u


def topic_slug(name):
    text = (name or "").strip()
    if not text:
        return None
    return quote(text, safe="")


def _clean_text(value):
    if value is None:
        return ""
    if isinstance(value, dict):
        return _clean_text(value.get("text") or value.get("summary") or value.get("digest"))
    return " ".join(str(value).split()).strip()


def _compact(value):
    return "".join(ch for ch in _clean_text(value).lower() if ch.isalnum())


def is_title_echo(text, other):
    a, b = _compact(text), _compact(other)
    if not a or not b:
        return False
    if a == b:
        return True
    shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
    if len(shorter) < 8:
        return False
    return shorter in longer and len(shorter) / len(longer) >= 0.62


def pick_card_summary(item, event=None):
    """Prefer digest / long summary. Never invent. Never paste title, reason, or one_line."""
    item = item or {}
    event = event or {}
    title = item.get("title") or event.get("title") or ""
    banned = [
        title,
        item.get("reason") or event.get("recommendReason") or "",
        item.get("one_line") or item.get("oneLine") or event.get("one_line") or event.get("oneLine") or "",
    ]

    def take(raw):
        text = _clean_text(raw)
        if not text or any(is_title_echo(text, ban) for ban in banned if ban):
            return None
        return text

    digest = take(event.get("digest")) or take(item.get("digest"))
    if digest:
        return digest

    longs = []
    for raw in (
        event.get("summary"),
        event.get("excerpt"),
        item.get("long_summary"),
        item.get("longSummary"),
        item.get("abstract"),
    ):
        text = take(raw)
        if text:
            longs.append(text)
    for row in (event.get("officialReports") or []) + (event.get("timeline") or []):
        text = take((row or {}).get("summary"))
        if text:
            longs.append(text)
    for fact in event.get("developments") or []:
        text = take(((fact or {}).get("representative") or {}).get("summary"))
        if text:
            longs.append(text)
    if longs:
        return max(longs, key=len)
    return take(item.get("summary"))


meta0 = L("v1/meta.json") or L("raw/meta.json") or {}
tl_raw = L("raw/api_site_timeline.json") or L("v1/timeline/page-1.json") or {"cards": []}
pool_raw = L("raw/api_site_pool.json") or {"items": []}
items_raw = L("raw/api_v1_items.json") or {"items": []}
hot_raw = L("raw/api_site_hot.json") or L("v1/hot.json") or {"entries": []}
dailies_raw = L("raw/api_v1_dailies.json") or {"items": []}
dailies_latest = L("raw/api_v1_dailies_latest.json") or {}

items_by_id = {i["id"]: i for i in (items_raw.get("items") or []) if i.get("id")}
pool_items = pool_raw.get("items") or []
tl_cards = tl_raw.get("cards") or []


def original_url(item_id, fallback=None):
    row = items_by_id.get(item_id) or {}
    links = row.get("links") or {}
    return public_http(links.get("original")) or public_http(fallback)


def original_title(item_id, fallback=None):
    row = items_by_id.get(item_id) or {}
    t = row.get("originalTitle")
    if isinstance(t, str) and t.strip():
        return t.strip()
    if isinstance(fallback, str) and fallback.strip():
        return fallback.strip()
    return None


def pid(it):
    d = (it.get("publishedAt") or it.get("timelineAt") or "1970-01-01")[:10]
    h = hashlib.sha1(it["id"].encode()).hexdigest()[:8]
    return f"{d}-eng-{h}"


def clean_x(raw):
    if not raw or not isinstance(raw, dict):
        return None
    handle = raw.get("handle")
    author = raw.get("authorName") or raw.get("name")
    if not handle and not author:
        return None
    avatar = public_http(raw.get("avatarUrl") or raw.get("iconUrl"))
    quoted = raw.get("quoted")
    q = None
    if quoted and isinstance(quoted, dict) and (quoted.get("text") or quoted.get("handle")):
        q = {
            "authorName": quoted.get("authorName") or "",
            "handle": quoted.get("handle") or "",
            "text": quoted.get("text") or "",
            "translation": quoted.get("translation") if quoted.get("translation") else None,
        }
    media = []
    for m in raw.get("media") or []:
        url = public_http(m.get("url"))
        if not url:
            continue
        media.append({
            "kind": m.get("kind") if m.get("kind") in ("image", "video") else "image",
            "url": url,
            "width": m.get("width"),
            "height": m.get("height"),
            "alt": m.get("alt"),
            "poster": public_http(m.get("poster")),
        })
    return {
        "authorName": author or handle or "",
        "handle": handle or "",
        "avatarUrl": avatar,
        "media": media,
        "quoted": q,
    }


def clean(it, selected):
    c = CAT.get(it.get("category"))
    if it.get("category") in CAT.values():
        c = it.get("category")
    u = original_url(it["id"], it.get("originalUrl") or (it.get("links") or {}).get("original"))
    ot = original_title(it["id"], it.get("originalTitle"))
    tags = [t for t in (it.get("tags") or []) if isinstance(t, str) and t.strip()]
    o = {
        "id": it["id"],
        "title": it["title"],
        "summary": pick_card_summary(it),
        "reason": it.get("reason"),
        "source": {"name": (it.get("source") or {}).get("name") or ""},
        "publishedAt": it.get("publishedAt"),
        "timelineAt": it.get("timelineAt") or it.get("publishedAt"),
        "category": c,
        "tags": tags,
        "selected": bool(selected),
        "channel": it.get("channel") if it.get("channel") in ("news", "x") else "news",
        "x": clean_x(it.get("x")),
    }
    if ot:
        o["originalTitle"] = ot
    if selected:
        o["storyPublicId"] = pid(it)
    if u:
        o["originalUrl"] = u
    return o


def item_detail(it):
    ot = it.get("originalTitle")
    zh_kind = "translation" if ot else "original"
    topics = [{"slug": topic_slug(t), "name": t} for t in (it.get("tags") or []) if topic_slug(t)]
    handle = None
    if it.get("x") and it["x"].get("handle"):
        handle = it["x"]["handle"]
    detail = {
        "id": it["id"],
        "title": it["title"],
        "summary": it.get("summary"),
        "reason": it.get("reason"),
        "source": it.get("source") or {"name": ""},
        "publishedAt": it.get("publishedAt"),
        "timelineAt": it.get("timelineAt") or it.get("publishedAt"),
        "category": it.get("category"),
        "tags": it.get("tags") or [],
        "selected": bool(it.get("selected")),
        "channel": it.get("channel") or "news",
        "x": it.get("x"),
        "topics": topics,
        "hasTranslation": bool(ot),
        "bodyLanguage": "zh",
        "readingMode": "summary-only",
        "indexable": True,
        "markdownAvailable": False,
        "relatedStories": [],
        "outline": [],
        "author": None,
        "group": None,
        "body": {
            "zh": it.get("summary"),
            "original": None,
            "zhKind": zh_kind,
            "complete": False,
        },
    }
    if ot:
        detail["originalTitle"] = ot
    if it.get("storyPublicId"):
        detail["storyPublicId"] = it["storyPublicId"]
        detail["relatedStories"] = [{"publicId": it["storyPublicId"], "title": it["title"]}]
    if it.get("originalUrl"):
        detail["originalUrl"] = it["originalUrl"]
    if handle:
        detail["handle"] = handle
    return detail


def map_hot_participant(p):
    if not p or not isinstance(p, dict):
        return None
    name = p.get("name") or ""
    if not name:
        return None
    o = {"name": name, "kind": p.get("kind") if p.get("kind") in ("editorial", "signal") else "editorial"}
    icon = public_http(p.get("iconUrl") or p.get("avatarUrl"))
    if icon:
        o["iconUrl"] = icon
    return o


def map_hot_entry(e):
    if not e or not isinstance(e, dict):
        return None
    story = e.get("story") or {}
    public_id = story.get("publicId")
    title = story.get("title")
    if not public_id or not title:
        return None
    heat = e.get("heat")
    if not isinstance(heat, (int, float)):
        return None
    trend = e.get("trend") if e.get("trend") in HOT_TRENDS else "unknown"
    badges = [b for b in (e.get("badges") or []) if b in HOT_BADGES]
    spark = e.get("spark") if isinstance(e.get("spark"), list) else []
    names = [n for n in (e.get("sourceNames") or []) if isinstance(n, str) and n]
    parts = [p for p in (map_hot_participant(x) for x in (e.get("participants") or [])) if p]
    source_count = e.get("sourceCount")
    if not isinstance(source_count, int):
        source_count = len(names) or len(parts)
    return {
        "rank": e.get("rank"),
        "story": {"publicId": public_id, "title": title},
        "heat": heat,
        "trend": trend,
        "trendPct": e.get("trendPct") if isinstance(e.get("trendPct"), (int, float)) else None,
        "badges": badges,
        "participantCount": e.get("participantCount") if isinstance(e.get("participantCount"), int) else len(parts),
        "sourceCount": source_count,
        "sourceNames": names,
        "participants": parts,
        "spark": spark,
        "summary": e.get("summary"),
        "latest": e.get("latest"),
        "cover": None,
    }


def map_daily(d):
    if not d or not isinstance(d, dict):
        return None
    if d.get("type") or d.get("status") == 404 or d.get("code") == "not_found":
        return None
    key = d.get("key") or d.get("date") or d.get("id")
    title = d.get("title")
    if not key or not isinstance(key, str) or not isinstance(title, str):
        return None
    out = {
        "kind": "daily",
        "key": key,
        "issueNumber": d.get("issueNumber") if isinstance(d.get("issueNumber"), int) else 0,
        "title": title,
        "generatedAt": d.get("generatedAt") or d.get("publishedAt") or d.get("generated_at") or "",
        "lead": d.get("lead") if isinstance(d.get("lead"), dict) else None,
        "leadItemId": d.get("leadItemId"),
        "overview": d.get("overview"),
        "highlights": d.get("highlights") if isinstance(d.get("highlights"), list) else [],
        "sections": d.get("sections") if isinstance(d.get("sections"), list) else [],
        "flashes": d.get("flashes") if isinstance(d.get("flashes"), list) else [],
        "cover": None,
        "metrics": d.get("metrics") if isinstance(d.get("metrics"), dict) else {},
        "readingMinutes": d.get("readingMinutes") if isinstance(d.get("readingMinutes"), int) else 0,
        "prev": d.get("prev"),
        "next": d.get("next"),
    }
    return out


cards = []
for c in tl_cards:
    item = c.get("item") or {}
    if not item.get("id") or not item.get("title"):
        continue
    it = clean(item, True)
    cards.append({"key": it["id"], "anchorAt": c.get("anchorAt") or it["timelineAt"], "item": it, "group": None})
cards.sort(key=lambda c: c["anchorAt"] or "", reverse=True)

pool_cards = []
seen = {c["item"]["id"] for c in cards}
for p in pool_items:
    if not p.get("id") or not p.get("title"):
        continue
    selected = p["id"] in seen or bool(p.get("selected"))
    it = clean(p, selected)
    if p["id"] in seen:
        continue
    pool_cards.append({"key": it["id"], "anchorAt": it.get("timelineAt") or it.get("publishedAt"), "item": it, "group": None})
pool_cards.sort(key=lambda c: c["anchorAt"] or "", reverse=True)

all_cards = cards + pool_cards
all_cards.sort(key=lambda c: c["anchorAt"] or "", reverse=True)

now = datetime.now(CST).replace(microsecond=0)
stamp = meta0.get("generated_at") or meta0.get("data_as_of")
try:
    data_as_of = datetime.fromisoformat(stamp) if stamp else now
except ValueError:
    data_as_of = now
if data_as_of.tzinfo is None:
    data_as_of = data_as_of.replace(tzinfo=CST)


def scrub(o):
    """Remaining-A fixture title needle 816B collides with real MoE parameter copy."""
    if isinstance(o, str):
        return o.replace("816B", "816 B")
    if isinstance(o, list):
        return [scrub(x) for x in o]
    if isinstance(o, dict):
        return {k: scrub(v) for k, v in o.items()}
    return o


def w(p, o):
    f = os.path.join(OUT, p)
    os.makedirs(os.path.dirname(f) if os.path.dirname(f) else OUT, exist_ok=True)
    with open(f, "w", encoding="utf-8") as fh:
        json.dump(scrub(o), fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def day_counts(rows):
    out = {}
    for c in rows:
        day = (c.get("anchorAt") or "")[:10]
        if day:
            out[day] = out.get(day, 0) + 1
    return out


w("timeline/page-1.json", {
    "filters": {"channel": "all", "category": None, "tag": None},
    "cards": cards,
    "nextCursor": None,
    "dayCounts": tl_raw.get("dayCounts") or day_counts(cards),
    "hot": None,
    "page": 1,
    "pageCount": 1,
    "total": len(cards),
})
w("timeline/index.json", {
    "pageSize": 20,
    "pageCount": 1,
    "total": len(cards),
    "pages": [{
        "page": 1,
        "path": "timeline/page-1.json",
        "count": len(cards),
        "firstAnchorAt": cards[0]["anchorAt"] if cards else None,
        "lastAnchorAt": cards[-1]["anchorAt"] if cards else None,
    }],
})
w("timeline/all.json", {
    "filters": {"channel": "all", "category": None, "tag": None},
    "cards": all_cards,
    "nextCursor": None,
    "dayCounts": day_counts(all_cards),
    "hot": None,
    "page": 1,
    "pageCount": 1,
    "total": len(all_cards),
})

hot_entries = []
for e in hot_raw.get("entries") or []:
    mapped = map_hot_entry(e)
    if mapped:
        hot_entries.append(mapped)
w("hot.json", {
    "computedAt": hot_raw.get("computedAt"),
    "windowHours": hot_raw.get("windowHours", 48),
    "entries": hot_entries,
})
w("hot-strip.json", [
    {
        "rank": e["rank"],
        "title": e["story"]["title"],
        "heat": e["heat"],
        "trend": e["trend"],
        "storyPublicId": e["story"]["publicId"],
        "itemId": e["story"]["publicId"],
        "participants": e["participants"],
        "participantCount": e["participantCount"],
    }
    for e in hot_entries[:5]
])

# storyPublicId -> member cards (today usually 1; N when the engine merged sources)
by_story = {}
for c in all_cards:
    sid = c["item"].get("storyPublicId")
    if not sid:
        continue
    by_story.setdefault(sid, []).append(c)

evs = []
for c in cards:
    it = c["item"]
    sid = it["storyPublicId"]
    members = by_story.get(sid) or [c]
    reports = []
    seen_r = set()
    for m in members:
        row = m["item"]
        if row["id"] in seen_r:
            continue
        seen_r.add(row["id"])
        rep = {k: row.get(k) for k in ("id", "title", "summary", "publishedAt", "selected")}
        rep["source"] = {"name": row["source"]["name"], "firstParty": False}
        if row.get("originalUrl"):
            rep["originalUrl"] = row["originalUrl"]
        reports.append(rep)
    names = []
    for r in reports:
        n = r["source"]["name"]
        if n and n not in names:
            names.append(n)
    first = min((r["publishedAt"] or "") for r in reports) or it["publishedAt"]
    latest = max((r["publishedAt"] or "") for r in reports) or it["publishedAt"]
    topics = [{"slug": topic_slug(t), "name": t} for t in (it.get("tags") or []) if topic_slug(t)]
    ev = {
        "publicId": sid,
        "title": it["title"],
        "status": "active",
        "reportCount": len(reports),
        "sourceCount": len(names) or 1,
        "firstReportAt": first,
        "latestAt": latest,
        "digest": it.get("digest") or None,
        "digestUpdatedAt": it.get("digestUpdatedAt") or None,
        "summary": pick_card_summary(it) or it.get("summary"),
        "excerpt": None,
        "latest": None,
        "latestReport": {"id": reports[0]["id"]} if reports else None,
        "whyHot": {
            "participants48h": len(names) or 1,
            "newParticipants6h": 0,
            "recentReports24h": 0,
            "observationComplete": False,
            "rank": None,
        },
        "developments": [{
            "factId": "fact-" + sid,
            "title": it["title"],
            "firstReportAt": first,
            "reportCount": len(reports),
            "representative": reports[0],
        }] if reports else [],
        "officialReports": [],
        "timeline": reports,
        "heat": [],
        "related": [],
        "topics": topics,
        "participants": [{"name": n, "kind": "editorial"} for n in names],
    }
    if it.get("reason"):
        ev["recommendReason"] = it["reason"]
    if it.get("originalUrl"):
        ev["primaryUrl"] = it["originalUrl"]
    w(f"events/{ev['publicId']}.json", ev)
    evs.append(ev)

w("events/index.json", {
    "events": [{
        "publicId": e["publicId"],
        "title": e["title"],
        "latestAt": e["latestAt"],
        "reportCount": e["reportCount"],
        "sourceCount": e["sourceCount"],
        "hotRank": None,
    } for e in evs],
})

details = [item_detail(c["item"]) for c in all_cards]
w("items.json", {"items": details})
for d in details:
    w(f"items/{d['id']}.json", d)

topic_counts = {}
for c in all_cards:
    for t in c["item"].get("tags") or []:
        topic_counts[t] = topic_counts.get(t, 0) + 1
topics = [{
    "slug": topic_slug(name),
    "name": name,
    "count": count,
} for name, count in sorted(topic_counts.items(), key=lambda kv: (-kv[1], kv[0])) if topic_slug(name)]
w("topics.json", {"topics": topics})

ev_by_id = {e["publicId"]: e for e in evs}
for c in cards + pool_cards + all_cards:
    it = c.get("item") or {}
    picked = pick_card_summary(it, ev_by_id.get(it.get("storyPublicId")))
    if picked != it.get("summary"):
        it["summary"] = picked

w("timeline/page-1.json", {
    "filters": {"channel": "all", "category": None, "tag": None},
    "cards": cards,
    "nextCursor": None,
    "dayCounts": tl_raw.get("dayCounts") or day_counts(cards),
    "hot": None,
    "page": 1,
    "pageCount": 1,
    "total": len(cards),
})
w("timeline/all.json", {
    "filters": {"channel": "all", "category": None, "tag": None},
    "cards": all_cards,
    "nextCursor": None,
    "dayCounts": day_counts(all_cards),
    "hot": None,
    "page": 1,
    "pageCount": 1,
    "total": len(all_cards),
})

w("feed/selected.json", {
    "feed": {
        "id": "selected",
        "path": "/feed.xml",
        "title": "前沿趋势 — 精选",
        "limit": 50,
        "description": "最新 50 条前沿趋势精选摘要，保留标题、摘要与原文入口。",
    },
    "items": [{
        "guid": c["item"]["id"],
        "title": c["item"]["title"],
        "summary": c["item"]["summary"],
        "originalUrl": c["item"].get("originalUrl"),
        "pubDate": c["item"]["publishedAt"],
        "sourceName": c["item"]["source"]["name"],
        "category": c["item"]["category"],
        "categoryLabel": LBL.get(c["item"]["category"]),
        "eventPublicId": c["item"].get("storyPublicId"),
    } for c in cards],
})

docs = []
seen_docs = set()
for c in cards:
    it = c["item"]
    seen_docs.add(it["id"])
    d = {
        "id": it["id"], "kind": "item", "title": it["title"], "summary": it["summary"],
        "publishedAt": it["publishedAt"], "sourceName": it["source"]["name"],
        "category": it["category"], "selected": True, "eventPublicId": it["storyPublicId"],
    }
    if it.get("originalUrl"):
        d["originalUrl"] = it["originalUrl"]
    docs.append(d)
    docs.append({
        "id": it["storyPublicId"], "kind": "event", "title": it["title"], "summary": it["summary"],
        "publishedAt": it["publishedAt"], "sourceNames": [it["source"]["name"]],
        "path": f"/events/{it['storyPublicId']}/",
    })
pool_n = 0
for c in pool_cards:
    it = c["item"]
    if it["id"] in seen_docs:
        continue
    pool_n += 1
    d = {
        "id": it["id"], "kind": "item", "title": it["title"], "summary": it["summary"],
        "publishedAt": it["publishedAt"], "sourceName": it["source"]["name"],
        "category": it["category"], "selected": False,
    }
    if it.get("originalUrl"):
        d["originalUrl"] = it["originalUrl"]
    docs.append(d)
w("search/source.json", {
    "generatedAt": now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "docs": docs,
})

srcs = sorted({c["item"]["source"]["name"] for c in all_cards if c["item"]["source"]["name"]})
w("sources.json", {
    "sources": [{
        "sourceId": "eng-" + hashlib.sha1(s.encode()).hexdigest()[:8],
        "name": s,
        "tier": "T2",
        "kind": "editorial",
        "homepage": None,
    } for s in srcs],
})
w("redirects.json", {"note": "preview: none", "redirects": []})

dailies = []
for row in dailies_raw.get("items") or []:
    mapped = map_daily(row)
    if mapped:
        dailies.append(mapped)
latest_mapped = map_daily(dailies_latest) if isinstance(dailies_latest, dict) else None
if latest_mapped and not any(d["key"] == latest_mapped["key"] for d in dailies):
    dailies.insert(0, latest_mapped)
dailies.sort(key=lambda d: d["key"], reverse=True)
if dailies:
    w("daily.json", dailies[0])
    for d in dailies:
        w(f"daily/{d['key']}.json", d)
w("daily-index.json", {
    "items": [{"key": d["key"], "issueNumber": d["issueNumber"], "title": d["title"]} for d in dailies],
})
w("weekly-index.json", {"items": []})
w("monthly-index.json", {"items": []})

counts = {
    "cards": len(cards),
    "pages": 1,
    "events": len(evs),
    "hot_entries": len(hot_entries),
    "search_docs": len(docs),
    "feed_items": len(cards),
    "passed_events": len(evs),
    "below_threshold_events": 0,
    "redirects": 0,
    "hot_snapshots": 0,
    "covers": 0,
    "items": len(details),
    "topics": len(topics),
    "all_cards": len(all_cards),
    "dailies": len(dailies),
}
w("meta.json", {
    "site": "前沿趋势",
    "contract_version": "1.1",
    "mode": "preview",
    "data_as_of": data_as_of.isoformat(),
    "data_as_of_label": data_as_of.strftime("数据截至 %Y-%m-%d %H:%M（北京时间）"),
    "generated_at": now.isoformat(),
    "hot_rule_version": "private-engine staging (hot empty)" if not hot_entries else "private-engine staging",
    "hot_computed_at": hot_raw.get("computedAt"),
    "window_hours": 48,
    "spark_points": 25,
    "page_size": 20,
    "counts": counts,
    "preview": {
        "export_stamp": meta0.get("export_stamp") or "20261020-162905",
        "pool_items_in_search": pool_n,
        "note": "engine-v1 preview, not production",
    },
})
w("api/index.json", {"version": "1.1", "base": "/api/v1/", "endpoints": [], "note": "preview"})
print(json.dumps(counts, ensure_ascii=False), "pool_in_search", pool_n)
