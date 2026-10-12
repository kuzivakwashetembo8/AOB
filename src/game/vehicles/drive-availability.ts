/**
 * GTD-WORLD-002 / EXP-VEH-002 mobile-promotion contract, 2026-10-12.
 * Player-controlled driving is available on regular main and preview routes
 * when genuine imported cars and the generated Meridian world are present.
 *
 * The legacy trial URL parameter is not a required launch condition.
 * Missing assets fail closed; no fake car or capsule replacement is created.
 */
export function canInitializePlayerVehicle(
  hasImportedCars: boolean,
  hasGeneratedWorld: boolean,
): boolean {
  return hasImportedCars && hasGeneratedWorld;
}
