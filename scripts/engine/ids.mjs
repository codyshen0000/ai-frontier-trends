/** Remaining-A fixture ids. Public pages and PUBLIC_DEPLOY builds must never emit these. */
export const FIXTURE_IDS = [
  "flash-api",
  "mm-816b",
  "edge-nb",
  "agent-2",
  "api-price",
  "longctx-eval",
];

/** Remaining-A titles only. Do not use the bare substring "Flash 变体" — production Kling copy says "更轻 Flash 变体". */
export const FIXTURE_TITLE_NEEDLES = [
  "Flash 变体发布",
  "开源模型侧发布 Flash 变体",
  "Flash 变体：检索",
  "816B",
];

export function textHasFixtureId(text) {
  const raw = String(text || "");
  return FIXTURE_IDS.some((id) => raw.includes(id));
}
