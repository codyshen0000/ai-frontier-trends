# L2 v5.1 自审（文案 + 有用才放）

品牌：**前沿趋势**。无 AIHOT / MyHOT 名或 Logo。

## 文案（v5.1 硬门）

- [x] `/hot/` 10 张卡均为自洽标题 + 答案前置第一句 + 事实展开
- [x] NO.01 Klein 已按 gold 改写，无「权重跟踪 / 记交付 / 本批 / 六件套仍空」
- [x] 日报头条摘要同级要求；无「暂无进展」占位
- [x] 对外字段零内部元话语（`test:covers` + `verify:ia` 扫禁止表）
- [x] 只写材料里有的事实，未编型号/分数

## 配图（v5 不变）

- [x] 仅 `/hot/` NO.01 与 `/daily/` 头条可能有封面
- [x] 已挂封面 = BFL 官方博客模型样张拼贴（illustrates Klein，不是随机 OG）
- [x] 无图槽为空，无 HeatPanel / sparkline 顶封面，无热链
- [x] 分类表齐全；≥5 条旧 ≥480 会挂、现应无图（夹具 5 + live 若干）
- [x] `src` / `srcSet` / `imageSrcSet` 走同一路径前缀（`/hot/` `/daily/` 均为 `../assets/covers/`）
- [x] `verify:ia` 解析 dist 内每页 img src/srcset/imagesrcset，缺文件即失败
- [x] 旧 `preview/hot|daily|live` 标「旧版·已作废」并链到 `preview/mit-static`

## Huashu（自估 7.5）

信息分层清楚：NO.01 标题即事件，digest 先结论后事实，封面是文章样张。热度控件仍在原位。未用装饰图凑封面。

扣分：热度/涨跌仍是 fixture；spark 标「示例」（L3 未过）。不因此掉到 7 以下。

## anti-slop

无「赋能 / 打造闭环 / 重磅」套话。无内部跟踪口吻。数字可回溯 live 卡。

## Impeccable（约 17/20）

跳过链接；封面 `alt=""`；width/height + object-cover；LCP eager；失败无破图；手机头条标题在图前；封面 hover 200ms；空槽不塞灰骨架。品牌仅「前沿趋势」。

## 门禁

`npm run test:covers` / `build` / `build:public` / `verify:ia`  
`python3 -m http.server` 于 `dist/`：`/hot/` `/daily/` 封面 srcSet 0 个 404。

下一步：测试审校按 v5.1 §4 A+B 抽查后，产品终审。不合入 #19 / #20。
