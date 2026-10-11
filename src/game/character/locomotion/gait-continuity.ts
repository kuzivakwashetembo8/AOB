/**
 * GTD-CHAR-001 L2 — stability of visual gait decisions, NOT a physics or IK
 * solver. All state and timers evolve in the fixed (60 Hz) simulation tick.
 * Thresholds are provisional and must be evaluated in real Meridian play.
 */
export type VisualGait = "idle" | "walk" | "sprint" | "jump";
export type GaitInputs = Readonly<{
  intentMagnitude: number;
  correctedPlanarSpeed: number;
  rawGrounded: boolean;
  sprintRequested: boolean;
  jumpAscending: boolean;
  dt: number;
}>;

export type GaitDecision = Readonly<{
  state: VisualGait;
  rawCandidate: VisualGait;
  briefGroundLoss: boolean;
  briefSpeedLoss: boolean;
  lastTransition: string | null;
  transitionCount: number;
  ungroundedSeconds: number;
  missingMotionSeconds: number;
}>;

const CONTACT_GRACE_SECONDS = 0.105;
const MOTION_GRACE_SECONDS = 0.11;
const RUNNING_SPEED_GATE = 5;
const WALKING_SPEED_GATE = 0.18;
const REAL_MOTION_EPSILON = 0.25;

function safeTime(delta: number): number {
  return Number.isFinite(delta) ? Math.max(0, Math.min(0.1, delta)) : 0;
}

export function rawGaitCandidate(sample: GaitInputs): VisualGait {
  if (!sample.rawGrounded) return "jump";
  return sample.correctedPlanarSpeed > RUNNING_SPEED_GATE ? "sprint" :
    sample.correctedPlanarSpeed > WALKING_SPEED_GATE ? "walk" : "idle";
}

/**
 * A one-tick false "ungrounded" or near-zero collision-corrected velocity
 * should not restart the entire skeleton clip while movement remains held.
 * Sustained blocking must settle to idle, and real jump/airborne must remain
 * responsive. Intent never overrides Rapier translation.
 */
export class GaitContinuityController {
  private state: VisualGait = "idle";
  private lastTransition: string | null = null;
  private transitionCount = 0;
  private ungroundedSeconds = 0;
  private missingMotionSeconds = 0;

  reset(): void {
    this.state = "idle";
    this.lastTransition = null;
    this.transitionCount = 0;
    this.ungroundedSeconds = 0;
    this.missingMotionSeconds = 0;
  }

  update(sample: GaitInputs): GaitDecision {
    const dt = safeTime(sample.dt);
    const movingIntent = Number.isFinite(sample.intentMagnitude) && sample.intentMagnitude > 0.05;
    const speed = Number.isFinite(sample.correctedPlanarSpeed)
      ? Math.max(0, sample.correctedPlanarSpeed) : 0;
    const hasMotion = speed > REAL_MOTION_EPSILON;

    this.ungroundedSeconds = sample.rawGrounded || sample.jumpAscending
      ? (sample.rawGrounded ? 0 : this.ungroundedSeconds + dt)
      : this.ungroundedSeconds + dt;
    this.missingMotionSeconds = hasMotion ? 0 : this.missingMotionSeconds + dt;

    const wasTraversing = this.state === "walk" || this.state === "sprint";
    const briefGroundLoss = !sample.rawGrounded && !sample.jumpAscending &&
      movingIntent && wasTraversing && this.ungroundedSeconds <= CONTACT_GRACE_SECONDS;
    const briefSpeedLoss = !hasMotion && movingIntent && wasTraversing &&
      this.missingMotionSeconds <= MOTION_GRACE_SECONDS;

    let next: VisualGait;
    if (sample.jumpAscending ||
        (!sample.rawGrounded && !briefGroundLoss && this.ungroundedSeconds > CONTACT_GRACE_SECONDS)) {
      next = "jump";
    } else if (!movingIntent || (!hasMotion && !briefSpeedLoss)) {
      // True key/pointer release is immediate; an actual long wall blockage
      // eventually stops the legs despite a persistent movement command.
      next = "idle";
    } else if (sample.sprintRequested) {
      // Sprint intent, not a noisy threshold at 5 m/s, selects the sprint
      // clip once the physical body is actually translating.
      next = "sprint";
    } else {
      next = "walk";
    }
    if (this.state !== next) {
      this.lastTransition = this.state + "->" + next;
      this.transitionCount++;
      this.state = next;
    } else {
      this.lastTransition = null;
    }

    return {
      state: this.state,
      rawCandidate: rawGaitCandidate(sample),
      briefGroundLoss,
      briefSpeedLoss,
      lastTransition: this.lastTransition,
      transitionCount: this.transitionCount,
      ungroundedSeconds: this.ungroundedSeconds,
      missingMotionSeconds: this.missingMotionSeconds,
    };
  }
}
