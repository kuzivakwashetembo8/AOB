/** Shared third-person constraints, North Heights' graded terrain geometry. */
import {normalizeThirdPersonCameraDistance} from "@/ui/menus/settings-state";
export type CameraPoint={x:number;y:number;z:number};
export type CameraBox={x:number;y:number;z:number;halfX:number;halfY:number;halfZ:number};
export const NORTH_HEIGHTS_CAMERA_LIMIT=309;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function clampNorthHeightsPitch(pitch:number){return clamp(Number.isFinite(pitch)?pitch:0,-.57,.46);}
export function clampNorthHeightsActorXZ(x:number,z:number){
  return {x:clamp(x,-NORTH_HEIGHTS_CAMERA_LIMIT,NORTH_HEIGHTS_CAMERA_LIMIT),
    z:clamp(z,-NORTH_HEIGHTS_CAMERA_LIMIT,NORTH_HEIGHTS_CAMERA_LIMIT)};
}
export function resolveNorthHeightsThirdPersonCamera(
  actor:CameraPoint,yaw:number,pitch:number,distanceMeters:number,
  terrain:(x:number,z:number)=>number,blockers:readonly CameraBox[]=[],
){
  const orbit=clampNorthHeightsPitch(pitch),distance=normalizeThirdPersonCameraDistance(distanceMeters);
  const target={x:actor.x,y:actor.y+.55,z:actor.z};
  const direction={x:-Math.sin(yaw)*Math.cos(orbit),y:.21-Math.sin(orbit),z:-Math.cos(yaw)*Math.cos(orbit)};
  const origin={x:target.x,y:target.y+.25,z:target.z};
  const far={x:origin.x+direction.x*distance,y:origin.y+direction.y*distance,z:origin.z+direction.z*distance};
  const segment={x:far.x-origin.x,y:far.y-origin.y,z:far.z-origin.z};
  let radius=distance;
  // Short-range analytic physical building blockers instead of Babylon picks
  // (North Heights' batched glass and walls are explicitly unpickable).
  for(const box of blockers){
    if(Math.abs(box.x-actor.x)>distance+box.halfX+1||Math.abs(box.z-actor.z)>distance+box.halfZ+1)continue;
    let entry=0,exit=1;
    for(const axis of ["x","y","z"] as const){
      const half=box[axis==="x"?"halfX":axis==="y"?"halfY":"halfZ"]+.15;
      const min=box[axis]-half,max=box[axis]+half;
      const o=origin[axis],v=segment[axis];
      if(Math.abs(v)<1e-8){if(o<min||o>max){exit=-1;break;}continue;}
      const first=(min-o)/v,second=(max-o)/v;
      entry=Math.max(entry,Math.min(first,second));
      exit=Math.min(exit,Math.max(first,second));
      if(entry>exit)break;
    }
    if(entry<=exit&&exit>=0&&entry<=1){
      radius=Math.min(radius,Math.max(1.65,entry*distance-.3));
    }
  }
  const x=clamp(origin.x+direction.x*radius,-NORTH_HEIGHTS_CAMERA_LIMIT,NORTH_HEIGHTS_CAMERA_LIMIT);
  const z=clamp(origin.z+direction.z*radius,-NORTH_HEIGHTS_CAMERA_LIMIT,NORTH_HEIGHTS_CAMERA_LIMIT);
  let y=origin.y+direction.y*radius;
  // Camera and every sightline sample remain above actual graded ground.
  for(let i=1;i<=8;i++){
    const t=i/8,px=target.x+(x-target.x)*t,pz=target.z+(z-target.z)*t;
    const required=terrain(px,pz)+.85,actual=target.y+(y-target.y)*t;
    if(Number.isFinite(required)&&actual<required)y+=Math.min(18,(required-actual)/t);
  }
  y=Math.max(y,terrain(x,z)+.85);
  return {position:{x,y,z},target,orbit,radius};
}
