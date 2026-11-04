/** PED-001 Stage 3: deterministic building-to-building journey lifecycle.
 * Logical simulation only: no Babylon, GLB, Rapier, or vehicle coupling.
 * Walking-distance distribution is intentionally NOT decided here. */
import {buildPedestrianGraph001,pedestrianRoute001,type PedGraph001,type PedEdgeKind001} from "./north-heights-pedestrian-graph-001";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {TreeLocation} from "./north-heights-trees-004";
import {pedestrianObstacleStep020} from "./north-heights-pedestrian-avoidance-020";

export type PedState001="depart"|"walk"|"park"|"wait"|"cross"|"arrive"|"inside";
export type PedAgent001={
 id:string;appearanceId:number;origin:string;destination:string;
 route:string[];segment:number;progress:number;x:number;z:number;
 speed:number;heading:number;state:PedState001;stateAge:number;insideSeconds:number;
 seed:number;journeysCompleted:number;departures:number;parkVisits:number;
 crossingsTraversed:number;distanceTraveled:number;reroutes:number;
 lastArrival:string|null;stranded:boolean;
 avoidOffset:number;avoidTarget:number;
};
export const PED001_POPULATION=100;
const EPS=1e-5;
const nextRandom=(a:PedAgent001)=>{
 a.seed=(Math.imul(a.seed,1664525)+1013904223)>>>0;
 return a.seed/4294967296;
};
function connectedComponents(graph:PedGraph001){
 const component=new Map<string,number>();
 let count=0;
 for(const id of graph.nodes.keys()){
   if(component.has(id))continue;
   const pending=[id];component.set(id,count);
   while(pending.length){
     const current=pending.pop()!;
     for(const edge of graph.links.get(current)??[]){
       if(!component.has(edge.to)){
         component.set(edge.to,count);pending.push(edge.to);
       }
     }
   }
   count++;
 }
 return {component,count};
}
export class NorthHeightsPedestrianSimulator001{
 readonly graph:PedGraph001;
 readonly agents:PedAgent001[]=[];
 readonly population=PED001_POPULATION;
 readonly connectedComponents:number;
 readonly unreachableBuildings:readonly string[];
 tick=0;
 completed=0;
 routeFailures=0;
 reroutes=0;
 parkVisits=0;
 crossingsTraversed=0;
 stranded=0;
 private readonly destinations=new Map<string,readonly string[]>();
 private readonly eligibleBuildings:string[];
 private readonly routeCache=new Map<string,readonly string[]>();
 private canOccupyVehicleFreeSpace:((x:number,z:number)=>boolean)|null=null;
 private readonly missionReserved001=new Set<string>();
 private readonly hornAlertUntil=new Map<string,number>();
 /** A horn makes an NPC clear the lane more promptly when a safe path exists.
  * Collision-swept obstacle avoidance still owns where that NPC may step. */
 signalHorn(id:string):void{
   const npc=this.agents.find(a=>a.id===id);
   if(npc&&npc.state!=="inside")this.hornAlertUntil.set(id,this.tick+40);
 }
 /** Exclusive ownership of existing actors during authored mission beats. */
 reserveAgents001(ids:readonly string[]):void{
  for(const id of ids){
   if(!this.agents.some(a=>a.id===id))throw Error("PED-001 cannot reserve missing "+id);
   this.missionReserved001.add(id);
  }
 }
 releaseAgents001(ids:readonly string[]):void{
  ids.forEach(id=>this.missionReserved001.delete(id));
 }

