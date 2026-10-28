/** PED-001 character representation: 100 stable pedestrian identities reuse ten
 * owner-optimized Ara GLBs. Rendering never owns or modifies logical routes.
 * Crosswalk vehicle yielding and schedule policy remain separate future stages. */
import {AbstractMesh,AnimationGroup,AssetContainer,Camera,InstantiatedEntries,Scene,SceneLoader,TransformNode,Vector3} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type {NorthHeightsPedestrianSimulator001,PedAgent001,PedState001} from "./north-heights-pedestrian-simulator-001";
import {northHeightsPedestrianSurfaceOffset001} from "./north-heights-pedestrian-surface-001";
export const PED001_OPTIMIZED_FILES=[
 "GTD_NPC_001_S42027.glb","GTD_NPC_002_S49946.glb","GTD_NPC_003_S57865.glb",
 "GTD_NPC_004_S65784.glb","GTD_NPC_005_S73703.glb","GTD_NPC_006_S81622.glb",
 "GTD_NPC_007_S89541.glb","GTD_NPC_008_S97460.glb","GTD_NPC_009_S105379.glb",
 "GTD_NPC_010_S113298.glb",
] as const;
export const PED001_OPTIMIZED_SOURCE_BYTES=[
 799876,628712,498212,994700,574520,574144,606272,911992,806744,890448,
] as const;
export const PED001_OPTIMIZED_TOTAL_BYTES=PED001_OPTIMIZED_SOURCE_BYTES.reduce((n,b)=>n+b,0);
type Clip="idle"|"walk"|"run";
type Slot={
 appearance:number;anchor:TransformNode;model:TransformNode;
 entries:InstantiatedEntries;groups:AnimationGroup[];clip:Clip|null;
 assigned:string|null;phase:number;
};
const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
/** Projection-free conservative activation envelope; no view-dependent deletion.
 * Hysteresis ensures turning the camera cannot repeatedly instantiate rigs. */
