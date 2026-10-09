import type { WorldPosition } from "./schema";
import { CityRegistry } from "./city-registry";
import type { ResolvedBuildingSpec } from "./schema";

export interface StreamResource {
  dispose(): void;
  setRepresentationDistance?(distance: number): void;
}
export interface StreamingOptions {
  readonly loadRadius: number;
  readonly unloadRadius: number;
}
export const DEFAULT_STREAMING_OPTIONS: StreamingOptions = {
  loadRadius: 85, unloadRadius: 125,
};
export interface BlockStreamRecord<T extends StreamResource> {
  readonly blockId: string;
  readonly resources: readonly T[];
  readonly buildings: readonly ResolvedBuildingSpec[];
}
export function blockDistanceTo(registry: CityRegistry, blockId: string, position: WorldPosition): number {
  const location = registry.getBlock(blockId);
  if (!location) throw new Error("Unknown block");
  let nearest = Infinity;
  for (const lot of location.block.lots) {
    const dx = Math.max(0, Math.abs(position.x - lot.position.x) - lot.width / 2);
    const dz = Math.max(0, Math.abs(position.z - lot.position.z) - lot.depth / 2);
    nearest = Math.min(nearest, Math.hypot(dx, dz));
  }
  for (const space of location.block.publicSpaces ?? []) {
    const dx = Math.max(0, Math.abs(position.x - space.position.x) - space.width / 2);
    const dz = Math.max(0, Math.abs(position.z - space.position.z) - space.depth / 2);
    nearest = Math.min(nearest, Math.hypot(dx, dz));
  }
  return nearest;
}

export class BlockStreamer<T extends StreamResource> {
  private readonly loaded = new Map<string, BlockStreamRecord<T>>();
  constructor(
    readonly registry: CityRegistry,
    readonly create: (spec: ResolvedBuildingSpec) => T,
    readonly options: StreamingOptions = DEFAULT_STREAMING_OPTIONS,
  ) {
    if (!(options.loadRadius > 0 && options.unloadRadius > options.loadRadius)) {
      throw new Error("Streaming radii must be positive and ordered");
    }
  }
  getLoadedBlockIds(): readonly string[] { return [...this.loaded.keys()]; }
  dispose(): void {
    for (const id of this.getLoadedBlockIds()) this.unload(id);
  }
  unload(blockId: string): void {
    const record = this.loaded.get(blockId);
    if (!record) return;
    this.loaded.delete(blockId);
    for (const resource of record.resources) resource.dispose();
  }
}
