/** CHAR-110E: stage only the measured, first-party-reference-matrix walk.
 * Source animation stays authored; no moonwalk patch, new model or runtime dependency.
 * Earlier raw candidate remains available only to the build-time auditor.
 */
import {readFileSync,writeFileSync} from "node:fs";
const file="public/GLBs/Characters/char110-ual-walk.json";
const alt=".char110-native-walk.json";
const old=JSON.parse(readFileSync(file,"utf8"));
const candidate=JSON.parse(readFileSync(alt,"utf8"));
if(old.schema!=="gtd.char110.ual-walk.v1"||candidate.schema!==old.schema||
 candidate.sampleCount!==41||old.tracks.length!==22||candidate.tracks.length!==22)
 throw Error("CHAR110E native candidate must retain original 22 mapped joints and 41 frames");
const namesOld=old.tracks.map(t=>t.node).join("|"),namesNew=candidate.tracks.map(t=>t.node).join("|");
if(namesOld!==namesNew)throw Error("CHAR110E mismatched anatomical map");
const modified=["Hips","LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase","RightUpLeg","RightLeg","RightFoot","RightToeBase"];
for(const name of modified){
 const a=old.tracks.find(t=>t.node===name),b=candidate.tracks.find(t=>t.node===name);
 if(!a||!b||!Array.isArray(b.keys)||b.keys.length!==41)throw Error("CHAR110E missing "+name);
 if(b.keys.some(q=>q.length!==4||q.some(v=>!Number.isFinite(v))||
   Math.abs(q.reduce((s,v)=>s+v*v,0)-1)>.007))throw Error("CHAR110E invalid native quaternion "+name);
 b.peakRadians=Math.max(...b.keys.map(q=>2*Math.acos(Math.min(1,Math.abs(q[3])))));
}
candidate.retargetMethod="Babylon 9 per-bone reference-frame candidate, source-authored gait";
candidate.retargetGate="CHAR-110E longitudinal alternation and CHAR-110C/D lateral/foot checks required";
writeFileSync(file,JSON.stringify(candidate));
console.info("CHAR110E_NATIVE_SELECTED="+JSON.stringify({method:candidate.retargetMethod,
 tracks:candidate.tracks.length,changedJoints:modified,bytes:readFileSync(file).length}));
