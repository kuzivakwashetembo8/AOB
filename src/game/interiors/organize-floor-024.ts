/** GTD-ROOM-024: pure, deterministic organizer for a floor built from
 * semantic zones, recipes and shared components. No Babylon, Rapier, DOM,
 * GLBs or hardcoded mission hooks. One floor description can serve both
 * AppDeploy and game runtime without 53 separate scene implementations.
 */
import {validateRoomComponent024,
 type RoomComponentKind024,type RoomComponentRequest024}
 from "./room-components-024";

export type RoomZone024=Readonly<{
 id:string;purpose:string;
 minX:number;maxX:number;minZ:number;maxZ:number;
}>;
export type RoomComponentRule024=Readonly<{
 id:string;zoneId:string;kind:RoomComponentKind024;
 // Curated anchors for accepted landmarks; grids for repetitive furnishings.
 layout:"anchors"|"grid";
 anchors?:readonly Readonly<{x:number;z:number;yaw?:number;elevation?:number}>[];
 count?:number;columns?:number;
 width?:number;depth?:number;height?:number;
}>;
export type RoomOpening024=Readonly<{
 id:string;from:string;to:string;
 x:number;z:number;width:number;
}>;
export type RoomFloorRequest024=Readonly<{
 id:string;buildingId:string;floor:number;
 width:number;depth:number;
 shaft:Readonly<{x:number;z:number;halfX:number;halfZ:number}>;
 zones:readonly RoomZone024[];
 rules:readonly RoomComponentRule024[];
 openings:readonly RoomOpening024[];
}>;
export type OrganizedRoomFloor024=Readonly<{
 id:string;floor:number;
 zones:readonly RoomZone024[];
 openings:readonly RoomOpening024[];
 placements:readonly RoomComponentRequest024[];
}>;

export function organizeRoomFloor024(spec:RoomFloorRequest024):OrganizedRoomFloor024{
 if(!spec.id||!spec.buildingId||!Number.isInteger(spec.floor)
  ||spec.floor<1||spec.width<=0||spec.depth<=0)
  throw new Error("Invalid floor definition");
 const zoneMap=new Map(spec.zones.map(z=>[z.id,z]));
 if(zoneMap.size!==spec.zones.length)
  throw new Error("Duplicate room-zone IDs");
 for(const zone of spec.zones){
  if(zone.minX>=zone.maxX||zone.minZ>=zone.maxZ
   ||zone.minX<-spec.width/2-.01||zone.maxX>spec.width/2+.01
   ||zone.minZ<-spec.depth/2-.01||zone.maxZ>spec.depth/2+.01)
   throw new Error("Room zone outside floor: "+zone.id);
 }
 const occupied=new Set<string>();
 const placements:RoomComponentRequest024[]=[];
 for(const recipe of spec.rules){
  const zone=zoneMap.get(recipe.zoneId);
  if(!zone)throw new Error("Unknown component zone: "+recipe.zoneId);
  const anchors:readonly {x:number;z:number;yaw?:number;elevation?:number}[]=
   recipe.layout==="anchors"
    ?(recipe.anchors??[])
    :gridAnchors024(zone,recipe.count??0,recipe.columns??1);
  if(anchors.length===0)throw new Error("Empty component recipe "+recipe.id);
  for(const [i,anchor] of anchors.entries()){
   const placement:RoomComponentRequest024={
    id:spec.id+":"+recipe.id+":"+i,kind:recipe.kind,
    x:anchor.x,z:anchor.z,yaw:anchor.yaw??0,
    ...(anchor.elevation!==undefined?{elevation:anchor.elevation}:{}),
    ...(recipe.width!==undefined?{width:recipe.width}:{}),
    ...(recipe.depth!==undefined?{depth:recipe.depth}:{}),
    ...(recipe.height!==undefined?{height:recipe.height}:{}),
   };
   validateRoomComponent024(placement);
   if(!Number.isFinite(anchor.x)||!Number.isFinite(anchor.z)
     ||anchor.x<zone.minX-.02||anchor.x>zone.maxX+.02
     ||anchor.z<zone.minZ-.02||anchor.z>zone.maxZ+.02)
     throw new Error("Component outside its room zone: "+placement.id);
   const key=anchor.x.toFixed(3)+":"+anchor.z.toFixed(3)+":"+recipe.kind;
   if(occupied.has(key))throw new Error("Duplicate component anchor: "+placement.id);
   occupied.add(key);
   if(recipe.kind!=="pendant-light"&&recipe.kind!=="floor-rug"
     &&recipe.kind!=="sign-panel"){
    const shaft=spec.shaft;
    if(anchor.x>shaft.x-shaft.halfX&&anchor.x<shaft.x+shaft.halfX
      &&anchor.z>shaft.z-shaft.halfZ&&anchor.z<shaft.z+shaft.halfZ)
      throw new Error("Cannot furnish elevator shaft: "+placement.id);
   }
   placements.push(placement);
  }
 }
 for(const opening of spec.openings){
  if(!zoneMap.has(opening.from)||!zoneMap.has(opening.to))
   throw new Error("Disconnected opening "+opening.id);
  if(opening.width<.9||!Number.isFinite(opening.x)||!Number.isFinite(opening.z))
   throw new Error("Invalid room opening "+opening.id);
 }
 if(!spec.openings.some(o=>o.from==="lift"||o.to==="lift"))
  throw new Error("Each floor must connect its lift");
 return {id:spec.id,floor:spec.floor,zones:spec.zones,
  openings:spec.openings,placements};
}
function gridAnchors024(zone:RoomZone024,count:number,columns:number){
 if(!Number.isInteger(count)||count<1||count>100
  ||!Number.isInteger(columns)||columns<1)
  throw new Error("Invalid component grid");
 const rows=Math.ceil(count/columns),result:{x:number;z:number}[]=[];
 const dx=(zone.maxX-zone.minX)/(columns+1);
 const dz=(zone.maxZ-zone.minZ)/(rows+1);
 for(let i=0;i<count;i++){
  const col=i%columns,row=Math.floor(i/columns);
  result.push({x:zone.minX+dx*(col+1),z:zone.minZ+dz*(row+1)});
 }
 return result;
}
/** Deterministic source key: future floor grammars can use this hash rather
 * than regenerate different layouts after refresh or a new deployment.
 */
export function roomFloorSeed024(buildingId:string,floor:number,version=1):number{
 const input=buildingId+":"+floor+":v"+version;
 let hash=2166136261;
 for(let i=0;i<input.length;i++){
  hash^=input.charCodeAt(i);
  hash=Math.imul(hash,16777619);
 }
 return hash>>>0;
}
export function connectableRooms024(plan:OrganizedRoomFloor024):boolean{
 const graph=new Map(plan.zones.map(z=>[z.id,new Set<string>()]));
 for(const opening of plan.openings){
  graph.get(opening.from)?.add(opening.to);
  graph.get(opening.to)?.add(opening.from);
 }
 const visited=new Set<string>(["lift"]);
 const todo=["lift"];
 while(todo.length){
  const from=todo.shift()!;
  for(const to of graph.get(from)??[])if(!visited.has(to)){
   visited.add(to);todo.push(to);
  }
 }
 return visited.size===plan.zones.length;
}
