/** NH-015 — mobile-capped source Kangoo render followers of existing dots.
 * All 125 simulation/route decisions are owned exclusively by NH-012.
 * Opt-in source-derived Draco wheel GLB is build-time generated from actual
 * owner mesh triangles. Source Z-up is corrected before body-axis fit.
 */
import {AbstractMesh,Scene,TransformNode,loadAssetContainerAsync} from "@babylonjs/core";
import type {AssetContainer} from "@babylonjs/core";
import type {NH012TrafficSnapshot,NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {NH015_KANGO_ID,NH015_KANGO_DERIVED} from "@/game/traffic/nh015-kango-pilot";
import {resolveMercerGLBFit,type Bounds006,type MercerExtra006Spec}
 from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {prepareKangoWheels015,NH015_KANGO_WHEELBASE,NH015_KANGO_TRACK,
 NH015_KANGO_SOURCE_UP_CORRECTION,NH015_KANGO_HEADING_CORRECTION}
 from "@/game/vehicles/nh015-kango-wheel-rig";
import type {StreetVehicleWheelRig} from "@/game/vehicles/street-vehicle-wheels";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013,smoothTrafficToe013} from "@/game/vehicles/nh013-traffic-turn-steering";
import {northHeightsGround} from "./north-heights-reconstruction-001";
type Instance={
 anchor:TransformNode;entries:ReturnType<AssetContainer["instantiateModelsToScene"]>;
 wheels:StreetVehicleWheelRig;last:{x:number;z:number;heading:number};lastTick:number;toe:number;
};
export type NH015KangoVisuals={
 update(snapshot:NH012TrafficSnapshot,camera:{x:number;y:number;z:number}):ReadonlySet<string>;
 readonly report:{created:number;loaded:number;active:number;failed:string[]};
 dispose():void;
};
const spec:MercerExtra006Spec={
 id:NH015_KANGO_ID,label:"Renault Kangoo",url:NH015_KANGO_DERIVED,
 x:0,z:0,width:1.85,height:1.88,length:4.45,yaw:0,
};
// Six existing traffic identities, at most four source-heavy meshes at once.
// When out of range or over budget, other identities retain moving dots.
const HORIZON=375,MAX_ACTIVE=4;
function worldBounds(items:readonly AbstractMesh[]):Bounds006{
 const b={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,minZ:Infinity,maxZ:-Infinity};
 for(const m of items){
   m.computeWorldMatrix(true);const q=m.getBoundingInfo().boundingBox;
   b.minX=Math.min(b.minX,q.minimumWorld.x);b.maxX=Math.max(b.maxX,q.maximumWorld.x);
   b.minY=Math.min(b.minY,q.minimumWorld.y);b.maxY=Math.max(b.maxY,q.maximumWorld.y);
   b.minZ=Math.min(b.minZ,q.minimumWorld.z);b.maxZ=Math.max(b.maxZ,q.maximumWorld.z);
 }
 if(!Number.isFinite(b.minX))throw Error("NH015 Kangoo missing original renderable mesh");
 return b;
}
function instantiate(scene:Scene,source:AssetContainer,agent:NH012Agent):Instance{
 const entries=source.instantiateModelsToScene(n=>"nh015:"+agent.id+":"+n,true);
 const anchor=new TransformNode("nh015-kango-agent:"+agent.id,scene);
 const visual=new TransformNode("nh015-kango-fit:"+agent.id,scene);
 const corrected=new TransformNode("nh015-kango-source-up:"+agent.id,scene);
 visual.parent=anchor;corrected.parent=visual;
 try{
   for(const root of entries.rootNodes)root.parent=corrected;
   // Source raw vehicle uses X lateral, Y length, Z up; no scene-wide
   // rotation or 125-agent yaw change is permissible.
   corrected.rotation.x=NH015_KANGO_SOURCE_UP_CORRECTION;
   const meshes=anchor.getChildMeshes(false).filter(m=>m.getTotalVertices()>0);
   const fit=resolveMercerGLBFit(worldBounds(meshes),spec);
   visual.rotation.y=fit.turn+NH015_KANGO_HEADING_CORRECTION;
   visual.scaling.setAll(fit.scale);
   const box=worldBounds(meshes);
   visual.position.set(-(box.minX+box.maxX)/2,-box.minY,-(box.minZ+box.maxZ)/2);
   const wheels=prepareKangoWheels015(anchor);
   for(const m of meshes){m.isPickable=false;m.receiveShadows=false;}
   return {anchor,entries,wheels,last:{x:agent.x,z:agent.z,heading:agent.heading},
     lastTick:-1,toe:0};
 }catch(error){
   entries.dispose();anchor.dispose(false,false);throw error;
 }
}
export function createNorthHeightsKangoVisuals015(scene:Scene,graph:TrafficGraph012):NH015KangoVisuals{
 let closed=false,source:AssetContainer|null=null,pending=false,created=0;
 const errors:string[]=[];
 const live=new Map<string,Instance>();
 const visible=new Set<string>();
 function request(){
   if(closed||pending||source||errors.length)return;
   pending=true;
   void loadAssetContainerAsync(NH015_KANGO_DERIVED,scene)
     .then(container=>{if(closed)container.dispose();else source=container;})
     .catch(error=>{errors.push("source:"+String(error));
       console.error("[NH-015] Kangoo wheel-extracted source failed to load",error);})
     .finally(()=>{pending=false;});
 }
 function release(id:string){
   const v=live.get(id);if(!v)return;
   live.delete(id);v.wheels.dispose();v.entries.dispose();v.anchor.dispose(false,false);
 }
 request();
 return {
   get report(){return {created,loaded:source?1:0,active:live.size,failed:[...errors]};},
   update(snapshot,camera){
     visible.clear();if(closed)return visible;
     const selected=snapshot.agents.filter(a=>a.modelId===NH015_KANGO_ID)
       .map(agent=>({agent,distance:Math.hypot(agent.x-camera.x,agent.z-camera.z)}))
       .filter(x=>x.distance<HORIZON).sort((a,b)=>a.distance-b.distance)
       .slice(0,MAX_ACTIVE);
     const keep=new Set<string>();let added=0;
     for(const {agent} of selected){
       if(errors.some(s=>s.startsWith("instance:"+agent.id+":")))continue;
       if(!live.has(agent.id)){
         if(!source){request();continue;}
         if(added>=1)continue;
         try{live.set(agent.id,instantiate(scene,source,agent));created++;added++;}
         catch(error){errors.push("instance:"+agent.id+":"+String(error));
           console.error("[NH-015] Source-wheel Kangoo qualification failed",error);continue;}
       }
       const v=live.get(agent.id)!;
       const road=sampleTrafficVehicleRoadPose013({
         x:agent.x,z:agent.z,heading:agent.heading,
         wheelbase:NH015_KANGO_WHEELBASE,track:NH015_KANGO_TRACK,ground:northHeightsGround,
       });
       v.anchor.position.set(agent.x,road.y,agent.z);
       v.anchor.rotationQuaternion=road.rotation;
       if(v.lastTick!==snapshot.tick){
         const distance=Math.hypot(agent.x-v.last.x,agent.z-v.last.z);
         const delta=Math.atan2(Math.sin(agent.heading-v.last.heading),
           Math.cos(agent.heading-v.last.heading));
         const fromMovement=distance>.003?Math.atan(NH015_KANGO_WHEELBASE*delta/distance):0;
         const fromCurve=trafficTurnSteering013(agent,graph,NH015_KANGO_WHEELBASE);
         const target=(Math.abs(fromCurve)>.004?fromCurve:fromMovement)*1.6;
         v.toe=smoothTrafficToe013(v.toe,Math.max(-.85,Math.min(.85,target)),true);
         v.wheels.update(distance,v.toe);
         v.last={x:agent.x,z:agent.z,heading:agent.heading};v.lastTick=snapshot.tick;
       }
       keep.add(agent.id);visible.add(agent.id);
     }
     for(const id of live.keys())if(!keep.has(id))release(id);
     return visible;
   },
   dispose(){
     if(closed)return;closed=true;
     for(const id of live.keys())release(id);
     source?.dispose();source=null;errors.length=0;visible.clear();
   },
 };
}
