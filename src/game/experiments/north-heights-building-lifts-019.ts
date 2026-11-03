/** NH-LIFT-019 — one lazily rendered lift cabin, backed by the shared
 * procedural shaft/ring contract for every non-Finch multi-floor building.
 * The visual, passenger capsule, collision deck and camera share one pose.
 */
import {Color3,MeshBuilder,Scene,StandardMaterial,TransformNode} from "@babylonjs/core";
import type {MeridianPhysics} from "@/game/physics/rapier-world";
import {northHeightsBuildingShaft019,buildingLiftFloorHeight019,
 buildingLiftTravelSeconds019,type BuildingShaft019,type LiftLot019}
 from "./north-heights-building-lift-plan-019";
import type {FinchCabinCamera006} from "./north-heights-finch-lobby-004";

export type BuildingLiftState019={
 buildingId:string;label:string;floors:number;currentFloor:number;
 available:boolean;moving:boolean;finch:false;
};
export type BuildingLiftFrame019={
 positionOverride:{x:number;y:number;z:number}|null;
 traveling:boolean;
 state:BuildingLiftState019|null;
 cameraCabin:FinchCabinCamera006|null;
};
export function createNorthHeightsBuildingLifts019(scene:Scene,
 lots:readonly LiftLot019[],ground:(x:number,z:number)=>number,
 physics:MeridianPhysics){
 const shafts=lots.map(northHeightsBuildingShaft019)
  .filter((v):v is BuildingShaft019=>v!==null&&!v.finch);
 const byId=new Map(shafts.map(s=>[s.id,s]));
 const priorFloors=new Map<string,number>();
 const glass=new StandardMaterial("nh019-glass",scene);
 glass.diffuseColor=new Color3(.57,.80,.91);glass.alpha=.31;
 glass.backFaceCulling=false;
 const floorMat=new StandardMaterial("nh019-floor",scene);
 floorMat.diffuseColor=new Color3(.91,.96,.98);floorMat.alpha=.76;
 type Active={
  shaft:BuildingShaft019;root:TransformNode;door:ReturnType<typeof MeshBuilder.CreateBox>;
  platform:{dispose:()=>void}|null;floor:number;target:number;from:number;
  elapsed:number;duration:number;moving:boolean;inside:boolean;rideX:number;rideZ:number;
 };
 let active:Active|null=null;
 const base=(s:BuildingShaft019)=>ground(s.x,s.z);
 const floorY=(s:BuildingShaft019,f:number)=>base(s)+buildingLiftFloorHeight019(s,f);
 const disposeActive=()=>{
  if(!active)return;
  priorFloors.set(active.shaft.id,active.floor);
  active.platform?.dispose();active.root.dispose(false,true);active=null;
 };
 const make=(shaft:BuildingShaft019):Active=>{
  const root=new TransformNode("nh019:carriage:"+shaft.id,scene);
  const at=floorY(shaft,priorFloors.get(shaft.id)??1),w=shaft.halfX*2-.23,d=shaft.halfZ*2-.23;
  const create=(id:string,x:number,y:number,z:number,width:number,height:number,depth:number,mat:StandardMaterial)=>{
   const mesh=MeshBuilder.CreateBox("nh019:"+shaft.id+":"+id,{width,height,depth},scene);
   mesh.position.set(x,y,z);mesh.material=mat;mesh.isPickable=false;
   mesh.checkCollisions=false;mesh.parent=root;return mesh;
  };
  create("floor",shaft.x,at-.075,shaft.z,w,.15,d,floorMat);
  create("ceiling",shaft.x,at+2.98,shaft.z,w,.10,d,glass);
  create("back",shaft.x,at+1.50,shaft.z-shaft.halfZ+.09,w,2.98,.08,glass);
  for(const sign of [-1,1])
   create("side-"+sign,shaft.x+sign*(shaft.halfX-.10),at+1.50,shaft.z,.08,2.98,d,glass);
  const door=create("door",shaft.x,at+1.50,shaft.z+shaft.halfZ-.10,w,2.98,.075,glass);
  door.setEnabled(false);
  const f=priorFloors.get(shaft.id)??1;
  let platform:{dispose:()=>void}|null=null;
  if(f>1)platform=physics.addStaticBox({x:shaft.x,y:at-.08,z:shaft.z},
    {x:shaft.halfX-.12,y:.075,z:shaft.halfZ-.12});
  return {shaft,root,door,platform,floor:f,target:f,from:f,
   elapsed:0,duration:0,moving:false,inside:false,rideX:shaft.x,rideZ:shaft.z};
 };
 const visible=(s:BuildingShaft019,p:{x:number;y:number;z:number})=>{
  if(Math.abs(p.x-s.x)>s.halfX-.15||Math.abs(p.z-s.z)>s.halfZ-.15)return false;
  const current=active?.shaft.id===s.id?active.floor:priorFloors.get(s.id)??1;
  return Math.abs(p.y-(floorY(s,current)+.92))<1.35;
 };
 const empty=():BuildingLiftFrame019=>({positionOverride:null,traveling:false,
  state:null,cameraCabin:null});
 return {
  get count(){return shafts.length;},
  get shafts(){return shafts as readonly BuildingShaft019[];},
  requestFloor(buildingId:string,floor:number):boolean{
   if(!active||active.shaft.id!==buildingId||!active.inside||active.moving)return false;
   if(!Number.isInteger(floor)||floor<1||floor>active.shaft.floors||floor===active.floor)return false;
   active.target=floor;active.from=active.floor;active.elapsed=0;
   active.duration=buildingLiftTravelSeconds019(active.floor,floor);
   active.moving=true;active.door.setEnabled(true);
   active.platform?.dispose();active.platform=null;
   return true;
  },
  update(player:{x:number;y:number;z:number}|null,dt:number):BuildingLiftFrame019{
   if(!player)return empty();
   if(!active?.moving){
    const located=shafts.find(s=>visible(s,player));
    if(located&&active?.shaft.id!==located.id){disposeActive();active=make(located);}
    if(!located&&active)active.inside=false;
   }
   if(!active)return empty();
   const a=active,s=a.shaft;
   const within=visible(s,player);
   if(!a.moving&&!within){a.inside=false;return empty();}
   let override:BuildingLiftFrame019["positionOverride"]=null;
   if(a.moving){
    a.elapsed=Math.min(a.duration,a.elapsed+Math.max(0,Math.min(dt,.1)));
    const t=Math.min(1,a.elapsed/a.duration);
    const yFrom=floorY(s,a.from),yTo=floorY(s,a.target);
    const deck=yFrom+(yTo-yFrom)*t;
    a.root.position.y=deck-floorY(s,a.floor);
    override={x:a.rideX,y:deck+.92,z:a.rideZ};
    if(t>=1){
     a.floor=a.target;a.moving=false;priorFloors.set(s.id,a.floor);
     if(a.floor>1)a.platform=physics.addStaticBox(
      {x:s.x,y:deck-.08,z:s.z},
      {x:s.halfX-.12,y:.075,z:s.halfZ-.12});
     a.door.setEnabled(false);
    }
   }else{
    a.inside=within;a.rideX=player.x;a.rideZ=player.z;
   }
   const deck=floorY(s,a.floor)+(a.moving?a.root.position.y:0);
   const occupied=a.inside||a.moving;
   return {positionOverride:override,traveling:a.moving,
    state:occupied?{buildingId:s.id,label:s.id.replace(/-L\d+$/,""),
      floors:s.floors,currentFloor:a.moving
       ?Math.max(1,Math.min(s.floors,Math.round((deck-floorY(s,1))/s.fh)+1)):a.floor,
      available:a.inside&&!a.moving,moving:a.moving,finch:false}:null,
    cameraCabin:occupied?{x:s.x,z:s.z,floorY:deck,height:3.05,
      halfX:s.halfX-.22,halfZ:s.halfZ-.22}:null};
  },
  dispose(){disposeActive();glass.dispose();floorMat.dispose();byId.clear();priorFloors.clear();},
 };
}
