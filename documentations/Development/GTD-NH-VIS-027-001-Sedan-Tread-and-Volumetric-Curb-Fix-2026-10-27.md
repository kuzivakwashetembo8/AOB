# GTD-NH-VIS-027-001 — Sedan Tread/Rim Synchronization and Solid North Heights Curbs

**Date:** 2026-10-27  
**Status:** OWNER APPROVED — IMPLEMENT BOTH IN ONE ISOLATED PATCH; PREVIEW REQUIRED; **DO NOT MERGE MAIN**  
**Source baseline:** accepted / production main `12bafbcac6d2ebd95efd78d1f0facf3118c635e5`  
**Feature branch:** `feature/gtd-nh-wheel-tyre-curb-geometry-20261027`  
**Owner directive:** “Yes, document them then patch in one go. The implementation is fully authorized. Provide a preview link once completed then we'll merge if the visual tests pass and move on to list item 2 of 27 Oct.”

## 1. Observed defects

**WHEEL-OBS-001 — fixed rim/tyre extraction ownership.** In the owner's first screenshot, the black tyre/tread shell visibly stays at a position that does not seem synchronized with the rotating rim, creating a detached/counter-rotating outer appearance. Previously this was logged as GTD-NH-OPT2-SDN-WHEEL-OBS-001. The actual accepted GEN-VEH-009 traffic renderer already composes the **same rolling and steering transform** for every wheel's source-derived `tire` and `rim` buckets; simply rotating the existing tyre bucket harder is not the correction.

**Root cause located in actual source GLB metadata + extraction code.** The original `public/GLBs/Cars/Four Door Sedan.glb` has `107 reused Sculpted_tyre` nodes (one per corner), and also four `Siped tread blocks` mesh nodes (indices 268–271; named `Siped tread blocks` and three `.001/.002/.003` variants). The GEN-VEH-007 `knownWheel` matcher for Sedan is anchored to `107 reused (` and consequently **excludes all four `Siped tread blocks`**. `rimOrTire` would otherwise identify them as tire geometry because their names contain “tread”. Omitted tread is passed to `parts[groupFor(...)]`, retained as stationary trim/body geometry. The separate tyre and rim transform in `src/game/experiments/north-heights-sedan-traffic-009.ts` therefore moves the interior assemblies but leaves the visible tread as static exterior.

**CURB-VIS-001 — side-level sidewalk paper geometry.** The owner's second screenshot shows a floating grey slab. `src/game/experiments/north-heights-roads-003.ts` already creates the top pavement surface at 0.20 m above `northHeightsGround()` and a narrow inner curb wall only at street-run edges between 0.075 m road top and 0.20 m pavement top. It does **not** close the opposite exposed outer boundary of the walk nor the two exposed roadway-facing sides of the junction's corner-pavement pads. It is visually an unclosed sheet.

## 2. Wheel acceptance contract

- Correct Sedan wheel classification **at source extraction**. `Siped tread blocks` nodes, including numeric suffixes, belong to wheel **tire** buckets, *not* static body or trim. Preserve existing `107 reused` parts and correct four-corner grouping; leave source GLB untouched.
- Preserve accepted painted body, window/glass and trim counts/geometry as far as these components are unrelated; no new wheel/tyre substitute GLB, no displaced pivots, no second wheel copies or meshes outside the accepted original native thin-instance renderer.
- Each complete wheel (source tyre carcass + tread + rim) receives the existing shared roll and appropriate front steering transform. Four rims, four tyres with added outer tread and four wheel centers remain in the exact source placement. Regression tests must ensure the four tread meshes are actually assigned to rotating buckets, not just that a rolling tire bucket exists.
- Correct roll signedness for free-driving reverse: use signed longitudinal movement for a manually driven Sedan; keep position/distance-derived motion for 124 other AI Sedans and preserve stationary-pose no-rotation behavior.
- Keep source-node and triangle budgets bounded for all 125 Sedans and ensure all original source material/data and 12 paint variants remain intact.

## 3. Curb acceptance contract

- Maintain road grid, aligned 2-lane asphalt, accepted lane/crosswalk batches, 0.075 m asphalt elevation and 0.20 m pavement top; do not change street/parking layouts or wall-collider logic.
- Construct **complete volumetric sidewalks**: flat exposed concrete top, actual low interior curb face, full outer fascia to the graded ground at each sample, and junction-corner pad faces on all exposed sides; optionally add base/closure triangles for a geometrically closed shell.
- Top and side faces follow `northHeightsGround(x,z)` continuously in both road-axis directions and around four-way corners; maintain crisp joined geometry, no dark special corner shading, no seam z-fighting or suspended top-only ribbons.
- Preserve batching and shared materials; avoid one Babylon mesh per sidewalk block. Use the existing five shared surface meshes and consistent unlit curb material.
- Check all four junction quadrants, exposed outer edges, slopes, from street-level side view and above. Test that curb vertices form a continuous nonzero-volume profile (terrain base, road lip and 0.20 m top) at both X- and Z-axis street runs and at intersections.

## 4. Validation / scope gate

- Re-run full Vercel checks including GLB preprocessing and native source mesh tests, 125-agent renderer/graphics regression, NH003 curb/junction geometry and new targeted tests. No missing offline assets.
- Provide a **preview link only** from the isolated branch. The owner will inspect wheels while driving forward/reverse and curbs from street-side/top views. Do not claim visual acceptance before this.
- **No main merge or production deployment** until the owner explicitly accepts this visual patch.
- Stage 6 free steering, walls, terrain, current traffic AI, other 124 Sedans, Voight, shared UI, mobile/PWA, and zero parked-six GLB requests all remain unchanged.
- The owner's “list item 2 of 27 Oct” is a subsequent milestone and **will not be started in this patch**.

**Implementation order:** document → fix source wheel component grouping → construct volumetric sidewalk/corner sidewalls → add specific tests → run full deployment build → preview → owner visual gate → later explicit merge.
