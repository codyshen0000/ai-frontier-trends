# site-data（Task #57 入库）

盒子路径 `/workspace/frontier-hotboard/site-data/` 的仓库真源。热度公式只认 `scripts/engine/heat.mjs`；本目录的 Python 是 port，不再需要导出后 `align_hot_sparks_to_js`。

| 文件 | 作用 |
|---|---|
| `heat48h.py` | heat.mjs port（闭窗口、half-up、trend 先舍入、JS 参与方键、`heat === spark[-1]`） |
| `export_site_data.py` | 盒子导出器入库。无 `l4lib` 时 CLI 退出 2；补丁可单测 |
| `timeline_fallback.py` | 报道标题 grounding 全挂时，用事件标题补时间线 |
| `cover_preserve.py` | `--prev-tip` 保留 `assets/covers/` 同域封面 |
| `align_hot_sparks_to_js.mjs` | **已退役**。默认不改写；仅 `ALIGN_HOT_SPARKS=1` 紧急回滚 |

```bash
# 公式 parity（进 CI）
python3 scripts/verify/heat-py-parity.py
node --test scripts/engine/heat.test.mjs

# 导出补丁
python3 -m unittest discover -s scripts/site-data/tests -p 'test_*.py'

# 确认 align 默认关闭
node scripts/site-data/align_hot_sparks_to_js.mjs scripts/engine/__samples__/out-1700
```
