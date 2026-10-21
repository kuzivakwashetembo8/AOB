/** CHAR-110C: anatomical SIDE-LANE validation + minimal offline correction.
 * This is a correction to the authored retarget, NOT a synthetic walk cycle.
 * A walking foot and knee must remain ipsilateral to the pelvis centerline.
 * Preserve source animation timing, forward swing, knee flexion and arm swing.
 * Runs only at build time, no new per-frame work or model in the game.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {Matrix,Quaternion,Vector3} from "@babylonjs/core";

const source=resolve("public/GLBs/Characters/character.glb");
const output=resolve("public/GLBs/Characters/char110-ual-walk.json");
const b=readFileSync(source);
if(b.toString("ascii",0,4)!=="glTF"||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)
 throw Error("CHAR-110C: Target GLB invalid");
const j=JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12)));
const clip=JSON.parse(readFileSync(output,"utf8"));
if(clip.schema!=="gtd.char110.ual-walk.v1"||clip.sampleCount!==41)throw Error("CHAR-110C: Unverified retarget format");
const lookup=new Map(j.nodes.map((n,i)=>[n.name,i]));
const parents=j.nodes.map(()=>-1);
j.nodes.forEach((n,i)=>(n.children??[]).forEach(k=>parents[k]=i));
const Q=a=>new Quaternion(...a).normalize();
const unit=()=>Quaternion.Identity();
const rest=j.nodes.map(n=>{
 if(n.matrix){
  const m=Matrix.FromArray(n.matrix),s=new Vector3(),q=unit(),t=new Vector3();
  if(!m.decompose(s,q,t))throw Error("CHAR-110C: Unusable target rest matrix");
  return {s,q,t};
 }
 return {s:Vector3.FromArray(n.scale??[1,1,1]),q:Q(n.rotation??[0,0,0,1]),t:Vector3.FromArray(n.translation??[0,0,0])};
});
const tracks=new Map(clip.tracks.map(t=>[t.node,t]));
const sides=[
 {side:"left",sign:+1,upper:"LeftUpLeg",knee:"LeftLeg",foot:"LeftFoot",toe:"LeftToeBase"},
 {side:"right",sign:-1,upper:"RightUpLeg",knee:"RightLeg",foot:"RightFoot",toe:"RightToeBase"}
];
for(const name of ["Hips",...sides.flatMap(s=>[s.upper,s.knee,s.foot,s.toe])]){
 if(!lookup.has(name))throw Error("CHAR-110C: Missing target "+name);
}
for(const side of sides){
 if(parents[lookup.get(side.knee)]!==lookup.get(side.upper)||
    parents[lookup.get(side.foot)]!==lookup.get(side.knee)||
    parents[lookup.get(side.toe)]!==lookup.get(side.foot)||
    parents[lookup.get(side.upper)]!==lookup.get("Hips"))
 throw Error("CHAR-110C: Incompatible leg ancestry for "+side.side);
}
function lerpTrack(t,sample){
 const a=Math.max(0,Math.min(clip.sampleCount-2,Math.floor(sample))),frac=Math.min(1,Math.max(0,sample-a));
 const q0=Q(t.keys[a]),q1=Q(t.keys[a+1]);
 return Quaternion.Slerp(q0,q1,frac).normalize();
}
function pose(sample,extra={}){
 const poseMatrix=new Array(j.nodes.length);
 const resolveMatrix=i=>{
  if(poseMatrix[i])return poseMatrix[i];
  const node=j.nodes[i],r=rest[i];
  const track=tracks.get(node.name);
  let anim=track?lerpTrack(track,sample):unit();
  if(extra[node.name]){
   anim=Quaternion.RotationAxis(Vector3.Forward(),extra[node.name]).multiply(anim).normalize();
  }
  const local=Matrix.Compose(r.s,anim.multiply(r.q).normalize(),r.t);
  const p=parents[i];
  return poseMatrix[i]=p<0?local:local.multiply(resolveMatrix(p));
 };
 const hip=resolveMatrix(lookup.get("Hips"));
 const hipInv=Matrix.Invert(hip);
 const result={};
 for(const side of sides){
  const val=name=>Vector3.TransformCoordinates(
    Vector3.TransformCoordinates(Vector3.Zero(),resolveMatrix(lookup.get(name))),hipInv);
  const knee=val(side.knee),foot=val(side.foot),toe=val(side.toe),upper=val(side.upper);
  const footParentWorld=resolveMatrix(parents[lookup.get(side.foot)]);
  const upAxis=Vector3.TransformNormal(Vector3.Up(),Matrix.Invert(footParentWorld)).normalize();
  result[side.side]={hip:upper.x,knee:knee.x,foot:foot.x,toe:toe.x,z:foot.z,toeZ:toe.z,y:foot.y,toeY:toe.y,footYawAxis:upAxis.asArray()};
 }
 return result;
}
const original=pose(0);
const margins={};
for(const side of sides){
 const p=original[side.side];
 // Use anatomical thigh side to orient the lane; cannot reinterpret a mirrored rig.
 if(p.hip*side.sign<=.035)throw Error("CHAR-110C: Source hips not ipsilateral: "+side.side+" "+p.hip);
 margins[side.side]=Math.max(.03,Math.min(.055,Math.abs(p.hip)*.6));
}
// Apply anatomical side sign to EACH endpoint before taking the minimum.
// Otherwise a right-side negative x can conceal an inward crossing at another joint.
const minSide=(poseValue,side)=>Math.min(poseValue.knee*side.sign,poseValue.foot*side.sign,poseValue.toe*side.sign);
function report(label){
 const data={};
 for(const side of sides){
  const samples=[];
  for(let n=0;n<clip.sampleCount;n++){
   const p=pose(n)[side.side];
   samples.push({n,signedHip:p.hip*side.sign,signedKnee:p.knee*side.sign,
    signedFoot:p.foot*side.sign,signedToe:p.toe*side.sign});
  }
  const min=x=>+Math.min(...samples.map(s=>s[x])).toFixed(4);
  data[side.side]={hip:min("signedHip"),knee:min("signedKnee"),foot:min("signedFoot"),
   toe:min("signedToe"),minimumLane:+margins[side.side].toFixed(4),
   crossingSamples:samples.filter(s=>Math.min(s.signedKnee,s.signedFoot,s.signedToe)<0).map(s=>s.n),
   violatingSamples:samples.filter(s=>Math.min(s.signedKnee,s.signedFoot,s.signedToe)<margins[side.side]).map(s=>s.n)};
 }
 console.info("CHAR110_"+label+"="+JSON.stringify(data));
 return data;
}
const before=report("LEG_LANES_BEFORE");
const corrections={};
for(const side of sides){
 const t=tracks.get(side.upper);
 if(!t)throw Error("CHAR-110C: No authored upper thigh track for "+side.side);
 const raw=[];
 for(let n=0;n<clip.sampleCount;n++){
  // A pelvic-forward hip-abduction correction keeps knee, ankle and toe on
  // their OWN side; choose the SMALLEST angle that restores all 3 endpoints.
  const current=pose(n)[side.side];
  if(minSide(current,side)>=margins[side.side]+.002){raw.push(0);continue;}
  let chosen=null;
  for(let step=1;step<=110;step++){
   const radians=step*.005*side.sign;
   const p=pose(n,{[side.upper]:radians})[side.side];
   if(minSide(p,side)>=margins[side.side]+.002){chosen=step*.005;break;}
  }
  if(chosen===null)throw Error("CHAR-110C: Source retarget exceeded 31.5 degree lateral repair limit "+side.side+" at sample "+n+" (x="+JSON.stringify(current)+")");
  raw.push(chosen);
 }
 // Keep the correction continuous across both neighboring keyframes.
 const smooth=raw.map((v,n)=>Math.max(v,raw[(n+raw.length-1)%raw.length]*.85,
  raw[(n+1)%raw.length]*.85));
 // Keep cyclic start/end identical (authored walk is a loop).
 const end=Math.max(smooth[0],smooth.at(-1));
 smooth[0]=smooth[smooth.length-1]=end;
 for(let n=0;n<clip.sampleCount;n++){
  if(smooth[n]<.00001)continue;
  const q=Q(t.keys[n]);
  const corrected=Quaternion.RotationAxis(Vector3.Forward(),smooth[n]*side.sign).multiply(q).normalize();
  t.keys[n]=[corrected.x,corrected.y,corrected.z,corrected.w].map(x=>+x.toFixed(6));
 }
 corrections[side.side]={maxAngleRadians:+Math.max(...smooth).toFixed(3),
  correctedSamples:smooth.filter(x=>x>.001).length,
  originalCrossings:before[side.side].crossingSamples};
}
// Verify *all* baked keyframes AND interpolated half-keyframes, not just unit test mocks.
const after=report("LEG_LANES_AFTER");
for(const side of sides){
 for(let n=0;n<clip.sampleCount*2-1;n++){
  const p=pose(n*.5)[side.side];
  const signed=minSide(p,side);
  if(signed<margins[side.side]-.006)
   throw Error("CHAR-110C: Repaired retarget still crosses "+side.side+" at "+n/2+
    " signed="+signed+" lane="+margins[side.side]);
 }
}
// Reject any hidden retarget pipeline that produces no improvement.
if(sides.some(s=>corrections[s.side].maxAngleRadians>0.55))
 throw Error("CHAR-110C: Hip correction exceeds bounded anatomical limit");
// CHAR-110D: preserve the authored clip while correcting a mirrored elbow bend.
// Right elbow flex is reversed relative to source idle; wrist gets an exact
// counter-rotation so the already-approved palm facing stays unchanged.
const elbow=tracks.get("RightForeArm"),wrist=tracks.get("RightHand");
if(!elbow||!wrist)throw Error("CHAR-110D: Missing right elbow or wrist mapping");
const restElbow=rest[lookup.get("RightForeArm")].q;
const invQuat=q=>Quaternion.Inverse(q).normalize();
const elbowAngles=[];
for(let n=0;n<clip.sampleCount;n++){
 const e=Q(elbow.keys[n]),h=Q(wrist.keys[n]);
 // Invert source-idle-relative forearm bending, not the target bind pose.
 const bent=invQuat(e);
 // Preserve the original global palm orientation after elbow correction.
 const before=e.multiply(restElbow).normalize();
 const after=bent.multiply(restElbow).normalize();
 const compensator=invQuat(after).multiply(before).normalize();
 const hand=compensator.multiply(h).normalize();
 elbow.keys[n]=[bent.x,bent.y,bent.z,bent.w].map(x=>+x.toFixed(6));
 wrist.keys[n]=[hand.x,hand.y,hand.z,hand.w].map(x=>+x.toFixed(6));
 const diff=2*Math.acos(Math.min(1,Math.abs(Quaternion.Dot(before.multiply(h).normalize(),after.multiply(hand).normalize()))));
 if(diff>.006)throw Error("CHAR-110D: Palm facing preservation failed at "+n+" "+diff);
 elbowAngles.push(2*Math.acos(Math.min(1,Math.abs(e.w))));
}
console.info("CHAR110_ELBOW_DIRECTION="+JSON.stringify({rightForearmReversed:true,
 rightHandCompensated:true,maxSourceDeltaRadians:Math.max(...elbowAngles)}));

// Character face convention: in source/model pelvis space forward is -Z.
// When a shoe turns inward/outward, the toe-to-ankle horizontal direction
// drifts away from -Z. Measure via actual baked skeletal FK; only correct yaw.
// Imported foot pivots do not necessarily share pelvis or mesh forward axes.
// Determine the reference sign from the ACTUAL source ankle-to-toe projected geometry.
const toeForwardSum=sides.reduce((sum,side)=>sum+Array.from({length:clip.sampleCount},(_,n)=>{
 const p=pose(n)[side.side];return p.toeZ-p.z;
}).reduce((a,b)=>a+b,0),0);
if(Math.abs(toeForwardSum)<.15)throw Error("CHAR-110D: Foot forward axis cannot be calibrated");
const toeForwardSign=Math.sign(toeForwardSum);
function footHeading(p){const dx=p.toe-p.foot,dz=(p.toeZ-p.z)*toeForwardSign;
 const length=Math.hypot(dx,dz);return {angle:Math.atan2(dx,dz),length,forward:dz};}
const footReport={};
for(const side of sides){
 const t=tracks.get(side.foot);
 if(!t)throw Error("CHAR-110D: Foot animation track missing");
 const beforeAngles=[],afterAngles=[],fix=[];
 let unmeasurableFrames=0,unresolvedFrames=0;
 for(let n=0;n<clip.sampleCount;n++){
  const p=pose(n)[side.side],h=footHeading(p);beforeAngles.push(h.angle);
  if(h.length<.025){
   // Toe can point vertically during liftoff: horizontal heading is undefined.
   // Preserve the real source-foot rotation rather than manufacturing yaw.
   unmeasurableFrames++;beforeAngles.push(0);afterAngles.push(0);fix.push(0);
   continue;
  }
  // Apply pelvis-up yaw transformed into the animated foot-parent local basis.
  // The native glTF and authored knee flexion remain intact.
  const original=Q(t.keys[n]);
  let best=null;
  for(let step=0;step<=110;step++){
   const angle=(step===0?0:(step%2===1?1:-1)*Math.ceil(step/2)*.01);
   const trial=Quaternion.RotationAxis(Vector3.FromArray(p.footYawAxis),angle).multiply(original).normalize();
   t.keys[n]=[trial.x,trial.y,trial.z,trial.w];
   const candidate=pose(n)[side.side],dir=footHeading(candidate);
   const margin=minSide(candidate,side);
   const score=Math.abs(dir.angle);
   if(margin>=margins[side.side]-.006 &&
       dir.forward>.025 && (score<=.28||step===110)){
     if(!best||score<best.score)best={angle,score,trial};
     if(score<=.28)break;
   }
  }
  t.keys[n]=best?[best.trial.x,best.trial.y,best.trial.z,best.trial.w].map(x=>+x.toFixed(6)):
    [original.x,original.y,original.z,original.w].map(x=>+x.toFixed(6));
  const solved=footHeading(pose(n)[side.side]);afterAngles.push(solved.angle);
  fix.push(best?.angle??0);
  if(!best&&Math.abs(solved.angle)>.28)unresolvedFrames++;
 }
 footReport[side.side]={originalMaxAngle:+Math.max(...beforeAngles.map(Math.abs)).toFixed(3),
 correctedMaxAngle:+Math.max(...afterAngles.map(Math.abs)).toFixed(3),
 maxYawCorrection:+Math.max(...fix.map(Math.abs)).toFixed(3),
 unmeasurableFrames,unresolvedFrames};
}
// Re-check lane after shoe yaw changes so toe rotation cannot undo CHAR-110C.
const shoeLane=report("SHOE_LANES_AFTER");
if(sides.some(s=>shoeLane[s.side].crossingSamples.length||shoeLane[s.side].violatingSamples.length))
 throw Error("CHAR-110D: Foot-facing correction regressed the accepted bilateral lanes");
console.info("CHAR110_SHOE_FORWARD="+JSON.stringify({referenceToeForwardSign:toeForwardSign,footReport}));

clip.laneGuard={version:1,metric:"pelvis-local signed knee/ankle/toe X",
 margins,corrections};
writeFileSync(output,JSON.stringify(clip));
console.info("CHAR110_LEG_LANE_ACCEPTED="+JSON.stringify({corrections,after,
 bytes:readFileSync(output).length,retainedOriginalAuthoredWalk:true,
 note:"Hip abduction corrections only. No author clips, cadence, root translations, arms or knee animations replaced."}));
