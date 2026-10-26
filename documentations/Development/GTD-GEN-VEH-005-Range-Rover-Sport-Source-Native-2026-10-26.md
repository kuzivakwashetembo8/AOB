# GTD-GEN-VEH-005 — Range Rover Sport 2018 source-derived native traffic
Date: 2026-10-26
Branch: feature/gtd-generated-vehicles-001
Status: source audit and extraction active; owner preview not yet accepted

## Locked sequence
1. **Step 1: extract actual exterior from owner source** `public/GLBs/Cars/Range Rover Sports 2018 (.GLB).glb` (1,605,108 known bytes); use Draco-capable glTF world-space decoding and preserve native triangle topology, panel boundaries, vertex normals and paint/glass/trim/light materials. Respect the SUV dimensions `4.85 x 2.03 x 1.80 m` (L/W/H) from MERCER_EXTRA_GLB_SPECS. Do not confuse it with `Land rover defender 001.glb`.
2. **Step 2: exterior surface refinement**; keep source-based bumper, roof, roof glazing, side panel, arch shapes, grille and light silhouettes. Avoid global spatial clustering: cluster vertices only within each primitive and material. Quantize positions/normals after panel-safe processing; reuse thin-instanced native Babylon meshes. Audit output triangle/byte budgets, avoid collapsing wheels into body.
3. **Step 3: four actual wheel geometries**; source-identify or classify wheel/tire/rim islands; measure separate front and rear wheel axle centers, hub face offset, rubber radius/width; render dark visible rims and source tyres as native meshes, rotate four corners with existing roll and front steering.
4. **Integration**: select Range Rover Sport traffic agents via `modelId=gtd-veh006-mercer-range-rover`, not by replacing the complete SUV style category; keep Lamborghini source-derived body and wheels unchanged. Preserve other traffic classes, 125 agents, speed/roads/flight and no dot markers. Keep six original parked/drivable GLBs as visual A/B controls until owner approves generated parked replacements.
5. **Quality gates**: visual compare with original Range Rover GLB from road, aerial and side views; check rear/front geometry and windows; check all four wheels, rolling and steering; test mobile frame pacing and geometry budget on Android; no merge until explicit acceptance.

## Current audit and risks
Initial `scripts/genveh005-audit-rover.mjs` reports the GLB's actual material list, mesh/node hierarchy and wheel-like components in the Vercel prebuild log before any extraction logic is chosen. No assumptions about its node naming, orientation or wheel groups may be presented as verified prior to the audit. If no individually-labelled wheels are present, use source geometry and connectivity to group circular components without editing the original asset.

## GEN-VEH-003.1 — accepted Lamborghini wheel follow-up
The Lamborghini Step 3 source wheel geometry and axle placement were accepted, with visually dark/absent rim spokes. Current patch is cosmetic-only: rim diffuse/specular contrast and a 24 mm outward rim-face offset, without moving tyre centers, source body, front/rear axle placement or traffic. Must be inspected on Android, not claimed complete from code alone.
