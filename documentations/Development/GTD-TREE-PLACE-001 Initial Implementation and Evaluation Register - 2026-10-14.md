# GTD-TREE-PLACE-001 — Initial Implementation and Evaluation Register

**Date:** 2026-10-14  
**Status:** Implementation committed on preview branch; owner visual and mobile performance acceptance pending  
**Branch:** feat/tree-place-001-south-ward-forestry-20261014  
**Approved plan:** documentations/Development/GTD-TREE-PLACE-001 South Ward Procedural Urban Forestry Technical Implementation Plan - 2026-10-14.md  
**Baseline:** GRN-005, three authored procedural foliage trees and accepted GRN-01 grass

## Scope implemented

- A deterministic pure TypeScript forestry planner based on current CitySpec, building geometry and road alignment, with no newly authored per-tree positions.
- Three planting categories: architectural landscaping between buildings, geometrically discovered open-space woodland groups, and green routes behind/adjacent to the two skyline towers leading outward. Viable corridor terminal positions also generate woodland-pocket candidates.
- Hard restrictions for city bounds, major roads/sidewalks/junctions, rotated building footprints, access paths, existing props and trees, and generated-trunk spacing. Physically infeasible routes are marked unresolved, not silently forced.
- Population experiments with nested budget caps +0/+6/+12/+18/+24. Caps are upper limits and the algorithm may accept fewer if clearance constraints demand it.
- One immutable street context plan consumed by both Babylon tree rendering and Rapier physical tree colliders. No materials, tree geometry, procedural grass, road, vehicle or building changes.
- Default-disabled URL switch and read-only runtime witness of actual placed population, rejection reasons, zone counts, routes, mesh/material/texture count and sampled frame times.
- Automated tests for initial three authored tree preservation, deterministic and nested IDs, footprint clearance, all three zone contributions, collider parity and complete disposal.

## Resource model, not a measured browser benchmark

Each additional accepted tree currently generates one tapered trunk, four woody root flares, 30 foliage planes and one static Rapier trunk collider. The estimated maximum additions at +6/+12/+18/+24 trees are respectively +210/+420/+630/+840 Babylon meshes, +180/+360/+540/+720 foliage planes and +6/+12/+18/+24 colliders. Actual accepted counts may be lower. These are object-count estimates, NOT observed GPU draw calls, VRAM use or measured FPS.

## Preview parameters

Control: ?gtdGround001=1
B1: ?gtdGround001=1&gtdTreePlace001=1&gtdTreeBudget=6
B2: ?gtdGround001=1&gtdTreePlace001=1&gtdTreeBudget=12
B3: ?gtdGround001=1&gtdTreePlace001=1&gtdTreeBudget=18
B4 (conditional): ?gtdGround001=1&gtdTreePlace001=1&gtdTreeBudget=24

At any budget open browser developer console and call window.__GTD_TREE_PLACE_REPORT__() for generation metadata, accepted zone counts and local render metrics. The witness discards 15 seconds of warm-up, retains up to 3,600 frame times, and reports median/P95 wall-clock frame times. Compare matched camera paths at the same physical resolution and graphics preset on desktop and mobile landscape.

## Evidence and limitations

- Initial implementation build and regression suite passed 264 tests. The updated corridor-endpoint woodland trial also passed pure planning tests requiring architecture, woodland and corridor categories; full final deployment validation remains a separate build gate.
- NullEngine testing is not a substitute for browser image verification or realistic frame-time and GPU-overdraw profiling.
- Road-space occupancy is conservatively approximated from road and sidewalk widths plus junction buffers; exact first-person clearance and planting aesthetics require on-device owner inspection.
- No real desktop/mobile median or P95 measurements have been captured in this conversation. Do not interpret theoretical counts as benchmark evidence.
- Only owner-approved budget escalation may enter main. The default flag OFF preserves GRN-005 world appearance and collisions.

## Visual acceptance and next step

Open B0 and B1 first. Verify irregular but intentional front-lawn groups, trees integrated beside towers and shops, open views to storefronts, and preserved access. Escalate to B2/B3 only after acceptable on-device performance; B4 is conditional on measured headroom. Compare day/night and flight/pedestrian views and record actual frame-time reports.

If clearance, visual composition or mobile performance fails at any population, remain at the lower proven budget or switch off the trial. Do not change tree assets or create new paved/grass objects to disguise the result.

**Awaiting owner visual acceptance; production unchanged.**
