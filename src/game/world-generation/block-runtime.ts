import type { ResolvedBuildingSpec } from "./schema";
export interface StreamedObject { dispose(): void; }
export type BlockFactory<T extends StreamedObject> = (building: ResolvedBuildingSpec) => T;
