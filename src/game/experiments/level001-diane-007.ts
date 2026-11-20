/** LVL-001 Diane: vehicle surveillance, roadside meeting, reboarding and report.
 * Owns four existing pedestrian identities and one of 62 accepted traffic cars.
 * All vehicle movement uses NH012 road traffic; no standalone car motion or GLB.
 */
import type {PedGraph001} from "./north-heights-pedestrian-graph-001";
import {dianeRoadStop008,dianeRoadMeters008,dianeCrossCityRoute008} from "./level001-diane-road-008";
import type {NorthHeightsPedestrianSimulator001,PedAgent001} from "./north-heights-pedestrian-simulator-001";
import type {NH012TrafficSimulator,NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
export type DianePhase001="unassigned"|"find"|"follow"|"observe"|"return"|"complete"|"failed";
export type DianeProgress001={phase:DianePhase001;ssn:string};
export type DianeMissionView001={phase:DianePhase001;poi:{x:number;z:number}|null;name:string;ssn:string;objective:string};
export const DIANE_PROGRESS_KEY_001="gtd:level001:diane:progress:v1";
export const DIANE_NAME_001="Diane";
export const DIANE_APPEARANCE_001=60;
export const DIANE_AGENT_ID_001="PED-060";
export const DIANE_OFFICERS_001=["PED-024","PED-033","PED-051"] as const;
// Relocated to the far eastern sector: no more encounter on Finch's doorstep.
export const DIANE_START_HINT_001={x:188,z:-230} as const;
export const DIANE_SPOTTED_DISTANCE_009=18;
export const DIANE_SPOTTED_SECONDS_009=.8;
export const DIANE_DIALOGUE_FAILED_009=[
 "Diane spotted me. I got too close and she ran.",
 "We lost our cover, Mr. Reese. We'll restart surveillance from a safer distance.",
] as const;
export const DIANE_MEETING_HINT_001={x:-198,z:182} as const;
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
const phases:readonly DianePhase001[]=["unassigned","find","follow","observe","return","complete","failed"];
export const DIANE_FICTIONAL_SSN_001="000-73-6291";
export function parseDianeProgress001(raw:string|null):DianeProgress001{
 try{if(raw){const v=JSON.parse(raw) as Partial<DianeProgress001>;
  if(phases.includes(v.phase as DianePhase001)&&v.ssn===DIANE_FICTIONAL_SSN_001)
   return {phase:v.phase!,ssn:v.ssn};
 }}catch{/* invalid save is ignored */}
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
 catch{/* game functions without storage */}
}
export function dianeObjective001(phase:DianePhase001):string{
 return phase==="unassigned"?"Meet Finch on Floor 53 to receive Level 001"
 :phase==="find"?"Level 001 · Locate Diane at the map point of interest"
 :phase==="follow"?"Level 001 · Get in a car and follow Diane across North Heights"
 :phase==="observe"?"Level 001 · Watch Diane meet the three men and return to her car"
 :phase==="return"?"Level 001 · Return to Finch on Floor 53"
 :phase==="failed"?"LEVEL 001 FAILED · Diane spotted you. Return to Finch.":"Level 001 — Diane · Mission completed";
}
function nearestSidewalk(graph:PedGraph001,p:{x:number;z:number}){
 let selected:string|null=null,dist=Infinity;
 for(const n of graph.nodes.values()){
  if(n.kind!=="sidewalk"&&n.kind!=="corner")continue;
  const d=(n.x-p.x)**2+(n.z-p.z)**2;
  if(d<dist){dist=d;selected=n.id;}
 }
 if(!selected)throw Error("LVL-001 has no pedestrian pavement nodes");
 return selected;
}
function setPose(a:PedAgent001,p:{x:number;z:number},heading=0,state:"wait"|"walk"|"inside"="wait"){
 a.x=p.x;a.z=p.z;a.heading=heading;a.state=state;a.stateAge=0;
 a.route=[];a.segment=0;a.progress=0;
}
function doorSide(car:NH012Agent,distance:number){
 return {x:car.x+Math.cos(car.heading)*distance,z:car.z-Math.sin(car.heading)*distance};
}
type PlayerSnapshot001={x:number;y:number;z:number;inCar:boolean;speed:number};
export class DianeLevel001{
 readonly target:PedAgent001;
 readonly officers:readonly PedAgent001[];
 readonly car:NH012Agent;
 readonly start:{x:number;z:number};
 readonly meeting:{x:number;z:number};
 readonly routeMeters:number;
 private readonly sim:NorthHeightsPedestrianSimulator001;
 private readonly traffic:NH012TrafficSimulator;
 private readonly finishStop:ReturnType<typeof dianeRoadStop008>;
 private readonly startStop:ReturnType<typeof dianeRoadStop008>;
 private phase:DianePhase001;
 private driveStarted=false;
 private atMeeting=false;
 private meetingArrived=false;
 private watchSeconds=0;
 private returnStarted=false;
 private returnDone=false;
 private boardingSeconds=0;
 private driveSeconds=0;
 private spottedSeconds=0;
 private fleeingSeconds=0;
 private fleeAway={x:0,z:1};
 private readonly onChange:(view:DianeMissionView001)=>void;
 private readonly carSideDistance=2.6;
 constructor(sim:NorthHeightsPedestrianSimulator001,traffic:NH012TrafficSimulator,
  carId:string,progress:DianeProgress001,onChange:(view:DianeMissionView001)=>void){
  this.sim=sim;this.traffic=traffic;this.phase=progress.phase;this.onChange=onChange;
  const target=sim.agents.find(a=>a.id===DIANE_AGENT_ID_001);
  const car=traffic.agents.find(a=>a.id===carId);
  if(!target||!car)throw Error("LVL-001 committed NPC or car identity unavailable");
  this.target=target;this.car=car;
  this.officers=DIANE_OFFICERS_001.map(id=>{
   const officer=sim.agents.find(a=>a.id===id);
   if(!officer)throw Error("LVL-001 officer identity "+id+" missing");
   return officer;
  });
  if(new Set([target.id,...this.officers.map(a=>a.id)]).size!==4)
   throw Error("LVL-001 duplicate mission appearance");
  const startStop=dianeRoadStop008(traffic.graph,DIANE_START_HINT_001);
  this.startStop=startStop;
  const meetingSidewalkId=nearestSidewalk(sim.graph,DIANE_MEETING_HINT_001);
  const site=sim.graph.nodes.get(meetingSidewalkId)!;
  this.meeting={x:site.x,z:site.z};
  this.finishStop=dianeRoadStop008(traffic.graph,this.meeting);
  const roadRoute=dianeCrossCityRoute008(traffic.graph,startStop.edgeId,startStop.s,this.finishStop);
  if(!roadRoute)throw Error("LVL-001 drive has no legal directed route");
  this.routeMeters=dianeRoadMeters008(traffic.graph,roadRoute,startStop.s);
  if(this.routeMeters<250)throw Error("LVL-001 cross-city drive is too short");
  sim.reserveAgents001([target.id,...this.officers.map(a=>a.id)]);
  const parked=this.phase==="observe"||this.phase==="return"||this.phase==="complete"
   ?this.finishStop:startStop;
  if(!traffic.parkDianeVehicle001(car.id,parked))throw Error("LVL-001 car reservation failed");
  this.start=doorSide(car,this.carSideDistance);
  this.placeOfficers();
  if(this.phase==="observe")this.placeExit();
  else if(this.phase==="follow"||this.phase==="return")setPose(target,doorSide(car,1.5),car.heading,"inside");
  else setPose(target,this.start,car.heading);
  if(this.phase==="complete")this.releaseAmbient();
  this.emit();
 }
 private placeOfficers(){
  const locs=[{x:-2.8,z:0},{x:2.8,z:0},{x:0,z:2.8}];
  this.officers.forEach((a,i)=>setPose(a,{x:this.meeting.x+locs[i]!.x,z:this.meeting.z+locs[i]!.z},Math.PI));
 }
 private placeExit(){setPose(this.target,doorSide(this.car,this.carSideDistance),this.car.heading);this.atMeeting=true;}
 private releaseAmbient(){
  for(const a of [this.target,...this.officers]){
   const entry=this.sim.graph.entrances.get(a.origin);
   const node=entry?this.sim.graph.nodes.get(entry):null;
   if(node){a.x=node.x;a.z=node.z;}
   a.state="inside";a.insideSeconds=2;a.stateAge=0;a.route=[];a.segment=0;a.progress=0;
  }
  this.sim.releaseAgents001([this.target.id,...this.officers.map(a=>a.id)]);
 }
 get stage(){return this.phase;}
 get carId(){return this.car.id;}
 get carPosition(){return {x:this.car.x,z:this.car.z};}
 get npcPosition(){return {x:this.target.x,z:this.target.z};}
 get vehicleOccupied(){return this.target.state==="inside";}
 get view():DianeMissionView001{
  return {phase:this.phase,name:DIANE_NAME_001,ssn:DIANE_FICTIONAL_SSN_001,
   poi:this.phase==="find"?{...this.start}:null,objective:dianeObjective001(this.phase)};
 }
 private emit(){this.onChange(this.view);}
 private change(next:DianePhase001){
  if(phases.indexOf(next)<=phases.indexOf(this.phase))return;
  this.phase=next;
  saveDianeProgress001({phase:next,ssn:DIANE_FICTIONAL_SSN_001});
  if(next==="complete")this.releaseAmbient();
  this.emit();
 }
 assign(){if(this.phase!=="unassigned")return false;this.change("find");return true;}
 report(){
  if(this.phase==="return"){this.change("complete");return true;}
  if(this.phase!=="failed")return false;
  // A debrief at Finch allows a clean second surveillance attempt.
  this.traffic.finishDianeDrive001(this.car.id);
  this.traffic.parkDianeVehicle001(this.car.id,this.startStop);
  this.driveStarted=false;this.atMeeting=false;this.meetingArrived=false;
  this.returnStarted=false;this.returnDone=false;this.watchSeconds=0;
  this.boardingSeconds=0;this.driveSeconds=0;this.spottedSeconds=0;this.fleeingSeconds=0;
  setPose(this.target,doorSide(this.car,this.carSideDistance),this.car.heading);
  this.phase="find";
  saveDianeProgress001({phase:"find",ssn:DIANE_FICTIONAL_SSN_001});
  this.emit();return true;
 }
 private isSpotted(distance:number,dt:number):boolean{
  if(this.driveSeconds<2||!Number.isFinite(distance))return false;
  this.spottedSeconds=distance<DIANE_SPOTTED_DISTANCE_009
   ?this.spottedSeconds+Math.max(0,dt):Math.max(0,this.spottedSeconds-dt*2);
  return this.spottedSeconds>=DIANE_SPOTTED_SECONDS_009;
 }
 private blown(player:PlayerSnapshot001){
  this.traffic.finishDianeDrive001(this.car.id);
  const dx=this.car.x-player.x,dz=this.car.z-player.z;
  const length=Math.max(.001,Math.hypot(dx,dz));
  this.fleeAway={x:dx/length,z:dz/length};
  setPose(this.target,doorSide(this.car,this.carSideDistance),this.car.heading,"walk");
  this.change("failed");
 }
 private moveDianeTowards(dest:{x:number;z:number},dt:number){
  const dx=dest.x-this.target.x,dz=dest.z-this.target.z,d=Math.hypot(dx,dz);
  if(d<.12){setPose(this.target,dest,this.target.heading);return true;}
  const step=Math.min(d,1.45*Math.max(0,dt));
  this.target.heading=Math.atan2(dx,dz);
  this.target.x+=dx/d*step;this.target.z+=dz/d*step;this.target.state="walk";
  return false;
 }
 /** Called on every active frame after NH012 traffic advances. */
 tick(dt:number,player:PlayerSnapshot001|null,facing:number,
   ground:(x:number,z:number)=>number):void{
  if(this.phase==="unassigned"||this.phase==="complete"||!player)return;
  if(this.phase==="failed"){
   // A compromised tail ends: Diane runs away rather than meeting the officers.
   if(this.fleeingSeconds<5){
    this.target.x+=this.fleeAway.x*4.6*Math.max(0,dt);
    this.target.z+=this.fleeAway.z*4.6*Math.max(0,dt);
    this.target.heading=Math.atan2(this.fleeAway.x,this.fleeAway.z);
    this.target.state="walk";this.fleeingSeconds+=Math.max(0,dt);
   }else this.target.state="wait";
   return;
  }
  const distance=(p:{x:number;z:number})=>Math.hypot(player.x-p.x,player.z-p.z);
  const levelNear=player.inCar||Math.abs(player.y-ground(player.x,player.z)-.92)<3.6;
  if(this.phase==="find"){
   if(!player.inCar&&levelNear&&distance(this.target)<7)this.change("follow");
   else return;
  }
  if(this.phase==="follow"){
   // Diane first approaches and boards her already parked real Sedan.
   if(this.target.state!=="inside"){
    const boarded=this.moveDianeTowards(doorSide(this.car,1.5),dt);
    if(boarded)setPose(this.target,doorSide(this.car,1.5),this.car.heading,"inside");
    return;
   }
   if(!this.driveStarted){
    // A separate player-controlled Sedan must be present; never board Diane's car.
    if(!player.inCar||distance(this.car)>65)return;
    if(!this.traffic.beginDianeDrive001(this.car.id,this.finishStop))return;
    this.driveStarted=true;
   }
   this.driveSeconds+=Math.max(0,dt);
   if(player.inCar&&this.isSpotted(distance(this.car),dt)){
    this.blown(player);return;
   }
   if(!player.inCar)this.traffic.paceDianeVehicle001(this.car.id,120);
   else this.traffic.paceDianeVehicle001(this.car.id,distance(this.car));
   if(this.traffic.targetDriveStatus003(this.car.id)==="arrived"){
    this.traffic.finishDianeDrive001(this.car.id);
    this.placeExit();this.change("observe");
   }
   return;
  }
  if(this.phase!=="observe")return;
  if(!this.meetingArrived){
   // Diane waits at the destination until Reese can see the exit.
   if(!this.atMeeting)this.placeExit();
   if(distance(this.car)>65||!levelNear)return;
   if(this.moveDianeTowards(this.meeting,dt))this.meetingArrived=true;
   return;
  }
  if(!this.returnStarted){
   const d=distance(this.meeting);
   const dx=(this.meeting.x-player.x)/Math.max(.001,d);
   const dz=(this.meeting.z-player.z)/Math.max(.001,d);
   const visible=dx*Math.sin(facing)+dz*Math.cos(facing)>.1;
   const stationary=!player.inCar||player.speed<.8;
   this.watchSeconds=d<=23&&d>=2&&visible&&levelNear&&stationary
    ?this.watchSeconds+Math.max(0,dt):0;
   if(this.watchSeconds>=2.5)this.returnStarted=true;
   return;
  }
  if(!this.returnDone){
   // Meeting completed: visibly return to the same stationary vehicle.
   if(this.moveDianeTowards(doorSide(this.car,this.carSideDistance),dt))
    this.returnDone=true;
   return;
  }
  this.boardingSeconds+=dt;
  if(this.boardingSeconds>=.7){
   setPose(this.target,doorSide(this.car,1.5),this.car.heading,"inside");
   this.change("return");
  }
 }
}
