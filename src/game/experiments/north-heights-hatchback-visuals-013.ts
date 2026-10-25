/** NH-013 G2 — a source-authentic hatchback view of NH-012's REAL moving agents.
 * Lazy imports source-derived LOD GLBs, never loads 125 GLBs. Traffic behavior,
 * ownership and route selection remain in NH-012; this only renders snapshots. */
import {
 AbstractMesh,Color3,Material,MultiMaterial,PBRMaterial,Scene,StandardMaterial,
 TransformNode,loadAssetContainerAsync,
} from "@babylonjs/core";
import type {AssetContainer} from "@babylonjs/core";
import type {NH012TrafficSnapshot,NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
import {
 NH013_HATCHBACK_ID,NH013_HATCHBACK_SOURCE,
 type NH013HatchbackPaint,
} from "@/game/traffic/nh013-hatchback-pilot";
import {resolveMercerGLBFit,type Bounds006,type MercerExtra006Spec} from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {northHeightsGround} from "./north-heights-reconstruction-001";
import {blackenHatchbackTyreMaterial013} from "@/game/vehicles/nh013-hatchback-tyre-material";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013,smoothTrafficToe013} from "@/game/vehicles/nh013-traffic-turn-steering";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {type NH013WheelPose} from "@/game/vehicles/nh013-sedan-wheel-rig";
import {
 NH013_HATCH_TRACK,NH013_HATCH_WHEELBASE,
 prepareHatchbackWheelRig013,hatchbackSteerFromPose013,type HatchRig013,
} from "@/game/vehicles/nh013-hatchback-wheel-rig";

