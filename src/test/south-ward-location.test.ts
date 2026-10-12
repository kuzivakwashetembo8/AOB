import { describe, expect, it } from "vitest";
import { southWardLocationAt } from "../game/world-generation/south-ward-location";

describe("SO-MA current street metadata", () => {
  it("reports the correct South Ward road using Voight's real world coordinates", () => {
    expect(southWardLocationAt({ x: -25, y: 1, z: 8 })).toBe("South Ward // Mercer Street");
    expect(southWardLocationAt({ x: 20, y: 1, z: 30 })).toBe("South Ward // Workshop Road");
    expect(southWardLocationAt({ x: -24, y: 1, z: 48 })).toBe("South Ward // Foundry Lane");
  });
  it("preserves a stable label across changes in vertical player/vehicle height", () => {
    expect(southWardLocationAt({ x: 34, y: 1, z: 10 }))
      .toEqual(southWardLocationAt({ x: 34, y: 2.5, z: 10 }));
  });
});
