import { useSyncExternalStore } from "react";
import type { RuntimeBridge } from "./runtime-bridge";
export function useGameSnapshot(bridge: RuntimeBridge) {
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot, bridge.getSnapshot);
}
