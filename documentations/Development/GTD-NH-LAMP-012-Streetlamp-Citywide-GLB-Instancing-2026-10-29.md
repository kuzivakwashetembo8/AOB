# GTD NH-LAMP-012 — Citywide owner-GLB street lamps

Date: 2026-10-29
Branch: feature/gtd-south-ward-decommission-20261029
State: experimental preview, not approved for merge.

## Assets (verified on main)
- public/GLBs/Infrastructure/Modern Street Lamp.glb — 138,144 bytes; 3,408 triangles; Draco/WebP.
- public/GLBs/Infrastructure/Medellin Street Lamp Optimized.glb — 437,740 bytes; 13,919 triangles; Draco/WebP.
- Native source sizes/orientations differ materially (Modern source height near 1,290 raw units, Medellin source about 4.3 along a transformed axis). Do NOT assume either glTF root is 1 game metre or that the source origins coincide with its ground contact.

## Verified spatial contract
- North Heights spans world X,Z = [-320,+320] (640 metres square).
- Eleven equally spaced (64m) north/south road axes and eleven east/west axes; 100 parcels, 121 junctions.
- Asphalt carriageway width 8m: road center to edge = 4m.
- Raised pedestrian pavement extends to 7.75m from each road center.
- World Z positive is north and X positive is east.
- Terrain elevation comes exclusively from northHeightsGround(x,z), not a constant horizontal plane.

## Deterministic placement algorithm
Source file: src/game/experiments/north-heights-street-lamps-012.ts

- 220 N/S road verge lights (two per 64m segment, alternating road sides).
- 110 E/W road verge lights (one per 64m segment; paired with nearby N/S lighting).
- 11 dedicated central avenue intersection lamps.
- 8 parking perimeter lights (four at each of the two existing parking facilities).
- 10 park-area lights (two around each of the five actual unoccupied park parcels).
- 359 total, every location uniquely identified and at least 8.5m from every other.
- Road/corner lamp bases stand ~9.3m off road center, beyond the 7.75m pedestrian pavement; no lamppost is placed in the carriageway or on a crossing.
- Tree-proximity correction adjusts roadside positions with alternate offsets/sides; it uses the existing real GLB tree plan.
- Parking lights avoid marked stalls and the entrance aisle; final physical clearance and visual suitability must still be inspected.

## Rendering/performance contract
- The generated cube street furniture is removed (not retained as a loading placeholder).
- Import exactly two source GLBs, once each, after North Heights' first playable frame so startup does not wait for decoration.
- Normalize each source GLB to ~8.5m (Modern) / ~7.4m (Medellin) using loaded mesh vertices and real world-space transforms; anchor its actual base to grade and orient its upper geometry toward the adjacent road.
- Render with one Babylon thin-instance matrix buffer per distinct source mesh, never a separate mesh per pole. Only models within a camera-planar 172m desktop / 128m mobile radius are resident in the GPU instance matrices.
- Apply no Rapier actor or collider for the new lamps, preserving existing accepted traffic and player navigation. Collision acceptance can be a future separate stage.
- Use one shared emissive night bulb mesh with thin instances (not 359 individual point lights).
- Pool only 3 desktop or 2 mobile point lights near the camera for local illumination, enabled at dusk/night. Never enable shadow maps for each lamp.
- Dispose templates, bulb and local light pool on scene teardown; failures do not generate fallback colored dots or cubes.
- Asset loads are asynchronous and reported via console. The new feature must not block player movement or load readiness if an asset fails.

## Acceptance tests
- src/test/north-heights-street-lamps-012.test.ts: count/IDs, spacing and sidewalks, tree avoidance, exact source filenames, no old procedural poles, unchanged core engine hooks.
- Existing North Heights UI/physics/sedan/NPC tests should remain green.
- Desktop and mobile preview should confirm correct upright orientation and scale of BOTH GLBs, natural hill contact, no collision with roads/buildings, no spurious distant rendering, correct dusk/night lighting and no measurable frame-rate regression versus the preceding preview.

## Caveat
These are proposed coordinates projected from the production code's deterministic world, not user visually accepted placements. Approval of the density, spacing and exact GLB postures is required before merging.
