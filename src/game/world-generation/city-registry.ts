import type { CitySpec, ResolvedBuildingSpec } from "./schema";
import { assertValidCitySpec } from "./validation";
import { resolveCityBuildings } from "./defaults";
import { projectToRoad } from "./road-graph";
import type { WorldPosition } from "./schema";

export class CityRegistry {
  readonly buildings: readonly ResolvedBuildingSpec[];
  private readonly byId: Map<string, ResolvedBuildingSpec>;
  constructor(readonly city: CitySpec) {
    assertValidCitySpec(city);
    this.buildings = resolveCityBuildings(city);
    this.byId = new Map(this.buildings.map((b) => [b.id, b]));
  }
  getBuildingsInBlock(id: string): readonly ResolvedBuildingSpec[] {
    return this.buildings.filter((building) => building.blockId === id);
  }
  getBlock(id: string) {
    for (const district of this.city.districts) for (const neighborhood of district.neighborhoods) {
      const block = neighborhood.blocks.find((candidate) => candidate.id === id);
      if (block) return { district, neighborhood, block };
    }
    return undefined;
  }
  getLot(id: string) {
    for (const district of this.city.districts) for (const neighborhood of district.neighborhoods)
      for (const block of neighborhood.blocks) {
        const lot = block.lots.find((candidate) => candidate.id === id);
        if (lot) return { district, neighborhood, block, lot };
      }
    return undefined;
  }
  getBuilding(id: string) { return this.byId.get(id); }
}
