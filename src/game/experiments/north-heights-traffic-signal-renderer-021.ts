/** POI-011: two owner GLBs imported once, native geometry audited at runtime.
 * Shared geometry and four pilot heads; controller, not renderer, owns phases. */
import {Color3,Matrix,Mesh,MeshBuilder,Quaternion,Scene,SceneLoader,
 StandardMaterial,Vector3,type AbstractMesh} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {planFinchTrafficSignals021,type PilotSignalPlacement021} from "./north-heights-traffic-signal-placements-021";
import type {TrafficSignalController021,SignalColour021} from "@/game/traffic/nh021-traffic-signal-controller";
import type {NorthHeightsTime} from "./north-heights-sky-002";
type Kind="roadside"|"hanging";
const SOURCES:Record<Kind,string>={
 roadside:"traffic_light_-_free_low_poly.glb",
 hanging:"Traffic Light 2e (hanging).glb",
};
type Imported021={kind:Kind;meshes:Mesh[];height:number;extra:AbstractMesh[]};
type Fixture021={placement:PilotSignalPlacement021;discs:Mesh[];colours:SignalColour021[];
 supports:Mesh[]};
export interface TrafficSignalRenderer021{
 readonly sources:readonly string[];
 readonly supports:readonly {x:number;z:number}[];
 update:(camera:Vector3)=>void;
 setTime:(time:NorthHeightsTime)=>void;
 dispose:()=>void;
}
async function readSource(scene:Scene,kind:Kind):Promise<Imported021>{
 const result=await SceneLoader.ImportMeshAsync("","/GLBs/Infrastructure/",SOURCES[kind],scene);
 const meshes=result.meshes.filter((m):m is Mesh=>m instanceof Mesh&&m.getTotalVertices()>0);
 if(!meshes.length)throw Error("POI-011 empty GLB: "+SOURCES[kind]);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 const inspect:{mesh:Mesh;points:number[]}[]=[];
 for(const mesh of meshes){
  const world=mesh.computeWorldMatrix(true).clone();
  mesh.bakeTransformIntoVertices(world);
  mesh.parent=null;mesh.position.setAll(0);mesh.rotationQuaternion=null;
  mesh.rotation.setAll(0);mesh.scaling.setAll(1);
  const vertices=mesh.getVerticesData("position");
  if(!vertices)continue;
  const data=Array.from(vertices);
  inspect.push({mesh,points:data});
  for(let i=0;i<data.length;i+=3){
   minX=Math.min(minX,data[i]!);maxX=Math.max(maxX,data[i]!);
   minY=Math.min(minY,data[i+1]!);maxY=Math.max(maxY,data[i+1]!);
   minZ=Math.min(minZ,data[i+2]!);maxZ=Math.max(maxZ,data[i+2]!);
  }
 }
 const nativeHeight=maxY-minY,nativeWidth=Math.max(maxX-minX,maxZ-minZ);
 if(!Number.isFinite(nativeHeight)||nativeHeight<.001)
  throw Error("POI-011 invalid model native height: "+SOURCES[kind]);
 const includesPole=kind==="roadside"&&nativeHeight>nativeWidth*1.5;
 const targetHeight=kind==="hanging"?1.15:includesPole?4.7:1.15;
 const scale=targetHeight/nativeHeight;
 const offset=Matrix.Compose(new Vector3(scale,scale,scale),Quaternion.Identity(),
  new Vector3(-(minX+maxX)*scale/2,-minY*scale,-(minZ+maxZ)*scale/2));
 for(const {mesh} of inspect){
  mesh.bakeTransformIntoVertices(offset);
  mesh.isPickable=false;mesh.receiveShadows=false;
  mesh.thinInstanceSetBuffer("matrix",new Float32Array(0),16,true);
  mesh.setEnabled(false);
 }
 // Inspection is evidence, not a claim that file names imply correct orientation.
 console.info("[POI-011] owner traffic-light GLB qualification",{
  file:SOURCES[kind],kind,meshes:meshes.map(m=>({name:m.name,
   vertices:m.getTotalVertices(),material:m.material?.name})),
  nativeDimensions:[maxX-minX,nativeHeight,maxZ-minZ],
  normalizedHeight:targetHeight,includesPole,
 });
 return {kind,meshes,height:targetHeight,
  extra:result.meshes.filter(m=>!meshes.includes(m as Mesh))};
}
export async function loadFinchTrafficSignals021(
 scene:Scene,ground:(x:number,z:number)=>number,
 controller:TrafficSignalController021
):Promise<TrafficSignalRenderer021>{
 const positions=planFinchTrafficSignals021();
 const imported:Imported021[]=[];
 const fixtures:Fixture021[]=[];
 const pedestrianHeads:{housing:Mesh;red:Mesh;green:Mesh}[]=[];
 const materials:StandardMaterial[]=[];
 const created:Mesh[]=[];
 let disposed=false,night=false,lastPhase="",lastVisible="";
 const lensOff=new StandardMaterial("poi011-signal-off",scene);
 lensOff.diffuseColor=new Color3(.09,.09,.10);
 lensOff.specularColor=Color3.Black();materials.push(lensOff);
 const active:Record<SignalColour021,StandardMaterial>={
  red:new StandardMaterial("poi011-red",scene),
  amber:new StandardMaterial("poi011-amber",scene),
  green:new StandardMaterial("poi011-green",scene),
 };
 const colours:Record<SignalColour021,Color3>={
  red:new Color3(1,.095,.055),amber:new Color3(1,.68,.09),green:new Color3(.04,.96,.29),
 };
 for(const key of ["red","amber","green"] as const){
  const material=active[key];material.disableLighting=true;
  material.diffuseColor=colours[key].scale(.48);
  material.emissiveColor=colours[key];materials.push(material);
 }
 const metal=new StandardMaterial("poi011-signal-support",scene);
 metal.diffuseColor=new Color3(.13,.16,.17);materials.push(metal);
 const makeSupport=(name:string,from:Vector3,to:Vector3,radius:number)=>{
  const axis=to.subtract(from);
  const m=MeshBuilder.CreateCylinder(name,{height:axis.length(),diameter:radius*2,tessellation:7},scene);
  m.position.copyFrom(from.add(to).scale(.5));
  // Use a world-space quaternion to aim the local vertical cylinder at its beam.
  const direction=axis.normalize(),yAxis=Vector3.Up();
  const dot=Vector3.Dot(yAxis,direction);
  if(dot<.9999){
   const rotationAxis=Vector3.Cross(yAxis,direction).normalize();
   m.rotationQuaternion=Quaternion.RotationAxis(rotationAxis,Math.acos(Math.max(-1,Math.min(1,dot))));
  }
  m.material=metal;m.isPickable=false;created.push(m);return m;
 };
 try{
  // The assets are evaluated on first gameplay frame; the simulation starts
  // independently even if a GLB download has a failed network request.
  imported.push(await readSource(scene,"roadside"));
  imported.push(await readSource(scene,"hanging"));
  for(const p of positions){
   const src=imported.find(r=>r.kind===p.kind)!;
   const baseY=ground(p.poleX,p.poleZ);
   const mastTop=baseY+(p.kind==="hanging"?5.65:src.height>2?0:4.1);
   const supports:Mesh[]=[];
   if(p.kind==="hanging"||src.height<2){
    const a=new Vector3(p.poleX,baseY,p.poleZ);
    const top=new Vector3(p.poleX,mastTop,p.poleZ);
    supports.push(makeSupport(p.id+"-mast",a,top,.13));
   }
   if(p.kind==="hanging"){
    const start=new Vector3(p.poleX,mastTop,p.poleZ);
    const end=new Vector3(p.x,mastTop,p.z);
    supports.push(makeSupport(p.id+"-cantilever",start,end,.09));
   }
   const discs:Mesh[]=[];
   const spacing=p.kind==="hanging"?.28:.32;
   const height=ground(p.x,p.z)+(p.kind==="hanging"?5.65:
      src.height>2?src.height-.36:4.1+src.height-.36);
   for(let i=0;i<3;i++){
    const lens=MeshBuilder.CreateSphere(p.id+"-lens-"+i,{diameter:.20,segments:8},scene);
    lens.position.set(p.x+p.faceX*.18,
      height+(1-i)*spacing,p.z+p.faceZ*.18);
    lens.material=lensOff;lens.isPickable=false;
    discs.push(lens);created.push(lens);
   }
   fixtures.push({placement:p,discs,colours:["red","amber","green"],supports});
  }
  // The existing graph gains exactly two pilot zebra links: the east
  // and north approach crossings. Show a compact two-aspect WAIT/WALK
  // indicator at the associated sidewalk-side waiting anchors.
  for(const [label,x,z] of [
    ["east",64+9.55,-64-5.875],
    ["north",64-5.875,-64+9.55],
  ] as const){
   const h=ground(x,z)+2.32;
   const housing=MeshBuilder.CreateBox("poi011-ped-"+label+"-housing",
     {width:.34,height:.59,depth:.22},scene);
   housing.position.set(x,h,z);housing.material=metal;housing.isPickable=false;
   const red=MeshBuilder.CreateSphere("poi011-ped-"+label+"-wait",
     {diameter:.18,segments:7},scene);
   const green=MeshBuilder.CreateSphere("poi011-ped-"+label+"-walk",
     {diameter:.18,segments:7},scene);
   red.position.set(x,h+.14,z+.14);
   green.position.set(x,h-.14,z+.14);
   red.material=active.red;green.material=lensOff;
   red.isPickable=false;green.isPickable=false;
   created.push(housing,red,green);
   pedestrianHeads.push({housing,red,green});
  }
 }catch(error){
  for(const m of created)m.dispose(false,true);
  for(const o of imported){for(const m of o.meshes)m.dispose(false,true);for(const m of o.extra)m.dispose();}
  for(const m of materials)m.dispose();
  throw error;
 }
 const update=(camera:Vector3)=>{
  if(disposed)return;
  const state=controller.snapshot021();
  const visible=positions.map(p=>Math.hypot(p.x-camera.x,p.z-camera.z)<185);
  const visibleKey=visible.join(",");
  const phaseKey=state.phase+(night?":night":":day");
  if(phaseKey===lastPhase&&visibleKey===lastVisible)return;
  lastPhase=phaseKey;lastVisible=visibleKey;
  for(const group of imported){
   const matrices:number[]=[];
   for(let i=0;i<positions.length;i++){
    const p=positions[i]!;
    if(p.kind!==group.kind||!visible[i])continue;
    const headY=ground(p.x,p.z)+(p.kind==="hanging"?5.65:
      group.height>2?0:4.1);
    const heading=Math.atan2(p.faceX,p.faceZ);
    const matrix=Matrix.Compose(Vector3.One(),Quaternion.RotationAxis(Vector3.Up(),heading),
      new Vector3(p.x,headY,p.z));
    matrices.push(...matrix.toArray());
   }
   const buffer=new Float32Array(matrices);
   for(const m of group.meshes){
    m.thinInstanceSetBuffer("matrix",buffer,16,true);
    m.thinInstanceRefreshBoundingInfo();
    m.setEnabled(buffer.length>0);
   }
  }
  for(let i=0;i<fixtures.length;i++){
   const f=fixtures[i]!,p=f.placement;
   const on=visible[i];
   const incomingDX=-p.faceX,incomingDZ=-p.faceZ;
   const allowed=controller.colour021(incomingDX,incomingDZ);
   for(let j=0;j<3;j++){
    const disc=f.discs[j]!;
    disc.isVisible=on;
    disc.material=allowed===f.colours[j]?active[allowed]:lensOff;
    disc.scaling.setAll(on&&allowed===f.colours[j]&&(night)?1.04:1);
   }
   for(const s of f.supports)s.isVisible=on;
  }
  const pedestrianWalk=controller.pedestrianMayEnter021;
  for(const p of pedestrianHeads){
   const visiblePed=Math.hypot(p.housing.position.x-camera.x,
     p.housing.position.z-camera.z)<185;
   p.housing.isVisible=visiblePed;
   p.red.isVisible=visiblePed;p.green.isVisible=visiblePed;
   p.red.material=pedestrianWalk?lensOff:active.red;
   p.green.material=pedestrianWalk?active.green:lensOff;
  }
 };
 return {sources:imported.map(o=>SOURCES[o.kind]),
  supports:positions.map(p=>({x:p.poleX,z:p.poleZ})),
  update,setTime(next){night=next!=="day";lastPhase="";},
  dispose(){
   if(disposed)return;disposed=true;
   for(const m of created)m.dispose(false,true);
   for(const m of materials)m.dispose();
   for(const o of imported){for(const m of o.meshes)m.dispose(false,true);for(const m of o.extra)m.dispose();}
  },
 };
}
