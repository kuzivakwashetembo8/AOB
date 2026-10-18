import {describe,it,expect} from "vitest";
import {MeshBuilder,NullEngine,Scene,TransformNode,Vector3} from "@babylonjs/core";
import {
 extraDriveName,extraDriveProfile,prepareNativeFleetWheelRig,
 type ExtraDriveName,
} from "../game/vehicles/ambient-fleet-driving-011";
import {streetVehicleForwardVelocity} from "../game/vehicles/street-vehicle-physics";
import {StreetVehicleWheelRig} from "../game/vehicles/street-vehicle-wheels";

describe("VEH-011 owner-original driving support",()=>{
 const fleet=[
  ["gtd-veh008-mercer-toyota-hilux","Toyota Hilux"],
  ["gtd-veh009-mercer-land-rover-defender","Land Rover Defender"],
  ["gtd-veh010-mercer-dodge-hp","Dodge HP"],
 ] as const;
 it("maps all 3 newly drivable imports to unique, forward-facing physics classes",()=>{
   const profiles=new Set<string>();
   for(const [id,expected] of fleet){
     const name=extraDriveName(id);
     expect(name).toBe(expected);
     const profile=extraDriveProfile(name!);
     expect(profile.forwardAxisSign).toBe(1);
     expect(profile.maxCurbAutostepMetres).toBeGreaterThan(0);
     const moving=streetVehicleForwardVelocity(Math.PI/2,6,profile);
     expect(moving.x).toBeCloseTo(6);
     expect(moving.z).toBeCloseTo(0);
     profiles.add(profile.classId);
   }
   expect(profiles.size).toBe(3);
   expect(extraDriveName("not-a-real-model")).toBeNull();
 });
 it("does not fake four wheel pivots from a merged car mesh",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const anchor=new TransformNode("Defender",scene);
   try{
     MeshBuilder.CreateBox("material",{width:2,depth:4.75,height:1.9},scene)
       .parent=anchor;
     const result=prepareNativeFleetWheelRig(anchor,"Land Rover Defender");
     expect(result.identified).toBe(0);
     expect(result.sourceMeshCount).toBe(1);
     expect(result.missing).toHaveLength(4);
     expect(anchor.getDescendants().some(n=>n.name.startsWith("veh011-hub"))).toBe(false);
   }finally{anchor.dispose();scene.dispose();engine.dispose();}
 });
 it("uses four original independent wheel geometries and preserves positions",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const anchor=new TransformNode("Toyota",scene);
   const positions=[
     [.81,1.57,"front-left wheel"],[-.81,1.57,"front-right wheel"],
     [.81,-1.48,"rear-left wheel"],[-.81,-1.48,"rear-right wheel"],
   ] as const;
   try{
     const before=new Map<string,Vector3>();
     for(const [x,z,name] of positions){
       const tire=MeshBuilder.CreateCylinder(name,{
         diameter:.74,height:.25,tessellation:24,
       },scene);
       tire.parent=anchor;
       tire.rotation.z=Math.PI/2; tire.position.set(x,.46,z);
       tire.computeWorldMatrix(true);
       before.set(name,tire.getBoundingInfo().boundingBox.centerWorld.clone());
     }
     const result=prepareNativeFleetWheelRig(anchor,"Toyota Hilux");
     expect(result.identified).toBe(4);
     expect(result.missing).toHaveLength(0);
     const rig=new StreetVehicleWheelRig(anchor,result.mapping);
     expect(rig.ready).toBe(true);
     expect(rig.wheelCount).toBe(4);
     for(const [,,name] of positions){
       const mesh=scene.getMeshByName(name)!;
       mesh.computeWorldMatrix(true);
       expect(Vector3.Distance(mesh.getBoundingInfo().boundingBox.centerWorld,
         before.get(name)!)).toBeLessThan(.0001);
     }
     rig.update(.85,.22);
     const pivots=anchor.getDescendants(false).filter((n):n is TransformNode=>
       n instanceof TransformNode && n.name.startsWith("veh011-hub"));
     expect(pivots).toHaveLength(4);
     expect(pivots.every(n=>n.rotationQuaternion!==null)).toBe(true);
     rig.dispose();
   }finally{anchor.dispose();scene.dispose();engine.dispose();}
 });
 it("rejects duplicate tire fragments rather than spinning an ambiguous wheel",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const anchor=new TransformNode("Dodge",scene);
   try{
     for(const [i,x,z] of [[0,.8,1.5],[1,-.8,1.5],
       [2,.8,-1.5],[3,-.8,-1.5],[4,.8,1.5]] as const){
       const part=MeshBuilder.CreateCylinder("wheel "+i,{diameter:.7,height:.2},scene);
       part.parent=anchor;part.position.set(x,.35,z);
     }
     const result=prepareNativeFleetWheelRig(anchor,"Dodge HP");
     expect(result.identified).toBe(0);
     expect(result.missing).toHaveLength(4);
   }finally{anchor.dispose();scene.dispose();engine.dispose();}
 });
});
