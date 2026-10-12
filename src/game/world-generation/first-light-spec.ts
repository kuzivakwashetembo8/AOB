import type {
  BuildingArchetype,
  BuildingSpec,
  CitySpec,
  FacadeMaterial,
  LotSpec,
  WorldPosition,
} from "./schema";
import { CITY_SCHEMA_VERSION } from "./schema";

export interface FirstLightRuntimeAnchor {
  readonly id: string;
  readonly position: WorldPosition;
  readonly facing: WorldPosition;
}

export const FIRST_LIGHT_PLAYER_SPAWN: FirstLightRuntimeAnchor = {
  id: "south-ward-first-light-player-spawn",
  position: { x: -7.5, y: 0.92, z: 2.45 },
  facing: { x: 0, y: 0, z: -1 },
};

export const FIRST_LIGHT_CAMERA_FOCUS: FirstLightRuntimeAnchor = {
  id: "south-ward-first-light-camera-focus",
  position: { x: -7.5, y: 1.25, z: -1.5 },
  facing: { x: 0, y: 0, z: -1 },
};

/** Semantic inventory only. The existing First Light Babylon scene remains authoritative. */
type Row = {
  id: string;
  archetype: BuildingArchetype;
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  floorHeight: number;
  road: string;
  block: "north" | "south" | "rear";
  yaw?: number;
  material?: FacadeMaterial;
};

const rows: readonly Row[] = [
  { id: "sw-fl-west-support", archetype: "residential", x: -27, z: -4.2, width: 20, depth: 12, floors: 2, floorHeight: 4.2, road: "sw-fl-mercer-west", block: "north" },
  { id: "sw-fl-garage", archetype: "garage", x: -7.5, z: -5.15, width: 13.5, depth: 10, floors: 1, floorHeight: 4.7, road: "sw-fl-mercer-west", block: "north" },
  { id: "sw-fl-east-support", archetype: "office", x: 8.8, z: -6.7, width: 15.5, depth: 7.2, floors: 3, floorHeight: 3.6, road: "sw-fl-mercer-west", block: "north" },
  { id: "sw-fl-south-apartment", archetype: "residential", x: -18, z: 20.3, width: 26, depth: 11, floors: 3, floorHeight: 10.4 / 3, road: "sw-fl-mercer-west", block: "south", yaw: Math.PI },
  { id: "sw-fl-corner-commercial", archetype: "commercial", x: 29.2, z: 18.6, width: 10.5, depth: 10, floors: 2, floorHeight: 4.3, road: "sw-fl-mercer-east", block: "south", yaw: Math.PI },
  { id: "sw-fl-skyline-west", archetype: "podium-tower", x: -55, z: 28, width: 15, depth: 18, floors: 8, floorHeight: 3.5, road: "sw-fl-mercer-west", block: "south", yaw: Math.PI },
  { id: "sw-fl-skyline-east", archetype: "podium-tower", x: 53, z: 31, width: 17, depth: 17, floors: 10, floorHeight: 3.32, road: "sw-fl-mercer-east", block: "south", yaw: Math.PI },
  { id: "sw-fl-rear-residential", archetype: "residential", x: -31, z: 60.2, width: 34, depth: 13, floors: 2, floorHeight: 4.4, road: "sw-fl-foundry-west", block: "rear", yaw: Math.PI },
  { id: "sw-fl-rear-shop", archetype: "commercial", x: 5, z: 59.2, width: 16, depth: 11, floors: 2, floorHeight: 3.1, road: "sw-fl-foundry-west", block: "rear", yaw: Math.PI },
  { id: "sw-fl-rear-workshop", archetype: "industrial", x: 36, z: 59.5, width: 21, depth: 12, floors: 2, floorHeight: 3.8, road: "sw-fl-foundry-east", block: "rear", yaw: Math.PI, material: "garage-block" },
];

