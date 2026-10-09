import type { ResolvedBuildingSpec } from "./schema";
import { CityRegistry } from "./city-registry";
export interface BlockAsset { dispose(): void; }
export class BlockLifecycle<T extends BlockAsset> {
  private readonly entries = new Map<string, T[]>();
  constructor(readonly city: CityRegistry, readonly factory: (building: ResolvedBuildingSpec) => T) {}
  acquire(id: string): void {
    if (this.entries.has(id)) return;
    const specs = this.city.getBuildingsInBlock(id);
    const assets: T[] = [];
    try {
      for (const spec of specs) assets.push(this.factory(spec));
    } catch (failure) {
      for (const asset of assets) asset.dispose();
      throw failure;
    }
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

// Caller owns the scene; this module only owns returned resources.
