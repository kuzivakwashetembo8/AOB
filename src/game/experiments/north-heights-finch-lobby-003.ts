/** POI-003: standalone ground-floor Finch lobby props. No middle/top-floor activation. */
import {Color3,Mesh,MeshBuilder,Scene,SceneLoader,StandardMaterial,TransformNode,Vector3}
 from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {PED002_NPC_FILES} from "./north-heights-pedestrian-asset-manifest-002";
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001} from "./north-heights-finch-hq-001";
import type {BuildingSpec} from "@/game/world-generation/schema";

export interface FinchLobby003{
 update:(person:{x:number;z:number}|null,dt:number)=>void;
 loadReceptionist:()=>Promise<void>;
 dispose:()=>void;
 getDoorOpen:()=>number;
}

export function createFinchLobby003(scene:Scene,lots:readonly BuildingSpec[],ground:(x:number,z:number)=>number):FinchLobby003{
 const hq=NORTH_HEIGHTS_FINCH_HEADQUARTERS_001;
 const building=lots.find(l=>l.id===hq.buildingId);
 if(!building)throw Error("POI-003 Finch HQ tower absent from generated city");
 const width=building.overrides?.width??22.669;
 const depth=building.overrides?.depth??33.889;
 const cx=building.position.x,cz=building.position.z,y=ground(cx,cz)+.28;
 const root=new TransformNode("poi003:finch-lobby",scene);
 const mats:StandardMaterial[]=[];
 const mat=(name:string,r:number,g:number,b:number,emissive=false)=>{
  const m=new StandardMaterial("poi003:"+name,scene);
  m.diffuseColor=new Color3(r,g,b);m.specularColor=new Color3(.25,.25,.25);
  if(emissive)m.emissiveColor=m.diffuseColor.scale(.5);
  mats.push(m);return m;
 };
 const white=mat("white-desk",.96,.96,.93),wood=mat("elevator-wood",.31,.13,.085);
 const steel=mat("elevator-steel",.68,.72,.75),dark=mat("floor",.19,.20,.23);
 const lit=mat("indicator",.95,.72,.32,true);
 const box=(name:string,x:number,yy:number,z:number,w:number,h:number,d:number,material:StandardMaterial):Mesh=>{
  const mesh=MeshBuilder.CreateBox("poi003:"+name,{width:w,height:h,depth:d},scene);
  mesh.position.set(x,yy,z);mesh.material=material;mesh.parent=root;
  mesh.isPickable=false;mesh.checkCollisions=false;return mesh;
 };
 // Freestanding white reception desk in the lobby, offset from main pedestrian approach.
 const deskX=cx+3,deskZ=cz+3.6;
 box("desk-front",deskX,y+.58,deskZ,3.6,1.12,.62,white);
 box("desk-counter",deskX,y+1.18,deskZ,4.1,.15,1.12,white);
 box("desk-end-left",deskX-1.7,y+.55,deskZ-.36,.18,1.1,.7,white);
 box("desk-end-right",deskX+1.7,y+.55,deskZ-.36,.18,1.1,.7,white);
 // An edge-mounted cabin facing the building entrance (+Z), inspired by the
 // supplied wood-panel/silver-split-door elevator reference.
 const elevatorX=cx-width/2+3.35,elevatorZ=cz-depth/2+5.35;
 const frontZ=elevatorZ+2.0,innerH=3.08;
 box("cab-floor",elevatorX,y+.055,elevatorZ,4.5,.11,4.4,dark);
 box("cab-ceiling",elevatorX,y+innerH,elevatorZ,4.5,.16,4.4,dark);
 box("cab-back",elevatorX,y+innerH/2,elevatorZ-2.15,4.5,innerH,.18,wood);
 for(const dir of [-1,1]){
  box("cab-side-"+dir,elevatorX+dir*2.2,y+innerH/2,elevatorZ,.18,innerH,4.4,wood);
  box("door-jamb-"+dir,elevatorX+dir*1.88,y+innerH/2,frontZ,.28,innerH,.19,steel);
  box("front-wood-"+dir,elevatorX+dir*2.14,y+innerH/2,frontZ,.4,innerH,.22,wood);
 }
 box("header",elevatorX,y+innerH-.1,frontZ,3.8,.28,.24,steel);
 box("overdoor-indicator",elevatorX,y+innerH+.16,frontZ+.16,.5,.16,.09,lit);
 box("call-panel",elevatorX+2.3,y+1.25,frontZ+.17,.2,.72,.14,steel);
 box("call-indicator",elevatorX+2.3,y+1.45,frontZ+.26,.07,.08,.04,lit);
 const left=box("sliding-door-left",elevatorX-.83,y+1.55,frontZ,1.64,2.82,.11,steel);
 const right=box("sliding-door-right",elevatorX+.83,y+1.55,frontZ,1.64,2.82,.11,steel);
 // Individual reception identity; independent from the 100 roaming NPC IDs.
 let receptionistRoot:TransformNode|null=null;
 let receptionistMeshes:Mesh[]=[];
 let receptionistGroups:{stop:()=>void}[]=[];
 let dead=false,requested=false,progress=0,wasInside=false;
 const position={x:deskX,z:deskZ-1.48};
 const update=(player:{x:number;z:number}|null,dt:number)=>{
  if(dead)return;
  const dx=(player?.x??Infinity)-elevatorX;
  const dz=(player?.z??Infinity)-frontZ;
  const inside=!!player&&Math.abs(dx)<1.65&&dz<-.65&&dz>-4.2;
  // Approaching from lobby opens the doors; once fully inside the cabin they
  // close. Return to the threshold opens them again to permit leaving.
  const nearOutside=!!player&&Math.abs(dx)<3.0&&dz>=-.6&&dz<3.45;
  const nearInsideExit=!!player&&inside&&dz> -1.15&&!wasInside;
  const wantOpen=nearOutside||nearInsideExit;
  const target=wantOpen?1:0;
  progress+=(target-progress)*Math.min(1,dt*3.2);
  if(Math.abs(progress-target)<.005)progress=target;
  left.position.x=elevatorX-.83-progress*1.55;
  right.position.x=elevatorX+.83+progress*1.55;
  // Closing is visual only at this milestone; elevator travel, physical cabin
  // interlocks and collision changes are reserved for the next stage.
  wasInside=inside&&dz< -1.15;
 };
 const loadReceptionist=async()=>{
  if(requested||dead)return;requested=true;
  try{
   const file=PED002_NPC_FILES[2]!;
   const result=await SceneLoader.ImportMeshAsync("","/GLBs/Characters/",file,scene);
   if(dead){result.meshes.forEach(m=>m.dispose());return;}
   receptionistMeshes=result.meshes.filter((m):m is Mesh=>m instanceof Mesh);
   const nodes=result.meshes.filter(m=>!m.parent);
   const anchor=new TransformNode("poi003:receptionist",scene);
   nodes.forEach(node=>{node.parent=anchor;});
   const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
   for(const mesh of receptionistMeshes){
    if(mesh.getTotalVertices()===0)continue;
    mesh.computeWorldMatrix(true);
    const bounds=mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(bounds.minimumWorld);
    max.maximizeInPlace(bounds.maximumWorld);
    mesh.isPickable=false;mesh.checkCollisions=false;
   }
   const height=max.y-min.y;
   if(!Number.isFinite(height)||height<.1)throw Error("Invalid receptionist bounds");
   const scale=height<1.25||height>2.25?1.75/height:1;
   anchor.scaling.setAll(scale);
   anchor.position.set(position.x-(min.x+max.x)*.5*scale,y-min.y*scale,
     position.z-(min.z+max.z)*.5*scale);
   // The desk faces +Z; independent anchor prevents changes to moving NPC 003.
   receptionistRoot=anchor;
   receptionistGroups=result.animationGroups;
   const idle=result.animationGroups.find(g=>/idle/i.test(g.name));
   result.animationGroups.forEach(g=>{if(g!==idle)g.stop();});
   idle?.start(true);
  }catch(error){if(!dead)console.warn("[POI-003] Receptionist NPC load failed",error);}
 };
 return {update,loadReceptionist,getDoorOpen:()=>progress,dispose(){
  dead=true;receptionistGroups.forEach(g=>g.stop());
  receptionistRoot?.dispose(false,false);
  receptionistMeshes.forEach(mesh=>mesh.dispose());
  root.dispose(false,false);mats.forEach(m=>m.dispose());
 }};
}
