# GTD NH-YARD-014 — Building greenery and optimized tree infill
Date: 2026-10-29
Branch: feature/nh-green-building-yards-20261029
Status: owner-visual-approval pending; do not merge to main automatically.

## Objective
After NH-YARD-013 converted 98 North Heights parcels from pale concrete to existing park grass, enrich available green building setback space with actual trees. The three user references show a tree-dense urban green city with grassy towers, parks, and diverse street-edge planting. The immediate request concerns landscape trees, NOT replacement buildings, architecture, green façade assets, new park pavilions or additional custom GLBs.

## Source and site plan
- Retain established NH-004 park and street-edge sites.
- Add deterministic NH-YARD-014 foliage across viable building-block setbacks and open park parcels.
- Base locations on the real 640m-by-640m, 10-by-10 North Heights block layout, using the actual `world.lotSpecs` geometry.
- Reject candidate trunks that touch building footprints plus a 2.35m buffer, block the +Z doorway corridor, enter either real parking block, overlap earlier trees (7.4m spacing) or any of the 359 existing GLB street lamps (5m buffer).
- Keep landscape within 22.8m of green block centres, outside the raised footpaths and two-lane roadway; terrain elevations are sampled from `northHeightsGround`.
- Variable tree height (~5–8m) and deterministic rotations/locations make repetition less mechanical; parkland gets more additions than occupied tower parcels.
- Mobile uses a smaller target population, without changing city road/building/traffic geometry.

## Rendering and diagnostics
- Import exactly the existing 173KB `public/GLBs/Infrastructure/tree_low_poly_lowpoly.glb` once.
- Preserve all original mesh geometry and PBR material; normalize its GLB source coordinates, and batch the two source meshes using Babylon GPU thin instances instead of one `createInstance` per tree.
- Camera radius ~180m desktop and 125m mobile; update instance matrices at 2Hz; no per-tree point lights, physics actors, shadows, generated canopy shapes or additional GLB downloads.
- The existing tree installation and debug status expose total logical tree count, source mesh count and theoretical instance count.

## Invariants
- No touch to streets, curbs, pavements, traffic, character animation, physics/colliders, parking layouts, doorways, interiors or NPC lifecycle.
- The two parking blocks remain paved.
- NH-YARD-013 landscaping material change remains in this same feature branch; this work is NOT merged separately.
- Build and 648+ regression tests before visual inspection. Owner should check green coverage and performance in an aerial and street-level view, including uphill roads and both nighttime/dusk and daytime.
