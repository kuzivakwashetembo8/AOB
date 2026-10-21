/** CHAR-110D: Real Rapier-ground and skeleton-space Foot IK diagnostics.
 * Adapts the three-player-controller footIK.html's probe/predict/debug approach
 * to Babylon + Rapier. This is an INSPECTION stage; do not claim a full IK solve.
 * Render gizmos only when the user explicitly enables diagnostics in Settings.
 */
import {Color3,Mesh,MeshBuilder,StandardMaterial,Vector3} from "@babylonjs/core";
import type {Scene,Skeleton,TransformNode} from "@babylonjs/core";
export type FootPhysicsDebugOptions={
 physicsDebug:boolean;physicsCapsuleDebug:boolean;footIKProbes:boolean;
 footIKDebug:boolean;footIKPrediction:boolean;footIKReachCm:number;footIKPredictionMs:number;
};
export const DEFAULT_FOOT_PHYSICS_DEBUG:FootPhysicsDebugOptions={
 physicsDebug:false,physicsCapsuleDebug:false,footIKProbes:false,
 footIKDebug:false,footIKPrediction:false,footIKReachCm:50,footIKPredictionMs:220,
};
export type GroundQuery110=(point:{x:number;y:number;z:number},maxDistance:number)=>
 {x:number;y:number;z:number;normal:{x:number;y:number;z:number}}|null;
type Marker = Mesh;
const clamp=(x:number,low:number,high:number)=>Math.max(low,Math.min(high,x));
export function createFootPhysicsInspector110(scene:Scene,skeletons:readonly Skeleton[]){
 const nodes=new Map<string,TransformNode>();
 for(const sk of skeletons)for(const b of sk.bones){const n=b.getTransformNode();if(n)nodes.set(b.name,n)}
 const names=["LeftLeg","RightLeg","LeftFoot","RightFoot"] as const;
 if(names.some(n=>!nodes.has(n)))throw Error("CHAR-110D: foot geometry inspection needs linked knees and ankles");
 let settings={...DEFAULT_FOOT_PHYSICS_DEBUG},query:GroundQuery110|null=null;
 let lastPosition:Vector3|null=null;
 let lastHits=0,lastPredictions=0;
 const material=(name:string,color:Color3)=>{
  const m=new StandardMaterial(name,scene);
  m.diffuseColor=color;m.emissiveColor=color.scale(.55);m.disableLighting=true;
  return m;
 };
 const leftMat=material("char110-left-foot-marker",new Color3(.08,.83,1));
 const rightMat=material("char110-right-foot-marker",new Color3(1,.70,.08));
 const landingMat=material("char110-contact-marker",new Color3(.15,1,.34));
 const predictedMat=material("char110-predictive-marker",new Color3(1,.2,.5));
 const capsuleMat=material("char110-rapier-capsule",new Color3(.6,.4,1));
 capsuleMat.wireframe=true;
 const make=(name:string,mat:StandardMaterial,size=.065)=>{
  const m=MeshBuilder.CreateSphere(name,{diameter:size*2,segments:8},scene);
  m.material=mat;m.isPickable=false;m.setEnabled(false);
  return m;
 };
 const feet=[make("char110-foot-left",leftMat),make("char110-foot-right",rightMat)];
 const knees=[make("char110-knee-left",leftMat,.05),make("char110-knee-right",rightMat,.05)];
 const contacts=[make("char110-contact-left",landingMat,.05),make("char110-contact-right",landingMat,.05)];
 const predictions=[make("char110-prediction-left",predictedMat,.06),make("char110-prediction-right",predictedMat,.06)];
 // Character Rapier collider: 0.55m cylindrical half-height + 0.35m radius.
 const capsule=MeshBuilder.CreateCapsule("char110-physics-actual-capsule",
   {height:1.8,radius:.35,capSubdivisions:6,tessellation:12},scene);
 capsule.material=capsuleMat;capsule.isPickable=false;capsule.setEnabled(false);
 const marks:Mesh[]=[...feet,...knees,...contacts,...predictions,capsule];
 const read=(name:string)=>{const node=nodes.get(name)!;node.computeWorldMatrix(true);return node.getAbsolutePosition()};
 const set=(mesh:Marker,p:Vector3,enabled:boolean)=>{mesh.setEnabled(enabled);if(enabled)mesh.position.copyFrom(p)};
 const clear=()=>marks.forEach(m=>m.setEnabled(false));
 return {
  configure(options:FootPhysicsDebugOptions,groundQuery:GroundQuery110){
   settings={physicsDebug:options.physicsDebug===true,
    physicsCapsuleDebug:options.physicsCapsuleDebug===true,
    footIKProbes:options.footIKProbes===true,
    footIKDebug:options.footIKDebug===true,
    footIKPrediction:options.footIKPrediction===true,
    footIKReachCm:clamp(options.footIKReachCm||50,15,100),
    footIKPredictionMs:clamp(options.footIKPredictionMs||220,100,500)};
   query=groundQuery;
   if(!settings.physicsDebug&&!settings.physicsCapsuleDebug&&!settings.footIKDebug)clear();
  },
  update(position:{x:number;y:number;z:number},dt:number){
   if(!query)return;
   const here=new Vector3(position.x,position.y,position.z);
   const velocity=lastPosition&&dt>0?here.subtract(lastPosition).scale(1/Math.max(dt,.001)):Vector3.Zero();
   lastPosition=here.clone();
   const speed=velocity.length();let hits=0,predicted=0;
   const showFeet=settings.footIKDebug && settings.footIKProbes;
   const showGround=settings.physicsDebug||showFeet;
   for(let i=0;i<2;i++){
    const foot=read(i===0?"LeftFoot":"RightFoot");
    const knee=read(i===0?"LeftLeg":"RightLeg");
    set(feet[i],foot,showFeet);set(knees[i],knee,showFeet);
    if(showGround&&settings.footIKProbes){
     // Cast against the current live Rapier world, excluding the player's capsule.
     const origin={x:foot.x,y:foot.y+settings.footIKReachCm/100,z:foot.z};
     const hit=query(origin,1+settings.footIKReachCm/100);
     if(hit){hits++;set(contacts[i],new Vector3(hit.x,hit.y+.015,hit.z),true)}
     else contacts[i].setEnabled(false);
    }else contacts[i].setEnabled(false);
    if(showFeet&&settings.footIKPrediction&&speed>.15){
     const travel=velocity.scale(clamp(settings.footIKPredictionMs/1000,0.1,0.5));
     if(travel.lengthSquared()>.5*.5)travel.normalize().scaleInPlace(.5);
     const target=foot.add(travel);
     const pred=query({x:target.x,y:target.y+.7,z:target.z},2);
     if(pred){predicted++;set(predictions[i],new Vector3(pred.x,pred.y+.025,pred.z),true)}
     else predictions[i].setEnabled(false);
    }else predictions[i].setEnabled(false);
   }
   set(capsule,new Vector3(position.x,position.y,position.z),settings.physicsCapsuleDebug);
   lastHits=hits;lastPredictions=predicted;
  },
  hide(){clear();lastPosition=null;},
  get report(){return {groundQueries:lastHits,predictedContacts:lastPredictions,
   fullTwoBoneIK:false,diagnosticOnly:true,options:{...settings}};},
  dispose(){marks.forEach(m=>m.dispose());[leftMat,rightMat,landingMat,predictedMat,capsuleMat].forEach(m=>m.dispose());}
 };
}
