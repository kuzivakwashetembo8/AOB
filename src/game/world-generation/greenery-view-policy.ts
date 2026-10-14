/** GRN-004: choose photographic leaves at pedestrian heights and real
 * procedural 3D foliage lobes above the tree crown, independent of flight
 * button state. Flight cameras often look only slightly downward; requiring
 * a steep look angle left tree trunks bare in the owner's aerial screenshot.
 */
export type CanopyPresentation = "photo" | "volume";
export function chooseCanopyPresentation(
  cameraHeightAboveCrown: number,
  cameraDownwardDirection: number,
  previous: CanopyPresentation,
): CanopyPresentation {
  if (!Number.isFinite(cameraHeightAboveCrown) ||
      !Number.isFinite(cameraDownwardDirection)) return previous;
  // High camera altitude alone is sufficient. For cameras near canopy height,
  // a steep overhead angle also activates volumetric geometry.
  if (previous === "photo") {
    return cameraHeightAboveCrown > 1.2 ||
      (cameraHeightAboveCrown > 0.35 && cameraDownwardDirection > 0.68)
      ? "volume" : "photo";
  }
  // Wider exit range suppresses flicker at the handoff when the camera
  // hovers above the tree. Close pedestrians regain sharp photo leaves.
  return cameraHeightAboveCrown < -0.6 ||
    (cameraHeightAboveCrown < 0.15 && cameraDownwardDirection < 0.40)
    ? "photo" : "volume";
}
