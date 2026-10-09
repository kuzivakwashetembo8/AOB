import type { ResolvedBuildingSpec } from "./schema";
import { CityRegistry } from "./city-registry";
export interface BlockAsset { dispose(): void; }
export class BlockLifecycle<T extends BlockAsset> {
  private readonly entries = new Map<string, T[]>();
  constructor(readonly city: CityRegistry, readonly factory: (building: ResolvedBuildingSpec) => T) {}
  getActiveIds(): readonly string[] { return [...this.entries.keys()]; }
}
