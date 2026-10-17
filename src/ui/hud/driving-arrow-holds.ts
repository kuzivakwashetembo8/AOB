/** Pure pointer state. One finger releasing cannot cancel a different hold. */
export type DrivingArrow = "left" | "right" | "up" | "down";
export type DrivingArrowIntent = { x: number; y: number };
export class DrivingArrowHolds {
  private pointers = new Map<number, DrivingArrow>();
  press(pointerId: number, direction: DrivingArrow): DrivingArrowIntent {
    this.pointers.set(pointerId, direction);
    return this.intent();
  }
  release(pointerId: number): DrivingArrowIntent {
    this.pointers.delete(pointerId);
    return this.intent();
  }
  has(pointerId: number): boolean { return this.pointers.has(pointerId); }
  pressed(direction: DrivingArrow): boolean {
    return [...this.pointers.values()].includes(direction);
  }
  reset(): DrivingArrowIntent {
    this.pointers.clear();
    return this.intent();
  }
  intent(): DrivingArrowIntent {
    // Do not clamp a diagonal to a scalar: both vehicle axes need full input.
    return {
      x: Number(this.pressed("right")) - Number(this.pressed("left")),
      y: Number(this.pressed("down")) - Number(this.pressed("up")),
    };
  }
}
