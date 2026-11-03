/** NH-012: deterministic microscopic car traffic. Pure TypeScript, no GLB, Rapier or DOM.
 * The moving dots and future GLBs are ONLY views of these agent positions. */
import {
 buildNorthHeightsTrafficGraph012,nh012PointOnConnector,nh012PointOnEdge,
 nh012HeadingBetween, NH012_SIMULATION_DT,
 type TrafficGraph012,type TrafficConnector012,
} from "./nh012-lane-network";
import {NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH} from "@/game/vehicles/nh-solid-vehicle-collision-017";
import {
 stage6SteerStep,stage6SweepSedan,STAGE6_WHEELBASE_METERS,
 type SedanStage6Pose,
} from "@/game/vehicles/nh-opt2-sedan-free-steering-stage6";
import {FINCH_START_005} from "@/game/experiments/north-heights-finch-intro-005";
import {planFinchTargetedRoute003,type TargetedRoadRoute003}
 from "@/game/experiments/north-heights-finch-routing-003";
import {dianeCrossCityRoute008,type DianeRoadStop008}
 from "@/game/experiments/level001-diane-road-008";

export type NH012MotionState="moving"|"braking"|"stopped"|"turning";
/** A single tap queues the next legal relative turn, not freeform steering. */
export type NH012DriverTurn="left"|"right";
export type NH012TurnResult="queued"|"unavailable"|"locked"|"missing";
export type NH012ManualTurnResult="turning"|"too-early"|"unavailable"|"locked"|"missing"|"not-manual";
export const NH012_MANUAL_ACCEL=2.6;
export const NH012_MANUAL_MAX_SPEED=10.4;
export const NH012_MANUAL_REVERSE_LIMIT=5.2;
export const NH012_MANUAL_TURN_ZONE=8;
const NH012_MANUAL_COAST=1.5;
export type NH012Agent= {
 readonly id:string;readonly modelId:string;readonly paintId:string;
 readonly length:number;readonly width:number;
 edgeId:string;connectorId:string|null;plannedConnectorId:string|null;s:number;speed:number;
 x:number;z:number;heading:number;state:NH012MotionState;
 destination:string;arrivalTick:number;waitTicks:number;
 /** Explicit manual wheel angle control, only while Stage 6 is active. */
 manualSteer?:number;
};
const MODELS=[
 {id:"gtd-veh006-mercer-range-rover",length:4.85,width:2.03,paints:["WHITE","BLACK","SILVER","GRAPHITE","NAVY"]},
 {id:"gtd-veh008-mercer-toyota-hilux",length:5.25,width:2.15,paints:["WHITE","SILVER","GREY","NAVY","FOREST_GREEN"]},
 {id:"gtd-veh009-mercer-land-rover-defender",length:4.75,width:2.10,paints:["WHITE","BLACK","GREY","FOREST_GREEN","CHAMPAGNE"]},
 {id:"gtd-veh010-mercer-dodge-hp",length:5.10,width:2.06,paints:["BLACK","WHITE","RED","BURGUNDY","GRAPHITE"]},
 {id:"gtd-veh014-mercer-lamborghini-temerario",length:4.75,width:2.00,paints:["PEARL_WHITE","BLACK","RED","BURGUNDY","BLUE_METALLIC"]},
] as const;
/** Five accepted default traffic models, five colour variants and five agents
 * per variant = the SAME 125 traffic actors. BMW is removed entirely; 34
 * existing sedan/hatchback/taxi/Kangoo overlays still relabel those actors.
 * No BMW model IDs, GLB or high-poly native meshes are in moving traffic. */
