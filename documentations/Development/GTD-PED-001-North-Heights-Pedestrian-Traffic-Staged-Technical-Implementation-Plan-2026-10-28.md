# GTD-PED-001 — North Heights Pedestrian Traffic System
## Comprehensive Staged Technical Implementation Plan — Design Baseline (Documentation Only)
**Date:** 2026-10-28  
**Status:** DOCUMENTED / NOT APPROVED FOR IMPLEMENTATION  
**Repository:** `interlinkglobal/GTD`  
**Target district:** North Heights  
**Proposed implementation branch (not created):** `feature/north-heights-pedestrian-traffic-001`  
**Baseline at documentation time:** `main` @ `252683a96b97b76c166ff7b8dbf33dd559e4c2cc`

> This is a faithful documentation of the owner's reviewed architectural outline. It records intended design and proposed engineering mechanisms; it does **not** assert that all existing North Heights data structures have been inspected or that any of these mechanisms already exist. No gameplay changes are authorized by this document.

## 1. Purpose and non-negotiable principles

Build a credible, continuously simulated pedestrian traffic network for North Heights, initially **100 pedestrian identities alongside the accepted 125-vehicle Sedan traffic system**.

1. **Algorithm first, characters later.** The first complete implementation must work with lightweight colored dots, without loading any pedestrian GLBs.
2. **Separate identity from rendering.** All 100 pedestrians have stable logical state, but only a context-dependent subset is fully rendered near Voight. Approximately ten locally visible animated pedestrians is an **initial performance target, not a hard clipping limit**.
3. **Pedestrians originate at buildings and travel to buildings.** Building entrance transitions, sidewalks, zebra crossings and parks form coherent journeys. No arbitrary mid-sidewalk pop-in or pop-out.
4. **Retain traffic and gameplay parity.** Existing 125 Sedans, manual driving, road behavior, North Heights world, controls, camera, collision and loading remain functional.
5. **Stage gates and owner acceptance.** Each stage must be independently previewed and accepted before proceeding. No implementation or merge without explicit owner approval.
6. **Asset fidelity.** Keep the optimized and unoptimized ten-character experiments as untouched comparison baselines. The ten optimized Ara GLBs form the initial appearance library only after the dot simulation is accepted.
7. **Future scale.** The architecture must permit a library of up to 100 distinct appearances without coupling pedestrian routing to GLB count.

## 2. Conceptual system

```text
                   NORTH HEIGHTS WORLD
         Buildings     Sidewalks     Parks     Roads
              \           |           |        /
               \          |           |       /
                 PEDESTRIAN NAVIGATION GRAPH
                           |
                 PEDESTRIAN SIMULATOR
             100 identities, routes, schedules
                      /           \
             CROSSING COORDINATOR   ACTIVITY SCHEDULER
                     |                      |
              125 SEDAN AGENTS       BUILDING TRANSITIONS
                      \                    /
                       VISIBILITY MANAGER
                               |
                    PEDESTRIAN RENDERER
                   DOTS  ->  10 GLB MODELS
                               |
                    DIAGNOSTICS / TESTS
```

A representative route:

```text
Building A (exit) -> sidewalk -> crossing wait -> zebra crossing
    -> sidewalk -> park path -> sidewalk -> Building B (enter)
    -> inside-building state -> next scheduled journey
```

## 3. Population model

| Quantity | Initial target | Meaning |
|---|---:|---|
| Vehicle agents | 125 | Existing Sedan traffic simulation |
| Pedestrian identities | 100 | Stable citywide logical actors |
| Initially available appearances | 10 | User-optimized Ara 3D GLBs |
| Initial locally visible animated pedestrians | ~10 | Soft performance/density target, not hard cap |
| Future appearance library | Up to 100 | Expand only after pedestrian architecture is accepted |

Each pedestrian identity should retain at minimum:
`id`, `appearanceId`, `activityState`, `originBuildingId`,
`destinationBuildingId`, `routeNodeIds`, `routeEdgeIndex`,
`edgeProgress`, `worldPosition`, `heading`, `preferredSpeed`,
`departureTime`, `arrivalTime`, `nextScheduledEvent`,
`crossingReservationId` and a deterministic random seed.

