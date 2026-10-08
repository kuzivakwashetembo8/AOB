/** Meridian authored world data. Pure TypeScript: no Babylon, Rapier or React dependency. */
export const CITY_SCHEMA_VERSION = 1 as const;

/** Metres. X = east/right, Y = up, Z = south/forward in the current First Light scene. */
export type WorldPosition = Readonly<{ x: number; y: number; z: number }>;
export type GroundPoint = Readonly<{ x: number; z: number }>;

/** Radians around +Y. A zero-yaw building's front facade faces +Z. */
export type FacadeSide = "front" | "rear" | "left" | "right";
export type BuildingArchetype =
  | "residential"
  | "mixed-use"
  | "commercial"
  | "garage"
  | "warehouse"
  | "industrial"
  | "office"
  | "podium-tower"
  | "civic"
  | "hospitality"
  | "parking";
export type MassingForm = "slab" | "row" | "warehouse" | "podium" | "podium-tower" | "corner";
export type FacadeMaterial =
  | "warm-brick"
  | "weathered-concrete"
  | "painted-block"
  | "garage-block"
  | "industrial-metal"
  | "plaster"
  | "storefront-glass";
export type WindowType = "none" | "decorative" | "recessed" | "physical" | "interior-linked";
export type InteriorMode = "none" | "shallow" | "cell";
export type CollisionMode = "simple-shell" | "segmented-shell" | "detailed-interior";
export type CameraBlockerMode = "opaque-shell" | "semantic" | "none";
export type RoofType = "flat" | "parapet" | "pitched" | "shed";
export type LodProfile = "background" | "standard" | "hero" | "skyline";
export type AnchorKind =
  | "primary-entrance"
  | "service-entrance"
  | "garage-entrance"
  | "storefront-entrance"
  | "roof-access"
  | "interior-spawn"
  | "loading-bay"
  | "helipad";

export interface Setbacks {
  readonly front: number;
  readonly rear: number;
  readonly left: number;
  readonly right: number;
}

/** Fully resolved dimensions and gameplay-facing building semantics. */
export interface BuildingParameters {
  readonly width: number;
  readonly depth: number;
  readonly floors: number;
  readonly floorHeight: number;
  readonly massing: MassingForm;
  readonly facadeMaterial: FacadeMaterial;
  readonly windowType: WindowType;
  /** Number of pedestrian entrances, excluding garage openings. */
  readonly entranceCount: number;
  readonly garageOpeningCount: number;
  readonly interiorMode: InteriorMode;
  readonly collisionMode: CollisionMode;
  readonly cameraBlockerMode: CameraBlockerMode;
  readonly roofType: RoofType;
  readonly lodProfile: LodProfile;
  readonly setbacks: Setbacks;
}

/** Shallow scalar override with an optional partial nested setbacks override. */
export type BuildingRules = Partial<Omit<BuildingParameters, "setbacks">> & {
  readonly setbacks?: Partial<Setbacks>;
};

export interface AddressSpec {
  readonly number: string;
  readonly street: string;
}

/** Absolute world-space semantic anchor; stable ID is scoped to its building. */
export interface PositionAnchorSpec {
  readonly id: string;
  readonly kind: AnchorKind;
  readonly position: WorldPosition;
  readonly facing: WorldPosition;
  readonly targetInteriorId?: string;
}

/** Offset is signed metres along the facade from its horizontal centre. */
export interface FacadeOpeningSpec {
  readonly id: string;
  readonly kind: "door" | "garage" | "window" | "storefront" | "loading";
  readonly facade: FacadeSide;
  readonly offset: number;
  readonly sillHeight: number;
  readonly width: number;
  readonly height: number;
  readonly anchorId?: string;
}

/** Stable identity is independent of display name and civic address. */
export interface BuildingSpec {
  readonly id: string;
  readonly seed: string | number;
  /** Ground-level centre of the footprint, NOT the mesh's bounding-box centre. */
  readonly position: WorldPosition;
  readonly yawRadians: number;
  readonly archetype: BuildingArchetype;
  readonly name?: string;
  readonly address?: AddressSpec;
  readonly anchors?: readonly PositionAnchorSpec[];
  readonly openings?: readonly FacadeOpeningSpec[];
  readonly overrides?: BuildingRules;
}

export interface ResolvedBuildingSpec extends BuildingSpec {
  readonly parameters: BuildingParameters;
  readonly districtId: string;
  readonly neighborhoodId: string;
  readonly blockId: string;
  readonly lotId: string;
}

export type RoadClass = "alley" | "local" | "collector" | "arterial" | "boulevard" | "highway";
export interface RoadNodeSpec {
  readonly id: string;
  readonly position: WorldPosition;
}
export interface RoadSegmentSpec {
  readonly id: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly name: string;
  readonly roadClass: RoadClass;
  readonly width: number;
  readonly laneCount: number;
  readonly sidewalkWidth: number;
}
export interface IntersectionSpec {
  readonly id: string;
  readonly nodeId: string;
  readonly kind: "continuation" | "t" | "four-way" | "custom";
  readonly connectedSegmentIds: readonly string[];
}
export interface RoadNetworkSpec {
  readonly nodes: readonly RoadNodeSpec[];
  readonly segments: readonly RoadSegmentSpec[];
  readonly intersections: readonly IntersectionSpec[];
}

export interface RoadFrontageSpec {
  readonly roadSegmentId: string;
  readonly facade: FacadeSide;
  readonly serviceRoadSegmentId?: string;
}

export interface LotSpec {
  readonly id: string;
  readonly position: WorldPosition;
  readonly width: number;
  readonly depth: number;
  readonly frontage: RoadFrontageSpec;
  readonly allowedArchetypes?: readonly BuildingArchetype[];
  readonly rules?: BuildingRules;
  readonly building?: BuildingSpec;
}

export interface PublicSpaceSpec {
  readonly id: string;
  readonly kind: "pocket-park" | "plaza" | "courtyard" | "playground";
  readonly position: WorldPosition;
  readonly width: number;
  readonly depth: number;
}
export interface PropPlacementSpec {
  readonly id: string;
  readonly templateId: string;
  readonly position: WorldPosition;
  readonly yawRadians: number;
}
export interface VegetationPlacementSpec {
  readonly id: string;
  readonly speciesId: string;
  readonly position: WorldPosition;
  readonly seed: string | number;
}
export interface BlockSpec {
  readonly id: string;
  readonly lots: readonly LotSpec[];
  readonly publicSpaces?: readonly PublicSpaceSpec[];
  readonly props?: readonly PropPlacementSpec[];
  readonly vegetation?: readonly VegetationPlacementSpec[];
}
export interface NeighborhoodSpec {
  readonly id: string;
  readonly name: string;
  readonly rules?: BuildingRules;
  readonly blocks: readonly BlockSpec[];
}
export interface DistrictSpec {
  readonly id: string;
  readonly name: string;
  readonly rules?: BuildingRules;
  readonly neighborhoods: readonly NeighborhoodSpec[];
}
export interface CitySpec {
  readonly schemaVersion: typeof CITY_SCHEMA_VERSION;
  readonly generatorVersion: number;
  readonly id: string;
  readonly name: string;
  readonly rules?: BuildingRules;
  readonly roads: RoadNetworkSpec;
  readonly districts: readonly DistrictSpec[];
}
