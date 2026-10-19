# 阅读站 token 对照

趋势子站壳层（`src/skin-raw.css`，选择器 `html.ft-shell`）覆盖共享 `ds.css` 的一部分 token。学术站仍走 `ds.css` 默认值；本页只列阅读站变体。

| 角色 | 阅读站 | 原 `ds.css` | 备注 |
|---|---|---|---|
| 纸面背景 | `--ft-paper` `#faf9f6` | `--ds-bg` `#f5f5f7` | 暖纸，无渐变 |
| 凹陷 / sunk | `--ft-sunk` `#f3f3ef` | `--ds-surface-3` `#e8e8ed` | 侧栏 hover、次级底 |
| 卡片抬起 | `--ft-elev` `#fffefb` | `--ds-bg-elevated` `#fff` | hairline 卡片，无重阴影 |
| 正文墨色 | `--ft-ink` `#1c1c1a` | `--ds-text` `#1d1d1f` | |
| 次级文字 | `--ft-muted` `#6b6a64` | `--ds-text-secondary` `#6e6e73` | |
| 发丝线 | `--ft-line` `#e6e4dc` | `--ds-hairline` `rgba(0,0,0,.08)` | |
| 强调色 | `--ft-teal` `#0f766e` | `--ds-accent` `#0071e3` | 单色；暗色改 cyan `#22d3ee` |
| 强调浅底 | `--ft-teal-soft` `#e7f3f1` | `--ds-accent-soft` 蓝 10% | 当前导航 |
| 圆角阶梯 | 5 / 8 / 10 / 12 / 14 / 16 | 12 / 18 / 28 / pill | `--ds-radius-sm/md/lg` 映射到 8 / 12 / 16 |
| 侧栏宽 | `--ft-sidebar` `220px` | 顶栏 `--ds-nav-h` `52px` | `≥961px` 左侧栏 |
| 底栏高 | `--ft-tabbar` `64px` | 无 | `<961px` 四格底栏（精选 / 热点 / 日报 / 更多） |
| 日报页 | 复用上表 token | 上一轮 E-Ink 衬线/暗红已撤回 | 刊头无衬线；白卡 hairline；单色 teal |
| 阴影 | 关闭（`--ds-shadow-*` = none） | 多层 Apple 阴影 | 靠线与微浮 |

暗色：纸面 `#141413`，sunk `#0f0f0e`，强调改为 cyan。无无限 pulse，无渐变 CTA。
