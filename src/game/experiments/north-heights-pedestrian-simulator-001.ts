/** PED-001 dot-stage logical population. No render, asset or physics dependency. */
import {buildPedestrianGraph001,pedestrianRoute001,type PedGraph001,type PedEdgeKind001} from "./north-heights-pedestrian-graph-001";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {TreeLocation} from "./north-heights-trees-004";

export type PedState001="depart"|"walk"|"park"|"wait"|"cross"|"arrive"|"inside";
export type PedAgent001={
 id:string;appearanceId:number;origin:string;destination:string;
 route:string[];segment:number;progress:number;x:number;z:number;
 speed:number;state:PedState001;stateAge:number;insideSeconds:number;
};
export const PED001_POPULATION=100;
const rng=(seed:number)=>{
 let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
};
export class NorthHeightsPedestrianSimulator001{
 readonly graph:PedGraph001;
 readonly agents:PedAgent001[]=[];
 readonly population=PED001_POPULATION;
 tick=0;
 completed=0;
 routeFailures=0;
 private readonly random=rng(2801001);
 private readonly buildingIds:string[];
 constructor(buildings:readonly BuildingSpec[],trees:readonly TreeLocation[]=[]){
   this.graph=buildPedestrianGraph001(buildings,trees);
   this.buildingIds=[...this.graph.entrances.keys()];
   if(this.buildingIds.length<2)throw new Error("PED-001 requires >=2 reachable building entrances");
   for(let i=0;i<PED001_POPULATION;i++){
     const origin=this.buildingIds[i%this.buildingIds.length]!;
     const node=this.graph.nodes.get(this.graph.entrances.get(origin)!)!;
     const agent:PedAgent001={
       id:"PED-"+String(i+1).padStart(3,"0"),
       appearanceId:i%10+1,origin,destination:origin,
       route:[],segment:0,progress:0,x:node.x,z:node.z,
       speed:1.05+this.random()*.65,
       state:"inside",stateAge:0,insideSeconds:this.random()*6,
     };
     this.agents.push(agent);
   }
 }
 private depart(a:PedAgent001){
   const start=this.graph.entrances.get(a.origin)!;
   // Uniform destination sampling is a provisional diagnostic strategy, NOT
   // the owner's future walking-distance variation policy.
   for(let attempt=0;attempt<20;attempt++){
     const destination=this.buildingIds[Math.floor(this.random()*this.buildingIds.length)]!;
     if(destination===a.origin)continue;
     const route=pedestrianRoute001(this.graph,start,this.graph.entrances.get(destination)!);
     if(route.length<2)continue;
     a.destination=destination;a.route=route;a.segment=0;a.progress=0;
     a.state="depart";a.stateAge=0;a.insideSeconds=0;return;
   }
   this.routeFailures++;
   a.insideSeconds=3+this.random()*5;
 }
 step(dt:number){
   const delta=Math.max(0,Math.min(.1,dt));
   this.tick++;
   for(const a of this.agents){
     a.stateAge+=delta;
     if(a.state==="inside"){
       a.insideSeconds-=delta;
       if(a.insideSeconds<=0)this.depart(a);
       continue;
     }
     let remaining=a.speed*delta,iterations=0;
     while(remaining>1e-6&&iterations++<6){
       if(a.segment>=a.route.length-1){
         a.state="inside";a.stateAge=0;
         a.origin=a.destination;a.insideSeconds=2+this.random()*7;
         a.route=[];a.segment=0;a.progress=0;this.completed++;
         break;
       }
       const p=this.graph.nodes.get(a.route[a.segment]!)!;
       const q=this.graph.nodes.get(a.route[a.segment+1]!)!;
       const length=Math.hypot(q.x-p.x,q.z-p.z);
       if(length<1e-6){a.segment++;a.progress=0;continue;}
       const travel=Math.min(remaining,length-a.progress);
       a.progress+=travel;remaining-=travel;
       const t=Math.min(1,a.progress/length);
       a.x=p.x+(q.x-p.x)*t;a.z=p.z+(q.z-p.z)*t;
       const link=this.graph.links.get(p.id)?.find(e=>e.to===q.id);
       const kind:PedEdgeKind001=link?.kind??"sidewalk";
       const next:PedState001=kind==="park"?"park":kind==="crossing"?"cross":
         kind==="entrance"?(a.segment===0?"depart":"arrive"):"walk";
       if(next!==a.state){a.state=next;a.stateAge=0;}
       if(a.progress>=length-1e-5){a.segment++;a.progress=0;}
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
