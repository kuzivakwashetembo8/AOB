import type { CitySpec, ResolvedBuildingSpec } from "./schema";
import { assertValidCitySpec } from "./validation";
import { resolveCityBuildings } from "./defaults";

export class CityRegistry {
  readonly buildings: readonly ResolvedBuildingSpec[];
  private readonly byId: Map<string, ResolvedBuildingSpec>;
  constructor(readonly city: CitySpec) {
    assertValidCitySpec(city);
    this.buildings = resolveCityBuildings(city);
    this.byId = new Map(this.buildings.map((b) => [b.id, b]));
  }
  getBuilding(id: string) { return this.byId.get(id); }
}
