import { ARCHETYPE_MATERIALS, resolveBuildingParameters } from "./defaults";
import type {
  BuildingParameters,
  BuildingSpec,
  BuildingRules,
  CitySpec,
  FacadeOpeningSpec,
  LotSpec,
  PositionAnchorSpec,
  WorldPosition,
} from "./schema";
import { CITY_SCHEMA_VERSION } from "./schema";
import { facadeOutward, facadeWorldPoint } from "./spatial";

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const validPosition = (p: WorldPosition | undefined): boolean =>
  !!p && isFiniteNumber(p.x) && isFiniteNumber(p.y) && isFiniteNumber(p.z);
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value);

function checkRules(rules: BuildingRules | undefined, path: string, issue: (path: string, message: string) => void) {
  if (!rules) return;
  for (const [key, value] of Object.entries(rules.setbacks ?? {})) {
    if (!isFiniteNumber(value) || value < 0) issue(`${path}.setbacks.${key}`, "Setback must be finite and nonnegative");
  }
  for (const key of ["width", "depth", "floorHeight"] as const) {
    const value = rules[key];
    if (value !== undefined && (!isFiniteNumber(value) || value <= 0)) issue(`${path}.${key}`, "Dimension must be finite and positive");
  }
  for (const key of ["floors", "entranceCount", "garageOpeningCount"] as const) {
    const value = rules[key];
    if (value !== undefined && (!Number.isSafeInteger(value) || value < (key === "floors" ? 1 : 0))) {
      issue(`${path}.${key}`, "Count must be a valid nonnegative integer (floors at least one)");
    }
  }
}

function checkOpenings(
  openings: readonly FacadeOpeningSpec[],
  anchors: readonly PositionAnchorSpec[],
  parameters: BuildingParameters,
  building: BuildingSpec,
  path: string,
  issue: (path: string, message: string) => void,
) {
  const ids = new Set<string>();
  const anchorsById = new Map(anchors.map((anchor) => [anchor.id, anchor]));
  const wallHeight = parameters.floors * parameters.floorHeight;
  for (const opening of openings) {
    const p = `${path}.openings.${opening.id}`;
    if (!validId(opening.id) || ids.has(opening.id)) issue(p, "Opening ID must be valid and unique within building");
    ids.add(opening.id);
    const facadeWidth = opening.facade === "front" || opening.facade === "rear" ? parameters.width : parameters.depth;
    if (!["front", "rear", "left", "right"].includes(opening.facade)) issue(`${p}.facade`, "Unknown facade");
    if (!isFiniteNumber(opening.offset) || !isFiniteNumber(opening.width) || opening.width <= 0 ||
        !isFiniteNumber(opening.height) || opening.height <= 0 ||
        !isFiniteNumber(opening.sillHeight) || opening.sillHeight < 0) {
      issue(p, "Opening dimensions, sill and offset must be finite and physically valid");
      continue;
    }
    // A small structural corner pier remains on either side of every facade.
    if (Math.abs(opening.offset) + opening.width / 2 > facadeWidth / 2 - 0.2 + 1e-8) {
      issue(p, "Opening intersects the corner pier or extends outside the facade");
    }
    if (opening.sillHeight + opening.height > wallHeight + 1e-8) issue(p, "Opening extends above the roofline");
    if (opening.anchorId) {
      const anchor = anchorsById.get(opening.anchorId);
      if (!anchor) issue(`${p}.anchorId`, "Opening references an unknown anchor");
      else if (opening.kind === "garage" && anchor.kind !== "garage-entrance") issue(`${p}.anchorId`, "Garage opening requires a garage-entrance anchor");
      else if (opening.kind === "door" && !["primary-entrance", "service-entrance"].includes(anchor.kind)) issue(`${p}.anchorId`, "Door opening requires a pedestrian entrance anchor");
      else if (opening.kind === "storefront" && anchor.kind !== "storefront-entrance") issue(`${p}.anchorId`, "Storefront opening requires a storefront-entrance anchor");
      if (anchor && validPosition(anchor.position) && validPosition(anchor.facing)) {
        const point = facadeWorldPoint(building, parameters, opening.facade, opening.offset, opening.sillHeight);
        const normal = facadeOutward(building.yawRadians, opening.facade);
        if (Math.hypot(point.x - anchor.position.x, point.z - anchor.position.z) > 0.75) {
          issue(`${p}.anchorId`, "Anchor is not located at its facade opening");
        }
        if (anchor.facing.x * normal.x + anchor.facing.z * normal.z < 0.9) {
          issue(`${p}.anchorId`, "Anchor faces away from its facade normal");
        }
      }
    }
  }
  // Intersecting openings on the same wall are invalid even when individually in bounds.
  for (let i = 0; i < openings.length; i += 1) {
    for (let j = i + 1; j < openings.length; j += 1) {
      const a = openings[i]!;
      const b = openings[j]!;
      if (a.facade !== b.facade) continue;
      if (Math.abs(a.offset - b.offset) < (a.width + b.width) / 2 - 1e-8 &&
          a.sillHeight < b.sillHeight + b.height - 1e-8 &&
          b.sillHeight < a.sillHeight + a.height - 1e-8) {
        issue(`${path}.openings.${b.id}`, `Overlaps opening ${a.id}`);
      }
    }
  }
}

