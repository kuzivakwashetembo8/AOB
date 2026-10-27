import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NullEngine,Scene,StandardMaterial,VertexBuffer} from "@babylonjs/core";
import {sourceRecord007} from "@/game/vehicles/native-seven-vehicle-007";
import {sedanSignedWheelTravel009} from "@/game/experiments/north-heights-sedan-traffic-009";
import {createNorthHeightsRoads003} from "@/game/experiments/north-heights-roads-003";

describe("GTD-NH-VIS-027-001 source-native synchronized Sedan outer tyre shell",()=>{
 it("contains exactly four separate Siped tread meshes in the genuine source GLB",()=>{
   const buf=readFileSync("public/GLBs/Cars/Four Door Sedan.glb");
   expect(buf.toString("ascii",0,4)).toBe("glTF");
   const size=buf.readUInt32LE(12);
   const original=JSON.parse(buf.toString("utf8",20,20+size));
   const tread=original.nodes.filter((node:{name?:string})=>
     /^Siped tread blocks(?:\.\d+)?$/i.test(node.name??""));
   const tyres=original.nodes.filter((node:{name?:string})=>
     /^107 reused Sculpted_tyre(?:\.\d+)?$/i.test(node.name??""));
   const rims=original.nodes.filter((node:{name?:string})=>
     /^107 reused Alloy_five_spoke_rim(?:\.\d+)?$/i.test(node.name??""));
   expect(tread).toHaveLength(4);
   expect(tyres).toHaveLength(4);
   expect(rims).toHaveLength(4);
   expect(tread.every((node:{mesh?:number})=>typeof node.mesh==="number")).toBe(true);
 });
 it("enforces extracted tread ownership during the build rather than hiding static tread",()=>{
   const extractor=readFileSync("scripts/genveh007-extract-seven.mjs","utf8");
   expect(extractor).toContain('if(model.id==="sedan")return /^Siped tread blocks');
   expect(extractor).toContain('GEN_VEH_009_TREAD_SYNC');
   expect(extractor).toContain('matching.length!==1');
   expect(extractor).toContain('static Sedan exterior still contains a tire tread shell');
   const source=sourceRecord007("sedan");
   expect(source?.wheelsStatus).toBe("source");
   expect(source?.wheels&&Object.keys(source.wheels)).toHaveLength(4);
   for(const corner of ["frontLeft","frontRight","rearLeft","rearRight"] as const){
     expect(source?.wheels?.[corner]?.tire?.triangles??0).toBeGreaterThan(100);
     expect(source?.wheels?.[corner]?.rim?.triangles??0).toBeGreaterThan(100);
   }
 });
 it("rolls rim AND tyre backward when reversing and does not roll on lateral motion",()=>{
   expect(sedanSignedWheelTravel009({x:0,z:0},{x:0,z:2,heading:0})).toBeCloseTo(2);
   expect(sedanSignedWheelTravel009({x:0,z:0},{x:0,z:-2,heading:0})).toBeCloseTo(-2);
   expect(sedanSignedWheelTravel009({x:0,z:0},{x:2,z:0,heading:0})).toBeCloseTo(0);
   expect(sedanSignedWheelTravel009({x:0,z:0},{x:2,z:0,heading:Math.PI/2})).toBeCloseTo(2);
   expect(sedanSignedWheelTravel009({x:0,z:0},{x:-2,z:0,heading:Math.PI/2})).toBeCloseTo(-2);
 });
});

describe("GTD-NH-VIS-027-001 raised pavement is enclosed concrete, not a flat paper quad",()=>{
 it("has grade-following FULL outer fascia and two-height road lips on both road axes",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const material=Object.fromEntries(["asphalt","pavement","curb","crossing","marking"].map(name=>
       [name,new StandardMaterial(name,scene)])) as Record<
         "asphalt"|"pavement"|"curb"|"crossing"|"marking",StandardMaterial>;
     const at=(x:number,z:number)=>.01*x+.015*z;
     const info=createNorthHeightsRoads003(scene,[-128,-64,0,64,128],at,material);
     expect(info.surfaceMeshes).toBe(5);
     expect(info.curbs).toBeGreaterThan(0);
     const m=scene.getMeshByName("nh003-road:curb")!;
     const p=m.getVerticesData(VertexBuffer.PositionKind)!;
     expect(p.length).toBeGreaterThan(0);
     function profileFor(predicate:(x:number,z:number)=>boolean):number[]{
       const levels:number[]=[];
       for(let i=0;i<p.length;i+=3){
         const x=p[i]!,y=p[i+1]!,z=p[i+2]!;
         if(predicate(x,z))levels.push(Math.round((y-at(x,z))*1000)/1000);
       }
       return [...new Set(levels)];
     }
     // z-running road edge x=4, exposed outer wall x=7.75.
     const zInner=profileFor((x,z)=>Math.abs(x-4)<.001&&z>7&&z<57);
     const zOuter=profileFor((x,z)=>Math.abs(x-7.75)<.001&&z>7&&z<57);
     // x-running road edge z=4, exposed outer wall z=7.75.
     const xInner=profileFor((x,z)=>Math.abs(z-4)<.001&&x>7&&x<57);
     const xOuter=profileFor((x,z)=>Math.abs(z-7.75)<.001&&x>7&&x<57);
     for(const v of [zInner,xInner]){
       expect(v).toContain(0);expect(v).toContain(.075);expect(v).toContain(.2);
     }
     for(const v of [zOuter,xOuter]){
       expect(v).toContain(0);expect(v).toContain(.2);
     }
     // Corner quadrant x=4..7.75 z=4..7.75 has top, bottom and all 4 sides.
     const corner=profileFor((x,z)=>x>=3.999&&x<=7.751&&z>=3.999&&z<=7.751);
     expect(corner).toContain(0);expect(corner).toContain(.2);
     expect(m.getTotalIndices()).toBeGreaterThan(800);
   }finally{scene.dispose();engine.dispose();}
 });
});
