/** NH-016: the five BMW-free source model families in North Heights traffic
 * complete the SAME 125-agent NH-012 fleet, not 91 new actors.
 * Pure inventory and zero mutation of simulator route/kinematics.
 */
import type {NH012Agent,NH012TrafficSnapshot} from "./nh012-traffic-simulator";
export const NH016_FLEET_IDS=[
 "gtd-veh006-mercer-range-rover",
 "gtd-veh008-mercer-toyota-hilux",
 "gtd-veh009-mercer-land-rover-defender",
 "gtd-veh010-mercer-dodge-hp",
 "gtd-veh014-mercer-lamborghini-temerario",
] as const;
export type NH016FleetId=(typeof NH016_FLEET_IDS)[number];
export const NH016_FLEET_SET:ReadonlySet<string>=new Set(NH016_FLEET_IDS);
export function selectDefaultFleetAgents016(snapshot:NH012TrafficSnapshot):readonly NH012Agent[]{
 return snapshot.agents.filter(a=>NH016_FLEET_SET.has(a.modelId));
}
export function verifyCompleteFleet016(snapshot:NH012TrafficSnapshot):{
 total:number;original:number;models:Record<NH016FleetId,number>;
}{
 const models=Object.fromEntries(NH016_FLEET_IDS.map(id=>[id,0])) as Record<NH016FleetId,number>;
 const agents=selectDefaultFleetAgents016(snapshot);
 for(const a of agents)models[a.modelId as NH016FleetId]++;
 if(snapshot.count!==125||agents.length!==91||NH016_FLEET_IDS.some(id=>models[id]<1))
   throw Error("NH016 default six failed fleet circuit integrity (need 91 / 125 across five BMW-free models)");
 return {total:snapshot.count,original:agents.length,models};
}
export type NH016FleetVisualClass="suv"|"pickup"|"offroad"|"muscle"|"supercar";
export const NH016_CLASS:Record<NH016FleetId,NH016FleetVisualClass>={
 "gtd-veh006-mercer-range-rover":"suv",
 "gtd-veh008-mercer-toyota-hilux":"pickup",
 "gtd-veh009-mercer-land-rover-defender":"offroad",
 "gtd-veh010-mercer-dodge-hp":"muscle",
 "gtd-veh014-mercer-lamborghini-temerario":"supercar",
};
export const NH016_PAINT:Readonly<Record<string,string>>={
 WHITE:"#ECEFF0",BLACK:"#222326",SILVER:"#B2B6BB",GRAPHITE:"#42484E",
 NAVY:"#284761",GREY:"#777C7D",FOREST_GREEN:"#46604A",CHAMPAGNE:"#C7B696",
 RED:"#BD3133",BURGUNDY:"#772931",BLUE_METALLIC:"#285CA1",PEARL_WHITE:"#E8E7E2",
};
export function fleetPaint016(paint:string):string{return NH016_PAINT[paint]??"#92989A";}
