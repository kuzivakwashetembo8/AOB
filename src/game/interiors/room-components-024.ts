/** GTD-ROOM-024: reusable, render-engine-independent interior component catalogue.
 * Room grammar describes what to place; renderer decides how Babylon draws it.
 * Units are meters; X/Z horizontal, Y up. Component roots sit on the floor.
 */
export type RoomComponentKind024=
  | "cafe-table-group" | "cafe-counter" | "espresso-machine"
  | "pantry-bench" | "pantry-shelf" | "meeting-table"
  | "meeting-chair" | "meeting-display" | "indoor-plant"
  | "pendant-light" | "floor-rug" | "wall-segment" | "partition-glass"
  | "storage-cabinet" | "sign-panel";
export type RoomMaterial024=
  | "wood" | "wood-dark" | "wood-light" | "brass" | "steel" | "marble"
  | "leather" | "fabric" | "white" | "glass" | "screen" | "screen-line"
  | "plant" | "leaf" | "pot" | "rug" | "warm" | "wall";
export type RoomPrimitive024=Readonly<{
  id:string;
  shape:"box"|"cylinder"|"torus";
  material:RoomMaterial024;
  // Local offset relative to a placement's floor-level origin.
  x:number;y:number;z:number;
  width:number;height:number;depth:number;
  // Only author these when furniture/contact truly stops Reese.
  solid?:boolean;
}>;
export type RoomComponentRequest024=Readonly<{
  id:string;kind:RoomComponentKind024;
  x:number;z:number;
  yaw?:number;
  width?:number;depth?:number;height?:number;
}>;
export const ROOM_COMPONENT_CATALOG_024:readonly RoomComponentKind024[]=[
  "cafe-table-group","cafe-counter","espresso-machine","pantry-bench",
  "pantry-shelf","meeting-table","meeting-chair","meeting-display",
  "indoor-plant","pendant-light","floor-rug","wall-segment",
  "partition-glass","storage-cabinet","sign-panel",
];

const box=(id:string,x:number,y:number,z:number,width:number,height:number,
 depth:number,material:RoomMaterial024,solid=false):RoomPrimitive024=>({
  id,shape:"box",material,x,y,z,width,height,depth,solid,
});
const cyl=(id:string,x:number,y:number,z:number,diameter:number,height:number,
 material:RoomMaterial024):RoomPrimitive024=>({
  id,shape:"cylinder",material,x,y,z,width:diameter,height,depth:diameter,
});
const torus=(id:string,x:number,y:number,z:number,diameter:number,
 thickness:number,material:RoomMaterial024):RoomPrimitive024=>({
  id,shape:"torus",material,x,y,z,width:diameter,height:thickness,depth:diameter,
});