function fleetManifest(){
 const out:{id:string;modelId:string;paintId:string;length:number;width:number}[]=[];
 for(const model of MODELS)
   for(const paint of model.paints)for(let ordinal=0;ordinal<5;ordinal++)
     out.push({id:"NH012:"+model.id+":"+paint+":"+ordinal,
       modelId:model.id,paintId:paint,length:model.length,width:model.width});
 if(out.length!==125||new Set(out.map(a=>a.id)).size!==125||
    out.some(a=>a.modelId.includes("bmw")))
   throw Error("NH012 five-model, BMW-free 125-agent manifest invalid");
 return out;
}
function randomSeeded(seed:number){let v=seed>>>0;return ()=>{
 v=(Math.imul(v,1664525)+1013904223)>>>0;
 return v/4294967296;
};}
const MAX_SPEED=8, ACCEL=2, BRAKE=3.5, MIN_GAP=2.0;
const safe=(v:number)=>Math.max(0,v);
export interface NH012TrafficSnapshot {
 readonly tick:number;readonly count:number;readonly moving:number;
 readonly braking:number;readonly stopped:number;readonly turning:number;
 readonly agents:readonly NH012Agent[];
}
export class NH012TrafficSimulator {
 readonly graph:TrafficGraph012;
 readonly agents:NH012Agent[]=[];
 readonly population:number;
 private readonly rng:()=>number;
 private readonly reservations=new Map<string,string>();
 /** SDN-001 Stage 2: one rider can request braking for ONE original traffic
  * agent. No separate car transform, chassis physics or replacement renderer. */
 private driverBrakeId:string|null=null;
 /** Stage 3: a separate bounded throttle request. The traffic simulator still
  * owns the one actual route, pose, speed and intersection reservation.
  * A fractional throttle (touch/gamepad) requests fractional ACCEL, never
  * faster than the original AI 2 m/s² or 8 m/s speed cap. */
 private driverThrottleId:string|null=null;
 private driverThrottleAmount=0;
 /** Stage 5: a single signed-velocity driver on the ORIGINAL traffic agent.
  * All other traffic agents use the identical accepted NH-012 AI solver. */
 /** Route is owned only by the currently occupied traffic agent. */
 private targeted: {agentId:string;route:TargetedRoadRoute003;index:number;arrived:boolean}|null=null;
 private dianePace001:{id:string;maxSpeed:number}|null=null;
 targetDriveStatus003(agentId:string):"none"|"enroute"|"arrived"{
  return this.targeted?.agentId===agentId?(this.targeted.arrived?"arrived":"enroute"):"none";
 }
 clearTargetDrive003(agentId:string|null=null):void{
  const t=this.targeted;
  if(!t||(agentId&&t.agentId!==agentId))return;
  const agent=this.agents.find(a=>a.id===t.agentId);
  if(agent&&!agent.connectorId)agent.plannedConnectorId=null;
  this.targeted=null;
 }
 beginFinchTargetDrive003(agentId:string):{ok:boolean;reason:string;meters?:number}{
  const agent=this.agents.find(a=>a.id===agentId);
  if(!agent)return {ok:false,reason:"Vehicle unavailable"};
  if(this.freeParkedAgents.has(agentId))
   return {ok:false,reason:"Drive the parked car onto a road before selecting a route"};
  if(this.isManualDriving(agentId)&&!this.endManualDriving())
   return {ok:false,reason:"Return to a traffic lane before selecting Finch HQ"};
  const route=planFinchTargetedRoute003(this.graph,agent.edgeId,agent.s,agent.connectorId);
  if(!route)return {ok:false,reason:"No legal road route to Finch HQ"};
  this.clearDriverTurn();this.clearTargetDrive003();
  agent.plannedConnectorId=null;
  this.targeted={agentId,route,index:0,arrived:false};
  return {ok:true,reason:"Driving to Finch HQ",meters:route.doorDistance};
 }
 private manual: {
   agentId:string;velocity:number;forward:number;reverse:number;
   history:string[];steering:number;steeringRequest:number;free:boolean;
 }|null=null;
 /** Only one original traffic sedan may leave the NH012 route graph. The
  * other 124 agents retain their exact AI movement and reservation model. */
 private freeDrivingAdmission:((p:SedanStage6Pose,length:number,width:number,id:string)=>boolean)|null=null;
 private solidAdmission:((agent:NH012Agent,p:SedanStage6Pose)=>boolean)|null=null;
 configureSolidTraffic(admission:(agent:NH012Agent,p:SedanStage6Pose)=>boolean):void{
   this.solidAdmission=admission;
 }
 /** Contact impulse simulation is activated only for impact participants.
  * The remaining traffic retains its accepted 20 Hz route solver. */
 private contactTarget:((mover:NH012Agent,probe:SedanStage6Pose)=>
   {id:string;nx:number;nz:number}|null)|null=null;
 private readonly impactMotion=new Map<string,{vx:number;vz:number;ttl:number}>();
 /** Impacted civilian traffic is RECOVERING, never intentionally parked. */
 private readonly impactRecovery=new Map<string,{blockedSeconds:number}>();
 private readonly impactCooldown=new Map<string,number>();
 configureContactImpulses(lookup:(mover:NH012Agent,probe:SedanStage6Pose)=>
   {id:string;nx:number;nz:number}|null):void{this.contactTarget=lookup;}
 private applyContactImpulse(mover:NH012Agent,probe:SedanStage6Pose,
   signedSpeed:number):number|null{
   const contact=this.contactTarget?.(mover,probe);
   if(!contact)return null;
   const other=this.agents.find(a=>a.id===contact.id);
   if(!other)return null;
   const key=mover.id+"|"+other.id;
   if(this.tick-(this.impactCooldown.get(key)??-100)<5)return 0;
   const {nx,nz}=contact;
   const mx=Math.sin(mover.heading),mz=Math.cos(mover.heading);
   const tx=Math.sin(other.heading),tz=Math.cos(other.heading);
   const targetImpact=this.impactMotion.get(other.id);
   const ovx=targetImpact?.vx??tx*other.speed;
   const ovz=targetImpact?.vz??tz*other.speed;
   const vx=mx*signedSpeed,vz=mz*signedSpeed;
   const closing=(vx-ovx)*nx+(vz-ovz)*nz;
   // Bumper-to-bumper crawling must not be classified as a crash.
   if(closing<1.8)return 0;
   // Pair of equal-mass 1,450 kg Sedans, restitution 0.14. The normal impulse
   // conserves total momentum and reverses relative normal speed. Ground
   // friction then removes the imparted energy over time.
   const massKg=1450,restitution=.14;
   const impulse=(1+restitution)*closing/(2/massKg);
   const dv=impulse/massKg;
   const afterMover={x:vx-dv*nx,z:vz-dv*nz};
   const afterOther={x:ovx+dv*nx,z:ovz+dv*nz};
   this.impactCooldown.set(key,this.tick);
   if(this.manual?.agentId===other.id){
     this.manual.velocity=afterOther.x*tx+afterOther.z*tz;
   }else{
     const old=this.impactMotion.get(other.id);
     this.impactMotion.set(other.id,{
       vx:afterOther.x,vz:afterOther.z,ttl:Math.max(old?.ttl??0,1.3),
     });
     // Preserve lane/connector identity and any intersection reservation.
     // The impulse displaces the car; route recovery later restores its lane
     // through verified physical motion, never a teleport or parked flag.
     this.impactRecovery.delete(other.id);
     other.waitTicks=0;
   }
   return afterMover.x*mx+afterMover.z*mz;
 }
 private stepImpactBodies(dt:number):void{
   for(const [id,motion] of this.impactMotion){
     const car=this.agents.find(a=>a.id===id);
     if(!car){this.impactMotion.delete(id);continue;}
     const speed=Math.hypot(motion.vx,motion.vz);
     if(speed>.05&&this.solidAdmission){
       const distance=speed*dt;
       // Integrate the two-dimensional post-impact velocity directly:
       // a side impact can slide a car laterally without rotating its wheels.
       const steps=Math.max(1,Math.ceil(distance/.05));
       let x=car.x,z=car.z,blocked=false;
       for(let i=0;i<steps;i++){
         const proposed={x:x+motion.vx*dt/steps,
           z:z+motion.vz*dt/steps,heading:car.heading};
         if(!this.solidAdmission(car,proposed)){blocked=true;break;}
         x=proposed.x;z=proposed.z;
       }
       car.x=x;car.z=z;
       if(blocked){motion.vx=0;motion.vz=0;}
     }
     const speedNow=Math.hypot(motion.vx,motion.vz);
     const slowed=Math.max(0,speedNow-4.2*dt);
     const factor=speedNow>0?slowed/speedNow:0;
     motion.vx*=factor;motion.vz*=factor;motion.ttl-=dt;
     car.speed=slowed;
     car.state=slowed>.08?"braking":"stopped";
     if(slowed<.08||motion.ttl<=0){
       car.speed=0;car.state="stopped";
       this.impactMotion.delete(id);
       this.impactRecovery.set(id,{blockedSeconds:0});
     }
   }
 }
 /** Move an impact-displaced NPC back to its route using checked motion.
  * Never snap, despawn, become intangible, or stay parked in an active lane. */
 private stepImpactRecovery(dt:number):void{
   for(const [id,recovery] of this.impactRecovery){
     const a=this.agents.find(v=>v.id===id);
     if(!a){this.impactRecovery.delete(id);continue;}
     if(this.manual?.agentId===id){
       this.impactRecovery.delete(id);continue;
     }
     const connector=a.connectorId?this.graph.connectors.get(a.connectorId):null;
     const edge=this.graph.edges.get(a.edgeId);
     if(!edge){this.impactRecovery.delete(id);continue;}
     const routeLength=connector?.length??edge.length;
     const routeAt=(v:number)=>connector?
       nh012PointOnConnector(connector,Math.max(0,Math.min(routeLength,v))):
       nh012PointOnEdge(edge,Math.max(0,Math.min(routeLength,v)));
     // Search only the local route segment; prefer a nearby forward re-entry
     // point so an impact never teleports back to its former wheel position.
     const start=Math.max(0,a.s-3),end=Math.min(routeLength,a.s+6);
     let closest=start,best=Infinity;
     for(let i=0;i<=30;i++){
       const candidate=start+(end-start)*i/30;
       const p=routeAt(candidate);
       const distance=(a.x-p.x)**2+(a.z-p.z)**2;
       if(distance<best){best=distance;closest=candidate;}
     }
     const destination=routeAt(closest);
     const ahead=routeAt(Math.min(routeLength,closest+.15));
     const behind=routeAt(Math.max(0,closest-.15));
     const heading=nh012HeadingBetween(behind,ahead);
     const dx=destination.x-a.x,dz=destination.z-a.z;
     const dist=Math.hypot(dx,dz);
     const delta=Math.atan2(Math.sin(heading-a.heading),
       Math.cos(heading-a.heading));
     if(dist<.065&&Math.abs(delta)<.065){
       a.s=closest; // current pose differs from route by < 6.5 cm
       a.speed=0;a.state="stopped";
       this.impactRecovery.delete(id);
       continue;
     }
     const step=Math.min(dist,1.2*dt);
     const turn=Math.max(-.10,Math.min(.10,delta));
     const proposal={x:a.x+(dist>0?dx/dist*step:0),
       z:a.z+(dist>0?dz/dist*step:0),heading:a.heading+turn};
     if(this.solidAdmission?.(a,proposal)??true){
       a.x=proposal.x;a.z=proposal.z;a.heading=proposal.heading;
       a.speed=step/dt;a.state="braking";
       recovery.blockedSeconds=0;
     }else{
       a.speed=0;a.state="stopped";
       recovery.blockedSeconds+=dt; // wait until a real physical exit clears
     }
   }
 }
 private readonly freeParkedAgents=new Set<string>();
 configureStage6FreeDriving(
   admission:(p:SedanStage6Pose,length:number,width:number,id:string)=>boolean,
 ):void{this.freeDrivingAdmission=admission;}
 isStage6FreeDriving(agentId:string):boolean{
   return this.manual?.agentId===agentId&&this.manual.free;
 }
 isStage6FreeParked(agentId:string):boolean{return this.freeParkedAgents.has(agentId);}
 /** POI-005: Reassign exactly one existing NH012 identity, not a 126th car.
  * It is a static, boardable, solid Sedan at Finch's entrance until driven. */
 parkFinchStarter005():string{
  const a=this.agents.find(v=>v.id==="NH012:gtd-veh006-mercer-range-rover:WHITE:0");
  if(!a)throw Error("POI-005 starter vehicle missing from original 125");
  const p=FINCH_START_005.starterCar;
  a.x=p.x;a.z=p.z;a.heading=p.heading;
  a.speed=0;a.state="stopped";a.connectorId=null;a.plannedConnectorId=null;
  a.arrivalTick=-1;a.waitTicks=0;
  this.freeParkedAgents.add(a.id);
  return a.id;
 }
 /** LVL-001: reserve a real traffic sedan, with the same render and collision hull. */
 parkDianeVehicle001(id:string,stop:DianeRoadStop008):boolean{
  const a=this.agents.find(item=>item.id===id),edge=this.graph.edges.get(stop.edgeId);
  if(!a||!edge||this.manual?.agentId===id)return false;
  this.clearTargetDrive003(id);
  a.edgeId=edge.id;a.s=stop.s;a.connectorId=null;a.plannedConnectorId=null;
  a.x=stop.position.x;a.z=stop.position.z;
  a.heading=nh012HeadingBetween(edge.start,edge.end);
  a.speed=0;a.state="stopped";a.arrivalTick=-1;a.waitTicks=0;
  this.freeParkedAgents.add(id);
  return true;
 }
 beginDianeDrive001(id:string,destination:DianeRoadStop008):boolean{
  const a=this.agents.find(item=>item.id===id);
  if(!a||this.isManualDriving(id))return false;
  const route=dianeCrossCityRoute008(this.graph,a.edgeId,a.s,destination);
  if(!route||route.edges.length<4)return false;
  this.clearTargetDrive003();
  a.plannedConnectorId=null;this.freeParkedAgents.delete(id);
  this.targeted={agentId:id,route,index:0,arrived:false};
  this.dianePace001={id,maxSpeed:5.8};
  return true;
 }
 paceDianeVehicle001(id:string,distanceFromReese:number):void{
  if(this.dianePace001?.id!==id)return;
  // The target must not crawl at 1.5m/s because Reese is distant.
   this.dianePace001.maxSpeed=distanceFromReese>110?5.8:
    distanceFromReese>65?7.0:8.2;
 }
 finishDianeDrive001(id:string):void{
  if(this.dianePace001?.id!==id&&this.targeted?.agentId!==id)return;
  this.dianePace001=null;
  this.freeParkedAgents.add(id);
  this.clearTargetDrive003(id);
  const a=this.agents.find(item=>item.id===id);
  if(a){a.speed=0;a.state="stopped";a.waitTicks=0;}
 }
 /** Dynamic impact recovery is not player parking or scheduled congestion. */
 get recoveringTrafficCount():number{
   return this.impactMotion.size+this.impactRecovery.size;
 }
 setManualSteering(agentId:string,amount:number):void{
   if(!this.isStage6FreeDriving(agentId))return;
   this.manual!.steeringRequest=Number.isFinite(amount)
     ?Math.max(-1,Math.min(1,amount)):0;
 }
 /** Reconnect only when the free car is already aligned with a genuine
  * directed lane. Never teleport the off-road car across a building. */
 canResumeStage6Autopilot(agentId:string):boolean{
   if(!this.isStage6FreeDriving(agentId))return false;
   const a=this.agents.find(v=>v.id===agentId)!;
   const c=this.nearestFreeLane(a);
   return c!==null;
 }
 private nearestFreeLane(agent:NH012Agent):{edgeId:string;s:number}|null{
   let closest:{edgeId:string;s:number;distance:number}|null=null;
   for(const e of this.graph.edges.values()){
     const t=Math.max(0,Math.min(e.length,(agent.x-e.start.x)*e.dx+(agent.z-e.start.z)*e.dz));
     const p=nh012PointOnEdge(e,t);
     const dist=Math.hypot(p.x-agent.x,p.z-agent.z);
     const direction=nh012HeadingBetween(e.start,e.end);
     const delta=Math.abs(Math.atan2(Math.sin(direction-agent.heading),Math.cos(direction-agent.heading)));
     if(dist<=1.8&&delta<=.55&&(!closest||dist<closest.distance))
       closest={edgeId:e.id,s:t,distance:dist};
   }
   return closest?{edgeId:closest.edgeId,s:closest.s}:null;
 }
 /** Called by on-foot exit; an off-road car stays parked at its exact
  * coordinates instead of teleporting into NH012 autopilot. */
 parkManualOffRoad(agentId:string):void{
   if(!this.isStage6FreeDriving(agentId))return;
   const a=this.agents.find(v=>v.id===agentId)!;
   a.speed=0;a.state="stopped";
   delete a.manualSteer;
   this.freeParkedAgents.add(agentId);
   this.manual=null;
 }

