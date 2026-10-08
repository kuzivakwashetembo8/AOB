import { describe, expect, it, vi } from "vitest";
import { RuntimeBridge, initialSnapshot } from "@/game/bridge/runtime-bridge";
import type { GameRuntime, GameSnapshot, GameEvent } from "@/game/core/types";
describe("Runtime bridge", () => {
  it("is safe without an engine", async () => {
    const bridge = new RuntimeBridge();
    await bridge.bootstrap(document.createElement("canvas"));
    bridge.start();
    bridge.pause();
    bridge.resume();
    bridge.command({ type: "move", x: 1, y: 0 });
    expect(bridge.getSnapshot()).toEqual(initialSnapshot);
    bridge.destroy();
  });
  it("forwards commands, events, snapshots and lifecycle, then detaches", () => {
    const bridge = new RuntimeBridge();
    let receiveSnapshot: (snapshot: GameSnapshot) => void = () => {};
    let receiveEvent: (event: GameEvent) => void = () => {};
    const unSnapshot = vi.fn();
    const unEvent = vi.fn();
    const runtime: GameRuntime = {
      bootstrap: vi.fn(async () => {}),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      destroy: vi.fn(),
      command: vi.fn(),
      getSnapshot: () => initialSnapshot,
      subscribeSnapshot: (callback) => {
        receiveSnapshot = callback;
        return unSnapshot;
      },
      subscribeEvent: (callback) => {
        receiveEvent = callback;
        return unEvent;
      },
    };
    const listener = vi.fn();
    const eventListener = vi.fn();
    bridge.subscribe(listener);
    bridge.subscribeEvent(eventListener);
    bridge.attach(runtime);
    receiveSnapshot({ ...initialSnapshot, context: "driving", speed: 22 });
    expect(bridge.getSnapshot().speed).toBe(22);
    receiveEvent({ type: "interaction", label: "Enter vehicle" });
    expect(eventListener).toHaveBeenCalledWith({ type: "interaction", label: "Enter vehicle" });
    bridge.command({ type: "action", action: "jump", pressed: true });
    expect(runtime.command).toHaveBeenCalledWith({ type: "action", action: "jump", pressed: true });
    bridge.start();
    bridge.pause();
    bridge.resume();
    expect(runtime.start).toHaveBeenCalledOnce();
    expect(runtime.pause).toHaveBeenCalledOnce();
    expect(runtime.resume).toHaveBeenCalledOnce();
    bridge.detach();
    expect(unSnapshot).toHaveBeenCalledOnce();
    expect(unEvent).toHaveBeenCalledOnce();
    expect(runtime.destroy).toHaveBeenCalledOnce();
    expect(bridge.getSnapshot()).toEqual(initialSnapshot);
  });
});
