/**
 * Detect actual Rapier-authorized curb ascents. A 21cm road curb is a step,
 * not a flat-level slide or an unrelated user jump. This affects animation
 * ONLY; the controller remains authoritative for contact and vertical motion.
 */
export function isCurbAscent(
  verticalMetres: number,
  planarMetresPerSecond: number,
  grounded: boolean,
): boolean {
  return grounded && Number.isFinite(verticalMetres) &&
    Number.isFinite(planarMetresPerSecond) &&
    verticalMetres > 0.045 && verticalMetres <= 0.30 &&
    planarMetresPerSecond > 0.20;
}
