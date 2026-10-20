# engine-data (data-only)

This branch is **not** site source and must **not** be merged into `main`.

Layout matches the public contract path `engine-data:data/engine/v1/` (site-data 1.1).
Pages/CI check this path out as `FT_ENGINE_DIR` / `data/engine/v1`, then run
`npm run build:public` on **main**. R1 dumps should overwrite these files in place.

Current tip is a **production** snapshot (`meta.mode=production`,
`data_as_of=2026-10-20T06:21:20+08:00`).
