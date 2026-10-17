import type { StartupCheckpointId, StartupCheckpointState } from "./loading-checklist";

export type HudContext = "walking" | "driving" | "combat";
export type InputMode = "keyboard" | "touch" | "controller";
export type InteriorVisibilityState = "outside" | "threshold" | "inside";

export type GameSnapshot = Readonly<{
  lifecycle: "idle" | "bootstrapping" | "ready" | "running" | "paused" | "destroyed";
  context: HudContext;
  location: string;
  objective: string;
  health: number;
  reputation: number;
  heat: number;
  speed: number;
  vehicle: string | null;
  meridianTime: string;
  meridianMinuteOfDay: number;
  meridianTimeScale: number;
  interiorState: InteriorVisibilityState;
  /** CHAR-002 aerial inspection mode, independent of vehicle context. */
  flying?: boolean;
}>;

export type GameAction =
  | "interact"
  | "jump"
  | "combat"
  | "sprint"
  | "vehicle"
  | "context"
  | "fly"
  | "descend";

export type GameCommand =
  | { type: "move" | "look"; x: number; y: number; source?: "keyboard" | "keyboard-reset" | "desktop-pointer-down" | "desktop-pointer-up" | "desktop-pointer-cancel" | "desktop-pointer-lost" | "touch-joystick" | "touch-arrows" }
  | { type: "look-delta"; x: number; y: number }
  | { type: "camera-settings"; touchSensitivity: number; invertY: boolean }
  | { type: "render-clarity"; mode: import("../renderer/render-clarity").RenderClarityMode; scalePercent: number }
  | { type: "action"; action: GameAction; pressed: boolean }
  | { type: "set-context"; context: HudContext }
  | { type: "input-mode"; mode: InputMode }
  | { type: "set-meridian-time"; minuteOfDay: number }
  | { type: "set-meridian-time-scale"; scale: number }
  | { type: "character-locomotion-tuning"; settings: Partial<import("../character/locomotion/travel-heading").TravelHeadingSettings> };

export type GameEvent =
  | { type: "progress"; progress: number; detail: string }
  | { type: "load-checkpoint"; id: StartupCheckpointId; status: Exclude<StartupCheckpointState, "pending">; detail?: string }
  | { type: "interaction"; label: string | null }
  | { type: "error"; message: string };

export interface GameRuntime {
  bootstrap(host: HTMLCanvasElement): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  command(command: GameCommand): void;
  getSnapshot(): GameSnapshot;
  subscribeSnapshot(listener: (snapshot: GameSnapshot) => void): () => void;
  subscribeEvent(listener: (event: GameEvent) => void): () => void;
}
