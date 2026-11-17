/** NH-013 G2: preserve NH-012 125-agent traffic decisions while making
 * twelve existing logical agents visible as user-provided hatchbacks. */
import type {NH012TrafficSimulator} from "./nh012-traffic-simulator";
export const NH013_HATCHBACK_ID="gtd-traffic-hatchback-013";
export const NH013_HATCHBACK_PAINTS=["WHITE","SILVER","GRAPHITE","NAVY","METALLIC_BLUE"] as const;
export type NH013HatchbackPaint=typeof NH013_HATCHBACK_PAINTS[number];

export function assignNH013HatchbackPilot(sim:NH012TrafficSimulator,count=12):ReadonlySet<string>{
 if(!Number.isInteger(count)||count<0||count>12)throw Error("NH013 hatchback pilot 0..12");
 const picks=sim.agents.map((a,i)=>({agent:a,index:i,d:a.x*a.x+(a.z+31)**2}))
   .filter(x=>!x.agent.id.startsWith("NH013:")&&!sim.isStage6FreeParked(x.agent.id))
   .sort((a,b)=>a.d-b.d||a.agent.id.localeCompare(b.agent.id)).slice(0,count);
 const ids=new Set<string>();
 for(const [ordinal,pick] of picks.entries()){
   const old=pick.agent;
   const paint=NH013_HATCHBACK_PAINTS[ordinal%NH013_HATCHBACK_PAINTS.length]!;
   const id="NH013:HATCH:"+String(ordinal).padStart(2,"0")+":"+paint;
   sim.agents[pick.index]={...old,id,modelId:NH013_HATCHBACK_ID,
     paintId:paint,length:4.35,width:1.78};
   ids.add(id);
 }
 if(ids.size!==count||sim.agents.length!==sim.population||
    new Set(sim.agents.map(a=>a.id)).size!==sim.population)
   throw Error("NH013 hatchback integration changes agent population");
 return ids;
}
