import { featureChoice, featureRandom } from "./seeded-variation";
import { facadeOutward, rotateHorizontal } from "./spatial";
import { OPENING_TEMPLATES, ROOF_FIXTURE_TEMPLATES, openingTemplateId } from "./architecture-templates";
import type {
  BuildingArchetype, FacadeOpeningSpec, FacadeSide, MassingForm,
  ResolvedBuildingSpec, RoofType, WorldPosition,
} from "./schema";
import type { OpeningTemplateId } from "./architecture-templates";

export type PrimitiveRole = "wall" | "roof" | "trim" | "glass" | "metal" | "storefront";
export type BayRole = "wall" | "window" | "storefront" | "service" | "entrance" | "garage";
export type MassRole = "body" | "podium" | "tower";

export interface BuildingMass {
  readonly id: string;
  readonly role: MassRole;
  /** All mass coordinates are local to the building's ground-level centre. */
  readonly centerX: number;
  readonly centerZ: number;
  readonly width: number;
  readonly depth: number;
  readonly baseY: number;
  readonly height: number;
  readonly firstFloor: number;
  readonly floors: number;
}

export interface FacadeBay {
  readonly id: string;
  readonly massId: string;
  readonly facade: FacadeSide;
  readonly floor: number;
  readonly index: number;
  /** Signed offset along local +X (front/rear) or +Z (left/right). */
  readonly offset: number;
  readonly width: number;
  readonly role: BayRole;
}

export interface PlannedOpening extends FacadeOpeningSpec {
  readonly massId: string;
  readonly floor: number;
  readonly source: "authored" | "generated";
  readonly templateId: OpeningTemplateId;
  /** False for decorative windows/storefront panels: wall remains solid. */
  readonly cutThrough: boolean;
}

export interface BoxPrimitive {
  readonly id: string;
  readonly role: PrimitiveRole;
  /** Local building-space coordinates; Babylon adapter applies building position/yaw. */
  readonly center: WorldPosition;
  readonly size: WorldPosition;
  readonly rotationZ?: number;
  readonly templateId?: string;
}

export interface RoofSurface {
  readonly massId: string;
  readonly type: RoofType;
  readonly elevation: number;
}

export interface GeneratedBuildingPlan {
  readonly buildingId: string;
  readonly archetype: BuildingArchetype;
  readonly generatorVersion: number;
  readonly massing: MassingForm;
  readonly masses: readonly BuildingMass[];
  readonly floorElevations: readonly number[];
  readonly footprint: readonly WorldPosition[];
  readonly bays: readonly FacadeBay[];
  readonly openings: readonly PlannedOpening[];
  readonly roofs: readonly RoofSurface[];
  readonly primitives: readonly BoxPrimitive[];
}

const SIDES: readonly FacadeSide[] = ["front", "rear", "left", "right"];
const WALL_THICKNESS = 0.24;
const EPS = 1e-7;
const round = (value: number) => Math.round(value * 1e6) / 1e6;

function makeMassing(spec: ResolvedBuildingSpec): BuildingMass[] {
  const { width, depth, floors, floorHeight, massing } = spec.parameters;
  const fullHeight = floors * floorHeight;
  const body: BuildingMass = {
    id: "body", role: "body", centerX: 0, centerZ: 0,
    width, depth, baseY: 0, height: fullHeight, firstFloor: 0, floors,
  };
  if (floors < 2 || (massing !== "podium" && massing !== "podium-tower")) return [body];
  const lowerFloors = massing === "podium-tower"
    ? Math.min(floors - 1, Math.max(2, Math.floor(floors * 0.25)))
    : Math.min(floors - 1, 2);
  const upperFloors = floors - lowerFloors;
  const scale = massing === "podium-tower" ? 0.72 : 0.88;
  return [
    { ...body, id: "podium", role: "podium", floors: lowerFloors, height: lowerFloors * floorHeight },
    {
      id: "upper", role: "tower", centerX: 0, centerZ: 0,
      width: width * scale, depth: depth * scale,
      baseY: lowerFloors * floorHeight, height: upperFloors * floorHeight,
      firstFloor: lowerFloors, floors: upperFloors,
    },
  ];
}

function sideSpan(mass: BuildingMass, side: FacadeSide): number {
  return side === "front" || side === "rear" ? mass.width : mass.depth;
}

