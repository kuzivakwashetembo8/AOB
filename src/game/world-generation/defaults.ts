import type {
  BuildingArchetype,
  BuildingParameters,
  BuildingRules,
  CitySpec,
  DistrictSpec,
  FacadeMaterial,
  LotSpec,
  NeighborhoodSpec,
  ResolvedBuildingSpec,
  Setbacks,
} from "./schema";

const ZERO_SETBACKS: Setbacks = { front: 0, rear: 0, left: 0, right: 0 };

export const GLOBAL_BUILDING_DEFAULTS: BuildingParameters = {
  width: 12,
  depth: 12,
  floors: 2,
  floorHeight: 3.2,
  massing: "slab",
  facadeMaterial: "weathered-concrete",
  windowType: "decorative",
  entranceCount: 0,
  garageOpeningCount: 0,
  interiorMode: "none",
  collisionMode: "simple-shell",
  cameraBlockerMode: "opaque-shell",
  roofType: "flat",
  lodProfile: "standard",
  setbacks: ZERO_SETBACKS,
};

/** Defaults are data, not geometry. Archetype defaults deliberately override district style. */
export const ARCHETYPE_DEFAULTS: Readonly<Record<BuildingArchetype, BuildingRules>> = {
  residential: { width: 14, depth: 12, floors: 3, floorHeight: 3.1, massing: "row", facadeMaterial: "warm-brick", windowType: "recessed", roofType: "parapet" },
  "mixed-use": { width: 16, depth: 12, floors: 4, floorHeight: 3.2, massing: "row", facadeMaterial: "warm-brick", windowType: "recessed", roofType: "parapet" },
  commercial: { width: 13, depth: 10, floors: 2, floorHeight: 3.5, massing: "corner", facadeMaterial: "painted-block", windowType: "decorative" },
  garage: { width: 13.5, depth: 10, floors: 1, floorHeight: 4.7, massing: "warehouse", facadeMaterial: "garage-block", windowType: "physical", roofType: "flat", collisionMode: "segmented-shell", cameraBlockerMode: "semantic" },
  warehouse: { width: 24, depth: 18, floors: 1, floorHeight: 6, massing: "warehouse", facadeMaterial: "industrial-metal", windowType: "none", roofType: "shed" },
  industrial: { width: 24, depth: 18, floors: 2, floorHeight: 4, massing: "warehouse", facadeMaterial: "weathered-concrete", windowType: "decorative", roofType: "shed" },
  office: { width: 18, depth: 16, floors: 6, floorHeight: 3.6, massing: "slab", facadeMaterial: "weathered-concrete", windowType: "recessed", roofType: "parapet" },
  "podium-tower": { width: 20, depth: 20, floors: 12, floorHeight: 3.5, massing: "podium-tower", facadeMaterial: "weathered-concrete", windowType: "recessed", roofType: "parapet", lodProfile: "skyline" },
  civic: { width: 20, depth: 16, floors: 3, floorHeight: 4, massing: "podium", facadeMaterial: "weathered-concrete", windowType: "recessed" },
  hospitality: { width: 16, depth: 14, floors: 5, floorHeight: 3.4, massing: "slab", facadeMaterial: "plaster", windowType: "recessed" },
  parking: { width: 22, depth: 22, floors: 4, floorHeight: 3.1, massing: "slab", facadeMaterial: "weathered-concrete", windowType: "none" },
};

/** Material families explicitly supported by the first generator contract. */
export const ARCHETYPE_MATERIALS: Readonly<Record<BuildingArchetype, readonly FacadeMaterial[]>> = {
  residential: ["warm-brick", "painted-block", "plaster", "weathered-concrete"],
  "mixed-use": ["warm-brick", "painted-block", "plaster", "weathered-concrete"],
  commercial: ["painted-block", "warm-brick", "storefront-glass", "weathered-concrete", "plaster"],
  garage: ["garage-block", "painted-block", "weathered-concrete", "industrial-metal"],
  warehouse: ["industrial-metal", "garage-block", "weathered-concrete"],
  industrial: ["industrial-metal", "garage-block", "weathered-concrete", "painted-block"],
  office: ["weathered-concrete", "storefront-glass", "plaster", "painted-block"],
  "podium-tower": ["weathered-concrete", "storefront-glass", "painted-block"],
  civic: ["weathered-concrete", "plaster", "warm-brick"],
  hospitality: ["plaster", "painted-block", "warm-brick", "weathered-concrete"],
  parking: ["weathered-concrete", "garage-block", "industrial-metal"],
};

/** Global → district → neighborhood → archetype → lot → building. */
export function resolveBuildingParameters(
  city: CitySpec,
  district: DistrictSpec,
  neighborhood: NeighborhoodSpec,
  lot: LotSpec,
): BuildingParameters {
  const building = lot.building;
  if (!building) throw new Error(`Lot ${lot.id} has no building`);
  const archetype = ARCHETYPE_DEFAULTS[building.archetype];
  if (!archetype) throw new Error(`Unsupported archetype: ${building.archetype}`);
  const layers: readonly (BuildingRules | undefined)[] = [
    city.rules, district.rules, neighborhood.rules, archetype, lot.rules, building.overrides,
  ];
  const merged: BuildingParameters = { ...GLOBAL_BUILDING_DEFAULTS };
  let setbacks: Setbacks = { ...ZERO_SETBACKS };
  for (const layer of layers) {
    if (!layer) continue;
    const { setbacks: nextSetbacks, ...scalars } = layer;
    Object.assign(merged, scalars);
    if (nextSetbacks) setbacks = { ...setbacks, ...nextSetbacks };
  }
  return { ...merged, setbacks };
}

/** Returns new resolved records without modifying authored data. */
export function resolveCityBuildings(city: CitySpec): ResolvedBuildingSpec[] {
  const result: ResolvedBuildingSpec[] = [];
  for (const district of city.districts) {
    for (const neighborhood of district.neighborhoods) {
      for (const block of neighborhood.blocks) {
        for (const lot of block.lots) {
          if (!lot.building) continue;
          result.push({
            ...lot.building,
            parameters: resolveBuildingParameters(city, district, neighborhood, lot),
            districtId: district.id,
            neighborhoodId: neighborhood.id,
            blockId: block.id,
            lotId: lot.id,
          });
        }
      }
    }
  }
  return result;
}
