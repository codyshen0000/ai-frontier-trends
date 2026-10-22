#!/workspace/app-dev/engineering/l4-engine/v0/.venv/bin/python
"""L4 v0 collector: RSS (tos_ok=true) -> dedupe -> keyword filter -> SQLite -> inbox batch per l4-bot-io.schema.json."""
import json,re,time,hashlib,sqlite3,datetime as dt,concurrent.futures as cf,urllib.parse,os,sys,html as H
import feedparser,requests
VER="l4-v0-collector/0.1"
HB="/workspace/frontier-hotboard"; L4=HB+"/l4"; DB="/workspace/l4-runtime/engine.sqlite"
UA="Mozilla/5.0 (X11; Linux x86_64) frontier-l4-collector/0.1 (+https://codyshen0000.github.io/ai-frontier-trends/)"
PICK=["rss-openai-news","rss-google-deepmind","rss-google-ai-blog","rss-hf-blog","rss-interconnects","rss-the-decoder","rss-qbitai",
 "rss-google-research","rss-microsoft-research","rss-nvidia-dev","rss-github-ai","rss-mistral","rss-qwen-blog","rss-claude-release-notes",
 "rss-simon-willison","rss-latent-space","rss-verge-ai","rss-techcrunch-ai","hn-ai-front","rss-ithome","rss-vllm-blog","rss-wiz-blog","web-baseten-blog"]
CAP=80; WINH=48
CST=dt.timezone(dt.timedelta(hours=8)); NOW=dt.datetime.now(dt.timezone.utc); WIN=NOW-dt.timedelta(hours=WINH)
FOCUS={"dmd-distill":r"PDMD|DMD|少步|扩散蒸馏|diffusion distill|GFD-OPD|π-Flow|MeanFlow|一致性蒸馏",
 "batch-rl":r"batch\s*RL|批量\s*RL|offline\s*RL|离线\s*RL","gpt-image-2-5":r"GPT[\s-]*Image[\s-]*2\.5","qwen-image":r"Qwen[ -]?Image",
 "viescore2":r"VIEScore","post-training":r"后训练|\bRL\b|\bSFT\b|rubric|\bOPD\b|post-training","rsi":r"\bRSI\b|recursive\s*self[- ]?improv|RSIGym"}
GEN=r"LLM|大模型|language model|diffusion|text-to-image|text-to-video|image edit|video generation|RLHF|GRPO|DPO|reward model|distillation|agent|open-weight|开源权重"
KW=re.compile("|".join(list(FOCUS.values())+[GEN]),re.I); FRX={k:re.compile(v,re.I) for k,v in FOCUS.items()}
NOISE=[("version_only",re.compile(r"^\s*v?\d+(\.\d+)+\S*\s*$")),("bugfix_only",re.compile(r"^(bug ?fix|fix(es)?|patch)\b",re.I)),("promo",re.compile(r"sponsored|赞助|广告|优惠|限时",re.I))]
BADIMG=re.compile(r"\.svg(\?|$)|logo|avatar|gravatar|pixel|1x1|spacer|emoji|feeds\.feedburner|tracking",re.I)
_XKW={}
def kw_hit(s,text):
    """Global KW, plus per-source extra_keywords (e.g. Wiz security-AI terms); extras only widen that source."""
    if KW.search(text): return True
    x=s.get('extra_keywords')
    if not x: return False
    if x not in _XKW: _XKW[x]=re.compile(x,re.I)
    return bool(_XKW[x].search(text))
def norm(u):
    p=urllib.parse.urlsplit(u.strip()); q=[(k,v) for k,v in urllib.parse.parse_qsl(p.query) if not k.lower().startswith('utm_') and k not in('ref','source','fbclid')]
    return urllib.parse.urlunsplit(('https',p.netloc.lower().removeprefix('www.') if False else p.netloc.lower(),p.path.rstrip('/') or '/',urllib.parse.urlencode(q),''))
def strip(h): return re.sub(r'\s+',' ',H.unescape(re.sub(r'<[^>]+>',' ',h or ''))).strip()
def toint(x):
    try: return int(str(x).strip().rstrip('px'))
    except: return None