**Important:** An identity is not a mesh, a skeleton or a GLB. A model is a reusable visual resource temporarily bound to an identity.

### Dot-state palette (diagnostic only)

| Dot color | State |
|---|---|
| White | Departing a building |
| Green | Walking along sidewalk |
| Blue | Strolling in a park |
| Yellow | Waiting at a crossing |
| Red | Crossing the roadway |
| Purple | Approaching a building entrance |
| Gray | Inside a building / logically inactive |

Color must reflect current state, not permanently classify a pedestrian. Gray inside-building identities may be represented in the diagnostic HUD rather than as world-space dots.

## 4. Proposed subsystems and interfaces

### 4.1 Pedestrian Navigation Graph
A pedestrian-only graph, distinct from the vehicle route graph. Proposed node types: `SIDEWALK_JUNCTION`, `BUILDING_ENTRANCE`, `PARK_ENTRY`, `PARK_WAYPOINT`, `CROSSING_WAIT`, `CROSSING_END`. Proposed edges: `SIDEWALK`, `ENTRANCE_LINK`, `PARK_PATH`, `ZEBRA_CROSSING`.

- Derive graph candidates from existing road, sidewalk, curb, building-footprint, entrance, park and zebra-crossing geometry where available.
- Validate traversability, clearance, slope and obstruction. Prevent routes through building interiors/walls, trees or vehicle-only lanes.
- Snap entrance links to valid pedestrian edges; reject or flag unreachable buildings.
- Maintain graph versioning and diagnostics for disconnected components and orphan entrances.
- Support destination-aware route search (A* or equivalent weighted shortest-path method).
- **Walking-distance policy is unresolved:** do not hardcode minimum/maximum journey distances or an arbitrary trip-length distribution before owner clarification.

### 4.2 Pedestrian Simulator
A fixed-step, render-independent controller for 100 identities. Proposed update frequency: 10–20 Hz, to be measured rather than treated as a guarantee.

- Maintain persistent logical positions, edge progress, destination and activity state.
- Use deterministic seeded diversity for departure times, speeds and destination selection.
- Route via graph edges, never through arbitrary world-space straight lines.
- Continue logical progression outside the camera view.
- Apply local separation/avoidance for nearby agents; use lower-cost approximations for distant agents.
- Handle route failure: bounded retry, alternate destination, fallback to reachable building; log stranded agents rather than teleporting them into view.
- Keep pedestrian identities independent of renderer activation.

### 4.3 Building Origin/Destination and Schedule Manager
- Every eligible building entrance may serve as origin and destination.
- Departures originate at an actual doorway; arrivals terminate at a doorway.
- Transition to inside-building logical state only after entering the doorway.
- Generate a future departure without requiring simulated interior furnishing.
- Infer provisional residential, office, commercial, public or park-adjacent activity profiles from reliable world metadata, where available; do not fabricate categories as established facts.
- Day/night activity schedules may vary demand but must remain deterministic and testable.
- Respect building capacity/activity constraints to avoid synchronized mass departures.

### 4.4 Crossing Coordinator / 125-Car Integration
- Associate crossing edges with existing road lanes and intersection geometry.
- At a crossing, calculate approach, waiting and occupancy states.
- Pedestrians wait if approaching traffic makes crossing unsafe.
- Vehicles receive crossing-occupancy/yield signals through an explicit adapter to the accepted traffic simulator.
- Preserve existing vehicle behavior, manual overrides and driving mechanics.
- Initial policy: predictable zebra use and safety-first crossing. Rare unsafe crossings are a **future refinement**, not an initial requirement.
- Avoid adding 100 individual Rapier pedestrian rigid bodies solely to coordinate crossings.

### 4.5 Visibility Manager and Renderer
- **Dot mode:** display pedestrian states and movement cheaply, with optional graph overlays and diagnostic counters.
- **Character mode:** map simulated identities onto pooled rigged models from the ten optimized Ara GLBs.
- Activate before entering the visible zone; deactivate only when safely occluded, inside buildings or sufficiently distant and outside sightlines.
- Include hysteresis to avoid oscillating near a distance boundary.
- Preserve identity/route continuity across camera turns, flying, driving, tab switches and return visits.
- Do not abruptly hide a visible pedestrian to enforce the soft ten-model target; regulate future arrivals and resource pressure instead.
- Cache and reuse decoded assets/model instances; avoid network fetches or skeleton creation on every visibility transition.
- Ensure per-identity animation selection: Idle when waiting, Walk on sidewalks/crossings, suitable strolling motion in parks, Run only where explicitly designed.
- Rendering may be throttled independently of logical simulation.