/** Collects all data-contract problems without throwing on the first invalid entry. */
export function validateCitySpec(city: CitySpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const issue = (path: string, message: string) => { issues.push({ path, message }); };
  const allIds = new Map<string, string>();
  const register = (id: string, path: string) => {
    if (!validId(id)) issue(path, "ID must be nonempty and contain only letters, digits, . _ : -");
    const prior = allIds.get(id);
    if (prior) issue(path, `Duplicate stable ID ${id} (first used at ${prior})`);
    else allIds.set(id, path);
  };

  if (city.schemaVersion !== CITY_SCHEMA_VERSION) issue("city.schemaVersion", "Unsupported city schema version");
  if (!Number.isSafeInteger(city.generatorVersion) || city.generatorVersion < 1) issue("city.generatorVersion", "Generator version must be a positive safe integer");
  register(city.id, "city.id");
  checkRules(city.rules, "city.rules", issue);

  const nodes = new Map(city.roads.nodes.map((node) => [node.id, node]));
  const segments = new Map(city.roads.segments.map((segment) => [segment.id, segment]));
  for (const node of city.roads.nodes) {
    const path = `roads.nodes.${node.id}`;
    register(node.id, path);
    if (!validPosition(node.position)) issue(`${path}.position`, "Node position must be finite");
  }
  for (const segment of city.roads.segments) {
    const path = `roads.segments.${segment.id}`;
    register(segment.id, path);
    if (!nodes.has(segment.startNodeId) || !nodes.has(segment.endNodeId)) issue(path, "Road segment references a missing node");
    if (segment.startNodeId === segment.endNodeId) issue(path, "Road segment must connect two different nodes");
    if (!isFiniteNumber(segment.width) || segment.width <= 0 ||
        !isFiniteNumber(segment.sidewalkWidth) || segment.sidewalkWidth < 0 ||
        !Number.isSafeInteger(segment.laneCount) || segment.laneCount < 1) {
      issue(path, "Road width, sidewalk width and lane count must be valid");
    }
  }
  for (const intersection of city.roads.intersections) {
    const path = `roads.intersections.${intersection.id}`;
    register(intersection.id, path);
    if (!nodes.has(intersection.nodeId)) issue(path, "Intersection references a missing node");
    if (new Set(intersection.connectedSegmentIds).size !== intersection.connectedSegmentIds.length) issue(path, "Intersection repeats a segment");
    for (const segmentId of intersection.connectedSegmentIds) {
      const segment = segments.get(segmentId);
      if (!segment || (segment.startNodeId !== intersection.nodeId && segment.endNodeId !== intersection.nodeId)) {
        issue(path, `Segment ${segmentId} does not connect to intersection node`);
      }
    }
    if (intersection.kind === "t" && intersection.connectedSegmentIds.length !== 3) issue(path, "T-junction requires three segments");
    if (intersection.kind === "four-way" && intersection.connectedSegmentIds.length !== 4) issue(path, "Four-way junction requires four segments");
    if (intersection.kind === "continuation" && intersection.connectedSegmentIds.length !== 2) issue(path, "Continuation requires two segments");
  }

  for (const district of city.districts) {
    const districtPath = `districts.${district.id}`;
    register(district.id, districtPath);
    checkRules(district.rules, `${districtPath}.rules`, issue);
    for (const neighborhood of district.neighborhoods) {
      const neighborhoodPath = `${districtPath}.neighborhoods.${neighborhood.id}`;
      register(neighborhood.id, neighborhoodPath);
      checkRules(neighborhood.rules, `${neighborhoodPath}.rules`, issue);
      for (const block of neighborhood.blocks) {
        const blockPath = `${neighborhoodPath}.blocks.${block.id}`;
        register(block.id, blockPath);
        for (const space of block.publicSpaces ?? []) {
          const path = `${blockPath}.publicSpaces.${space.id}`;
          register(space.id, path);
          if (!validPosition(space.position) || !isFiniteNumber(space.width) || space.width <= 0 ||
              !isFiniteNumber(space.depth) || space.depth <= 0) issue(path, "Invalid public-space geometry");
        }
        for (const prop of block.props ?? []) {
          const path = `${blockPath}.props.${prop.id}`;
          register(prop.id, path);
          if (!validPosition(prop.position) || !isFiniteNumber(prop.yawRadians) || !prop.templateId) issue(path, "Invalid prop placement");
        }
        for (const vegetation of block.vegetation ?? []) {
          const path = `${blockPath}.vegetation.${vegetation.id}`;
          register(vegetation.id, path);
          if (!validPosition(vegetation.position) || !vegetation.speciesId) issue(path, "Invalid vegetation placement");
        }
        for (const lot of block.lots) {
          const lotPath = `${blockPath}.lots.${lot.id}`;
          register(lot.id, lotPath);
          checkRules(lot.rules, `${lotPath}.rules`, issue);
          if (!validPosition(lot.position) || !isFiniteNumber(lot.width) || lot.width <= 0 ||
              !isFiniteNumber(lot.depth) || lot.depth <= 0) issue(lotPath, "Lot footprint must have positive finite dimensions");
          if (!segments.has(lot.frontage.roadSegmentId)) issue(`${lotPath}.frontage`, "Unknown frontage road segment");
          if (lot.frontage.serviceRoadSegmentId && !segments.has(lot.frontage.serviceRoadSegmentId)) issue(`${lotPath}.frontage`, "Unknown service road segment");
          if (!lot.building) continue;
          validateBuilding(city, district, neighborhood, lot, lotPath, issue, register);
        }
      }
    }
  }
  return issues;
}

