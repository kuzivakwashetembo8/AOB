# FL-4 Visual Realism — Decision Record and Implementation Plan

**Status:** DOCUMENTED DESIGN DECISIONS — IMPLEMENTATION BATCHES A–C NOT YET AUTHORIZED  
**Recorded:** 2026-10-10  
**Project:** GTD / Meridia First Light, FL-4  
**Active branch:** `development/meridian-fl4-optimization`  
**Canonical Source of Truth:** `documentations/Meridia First Light Implementation Plan.md`  
**Governing FL-4 execution contract:** `documentations/FL-4 Technical Implementation Plan.md`  
**World architecture:** `documentations/Meridian Game World Development SOT.md`  
**Evidence ledger:** `documentations/FL-4 Evidence/Progress and Blocking Matrix.md`

> **Authority and scope:** This is a durable explanation of *why* certain visual decisions were made, with a proposed, testable implementation specification. It does not replace or override the canonical First Light Source of Truth. FL-4 remains an optimization/acceptance milestone rather than a new content-production stage. These newly scoped visual batches require explicit implementation authorization; publication of this record alone authorizes no code changes or deployment.

## 1. Context and user observations

On 2026-10-10 the user reviewed four screenshots of the FL-4 preview `https://gtd-fw2kc7kn9-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1`, displaying South Ward trees, daytime facades/windows, simple vehicle proxies, the garage and Voight at human scale.

The following observations are to remain discoverable for future decisions:

1. **Tree trunks:** The previously divided/bent two-stick trunk was rejected; a continuous main shaft was preferred and subsequently accepted. The near-uniform-width refinement is visibly preferable to exaggerated tapering. However, the foliage canopy now needs greater *volume and air-space occupancy* appropriate to each tree's height and thickness. Larger/taller trees should have broader/fuller umbrella-like crowns; slimmer/smaller trees should have less foliage spread.
2. **Architectural windows:** Some windows appear unreasonably low, too close to street or floor level, insufficiently related to nearby doors, or inconsistently placed across elevations. Windows should read as openings serving actual interior rooms, with plausible sill, head and floor heights. Building and storey height may need modest changes *where demonstrated necessary*, rather than raising windows arbitrarily within undersized walls.
3. **Vehicle proxies:** Parked cars remain particularly toy-like or “Lego-like” relative to the increasingly credible roads, facades, vegetation and lighting. The current vehicle objects are **representation proxies**, not production-grade drivable vehicles. A careful silhouette improvement may reduce visual discontinuity without initiating the later vehicle-systems phase.
4. **Future gameplay motivation:** Low windows and weak facade-to-street massing undermine the sense that approaching vehicles would meet a robust wall beneath an opening. Visual credibility and collision semantics must agree. **Do not** infer from this observation that glass must be vehicle-collidable, destructible or that vehicle physics should be implemented now.
5. **Priority and approach:** Windows/building proportions demand the most thorough reasoning and discreet changes. Tree canopy scaling is a narrower proportional issue. Vehicle massing may be improved as a proxy only. All changes must preserve accepted gameplay and be compared against screenshots.
6. **Known unrelated issue:** Daytime horizontal banding remains acknowledged, cosmetic and non-blocking, as documented under `documentations/Issues/Horizontal Sky Banding - Non-blocking Visual Refinement.md`. Do not derail FL-4 to resolve it.

## 2. Decisions, rationale and constraints

### DR-01 — Form must express physical scale and purpose

**Decision:** Visual elements must be scaled coherently relative to Voight, doors, sidewalks, roads and storeys. Geometry that individually looks plausible but contradicts its neighbors fails the GTA-SA/Payback-2-inspired grounded, stylized realism target.

**Why:** The player infers a building's function and physicality from consistent body-scale landmarks, not polygon count alone.

**Guard:** No arbitrary all-assets upscaling or blind photorealism. Capture human-scale reference views.

### DR-02 — Tree canopy mass follows trunk mass and height

