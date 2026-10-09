import type { CitySpec, LotSpec } from "./schema";
import { projectToRoad } from "./road-graph";
export function planLotOrientation(city: CitySpec, lot: LotSpec) {
  const road = projectToRoad(city.roads, lot.position, lot.frontage.roadSegmentId);
  if (!road) throw new Error("Unknown road");
  return { roadSegmentId: road.segmentId, frontageDistance: road.distance };
}
