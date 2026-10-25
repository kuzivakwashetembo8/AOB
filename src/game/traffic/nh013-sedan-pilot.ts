/** NH-013 G1: replace the *visual identity* of eight existing NH-012 logical
 * traffic agents. Movement, junction logic and all 125 agent identities remain
 * authoritative inside NH-012. No new traffic agent or Rapier body is created. */
import type {NH012TrafficSimulator} from "./nh012-traffic-simulator";
export const NH013_SEDAN_MODEL_ID="gtd-traffic-sedan-013";
export const NH013_SEDAN_SOURCE="/GLBs/Cars/Four%20Door%20Sedan.glb";
export const NH013_SEDAN_PAINTS=["WHITE","BLACK","SILVER","NAVY","RED"] as const;
export type NH013SedanPaint=typeof NH013_SEDAN_PAINTS[number];

export function assignNH013SedanPilot(
 simulation:NH012TrafficSimulator,
 count=8,
):ReadonlySet<string>{
 if(!Number.isInteger(count)||count<0||count>10)throw Error("NH013 pilot supports 0–10 sedans");
 // Select agents near Voight's original North Heights spawn so the G1 preview
 // can be inspected without crossing the district. Stable for fixed NH-012 seed.
 const selected=simulation.agents.map((a,i)=>({
   index:i,distance:(a.x*a.x)+((a.z+31)*(a.z+31)),id:a.id,
 })).sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id)).slice(0,count);
 const ids=new Set<string>();
 for(const [ordinal,chosen] of selected.entries()){
   const old=simulation.agents[chosen.index]!;
   const paint=NH013_SEDAN_PAINTS[ordinal%NH013_SEDAN_PAINTS.length]!;
   const id="NH013:SEDAN:"+String(ordinal).padStart(2,"0")+":"+paint;
   // The pilot sedan has a conservative 4.75x1.85m logical footprint until
   // the exact author GLB bounds are accepted at the G0/G1 visual checkpoint.
   simulation.agents[chosen.index]={
     ...old,id,modelId:NH013_SEDAN_MODEL_ID,paintId:paint,
     length:4.75,width:1.85,
   };
   ids.add(id);
 }
 if(simulation.agents.length!==simulation.population ||
    new Set(simulation.agents.map(a=>a.id)).size!==simulation.population)
    throw Error("NH013 integration altered NH-012 population or IDs");
 return ids;
}
