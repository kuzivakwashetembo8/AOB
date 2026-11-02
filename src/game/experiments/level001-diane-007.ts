/** GTD LVL-001: Diane — owner-approved first investigation, no combat.
 * Deterministic NPC ownership, route, evidence and local progress.
 * No Babylon, physics or UI imports: pure mission gameplay state.
 */
import {pedestrianRoute001,type PedGraph001} from "./north-heights-pedestrian-graph-001";
import type {NorthHeightsPedestrianSimulator001,PedAgent001} from "./north-heights-pedestrian-simulator-001";

export type DianePhase001="unassigned"|"find"|"follow"|"return"|"complete";
export type DianeProgress001={
 phase:DianePhase001;ssn:string;
};
export type DianeMissionView001={
 phase:DianePhase001;poi:{x:number;z:number}|null;
 name:string;ssn:string;objective:string;
};
export const DIANE_PROGRESS_KEY_001="gtd:level001:diane:progress:v1";
export const DIANE_NAME_001="Diane";
export const DIANE_APPEARANCE_001=63;
export const DIANE_AGENT_ID_001="PED-063";
export const DIANE_OFFICERS_001=["PED-024","PED-033","PED-051"] as const;
export const DIANE_START_HINT_001={x:70,z:-58} as const;
export const DIANE_MEETING_HINT_001={x:70,z:-6} as const;
export const DIANE_DIALOGUE_ASSIGNMENT_001=[
 "Mr. Reese, The Machine has given us a new number.",
 "Her name is Diane. We don't know whether she's a victim or a perpetrator.",
 "Find her and follow her. I want to know who she's meeting.",
 "Don't intervene. Come back when you have something.",
] as const;
export const DIANE_DIALOGUE_REPORT_001=[
 "Diane met three men. Plainclothes officers. They seemed to know each other.",
 "Interesting. I'll look into them. We may have misunderstood Diane's role in this.",
] as const;
const phases:readonly DianePhase001[]=["unassigned","find","follow","return","complete"];
/** 000 area prefix is *deliberately invalid*, never a real person's SSN. */
export const DIANE_FICTIONAL_SSN_001="000-73-6291";
export function parseDianeProgress001(raw:string|null):DianeProgress001{
 try{
  if(raw){
   const value=JSON.parse(raw) as Partial<DianeProgress001>;
   if(phases.includes(value.phase as DianePhase001)&&value.ssn===DIANE_FICTIONAL_SSN_001)
    return {phase:value.phase!,ssn:value.ssn};
  }
 }catch{/* Broken local state cannot block world loading. */}
 return {phase:"unassigned",ssn:DIANE_FICTIONAL_SSN_001};
}
export function readDianeProgress001():DianeProgress001{
 if(typeof window==="undefined")return parseDianeProgress001(null);
 try{return parseDianeProgress001(window.localStorage.getItem(DIANE_PROGRESS_KEY_001));}
 catch{return parseDianeProgress001(null);}
}
export function saveDianeProgress001(value:DianeProgress001):void{
 if(typeof window==="undefined")return;
 try{window.localStorage.setItem(DIANE_PROGRESS_KEY_001,JSON.stringify(value));}
 catch{/* Restrictive browser storage must not prevent gameplay. */}
}
export function dianeObjective001(phase:DianePhase001):string{
 return phase==="unassigned"?"Meet Finch on Floor 53 to receive Level 001"
 :phase==="find"?"Level 001 · Find Diane at the map point of interest"
 :phase==="follow"?"Level 001 · Follow Diane and observe her meeting"
 :phase==="return"?"Level 001 · Return to Finch on Floor 53"
 :"Level 001 — Diane · Mission completed";
}
function nearestNode(graph:PedGraph001,p:{x:number;z:number}){
 let best:string|null=null,bestDistance=Infinity;
 for(const n of graph.nodes.values()){
  if(n.kind!=="sidewalk"&&n.kind!=="corner")continue;
  const distance=(n.x-p.x)**2+(n.z-p.z)**2;
  if(distance<bestDistance){bestDistance=distance;best=n.id;}
 }
 if(!best)throw new Error("LVL-001 pedestrian sidewalk graph has no nodes");
 return best;
}
function reserveAgent(sim:NorthHeightsPedestrianSimulator001,id:string){
 const a=sim.agents.find(v=>v.id===id);
 if(!a)throw new Error("LVL-001 missing existing character "+id);
 return a;
}
function setPose(a:PedAgent001,point:{x:number;z:number},heading=0){
 a.x=point.x;a.z=point.z;a.heading=heading;a.state="wait";a.stateAge=0;
 a.route=[];a.segment=0;a.progress=0;
}
export class DianeLevel001{
 readonly target:PedAgent001;
 readonly officers:readonly PedAgent001[];
 readonly start:{x:number;z:number};
 readonly meeting:{x:number;z:number};
 private readonly sim:NorthHeightsPedestrianSimulator001;
 private readonly route:string[];
 private phase:DianePhase001;
 private segment=0;
 private offset=0;
 private meetingReached=false;
 private watchSeconds=0;
 private onChange:(view:DianeMissionView001)=>void;
 constructor(sim:NorthHeightsPedestrianSimulator001,
  progress:DianeProgress001,onChange:(view:DianeMissionView001)=>void){
  this.sim=sim;this.phase=progress.phase;this.onChange=onChange;
  this.target=reserveAgent(sim,DIANE_AGENT_ID_001);
  this.officers=DIANE_OFFICERS_001.map(id=>reserveAgent(sim,id));
  if(new Set([this.target.id,...this.officers.map(a=>a.id)]).size!==4)
   throw Error("LVL-001 NPC identities are not unique");
  const startId=nearestNode(sim.graph,DIANE_START_HINT_001);
  const endId=nearestNode(sim.graph,DIANE_MEETING_HINT_001);
  this.start={...sim.graph.nodes.get(startId)!};
  this.meeting={...sim.graph.nodes.get(endId)!};
  this.route=pedestrianRoute001(sim.graph,startId,endId);
  if(this.route.length<2)throw Error("LVL-001 no continuous pedestrian sidewalk route for Diane");
  sim.reserveAgents001([this.target.id,...this.officers.map(a=>a.id)]);
  this.placeActors();
  this.notify();
 }
 private placeActors(){
  setPose(this.target,this.start);
  const spots=[{x:-1.7,z:-1.1},{x:1.7,z:-1.1},{x:0,z:1.8}];
  this.officers.forEach((a,i)=>setPose(a,{
   x:this.meeting.x+spots[i]!.x,z:this.meeting.z+spots[i]!.z
  },Math.PI));
  if(this.phase==="return")this.placeMeeting();
  if(this.phase==="complete")this.releaseIntoAmbient();
 }
 private placeMeeting(){
  setPose(this.target,{x:this.meeting.x,z:this.meeting.z-2.1},Math.PI);
  this.meetingReached=true;
 }
 private releaseIntoAmbient(){
  for(const a of [this.target,...this.officers]){
   const origin=this.sim.graph.entrances.get(a.origin);
   const p=origin?this.sim.graph.nodes.get(origin):null;
   if(p){a.x=p.x;a.z=p.z;}
   a.state="inside";a.stateAge=0;a.insideSeconds=2;
   a.route=[];a.segment=0;a.progress=0;
  }
  this.sim.releaseAgents001([this.target.id,...this.officers.map(a=>a.id)]);
 }
 get stage(){return this.phase;}
 get view():DianeMissionView001{
  return {phase:this.phase,name:DIANE_NAME_001,ssn:DIANE_FICTIONAL_SSN_001,
   poi:this.phase==="find"?{...this.start}:null,
   objective:dianeObjective001(this.phase)};
 }
 get npcPosition(){return {x:this.target.x,z:this.target.z};}
 private notify(){
  this.onChange(this.view);
 }
 private change(next:DianePhase001){
  if(phases.indexOf(next)<=phases.indexOf(this.phase))return;
  this.phase=next;
  saveDianeProgress001({phase:next,ssn:DIANE_FICTIONAL_SSN_001});
  if(next==="complete")this.releaseIntoAmbient();
  this.notify();
 }
 assign():boolean{
  if(this.phase!=="unassigned")return false;
  this.change("find");return true;
 }
 report():boolean{
  if(this.phase!=="return")return false;
  this.change("complete");return true;
 }
 /**
  * Called after ambient pedestrians step. Scripted IDs are excluded from
  * ambient motion so they cannot be routed to unrelated buildings.
  * The stage checkpoint is durable; a refresh during follow restarts only
  * the short pedestrian route, never the whole mission.
  */
 tick(dt:number,player:{x:number;y:number;z:number}|null,
  facing:number,walking:boolean,ground:(x:number,z:number)=>number):void{
  if(this.phase==="unassigned"||this.phase==="complete"||!player)return;
  const near=(p:{x:number;z:number})=>Math.hypot(player.x-p.x,player.z-p.z);
  const levelNear=Math.abs(player.y-ground(player.x,player.z)-.92)<3.6;
  if(this.phase==="find"){
   if(walking&&levelNear&&near(this.start)<=5.5)this.change("follow");
   else return;
  }
  if(this.phase==="follow"){
   if(!this.meetingReached){
    // Forgiving recovery: freeze in place when Reese lags behind.
    if(!walking||!levelNear||near(this.target)>28)return;
    let remaining=this.target.speed*Math.min(.1,Math.max(0,dt));
    while(remaining>.00001&&this.segment<this.route.length-1){
     const p=this.sim.graph.nodes.get(this.route[this.segment]!)!;
     const q=this.sim.graph.nodes.get(this.route[this.segment+1]!)!;
     const length=Math.hypot(q.x-p.x,q.z-p.z);
     if(length<=.00001){this.segment++;this.offset=0;continue;}
     const step=Math.min(remaining,length-this.offset);
     this.offset+=step;remaining-=step;
     const t=Math.min(1,this.offset/length);
     this.target.x=p.x+(q.x-p.x)*t;
     this.target.z=p.z+(q.z-p.z)*t;
     this.target.heading=Math.atan2(q.x-p.x,q.z-p.z);
     this.target.state="walk";
     if(this.offset>=length-.00001){this.segment++;this.offset=0;}
    }
    if(this.segment>=this.route.length-1)this.placeMeeting();
   }
   if(this.meetingReached){
    const distance=near(this.meeting);
    const vx=(this.meeting.x-player.x)/Math.max(.001,distance);
    const vz=(this.meeting.z-player.z)/Math.max(.001,distance);
    const inView= vx*Math.sin(facing)+vz*Math.cos(facing)>.15;
    const close=walking&&levelNear&&distance<=12.5&&distance>=2;
    this.watchSeconds=close&&inView?this.watchSeconds+Math.max(0,dt):0;
    if(this.watchSeconds>=2.5)this.change("return");
   }
  }
 }
}