 /** NPC routes remain logical, but may never advance into a solid Sedan. */
 setVehicleOccupancy(clear:(x:number,z:number)=>boolean):void{
   this.canOccupyVehicleFreeSpace=clear;
 }
 constructor(buildings:readonly BuildingSpec[],trees:readonly TreeLocation[]=[]){
   this.graph=buildPedestrianGraph001(buildings,trees);
   const {component,count}=connectedComponents(this.graph);
   this.connectedComponents=count;
   const buildingIds=[...this.graph.entrances.keys()];
   const groups=new Map<number,string[]>();
   for(const id of buildingIds){
     const componentId=component.get(this.graph.entrances.get(id)!)!;
     const group=groups.get(componentId)??[];
     group.push(id);groups.set(componentId,group);
   }
   for(const group of groups.values())for(const id of group)
     this.destinations.set(id,group.filter(other=>other!==id));
   this.eligibleBuildings=buildingIds.filter(id=>(this.destinations.get(id)?.length??0)>0);
   this.unreachableBuildings=[...new Set([...this.graph.unreachable,...buildingIds.filter(id=>!this.eligibleBuildings.includes(id))])];
   if(this.eligibleBuildings.length<2)
     throw new Error("PED-001 requires >=2 mutually reachable building entrances");
   for(let i=0;i<PED001_POPULATION;i++){
     const origin=this.eligibleBuildings[i%this.eligibleBuildings.length]!;
     const node=this.graph.nodes.get(this.graph.entrances.get(origin)!)!;
     const agent:PedAgent001={
       id:"PED-"+String(i+1).padStart(3,"0"),
       appearanceId:i+1,origin,destination:origin,
       route:[],segment:0,progress:0,x:node.x,z:node.z,
       speed:1.05+((i*71%101)/101)*.65,
       heading:0,state:"inside",stateAge:0,
       insideSeconds:((i*37%101)/101)*6,
       seed:(2801001+Math.imul(i+1,747796405))>>>0,
       journeysCompleted:0,departures:0,parkVisits:0,crossingsTraversed:0,
       distanceTraveled:0,reroutes:0,lastArrival:null,stranded:false,avoidOffset:0,avoidTarget:0,
     };
     this.agents.push(agent);
   }
 }
 /** Cache successful graph routes, bounded independently of agent count. */
 private route(from:string,to:string){
   const key=from+"\u0000"+to;
   const cached=this.routeCache.get(key);
   if(cached){
     const valid=cached.every((id,i)=>i===0||this.graph.links.get(cached[i-1]!)?.some(edge=>edge.to===id));
     if(valid)return [...cached];
     this.routeCache.delete(key);
   }
   const route=pedestrianRoute001(this.graph,from,to);
   if(route.length>=2){
     if(this.routeCache.size>=256)
       this.routeCache.delete(this.routeCache.keys().next().value!);
     this.routeCache.set(key,route);
   }
   return route;
 }
 private setState(a:PedAgent001,state:PedState001){
   if(a.state===state)return;
   a.state=state;a.stateAge=0;
   if(state==="park"){a.parkVisits++;this.parkVisits++;}
   if(state==="cross"){a.crossingsTraversed++;this.crossingsTraversed++;}
 }
 private pickDestination(a:PedAgent001,from:string,preferred?:string){
   const candidates=this.destinations.get(a.origin)??[];
   // Destination selection is uniform among connected entrances as a temporary
   // diagnostic baseline. No minimum/maximum walking distance is imposed.
   const options=preferred?[preferred,...candidates.filter(id=>id!==preferred)]:candidates;
   if(!options.length)return null;
   const first=preferred?0:Math.floor(nextRandom(a)*options.length);
   // Bounded route attempts followed by deterministic exhaustive fallback.
   for(let i=0;i<Math.min(options.length,12);i++){
     const id=options[(first+i)%options.length]!;
     const to=this.graph.entrances.get(id);
     if(!to||to===from)continue;
     const route=this.route(from,to);
     if(route.length>=2)return {id,route};
   }
   for(const id of options){
     const to=this.graph.entrances.get(id);
     if(!to||to===from)continue;
     const route=this.route(from,to);
     if(route.length>=2)return {id,route};
   }
   return null;
 }
 private beginJourney(a:PedAgent001){
   const from=this.graph.entrances.get(a.origin)!;
   const result=this.pickDestination(a,from);
   if(!result){
     this.routeFailures++;a.stranded=true;this.stranded++;
     a.insideSeconds=3+nextRandom(a)*5;
     return;
   }
   if(a.stranded){a.stranded=false;this.stranded--;}
   a.destination=result.id;a.route=result.route;
   a.segment=0;a.progress=0;a.avoidOffset=0;a.avoidTarget=0;a.departures++;
   a.insideSeconds=0;this.setState(a,"depart");
 }
 private arrive(a:PedAgent001){
   const entranceId=this.graph.entrances.get(a.destination);
   const target=entranceId?this.graph.nodes.get(entranceId):undefined;
   if(!target||Math.hypot(a.x-target.x,a.z-target.z)>.001){
     // A missing endpoint must not silently complete a journey or teleport.
     this.routeFailures++;
     return;
   }
   a.lastArrival=a.destination;a.origin=a.destination;
   a.journeysCompleted++;this.completed++;
   a.route=[];a.segment=0;a.progress=0;a.avoidOffset=0;a.avoidTarget=0;
   a.insideSeconds=2+nextRandom(a)*7;
   this.setState(a,"inside");
 }
 /** Repair a stale remaining route at its current waypoint without changing
  * world position. If already mid-edge, finish that edge before replanning. */
 reroute(a:PedAgent001):boolean{
   if(a.state==="inside")return false;
   const from=a.route[a.segment];
   const next=a.route[a.segment+1];
   if(!from||!next)return false;
   const midEdge=a.progress>EPS;
   const anchor=midEdge?next:from;
   const chosen=this.pickDestination(a,anchor,a.destination);
   if(!chosen){
     this.routeFailures++;
     return false;
   }
   if(midEdge){
     // Retain the active edge and its exact progress, append a fresh suffix.
     a.route=[from,...chosen.route];
   }else{
     a.route=chosen.route;a.progress=0;a.avoidOffset=0;a.avoidTarget=0;
   }
   a.segment=0;a.destination=chosen.id;
   a.reroutes++;this.reroutes++;
   return true;
 }
 step(dt:number){
   const delta=Math.max(0,Math.min(.1,dt));
   if(delta<=0)return;
   this.tick++;
   for(const a of this.agents){
     if(this.missionReserved001.has(a.id))continue;
     a.stateAge+=delta;
     if(a.state==="inside"){
       a.insideSeconds-=delta;
       if(a.insideSeconds<=0)this.beginJourney(a);
       continue;
     }
     let remaining=a.speed*delta*(this.hornAlertUntil.get(a.id)!>this.tick?1.35:1),iterations=0;
     while(remaining>EPS&&iterations++<8){
       if(a.segment>=a.route.length-1){
         this.arrive(a);
         break;
       }
       const p=this.graph.nodes.get(a.route[a.segment]!);
       const q=this.graph.nodes.get(a.route[a.segment+1]!);
       if(!p||!q){this.routeFailures++;break;}
       const link=this.graph.links.get(p.id)?.find(e=>e.to===q.id);
       if(!link){
         if(!this.reroute(a))break;
         continue;
       }
       const length=link.length;
       if(length<EPS){a.segment++;a.progress=0;continue;}
       const motion=pedestrianObstacleStep020(a,p,q,link.kind,remaining,
         this.canOccupyVehicleFreeSpace??(()=>true),a.appearanceId%2===0?1:-1);
       if(motion.blocked||motion.traveled<EPS){
         // Remain stationary only when no safe bypass is possible.
         if(motion.blocked)this.setState(a,"wait");
         break;
       }
       const moveX=motion.x-a.x,moveZ=motion.z-a.z;
       a.x=motion.x;a.z=motion.z;a.progress=motion.progress;
       a.avoidOffset=motion.avoidOffset;a.avoidTarget=motion.avoidTarget;
       a.heading=Math.atan2(moveX,moveZ);
       remaining=Math.max(0,remaining-motion.traveled);
       a.distanceTraveled+=motion.traveled;
       const kind:PedEdgeKind001=link.kind;
       const nextState:PedState001=kind==="park"?"park":kind==="crossing"?"cross":
         kind==="entrance"?(a.segment===0?"depart":"arrive"):"walk";
       this.setState(a,nextState);
       if(a.progress>=length-EPS&&Math.abs(a.avoidOffset)<.015){
         a.x=q.x;a.z=q.z;
         a.segment++;a.progress=0;a.avoidOffset=0;a.avoidTarget=0;
         if(a.segment===a.route.length-1){this.arrive(a);break;}
       }
     }
   }
 }
 counts():Record<PedState001,number>{
   const result:Record<PedState001,number>={
     depart:0,walk:0,park:0,wait:0,cross:0,arrive:0,inside:0,
   };
   for(const a of this.agents)result[a.state]++;
   return result;
 }
}
