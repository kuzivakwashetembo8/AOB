/** NH-015: the Kangoo is a new mesh type on SIX PRE-EXISTING NH-012 agents. */
import type {NH012TrafficSimulator} from "./nh012-traffic-simulator";
export const NH015_KANGO_ID="gtd-traffic-kango-015";
export const NH015_KANGO_ORIGINAL="/GLBs/Cars/Renault%20Kango%20Optimized.glb";
export const NH015_KANGO_DERIVED="/GLBs/Cars/TrafficOptimized/Renault-Kango-Source-Rigged.glb";
export const NH015_KANGO_COUNT=6;
export function assignNH015KangoPilot(sim:NH012TrafficSimulator,count=NH015_KANGO_COUNT):ReadonlySet<string>{
 if(!Number.isInteger(count)||count<0||count>NH015_KANGO_COUNT)
   throw Error("NH015 Kangoo pilot permits 0..6");
 const available=sim.agents.map((agent,index)=>({agent,index,
   distance:agent.x*agent.x+(agent.z+31)**2}))
   .filter(x=>!x.agent.id.startsWith("NH013:")&&!x.agent.id.startsWith("NH014:")&&!x.agent.id.startsWith("NH015:"))
   .sort((a,b)=>a.distance-b.distance||a.agent.id.localeCompare(b.agent.id)).slice(0,count);
 if(available.length!==count)throw Error("NH015 insufficient free traffic agents");
 const ids=new Set<string>();
 for(const [n,{index}] of available.entries()){
   const old=sim.agents[index]!;
   const id="NH015:KANGO:"+String(n).padStart(2,"0");
   sim.agents[index]={...old,id,modelId:NH015_KANGO_ID,paintId:"SOURCE_AMBER",
     length:4.45,width:1.85};
   ids.add(id);
 }
 if(ids.size!==count||new Set(sim.agents.map(a=>a.id)).size!==sim.population||
    sim.agents.length!==sim.population)
   throw Error("NH015 Kangoo assignment changed 125-agent NH012 simulation");
 return ids;
}