function sideCenter(mass: BuildingMass, side: FacadeSide, offset: number, y: number, normalOffset = 0): WorldPosition {
  switch (side) {
    case "front": return { x: mass.centerX + offset, y, z: mass.centerZ + mass.depth / 2 + normalOffset };
    case "rear": return { x: mass.centerX + offset, y, z: mass.centerZ - mass.depth / 2 - normalOffset };
    case "left": return { x: mass.centerX - mass.width / 2 - normalOffset, y, z: mass.centerZ + offset };
    case "right": return { x: mass.centerX + mass.width / 2 + normalOffset, y, z: mass.centerZ + offset };
  }
}

function facadeBox(
  id: string, role: PrimitiveRole, mass: BuildingMass, side: FacadeSide,
  offset: number, y: number, width: number, height: number,
  thickness: number, normalOffset = 0, templateId?: string,
): BoxPrimitive {
  const center = sideCenter(mass, side, offset, y, normalOffset);
  const frontRear = side === "front" || side === "rear";
  return {
    id, role, center,
    size: { x: frontRear ? width : thickness, y: height, z: frontRear ? thickness : width },
    ...(templateId ? { templateId } : {}),
  };
}

function getMassForOpening(masses: readonly BuildingMass[], opening: FacadeOpeningSpec): BuildingMass {
  const bottom = opening.sillHeight;
  const top = bottom + opening.height;
  const mass = masses.find((item) =>
    bottom >= item.baseY - EPS && top <= item.baseY + item.height + EPS &&
    Math.abs(opening.offset) + opening.width / 2 <= sideSpan(item, opening.facade) / 2 - 0.08 + EPS,
  );
  if (!mass) throw new Error(
    `Opening ${opening.id} does not fit a single exterior mass; split or reposition the opening`,
  );
  return mass;
}

/**
 * Municipal Administration WG-01: resolve a facade cell by architectural intent.
 * Never suppress independent bays with random thinning or odd/even indexes.
 * A multistorey building's floor zero has no ordinary generated windows:
 * explicitly designated commercial storefronts and authored openings are
 * distinct from generic residence/office window placements.
 */
export function defaultFacadeBayRole(
  archetype: BuildingArchetype, side: FacadeSide, floor: number, storeys: number,
): BayRole {
  if (archetype === "garage" || archetype === "warehouse" || archetype === "parking") return "service";
  if (floor === 0 && archetype === "industrial") return "service";
  if (floor === 0 && (archetype === "commercial" || archetype === "mixed-use")) {
    if (side === "front" || (archetype === "commercial" && side === "right")) return "storefront";
    return "wall";
  }
  if (floor === 0 && archetype === "hospitality" && side === "front") return "storefront";
  if (floor === 0 && storeys >= 2) return "wall";
  return "window";
}

function overlaps(a: FacadeOpeningSpec, b: FacadeOpeningSpec, clearance = 0): boolean {
  return a.facade === b.facade &&
    Math.abs(a.offset - b.offset) < (a.width + b.width) / 2 + clearance - EPS &&
    a.sillHeight < b.sillHeight + b.height + clearance - EPS &&
    b.sillHeight < a.sillHeight + a.height + clearance - EPS;
}

