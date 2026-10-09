import type { BoxPrimitive, BuildingMass, GeneratedBuildingPlan, PlannedOpening } from "./architecture-plan";
import { facadeOutward, rotateHorizontal } from "./spatial";
import type {
  AnchorKind, FacadeSide, InteriorMode, PositionAnchorSpec, ResolvedBuildingSpec, WorldPosition,
} from "./schema";

/**
 * Step 4 is planned from immutable architectural semantics, never render meshes.
 * All collider/blocker boxes use local building coordinates; the adapter applies
 * the same ground-centre/yaw transform as the Babylon visual root.
 */
export interface SpatialBox {
  readonly id: string;
  readonly center: WorldPosition;
  readonly size: WorldPosition;
  readonly rotationZ?: number;
  readonly role: "structure" | "roof" | "glass" | "closed-door" | "interior-floor" | "partition";
}
export interface InteractionAnchor extends PositionAnchorSpec {
  readonly buildingId: string;
  readonly openingId?: string;
  readonly accessible: boolean;
}
export interface InteriorPortal {
  readonly id: string;
  readonly buildingId: string;
  readonly openingId: string;
  readonly anchorId: string;
  readonly interiorId: string;
  readonly facade: FacadeSide;
  readonly width: number;
  readonly height: number;
  readonly exterior: WorldPosition;
  readonly interior: WorldPosition;
  readonly facing: WorldPosition;
}
export interface InteriorCell {
  readonly id: string;
  readonly mode: Exclude<InteriorMode, "none">;
  readonly floor: number;
  /** Local, axis-aligned traversable area; no room subdivision is implied. */
  readonly localMin: WorldPosition;
  readonly localMax: WorldPosition;
  readonly portalIds: readonly string[];
}
export interface WorldBounds {
  readonly min: WorldPosition;
  readonly max: WorldPosition;
}
export interface BuildingSpatialMetadata {
  readonly buildingId: string;
  readonly name?: string;
  readonly address?: ResolvedBuildingSpec["address"];
  readonly archetype: ResolvedBuildingSpec["archetype"];
  readonly districtId: string;
  readonly neighborhoodId: string;
  readonly blockId: string;
  readonly lotId: string;
  readonly origin: WorldPosition;
  readonly yawRadians: number;
  readonly footprint: readonly WorldPosition[];
  readonly bounds: WorldBounds;
  readonly floorElevations: readonly number[];
  readonly interiorMode: InteriorMode;
}
export interface BuildingInteractionPlan {
  readonly buildingId: string;
  readonly collisionBoxes: readonly SpatialBox[];
  /** Invisible but ray-pickable Babylon proxies, independent of visual LOD. */
  readonly cameraBlockerBoxes: readonly SpatialBox[];
  /** Visible closure panels for authored doors without an accessible interior. */
  readonly closedDoorPanels: readonly BoxPrimitive[];
  readonly anchors: readonly InteractionAnchor[];
  readonly portals: readonly InteriorPortal[];
  readonly interior: InteriorCell | null;
  readonly spatial: BuildingSpatialMetadata;
}

const WALL_THICKNESS = 0.24;