def imgs(e):
    out=[]
    for m in (e.get('media_content') or [])+(e.get('media_thumbnail') or []):
        if m.get('url') and (m.get('medium') in (None,'image') ) : out.append({"url":m['url'],"width":toint(m.get('width')),"height":toint(m.get('height')),"from":"feed_media","alt":None})
    for en in e.get('enclosures',[]):
        if str(en.get('type','')).startswith('image') and en.get('href'): out.append({"url":en['href'],"width":None,"height":None,"from":"feed_enclosure","alt":None})
    html=''.join(c.get('value','') for c in e.get('content',[])) or (e.get('summary') or '')
    for i,tag in enumerate(re.findall(r'<img\b[^>]*>',html)[:6]):
        m=re.search(r'\bsrc=["\']([^"\']+)',tag)
        if not m: continue
        w=re.search(r'\bwidth=["\']?(\d+)',tag); h=re.search(r'\bheight=["\']?(\d+)',tag); a=re.search(r'\balt=["\']([^"\']*)',tag)
        out.append({"url":H.unescape(m.group(1)),"width":int(w.group(1)) if w else None,"height":int(h.group(1)) if h else None,"from":"body_first_img" if i==0 else "body_img","alt":(a.group(1)[:120] if a else None)})
    res=[];seen=set()
    for c in out:
        u=c['url']
        if not u.startswith('http') or BADIMG.search(u) or u in seen: continue
        if c['width'] is not None and c['width']<480: continue   # MIT rule: width>=480 or unknown
        seen.add(u); res.append(c)
    for i,c in enumerate(res): c['position']=i
    return res[:5]
def _meta(h,prop):
    for rx in (r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]*content=["\']([^"\']+)'%re.escape(prop), r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']%s["\']'%re.escape(prop)):
        m=re.search(rx,h,re.I)
        if m: return H.unescape(m.group(1)).strip()
def fetch_web_list(s):
    """kind=web_list, parseMode=html: list page -> linkRegex -> detail meta article:published_time."""
    c=s.get('config') or {}; base=urllib.parse.urlsplit(s['url']); root=f"{base.scheme}://{base.netloc}"
    r=requests.get(s['url'],headers={"User-Agent":UA},timeout=15); r.raise_for_status()
    links=[]
    for m in re.findall(c.get('linkRegex',r'href="([^"]+)"'),r.text):
        u=urllib.parse.urljoin(root+"/",H.unescape(m))
        if u.rstrip('/')==s['url'].rstrip('/') or u in links: continue
        if c.get('allowUrlPrefixes') and not any(u.startswith(p) for p in c['allowUrlPrefixes']): continue
        links.append(u)
        if len(links)>=c.get('maxItems',10): break
    items=[]
    for u in links:
        try:
            time.sleep(0.5)
            d=requests.get(u,headers={"User-Agent":UA},timeout=15); d.raise_for_status(); h=d.text
            pt=_meta(h,'article:published_time') or _meta(h,'og:published_time')
            if not pt: continue
            pub=dt.datetime.fromisoformat(pt.replace('Z','+00:00'))
            if pub.tzinfo is None: pub=pub.replace(tzinfo=dt.timezone.utc)
            pub=pub.astimezone(dt.timezone.utc)
            t=_meta(h,'og:title') or strip((re.search(r'<title[^>]*>(.*?)</title>',h,re.I|re.S) or [None,''])[1])
            t=re.sub(r'\s*[|\-–]\s*Baseten\s*$','',t or '').strip()
            img=_meta(h,'og:image'); desc=_meta(h,'og:description') or _meta(h,'description') or ''
            e=feedparser.FeedParserDict(link=u,title=t,summary=desc,id=u,author=_meta(h,'author'),
              media_content=([{"url":img,"medium":"image"}] if img else []))
            items.append((e,pub))
        except Exception: continue
    return items
def fetch(s):
    t0=time.time()
    try:
        if s['kind']=='web_list': return s,fetch_web_list(s),round(time.time()-t0,2),None
        r=requests.get(s['url'],headers={"User-Agent":UA},timeout=15); r.raise_for_status()
        f=feedparser.parse(r.content); items=[]
        for e in f.entries:
            tt=e.get('published_parsed') or e.get('updated_parsed')
            if not tt or not e.get('link'): continue
            items.append((e,dt.datetime(*tt[:6],tzinfo=dt.timezone.utc)))
        return s,items,round(time.time()-t0,2),None
    except Exception as ex: return s,[],round(time.time()-t0,2),f"{type(ex).__name__}: {str(ex)[:80]}"
