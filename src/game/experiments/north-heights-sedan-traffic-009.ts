/** GEN-VEH-009 — Every moving NH-012 agent is ONE owner-accepted source
 * sedan. This renderer owns no additional model family, GLB import, fallback
 * silhouette, diagnostic dot, vehicle physics actor, or new route.
 * The original 4 rim/tire assemblies and 24 glazing primitives remain native.
 */
import {
 Color3,Matrix,Mesh,Quaternion,Scene,StandardMaterial,Vector3
} from "@babylonjs/core";
import type {NH012TrafficSnapshot} from "@/game/traffic/nh012-traffic-simulator";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {
 sourceRecord007,hasNativeBody007,hasNativeWheels007,hasSourcePart007,
 createNativeBodyPart007,createNativeWheel007,sourceWheelFit007,
 type SevenSourceBody007,type SevenSourceCorner007,type SevenSourceWheelPart007
} from "@/game/vehicles/native-seven-vehicle-007";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013} from "@/game/vehicles/nh013-traffic-turn-steering";
import {northHeightsGround} from "./north-heights-reconstruction-001";
import {
 NH009_SEDAN_COUNT,NH009_SEDAN_MODEL,sedanPaint009,sedanFleetAudit009
} from "@/game/traffic/nh009-sedan-only-policy";

