import { describe, expect, it, vi } from "vitest";
import {
  TouchCameraDragTracker,
  attachCanvasTouchCameraLook,
} from "../game/input/touch-camera-drag";

function pointer(
  element: Element,
  type: string,
  id: number,
  x: number,
  y: number,
  pointerType = "touch",
): Event {
  const event = Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
    pointerId: id,
    clientX: x,
    clientY: y,
    pointerType,
  });
  element.dispatchEvent(event);
  return event;
}

describe("mobile canvas touch camera", () => {
  it("tracks one finger, clamps interrupted jumps, and never steals another finger", () => {
    const drag = new TouchCameraDragTracker();
    expect(drag.begin(1, 100, 100)).toBe(true);
    expect(drag.begin(2, 150, 150)).toBe(false);
    expect(drag.move(2, 160, 170)).toBeNull();
    expect(drag.move(1, 120, 85)).toEqual({ x: 20, y: -15 });
    expect(drag.move(1, 500, -200)).toEqual({ x: 96, y: -96 });
    expect(drag.end(2)).toBe(false);
    expect(drag.end(1)).toBe(true);
    expect(drag.move(1, 510, -205)).toBeNull();
    expect(drag.begin(3, 0, 0)).toBe(true);
    drag.reset();
    expect(drag.move(3, 10, 10)).toBeNull();
    expect(drag.begin(4, Number.NaN, 0)).toBe(false);
  });

  it("rotates only for a touch captured on the canvas, not HUD buttons or mouse", () => {
    const canvas = document.createElement("canvas");
    const actionButton = document.createElement("button");
    document.body.append(canvas, actionButton);
    const send = vi.fn();
    const capture = vi.fn();
    Object.defineProperty(canvas, "setPointerCapture", { value: capture });
    const cleanup = attachCanvasTouchCameraLook(canvas, send);

    pointer(actionButton, "pointerdown", 7, 0, 0);
    pointer(actionButton, "pointermove", 7, 50, 40);
    expect(send).not.toHaveBeenCalled();

    pointer(canvas, "pointerdown", 1, 10, 20, "mouse");
    pointer(canvas, "pointermove", 1, 40, 70, "mouse");
    expect(send).not.toHaveBeenCalled();

    const down = pointer(canvas, "pointerdown", 2, 100, 100);
    expect(down.defaultPrevented).toBe(true);
    expect(capture).toHaveBeenCalledWith(2);
    pointer(canvas, "pointerdown", 3, 50, 50);
    pointer(canvas, "pointermove", 3, 60, 60);
    expect(send).not.toHaveBeenCalled();
    const dragged = pointer(canvas, "pointermove", 2, 115, 90);
    expect(dragged.defaultPrevented).toBe(true);
    expect(send).toHaveBeenCalledExactlyOnceWith({
      type: "look-delta",
      x: 15,
      y: -10,
    });

    pointer(canvas, "pointerup", 2, 115, 90);
    pointer(canvas, "pointermove", 2, 130, 80);
    expect(send).toHaveBeenCalledTimes(1);
    pointer(canvas, "pointerdown", 4, 0, 0);
    pointer(canvas, "pointercancel", 4, 0, 0);
    pointer(canvas, "pointermove", 4, 20, 10);
    expect(send).toHaveBeenCalledTimes(1);

    pointer(canvas, "pointerdown", 5, 0, 0);
    window.dispatchEvent(new Event("blur"));
    pointer(canvas, "pointermove", 5, 20, 10);
    expect(send).toHaveBeenCalledTimes(1);

    cleanup();
    pointer(canvas, "pointerdown", 6, 0, 0);
    pointer(canvas, "pointermove", 6, 20, 20);
    expect(send).toHaveBeenCalledTimes(1);
    canvas.remove();
    actionButton.remove();
  });

  it("ends a drag when the OS releases pointer capture", () => {
    const canvas = document.createElement("canvas");
    const send = vi.fn();
    const cleanup = attachCanvasTouchCameraLook(canvas, send);
    pointer(canvas, "pointerdown", 11, 5, 5);
    pointer(canvas, "lostpointercapture", 11, 5, 5);
    pointer(canvas, "pointermove", 11, 25, 25);
    expect(send).not.toHaveBeenCalled();
    cleanup();
  });
});
