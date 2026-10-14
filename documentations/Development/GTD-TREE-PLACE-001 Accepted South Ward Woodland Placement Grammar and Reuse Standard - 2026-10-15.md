# GTD TREE-PLACE-001 — Accepted South Ward Woodland Placement Grammar
## Visual milestone and reusable generator standard

**Recorded:** 2026-10-15  
**Project:** G.T.D / Grand Theft Division — Meridia → Meridian City → South Ward → First Light  
**Milestone:** VISUALLY ACCEPTED — Mercer-side woodland density and placement composition  
**Scope:** Owner accepted the appearance and placement strategy in the **30-tree-cap** preview, not a production merge, measured mobile performance, or the 36-tree-cap option.  
**Experimental branch:** exp/tree-place-001-mercer-woodland-density-20261015  
**Milestone code commit:** 979a290cd8097b4c5d47a1e169e3fc63ea10c9a0  
**Preview:** https://gtd-cuufcemp5-interlinkglobaltech.vercel.app/game?gtdGround001=1&gtdTreePlace001=1&gtdTreeDensity=mercer&gtdTreeBudget=30  
**Source of truth:** documentations/Meridia First Light Implementation Plan.md  
**Related plan:** documentations/Development/GTD-TREE-PLACE-001 South Ward Procedural Urban Forestry Technical Implementation Plan - 2026-10-14.md  
**Code references:** src/game/world-generation/urban-forestry-plan.ts, street-context.ts, src/test/tree-place-001-mercer-density.test.ts

---

## 1. Decision and design doctrine

**The number of trees is secondary to their placement and their relationship to the buildings, roads and open grassland.** The initial sparse experiment made South Ward appear inhabited but retained large empty lawns. Uniform densification would make it a random forest rather than a believable district. The accepted revision puts the principal woodland mass **on one open, underbuilt side of Mercer Street beside/behind the garage**, while keeping several separate, lighter placements within the rest of the built-up ward.

This is a visual milestone: the owner confirmed that the 30-cap preview has a **decent amount of trees for South Ward** and that the **placing matters as much as the quantity**. Repeat this spatial composition logic elsewhere; do not copy screenshot positions or turn a visual trial into a rigid global tree count.

**Principle:** Underbuilt continuous green land supports stronger woodland grouping; built-up spaces support restrained architectural planting; circulation and landmark visibility always remain deliberate negative space.

South Ward is still being developed. **Do not yet ring the entire ward with trees**: additional buildings, roads and neighboring districts will change future plantability. One-sided woodland is an intentional intermediate urban form, not an accidental omission.

## 2. Accepted spatial composition

### A. Primary woodland side

- Favor the large grass region on the same side of Mercer Street as the garage — the visually open foreground where the humanoid was shown flying.
- Use multiple uneven grove groups across a broad frontage, not a continuous line or a uniform Cartesian grid.
- Allow a woodland-like mass from above, while keeping distinct clearings, street approaches and walkable passages at ground level.
- Make the density transition toward shops/buildings less concentrated; foreground green need not become a fully closed forest.

### B. Secondary architectural trees

- Add a smaller number around existing South Ward buildings where meaningful free grass and canopy clearance exist.
- Trees should soften construction density but should not block shop frontage, garage access, sidewalks, streets, intersections or skyline views.
- Respect the existing authored trees and public-space fixtures (bench, bin, shrubs, lights).

### C. Deferred outward expansion

- Retain woodland-pocket and green-corridor concepts for future districts.
- Do not plant around every outer edge before the built fabric exists.
- Recalculate or version tree siting explicitly if a new block, lot or road will occupy what is currently free grass.

## 3. Actual implementation — mechanics to preserve

### 3.1 Isolated feature controls

The code keeps **three original authored trees** with no experimental flag. The same native procedural tree appearance and accepted GRN-01 generated grass remain untouched.

Experiment controls:
- Control: ?gtdGround001=1
- Earlier distributed strategy: ?gtdGround001=1&gtdTreePlace001=1&gtdTreeBudget=24
- **Accepted spatial mode:** ?gtdGround001=1&gtdTreePlace001=1&gtdTreeDensity=mercer&gtdTreeBudget=30
- Lower-focused density comparison: substitute gtdTreeBudget=24
- Unaccepted higher-density comparison: substitute gtdTreeBudget=36

