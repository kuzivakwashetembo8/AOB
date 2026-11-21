/** LMS-GUN-001: isolated Three.js inspection scene for extracted procedural weapons. */
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {buildRifle} from "./source/models/rifle.js";
import {buildSmg} from "./source/models/smg.js";
import {buildPistol} from "./source/models/pistol.js";
import type {Gun001} from "./gun-inspection-registry-001";

type View001="side"|"front"|"top";
type SourceModel001={id:string;label:string;body:any;moving:Record<string,any>;nodes:Record<string,any>};
export interface GunInspectionScene001{
 show(gun:Gun001):Promise<string>;
 view(perspective:View001):void;
 dispose():void;
}
const BUILDERS:Record<string,()=>SourceModel001>={rifle:buildRifle,smg:buildSmg,pistol:buildPistol};
const COLORS:Record<string,string>={
 alu:"#727D88",alu_fine:"#AAB4BE",steel:"#343D47",steel_bright:"#CBD1D6",
 steel_black:"#202832",steel_soot:"#171D23",polymer:"#252A30",rubber:"#101316",
 cavity:"#080B0E",brass:"#B78A48",copper:"#A85E3E",glass:"#182D3C",
 lens:"#29495A",optic:"#303B45",red:"#A92E2E",white:"#D8DDE0",black:"#111418"
};
function materialFor(key:string){
 const color=COLORS[key]??"#59636D",metal=/alu|steel|brass|copper/.test(key);
 return new THREE.MeshStandardMaterial({
  color,metalness:metal?.78:.08,
  roughness:key==="rubber"||key==="cavity"?.86:metal?.34:.62
 });
}
function attachAssembly(assembly:any,parent:THREE.Group,materials:Map<string,THREE.Material>){
 if(!assembly||typeof assembly.build!=="function")return;
 const buckets=assembly.build() as Map<string,THREE.BufferGeometry>;
 for(const [key,geometry] of buckets){
  let material=materials.get(key);
  if(!material){material=materialFor(key);materials.set(key,material);}
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 }
}
function nodeFor(model:SourceModel001,key:string){
 const names:Record<string,string>={magazine:"magSeat",charging:"chargeRest",bolt:"boltRest",
  trigger:"triggerPivot",selector:"selectorPivot",slide:"slideRest"};
 const nodeName=names[key];
 return (nodeName?model.nodes[nodeName]:undefined)??{pos:[0,0,0],rot:[0,0,0]};
}
export function createGunInspectionScene001(canvas:HTMLCanvasElement):GunInspectionScene001{
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene();scene.background=new THREE.Color("#0e141e");
 const camera=new THREE.PerspectiveCamera(34,1,.01,30);
 const controls=new OrbitControls(camera,canvas);
 controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;
 controls.minDistance=.42;controls.maxDistance=2.8;controls.target.set(0,0,0);
 scene.add(new THREE.HemisphereLight("#E7F0FF","#252B32",2));
 const key=new THREE.DirectionalLight("#FFF0D8",3.2);key.position.set(2.4,3.2,-2.4);scene.add(key);
 const rim=new THREE.DirectionalLight("#9BB9D8",2.1);rim.position.set(-2.6,1.2,2.5);scene.add(rim);
 const fill=new THREE.DirectionalLight("#FFFFFF",.85);fill.position.set(.2,-.4,-3);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(5,5),
  new THREE.MeshStandardMaterial({color:"#202A35",metalness:.28,roughness:.78}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.255;scene.add(floor);
 let activeRoot:THREE.Group|null=null,activeMaterials:THREE.Material[]=[];
 let closed=false,version=0;
 const resize=()=>{
  if(closed)return;
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 };
 window.addEventListener("resize",resize);
 const setView=(view:View001)=>{
  if(view==="front")camera.position.set(.12,.23,-1.55);
  else if(view==="top")camera.position.set(.05,1.65,-.12);
  else camera.position.set(1.42,.46,-.72);
  controls.target.set(0,0,0);controls.update();
 };
 setView("side");
 renderer.setAnimationLoop(()=>{if(!closed){controls.update();renderer.render(scene,camera);}});
 const clearActive=()=>{
  if(!activeRoot)return;
  scene.remove(activeRoot);
  activeRoot.traverse((object:THREE.Object3D)=>{
   const mesh=object as THREE.Mesh;
   if(mesh.geometry)mesh.geometry.dispose();
  });
  for(const material of activeMaterials)material.dispose();
  activeMaterials=[];activeRoot=null;
 };
 return{
  async show(gun){
   const current=++version;clearActive();
   if(closed)throw new Error("Gun gallery disposed");
   const builder=BUILDERS[gun.builder];
   if(!builder)throw new Error("Unknown extracted gun model: "+gun.builder);
   const model=builder(),root=new THREE.Group(),materialMap=new Map<string,THREE.Material>();
   root.name="lms-gun:"+gun.id;
   attachAssembly(model.body,root,materialMap);
   for(const [name,assembly] of Object.entries(model.moving)){
    const part=new THREE.Group(),node=nodeFor(model,name),pos=node.pos??[0,0,0],rot=node.rot??[0,0,0];
    part.name="moving:"+name;
    part.position.set(pos[0]??0,pos[1]??0,pos[2]??0);
    part.rotation.set(rot[0]??0,rot[1]??0,rot[2]??0);
    attachAssembly(assembly,part,materialMap);root.add(part);
   }
   const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3());
   root.position.set(-center.x,-center.y+.045,-center.z);root.scale.setScalar(1.18);
   if(current!==version||closed){
    root.traverse((object:THREE.Object3D)=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();});
    for(const material of materialMap.values())material.dispose();
    return "MODEL SWITCHED";
   }
   activeRoot=root;activeMaterials=Array.from(materialMap.values());scene.add(root);
   setView("side");resize();
   return "SOURCE MODEL // PROCEDURAL GEOMETRY // "+gun.sourceLabel;
  },
  view:setView,
  dispose(){
   closed=true;version++;window.removeEventListener("resize",resize);
   renderer.setAnimationLoop(null);controls.dispose();clearActive();
   floor.geometry.dispose();(floor.material as THREE.Material).dispose();
   scene.clear();renderer.dispose();
  }
 };
}