def batch_taken(b, db=None):
    """A batch id is taken if any artifact of it exists anywhere: inbox jsonl/ready, outbox dir, carryover, work dir, or runs row."""
    paths=[f"{L4}/inbox/{b}.jsonl",f"{L4}/inbox/{b}.ready.json",f"{L4}/outbox/{b}",f"{L4}/carryover/{b}.jsonl",f"{L4}/work/{b}"]
    if any(os.path.exists(x) for x in paths): return True
    if db is not None:
        try:
            if db.execute("select 1 from runs where batch_id=?",(b,)).fetchone(): return True
            if db.execute("select 1 from queue_batches where id=?",(b,)).fetchone(): return True
        except sqlite3.OperationalError: pass
    return False
def new_batch_id(db=None, now=None):
    """Never reuse a batch id: YYYY-MM-DDTHHMM, else -2, -3 ... until free."""
    base=(now or dt.datetime.now(CST)).strftime("%Y-%m-%dT%H%M"); b=base; n=1
    while batch_taken(b, db): n+=1; b=f"{base}-{n}"
    return b
def xwrite(path):
    """Exclusive create: raises FileExistsError instead of overwriting an existing batch file."""
    return open(path,"x")
def write_heartbeat(batch_id, count, status="ok", seconds=0, source_errors=0):
    """Write collector heartbeat after a successful collect. Does not touch inbox."""
    state_dir=f"{L4}/state"; os.makedirs(state_dir, exist_ok=True)
    payload={
        "at": dt.datetime.now(CST).isoformat(timespec="seconds"),
        "batch_id": batch_id,
        "count": int(count),
        "status": status,
        "seconds": float(seconds),
        "source_errors": int(source_errors),
        "written_by": "collect.py",
    }
    hb=f"{state_dir}/heartbeat-collector.json"
    tmp=hb+".tmp"
    with open(tmp,"w") as hf: json.dump(payload, hf, ensure_ascii=False)
    os.replace(tmp, hb)
    return payload
