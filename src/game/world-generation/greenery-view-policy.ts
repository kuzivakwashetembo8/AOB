/** GRN-003: camera-relative canopy representation with hysteresis.
 * No dependence on the player's flight flag: rooftop cameras and free
 * inspection views are legitimate aerial perspectives too.
 */
export type CanopyPresentation = "photo" | "volume";
export function chooseCanopyPresentation(
  cameraHeightAboveCrown: number,
  cameraDownwardDirection: number,
  previous: CanopyPresentation,
): CanopyPresentation {
  if (!Number.isFinite(cameraHeightAboveCrown) ||
      !Number.isFinite(cameraDownwardDirection)) return previous;
  // Higher thresholds to enter 3D than to leave: prevents frame flicker
  // near the boundary. Do not render both alpha and solid representations.
  if (previous === "photo")
    return cameraHeightAboveCrown > 1.8 && cameraDownwardDirection > 0.28
      ? "volume" : "photo";
  return cameraHeightAboveCrown < 0.8 || cameraDownwardDirection < 0.16
    ? "photo" : "volume";
}
