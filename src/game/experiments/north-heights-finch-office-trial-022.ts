/** FINCH-ROOM-022 — isolated Build 3D Game Rooms trial on Floor 53.
 * Uses the existing white support slab, glass facade and elevator landing.
 * Nothing is generated for other floors or other North Heights buildings.
 * Exclude from main until owner tests the preview and authorizes a merge.
 */
import {
  Color3,MeshBuilder,PointLight,Scene,StandardMaterial,TransformNode,Vector3,
} from "@babylonjs/core";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {MeridianPhysics} from "@/game/physics/rapier-world";
import {finchShaft004} from "./north-heights-finch-elevator-structure-004";

export const FINCH_ROOM_TRIAL_022={
 buildingId:"NH-04-06-L2",
 width:12.4,depth:10.2,
 // Real footprint is 22.669 x 33.889m. The suite occupies the
 // north/window-facing half, separate from the lift shaft.
 centerX:0,centerZ:10.0,
 minLiftCorridorWidth:2.4,
} as const;

export type FinchRoomTrial022={
 dispose:()=>void;
 getStats:()=>{meshes:number;colliders:number;visible:boolean};
};

export function createFinchRoomTrial022(
 scene:Scene,lot:BuildingSpec,ground:(x:number,z:number)=>number,
 physics:MeridianPhysics,
):FinchRoomTrial022{
 if(lot.id!==FINCH_ROOM_TRIAL_022.buildingId)
  throw Error("FINCH-ROOM-022 is restricted to the authorized Finch tower");
 const shaft=finchShaft004(lot);
 if(!shaft)throw Error("FINCH-ROOM-022 cannot find the accepted 53-floor shaft");
 const floorY=ground(lot.position.x,lot.position.z)+shaft.topFloorOffset;
 const root=new TransformNode("finch022:office-root",scene);
 root.position.set(lot.position.x,floorY,lot.position.z);
 const mats:StandardMaterial[]=[];
 const physical:{dispose:()=>void}[]=[];
 let meshCount=0,closed=false,visible=false;
 const palette:Record<string,[number,number,number]>={
  walnut:[.22,.12,.085],timber:[.36,.23,.16],bevel:[.50,.33,.22],
  brass:[.69,.49,.23],metal:[.18,.20,.23],black:[.055,.060,.075],
  leather:[.13,.125,.13],cushion:[.29,.25,.22],rug:[.19,.185,.19],
  rugEdge:[.37,.34,.32],cream:[.81,.75,.67],paper:[.85,.82,.74],
  glass:[.24,.39,.48],screen:[.01,.11,.20],screenLine:[.29,.77,.85],
  green:[.12,.31,.15],leaf:[.22,.44,.23],pot:[.38,.36,.32],
  bookA:[.36,.24,.21],bookB:[.17,.29,.31],bookC:[.44,.35,.24],
  bookD:[.31,.30,.29],bookE:[.27,.19,.17],warm:[.99,.71,.39],
 };
 const materials=new Map<string,StandardMaterial>();
 const material=(key:string)=>{
  const found=materials.get(key);if(found)return found;
  const rgb=palette[key]!;
  const mat=new StandardMaterial("finch022:"+key,scene);
  mat.diffuseColor=new Color3(...rgb);
  mat.specularColor=new Color3(.13,.13,.14);
  if(key==="warm"||key==="screenLine"){
   mat.emissiveColor=new Color3(...rgb).scale(key==="warm"?.65:.35);
  }
  if(key==="glass"){mat.alpha=.45;mat.backFaceCulling=false;}
  mats.push(mat);materials.set(key,mat);return mat;
 };
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>{
  const mesh=MeshBuilder.CreateBox("finch022:"+name,{width:w,height:h,depth:d},scene);
  mesh.parent=root;mesh.position.set(x,y,z);mesh.material=material(color);
  mesh.isPickable=false;mesh.checkCollisions=false;meshCount++;
  return mesh;
 };
 const cylinder=(name:string,x:number,y:number,z:number,diameter:number,h:number,color:string)=>{
  const mesh=MeshBuilder.CreateCylinder("finch022:"+name,
   {diameter,height:h,tessellation:10},scene);
  mesh.parent=root;mesh.position.set(x,y,z);mesh.material=material(color);
  mesh.isPickable=false;mesh.checkCollisions=false;meshCount++;
  return mesh;
 };
 const collision=(x:number,y:number,z:number,w:number,h:number,d:number)=>{
  physical.push(physics.addStaticBox(
   {x:lot.position.x+x,y:floorY+y,z:lot.position.z+z},
   {x:w/2,y:h/2,z:d/2},
  ));
 };
 // Do not put a second full floor onto the accepted white collision slab.
 // Rugs are thin ornamental decals, not floors or navigation barriers.
 box("meeting-rug",2.7,.018,10.6,5.0,.035,5.0,"rug");
 box("rug-left-border",.23,.039,10.6,.036,.009,5.02,"rugEdge");
 box("rug-right-border",5.17,.039,10.6,.036,.009,5.02,"rugEdge");
 box("lounge-rug",7.2,.018,9.2,3.6,.035,3.3,"rug");
 // Desk and its paired pedestals: positioned behind Finch's original
 // x+2.9,z+8.98 assignment position. Finch must not intersect the desk.
 box("executive-desk-top",2.85,.81,13.15,3.0,.12,1.25,"timber");
 box("executive-desk-edge",2.85,.755,13.15,3.04,.035,1.3,"brass");
 box("executive-desk-modesty",2.85,.405,12.92,2.65,.73,.10,"walnut");
 for(const dx of [-1.23,1.23]){
  box("executive-desk-pedestal",2.85+dx,.36,13.18,.29,.72,1.12,"walnut");
 }
 for(const z of [12.8,13.15,13.5])
  box("executive-desk-handle",1.45,.52,z,.016,.022,.20,"brass");
 collision(2.85,.43,13.15,3.02,.86,1.3);
 const chair=(id:string,x:number,z:number,boss=false,turn=false)=>{
  const w=boss?.79:.66;
  box(id+"-seat",x,.55,z,w,.16,.61,"leather");
  box(id+"-back",x,.99,z+(turn?.29:-.29),w,boss?.85:.71,.15,"leather");
  box(id+"-stitch",x,1.03,z+(turn?.21:-.21),w*.82,.45,.017,"cushion");
  for(const side of [-1,1]){
   box(id+"-arm",x+side*w*.47,.74,z,.07,.11,.5,"black");
   box(id+"-arm-post",x+side*w*.47,.62,z,.04,.20,.05,"metal");
  }
  cylinder(id+"-stem",x,.28,z,.075,.41,"metal");
  box(id+"-base",x,.085,z,.55,.06,.09,"metal");
 };
 chair("finch-desk-chair",2.85,14.23,true,true);
 // The two visitors sit to the sides of the clear route to Finch.
 chair("visitor-west",.65,9.25,false,false);
 chair("visitor-east",5.1,9.25,false,false);
 // Desktop apparatus: computers, keyboard, dossiers and task lamp.
 for(const dx of [-.48,.26]){
  box("monitor-frame",2.85+dx,1.26,13.63,.59,.39,.065,"black");
  box("monitor-screen",2.85+dx,1.27,13.585,.51,.31,.012,"screen");
  for(const dy of [1.19,1.27,1.34])
   box("monitor-code",2.85+dx,dy,13.573,.37,.012,.006,"screenLine");
  box("monitor-neck",2.85+dx,1.008,13.65,.034,.23,.038,"metal");
  box("monitor-foot",2.85+dx,.884,13.65,.28,.019,.17,"metal");
 }
 box("keyboard",2.65,.885,12.94,.52,.035,.19,"black");
 box("paper-stack",3.93,.89,12.85,.34,.045,.25,"paper");
 cylinder("lamp-base",4.05,.9,13.55,.16,.07,"brass");
 cylinder("lamp-upright",4.05,1.14,13.55,.044,.43,"brass");
 box("lamp-shade",3.95,1.37,13.52,.34,.08,.23,"warm");
 // Warm library at west wall. All bookcases remain outside the main
 // elevator-to-Finch navigation spine x≈0..4 and z≤8.5.
 const shelfX=-7.4;
 for(const baseZ of [6.15,8.75,11.35]){
  box("bookshelf-back",shelfX-.18,1.52,baseZ,.08,2.98,2.5,"walnut");
  for(const end of [-1.23,1.23])
   box("bookshelf-end",shelfX,1.52,baseZ+end,.42,3.02,.07,"timber");
  for(const shelfY of [.18,.75,1.32,1.89,2.46,3.01]){
   box("bookshelf-board",shelfX,shelfY,baseZ,.43,.058,2.52,"bevel");
   if(shelfY<3&&shelfY>.2)
    box("bookshelf-light",shelfX+.205,shelfY+.07,baseZ,.015,.015,2.3,"warm");
  }
  for(let row=0;row<5;row++){
   let z=baseZ-1.13;
   for(let k=0;k<15&&z<baseZ+1.12;k++){
    const seed=(row*43+k*37+Math.round(baseZ*71))%19;
    const width=.075+(seed%5)*.013;
    const height=.27+(seed%7)*.026;
    const col=["bookA","bookB","bookC","bookD","bookE"][seed%5]!;
    box("archive-book",shelfX+.055,.22+row*.57+height/2,z,
     .26,height,width,col);
    z+=width+.021;
   }
  }
 }
 for(const z of [5.8,7.0,8.2,9.4,10.6,11.8]){
  box("library-low-cabinet",-7.35,.35,z,.65,.7,1.15,"walnut");
  box("library-cabinet-handle",-7.01,.52,z,.024,.018,.31,"brass");
 }
 collision(-7.4,1.6,8.75,.85,3.1,8.2);
 // Right lounge: restrained sofa, accent table and a chessboard.
 box("sofa-plinth",7.7,.29,7.85,2.28,.33,.87,"black");
 box("sofa-seat",7.7,.50,7.85,2.16,.18,.77,"leather");
 box("sofa-back",7.7,.89,8.23,2.28,.80,.16,"leather");
 for(const dx of [-.96,.96])
  box("sofa-arm",7.7+dx,.72,7.85,.20,.58,.86,"cushion");
 for(const dx of [-.61,0,.61]){
  box("sofa-cushion",7.7+dx,.62,7.81,.55,.055,.68,"cushion");
  box("sofa-back-cushion",7.7+dx,.87,8.10,.57,.56,.09,"cushion");
 }
 collision(7.7,.50,7.85,2.3,1.0,.90);
 box("coffee-table-top",7.55,.49,9.45,1.55,.07,.77,"timber");
 for(const dx of [-.62,.62])for(const dz of [-.26,.26])
  box("coffee-table-leg",7.55+dx,.25,9.45+dz,.055,.46,.055,"metal");
 box("chessboard-base",7.55,.545,9.45,.55,.035,.55,"black");
 for(let row=0;row<8;row++)for(let col=0;col<8;col++)
  if((row+col)%2===0)box("chess-square",
   7.55-.24+row*.068,.566,9.45-.24+col*.068,.066,.006,.066,"paper");
 for(const i of [0,2,4,6]){
  cylinder("light-chess-piece",7.31+i*.069,.595,9.21,.03,.09,"brass");
  cylinder("dark-chess-piece",7.31+i*.069,.595,9.67,.03,.09,"black");
 }
 collision(7.55,.38,9.45,1.57,.76,.78);
 // Two indoor plants; stems and leaves are ornaments, not physical blockers.
 for(const [px,pz] of ([[8.8,13.7],[-4.9,13.7]] as const)){
  cylinder("planter",px,.29,pz,.45,.56,"pot");
  cylinder("pot-soil",px,.58,pz,.40,.04,"walnut");
  cylinder("plant-stem",px,1.03,pz,.05,.96,"green");
  for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9,r=.25+(i%4)*.064;
   const leaf=box("plant-leaf",px+Math.cos(a)*r,1.18+(i%3)*.18,
    pz+Math.sin(a)*r,.37,.12,.19,i%2?"leaf":"green");
   leaf.rotation.y=-a;
  }
 }
 // Low-impact practical lighting; only enabled if camera is on Floor 53.
 const practicals:PointLight[]=[];
 for(const [cx,cz,power] of [[2.8,12.55,.85],[-6.9,9.4,.55],[7.7,9.3,.58]] as const){
  const bulb=new PointLight("finch022:practical-"+cz,
   new Vector3(cx,2.65,cz),scene);
  bulb.diffuse=new Color3(1,.77,.50);
  bulb.parent=root;
  bulb.intensity=power;bulb.range=8.5;practicals.push(bulb);
 }
 const observer=scene.onBeforeRenderObservable.add(()=>{
  if(closed)return;
  const cameraY=scene.activeCamera?.globalPosition.y;
  const shouldShow=cameraY!==undefined&&Math.abs(cameraY-floorY)<18;
  if(shouldShow!==visible){
   visible=shouldShow;root.setEnabled(visible);
   for(const light of practicals)light.setEnabled(visible);
  }
 });
 // Keep scene sparse away from the floor; object colliders are resident only
 // for the special 53rd floor and cannot affect street-level gameplay.
 root.setEnabled(false);
 practicals.forEach(light=>light.setEnabled(false));
 return {
  getStats:()=>({meshes:meshCount,colliders:physical.length,visible}),
  dispose(){
   if(closed)return;
   closed=true;
   if(observer)scene.onBeforeRenderObservable.remove(observer);
   for(const solid of physical)solid.dispose();
   for(const light of practicals)light.dispose();
   root.dispose(false,true);
   mats.forEach(mat=>mat.dispose());
  },
 };
}
