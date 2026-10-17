import {describe,it,expect} from "vitest";
import {MeshBuilder,NullEngine,Scene,TransformNode} from "@babylonjs/core";
import {evaluateWheelRigAdmission,type WheelRigManifestV1} from "../game/vehicles/mvrs-wheel-admission-001";
import type {StreetVehicleWheelMapping} from "../game/vehicles/street-vehicle-wheels";
const names={frontLeft:"hub-front-left",frontRight:"hub-front-right",rearLeft:"hub-rear-left",rearRight:"hub-rear-right"};
const mapping:StreetVehicleWheelMapping={
  wheelNames:names,spinAxis:"x",steerAxis:"y",fallbackRadiusMetres:.39,
  steeringMode:"world-yaw",steeringSign:-1,
};
function fixture(count=4,geometry=true){
  const engine=new NullEngine(),scene=new Scene(engine);
  const anchor=new TransformNode("actual-vehicle",scene);
  Object.values(names).slice(0,count).forEach(name=>{
    const hub=new TransformNode(name,scene);hub.parent=anchor;
    if(geometry)MeshBuilder.CreateCylinder(name+":tire",{
      diameter:.75,height:.27,tessellation:16,
    },scene).parent=hub;
  });
  return {engine,scene,anchor,dispose:()=>{anchor.dispose();scene.dispose();engine.dispose();}};
}
const approved:WheelRigManifestV1={
 schemaVersion:"MVRS-1",modelId:"owner-car",
 sourceAssetSha256:"a".repeat(64),qualifiedAssetSha256:"b".repeat(64),
 state:"drive-approved",approvedBy:"owner",
 wheels:Object.values(names).map((hubNode,i)=>({
  id:hubNode,axleIndex:i<2?0:1,
  side:i%2===0?"left" as const:"right" as const,
  steerable:i<2,hubNode,radiusMetres:.39,
 })),
};
describe("WHEEL-001 admission contracts",()=>{
 it("forbids chassis-only sliding when any wheel is absent",()=>{
   const f=fixture(3);
   try{
     expect(evaluateWheelRigAdmission(f.anchor,mapping,null,true))
       .toMatchObject({qualified:false,code:"missing-wheel-pivots"});
   }finally{f.dispose();}
 });
 it("forbids hollow fake pivots",()=>{
   const f=fixture(4,false);
   try{expect(evaluateWheelRigAdmission(f.anchor,mapping,null,true))
     .toMatchObject({qualified:false,code:"wheel-pivot-without-real-mesh"});}
   finally{f.dispose();}
 });
 it("allows structural review trials but blocks unaccepted production rigs",()=>{
   const f=fixture();
   try{
     expect(evaluateWheelRigAdmission(f.anchor,mapping,null,false))
       .toMatchObject({qualified:false,code:"awaiting-source-qualified-manifest"});
     expect(evaluateWheelRigAdmission(f.anchor,mapping,null,true))
       .toMatchObject({qualified:true,wheelCount:4});
   }finally{f.dispose();}
 });
 it("checks manifest approval and provenance",()=>{
   const f=fixture();
   try{
     expect(evaluateWheelRigAdmission(f.anchor,mapping,{
       ...approved,state:"rig-verified",
     })).toMatchObject({qualified:false,code:"manifest-not-approved"});
     expect(evaluateWheelRigAdmission(f.anchor,mapping,approved))
       .toMatchObject({qualified:true,wheelCount:4});
     expect(evaluateWheelRigAdmission(f.anchor,mapping,{
       ...approved,qualifiedAssetSha256:"not-a-hash"
     })).toMatchObject({qualified:false,code:"manifest-provenance-unverified"});
   }finally{f.dispose();}
 });
});
