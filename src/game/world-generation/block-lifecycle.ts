import type { ResolvedBuildingSpec } from "./schema";
import { CityRegistry } from "./city-registry";
export interface BlockAsset { dispose(): void; }
export class BlockLifecycle<T extends BlockAsset> {
  private readonly entries = new Map<string, T[]>();
  constructor(readonly city: CityRegistry, readonly factory: (building: ResolvedBuildingSpec) => T) {}
  acquire(id: string): void {
    if (this.entries.has(id)) return;
    const specs = this.city.getBuildingsInBlock(id);
    const assets = specs.map((spec) => this.factory(spec));
    this.entries.set(id, assets);
  }
  getActiveIds(): readonly string[] { return [...this.entries.keys()]; }
}