function localFacadePoint(mass: BuildingMass, side: FacadeSide, offset: number, y: number): WorldPosition {
  switch (side) {
    case "front": return { x: mass.centerX + offset, y, z: mass.centerZ + mass.depth / 2 };
    case "rear": return { x: mass.centerX + offset, y, z: mass.centerZ - mass.depth / 2 };
    case "left": return { x: mass.centerX - mass.width / 2, y, z: mass.centerZ + offset };
    case "right": return { x: mass.centerX + mass.width / 2, y, z: mass.centerZ + offset };
  }
}
function worldPoint(spec: ResolvedBuildingSpec, point: WorldPosition): WorldPosition {
  const rotated = rotateHorizontal(point.x, point.z, spec.yawRadians);
  return { x: spec.position.x + rotated.x, y: spec.position.y + point.y, z: spec.position.z + rotated.z };
}
function boxFromPrimitive(part: BoxPrimitive, role: SpatialBox["role"]): SpatialBox {
  return {
    id: part.id, center: part.center, size: part.size, role,
    ...(part.rotationZ === undefined ? {} : { rotationZ: part.rotationZ }),
  };
}
function openingPanel(mass: BuildingMass, opening: PlannedOpening): BoxPrimitive {
  const point = localFacadePoint(mass, opening.facade, opening.offset,
    opening.sillHeight + opening.height / 2);
  const frontRear = opening.facade === "front" || opening.facade === "rear";
  return {
    id: "closed-door:" + opening.id, role: "metal", center: point,
    size: {
      x: frontRear ? opening.width : WALL_THICKNESS,
      y: opening.height,
      z: frontRear ? WALL_THICKNESS : opening.width,
    },
  };
}
function computeBounds(spec: ResolvedBuildingSpec, plan: GeneratedBuildingPlan): WorldBounds {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const mass of plan.masses) {
    for (const x of [mass.centerX - mass.width / 2, mass.centerX + mass.width / 2]) {
      for (const z of [mass.centerZ - mass.depth / 2, mass.centerZ + mass.depth / 2]) {
        for (const y of [mass.baseY, mass.baseY + mass.height]) {
          const p = worldPoint(spec, { x, y, z });
          min.x = Math.min(min.x, p.x); min.y = Math.min(min.y, p.y); min.z = Math.min(min.z, p.z);
          max.x = Math.max(max.x, p.x); max.y = Math.max(max.y, p.y); max.z = Math.max(max.z, p.z);
        }
      }
    }
  }
  return { min, max };
}
function anchorKind(opening: PlannedOpening): AnchorKind {
  switch (opening.kind) {
    case "door": return "primary-entrance";
    case "garage": return "garage-entrance";
    case "loading": return "loading-bay";
    case "storefront": return "storefront-entrance";
    case "window": throw new Error("Windows are not entrance anchors");
  }
}
function isEntrance(opening: PlannedOpening): boolean {
  return opening.cutThrough && opening.source === "authored" &&
    opening.kind !== "window";
}
function canTraverse(opening: PlannedOpening): boolean {
  return isEntrance(opening) && opening.floor === 0 &&
    opening.sillHeight <= 0.25 && opening.width >= 0.9 && opening.height >= 1.8;
}

