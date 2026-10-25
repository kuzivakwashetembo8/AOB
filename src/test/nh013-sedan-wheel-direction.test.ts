import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {
 NH013_SEDAN_HEADING_CORRECTION,sedanSteeringFromMovement,
 prepareNH013SedanWheelRig,
} from "@/game/vehicles/nh013-sedan-wheel-rig";
import {NullEngine,Scene,MeshBuilder,TransformNode,Vector3} from "@babylonjs/core";

describe("NH-013 G1 source-authentic sedan heading and wheel qualification",()=>{
 it("corrects reversed traffic visual only; wheel roll follows position",()=>{
   expect(NH013_SEDAN_HEADING_CORRECTION).toBe(Math.PI);
   const start={x:0,z:0,heading:0};
   const straight=sedanSteeringFromMovement(start,{x:0,z:1,heading:0});
   expect(straight.travelMetres).toBe(1);
   expect(straight.steeringRadians).toBe(0);
   const left=sedanSteeringFromMovement(start,{x:0,z:1,heading:-.1});
   const right=sedanSteeringFromMovement(start,{x:0,z:1,heading:.1});
   expect(left.steeringRadians).toBeLessThan(0);
   expect(right.steeringRadians).toBeGreaterThan(0);
   expect(sedanSteeringFromMovement(start,start)).toEqual({
     travelMetres:0,steeringRadians:0});
 });
 it("audits real source GLB: exactly four original tyre, rim and tread assemblies",()=>{
   const buffer=readFileSync("public/GLBs/Cars/Four Door Sedan.glb");
   expect(buffer.toString("ascii",0,4)).toBe("glTF");
   const n=buffer.readUInt32LE(12);
   const gltf=JSON.parse(buffer.toString("utf8",20,20+n));
   const names=new Set<string>(gltf.nodes.map((x:{name:string})=>x.name));
   for(const suffix of ["",".001",".002",".003"]){
     for(const part of ["107 reused Alloy_five_spoke_rim",
       "107 reused Sculpted_tyre","Siped tread blocks"])
       expect(names.has(part+suffix)).toBe(true);
   }
   const partIndex=(name:string)=>gltf.nodes.find((n:{name:string})=>n.name===name).mesh;
   const center=(name:string):number[]=>{
     const mesh=gltf.meshes[partIndex(name)];
     const accessor=gltf.accessors[mesh.primitives[0].attributes.POSITION];
     return accessor.min.map((v:number,i:number)=>(v+accessor.max[i])/2);
   };
   const front=center("107 reused Sculpted_tyre");
   const back=center("107 reused Sculpted_tyre.002");
   expect(front[0]).toBeLessThan(0);
   expect(back[0]).toBeGreaterThan(0);
   expect(back[0]!-front[0]!).toBeGreaterThan(2.7);
   expect(center("107 reused Sculpted_tyre.001")[2]).toBeLessThan(0);
   expect(center("107 reused Sculpted_tyre")[2]).toBeGreaterThan(0);
   // Real source headlamp x<0 and tail-light x>0, proving front/rear.
   const head=center("Fine headlamp perimeter gasket");
   const tail=center("Tail lamp molded perimeter housing");
   expect(head[0]).toBeLessThan(-2);
   expect(tail[0]).toBeGreaterThan(2);
 });
 it("rejects an unqualified model rather than inventing its wheels",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const root=new TransformNode("test-sedan",scene);
   const fake=MeshBuilder.CreateBox("chassis-only",{size:1},scene);
   fake.parent=root;
   const result=prepareNH013SedanWheelRig(root);
   expect(result.ready).toBe(false);
   expect(result.rig).toBeNull();
   expect(root.getChildMeshes(false)).toHaveLength(1);
   expect(fake.position.equals(Vector3.Zero())).toBe(true);
   scene.dispose();engine.dispose();
 });
});
