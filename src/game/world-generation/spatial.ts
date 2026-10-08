import type { BuildingParameters, BuildingSpec, FacadeSide, WorldPosition } from "./schema";

/** Babylon-compatible yaw around +Y, with zero-yaw front facing +Z. */
export function rotateHorizontal(x: number, z: number, yawRadians: number): WorldPosition {
  const c = Math.cos(yawRadians);
  const s = Math.sin(yawRadians);
  return { x: x * c + z * s, y: 0, z: -x * s + z * c };
}

/** Offset is measured along local +X on front/rear, local +Z on left/right. */
export function facadeWorldPoint(
  building: Pick<BuildingSpec, "position" | "yawRadians">,
  dimensions: Pick<BuildingParameters, "width" | "depth">,
  facade: FacadeSide,
  offset: number,
  elevation: number,
): WorldPosition {
  const localX = facade === "front" || facade === "rear"
    ? offset
    : (facade === "left" ? -dimensions.width / 2 : dimensions.width / 2);
  const localZ = facade === "front" || facade === "rear"
    ? (facade === "front" ? dimensions.depth / 2 : -dimensions.depth / 2)
    : offset;
  const rotated = rotateHorizontal(localX, localZ, building.yawRadians);
  return {
    x: building.position.x + rotated.x,
    y: building.position.y + elevation,
    z: building.position.z + rotated.z,
  };
}

export function facadeOutward(yawRadians: number, facade: FacadeSide): WorldPosition {
  const normal = facade === "front" ? [0, 1]
    : facade === "rear" ? [0, -1]
    : facade === "left" ? [-1, 0] : [1, 0];
  return rotateHorizontal(normal[0]!, normal[1]!, yawRadians);
}
