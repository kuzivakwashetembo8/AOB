import type { GameCommand, GameEvent, GameRuntime, GameSnapshot } from "../core/types";

export const initialSnapshot: GameSnapshot = {
  lifecycle: "idle",
  context: "walking",
  location: "Meridian Central",
  objective: "Reach the observation point",
  health: 100,
  reputation: 0,
  heat: 0,
  speed: 0,
  vehicle: null,
};

/** Presentation boundary only. No renderer, simulation, timers, or engine implementation. */
export class RuntimeBridge {
  private runtime: GameRuntime | null = null;
  private snapshot: GameSnapshot = initialSnapshot;
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(event: GameEvent) => void>();
  private cleanup: Array<() => void> = [];
  getSnapshot = (): GameSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  subscribeEvent = (listener: (event: GameEvent) => void): (() => void) => {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  };
  private update(snapshot: GameSnapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
  attach(runtime: GameRuntime) {
    this.detach();
    this.runtime = runtime;
    this.cleanup = [
      runtime.subscribeSnapshot((snapshot) => this.update(snapshot)),
      runtime.subscribeEvent((event) => this.eventListeners.forEach((listener) => listener(event))),
    ];
    this.update(runtime.getSnapshot());
  }
  async bootstrap(host: HTMLCanvasElement) {
    if (this.runtime) await this.runtime.bootstrap(host);
  }
  start() {
    this.runtime?.start();
  }
  pause() {
    this.runtime?.pause();
  }
  resume() {
    this.runtime?.resume();
  }
  command(command: GameCommand) {
    this.runtime?.command(command);
  }
  detach() {
    this.cleanup.forEach((unsubscribe) => unsubscribe());
    this.cleanup = [];
    this.runtime?.destroy();
    this.runtime = null;
    this.update(initialSnapshot);
  }
  destroy() {
    this.detach();
    this.listeners.clear();
    this.eventListeners.clear();
  }
}
