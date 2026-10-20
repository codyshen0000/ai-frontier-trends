# SYNTHETIC engine dump (not production)

This directory is a **fixture-free, hand-written synthetic** site-data 1.1 tree for B0 loader tests.

- Do **not** ship it as `engine-data` / `data/engine/v1`.
- Do **not** reuse Remaining-A fixture ids (`flash-api`, `mm-816b`, …).
- `meta.mode` is `"synthetic"`. Titles contain `SYNTHETIC`.
- Cover classes here exist only to prove `official_diagram` is accepted; no real media.

Load with:

```bash
FT_ENGINE_DIR=scripts/engine/__samples__/v1 node --test scripts/engine/
```

Also in this folder:

- `v1/` — SYNTHETIC loader dump (B0). Heat values are **not** real; do not run the B2 heat verifier against it.
- `heat-cases/` — SYNTHETIC B2-01 hand-calc participants + expected `heat_index` (`cases.json`).
- `out-1700/` — **REAL** site-data snapshot (~17:00 CST 2026-10-19). Used by the heat recompute verifier. `redirects.json` is empty until R2 19:25.
