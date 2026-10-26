# GTD-GEN-VEH-006 — BMW M4 Competition M Package source-native traffic
Date: 2026-10-26
Branch: feature/gtd-generated-vehicles-001
Status: three-stage extraction implemented; mobile visual acceptance pending.

## Locked accepted foundations
- GEN-VEH-002 Lamborghini source-derived body Step 2 accepted.
- GEN-VEH-003 Lamborghini wheel source alignment Step 3 accepted with outstanding rim-spoke visibility; GEN-VEH-003.2 adds separate minimal radial split-spoke front overlay (see below).
- GEN-VEH-005 Range Rover Sport Steps 1–3 visually accepted in the 14:58 owner screenshots; no changes to its source body or axles.

## Step 1 — verified BMW source identification
- Original owner file: `public/GLBs/Cars/bmw_m4_competition_m_package (1).glb`, expected 1,928,276 bytes; source footprint width 1.93 m, length 4.80 m, height 1.46 m.
- Audit source hierarchy using `scripts/genveh006-audit-bmw.mjs`; source contains 35 nodes, 30 meshes, 28 materials, 206,593 triangles and 30 primitives.
- Distinct from the Rover, the BMW has a `WHeelsandrims_2` subtree whose three original materials contain all four wheel corners together. Do not look for Rover's `FL Wheel` node names or accidentally use a generic coupe.
- Existing verified `scripts/wheel001_extract_wheels.mjs` performs **bijective partitioning of original BMW wheel triangles** into original-derived four-corner derivative GLB. This is an OFFLINE intermediate, not a runtime asset. If it is missing in standalone prebuild the extractor invokes the exact verified routine to reconstruct it.

## Step 2 — source-exact exterior surface reconstruction
- Extract original source node world matrices and source normals, partition body primitives by body paint, glazing, trim, headlights and taillights while excluding interior/engine and wheel group.
- Conserve source panel and hard-edge boundaries: no global triangle welding. Quantized vertices/normals and indexed triangle buffers are emitted as `src/game/vehicles/bmw-source-data-006.ts` during build.
- Normalize original source long Z to traffic +Z, source X to GTD X, preserve 1.93 x 1.46 x 4.80 m maximum visual footprint.
- Construct Babylon native meshes once per source part and reuse via thin-instance buffers in the 125 NH-012 traffic agent renderer.
- No GLB runtime load or camera proximity swap; original BMW in parking lot stays drivable and unchanged.

## Step 3 — wheel extraction and fit
- Use the pre-validated four-corner WHEEL-001 BMW derivative with original material identities. Transform all wheel mesh vertices to common original source/world space.
- Record actual center and radius of each corner; separate tyre from rim via `m8rim` material identities, not a guessed disc.
- Wheel roll rotation about local X, front wheels steer about world/up local axis, rim face offset 15 mm outward; do not move body or car centers.
- Run source geometry/axle/face unit tests and full GTD regression. Confirm wheels look realistic from side/aerial/3/4 Android screenshots before owner acceptance.

## GEN-VEH-003.2 — Lamborghini rim correction continues
The attempted brightness and 24 mm rim offset did **not** solve featureless disc faces in the owner screenshot. This patch preserves all source geometry and source wheel pivots but draws a *sparse* five-paired-spoke native rim face on the actual tyre's outward face. Its ring, spokes, hub are a small geometric overlay with open gaps, not a filled disc, not GLB loading, and not a replacement for source wheel geometry. It is a visibility fallback, explicitly separate from original exact rim extraction. Owner must visually verify it rather than assuming code success.

## Preview acceptance boundaries
- North Heights traffic 125 agents; Rover, Lamborghini and BMW source-derived traffic classes present; existing other traffic classes remain native.
- No diagnostic dots, no GLB loading on moving traffic and no changes to six parked/drivable source vehicles.
- BMW body shape and four visible wheels recognizable; accepted Rover body and wheels unchanged; accepted Lamborghini body/wheel pivots unchanged; Lamborghini spokes now distinguishable from solid disc.
- Mobile smoothness not regressed; test exact build and compare to prior deployment before merging.
