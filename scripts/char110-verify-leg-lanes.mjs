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
  result[side.side]={hip:upper.x,knee:knee.x,foot:foot.x,toe:toe.x,z:foot.z,y:foot.y};
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
const minSide=(poseValue,side)=>Math.min(poseValue.knee,poseValue.foot,poseValue.toe)*side.sign;
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
clip.laneGuard={version:1,metric:"pelvis-local signed knee/ankle/toe X",
 margins,corrections};
writeFileSync(output,JSON.stringify(clip));
console.info("CHAR110_LEG_LANE_ACCEPTED="+JSON.stringify({corrections,after,
 bytes:readFileSync(output).length,retainedOriginalAuthoredWalk:true,
 note:"Hip abduction corrections only. No author clips, cadence, root translations, arms or knee animations replaced."}));
