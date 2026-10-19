# engine-data (data-only)

This branch is **not** site source and must **not** be merged into `main`.

Layout matches the public contract path `engine-data:data/engine/v1/` (site-data 1.1).
R1 hourly dumps should overwrite these files in place, then call
`workflow_dispatch` / `repository_dispatch` on **main** `pages.yml`.

The files below are a **minimal CI-wiring snapshot** (empty collections,
valid `meta.json`). They exist so Pages can checkout the path before the
first real R1 export. They are not a production dump.
