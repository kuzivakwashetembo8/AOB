/** GEN-VEH-009 — Every moving NH-012 agent is ONE owner-accepted source
 * sedan. This renderer owns no additional model family, GLB import, fallback
 * silhouette, diagnostic dot, vehicle physics actor, or new route.
 * The original 4 rim/tire assemblies and 24 glazing primitives remain native.
 */
import {
 Camera,Color3,Matrix,Mesh,MeshBuilder,Quaternion,Scene,StandardMaterial,Vector3
} from "@babylonjs/core";
import type {NH012TrafficSnapshot} from "@/game/traffic/nh012-traffic-simulator";
import type {TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {
 sourceRecord007,hasNativeBody007,hasNativeWheels007,hasSourcePart007,
 createNativeBodyPart007,createNativeWheel007,sourceWheelFit007,
 type SevenSourceBody007,type SevenSourceCorner007,type SevenSourceWheelPart007
} from "@/game/vehicles/native-seven-vehicle-007";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013} from "@/game/vehicles/nh013-traffic-turn-steering";
import {northHeightsGround} from "./north-heights-reconstruction-001";
import {
 NH009_SEDAN_COUNT,NH009_SEDAN_MODEL,sedanPaint009,sedanFleetAudit009
} from "@/game/traffic/nh009-sedan-only-policy";

