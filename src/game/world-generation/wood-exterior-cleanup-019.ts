/** GTD-MAT-020: image-only wood exteriors.
 * The only allowed visible exterior surfaces on a wood-image building are:
 * image-derived wall patches, glass panes, the required physical roof shell,
 * and working door panels with metal handles. Every procedurally generated
 * surround, sill, lintel, window frame, cornice, fascia, foundation band,
 * parapet and decorative facade fixture is suppressed BEFORE mesh creation.
 *
 * No impact on brick/glass buildings or structural walls, apertures,
 * collisions, roofs, doors, or UV image scale.
 */
import type {BoxPrimitive} from "./architecture-plan";

export function isExcessWoodSurround(part:BoxPrimitive):boolean{
  // Door handles are the sole necessary former "trim" element; they are
  // reclassified as metal below so no wood-family trim material is requested.
  if(part.id.startsWith("door-handle:"))return false;
  // Includes windows, doors, roof parapets, eaves, fascia, rooflines,
  // storefront sign bands, sills, lintels, mullions and floor surrounds.
  if(part.role==="trim")return true;
  // All facade-only ornaments are generated separately from walls and
  // openings, including side piping and metallic window shutters/ACs.
  if(part.id.startsWith("detail:") && part.templateId?.startsWith("facade-"))
    return true;
  return false;
}

export function cleanWoodBuildingSurrounds(
  parts:readonly BoxPrimitive[],woodSurfaceActive:boolean,
):BoxPrimitive[]{
  if(!woodSurfaceActive)return [...parts];
  return parts.filter(p=>!isExcessWoodSurround(p)).map(p=>
    p.id.startsWith("door-handle:")&&p.role==="trim"
      ? {...p,role:"metal" as const}:p
  );
}