def main():
    srcs={x['id']:x for x in json.load(open(HB+"/l4-sources.json"))['sources']}
    src=[srcs[i] for i in PICK if i in srcs and srcs[i].get('tos_ok') is True and srcs[i]['kind'] in('rss','web_list')]
    cat=dt.datetime.now(CST).isoformat(timespec='seconds')
    db=sqlite3.connect(DB); batch=new_batch_id(db)
    if "--dry-check-batch-id" in sys.argv: print(batch); return
    db.executescript("""create table if not exists items(item_id text primary key,content_hash text,source_id text,url text,url_normalized text,title text,published_at text,first_seen text,last_seen text,batch_id text,status text,json text);
    create table if not exists runs(batch_id text primary key,started text,stats text);""")
    t0=time.time()
    with cf.ThreadPoolExecutor(20) as ex: res=list(ex.map(fetch,src))
    st={"raw":0,"stale_dropped":0,"dedup_dropped":0,"keyword_dropped":0,"kept":0,"revisions":0}; per={}; rows=[]; seen=set()
    for s,items,sec,err in res:
        per[s['id']]={"fetched":len(items),"sec":sec,"err":err,"kept":0}
        for e,pub in items:
            st['raw']+=1
            if pub<WIN or pub>NOW+dt.timedelta(hours=1): st['stale_dropped']+=1; continue
            url=e['link'].strip(); nu=norm(url); iid="sha256:"+hashlib.sha256(nu.encode()).hexdigest()[:16]
            title=strip(e.get('title')); summ=strip(e.get('summary'))[:600]
            body=strip(''.join(c.get('value','') for c in e.get('content',[])))
            ch="sha256:"+hashlib.sha256((re.sub(r'\s+',' ',title.lower())+"|"+nu+"|"+summ).encode()).hexdigest()[:16]
            if nu in seen: st['dedup_dropped']+=1; continue
            seen.add(nu)
            row=db.execute("select content_hash from items where item_id=?",(iid,)).fetchone()
            if row and row[0]==ch: st['dedup_dropped']+=1; db.execute("update items set last_seen=? where item_id=?",(cat,iid)); continue
            dedup="revision" if row else "new"
            text=title+" "+summ; hit=kw_hit(s,text)
            if s.get('llm_pass_rate',1)<1 and not hit: st['keyword_dropped']+=1; continue
            noise=[n for n,rx in NOISE if rx.search(title)]
            it=dict(item_id=iid,source_id=s['id'],source_name=s['name'],source_kind=s['kind'],tier=s['tier'],evidence_grade=s['evidence_grade'],lang=s['lang'],
              participation_mode=s['participation_mode'],url=url,url_normalized=nu,title=title,summary=summ or None,
              body_text=(body[:6000] if len(body)>800 else None),body_available=len(body)>800,body_chars=len(body),
              published_at=pub.isoformat().replace('+00:00','Z'),collected_at=cat,author=e.get('author'),external_id=e.get('id'),content_hash=ch,
              image_candidates=imgs(e),engagement=None,
              rule_prefilter={"dedup":dedup,"keyword_hit":hit,"focus_hits":[k for k,rx in FRX.items() if rx.search(text)],"tier_rank":{"T1":1,"T1_5":2,"T2":3}[s['tier']],"noise_flags":noise},extra=None)
            if dedup=="revision": st['revisions']+=1
            rows.append(it); per[s['id']]['kept']+=1
    rows.sort(key=lambda r:(r['rule_prefilter']['tier_rank'],0 if r['rule_prefilter']['focus_hits'] else 1,0 if r['rule_prefilter']['keyword_hit'] else 1,-dt.datetime.fromisoformat(r['published_at'].replace('Z','+00:00')).timestamp()))
    q,carry=rows[:CAP],rows[CAP:]; st['kept']=len(q); st['carried_over']=len(carry)
    for r in rows:
        db.execute("insert or replace into items values(?,?,?,?,?,?,?,coalesce((select first_seen from items where item_id=?),?),?,?,?,?)",
          (r['item_id'],r['content_hash'],r['source_id'],r['url'],r['url_normalized'],r['title'],r['published_at'],r['item_id'],cat,cat,batch,"queued" if r in q else "carryover",json.dumps(r,ensure_ascii=False)))
    jl=f"{L4}/inbox/{batch}.jsonl"
    while True:  # claim the id atomically; on a race pick the next free id
        try: f=xwrite(jl); break
        except FileExistsError: batch=new_batch_id(db); jl=f"{L4}/inbox/{batch}.jsonl"
    with f:
        for r in q: f.write(json.dumps(r,ensure_ascii=False)+"\n")
    if carry:
        with xwrite(f"{L4}/carryover/{batch}.jsonl") as f:
            for r in carry: f.write(json.dumps(r,ensure_ascii=False)+"\n")
    sha=hashlib.sha256(open(jl,'rb').read()).hexdigest()
    man=dict(batch_id=batch,file=os.path.basename(jl),count=len(q),sha256=sha,written_at=dt.datetime.now(CST).isoformat(timespec='seconds'),collector_version=VER,
      window={"from":WIN.astimezone(CST).isoformat(timespec='seconds'),"to":NOW.astimezone(CST).isoformat(timespec='seconds')},
      rule_stats=dict(st,fetch_seconds=round(time.time()-t0,1),sources=len(src),per_source=per))
    db.execute("insert or replace into runs values(?,?,?)",(batch,cat,json.dumps(man['rule_stats'],ensure_ascii=False))); db.commit()
    with xwrite(f"{L4}/inbox/{batch}.ready.json") as rf: json.dump(man,rf,ensure_ascii=False,indent=1)  # written LAST
    src_err=sum(1 for v in per.values() if v.get("err"))
    write_heartbeat(batch, len(q), status="ok", seconds=round(time.time()-t0,1), source_errors=src_err)
    print(json.dumps({k:man[k] for k in('batch_id','file','count','sha256')},ensure_ascii=False)); print(json.dumps(st)); 
    for k,v in per.items(): print(k,v)
if __name__=="__main__": main()
