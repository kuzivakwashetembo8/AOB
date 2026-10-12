import { describe, expect, it } from "vitest";
import {
  FIRST_LIGHT_CITY_SPEC, planBuilding, resolveCityBuildings,
  defaultFacadeBayRole,
} from "../game/world-generation";

const all = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const allPlans = all.map(spec => ({ spec, plan: planBuilding(spec, FIRST_LIGHT_CITY_SPEC.generatorVersion) }));

describe("SO-MA generator-wide architectural window grammar", () => {
  it("does not invent ground-floor ordinary windows on any multistorey building", () => {
    for (const { spec, plan } of allPlans) {
      if (spec.parameters.floors < 2) continue;
      const illegal = plan.openings.filter(o =>
        o.source === "generated" && o.kind === "window" && o.floor === 0);
      expect(illegal, "illegal floor-zero generated window: " + spec.id).toHaveLength(0);
    }
  });

  it("allows ground-floor shop glazing only on documented commercial frontages", () => {
    expect(defaultFacadeBayRole("residential", "front", 0, 2)).toBe("wall");
    expect(defaultFacadeBayRole("office", "front", 0, 3)).toBe("wall");
    expect(defaultFacadeBayRole("podium-tower", "front", 0, 10)).toBe("wall");
    expect(defaultFacadeBayRole("commercial", "front", 0, 2)).toBe("storefront");
    expect(defaultFacadeBayRole("mixed-use", "front", 0, 3)).toBe("storefront");
    expect(defaultFacadeBayRole("commercial", "rear", 0, 2)).toBe("wall");
    expect(defaultFacadeBayRole("residential", "front", 0, 1)).toBe("window");
    for (const { spec, plan } of allPlans) {
      if (spec.parameters.floors <= 1) continue;
      const storefronts = plan.openings.filter(o =>
        o.source === "generated" && o.kind === "storefront" && o.floor === 0);
      if (!["commercial", "mixed-use", "hospitality"].includes(spec.archetype)) {
        expect(storefronts, spec.id).toHaveLength(0);
      }
      expect(storefronts.every(o => !o.cutThrough)).toBe(true);
    }
  });

  it("repeats exactly the same eligible window column set on each upper floor", () => {
    let measuredGroups = 0;
    for (const { spec, plan } of allPlans) {
      if (spec.parameters.windowType === "none") continue;
      for (const mass of plan.masses) {
        for (const facade of ["front", "rear", "left", "right"] as const) {
          const floors = Array.from({ length: mass.floors }, (_, i) => mass.firstFloor + i)
            .filter(f => f >= 1);
          if (floors.length < 2) continue;
          const byFloor = floors.map(floor => plan.openings
            .filter(o => o.massId === mass.id && o.facade === facade &&
              o.floor === floor && o.source === "generated" && o.kind === "window")
            .map(o => Number(o.offset.toFixed(5))).sort((a,b)=>a-b));
          // A deliberately authored real opening may reserve a whole section.
          const hasAuthoredUpper = plan.openings.some(o =>
            o.massId === mass.id && o.facade === facade &&
            o.source === "authored" && o.floor >= 1);
          if (hasAuthoredUpper) continue;
          for (const row of byFloor.slice(1)) expect(row, spec.id + "/" + facade).toEqual(byFloor[0]);
          measuredGroups++;
        }
      }
    }
    expect(measuredGroups).toBeGreaterThan(5);
  });

  it("preserves explicit authored garage windows, service doors and full geometry generation", () => {
    const garage = allPlans.find(p => p.spec.id === "sw-fl-garage")!.plan;
    expect(garage.openings.filter(o => o.source === "authored" && o.kind === "window")).toHaveLength(2);
    expect(garage.openings.some(o => o.kind === "garage" && o.cutThrough)).toBe(true);
    expect(garage.primitives.some(o => o.role === "wall")).toBe(true);
  });

  it("does not change the generated geometry when repeated with the same seed and version", () => {
    for (const { spec, plan } of allPlans) {
      expect(planBuilding(spec, FIRST_LIGHT_CITY_SPEC.generatorVersion)).toEqual(plan);
    }
  });
});
