/** NH-013 accepted G2 polish: black rubber on the source-derived hatchback.
 * Preserve original tyre tread/albedo textures, normals and UVs; shade only
 * the material actually named M_Wheel_Tire. Never recolour wheel rims, body,
 * glass seals, rear lights or other source GLBs.
 */
import {Color3,Material,PBRMaterial,StandardMaterial} from "@babylonjs/core";

export const NH013_TYRE_RUBBER_COLOR=new Color3(0.055,0.055,0.06);

/** Applies to the four separated authentic tyre surfaces only. */
export function blackenHatchbackTyreMaterial013(material:Material|null):boolean{
 if(!material)return false;
 const sourceName=material.name.split(":").at(-1)?.trim()??"";
 if(sourceName!=="M_Wheel_Tire")return false;
 if(material instanceof PBRMaterial){
   // Keep the existing tread colour texture and normal detail; darken its
   // reflection-free rubber base rather than dropping the texture.
   material.albedoColor=NH013_TYRE_RUBBER_COLOR.clone();
   material.metallic=0;
   material.roughness=Math.max(.9,material.roughness??.9);
   return true;
 }
 if(material instanceof StandardMaterial){
   material.diffuseColor=NH013_TYRE_RUBBER_COLOR.clone();
   material.specularColor=new Color3(.015,.015,.015);
   return true;
 }
 return false;
}
