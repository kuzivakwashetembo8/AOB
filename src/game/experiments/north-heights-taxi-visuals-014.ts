/** NH-014 taxi pilot: lightweight (19,916 source triangles) authentic moving
 * Taxi.glb views of eight existing NH-012 agents. Original body, signage,
 * original tyre/rim meshes and texture remain unmodified.
 * Dot fallback persists until source and all four original wheels qualify.
 */
import {AbstractMesh,Scene,TransformNode,loadAssetContainerAsync} from "@babylonjs/core";
import type {AssetContainer} from "@babylonjs/core";
import type {NH012TrafficSnapshot,NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {NH014_TAXI_MODEL_ID,NH014_TAXI_SOURCE} from "@/game/traffic/nh014-taxi-pilot";
import {resolveMercerGLBFit,type Bounds006,type MercerExtra006Spec}
 from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {prepareTaxiWheelRig014,NH014_TAXI_HEADING_CORRECTION,
 NH014_TAXI_TRACK,NH014_TAXI_WHEELBASE} from "@/game/vehicles/nh014-taxi-wheel-rig";
import type {StreetVehicleWheelRig} from "@/game/vehicles/street-vehicle-wheels";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013,smoothTrafficToe013} from "@/game/vehicles/nh013-traffic-turn-steering";
import {northHeightsGround} from "./north-heights-reconstruction-001";

