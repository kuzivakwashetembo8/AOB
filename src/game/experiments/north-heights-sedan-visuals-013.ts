/** NH-013 G1 — an opt-in, limited eight-sedan view of NH-012's REAL moving agents.
 * Lazy imports source-derived LOD GLBs, never loads 125 GLBs. Traffic behavior,
 * ownership and route selection remain in NH-012; this only renders snapshots. */
import {
 AbstractMesh,Color3,Material,MultiMaterial,PBRMaterial,Scene,StandardMaterial,
 TransformNode,loadAssetContainerAsync,
} from "@babylonjs/core";
import type {AssetContainer} from "@babylonjs/core";
import type {NH012TrafficSnapshot,NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
import {
 NH013_SEDAN_MODEL_ID,NH013_SEDAN_SOURCE,
 type NH013SedanPaint,
} from "@/game/traffic/nh013-sedan-pilot";
import {resolveMercerGLBFit,type Bounds006,type MercerExtra006Spec} from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {northHeightsGround} from "./north-heights-reconstruction-001";

type Tier=0|1|2;
type Visual = {anchor:TransformNode;entries:ReturnType<AssetContainer["instantiateModelsToScene"]>;tier:Tier};
export interface NH013SedanVisuals {
 update(snapshot:NH012TrafficSnapshot,camera:{x:number;y:number;z:number}):ReadonlySet<string>;
 readonly report:{created:number;loaded:number;failed:string[]};
 dispose():void;
}
const paintHex:Record<NH013SedanPaint,string>={
 WHITE:"#F2F2EE",BLACK:"#17191C",SILVER:"#B8BCC1",NAVY:"#1E3556",RED:"#B92E31",
};
const URLs:Record<Tier,string>={
 0:NH013_SEDAN_SOURCE,
 1:"/GLBs/Cars/TrafficOptimized/Four-Door-Sedan-LOD1.glb",
 2:"/GLBs/Cars/TrafficOptimized/Four-Door-Sedan-LOD2.glb",
};
const sedanSpec:MercerExtra006Spec={
 id:NH013_SEDAN_MODEL_ID,label:"Four Door Sedan",url:NH013_SEDAN_SOURCE,
 x:0,z:0,width:1.85,height:1.55,length:4.75,yaw:0,
};
const G1_NEAR=28,G1_MEDIUM=76,G1_FAR=180;
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
function tintBody(meshes:readonly AbstractMesh[],paint:NH013SedanPaint):number{
 let painted=0;
 const colour=Color3.FromHexString(paintHex[paint]);
 const visited=new Set<Material>();
 const apply=(material:Material|null):boolean=>{
   if(!material)return false;
   // G0 confirmed exactly a discrete material literally named 'paint',
   // unlike the NH-011 single-material source cars. Never tint wheels/glass.
   const materialName=material.name.split(":").at(-1)??material.name;
   if(!/(^|[^a-z])paint(?:$|[^a-z])/i.test(materialName))return false;
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
function instantiateSedan(scene:Scene,source:AssetContainer,agent:NH012Agent,tier:Tier):Visual{
 const entries=source.instantiateModelsToScene(n=>"nh013:"+agent.id+":"+n,true);
 const anchor=new TransformNode("nh013-sedan-agent:"+agent.id,scene);
 const visual=new TransformNode("nh013-normalize:"+agent.id,scene);
 visual.parent=anchor;
 for(const root of entries.rootNodes)root.parent=visual;
 const meshes=allRenderable(anchor);
 if(!meshes.length)throw Error("NH013 empty imported sedan model");
 const initial=worldBounds(meshes);
 const fit=resolveMercerGLBFit(initial,sedanSpec);
 visual.rotation.y=fit.turn;
 visual.scaling.setAll(fit.scale);
 const fitted=worldBounds(meshes);
 visual.position.set(-(fitted.minX+fitted.maxX)/2,-fitted.minY,-(fitted.minZ+fitted.maxZ)/2);
 const painted=tintBody(meshes,agent.paintId as NH013SedanPaint);
 if(!painted){
   entries.dispose();anchor.dispose(false,false);
   throw Error("NH013 Sedan lacks isolated body paint material");
 }
 for(const mesh of meshes){
   mesh.isPickable=false;mesh.receiveShadows=false;
 }
 return {anchor,entries,tier};
}
export function createNorthHeightsSedanVisuals013(scene:Scene):NH013SedanVisuals{
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
   v.entries.dispose();
   v.anchor.dispose(false,false);
 }
 const shown=new Set<string>();
 return {
   get report(){return {created,loaded:sources.size,failed:[...failed]};},
   update(snapshot,camera){
     shown.clear();
     if(closed)return shown;
     const selected=snapshot.agents.filter(a=>a.modelId===NH013_SEDAN_MODEL_ID)
       .map(a=>({agent:a,distance:Math.hypot(a.x-camera.x,a.z-camera.z)}))
       .filter(x=>x.distance<G1_FAR).sort((a,b)=>a.distance-b.distance);
     const active=new Set<string>();
     // Limit synchronous GLB hierarchy instantiation to ONE sedan per frame.
     // Other moving agents retain dots until their genuine model is ready.
     let createdThisFrame=0;
     for(const {agent,distance} of selected){
       // Failed source-fit/paint validation is a permanent dot fallback for
       // this pilot scene; never retry 300-mesh imports every render frame.
       if(failed.includes("instance:"+agent.id))continue;
       const tier:Tier=distance<G1_NEAR?0:distance<G1_MEDIUM?1:2;
       const previous=visuals.get(agent.id);
       // Keep the currently valid tier temporarily if another model tier has
       // not finished decoding; the traffic dots remain authoritative fallback.
       if(!sources.has(tier))request(tier);
       const actual=sources.has(tier)?tier:previous?.tier;
       if(actual===undefined)continue;
       if(previous&&previous.tier!==actual)release(agent.id);
       if(!visuals.has(agent.id)){
         if(createdThisFrame>=1)continue;
         try{
           const instance=instantiateSedan(scene,sources.get(actual)!,agent,actual);
           createdThisFrame++;
           visuals.set(agent.id,instance);created++;
         }catch(error){
           console.error("[NH-013] Sedan paint/model fit failed",agent.id,error);
           failed.push("instance:"+agent.id);
           continue; // Dot remains visible.
         }
       }
       const instance=visuals.get(agent.id)!;
       instance.anchor.position.set(agent.x,northHeightsGround(agent.x,agent.z)+.075,agent.z);
       instance.anchor.rotation.y=agent.heading;
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
