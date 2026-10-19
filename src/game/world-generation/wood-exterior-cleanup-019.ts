/** GTD-MAT-019: remove excessive *separate wood-colored surround geometry*
 * only on buildings whose existing wall finish comes from WOOD family.
 * The timber IMAGE wall surfaces, real roof enclosure, doors and openings
 * are deliberately unmodified.
 */
import type {BoxPrimitive} from "./architecture-plan";

export function isExcessWoodSurround(part:BoxPrimitive):boolean {
  // The roof SLAB and pitched/shed panels remain intact; only the raised
  // timber-looking perimeter edge / roof parapet is deleted.
  if(part.role==="trim" && /^roof:.*:parapet:/.test(part.id))return true;
  // Non-structural facade ornaments at rooftop and exterior floor level.
  if(part.role==="trim" &&
     (part.templateId==="facade-cornice"||
      part.templateId==="facade-foundation-band"))return true;
  // Keep the actual door panel and handle; remove only its four wood frame
  // bars that surround the doorway.
  if(part.role==="trim" &&
     part.templateId==="door-standard" && part.id.startsWith("frame:"))
    return true;
  return false;
}

export function cleanWoodBuildingSurrounds(
  parts:readonly BoxPrimitive[],woodSurfaceActive:boolean,
):BoxPrimitive[]{
  if(!woodSurfaceActive)return [...parts];
  return parts.filter(p=>!isExcessWoodSurround(p)).map(p=>
    // Door handle remains, but is METAL rather than a residual wooden strip.
    p.id.startsWith("door-handle:")&&p.role==="trim"
      ?{...p,role:"metal" as const}:p
  );
}
