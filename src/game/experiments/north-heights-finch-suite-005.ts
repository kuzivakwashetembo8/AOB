/** POI-006: an empty 53rd-floor meeting room with Finch as its only inhabitant
 * on the real floor-53 collision slab. No lower-floor room assets are generated. */
import {AnimationGroup,Mesh,Scene,SceneLoader,TransformNode,Vector3} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {finchProximity005} from "./north-heights-finch-intro-005";
import {finchShaft004} from "./north-heights-finch-elevator-structure-004";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {MeridianPhysics} from "@/game/physics/rapier-world";

export interface FinchSuite005{
 loadFinch:()=>Promise<void>;
 isNearFinch:(player:{x:number;y:number;z:number}|null)=>boolean;
 getFinchLocation:()=>{x:number;y:number;z:number};
 dispose:()=>void;
}
export function createFinchSuite005(scene:Scene,lots:readonly BuildingSpec[],
 ground:(x:number,z:number)=>number,physics:MeridianPhysics):FinchSuite005{
 const lot=lots.find(l=>l.id==="NH-04-06-L2");
 if(!lot)throw Error("POI-005 missing Finch HQ building");
 const shaft=finchShaft004(lot);
 if(!shaft)throw Error("POI-005 missing shaft reference");
 const x=lot.position.x,z=lot.position.z;
 const y=ground(x,z)+shaft.topFloorOffset;
 // Owner's Nov 2 direction: leave floor 53 architecturally empty.
 // The generated white slab and Rapier ring come from the building generator;
 // this suite module must NOT create any additional surface, furniture,
 // accent material, collider, or decorative prop.
 // Keep Finch in his already-established meeting area, away from the shaft.
 const finchPosition={x:x+2.9,y:y+.93,z:z+8.98};
 let finchRoot:TransformNode|null=null,groups:AnimationGroup[]=[];
 let finchMeshes:Mesh[]=[],loaded=false,requested=false,disposed=false;
 const loadFinch=async()=>{
  if(disposed||requested)return;
  requested=true;
  try{
   const result=await SceneLoader.ImportMeshAsync("","/GLBs/Characters/","Finch.glb",scene);
   if(disposed){result.meshes.forEach(m=>m.dispose());result.animationGroups.forEach(g=>g.dispose());return;}
   const anchor=new TransformNode("poi005:Harold-Finch-53",scene);
   finchRoot=anchor;
   result.meshes.filter(m=>!m.parent).forEach(m=>m.parent=anchor);
   const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
   finchMeshes=result.meshes.filter((m):m is Mesh=>m instanceof Mesh);
   for(const mesh of finchMeshes){
    if(mesh.getTotalVertices()===0)continue;
    mesh.computeWorldMatrix(true);
    const bounds=mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(bounds.minimumWorld);max.maximizeInPlace(bounds.maximumWorld);
    mesh.isPickable=false;mesh.checkCollisions=false;
   }
   const h=max.y-min.y;
   if(!Number.isFinite(h)||h<.2)throw Error("Invalid Finch.glb bounds");
   const scale=h<1.45||h>2.18?1.78/h:1;
   anchor.scaling.setAll(scale);
   anchor.position.set(finchPosition.x-(min.x+max.x)*.5*scale,
     y-min.y*scale,finchPosition.z-(min.z+max.z)*.5*scale);
   anchor.rotation.y=Math.PI; // faces the approaching lift and office visitor
   groups=result.animationGroups;
   const idle=groups.find(g=>/^(idle|stand)/i.test(g.name))??groups.find(g=>/idle/i.test(g.name));
   for(const group of groups)if(group!==idle)group.stop();
   idle?.start(true);
   loaded=true;
  }catch(err){if(!disposed)console.error("[POI-005] Finch asset failed",err);}
 };
 return {
  loadFinch,
  isNearFinch:p=>finchProximity005(p,finchPosition,loaded),
  getFinchLocation:()=>({...finchPosition}),
  dispose(){
   disposed=true;loaded=false;groups.forEach(g=>g.dispose());
   finchRoot?.dispose(false,true);
   finchMeshes.forEach(m=>m.dispose());

  },
 };
}