type Visual={
 anchor:TransformNode;entries:ReturnType<AssetContainer["instantiateModelsToScene"]>;
 wheels:StreetVehicleWheelRig;
 lastPose:{x:number;z:number;heading:number};lastTick:number;toe:number;
};
export interface NH014TaxiVisuals {
 update(snapshot:NH012TrafficSnapshot,camera:{x:number;y:number;z:number}):ReadonlySet<string>;
 readonly report:{created:number;loaded:number;active:number;failed:string[]};
 dispose():void;
}
const spec:MercerExtra006Spec={
 id:NH014_TAXI_MODEL_ID,label:"Source Taxi",url:NH014_TAXI_SOURCE,
 x:0,z:0,width:1.85,height:1.90,length:4.5,yaw:0,
};
const HORIZON=425;
function meshes(root:TransformNode):AbstractMesh[]{
 return root.getChildMeshes(false).filter(m=>m.getTotalVertices()>0);
}
function bounds(items:readonly AbstractMesh[]):Bounds006{
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(const m of items){
   m.computeWorldMatrix(true);const b=m.getBoundingInfo().boundingBox;
   minX=Math.min(minX,b.minimumWorld.x);maxX=Math.max(maxX,b.maximumWorld.x);
   minY=Math.min(minY,b.minimumWorld.y);maxY=Math.max(maxY,b.maximumWorld.y);
   minZ=Math.min(minZ,b.minimumWorld.z);maxZ=Math.max(maxZ,b.maximumWorld.z);
 }
 if(!Number.isFinite(minX))throw Error("NH014 empty taxi GLB");
 return {minX,maxX,minY,maxY,minZ,maxZ};
}
function instantiate(scene:Scene,source:AssetContainer,agent:NH012Agent):Visual{
 const entries=source.instantiateModelsToScene(n=>"nh014:"+agent.id+":"+n,true);
 const anchor=new TransformNode("nh014-taxi-agent:"+agent.id,scene);
 const visual=new TransformNode("nh014-taxi-normalize:"+agent.id,scene);
 visual.parent=anchor;
 try{
   for(const root of entries.rootNodes)root.parent=visual;
   const items=meshes(anchor);
   const fit=resolveMercerGLBFit(bounds(items),spec);
   visual.rotation.y=fit.turn+NH014_TAXI_HEADING_CORRECTION;
   visual.scaling.setAll(fit.scale);
   const b=bounds(items);
   visual.position.set(-(b.minX+b.maxX)/2,-b.minY,-(b.minZ+b.maxZ)/2);
   // Keep original source taxi paint, rubber, glass, headlights and taxi sign.
   const originalWheels=prepareTaxiWheelRig014(anchor);
   for(const mesh of items){mesh.isPickable=false;mesh.receiveShadows=false;}
   return {anchor,entries,wheels:originalWheels,
     lastPose:{x:agent.x,z:agent.z,heading:agent.heading},lastTick:-1,toe:0};
 }catch(error){
   entries.dispose();anchor.dispose(false,false);
   throw error;
 }
}
export function createNorthHeightsTaxiVisuals014(scene:Scene,graph:TrafficGraph012):NH014TaxiVisuals{
 let closed=false,created=0,source:AssetContainer|null=null,loading=false;
 const failed:string[]=[];
 const active=new Map<string,Visual>();
 const visible=new Set<string>();
 function load(){
   if(loading||closed||source||failed.length)return;
   loading=true;
   void loadAssetContainerAsync(NH014_TAXI_SOURCE,scene).then(container=>{
     if(closed)container.dispose();else source=container;
   }).catch(error=>{
     failed.push("source:"+String(error));
     console.error("[NH-014] Original taxi GLB import failed",error);
   }).finally(()=>{loading=false;});
 }
 function release(id:string){
   const v=active.get(id);if(!v)return;
   active.delete(id);v.wheels.dispose();v.entries.dispose();v.anchor.dispose(false,false);
 }
 load(); // One 747KB source asset, instanced lazily; no per-car GLB network downloads.
 return {
   get report(){return {created,loaded:source?1:0,active:active.size,failed:[...failed]};},
   update(snapshot,camera){
     visible.clear();if(closed)return visible;
     const wanted=snapshot.agents.filter(a=>a.modelId===NH014_TAXI_MODEL_ID)
       .map(agent=>({agent,distance:Math.hypot(agent.x-camera.x,agent.z-camera.z)}))
       .filter(a=>a.distance<HORIZON).sort((a,b)=>a.distance-b.distance);
     const retained=new Set<string>();
     let createdThisFrame=0;
     for(const {agent} of wanted){
       if(failed.some(s=>s.startsWith("instance:"+agent.id+":")))continue;
       if(!active.has(agent.id)){
         if(!source){load();continue;}
         if(createdThisFrame>=1)continue; // Cap instantiation spikes.
         try{
           active.set(agent.id,instantiate(scene,source,agent));created++;createdThisFrame++;
         }catch(error){
           failed.push("instance:"+agent.id+":"+(error instanceof Error?error.message:String(error)));
           console.error("[NH-014] Taxi original-wheel qualification failed",error);
           continue;
         }
       }
       const v=active.get(agent.id)!;
       const road=sampleTrafficVehicleRoadPose013({
         x:agent.x,z:agent.z,heading:agent.heading,
         wheelbase:NH014_TAXI_WHEELBASE,track:NH014_TAXI_TRACK,ground:northHeightsGround,
       });
       v.anchor.position.set(agent.x,road.y,agent.z);
       v.anchor.rotationQuaternion=road.rotation;
       if(v.lastTick!==snapshot.tick){
         const distance=Math.hypot(agent.x-v.lastPose.x,agent.z-v.lastPose.z);
         const dHeading=Math.atan2(Math.sin(agent.heading-v.lastPose.heading),
           Math.cos(agent.heading-v.lastPose.heading));
         const turn=distance>.003?Math.atan(NH014_TAXI_WHEELBASE*dHeading/distance):0;
         const target=trafficTurnSteering013(agent,graph,NH014_TAXI_WHEELBASE);
         v.toe=smoothTrafficToe013(v.toe,target||Math.max(-.72,Math.min(.72,turn)),true);
         v.wheels.update(distance,v.toe);
         v.lastPose={x:agent.x,z:agent.z,heading:agent.heading};
         v.lastTick=snapshot.tick;
       }
       retained.add(agent.id);visible.add(agent.id);
     }
     for(const id of active.keys())if(!retained.has(id))release(id);
     return visible;
   },
   dispose(){
     if(closed)return;closed=true;
     for(const id of active.keys())release(id);
     source?.dispose();source=null;visible.clear();failed.length=0;
   },
 };
}
