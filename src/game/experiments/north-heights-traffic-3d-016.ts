/** NH-016 no-dot rendering floor.
 * 125 NH-012 logical vehicles stay 125 vehicles at ALL distances and during
 * authentic GLB loading/failure. These are small, recognizable 3D LOD
 * silhouettes, batched with Babylon thin instances, NOT diagnostic spheres.
 * Close originals are drawn instead by NH-013..016's genuine GLB renderers.
 */
import {
 Color3,Matrix,Mesh,MeshBuilder,Quaternion,Scene,StandardMaterial,Vector3,
} from "@babylonjs/core";
import type {NH012TrafficSnapshot} from "@/game/traffic/nh012-traffic-simulator";
import {MERCER_EXTRA_GLB_SPECS} from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013} from "@/game/vehicles/nh013-traffic-turn-steering";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {northHeightsGround} from "./north-heights-reconstruction-001";
import {NH016_CLASS,NH016_FLEET_SET,fleetPaint016,
 type NH016FleetVisualClass} from "@/game/traffic/nh016-fleet-manifest";

type Bucket={mesh:Mesh;buffer:Float32Array;count:number};
type WorldPart={x:number;y:number;z:number;w:number;h:number;d:number};
type Spec={length:number;width:number;height:number;style:NH016FleetVisualClass|"sedan"|"hatch"|"taxi"|"kango"};
export interface NH016Traffic3D {
 update(snapshot:NH012TrafficSnapshot,exclude:ReadonlySet<string>):{
   vehicles3D:number;sourceGLBs:number;lowDetail:number;defaultFleet:number;dots:0;
 };
 dispose():void;
}
const bodyDims=new Map(MERCER_EXTRA_GLB_SPECS.map(s=>[s.id,{
 length:s.length,width:s.width,height:s.height,style:NH016_CLASS[s.id as keyof typeof NH016_CLASS],
}]));
const sedans:Spec={length:4.75,width:1.85,height:1.55,style:"sedan"};
const hatchbacks:Spec={length:4.35,width:1.78,height:1.60,style:"hatch"};
const taxis:Spec={length:4.5,width:1.85,height:1.90,style:"taxi"};
const kango:Spec={length:4.45,width:1.85,height:1.88,style:"kango"};
export function trafficProxySpec016(model:string):Spec{
 if(model==="gtd-traffic-sedan-013")return sedans;
 if(model==="gtd-traffic-hatchback-013")return hatchbacks;
 if(model==="gtd-traffic-taxi-014")return taxis;
 if(model==="gtd-traffic-kango-015")return kango;
 const found=bodyDims.get(model);
 if(!found||!found.style)throw Error("NH016 unknown traffic model "+model);
 return found;
}
function bodyPieces(s:Spec):WorldPart[]{
 const w=s.width,d=s.length;
 const bottom=Math.max(.46,Math.min(.65,s.height*.36));
 const isPickup=s.style==="pickup";
 const low=s.style==="supercar"||s.style==="coupe"||s.style==="muscle";
 const nose=isPickup?.30:low?.28:.25;
 const cab=isPickup?.44:low?.52:s.style==="kango"?.73:.64;
 const cabZ=isPickup?-.32:low?-.14:0;
 const cabH=Math.max(.30,s.height-bottom-.18);
 const result:WorldPart[]=[
   {x:0,y:.37+bottom/2,z:0,w,h:bottom,d},
   {x:0,y:.37+bottom+.15,z:d*(.5-nose/2),w:w*.94,h:.26,d:d*nose},
   {x:0,y:.37+bottom+cabH/2,z:cabZ,w:w*.84,h:cabH,d:d*cab},
 ];
 if(isPickup)result.push({x:0,y:.37+bottom+.10,z:-d*.37,w:w*.92,h:.20,d:d*.25});
 if(s.style==="offroad")result.push({x:0,y:.37+bottom+.25,z:-d*.47,w:w*.89,h:.32,d:.15});
 if(s.style==="supercar")result.push({x:0,y:.37+bottom+.15,z:-d*.44,w:w*.90,h:.10,d:.20});
 return result;
}
function glassPieces(s:Spec):WorldPart[]{
 const bottom=Math.max(.46,Math.min(.65,s.height*.36));
 const cabH=Math.max(.30,s.height-bottom-.18);
 const pickup=s.style==="pickup",low=["supercar","coupe","muscle"].includes(s.style);
 const cab=pickup?.44:low?.52:s.style==="kango"?.73:.64;
 const z=pickup?-.32:low?-.14:0;
 return [
   {x:0,y:.37+bottom+cabH*.56,z:z+s.length*cab*.45,
      w:s.width*.78,h:cabH*.74,d:.035},
   {x:0,y:.37+bottom+cabH*.56,z:z-s.length*cab*.45,
      w:s.width*.78,h:cabH*.74,d:.035},
 ];
}
function makeBucket(scene:Scene,key:string,color:string,shape:"box"|"wheel",capacity=125*6):Bucket{
 const mesh=shape==="box"
  ?MeshBuilder.CreateBox("nh016:"+key,{size:1},scene)
  :MeshBuilder.CreateCylinder("nh016:"+key,{diameter:1,height:1,tessellation:12},scene);
 const material=new StandardMaterial("nh016:mat:"+key,scene);
 material.diffuseColor=Color3.FromHexString(color);
 material.specularColor=Color3.FromHexString("#17191C");
 if(key==="front-light"||key==="rear-light"){
   material.disableLighting=true;material.emissiveColor=Color3.FromHexString(color);
 }
 mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=false;
 mesh.alwaysSelectAsActiveMesh=true;
 const buffer=new Float32Array(capacity*16);
 mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
 mesh.thinInstanceCount=0;mesh.setEnabled(false);
 return {mesh,buffer,count:0};
}
const up=Vector3.Up(),right=Vector3.Right(),forward=Vector3.Forward();
const axle=Quaternion.RotationAxis(forward,Math.PI/2);
function matrix(part:WorldPart,world:Matrix,orientation=Quaternion.Identity()):Matrix{
 return Matrix.Compose(new Vector3(part.w,part.h,part.d),orientation,
   new Vector3(part.x,part.y,part.z)).multiply(world);
}
export function createNorthHeightsTraffic3D016(scene:Scene,graph:TrafficGraph012):NH016Traffic3D{
 const buckets=new Map<string,Bucket>();
 // The body is tinted per-model/paint; four shared detail materials across all
 // 125 meshes limit drawcalls. No per-agent Babylon mesh objects.
 function get(key:string,color:string,shape:"box"|"wheel"="box"){
   let b=buckets.get(key);
   if(!b){b=makeBucket(scene,key,color,shape);buckets.set(key,b);}
   return b;
 }
 const wind=get("windows","#263D4C"),
   tires=get("rubber","#171B20","wheel"),
   alloys=get("rims","#ADB4BD","wheel"),
   wheelSpoke=get("moving-wheel-spoke","#ECEDEF"),
   headlights=get("front-light","#F3F0D9"),
   taillights=get("rear-light","#B93335");
 const last=new Map<string,{x:number;z:number;spin:number;tick:number}>();
 function write(b:Bucket,m:Matrix){
   const start=b.count*16;
   if(start+16>b.buffer.length)throw Error("NH016 125-agent proxy capacity exceeded "+b.mesh.name);
   m.copyToArray(b.buffer,start);
   b.count++;
 }
 return {
   update(snapshot,exclude){
     for(const b of buckets.values())b.count=0;
     let defaultFleet=0,lowDetail=0;
     for(const a of snapshot.agents){
       const own=NH016_FLEET_SET.has(a.modelId);
       if(own)defaultFleet++;
       if(exclude.has(a.id))continue;
       lowDetail++;
       const spec=trafficProxySpec016(a.modelId);
       const base=own?a.paintId:
         a.modelId==="gtd-traffic-kango-015"?"CHAMPAGNE":
         a.modelId==="gtd-traffic-taxi-014"?"WHITE":a.paintId;
       const paint=fleetPaint016(base);
       const body=get("body:"+a.modelId+":"+paint,paint);
       const road=sampleTrafficVehicleRoadPose013({
         x:a.x,z:a.z,heading:a.heading,wheelbase:spec.length*.59,
         track:spec.width*.81,ground:northHeightsGround,
       });
       const world=Matrix.Compose(Vector3.One(),road.rotation,
         new Vector3(a.x,road.y,a.z));
       for(const p of bodyPieces(spec))write(body,matrix(p,world));
       for(const p of glassPieces(spec))write(wind,matrix(p,world));
       const wheelbase=spec.length*.59,track=spec.width*.81;
       const radius=own&&spec.style==="pickup"?.40:
         spec.style==="offroad"?.39:spec.style==="suv"?.38:
         spec.style==="supercar"?.33:.35;
       const previous=last.get(a.id);
       const distance=previous?Math.hypot(a.x-previous.x,a.z-previous.z):0;
       const spin=(previous?.spin??0)+(previous?.tick===snapshot.tick?0:distance/radius);
       last.set(a.id,{x:a.x,z:a.z,spin,tick:snapshot.tick});
       const steer=a.connectorId?Math.max(-.8,Math.min(.8,
          trafficTurnSteering013(a,graph,wheelbase)*1.6)):0;
       for(const zSign of [-1,1])for(const xSign of [-1,1]){
         const x=xSign*track*.5,z=zSign*wheelbase*.5;
         const q=(zSign>0?Quaternion.RotationAxis(up,steer):Quaternion.Identity())
           .multiply(Quaternion.RotationAxis(right,spin)).multiply(axle);
         write(tires,matrix({x,y:radius,z,w:radius*2,h:.21,d:radius*2},world,q));
         write(alloys,matrix({x:x+xSign*.113,y:radius,z,
           w:radius*1.18,h:.017,d:radius*1.18},world,q));
         // Cylinder symmetry alone makes rolling invisible. One original-style
         // bright spoke marker orbits its axle as distance advances, including
         // from the player's aerial flight camera.
         const hub=Matrix.Compose(Vector3.One(),q,new Vector3(x,radius,z));
         const spoke=Matrix.Compose(new Vector3(radius*.37,.045,.05),
           Quaternion.Identity(),new Vector3(radius*.48,xSign*.13,0));
         write(wheelSpoke,spoke.multiply(hub).multiply(world));
       }
       for(const side of [-1,1]){
         write(headlights,matrix({x:side*spec.width*.33,y:.91,z:spec.length*.502,
           w:.30,h:.13,d:.05},world));
         write(taillights,matrix({x:side*spec.width*.35,y:.83,z:-spec.length*.502,
           w:.30,h:.14,d:.05},world));
       }
     }
     for(const b of buckets.values()){
       b.mesh.thinInstanceCount=b.count;
       if(b.count){b.mesh.setEnabled(true);b.mesh.thinInstanceBufferUpdated("matrix");}
       else b.mesh.setEnabled(false);
     }
     return {vehicles3D:snapshot.count,sourceGLBs:exclude.size,
       lowDetail,defaultFleet,dots:0};
   },
   dispose(){for(const b of buckets.values()){b.mesh.material?.dispose();b.mesh.dispose(false,false);}
     buckets.clear();last.clear();},
 };
}
