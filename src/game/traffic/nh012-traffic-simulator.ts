/** NH-012: deterministic microscopic car traffic. Pure TypeScript, no GLB, Rapier or DOM.
 * The moving dots and future GLBs are ONLY views of these agent positions. */
import {
 buildNorthHeightsTrafficGraph012,nh012PointOnConnector,nh012PointOnEdge,
 nh012HeadingBetween, NH012_SIMULATION_DT,
 type TrafficGraph012,type TrafficConnector012,
} from "./nh012-lane-network";

export type NH012MotionState="moving"|"braking"|"stopped"|"turning";
/** A single tap queues the next legal relative turn, not freeform steering. */
export type NH012DriverTurn="left"|"right";
export type NH012TurnResult="queued"|"unavailable"|"locked"|"missing";
export type NH012Agent= {
 readonly id:string;readonly modelId:string;readonly paintId:string;
 readonly length:number;readonly width:number;
 edgeId:string;connectorId:string|null;plannedConnectorId:string|null;s:number;speed:number;
 x:number;z:number;heading:number;state:NH012MotionState;
 destination:string;arrivalTick:number;waitTicks:number;
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
     this.agents.push({...asset,edgeId:edge.id,connectorId:null,s,
       speed:1.5+this.rng()*2.5,plannedConnectorId:null,x:pose.x,z:pose.z,
       heading:nh012HeadingBetween(edge.start,edge.end),state:"moving",
       destination,arrivalTick:-1,waitTicks:0});
   }
 }
 private chooseConnector(agent:NH012Agent):TrafficConnector012{
   const edge=this.graph.edges.get(agent.edgeId)!;
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
   return !this.agents.some(a=>a!==agent&&a.connectorId===null&&a.edgeId===edgeId&&a.s<limit);
 }
 step(dt=NH012_SIMULATION_DT){
   if(Math.abs(dt-NH012_SIMULATION_DT)>1e-8)throw Error("NH012 requires a 20Hz deterministic step");
   this.tick++;
   const laneCars=new Map<string,NH012Agent[]>();
   for(const a of this.agents)if(a.connectorId===null){
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
     if(!agent.connectorId)continue;
     const c=this.graph.connectors.get(agent.connectorId)!;
     const remaining=c.length-agent.s;
     // Hold the junction reservation while braking in a connector: a stopped
     // chassis must not release the crossing to another conflicting vehicle.
     const braking=this.driverBrakeId===agent.id;
     const throttle=this.driverThrottleFor(agent.id);
     let v=braking?Math.max(0,agent.speed-BRAKE*dt)
       :Math.min(4,agent.speed+ACCEL*dt*(throttle>0?throttle:1));
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
       agent.speed=Math.min(v,4);agent.arrivalTick=-1;agent.waitTicks=0;
       agent.plannedConnectorId=null;
       const next=this.graph.edges.get(agent.edgeId)!;
       agent.x=next.start.x;agent.z=next.start.z;
       agent.heading=nh012HeadingBetween(next.start,next.end);
       agent.state="moving";
       this.reservations.delete(c.junction);
     }
   }
   // Advance ordinary lanes; a virtual stop-line leader enforces full stops.
   for(const agent of this.agents){
     if(agent.connectorId)continue;
     const edge=this.graph.edges.get(agent.edgeId)!;
     const available=safe(leaderGaps.get(agent.id)??Infinity);
     const toStop=safe(edge.length-agent.s);
     const safeStopSpeed=Math.sqrt(2*BRAKE*toStop);
     const safeFollowSpeed=Number.isFinite(available)
       ?Math.sqrt(2*BRAKE*Math.max(0,available)):Infinity;
     const allowed=Math.min(MAX_SPEED,safeStopSpeed,safeFollowSpeed);
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
     if(edge.length-agent.s<=.06&&v<.5){
       agent.s=edge.length;agent.speed=0;agent.state="stopped";
       if(agent.arrivalTick<0)agent.arrivalTick=this.tick;
       agent.waitTicks++;
     }
   }
   // Deterministic all-way-stop priority, exclusive across conflicting turns.
   const queues=new Map<string,NH012Agent[]>();
   for(const agent of this.agents)if(!agent.connectorId&&agent.waitTicks>=4
     &&this.driverBrakeId!==agent.id){
     const junction=this.graph.edges.get(agent.edgeId)!.to;
     const queue=queues.get(junction)??[];queue.push(agent);queues.set(junction,queue);
   }
   for(const [junction,queue] of queues){
     if(this.reservations.has(junction))continue;
     queue.sort((a,b)=>a.arrivalTick-b.arrivalTick||a.id.localeCompare(b.id));
     // A blocked earlier arrival cannot gridlock unrelated legal movements.
     // Keep each queued car's route fixed while allowing the first safe exit.
     for(const agent of queue){
       const connector=this.chooseConnector(agent);
       if(!this.hasExitSpace(connector.outgoing,agent))continue;
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
     if(!a.connectorId){const list=lane.get(a.edgeId)??[];list.push(a);lane.set(a.edgeId,list);}
   }
   for(const [id,list] of lane){
     list.sort((a,b)=>a.s-b.s);
     for(let i=1;i<list.length;i++){
       const a=list[i-1]!,b=list[i]!;
       const gap=b.s-a.s-(a.length+b.length)/2;
       if(gap<-.0001)errors.push(id+":overlapping lane agents "+a.id+" "+b.id);
     }
   }
   for(const [j,agentId] of this.reservations)
     if(!this.agents.some(a=>a.id===agentId&&a.connectorId&&this.graph.connectors.get(a.connectorId)?.junction===j))
       errors.push(j+":orphaned reservation");
   return errors;
 }
}
