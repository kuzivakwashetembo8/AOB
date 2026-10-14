import {describe,expect,it} from "vitest";
import {resolveAcceptedSouthWardPresentation} from "../game/world-generation/south-ward-accepted-presentation";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {planStreetContext} from "../game/world-generation/street-context";
describe("Accepted South Ward continuous-development configuration",()=>{
  it("renders previously accepted grass and Mercer grove without diagnostic flags",()=>{
    const config=resolveAcceptedSouthWardPresentation(new URLSearchParams());
    expect(config).toEqual({
      enableLandUsePreview:true,enableTreePlace001:true,
      treeBudget:30,treeDensityFocus:"mercer-open-side",
    });
    const planned=planStreetContext(FIRST_LIGHT_CITY_SPEC,config);
    expect(planned.forestry?.focus).toBe("mercer-open-side");
    expect(planned.forestry?.generated.length).toBeGreaterThanOrEqual(18);
    expect(planned.forestry?.selectedOpenSideCount).toBeGreaterThanOrEqual(16);
    expect(planned.treeCount).toBe(3+planned.forestry!.generated.length);
  });
  it("explicit opt-out restores legacy three authored trees and non-forestry baseline",()=>{
    const config=resolveAcceptedSouthWardPresentation(
      new URLSearchParams("gtdGround001=0&gtdTreePlace001=0"));
    expect(config.enableLandUsePreview).toBe(false);
    expect(config.enableTreePlace001).toBe(false);
    expect(planStreetContext(FIRST_LIGHT_CITY_SPEC,config).treeCount).toBe(3);
  });
  it("budget and focus remain separately configurable for diagnostics",()=>{
    const config=resolveAcceptedSouthWardPresentation(
      new URLSearchParams("gtdTreeDensity=balanced&gtdTreeBudget=12&gtdGround001=1"));
    expect(config).toEqual({
      enableLandUsePreview:true,enableTreePlace001:true,
      treeBudget:12,treeDensityFocus:"balanced",
    });
    expect(planStreetContext(FIRST_LIGHT_CITY_SPEC,config).forestry?.focus)
      .toBe("balanced");
  });
});
