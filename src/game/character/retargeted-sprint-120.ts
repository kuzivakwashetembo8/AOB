/** CHAR-120 — authored, build-time retargeted UAL Sprint_Loop contract.
 * The accepted walking clip and linked-bone neutral pose remain separate.
 */
import type {WalkClip110} from "./retargeted-walk-110";

export type SprintClip120 = Omit<WalkClip110,"schema"|"walkTargetMps"> & {
  schema:"gtd.char120.ual-sprint.v1";
  runTargetMps:number;
};
export const RETARGET_SPRINT_PATH_120="/GLBs/Characters/char120-ual-sprint.json";
export const HUMAN_SPRINT_SPEED_120=4.0;
const required=["Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase",
 "RightUpLeg","RightLeg","RightFoot","RightToeBase"] as const;

export function validateSprintClip120(value:unknown):SprintClip120 {
 const v=value as Partial<SprintClip120>|null;
 if(!v||v.schema!=="gtd.char120.ual-sprint.v1"||
 !Number.isFinite(v.duration)||!(v.duration!>.2&&v.duration!<5)||
 v.sampleCount!==41||v.runTargetMps!==HUMAN_SPRINT_SPEED_120||
 !Array.isArray(v.tracks)||v.tracks.length!==required.length)
  throw Error("Invalid CHAR-120 authored sprint header");
 const seen=new Set<string>();
 for(const t of v.tracks){
  if(!t||!required.includes(t.node as typeof required[number])||
   seen.has(t.node)||!Array.isArray(t.keys)||t.keys.length!==v.sampleCount||
   !Number.isFinite(t.peakRadians)||t.peakRadians<0||t.peakRadians>3.15)
    throw Error("Invalid CHAR-120 sprint track "+t?.node);
  seen.add(t.node);
  for(const key of t.keys)
   if(!Array.isArray(key)||key.length!==4||key.some(x=>!Number.isFinite(x))||
    Math.abs(key.reduce((n,x)=>n+x*x,0)-1)>.008)
    throw Error("Invalid CHAR-120 sprint quaternion at "+t.node);
  const seam=t.keys[0]![0]*t.keys.at(-1)![0]+
   t.keys[0]![1]*t.keys.at(-1)![1]+t.keys[0]![2]*t.keys.at(-1)![2]+
   t.keys[0]![3]*t.keys.at(-1)![3];
  if(Math.abs(seam)<.985)throw Error("CHAR-120 sprint loop discontinuity "+t.node);
  // Do not trust claimed peakRadians alone: a flat rotation track is not an
  // authored sprint even if the JSON header advertises a moving leg.
  if(["LeftArm","RightArm","LeftUpLeg","RightUpLeg"].includes(t.node)){
   const first=t.keys[0]!;
   const spread=Math.max(...t.keys.map(q=>2*Math.acos(Math.min(1,
    Math.abs(q.reduce((sum,c,i)=>sum+c*first[i]!,0))))));
   if(spread<.04)throw Error("CHAR-120 stationary limb is not sprinting: "+t.node);
  }
 }
 if(required.some(n=>!seen.has(n)))throw Error("CHAR-120 sprint missing required joint");
 if(["LeftArm","RightArm","LeftUpLeg","RightUpLeg"].some(name=>
  (v.tracks!.find(t=>t.node===name)?.peakRadians??0)<.03))
  throw Error("CHAR-120 sprint lacks actual authored running limb motion");
 return v as SprintClip120;
}

export async function fetchSprintClip120(fetcher:typeof fetch=fetch):Promise<SprintClip120> {
 const response=await fetcher(RETARGET_SPRINT_PATH_120);
 if(!response.ok)throw Error("CHAR-120 sprint missing: HTTP "+response.status);
 return validateSprintClip120(await response.json());
}

/** Eases actual player velocity; never merely accelerates animation playback. */
export function stepHumanTravelSpeed120(current:number,sprintHeld:boolean,dt:number):number {
 const walk=1.65,target=sprintHeld?HUMAN_SPRINT_SPEED_120:walk;
 const previous=Number.isFinite(current)?Math.max(walk,Math.min(HUMAN_SPRINT_SPEED_120,current)):walk;
 const seconds=sprintHeld ? .35 : .30;
 const move=(HUMAN_SPRINT_SPEED_120-walk)/seconds*Math.max(0,Math.min(.1,dt));
 return previous+Math.sign(target-previous)*Math.min(Math.abs(target-previous),move);
}