### 4.6 Diagnostics and Test Harness
- Report total identities, counts by activity state, active dots, visible animated models, pooled models, path failures, unreachable buildings, crossing wait times, frame time, FPS, memory (where measurable), loading duration and simulation cost.
- Support deterministic seed/replay for identical route and appearance allocation across dot and character previews.
- Preserve identical camera, quality, traffic and time settings for performance comparisons.

## 5. Staged implementation roadmap and acceptance gates

### PHASE A — ALGORITHM, NO GLBs

**Stage 1 — Pedestrian navigation graph**

Deliver graph generation/validation for sidewalks, accessible building entrances, zebra crossings, parks and intersections. Provide debug overlays showing nodes, edges, disconnected components and inaccessible destinations.

**Acceptance:** Sample routes connect valid buildings through pedestrian-only geometry; no edges pass through buildings, tree obstacles or traffic lanes except designated crossing edges. Report coverage and unreachable destinations.

**Stage 2 — 100 independent colored-dot identities**

Create 100 deterministic logical pedestrian agents and state-colored debug dots. Use independent routes, speeds, headings and destinations. Do not load any NPC GLBs.

**Acceptance:** Exactly 100 stable identities, distinguishable states, no formation-following or unintentional overlapping at initialization, no GLB runtime imports.

**Stage 3 — Building-to-building journey lifecycle**

Add building exit, sidewalk traversal, park detours, arrival and interior-state transitions. Integrate robust rerouting and destination reachability checks.

**Acceptance:** Agents complete multiple full journeys and re-emerge at valid doorways. No mid-street teleportation or stranded agent accumulation.

**Stage 4 — Zebra crossings and 125-vehicle coordination**

Connect crossing reservations and occupancy to the current Sedan traffic simulation.

**Acceptance:** Pedestrians wait/cross appropriately, vehicle yield/stop logic works where applicable, and the accepted driving behavior remains intact. Test high-demand crossings and manual driving.

**Stage 5 — Schedules, continuity and visibility diagnostics**

Introduce varied departures, day/night activity, out-of-view logical progression, return-to-area continuity, and a soft local density target. Keep colored dots as the representation.

**Acceptance:** Rapid camera turns, long-distance travel, flight, vehicle travel and time progression do not reset identities or produce unexplained jumps. The 100-dot simulation is stable alongside 125 Sedans.

**PHASE A GATE:** The owner must accept the complete 100-dot traffic system before any pedestrian GLBs are introduced.

### PHASE B — CHARACTER REPRESENTATION

**Stage 6 — Replace nearby dots with ten optimized Ara models**

Integrate the existing optimized ten-character asset library into the renderer. The graph, simulator and route selection remain unchanged.

**Acceptance:** Ten distinct appearances are correctly grounded, oriented and animated; state transitions map to Idle/Walk appropriately; no navigation regression. Diagnostic dot mode remains available for comparisons.

**Stage 7 — Represent all 100 identities using ten reusable appearances**

Bind the 100 logical identities to the ten appearances (initially approximately ten identities per appearance), with pooled, visibility-based instantiation.

**Acceptance:** All 100 identities retain independent behavior, only necessary models render, no obvious pop-in/pop-out or repeated downloads, and no loss of logical continuity.

**Stage 8 — Behavioral and performance refinement**

Tune walking/turning, pedestrian separation, crossing queues, park strolling, camera-aware visibility and performance.

**Acceptance:** Inspect walking, sprinting, driving alongside sidewalks, rapid camera rotation, flying over intersections, leaving/returning to areas and mixed pedestrian/vehicle encounters. Compare measured FPS, frame times, loading and memory to the dot-only baseline.

### PHASE C — APPEARANCE DIVERSITY

**Stage 9 — Expand the appearance registry progressively**

Generate/register additional unique optimized Ara GLBs only after Phase B is accepted. Suggested checkpoints: 25 then 50 unique models.

