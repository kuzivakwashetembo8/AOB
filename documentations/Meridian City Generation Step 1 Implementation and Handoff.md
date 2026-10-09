# Meridian City Generation — Step 1 Implementation and Handoff

Status: DATA FOUNDATION IMPLEMENTED; RENDERING NOT MIGRATED
Date: 2026-10-09
Next dependency: Schedule 2 — Procedural Architecture Generator

## Implementation

Step 1 adds a renderer-independent TypeScript world model under `src/game/world-generation/`. The existing Babylon/Rapier First Light scene remains authoritative for visuals, collision and camera behavior. No runtime integration or deployment was performed.

| File | Purpose |
| --- | --- |
| `schema.ts` | Typed CitySpec, DistrictSpec, NeighborhoodSpec, BlockSpec, LotSpec, BuildingSpec, road nodes/segments/intersections, props, vegetation, public spaces, semantic anchors and facade openings. |
| `defaults.ts` | Archetype defaults, supported material families, ordered rule inheritance and resolved building inventory. |
| `seeded-variation.ts` | Feature-keyed deterministic variation from stable seed, generator version and feature key. |
| `spatial.ts` | World-space facade coordinates and outward normals. |
| `validation.ts` | Cross-reference, geometry, opening, material, lot, anchor and road-topology checks. |
| `first-light-spec.ts` | Ten semantic First Light building records and five connected road segments. |
| `index.ts` | Public API for later schedules. |

## Identity and coordinate contract

One world unit equals one metre. X is east/right, Y is up, Z is south/forward in the current First Light scene. A building position is the **ground-level footprint centre**, not the centre of a mesh. Zero yaw faces +Z; yaw π faces −Z. Opening offsets use local +X on front/rear and local +Z on left/right.

A building's `id` is stable machine identity. Optional `name` and `address` are independent human-facing labels. Semantic anchors have absolute world positions and horizontal unit-vector facings. Anchor/opening IDs are scoped to their building; all city, road, block, lot, building and placement IDs must be globally unique.

The First Light garage has stable ID `sw-fl-garage`, ground centre `(-7.5, 0, -5.15)`, footprint 13.5 × 10 metres, one 4.7-metre storey, a 4.6-metre front vehicle opening, two rear windows, a vehicle-entry anchor and an interior-spawn anchor. The reference also inventories support buildings, the south apartment, corner commercial building, rear residential/shop/workshop structures and two skyline podium/tower masses. These are **data records**, not generated meshes.

Road names in the sample are provisional design labels. No civic numbering or named signage has been introduced to the running game.

## Rule resolution

`resolveBuildingParameters(city, district, neighborhood, lot)` applies:

```text
Global defaults → City → District → Neighborhood → Archetype → Lot → Building
```

Later scalar overrides win. Setbacks merge by side rather than replacing the whole setback object. Resolution returns new objects without mutating authored data. Archetype/material compatibility is validated.

## Determinism

Use `featureRandom(seed, generatorVersion, featureKey)`, `featureRange` and `featureChoice` for every generated variation. Feature keys must be stable semantic identifiers (for example `window-tint:rear:0` or `roof-hvac:2`). Adding a new feature does not reshuffle existing keyed results. A generator-version change can intentionally change output. Do not use uncontrolled randomness in city generation.

## Validation and verification

`validateCitySpec` returns structured `{ path, message }` issues and `assertValidCitySpec` throws combined diagnostics. Validation covers duplicate IDs, invalid dimensions and floors, negative setbacks, incompatible materials, lot containment including rotated footprints, road references and T-junction connectivity, opening overlap/corner limits, entrance counts and semantic anchor alignment.

The authored First Light reference validates with zero issues and resolves ten distinct buildings. Strict TypeScript compilation of new modules passed. Ten tests passed in the implementation workspace using a local assertion-compatible Vitest shim; the test source also typechecked with a local Vitest declaration shim. These shims are **not committed**.

The real repository `npm test`, `npm run lint` and `npm run build` were not executed because the automation workspace lacked the repository's installed dependencies. These checks remain mandatory before declaring full CI verification.

## Known limits

- The new data does not yet generate Babylon meshes, Rapier colliders, camera blockers, interiors, roads or HUD state. First Light runtime code is unchanged.
- Road graph data is descriptive; road/curb generation belongs to Schedule 5.
- Lots are axis-aligned rectangles. Polygon lots, terrain slopes, frontage geometry and lot-overlap solving are deferred.
- The two skyline podium/tower structures are single semantic records, not separate generated masses.
- Street names are provisional. Addresses and civic numbering require authored decisions before player-facing use.
- Persisted save migration and untrusted JSON shape parsing are not yet implemented.
- Generator version 1 is explicit; future schema changes require migration tests.

## Schedule 2 handoff

Read `documentations/For Overnight Schedules.md` and the five-step plan. Import the public API from `src/game/world-generation/index.ts`. Call `assertValidCitySpec(FIRST_LIGHT_CITY_SPEC)` and `resolveCityBuildings(FIRST_LIGHT_CITY_SPEC)` before generating architecture.

Build geometry against resolved `BuildingParameters` and semantic openings. Use `facadeWorldPoint` and `facadeOutward` for placement, and stable feature keys for variation. Keep the current First Light scene as the regression oracle until generated geometry, collision and camera behavior reach parity. Preserve IDs, coordinate units, yaw convention and rule precedence. Run the real repository checks when possible; do not deploy automatically.
