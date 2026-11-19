/** PED-002 / GTD-WORLD-OPT-012 Stage 2: player-centred character residency.
 * Logical pedestrian simulation remains authoritative and independent of GLBs.
 * Unique appearances stream through bounded loads, pooled rigs, and an LRU. */
import {AbstractMesh,AnimationGroup,AssetContainer,InstantiatedEntries,Scene,SceneLoader,TransformNode,Vector3} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type {NorthHeightsPedestrianSimulator001,PedAgent001,PedState001} from "./north-heights-pedestrian-simulator-001";
import {northHeightsPedestrianSurfaceOffset001} from "./north-heights-pedestrian-surface-001";
import {PED002_NPC_FILES,PED002_NPC_BYTES,PED002_NPC_TOTAL_BYTES,ped002FileForAppearance} from "./north-heights-pedestrian-asset-manifest-002";
// Preserve existing exports for diagnostics and regression tests.
export const PED001_OPTIMIZED_FILES=PED002_NPC_FILES;
export const PED001_OPTIMIZED_SOURCE_BYTES=PED002_NPC_BYTES;
export const PED001_OPTIMIZED_TOTAL_BYTES=PED002_NPC_TOTAL_BYTES;
type Clip="idle"|"walk"|"run";
type PlayerPoint=Readonly<{x:number;z:number}>;
type Slot={
 appearance:number;anchor:TransformNode;model:TransformNode;
 entries:InstantiatedEntries;groups:AnimationGroup[];clip:Clip|null;
 assigned:string|null;phase:number;
};
const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
/** Planar player-distance envelope. Camera/frustum state is deliberately absent.
 * Active rigs use the larger exit radius to prevent boundary load churn. */
