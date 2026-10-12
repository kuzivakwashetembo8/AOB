/**
 * SO-MA Municipal Administration: deterministic, semantically attached South Ward
 * object plan. Built around existing CitySpec props and ResolvedBuildingSpec.
 * NO per-frame simulation, untracked ad-hoc map geometry, or arbitrary web URLs.
 */
import type { CitySpec, WorldPosition, ResolvedBuildingSpec } from "./schema";
import { resolveCityBuildings } from "./defaults";
import { projectToRoad } from "./road-graph";

export type MunicipalKind =
  | "shop-board" | "wheelie-bin" | "hydrant"
  | "bollard" | "utility-cabinet" | "street-name" | "stop-sign";

export interface MunicipalItem {
  readonly id: string;
  readonly kind: MunicipalKind;
  readonly anchorType: "facade" | "authored-ground";
  readonly position: WorldPosition;
  readonly yawRadians: number;
  readonly label?: string;
  readonly assetId?: "south-ward-shop-open" | "south-ward-shop-closed";
  readonly buildingId?: string;
  readonly dimensionsMeters: Readonly<{ width: number; height: number; depth: number }>;
  readonly collision: "none" | "simple-box" | "simple-cylinder";
}

export const MUNICIPAL_TEMPLATES = {
  "wheelie-bin": { width: 0.62, height: 1.06, depth: 0.72, collision: "simple-box" },
  hydrant: { width: 0.42, height: 0.77, depth: 0.42, collision: "simple-cylinder" },
  bollard: { width: 0.22, height: 0.84, depth: 0.22, collision: "simple-cylinder" },
  "utility-cabinet": { width: 0.88, height: 1.38, depth: 0.45, collision: "simple-box" },
  "street-name": { width: 1.3, height: 3.12, depth: 0.08, collision: "simple-cylinder" },
  "stop-sign": { width: 0.72, height: 2.65, depth: 0.10, collision: "simple-cylinder" },
  "shop-board": { width: 1.20, height: 0.56, depth: 0.07, collision: "none" },
} as const satisfies Record<MunicipalKind, {
  width: number; height: number; depth: number;
  collision: "none" | "simple-box" | "simple-cylinder";
}>;

const validKinds = new Set<string>(Object.keys(MUNICIPAL_TEMPLATES));

/** Local +Z is every building's authored frontage; yaw rotates into world. */
export function facadeFrontAnchor(
  building: ResolvedBuildingSpec,
  localX: number, localY: number,
  offsetFromWall = 0.085,
): WorldPosition {
  const theta = building.yawRadians;
  const front = building.parameters.depth / 2 + offsetFromWall;
  return {
    x: building.position.x + Math.cos(theta) * localX + Math.sin(theta) * front,
    y: building.position.y + localY,
    z: building.position.z - Math.sin(theta) * localX + Math.cos(theta) * front,
  };
}

export function planMunicipalStreetObjects(city: CitySpec): readonly MunicipalItem[] {
  const items: MunicipalItem[] = [];
  const buildings = resolveCityBuildings(city);
  // The two user-authored signs apply to actual commercial frontages; no
  // building-ID-specific render code. One deliberately selected static state
  // per shop; changing OPEN/CLOSED is not yet an operating-hours simulation.
  const shopBuildings = buildings.filter(building =>
    building.archetype === "commercial" || building.archetype === "mixed-use");
  for (const [index, building] of shopBuildings.entries()) {
    const open = index % 2 === 0;
    const state = open ? "open" : "closed";
    const template = MUNICIPAL_TEMPLATES["shop-board"];
    items.push({
      id: `ma:${building.id}:board:${state}`,
      kind: "shop-board",
      anchorType: "facade",
      buildingId: building.id,
      assetId: open ? "south-ward-shop-open" : "south-ward-shop-closed",
      position: facadeFrontAnchor(building, 0, building.parameters.floorHeight - 0.42),
      yawRadians: building.yawRadians,
      dimensionsMeters: { width: template.width, height: template.height, depth: template.depth },
      collision: "none",
    });
  }

  const included = new Set<string>();
  for (const district of city.districts) {
    for (const neighborhood of district.neighborhoods) {
      for (const block of neighborhood.blocks) {
        for (const prop of block.props ?? []) {
          if (!validKinds.has(prop.templateId) || prop.templateId === "shop-board") continue;
          if (included.has(prop.id)) throw new Error("Duplicate municipal object ID " + prop.id);
          included.add(prop.id);
          const kind = prop.templateId as Exclude<MunicipalKind, "shop-board">;
          const template = MUNICIPAL_TEMPLATES[kind];
          const nearestRoad = kind === "street-name"
            ? projectToRoad(city.roads, prop.position) : null;
          // Sign text always comes from the actual road graph, not an ad hoc
          // fake street-name list. A missing road is a rejected placement.
          if (kind === "street-name" && !nearestRoad) {
            throw new Error("Street-name object lacks a corresponding real road: " + prop.id);
          }
          items.push({
            id: prop.id, kind, anchorType: "authored-ground",
            position: prop.position, yawRadians: prop.yawRadians,
            ...(kind === "street-name" ? { label: nearestRoad!.segment.name } : {}),
            dimensionsMeters: { width: template.width, height: template.height, depth: template.depth },
            collision: template.collision,
          });
        }
      }
    }
  }
  return items.sort((a, b) => a.id.localeCompare(b.id));
}
