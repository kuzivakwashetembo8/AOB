/** LVL-001 world-space identity nameplate, never shown on the city map. */
import {Color3,DynamicTexture,Mesh,MeshBuilder,Scene,StandardMaterial} from "@babylonjs/core";
import {DIANE_NAME_001,DIANE_FICTIONAL_SSN_001,type DianeMissionView001} from "./level001-diane-007";
export function createDianeWorldLabel001(scene:Scene){
 const texture=new DynamicTexture("level001:diane-identity-texture",
  {width:512,height:128},scene,true);
 texture.hasAlpha=true;
 const ctx=texture.getContext() as unknown as CanvasRenderingContext2D;
 ctx.clearRect(0,0,512,128);
 ctx.fillStyle="rgba(15,22,31,.84)";ctx.fillRect(14,8,484,112);
 ctx.strokeStyle="rgba(240,244,250,.45)";ctx.lineWidth=3;ctx.strokeRect(14,8,484,112);
 ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="bold 43px Arial";
 ctx.fillText(DIANE_NAME_001,256,59);
 ctx.fillStyle="#d4dfeb";ctx.font="30px Arial";
 ctx.fillText("SSN: "+DIANE_FICTIONAL_SSN_001,256,101);
 texture.update();
 const material=new StandardMaterial("level001:diane-nameplate-material",scene);
 material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;
 material.emissiveColor=Color3.White();material.disableLighting=true;
 material.backFaceCulling=false;
 const plane=MeshBuilder.CreatePlane("level001:diane-nameplate",{width:2.5,height:.63},scene);
 plane.material=material;plane.billboardMode=Mesh.BILLBOARDMODE_ALL;
 plane.isPickable=false;plane.setEnabled(false);
 return {
  update(target:{x:number;z:number},player:{x:number;z:number}|null,
   ground:(x:number,z:number)=>number,stage:DianeMissionView001["phase"]){
   const visible=(stage==="find"||stage==="follow")&&!!player&&
    Math.hypot(player.x-target.x,player.z-target.z)<27;
   if(!visible){plane.setEnabled(false);return;}
   plane.position.set(target.x,ground(target.x,target.z)+2.27,target.z);
   plane.setEnabled(true);
  },
  dispose(){plane.dispose();material.dispose();texture.dispose();},
 };
}