export function pedestrianCharacterEligible001(
 a:Pick<PedAgent001,"x"|"z"|"state">,point:PlayerPoint,
 active:boolean,mobile:boolean,
){
 if(a.state==="inside")return false;
 const d2=(a.x-point.x)**2+(a.z-point.z)**2;
 const radius=mobile?(active?170:105):(active?205:135);
 return d2<=radius*radius;
}
/** Waiting/crossing pedestrians are presented before ordinary walkers. */
export function pedestrianCharacterPriority001(state:PedState001):number{
 return state==="cross"||state==="wait"?0:1;
}
export function pedestrianCharacterClip001(state:PedState001):Clip{
 return state==="wait"?"idle":"walk";
}
export interface PedestrianCharacterRenderer001{
 readonly ready:boolean;readonly active:number;readonly pooled:number;
 readonly skeletons:number;readonly loadedAppearances:number;
 readonly failedAppearances:number;readonly pendingAppearances:number;
 readonly evictedAppearances:number;readonly lastUpdateMs:number;
 update:(sim:NorthHeightsPedestrianSimulator001,playerPosition:PlayerPoint|null)=>void;
 dispose:()=>void;
}
export async function loadNorthHeightsPedestrianCharacters001(
 scene:Scene,ground:(x:number,z:number)=>number,mobile:boolean,
 report?:(message:string)=>void,isClosed?:()=>boolean,
):Promise<PedestrianCharacterRenderer001>{
 const containers=new Map<number,AssetContainer>();
 const pool:Slot[]=[];
 const assigned=new Map<string,Slot>();
 const pending=new Set<number>();
 const failed=new Set<number>();
 const lastUsed=new Map<number,number>();
 const maxInactiveAssets=mobile?12:24;
 const maxConcurrentLoads=mobile?1:2;
 const maxActivationsPerFrame=mobile?1:2;
 const maxReleasesPerFrame=mobile?2:4;
 let disposed=false,createdSkeletons=0,frame=0,evicted=0,lastUpdateMs=0;
 let lastValidCentre:PlayerPoint|null=null,lastValidCentreAt=0;
 const cancelled=()=>disposed||!!isClosed?.();
 const release=(slot:Slot)=>{
   if(slot.assigned)assigned.delete(slot.assigned);
   slot.assigned=null;
   slot.groups.forEach(g=>g.stop());
   slot.clip=null;slot.anchor.setEnabled(false);
 };
 const discardAsset=(id:number)=>{
   // Never evict an appearance whose character remains resident.
   if(pool.some(p=>p.appearance===id&&p.assigned!==null))return;
   for(let i=pool.length-1;i>=0;i--){
     const slot=pool[i]!;
     if(slot.appearance!==id)continue;
     createdSkeletons=Math.max(0,createdSkeletons-slot.entries.skeletons.length);
     slot.groups.forEach(g=>g.stop());
     slot.entries.dispose();slot.anchor.dispose(false,false);
     pool.splice(i,1);
   }
   if(containers.has(id))evicted++;
   containers.get(id)?.dispose();containers.delete(id);lastUsed.delete(id);
 };
 const prune=()=>{
   const inactive=[...containers.keys()].filter(id=>!pool.some(p=>p.appearance===id&&p.assigned!==null));
   inactive.sort((a,b)=>(lastUsed.get(a)??0)-(lastUsed.get(b)??0));
   for(let i=0;i<inactive.length-maxInactiveAssets;i++)discardAsset(inactive[i]!);
 };
 const dispose=()=>{
   if(disposed)return;
   disposed=true;
   for(const slot of pool){
     slot.groups.forEach(g=>g.stop());
     slot.entries.dispose();slot.anchor.dispose(false,false);
   }
   pool.length=0;assigned.clear();
   for(const container of containers.values())container.dispose();
   containers.clear();lastUsed.clear();pending.clear();failed.clear();
   lastValidCentre=null;
 };
 const createSlot=(appearance:number):Slot=>{
   const container=containers.get(appearance);
   if(!container)throw Error("PED-001 missing optimized appearance "+appearance);
   const entries=container.instantiateModelsToScene(
     name=>"ped001-"+appearance+"-"+name,false,{doNotInstantiate:true});
   const anchor=new TransformNode("ped001-anchor-"+appearance+"-"+pool.length,scene);
   const model=new TransformNode("ped001-model-"+appearance+"-"+pool.length,scene);
   model.parent=anchor;
   try{
     entries.rootNodes.forEach(root=>{root.parent=model;});
     const meshes:AbstractMesh[]=[];
     for(const root of entries.rootNodes){
       if(root instanceof AbstractMesh&&root.getTotalVertices()>0)meshes.push(root);
       for(const mesh of root.getChildMeshes(false))
         if(mesh.getTotalVertices()>0)meshes.push(mesh);
     }
     if(!meshes.length)throw Error("PED-001 optimized GLB has no geometry: "+appearance);
     const min=new Vector3(Infinity,Infinity,Infinity);
     const max=new Vector3(-Infinity,-Infinity,-Infinity);
     for(const mesh of meshes){
       mesh.isPickable=false;mesh.checkCollisions=false;mesh.receiveShadows=false;
       mesh.computeWorldMatrix(true);
       const box=mesh.getBoundingInfo().boundingBox;
       min.minimizeInPlace(box.minimumWorld);max.maximizeInPlace(box.maximumWorld);
     }
     const height=max.y-min.y;
     if(!Number.isFinite(height)||height<.1)
       throw Error("PED-001 optimized GLB invalid height: "+appearance);
     const scale=height<1.25||height>2.25?1.75/height:1;
     model.scaling.setAll(scale);
     model.position.set(-(min.x+max.x)*.5*scale,-min.y*scale+.03,
       -(min.z+max.z)*.5*scale);
     const groups=entries.animationGroups;
     if(!groups.some(g=>/idle/i.test(g.name))||
        !groups.some(g=>/walk/i.test(g.name))||
        entries.skeletons.length<1)
       throw Error("PED-001 optimized GLB missing Idle/Walk or skeleton: "+appearance);
     const slot:Slot={appearance,anchor,model,entries,groups,clip:null,
       assigned:null,phase:((pool.length*47)%97)/97};
     anchor.setEnabled(false);
     pool.push(slot);
     createdSkeletons+=entries.skeletons.length;
     return slot;
   }catch(error){
     entries.dispose();anchor.dispose(false,false);
     throw error;
   }
 };
 const play=(slot:Slot,clip:Clip)=>{
   if(slot.clip===clip)return;
   slot.groups.forEach(g=>g.stop());
   const group=slot.groups.find(g=>new RegExp(clip,"i").test(g.name))??
     slot.groups.find(g=>/walk/i.test(g.name));
   if(group){
     group.start(true,1,group.from,group.to,false);
     group.goToFrame(group.from+(group.to-group.from)*slot.phase);
   }
   slot.clip=clip;
 };
 const requestAsset=(appearance:number)=>{
   if(cancelled()||containers.has(appearance)||pending.has(appearance)||failed.has(appearance)||
      pending.size>=maxConcurrentLoads)return;
   const file=ped002FileForAppearance(appearance);
   if(!file){failed.add(appearance);return;}
   pending.add(appearance);
   // Never block the render loop; logical routes are unaffected by load failure.
   void SceneLoader.LoadAssetContainerAsync("/GLBs/Characters/",file,scene)
     .then(container=>{
       pending.delete(appearance);
       if(cancelled()){container.dispose();return;}
       containers.set(appearance,container);
       lastUsed.set(appearance,frame);
       prune();
     })
     .catch(error=>{
       pending.delete(appearance);
       if(cancelled())return;
       failed.add(appearance);
       report?.("NPC "+String(appearance).padStart(3,"0")+" unavailable; model remains absent");
       console.warn("[PED-002] NPC appearance failed to load",appearance,error);
     });
 };
 const groundSupport=(sim:NorthHeightsPedestrianSimulator001,a:PedAgent001)=>{
   const start=sim.graph.nodes.get(a.route[0]??"");
   const end=sim.graph.nodes.get(a.route[a.route.length-1]??"");
   const door=start?.kind==="entrance"&&Math.hypot(a.x-start.x,a.z-start.z)<=1
     ?start:end?.kind==="entrance"&&Math.hypot(a.x-end.x,a.z-end.z)<=1?end:null;
   return ground(a.x,a.z)+northHeightsPedestrianSurfaceOffset001(a.x,a.z,door);
 };
 report?.("100 unique NPC appearances available for player-centred proximity streaming");
 return{
   get ready(){return !disposed;},
   get active(){return assigned.size;},
   get pooled(){return pool.length;},
   get skeletons(){return createdSkeletons;},
   get loadedAppearances(){return containers.size;},
   get failedAppearances(){return failed.size;},
   get pendingAppearances(){return pending.size;},
   get evictedAppearances(){return evicted;},
   get lastUpdateMs(){return lastUpdateMs;},
   update(sim,playerPosition){
     if(cancelled())return;
     const started=performance.now();
     frame++;
     const now=started;
     if(playerPosition&&Number.isFinite(playerPosition.x)&&Number.isFinite(playerPosition.z)){
       lastValidCentre={x:playerPosition.x,z:playerPosition.z};
       lastValidCentreAt=now;
     }
     // Keep the last actor position briefly through boarding/mode transitions.
     // Never substitute camera position; after the grace window freeze residency.
     const point=lastValidCentre&&now-lastValidCentreAt<=2000?lastValidCentre:null;
     if(!point){lastUpdateMs=performance.now()-started;return;}
     const supportY=(a:PedAgent001)=>groundSupport(sim,a);
     const byId=new Map(sim.agents.map(a=>[a.id,a]));
     let releasedThisFrame=0;
     for(const [id,slot] of [...assigned]){
       const agent=byId.get(id);
       if((!agent||!pedestrianCharacterEligible001(agent,point,true,mobile))&&
          releasedThisFrame<maxReleasesPerFrame){
         release(slot);releasedThisFrame++;
       }
     }
     const candidates=sim.agents.filter(a=>
       !assigned.has(a.id)&&pedestrianCharacterEligible001(a,point,false,mobile));
     candidates.sort((a,b)=>{
       const priority=pedestrianCharacterPriority001(a.state)-pedestrianCharacterPriority001(b.state);
       if(priority)return priority;
       return ((a.x-point.x)**2+(a.z-point.z)**2)-
         ((b.x-point.x)**2+(b.z-point.z)**2);
     });
     let activatedThisFrame=0,createdThisFrame=0;
     for(const a of candidates){
       if(!containers.has(a.appearanceId)){
         requestAsset(a.appearanceId);continue;
       }
       if(activatedThisFrame>=maxActivationsPerFrame)continue;
       let slot=pool.find(p=>p.assigned===null&&p.appearance===a.appearanceId);
       if(!slot){
         if(createdThisFrame>=maxActivationsPerFrame)continue;
         try{slot=createSlot(a.appearanceId);createdThisFrame++;}
         catch(error){
           failed.add(a.appearanceId);
           console.warn("[PED-002] GLB lacks valid rig/geometry; NPC remains absent",a.appearanceId,error);
           discardAsset(a.appearanceId);continue;
         }
       }
       lastUsed.set(a.appearanceId,frame);
       slot.assigned=a.id;assigned.set(a.id,slot);
       slot.anchor.position.set(a.x,supportY(a),a.z);
       slot.anchor.rotation.y=a.heading;
       slot.anchor.setEnabled(true);
       play(slot,pedestrianCharacterClip001(a.state));
       activatedThisFrame++;
     }
     for(const [id,slot] of assigned){
       const a=byId.get(id);
       if(!a)continue;
       lastUsed.set(slot.appearance,frame);
       slot.anchor.position.set(a.x,supportY(a),a.z);
       slot.anchor.rotation.y+=angleDelta(slot.anchor.rotation.y,a.heading)*.25;
       play(slot,pedestrianCharacterClip001(a.state));
     }
     if(frame%90===0)prune();
     lastUpdateMs=performance.now()-started;
   },
   dispose,
 };
}
