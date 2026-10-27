/** GTD-NH-OPT2 Stage 6: compact, deterministic, no-GLB player sedan motion.
 * Buildings are solid OBBs; tree/lamp/car collisions are deliberately absent.
 * One swept/segmented broadphase check is owned by the original NH012 agent. */
import type {BuildingSpec} from "@/game/world-generation/schema";

export type SedanStage6Pose=Readonly<{x:number;z:number;heading:number}>;
export type SedanStage6Blocker=Readonly<{x:number;z:number;halfX:number;halfZ:number;yaw:number}>;
export const STAGE6_WORLD_EDGE=309;
export const STAGE6_STEER_RADIANS=.52;
export const STAGE6_WHEELBASE_METERS=2.8;
export const STAGE6_STEER_RESPONSE_PER_SECOND=3.2;
export const STAGE6_SEGMENT_METERS=.10;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export function stage6BuildingBlockers(lots:readonly BuildingSpec[]):SedanStage6Blocker[]{
  return lots.map(lot=>({
    x:lot.position.x,z:lot.position.z,
    halfX:(lot.overrides?.width??12)/2+.25,
    halfZ:(lot.overrides?.depth??12)/2+.25,
    yaw:lot.yawRadians??0,
  }));
}
type OrientedBox={x:number;z:number;hw:number;hl:number;heading:number};
const dot=(ax:number,az:number,bx:number,bz:number)=>ax*bx+az*bz;
/** Full oriented-rectangle SAT, not just a center-point wall test. */
export function stage6RectanglesOverlap(a:OrientedBox,b:OrientedBox):boolean{
  const ax={x:Math.cos(a.heading),z:-Math.sin(a.heading)};
  const az={x:Math.sin(a.heading),z:Math.cos(a.heading)};
  const bx={x:Math.cos(b.heading),z:-Math.sin(b.heading)};
  const bz={x:Math.sin(b.heading),z:Math.cos(b.heading)};
  const dx=b.x-a.x,dz=b.z-a.z;
  for(const axis of [ax,az,bx,bz]){
    const projection=Math.abs(dot(dx,dz,axis.x,axis.z));
    const radiusA=a.hw*Math.abs(dot(ax.x,ax.z,axis.x,axis.z))+
      a.hl*Math.abs(dot(az.x,az.z,axis.x,axis.z));
    const radiusB=b.hw*Math.abs(dot(bx.x,bx.z,axis.x,axis.z))+
      b.hl*Math.abs(dot(bz.x,bz.z,axis.x,axis.z));
    if(projection>=radiusA+radiusB-.00001)return false;
  }
  return true;
}
export function stage6SolidBuildingCheck(blockers:readonly SedanStage6Blocker[]){
  return (pose:SedanStage6Pose,length:number,width:number):boolean=>{
    if(!Number.isFinite(pose.x)||!Number.isFinite(pose.z)||!Number.isFinite(pose.heading))return false;
    // Boundary applies to the entire Sedan body, not only the origin.
    const extent=Math.hypot(length/2,width/2);
    if(Math.abs(pose.x)>STAGE6_WORLD_EDGE-extent||Math.abs(pose.z)>STAGE6_WORLD_EDGE-extent)return false;
    const car={x:pose.x,z:pose.z,hw:width/2,hl:length/2,heading:pose.heading};
    for(const block of blockers){
      const distance=Math.hypot(pose.x-block.x,pose.z-block.z);
      if(distance>extent+Math.hypot(block.halfX,block.halfZ))continue;
      if(stage6RectanglesOverlap(car,{
        x:block.x,z:block.z,hw:block.halfX,hl:block.halfZ,heading:block.yaw,
      }))return false;
    }
    return true;
  };
}
/** Smooth driver-requested steering. Negative = LEFT, positive = RIGHT.
 * Reversing naturally reverses yaw direction. The steering angle's speed
 * falloff limits high-speed oversteer without preventing off-road departure. */
export function stage6SteerStep(
  current:number,request:number,velocity:number,dt:number,
):{angle:number;yawDelta:number}{
  const response=STAGE6_STEER_RESPONSE_PER_SECOND*dt;
  const requested=clamp(request,-1,1);
  const angle=clamp(current+clamp(requested-current,-response,response),-1,1);
  const speedFactor=1/(1+Math.abs(velocity)*.095);
  const wheelAngle=angle*STAGE6_STEER_RADIANS*speedFactor;
  const yawDelta=velocity/STAGE6_WHEELBASE_METERS*Math.tan(wheelAngle)*dt;
  return {angle,yawDelta};
}
/** Resolve a movement in 10cm maximum substeps. If a car hull contacts a
 * building, stop translational motion at the last valid point; then allow
 * pure steering and possible escape in reverse. No tunneling at 10.4m/s. */
export function stage6SweepSedan(
  before:SedanStage6Pose,nextHeading:number,distance:number,
  length:number,width:number,admitted:(p:SedanStage6Pose,length:number,width:number)=>boolean,
):{pose:SedanStage6Pose;blocked:boolean}{
  const count=Math.max(1,Math.ceil(Math.abs(distance)/STAGE6_SEGMENT_METERS));
  let result={...before};
  for(let i=1;i<=count;i++){
    const t=i/count;
    const heading=before.heading+Math.atan2(Math.sin(nextHeading-before.heading),Math.cos(nextHeading-before.heading))*t;
    const step=distance/count;
    const next={x:result.x+Math.sin(heading)*step,
      z:result.z+Math.cos(heading)*step,heading};
    if(!admitted(next,length,width)){
      // A solid wall must not be penetrated even when approaching diagonally.
      return {pose:result,blocked:true};
    }
    result=next;
  }
  return {pose:result,blocked:false};
}
