/** NH-013 G2 visual road grade: support road-going GLBs at their four real
 * tyre footprints, not at just the vehicle centre. No Rapier dynamics invented.
 * NH-012 traffic state remains authoritative for X/Z/heading/speed.
 */
import {Quaternion} from "@babylonjs/core";
export type ContactPose013=Readonly<{y:number;rotation:Quaternion;maxError:number;frontRise:number}>;
export type GroundSampler013=(x:number,z:number)=>number;
export function sampleTrafficVehicleRoadPose013(args:{
 x:number;z:number;heading:number;wheelbase:number;track:number;
 ground:GroundSampler013;asphaltTop?:number;
}):ContactPose013{
 const {x,z,heading,wheelbase,track,ground}=args;
 if(![x,z,heading,wheelbase,track].every(Number.isFinite)||wheelbase<=1||track<=.5)
   throw Error("NH013 invalid axle contact inputs");
 const forwardX=Math.sin(heading),forwardZ=Math.cos(heading);
 const rightX=Math.cos(heading),rightZ=-Math.sin(heading);
 const elevation=args.asphaltTop??.075;
 const values:number[]=[];
 for(const front of [-1,1]){
   for(const side of [-1,1]){
     const xx=x+forwardX*front*wheelbase/2+rightX*side*track/2;
     const zz=z+forwardZ*front*wheelbase/2+rightZ*side*track/2;
     const y=ground(xx,zz)+elevation;
     if(!Number.isFinite(y))throw Error("NH013 invalid road height");
     values.push(y);
   }
 }
 const [backLeft,backRight,frontLeft,frontRight]=values;
 const frontMean=(frontLeft!+frontRight!)/2,backMean=(backLeft!+backRight!)/2;
 const rightMean=(frontRight!+backRight!)/2,leftMean=(frontLeft!+backLeft!)/2;
 const longitudinalRise=frontMean-backMean;
 const lateralRise=rightMean-leftMean;
 // Babylon local forward (+Z) pitches upward with *negative* local X angle.
 const pitch=-Math.atan2(longitudinalRise,wheelbase);
 const roll=Math.atan2(lateralRise,track);
 // NH-012's yaw is the single source of truth: terrain influences only
 // pitch and roll, not lane heading or path navigation.
 const rotation=Quaternion.RotationYawPitchRoll(heading,pitch,roll);
 const center=(values.reduce((s,h)=>s+h,0)/4);
 // Small floor clearance protects tessellated road triangles and visual tread.
 // The 4-point support plane can differ slightly from a non-planar terrain.
 const estimated=[
   center-longitudinalRise/2-lateralRise/2,
   center-longitudinalRise/2+lateralRise/2,
   center+longitudinalRise/2-lateralRise/2,
   center+longitudinalRise/2+lateralRise/2,
 ];
 const maxError=Math.max(...values.map((v,i)=>v-estimated[i]!));
 return {y:center+Math.max(0,maxError)+.018,rotation,maxError,
   frontRise:longitudinalRise};
}
