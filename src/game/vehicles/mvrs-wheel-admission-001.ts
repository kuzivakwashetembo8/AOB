/**
 * MVRS-1 — asset-versioned wheel admission and onboarding contract.
 *
 * A renderer may display an unqualified specimen. A driving actor may only
 * receive four source-backed, steerable/rollable wheel assemblies. Never
 * treat wheelCount alone or synthetic pivot nodes as owner acceptance.
 */
import type {TransformNode} from "@babylonjs/core";
import type {StreetVehicleWheelMapping} from "./street-vehicle-wheels";

export type WheelQualification =
  | "visual-only" | "rig-pending" | "rig-verified" | "drive-approved" | "repair-required";
export interface WheelRigManifestV1 {
  readonly schemaVersion:"MVRS-1";
  readonly modelId:string;
  readonly sourceAssetSha256:string;
  readonly qualifiedAssetSha256:string;
  readonly state:WheelQualification;
  readonly wheels:readonly {
    readonly id:string;
    readonly axleIndex:number;
    readonly side:"left"|"right";
    readonly steerable:boolean;
    readonly hubNode:string;
    readonly radiusMetres:number;
  }[];
  readonly approvedBy?:string;
}
export type RigAdmission =
  | {readonly qualified:true;readonly mapping:StreetVehicleWheelMapping;readonly wheelCount:4}
  | {readonly qualified:false;readonly code:string;readonly wheelCount:number};

/**
 * Runtime structural evidence is not the same as DRIVE_APPROVED.
 * Before first owner acceptance, test previews can explicitly opt into
 * a separate rig-verification drive trial. Production must not.
 */
export function evaluateWheelRigAdmission(
  root:TransformNode,
  mapping:StreetVehicleWheelMapping|null,
  manifest:WheelRigManifestV1|null,
  allowUnacceptedReviewTrial=false,
):RigAdmission{
  if(!mapping)return {qualified:false,code:"wheel-mapping-unavailable",wheelCount:0};
  const names=[
    mapping.wheelNames.frontLeft,mapping.wheelNames.frontRight,
    mapping.wheelNames.rearLeft,mapping.wheelNames.rearRight,
  ];
  if(new Set(names).size!==4)
    return {qualified:false,code:"nonunique-wheel-pivots",wheelCount:0};
  const nodes=root.getDescendants(false).filter(n=>
    names.some(name=>n.name===name||n.name.endsWith(":"+name)));
  if(nodes.length!==4)
    return {qualified:false,code:"missing-wheel-pivots",wheelCount:nodes.length};
  if(nodes.some(n=>n.getChildMeshes(false).every(m=>m.getTotalVertices()===0)))
    return {qualified:false,code:"wheel-pivot-without-real-mesh",wheelCount:0};
  if(!Number.isFinite(mapping.fallbackRadiusMetres)||mapping.fallbackRadiusMetres<=0)
    return {qualified:false,code:"invalid-wheel-radius",wheelCount:0};
  if(manifest){
    if(manifest.schemaVersion!=="MVRS-1"||
      manifest.wheels.length!==4||
      manifest.wheels.some(w=>!Number.isFinite(w.radiusMetres)||w.radiusMetres<=0))
      return {qualified:false,code:"manifest-invalid",wheelCount:4};
    if(manifest.state!=="drive-approved")
      return {qualified:false,code:"manifest-not-approved",wheelCount:4};
    if(!manifest.approvedBy||!/^([a-f0-9]{64})$/i.test(manifest.sourceAssetSha256)||
       !/^([a-f0-9]{64})$/i.test(manifest.qualifiedAssetSha256))
      return {qualified:false,code:"manifest-provenance-unverified",wheelCount:4};
  }else if(!allowUnacceptedReviewTrial){
    return {qualified:false,code:"awaiting-source-qualified-manifest",wheelCount:4};
  }
  return {qualified:true,mapping,wheelCount:4};
}
