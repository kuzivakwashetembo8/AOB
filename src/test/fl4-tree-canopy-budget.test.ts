import { it, expect } from "vitest";
import { planTreeCanopy } from "../game/world-generation/tree-canopy";
it("keeps canopy card and trunk budgets", () => {
  const plan = planTreeCanopy({ seed: "test", scale: 1 }, 1);
  expect(plan.cards).toHaveLength(30);
  expect(plan.trunkHeight).toBeCloseTo(5.05);
  expect(plan.trunkDiameter).toBeCloseTo(0.7);
});