export function pedestrianCharacterEligible001(
 a:Pick<PedAgent001,"x"|"z"|"state">,point:{x:number;z:number},
 active:boolean,mobile:boolean,
){
 if(a.state==="inside")return false;
 const d2=(a.x-point.x)**2+(a.z-point.z)**2;
 const radius=mobile?(active?170:105):(active?205:135);
 return d2<radius*radius;
}
export function pedestrianCharacterClip001(state:PedState001):Clip{
 return state==="wait"?"idle":"walk";
}
export interface PedestrianCharacterRenderer001{
 readonly ready:boolean;readonly active:number;readonly pooled:number;
 readonly skeletons:number;readonly loadedAppearances:number;
 update:(sim:NorthHeightsPedestrianSimulator001,camera:Camera)=>void;
 dispose:()=>void;
}
export async function loadNorthHeightsPedestrianCharacters001(
 scene:Scene,ground:(x:number,z:number)=>number,mobile:boolean,
 report?:(message:string)=>void,isClosed?:()=>boolean,
):Promise<PedestrianCharacterRenderer001>{
 const containers:AssetContainer[]=[];
 const pool:Slot[]=[];
 const assigned=new Map<string,Slot>();
 let disposed=false,loadedAppearances=0,createdSkeletons=0;
 let pendingCreate=0;
 const cancelled=()=>disposed||!!isClosed?.();
 const release=(slot:Slot)=>{
   if(slot.assigned)assigned.delete(slot.assigned);
   slot.assigned=null;
   slot.groups.forEach(g=>g.stop());
   slot.clip=null;
   slot.anchor.setEnabled(false);
 };
 const dispose=()=>{
   if(disposed)return;
   disposed=true;
   for(const slot of pool){
     slot.groups.forEach(g=>g.stop());
     slot.entries.dispose();
     slot.anchor.dispose(false,false);
   }
   pool.length=0;assigned.clear();
   for(const container of containers)container.dispose();
   containers.length=0;
 };
 const createSlot=(appearance:number):Slot=>{
   const container=containers[appearance-1];
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
 try{
   // Loading is intentionally invoked only AFTER the first playable frame.
   // All ten optimized files are fetched once; no unoptimized file is touched.
   for(let i=0;i<PED001_OPTIMIZED_FILES.length;i++){
     if(cancelled())throw Error("PED-001 character loading cancelled");
     await new Promise<void>(resolve=>setTimeout(resolve,60));
     if(cancelled())throw Error("PED-001 character loading cancelled");
     const file=PED001_OPTIMIZED_FILES[i]!;
     report?.("Loading optimized pedestrian appearance "+(i+1)+"/10");
     const container=await SceneLoader.LoadAssetContainerAsync("/GLBs/Characters/",file,scene);
     if(cancelled()){container.dispose();throw Error("PED-001 character loading cancelled");}
     containers.push(container);loadedAppearances++;
   }
   // Validate all rigs before activating the character renderer.
   for(let i=0;i<10;i++)createSlot(i+1);
   report?.("Ten optimized pedestrian appearances ready · 100 logical identities");
   return{
     get ready(){return !disposed&&loadedAppearances===10;},
     get active(){return assigned.size;},
     get pooled(){return pool.length;},
     get skeletons(){return createdSkeletons;},
     get loadedAppearances(){return loadedAppearances;},
     update(sim,camera){
       if(cancelled())return;
       const point=camera.position;
       const byId=new Map(sim.agents.map(a=>[a.id,a]));
       const supportY=(a:PedAgent001)=>{
         // Door nodes only matter during the first/last metre of a journey.
         // Else the exact road-grid footprint distinguishes sidewalk, zebra,
         // and park ground. All coordinates/route states remain unchanged.
         const start=sim.graph.nodes.get(a.route[0]??"");
         const end=sim.graph.nodes.get(a.route[a.route.length-1]??"");
         const door=start?.kind==="entrance"&&Math.hypot(a.x-start.x,a.z-start.z)<=1
           ?start:end?.kind==="entrance"&&Math.hypot(a.x-end.x,a.z-end.z)<=1?end:null;
         return ground(a.x,a.z)+northHeightsPedestrianSurfaceOffset001(a.x,a.z,door);
       };
       // Never release a visible character because another agent is closer.
       // Release only on doorway entry or beyond the large hysteresis envelope.
       for(const [id,slot] of [...assigned]){
         const agent=byId.get(id);
         if(!agent||!pedestrianCharacterEligible001(agent,point,true,mobile))
           release(slot);
       }
       const candidates=sim.agents.filter(a=>
         !assigned.has(a.id)&&pedestrianCharacterEligible001(a,point,false,mobile));
       candidates.sort((a,b)=>
         ((a.x-point.x)**2+(a.z-point.z)**2)-
         ((b.x-point.x)**2+(b.z-point.z)**2));
       // Reuse inactive rigs. Create at most one new rig per update frame;
       // this spreads costly skeleton creation over time.
       let createdThisFrame=0;
       for(const a of candidates){
         let slot=pool.find(p=>p.assigned===null&&p.appearance===a.appearanceId);
         if(!slot){
           if(createdThisFrame>=1)continue;
           slot=createSlot(a.appearanceId);
           createdThisFrame++;
         }
         slot.assigned=a.id;assigned.set(a.id,slot);
         slot.anchor.position.set(a.x,supportY(a),a.z);
         slot.anchor.rotation.y=a.heading;
         slot.anchor.setEnabled(true);
         play(slot,pedestrianCharacterClip001(a.state));
       }
       for(const [id,slot] of assigned){
         const a=byId.get(id);
         if(!a)continue;
         slot.anchor.position.set(a.x,supportY(a),a.z);
         slot.anchor.rotation.y+=angleDelta(slot.anchor.rotation.y,a.heading)*.25;
         play(slot,pedestrianCharacterClip001(a.state));
       }
     },
     dispose,
   };
 }catch(error){dispose();throw error;}
}
