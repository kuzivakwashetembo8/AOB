/**
 * CHAR-002: preserve the directional hover-vs-fast-flight distinction
 * in the pinned three-player-controller fork's AnimationSystem.
 *
 * The UAL "fly" clip lies the actor prone and is exclusively appropriate
 * for SHIFT + forward/back flight, never ordinary movement or hovering.
 * No physics-root pitch: the baked GLB animations own visual posture.
 */
export type FlightPoseInput = Readonly<{
  forward: boolean; backward: boolean; left: boolean; right: boolean;
  ascending: boolean; descending: boolean; accelerated: boolean;
}>;
export type FlightPoseClip =
  | "flyIdle" | "fly" | "flyHoverForward" | "flyHoverBack"
  | "flyHoverLeft" | "flyHoverRight" | "flyHoverUp" | "flyHoverDown";

export function selectFlightPose(input: FlightPoseInput): FlightPoseClip {
  if (input.forward) return input.accelerated ? "fly" : "flyHoverForward";
  if (input.backward) return input.accelerated ? "fly" : "flyHoverBack";
  if (input.left) return "flyHoverLeft";
  if (input.right) return "flyHoverRight";
  if (input.ascending) return "flyHoverUp";
  if (input.descending) return "flyHoverDown";
  return "flyIdle";
}
