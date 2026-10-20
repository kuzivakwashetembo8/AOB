/** GTD-MAT-021: no procedurally generated plank-like surrounds anywhere in South Ward.
 * The only allowed visible exterior surfaces on a wood-image building are:
 * image-derived wall patches, glass panes, the required physical roof shell,
 * and working door panels with metal handles. Every procedurally generated
 * surround, sill, lintel, window frame, cornice, fascia, foundation band,
 * parapet and decorative facade fixture is suppressed BEFORE mesh creation.
 *
 * Applies to every authored building, including brick/image-surface facades.
 * Never remove structural walls, apertures, roofs, glass, or door panels.
 */
import type {BoxPrimitive} from "./architecture-plan";

export function isExcessWoodSurround(part:BoxPrimitive):boolean{
  // Door handles are the sole necessary former "trim" element; they are
  // reclassified as metal below so no wood-family trim material is requested.
  if(part.id.startsWith("door-handle:"))return false;
  // Includes windows, doors, roof parapets, eaves, fascia, rooflines,
  // storefront sign bands, sills, lintels, mullions and floor surrounds.
  if(part.role==="trim")return true;
  // Eliminate synthetic facade strips and downpipes even when assigned
  // metal materials, while keeping structural skyline frame geometry.
  if(part.id.startsWith("detail:") && part.templateId?.startsWith("facade-"))
    return true;
  return false;
}

export function cleanWoodBuildingSurrounds(
  parts:readonly BoxPrimitive[],woodSurfaceActive:boolean,
):BoxPrimitive[]{
  // Legacy compatibility: the active-wood flag no longer scopes the rule.
  // Previous only-wood filter left wooden-looking planks on brick facades.
  void woodSurfaceActive;
  return parts.filter(p=>!isExcessWoodSurround(p)).map(p=>
    p.id.startsWith("door-handle:")&&p.role==="trim"
      ? {...p,role:"metal" as const}:p
  );
}
