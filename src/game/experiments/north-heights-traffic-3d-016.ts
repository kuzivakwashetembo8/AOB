/** NH-016 no-dot rendering floor.
 * 125 NH-012 logical vehicles stay 125 vehicles at ALL distances and during
 * authentic GLB loading/failure. These are small, recognizable 3D LOD
 * silhouettes, batched with Babylon thin instances, NOT diagnostic spheres.
 * Close originals are drawn instead by NH-013..016's genuine GLB renderers.
 */
import {
 Color3,Matrix,Mesh,MeshBuilder,Quaternion,Scene,StandardMaterial,Vector3,
} from "@babylonjs/core";
import type {NH012TrafficSnapshot} from "@/game/traffic/nh012-traffic-simulator";
import {createGTDGeneratedVehicleMesh001,createTemerarioSourceMesh002,
 createTemerarioWheelMesh003,getTemerarioWheelFit003,generatedWheelRadius001,
 createTemerarioRimFaceOverlay007,
 createRoverSourceMesh005,createRoverWheelMesh005,getRoverWheelFit005,
 type GTDRoverSourcePart005,type GTDRoverCorner005,type GTDRoverWheelPart005,
 type GTDTemerarioWheelCorner003,type GTDTemerarioWheelPart003
} from "@/game/vehicles/native-vehicle-geometry-001";
import {
 SEVEN_TRAFFIC_MODELS_007,hasNativeBody007,hasNativeWheels007,hasSourcePart007,
 createNativeBodyPart007,createNativeWheel007,sourceWheelFit007,
 type SevenSourceModel007,type SevenSourceBody007,type SevenSourceCorner007,type SevenSourceWheelPart007
} from "@/game/vehicles/native-seven-vehicle-007";
import {MERCER_EXTRA_GLB_SPECS} from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013} from "@/game/vehicles/nh013-traffic-turn-steering";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {northHeightsGround} from "./north-heights-reconstruction-001";
import {NH016_CLASS,NH016_FLEET_SET,fleetPaint016,
 type NH016FleetVisualClass} from "@/game/traffic/nh016-fleet-manifest";

