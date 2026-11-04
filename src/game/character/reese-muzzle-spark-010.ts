/** POI-010: bounded procedural muzzle sparks; no GLB, textures or bullets. */
import {Color3,MeshBuilder,StandardMaterial,Vector3,type Scene} from "@babylonjs/core";
export function createReeseMuzzleSpark010(scene:Scene){
 const material=new StandardMaterial("poi010-muzzle-emissive",scene);
 material.disableLighting=true;material.emissiveColor=new Color3(1,.72,.18);
 material.diffuseColor=new Color3(1,.92,.55);material.alpha=.96;
 const pool=Array.from({length:10},(_,i)=>{
  const core=MeshBuilder.CreateSphere("poi010-muzzle-core-"+i,{diameter:.13,segments:5},scene);
  const streak=MeshBuilder.CreateCylinder("poi010-muzzle-streak-"+i,
   {height:.24,diameterTop:0,diameterBottom:.07,tessellation:5},scene);
  core.material=material;streak.material=material;
  core.isPickable=false;streak.isPickable=false;core.isVisible=false;streak.isVisible=false;
  return {core,streak,life:0};
 });
 let cursor=0,emitted=0;
 const clear=()=>{for(const a of pool){a.life=0;a.core.isVisible=false;a.streak.isVisible=false;}};
 return {
  emit(origin:Vector3,heading:number){
   const a=pool[cursor++%pool.length]!;
   a.life=.10;a.core.position.copyFrom(origin);
   a.streak.position.set(origin.x+Math.sin(heading)*.10,origin.y,origin.z+Math.cos(heading)*.10);
   a.streak.rotation.set(Math.PI/2,heading,0);a.core.scaling.setAll(1);a.streak.scaling.setAll(1);
   a.core.isVisible=true;a.streak.isVisible=true;emitted++;
  },
  update(dt:number){for(const a of pool){
    if(a.life<=0)continue;a.life=Math.max(0,a.life-Math.max(0,dt));
    const s=Math.max(.01,a.life/.1);a.core.scaling.setAll(s);a.streak.scaling.setAll(s);
    if(a.life===0){a.core.isVisible=false;a.streak.isVisible=false;}
  }},
  clear,get emitted(){return emitted;},
  dispose(){clear();for(const a of pool){a.core.dispose();a.streak.dispose();}material.dispose();},
 };
}