function makeLot(row: Row): LotSpec {
  const hero = row.id === "sw-fl-garage";
  const position = { x: row.x, y: 0, z: row.z };
  const building: BuildingSpec = {
    id: row.id,
    seed: row.id,
    archetype: row.archetype,
    position,
    yawRadians: row.yaw ?? 0,
    overrides: {
      width: row.width, depth: row.depth, floors: row.floors, floorHeight: row.floorHeight,
      ...(row.material ? { facadeMaterial: row.material } : {}),
      ...(hero ? { garageOpeningCount: 1, interiorMode: "cell" as const, lodProfile: "hero" as const } : {}),
    },
    ...(hero ? {
      name: "South Ward Garage",
      anchors: [
        { id: "vehicle-entry", kind: "garage-entrance" as const, position: { x: -7.5, y: 0, z: -0.2 }, facing: { x: 0, y: 0, z: 1 } },
        { id: "main-cell", kind: "interior-spawn" as const, position, facing: { x: 0, y: 0, z: 1 } },
      ],
      openings: [
        { id: "vehicle-bay", kind: "garage" as const, facade: "front" as const, offset: 0, sillHeight: 0, width: 4.6, height: 3.67, anchorId: "vehicle-entry" },
        { id: "rear-window-west", kind: "window" as const, facade: "rear" as const, offset: -3.35, sillHeight: 1.475, width: 2.45, height: 1.75 },
        { id: "rear-window-east", kind: "window" as const, facade: "rear" as const, offset: 3.35, sillHeight: 1.475, width: 2.45, height: 1.75 },
      ],
    } : {}),
  };
  return {
    id: `sw-fl-lot-${row.id}`,
    position,
    width: row.width + 2,
    depth: row.depth + 2,
    frontage: { roadSegmentId: row.road, facade: "front" },
    allowedArchetypes: [row.archetype],
    building,
  };
}

const roadNode = (id: string, x: number, z: number) => ({ id, position: { x, y: 0, z } });
const roadSegment = (id: string, startNodeId: string, endNodeId: string, name: string) => ({
  id, startNodeId, endNodeId, name, roadClass: "local" as const, width: 8, laneCount: 2, sidewalkWidth: 3.1,
});

