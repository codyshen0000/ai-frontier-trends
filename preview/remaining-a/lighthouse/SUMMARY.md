# Lighthouse median vs `main@1ff0e9e`

Method: 3 runs each, median. Head = this branch `dist/` on localhost. Baseline = live Pages at `1ff0e9e` (`https://codyshen0000.github.io/ai-frontier-trends/`). Mobile 375 + desktop. Event page = `/weekly/2026-10-18/`.

Screenshots of each median summary: `*-median.png` in this folder.

| Page | Viewport | Perf | A11y | BP | SEO | LCP | CLS | TBT | Bytes | ΔPerf | ΔA11y |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 375 | 99 / 100 | 96 / 96 | 96 / 100 | 90 / 90 | 1.80s / 1.01s | 0 / 0 | 0 / 0 | 130KB / 25KB | −1 | 0 |
| home | desktop | 100 / 100 | 90 / 96 | 96 / 100 | 90 / 90 | 0.40s / 0.29s | 0 / 0 | 0 / 0 | 130KB / 25KB | 0 | **−6** |
| weekly | 375 | 100 / 100 | 92 / 92 | 100 / 100 | 100 / 100 | 1.36s / 0.91s | 0 / 0 | 0 / 0 | 56KB / 19KB | 0 | 0 |
| weekly | desktop | 100 / 100 | 92 / 92 | 100 / 100 | 100 / 100 | 0.37s / 0.25s | 0 / 0 | 0 / 0 | 56KB / 19KB | 0 | 0 |
| timeline | 375 | 96 / 98 | 96 / 96 | 100 / 100 | 90 / 90 | 1.66s / 1.06s | 0.049 / 0.049 | 171 / 142 | 340KB / 271KB | −2 | 0 |
| timeline | desktop | 99 / 99 | 96 / 96 | 100 / 100 | 90 / 90 | 0.45s / 0.29s | 0.078 / 0.078 | 0 / 0 | 340KB / 278KB | 0 | 0 |
| event | 375 | **88 / 97** | 95 / 95 | 100 / 100 | 91 / 91 | **3.01s / 2.04s** | 0 / 0 | 116 / 72 | 602KB / 469KB | **−9** | 0 |
| event | desktop | 97 / 98 | 95 / 95 | 100 / 100 | 91 / 91 | 0.65s / 0.45s | 0.097 / 0.097 | 0 / 0 | 595KB / 469KB | −1 | 0 |

Values are **head / baseline**.

## Named regressions

1. **home desktop Accessibility 96→90 (−6).** Cause: hydrate still wrote `aria-checked` on the three theme `<button>`s (not allowed without `role=radio`); plus the faded 回到顶部 failed contrast (2.19:1) when `opacity-40`. Both patched after this measurement (`aria-checked` removed; top button stays full-contrast ink).
2. **event mobile Performance 97→88 (−9), LCP 2.04s→3.01s (budget 2.5s).** Cause: `/weekly/2026-10-18/` on head carries extra unused CSS (~23KB) and render-blocking ~640ms vs ~30ms on baseline; transfer 469KB→602KB. Chart PNGs are already oversized on both sides; head snapshot also copies Remaining-A `assets/` (app.css / hydrate) beside the issue. Not a MIT home-page regression.

No TBT budget breach. CLS stays ≤0.1.