function validateBuilding(
  city: CitySpec,
  district: CitySpec["districts"][number],
  neighborhood: CitySpec["districts"][number]["neighborhoods"][number],
  lot: LotSpec,
  lotPath: string,
  issue: (path: string, message: string) => void,
  register: (id: string, path: string) => void,
) {
  const building = lot.building!;
  const path = `${lotPath}.building.${building.id}`;
  register(building.id, path);
  checkRules(building.overrides, `${path}.overrides`, issue);
  if (!validPosition(building.position) || !isFiniteNumber(building.yawRadians)) issue(path, "Building position/yaw must be finite");
  if ((typeof building.seed === "number" && !Number.isSafeInteger(building.seed)) ||
      (typeof building.seed === "string" && !building.seed) ||
      !["number", "string"].includes(typeof building.seed)) issue(`${path}.seed`, "Seed must be a nonempty string or safe integer");
  if (lot.allowedArchetypes && !lot.allowedArchetypes.includes(building.archetype)) issue(path, "Archetype not allowed on this lot");
  if (building.address && (!building.address.number.trim() || !building.address.street.trim())) issue(`${path}.address`, "Civic address must have number and street");
  if (building.address) {
    const road = city.roads.segments.find((segment) => segment.id === lot.frontage.roadSegmentId);
    if (road && road.name !== building.address.street) issue(`${path}.address`, "Civic address street must match frontage road name");
  }
  let p: BuildingParameters;
  try { p = resolveBuildingParameters(city, district, neighborhood, lot); }
  catch (error) { issue(path, String(error)); return; }
  if (!isFiniteNumber(p.width) || p.width <= 0 || !isFiniteNumber(p.depth) || p.depth <= 0) issue(path, "Invalid building footprint");
  if (!Number.isSafeInteger(p.floors) || p.floors < 1 || !isFiniteNumber(p.floorHeight) || p.floorHeight < 2.4 || p.floorHeight > 12) issue(path, "Floors must be positive and floor height between 2.4 and 12 metres");
  if (!Number.isSafeInteger(p.entranceCount) || p.entranceCount < 0 || !Number.isSafeInteger(p.garageOpeningCount) || p.garageOpeningCount < 0) issue(path, "Opening counts must be nonnegative integers");
  if (!ARCHETYPE_MATERIALS[building.archetype]?.includes(p.facadeMaterial)) issue(path, `Material ${p.facadeMaterial} is not supported for ${building.archetype}`);
  for (const [side, value] of Object.entries(p.setbacks)) if (!isFiniteNumber(value) || value < 0) issue(`${path}.setbacks.${side}`, "Setback must be finite and nonnegative");
  if (p.width + p.setbacks.left + p.setbacks.right > lot.width + 1e-8 ||
      p.depth + p.setbacks.front + p.setbacks.rear > lot.depth + 1e-8) issue(path, "Building plus setbacks exceeds lot footprint");
  // Conservative world-axis bounds account for rotated footprints as well.
  const c = Math.abs(Math.cos(building.yawRadians));
  const s = Math.abs(Math.sin(building.yawRadians));
  const halfX = (c * p.width + s * p.depth) / 2;
  const halfZ = (s * p.width + c * p.depth) / 2;
  if (Math.abs(building.position.x - lot.position.x) + halfX > lot.width / 2 + 1e-8 ||
      Math.abs(building.position.z - lot.position.z) + halfZ > lot.depth / 2 + 1e-8) issue(path, "Rotated building footprint extends outside lot");
  if (p.interiorMode === "cell" && p.width * p.depth < 9) issue(path, "Traversable interior requires at least 9 square metres");
  if (p.windowType === "interior-linked" && p.interiorMode === "none") issue(path, "Interior-linked windows require an interior");
  if (p.collisionMode === "detailed-interior" && p.interiorMode === "none") issue(path, "Detailed interior collision requires an interior");
  const anchors = building.anchors ?? [];
  const anchorIds = new Set<string>();
  for (const anchor of anchors) {
    const anchorPath = `${path}.anchors.${anchor.id}`;
    if (!validId(anchor.id) || anchorIds.has(anchor.id)) issue(anchorPath, "Anchor ID must be valid and unique within building");
    anchorIds.add(anchor.id);
    if (!validPosition(anchor.position) || !validPosition(anchor.facing) ||
        Math.abs(Math.hypot(anchor.facing.x, anchor.facing.z) - 1) > 0.01 || Math.abs(anchor.facing.y) > 0.01) {
      issue(anchorPath, "Anchor position must be finite and facing must be a horizontal unit vector");
    }
  }
  const openings = building.openings ?? [];
  checkOpenings(openings, anchors, p, building, path, issue);
  if (openings.filter((o) => o.kind === "garage").length !== p.garageOpeningCount) issue(path, "Garage opening count does not match facade openings");
  if (openings.filter((o) => o.kind === "door" || o.kind === "storefront").length !== p.entranceCount) issue(path, "Pedestrian entrance count does not match facade openings");
  if (p.garageOpeningCount > 0 && !lot.frontage.roadSegmentId && !lot.frontage.serviceRoadSegmentId) issue(path, "Garage opening requires road access");
}

export function assertValidCitySpec(city: CitySpec): void {
  const issues = validateCitySpec(city);
  if (issues.length) throw new Error(`Invalid Meridian CitySpec:\n${issues.map((entry) => `- ${entry.path}: ${entry.message}`).join("\n")}`);
}
