# GTD-TREE-PLACE-001 — South Ward Procedural Urban Forestry
## Technical Implementation Plan: First Dynamic Tree Population

**Date:** 2026-10-14  
**Project:** G.T.D / Grand Theft Division — Meridia → Meridian City → South Ward, First Light slice  
**Status:** PROPOSED — DOCUMENTATION ONLY; IMPLEMENTATION AWAITS OWNER AUTHORIZATION  
**Planning branch:** docs/tree-place-001-south-ward-urban-forestry-20261014  
**Code baseline:** fix/grn003-grass-tiles-aerial-foliage-20261014 (GRN-005 procedural tree foliage / procedural GRN-01 grass / white blue-tower strips)  
**Authoritative world constraint:** documentations/Meridia First Light Implementation Plan.md (First Light is a representation laboratory, not yet unrestricted district expansion)  
**Companion reference:** Owner's annotated 2026-10-14 South Ward flight screenshot, plus provided green-city architectural/landscape references.

---

## 0. Executive decision and objective

Create the **first procedurally placed population of trees** in South Ward using the **accepted existing game-generated tree appearance**, with no hand-authoring of each additional tree position.

The objective is **credible park-like urban composition and measured viability**, not maximum tree count. Generation must construct three connected landscape behaviors:

1. **Architectural integration:** trees in suitable gaps and green setbacks between buildings, shops, and glass towers, without obstructing their entrances, visibility, or street access.
2. **Urban woodland pockets:** deliberately clustered groups in larger suitable open grass areas and at future neighborhood/block transitions; these function as green anchors separating built-up areas.
3. **Green corridors:** planted sequences along open grassy routes behind or alongside larger buildings, tying building-integrated planting into woodland pockets and outward toward future adjoining districts.

The three behaviors must form a coherent spatial network while leaving **intentional open lawns**. The owner's annotated green marks are **conceptual placement and flow annotations**, not coordinates to copy into source as manually placed trees. In particular, the annotated foreground indicates a larger, irregular population with clear spaces; the edge strokes suggest outward connections and landscaping beside the towers; smaller marks among buildings indicate restrained planting.

**Success:** tree groups appear lively and semi-futuristic-green-city in street, ground-up, and flight views, and every accepted placement satisfies spatial constraints and a measured desktop/mobile resource budget. **Failure:** tree count rises but the city becomes a random forest, obstructed street, or an expensive collection of overlapping cards.

No runtime implementation, asset import, world change, merge, or deployment is authorized by this plan alone.

## 1. Scope / exclusions and locked visual doctrine

### In scope

- Seeded **placement** and density planning for the existing First Light tree model.
- Spatial reading of road/sidewalk geometry, building footprints, entrances and existing props; create a plantable-space mask **for planning only**.
- Zone intent classification: architectural integration, woodland pocket, connector corridor, and intentionally retained open lawn.
- Candidate generation, reproducible filtering, clash/clearance checks, author-vs-generated preservation, per-zone reporting, and constrained count escalation.
- A preview-only opt-in switch and four small, reproducible population budgets for cost testing.
- Geometry/collider/shadow/material-count diagnostics and independent desktop/mobile field acceptance.
- The ability to preserve coherent planting transitions when neighboring chunks/districts are added later, without generating new districts in this iteration.

### Explicitly out of scope

- New tree models or species, larger foliage textures, generated photographic leaves, green roofing, vertical gardens, planter balconies, terraces, rooftop parks, vegetation wind, seasonal growth, different bark, changed shaders, or foliage-card redesign.
- Grass-image experiments, grass surface editing, land-use reassignment, pavement/parking/water, new grass blades or landscaping terrain patches.
- New streets, sidewalks, road caps, barriers, pedestrian paths, footpath meshes, bridge geometry or new neighborhoods. A **corridor** means a navigable/landscaped route through existing grass; it does not mean constructing a new paved path.
- Changes to Voight's movement, physics, vehicle handling, buildings, window rules, glass frames, day/night lighting or existing camera settings.
- A blanket performance optimization pass before evidence establishes the vegetation bottleneck.
- Automatic changes to main or production Vercel deployment.

