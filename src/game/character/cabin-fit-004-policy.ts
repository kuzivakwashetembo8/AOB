/** Vehicle Cabin Fit 004 — a geometry-derived candidate policy, not a
 * hard-coded 160-mm shoe translation. Independent of Babylon and render FPS.
 */
export const FIT004_MAX_FOOT_TARGET_LIFT_METRES=0.22;
export const FIT004_CLEARANCE_RESERVE_METRES=0.016;
export const FIT004_TRIAL_INTERVAL_METRES=0.016;
export const FIT004_MAX_TRIALS=4;

export type CabinFit004Trial =
  | {status:"eligible";candidates:readonly number[]}
  | {status:"nonfinite"|"incomplete-footwell"|"outside-feasible-range";candidates:readonly []};

export function planCabinFit004Candidates(args:{
  worstPenetrationMetres:number;
  missingFootVertices:number;
  measuredCalfVertices:number;
}):CabinFit004Trial {
  const {worstPenetrationMetres:penetration,missingFootVertices:missing,
    measuredCalfVertices:calves}=args;
  if(![penetration,missing,calves].every(Number.isFinite))
    return {status:"nonfinite",candidates:[]};
  if(missing>0||calves<=0)return {status:"incomplete-footwell",candidates:[]};
  if(penetration<=0||penetration>FIT004_MAX_FOOT_TARGET_LIFT_METRES)
    return {status:"outside-feasible-range",candidates:[]};
  const first=penetration+FIT004_CLEARANCE_RESERVE_METRES;
  const candidates=Array.from({length:FIT004_MAX_TRIALS},(_,i)=>
    Math.min(FIT004_MAX_FOOT_TARGET_LIFT_METRES,
      first+i*FIT004_TRIAL_INTERVAL_METRES));
  return {status:"eligible",candidates:[...new Set(candidates)]};
}
