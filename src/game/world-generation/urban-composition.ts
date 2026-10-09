import type { CitySpec, FacadeMaterial } from "./schema";
import { resolveCityBuildings } from "./defaults";
import { featureChoice, featureRandom } from "./seeded-variation";
import { planLotOrientation } from "./lot-orientation";
import { skylineBand } from "./skyline";

export interface NeighborhoodRules {
  readonly floorRange: readonly [number, number];
  readonly commercialFrontage: number;
  readonly garageFrequency: number;
  readonly materialFamilies: readonly FacadeMaterial[];
  readonly skylineAnchors: number;
  readonly treeDensity: number;
}
export const SOUTH_WARD_RULES: NeighborhoodRules = {
  floorRange: [1, 7], commercialFrontage: 0.35, garageFrequency: 0.12,
  materialFamilies: ["warm-brick", "painted-block", "weathered-concrete"],
  skylineAnchors: 2, treeDensity: 0.28,
};
export const CENTRAL_RULES: NeighborhoodRules = {
  floorRange: [4, 36], commercialFrontage: 0.65, garageFrequency: 0.04,
  materialFamilies: ["weathered-concrete", "storefront-glass", "plaster"],
  skylineAnchors: 4, treeDensity: 0.16,
};
export function planNeighborhood(city: CitySpec, neighborhoodId: string, rules?: NeighborhoodRules) {
  const district = city.districts.find((d) => d.neighborhoods.some((n) => n.id === neighborhoodId));
  const neighborhood = district?.neighborhoods.find((n) => n.id === neighborhoodId);
  if (!district || !neighborhood) throw new Error("Unknown neighborhood " + neighborhoodId);
  const policy = rules ?? (district.id === "meridian-central" ? CENTRAL_RULES : SOUTH_WARD_RULES);
  if (policy.floorRange[0] < 1 || policy.floorRange[1] < policy.floorRange[0] ||
      !policy.materialFamilies.length) throw new Error("Invalid neighborhood policy");
  const resolved = new Map(resolveCityBuildings(city).map((b) => [b.id, b]));
  const lots = neighborhood.blocks.flatMap((block) => block.lots.map((lot) => {
    const orientation = planLotOrientation(city, lot);
    const roll = featureRandom(lot.id, city.generatorVersion, "composition:archetype");
    const proposedArchetype = roll < policy.garageFrequency ? "garage" :
      roll < policy.garageFrequency + policy.commercialFrontage ? "commercial" : "residential";
    const proposedFloors = policy.floorRange[0] + Math.floor(
      featureRandom(lot.id, city.generatorVersion, "composition:floors") *
      (policy.floorRange[1] - policy.floorRange[0] + 1));
    const building = lot.building ? resolved.get(lot.building.id) : undefined;
    const height = building ? building.parameters.floors * building.parameters.floorHeight : proposedFloors * 3.3;
    return {
      lotId: lot.id,
      ...orientation, proposedArchetype, proposedFloors,
      proposedMaterial: featureChoice(lot.id, city.generatorVersion, "composition:material", policy.materialFamilies),
      skylineBand: skylineBand(height), authoredBuildingId: building?.id,
      authoredYawDelta: building ? orientation.yawRadians - building.yawRadians : undefined,
      height,
    };
  }));
  const anchors = lots.filter((lot) => lot.authoredBuildingId)
    .sort((a, b) => b.height - a.height || a.lotId.localeCompare(b.lotId))
    .slice(0, policy.skylineAnchors).map((lot) => lot.authoredBuildingId!);
  return { neighborhoodId, rules: policy, lots, skylineAnchorBuildingIds: anchors };
}
