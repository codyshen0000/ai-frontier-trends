/** Remaining-A fixture ids. Public pages and PUBLIC_DEPLOY builds must never emit these. */
export const FIXTURE_IDS = [
  "flash-api",
  "mm-816b",
  "edge-nb",
  "agent-2",
  "api-price",
  "longctx-eval",
];

export const FIXTURE_TITLE_NEEDLES = ["Flash 变体", "816B"];

export function textHasFixtureId(text) {
  const raw = String(text || "");
  return FIXTURE_IDS.some((id) => raw.includes(id));
}
