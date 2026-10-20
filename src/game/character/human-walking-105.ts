/**
 * GTD-CHAR-105: reversible lightweight mesh-space posture for imported
 * character.glb models without reliable animation clips or armature names.
 * Three poses are cached once. No new geometry, physics body, or GLB import.
 * Deform only the imported human, never the accepted UAL humanoid.
 */
import {Matrix,Mesh,Vector3,VertexBuffer} from "@babylonjs/core";
export type HumanBounds={cx:number;bottom:number;height:number};
export type HumanPosePoint={x:number;y:number;z:number};
export type HumanPosePhase="idle"|"left"|"right";
const smooth=(a:number,b:number,x:number)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};
export function posturePoint105(p:HumanPosePoint,b:HumanBounds,phase:HumanPosePhase):HumanPosePoint{
 const h=b.height,relativeY=(p.y-b.bottom)/h;
 const side=p.x<b.cx?-1:1;
 const sx=b.cx+side*.19*h,sy=b.bottom+.79*h;
 let x=p.x,y=p.y,z=p.z;
 // Bring T-pose arms down at the sides, blending through the shoulder joint.
 if(relativeY>.52){
   const outward=side*(p.x-sx)/h;
   const w=smooth(.015,.16,outward)*smooth(.52,.63,relativeY);
   if(w>0){
     const angle=-side*1.43;
     const dx=p.x-sx,dy=p.y-sy;
     const ax=sx+Math.cos(angle)*dx-Math.sin(angle)*dy;
     const ay=sy+Math.sin(angle)*dx+Math.cos(angle)*dy;
     x+=(ax-p.x)*w;
     y+=(ay-p.y)*w;
     if(phase!=="idle")z+=w*(side*(phase==="left"?1:-1))*.06*h;
   }
 }
 // Walking test: advance alternating legs around hip (no vehicle/flying pose).
 if(phase!=="idle"&&relativeY<.47){
   const hip=b.bottom+.45*h;
   const legWeight=1-smooth(.34,.48,relativeY);
   const sign=p.x<b.cx?-1:1;
   const angle=(phase==="left"?1:-1)*sign*.28*legWeight;
   const dy=p.y-hip;
   z+=Math.sin(angle)*dy;
   y+=(Math.cos(angle)-1)*dy;
 }
 return {x,y,z};
}
export interface HumanDeformer105 {
 readonly meshCount:number;
 readonly vertexCount:number;
 setWalking(walking:boolean,dt:number):void;
 dispose():void;
}
type PoseMesh={mesh:Mesh;idle:Float32Array;left:Float32Array;right:Float32Array;output:Float32Array};
export function createHumanDeformer105(meshes:readonly Mesh[]):HumanDeformer105{
 const visible=meshes.filter(m=>m.getTotalVertices()>0&&m.isVerticesDataPresent(VertexBuffer.PositionKind));
 const bb=visible.map(m=>{m.computeWorldMatrix(true);return m.getBoundingInfo().boundingBox;});
 const bounds={
   cx:(Math.min(...bb.map(b=>b.minimumWorld.x))+Math.max(...bb.map(b=>b.maximumWorld.x)))/2,
   bottom:Math.min(...bb.map(b=>b.minimumWorld.y)),
   height:Math.max(...bb.map(b=>b.maximumWorld.y))-Math.min(...bb.map(b=>b.minimumWorld.y)),
 };
 if(!visible.length||!Number.isFinite(bounds.height)||bounds.height<=0)
   throw new Error("CHAR-105 human source has no usable position geometry");
 const parts:PoseMesh[]=[];
 let vertexCount=0;
 for(const mesh of visible){
   const original=mesh.getVerticesData(VertexBuffer.PositionKind);
   if(!original?.length)continue;
   // Cloning geometry before changing buffers protects any shared GLB source.
   mesh.makeGeometryUnique();
   const world=mesh.getWorldMatrix().clone(),inverse=Matrix.Invert(world);
   const idle=new Float32Array(original.length);
   const left=new Float32Array(original.length);
   const right=new Float32Array(original.length);
   const source=new Vector3(),global=new Vector3(),loc=new Vector3();
   for(let i=0;i<original.length;i+=3){
     source.set(original[i]!,original[i+1]!,original[i+2]!);
     Vector3.TransformCoordinatesToRef(source,world,global);
     for(const [name,destination] of [["idle",idle],["left",left],["right",right]] as const){
       const v=posturePoint105(global,bounds,name);
       source.set(v.x,v.y,v.z);
       Vector3.TransformCoordinatesToRef(source,inverse,loc);
       destination[i]=loc.x;destination[i+1]=loc.y;destination[i+2]=loc.z;
     }
   }
   const output=idle.slice();
   mesh.setVerticesData(VertexBuffer.PositionKind,output,true);
   mesh.refreshBoundingInfo();
   vertexCount+=original.length/3;
   parts.push({mesh,idle,left,right,output});
 }
 let time=0,lastState="idle",cadence=0;
 return {
   meshCount:parts.length,vertexCount,
   setWalking(walking,dt){
     time+=Math.max(0,Math.min(dt,.1));
     cadence+=dt;
     if(!walking&&lastState==="idle")return;
     if(walking&&cadence<.09)return;
     cadence=0;
     const t=walking?(Math.sin(time*9)+1)/2:0;
     for(const part of parts){
       const {idle,left,right,output}=part;
       if(walking)for(let i=0;i<output.length;i++)
         output[i]=left[i]!*(1-t)+right[i]!*t;
       else output.set(idle);
       part.mesh.updateVerticesData(VertexBuffer.PositionKind,output,false,false);
     }
     lastState=walking?"walking":"idle";
   },
   dispose(){parts.length=0;},
 };
}
