/** NH-016: camera-near authentic default fleet GLB upgrades of the batched
 * NH-016 moving 3D fleet, not new agents or drivable/parked vehicle ownership.
 * Six same-origin owner-approved assets. Source-wheel WHEEL-001 qualification
 * gates upgrades; otherwise the thin-instance 3D vehicle remains visible.
 * Strict one detailed model per class + mobile cap avoids 91 full GLB clones.
 */
import {AbstractMesh,Scene,TransformNode,loadAssetContainerAsync} from "@babylonjs/core";
import type {AssetContainer} from "@babylonjs/core";
import type {NH012TrafficSnapshot,NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {MERCER_EXTRA_GLB_SPECS,resolveMercerGLBFit,
 type Bounds006,type MercerExtra006Spec} from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {StreetVehicleWheelRig} from "@/game/vehicles/street-vehicle-wheels";
import {prepareRangeRoverWheelRig} from "@/game/vehicles/range-rover-drive-007";
import {extraDriveName,prepareNativeFleetWheelRig} from "@/game/vehicles/ambient-fleet-driving-011";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013,smoothTrafficToe013} from "@/game/vehicles/nh013-traffic-turn-steering";
import {northHeightsGround} from "./north-heights-reconstruction-001";
import {selectDefaultFleetAgents016} from "@/game/traffic/nh016-fleet-manifest";

