/**
 * Municipal Administration — real map-derived street metadata.
 * Location labels follow the player's CURRENT position, or the controlled
 * vehicle while driving, without a new geolocation service or frame loop.
 */
import { FIRST_LIGHT_CITY_SPEC } from "./first-light-spec";
import { projectToRoad } from "./road-graph";
import {SOUTH_WARD_018_ROADS} from "./south-ward-open-roads-018";
import type { WorldPosition } from "./schema";

export function southWardLocationAt(position: WorldPosition): string {
  const oldRoad = projectToRoad(FIRST_LIGHT_CITY_SPEC.roads,position);
  const expansion = projectToRoad(SOUTH_WARD_018_ROADS,position);
  const useExpansion=expansion && (!oldRoad ||
    expansion.distance<oldRoad.distance-1e-7);
  const roads=useExpansion?SOUTH_WARD_018_ROADS:FIRST_LIGHT_CITY_SPEC.roads;
  const match=useExpansion?expansion:oldRoad;
  if(!match)return "South Ward // First Light";
  const street=roads.segments.find(s=>s.id===match.segmentId);
  return street?"South Ward // "+street.name:"South Ward // First Light";
}
