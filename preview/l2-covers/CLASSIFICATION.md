# L2 封面分类表（v5 有用才放）

规则：价值门优先；无用图不放。槽位仅 `/hot/` NO.01 与 `/daily/` 头条。失败不热链。

## 出图槽

| id | 候选摘要 | 价值判定 | 最终 URL 或「无图」 | 一句话理由 |
|---|---|---|---|---|
| hot-NO.01/flux-3-image-klein | bfl.ai（v4 cdn.sanity.io/production/eada5ee663c5523ab6d43c858baaf037867d324e-2000x1344.webp → v5 cdn.sanity.io/production/eada5ee663c5523ab6d43c858baaf037867d324e-2000x1344.webp） | 有用·model_sample | assets/covers/hot-flux-3-image-klein-1600.webp | 官方博客正文大图，按模型样张放行 |
| daily-headline/flux-3-image-klein | bfl.ai（v4 cdn.sanity.io/production/eada5ee663c5523ab6d43c858baaf037867d324e-2000x1344.webp → v5 cdn.sanity.io/production/eada5ee663c5523ab6d43c858baaf037867d324e-2000x1344.webp） | 有用·model_sample | assets/covers/hot-flux-3-image-klein-1600.webp | 官方博客正文大图，按模型样张放行 |

## 旧 v4（≥480 自动挂）会出图、v5 必须无图（≥5）

| id | 候选摘要 | 价值判定 | 最终 URL 或「无图」 | 一句话理由 |
|---|---|---|---|---|
| sample/sample-og-default | ex.example（v4 ex.example/og-image.png → v5 og） | 无用/不放·og | 无图 | 站点默认 OG 社交卡，v4 因宽 1200 会挂图 |
| sample/sample-github-opengraph | github.com（v4 opengraph.githubassets.com/ex/repo → v5 og） | 无用/不放·og | 无图 | GitHub Open Graph 预览图 |
| sample/sample-logo-png | ex.example（v4 ex.example/assets/logo.png → v5 badge） | 无用/不放·badge | 无图 | 纯 Logo 方图（文件名 logo.png）；v4 ≥480 会挂，v5 在工程剔除明显 logo URL |
| sample/sample-unsplash-decor | ex.example（v4 images.unsplash.com/photo-000 → v5 decor） | 无用/不放·decor | 无图 | Unsplash 装饰/库存图 |
| sample/sample-twitter-card | news.example（v4 news.example/images/twitter-card.jpg → v5 og） | 无用/不放·og | 无图 | 社交分享卡文件名 + 经典 OG 尺寸 |
| live/openui-1.0 | github.com（v4 github.com/assets/banner.png → v5 badge）；openui.com（v4 openui.com/shaders/faded-dither-light-wide.webp → v5 unsure）；x.com（v4 no_image → v5 no_image） | 无用/不放·badge | 无图 | v4 会挂 github.com/assets/banner.png；v5 badge |
| live/jev-35b | huggingface.co（v4 huggingface.co/assets/autotrust_gurusearch_demo.png → v5 unsure）；modelscope.cn（v4 summary_only → v5 summary_only）；xiaohongshu.com（v4 svg → v5 svg） | 无用/不放·unsure | 无图 | v4 会挂 huggingface.co/assets/autotrust_gurusearch_demo.png；v5 unsure |
| live/llamafactory-rsi | github.com（v4 svg → v5 badge）；x.com（v4 pbs.twimg.com/media/HUvWAY_bEAAiOQj.jpg → v5 unsure） | 无用/不放·badge | 无图 | v4 会挂 pbs.twimg.com/media/HUvWAY_bEAAiOQj.jpg；v5 badge |
| live/terminal-rsi | arxiv.org（v4 below_240 → v5 below_240）；x.com（v4 pbs.twimg.com/media/HUuEgnGaIAApXW-.jpg → v5 unsure） | 无用/不放·unsure | 无图 | v4 会挂 pbs.twimg.com/media/HUuEgnGaIAApXW-.jpg；v5 unsure |
| live/kling-4-0-ga | x.com（v4 pbs.twimg.com/media/HUrcseNbQAAYZiF.jpg → v5 unsure） | 无用/不放·unsure | 无图 | v4 会挂 pbs.twimg.com/media/HUrcseNbQAAYZiF.jpg；v5 unsure |

## 说明

- v4 对照是 `firstQualifyingImageV4`：跳过摘要/SVG/高<240/徽章后，第一张 coalesce(width,800)≥480 即挂。
- v5 在同样借用顺序上先价值门；拿不准默认不放。
- 上表「模拟」行是固定抽查夹具；「live」行来自当前 live 卡在 v4 会挂、v5 为空的条目。
