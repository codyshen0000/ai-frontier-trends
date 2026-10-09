# AI前沿趋势

公开静态站：实时热点看板、趋势时间线、升级/推翻信号表、待交付权重追踪、FLUX 3 提示词速查表 / 官方示例库 / 相机术语表。

站点地址：<https://codyshen0000.github.io/ai-frontier-trends/>

实时热点看板：<https://codyshen0000.github.io/ai-frontier-trends/live/>

趋势时间线（结论置顶 + 谱系图）：<https://codyshen0000.github.io/ai-frontier-trends/timeline/>

FLUX 3 四页：

- 速查表：<https://codyshen0000.github.io/ai-frontier-trends/flux3/>
- 官方案例：<https://codyshen0000.github.io/ai-frontier-trends/flux3/cases/>
- 官方示例库：<https://codyshen0000.github.io/ai-frontier-trends/flux3/examples/>
- 相机术语表：<https://codyshen0000.github.io/ai-frontier-trends/flux3/camera-terms/>

## 本地

```bash
npm install
npm run build:public
npm run preview
```

`PUBLIC_DEPLOY=1` 或 `npm run build:public` 会按 `site.config.json` 的 `privatePages` 排除不公开页面。本仓库只收录公开内容。

预览默认在 `http://127.0.0.1:4173/`。若要模拟 GitHub Pages 子路径：

```bash
SITE_BASE=/ai-frontier-trends npm run preview
```

## 部署

推送到 `main` 后，GitHub Actions 会构建公开站点并发布到 GitHub Pages。

## 刷新 /live/

`/live/` 是自包含单页，构建器按 `site.config.json` 的 `htmlFile` **原样拷贝** `content/live.html`，不会套站点模板。

每晚简报后刷新公开看板：用新的单文件 HTML **整份替换** `content/live.html`，保留页内 `← 返回首页` 链接（指向 `../`），然后推送到 `main`。不要拆成多文件，也不要改站点生成器。

发布前检查：不要包含本机路径（`/workspace`、`/cursor/`、`/home/box`）、百度链接、token，或私有「收藏」内容。
