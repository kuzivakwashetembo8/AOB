import type { GameCommand } from "../core/types";

/** Runtime-owned multi-source intent arbitration. No extra simulation loop.
 * A neutral keyboard keyup must never cancel a held mobile accelerator. */
type Movement = { x: number; y: number };
type MoveCommand = Extract<GameCommand, { type: "move" | "look" }>;
const nonzero = (p: Movement) => Math.abs(p.x) + Math.abs(p.y) > 0.0001;
const channel = (source: MoveCommand["source"]) =>
  source === "keyboard-reset" || source === "keyboard" ? "keyboard" :
  source === "touch-arrows" ? "touch-arrows" :
  source === "touch-joystick" ? "touch-joystick" :
  source?.startsWith("desktop-pointer-") ? "desktop" : "unknown";

export class MovementInputArbiter {
  private readonly channels = new Map<string, Movement & { sequence: number }>();
  private sequence = 0;
  lastSteeringSource: string | null = null;

  apply(command: MoveCommand): Movement | null {
    if (!Number.isFinite(command.x) || !Number.isFinite(command.y)) return null;
    const length = Math.hypot(command.x, command.y);
    const normalized = length > 1
      ? { x: command.x / length, y: command.y / length }
      : { x: command.x, y: command.y };
    const source = channel(command.source);
    if (nonzero(normalized)) {
      this.channels.set(source, { ...normalized, sequence: ++this.sequence });
    } else {
      this.channels.delete(source);
    }
    const active = [...this.channels.entries()].sort((a,b) =>
      b[1].sequence - a[1].sequence)[0];
    const chosen = active?.[1] ?? { x: 0, y: 0 };
    if (Math.abs(chosen.x) > 0.0001) this.lastSteeringSource = active![0];
    // Keep the last steering scheme while recentering an inactive arrow:
    // releasing a finger must not change its calibrated return-to-centre rate.
    return { x: chosen.x, y: chosen.y };
  }

  clear(): void {
    this.channels.clear();
    this.sequence = 0;
    this.lastSteeringSource = null;
  }
}