**Locked look:** the existing GRN-005 code-generated foliage, bark, tree geometry, existing pocket shrubs, GRN-01 procedural grass and accepted South Ward building/road surfaces are preserved. The first experiment changes **where additional copies of the same tree appear**, not what the tree looks like.

## 2. Verified source baseline, cost model, and implications

Source files inspected on the planning base:

| Concern | Source / verified behavior | Design consequence |
| --- | --- | --- |
| Authored trees | src/game/world-generation/first-light-spec.ts — exactly **three** authored tree placement records: one by garage, two by pocket green | Preserve these IDs and positions; dynamically generate additional trees without replacing or reassigning them |
| Street planning | src/game/world-generation/street-context.ts — planStreetContext currently collects authored vegetation, adds shrubs/props and deterministically places streetlights and parked cars | Add a pure forestry planner whose output is composed with authored items BEFORE final sorted/deduplicated plan |
| Native appearance | src/game/world-generation/tree-canopy.ts — 30 card placements in 10 groups × 3 with deterministic angular/size variation | Do not change canopy representation; added instances inherit the existing tree visual grammar |
| Mesh footprint | src/game/world-generation/street-context-renderer.ts — 1 tapered trunk cylinder, 4 root cylinders, 30 image-based foliage planes, one TransformNode per tree | Each additional tree means about **35 Babylon meshes**, before batching/culling; not 1 cheap sprite |
| Collision | src/game/world/generated-first-light-world.ts — a static Rapier trunk cylinder is created for each planned tree by registerStreetContextCollision | An added tree means **one more static trunk collider**; avoid duplicate registration or physics/render mismatches |
| Shadows | generated-first-light-world.ts — street-context meshes are generally registered with the environment shadow generator | Added trees may multiply shadow work, especially translucent cards; measure shadow-caster cost before any density increase |
| Current grass | src/game/world-generation/ground-land-use.ts — the GRN-01-only planner covers **160×130 m = 20,800 one-metre cells** in the present First Light scene | Every free grass cell is NOT automatically plantable; road, sidewalk, building and access exclusion tests are mandatory |
| Roads | first-light-spec.ts defines **8 m** roadway width and **3.75 m sidewalks** on the authored road segments; road-graph.ts also models junction geometry | Build exclusions from actual road/junction/sidewalk polygons, not a simplistic road centerline or ground material type |
| Determinism | src/game/world-generation/seeded-variation.ts — featureRandom(seed, generatorVersion, featureKey), not shared sequential random state | Allocate feature keys from stable zone and candidate IDs; changing a tree in one zone must not reshuffle other zones |
| Current reference | documentations/Meridia First Light Implementation Plan.md — grounded cinematic stylization and mobile viability outrank raw photorealism | A semi-futuristic green district is achieved through coherent urban landscaping, **not** importing futuristic art assets |

A count-only thought experiment: +6 trees adds approximately 210 meshes, 180 foliage cards, 6 nodes and 6 static colliders; +12 adds ~420 meshes / 360 cards / 12 colliders; +18 adds ~630 meshes / 540 cards / 18 colliders; +24 adds ~840 meshes / 720 cards / 24 colliders. These are **theoretical object-count deltas**, not measured draw calls or projected FPS. Scene meshes may be batched, culled, or shadowed differently; prove the actual render cost in-browser.

The First Light slice is not already a general multi-neighborhood GIS system. Its schema has one current neighborhood and a pocket-park semantic space, and authored lot sizes/buildings/roads. Woodland separators in TREE-PLACE-001 are thus **candidate open-space and block-interface pockets**, not invented existing neighborhood boundaries. Reserve future link continuity by recording metadata rather than hallucinating roads, parcels or district topology.

## 3. Visual and landscape grammar

