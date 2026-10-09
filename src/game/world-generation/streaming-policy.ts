import type { WorldPosition } from "./schema";
import { BlockLifecycle } from "./block-lifecycle";
import type { BlockAsset } from "./block-lifecycle";
export interface StreamingPolicy { readonly activateWithin: number; readonly discardBeyond: number; }
export const DEFAULT_BLOCK_POLICY: StreamingPolicy = { activateWithin: 85, discardBeyond: 125 };
import { blockDistanceTo } from "./block-streaming";

export function updateBlockStreaming<T extends BlockAsset>(
  runtime: BlockLifecycle<T>, position: WorldPosition,
  policy: StreamingPolicy = DEFAULT_BLOCK_POLICY,
): void {
  if (!(policy.activateWithin > 0 && policy.discardBeyond > policy.activateWithin)) {
    throw new Error("Invalid streaming hysteresis radii");
  }
  const blocks = runtime.city.city.districts.flatMap((district) =>
    district.neighborhoods.flatMap((neighborhood) => neighborhood.blocks));
  for (const block of blocks) {
    const distance = blockDistanceTo(runtime.city, block.id, position);
    if (distance <= policy.activateWithin) runtime.acquire(block.id);
    if (distance >= policy.discardBeyond) runtime.discard(block.id);
  }
}
