/** POI-005: a single furnished executive suite, library and hotel-style lounge
 * on the real floor-53 collision slab. No lower-floor room assets are generated. */
import {AnimationGroup,Color3,Mesh,MeshBuilder,Scene,SceneLoader,StandardMaterial,TransformNode,Vector3} from "@babylonjs/core";
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
 const root=new TransformNode("poi005:floor53-private-suite",scene);
 const mats:StandardMaterial[]=[];
 const solids:{dispose:()=>void}[]=[];
 const makeMat=(name:string,hex:string,emissive=false)=>{
  const c=Color3.FromHexString(hex);
  const m=new StandardMaterial("poi005:"+name,scene);
  m.diffuseColor=c;m.specularColor=new Color3(.2,.2,.2);
  if(emissive)m.emissiveColor=c.scale(.65);
  mats.push(m);return m;
 };
 const alabaster=makeMat("alabaster","#E9E5DB"),wood=makeMat("oak","#704D39");
 const walnut=makeMat("walnut","#422B26"),leather=makeMat("leather","#344451");
 const gold=makeMat("brass","#C9A76C"),dark=makeMat("charcoal","#26303B");
 const bookColors=["#7D3F37","#344D5F","#B09A71","#394F45","#5F4B61"].map((c,i)=>makeMat("book-"+i,c));
 const lamp=makeMat("lamp","#FFE2A3",true);
 const box=(name:string,px:number,py:number,pz:number,w:number,h:number,d:number,
   mat:StandardMaterial,collide=false)=>{
  const mesh=MeshBuilder.CreateBox("poi005:"+name,{width:w,height:h,depth:d},scene);
  mesh.position.set(px,py,pz);mesh.material=mat;mesh.parent=root;mesh.isPickable=false;
  if(collide)solids.push(physics.addStaticBox({x:px,y:py,z:pz},{x:w/2,y:h/2,z:d/2}));
  return mesh;
 };
 // Reception is below. This is one private suite with distinct functional zones.
 // The elevator is centered on the north (-Z) wall; its open landing is preserved.
 box("floor53-warm-carpet",x,y+.022,z+4.8,18,.042,16,alabaster);
 // Office at the south-facing window, with one clear player approach to Finch.
 const deskX=x+2.9,deskZ=z+6.4;
 box("executive-desk",deskX,y+.74,deskZ,3.6,.2,1.42,walnut,true);
 for(const sx of [-1,1])box("desk-leg-"+sx,deskX+sx*1.52,y+.39,deskZ,
   .18,.75,1.12,wood,true);
 box("desk-monitor",deskX+.6,y+1.20,deskZ-.3,.78,.56,.07,dark);
 box("desk-stand",deskX+.6,y+.96,deskZ-.3,.09,.26,.1,gold);
 box("desk-lamp",deskX-1.15,y+1.13,deskZ-.32,.22,.38,.22,lamp);
 box("office-chair",deskX,y+.43,deskZ+1.45,1.14,.82,.93,leather);
 box("office-chair-back",deskX,y+1.08,deskZ+1.82,1.1,1.30,.15,leather);
 // Library along the opposite wall, with real shelf depth and low-cost books.
 const shelfX=x-7.25;
 for(let bay=0;bay<3;bay++){
  const bz=z-2.4+bay*4.15;
  box("library-spine-"+bay,shelfX,y+1.57,bz,.36,3.15,3.62,walnut,true);
  for(let row=0;row<4;row++){
   const yy=y+.42+row*.66;
   box("shelf-"+bay+"-"+row,shelfX+.45,yy,bz,1.0,.10,3.62,wood);
   for(let k=0;k<11;k++){
    const height=.34+(k%4)*.042;
    box("book-"+bay+"-"+row+"-"+k,shelfX+.46,yy+.05+height/2,
      bz-1.55+k*.29,.66,height,.23,bookColors[(bay+row+k)%bookColors.length]!);
   }
  }
 }
 // Hotel-like lounge with two sofas, coffee table, reading chair, soft light.
 const loungeX=x+5.8,loungeZ=z-3.0;
 box("suite-rug",loungeX,y+.05,loungeZ,7.1,.035,5.8,wood);
 box("sofa-seat",loungeX,y+.46,loungeZ+2.0,4.25,.76,1.05,leather,true);
 box("sofa-back",loungeX,y+.89,loungeZ+2.55,4.25,1.42,.23,leather);
 for(const side of [-1,1])
  box("sofa-arm-"+side,loungeX+side*2.05,y+.66,loungeZ+2.0,.23,1.15,1.14,leather);
 box("coffee-table",loungeX,y+.40,loungeZ,2.6,.22,1.2,walnut,true);
 box("reading-chair",loungeX-2.5,y+.42,loungeZ-1.8,1.36,.82,1.24,leather,true);
 box("side-table",loungeX+2.3,y+.45,loungeZ-1.65,.85,.12,.9,wood);
 box("floor-lamp",loungeX+2.4,y+1.40,loungeZ-2.1,.36,2.45,.36,lamp);
 // Private suite atmosphere: a small upholstered daybed, not sleep gameplay.
 box("daybed",x-3.4,y+.37,z+10.2,3.5,.72,2.15,leather,true);
 box("daybed-pillow",x-4.55,y+.8,z+10.2,.72,.18,1.25,alabaster);
 // Finch stands behind the desk, with eye contact towards the elevator.
 const finchPosition={x:deskX,y:y+.93,z:deskZ+2.58};
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
   solids.forEach(s=>s.dispose());root.dispose(false,true);
   mats.forEach(m=>m.dispose());
  },
 };
}