/** Pure, deterministic Step 4 collision and interaction contract. */
export function planBuildingInteraction(
  spec: ResolvedBuildingSpec, plan: GeneratedBuildingPlan,
): BuildingInteractionPlan {
  if (plan.buildingId !== spec.id) throw new Error("Building interaction plan/spec ID mismatch");
  const masses = new Map(plan.masses.map((mass) => [mass.id, mass]));
  const cutThrough = plan.openings.filter((opening) => opening.cutThrough);
  const useSolidMasses = spec.parameters.collisionMode === "simple-shell" &&
    spec.parameters.interiorMode === "none" && cutThrough.length === 0;
  const collisionBoxes: SpatialBox[] = [];
  const cameraBlockerBoxes: SpatialBox[] = [];
  const closedDoorPanels: BoxPrimitive[] = [];
  const blockerEnabled = spec.parameters.cameraBlockerMode !== "none";

  for (const part of plan.primitives) {
    const isWall = part.role === "wall";
    const isRoof = part.role === "roof" || part.id.includes(":parapet:");
    const isPhysicalPane = part.role === "glass" && part.id.startsWith("pane:") &&
      cutThrough.some((opening) => opening.kind === "window" && part.id === "pane:" + opening.id);
    if (isWall || isRoof) {
      const box = boxFromPrimitive(part, isWall ? "structure" : "roof");
      if (!useSolidMasses) collisionBoxes.push(box);
      if (blockerEnabled) cameraBlockerBoxes.push(box);
    } else if (isPhysicalPane) {
      collisionBoxes.push(boxFromPrimitive(part, "glass"));
    }
  }
  if (useSolidMasses) {
    for (const mass of plan.masses) {
      collisionBoxes.push({
        id: "solid-mass:" + mass.id, role: "structure",
        center: { x: mass.centerX, y: mass.baseY + mass.height / 2, z: mass.centerZ },
        size: { x: mass.width, y: mass.height, z: mass.depth },
      });
    }
  }

  const interiorMode = spec.parameters.interiorMode;
  const interiorId = spec.id + ":interior:ground";
  const firstMass = plan.masses[0]!;
  const depth = interiorMode === "shallow" ? Math.max(0.1, Math.min(3.5, firstMass.depth - 0.48)) : firstMass.depth - 0.48;
  const localMin: WorldPosition = {
    x: firstMass.centerX - firstMass.width / 2 + WALL_THICKNESS,
    y: 0,
    z: interiorMode === "shallow"
      ? firstMass.centerZ + firstMass.depth / 2 - WALL_THICKNESS - depth
      : firstMass.centerZ - firstMass.depth / 2 + WALL_THICKNESS,
  };
  const localMax: WorldPosition = {
    x: firstMass.centerX + firstMass.width / 2 - WALL_THICKNESS,
    y: spec.parameters.floorHeight,
    z: firstMass.centerZ + firstMass.depth / 2 - WALL_THICKNESS,
  };
  const anchors: InteractionAnchor[] = (spec.anchors ?? []).map((anchor) => {
    const opening = plan.openings.find((item) => item.anchorId === anchor.id);
    const accessible = interiorMode !== "none" && (anchor.kind === "interior-spawn" ||
      (!!opening && canTraverse(opening) &&
      (interiorMode !== "shallow" || opening.facade === "front")));
    return {
      ...anchor, buildingId: spec.id, accessible,
      ...(opening ? { openingId: opening.id } : {}),
      ...(accessible ? { targetInteriorId: interiorId } : {}),
    };
  });
  const authoredAnchors = new Map(anchors.map((anchor) => [anchor.id, anchor]));
  const portals: InteriorPortal[] = [];
  for (const opening of plan.openings) {
    if (!isEntrance(opening)) continue;
    const mass = masses.get(opening.massId);
    if (!mass) throw new Error("Unknown opening mass: " + opening.massId);
    const point = worldPoint(spec, localFacadePoint(mass, opening.facade, opening.offset,
      opening.sillHeight));
    const facing = facadeOutward(spec.yawRadians, opening.facade);
    const accessible = interiorMode !== "none" && canTraverse(opening) &&
      (interiorMode !== "shallow" || opening.facade === "front");
    const id = opening.anchorId ?? spec.id + ":opening:" + opening.id;
    if (!authoredAnchors.has(id)) {
      const anchor: InteractionAnchor = {
        id, kind: anchorKind(opening), buildingId: spec.id,
        position: point, facing, openingId: opening.id,
        ...(accessible ? { targetInteriorId: interiorId } : {}),
        accessible,
      };
      anchors.push(anchor);
      authoredAnchors.set(id, anchor);
    }
    if (accessible) {
      const portalId = spec.id + ":portal:" + opening.id;
      portals.push({
        id: portalId, buildingId: spec.id, openingId: opening.id,
        anchorId: id, interiorId, facade: opening.facade,
        width: opening.width, height: opening.height,
        exterior: { x: point.x + facing.x * 0.65, y: point.y, z: point.z + facing.z * 0.65 },
        interior: { x: point.x - facing.x * 0.65, y: point.y, z: point.z - facing.z * 0.65 },
        facing,
      });
    } else {
      const panel = openingPanel(mass, opening);
      closedDoorPanels.push(panel);
      const box = boxFromPrimitive(panel, "closed-door");
      collisionBoxes.push(box);
      if (blockerEnabled) cameraBlockerBoxes.push(box);
    }
  }
  let interior: InteriorCell | null = null;
  if (interiorMode !== "none") {
    interior = { id: interiorId, mode: interiorMode, floor: 0,
      localMin, localMax, portalIds: portals.map((portal) => portal.id) };
    collisionBoxes.push({
      id: "interior-floor:" + interiorId, role: "interior-floor",
      center: { x: firstMass.centerX, y: -0.10, z: firstMass.centerZ },
      size: { x: firstMass.width, y: 0.2, z: firstMass.depth },
    });
    // Shallow shop interiors have a physical rear partition, not a fictional full-depth cell.
    if (interiorMode === "shallow" && portals.some((portal) => portal.facade === "front")) {
      const box: SpatialBox = {
        id: "interior-partition:" + interiorId, role: "partition",
        center: { x: firstMass.centerX, y: spec.parameters.floorHeight / 2,
          z: localMin.z - WALL_THICKNESS / 2 },
        size: { x: firstMass.width - 2 * WALL_THICKNESS,
          y: spec.parameters.floorHeight, z: WALL_THICKNESS },
      };
      collisionBoxes.push(box);
      if (blockerEnabled) cameraBlockerBoxes.push(box);
    }
  }
  const spatial: BuildingSpatialMetadata = {
    buildingId: spec.id, archetype: spec.archetype,
    districtId: spec.districtId, neighborhoodId: spec.neighborhoodId,
    blockId: spec.blockId, lotId: spec.lotId,
    origin: spec.position, yawRadians: spec.yawRadians,
    footprint: plan.footprint, bounds: computeBounds(spec, plan),
    floorElevations: plan.floorElevations.map((height) => spec.position.y + height),
    interiorMode,
    ...(spec.name ? { name: spec.name } : {}),
    ...(spec.address ? { address: spec.address } : {}),
  };
  return {
    buildingId: spec.id, collisionBoxes, cameraBlockerBoxes, closedDoorPanels,
    anchors, portals, interior, spatial,
  };
}
