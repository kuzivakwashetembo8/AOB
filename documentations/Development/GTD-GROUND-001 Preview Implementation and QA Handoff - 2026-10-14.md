# GTD-GROUND-001 — South Ward Land-Infill Preview Implementation and QA Handoff

Date: 2026-10-14 (SAST)
Scope: branch `feat/ground001-south-ward-land-infill-20261014` only; not merged into main.
Baseline: `main@8543b9ffea3c9ca6ff9d50ccc5821f4a58e82408`.
Directive: owner authorized all implementation stages without intermediate approval pauses, but flagged failures still require correction before claiming production acceptance.

## Preview operator instruction

Open the preview-specific deployment at `/game?gtdGround001=1`. This flag enables a new 13-category composed land-finish map on the existing First Light ground. The same deployment at `/game?gtdGround001=0` is the A/B comparator and retains original dark terrain and legacy WORLD-003 infill. Production remains unaffected.

Browser-only diagnostic: `window.__GTD_GROUND_REPORT__?.()` reports whether the feature is enabled, the existing ground mesh, semantic category pixel counts and whether ground mesh is eligible for rendering. The counts do **not** prove GPU draw or the visual quality of the output.

## Architecture actually implemented

- `ground-land-use.ts`: deterministic, bounded, CitySpec-derived 1 m sampling of a finite 160x130 m field. Generates all thirteen approved types and an accounting count; references existing roads, sidewalks, building positions/use and the protected public green, while preserving all existing building/road records and no additional physical city geography.
- `ground-land-surface.ts`: rasterizes 1 m land classifications to a 4-pixels/metre RGBA texture. Uses fine-scale surface variation, concrete expansion joints, parking stall markings, landscaping, gravel and shallow decorative water finish. Every pixel is opaque and assigned.
- `generated-first-light-world.ts`: applies the new map to the **same original ground mesh** as an opt-in diffuse texture; explicit world-coordinate UVs, simplified unlit ground material, unchanged original Rapier ground collider. This bypasses WORLD-003's separate unverified ground-quad draw path without altering accepted roads/sidewalks.
- `urban-surface-renderer.ts`: conditionally omits old overlapping WORLD-003 infill batches only when the new preview option is enabled, avoiding dual surface ownership. Existing public green and street mesh behavior retained.
- `first-light-runtime-source.ts` and `gtd-runtime.ts`: forwards `?gtdGround001=1`; browser local-only diagnostic.
- `ground001-land-use.test.ts`: catalogue count, deterministic results, bounds, park and road protection, 100% opaque pixel allocation, preview world physics/ten-building preservation and disposal.
- `vercel.json`: branch-local preview-only `ignoreCommand=exit 1` and strict typecheck/Vitest/build command. Main's manual-deploy policy is not modified.

**Note:** No physical excavation, terrain elevation changes, flood physics, dynamic water simulation, vehicle AI, new road segments or new city buildings are in this preview. The WTR classes are **shallow visual water/retention cues** rather than fully physically modeled ponds. Pathways and parking arrangement remain preview-level heuristics, not a final sidewalk-to-door navigation/parking-aid system.

## Historical issue treatment

WORLD-003 is still open and visually failed on `main`; no claim is made that its original separate quad renderer was repaired. This branch uses a different technique on an already-rendered ground mesh. The failed WORLD-006 GEO-R1 lineage is excluded entirely; no GEO-R1 branch, R1 geometry, roads, building profile or rejected shader changes are reused.

## Engineering/visual gates and outstanding caveats

| Stage | Implemented artifact | Evidence / outstanding work |
| --- | --- | --- |
| D0 | Approved thirteen element classes and technical plan | Owner authorized stage execution; docs plan remains separate. |
| R0 | Reuses known rendered ground instead of WORLD-003 quad batches | Real Chrome/Android field screenshot still needed; no claim of new GPU pixel acceptance without a device inspection. |
| P1 | CitySpec-derived bounded 1 m occupancy map | Does not yet use robust polygon clipping or full lot/door footprint ownership; visible seams/collisions must be checked. |
| P2 | Ground forecourts, pedestrian paths and driveways visually classified | No new physics changes; door/vehicle access is heuristic and requires in-game QA. |
| P3 | Coherent class-level parking/service asphalt and paint | Bay paint is raster detail rather than validated parking graph; check road/sidewalk overlaps. |
| P4 | Grass, planted islands, verges, gravel and hardstanding pixels | Mobile mipmap/tiling and actual day/night appearance not yet visually approved. |
| P5 | Two selective shallow water/rain-garden classification modes with green banks | No basin depth, water contact physics, true hydrology or separate water shader; owner may request a later physical water pass. |
| P6 | TypeScript check, repository tests, build and manual preview | Vercel READY is delivery evidence only. Need mobile/desktop pixel QA, performance baselines, route and movement checks, and separate release approval. |

## Visual checklist for operator

1. Load /game?gtdGround001=1 on the dedicated preview URL, wait for full Voight/cars/world first frame.
2. Fly to approximate owner screenshot: both Mercer/Foundry roads, pocket green, east grey tower, west blue tower, garage. Confirm previously brown interiors are now intentional paving/parking/grass/yard, without hiding buildings.
3. Approach street-level hardstanding and parked cars; inspect scale of stall stripes, concrete joints and grass boundaries for flat-image artifacts.
4. Check that garage entrance and vehicle entry/exit, front door and sidewalk are not visually/physically obstructed.
5. Inspect the water/retention cues; they are **not** deep ponds and should not be accepted as physically interactive water.
6. Set night mode and compare material brightness, retained approved night lighting, and mobile raster clarity.
7. Compare the exact same view against /game?gtdGround001=0.
8. In browser console, `window.__GTD_GROUND_REPORT__?.()` for category allocation. This is not a substitute for screenshots.
9. Capture actual desktop and Android Chrome screenshots and console errors, especially shader compilation and first-frame witness, before final visual acceptance.

## Release decision

This document describes a **preview candidate**, not a passed visual/pixel/performance gate or a final 13-element production-ready city system. Do not merge into main or deploy to production based only on strict build/test results. The user is actively observing and may direct further work; after visual acceptance, perform cleanup of preview-only Vercel command overrides and seek explicit final merge/production permission.
