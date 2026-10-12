/**
 * EXP-VEH-002 — Ferrari source orientation and rear-follow camera.
 *
 * The pinned JS-3D-Car controller uses forwardDelta = -speed * dt and drives
 * its unchanged GLB along local -Z; a positive-speed car therefore points
 * toward -Z, not +Z. Preserve that authored convention in both motion
 * and camera. Do not change the established imported visual normalization.
 */
const signedAngle = (value: number) => Math.atan2(Math.sin(value), Math.cos(value));

/** World-planar velocity for a car whose authored nose faces local -Z. */
export function ferrariForwardVelocity(yawRadians: number, speedMps: number) {
  return {
    x: -Math.sin(yawRadians) * speedMps,
    z: -Math.cos(yawRadians) * speedMps,
  };
}

/** Babylon ArcRotateCamera.alpha for a viewpoint behind the Ferrari's nose. */
export function ferrariRearCameraAlpha(yawRadians: number): number {
  return Math.PI / 2 - yawRadians;
}

/**
 * Follow only the vehicle's heading change: the user's touch/mouse orbit
 * remains an offset instead of being erased by an auto-recenter every tick.
 * Normalizes the yaw delta to avoid jumps at the ±π crossing.
 */
export function advanceFerrariCameraAlpha(
  currentCameraAlpha: number,
  previousCarYaw: number,
  currentCarYaw: number,
): number {
  return currentCameraAlpha - signedAngle(currentCarYaw - previousCarYaw);
}
