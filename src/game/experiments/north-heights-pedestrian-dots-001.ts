/** PED-001 stage 2: seven batched diagnostic states, zero per-agent meshes. */
import {Color3,Mesh,MeshBuilder,Scene,StandardMaterial} from "@babylonjs/core";
import type {NorthHeightsPedestrianSimulator001,PedAgent001,PedState001} from "./north-heights-pedestrian-simulator-001";
import {northHeightsGround} from "./north-heights-reconstruction-001";
const STATES=["depart","walk","park","wait","cross","arrive","inside"] as const satisfies readonly PedState001[];
const COLORS:Record<PedState001,string>={
 depart:"#FFFFFF",walk:"#30F06B",park:"#31A7FF",wait:"#FFE34A",
 cross:"#FF5252",arrive:"#C378FF",inside:"#888888",
};
export function createNorthHeightsPedestrianDots001(scene:Scene,maxCount=100){
 const meshes=new Map<PedState001,Mesh>();
 const buffers=new Map<PedState001,Float32Array>();
 const counts=new Map<PedState001,number>();
 for(const state of STATES){
   const mesh=MeshBuilder.CreateSphere("ped001-dot:"+state,{diameter:.7,segments:8},scene);
   const mat=new StandardMaterial("ped001-mat:"+state,scene);
   mat.disableLighting=true;mat.emissiveColor=Color3.FromHexString(COLORS[state]);
   mat.diffuseColor=mat.emissiveColor;mat.specularColor=Color3.Black();
   mesh.material=mat;mesh.isPickable=false;mesh.receiveShadows=false;
   mesh.alwaysSelectAsActiveMesh=true;
   const buffer=new Float32Array(maxCount*16);
   mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
   mesh.thinInstanceCount=0;mesh.setEnabled(false);
   meshes.set(state,mesh);buffers.set(state,buffer);counts.set(state,0);
 }
 return {
   update(sim:NorthHeightsPedestrianSimulator001,camera:{x:number;z:number},include?:(a:PedAgent001)=>boolean){
     for(const state of STATES)counts.set(state,0);
     let visible=0;
     for(const a of sim.agents){
       if(a.state==="inside"||(include&&!include(a)))continue;
       const dx=a.x-camera.x,dz=a.z-camera.z;
       if(dx*dx+dz*dz>270*270)continue;
       const n=counts.get(a.state)!,buffer=buffers.get(a.state)!;
       const offset=n*16;
       if(offset+16>buffer.length)continue;
       buffer.fill(0,offset,offset+16);
       buffer[offset]=1;buffer[offset+5]=1;buffer[offset+10]=1;buffer[offset+15]=1;
       buffer[offset+12]=a.x;
       buffer[offset+13]=northHeightsGround(a.x,a.z)+.20+.45;
       buffer[offset+14]=a.z;
       counts.set(a.state,n+1);visible++;
     }
     for(const state of STATES){
       const mesh=meshes.get(state)!,n=counts.get(state)!;
       mesh.thinInstanceCount=n;
       if(n>0)mesh.thinInstanceBufferUpdated("matrix");
       mesh.setEnabled(n>0);
     }
     return visible;
   },
   dispose(){
     for(const mesh of meshes.values()){mesh.material?.dispose();mesh.dispose(false,false);}
     meshes.clear();buffers.clear();counts.clear();
   },
 };
}
