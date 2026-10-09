import type { CitySpec, LotSpec } from "./schema";
import { projectToRoad } from "./road-graph";
export function planLotOrientation(city: CitySpec, lot: LotSpec) {
  const road = projectToRoad(city.roads, lot.position, lot.frontage.roadSegmentId);
  if (!road) throw new Error("Unknown road");
  const dx = road.position.x - lot.position.x;
  const dz = road.position.z - lot.position.z;
  return { roadSegmentId: road.segmentId, frontageDistance: road.distance, dx, dz };
}