The accepted 30 is a **maximum additional-tree budget**, not an asserted measured planted count. The pure plan output reports the actual tree total and distribution. The default focus remains balanced unless gtdTreeDensity=mercer is explicitly set.

The supported cap values are 0, 6, 12, 18, 24, 30 and 36. Increasing a focus-mode cap preserves the prior accepted seed-prefix positions.

### 3.2 Identify the open side through geometry

The present helper, mercerOpenSide(...), resolves the First Light garage anchor (sw-fl-garage), finds the closest Mercer Street segment, projects the garage to that road, then computes a unit vector from that projection toward the garage. That vector is the **open-side normal**, while the road direction supplies a **tangent** to orient the planting bands.

The classification onOpenSide(...) requires an outward projection of at least **8 metres** from the garage. The present coordinates place this area north of Mercer Street, but **north is not a universal rule**.

**Future reuse:** replace the experimental garage ID and street-name lookup with an explicit district-specific planting anchor, frontage/road graph relationship, and plantable-side policy. Keep the geometry-derived local frame; never hard-code image-screen coordinates.

### 3.3 Five irregular woodland planting bands

mercerWoodlandCandidates(...) currently:
1. Divides the longitudinal region into **five** bands.
2. Samples open land on a **3.7-metre grid**, with stable seeded jitter of approximately ±1 metre.
3. Screens centroids for distance from the garage in the open direction: **14–32 metres**.
4. Rejects centroids failing conservative clearance and scores surviving ones for openness and a preferred depth around **23 metres**.
5. Selects a best eligible centre in each band.
6. Produces up to **25 exploratory positions per band** using a seeded, irregular radial spiral with angle increment about **2.39996 radians** and a radius increasing with square-root candidate index.
7. Discards off-side candidates, then **round-robins candidates across the bands** rather than saturating the first grove.

This yields recognizable woodland clusters with variable tree gaps rather than an artificial repeated tree row. The five-band grid/radial values are **South Ward tuning parameters**; reuse their mechanism, not their numerical values, in districts of different sizes.

### 3.4 Asymmetric population priority

focusedDensityCandidates(...) arranges roughly **four major-side candidates for every one candidate elsewhere** from the existing architectural/woodland planners. Candidates elsewhere are filtered so the favored open side is not accidentally doubled by the secondary path. The final accepted ratio is **not necessarily exactly 4:1** because rejected trees still consume candidate attempts.

The 30-cap automated contract establishes:
- **At least 18** newly accepted trees.
- **At least 70%** of accepted additions located on the selected side.
- **At least 16** accepted positions from the Mercer woodland cluster zones.
- **Some** added trees elsewhere, but **no more than eight** elsewhere.
- Unique stable IDs and deterministic exact reruns.

The focused mode currently uses an internal woodland category cap of 33 and architectural cap of four; the selection budget and clearance may reduce final counts. The focus-mode candidate list intentionally does not independently add the separate corridor category. Its purpose is **one-sided woodland realism**, not completing every future corridor.

### 3.5 Clearance is nonnegotiable

The shared clearPosition(...) gate rejects candidates colliding with:
- world bounds and canopy-aware boundary margins;
- roads, sidewalks and intersection influence areas;
- rotated building footprints and facade-canopy buffers;
- garage vehicle entrance, other explicit access anchors and the First Light spawn protection;
- authored trees, streetlights, cars, shrubs, benches and bins;
- previously selected generated trunks, with a separation minimum of **6.2 metres**, increased when canopy projections require it.

A failed candidate is **not** force-placed to meet the tree cap. No new grass meshes, water, decorative fences, photo-leaf assets or terrain surfaces are required to achieve the accepted composition.

Road/sidewalk clearance currently uses conservative analytic envelopes. Before reusing the planner in a more complex neighborhood, integrate actual expanded street junctions, curb cuts, doors and revised building footprints.

### 3.6 Determinism, rendering and physics

Each accepted tree has a seed and stable zone/index ID derived from the city ID, generator version and featureRandom(...) namespace. It keeps the **existing procedural trunk and foliage**, not the rejected photo-leaf experiment.

