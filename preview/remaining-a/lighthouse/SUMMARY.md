# Lighthouse median vs `main@1ff0e9e`

Method: 3 runs each, median. Head = this branch `dist/` on localhost. Baseline = live Pages at `1ff0e9e` (`https://codyshen0000.github.io/ai-frontier-trends/`). Mobile 375 + desktop. Event page = `/weekly/2026-10-18/`.

`df805fe` re-ran **event 375** and **home desktop** only (gates). Other rows remain the `d16bf2a` medians.

Screenshots of each median summary: `*-median.png` in this folder. Event 375 re-run JSON: `event-median.json`.

| Page | Viewport | Perf | A11y | BP | SEO | LCP | CLS | TBT | Bytes | ΔPerf | ΔA11y |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 375 | 99 / 100 | 96 / 96 | 96 / 100 | 90 / 90 | 1.80s / 1.01s | 0 / 0 | 0 / 0 | 130KB / 25KB | −1 | 0 |
| home | desktop | 100 / 100 | **100 / 96** | 96 / 100 | 90 / 90 | 0.40s / 0.28s | 0 / 0 | 0 / 0 | 133KB / 26KB | 0 | **+4** |
| weekly | 375 | 100 / 100 | 92 / 92 | 100 / 100 | 100 / 100 | 1.36s / 0.91s | 0 / 0 | 0 / 0 | 56KB / 19KB | 0 | 0 |
| weekly | desktop | 100 / 100 | 92 / 92 | 100 / 100 | 100 / 100 | 0.37s / 0.25s | 0 / 0 | 0 / 0 | 56KB / 19KB | 0 | 0 |
| timeline | 375 | 96 / 98 | 96 / 96 | 100 / 100 | 90 / 90 | 1.66s / 1.06s | 0.049 / 0.049 | 171 / 142 | 340KB / 271KB | −2 | 0 |
| timeline | desktop | 99 / 99 | 96 / 96 | 100 / 100 | 90 / 90 | 0.45s / 0.29s | 0.078 / 0.078 | 0 / 0 | 340KB / 278KB | 0 | 0 |
| event | 375 | **99 / 97** | 95 / 95 | 100 / 100 | 91 / 91 | **1.58s / 2.04s** | 0 / 0 | 58 / 61 | 374KB / 480KB | **+2** | 0 |
| event | desktop | 97 / 98 | 95 / 95 | 100 / 100 | 91 / 91 | 0.65s / 0.45s | 0.097 / 0.097 | 0 / 0 | 595KB / 469KB | −1 | 0 |

Values are **head / baseline**. Event 375 gate: LCP ≤ 2.5s and Perf ≥ 95 — **pass** (1.58s, 99).

## Named regressions

1. **home desktop Accessibility** was 96→90 on the `d16bf2a` table because hydrate still wrote `aria-checked` and 回到顶部 used `opacity-40`. Re-run on `df805fe` after that fix: **100 / 96**.
2. **event mobile** was 97→88 / LCP 3.01s on `d16bf2a` (unused Remaining-A CSS + base64 PNG charts). `df805fe` loads `skin-weekly.css` only and serves WebP charts: **99 / 97**, LCP **1.58s / 2.04s**, transfer 602→374KB.

No TBT budget breach. CLS stays ≤0.1.

R-2 chart crops + SHA before/after: `preview/remaining-a/lighthouse/charts/`.
