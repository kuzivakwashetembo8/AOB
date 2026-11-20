/** GEN-VEH-009: owner-approved homogeneous visual fleet.
 * The NH-012 identities/routes remain intact; no rejected model is drawn.
 * Color is immutable per identity and independent of simulation frame/position.
 */
import type {NH012TrafficSnapshot} from "./nh012-traffic-simulator";
export const NH009_SEDAN_COUNT=62;
export const NH009_SEDAN_MODEL="sedan" as const;
export const NH009_SEDAN_PAINTS=[
 "#F0EFEA", // pearl white
 "#19212C", // midnight black
 "#BBC2C9", // silver
 "#4A5058", // charcoal
 "#B63035", // crimson
 "#782E42", // burgundy
 "#285B98", // ocean blue
 "#63A7C6", // sky blue
 "#285B48", // forest green
 "#86A148", // olive green
 "#D7A83E", // golden ochre
 "#A78169", // bronze
] as const;
export function sedanPaint009(agentId:string):string{
 // Hash identity, not previous "paintId" (which was tied to old models).
 let h=2166136261;
 for(let i=0;i<agentId.length;i++){
   h=Math.imul(h^agentId.charCodeAt(i),16777619);
 }
 return NH009_SEDAN_PAINTS[(h>>>0)%NH009_SEDAN_PAINTS.length]!;
}
export function sedanFleetAudit009(snapshot:NH012TrafficSnapshot){
 if(snapshot.count!==NH009_SEDAN_COUNT||snapshot.agents.length!==NH009_SEDAN_COUNT)
   throw Error("GEN-VEH-009 sedan fleet must contain exactly 62 live NH-012 agents");
 const uniqueIds=new Set(snapshot.agents.map(a=>a.id));
 if(uniqueIds.size!==NH009_SEDAN_COUNT)
   throw Error("GEN-VEH-009 duplicate/missing traffic identities");
 const paints=new Set(snapshot.agents.map(a=>sedanPaint009(a.id)));
 if(paints.size<8)throw Error("GEN-VEH-009 insufficient sedan paint variation");
 return {vehicles:NH009_SEDAN_COUNT,model:NH009_SEDAN_MODEL,
   colors:paints.size,missing:0} as const;
}
