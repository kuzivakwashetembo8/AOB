import type { ResolvedBuildingSpec } from "./schema";
export interface StreamedObject { dispose(): void; }
export type BlockFactory<T extends StreamedObject> = (building: ResolvedBuildingSpec) => T;
import { CityRegistry } from "./city-registry";
export class CityBlockRuntime<T extends StreamedObject> {
  private readonly active = new Map<string, T[]>();
  constructor(readonly registry: CityRegistry, readonly factory: BlockFactory<T>) {}
  getActiveIds(): readonly string[] { return [...this.active.keys()]; }
}

// Activation is opt-in.
