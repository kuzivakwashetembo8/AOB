// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { SettingsEditor } from "../ui/menus/settings-editor";
import { defaults } from "../ui/menus/settings-state";
import { RuntimeBridge, initialSnapshot } from "../game/bridge/runtime-bridge";
import type { GameRuntime, GameSnapshot, GameCommand } from "../game/core/types";

afterEach(() => cleanup());

describe("In-game settings without destroying the active world", () => {
  it("applies Custom 125% and allows returning to the same session", () => {
    const apply = vi.fn();
    render(<SettingsEditor inGame initialSettings={defaults} onApply={apply} />);
    const slider = screen.getByRole("slider", { name: "Physical display resolution" });
    fireEvent.change(slider, { target: { value: "125" } });
    expect(screen.getByRole("combobox", { name: "3D render clarity" })).toHaveValue("Custom");
    fireEvent.click(screen.getByRole("button", { name: /apply & resume/i }));
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({ renderClarity: "Custom", renderScalePercent: 125 }),
    );
  });

  it("keeps one GameRuntime attached across pause, graphics command and resume", () => {
    let lifecycle: GameSnapshot = { ...initialSnapshot, lifecycle: "running" };
    const destroy = vi.fn();
    const command = vi.fn<(value: GameCommand) => void>();
    const runtime: GameRuntime = {
      bootstrap: vi.fn(async () => {}),
      start: vi.fn(),
      pause: vi.fn(() => { lifecycle = { ...lifecycle, lifecycle: "paused" }; }),
      resume: vi.fn(() => { lifecycle = { ...lifecycle, lifecycle: "running" }; }),
      destroy,
      command,
      getSnapshot: () => lifecycle,
      subscribeSnapshot: () => () => {},
      subscribeEvent: () => () => {},
    };
    const bridge = new RuntimeBridge();
    bridge.attach(runtime);
    bridge.pause();
    bridge.command({ type: "render-clarity", mode: "Custom", scalePercent: 125 });
    bridge.resume();
    expect(runtime.pause).toHaveBeenCalledOnce();
    expect(runtime.resume).toHaveBeenCalledOnce();
    expect(command).toHaveBeenCalledWith({
      type: "render-clarity", mode: "Custom", scalePercent: 125,
    });
    expect(destroy).not.toHaveBeenCalled();
    expect(lifecycle.lifecycle).toBe("running");
    bridge.destroy();
    expect(destroy).toHaveBeenCalledOnce();
  });
});
