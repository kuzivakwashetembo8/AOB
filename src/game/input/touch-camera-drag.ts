import type { GameCommand } from "../core/types";

/**
 * One finger controls the camera while other touch pointers remain free for
 * the movement joystick and action buttons.
 */
export class TouchCameraDragTracker {
  private pointer: { id: number; x: number; y: number } | null = null;

  begin(id: number, x: number, y: number): boolean {
    if (this.pointer || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    this.pointer = { id, x, y };
    return true;
  }

  move(id: number, x: number, y: number): { x: number; y: number } | null {
    if (!this.pointer || this.pointer.id !== id) return null;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const dx = x - this.pointer.x;
    const dy = y - this.pointer.y;
    this.pointer.x = x;
    this.pointer.y = y;
    // Resuming a gesture after OS interruption must not spin the camera.
    return {
      x: Math.max(-96, Math.min(96, dx)),
      y: Math.max(-96, Math.min(96, dy)),
    };
  }

  end(id: number): boolean {
    if (this.pointer?.id !== id) return false;
    this.pointer = null;
    return true;
  }

  reset(): void {
    this.pointer = null;
  }
}

/**
 * Unobstructed canvas touch-drag rotates the camera as desktop mouse-look does.
 * The HUD overlays and movement/action buttons receive their own touches.
 */
export function attachCanvasTouchCameraLook(
  canvas: HTMLCanvasElement,
  send: (command: Extract<GameCommand, { type: "look-delta" }>) => void,
): () => void {
  const drag = new TouchCameraDragTracker();
  const down = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    if (!drag.begin(event.pointerId, event.clientX, event.clientY)) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    const delta = drag.move(event.pointerId, event.clientX, event.clientY);
    if (!delta) return;
    event.preventDefault();
    if (delta.x !== 0 || delta.y !== 0) send({ type: "look-delta", ...delta });
  };
  const release = (event: PointerEvent) => {
    if (event.pointerType === "touch") drag.end(event.pointerId);
  };
  const blur = () => drag.reset();
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("lostpointercapture", release);
  window.addEventListener("blur", blur);
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", release);
    canvas.removeEventListener("pointercancel", release);
    canvas.removeEventListener("lostpointercapture", release);
    window.removeEventListener("blur", blur);
    drag.reset();
  };
}