### 3.1 Architectural integration (A-zone)

Input signals: nearby building envelopes/lot extents, building height/category, available grassy setbacks, facade/entrance orientation, road adjacency.

Rules:
- Favor **small offsets / irregular pairs or trios** between neighboring buildings, around tower perimeter lawns, and beside shop courtyards where the available width actually supports a canopy.
- Treat podium towers as high-profile anchors, but **never surround them uniformly** or obscure the white mullion/blue glass and dark-mullion/grey glass facades.
- Keep all building portals, the garage entrance and its vehicle approach, shop storefronts, sidewalk connections and practical sightlines usable. Do not plant at a facade simply because its facade category is "green-friendly."
- Permit clear asymmetry: some gaps receive no tree; an architectural sequence should not look like repeated identical intervals or tree walls.
- Trees remain planted on existing grass (Y grounded using terrain semantics) and never on a roof or an added planter in TREE-PLACE-001.

### 3.2 Urban woodland pockets (W-zone)

Input signals: connected open-grass regions with enough **usable area after exclusion buffers**, existing semantic pocket-green region, edges of built block groupings and future district-facing boundary hints.

Rules:
- Form multiple **irregular 2–5-tree local groups** with nonuniform separation; retain usable visual and navigable gaps between group members.
- Prefer viable zones that can serve as **ends / intermediate anchors** of corridor connections.
- Keep some central open lawn, rather than carpeting all available land with trees. Negative space is an intentional output of the planner.
- Existing authored trees near the pocket-green space are **hard anchors**, counted when computing local crowding and canopy gaps; no extra sharp-edged turf slab returns.
- Woodland pockets must remain recognizable as public/open greenery; trees are not individually hand-authored coordinates.

### 3.3 Green connector corridors (C-zone)

Input signals: target woodland pocket centroids/entrances, exposed side/rear edges of large buildings (particularly towers), suitable residual grass and future boundary reservations.

Rules:
- Compute a **connected candidate grass route** from building-integrated planting to a woodland pocket, and where meaningful from a pocket toward a reachable outer boundary sector. Do not assume the current edge is a real next district or place vegetation across a future road mouth.
- Use short tree sequences adjacent to that route, with an intermittent visual canopy; vary spacing and planting side. Do **not** plant trunks across the intended traversable central clearance.
- Maintain a clear navigable strip of **at least a proposed 2.5 m width** between trunks and hard obstacles; verify effective clearance using actual trunk collider radii, not just tree centres.
- Preserve roads, sidewalks, curb cuts, intersections and garage approach; tree canopy may visually soften a corridor but cannot create a barrier.
- If no lawful connected route exists, output **"unresolved corridor" with reason** and do not force a line of trees through obstacles.

### 3.4 Open lawns (O-zone, exclusion from planting)

Input signals: regions required for walkability, good views into buildings, gameplay/spawn access, vehicle movements, intentional visual breathing room.

Rules:
- Designate unplanted holes and grass clearings explicitly, especially in the annotated foreground where clustered tree groups must not block the entire view or movement.
- Retain visibility of major buildings from several approach angles; the park-like target is **varied canopy rhythm**, not uniform closure.
- Area left unplanted is neither a failure nor an invitation to add another species. Grass remains the approved procedural GRN-01.

**Suggested priority:** Hard-safety exclusions → retain existing authored vegetation/props → protect open lawns and movement corridors → fit woodland pocket anchors → fit architectural greenery → connect corridors → limited sparse supplementary singles if a zone is still visually empty. These are qualitative priors; avoid forcing equal counts across categories when there is insufficient space.

## 4. Technical planner architecture

### 4.1 Pure planning contract

Introduce a pure TypeScript module, proposed location:
- src/game/world-generation/urban-forestry-plan.ts
- src/game/world-generation/urban-forestry-zones.ts (only if extraction improves testability)
- optional small separation helper for geometry/masks if existing road-graph utilities are insufficient.