type Active={
 owner:MercerExtra006Spec;
 anchor:TransformNode;
 instance:ReturnType<AssetContainer["instantiateModelsToScene"]>;
 wheels:StreetVehicleWheelRig;
 lastPose:{x:number;z:number;heading:number};
 lastTick:number;toe:number;
};
export interface NH016AuthenticFleet{
 update(snapshot:NH012TrafficSnapshot,camera:{x:number;y:number;z:number}):ReadonlySet<string>;
 readonly report:{sources:number;active:number;created:number;failed:string[]};
 dispose():void;
}
const derived:Readonly<Record<string,string>>={
 "gtd-veh008-mercer-toyota-hilux":"/GLBs/Cars/Generated/toyota-hilux-002.glb",
 "gtd-veh009-mercer-land-rover-defender":"/GLBs/Cars/Generated/land-rover-defender-001.glb",
 "gtd-veh010-mercer-dodge-hp":"/GLBs/Cars/Generated/dodge-hp.glb",
 "gtd-veh014-mercer-bmw-m4":"/GLBs/Cars/Generated/bmw-m4-competition.glb",
};
function bounds(items:readonly AbstractMesh[]):Bounds006{
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(const mesh of items){
   mesh.computeWorldMatrix(true);
   const b=mesh.getBoundingInfo().boundingBox;
   minX=Math.min(minX,b.minimumWorld.x);maxX=Math.max(maxX,b.maximumWorld.x);
   minY=Math.min(minY,b.minimumWorld.y);maxY=Math.max(maxY,b.maximumWorld.y);
   minZ=Math.min(minZ,b.minimumWorld.z);maxZ=Math.max(maxZ,b.maximumWorld.z);
 }
 if(!Number.isFinite(minX))throw Error("NH016 empty owner GLB");
 return {minX,maxX,minY,maxY,minZ,maxZ};
}
function wheelbase(spec:MercerExtra006Spec){return spec.length*.60;}
function track(spec:MercerExtra006Spec){return spec.width*.79;}
function makeInstance(scene:Scene,container:AssetContainer,spec:MercerExtra006Spec,agent:NH012Agent):Active{
 const instance=container.instantiateModelsToScene(
   name=>"nh016:"+agent.id+":"+name,true);
 const anchor=new TransformNode("nh016-fleet-agent:"+agent.id,scene);
 const visual=new TransformNode("nh016-source-fit:"+agent.id,scene);
 visual.parent=anchor;
 try{
   for(const node of instance.rootNodes)node.parent=visual;
   const models=anchor.getChildMeshes(false).filter(m=>m.getTotalVertices()>0);
   const fit=resolveMercerGLBFit(bounds(models),spec);
   visual.rotation.y=fit.turn+(spec.visualHeadingCorrectionRadians??0);
   visual.scaling.setAll(fit.scale);
   const fitted=bounds(models);
   visual.position.set(-(fitted.minX+fitted.maxX)/2,-fitted.minY,
     -(fitted.minZ+fitted.maxZ)/2);
   const evidence=spec.id==="gtd-veh006-mercer-range-rover"
     ?prepareRangeRoverWheelRig(anchor)
     :prepareNativeFleetWheelRig(anchor,extraDriveName(spec.id)!);
   if(evidence.identified!==4||evidence.missing.length)
     throw Error("original-wheel-qualification:"+evidence.missing.join(","));
   const wheels=new StreetVehicleWheelRig(anchor,evidence.mapping);
   if(!wheels.ready||wheels.frontWheelCount!==2)
     throw Error("original-wheel-animation-incomplete");
   for(const m of models){m.isPickable=false;m.receiveShadows=false;}
   return {owner:spec,anchor,instance,wheels,
     lastPose:{x:agent.x,z:agent.z,heading:agent.heading},
     lastTick:-1,toe:0};
 }catch(error){
   instance.dispose();anchor.dispose(false,false);throw error;
 }
}
export function createNorthHeightsAuthenticFleet016(
 scene:Scene,graph:TrafficGraph012,mobile:boolean,
):NH016AuthenticFleet{
 let closed=false,created=0;
 const specById=new Map(MERCER_EXTRA_GLB_SPECS.map(s=>[s.id,s]));
 const source=new Map<string,AssetContainer>();
 const pending=new Map<string,Promise<void>>();
 const rejected=new Set<string>(),failed:string[]=[];
 const visuals=new Map<string,Active>();
 const shown=new Set<string>();
 // Avoid concurrent 6+ source asset import spikes on memory-starved Android.
 const maxSources=mobile?3:6;
 const maxActive=mobile?3:6;
 const nearRange=mobile?58:88;
 function request(spec:MercerExtra006Spec){
   if(closed||source.has(spec.id)||pending.has(spec.id)||rejected.has(spec.id)||
      pending.size>0||source.size+pending.size>=maxSources)return;
   const url=derived[spec.id]??spec.url;
   const loading=loadAssetContainerAsync(url,scene).then(asset=>{
     if(closed)asset.dispose();else source.set(spec.id,asset);
   }).catch(error=>{
     rejected.add(spec.id);
     failed.push("asset:"+spec.label+":"+String(error));
     console.error("[NH-016] Default source GLB unavailable, 3D silhouette retained",spec.id,error);
   }).finally(()=>{pending.delete(spec.id);});
   pending.set(spec.id,loading);
 }
 function release(id:string){
   const v=visuals.get(id);if(!v)return;
   visuals.delete(id);v.wheels.dispose();v.instance.dispose();v.anchor.dispose(false,false);
 }
 return {
   get report(){return {sources:source.size,active:visuals.size,created,failed:[...failed]};},
   update(snapshot,camera){
     shown.clear();if(closed)return shown;
     // At most one source-authentic moving instance of EACH of six default
     // classes; remaining 3D proxies always preserve the entire road fleet.
     const ordered=selectDefaultFleetAgents016(snapshot)
       .map(agent=>({agent,distance:Math.hypot(agent.x-camera.x,agent.z-camera.z)}))
       .filter(x=>x.distance<nearRange)
       .sort((a,b)=>a.distance-b.distance||a.agent.id.localeCompare(b.agent.id));
     const keep=new Set<string>(),selectedModels=new Set<string>();
     let initialized=0;
     for(const {agent} of ordered){
       if(keep.size>=maxActive)break;
       const spec=specById.get(agent.modelId);
       if(!spec||selectedModels.has(spec.id))continue;
       if(rejected.has(spec.id))continue;
       selectedModels.add(spec.id);
       if(!visuals.has(agent.id)){
         const container=source.get(spec.id);
         if(!container){request(spec);continue;}
         if(initialized>=1)continue;
         try{
           visuals.set(agent.id,makeInstance(scene,container,spec,agent));
           created++;initialized++;
         }catch(error){
           failed.push("instance:"+agent.id+":"+String(error));
           // If authentic source fails mechanical qualification, refuse to
           // show nonsteering wheels. Keep 3D proxy and retry only after code fix.
           rejected.add(spec.id);
           console.error("[NH-016] Fleet wheel validation, 3D proxy retained",error);
           continue;
         }
       }
       const v=visuals.get(agent.id)!;
       const wb=wheelbase(spec),tw=track(spec);
       const road=sampleTrafficVehicleRoadPose013({
         x:agent.x,z:agent.z,heading:agent.heading,
         wheelbase:wb,track:tw,ground:northHeightsGround,
       });
       v.anchor.position.set(agent.x,road.y,agent.z);
       v.anchor.rotationQuaternion=road.rotation;
       if(v.lastTick!==snapshot.tick){
         const distance=Math.hypot(agent.x-v.lastPose.x,agent.z-v.lastPose.z);
         const delta=Math.atan2(Math.sin(agent.heading-v.lastPose.heading),
           Math.cos(agent.heading-v.lastPose.heading));
         const movement=distance>.005?Math.atan(wb*delta/distance):0;
         const predicted=trafficTurnSteering013(agent,graph,wb);
         const target=(Math.abs(predicted)>.004?predicted:movement)*1.6;
         v.toe=smoothTrafficToe013(v.toe,Math.max(-.85,Math.min(.85,target)),true);
         v.wheels.update(distance,v.toe);
         v.lastPose={x:agent.x,z:agent.z,heading:agent.heading};
         v.lastTick=snapshot.tick;
       }
       keep.add(agent.id);shown.add(agent.id);
     }
     for(const id of visuals.keys())if(!keep.has(id))release(id);
     return shown;
   },
   dispose(){
     if(closed)return;closed=true;
     for(const id of visuals.keys())release(id);
     for(const asset of source.values())asset.dispose();
     source.clear();pending.clear();failed.length=0;shown.clear();rejected.clear();
   },
 };
}