 isManualDriving(agentId:string):boolean{return this.manual?.agentId===agentId;}
 manualSignedSpeed(agentId:string):number{return this.isManualDriving(agentId)?this.manual!.velocity:0;}
 /** A manual takeover retains visual pose, paint, body, source hubs and AI ID. */
 beginManualDriving(agentId:string):void{
  this.clearTargetDrive003(agentId);
   const agent=this.agents.find(a=>a.id===agentId);
   if(!agent)throw Error("NH012 unknown manual Sedan "+agentId);
   if(this.manual?.agentId===agentId)return;
   this.endManualDriving();
   this.clearDriverTurn();
   if(agent.connectorId){
     const c=this.graph.connectors.get(agent.connectorId)!;
     if(this.reservations.get(c.junction)===agent.id)this.reservations.delete(c.junction);
   }
   agent.plannedConnectorId=null;
   this.freeParkedAgents.delete(agentId);
   this.impactMotion.delete(agentId);
   this.impactRecovery.delete(agentId);
   this.manual={agentId,velocity:agent.speed,forward:0,reverse:0,history:[],
     steering:0,steeringRequest:0,free:!!this.freeDrivingAdmission};
   this.setDriverBrake(null,false);this.setDriverThrottle(null,0);
 }
 endManualDriving():boolean{
   if(!this.manual)return true;
   const agent=this.agents.find(a=>a.id===this.manual!.agentId);
   // A free car cannot rejoin a lane until physically on it and facing its
   // direction. Do not snap/teleport it to the closest traffic position.
   const rejoin=agent&&this.manual.free?this.nearestFreeLane(agent):null;
   if(agent&&this.manual.free&&!rejoin)return false;
   if(agent&&rejoin&&this.solidAdmission){
     const lane=this.graph.edges.get(rejoin.edgeId)!;
     const p=nh012PointOnEdge(lane,rejoin.s);
     const heading=nh012HeadingBetween(lane.start,lane.end);
     // Handing control back to AI must not snap the Sedan into an occupied
     // car, pedestrian, building, tree or lamp. Keep manual ownership instead.
     if(!this.solidAdmission(agent,{x:p.x,z:p.z,heading}))return false;
   }
   if(agent){
     // AI uses nonnegative velocity even after manual reverse. On an occupied
     // curve, reacquire reservation when available. A conflicting reservation
     // may continue to exist; overlapping at handoff is explicitly temporary.
     agent.speed=this.manual.free
       ?Math.max(0,this.manual.velocity):Math.abs(this.manual.velocity);
     delete agent.manualSteer;
     if(rejoin){
       agent.edgeId=rejoin.edgeId;agent.s=rejoin.s;
       agent.connectorId=null;agent.plannedConnectorId=null;
       const e=this.graph.edges.get(rejoin.edgeId)!;
       const p=nh012PointOnEdge(e,rejoin.s);
       agent.x=p.x;agent.z=p.z;
       agent.heading=nh012HeadingBetween(e.start,e.end);
     }
     if(agent.connectorId){
       const c=this.graph.connectors.get(agent.connectorId)!;
       if(!this.reservations.has(c.junction))
         this.reservations.set(c.junction,agent.id);
     }else{
       agent.arrivalTick=-1;agent.waitTicks=0;agent.plannedConnectorId=null;
     }
   }
   this.manual=null;
   return true;
 }
 setManualPedals(agentId:string,forward:number,reverse:number):void{
   if(!this.isManualDriving(agentId))return;
   this.manual!.forward=Number.isFinite(forward)?Math.min(1,Math.max(0,forward)):0;
   this.manual!.reverse=Number.isFinite(reverse)?Math.min(1,Math.max(0,reverse)):0;
 }
 /** The last 8m of a lane is the only valid turn input window. There is no
  * deferred turning request, and existing traffic permissions are bypassed. */
 requestManualTurn(agentId:string,direction:NH012DriverTurn):NH012ManualTurnResult{
   const agent=this.agents.find(a=>a.id===agentId);
   if(!agent)return "missing";
   if(!this.isManualDriving(agentId))return "not-manual";
   if(agent.connectorId)return "locked";
   const edge=this.graph.edges.get(agent.edgeId)!;
   if(edge.length-agent.s>NH012_MANUAL_TURN_ZONE)return "too-early";
   const c=this.legalDriverTurnConnector(agentId,direction);
   if(!c)return "unavailable";
   agent.plannedConnectorId=c.id;
   return "turning";
 }
 private manualEdgeChoice(agent:NH012Agent):TrafficConnector012|null{
   const available=this.graph.turns.get(agent.edgeId)??[];
   const selected=agent.plannedConnectorId
     ?available.find(c=>c.id===agent.plannedConnectorId):null;
   if(selected)return selected;
   const edge=this.graph.edges.get(agent.edgeId)!;
   // No input = proceed STRAIGHT whenever there is a legal straight route.
   return available.find(c=>{
     const to=this.graph.edges.get(c.outgoing)!;
     return to.dx===edge.dx&&to.dz===edge.dz;
   })??null;
 }
 private stepManual(dt:number):void{
   if(!this.manual)return;
   const m=this.manual,agent=this.agents.find(a=>a.id===m.agentId);
   if(!agent){this.manual=null;return;}
   // Driver direction and speed supersede ALL normal traffic stop permissions.
   // Reverse first brakes forward at 3.5m/s²; then reverses at 2.6m/s².
   if(m.reverse>0){
     m.velocity=m.velocity>0?Math.max(0,m.velocity-BRAKE*dt*m.reverse)
       :Math.max(-NH012_MANUAL_REVERSE_LIMIT,m.velocity-NH012_MANUAL_ACCEL*dt*m.reverse);
   }else if(m.forward>0){
     m.velocity=m.velocity<0?Math.min(0,m.velocity+BRAKE*dt*m.forward)
       :Math.min(NH012_MANUAL_MAX_SPEED,m.velocity+NH012_MANUAL_ACCEL*dt*m.forward);
   }else{
     const d=NH012_MANUAL_COAST*dt;
     m.velocity=m.velocity>0?Math.max(0,m.velocity-d):Math.min(0,m.velocity+d);
   }
   if(m.free&&this.freeDrivingAdmission){
     const steering=stage6SteerStep(
       m.steering,m.steeringRequest,m.velocity,dt);
     m.steering=steering.angle;
     agent.manualSteer=m.steering;
     const nextHeading=agent.heading+steering.yawDelta;
     const moved=stage6SweepSedan(
       {x:agent.x,z:agent.z,heading:agent.heading},
       nextHeading,m.velocity*dt,agent.length,agent.width,
       (pose,length,width)=>this.freeDrivingAdmission!(pose,length,width,agent.id),
     );
     agent.x=moved.pose.x;agent.z=moved.pose.z;
     agent.heading=Math.atan2(Math.sin(moved.pose.heading),Math.cos(moved.pose.heading));
     if(moved.blocked){
       const response=this.applyContactImpulse(agent,moved.contactPose??moved.pose,m.velocity);
       // Infinite-mass wall/trunk/pole: small coefficient of restitution.
       // At crawling speed, settle without vibrating against the obstacle.
       m.velocity=response??(Math.abs(m.velocity)>1.8?
         -Math.sign(m.velocity)*Math.min(1.2,Math.abs(m.velocity)*.10):0);
     }
     agent.speed=Math.abs(m.velocity);
     agent.arrivalTick=-1;agent.waitTicks=0;
     agent.connectorId=null;agent.plannedConnectorId=null;
     agent.state=agent.speed<.12?"stopped":
       m.reverse>0||m.forward<=0?"braking":"moving";
     return;
   }
   let distance=m.velocity*dt;
   for(let iterations=0;iterations<8;iterations++){
     if(agent.connectorId){
       const c=this.graph.connectors.get(agent.connectorId)!;
       const next=agent.s+distance;
       if(distance>=0&&next>=c.length){
         distance=next-c.length;
         agent.edgeId=c.outgoing;agent.connectorId=null;agent.s=0;
         agent.plannedConnectorId=null;
         m.history.push(c.id);
         if(m.history.length>32)m.history.shift();
       }else if(distance<0&&next<=0){
         distance=next;
         agent.edgeId=c.incoming;agent.connectorId=null;
         agent.s=this.graph.edges.get(c.incoming)!.length;
         agent.plannedConnectorId=c.id;
       }else{agent.s=next;distance=0;break;}
     }else{
       const e=this.graph.edges.get(agent.edgeId)!;
       const next=agent.s+distance;
       if(distance>0&&next>=e.length){
         const c=this.manualEdgeChoice(agent);
         if(!c){
           agent.s=e.length;distance=0;m.velocity=0;break;
         }
         distance=next-e.length;
         agent.connectorId=c.id;agent.s=0;agent.plannedConnectorId=c.id;
         // No junction reservation, no stop, no other vehicle clearance.
       }else if(distance<0&&next<=0){
         const previous=m.history[m.history.length-1];
         const c=previous?this.graph.connectors.get(previous):null;
         if(c?.outgoing===agent.edgeId){
           m.history.pop();agent.connectorId=c.id;
           agent.edgeId=c.incoming;agent.s=c.length;
           distance=next;
         }else{
           agent.s=0;distance=0;m.velocity=0;break;
         }
       }else{agent.s=next;distance=0;break;}
     }
     if(Math.abs(distance)<1e-9)break;
   }
   if(agent.connectorId){
     const c=this.graph.connectors.get(agent.connectorId)!;
     const p=nh012PointOnConnector(c,agent.s);
     const ahead=nh012PointOnConnector(c,Math.min(c.length,agent.s+.12));
     const behind=nh012PointOnConnector(c,Math.max(0,agent.s-.12));
     agent.x=p.x;agent.z=p.z;agent.heading=nh012HeadingBetween(behind,ahead);
   }else{
     const e=this.graph.edges.get(agent.edgeId)!;
     const p=nh012PointOnEdge(e,agent.s);
     agent.x=p.x;agent.z=p.z;
     agent.heading=nh012HeadingBetween(e.start,e.end);
   }
   agent.speed=Math.abs(m.velocity);
   agent.arrivalTick=-1;agent.waitTicks=0;
   agent.state=agent.connectorId?"turning":agent.speed<.12?"stopped":
     m.reverse>0||m.forward<=0?"braking":"moving";
 }
 /** Stage 4: one next-junction choice scoped to one immutable traffic ID.
  * This does not modify x, z, heading, yaw or any source wheel geometry. */
 private driverTurn: {agentId:string;incoming:string;connectorId:string;direction:NH012DriverTurn}|null=null;
 /** A new rider or vehicle exit clears any uncommitted manual turn.
  * Committed connectors are NEVER changed or released by this action. */
 clearDriverTurn(agentId:string|null=null):void{
   const pending=this.driverTurn;
   if(!pending||(agentId!==null&&pending.agentId!==agentId))return;
   const agent=this.agents.find(a=>a.id===pending.agentId);
   if(agent&&!agent.connectorId&&agent.edgeId===pending.incoming&&
     agent.plannedConnectorId===pending.connectorId)
     agent.plannedConnectorId=null;
   this.driverTurn=null;
 }
 /** Relative heading evaluated from lane direction, not camera orientation.
  * Deterministic and side-effect-free when requested turn is unavailable. */
 legalDriverTurnConnector(agentId:string,direction:NH012DriverTurn):TrafficConnector012|null{
   const agent=this.agents.find(a=>a.id===agentId);
   if(!agent||agent.connectorId)return null;
   const incoming=this.graph.edges.get(agent.edgeId);
   if(!incoming)return null;
   const legal=this.graph.turns.get(incoming.id)??[];
   return legal.find(connector=>{
     const outgoing=this.graph.edges.get(connector.outgoing);
     if(!outgoing)return false;
     // +Z forward turning toward -X is LEFT. Independent of camera orbit.
     const cross=incoming.dx*outgoing.dz-incoming.dz*outgoing.dx;
     return direction==="left"?cross>.5:cross<-.5;
   })??null;
 }
 setDriverTurn(agentId:string,direction:NH012DriverTurn):NH012TurnResult{
   const agent=this.agents.find(a=>a.id===agentId);
   if(!agent)return "missing";
   if(agent.connectorId)return "locked"; // Cannot change an occupied crossing.
   const connector=this.legalDriverTurnConnector(agentId,direction);
   if(!connector){
     // An illegal request must never invalidate a previously legal request.
     return "unavailable";
   }
   // One active rider. Replacing a queued turn also clears its earlier
   // cached plannedConnectorId; no stale AI junction choice can survive.
   this.clearDriverTurn();
   this.driverTurn={agentId,incoming:agent.edgeId,
     connectorId:connector.id,direction};
   agent.plannedConnectorId=connector.id;
   return "queued";
 }
 pendingDriverTurn(agentId:string):NH012DriverTurn|null{
   const pending=this.driverTurn;
   const agent=this.agents.find(a=>a.id===agentId);
   return pending&&pending.agentId===agentId&&agent&&
     agent.connectorId===null&&agent.edgeId===pending.incoming
       ?pending.direction:null;
 }

