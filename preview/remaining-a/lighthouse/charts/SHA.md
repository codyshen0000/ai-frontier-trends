# R-2 weekly chart format change (PNG → WebP + PNG fallback)

Method: `sharp` WebP q=88. PNG bytes unchanged (fallback). SHA-256 before = PNG; after = WebP.

| Issue | Chart | Alt / title / caption | PNG bytes | WebP bytes | SHA before (PNG) | SHA after (WebP) |
| --- | --- | --- | ---: | ---: | --- | --- |
| 2026-10-18 | evidence-by-line | 本周证据写入：交付与 OPD/RSI 观察最多；主线等级全不变 | 85224 | 32228 | `bd8e0d95d46ce772d41491030728d474a640604f417058b8826bfd4593f9c0fc` | `1c5f1d18ef94000d52db588c2e5a0d875dc85c6f1c568b2c545585ec6add9432` |
| 2026-10-18 | signal-candidates | 信号表 1–4：本周续核多篇，正表零新增；一周无翻转 | 69293 | 24706 | `3f8bedbde92c4fe05059988a8871599f906b085313e41a9f3fcd53ef6a85ce3b` | `0762194ae99ac58068c7af0f572513a43b159b4145a9c89da66160fe6d0d0e82` |
| 2026-10-18 | weights-delivery | 权重与产品：本周兑现 3 项，仍空 3 项（截至 2026-10-16 傍晚） | 75200 | 35028 | `9acdb326d67148ab3f6dfe9b6799a5fa9966143672ebf122980e9f0a488224ea` | `dc3113d1f1fc094f8fb107dfb4a58bc0c99cbfd9e060429fe15d650a756ce9a9` |
| 2026-10-12 | evidence-by-line | 首版后一周：新证据集中在主线 5、4、3、1 | 82422 | 33694 | `6af1af6827a085c41f3cf752c8968b5d6174391e091507d812a80f4df3cf4636` | `1dc7e01e4c5dd5a681036335a58fe9c0c16bf5fcf209ce31422d0e271aa7e2f6` |
| 2026-10-12 | signal-candidates | 一周核对 25 个候选，只有 2 个计入正表 | 81527 | 30016 | `36c53c54158aec76a119df2ecb25729493210f7eb08a4925ba8c06c89400d91e` | `22465cb7d4786469a4b1c099205a5ca04b9d50d0e9ab5acbaef09fb4860f4378` |
| 2026-10-12 | semi-opd-overlap | 师生越不像，越不该用标准 OPD | 96482 | 33684 | `360f06744fcd8c21cf7b495e9dfb98b120a96d1b52447018d681cf47fe3daae0` | `9928a92533a30a233505763598be9264e05ed2988d95201d3e48417fe6d5705b` |

Crops at viewport 375: `*-375.png` in this folder. Each crop is the `<figure>` as rendered on the issue page (WebP chosen by the browser).
