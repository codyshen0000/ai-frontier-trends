import { isOfficialDiagramClass, isValuableCoverClass } from "../../cover_rules.mjs";

/** Accept official_diagram and official_explainer as the same valid class. */
export function acceptCoverClass(valueClass: string | null | undefined) {
  if (!valueClass) return false;
  return isValuableCoverClass(valueClass) || isOfficialDiagramClass(valueClass);
}
