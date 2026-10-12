/**
 * GTD-WORLD-002 reusable vehicle contact policy.
 * Works with the Ferrari trial and later Meridian civilian sedan/traffic cars.
 *
 * Units: metres, seconds. This is collision-aware kinematic L0 locomotion,
 * NOT independent tire suspension or a production vehicle dynamics solver.
 */
export interface StreetVehiclePhysicsProfile {
  readonly classId: string;
  /** Authored forward axis: Ferrari -Z, many standard car rigs +Z. */
  readonly forwardAxisSign: -1 | 1;
  /** Real road curbs are 0.21m; garage portals are physical no-step barriers. */
  readonly maxCurbAutostepMetres: number;
  readonly minStepWidthMetres: number;
  readonly groundSnapMetres: number;
  readonly gravityMetresPerSecondSquared: number;
  readonly terminalDescentMetresPerSecond: number;
  readonly maxClimbPerTickMetres: number;
  readonly wheelRadiusFallbackMetres: number;
}
export const FERRARI_STREET_PROFILE: StreetVehiclePhysicsProfile = Object.freeze({
  classId: "ferrari-evaluation",
  forwardAxisSign: -1,
  maxCurbAutostepMetres: 0.24,
  minStepWidthMetres: 0.08,
  groundSnapMetres: 0.25,
  gravityMetresPerSecondSquared: 9.81,
  terminalDescentMetresPerSecond: 9,
  maxClimbPerTickMetres: 0.09,
  wheelRadiusFallbackMetres: 0.32,
});
export interface VerticalVehicleState {
  readonly descentSpeedMps: number;
  readonly grounded: boolean;
  readonly airborneSeconds: number;
}
export const INITIAL_VERTICAL_VEHICLE_STATE: VerticalVehicleState =
  Object.freeze({ descentSpeedMps: 0, grounded: false, airborneSeconds: 0 });
export function stepVehicleVerticalMotion(
  state: VerticalVehicleState, dt: number, profile: StreetVehiclePhysicsProfile,
): VerticalVehicleState & { requestedDownwardMetres: number } {
  if (!Number.isFinite(dt) || dt <= 0 || dt > 1 / 20) {
    throw new Error("Vehicle grounding requires a positive bounded fixed timestep");
  }
  // A tiny downward probe keeps static ground in contact even while idling.
  // Unsupported cars gain actual gravity, rather than hovering at 0.24m/s.
  const descentSpeedMps = state.grounded
    ? Math.max(0.35, profile.gravityMetresPerSecondSquared * dt)
    : Math.min(
        profile.terminalDescentMetresPerSecond,
        state.descentSpeedMps + profile.gravityMetresPerSecondSquared * dt,
      );
  return {
    descentSpeedMps,
    grounded: state.grounded,
    airborneSeconds: state.grounded ? 0 : state.airborneSeconds + dt,
    requestedDownwardMetres: -descentSpeedMps * dt,
  };
}
export function settleVehicleVerticalState(
  provisional: VerticalVehicleState,
  reportedGrounded: boolean,
): VerticalVehicleState {
  return reportedGrounded
    ? { descentSpeedMps: 0, grounded: true, airborneSeconds: 0 }
    : { ...provisional, grounded: false };
}

/** One-step transient upward motion is bounded independently of curb height. */
export function clampVehicleClimb(
  computedY: number, dt: number, profile: StreetVehiclePhysicsProfile,
): { y: number; suspendPlanarTravel: boolean } {
  if (!Number.isFinite(computedY) || !Number.isFinite(dt)) {
    throw new Error("Nonfinite Rapier vehicle displacement");
  }
  const capped = Math.min(computedY, profile.maxClimbPerTickMetres);
  return { y: capped, suspendPlanarTravel: computedY > profile.maxClimbPerTickMetres + 1e-6 };
}

/** Planar m/s from the selected asset's authored forward axis. */
export function streetVehicleForwardVelocity(
  yawRadians: number, speedMps: number, profile: StreetVehiclePhysicsProfile,
) {
  const signedSpeed = speedMps * profile.forwardAxisSign;
  return {
    x: Math.sin(yawRadians) * signedSpeed,
    z: Math.cos(yawRadians) * signedSpeed,
  };
}
