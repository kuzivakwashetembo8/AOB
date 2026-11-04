/** POI-011: one-axis conservative permissions.
 * Exclusive NH012 junction ownership remains the physical conflict arbiter. */
export type SignalAxis021="NS"|"EW";
export function signalAxis021(dx:number,dz:number):SignalAxis021{
 if((dx===0)===(dz===0))throw Error("POI-011 directed lane is not cardinal");
 return dz!==0?"NS":"EW";
}
export function signalApproachAllowed021(
 phase:string,dx:number,dz:number
):boolean{
 const axis=signalAxis021(dx,dz);
 return phase===axis+"_GREEN";
}
