import { describe, expect, it } from "vitest";
import { FIRST_LIGHT_CITY_SPEC, CityRegistry } from "../game/world-generation";
describe("Meridian Step 5 streaming prerequisites", () => {
  it("retains stable block references", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    expect(registry.getBlock("sw-fl-main-north")?.block.lots).toHaveLength(3);
  });
});
