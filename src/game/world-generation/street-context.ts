import { featureRandom } from "./seeded-variation";
import type { CitySpec, PropPlacementSpec, VegetationPlacementSpec, WorldPosition } from "./schema";

export type StreetContextKind =
  | "tree"
  | "streetlight"
  | "parked-car"
  | "bench"
  | "bin";

export interface StreetContextItem {
  readonly id: string;
  readonly kind: StreetContextKind;
  readonly position: WorldPosition;
  readonly yawRadians: number;
  readonly scale: number;
  readonly seed: string | number;
}

export interface StreetContextPlan {
  readonly items: readonly StreetContextItem[];
  readonly treeCount: number;
  readonly streetlightCount: number;
  readonly parkedCarCount: number;
  readonly propCount: number;
}

function collectAuthoredVegetation(city: CitySpec): VegetationPlacementSpec[] {
  const items: VegetationPlacementSpec[] = [];
  for (const district of city.districts) {
    for (const neighborhood of district.neighborhoods) {
      for (const block of neighborhood.blocks) {
        items.push(...(block.vegetation ?? []));
      }
    }
  }
  return items;
}

function collectAuthoredProps(city: CitySpec): PropPlacementSpec[] {
  const items: PropPlacementSpec[] = [];
  for (const district of city.districts) {
    for (const neighborhood of district.neighborhoods) {
      for (const block of neighborhood.blocks) {
        items.push(...(block.props ?? []));
      }
    }
  }
  return items;
}

function propKind(templateId: string): StreetContextKind | null {
  if (templateId === "streetlight") return "streetlight";
  if (templateId === "parked-car") return "parked-car";
  if (templateId === "bench") return "bench";
  if (templateId === "bin") return "bin";
  return null;
}

export function planStreetContext(city: CitySpec): StreetContextPlan {
  const items: StreetContextItem[] = [];

  for (const tree of collectAuthoredVegetation(city)) {
    items.push({
      id: tree.id,
      kind: "tree",
      position: tree.position,
      yawRadians:
        featureRandom(tree.seed, city.generatorVersion, "vegetation:yaw") *
        Math.PI *
        2,
      scale:
        0.9 +
        featureRandom(tree.seed, city.generatorVersion, "vegetation:scale") *
          0.22,
      seed: tree.seed,
    });
  }

  for (const prop of collectAuthoredProps(city)) {
    const kind = propKind(prop.templateId);
    if (!kind) continue;
    items.push({
      id: prop.id,
      kind,
      position: prop.position,
      yawRadians: prop.yawRadians,
      scale: 1,
      seed: prop.id,
    });
  }

  const nodes = new Map(
    city.roads.nodes.map((node) => [node.id, node.position] as const),
  );

  for (const segment of city.roads.segments) {
    const start = nodes.get(segment.startNodeId);
    const end = nodes.get(segment.endNodeId);
    if (!start || !end) continue;

    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    if (length <= 0.01) continue;

    const ux = dx / length;
    const uz = dz / length;
    const nx = -uz;
    const nz = ux;
    const sidewalkOffset =
      segment.width / 2 + Math.max(1, segment.sidewalkWidth * 0.72);
    const carOffset = Math.max(0.7, segment.width / 2 - 1.12);
    const clear = Math.min(9, length * 0.18);

    const lightSpacing = segment.roadClass === "local" ? 22 : 18;
    for (
      let distance = clear + 2;
      distance <= length - clear - 2;
      distance += lightSpacing
    ) {
      const side =
        featureRandom(
          city.id + ":" + segment.id,
          city.generatorVersion,
          "streetlight-side:" + distance.toFixed(1),
        ) > 0.5
          ? 1
          : -1;
      items.push({
        id: segment.id + ":streetlight:" + distance.toFixed(1),
        kind: "streetlight",
        position: {
          x: start.x + ux * distance + nx * sidewalkOffset * side,
          y: 0,
          z: start.z + uz * distance + nz * sidewalkOffset * side,
        },
        yawRadians: Math.atan2(dx, dz) + (side > 0 ? Math.PI : 0),
        scale: 1,
        seed: segment.id + ":streetlight:" + distance.toFixed(1),
      });
    }

    const carSpacing = 25;
    for (
      let distance = clear + 6;
      distance <= length - clear - 6;
      distance += carSpacing
    ) {
      const sample = featureRandom(
        city.id + ":" + segment.id,
        city.generatorVersion,
        "parked-car:" + distance.toFixed(1),
      );
      if (sample < 0.42) continue;
      const side = sample > 0.72 ? 1 : -1;
      items.push({
        id: segment.id + ":parked-car:" + distance.toFixed(1),
        kind: "parked-car",
        position: {
          x: start.x + ux * distance + nx * carOffset * side,
          y: 0,
          z: start.z + uz * distance + nz * carOffset * side,
        },
        yawRadians:
          Math.atan2(dx, dz) + (side > 0 ? 0 : Math.PI),
        scale:
          0.92 +
          featureRandom(
            segment.id,
            city.generatorVersion,
            "parked-car-scale:" + distance.toFixed(1),
          ) *
            0.12,
        seed: segment.id + ":parked-car:" + distance.toFixed(1),
      });
    }
  }

  const deduped = new Map(items.map((item) => [item.id, item] as const));
  const result = [...deduped.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  return {
    items: result,
    treeCount: result.filter((item) => item.kind === "tree").length,
    streetlightCount: result.filter((item) => item.kind === "streetlight")
      .length,
    parkedCarCount: result.filter((item) => item.kind === "parked-car")
      .length,
    propCount: result.filter(
      (item) => item.kind === "bench" || item.kind === "bin",
    ).length,
  };
}