const corners:readonly SevenSourceCorner007[]=[
 "frontLeft","frontRight","rearLeft","rearRight"
];
const parts:readonly SevenSourceBody007[]=[
 "paint","glass","trim","frontLight","rearLight"
];
const up=Vector3.Up(),right=Vector3.Right();
type Bucket009={mesh:Mesh;matrix:Float32Array;count:number};
export interface NH009SedanTraffic{
 update(snapshot:NH012TrafficSnapshot,exclude:ReadonlySet<string>,camera?:Camera):{
   vehicles3D:number;sourceGLBs:0;lowDetail:number;defaultFleet:number;dots:0;
 };
 dispose():void;
}
export function createNorthHeightsSedanTraffic009(scene:Scene,graph:TrafficGraph012):NH009SedanTraffic{
 const source=sourceRecord007(NH009_SEDAN_MODEL);
 if(!hasNativeBody007(NH009_SEDAN_MODEL)||!hasNativeWheels007(NH009_SEDAN_MODEL)||
   !source?.body?.['glass']||!source?.body?.['paint']||
   !corners.every(c=>source.wheels?.[c]?.rim&&source.wheels?.[c]?.tire))
   throw Error("GEN-VEH-009 requires the accepted sedan body, glass and four original rim/tyre pairs");
 const buckets=new Map<string,Bucket009>();
 const materials:StandardMaterial[]=[];
 function bucket(key:string,create:()=>Mesh,color:string,kind:string):Bucket009{
   const found=buckets.get(key);if(found)return found;
   const mesh=create();
   const mat=new StandardMaterial("nh009:material:"+key,scene);
   mat.diffuseColor=Color3.FromHexString(color);
   mat.specularColor=Color3.FromHexString(kind==="paint"?"#65717F":"#7B8490");
   mat.specularPower=kind==="glass"?76:kind==="rim"?68:30;
   mat.backFaceCulling=false;
   if(kind==="glass")mat.alpha=.86;
   if(kind==="frontLight"||kind==="rearLight")
     mat.emissiveColor=mat.diffuseColor.scale(.43);
   mesh.material=mat;mesh.receiveShadows=false;mesh.isPickable=false;
   // OPT-02: Babylon frustum culls each live thin-instance bucket after bounds refresh.
   const matrix=new Float32Array(NH009_SEDAN_COUNT*16);
   mesh.thinInstanceSetBuffer("matrix",matrix,16,false);
   mesh.thinInstanceCount=0;mesh.setEnabled(false);
   const result={mesh,matrix,count:0};buckets.set(key,result);
   materials.push(mat);
   return result;
 }
 // A single shared source mesh definition per material. There are multiple
 // paint batches, but NO additional geometry-family generation.
 const exterior=(part:SevenSourceBody007,color:string)=>{
   const key="body:"+part+":"+(part==="paint"?color:"common");
   return bucket(key,()=>createNativeBodyPart007(scene,"nh009:"+key,NH009_SEDAN_MODEL,part),color,part);
 };
 const wheel=(corner:SevenSourceCorner007,part:SevenSourceWheelPart007)=>{
   const key="wheel:"+corner+":"+part;
   return bucket(key,()=>createNativeWheel007(scene,"nh009:"+key,
     NH009_SEDAN_MODEL,corner,part),
     part==="tire"?"#15191E":"#9AA1AB",part);
 };
 // Avoid allocating or uploading anything for unavailable source categories.
 const exteriorColors:Record<Exclude<SevenSourceBody007,"paint">,string>={
   glass:"#334D60",trim:"#2E353C",frontLight:"#EDECE6",rearLight:"#B72C34"
 };
 const front=sourceWheelFit007("sedan","frontLeft");
 const rear=sourceWheelFit007("sedan","rearLeft");
 const opposite=sourceWheelFit007("sedan","frontRight");
 const wheelbase=Math.abs((front.center[2]??0)-(rear.center[2]??0));
 const track=Math.abs((front.center[0]??0)-(opposite.center[0]??0));
 if(wheelbase<1.9||wheelbase>3.9||track<1.15||track>2.4)
   throw Error("GEN-VEH-009 invalid accepted sedan wheelbase or track");
 function write(entry:Bucket009,world:Matrix){
   if(entry.count>=NH009_SEDAN_COUNT)throw Error("GEN-VEH-009 thin instance overflow");
   world.copyToArray(entry.matrix,entry.count*16);entry.count++;
 }
 const positions=new Map<string,{x:number;z:number;spin:number;tick:number}>();
  // Resident distant Sedan-shaped geometry, scaled from accepted wheelbase/track.
  function distantPart(part:"body"|"cabin"|"glass"|"wheels",paint:string) {
    const key="distant:"+part+":"+(part==="body"?paint:"common");
    return bucket(key,()=>{
      const mesh=MeshBuilder.CreateBox("nh009:far-"+key,{
        width:part==="body"?track+.32:part==="wheels"?track+.12:track*.78,
        height:part==="body"?.58:part==="wheels"?.4:part==="glass"?.34:.51,
        depth:part==="body"?wheelbase+1.03:part==="wheels"?wheelbase+.16:wheelbase*.61,
      },scene);
      mesh.position.y=part==="body"?.63:part==="wheels"?.22:1.16;
      mesh.bakeCurrentTransformIntoVertices();
      return mesh;
    },part==="body"?paint:part==="glass"?"#334D60":part==="wheels"?"#15191E":"#475560",part);
  }
  let lastCamera={x:NaN,y:NaN,z:NaN};
  let lastCameraAt=0;
  let lastCounts={full:0,medium:0,distant:0,culled:0};
  function visibilityTier(a:{x:number;z:number},poseY:number,camera?:Camera) {
    if(!camera)return 0;
    const location=new Vector3(a.x,poseY+1,a.z);
    const forward=camera.getForwardRay().direction;
    const delta=location.subtract(camera.position), distance=delta.length();
    if(distance<=.01)return 0;
    if(Vector3.Dot(delta,forward)<-6)return -1;
    // Projection-space street visibility, not a fixed radial 58m cut-off.
    const engine=scene.getEngine(),viewport=camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight());
    const screen=Vector3.Project(location,Matrix.Identity(),scene.getTransformMatrix(),viewport);
    const margin=Math.min(engine.getRenderWidth(),engine.getRenderHeight())*.35;
    if(screen.x < -margin||screen.y < -margin||
       screen.x > engine.getRenderWidth()+margin||screen.y > engine.getRenderHeight()+margin)return -1;
    const apparent=(wheelbase+1)*engine.getRenderHeight()/(2*Math.tan(camera.fov/2)*distance);
    const deltaSeconds=Math.max(.001,(performance.now()-lastCameraAt)/1000);
    const rapidDescent=Number.isFinite(lastCamera.y)&&
      (lastCamera.y-camera.position.y)/deltaSeconds>5;
    return apparent>(rapidDescent?14:42)?0:apparent>10?1:2;
  }
 let tick=-1;
 let last={vehicles3D:0,sourceGLBs:0 as const,lowDetail:0,defaultFleet:0,dots:0 as const};
 return {
  update(snapshot,_exclude,camera){
    const moved=camera?Math.hypot(camera.position.x-lastCamera.x,camera.position.y-lastCamera.y,camera.position.z-lastCamera.z):0;
    if(snapshot.tick===tick && (!camera||moved<.45))return last;
    sedanFleetAudit009(snapshot);
    tick=snapshot.tick;
    lastCounts={full:0,medium:0,distant:0,culled:0};
    for(const b of buckets.values())b.count=0;
    for(const a of snapshot.agents){
      const color=sedanPaint009(a.id);
      const pose=sampleTrafficVehicleRoadPose013({
        x:a.x,z:a.z,heading:a.heading,wheelbase,track,ground:northHeightsGround
      });
      const world=Matrix.Compose(Vector3.One(),pose.rotation,new Vector3(a.x,pose.y,a.z));
      const previous=positions.get(a.id);
      const distance=previous?Math.hypot(a.x-previous.x,a.z-previous.z):0;
      const spin=(previous?.spin??0)+(previous?.tick===snapshot.tick?0:distance/front.radius);
      positions.set(a.id,{x:a.x,z:a.z,spin,tick:snapshot.tick});
      const tier=visibilityTier(a,pose.y,camera);
      if(tier<0){lastCounts.culled++;continue;}
      if(tier===2){
        write(distantPart("body",color),world);
        write(distantPart("cabin",color),world);
        write(distantPart("glass",color),world);
        write(distantPart("wheels",color),world);
        lastCounts.distant++;
        continue;
      }
      write(exterior("paint",color),world);
      for(const part of parts){
        if(part==="paint"||(tier===1&&part!=="glass")||!hasSourcePart007("sedan",part))continue;
        write(exterior(part,exteriorColors[part]),world);
      }
      if(tier===1){
        write(distantPart("wheels",color),world);
        lastCounts.medium++;
        continue;
      }
      lastCounts.full++;
      const steer=typeof a.manualSteer==="number"
        ?a.manualSteer*.52/(1+Math.abs(a.speed)*.095)
        :a.connectorId
          ?Math.max(-.8,Math.min(.8,trafficTurnSteering013(a,graph,wheelbase)*1.6)):0;
      for(const corner of corners){
        const fit=sourceWheelFit007(NH009_SEDAN_MODEL,corner);
        const turn=corner.startsWith("front")?steer:0;
        const rotation=Quaternion.RotationAxis(up,turn).multiply(Quaternion.RotationAxis(right,spin));
        const transform=Matrix.Compose(Vector3.One(),rotation,
          new Vector3(fit.center[0]??0,fit.center[1]??0,fit.center[2]??0)).multiply(world);
        write(wheel(corner,"tire"),transform);
        const outward=(fit.center[0]??0)>=0?1:-1;
        write(wheel(corner,"rim"),Matrix.Translation(outward*.012,0,0).multiply(transform));
      }
    }
    for(const b of buckets.values()){
      b.mesh.thinInstanceCount=b.count;
      if(b.count){
        b.mesh.setEnabled(true);
        b.mesh.thinInstanceBufferUpdated("matrix");
        b.mesh.thinInstanceRefreshBoundingInfo();
      }else b.mesh.setEnabled(false);
    }
    if(camera){
      lastCamera={x:camera.position.x,y:camera.position.y,z:camera.position.z};
      lastCameraAt=performance.now();
    }
    last={vehicles3D:lastCounts.full+lastCounts.medium+lastCounts.distant,
      sourceGLBs:0,lowDetail:lastCounts.medium+lastCounts.distant,
      defaultFleet:snapshot.count,dots:0};
    return last;
  },
  dispose(){
     for(const bucket of buckets.values())bucket.mesh.dispose(false,false);
     for(const material of materials)material.dispose();
     buckets.clear();positions.clear();
   }
 };
}