type Bucket={mesh:Mesh;buffer:Float32Array;count:number};
type WorldPart={x:number;y:number;z:number;w:number;h:number;d:number};
type Spec={length:number;width:number;height:number;style:NH016FleetVisualClass|"sedan"|"hatch"|"taxi"|"kango"};
export interface NH016Traffic3D {
 update(snapshot:NH012TrafficSnapshot,exclude:ReadonlySet<string>):{
   vehicles3D:number;sourceGLBs:number;lowDetail:number;defaultFleet:number;dots:0;
 };
 dispose():void;
}
const bodyDims=new Map(MERCER_EXTRA_GLB_SPECS.map(s=>[s.id,{
 length:s.length,width:s.width,height:s.height,style:NH016_CLASS[s.id as keyof typeof NH016_CLASS],
}]));
const sedans:Spec={length:4.75,width:1.85,height:1.55,style:"sedan"};
const hatchbacks:Spec={length:4.35,width:1.78,height:1.60,style:"hatch"};
const taxis:Spec={length:4.5,width:1.85,height:1.90,style:"taxi"};
const kango:Spec={length:4.45,width:1.85,height:1.88,style:"kango"};
export function trafficProxySpec016(model:string):Spec{
 if(model==="gtd-traffic-sedan-013")return sedans;
 if(model==="gtd-traffic-hatchback-013")return hatchbacks;
 if(model==="gtd-traffic-taxi-014")return taxis;
 if(model==="gtd-traffic-kango-015")return kango;
 const found=bodyDims.get(model);
 if(!found||!found.style)throw Error("NH016 unknown traffic model "+model);
 return found;
}
function makeBucket(scene:Scene,key:string,color:string,shape:"box"|"wheel"|"body"|"glass"|"trim"|"frontLight"|"rearLight",spec?:Spec,capacity=125*6):Bucket{
 const mesh=(shape==="trim"||shape==="frontLight"||shape==="rearLight")
  ?createTemerarioSourceMesh002(scene,"gtd-lambo:"+key,shape)
  :(shape==="body"||shape==="glass")
    ?createGTDGeneratedVehicleMesh001(scene,"gtd-native:"+key,spec!,shape)
  :shape==="box"
    ?MeshBuilder.CreateBox("nh016:"+key,{size:1},scene)
    :MeshBuilder.CreateCylinder("nh016:"+key,{diameter:1,height:1,tessellation:12},scene);
 const material=new StandardMaterial("nh016:mat:"+key,scene);
 material.diffuseColor=Color3.FromHexString(color);
 material.specularColor=Color3.FromHexString("#17191C");
 if(key==="front-light"||key==="rear-light"){
   material.disableLighting=true;material.emissiveColor=Color3.FromHexString(color);
 }
 if(shape==="body"||shape==="glass"||shape==="trim"||shape==="frontLight"||shape==="rearLight")
   material.backFaceCulling=false;
 mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=false;
 mesh.alwaysSelectAsActiveMesh=true;
 const buffer=new Float32Array(capacity*16);
 mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
 mesh.thinInstanceCount=0;mesh.setEnabled(false);
 return {mesh,buffer,count:0};
}
const up=Vector3.Up(),right=Vector3.Right(),forward=Vector3.Forward();
const axle=Quaternion.RotationAxis(forward,Math.PI/2);
function matrix(part:WorldPart,world:Matrix,orientation=Quaternion.Identity()):Matrix{
 return Matrix.Compose(new Vector3(part.w,part.h,part.d),orientation,
   new Vector3(part.x,part.y,part.z)).multiply(world);
}
export function createNorthHeightsTraffic3D016(scene:Scene,graph:TrafficGraph012):NH016Traffic3D{
 const buckets=new Map<string,Bucket>();
 // The body is tinted per-model/paint; four shared detail materials across all
 // 125 meshes limit drawcalls. No per-agent Babylon mesh objects.
 function get(key:string,color:string,shape:"box"|"wheel"|"body"|"glass"|"trim"|"frontLight"|"rearLight"="box",spec?:Spec){
   let b=buckets.get(key);
   if(!b){b=makeBucket(scene,key,color,shape,spec);buckets.set(key,b);}
   return b;
 }
 // Source wheel pivots come from actual Draco WHL_ nodes, not the generic
 // 59%-length/81%-width proxy. Shares source templates across all instances.
 const sourcedWheel=(corner:GTDTemerarioWheelCorner003,part:GTDTemerarioWheelPart003)=>{
   const key="temerario:wheel:"+corner+":"+part;
   let b=buckets.get(key);
   if(b)return b;
   const mesh=createTemerarioWheelMesh003(scene,key,corner,part);
   const mat=new StandardMaterial("mat:"+key,scene);
   mat.diffuseColor=Color3.FromHexString(part==="tire"?"#101215":"#656A73");
   mat.specularColor=Color3.FromHexString(part==="tire"?"#060709":"#B0B5BF");
   mat.emissiveColor=Color3.FromHexString(part==="tire"?"#000000":"#272B30");
   mat.specularPower=part==="tire"?18:76;
   mat.backFaceCulling=false;
   mesh.material=mat;mesh.alwaysSelectAsActiveMesh=true;
   mesh.receiveShadows=false;mesh.isPickable=false;
   const buffer=new Float32Array(125*6*16);
   mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
   mesh.thinInstanceCount=0;mesh.setEnabled(false);
   b={mesh,buffer,count:0};buckets.set(key,b);
   return b;
 };
 // Range Rover Sport owns original reconstructed body and wheels ONLY.
 const roverPart=(part:GTDRoverSourcePart005,color:string)=>{
  const key="rover:body:"+part+":"+(part==="paint"?color:"std");
  let b=buckets.get(key);if(b)return b;
  const mesh=createRoverSourceMesh005(scene,key,part);
  const mat=new StandardMaterial("mat:"+key,scene);
  mat.diffuseColor=Color3.FromHexString(color);
  mat.specularColor=Color3.FromHexString(part==="paint"?"#535A62":"#283039");
  if(part==="frontLight"||part==="rearLight")mat.emissiveColor=Color3.FromHexString(color).scale(.5);
  mat.backFaceCulling=false;mesh.material=mat;
  mesh.isPickable=false;mesh.receiveShadows=false;mesh.alwaysSelectAsActiveMesh=true;
  const buffer=new Float32Array(125*6*16);
  mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
  mesh.thinInstanceCount=0;mesh.setEnabled(false);
  b={mesh,buffer,count:0};buckets.set(key,b);return b;
 };
 const roverWheel=(corner:GTDRoverCorner005,part:GTDRoverWheelPart005)=>{
  const key="rover:wheel:"+corner+":"+part;
  let b=buckets.get(key);if(b)return b;
  const mesh=createRoverWheelMesh005(scene,key,corner,part);
  const mat=new StandardMaterial("mat:"+key,scene);
  mat.diffuseColor=Color3.FromHexString(part==="tire"?"#121417":"#737983");
  mat.specularColor=Color3.FromHexString(part==="tire"?"#0B0D0F":"#B6BCC8");
  mat.emissiveColor=Color3.FromHexString(part==="tire"?"#000000":"#282B30");
  mat.backFaceCulling=false;mesh.material=mat;
  mesh.isPickable=false;mesh.receiveShadows=false;mesh.alwaysSelectAsActiveMesh=true;
  const buffer=new Float32Array(125*6*16);
  mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
  mesh.thinInstanceCount=0;mesh.setEnabled(false);
  b={mesh,buffer,count:0};buckets.set(key,b);return b;
 };
 // Seven additional source-derived vehicle families, one native template
 // per material and paint variant. Wheel templates stay separate so all four
 // wheels rotate with actual source axles. No GLB URL or async LOD transition.
 const sevenBody=(model:SevenSourceModel007,part:SevenSourceBody007,color:string)=>{
   const key="seven:"+model+":body:"+part+":"+(part==="paint"?color:"standard");
   let b=buckets.get(key);if(b)return b;
   const mesh=createNativeBodyPart007(scene,key,model,part);
   const mat=new StandardMaterial("mat:"+key,scene);
   mat.diffuseColor=Color3.FromHexString(color);
   mat.specularColor=Color3.FromHexString(part==="paint"?"#444B54":"#363C43");
   if(part==="frontLight"||part==="rearLight")
     mat.emissiveColor=Color3.FromHexString(color).scale(.43);
   mat.backFaceCulling=false;mesh.material=mat;
   mesh.receiveShadows=false;mesh.isPickable=false;mesh.alwaysSelectAsActiveMesh=true;
   const buffer=new Float32Array(125*6*16);
   mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
   mesh.thinInstanceCount=0;mesh.setEnabled(false);
   b={mesh,buffer,count:0};buckets.set(key,b);return b;
 };
 const sevenWheel=(model:SevenSourceModel007,corner:SevenSourceCorner007,
   part:SevenSourceWheelPart007)=>{
   const key="seven:"+model+":wheel:"+corner+":"+part;
   let b=buckets.get(key);if(b)return b;
   const mesh=createNativeWheel007(scene,key,model,corner,part);
   const mat=new StandardMaterial("mat:"+key,scene);
   mat.diffuseColor=Color3.FromHexString(part==="tire"?"#121417":"#767B82");
   mat.specularColor=Color3.FromHexString(part==="tire"?"#090A0D":"#9EA5AE");
   mat.emissiveColor=Color3.FromHexString(part==="tire"?"#000000":"#1B1F23");
   mat.backFaceCulling=false;mesh.material=mat;
   mesh.receiveShadows=false;mesh.isPickable=false;mesh.alwaysSelectAsActiveMesh=true;
   const buffer=new Float32Array(125*6*16);
   mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
   mesh.thinInstanceCount=0;mesh.setEnabled(false);
   b={mesh,buffer,count:0};buckets.set(key,b);return b;
 };
 // Thin-instance, radius-normalized 10-spoke fallback for mobile rim face.
 // The accepted source rims remain under this sparse metal geometry.
 const spokeRim=()=>{
   const key="temerario:spoke-face:0032";
   let b=buckets.get(key);if(b)return b;
   const mesh=createTemerarioRimFaceOverlay007(scene,key);
   const mat=new StandardMaterial("mat:"+key,scene);
   mat.diffuseColor=Color3.FromHexString("#737D89");
   mat.emissiveColor=Color3.FromHexString("#313942");
   mat.specularColor=Color3.FromHexString("#C5CDD6");
   mat.specularPower=84;mat.backFaceCulling=false;mesh.material=mat;
   mesh.isPickable=false;mesh.receiveShadows=false;mesh.alwaysSelectAsActiveMesh=true;
   const buffer=new Float32Array(125*6*16);
   mesh.thinInstanceSetBuffer("matrix",buffer,16,false);
   mesh.thinInstanceCount=0;mesh.setEnabled(false);
   b={mesh,buffer,count:0};buckets.set(key,b);return b;
 };
 const tires=get("rubber","#171B20","wheel"),
   alloys=get("rims","#ADB4BD","wheel"),
   wheelSpoke=get("moving-wheel-spoke","#ECEDEF"),
   headlights=get("front-light","#F3F0D9"),
   taillights=get("rear-light","#B93335");
 function reviewOnlySevenNative008(_modelId:string):SevenSourceModel007|undefined{
   // Preserve the renderer wiring for later individual promotion, but
   // never silently render incomplete GEN-VEH-007 shells in live traffic.
   return undefined;
 }
 const last=new Map<string,{x:number;z:number;spin:number;tick:number}>();
 let updatedTick=-1;
 let lastReport={vehicles3D:0,sourceGLBs:0,lowDetail:0,defaultFleet:0,dots:0 as const};
 function write(b:Bucket,m:Matrix){
   const start=b.count*16;
   if(start+16>b.buffer.length)throw Error("NH016 125-agent proxy capacity exceeded "+b.mesh.name);
   m.copyToArray(b.buffer,start);
   b.count++;
 }
 return {
   update(snapshot,exclude){
     // All traffic visuals are native; no camera-dependent import or LOD swap.
     // Reuse the GPU transforms between NH-012 simulation ticks.
     if(snapshot.tick===updatedTick)return lastReport;
     updatedTick=snapshot.tick;
     for(const b of buckets.values())b.count=0;
     let defaultFleet=0,lowDetail=0;
     for(const a of snapshot.agents){
       const own=NH016_FLEET_SET.has(a.modelId);
       if(own)defaultFleet++;
       if(exclude.has(a.id))continue;
       lowDetail++;
       const spec=trafficProxySpec016(a.modelId);
       const base=own?a.paintId:
         a.modelId==="gtd-traffic-kango-015"?"CHAMPAGNE":
         a.modelId==="gtd-traffic-taxi-014"?"WHITE":a.paintId;
       const paint=fleetPaint016(base);
       const isRover=a.modelId==="gtd-veh006-mercer-range-rover";
       // GEN-VEH-008: the rejected seven-vehicle extraction batch is review
       // only until each model earns separate owner approval in /vehicles.
       // Render the earlier safe native silhouettes in active North Heights.
       const sevenModel=reviewOnlySevenNative008(a.modelId);
       const nativeBody=!!sevenModel&&hasNativeBody007(sevenModel);
       const nativeWheels=!!sevenModel&&hasNativeWheels007(sevenModel);
       const frontFit=nativeWheels?sourceWheelFit007(sevenModel!,"frontLeft"):null;
       const rearFit=nativeWheels?sourceWheelFit007(sevenModel!,"rearLeft"):null;
       const rightFit=nativeWheels?sourceWheelFit007(sevenModel!,"frontRight"):null;
       const contactLength=frontFit&&rearFit?
         Math.abs((frontFit.center[2]??0)-(rearFit.center[2]??0)):spec.length*.59;
       const contactTrack=frontFit&&rightFit?
         Math.abs((frontFit.center[0]??0)-(rightFit.center[0]??0)):spec.width*.81;
       const road=sampleTrafficVehicleRoadPose013({
         x:a.x,z:a.z,heading:a.heading,wheelbase:contactLength,
         track:contactTrack,ground:northHeightsGround,
       });
       const world=Matrix.Compose(Vector3.One(),road.rotation,
         new Vector3(a.x,road.y,a.z));
       if(isRover){
        write(roverPart("paint",paint),world);
        write(roverPart("glass","#263D4C"),world);
        write(roverPart("trim","#252A30"),world);
        write(roverPart("frontLight","#DDE2E6"),world);
        write(roverPart("rearLight","#BF363B"),world);
       }else if(sevenModel&&nativeBody){
        for(const [part,color] of [
          ["paint",paint],["glass","#263D4C"],["trim","#282D32"],
          ["frontLight","#E4E5E7"],["rearLight","#B52B34"]
        ] as const){
          if(hasSourcePart007(sevenModel,part))
            write(sevenBody(sevenModel,part,color),world);
        }
       }else{
        write(get("body:"+a.modelId+":"+paint,paint,"body",spec),world);
        write(get("windows:"+a.modelId,"#263D4C","glass",spec),world);
       }
       if(spec.style==="supercar"){
         write(get("temerario:darktrim","#191D22","trim"),world);
         write(get("temerario:headlights","#DADFE5","frontLight"),world);
         write(get("temerario:taillights","#B82B2F","rearLight"),world);
       }
       const wheelbase=contactLength,track=contactTrack;
       const radius=frontFit?.radius??generatedWheelRadius001(spec);
       const previous=last.get(a.id);
       const distance=previous?Math.hypot(a.x-previous.x,a.z-previous.z):0;
       const spin=(previous?.spin??0)+(previous?.tick===snapshot.tick?0:distance/radius);
       last.set(a.id,{x:a.x,z:a.z,spin,tick:snapshot.tick});
       const steer=a.connectorId?Math.max(-.8,Math.min(.8,
          trafficTurnSteering013(a,graph,wheelbase)*1.6)):0;
       if(spec.style==="supercar"){
         const corners:GTDTemerarioWheelCorner003[]=[
           "frontLeft","frontRight","rearLeft","rearRight"];
         for(const corner of corners){
           const fit=getTemerarioWheelFit003(corner);
           const isFront=corner.startsWith("front");
           const steering=isFront?steer:0;
           // Source part vertices already face the GTD wheel lateral axis.
           // Rotation is about the measured source axle, not a guessed slot.
           const spinQ=Quaternion.RotationAxis(up,steering)
             .multiply(Quaternion.RotationAxis(right,spin));
           const pivot=Matrix.Compose(Vector3.One(),spinQ,
             new Vector3(fit.center[0]??0,fit.center[1]??0,fit.center[2]??0));
           const transform=pivot.multiply(world);
           write(sourcedWheel(corner,"tire"),transform);
           // Nudge only the rim face outward; preserve measured wheel pivot.
            const outward=fit.center[0]>0?1:-1;
            const rimSurface=Matrix.Translation(outward*.024,0,0).multiply(transform);
            write(sourcedWheel(corner,"rim"),rimSurface);
           // This additional EMPTY-GAP split-spoke face is deliberately
           // anchored to the *outer tyre face*, not deep inside the rubber.
           const face=Matrix.Compose(
             new Vector3(fit.radius,fit.radius,fit.radius),spinQ,
             new Vector3(fit.center[0]+outward*(fit.width*.5+.018),
               fit.center[1],fit.center[2])).multiply(world);
           write(spokeRim(),face);
         }
       }else if(isRover){
        const corners:GTDRoverCorner005[]=["frontLeft","frontRight","rearLeft","rearRight"];
        for(const corner of corners){
         const fit=getRoverWheelFit005(corner);
         const turn=corner.startsWith("front")?steer:0;
         const rotation=Quaternion.RotationAxis(up,turn)
           .multiply(Quaternion.RotationAxis(right,spin));
         const pivot=Matrix.Compose(Vector3.One(),rotation,
           new Vector3(fit.center[0],fit.center[1],fit.center[2]));
         const transform=pivot.multiply(world);
         write(roverWheel(corner,"tire"),transform);
         const side=fit.center[0]>0?1:-1;
         write(roverWheel(corner,"rim"),
           Matrix.Translation(side*.012,0,0).multiply(transform));
        }
       }else if(sevenModel&&nativeWheels){
         for(const corner of ["frontLeft","frontRight","rearLeft","rearRight"] as const){
           const fit=sourceWheelFit007(sevenModel,corner);
           const turn=corner.startsWith("front")?steer:0;
           const spinQ=Quaternion.RotationAxis(up,turn)
             .multiply(Quaternion.RotationAxis(right,spin));
           const pivot=Matrix.Compose(Vector3.One(),spinQ,
             new Vector3(fit.center[0],fit.center[1],fit.center[2]));
           const transform=pivot.multiply(world);
           write(sevenWheel(sevenModel,corner,"tire"),transform);
           const sign=(fit.center[0]??0)>=0?1:-1;
           write(sevenWheel(sevenModel,corner,"rim"),
             Matrix.Translation(sign*.012,0,0).multiply(transform));
         }
       }else{
       for(const zSign of [-1,1])for(const xSign of [-1,1]){
         const x=xSign*track*.5,z=zSign*wheelbase*.5;
         const q=(zSign>0?Quaternion.RotationAxis(up,steer):Quaternion.Identity())
           .multiply(Quaternion.RotationAxis(right,spin)).multiply(axle);
         write(tires,matrix({x,y:radius,z,w:radius*2,h:.21,d:radius*2},world,q));
         write(alloys,matrix({x:x+xSign*.113,y:radius,z,
           w:radius*1.18,h:.017,d:radius*1.18},world,q));
         // Cylinder symmetry alone makes rolling invisible. One original-style
         // bright spoke marker orbits its axle as distance advances, including
         // from the player's aerial flight camera.
         const hub=Matrix.Compose(Vector3.One(),q,new Vector3(x,radius,z));
         const spoke=Matrix.Compose(new Vector3(radius*.37,.045,.05),
           Quaternion.Identity(),new Vector3(radius*.48,xSign*.13,0));
         write(wheelSpoke,spoke.multiply(hub).multiply(world));
       }
       }
       if(spec.style!=="supercar"&&!isRover&&!nativeBody)for(const side of [-1,1]){
         write(headlights,matrix({x:side*spec.width*.33,y:.91,z:spec.length*.502,
           w:.30,h:.13,d:.05},world));
         write(taillights,matrix({x:side*spec.width*.35,y:.83,z:-spec.length*.502,
           w:.30,h:.14,d:.05},world));
       }
     }
     for(const b of buckets.values()){
       b.mesh.thinInstanceCount=b.count;
       if(b.count){b.mesh.setEnabled(true);b.mesh.thinInstanceBufferUpdated("matrix");}
       else b.mesh.setEnabled(false);
     }
     lastReport={vehicles3D:snapshot.count,sourceGLBs:exclude.size,
       lowDetail,defaultFleet,dots:0};
     return lastReport;
   },
   dispose(){for(const b of buckets.values()){b.mesh.material?.dispose();b.mesh.dispose(false,false);}
     buckets.clear();last.clear();},
 };
}