Proposed conceptual API (names subject to audit when coding):

    planUrbanForestry(city: CitySpec, options: ForestryPlanOptions): ForestryPlan

Where ForestryPlanOptions includes:
- generatorVersion and schema-valid city/region identity;
- the *current* First Light terrain bounds and road/building plans;
- enabled/disabled mode, a small integer budget cap, and optional diagnostic zone filter;
- fixed forestry version namespace, deliberately independent of unrelated feature random calls.

Return:
- immutable generated tree placements using **existing** StreetContextItem tree semantics;
- unique stable ID/seed/provenance, zone ID, zone type, and supporting clearance reason;
- per-zone attempted / accepted / rejected-with-reason counts;
- candidate zone footprints and corridor route metadata for diagnostics;
- tree count, estimated 35-mesh/card/collider cost, protected-open-space area and explanatory coverage metrics;
- no direct Babylon, Rapier, React, network, time, or Math.random calls.

Do **not** extend CitySpec with arbitrary tree coordinates. If future per-district policy parameters are necessary, add typed optional fields after confirming cross-scene compatibility. For the first pass, build zones dynamically from the current city planning data.

### 4.2 Occupancy and clearance mask

The 1 m GRN-01 land raster can bound the search, but it is only **background material**, not a plantable-space guarantee. Construct a broad-phase footprint mask from:

1. Actual asphalt and junction polygons from planRoadGraph, **plus** rendered/extended roads and road mouths.
2. Sidewalk polygons, corner treatments, curbs, curb cuts and reserved links to future road extensions.
3. Rotated building/massing footprint rectangles (including podiums), entrance anchors and any garage vehicle path; include facade buffers.
4. Existing authored tree trunks/canopies, shrubs, bench/bin, streetlights and parked-vehicle envelopes.
5. Player spawn, accessible approach to garage, door approach paths, camera-critical test routes and protected open-lawn zones.
6. A configurable inner world-boundary margin. Only designated **future corridor exit metadata**, not planted trunks, may touch reserved continuation boundaries.

Use a fast coarse occupancy grid or spatial hash as a **broad phase**, followed by exact point-to-polygon and rotated-rectangle / capsule/circle tests. Inflating obstacles must account for candidate **trunk radius** and separately its projected **canopy radius** computed from planTreeCanopy. Do not mistake a free trunk center for guaranteed clearance of its full mature crown.

Proposed initial tunable minimums, to validate before becoming constants:
- trunk-to-building-facade buffer: start around 2 m **plus** any entrance/overhang constraints, with a stricter canopy-edge test to protect architecture;
- trunk-to-trunk separation: start around 5–7 m; woodland overlap may be selectively allowed only when canopy sightlines and collisions are acceptable;
- no trees within any sidewalk or driving polygon, even if the ground below is green;
- maintain >=2.5 m unobstructed pedestrian corridor where the zone design depends on passage;
- authored structures and major access corridors: **hard rejection**, never merely a score penalty.

Compute clearance using the actual canopy envelope (currently ~4 m radius depending on scale), not a hand-waved fixed 2 m image silhouette. A candidate that cannot fit after these constraints is rejected; never clip geometry through a facade simply to reach the population budget.

### 4.3 Deterministic candidate generation

1. Derive stable site identifiers from city/district/neighborhood, block/road semantic IDs and local patch/cluster IDs.
2. Use featureRandom with feature keys such as "tree-place-001:{zone-id}:{candidate-index}:{property}" or an equivalent stable scheme, never Math.random or time.
3. Generate candidate clusters by **jittered cluster sampling** (centroid plus bounded angular/radial offsets); use constrained spacing or Poisson-like sampling for independent trees; use bounded jitter along a spline/piecewise-linear corridor centerline for corridor trees.
4. Assign each candidate a **stable deterministic priority** so the budget can select a nested prefix of valid candidates: +6 trees remains the same six when scaled to +12 or +18 (unless an explicit changed planning-version migration is approved).
5. Deduplicate by ID and spatial occupancy, sort candidate comparisons deterministically (fixed tie-breakers, stable IDs), preserve untouched authored tree records.
6. Run the same spatial validation over generated and authored trees for warnings, but **do not silently move** authored trees in this pass. Existing authored conditions are source truth and treated as occupied anchors.

