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
