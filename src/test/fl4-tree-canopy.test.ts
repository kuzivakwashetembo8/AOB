import { describe, expect, it } from "vitest";
import { planTreeCanopy } from "../game/world-generation/tree-canopy";

describe("FL4-VIS-B proportional foliage", () => {
  it("grows with tree scale and retains thirty cards", () => {
    const small = planTreeCanopy({ seed: "same", scale: 0.94, canopyScale: 1.08 }, 1);
    const large = planTreeCanopy({ seed: "same", scale: 1.1, canopyScale: 1.31 }, 1);
    expect(large.radius).toBeGreaterThan(small.radius);
    expect(large.depth).toBeGreaterThan(small.depth);
    expect(small.cards).toHaveLength(30);
    expect(large.cards).toHaveLength(30);
    expect(planTreeCanopy({ seed: "same", scale: 1.1, canopyScale: 1.31 }, 1)).toEqual(large);
  });
});
