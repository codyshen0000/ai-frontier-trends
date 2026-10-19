/**
 * B0 no-op. B2 writes static meta-refresh + canonical pages from `redirects.json`.
 *
 * Hook (phase 2, after #24 QA): `static_export.mjs` / `build.mjs` call
 * `writeRedirects(dist, data)` after a successful engine load.
 *
 * @param {string} [_dist] output root (e.g. dist/)
 * @param {unknown} [_data] engine bundle or `{ redirects }`
 * @returns {{ written: number }}
 */
export function writeRedirects(_dist, _data) {
  return { written: 0 };
}
