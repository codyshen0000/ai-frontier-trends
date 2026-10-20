/** B0 registry smoke: proves glob-load + verify(ctx). Always passes. */
export const id = "b0-registry-smoke";
export const owner = "B0";

/** @param {{ root: string, distDir: string, engineDir: string }} _ctx */
export async function verify(_ctx) {
  return { ok: true };
}