**Acceptance:** New models plug into the registry without modifying routing, crossing or identity logic; monitor download, rig and memory budgets.

**Stage 10 — Up to 100 unique appearances and final validation**

Optionally expand to 75 and then 100 appearances if visual diversity warrants it and performance remains acceptable. Do not assume all 100 assets must be loaded simultaneously.

**Acceptance:** Final performance and behavior comparison, desktop/mobile validation, documented tradeoffs and owner review before any production merge.

## 6. Performance and regression matrix

| Scenario | Vehicle agents | Pedestrian identities | Representation |
|---|---:|---:|---|
| Baseline | 125 | 0 | Existing accepted vehicle traffic |
| Algorithm | 125 | 100 | State-colored dots |
| First GLB integration | 125 | 100 | Ten optimized appearances; limited local rendering |
| Expanded visual diversity | 125 | 100 | Growing appearance registry; adaptive asset loading |

**Provisional objectives:** Preserve the existing 60-second loading target and avoid material frame-time regressions. A ~10-character local rendering target is adjustable after measurement; no fixed global clipping threshold should create visible popping. No quantitative FPS improvement is promised in advance.

Compare identical world version, route seeds, camera, weather, quality settings, device and observation duration. Capture median/p95 frame time, FPS, total transferred GLB bytes, asset decode time, render memory where available, active skeleton count and route/crossing failures.

## 7. Engineering safeguards

- Use isolated implementation branch after authorization; main remains unchanged during preview work.
- Keep existing unoptimized and optimized ten-NPC experiments intact as reproducible references.
- Each stage produces a separate commit, tests, performance observations and preview; owner acceptance is required before the next stage.
- Avoid coupling pedestrian simulation to Babylon rendering or Rapier physics.
- Keep traffic integration behind an explicit adapter, with fallback to current vehicle behavior.
- Use seeded route tests and property/invariant tests for graph connectivity, destination reachability, stable identity count, valid crossing states and no unauthorized visible teleportation.
- Test cleanup: no leaked scene observers, skeletons, animation groups, timers, meshes or event listeners on scene disposal.
- On failed preview, revert only the current stage to the last accepted checkpoint; preserve diagnostic notes.
- Do not deploy or merge to production without separate explicit authorization.

## 8. Open design question — walking distance variations (OWNER PENDING)

The owner is considering how **walking-distance variations** should work and has explicitly deferred a decision.

**Do not preempt this decision with fixed route lengths or artificial probabilities.** The eventual policy may affect:
- minimum and maximum pedestrian journey distances;
- short local errands versus long cross-district trips;
- frequency of park detours and crossing usage;
- destination-selection weighting by distance, building type or time of day;
- walking-speed differences versus trip-length differences;
- whether the same NPC can make repeated short journeys or occasional long ones;
- how much time an identity spends inside buildings between journeys;
- citywide density and performance implications.

These are **questions for later discussion, not adopted requirements**. Navigation graph and routing APIs should accept configurable distance/cost policies so the owner's future decision can be integrated without redesigning the system.

## 9. Read-only technical inspection required before implementation

Before implementation approval, inspect the **then-current** main codebase to map actual modules and verify:
1. North Heights road, curb, sidewalk, park and building-footprint generation.
2. Existing doorway/entrance metadata and whether all entrances are navigable.
3. Existing zebra-crossing markings and their correspondence to lane topology.
4. The 125-Sedan traffic simulator, intersection logic, stop/yield behavior and manual driving overrides.
5. Camera visibility/frustum APIs, minimap, world bounds and save/resume lifecycle.
6. Existing Ara GLB loading, skeleton/animation and cleanup mechanisms from both ten-NPC experiments.
7. Performance and test harnesses, build/deployment constraints and mobile behavior.

Only then translate this conceptual design into exact source-file modifications, signatures, test names and per-stage patch plans. Any missing geometry or metadata must be documented as a dependency rather than presumed to exist.

## 10. Authorization boundary

This document is **documentation only**. The owner authorized recording the reviewed design **as-is** while considering walking-distance variations.

**Not authorized:** create an implementation branch, modify gameplay, generate NPCs, alter assets, launch a preview, merge or deploy.

**Next decision:** Wait for the owner's walking-distance clarification or an explicit request to proceed with technical inspection/implementation planning.