**Decision:** Keep a single near-uniform-width trunk with small natural irregularities; adapt canopy crown radius, depth/vertical layering, fullness and leaf-card placement to the tree's authored/generator size. Larger trees read as having fuller crowns, smaller trees remain proportionally lighter.

**Why:** A large shaft supporting a tiny flat crown makes a tree appear assembled; independently scaled foliage makes generated vegetation visually inconsistent.

**Guard:** Avoid compact spherical “lollipop” shapes, excessive crossed billboards, branch sticks through empty air, artificial repeated round blobs or foliage that clips buildings and walkable paths. Avoid adding complex botanical simulation as a prerequisite.

### DR-03 — Window positions follow floors, human reach and architecture

**Decision:** Define window placement relative to floor elevation, storey height, ceiling clearance, doorway head, facade use and opening dimensions. Standard street-facing windows should have **positive protective sill height** and a realistic head clearance. Upper-floor windows should occupy coherent bands unless an explicit building archetype justifies an exception.

**Why:** The facade must suggest usable interior space and structurally credible wall area below glass.

**Guard:** There is no universal rule that every sill is near head height, and legitimate storefront glazing can reach near the floor. Door height is a useful reference, **not** a blanket requirement that every window bottom must align with or exceed a door head. Accessibility, shops, mezzanines, industrial bays and unusual architecture require explicit exceptions; do not homogenize them.

### DR-04 — Building height changes are conditional, semantic and reversible

**Decision:** Where current storey dimensions cannot accommodate reasonable sill + window + head clearance, adjust the affected **archetype's** floor-to-floor or facade grammar in a controlled manner, not individual world-space mesh positions as a workaround.

**Why:** Raising windows alone inside an implausibly low facade can create an even worse ceiling/door relationship.

**Guard:** Recompute connected roof, parapet, collision, facade opening segmentation, garage entry clearance and camera blockers; inspect door/garage interaction before accepting any massing change. Avoid moving already accepted hero-garage geometry without a separate gate.

### DR-05 — Vehicle silhouette may improve without full vehicle implementation

**Decision:** Upgrade parked vehicle proxies enough to express a hood, passenger cabin, roofline, windshield/window areas, wheel placement and front/rear mass using inexpensive stylized geometry and shared materials.

**Why:** The box-shaped proxies disproportionately expose the scene as a prototype after surrounding environments improve.

**Guard:** No drivable cars, traffic AI, doors, interiors, suspension, damage, combat, advanced shading or production vehicle library in this patch. Preserve proxy placement, physical footprint and camera/Voight collision behavior unless independently approved.

### DR-06 — Fidelity changes remain subject to FL-4's performance gate

**Decision:** Every retained visual improvement needs before/after geometry/mesh/draw-call/memory measurements, matched screenshots and gameplay regression evidence.

**Why:** FL-4's purpose is sustainable delivery of accepted realism, not unlimited detail expansion.

**Guard:** Do not mark this visual package as FL-4 completion or claim FPS gains based only on reducing mesh counts.

## 3. Implementation batch A — Architectural realism and window grammar (highest reasoning burden)

### FL4-VIS-A01 — Inventory current window and facade rules

1. Inspect the active generated-world architecture plan and facade templates, storey/floor heights, window template dimensions, `generateBuilding` output, wall segmentation around openings and archetype overrides.
2. Enumerate all First Light building archetypes used in South Ward, including hero garage, residential, commercial and any mixed-use buildings. Identify low-sill windows and other violations from precise camera views.
3. Build a **window placement register** by archetype: ground-relative floor Y, storey height, door threshold/head, window bottom/sill Y, window top/head Y, roof/parapet clearance, exterior finished grade and exceptions.
4. Include full-body Voight in the same view to establish human scale. Mark windows that appear at torso/waist height as *candidates for review* rather than automatically wrong; the user specifically noted that some such elevations are partially credible.
5. Examine how street elevation differences, foundations and facade coordinate systems may make a correct local sill appear too low from the sidewalk.

