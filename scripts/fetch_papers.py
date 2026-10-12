#!/usr/bin/env python3
"""Collect every arXiv paper cited in content/, fetch its metadata and (license permitting)
its first figure from the arXiv HTML render, at original resolution.
Output: content/papers/cache/<id>/meta.json (+ fig file). Never invents: if anything is
missing it records nothing for that field. Re-runs only fetch new ids (cache)."""
import html, json, os, re, sys, time, urllib.error, urllib.request
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CONTENT = os.path.join(ROOT, "content")
CACHE = os.path.join(CONTENT, "papers", "cache")
UA = {"User-Agent": "ai-frontier-trends-site/1.0 (figure credit bot)"}
# CC licenses allow redistribution with credit; arXiv's default non-exclusive licence does not.
REUSE = re.compile(r"creativecommons\.org/(licenses/(by|by-sa|by-nc|by-nc-sa|by-nd|by-nc-nd)/|publicdomain/zero/)")

def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503, 403) and i < tries - 1:
                time.sleep(5 * (i + 1)); continue
            raise

def ids_in_content():
    ids = set()
    for d, _, fs in os.walk(CONTENT):
        if "papers" in d.split(os.sep): continue
        for f in fs:
            if f.endswith((".md", ".html")):
                txt = open(os.path.join(d, f), encoding="utf-8", errors="ignore").read()
                ids |= set(re.findall(r"arxiv\.org/(?:abs|html|pdf)/(\d{4}\.\d{4,5})", txt))
    return sorted(ids)

def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", " ", s)).replace("\n", " ").strip()

def fetch(aid):
    out = os.path.join(CACHE, aid); os.makedirs(out, exist_ok=True)
    meta = {"id": aid, "abs": f"https://arxiv.org/abs/{aid}"}
    a = get(meta["abs"]).decode("utf-8", "replace")
    t = re.search(r'<meta name="citation_title" content="([^"]+)"', a)
    meta["title"] = html.unescape(t.group(1)) if t else ""
    ab = re.search(r'<meta name="citation_abstract" content="([^"]+)"', a) or re.search(r'<meta property="og:description" content="([^"]+)"', a)
    if ab:
        first = re.split(r"(?<=[.!?])\s", html.unescape(ab.group(1)).strip())[0]
        meta["abstract_first"] = re.sub(r"\s+", " ", first)[:400]
    lic = REUSE.search(a)
    meta["license"] = ("https://" + lic.group(0)) if lic else "arXiv non-exclusive (no reuse)"
    meta["reuse_ok"] = bool(lic)
    if not lic:
        return meta
    try:
        h = get(f"https://arxiv.org/html/{aid}").decode("utf-8", "replace")
    except Exception as e:
        meta["fig_error"] = f"no arXiv HTML ({type(e).__name__})"; return meta
    # Prefer an overview/architecture figure among the first 3; else Figure 1.
    figs = []
    for m in re.finditer(r'<figure[^>]*id="([^"]*F(\d+))"[^>]*class="ltx_figure[^"]*"[^>]*>([\s\S]*?)</figure>', h):
        img = re.search(r'<(?:img[^>]*src|object[^>]*data)="([^"]+\.(?:png|jpe?g|gif|webp|svg))"', m.group(3), re.I)
        if not img: continue
        cap = re.search(r'<figcaption[^>]*>([\s\S]*?)</figcaption>', m.group(3))
        figs.append((int(m.group(2)), img.group(1), clean(cap.group(1)) if cap else ""))
    arch = [f for f in figs[:3] if re.search(r"overview|architecture|framework|pipeline|illustration of|method", f[2], re.I)]
    pick = (arch or figs[:1])
    if pick:
        no, src, cap = pick[0]
        url = src if src.startswith("http") else f"https://arxiv.org/html/{aid}/" + (src.split(f"{aid}/", 1)[-1] if f"{aid}" in src.split("/")[0] else src)
        if src.split("/")[0].startswith(aid): url = f"https://arxiv.org/html/{aid}/" + src.split("/", 1)[1]
        data = get(url)
        fn = f"fig{no}{os.path.splitext(src)[1].lower()}"
        open(os.path.join(out, fn), "wb").write(data)
        cap = re.sub(r"^\s*Figure\s*\d+\s*[:.]?\s*", "", cap)
        meta.update(fig_file=fn, fig_no=no, fig_src=url, fig_caption=(cap[:160] + ("…" if len(cap) > 160 else "")))
    else:
        meta["fig_error"] = "no image figure in arXiv HTML"
    return meta

def main():
    os.makedirs(CACHE, exist_ok=True)
    ids = ids_in_content()
    new = 0
    for aid in ids:
        mp = os.path.join(CACHE, aid, "meta.json")
        if os.path.exists(mp) and "--refresh" not in sys.argv:
            old = json.load(open(mp))
            if old.get("fig_file") or not old.get("reuse_ok"): continue
        try:
            meta = fetch(aid); new += 1
        except Exception as e:
            print(f"{aid}: skip ({type(e).__name__})"); continue
        json.dump(meta, open(mp, "w"), ensure_ascii=False, indent=1)
        print(aid, "fig" if meta.get("fig_file") else ("no-reuse" if not meta["reuse_ok"] else meta.get("fig_error")))
        time.sleep(3.0)
    print(f"papers: {len(ids)} cited, {new} fetched")

if __name__ == "__main__":
    main()
