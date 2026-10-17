/** GTD-LOAD-060: ONE MINUTE is the hard loading attention-span budget.
 * Playability is defined by the real post-import first-frame completion event.
 * Never fake completion, terminate late loads, or conflate GitHub HEAD with a
 * deployed version. Measurements include release check and imported vehicles.
 */
export const STARTUP_LOAD_BUDGET_SECONDS = 60;

export function formatStartupDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
export function describeStartupBudget(elapsedSeconds: number) {
  const elapsed = Number.isFinite(elapsedSeconds)
    ? Math.max(0, elapsedSeconds) : 0;
  return {
    exceeded: elapsed > STARTUP_LOAD_BUDGET_SECONDS,
    overBySeconds: Math.max(0, Math.ceil(elapsed - STARTUP_LOAD_BUDGET_SECONDS)),
    remainingSeconds: Math.max(0, Math.ceil(STARTUP_LOAD_BUDGET_SECONDS - elapsed)),
  };
}
/** Single stopwatch per route load. Use performance.now() from the caller,
 * so browser throttling cannot cause one-second setInterval drift. */
export class StartupBudgetStopwatch {
  private startedAtMs: number | null = null;
  private stoppedAtMs: number | null = null;
  get completed(): boolean { return this.stoppedAtMs !== null; }
  start(nowMs: number): void {
    if (!Number.isFinite(nowMs)) throw Error("Invalid startup timer timestamp");
    if (this.startedAtMs !== null) return;
    this.startedAtMs = nowMs;
  }
  elapsedSecondsAt(nowMs: number): number {
    return Math.floor(this.elapsedMillisecondsAt(nowMs)/1000);
  }
  elapsedMillisecondsAt(nowMs: number): number {
    if (this.startedAtMs === null) return 0;
    const end = this.stoppedAtMs ?? nowMs;
    if (!Number.isFinite(end)) throw Error("Invalid startup timer timestamp");
    return Math.max(0, end - this.startedAtMs);
  }
  stop(nowMs: number): number {
    if (this.startedAtMs === null) throw Error("Startup timer not running");
    if (!Number.isFinite(nowMs)) throw Error("Invalid startup timer timestamp");
    this.stoppedAtMs ??= nowMs;
    return this.elapsedSecondsAt(this.stoppedAtMs);
  }
  stopMilliseconds(nowMs:number):number {
    this.stop(nowMs);
    return this.elapsedMillisecondsAt(nowMs);
  }
}
