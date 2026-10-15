import {describe,expect,it} from "vitest";
import {
  FIT004_MAX_FOOT_TARGET_LIFT_METRES, planCabinFit004Candidates,
} from "../game/character/cabin-fit-004-policy";

describe("VEH-CABIN-FIT-004 measured candidate policy",()=>{
  it("uses the actual observed 149.1mm deficit to generate finite reachable trials",()=>{
    const plan=planCabinFit004Candidates({
      worstPenetrationMetres:0.1491323,
      missingFootVertices:0,measuredCalfVertices:118,
    });
    expect(plan.status).toBe("eligible");
    expect(plan.candidates.length).toBeGreaterThan(0);
    expect(plan.candidates[0]).toBeCloseTo(0.1651323,6);
    expect(plan.candidates.every(n=>Number.isFinite(n)&&
      n<=FIT004_MAX_FOOT_TARGET_LIFT_METRES)).toBe(true);
  });
  it("fails closed when the foot lies outside the actual imported floor footprint",()=>{
    const plan=planCabinFit004Candidates({worstPenetrationMetres:0.149,
      missingFootVertices:3,measuredCalfVertices:118});
    expect(plan.status).toBe("incomplete-footwell");
    expect(plan.candidates).toEqual([]);
  });
  it("fails closed when calf or sole witnesses are absent",()=>{
    expect(planCabinFit004Candidates({worstPenetrationMetres:0.149,
      missingFootVertices:0,measuredCalfVertices:0}).candidates).toEqual([]);
    expect(planCabinFit004Candidates({worstPenetrationMetres:NaN,
      missingFootVertices:0,measuredCalfVertices:118}).status).toBe("nonfinite");
  });
  it("refuses any implausibly large adjustment; no arbitrary global character shift",()=>{
    const plan=planCabinFit004Candidates({worstPenetrationMetres:0.39,
      missingFootVertices:0,measuredCalfVertices:157});
    expect(plan.status).toBe("outside-feasible-range");
    expect(plan.candidates).toEqual([]);
  });
  it("deduplicates saturated search bounds without exceeding the 0.22m cap",()=>{
    const plan=planCabinFit004Candidates({worstPenetrationMetres:0.205,
      missingFootVertices:0,measuredCalfVertices:157});
    expect(plan.status).toBe("eligible");
    expect(plan.candidates).toEqual([0.22]);
  });
});