Avoid a shared sequential RNG whose output shifts when more buildings or zones are inserted. For future chunk boundaries, use fixed zone keys and a priority-based arbitration/halo check across neighboring generated sectors; if adjacent sectors are unavailable, reserve edges without claiming a fully built neighboring district.

### 4.4 Scoring and selection: logic supports composition

After passing all hard-clearance gates, score candidate zones or positions based on:
- architectural complement: viable garden space, relationship to building scale/setbacks, avoidance of entrance occlusion;
- green connectivity: contribution to woodland-to-corridor spatial graph rather than merely nearest already planted tree;
- pocket formation: local 2–5-tree grouping quality and distinguishable open clearings;
- natural rhythm: no systematic rows outside genuine street corridors, modest cluster asymmetry;
- view quality: protect landmark skyscrapers/shop facades and player sightlines;
- future links: do not turn corridor exits or road mouths into impassable wooded borders;
- estimated new canopy overlap and incremental rendering cost;
- district identity: South Ward stays a working/residential urban neighborhood with a green-city influence, **not** a luxury resort or dense forest.

Only soft visual fitness is scored. A collision, sidewalk, doorway or open-route violation is an outright reject. All score weights must be configurable and witnessable; initial weights are hypotheses, not owner-accepted landscape truths.

### 4.5 One plan shared by rendering and physics

Today, createGeneratedStreetContext and registerStreetContextCollision both call planStreetContext separately. Determinism presently aligns them, but a growing forestry planner can increase drift risk if passed inconsistent options.

Prefer computing **one authoritative StreetContextPlan** per world initialization and passing the same immutable plan to the render and Rapier collision adapters (or prove byte-for-byte identity if a compatibility path demands recomputation). Preserve all current API call sites and tests when refactoring. Every accepted generated tree gets:
- 1 procedural trunk cylinder, 4 root flares, 30 shared-material foliage planes, stable TransformNode;
- 1 matching Rapier static trunk cylinder;
- correct shadow registration/disposal per current lifecycle;
- stable ID/metadata for debugging and comparing revisions.

No additional photo textures, shrub replacements or per-tree duplicated material objects.

## 5. Incremental population and evaluation design

**Do not select 30–100 trees as an initial artistic declaration.** The annotated screenshot calls for a noticeably more planted South Ward, but our current per-tree geometry cost is material.

Use a **nested experimental population**:
- **B0:** +0 generated trees; three accepted authored trees; strict baseline.
- **B1:** up to +6 generated trees; prove feasible mix of architectural and grove locations with clear passage.
- **B2:** up to +12 generated trees; add a meaningful pocket and first corridor connection.
- **B3:** up to +18 generated trees; assess aerial urban-forest composition and performance.
- **B4 (conditional ceiling):** up to +24 generated trees **only if** prior measured results justify extension.

These are **caps, not mandatory quotas**. A planner must be allowed to output 8 of 12 because only eight safely fit; report shortage by rejection category rather than violating safety. Budget ordering must be stable and reproducible. Preserve the original three trees in every case.

Visual composition requires reasonable participation from all three requested zone types where valid geometry permits it. If the current scene cannot yield an actual corridor connection, document the failed route and do not fake success by counting unrelated roadside trees.

Recommended experimental flags (planned, not implemented):
- ?gtdGround001=1&gtdTreePlace001=1&gtdTreeBudget=6
- ...&gtdTreeBudget=12 / 18 / 24
- optional diagnostic overlay enabled separately, never during performance comparison.
- Without "gtdTreePlace001=1": reproduce current GRN-005 vegetation and current grass.

## 6. Performance measurement, incentives, and hard stop conditions

