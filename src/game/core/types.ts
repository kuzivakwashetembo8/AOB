export type HudContext = "walking" | "driving" | "combat";
export type InputMode = "keyboard" | "touch" | "controller";
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
}>;
export type GameAction = "interact" | "jump" | "combat" | "sprint" | "vehicle" | "context";
export type GameCommand =
  | { type: "move" | "look"; x: number; y: number }
  | { type: "action"; action: GameAction; pressed: boolean }
  | { type: "set-context"; context: HudContext }
  | { type: "input-mode"; mode: InputMode };
export type GameEvent =
  | { type: "progress"; progress: number; detail: string }
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
