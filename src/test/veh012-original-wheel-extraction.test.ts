import {describe,it,expect} from "vitest";
import {Mesh,MeshBuilder,NullEngine,Scene,StandardMaterial,TransformNode,Vector3,VertexBuffer} from "@babylonjs/core";
import {splitOriginalMergedWheelGeometry} from "../game/vehicles/merged-original-wheel-extraction-012";
import {StreetVehicleWheelRig} from "../game/vehicles/street-vehicle-wheels";

function sourceCar(options:{missing?:boolean;attached?:boolean;duplicate?:boolean}={}){
 const engine=new NullEngine(),scene=new Scene(engine);
 const anchor=new TransformNode("mercer-extra-anchor",scene);
 const paint=new StandardMaterial("original-model-material",scene);
 const components:Mesh[]=[];
 const body=MeshBuilder.CreateBox("authored-body",
   {width:2.03,height:1.48,depth:4.6},scene);
 body.position.set(0,1.28,0);body.material=paint;components.push(body);
 for(const [i,x,z] of [
    [0,.89,1.58],[1,-.89,1.58],[2,.89,-1.58],[3,-.89,-1.58],
 ] as const){
  if(options.missing && i===3)continue;
  const wheel=MeshBuilder.CreateCylinder("original-tire-"+i,
    {diameter:.78,height:.26,tessellation:32},scene);
  wheel.rotation.z=Math.PI/2;wheel.position.set(x,.44,z);
  wheel.material=paint;components.push(wheel);
 }
 if(options.duplicate){
  const wheel=MeshBuilder.CreateCylinder("ambiguous-wheel",
   {diameter:.78,height:.26,tessellation:32},scene);
  wheel.rotation.z=Math.PI/2;wheel.position.set(.89,.44,1.58);
  wheel.material=paint;components.push(wheel);
 }
 const merged=Mesh.MergeMeshes(components,true,true,undefined,false,false)!;
 merged.name="material";
 merged.parent=anchor;
 merged.material=paint;
 return {engine,scene,anchor,merged,paint};
}
const dispose=(r:ReturnType<typeof sourceCar>)=>{
 r.anchor.dispose();r.scene.dispose();r.engine.dispose();
};
describe("VEH-012 honest native tire extraction",()=>{
 it("splits exactly four real wheels from one merged source without painting or recreating tires",()=>{
   const r=sourceCar();
   try{
     const originalTotalIndices=r.merged.getTotalIndices();
     const originalMaterial=r.merged.material;
     const originalWheelVertices=r.merged.getTotalVertices();
     const result=splitOriginalMergedWheelGeometry(r.anchor,.39);
     expect(result.reason).toBe("four-source-tires-separated-with-original-materials-and-positions");
     expect(result.identified).toBe(4);
     expect(result.mapping).not.toBeNull();
     const realWheels=r.anchor.getChildMeshes(false)
       .filter(m=>m.name.startsWith("veh012-real-wheel-"));
     expect(realWheels).toHaveLength(4);
     expect(realWheels.every(m=>m.material===originalMaterial)).toBe(true);
     const allIndexCount=realWheels.reduce((n,m)=>n+m.getTotalIndices(),r.merged.getTotalIndices());
     expect(allIndexCount).toBe(originalTotalIndices);
     expect(r.merged.getTotalVertices()).toBe(originalWheelVertices);
     const rig=new StreetVehicleWheelRig(r.anchor,result.mapping!);
     expect(rig.ready).toBe(true);
     rig.update(.7,.18);
     const hubs=r.anchor.getDescendants(false).filter(n=>n.name.startsWith("veh012-actual-hub-"));
     expect(hubs).toHaveLength(4);
     expect(hubs.every(h=>h.rotationQuaternion!==null)).toBe(true);
     rig.dispose();
   }finally{dispose(r);}
 });
 it("does not remove any model triangles with one absent tire",()=>{
   const r=sourceCar({missing:true});
   try{
     const indices=Array.from(r.merged.getIndices()!);
     const result=splitOriginalMergedWheelGeometry(r.anchor,.39);
     expect(result.identified).toBe(0);
     expect(result.mapping).toBeNull();
     expect(Array.from(r.merged.getIndices()!)).toEqual(indices);
     expect(r.anchor.getDescendants(false).some(n=>n.name.startsWith("veh012-actual-hub-")))
       .toBe(false);
   }finally{dispose(r);}
 });
 it("rejects duplicate visually overlapping tire candidates",()=>{
   const r=sourceCar({duplicate:true});
   try{
     const before=r.merged.getTotalIndices();
     const result=splitOriginalMergedWheelGeometry(r.anchor,.39);
     expect(result.identified).toBe(0);
     expect(result.reason).toContain("ambiguous");
     expect(r.merged.getTotalIndices()).toBe(before);
   }finally{dispose(r);}
 });
 it("rejects whole-body and unverified shape, and preserves original mesh",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const anchor=new TransformNode("Defender",scene);
   const box=MeshBuilder.CreateBox("full-combined-car",
     {width:2,height:2,depth:4.75},scene);
   box.parent=anchor;
   try{
     const before=box.getIndices()!.length;
     const result=splitOriginalMergedWheelGeometry(anchor,.4);
     expect(result.identified).toBe(0);
     expect(result.mapping).toBeNull();
     expect(box.getIndices()!.length).toBe(before);
     expect(anchor.getChildMeshes(false)).toHaveLength(1);
   }finally{anchor.dispose();scene.dispose();engine.dispose();}
 });
 it("retains all original vertices rather than offsetting the world model",()=>{
   const r=sourceCar();
   try{
     const before=r.merged.getBoundingInfo().boundingBox;
     const mesh=r.merged;
     const output=splitOriginalMergedWheelGeometry(r.anchor,.39);
     expect(output.identified).toBe(4);
     expect(mesh.position.length()).toBe(0);
     expect(r.anchor.position.length()).toBe(0);
     const wheel=r.anchor.getChildMeshes(false).find(m=>
        m.name==="veh012-real-wheel-frontLeft")!;
     wheel.computeWorldMatrix(true);
     const bounds=wheel.getBoundingInfo().boundingBox;
     expect(bounds.centerWorld.x).toBeCloseTo(.89,1);
     expect(bounds.centerWorld.z).toBeCloseTo(1.58,1);
     expect(bounds.centerWorld.y).toBeCloseTo(.44,1);
   }finally{dispose(r);}
 });
});