### 6.1 Before adding a single tree

Establish matched baselines on desktop and the target Android landscape/mobile PWA, with the same viewport resolution, graphics preset and camera trajectory. Record at least:
- actual device / browser, canvas physical size and resolution scaling;
- approximate warm-up and fixed measurement duration (propose 15 s warm-up plus >=60 s measurement);
- median and P95 frame times (separately CPU frame and GPU timings if supported);
- average/peak draw calls, active meshes, total meshes, materials, textures, alpha foliage-card count and shadow-caster count;
- Rapier rigid-body/collider count and any interaction/jank;
- startup/scene-generation duration, memory telemetry where browser exposes it, GC spikes, shader/compiler errors.

Measure matched **street-level static**, **walking/camera sweep**, **aerial survey**, and **night** sequences, not just one still. Repeat each at least three times where practical; report device, measurement window and any confounders.

### 6.2 Population cost ledger and provisional performance gates

For each B0→B1→B2→B3→B4 increase report:
- added tree count and area/category/coverage outcomes;
- expected versus actual mesh, draw-call, card, shadow, node and collider deltas;
- median/P95 frame times and relative changes against B0 and immediately previous budget;
- startup, disposal and memory behavior.

Illustrative **review thresholds, subject to baseline measurements**:
- sustained P95 frame-time regression beyond **10% desktop** or **15% mobile** should stop density escalation and trigger analysis, not be marked success automatically;
- any new visible stutter, crash, GPU shader error, unbounded mesh/collider accumulation on reload, or mobile preset breakage is a **hard stop**, irrespective of percentage;
- if the baseline is already under target responsiveness, **even smaller regressions can fail**. Do not use a percentage allowance to excuse a poor mobile frame rate.
- No fixed FPS guarantee or device-specific cost is claimed before field measurement. FPS and frame time are reported together; do not confuse 10% FPS loss with 10% frame-time increase.

Density is an output of **visual value per incremental resource cost**, not a fixed target. A proposal to use thin instances/LOD/shadow pruning is a separate evidence-backed optimization gate, not a silent rewrite of the existing approved tree model.

### 6.3 Shadow and transparency failure awareness

Each tree adds 30 transparent foliage planes. The current environment adds street-context meshes as shadow casters. Watch for shadow-map rendering amplification, depth sorting, double-sided alpha overdraw and mobile fill-rate cost. If a shadow-caster count spikes disproportionately, isolate measurement with shadow instrumentation, then propose the smallest compatible correction for approval. Do not globally disable accepted night lighting or lighting realism to make a tree count pass.

## 7. Verification matrix and exact acceptance gates

### Automated planner tests
- Determinism: same city + options → identical ordered IDs/positions, zone tags and accept/reject witnesses.
- Independence: adding/reordering unrelated authored block/prop data does not reposition trees in unaffected zones.
- Budget monotonicity: B1 accepted IDs/locations persist in B2/B3/B4 unless an explicit versioned planner change is made.
- Geometry: every new tree respects generated road/junction mouths, **rendered sidewalks**, building/rotated mass footprint, entrance and garage approaches, known props, and owned tree root/canopy exclusion logic.
- Accessibility: no collider inside protected 2.5 m pedestrian connectors; corridors with no feasible path return an explicit unresolved status.
- Spatial integrity: no trees beyond current terrain limits or at reserved cross-district/road continuation edges; no two coincident trunks; no tree root inside a non-grass built surface.
- Authored preservation: exactly the original three IDs/positions and their canopy behavior remain unchanged.
- No regression in the GRN-01-only ground and accepted glass/brick/vehicle/street metadata and baseline configuration.
- Load/dispose twice: no accumulated mesh/material/texture/collider/shadow-caster leak.
- Pure planner runs without Babylon or Rapier; renderer uses same shared plan as physics, with total tree collider count = accepted generated + authored trees.
- Seed trace: rejecting a candidate never permits an invalid placement simply because the requested cap has not been filled.

