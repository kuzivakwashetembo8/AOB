/** FINCH-ROOM-022 — isolated Build 3D Game Rooms trial on Floor 53.
 * Uses the existing white support slab, glass facade and elevator landing.
 * Nothing is generated for other floors or other North Heights buildings.
 * Exclude from main until owner tests the preview and authorizes a merge.
 */
import {
  Color3,MeshBuilder,PointLight,RawTexture,Scene,StandardMaterial,Texture,
  TransformNode,Vector3,VertexBuffer,
} from "@babylonjs/core";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {MeridianPhysics} from "@/game/physics/rapier-world";
import {finchFloorRing004,finchShaft004}
 from "./north-heights-finch-elevator-structure-004";

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
  floorWood:[.82,.70,.57],panel:[.18,.105,.075],darkWood:[.11,.075,.055],
  runner:[.22,.18,.16],stone:[.29,.28,.27],
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
 // Wood finish is an optical skin, not a new structural floor or Rapier slab.
 // The existing authored floor ring remains the sole walkable support.
 const tilePixels=new Uint8Array(64*64*4);
 for(let v=0;v<64;v++)for(let u=0;u<64;u++){
  const index=(v*64+u)*4;
  const joint=u<2||v<2;
  const grain=(u*17+v*7)%13;
  const variation=grain<3?-6:grain>10?5:0;
  tilePixels[index]=joint?55:131+variation;
  tilePixels[index+1]=joint?40:88+variation;
  tilePixels[index+2]=joint?32:63+variation;
  tilePixels[index+3]=255;
 }
 const tileTexture=RawTexture.CreateRGBATexture(
  tilePixels,64,64,scene,false,false,Texture.NEAREST_SAMPLINGMODE);
 tileTexture.wrapU=Texture.WRAP_ADDRESSMODE;
 tileTexture.wrapV=Texture.WRAP_ADDRESSMODE;
 const floorMaterial=new StandardMaterial("finch022:warm-wood-floor",scene);
 floorMaterial.diffuseTexture=tileTexture;
 floorMaterial.diffuseColor=new Color3(1,1,1);
 floorMaterial.specularColor=new Color3(.12,.085,.055);
 floorMaterial.specularPower=64;
 mats.push(floorMaterial);
 const floorParts=finchFloorRing004(
  lot.position.x,lot.position.z,
  (lot.overrides?.width??22.669)-.60,
  (lot.overrides?.depth??33.889)-.60,shaft);
 for(const [i,part] of floorParts.entries()){
  const groundMesh=MeshBuilder.CreateGround("finch022:floor-skin-"+i,
   {width:part.width,height:part.depth,subdivisions:1},scene);
  groundMesh.parent=root;
  groundMesh.position.set(part.x-lot.position.x,.024,part.z-lot.position.z);
  groundMesh.material=floorMaterial;
  groundMesh.isPickable=false;
  groundMesh.checkCollisions=false;
  const uv=groundMesh.getVerticesData(VertexBuffer.UVKind);
  if(uv){
   for(let k=0;k<uv.length;k+=2){
    uv[k]=(uv[k]??0)*(part.width/.76);
    uv[k+1]=(uv[k+1]??0)*(part.depth/.76);
   }
   groundMesh.setVerticesData(VertexBuffer.UVKind,uv);
  }
  meshCount++;
 }
 const collision=(x:number,y:number,z:number,w:number,h:number,d:number)=>{
  physical.push(physics.addStaticBox(
   {x:lot.position.x+x,y:floorY+y,z:lot.position.z+z},
   {x:w/2,y:h/2,z:d/2},
  ));
 };
 // The transparent elevator landing remains open and walkable.
 // A quiet carpet runner visually links the lift to the furnished suite.
 // Two touching rectangles make one continuous L-shaped path without
 // z-fighting. The horizontal arm turns WEST toward the library shelves.
 box("lift-runner",.05,.051,-1.76,1.74,.042,11.08,"runner");
 for(const rx of [-.81,.81])
  box("lift-runner-edging",rx,.075,-1.76,.036,.012,11.08,"brass");
 box("library-runner-turn",-2.32,.051,4.64,4.74,.042,1.72,"runner");
 for(const rz of [3.80,5.48])
  box("library-runner-turn-edging",-2.32,.075,rz,4.74,.012,.032,"brass");
 // Dark area rugs visually anchor furniture, replacing the floating-islands look.
 box("meeting-rug",2.85,.055,7.05,4.85,.042,4.45,"rug");
 box("rug-left-border",.44,.079,7.05,.036,.009,4.48,"rugEdge");
 box("rug-right-border",5.26,.079,7.05,.036,.009,4.48,"rugEdge");
 box("lounge-rug",7.05,.055,9.3,3.5,.042,3.25,"rug");
 // Orient the desk toward the entrance (negative Z) so the existing Finch
 // mission anchor at x+2.9,z+8.98 is BEHIND the desk, not in the visitor
 // area. The player still walks to Finch; his trigger is not repositioned.
 const deskOffsetZ=-5.70;
 const deskBox=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>
  box(name,x,y,z+deskOffsetZ,w,h,d,color);
 deskBox("executive-desk-top",2.85,.81,13.15,3.0,.12,1.25,"timber");
 deskBox("executive-desk-edge",2.85,.755,13.15,3.04,.035,1.3,"brass");
 deskBox("executive-desk-modesty",2.85,.405,12.92,2.65,.73,.10,"walnut");
 for(const dx of [-1.23,1.23]){
  deskBox("executive-desk-pedestal",2.85+dx,.36,13.18,.29,.72,1.12,"walnut");
 }
 for(const z of [12.8,13.15,13.5])
  deskBox("executive-desk-handle",1.45,.52,z,.016,.022,.20,"brass");
 collision(2.85,.43,7.45,3.02,.86,1.3);
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
 // Finch stays at the fixed mission anchor; the chair is offset to avoid
 // clipping his standing mesh. Visitor seats form a balanced pair.
 chair("finch-desk-chair",4.35,9.15,true,true);
 chair("visitor-west",2.0,5.52,false,false);
 chair("visitor-east",3.7,5.52,false,false);
 // Desktop apparatus: computers, keyboard, dossiers and task lamp.
 for(const dx of [-.48,.26]){
  deskBox("monitor-frame",2.85+dx,1.26,13.63,.59,.39,.065,"black");
  deskBox("monitor-screen",2.85+dx,1.27,13.682,.51,.31,.012,"screen");
  for(const dy of [1.19,1.27,1.34])
   deskBox("monitor-code",2.85+dx,dy,13.695,.37,.012,.006,"screenLine");
  deskBox("monitor-neck",2.85+dx,1.008,13.65,.034,.23,.038,"metal");
  deskBox("monitor-foot",2.85+dx,.884,13.65,.28,.019,.17,"metal");
 }
 deskBox("keyboard",2.65,.885,13.43,.52,.035,.19,"black");
 deskBox("paper-stack",3.93,.89,13.28,.34,.045,.25,"paper");
 cylinder("lamp-base",4.05,.9,7.85,.16,.07,"brass");
 cylinder("lamp-upright",4.05,1.14,7.85,.044,.43,"brass");
 deskBox("lamp-shade",3.95,1.37,13.52,.34,.08,.23,"warm");
 // Build a coherent western wall: library rather than isolated bookcases.
 // The panel provides architectural enclosure without blocking the elevator
 // landing or replacing the already-authored glass exterior facade.
 box("library-architectural-panel",-5.96,1.52,9.6,.12,3.04,8.8,"panel");
 for(const zz of [5.28,8.12,10.96,13.82]){
  box("library-pilaster",-5.85,1.52,zz,.18,3.04,.08,"walnut");
  box("library-pilaster-gilt",-5.75,1.52,zz,.013,2.6,.018,"brass");
 }
 collision(-5.96,1.53,9.6,.16,3.06,8.8);
 const shelfX=-5.52;
 for(const baseZ of [7.0,9.6,12.2]){
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
 for(const z of [6.25,7.4,8.55,9.7,10.85,12.0,13.15]){
  box("library-low-cabinet",-5.47,.35,z,.65,.7,1.12,"walnut");
  box("library-cabinet-handle",-5.13,.52,z,.024,.018,.31,"brass");
 }
 collision(-5.52,1.6,9.6,.85,3.1,8.2);
 // Right lounge: restrained sofa, accent table and a chessboard.
 box("sofa-plinth",7.15,.29,10.0,2.28,.33,.87,"black");
 box("sofa-seat",7.15,.50,10.0,2.16,.18,.77,"leather");
 box("sofa-back",7.15,.89,10.38,2.28,.80,.16,"leather");
 for(const dx of [-.96,.96])
  box("sofa-arm",7.15+dx,.72,10.0,.20,.58,.86,"cushion");
 for(const dx of [-.61,0,.61]){
  box("sofa-cushion",7.15+dx,.62,9.96,.55,.055,.68,"cushion");
  box("sofa-back-cushion",7.15+dx,.87,10.25,.57,.56,.09,"cushion");
 }
 collision(7.15,.50,10.0,2.3,1.0,.90);
 box("coffee-table-top",7.0,.49,8.75,1.55,.07,.77,"timber");
 for(const dx of [-.62,.62])for(const dz of [-.26,.26])
  box("coffee-table-leg",7.0+dx,.25,8.75+dz,.055,.46,.055,"metal");
 box("chessboard-base",7.0,.545,8.75,.55,.035,.55,"black");
 for(let row=0;row<8;row++)for(let col=0;col<8;col++)
  if((row+col)%2===0)box("chess-square",
   7.0-.24+row*.068,.566,8.75-.24+col*.068,.066,.006,.066,"paper");
 for(const i of [0,2,4,6]){
  cylinder("light-chess-piece",6.76+i*.069,.595,8.51,.03,.09,"brass");
  cylinder("dark-chess-piece",6.76+i*.069,.595,8.97,.03,.09,"black");
 }
 collision(7.0,.38,8.75,1.57,.76,.78);
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
 // Architectural cove and pendant: the established 3D concept's focal light.
 // Only a shallow perimeter frame is authored; the existing rooftop remains.
 for(const cz of [5.48,14.75]){
  box("ceiling-coffer-east-west",1.65,3.02,cz,14.45,.09,.16,"walnut");
  box("ceiling-cove-warm",1.65,2.965,cz,14.25,.024,.028,"warm");
 }
 for(const cx of [-5.55,8.85]){
  box("ceiling-coffer-north-south",cx,3.02,10.13,.16,.09,9.3,"walnut");
  box("ceiling-cove-warm",cx,2.965,10.13,.024,.022,9.12,"warm");
 }
 // Suspend a visible luminous ring over the two visitor chairs, as in the
 // 3D template. Torus lies horizontally in Babylon's XZ plane by default.
 const pendant=MeshBuilder.CreateTorus("finch022:pendant-ring",{
  diameter:1.8,thickness:.065,tessellation:48
 },scene);
 pendant.material=material("warm");
 pendant.parent=root;pendant.position.set(2.85,2.68,6.28);
 pendant.isPickable=false;pendant.checkCollisions=false;meshCount++;
 for(const [wireX,wireZ] of [[2.01,6.28],[3.69,6.28],[2.85,7.10]] as const)
  cylinder("pendant-stem",wireX,2.93,wireZ,.018,.5,"metal");
 cylinder("ceiling-rose",2.85,3.02,6.28,.28,.045,"brass");
 // Library wall light is physically mounted into the authored timber panel.
 box("wall-sconce-west",-5.76,2.41,5.9,.12,.17,.42,"warm");
 // The previous right sconce was free-floating, not attached to a wall.
 // Replace it with the floor lamp from the original proof-of-concept demo.
 cylinder("lounge-floor-lamp-foot",8.75,.10,8.08,.30,.12,"black");
 cylinder("lounge-floor-lamp-pole",8.75,1.03,8.08,.042,1.82,"brass");
 cylinder("lounge-floor-lamp-shade",8.75,2.03,8.08,.53,.39,"cream");
 cylinder("lounge-floor-lamp-glow",8.75,1.82,8.08,.37,.055,"warm");
 // Low-overhead practical lighting; only enabled if camera is on Floor 53.
 const practicals:PointLight[]=[];
 for(const [cx,cz,power] of [
  [2.85,7.75,1.45],[-5.18,8.85,1.10],[8.75,8.08,1.35],[2.85,6.28,1.85]
 ] as const){
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
   tileTexture.dispose();
  },
 };
}