/** Road names are provisional design labels, not established in-game signage. */
export const FIRST_LIGHT_CITY_SPEC: CitySpec = {
  schemaVersion: CITY_SCHEMA_VERSION,
  generatorVersion: 1,
  id: "meridian-city",
  name: "Meridian City",
  roads: {
    nodes: [
      roadNode("sw-fl-main-west", -65, 8), roadNode("sw-fl-main-junction", 20, 8),
      roadNode("sw-fl-main-east", 65, 8), roadNode("sw-fl-rear-west", -57, 48),
      roadNode("sw-fl-rear-junction", 20, 48), roadNode("sw-fl-rear-east", 61, 48),
    ],
    segments: [
      roadSegment("sw-fl-mercer-west", "sw-fl-main-west", "sw-fl-main-junction", "Mercer Street"),
      roadSegment("sw-fl-mercer-east", "sw-fl-main-junction", "sw-fl-main-east", "Mercer Street"),
      roadSegment("sw-fl-workshop-link", "sw-fl-main-junction", "sw-fl-rear-junction", "Workshop Road"),
      roadSegment("sw-fl-foundry-west", "sw-fl-rear-west", "sw-fl-rear-junction", "Foundry Lane"),
      roadSegment("sw-fl-foundry-east", "sw-fl-rear-junction", "sw-fl-rear-east", "Foundry Lane"),
    ],
    intersections: [
      { id: "sw-fl-main-t", nodeId: "sw-fl-main-junction", kind: "t", connectedSegmentIds: ["sw-fl-mercer-west", "sw-fl-mercer-east", "sw-fl-workshop-link"] },
      { id: "sw-fl-rear-t", nodeId: "sw-fl-rear-junction", kind: "t", connectedSegmentIds: ["sw-fl-foundry-west", "sw-fl-foundry-east", "sw-fl-workshop-link"] },
    ],
  },
  districts: [{
    id: "south-ward", name: "South Ward", rules: { setbacks: { front: 0, rear: 0, left: 0, right: 0 } },
    neighborhoods: [{
      id: "south-ward-first-light", name: "First Light", rules: { lodProfile: "standard" },
      blocks: [
        {
          id: "sw-fl-main-north",
          lots: rows.filter((row) => row.block === "north").map(makeLot),
          vegetation: [
            { id: "sw-fl-tree-garage-east", speciesId: "first-light-street-tree", position: { x: 11.2, y: 0, z: 2.2 }, seed: "sw-fl-tree-garage-east" },
          ],
          props: [
            { id: "sw-fl-authored-light-garage", templateId: "streetlight", position: { x: 4.7, y: 0, z: 3.15 }, yawRadians: 0 },
            { id: "sw-fl-authored-car-garage", templateId: "parked-car", position: { x: 7.4, y: 0, z: 9.65 }, yawRadians: Math.PI / 2 },
            { id: "sw-ma-garage-utility-cabinet", templateId: "utility-cabinet", position: { x: -37.8, y: 0, z: 3.3 }, yawRadians: Math.PI },
            { id: "sw-ma-west-hydrant", templateId: "hydrant", position: { x: -43, y: 0, z: 13.7 }, yawRadians: 0 },
          ],
        },
        {
          id: "sw-fl-main-south",
          lots: rows.filter((row) => row.block === "south").map(makeLot),
          // MA-4: a handful of PURPOSE-PLACED municipal fixtures on existing
          // pavement, outside the two road travel lanes and garage doorway.
          props: [
            { id: "sw-ma-corner-wheelie-bin", templateId: "wheelie-bin", position: { x: 32.4, y: 0, z: 15.35 }, yawRadians: Math.PI },
            { id: "sw-ma-corner-second-bin", templateId: "wheelie-bin", position: { x: 33.25, y: 0, z: 15.35 }, yawRadians: Math.PI },
            { id: "sw-ma-corner-visible-hydrant", templateId: "hydrant", position: { x: 35.45, y: 0, z: 12.90 }, yawRadians: 0 },
            { id: "sw-ma-corner-utility-cabinet", templateId: "utility-cabinet", position: { x: 35.9, y: 0, z: 15.8 }, yawRadians: Math.PI },
            { id: "sw-ma-corner-street-plate", templateId: "street-name", position: { x: 27.4, y: 0, z: 13.3 }, yawRadians: Math.PI },
            { id: "sw-ma-corner-bollard-west", templateId: "bollard", position: { x: 26.1, y: 0, z: 12.9 }, yawRadians: 0 },
            { id: "sw-ma-corner-bollard-east", templateId: "bollard", position: { x: 32.9, y: 0, z: 12.9 }, yawRadians: 0 },
            { id: "sw-ma-mercer-street-plate", templateId: "street-name", position: { x: 13.7, y: 0, z: 13.7 }, yawRadians: 0 },
          ],
        },
        {
          id: "sw-fl-rear-south",
          lots: rows.filter((row) => row.block === "rear").map(makeLot),
          props: [
            { id: "sw-fl-authored-car-rear", templateId: "parked-car", position: { x: -14, y: 0, z: 49.6 }, yawRadians: Math.PI / 2 },
            { id: "sw-ma-rear-shop-bin", templateId: "wheelie-bin", position: { x: 14.2, y: 0, z: 54.1 }, yawRadians: Math.PI / 2 },
            { id: "sw-ma-foundry-street-plate", templateId: "street-name", position: { x: 26.0, y: 0, z: 42.9 }, yawRadians: Math.PI },
            { id: "sw-ma-workshop-stop-sign", templateId: "stop-sign", position: { x: 13.8, y: 0, z: 41.3 }, yawRadians: Math.PI / 2 },
          ],
        },
        {
          id: "sw-fl-pocket-green-block",
          lots: [],
          publicSpaces: [
            { id: "sw-fl-pocket-green", kind: "pocket-park", position: { x: -2.5, y: 0, z: 35.5 }, width: 16, depth: 10 },
          ],
          vegetation: [
            { id: "sw-fl-tree-pocket-west", speciesId: "first-light-street-tree", position: { x: -6.5, y: 0, z: 34.5 }, seed: "sw-fl-tree-pocket-west" },
            { id: "sw-fl-tree-pocket-east", speciesId: "first-light-street-tree", position: { x: 1.8, y: 0, z: 36.1 }, seed: "sw-fl-tree-pocket-east" },
          ],
          props: [
            { id: "sw-fl-authored-light-pocket", templateId: "streetlight", position: { x: 11.6, y: 0, z: 43 }, yawRadians: Math.PI },
            { id: "sw-fl-pocket-bench", templateId: "bench", position: { x: -2.7, y: 0, z: 38.2 }, yawRadians: 0 },
            { id: "sw-fl-pocket-bin", templateId: "bin", position: { x: 3.2, y: 0, z: 39.1 }, yawRadians: 0 },
          ],
        },
      ],
    }],
  }],
};
