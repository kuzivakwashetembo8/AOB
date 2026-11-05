/** GTD-NH-ATM-022: bounded, camera-local rain and brief storm cloud illumination.
 * No per-frame droplets, no audio voices, no overrides of accepted street lighting.
 */
import {Color3,LinesMesh,MeshBuilder,Scene,Vector3} from "@babylonjs/core";
import type {AtmosphereRender022} from "./nh022-atmosphere-model";
const wet=(condition:string)=>condition==="Thunderstorm"?1:condition==="Rain"?.72:0;
function hash(i:number){let h=Math.imul(i^0x6613,2246822519);
 h=Math.imul(h^(h>>>13),3266489917);return (h^(h>>>16))>>>0;}
export function createNorthHeightsPrecipitation022(scene:Scene,mobile:boolean){
 const lines:Array<[Vector3,Vector3]>=[];
 const count=mobile?110:180;
 for(let i=0;i<count;i++){
  const r=hash(i),r2=hash(i+3371),r3=hash(i+10129);
  const x=(r/4294967296-.5)*36,z=(r2/4294967296-.5)*36,
   y=(r3/4294967296-.5)*17;
  lines.push([new Vector3(x,y,z),new Vector3(x-.23,y-1.45,z-.12)]);
 }
 const mesh=MeshBuilder.CreateLineSystem("nh022-local-rain",{
  lines:lines.map(([a,b])=>[a,b]),updatable:false,
 },scene) as LinesMesh;
 mesh.color=new Color3(.71,.81,.94);
 mesh.isPickable=false;mesh.alwaysSelectAsActiveMesh=true;
 mesh.isVisible=false;mesh.visibility=.60;
 let flashSeconds=0,lastCycle=-1,closed=false;
 const update=(state:AtmosphereRender022,inside:boolean)=>{
  if(closed)return 0;
  const wetStrength=wet(state.from.condition)*(1-state.blend)+
   wet(state.to.condition)*state.blend;
  mesh.isVisible=wetStrength>.06&&!inside;
  if(mesh.isVisible&&scene.activeCamera){
   mesh.position.copyFrom(scene.activeCamera.position);
   mesh.position.y-=((state.cloudSeconds*13)%16)-8;
   mesh.visibility=Math.min(.72,wetStrength*.66);
  }
  const stormStrength=(state.from.condition==="Thunderstorm"?1-state.blend:0)+
   (state.to.condition==="Thunderstorm"?state.blend:0);
  const night=state.timeOfDay<330||state.timeOfDay>=1170;
  const cycle=Math.floor(state.cloudSeconds/10);
  if(!state.frozen&&stormStrength>.65&&night&&cycle!==lastCycle){
   lastCycle=cycle;
   if(hash(cycle+state.to.seed)%3===0)flashSeconds=.20;
  }
  if(stormStrength<.1)flashSeconds=0;
  if(!state.frozen)flashSeconds=Math.max(0,flashSeconds-.05);
  // Only cloud material receives the flash; practical/ambient lights remain owned
  // by the existing accepted sky and street-lamp systems.
  return flashSeconds>0&&Math.sin((.20-flashSeconds)*48)>0
   ?stormStrength*.75:0;
 };
 return {update,dispose(){if(closed)return;closed=true;mesh.dispose();}};
}