export function describeRoomComponent024(p:RoomComponentRequest024):readonly RoomPrimitive024[]{
 const id=p.id;
 switch(p.kind){
 case "cafe-table-group":{
  const shapes:RoomPrimitive024[]=[
   cyl(id+":table-top",0,.76,0,1.17,.065,"marble"),
   cyl(id+":stem",0,.39,0,.11,.69,"steel"),
   cyl(id+":foot",0,.07,0,.59,.08,"steel"),
   // One physical table contact approximates the pedestal and table sweep.
   box(id+":table-contact",0,.40,0,.72,.78,.72,"steel",true),
  ];
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2;
   const x=Math.cos(a)*1.04,z=Math.sin(a)*1.04;
   shapes.push(
    box(id+":chair-seat-"+i,x,.51,z,.56,.17,.52,"leather",true),
    box(id+":chair-back-"+i,x,.84,z+(Math.sin(a)*.27),.55,.63,.12,"fabric"),
    box(id+":chair-rail-"+i,x,.12,z,.47,.08,.42,"wood-dark"),
   );
  }
  return shapes;
 }
 case "cafe-counter":{
  const width=p.width??4.65;
  const result:RoomPrimitive024[]=[
   box(id+":counter-base",0,.60,0,width,1.18,.93,"wood",true),
   box(id+":counter-stone",0,1.225,0,width+.15,.10,1.06,"marble"),
   box(id+":toe-kick",0,.095,-.44,width,.16,.04,"wood-dark"),
  ];
  for(let i=0;i<5;i++){
   const dx=(-.41+i*.205)*width;
   result.push(box(id+":brass-slat-"+i,dx,.59,-.48,.047,.76,.023,"brass"));
  }
  return result;
 }
 case "espresso-machine":return [
  box(id+":base",0,.17,0,.77,.34,.52,"steel"),
  box(id+":head",0,.42,-.015,.78,.21,.52,"wood-dark"),
  box(id+":cup-left",-.21,.53,-.08,.13,.09,.13,"white"),
  box(id+":cup-right",.21,.53,-.08,.13,.09,.13,"white"),
 ];
 case "pantry-bench":{
  const width=p.width??2.38;
  return [
   box(id+":cabinet",0,.45,0,width,.9,.80,"wood",true),
   box(id+":stone-top",0,.94,0,width+.08,.085,.86,"marble"),
   box(id+":sink",-.31,1.005,0,.55,.028,.43,"steel"),
   box(id+":faucet",-.31,1.19,.12,.036,.34,.045,"steel"),
  ];
 }
 case "pantry-shelf":{
  const w=p.width??1.14;
  return [
   box(id+":shelf-1",0,1.46,0,w,.09,.35,"wood"),
   box(id+":shelf-2",0,1.90,0,w,.09,.35,"wood"),
   box(id+":shelf-3",0,2.34,0,w,.09,.35,"wood"),
  ];
 }
 case "meeting-table":return [
   box(id+":top",0,.75,0,2.07,.13,1.15,"wood-light"),
   box(id+":left-leg",-.76,.34,0,.09,.68,.95,"wood-dark"),
   box(id+":right-leg",.76,.34,0,.09,.68,.95,"wood-dark"),
   box(id+":contact",0,.40,0,1.95,.79,.81,"wood-dark",true),
 ];
 case "meeting-chair":return [
   box(id+":seat",0,.49,0,.85,.19,.73,"leather",true),
   box(id+":back",0,.89,.30,.85,.73,.15,"fabric"),
   box(id+":left-leg",-.32,.20,0,.052,.39,.052,"wood-dark"),
   box(id+":right-leg",.32,.20,0,.052,.39,.052,"wood-dark"),
 ];
 case "meeting-display":return [
   box(id+":screen",0,1.92,0,p.width??2.25,1.25,.065,"screen"),
   box(id+":glow",0,1.92,-.04,(p.width??2.25)*.88,1.03,.014,"screen-line"),
 ];
 case "indoor-plant":{
  const result:RoomPrimitive024[]=[
   cyl(id+":pot",0,.28,0,.52,.56,"pot"),
   cyl(id+":trunk",0,.89,0,.065,.84,"plant"),
  ];
  for(let k=0;k<9;k++){
   const a=2*Math.PI*k/9;
   result.push(box(id+":leaf-"+k,
    Math.cos(a)*.39,1.14+(k%3)*.17,Math.sin(a)*.39,
    .37,.11,.21,k%2?"plant":"leaf"));
  }
  return result;
 }
 case "pendant-light":return [
   cyl(id+":ceiling-rose",0,2.89,0,.23,.038,"brass"),
   cyl(id+":wire",0,2.62,0,.023,.49,"steel"),
   torus(id+":ring",0,2.38,0,.64,.065,"warm"),
   cyl(id+":shade",0,2.38,0,.40,.07,"warm"),
 ];
 case "floor-rug":return [
   box(id+":surface",0,.056,0,p.width??2.5,.043,p.depth??2.0,"rug"),
 ];
 case "wall-segment":
 case "partition-glass":{
  const material:RoomMaterial024=p.kind==="partition-glass"?"glass":"wall";
  return [
   box(id+":panel",0,(p.height??2.90)/2,0,p.width??2,(p.height??2.90),p.depth??.10,material,p.kind==="wall-segment"),
  ];
 }
 case "storage-cabinet":return [
   box(id+":body",0,1.04,0,p.width??.86,2.08,p.depth??.63,"wood",true),
   box(id+":handle",.3,1.18,-.34,.02,.26,.015,"brass"),
 ];
 case "sign-panel":return [
   box(id+":panel",0,2.43,0,p.width??1.6,.39,.055,"wood-dark"),
   box(id+":gold-trim",0,2.62,-.031,p.width??1.6,.018,.025,"brass"),
 ];
 }
}
export function validateRoomComponent024(p:RoomComponentRequest024):void{
 if(!ROOM_COMPONENT_CATALOG_024.includes(p.kind))
  throw new Error("Unsupported room component "+p.kind);
 if(!p.id||!Number.isFinite(p.x)||!Number.isFinite(p.z)
  ||!Number.isFinite(p.yaw??0))
  throw new Error("Invalid room component transform");
 for(const d of [p.width,p.depth,p.height])
  if(d!==undefined&&(!Number.isFinite(d)||d<=0))
   throw new Error("Invalid component dimensions");
}