**Evidence:** `documentations/FL-4 Evidence/Visual Realism - Window Audit.md` (or equivalent), identified source functions, before screenshots, table of floor/window dimensions.  
**Gate:** Do not modify massing until the coordinate and archetype causes of low placement are known.

### FL4-VIS-A02 — Define placement constraints from room geometry

1. For each archetype, specify a realistic **range**, not a single absolute constant, for window sill elevation relative to the served interior floor. Suggested starting *review ranges*, not mandatory architectural codes: residential sills around 0.75–1.1 m; general office windows around 0.7–1.1 m; commercial display glazing and accessibility needs may legitimately be lower.
2. Determine corresponding head clearance below ceiling/beam and window height relative to room/storey dimension, using existing game scale as the calibration basis.
3. Define normal alignment of repeated windows in floor bands, spacing between facade corners/openings, and relation to entrances.
4. Define named exceptions: storefront glazing, lobby or garage glazing, high clerestory, safety/egress windows, basements/raised ground floors and industrial openings.
5. Document a scalable grammar using floor-relative normalized coordinates; reject ad hoc screen-position adjustments.

**Evidence:** A reviewable opening-grammar specification with exception table and examples.

### FL4-VIS-A03 — Implement archetype-scoped facade corrections

1. Adjust placement rules in the authoritative generator/templates, preserving deterministic seeds and stable semantic building IDs.
2. Where necessary and justified by A01/A02, selectively revise affected archetype floor height or exterior wall height; propagate that change to openings, roof/parapet and storey segmentation.
3. Preserve door clearances, garage threshold and established interior classification/collision; verify that street-level wall remains substantial and continuous.
4. Do not accidentally convert decorative glass to interactive/collidable vehicle physics; retain valid existing wall and blocker geometry.
5. Compare representative generated buildings across seeds/archetypes to ensure the fix is systematic rather than tuned to a single screenshot.

**Evidence:** Source commits, numeric before/after audit, snapshots.  
**Gate:** Windows occupy coherent architectural bands and plausible sills, while doors, garage travel, shadows, roofline and wall collision remain credible.

### FL4-VIS-A04 — Architectural regression and acceptance

1. Automated checks for repeated window alignment, minimum/maximum sill ranges per archetype, head clearance, non-overlap with doors/corners, deterministic variation and opening/wall segmentation.
2. Visual captures near door, eye/chest/head height, full facade, street distance, garage, daylight/night. Include the brown-building fourth-screenshot perspective.
3. Confirm no unintended floor-level glass, paper-thin walls, external-interior mismatch or newly blocked garage entry.
4. Report per-archetype exceptions and seek user visual acceptance.

**Gate:** User approves updated building proportions; tests and physical semantics pass.

## 4. Implementation batch B — Tree canopy proportionality

### FL4-VIS-B01 — Inspect vegetation shape inputs

1. Read the active `street-context` plan and `street-context-renderer` tree code; establish how `item.scale`, `item.canopyScale`, trunk height/diameter and foliage cards interact. Identify any canopy values generated but not actually applied.
2. Capture small and large trees at the same human-scale camera distance.
3. Count canopy planes, current projected crown width, vertical depth, mesh/material draw calls and tree collision footprint.

**Gate:** A reproducible disproportion is established.

### FL4-VIS-B02 — Implement scalable umbrella-like crowns

1. Keep the accepted continuous, near-uniform-width trunk and root flares.
2. Derive crown lateral spread, canopy depth and leaf-card distribution from the same authored size traits as the trunk, with bounded deterministic variation.
3. Increase crown extent and foliage mass for larger/taller trunks and reduce it for smaller/thinner trunks. Prefer layered, overlapping foliage cards with a broader, irregular horizontal silhouette instead of a flat cap.
4. Maintain small gaps, variable edge breakup and sunlight readability; avoid uniformly dark featureless disks.
5. Reuse existing foliage material/texture and geometry where possible; do not multiply transparent draw calls without profiling.
6. Verify sidewalks, building facades, lights, camera sightlines and Voight path are not obstructed unnaturally.

