# AI前沿趋势

公开静态站：趋势时间线、升级/推翻信号表、待交付权重追踪、FLUX 3 提示词速查表。

站点地址：<https://codyshen0000.github.io/ai-frontier-trends/>

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
