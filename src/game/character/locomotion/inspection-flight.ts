/** G.T.D. CHAR-002 — aerial city-inspection mode.
 * Adapted from the pinned interlinkglobal/three-player-controller fork's
 * toggleFly + Space + camera-relative flight, not its Three.js engine.
 * Rapier remains authoritative for every requested displacement.
 */
export type FlightState = Readonly<{ enabled: boolean; verticalSpeed: number }>;
export type FlightInput = Readonly<{
  horizontalX: number; horizontalZ: number;
  ascend: boolean; descend: boolean; sprint: boolean;
}>;
export const FLIGHT_SPEED_MPS = 7.5;
export const FLIGHT_SPRINT_MPS = 12;
export const FLIGHT_VERTICAL_SPEED_MPS = 5;
export const FLIGHT_MAX_HEIGHT_METRES = 145;
/** F is reserved for GTD's car; G toggles flight only while on foot. */
export const FLIGHT_TOGGLE_KEY = "KeyG";

export function toggleInspectionFlight(
  state: FlightState,
  context: "walking" | "driving" | "combat",
): FlightState {
  if (context !== "walking") return state;
  return { enabled: !state.enabled, verticalSpeed: 0 };
}

export function flightDisplacement(
  input: FlightInput, dt: number, altitude: number,
): {x: number;y: number;z: number} {
  if (!Number.isFinite(dt) || dt <= 0) return {x:0,y:0,z:0};
  const safeDt = Math.min(dt, 1/30); // actual caller uses 1/60 fixed step
  let x = Number.isFinite(input.horizontalX) ? input.horizontalX : 0;
  let z = Number.isFinite(input.horizontalZ) ? input.horizontalZ : 0;
  const h = Math.hypot(x,z);
  if (h > 1) { x /= h; z /= h; }
  const speed = input.sprint ? FLIGHT_SPRINT_MPS : FLIGHT_SPEED_MPS;
  const verticalAxis = Number(input.ascend) - Number(input.descend);
  let vertical = verticalAxis * FLIGHT_VERTICAL_SPEED_MPS * safeDt;
  // Never fly through the map's finite vertical survey boundary. When
  // descending, preserve Rapier floor/roof collisions (do not teleport).
  if (vertical > 0 && Number.isFinite(altitude))
    vertical = Math.max(0, Math.min(vertical, FLIGHT_MAX_HEIGHT_METRES - altitude));
  return { x:x*speed*safeDt, y:vertical, z:z*speed*safeDt };
}