**Evidence:** Crown-to-trunk ratio table, before/after screenshots from at least two tree-size classes, per-tree geometry/draw-call counts.

### FL4-VIS-B03 — Vegetation regression and acceptance

1. Tests proving deterministic proportionality (large canopy exceeds small canopy in expected extent), stable IDs and no new unrelated collision.
2. Side-by-side near/far, daylight/night, different camera yaw and different tree scales.
3. Confirm no broken segment joint or excessive taper returns; user reviews foliage volume.

**Gate:** User accepts size-dependent foliage mass with no unjustified performance burden.

## 5. Implementation batch C — Vehicle proxy silhouette uplift

### FL4-VIS-C01 — Inventory proxy representation

1. Identify current parked vehicle source meshes, archetypes, transforms, dimensions, material families, shadow/collision treatment and instancing potential.
2. Capture near-side, front/rear, elevated and street-distance views against road lanes and Voight.
3. Record mesh count, triangles, draw calls and the existing collision proxy bounds.

**Gate:** Establish accepted dimensions and silhouette deficiencies before edits.

### FL4-VIS-C02 — Replace box-like visual massing conservatively

1. Preserve positions and collision bounds as the reference; add a coherent hood, cabin/greenhouse, roof and rear body to the visual proxy.
2. Use simple windshield/side-glass planes or shallow material regions and believable wheelbase/wheel spacing, with basic lamps and bumpers only when cost-effective.
3. Prefer repeated component reuse, shared materials and stable silhouettes from typical on-foot camera angles.
4. Apply subtle deterministic vehicle-length/body-colour variation where already supported, not a new vehicle content system.
5. Keep total geometry, materials and draw-call costs proportional to a placeholder. **Do not** add drivability, traffic, damage or production-grade mechanical interiors.

**Evidence:** Paired before/after screenshot set, collision outline comparison, mesh/draw-call budget, code diff.

### FL4-VIS-C03 — Validate against future movement context

1. Walk Voight around and toward parked vehicles; confirm existing collision semantics, no camera clipping regression and readable car-to-road proportions.
2. Check vehicle/window facade relationship visually from street level without implementing vehicle impact gameplay.
3. Preserve deterministic spawn placement and cleanup/disposal.
4. Obtain user acceptance of the *proxy uplift*, expressly distinguishing it from future dedicated car development.

**Gate:** Vehicles cease to read as simple Lego blocks at normal gaming distance without pretending they are production-ready.

## 6. Cross-cutting validation, performance and Source-of-Truth gates

For each batch record: issue/decision ID, source SHA, affected archetypes, exact changed files, screenshots at matched device/render dimensions, before/after draw calls, active meshes, frame intervals (p50/p95), memory/resource indicators where available, TypeScript/lint/test/build results, gameplay/camera/collision checks, and PASS/FAIL/BLOCKED/N/A with rationale.

**Acceptance matrix:**

| ID | Requirement | Evidence needed |
| --- | --- | --- |
| VIS-01 | Trunks remain continuous, near-uniform, human-scaled | Prior accepted baseline and close-up review |
| VIS-02 | Crown mass increases with tree scale | Two+ tree classes, dimensions and screenshots |
| VIS-03 | Windows sit within plausible floor-to-ceiling space | Per-archetype sill/head/floor audit |
| VIS-04 | Exceptions preserve legitimate commercial/garage glazing | Explicit exception catalogue |
| VIS-05 | No windows overlap doors, corners or unrelated floors | Procedural template and visual tests |
| VIS-06 | Building changes preserve garage/collisions and roof alignment | Simulation/camera and geometry tests |
| VIS-07 | Cars have credible simple silhouettes without new gameplay | Multiple-angle screenshot and cost comparison |
| VIS-08 | Changes do not degrade GPU responsiveness | Controlled p50/p95 and draw-call evidence |
| VIS-09 | FL-3 night sky, lighting, time and interactions remain accepted | Day/night scene comparisons and tests |
| VIS-10 | User visually accepts each material refinement | Explicit review decision |

