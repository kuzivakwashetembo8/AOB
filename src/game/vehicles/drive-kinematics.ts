/**
 * GTD-WORLD-002 / EXP-VEH-002 — first Ferrari driving trial.
 * A bounded speed/steering model, not tire/suspension or ambient traffic AI.
 * Units: seconds, metres, radians. Positive steer turns toward local +X.
 */
export interface DriveState {
  readonly speedMps: number;
  readonly steeringRadians: number;
}
export interface DriveInput {
  readonly throttle: number;
  readonly steering: number;
}
export const DRIVE_LIMITS = {
  forwardMps: 8,
  reverseMps: 3,
  accelerationMps2: 4.5,
  reverseAccelerationMps2: 3,
  brakeMps2: 9,
  coastMps2: 3,
  maxSteerRadians: 0.5,
  steeringResponseRadiansPerSecond: 2.8,
  wheelbaseMetres: 2.65,
} as const;
const clamp = (value: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(value) ? value : 0));
const approach = (current: number, target: number, change: number) =>
  current < target ? Math.min(target, current + change) : Math.max(target, current - change);

export function stepDriveControl(
  state: DriveState, input: DriveInput, dt: number,
): DriveState & { readonly yawRateRadiansPerSecond: number } {
  const step = clamp(dt, 0, 1 / 20);
  const throttle = clamp(input.throttle, -1, 1);
  const steering = clamp(input.steering, -1, 1);
  const speed = Number.isFinite(state.speedMps) ? state.speedMps : 0;
  const nextSpeed = throttle > 0
    ? approach(speed, throttle * DRIVE_LIMITS.forwardMps,
      (speed < 0 ? DRIVE_LIMITS.brakeMps2 : DRIVE_LIMITS.accelerationMps2) * step)
    : throttle < 0
      ? approach(speed, throttle * DRIVE_LIMITS.reverseMps,
        (speed > 0 ? DRIVE_LIMITS.brakeMps2 : DRIVE_LIMITS.reverseAccelerationMps2) * step)
      : approach(speed, 0, DRIVE_LIMITS.coastMps2 * step);
  const angle = approach(
    state.steeringRadians, steering * DRIVE_LIMITS.maxSteerRadians,
    DRIVE_LIMITS.steeringResponseRadiansPerSecond * step,
  );
  const yawRate = nextSpeed / DRIVE_LIMITS.wheelbaseMetres * Math.tan(angle);
  return {
    speedMps: nextSpeed,
    steeringRadians: angle,
    yawRateRadiansPerSecond: yawRate,
  };
}