function createFacadeLayout(
  spec: ResolvedBuildingSpec, masses: readonly BuildingMass[], generatorVersion: number,
): { bays: FacadeBay[]; openings: PlannedOpening[] } {
  const { floorHeight, windowType } = spec.parameters;
  const openings: PlannedOpening[] = [];
  for (const authored of spec.openings ?? []) {
    const mass = getMassForOpening(masses, authored);
    const templateId = openingTemplateId(authored.kind, windowType);
    const template = OPENING_TEMPLATES[templateId];
    openings.push({
      ...authored, massId: mass.id,
      floor: Math.min(spec.parameters.floors - 1, Math.floor(authored.sillHeight / floorHeight)),
      source: "authored", templateId,
      cutThrough: template.defaultCutThrough,
    });
  }
  const bays: FacadeBay[] = [];
  for (const mass of masses) {
    for (const side of SIDES) {
      const span = sideSpan(mass, side);
      const cornerPier = Math.min(0.7, span * 0.14);
      const usable = span - 2 * cornerPier;
      const count = Math.max(1, Math.min(12, Math.floor(usable / 3)));
      const bayWidth = usable / count;
      for (let localFloor = 0; localFloor < mass.floors; localFloor += 1) {
        const floor = mass.firstFloor + localFloor;
        const floorBase = floor * floorHeight;
        for (let index = 0; index < count; index += 1) {
          const offset = round(-usable / 2 + bayWidth * (index + 0.5));
          let role = defaultFacadeBayRole(spec.archetype, side, floor, spec.parameters.floors);
          const authored = openings.find((opening) =>
            opening.massId === mass.id && opening.facade === side &&
            Math.abs(opening.offset - offset) < (opening.width + bayWidth) / 2 &&
            opening.sillHeight < floorBase + floorHeight && opening.sillHeight + opening.height > floorBase,
          );
          if (authored) {
            role = authored.kind === "garage" ? "garage"
              : authored.kind === "door" ? "entrance"
              : authored.kind === "loading" ? "service"
              : authored.kind === "storefront" ? "storefront" : "window";
          }
          const id = `${mass.id}:${side}:f${floor}:b${index}`;
          bays.push({ id, massId: mass.id, facade: side, floor, index, offset, width: round(bayWidth), role });
          if (authored || windowType === "none" || role === "service" || role === "wall" ||
              role === "garage" || role === "entrance") continue;
          // Generated storefronts are facade *panels*, not unregistered traversable entrances.
          const kind = role === "storefront" ? "storefront" : "window";
          // Taller storeys need taller, proportionally raised openings; the
          // ordinary-height grammar and authored garage geometry are unchanged.
          const tallStorey = floorHeight > 3.8;
          const sillHeight = round(floorBase + (kind === "storefront"
            ? 0.22
            : tallStorey ? Math.min(1.32, floorHeight * 0.30) : Math.min(1.05, floorHeight * 0.30)));
          const height = round(kind === "storefront"
            ? Math.min(3.1, floorHeight - 0.22 - 0.62)
            : tallStorey ? Math.min(2.05, floorHeight * 0.46) : Math.min(1.65, floorHeight * 0.47));
          const width = round(Math.min(bayWidth * (kind === "storefront" ? 0.84 : 0.64), kind === "storefront" ? 3 : 1.9));
          if (width <= 0 || height <= 0) continue;
          const candidate: FacadeOpeningSpec = {
            id: `auto:${id}`, kind, facade: side, offset, sillHeight, width, height,
          };
          if (openings.some((other) => other.massId === mass.id && overlaps(candidate, other, 0.16))) continue;
          // Do not randomly drop individual windows: full bay columns form a
          // consistent grid across every eligible upper-floor row.
          const templateId = openingTemplateId(kind, windowType);
          openings.push({
            ...candidate, massId: mass.id, floor, source: "generated", templateId,
            cutThrough: kind === "window" && OPENING_TEMPLATES[templateId].defaultCutThrough,
          });
        }
      }
    }
  }
  return { bays, openings };
}

/** Subtracts real apertures from wall rectangles without CSG or overlapping wall patches. */
function wallSegments(
  mass: BuildingMass, side: FacadeSide, floor: number,
  floorHeight: number, openings: readonly PlannedOpening[],
): BoxPrimitive[] {
  const bottom = floor * floorHeight;
  const top = bottom + floorHeight;
  const span = sideSpan(mass, side);
  const cuts = openings.filter((opening) =>
    opening.massId === mass.id && opening.facade === side && opening.cutThrough &&
    opening.sillHeight < top - EPS && opening.sillHeight + opening.height > bottom + EPS,
  );
  const heights = [bottom, top];
  for (const cut of cuts) {
    heights.push(Math.max(bottom, cut.sillHeight), Math.min(top, cut.sillHeight + cut.height));
  }
  heights.sort((a, b) => a - b);
  const levels = heights.filter((y, i) => i === 0 || y - heights[i - 1]! > EPS);
  const boxes: BoxPrimitive[] = [];
  for (let row = 0; row < levels.length - 1; row += 1) {
    const y0 = levels[row]!;
    const y1 = levels[row + 1]!;
    if (y1 - y0 <= EPS) continue;
    const active = cuts.filter((cut) =>
      cut.sillHeight < (y0 + y1) / 2 && cut.sillHeight + cut.height > (y0 + y1) / 2,
    ).sort((a, b) => a.offset - b.offset);
    let cursor = -span / 2;
    const emit = (end: number) => {
      const width = end - cursor;
      if (width > EPS) {
        boxes.push(facadeBox(
          `wall:${mass.id}:${side}:f${floor}:r${row}:s${boxes.length}`,
          "wall", mass, side, (cursor + end) / 2, (y0 + y1) / 2,
          width, y1 - y0, WALL_THICKNESS,
        ));
      }
    };
    for (const cut of active) {
      const left = cut.offset - cut.width / 2;
      const right = cut.offset + cut.width / 2;
      if (left > cursor + EPS) emit(left);
      cursor = Math.max(cursor, right);
    }
    if (cursor < span / 2 - EPS) emit(span / 2);
  }
  return boxes;
}

