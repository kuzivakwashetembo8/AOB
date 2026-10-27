import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { GameEvent, GameSnapshot } from "@/game/core/types";
import { initialSnapshot } from "@/game/bridge/runtime-bridge";
import { PersistentGameSession } from "@/game/bridge/persistent-game-session";

const control = vi.hoisted(() => ({
  instances: [] as Array<{
    host: HTMLCanvasElement | null; snapshot: GameSnapshot;
    bootstrap: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn>;
    command: ReturnType<typeof vi.fn>; resume: ReturnType<typeof vi.fn>;
    pose: { x: number; y: number; z: number };
  }>,
  holdBoot: false, finishBoot: () => {}, navigate: vi.fn(), version: vi.fn(async () => "current"),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => control.navigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));
vi.mock("@/ui/menus/shell", () => ({ Scene: () => null }));
vi.mock("@/lib/game-version-check", () => ({
  checkGameStartupVersion: control.version, retryGameUpdate: vi.fn(), continueWithInstalledBuild: vi.fn(),
}));
vi.mock("@/ui/menus/bootstrap", () => ({ BootstrapOverlay: () => <div role="status">Loading world</div> }));
vi.mock("@/lib/startup-telemetry", () => ({
  StartupTelemetry: class {
    checkpoint() {} asset() {} stageStart() {} stageEnd() {} finish() {} diagnosticSnapshot() {}
  },
}));
vi.mock("@/lib/real-loading-ledger", () => ({
  gtdLoadingLedger: {
    snapshot: () => ({}), startBrowserObservers() {}, startWatchdog() {}, finishWatchdog() {},
    start() {}, finish() {}, fail() {},
    measureAsync: (_id: string, _label: string, _kind: string, run: () => unknown) => run(),
  },
}));
vi.mock("@/game/core/gtd-runtime", () => ({
  GTDGameRuntime: class {
    host: HTMLCanvasElement | null = null;
    pose = { x: 124, y: 1.2, z: -41 };
    snapshot = { ...initialSnapshot, lifecycle: "idle" } as GameSnapshot;
    snapshots = new Set<(value: GameSnapshot) => void>();
    events = new Set<(value: GameEvent) => void>();
    constructor() { control.instances.push(this); }
    publish(lifecycle: GameSnapshot["lifecycle"]) {
      this.snapshot = { ...this.snapshot, lifecycle };
      this.snapshots.forEach((receive) => receive(this.snapshot));
    }
    bootstrap = vi.fn(async (host: HTMLCanvasElement) => {
      this.host = host;
      this.publish("bootstrapping");
      if (control.holdBoot) await new Promise<void>((resolve) => { control.finishBoot = resolve; });
      this.publish("ready");
      this.events.forEach((receive) => receive({ type: "load-checkpoint", id: "first-frame", status: "done" }));
    });
    start = vi.fn(() => this.publish("running"));
    pause = vi.fn(() => { if (["running", "ready"].includes(this.snapshot.lifecycle)) this.publish("paused"); });
    resume = vi.fn(() => { if (this.snapshot.lifecycle === "paused") this.publish("running"); });
    destroy = vi.fn(); command = vi.fn(); getSnapshot = () => this.snapshot;
    subscribeSnapshot = (receive: (value: GameSnapshot) => void) => {
      this.snapshots.add(receive); return () => { this.snapshots.delete(receive); };
    };
    subscribeEvent = (receive: (value: GameEvent) => void) => {
      this.events.add(receive); return () => { this.events.delete(receive); };
    };
  },
}));

beforeEach(() => {
  localStorage.clear();
  control.instances = []; control.holdBoot = false;
  control.version.mockClear(); control.navigate.mockClear();
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { cleanup(); });
const firstRuntime = () => {
  const runtime = control.instances[0];
  if (!runtime) throw new Error("Runtime did not mount");
  return runtime;
};
// Cold CI can spend >1s initialising the retained Babylon session while
// running all suites on two cores; the lifecycle contract is unchanged.
const ready = () => screen.findByRole("button", { name: "Pause menu" },
  undefined,{timeout:8000});

describe("Loading Persistence — actual session surface and bridge", () => {
  it("loads lazily and retains exactly one canvas/runtime across repeated GTD route exits", async () => {
    const view = render(<PersistentGameSession active={false} />);
    expect(control.instances).toHaveLength(0);
    expect(screen.queryByLabelText("GTD 3D game world")).toBeNull();
    view.rerender(<PersistentGameSession active />);
    await ready();
    const canvas = screen.getByLabelText("GTD 3D game world");
    const runtime = firstRuntime();
    const pose = runtime.pose;
    for (let i = 0; i < 3; i++) {
      view.rerender(<PersistentGameSession active={false} />);
      expect(runtime.snapshot.lifecycle).toBe("paused");
      expect(screen.queryByRole("dialog")).toBeNull();
      control.navigate.mockClear(); runtime.command.mockClear();
      fireEvent.keyDown(window, { code: "Tab" });
      fireEvent.keyDown(window, { code: "ArrowUp" });
      expect(control.navigate).not.toHaveBeenCalled();
      expect(runtime.command).not.toHaveBeenCalled();
      view.rerender(<PersistentGameSession active />);
      expect(screen.getByLabelText("GTD 3D game world")).toBe(canvas);
      expect(screen.queryByText("Loading world")).toBeNull();
      expect(runtime.snapshot.lifecycle).toBe("paused");
      fireEvent.click(screen.getByRole("button", { name: /^Resume/ }));
      expect(runtime.snapshot.lifecycle).toBe("running");
    }
    expect(runtime.pose).toBe(pose);
    expect(control.instances).toHaveLength(1);
    expect(runtime.bootstrap).toHaveBeenCalledOnce();
    expect(control.version).toHaveBeenCalledOnce();
    expect(runtime.destroy).not.toHaveBeenCalled();
    view.unmount();
    expect(runtime.destroy).toHaveBeenCalledOnce();
  });

  it("pauses on tab hiding and never auto-resumes on visibility, focus or pageshow", async () => {
    render(<PersistentGameSession active />); await ready();
    const runtime = firstRuntime();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));
    expect(runtime.snapshot.lifecycle).toBe("paused");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    fireEvent(document, new Event("visibilitychange"));
    fireEvent(window, new Event("focus"));
    fireEvent(window, new Event("pageshow"));
    expect(runtime.snapshot.lifecycle).toBe("paused");
    fireEvent.click(screen.getByRole("button", { name: /^Resume/ }));
    expect(runtime.snapshot.lifecycle).toBe("running");
    expect(runtime.bootstrap).toHaveBeenCalledOnce();
  });

  it.each(["blur", "pagehide", "freeze"])("synchronously latches pause on %s", async (event) => {
    render(<PersistentGameSession active />); await ready();
    const runtime = firstRuntime();
    fireEvent(event === "freeze" ? document : window, new Event(event));
    expect(runtime.snapshot.lifecycle).toBe("paused");
    expect(screen.getByRole("dialog", { name: "Pause menu" })).toBeVisible();
    expect(runtime.destroy).not.toHaveBeenCalled();
  });

  it.each(["route", "tab"])("finishes bootstrap paused if the player leaves the %s during loading", async (leave) => {
    control.holdBoot = true;
    const view = render(<PersistentGameSession active />);
    await waitFor(() => expect(control.instances[0]?.bootstrap).toHaveBeenCalledOnce());
    const runtime = firstRuntime();
    if (leave === "route") view.rerender(<PersistentGameSession active={false} />);
    else {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      fireEvent(document, new Event("visibilitychange"));
    }
    await act(async () => { control.finishBoot(); });
    await waitFor(() => expect(runtime.snapshot.lifecycle).toBe("paused"));
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    view.rerender(<PersistentGameSession active />);
    expect(screen.getByRole("button", { name: /^Resume/ })).toBeVisible();
    expect(runtime.resume).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^Resume/ }));
    expect(runtime.snapshot.lifecycle).toBe("running");
    expect(runtime.bootstrap).toHaveBeenCalledOnce();
  });

  it("preserves an intentional pause across departure and return", async () => {
    const view = render(<PersistentGameSession active />); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Pause menu" }));
    view.rerender(<PersistentGameSession active={false} />);
    fireEvent(window, new Event("blur"));
    view.rerender(<PersistentGameSession active />);
    expect(firstRuntime().snapshot.lifecycle).toBe("paused");
    expect(firstRuntime().resume).not.toHaveBeenCalled();
  });

  it("reapplies settings changed outside the retained game surface", async () => {
    const view = render(<PersistentGameSession active />); await ready();
    const runtime = firstRuntime();
    view.rerender(<PersistentGameSession active={false} />);
    localStorage.setItem("gtd-interface-settings", JSON.stringify({ renderClarity: "Custom", renderScalePercent: 125 }));
    runtime.command.mockClear();
    view.rerender(<PersistentGameSession active />);
    expect(runtime.command).toHaveBeenCalledWith({ type: "render-clarity", mode: "Custom", scalePercent: 125 });
    expect(runtime.bootstrap).toHaveBeenCalledOnce();
    expect(runtime.snapshot.lifecycle).toBe("paused");
  });
});