### Browser visual witnesses
Capture matched **before / after** frames at:
1. The annotated foreground lawn: several irregular groups plus visible unplanted passages, no evenly spaced tree wallpaper.
2. Between shops and adjacent buildings: trees soften gaps without hiding all doorways, windows or store fronts.
3. Blue and grey tower grounds: real trees at compatible distances that frame, not blanket, the towers.
4. Behind large buildings toward a woodland pocket: the corridor visually reads as a connection; Voight can walk through it.
5. Pocket center and outer region: clusters feel organic from both street and aerial views.
6. Night and daylight: canopies do not make the area too dark or produce broken visual silhouettes.
7. Mobile landscape: no newly unacceptable resolution reduction, camera lag or instability.

### Owner visual acceptance
Owner should explicitly judge:
- **Composition:** Does the scene look intentionally park-like, lively, and semi-futuristic, while still recognizably working-class South Ward?
- **Connectivity:** Is there a perceptible sequence from buildings → woodland pocket → outward corridor, rather than three unrelated sets of trees?
- **Naturalness:** Do asymmetrical clusters and open lawns avoid evenly distributed rows or a random forest?
- **Spatial truth:** Is every trunk in a believable location and is the world navigable?
- **Cost:** Is the measured benefit worth the actual added draw/shadow/physics/CPU/GPU costs on desktop and Android?

Green-looking screenshots without clearance and benchmark evidence do **not** pass. Passing tests without owner visual acceptance does **not** pass.

## 8. Seven implementation stages with explicit gates (future work only)

| Stage | Work | Deliverables | Gate |
| --- | --- | --- | --- |
| **T0 — baseline and review** | Owner approves this plan; pin GRN-005 code/visual baseline, baseline device metrics and marked-up target view | Frozen branch/commit, baseline screenshots, B0 cost ledger | NO code implementation until authorized |
| **T1 — map spatial constraints** | Implement pure footprint/mask/candidate-zone scanner, including entrance, road/sidewalk and open-lawn reservations | Plan-only debug overlay and numeric planting-zone map; collision/clearance tests | Zero hard-constraint violations |
| **T2 — architectural pilot** | Generate first few site-aware trees near viable tower/shop/building gaps; retain 3 authored | B1 (cap +6) preview, seeded IDs, rejection log, visual checks | Owner/engineering review before increasing density |
| **T3 — woodland pockets** | Add clustered pocket anchor rules and deliberate clearings in larger valid open regions | B2 (cap +12), pocket grouping/coverage, street/aerial comparison | Natural grouping and safe walkability |
| **T4 — connected corridors** | Build candidate route graph and constrained planted edges behind large buildings toward pockets and future boundary reservations | B3 (cap +18), route continuity/feasibility evidence, access tests | Demonstrated continuity or explicit unresolved status; no fake crossing |
| **T5 — measured budget escalation** | Benchmark desktop/mobile; only if acceptable try B4 up to +24; diagnose incremental costs | B0–B4 cost/perceptual-value ledger, shadow and collider data | Stop at highest proven attractive, performant budget |
| **T6 — integration and acceptance** | Full TypeScript/Vitest/production-style preview, PWA desktop/mobile, regression screenshot packet, updated issue record | Owner preview link(s) and decision recommendation; rollback preserved | Owner visual approval; main merge/manual production deployment separately authorized |

Stages should be separately testable. If a visual failure occurs at T3, correct or roll back only the current planting behavior rather than simultaneously changing tree appearance, grass, shadows and geometry. Partial completion is not permission to overrun engineering limits.

## 9. File-level execution outline

Proposed changes, subject to fresh source audit when implementation begins:

- **NEW:** src/game/world-generation/urban-forestry-plan.ts — pure plan, options, zone outputs, scores, rejection diagnostics.
- **NEW / optional:** urban-forestry-zones.ts / urban-forestry-geometry.ts — reusable spatial masks, obstacle inflation, route/cluster helpers.
- **CHANGE:** street-context.ts — merge authenticated authored vegetation and deterministic generated placements under default-OFF opt-in, stable plan and merged counts.
- **CHANGE:** generated-first-light-world.ts — ensure single authoritative plan is handed to renderer and collision, update disposal and debug metrics without changing physics definitions.
- **CHANGE:** street-context-renderer.ts — consume accepted generated tree records with **existing addTree and shared material**, not a new render pipeline; make no per-tree unique materials.
- **CHANGE:** first-light-runtime-source.ts and gtd-runtime.ts — bounded preview flags, default OFF, optional debug instrumentation.
- **ADD TESTS:** src/test/tree-place-001-plan.test.ts; src/test/tree-place-001-clearance.test.ts; src/test/tree-place-001-runtime-budget.test.ts; extend existing street/collision/FL4-canopy tests as needed.
- **ADD DOCS:** a dated TREE-PLACE-001 observational failure log and quantitative results, visual acceptance screenshot references and final selected budget rationale.

Do not modify the existing Meridia First Light master plan except for a **small dated cross-reference** if the owner requests that documentation synchronisation after implementation acceptance. Do not hardcode seed positions by tracing the owner's green-marker strokes.

## 10. Risks, failure taxonomy and rollback

| Failure mode | Observable symptom | Required response |
| --- | --- | --- |
| TREE-P01 uniform rows | All grass areas receive evenly spaced trees | Revise category/seeded candidate sampling and protect open lawn; do not increase count |
| TREE-P02 misplaced root | Tree stands in facade, road, sidewalk or entrance | Hard-reject in geometry planner; block preview acceptance |
| TREE-P03 canopy collision/occlusion | Tower glass, shop windows or route disappear behind overlapping crowns | Use calculated canopy envelope and architecture sightline clearances; lower density |
| TREE-P04 false corridor | A "green corridor" is a visual row that does not physically connect plantable zones | Require route and walkable-connectivity witness or mark unresolved |
| TREE-P05 future edge blockage | Trees block a road/district continuation mouth | Reserve exit sectors based on topology; reject candidates |
| TREE-P06 performance collapse | Excessive alpha overdraw/shadow draw calls or mobile frame-time regression | Halt count escalation; return to last approved budget, isolate root cost |
| TREE-P07 non-determinism | Reload/machine/order change reshuffles unrelated trees | Repair stable ID / featureRandom scheme before rollout |
| TREE-P08 phys/render mismatch | Visible tree lacks Rapier collider or a phantom collider remains after disposal | Share authoritative plan, lifecycle tests and rollback |
| TREE-P09 park looks rural | Massive regular woodland conceals urban built form | Prioritise architectural views and deliberate empty lawns; reduce density |
| TREE-P10 lighting shift | Vegetation changes night visibility or requires relighting | No lighting changes in this directive; reduce tree density or defer separately |
| TREE-P11 ownership regression | Existing 3 trees or shrubs/benches/bin disappear or their materials change | Restore original authored records and shared material ownership |

Rollback: disable the single TREE-PLACE-001 preview flag to return to the **identical** GRN-005 South Ward grass, trees, geometry and physics; if runtime adds any new generated tree meshes, all must be freed via current streetContext/physics lifecycle. Retain seed/version notes for a future approved iteration. No production content should depend on generated planting until owner-approved.

## 11. Approval request and decision state

Approval of this **plan** authorizes **nothing automatically**. On explicit implementation authorization, begin T0/T1 and deliver the first **B1** preview with a clear tree count, before/after map, collision pass and baseline-to-trial frame-time comparison. Continue to B2/B3/B4 only when gates permit. If a resource cap or clearance constraint prevents the desired park-like appearance, report the constraint and its measured impact rather than manufacturing an unverified success.

**CURRENT STATE: DOCUMENTATION COMPLETED; AWAITING OWNER APPROVAL TO IMPLEMENT TREE-PLACE-001.**