The canonical FL4-01–FL4-06 baseline, device validation, optimization, regression and final acceptance gates **still apply**. Passing VIS-01–10 is not by itself sufficient to close FL-4. A documented cosmetic limitation (horizontal sky banding) may remain open without blocking final acceptance if the user continues to accept its severity.

## 7. Future-facing dependency decisions

**For city expansion:** Window/storey grammar must be expressed in generalized building archetype contracts so new streets and districts inherit realistic spatial logic rather than copied coordinate hacks. Canopy scaling must similarly be driven by tree properties, not hand-tuned per tree.

**For eventual vehicles:** Strong building plinths/walls under openings support future visual collision expectations, but actual vehicle impact rules, window glass fracture, damage, collision response and dynamic traffic remain separate milestones. Current visual fixes must avoid hard-coding gameplay assumptions.

**For dedicated vehicle art:** The proxy uplift is an intermediate massing standard only. A final vehicle representation doctrine will govern drivable geometry, animation, performance tiers and interaction later.

**For retrospective “why” questions:** Use DR-01–DR-06 to distinguish the origin of each choice. The key decision is not “make everything detailed,” but “preserve coherent physical scale, recognizability and mechanics while constraining runtime cost.”

## 8. Ordered execution and authorization boundary

Recommended review order (not an override of FL-4 optimization requirements):

1. **A — Architectural realism:** audit, placement grammar, controlled implementation, tests and user visual review.
2. **B — Vegetation proportionality:** audit, scalable foliage mass, tests and user visual review.
3. **C — Vehicle placeholder uplift:** inventory, cheap silhouette improvement, tests and user visual review.
4. **FL4-01–06 reconciliation:** performance/device evidence, regression, remaining limitations, review preview and explicit milestone acceptance before any release decision.

**Current state at documentation:** FL-4 in progress; single-piece trunk accepted; near-uniform diameter refinement under review; canopy, window and vehicle batches **specified but not implemented or accepted**. Existing FL-4 completion estimate ~50% is subjective and must not be mechanically increased by writing this document.

**Deployment:** No merge into `main` or production deployment is authorized by this record. Follow the previously requested deliberate sequence after development validation: review/merge approved changes, intentionally deploy the verified `main` commit, test the current mobile PWA, then close FL-4 only after final user approval.


## 9. Execution supersession — 2026-10-10 morning

The earlier draft status saying A/B/C were unimplemented is a historical snapshot. The user subsequently authorized integration of the overnight plans. Standard authorized GitHub source edits succeeded. The precise active implementation, source commits, verification and known limitations are documented in `documentations/FL-4 Evidence/Morning Integration and Pre-Continuation Patch - 2026-10-10.md`.

**A:** Generated windows scale proportionally in storeys taller than 3.8 m; ordinary windows, authored garage and low storefront exceptions retain established logic. **B:** The existing proportional canopy planner is now actually invoked by the active renderer for exactly 30 cards/tree, retaining continuous near-uniform trunks. **C:** Parked cars now use a shaped body mesh, combined six-pane window mesh and original four wheels, preserving six meshes and the Rapier collider semantics.

The combined revision passed TypeScript, tests and build and has a READY non-production preview at `https://gtd-279m2a0ke-interlinkglobaltech.vercel.app/game` (source SHA `e31a6a2f930bb9cad89d0a2b6c609e9563356d8c`). **A04, B03, C03 and VIS-10 still require matched user visual review; performance/device validation is not complete.** No subsequent change to main/production was authorized or made. The canonical SOT retains authority.
