import type { CitySpec, LotSpec } from "./schema";
import { projectToRoad } from "./road-graph";
export function planLotOrientation(city: CitySpec, lot: LotSpec) {
  const road = projectToRoad(city.roads, lot.position, lot.frontage.roadSegmentId);
  if (!road) throw new Error("Unknown road");
  const dx = road.position.x - lot.position.x;
  const dz = road.position.z - lot.position.z;
  if (Math.hypot(dx, dz) < 1e-5) throw new Error("Ambiguous lot frontage");
  const heading = Math.acos(Math.max(-1, Math.min(1, dz / Math.hypot(dx, dz)))) * (dx >= 0 ? 1 : -1);
  const facadeAngle = lot.frontage.facade === "front" ? 0 :
    lot.frontage.facade === "rear" ? Math.PI :
    lot.frontage.facade === "left" ? -Math.PI / 2 : Math.PI / 2;
  const raw = heading - facadeAngle;
  const yawRadians = ((raw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return { yawRadians, heading, roadSegmentId: road.segmentId, frontageDistance: road.distance, dx, dz, roadwardDistance: Math.hypot(dx, dz) };
}
