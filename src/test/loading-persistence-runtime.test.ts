import { afterEach, describe, expect, it, vi } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import { GTDGameRuntime } from "@/game/core/gtd-runtime";
import type { MovementInputArbiter } from "@/game/input/movement-input-arbiter";

// Exercise the actual lifecycle without loading world assets or WebGL.
type RuntimeProbe = {
  lifecycle: string; scene: Scene | null; previousTime: number;
  accumulator: number; frameHandle: number | null;
  move: { x: number; y: number }; look: { x: number; y: number };
  pendingTouchLook: { x: number; y: number }; actions: Set<string>;
  movementArbiter: MovementInputArbiter;
};
afterEach(() => vi.unstubAllGlobals());

describe("Loading Persistence — engine lifecycle", () => {
  it("freezes animation and cancels simulation while clearing all input channels", () => {
    const runtime = new GTDGameRuntime();
    const probe = runtime as unknown as RuntimeProbe;
    const request = vi.fn(() => 19), cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    probe.lifecycle = "ready";
    runtime.start();
    runtime.command({ type: "move", x: 1, y: -1, source: "touch-arrows" });
    runtime.command({ type: "move", x: -1, y: 0, source: "keyboard" });
    runtime.command({ type: "look", x: 1, y: -1 });
    runtime.command({ type: "look-delta", x: 30, y: 25 });
    runtime.command({ type: "action", action: "sprint", pressed: true });
    probe.accumulator = 0.01;
    runtime.pause();
    expect(runtime.getSnapshot().lifecycle).toBe("paused");
    expect(cancel).toHaveBeenCalledWith(19);
    expect(probe.frameHandle).toBeNull();
    expect(probe.accumulator).toBe(0);
    expect(probe.move).toEqual({ x: 0, y: 0 });
    expect(probe.look).toEqual({ x: 0, y: 0 });
    expect(probe.pendingTouchLook).toEqual({ x: 0, y: 0 });
    expect(probe.actions.size).toBe(0);
    // A neutral keyup cannot reveal an old accelerator on another source.
    expect(probe.movementArbiter.apply({ type: "move", x: 0, y: 0, source: "keyboard" }))
      .toEqual({ x: 0, y: 0 });
    runtime.command({ type: "move", x: 1, y: -1, source: "touch-arrows" });
    runtime.command({ type: "look-delta", x: 10, y: 20 });
    runtime.command({ type: "action", action: "jump", pressed: true });
    expect(probe.move).toEqual({ x: 0, y: 0 });
    expect(probe.pendingTouchLook).toEqual({ x: 0, y: 0 });
    expect(probe.actions.size).toBe(0);
    expect(request).toHaveBeenCalledOnce();
    runtime.destroy();
  });

  it("pauses a ready world before its first frame and resets both clocks on resume", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const runtime = new GTDGameRuntime();
    const probe = runtime as unknown as RuntimeProbe;
    const request = vi.fn(() => 29);
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    probe.lifecycle = "ready";
    probe.scene = scene;
    probe.previousTime = -3_600_000;
    scene._animationTimeLast = Date.now() - 3_600_000;
    runtime.pause();
    expect(scene.animationsEnabled).toBe(false);
    expect(request).not.toHaveBeenCalled();
    const animationTime = scene._animationTime;
    runtime.resume();
    expect(probe.previousTime).toBeGreaterThanOrEqual(0);
    expect(scene.animationsEnabled).toBe(true);
    expect(scene._animationTimeLast).toBe(0);
    scene._animate();
    expect(scene.deltaTime).toBe(0);
    expect(scene._animationTime).toBe(animationTime);
    expect(request).toHaveBeenCalledOnce();
    runtime.resume();
    expect(request).toHaveBeenCalledOnce();
    runtime.destroy(); engine.dispose();
  });
});