 setDriverThrottle(agentId:string|null,amount:number):void{
   if(agentId===null||!Number.isFinite(amount)||amount<=0){
     this.driverThrottleId=null;
     this.driverThrottleAmount=0;
     return;
   }
   if(!this.agents.some(a=>a.id===agentId))
     throw Error("NH012 manual throttle target is not a live traffic agent: "+agentId);
   this.driverThrottleId=agentId;
   this.driverThrottleAmount=Math.min(1,Math.max(0,amount));
 }
 driverThrottleFor(agentId:string):number{
   return this.driverThrottleId===agentId?this.driverThrottleAmount:0;
 }
 /** A release (or leaving the Sedan) relinquishes control to NH-012's AI.
  * Invalid agent identities cannot acquire control. */
 setDriverBrake(agentId:string|null,pressed:boolean):void{
   if(!pressed||agentId===null){this.driverBrakeId=null;return;}
   if(!this.agents.some(a=>a.id===agentId))
     throw Error("NH012 manual brake target is not a live traffic agent: "+agentId);
   this.driverBrakeId=agentId;
 }
 isDriverBraking(agentId:string):boolean{return this.driverBrakeId===agentId;}

 private readonly destinationNodes:readonly string[];
 tick=0;
 constructor(population=125,seed=120125,graph=buildNorthHeightsTrafficGraph012()){
   if(!Number.isInteger(population)||population<1||population>125)throw Error("NH012 population outside 1..125");
   this.population=population;this.graph=graph;this.rng=randomSeeded(seed);
   this.destinationNodes=[...graph.nodes.keys()];
   const available=[...graph.edges.values()];
   for(let i=available.length-1;i>0;i--){
     const j=Math.floor(this.rng()*(i+1));[available[i],available[j]]=[available[j]!,available[i]!];
   }
   const fleet=fleetManifest();
   // One vehicle per directed edge initially: footprint-safe 44m initial slots.
   for(let i=0;i<population;i++){
     const asset=fleet[i]!,edge=available[i]!;
     const s=9+this.rng()*24;
     const pose=nh012PointOnEdge(edge,s);
     const destination=this.destinationNodes[Math.floor(this.rng()*this.destinationNodes.length)]!;
     this.agents.push({...asset,length:NH017_SEDAN_LENGTH,width:NH017_SEDAN_WIDTH,edgeId:edge.id,connectorId:null,s,
       speed:1.5+this.rng()*2.5,plannedConnectorId:null,x:pose.x,z:pose.z,
       heading:nh012HeadingBetween(edge.start,edge.end),state:"moving",
       destination,arrivalTick:-1,waitTicks:0});
   }
 }
 private chooseConnector(agent:NH012Agent):TrafficConnector012{
   const edge=this.graph.edges.get(agent.edgeId)!;
  const targeted=this.targeted;
  if(targeted?.agentId===agent.id&&!targeted.arrived){
   const nextId=targeted.route.edges[targeted.index+1];
   if(nextId){
    const choice=(this.graph.turns.get(edge.id)??[]).find(c=>c.outgoing===nextId);
    if(!choice)throw Error("POI-003 selected route turn no longer legal");
    agent.plannedConnectorId=choice.id;
    return choice;
   }
  }
   const cached=agent.plannedConnectorId?this.graph.connectors.get(agent.plannedConnectorId):undefined;
   if(cached)return cached;
   const options=this.graph.turns.get(edge.id)??[];
   if(!options.length)throw Error("NH012 no legal turn at "+edge.to);
   if(edge.to===agent.destination)
     agent.destination=this.destinationNodes[Math.floor(this.rng()*this.destinationNodes.length)]!;
   const target=this.graph.nodes.get(agent.destination)!;
   const scored=options.map(c=>{
     const next=this.graph.edges.get(c.outgoing)!;
     const dest=this.graph.nodes.get(next.to)!;
     const dist=Math.abs(dest.x-target.x)+Math.abs(dest.z-target.z);
     const straight=next.dx===edge.dx&&next.dz===edge.dz;
     // Seeded tie breaks, soft preference for regular forward motion.
     return {c,cost:dist+(straight?-10:0)+this.rng()*8};
   });
   scored.sort((a,b)=>a.cost-b.cost||a.c.id.localeCompare(b.c.id));
   agent.plannedConnectorId=scored[0]!.c.id;
   return scored[0]!.c;
 }
 private hasExitSpace(edgeId:string,agent:NH012Agent):boolean{
   const limit=agent.length+MIN_GAP+3;
   // Impacted cars continue to occupy their lane physically. Never ignore
   // them for intersection exit safety while they are recovering.
   return !this.agents.some(a=>a!==agent&&a.id!==this.manual?.agentId&&
     !this.freeParkedAgents.has(a.id)&&a.connectorId===null&&
     a.edgeId===edgeId&&a.s<limit);
 }
 /** Preserve the exact contact point instead of rolling back a whole
  * 20 Hz autonomous frame (which created the conspicuous air gap). */
 private keepSolidMove(a:NH012Agent,old:NH012Agent):void{
   if(!this.solidAdmission)return;
   const target={...a},dx=target.x-old.x,dz=target.z-old.z;
   const headingDelta=Math.atan2(Math.sin(target.heading-old.heading),
     Math.cos(target.heading-old.heading));
   const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));
   let validFraction=0;
   const at=(t:number)=>({x:old.x+dx*t,z:old.z+dz*t,
     heading:old.heading+headingDelta*t});
   for(let i=1;i<=count;i++){
     const t=i/count;
     if(this.solidAdmission(a,at(t))){validFraction=t;continue;}
     let lo=validFraction,hi=t;
     for(let j=0;j<11;j++){
       const mid=(lo+hi)/2;
       if(this.solidAdmission(a,at(mid)))lo=mid;else hi=mid;
     }
     if(old.connectorId&&!target.connectorId){
       const c=this.graph.connectors.get(old.connectorId);
       if(c)this.reservations.set(c.junction,a.id);
     }
     if(old.edgeId===target.edgeId&&old.connectorId===target.connectorId){
       a.s=old.s+(target.s-old.s)*lo;
       const p=at(lo);a.x=p.x;a.z=p.z;a.heading=p.heading;
       a.arrivalTick=-1;a.waitTicks=0;
     }else Object.assign(a,old);
     // Autonomous contacts use the same two-body impulse as manual crashes.
     // Static obstacles instead absorb momentum without phantom displacement.
     const collisionSpeed=this.applyContactImpulse(a,at(hi),target.speed);
     a.speed=Math.max(0,collisionSpeed??0);
     a.state=a.speed>.08?"braking":"stopped";
     return;
   }
 }
 /** Reconcile stale junction ownership after impact recovery, re-parking
  * or driver handoffs. Never clear a real car still inside the connector. */
 private reconcileJunctionReservations001(){
  if(!this.dianePace001)return; // preserve baseline/manual traffic semantics
  for(const [junction,id] of this.reservations){
   const owner=this.agents.find(agent=>agent.id===id);
   const connector=owner?.connectorId?this.graph.connectors.get(owner.connectorId):null;
   if(!owner||!connector||connector.junction!==junction||
     this.freeParkedAgents.has(id)||this.manual?.agentId===id)
     this.reservations.delete(junction);
  }
  for(const car of this.agents){
   const connector=car.connectorId?this.graph.connectors.get(car.connectorId):null;
   if(connector&&!this.reservations.has(connector.junction))
     this.reservations.set(connector.junction,car.id);
  }
 }
 step(dt=NH012_SIMULATION_DT){
   if(Math.abs(dt-NH012_SIMULATION_DT)>1e-8)throw Error("NH012 requires a 20Hz deterministic step");
   this.tick++;
   // Manual car moves along the SAME lanes and connectors, but its driver
   // explicitly overrides traffic signals, spacing, reservation and stop AI.
   this.stepManual(dt);
   this.stepImpactBodies(dt);
   this.stepImpactRecovery(dt);
   this.reconcileJunctionReservations001();
   const laneCars=new Map<string,NH012Agent[]>();
   // Recovering cars are still tangible lane leaders. Followers must retain
   // normal braking headways instead of accelerating into a temporary crash.
   for(const a of this.agents)if(a.connectorId===null&&
     a.id!==this.manual?.agentId&&!this.freeParkedAgents.has(a.id)){
     const list=laneCars.get(a.edgeId)??[];list.push(a);laneCars.set(a.edgeId,list);
   }
   for(const list of laneCars.values())list.sort((a,b)=>b.s-a.s||a.id.localeCompare(b.id));
   // Precompute observations before any movement: no per-tick O(n^2) following scans.
   const leaderGaps=new Map<string,number>();
   for(const list of laneCars.values()){
     for(let k=0;k<list.length;k++){
       const leader=list[k-1],follower=list[k]!;
       leaderGaps.set(follower.id,leader
         ?leader.s-follower.s-(leader.length+follower.length)/2-MIN_GAP:Infinity);
     }
   }
   // Each reserved connector remains exclusive until its occupant exits.
   for(const agent of this.agents){
     if(this.manual?.agentId===agent.id||this.freeParkedAgents.has(agent.id)||this.impactMotion.has(agent.id)||
       this.impactRecovery.has(agent.id))continue;
     if(!agent.connectorId)continue;
     const c=this.graph.connectors.get(agent.connectorId)!;
     const before={...agent};
   const remaining=c.length-agent.s;
     // Hold the junction reservation while braking in a connector: a stopped
     // chassis must not release the crossing to another conflicting vehicle.
     const braking=this.driverBrakeId===agent.id;
     const throttle=this.driverThrottleFor(agent.id);
     let v=braking?Math.max(0,agent.speed-BRAKE*dt)
       :Math.min(4,agent.speed+ACCEL*dt*(throttle>0?throttle:1));
     if(this.dianePace001?.id===agent.id)v=Math.min(v,this.dianePace001.maxSpeed);
     let ds=Math.min(remaining,v*dt);
     if(remaining<=.001&&!this.hasExitSpace(c.outgoing,agent)){v=0;ds=0;}
     agent.s+=ds;agent.speed=v;
     const pose=nh012PointOnConnector(c,agent.s);
     const front=nh012PointOnConnector(c,Math.min(c.length,agent.s+.12));
     const back=nh012PointOnConnector(c,Math.max(0,agent.s-.12));
     agent.x=pose.x;agent.z=pose.z;agent.heading=nh012HeadingBetween(back,front);
     agent.state=braking?(v<.12?"stopped":"braking"):"turning";
     if(!braking&&agent.s>=c.length-1e-4&&this.hasExitSpace(c.outgoing,agent)){
       agent.edgeId=c.outgoing;agent.connectorId=null;agent.s=0;
        if(this.targeted?.agentId===agent.id){
         const t=this.targeted;
         if(t.route.edges[t.index+1]===agent.edgeId)t.index++;
         else if(t.route.edges[t.index]!==agent.edgeId)this.clearTargetDrive003(agent.id);
        }
       agent.speed=Math.min(v,4);agent.arrivalTick=-1;agent.waitTicks=0;
       agent.plannedConnectorId=null;
       const next=this.graph.edges.get(agent.edgeId)!;
       agent.x=next.start.x;agent.z=next.start.z;
       agent.heading=nh012HeadingBetween(next.start,next.end);
       agent.state="moving";
       this.reservations.delete(c.junction);
     }
     this.keepSolidMove(agent,before);
   }
   // Advance ordinary lanes; a virtual stop-line leader enforces full stops.
   for(const agent of this.agents){
     if(this.manual?.agentId===agent.id||this.freeParkedAgents.has(agent.id)||this.impactMotion.has(agent.id)||
       this.impactRecovery.has(agent.id))continue;
     if(agent.connectorId)continue;
     const edge=this.graph.edges.get(agent.edgeId)!;
     const before={...agent};
     const available=safe(leaderGaps.get(agent.id)??Infinity);
     const t=this.targeted?.agentId===agent.id?this.targeted:null;
     if(t?.arrived){agent.speed=0;agent.state="stopped";continue;}
     const destinationStop=t&&t.route.edges[t.index]===agent.edgeId&&
       t.index===t.route.edges.length-1?t.route.stopS:null;
     const toStop=Math.min(safe(edge.length-agent.s),
       destinationStop===null?Infinity:safe(destinationStop-agent.s));
     const safeStopSpeed=Math.sqrt(2*BRAKE*toStop);
     const safeFollowSpeed=Number.isFinite(available)
       ?Math.sqrt(2*BRAKE*Math.max(0,available)):Infinity;
     const allowed=Math.min(this.dianePace001?.id===agent.id
       ?this.dianePace001.maxSpeed:MAX_SPEED,safeStopSpeed,safeFollowSpeed);
     // Preserve the exact legacy path when no rider is braking. For the
     // selected agent, a pressed Down key requests a gradual BRAKE-only stop;
     // no reverse, teleport or new manual acceleration logic is introduced.
     const aiV=allowed<agent.speed
       ?Math.max(allowed,agent.speed-BRAKE*dt):Math.min(allowed,agent.speed+ACCEL*dt);
     const braking=this.driverBrakeId===agent.id;
     const throttle=this.driverThrottleFor(agent.id);
     // Applied ONLY when accelerating. If traffic safety demands slowing,
     // its original BRAKE deceleration and stop-line limits retain priority.
     // Full throttle equals the existing AI acceleration limit; partial
     // throttle produces a genuinely lower driver-selected acceleration.
     const v=braking?Math.min(aiV,Math.max(0,agent.speed-BRAKE*dt))
       :throttle>0&&allowed>=agent.speed
         ?Math.min(allowed,agent.speed+ACCEL*dt*throttle)
         :aiV;
     const ds=Math.max(0,Math.min(v*dt,available,toStop));
     agent.s+=ds;agent.speed=v;
     const pose=nh012PointOnEdge(edge,agent.s);
     agent.x=pose.x;agent.z=pose.z;
     agent.heading=nh012HeadingBetween(edge.start,edge.end);
     agent.state=v<.12?"stopped":braking||v<MAX_SPEED*.65?"braking":"moving";
     if(toStop<2)agent.state=v<.12?"stopped":"braking";
     if(t&&destinationStop!==null&&destinationStop-agent.s<=.08&&v<.55){
      agent.s=destinationStop;agent.speed=0;agent.state="stopped";
      const final=nh012PointOnEdge(edge,destinationStop);
      agent.x=final.x;agent.z=final.z;
      t.arrived=true;agent.waitTicks=0;agent.arrivalTick=-1;
     }
     // A targeted route still needs intersection priority at INTERMEDIATE
     // stop lines. The former !t guard froze Diane before her first turn.
     // At the final destination, do not enter another junction queue.
     if((!t||destinationStop===null)&&edge.length-agent.s<=.06&&v<.5){
       agent.s=edge.length;agent.speed=0;agent.state="stopped";
       if(agent.arrivalTick<0)agent.arrivalTick=this.tick;
       agent.waitTicks++;
     }
     this.keepSolidMove(agent,before);
   }
   // Deterministic all-way-stop priority, exclusive across conflicting turns.
   const queues=new Map<string,NH012Agent[]>();
   for(const agent of this.agents)if(!agent.connectorId&&agent.waitTicks>=4
     &&this.driverBrakeId!==agent.id&&this.manual?.agentId!==agent.id
     &&!this.freeParkedAgents.has(agent.id)&&
       !this.impactMotion.has(agent.id)&&!this.impactRecovery.has(agent.id)){
     const junction=this.graph.edges.get(agent.edgeId)!.to;
     const queue=queues.get(junction)??[];queue.push(agent);queues.set(junction,queue);
   }
   for(const [junction,queue] of queues){
     if(this.reservations.has(junction))continue;
     queue.sort((a,b)=>a.arrivalTick-b.arrivalTick||a.id.localeCompare(b.id));
     // A blocked earlier arrival cannot gridlock unrelated legal movements.
     // Keep each queued car's route fixed while allowing the first safe exit.
     for(const agent of queue){
       if(this.targeted?.agentId===agent.id&&this.targeted.arrived)continue;
       const connector=this.chooseConnector(agent);
       if(!this.hasExitSpace(connector.outgoing,agent))continue;
       if(this.solidAdmission&&!this.solidAdmission(agent,{x:connector.p0.x,z:connector.p0.z,heading:agent.heading}))continue;
       this.reservations.set(junction,agent.id);
       // Turn intent is one-shot. Consume it ONLY upon successful junction
       // reservation, never while the lane is merely waiting at a stop line.
       if(this.driverTurn?.agentId===agent.id)
         this.driverTurn=null;
       agent.connectorId=connector.id;agent.s=0;agent.speed=0;
       agent.waitTicks=0;agent.state="turning";
       agent.x=connector.p0.x;agent.z=connector.p0.z;
       break;
     }
   }
 }
 snapshot():NH012TrafficSnapshot{
   const counts={moving:0,braking:0,stopped:0,turning:0};
   for(const a of this.agents)counts[a.state]++;
   return {tick:this.tick,count:this.agents.length,...counts,agents:this.agents};
 }
 /** Stable identity and conservative per-lane longitudinal safety witnesses. */
 validate():string[]{
   const errors:string[]=[];
   const lane=new Map<string,NH012Agent[]>();
   for(const a of this.agents){
     if(!Number.isFinite(a.x)||!Number.isFinite(a.z)||a.speed<0)errors.push(a.id+":non-finite pose");
     if(a.connectorId&&!this.graph.connectors.has(a.connectorId))errors.push(a.id+":invalid connector");
     if(!this.graph.edges.has(a.edgeId))errors.push(a.id+":invalid lane");
     // An impact-displaced car is temporarily off its route; its stale s
     // must not be interpreted as an overlapping lane coordinate.
     if(!a.connectorId&&this.manual?.agentId!==a.id&&
       !this.freeParkedAgents.has(a.id)&&!this.impactMotion.has(a.id)&&
       !this.impactRecovery.has(a.id)){
       const list=lane.get(a.edgeId)??[];list.push(a);lane.set(a.edgeId,list);
     }
   }
   for(const [id,list] of lane){
     list.sort((a,b)=>a.s-b.s);
     for(let i=1;i<list.length;i++){
       const a=list[i-1]!,b=list[i]!;
       const gap=b.s-a.s-(a.length+b.length)/2;
       if(gap<-.0001&&this.manual?.agentId!==a.id&&this.manual?.agentId!==b.id)
         errors.push(id+":overlapping lane agents "+a.id+" "+b.id);
     }
   }
   for(const [j,agentId] of this.reservations)
     if(!this.agents.some(a=>a.id===agentId&&a.connectorId&&this.graph.connectors.get(a.connectorId)?.junction===j))
       errors.push(j+":orphaned reservation");
   return errors;
 }
}
