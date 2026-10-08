import { describe, expect, it } from "vitest";
import {
  ARCHETYPE_DEFAULTS,
  FIRST_LIGHT_CITY_SPEC,
  assertValidCitySpec,
  featureChoice,
  featureRandom,
  featureRange,
  facadeOutward,
  facadeWorldPoint,
  resolveBuildingParameters,
  resolveCityBuildings,
  validateCitySpec,
} from "../game/world-generation";
import type { CitySpec } from "../game/world-generation";

type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const clone = (): Mutable<CitySpec> => structuredClone(FIRST_LIGHT_CITY_SPEC) as Mutable<CitySpec>;
const firstLot = (city: Mutable<CitySpec>) => city.districts[0]!.neighborhoods[0]!.blocks[0]!.lots[1]!;

describe("Meridian Step 1 city contract", () => {
  it("validates the authored First Light inventory and resolves ten stable buildings", () => {
    expect(validateCitySpec(FIRST_LIGHT_CITY_SPEC)).toEqual([]);
    expect(() => assertValidCitySpec(FIRST_LIGHT_CITY_SPEC)).not.toThrow();
    const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
    expect(buildings).toHaveLength(10);
    expect(new Set(buildings.map((b) => b.id)).size).toBe(10);
    expect(buildings.find((b) => b.id === "sw-fl-garage")).toMatchObject({
      position: { x: -7.5, y: 0, z: -5.15 },
      parameters: { width: 13.5, depth: 10, floors: 1, floorHeight: 4.7, garageOpeningCount: 1, interiorMode: "cell" },
    });
  });

  it("keeps authored data unchanged and resolves consistently", () => {
    const before = JSON.stringify(FIRST_LIGHT_CITY_SPEC);
    const a = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
    const b = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
    expect(a).toEqual(b);
    expect(JSON.stringify(FIRST_LIGHT_CITY_SPEC)).toBe(before);
  });

  it("honors global, district, neighborhood, archetype, lot, building precedence", () => {
    const city = clone();
    const district = city.districts[0]!;
    const neighborhood = district.neighborhoods[0]!;
    const lot = firstLot(city);
    const params = resolveBuildingParameters(city, district, neighborhood, lot);
    expect(params.facadeMaterial).toBe("garage-block");
    expect(params.lodProfile).toBe("hero");
    expect(params.setbacks).toEqual({ front: 0, rear: 0, left: 0, right: 0 });
    expect(ARCHETYPE_DEFAULTS.garage.floorHeight).toBe(4.7);
  });

  it("merges partial setbacks and applies later scalar overrides without mutation", () => {
    const city = clone();
    const district = city.districts[0]!;
    const neighborhood = district.neighborhoods[0]!;
    const lot = firstLot(city);
    city.rules = { roofType: "pitched", setbacks: { front: 0.5 } };
    district.rules = { roofType: "shed", setbacks: { rear: 0.25 } };
    neighborhood.rules = { roofType: "parapet", setbacks: { left: 0.2 } };
    lot.rules = { roofType: "pitched", setbacks: { right: 0.3 } };
    lot.building!.overrides = { ...lot.building!.overrides, roofType: "shed", setbacks: { right: 0.1 } };
    const params = resolveBuildingParameters(city, district, neighborhood, lot);
    expect(params.roofType).toBe("shed");
    expect(params.setbacks).toEqual({ front: 0.5, rear: 0.25, left: 0.2, right: 0.1 });
  });

  it("computes stable world-space facade points and outward normals", () => {
    const garage = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC).find((b) => b.id === "sw-fl-garage")!;
    const point = facadeWorldPoint(garage, garage.parameters, "front", 0, 0);
    expect(point.x).toBeCloseTo(-7.5);
    expect(point.z).toBeCloseTo(-0.15);
    expect(facadeOutward(0, "front")).toEqual({ x: 0, y: 0, z: 1 });
    const rotated = facadeWorldPoint({ position: { x: 0, y: 0, z: 0 }, yawRadians: Math.PI / 2 },
      { width: 10, depth: 4 }, "front", 0, 0);
    expect(rotated.x).toBeCloseTo(2);
    expect(rotated.z).toBeCloseTo(0);
  });

  it("rejects an entrance anchor moved away from its opening", () => {
    const city = clone();
    const garage = firstLot(city).building!;
    garage.anchors![0]!.position.x = 100;
    const errors = validateCitySpec(city).map((entry) => entry.message).join(" | ");
    expect(errors).toContain("not located at its facade opening");
  });

  it("generates stable feature-keyed variation independent of call order", () => {
    const seed = "sw-fl-garage";
    const a = featureRandom(seed, 1, "window-tint:rear:0");
    featureRandom(seed, 1, "new-feature");
    expect(featureRandom(seed, 1, "window-tint:rear:0")).toBe(a);
    expect(featureRandom(seed, 2, "window-tint:rear:0")).not.toBe(a);
    expect(featureRandom(seed, 1, "window-tint:rear:1")).not.toBe(a);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(featureRange(seed, 1, "grime", 0.2, 0.8)).toBeGreaterThanOrEqual(0.2);
    expect(["a", "b"]).toContain(featureChoice(seed, 1, "sign", ["a", "b"]));
  });

  it("rejects duplicate IDs, unknown roads and invalid dimensions", () => {
    const city = clone();
    const lots = city.districts[0]!.neighborhoods[0]!.blocks[0]!.lots;
    lots[1]!.building!.id = lots[0]!.building!.id;
    lots[1]!.frontage.roadSegmentId = "missing-road";
    lots[1]!.building!.overrides!.width = -1;
    const errors = validateCitySpec(city as CitySpec).map((entry) => entry.message).join(" | ");
    expect(errors).toContain("Duplicate stable ID");
    expect(errors).toContain("Unknown frontage road segment");
    expect(errors).toContain("Dimension must be finite and positive");
  });

  it("rejects openings intersecting corners, overlapping windows and missing anchors", () => {
    const city = clone();
    const garage = city.districts[0]!.neighborhoods[0]!.blocks[0]!.lots[1]!.building!;
    garage.openings![0]!.width = 15;
    garage.openings![1]!.offset = garage.openings![2]!.offset;
    garage.openings![0]!.anchorId = "nonexistent";
    const errors = validateCitySpec(city as CitySpec).map((entry) => entry.message).join(" | ");
    expect(errors).toContain("corner pier");
    expect(errors).toContain("Overlaps opening");
    expect(errors).toContain("unknown anchor");
  });

  it("rejects incompatible materials, impossible floor heights and negative setbacks", () => {
    const city = clone();
    const garage = city.districts[0]!.neighborhoods[0]!.blocks[0]!.lots[1]!.building!;
    garage.overrides!.facadeMaterial = "warm-brick";
    garage.overrides!.floorHeight = 1.5;
    garage.overrides!.setbacks = { front: -1 };
    const errors = validateCitySpec(city as CitySpec).map((entry) => entry.message).join(" | ");
    expect(errors).toContain("not supported for garage");
    expect(errors).toContain("floor height between");
    expect(errors).toContain("Setback must be finite and nonnegative");
  });
});