All generated tree records join one authoritative street-context plan reused for both Babylon rendering and Rapier trunk collisions. The existing authored three trees remain fixed. Repeated runs with the same world inputs are identical, and the focused-mode budget sequence **6 → 12 → 18 → 24 → 30 → 36** preserves earlier accepted positions.

Future world growth may require a versioned seed migration to keep accepted neighborhood planting stable if parcels or roads change. Do not silently reshuffle trees simply because a neighboring neighborhood is loaded.

## 4. Cost, measurable evidence and acceptance boundaries

Per additional native tree, current expected cost:
- ~**35 Babylon meshes** (one trunk, four root meshes, 30 foliage cards);
- **30 alpha foliage cards**;
- **one static Rapier trunk collider**;
- shared existing materials, no per-tree photographic textures.

A theoretical full +30 would add roughly **1,050 meshes, 900 foliage planes and 30 colliders**. These are **model estimates, not observed draw calls, FPS or GPU milliseconds**.

The experimental runtime exposes window.__GTD_TREE_PLACE_REPORT__() with generated totals, side/elsewhere breakdown, rejection reasons, scene counts and wall-clock median/P95 frame-time samples after a warm-up period.

**Evidence captured:** owner visually approved the composition/density of the 30-cap preview; the implementation passed **267 tests across 65 test files**, including the focused-mode regression tests.

**Evidence not captured:** exact runtime accepted count for the owner's session; desktop-versus-mobile median/P95 timings; GPU overdraw measurements; final mobile performance acceptance. Do not upgrade visual signoff into a quantified performance claim.

For other regions or further density experiments, preserve identical device, graphics preset, render resolution, camera itinerary, time-of-day and warm-up conditions when comparing cost to the B0 scene. Any perceptible stutter, collision problem, unusable route or regression of mobile image quality invalidates a density increase regardless of visual appeal.

## 5. Repeatable policy for other parts of Meridian

Carry forward the **placement hierarchy**, not garage-specific identifiers:

| Stable doctrine | Per-district inputs to adapt |
| --- | --- |
| Forest-like mass in open, underbuilt land | Selected frontage/open-space region and local planting objective |
| Geometry-derived open side relative to roads | Authored anchor, adjacent road segment, local normal/tangent |
| Multi-band irregular groves with visible clearings | Plantable bounds, number of bands, cluster/radial scales |
| Light secondary trees among buildings | Parcel layout, access zones, architectural sightline priorities |
| Hard collision and movement clearance first | Real junctions, future road mouths, new garage/door anchors |
| Seeded repeatability and budget monotonicity | City/zone seed namespaces and controlled migration |
| Shared visual and Rapier ownership | Existing terrain/renderer and physics contract |
| Composition and actual frame cost evaluated together | Target hardware, graphics settings, local performance limits |

**Reapplication sequence:** map new buildings/roads; select suitable woodland priority area; run the geometry-derived planner; validate hard exclusions; inspect pedestrian/flight views; measure device frame-time delta; approve a region-specific density. Different neighborhoods can intentionally favor architectural greenery over outer woodland, or reverse the balance. No global uniform tree density should be imposed.

## 6. Governance, freeze and next subject

**Accepted:** procedural grass and trees, existing three authored trees, deterministic geometry-aware planting, dense-but-irregular garage/Mercer open-side woodland, light added planting elsewhere, and 30-cap visual composition as reference for South Ward.

**Not accepted by implication:** additional trees around every perimeter, 36-cap as default, automatic production/main merge, new tree assets/vertical gardens, different lighting, or unmeasured device-performance claims.

**Milestone scope complete for documentation.** Preserve this branch's vegetation state during the next workstream unless the owner explicitly reopens it. The next focus is **traffic**: distinguish currently authored/parked vehicles from a real moving-vehicle system, then define traffic routes, intersections, behavior, collision and performance independently of tree placement. Any road-network expansion must preserve safe planting offsets and avoid silently converting accepted landscaping into obstacles.

**Status: VISUAL MILESTONE ACCEPTED; SOURCE AND REUSE STRATEGY RECORDED; LIVE PERFORMANCE AND PRODUCTION PROMOTION SEPARATE.**
