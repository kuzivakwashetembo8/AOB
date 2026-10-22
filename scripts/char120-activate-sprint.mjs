/** CHAR-120: the proven mixed-frame transfer for UAL Sprint_Loop.
 * Per-bone native-reference deltas for hip and thigh/knee; retain the
 * source-idle-relative ankle, toe and upper-body tracks to protect facing.
 * Do not mutate CHAR-110 walk assets or any accepted walking script.
 */
import {readFileSync,writeFileSync} from "node:fs";
const output="public/GLBs/Characters/char120-ual-sprint.json";
const native=".char120-native-sprint.json";
const raw=JSON.parse(readFileSync(output,"utf8"));
const candidate=JSON.parse(readFileSync(native,"utf8"));
const expected=["Hips","LeftUpLeg","LeftLeg","RightUpLeg","RightLeg"];
if(raw.schema!=="gtd.char120.ual-sprint.v1"||candidate.schema!==raw.schema||
 raw.sampleCount!==41||candidate.sampleCount!==41||raw.tracks.length!==22||
 candidate.tracks.length!==22)throw Error("CHAR120 incompatible authored sprint transfer");
const a=raw.tracks.map(t=>t.node).join("|"),b=candidate.tracks.map(t=>t.node).join("|");
if(a!==b)throw Error("CHAR120 mapped anatomical joints differ");
const byName=new Map(candidate.tracks.map(t=>[t.node,t]));
for(const name of expected){
 const track=byName.get(name);
 if(!track||track.keys?.length!==raw.sampleCount)throw Error("CHAR120 missing native sprint "+name);
 if(track.keys.some(q=>q.length!==4||q.some(v=>!Number.isFinite(v))||
  Math.abs(q.reduce((s,v)=>s+v*v,0)-1)>.008))throw Error("CHAR120 malformed "+name);
}
raw.tracks=raw.tracks.map(track=>expected.includes(track.node)?byName.get(track.node):track);
raw.retargetMethod="per-bone reference-matrix hip/thigh/knee; UAL idle-relative upper body, ankles and toes";
raw.retargetGate="CHAR-120 foot alternation, knee plane, shoe-heading and standing regression required";
if(raw.tracks.some(t=>t.keys?.length!==41||
 t.keys.some(q=>q.length!==4||q.some(v=>!Number.isFinite(v))||
 Math.abs(q.reduce((s,v)=>s+v*v,0)-1)>.008)))throw Error("CHAR120 selected sprint contains malformed keys");
writeFileSync(output,JSON.stringify(raw));
console.info("CHAR120_SPRINT_RETARGET_READY="+JSON.stringify({
 source:"Sprint_Loop",duration:raw.duration,joints:raw.tracks.length,samples:raw.sampleCount,
 nativeLowerBody:expected,bytes:readFileSync(output).length}));