const corners:readonly SevenSourceCorner007[]=[
 "frontLeft","frontRight","rearLeft","rearRight"
];
const parts:readonly SevenSourceBody007[]=[
 "paint","glass","trim","frontLight","rearLight"
];
const up=Vector3.Up(),right=Vector3.Right();
type Bucket009={mesh:Mesh;matrix:Float32Array;count:number};
export interface NH009SedanTraffic{
 update(snapshot:NH012TrafficSnapshot,exclude:ReadonlySet<string>):{
   vehicles3D:number;sourceGLBs:0;lowDetail:number;defaultFleet:number;dots:0;
 };
 dispose():void;
}
export function createNorthHeightsSedanTraffic009(scene:Scene,graph:TrafficGraph012):NH009SedanTraffic{
 const source=sourceRecord007(NH009_SEDAN_MODEL);
 if(!hasNativeBody007(NH009_SEDAN_MODEL)||!hasNativeWheels007(NH009_SEDAN_MODEL)||
   !source?.body?.['glass']||!source?.body?.['paint']||
   !corners.every(c=>source.wheels?.[c]?.rim&&source.wheels?.[c]?.tire))
   throw Error("GEN-VEH-009 requires the accepted sedan body, glass and four original rim/tyre pairs");
 const buckets=new Map<string,Bucket009>();
 const materials:StandardMaterial[]=[];
 function bucket(key:string,create:()=>Mesh,color:string,kind:string):Bucket009{
   const found=buckets.get(key);if(found)return found;
   const mesh=create();
   const mat=new StandardMaterial("nh009:material:"+key,scene);
   mat.diffuseColor=Color3.FromHexString(color);
   mat.specularColor=Color3.FromHexString(kind==="paint"?"#65717F":"#7B8490");
   mat.specularPower=kind==="glass"?76:kind==="rim"?68:30;
   mat.backFaceCulling=false;
   if(kind==="glass")mat.alpha=.86;
   if(kind==="frontLight"||kind==="rearLight")
     mat.emissiveColor=mat.diffuseColor.scale(.43);
   mesh.material=mat;mesh.receiveShadows=false;mesh.isPickable=false;
   mesh.alwaysSelectAsActiveMesh=true;
   const matrix=new Float32Array(NH009_SEDAN_COUNT*16);
   mesh.thinInstanceSetBuffer("matrix",matrix,16,false);
   mesh.thinInstanceCount=0;mesh.setEnabled(false);
   const result={mesh,matrix,count:0};buckets.set(key,result);
   materials.push(mat);
   return result;
 }
 // A single shared source mesh definition per material. There are multiple
 // paint batches, but NO additional geometry-family generation.
 const exterior=(part:SevenSourceBody007,color:string)=>{
   const key="body:"+part+":"+(part==="paint"?color:"common");
   return bucket(key,()=>createNativeBodyPart007(scene,"nh009:"+key,NH009_SEDAN_MODEL,part),color,part);
 };
 const wheel=(corner:SevenSourceCorner007,part:SevenSourceWheelPart007)=>{
   const key="wheel:"+corner+":"+part;
   return bucket(key,()=>createNativeWheel007(scene,"nh009:"+key,
     NH009_SEDAN_MODEL,corner,part),
     part==="tire"?"#15191E":"#9AA1AB",part);
 };
 // Avoid allocating or uploading anything for unavailable source categories.
 const exteriorColors:Record<Exclude<SevenSourceBody007,"paint">,string>={
   glass:"#334D60",trim:"#2E353C",frontLight:"#EDECE6",rearLight:"#B72C34"
 };
 const front=sourceWheelFit007("sedan","frontLeft");
 const rear=sourceWheelFit007("sedan","rearLeft");
 const opposite=sourceWheelFit007("sedan","frontRight");
 const wheelbase=Math.abs((front.center[2]??0)-(rear.center[2]??0));
 const track=Math.abs((front.center[0]??0)-(opposite.center[0]??0));
 if(wheelbase<1.9||wheelbase>3.9||track<1.15||track>2.4)
   throw Error("GEN-VEH-009 invalid accepted sedan wheelbase or track");
 function write(entry:Bucket009,world:Matrix){
   if(entry.count>=NH009_SEDAN_COUNT)throw Error("GEN-VEH-009 thin instance overflow");
   world.copyToArray(entry.matrix,entry.count*16);entry.count++;
 }
 const positions=new Map<string,{x:number;z:number;spin:number;tick:number}>();
 let tick=-1;
 let last={vehicles3D:0,sourceGLBs:0 as const,lowDetail:0,defaultFleet:0,dots:0 as const};
 return {
   update(snapshot,_exclude){
     if(snapshot.tick===tick)return last;
     sedanFleetAudit009(snapshot);
     tick=snapshot.tick;
     for(const b of buckets.values())b.count=0;
     for(const a of snapshot.agents){
       const color=sedanPaint009(a.id);
       const pose=sampleTrafficVehicleRoadPose013({
         x:a.x,z:a.z,heading:a.heading,wheelbase,track,ground:northHeightsGround
       });
       const world=Matrix.Compose(Vector3.One(),pose.rotation,new Vector3(a.x,pose.y,a.z));
       write(exterior("paint",color),world);
       for(const part of parts){
         if(part==="paint"||!hasSourcePart007("sedan",part))continue;
         write(exterior(part,exteriorColors[part]),world);
       }
       const previous=positions.get(a.id);
       const distance=previous?Math.hypot(a.x-previous.x,a.z-previous.z):0;
       const spin=(previous?.spin??0)+(previous?.tick===snapshot.tick?0:distance/front.radius);
       positions.set(a.id,{x:a.x,z:a.z,spin,tick:snapshot.tick});
       const steer=a.connectorId?
         Math.max(-.8,Math.min(.8,trafficTurnSteering013(a,graph,wheelbase)*1.6)):0;
       for(const corner of corners){
         const fit=sourceWheelFit007(NH009_SEDAN_MODEL,corner);
         const turn=corner.startsWith("front")?steer:0;
         const rotation=Quaternion.RotationAxis(up,turn).multiply(Quaternion.RotationAxis(right,spin));
         const transform=Matrix.Compose(Vector3.One(),rotation,
           new Vector3(fit.center[0]??0,fit.center[1]??0,fit.center[2]??0)).multiply(world);
         write(wheel(corner,"tire"),transform);
         const outward=(fit.center[0]??0)>=0?1:-1;
         write(wheel(corner,"rim"),Matrix.Translation(outward*.012,0,0).multiply(transform));
       }
     }
     for(const b of buckets.values()){
       b.mesh.thinInstanceCount=b.count;
       if(b.count){b.mesh.setEnabled(true);b.mesh.thinInstanceBufferUpdated("matrix");}
       else b.mesh.setEnabled(false);
     }
     last={vehicles3D:snapshot.count,sourceGLBs:0,lowDetail:snapshot.count,
       defaultFleet:snapshot.count,dots:0};
     return last;
   },
   dispose(){
     for(const bucket of buckets.values())bucket.mesh.dispose(false,false);
     for(const material of materials)material.dispose();
     buckets.clear();positions.clear();
   }
 };
}