type Tier=0|1|2;
type Visual = {
 anchor:TransformNode;entries:ReturnType<AssetContainer["instantiateModelsToScene"]>;
 tier:Tier;wheelRig:HatchRig013;lastPose:NH013WheelPose;lastTick:number;smoothedSteer:number;
};
export interface NH013HatchbackVisuals {
 update(snapshot:NH012TrafficSnapshot,camera:{x:number;y:number;z:number}):ReadonlySet<string>;
 readonly report:{created:number;loaded:number;active:number;failed:string[]};
 dispose():void;
}
const paintHex:Record<NH013HatchbackPaint,string>={
 WHITE:"#F2F2EE",SILVER:"#B8BCC1",GRAPHITE:"#41464B",NAVY:"#1E3556",METALLIC_BLUE:"#2867A0",
};
const URLs:Record<Tier,string>={
 0:"/GLBs/Cars/TrafficOptimized/Fourd-Confusion-Hatchback-Rigged.glb",
 1:"/GLBs/Cars/TrafficOptimized/Fourd-Confusion-Hatchback-LOD1.glb",
 2:"/GLBs/Cars/TrafficOptimized/Fourd-Confusion-Hatchback-LOD2.glb",
};
const hatchbackSpec:MercerExtra006Spec={
 id:NH013_HATCHBACK_ID,label:"Fourd Confusion Hatchback",url:NH013_HATCHBACK_SOURCE,
 x:0,z:0,width:1.78,height:1.60,length:4.35,yaw:0,
};
// Wider representation radius ensures flyers can discover moving cars from
// rooftops. Far cars use real source-derived LOD2, not original 304-part GLBs.
const G1_NEAR=24,G1_MEDIUM=70,G1_FAR=425;
function allRenderable(root:TransformNode):AbstractMesh[]{
 return root.getChildMeshes(false).filter(mesh=>mesh.getTotalVertices()>0);
}
function worldBounds(meshes:readonly AbstractMesh[]):Bounds006{
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(const mesh of meshes){
   mesh.computeWorldMatrix(true);
   const b=mesh.getBoundingInfo().boundingBox;
   minX=Math.min(minX,b.minimumWorld.x);maxX=Math.max(maxX,b.maximumWorld.x);
   minY=Math.min(minY,b.minimumWorld.y);maxY=Math.max(maxY,b.maximumWorld.y);
   minZ=Math.min(minZ,b.minimumWorld.z);maxZ=Math.max(maxZ,b.maximumWorld.z);
 }
 if(!Number.isFinite(minX))throw Error("NH013 Sedan source contains no visible geometry");
 return {minX,maxX,minY,maxY,minZ,maxZ};
}
function tintBody(meshes:readonly AbstractMesh[],paint:NH013HatchbackPaint):number{
 let painted=0;
 const colour=Color3.FromHexString(paintHex[paint]);
 const visited=new Set<Material>();
 const apply=(material:Material|null):boolean=>{
   if(!material)return false;
   // G0 confirmed exactly a discrete material literally named 'paint',
   // unlike the NH-011 single-material source cars. Never tint wheels/glass.
   const materialName=material.name.split(":").at(-1)??material.name;
   if(!/(^|[^a-z])M_Body_ColorMain(?:$|[^a-z])/i.test(materialName))return false;
   if(visited.has(material))return true;
   visited.add(material);
   if(material instanceof PBRMaterial){
     // The body-coat material has a separate base-colour image. Isolate the
     // approved paint colour while retaining authored normal, roughness,
     // metallic, UV and transparency properties. Visual signoff still needed.
     material.albedoTexture=null;
     material.albedoColor=colour;
     if(!material.metallicTexture){material.metallic=Math.max(material.metallic??.45,.45);}
     return true;
   }
   if(material instanceof StandardMaterial){
     material.diffuseTexture=null;
     material.diffuseColor=colour;
     return true;
   }
   return false;
 };
 for(const mesh of meshes){
   const m=mesh.material;
   if(!m)continue;
   if(m instanceof MultiMaterial){
     for(const slot of m.subMaterials)if(apply(slot))painted++;
   }else if(apply(m))painted++;
 }
 return painted;
}
function instantiateHatchback(scene:Scene,source:AssetContainer,agent:NH012Agent,tier:Tier):Visual{
 const entries=source.instantiateModelsToScene(n=>"nh013:"+agent.id+":"+n,true);
 const anchor=new TransformNode("nh013-hatchback-agent:"+agent.id,scene);
 const visual=new TransformNode("nh013-hatch-normalize:"+agent.id,scene);
 visual.parent=anchor;
 for(const root of entries.rootNodes)root.parent=visual;
 const meshes=allRenderable(anchor);
 if(!meshes.length)throw Error("NH013 empty imported hatchback model");
 const initial=worldBounds(meshes);
 const fit=resolveMercerGLBFit(initial,hatchbackSpec);
 // VEH-008: visual-only yaw correction; NH-012 actual traffic heading stays unchanged.
 visual.rotation.y=fit.turn;
 visual.scaling.setAll(fit.scale);
 const fitted=worldBounds(meshes);
 visual.position.set(-(fitted.minX+fitted.maxX)/2,-fitted.minY,-(fitted.minZ+fitted.maxZ)/2);
 const painted=tintBody(meshes,agent.paintId as NH013HatchbackPaint);
 // Keep imported source tyre tread textures but ensure genuine tyre rubber
 // is black independently of the five accepted body paint variants.
 const tyreMaterials=new Set<Material>();
 for(const mesh of meshes){
   const m=mesh.material;
   if(m instanceof MultiMaterial){
     for(const part of m.subMaterials)if(part&&blackenHatchbackTyreMaterial013(part))tyreMaterials.add(part);
   }else if(m&&blackenHatchbackTyreMaterial013(m))tyreMaterials.add(m);
 }
 if(tyreMaterials.size===0){
   entries.dispose();anchor.dispose(false,false);
   throw Error("NH013 hatchback tyre blackening: missing isolated M_Wheel_Tire material");
 }
 if(!painted){
   entries.dispose();anchor.dispose(false,false);
   throw Error("NH013 hatchback lacks isolated main body paint material");
 }
 for(const mesh of meshes){
   mesh.isPickable=false;mesh.receiveShadows=false;
 }
 // Real wheels: source rims, tyres and tread each stay attached to their own
 // measured hub. WHEEL-001 fail closed, never animate a fabricated cylinder.
 let wheelRig:HatchRig013;
 try{wheelRig=prepareHatchbackWheelRig013(anchor);}
 catch(error){entries.dispose();anchor.dispose(false,false);throw error;}
 return {anchor,entries,tier,wheelRig,
   lastPose:{x:agent.x,z:agent.z,heading:agent.heading},lastTick:-1,smoothedSteer:0};
}
export function createNorthHeightsHatchbackVisuals013(scene:Scene,graph:TrafficGraph012):NH013HatchbackVisuals{
 let closed=false,created=0;
 const sources=new Map<Tier,AssetContainer>();
 const pending=new Map<Tier,Promise<void>>();
 const failed:string[]=[];
 const visuals=new Map<string,Visual>();
 function request(tier:Tier){
   if(closed||sources.has(tier)||pending.has(tier)||failed.includes(URLs[tier]))return;
   const loading=loadAssetContainerAsync(URLs[tier],scene)
     .then(container=>{
       if(closed)container.dispose();
       else sources.set(tier,container);
     }).catch(error=>{
       failed.push(URLs[tier]);
       console.error("[NH-013] Source-derived sedan LOD import failed",URLs[tier],error);
     }).finally(()=>pending.delete(tier));
   pending.set(tier,loading);
 }
 function release(id:string){
   const v=visuals.get(id);
   if(!v)return;
   visuals.delete(id);
   v.wheelRig.dispose();
   v.entries.dispose();
   v.anchor.dispose(false,false);
 }
 // Load the original once, regardless of distance to pilot agents.
 // The first NH-013 build requested assets only *after* approaching 180m;
 // if a user missed eight roaming agents, every visible car remained a dot.
 // Preloading removes that timing trap while keeping car rendering view-bound.
 request(0);
 const shown=new Set<string>();
 return {
   get report(){return {created,loaded:sources.size,active:visuals.size,failed:[...failed]};},
   update(snapshot,camera){
     shown.clear();
     if(closed)return shown;
     const selected=snapshot.agents.filter(a=>a.modelId===NH013_HATCHBACK_ID)
       .map(a=>({agent:a,distance:Math.hypot(a.x-camera.x,a.z-camera.z)}))
       .filter(x=>x.distance<G1_FAR).sort((a,b)=>a.distance-b.distance);
     const active=new Set<string>();
     // Limit synchronous GLB hierarchy instantiation to ONE sedan per frame.
     // Other moving agents retain dots until their genuine model is ready.
     let createdThisFrame=0;
     for(const {agent,distance} of selected){
       // Failed source-fit/paint validation is a permanent dot fallback for
       // this pilot scene; never retry 300-mesh imports every render frame.
       if(failed.some(x=>x.startsWith("instance:"+agent.id+":")))continue;
       const tier:Tier=distance<G1_NEAR?0:distance<G1_MEDIUM?1:2;
       const previous=visuals.get(agent.id);
       // Keep the currently valid tier temporarily if another model tier has
       // not finished decoding; the traffic dots remain authoritative fallback.
       if(!sources.has(tier))request(tier);
       // Until the requested LOD finishes, use any safely loaded real sedan.
       // Never keep a diagnostic dot merely because one derived tier is late.
       const actual=sources.has(tier)?tier:
         previous?.tier??([0,1,2] as const).find(level=>sources.has(level));
       if(actual===undefined)continue;
       if(previous&&previous.tier!==actual)release(agent.id);
       if(!visuals.has(agent.id)){
         if(createdThisFrame>=1)continue;
         try{
           const instance=instantiateHatchback(scene,sources.get(actual)!,agent,actual);
           createdThisFrame++;
           visuals.set(agent.id,instance);created++;
         }catch(error){
           console.error("[NH-013] Sedan paint/model fit failed",agent.id,error);
           failed.push("instance:"+agent.id+":"+(error instanceof Error?error.message:String(error)));
           continue; // Dot remains visible.
         }
       }
       const instance=visuals.get(agent.id)!;
       // Surface contact at four wheel footprints. North Heights gains
       // considerable elevation on the northern ridge: centre-only placement
       // previously buried the uphill axle.
       const road=sampleTrafficVehicleRoadPose013({
         x:agent.x,z:agent.z,heading:agent.heading,
         wheelbase:NH013_HATCH_WHEELBASE,track:NH013_HATCH_TRACK,ground:northHeightsGround,
       });
       instance.anchor.position.set(agent.x,road.y,agent.z);
       instance.anchor.rotationQuaternion=road.rotation;
       // Steer from the actual NH-012 junction connector and retain the
       // commanded angle between its 20Hz steps; never decay to 0 every frame.
       if(instance.lastTick!==snapshot.tick){
         const pose:NH013WheelPose={x:agent.x,z:agent.z,heading:agent.heading};
         const movement=hatchbackSteerFromPose013(instance.lastPose,pose);
         const target=trafficTurnSteering013(agent,graph,NH013_HATCH_WHEELBASE);
         instance.smoothedSteer=smoothTrafficToe013(instance.smoothedSteer,
           target||movement.angle,true);
         instance.wheelRig.update(movement.distance,instance.smoothedSteer);
         instance.lastPose=pose;
         instance.lastTick=snapshot.tick;
       }
       active.add(agent.id);shown.add(agent.id);
     }
     for(const id of visuals.keys())if(!active.has(id))release(id);
     return shown;
   },
   dispose(){
     if(closed)return;closed=true;
     for(const id of visuals.keys())release(id);
     for(const source of sources.values())source.dispose();
     sources.clear();pending.clear();failed.length=0;shown.clear();
   },
 };
}
