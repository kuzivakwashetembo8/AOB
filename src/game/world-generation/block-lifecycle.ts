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
  discard(id: string): void {
    const assets = this.entries.get(id);
    if (!assets) return;
    this.entries.delete(id);
    for (const asset of assets) asset.dispose();
  }
  dispose(): void {
    for (const id of this.getActiveIds()) this.discard(id);
  }
  getActiveIds(): readonly string[] { return [...this.entries.keys()]; }
}
