/** GEN-VEH-008: independent light-weight Babylon showroom.
 * No city simulation, Rapier, character, traffic dots or browser-time GLB import.
 * The source-native artifacts are generated offline by the accepted extractors.
 */
import {
 ArcRotateCamera,Color3,Color4,Engine,HemisphericLight,Mesh,MeshBuilder,
 Scene,StandardMaterial,TransformNode,Vector3,VertexData
} from "@babylonjs/core";
import type {GalleryVehicle008,GalleryVehicleId008} from "./vehicle-inspection-registry-008";

type Encoded008={p:string;n:string;i:string;indexBits:number;vertices:number;triangles:number};
type Wheel008={center:number[];radius:number;width:number;rim:Encoded008;tire:Encoded008};
type Source008={status:string;wheelsStatus:string;sourceTriangles:number;geometryTriangles:number;
 body:Record<string,Encoded008|null>|null;wheels:Record<string,Wheel008>|null};
type Perspective008="front"|"rear"|"left"|"right"|"top"|"threeQuarter";
export interface VehicleInspectionScene008 {
 show(model:GalleryVehicle008):Promise<string>;
 view(perspective:Perspective008):void;
 dispose():void;
}
const PARTS=["paint","glass","trim","frontLight","rearLight"] as const;
const CORNERS=["frontLeft","frontRight","rearLeft","rearRight"] as const;
const PALETTE:Record<string,string>={
 glass:"#344C5A",trim:"#272B32",frontLight:"#E8E8D9",rearLight:"#BD343B"
};
function decode008(encoded:Encoded008){
 const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
 const positions=Array.from(new Int16Array(bytes(encoded.p)),n=>n/1000);
 const normals=Array.from(new Int8Array(bytes(encoded.n)),n=>n/127);
 const ibuf=bytes(encoded.i);
 const indices=encoded.indexBits===32?Array.from(new Uint32Array(ibuf)):Array.from(new Uint16Array(ibuf));
 if(positions.length/3!==encoded.vertices||normals.length!==positions.length||
   indices.length/3!==encoded.triangles)throw Error("Invalid native source buffer");
 return {positions,normals,indices};
}
function sourceMesh008(scene:Scene,name:string,encoded:Encoded008){
 const mesh=new Mesh(name,scene),data=new VertexData(),g=decode008(encoded);
 data.positions=g.positions;data.normals=g.normals;data.indices=g.indices;
 data.applyToMesh(mesh);mesh.receiveShadows=false;return mesh;
}
export function createVehicleInspectionScene008(canvas:HTMLCanvasElement):VehicleInspectionScene008{
 const engine=new Engine(canvas,true,{stencil:false,preserveDrawingBuffer:false},true);
 engine.setHardwareScalingLevel(Math.max(1,(typeof window==="undefined"?1:window.devicePixelRatio)/1.6));
 const scene=new Scene(engine);
 scene.clearColor=new Color4(.055,.075,.105,1);
 const camera=new ArcRotateCamera("gallery-orbit",-Math.PI/4,Math.PI*.40,9.0,new Vector3(0,1,0),scene);
 camera.lowerBetaLimit=.13;camera.upperBetaLimit=Math.PI*.71;
 camera.lowerRadiusLimit=3.4;camera.upperRadiusLimit=16;camera.wheelPrecision=35;
 camera.panningSensibility=0;camera.attachControl(canvas,true);
 const ambient=new HemisphericLight("gallery-studio-light",new Vector3(.3,1,.2),scene);
 ambient.intensity=1.45;
 const floor=MeshBuilder.CreateGround("gallery-floor",{width:35,height:35},scene);
 const floorMat=new StandardMaterial("gallery-floor-mat",scene);
 floorMat.diffuseColor=Color3.FromHexString("#26303A");
 floorMat.specularColor=Color3.FromHexString("#242E33");
 floor.material=floorMat;floor.position.y=-.025;floor.isPickable=false;
 const resize=()=>engine.resize();
 window.addEventListener("resize",resize);
 engine.runRenderLoop(()=>{if(!scene.isDisposed())scene.render();});
 let closed=false,version=0,controller:AbortController|null=null;
 let current:TransformNode|null=null,materials:StandardMaterial[]=[];
 const teardown=()=>{
   current?.dispose(false,false);current=null;
   for(const material of materials)material.dispose();
   materials=[];
 };
 const createMaterial=(part:string,paint:string)=>{
   const material=new StandardMaterial("gallery-mat:"+part,scene);
   material.diffuseColor=Color3.FromHexString(part==="paint"?paint:
     part==="tire"?"#11151A":part==="rim"?"#8E969E":PALETTE[part]??"#555C62");
   material.specularColor=Color3.FromHexString(part==="glass"?"#9BAFC1":"#454A51");
   material.specularPower=part==="glass"?72:36;
   material.backFaceCulling=false;
   if(part==="glass")material.alpha=.78;
   if(part==="frontLight"||part==="rearLight")
     material.emissiveColor=material.diffuseColor.scale(.35);
   materials.push(material);return material;
 };
 const assign=(mesh:Mesh,part:string,paint:string,root:TransformNode)=>{
   mesh.parent=root;mesh.material=createMaterial(part,paint);mesh.isPickable=false;return mesh;
 };
 async function buildSeven(model:GalleryVehicle008,root:TransformNode,signal:AbortSignal){
   const response=await fetch("/vehicle-gallery/"+model.id+".json",{signal});
   if(!response.ok)throw Error("Missing generated review asset: "+response.status);
   const source=await response.json() as Source008;
   if(source.status!=="source"||!source.body)
     throw Error("Source extraction unqualified: "+source.status);
   let count=0,wheelCount=0;
   for(const part of PARTS){
     const encoded=source.body[part];
     if(encoded&&encoded.triangles>0){
       assign(sourceMesh008(scene,"gallery:"+model.id+":"+part,encoded),part,model.paint,root);
       count+=encoded.triangles;
     }
   }
   if(source.wheels){
     for(const corner of CORNERS){
       const wheel=source.wheels[corner];
       if(!wheel)continue;
       for(const part of ["tire","rim"] as const){
         const mesh=assign(sourceMesh008(scene,"gallery:"+model.id+":"+corner+":"+part,wheel[part]),part,model.paint,root);
         mesh.position.set(wheel.center[0]??0,wheel.center[1]??0,wheel.center[2]??0);
         wheelCount++;
       }
     }
   }
   return "SOURCE GEOMETRY // "+count.toLocaleString()+" body triangles // "+wheelCount+"/8 source wheel parts"+
      (wheelCount<8?" // wheel fit pending":"");
 }
 async function buildAccepted(model:GalleryVehicle008,root:TransformNode){
   // Import the separate accepted source builders only when an accepted
   // reference model is selected. Do not preload this geometry on the launcher.
   const library=await import("./native-vehicle-geometry-001");
   for(const part of PARTS){
     const mesh=model.id==="rover"
       ?library.createRoverSourceMesh005(scene,"gallery:rover:"+part,part)
       :library.createTemerarioSourceMesh002(scene,"gallery:temerario:"+part,part);
     assign(mesh,part,model.paint,root);
   }
   for(const corner of CORNERS){
     const fit=model.id==="rover"
       ?library.getRoverWheelFit005(corner)
       :library.getTemerarioWheelFit003(corner);
     for(const part of ["tire","rim"] as const){
       const mesh=model.id==="rover"
         ?library.createRoverWheelMesh005(scene,"gallery:rover:"+corner+":"+part,corner,part)
         :library.createTemerarioWheelMesh003(scene,"gallery:temerario:"+corner+":"+part,corner,part);
       assign(mesh,part,model.paint,root);
       mesh.position.set(fit.center[0]??0,fit.center[1]??0,fit.center[2]??0);
     }
   }
   return "LOCKED GEN-VEH ACCEPTED SOURCE REFERENCE // source-native geometry";
 }
 function view(perspective:Perspective008){
   const angles:Record<Perspective008,[number,number]>={
     front:[Math.PI/2,Math.PI*.46],rear:[-Math.PI/2,Math.PI*.46],
     left:[0,Math.PI*.48],right:[Math.PI,Math.PI*.48],
     top:[Math.PI/2,.19],threeQuarter:[Math.PI/4,Math.PI*.39]
   };
   const [alpha,beta]=angles[perspective];camera.alpha=alpha;camera.beta=beta;
   camera.radius=9;camera.setTarget(new Vector3(0,1,0));
 }
 return {
   async show(model){
     const currentVersion=++version;
     controller?.abort();controller=new AbortController();
     teardown();
     if(closed)throw Error("Vehicle gallery disposed");
     const root=new TransformNode("gallery-review:"+model.id,scene);
     current=root;
     view("threeQuarter");
     try{
       const info=model.id==="rover"||model.id==="temerario"
         ?await buildAccepted(model,root)
         :await buildSeven(model,root,controller.signal);
       if(closed||currentVersion!==version)return "REVIEW SWITCHED";
       return info;
     }catch(error){
       if(!closed&&currentVersion===version)teardown();
       throw error;
     }
   },
   view,
   dispose(){
     closed=true;version++;controller?.abort();
     window.removeEventListener("resize",resize);
     engine.stopRenderLoop();teardown();scene.dispose();engine.dispose();
   }
 };
}
