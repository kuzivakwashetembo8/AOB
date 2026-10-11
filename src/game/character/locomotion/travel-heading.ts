/**
 * GTD-CHAR-001 L1 — travel-facing (not strafing / not backwards walking).
 * All values are trial hypotheses to tune by gameplay, NOT human-realism gates.
 * Pure functions: no Babylon, Rapier or renderer dependency.
 */
export type TravelHeadingSettings = Readonly<{
  turnRateDeg: number;
  turnMobility: number;
  visualForwardDeg: number;
}>;

export const DEFAULT_TRAVEL_HEADING: TravelHeadingSettings = Object.freeze({
  turnRateDeg: 420,
  turnMobility: 0.65,
  visualForwardDeg: 0, // User screenshots: +90 misaligned the visual rig in every direction.
});

export type TravelHeadingStep = Readonly<{
  yaw: number;
  targetYaw: number | null;
  remainingErrorRad: number;
  angularRateRad: number;
  turnSign: -1 | 1;
  travelScale: number;
  travelX: number;
  travelZ: number;
}>;

const RAD = Math.PI / 180;

export function normalizeHeadingSettings(input: Partial<TravelHeadingSettings>): TravelHeadingSettings {
  const rawRate = input.turnRateDeg ?? DEFAULT_TRAVEL_HEADING.turnRateDeg;
  const rawMobility = input.turnMobility ?? DEFAULT_TRAVEL_HEADING.turnMobility;
  const rawForward = input.visualForwardDeg ?? DEFAULT_TRAVEL_HEADING.visualForwardDeg;
  return {
    turnRateDeg: Number.isFinite(rawRate) ? Math.max(90, Math.min(900, rawRate)) : DEFAULT_TRAVEL_HEADING.turnRateDeg,
    turnMobility: Number.isFinite(rawMobility) ? Math.max(0, Math.min(1, rawMobility)) : DEFAULT_TRAVEL_HEADING.turnMobility,
    visualForwardDeg: Number.isFinite(rawForward) ? Math.max(-180, Math.min(180, rawForward)) : DEFAULT_TRAVEL_HEADING.visualForwardDeg,
  };
}

export function signedYawDifference(current: number, target: number, previousSign: -1 | 1 = 1): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  // The antipode has two equally short solutions. Choose the previous turn
  // direction (initially positive) instead of oscillating at the +/-PI seam.
  return Math.abs(Math.abs(difference) - Math.PI) < 1e-7
    ? Math.PI * previousSign : difference;
}

export function wrapYaw(yaw: number): number {
  return Math.atan2(Math.sin(yaw), Math.cos(yaw));
}

/**
 * Return the movement vector after the character has actually begun turning.
 * A large reverse input initially pivots in place; no backward/strafe animation
 * is requested. While turning, travel always advances along character facing,
 * so animated legs cannot visibly walk at right angles to translation.
 */
export function stepTravelHeading(
  currentYaw: number,
  inputX: number,
  inputZ: number,
  dt: number,
  settings: TravelHeadingSettings,
  previousSign: -1 | 1 = 1,
): TravelHeadingStep {
  const safeYaw = Number.isFinite(currentYaw) ? currentYaw : 0;
  const safeDt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  const magnitude = Math.min(1, Math.hypot(inputX, inputZ));
  if (!Number.isFinite(magnitude) || magnitude < 0.001) {
    return {
      yaw: wrapYaw(safeYaw), targetYaw: null,
      remainingErrorRad: 0, angularRateRad: 0,
      turnSign: previousSign, travelScale: 0, travelX: 0, travelZ: 0,
    };
  }

  const targetYaw = Math.atan2(inputX, inputZ);
  const yawError = signedYawDifference(safeYaw, targetYaw, previousSign);
  const turnSign: -1 | 1 = Math.abs(yawError) < 1e-7 ? previousSign : yawError > 0 ? 1 : -1;
  const limit = normalizeHeadingSettings(settings).turnRateDeg * RAD * safeDt;
  const turn = Math.sign(yawError) * Math.min(Math.abs(yawError), limit);
  const yaw = wrapYaw(safeYaw + turn);
  const remainingErrorRad = signedYawDifference(yaw, targetYaw, turnSign);
  // A cosine response avoids backward/sideways travel while a human turns.
  // Mobility changes how fast he advances during turns but never the final
  // full-speed straight walk. This is empirical tuning, not a fixed truth.
  const alignment = Math.max(0, Math.cos(remainingErrorRad));
  const mobility = normalizeHeadingSettings(settings).turnMobility;
  const travelScale = magnitude * Math.pow(alignment, 1 + (1 - mobility) * 2);
  return {
    yaw, targetYaw, remainingErrorRad,
    angularRateRad: safeDt > 0 ? turn / safeDt : 0,
    turnSign, travelScale,
    travelX: Math.sin(yaw) * travelScale,
    travelZ: Math.cos(yaw) * travelScale,
  };
}