function openingDetails(mass: BuildingMass, opening: PlannedOpening): BoxPrimitive[] {
  const template = OPENING_TEMPLATES[opening.templateId];
  const t = template.frameThickness;
  const bottom = opening.sillHeight;
  const top = bottom + opening.height;
  const edge = WALL_THICKNESS / 2 + 0.025;
  const bars = [
    facadeBox(`frame:${opening.id}:left`, "trim", mass, opening.facade,
      opening.offset - opening.width / 2, (bottom + top) / 2, t, opening.height + t, t, edge, template.id),
    facadeBox(`frame:${opening.id}:right`, "trim", mass, opening.facade,
      opening.offset + opening.width / 2, (bottom + top) / 2, t, opening.height + t, t, edge, template.id),
    facadeBox(`frame:${opening.id}:top`, "trim", mass, opening.facade,
      opening.offset, top, opening.width + t, t, t, edge, template.id),
    facadeBox(`frame:${opening.id}:bottom`, "trim", mass, opening.facade,
      opening.offset, bottom, opening.width + t, t, t, edge, template.id),
  ];
  // Physical doors/garage/loading bays stay open. Decorative storefronts are closed panels.
  if (template.glazing && (opening.kind === "window" || !opening.cutThrough)) {
    bars.push(facadeBox(
      `pane:${opening.id}`, opening.kind === "storefront" ? "storefront" : "glass",
      mass, opening.facade, opening.offset, (bottom + top) / 2,
      Math.max(0.04, opening.width - t), Math.max(0.04, opening.height - t),
      0.045, opening.cutThrough ? -template.paneInset : edge + 0.008, template.id,
    ));
  }
  return bars;
}

function roofBoxes(
  mass: BuildingMass, roofType: RoofType, spec: ResolvedBuildingSpec,
  generatorVersion: number, topMass: boolean,
): BoxPrimitive[] {
  const y = mass.baseY + mass.height;
  const pieces: BoxPrimitive[] = [{
    id: `roof:${mass.id}:slab`, role: "roof",
    center: { x: mass.centerX, y: y + 0.07, z: mass.centerZ },
    size: { x: mass.width, y: 0.14, z: mass.depth },
  }];
  if (roofType === "parapet") {
    const h = 0.75;
    for (const side of SIDES) {
      pieces.push(facadeBox(`roof:${mass.id}:parapet:${side}`, "trim", mass, side,
        0, y + h / 2, sideSpan(mass, side), h, 0.18));
    }
  } else if (roofType === "pitched" || roofType === "shed") {
    const rise = Math.max(0.45, mass.width * 0.13);
    const angle = Math.atan2(rise, roofType === "pitched" ? mass.width / 2 : mass.width);
    if (roofType === "pitched") {
      const length = Math.hypot(mass.width / 2, rise);
      for (const direction of [-1, 1] as const) {
        pieces.push({
          id: `roof:${mass.id}:pitch:${direction}`, role: "roof",
          center: { x: mass.centerX + direction * mass.width / 4, y: y + rise / 2, z: mass.centerZ },
          size: { x: length, y: 0.16, z: mass.depth + 0.25 },
          rotationZ: -direction * angle,
        });
      }
    } else {
      pieces.push({
        id: `roof:${mass.id}:shed`, role: "roof",
        center: { x: mass.centerX, y: y + rise / 2, z: mass.centerZ },
        size: { x: Math.hypot(mass.width, rise), y: 0.16, z: mass.depth + 0.25 },
        rotationZ: angle,
      });
    }
  }
  if (!topMass || spec.parameters.lodProfile === "skyline" || mass.width < 4 || mass.depth < 4) return pieces;
  const count = spec.parameters.floors >= 3 ? 2 : 1;
  for (let i = 0; i < count; i += 1) {
    const id = featureChoice(spec.seed, generatorVersion, `roof-fixture:${i}`,
      ["roof-hvac", "roof-vent", "roof-access-hut", "roof-water-tank", "roof-antenna"] as const);
    const fixture = ROOF_FIXTURE_TEMPLATES[id];
    if (fixture.footprintWidth + 1 >= mass.width || fixture.footprintDepth + 1 >= mass.depth) continue;
    const x = (featureRandom(spec.seed, generatorVersion, `roof-fixture-x:${i}`) - 0.5) *
      (mass.width - fixture.footprintWidth - 1);
    const z = (featureRandom(spec.seed, generatorVersion, `roof-fixture-z:${i}`) - 0.5) *
      (mass.depth - fixture.footprintDepth - 1);
    pieces.push({
      id: `roof:${mass.id}:fixture:${i}`, role: "metal", templateId: id,
      center: { x: mass.centerX + x, y: y + 0.14 + fixture.height / 2, z: mass.centerZ + z },
      size: { x: fixture.footprintWidth, y: fixture.height, z: fixture.footprintDepth },
    });
  }
  return pieces;
}

