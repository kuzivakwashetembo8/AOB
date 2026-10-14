/** Accepted South Ward runtime presentation policy.
 * Use only in the public game bootstrap; pure world/physics unit tests can
 * explicitly construct the original three-tree baseline.
 */
import {parseForestryBudget} from "./urban-forestry-plan";
import type {ForestryBudget,ForestryDensityFocus} from "./urban-forestry-plan";

export interface AcceptedSouthWardPresentation {
  readonly enableLandUsePreview:boolean;
  readonly enableTreePlace001:boolean;
  readonly treeBudget:ForestryBudget;
  readonly treeDensityFocus:ForestryDensityFocus;
}

export function resolveAcceptedSouthWardPresentation(
  params:URLSearchParams,
):AcceptedSouthWardPresentation {
  // Accepted GROUND-004 lawn and TREE-PLACE-001 Mercer grove are default on
  // after promotion. Explicit zero values preserve a reversible baseline.
  return {
    enableLandUsePreview:params.get("gtdGround001")!=="0",
    enableTreePlace001:params.get("gtdTreePlace001")!=="0",
    treeBudget:params.has("gtdTreeBudget")
      ?parseForestryBudget(params.get("gtdTreeBudget")):30,
    treeDensityFocus:params.get("gtdTreeDensity")==="balanced"
      ?"balanced":"mercer-open-side",
  };
}
