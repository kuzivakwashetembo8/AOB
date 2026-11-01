/** NH-014 — taxi is a visual identity of eight existing NH-012 agents.
 * Does not instantiate independent traffic AI, routes or parked cars. */
import type {NH012TrafficSimulator} from "./nh012-traffic-simulator";
export const NH014_TAXI_MODEL_ID="gtd-traffic-taxi-014";
export const NH014_TAXI_SOURCE="/GLBs/Cars/Taxi.glb";
export const NH014_TAXI_COUNT=8;
export function assignNH014TaxiPilot(sim:NH012TrafficSimulator,count=NH014_TAXI_COUNT):ReadonlySet<string>{
 if(!Number.isInteger(count)||count<0||count>NH014_TAXI_COUNT)
   throw Error("NH014 taxi pilot permits 0..8 existing agents");
 const picks=sim.agents.map((agent,index)=>({agent,index,d:agent.x*agent.x+(agent.z+31)**2}))
   .filter(x=>!x.agent.id.startsWith("NH013:")&&!x.agent.id.startsWith("NH014:")&&!sim.isStage6FreeParked(x.agent.id))
   .sort((a,b)=>a.d-b.d||a.agent.id.localeCompare(b.agent.id)).slice(0,count);
 if(picks.length!==count)throw Error("NH014 taxi traffic has insufficient unassigned agents");
 const ids=new Set<string>();
 for(const [ordinal,{index}] of picks.entries()){
   const old=sim.agents[index]!;
   const id="NH014:TAXI:"+String(ordinal).padStart(2,"0");
   sim.agents[index]={...old,id,modelId:NH014_TAXI_MODEL_ID,paintId:"SOURCE_TAXI_LIVERY",
     length:4.5,width:1.85};
   ids.add(id);
 }
 if(ids.size!==count||sim.agents.length!==sim.population||
    new Set(sim.agents.map(a=>a.id)).size!==sim.population)
   throw Error("NH014 taxi pilot altered authoritative NH-012 population");
 return ids;
}
