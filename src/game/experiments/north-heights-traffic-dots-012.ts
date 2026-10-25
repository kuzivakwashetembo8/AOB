/** NH-012 — batched and purely diagnostic visual representation of autonomous traffic.
 * Exactly four Babylon master meshes, NO per-agent mesh, model, shadow or collider. */
import {Color3,Mesh,MeshBuilder,Scene,StandardMaterial} from "@babylonjs/core";
import type {NH012MotionState,NH012TrafficSnapshot} from "@/game/traffic/nh012-traffic-simulator";
import {northHeightsGround} from "./north-heights-reconstruction-001";

const STATES=["moving","braking","stopped","turning"] as const satisfies readonly NH012MotionState[];
const COLORS:Record<NH012MotionState,string>={
 moving:"#13E9D0",braking:"#FFC247",stopped:"#FA414F",turning:"#B66CFC",
};
export interface NH012Dots {update(snapshot:NH012TrafficSnapshot,camera:{x:number;z:number}):number;dispose():void;}
export function createNorthHeightsTrafficDots012(scene:Scene,maxCount=125):NH012Dots{
 const masters=new Map<NH012MotionState,Mesh>();
 const scratch=new Map<NH012MotionState,Float32Array>();
 const counts=new Map<NH012MotionState,number>();
 for(const state of STATES){
   const mesh=MeshBuilder.CreateSphere("nh012-traffic-dot:"+state,{diameter:1.05,segments:8},scene);
   const material=new StandardMaterial("nh012-traffic-dot-mat:"+state,scene);
   material.disableLighting=true;
   material.emissiveColor=Color3.FromHexString(COLORS[state]);
   material.diffuseColor=material.emissiveColor;
   material.specularColor=Color3.Black();
   mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=false;
   mesh.alwaysSelectAsActiveMesh=true;
   // Give each category an invisible initial buffer, never show the master at origin.
   // A fixed-capacity *dynamic* GPU instance buffer avoids reallocating it
   // for every frame, including when the state currently has zero vehicles.
   const matrices=new Float32Array(maxCount*16);
   mesh.thinInstanceSetBuffer("matrix",matrices,16,false);
   mesh.thinInstanceCount=0;
   mesh.setEnabled(false);
   masters.set(state,mesh);scratch.set(state,matrices);counts.set(state,0);
 }
 return {
   update(snapshot,camera){
     for(const state of STATES)counts.set(state,0);
     let countVisible=0;
     for(const a of snapshot.agents){
       // Distant dots do not consume per-agent Babylon Mesh objects.
       // Depth testing still hides cars behind buildings.
       const dx=a.x-camera.x,dz=a.z-camera.z;
       if(dx*dx+dz*dz>270*270)continue;
       const state=a.state;
       const n=counts.get(state)??0;
       const array=scratch.get(state)!;
       const offset=n*16;
       if(offset+16>array.length)continue;
       array.fill(0,offset,offset+16);
       // Babylon column-major world translation; scale master diameter by 1.2.
       array[offset]=1.2;array[offset+5]=1.2;array[offset+10]=1.2;array[offset+15]=1;
       array[offset+12]=a.x;
       array[offset+13]=northHeightsGround(a.x,a.z)+.075+.46;
       array[offset+14]=a.z;
       counts.set(state,n+1);countVisible++;
     }
     for(const state of STATES){
       const mesh=masters.get(state)!;
       const n=counts.get(state)!;
       mesh.thinInstanceCount=n;
       if(n>0)mesh.thinInstanceBufferUpdated("matrix");
       mesh.setEnabled(n>0);
     }
     return countVisible;
   },
   dispose(){
     for(const mesh of masters.values()){
       mesh.material?.dispose();mesh.dispose(false,false);
     }
     masters.clear();scratch.clear();counts.clear();
   },
 };
}
