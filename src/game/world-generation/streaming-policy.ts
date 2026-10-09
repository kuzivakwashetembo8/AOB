import type { WorldPosition } from "./schema";
import { BlockLifecycle } from "./block-lifecycle";
import type { BlockAsset } from "./block-lifecycle";
export interface StreamingPolicy { readonly activateWithin: number; readonly discardBeyond: number; }
export const DEFAULT_BLOCK_POLICY: StreamingPolicy = { activateWithin: 85, discardBeyond: 125 };
