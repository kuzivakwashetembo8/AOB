/**
 * Municipal Administration — real map-derived street metadata.
 * Location labels follow the player's CURRENT position, or the controlled
 * vehicle while driving, without a new geolocation service or frame loop.
 */
import { FIRST_LIGHT_CITY_SPEC } from "./first-light-spec";
import { projectToRoad } from "./road-graph";
import type { WorldPosition } from "./schema";

export function southWardLocationAt(position: WorldPosition): string {
  const match = projectToRoad(FIRST_LIGHT_CITY_SPEC.roads, position);
  if (!match) return "South Ward // First Light";
  const street = FIRST_LIGHT_CITY_SPEC.roads.segments.find(
    segment => segment.id === match.segmentId,
  );
  return street ? "South Ward // " + street.name : "South Ward // First Light";
}
