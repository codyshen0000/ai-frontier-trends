# #51 Baseten `web_list` — git 快照自检

本目录是盒子上已跑通的 Baseten 采集改动的 **git 草稿副本**，范围只含 `web-baseten-blog` / `kind=web_list`。

| 本仓库文件 | 盒子真源（R1 仍读这里） |
|---|---|
| `l4-engine/v0/collect.py` | `/workspace/app-dev/engineering/l4-engine/v0/collect.py` |
| `l4-engine/v0/sources.baseten.json` | `/workspace/frontier-hotboard/l4-sources.json` 里的 `web-baseten-blog` 一条（整份 sources 很大，未入库） |

## 未接线

- **R1 在 cutover 之前仍指向盒子路径**，不会读本目录。
- 本 PR **不改** 线上站点、`engine-data`、R1 cron、盒子 inbox / SQLite。
- `collect.py` 的 `HB` / `L4` / `DB` 仍是盒子绝对路径。在本仓库里直接跑 `main()` 会因缺盒子目录而失败，这是预期。

## Dry-run 预期（list → detail，48h，去重）

`fetch_web_list()`：

1. GET 列表页 `https://www.baseten.co/blog/`（UA + 15s timeout）。
2. `config.linkRegex` 抽出 `/blog/<slug>/`，拼成绝对 URL，按 `allowUrlPrefixes` 过滤，去重，最多 `maxItems: 10`。
3. 逐条 GET 详情页（间隔 0.5s），读 `article:published_time` / `og:published_time`、`og:title`（去掉 `| Baseten`）、`og:description`、`og:image`。
4. 产出 `feedparser.FeedParserDict`，后续走既有 48h 窗、URL 去重、关键词过滤、`imgs()`。

盒子上 2026-10-22 23:16 CST 的 dry-run（无 DB / inbox 写入）：

- 9/10 详情页解析成功，耗时 6.9s
- 7 日内 3 条；**48h 窗内 1 条**：mammoth-1 & elephant-1，发布 2026-10-22 00:58 CST

相对盒子备份，`collect.py` 只多了这些：

- `PICK` 增加 `web-baseten-blog`
- 选择器从 `kind == rss` 改为 `kind in ('rss', 'web_list')`
- 新增 `_meta()` + `fetch_web_list()`；`fetch()` 对 `web_list` 走 HTML 列表解析

## 合入后怎么验

1. **不要**指望合入本 PR 就会让 R1 改读 git。cutover 是另一步：把本目录同步回盒子路径（或改 R1 指向本仓库副本）。
2. cutover 之后，下一次 R1 collect 的 stdout / `rule_stats.per_source` 应出现 `web-baseten-blog`（`fetched` / `sec` / `err` / `kept`）。
3. 无新文时 `kept` 可以为 0；`err` 应为 `null`。有新文时条目形状与 RSS 源相同（`source_id=web-baseten-blog`，`source_kind=web_list`）。
4. 静态自检（不碰盒子、不写 inbox）：

```bash
python3 -m py_compile l4-engine/v0/collect.py
python3 - <<'PY'
import json, pathlib
p = pathlib.Path("l4-engine/v0")
src = json.loads((p/"sources.baseten.json").read_text())["sources"]
assert [s["id"] for s in src] == ["web-baseten-blog"]
assert src[0]["kind"] == "web_list" and src[0]["tos_ok"] is True and src[0]["free"] is True
text = (p/"collect.py").read_text()
assert "web-baseten-blog" in text
assert "def fetch_web_list" in text
assert "kind'] in('rss','web_list')" in text
print("ok")
PY
```
