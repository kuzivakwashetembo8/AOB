/** Presentation cadence only; it never creates gameplay shots or ammunition state. */
export const REESE_AUTOMATIC_FIRE_INTERVAL_MS_001 = 100;

export function advanceReeseAutomaticFireCadence001(
  elapsedMs: number,
  deltaMs: number,
  intervalMs = REESE_AUTOMATIC_FIRE_INTERVAL_MS_001,
): { shots: number; elapsedMs: number } {
  const interval =
    Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : REESE_AUTOMATIC_FIRE_INTERVAL_MS_001;
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
  const total = elapsed + delta;
  const shots = Math.floor(total / interval);
  return { shots, elapsedMs: total - shots * interval };
}