/**
 * Pure, repeatable architecture plan. Does not mutate scene, physics, source
 * spec, or any global cache. Call after Step 1 city validation/resolution.
 */
export function planBuilding(spec: ResolvedBuildingSpec, generatorVersion: number): GeneratedBuildingPlan {
  const p = spec.parameters;
  if (!Number.isSafeInteger(generatorVersion) || generatorVersion < 1 ||
      !Number.isFinite(p.width) || p.width <= 0 || !Number.isFinite(p.depth) || p.depth <= 0 ||
      !Number.isSafeInteger(p.floors) || p.floors < 1 ||
      !Number.isFinite(p.floorHeight) || p.floorHeight < 2.4 ||
      !Number.isFinite(spec.yawRadians)) {
    throw new Error(`Invalid resolved architecture input for ${spec.id}`);
  }
  const masses = makeMassing(spec);
  const { bays, openings } = createFacadeLayout(spec, masses, generatorVersion);
  const primitives: BoxPrimitive[] = [];
  const roofs: RoofSurface[] = [];
  for (const mass of masses) {
    for (let floor = mass.firstFloor; floor < mass.firstFloor + mass.floors; floor += 1) {
      for (const side of SIDES) primitives.push(...wallSegments(mass, side, floor, p.floorHeight, openings));
    }
    for (const opening of openings.filter((item) => item.massId === mass.id)) {
      primitives.push(...openingDetails(mass, opening));
    }
    const topMass = mass === masses[masses.length - 1];
    const type = topMass ? p.roofType : "flat";
    roofs.push({ massId: mass.id, type, elevation: mass.baseY + mass.height });
    primitives.push(...roofBoxes(mass, type, spec, generatorVersion, topMass));
  }
  const corners = [
    [-p.width / 2, -p.depth / 2], [p.width / 2, -p.depth / 2],
    [p.width / 2, p.depth / 2], [-p.width / 2, p.depth / 2],
  ] as const;
  const footprint = corners.map(([x, z]) => {
    const point = rotateHorizontal(x, z, spec.yawRadians);
    return { x: spec.position.x + point.x, y: spec.position.y, z: spec.position.z + point.z };
  });
  // These elevations are local to the building origin; the adapter adds position.y.
  const floorElevations = Array.from({ length: p.floors + 1 }, (_, i) => round(i * p.floorHeight));
  // Use the same coordinate convention as Step 1. Normal lookup also validates side mapping.
  void facadeOutward(spec.yawRadians, "front");
  return {
    buildingId: spec.id, archetype: spec.archetype, generatorVersion,
    massing: p.massing, masses, floorElevations, footprint, bays, openings, roofs, primitives,
  };
}
