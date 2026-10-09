import { describe, expect, it } from "vitest";
import { FIRST_LIGHT_CITY_SPEC, planRoadGraph } from "../game/world-generation";
describe("Meridian Step 5 roads", () => {
  it("plans First Light roads", () => {
    const plan = planRoadGraph(FIRST_LIGHT_CITY_SPEC.roads);
    expect(plan.surfaces).toHaveLength(5);
    expect(plan.junctions).toHaveLength(2);
  });
});
