/** Small unlabeled in-world i marker for the moving mission car.
 * Neither personal identity nor a moving map tracker. */
import {Color3,DynamicTexture,Mesh,MeshBuilder,Scene,StandardMaterial} from "@babylonjs/core";
export function createDianeCarMarker008(scene:Scene){
 const texture=new DynamicTexture("level001:car-marker-texture",{width:128,height:128},scene,true);
 texture.hasAlpha=true;
 const c=texture.getContext() as unknown as CanvasRenderingContext2D;
 c.clearRect(0,0,128,128);
 c.beginPath();c.arc(64,64,54,0,Math.PI*2);
 c.fillStyle="#172533";c.fill();c.lineWidth=7;c.strokeStyle="#fff";c.stroke();
 c.font="bold 80px Arial";c.fillStyle="#fff";c.textAlign="center";c.fillText("i",64,92);
 texture.update();
 const material=new StandardMaterial("level001:car-marker-mat",scene);
 material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;
 material.emissiveColor=Color3.White();material.disableLighting=true;
 material.backFaceCulling=false;
 const pin=MeshBuilder.CreatePlane("level001:car-marker",{width:.78,height:.78},scene);
 pin.material=material;pin.billboardMode=Mesh.BILLBOARDMODE_ALL;
 pin.isPickable=false;pin.setEnabled(false);
 return {
  update(car:{x:number;z:number},player:{x:number;z:number}|null,
   ground:(x:number,z:number)=>number,enabled:boolean){
   if(!enabled||!player||Math.hypot(player.x-car.x,player.z-car.z)>115){
    pin.setEnabled(false);return;
   }
   pin.position.set(car.x,ground(car.x,car.z)+3.1,car.z);
   pin.setEnabled(true);
  },
  dispose(){pin.dispose();material.dispose();texture.dispose();}
 };
}
