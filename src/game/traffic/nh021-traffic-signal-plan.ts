/** POI-011: citywide data contract; ONLY the Finch HQ pilot is enabled.
 * Candidate classifications and additional installations require owner approval. */
export const FINCH_SIGNAL_NODE_021="NH012:N:6:4" as const;
export const FINCH_SIGNAL_CENTRE_021={x:64,z:-64} as const;
export type SignalInstallation021="roadside"|"hanging"|"mixed";
export type JunctionSignalPlan021=Readonly<{
 nodeId:string;centre:Readonly<{x:number;z:number}>;
 installation:SignalInstallation021;enabled:boolean;
 greenTicks:number;amberTicks:number;clearanceTicks:number;
 walkTicks:number;pedestrianClearanceTicks:number;
}>;
export const FINCH_SIGNAL_PLAN_021:JunctionSignalPlan021={
 nodeId:FINCH_SIGNAL_NODE_021,centre:FINCH_SIGNAL_CENTRE_021,
 installation:"mixed",enabled:true,
 greenTicks:320,amberTicks:60,clearanceTicks:40,
 walkTicks:100,pedestrianClearanceTicks:200,
};
/** Future nodes are unsignalized unless deliberately opted in. */
export function pilotSignalPlans021():readonly JunctionSignalPlan021[]{
 return [FINCH_SIGNAL_PLAN_021];
}
export function pilotZebraEdge021(from:string,to:string):boolean{
 const isPilot=(id:string)=>/^zebra:[en]:6:4:[+-]$/.test(id);
 return isPilot(from)&&isPilot(to)&&from.slice(0,-1)===to.slice(0,-1);
}
