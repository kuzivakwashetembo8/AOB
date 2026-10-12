import { featureRandom } from "./seeded-variation";
import { resolveCityBuildings } from "./defaults";
import type {
  CitySpec,
  PropPlacementSpec,
  VegetationPlacementSpec,
  WorldPosition,
} from "./schema";

export type StreetContextKind =
  | "tree"
  | "shrub"
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
  readonly canopyScale?: number;
  readonly seed: string | number;
}

export interface StreetContextPlan {
  readonly items: readonly StreetContextItem[];
  readonly treeCount: number;
  readonly shrubCount: number;
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

function addPocketGreenShrubs(
  city: CitySpec,
  items: StreetContextItem[],
): void {
  for (const district of city.districts) {
    for (const neighborhood of district.neighborhoods) {
      for (const block of neighborhood.blocks) {
        for (const space of block.publicSpaces ?? []) {
          if (space.kind !== "pocket-park") continue;
          const positions = [
            { x: -0.32, z: -0.31 },
            { x: 0.35, z: -0.24 },
            { x: -0.38, z: 0.3 },
            { x: 0.32, z: 0.34 },
          ] as const;
          positions.forEach((offset, index) => {
            const seed = space.id + ":shrub:" + index;
            items.push({
              id: seed,
              kind: "shrub",
              position: {
                x: space.position.x + offset.x * space.width,
                y: 0,
                z: space.position.z + offset.z * space.depth,
              },
              yawRadians:
                featureRandom(seed, city.generatorVersion, "shrub:yaw") *
                Math.PI *
                2,
              scale:
                0.78 +
                featureRandom(seed, city.generatorVersion, "shrub:scale") *
                  0.36,
              seed,
            });
          });
        }
      }
    }
  }
}

/**
 * Every streetlight's pole, arm and lamp head must clear nearby buildings.
 * A head can protrude beyond the pole by >1m: pole-only tests are insufficient.
 * Conservative footprint tests avoid 3D mesh/physics allocations in planning.
 */
export function isStreetlightClear(
  item: StreetContextItem,
  buildings: ReturnType<typeof resolveCityBuildings>,
  clearanceMeters = 0.65,
): boolean {
  if (item.kind !== "streetlight") return true;
  const arm = 1.03 * item.scale;
  const directionX = Math.cos(item.yawRadians) * arm;
  const directionZ = -Math.sin(item.yawRadians) * arm;
  return buildings.every(building => {
    for (const ratio of [0, 0.5, 1]) {
      const dx = item.position.x + directionX * ratio - building.position.x;
      const dz = item.position.z + directionZ * ratio - building.position.z;
      const angle = building.yawRadians;
      const localX = Math.cos(angle) * dx - Math.sin(angle) * dz;
      const localZ = Math.sin(angle) * dx + Math.cos(angle) * dz;
      const margin = clearanceMeters + (ratio === 0 ? 0.06 : 0.30);
      if (Math.abs(localX) < building.parameters.width / 2 + margin &&
          Math.abs(localZ) < building.parameters.depth / 2 + margin) {
        return false;
      }
    }
    return true;
  });
}

export function planStreetContext(city: CitySpec): StreetContextPlan {
  const items: StreetContextItem[] = [];

  for (const tree of collectAuthoredVegetation(city)) {
    const pocketTree = tree.id.includes("pocket");
    const scaleSample = featureRandom(
      tree.seed,
      city.generatorVersion,
      "vegetation:scale",
    );
    const canopySample = featureRandom(
      tree.seed,
      city.generatorVersion,
      "vegetation:canopy",
    );
    items.push({
      id: tree.id,
      kind: "tree",
      position: tree.position,
      yawRadians:
        featureRandom(tree.seed, city.generatorVersion, "vegetation:yaw") *
        Math.PI *
        2,
      scale: 0.94 + scaleSample * 0.16,
      canopyScale:
        (pocketTree ? 1.17 : 1.08) + canopySample * (pocketTree ? 0.14 : 0.1),
      seed: tree.seed,
    });
  }

  addPocketGreenShrubs(city, items);

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
    // Mount poles near the curb rather than against building facades.
    // Arms point towards the road; previous yaw aimed some heads into windows.
    const sidewalkOffset = segment.width / 2 +
      Math.min(0.75, Math.max(0.45, segment.sidewalkWidth * 0.24));
    const carOffset = Math.max(0.7, segment.width / 2 - 1.12);
    const clear = Math.min(10.5, Math.max(7.5, length * 0.2));

    const lightSpacing = segment.roadClass === "local" ? 24 : 19;
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
        yawRadians: Math.atan2(dx, dz) + (side < 0 ? Math.PI : 0),
        scale: 1,
        seed: segment.id + ":streetlight:" + distance.toFixed(1),
      });
    }

    const carSpacing = 28;
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
      if (sample < 0.48) continue;
      const side = sample > 0.74 ? 1 : -1;
      items.push({
        id: segment.id + ":parked-car:" + distance.toFixed(1),
        kind: "parked-car",
        position: {
          x: start.x + ux * distance + nx * carOffset * side,
          y: 0,
          z: start.z + uz * distance + nz * carOffset * side,
        },
        yawRadians: Math.atan2(dx, dz) + (side > 0 ? 0 : Math.PI),
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
  const buildings = resolveCityBuildings(city);
  const result = [...deduped.values()]
    .filter(item => isStreetlightClear(item, buildings))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    items: result,
    treeCount: result.filter((item) => item.kind === "tree").length,
    shrubCount: result.filter((item) => item.kind === "shrub").length,
    streetlightCount: result.filter((item) => item.kind === "streetlight")
      .length,
    parkedCarCount: result.filter((item) => item.kind === "parked-car")
      .length,
    propCount: result.filter(
      (item) => item.kind === "bench" || item.kind === "bin",
    ).length,
  };
}
