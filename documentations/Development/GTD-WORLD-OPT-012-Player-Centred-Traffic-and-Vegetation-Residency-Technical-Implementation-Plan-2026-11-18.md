# GTD-WORLD-OPT-012 — Player-Centred Traffic and Vegetation Residency
**Date:** 2026-11-18  
**Status:** IMPLEMENTATION APPROVED — Stage 1 accepted; Stage 2 implementation in progress  
**Repository:** `kuzivakwashetembo8/AOB`  
**Scope:** Three ordered work packages: moving Sedan traffic, pedestrian characters, and static tree GLB instances.  
**Intent:** Preserve the complete authored world and its deterministic population while limiting expensive rendering and simulation work to entities relevant to the player's current location.

## 0. Authority and approval boundary

This document is a proposed execution contract derived from the existing Meridia world-optimization doctrine and the current North Heights implementation. It does not authorize runtime changes.

**The only authorized action under this document at this stage is documentation.** Do not create an implementation branch, edit TypeScript, change GLB assets, tune production values, run deployment workflows, merge, or deploy until the owner explicitly approves implementation. Approval of implementation does not automatically authorize preview deployment, merge, or production promotion; those remain separate gates.

This plan supplements, and does not replace:
- `GTD-WORLD-OPT-000-Meridia-World-Optimization-Master-Plan-2026-10-29.md` — especially OPT-007 persistent NPC simulation, OPT-008 traffic simulation/render separation, OPT-003 asset registry, OPT-004 priority loading, and OPT-006 geographic streaming.
- `GTD-WORLD-OPT-001-Performance-Instrumentation-Implementation-Contract-2026-10-29.md` — required baseline and measurement discipline.
- `GTD-GEN-VEH-009-Sedan-Only-Traffic-2026-10-26.md` — the accepted single-Sedan visual policy and 125-agent traffic identity.
- PED-001/PED-002 pedestrian simulation, appearance manifest, and proximity-loading implementation.
- `GTD-NH-LAMP-012-Streetlamp-Citywide-GLB-Instancing-2026-10-29.md` and `GTD-NH-REBUILD-004-Owner-Trees-and-Road-Consistency-2026-10-24.md` — existing GLB instancing, visibility, attribution, and spatial-placement constraints.

If the active game runtime differs from the North Heights experiment, first identify the runtime actually used by the target route and map the equivalent systems. Do not silently port an experiment-only implementation into the production runtime.

## 1. Mission and non-negotiable invariants

Replace city-wide expensive entity work with player-centred residency. The world population and authored placement remain persistent; rendering, animation, asset residency, and simulation fidelity are independently controlled.

1. Preserve all 125 deterministic Sedan traffic agent identities, routes, lane reservations, traffic signals, and player interaction/vehicle ownership.
2. Preserve all 100 pedestrian logical agents, unique appearance mapping, route progress, crossings, obstacle avoidance, mission reservations, and identity.
3. Preserve every deterministic tree placement, ground elevation, scale, rotation, source GLB geometry/materials, and attribution.
4. Never make the camera the authoritative centre of the activity radius. Use the current player world position: the walking actor when on foot, or the controlled vehicle/actor position while driving. Camera/frustum visibility is a secondary render filter only.
5. Keep nearby collision and interaction authority valid. An entity must not lose collision merely because it is outside the camera view; collision policy is separate from render residency.
6. Do not reduce the authored population or permanently delete off-screen entities to improve benchmark numbers.
7. No abrupt spawn/despawn in the player's immediate view, no visible teleportation, no tree position changes, no duplicate GLB loads, and no unbounded asset or instance-buffer growth.
8. Preserve Babylon.js as render owner, Rapier as physics owner, and the GameRuntime/RuntimeBridge boundary. React must not own simulation ticks.
9. Keep desktop and mobile behavior deterministic and configurable. Do not invent a fixed FPS guarantee before baseline measurements.
10. Each stage is independently benchmarked and visually accepted before proceeding to the next stage.

## 2. Current repository findings and implementation implications

The following findings are based on inspection of `main` at plan authoring time; reverify source and commit before implementation.

### 2.1 Moving cars — existing renderer is not yet player-centred

- `src/game/traffic/nh012-traffic-simulator.ts` owns the 125-agent deterministic traffic simulation. Its snapshot exposes all agents; the simulator advances the population at the established 20 Hz cadence and maintains lane/junction reservations and traffic state.
- `src/game/experiments/north-heights-sedan-traffic-009.ts` renders the accepted source-derived Sedan using Babylon thin-instance buckets. It has full, medium, and distant visual representations and camera projection/frustum tests. The renderer still iterates the full traffic snapshot, computes road poses and updates per-agent position/wheel history before deciding whether an agent is culled.
- The existing renderer is not a GLB-per-car loader and must not be replaced with 125 independent GLB imports. It uses source-native geometry, shared mesh/material buckets, and thin instances.
- The traffic simulator and renderer are separate enough to support a staged policy, but far-agent simulation cannot simply be stopped by hiding its mesh. Junction reservations, queues, lane following, traffic signals, impacts, player boarding/driving, and deterministic re-entry must remain coherent.
- `GTD-GEN-VEH-009` explicitly preserves the 125 Sedan agents and separates them from the six parked/drivable vehicle assets. Do not conflate parked vehicles with the moving traffic population.

**Consequence:** Stage 1 must introduce player-distance-based render residency and tiered update work without breaking the authoritative traffic graph. Full simulation, reduced/off-screen simulation, and no-render states must be distinct. A dormant distant representation must retain enough authoritative state to re-enter correctly.

### 2.2 Pedestrians — proximity streaming already exists and must be improved, not duplicated

- `src/game/experiments/north-heights-pedestrian-simulator-001.ts` owns 100 deterministic logical agents and route/lifecycle state independently of Babylon, GLB, Rapier, and vehicle rendering.
- `src/game/experiments/north-heights-pedestrian-characters-001.ts` already streams the 100 unique GLB appearances. It has mobile/desktop activation and release radii, limited concurrent loads (mobile 1, desktop 2), inactive appearance LRU limits (mobile 12, desktop 24), pooled character instances, and explicit disposal.
- The current character renderer uses the camera position for its distance checks. It updates the logical-to-visual assignments and active skeletons each frame, while logical simulation remains independent.
- Each appearance GLB is roughly 0.5–1.1 MB according to `north-heights-pedestrian-asset-manifest-002.ts`; eager loading of all 100 appearances would be an unacceptable regression.

**Consequence:** Stage 2 should correct the activity centre to the player/controlled vehicle, audit and tune the existing activation/release behavior, and separate visual residency from logical pedestrian progression. Do not build a second pedestrian loader or discard the existing LRU/pool without benchmark evidence.

### 2.3 Trees — one source GLB, many instance transforms

- `src/game/experiments/north-heights-trees-004.ts` imports the owner-provided `/GLBs/Infrastructure/tree_low_poly_lowpoly.glb` once, normalizes its geometry, and renders the deterministic placements through thin-instance buffers. It does not import a separate GLB for every tree.
- Tree placement is deterministic and grounded using the supplied terrain function. The current renderer filters the placements to a desktop/mobile planar radius and refreshes the instance buffers through `north-heights-visibility-gate-015.ts` after a horizontal movement threshold.
- The existing implementation rebuilds and uploads a full filtered instance matrix buffer when the gate opens. It does not yet use a spatial cell index or incremental cell residency.
- The tree source attribution and accepted source asset are mandatory. Rejected foliage assets and generated flat canopy cards remain excluded.

**Consequence:** Stage 3 should preserve one shared source asset and all placements while improving spatial selection and buffer updates. Do not create per-tree mesh objects or load multiple copies of the tree GLB.

## 3. Target architecture

### 3.1 Shared player-location contract

Introduce or adapt one engine-owned player-location provider that returns a stable world-space position and movement mode for the current controlled actor. Resolve ownership in this order:
1. Controlled vehicle position while driving.
2. Controlled player character position while walking/on foot.
3. A documented safe fallback during spawn, actor transition, or scene initialization.

The camera position must not be used as the activity centre. During boarding/disembarking, transfer the centre atomically or through a bounded transition so the active set does not jump to a stale actor position. If no valid player position exists, retain the last valid centre for a short, explicit initialization/transition window; otherwise suspend residency updates safely.

### 3.2 Residency is not existence

Represent the lifecycle as separate dimensions, not one overloaded visible/hidden boolean:
- **Logical entity:** persistent identity and authoritative state.
- **Simulation tier:** full-rate, reduced-rate/analytical, or dormant state update.
- **Asset residency:** unloaded, loading, resident, pooled, or evicted.
- **Render residency:** full visual, reduced LOD, or not submitted for rendering.
- **Physics/interaction:** active only where the gameplay and collision contract requires it.

A distant object may be absent from rendering while its logical identity and deterministic state remain intact. Asset eviction must not destroy logical entity data. Physics deactivation must not create a nearby collision hole.

### 3.3 Spatial selection and hysteresis

Use player-centred planar distance as the primary residency test for street-level traffic, pedestrians, and trees. Camera frustum/projected-size checks may further reduce draw work after distance eligibility has been established; they must not decide whether a logical agent exists.

Use separate enter and exit thresholds (hysteresis) to prevent repeated activation/deactivation near a boundary. Radii and update intervals must be configuration values selected from measurements, not copied blindly from existing camera-based radii. Support desktop/mobile profiles and driving/walking movement modes where evidence justifies differences.

For large static populations, use a deterministic spatial index (uniform grid/cell buckets or an existing compatible world-cell index) so updates query only cells intersecting the relevant radius. Do not scan every tree placement every frame. Update the active cell set only when the player crosses a cell boundary or a bounded movement threshold.

### 3.4 Scheduling and asynchronous work

- Bound GLB loads, parse/instantiate work, thin-instance buffer rebuilds, and entity activation per frame.
- Prioritize the player's current cell, then cells in the direction of travel, then adjacent cells.
- Cancel or ignore stale asynchronous results when the scene is disposed or the player has moved far from the requested cell.
- Avoid per-frame React state updates and per-frame console logging.
- Expose opt-in diagnostics for logical count, active simulation count, resident asset count, rendered instance count, LOD counts, pending loads, evictions, and update timings.
- Dispose scene-owned meshes, materials, buffers, asset containers, observers, and pending work deterministically on scene teardown.

## 4. Ordered implementation stages

## Stage 1 — Player-centred Sedan traffic renderer and simulation workload

**Objective:** Preserve the 125-agent deterministic traffic system while limiting expensive vehicle rendering and nonessential update work to the player-relevant area.

### Scope
1. Trace the actual active runtime route and confirm where `NH012TrafficSimulator`, `createNorthHeightsSedanTraffic009`, player actor position, controlled vehicle position, collision, and traffic signal updates are connected.
2. Add a player-centred traffic residency query. Use controlled vehicle/player world position, not camera position. Keep camera projection/frustum as a secondary visual filter.
3. Keep all 125 stable logical agent records. Do not delete or respawn agents when they cross the active boundary.
4. Define measured traffic tiers:
   - **Near / interactive:** existing authoritative traffic cadence, full Sedan visual fidelity, wheel/steering presentation, collision and interaction support.
   - **Intermediate / ambient:** reduced visual detail and, only if proven safe, reduced simulation/update frequency or deterministic analytical progression. Preserve lane order, route, reservations, signals, and time continuity.
   - **Distant / dormant:** no vehicle mesh submission and no expensive per-agent visual work. Preserve enough route/timing state to resume without teleportation or junction corruption. If authoritative traffic rules require an agent to remain simulated, retain the minimum safe simulation rather than forcing dormancy.
5. Separate traffic simulation scheduling from renderer iteration. Renderer should consume an immutable/consistent snapshot or a bounded view of agents eligible for rendering; it must not mutate traffic simulation state.
6. Ensure a vehicle crossing the active boundary is promoted/demoted with hysteresis. It must not appear directly in front of the player, reverse direction, skip a junction, overlap another agent, or lose a player-controlled/mission-reserved state.
7. Preserve source-native Sedan batches and existing LOD geometry. Reuse buffers and avoid reallocating/uploading full-population matrices when only a small active subset changes.
8. Keep parked/drivable vehicles and player-controlled Sedans under their existing explicit ownership rules. Never demote the vehicle currently controlled by the player or an agent participating in a critical mission/impact/recovery interaction.
9. Instrument counts and time spent in traffic simulation, road-pose calculation, LOD selection, thin-instance buffer writes, and GPU submission where available.

### Likely source touchpoints
- `src/game/traffic/nh012-traffic-simulator.ts`
- `src/game/traffic/nh012-lane-network.ts`
- `src/game/experiments/north-heights-sedan-traffic-009.ts`
- `src/game/experiments/north-heights-city-8.ts`
- Relevant vehicle collision/boarding, signal, impact/recovery, and traffic tests.

### Stage 1 acceptance
- 125/125 logical agent identities remain present and deterministic.
- Near-player traffic retains accepted Sedan appearance, wheel/steering behavior, lane following, traffic signals, collision, impacts, and player interaction.
- Distant traffic no longer incurs full visual-render work; measured counts prove the active set is bounded by player proximity.
- Leaving and revisiting an area does not duplicate agents, teleport traffic, lose reservations, or cause junction deadlocks.
- Camera orbit/zoom/flight height changes do not move the residency centre.
- No new traffic dots, placeholder meshes, GLB swapping, or visible pop-in in the player's immediate field of view.
- Desktop and representative mobile benchmarks show a measurable improvement against the same-build baseline without unacceptable visual or gameplay regression.

## Stage 2 — Player-centred pedestrian character residency

**Objective:** Retain all 100 logical pedestrians and unique appearances while keeping only player-relevant character GLBs, skeletons, and animation work resident/active.

### Scope
1. Trace the live pedestrian simulator and character renderer integration in the active runtime; verify whether the North Heights preview is the only consumer or whether another runtime owns production pedestrians.
2. Replace camera-centred activation distance with the shared player-location contract. Keep frustum/occlusion as secondary rendering optimizations only.
3. Preserve the 100 logical agents and all routing, crossings, signal compliance, obstacle avoidance, horn response, mission reservations, and journey counters while visuals are inactive.
4. Retain the existing 100-ID appearance manifest, asynchronous asset loading, bounded concurrent imports, pooled instances, inactive LRU policy, and scene teardown unless profiling demonstrates a specific defect.
5. Introduce hysteresis and bounded per-frame activation/deactivation. Prioritize the closest visible pedestrians and those approaching crossings/interactions; do not load all 100 GLBs at startup.
6. Ensure a pedestrian leaving the active area releases animation/render resources without resetting its route, appearance ID, random seed, position, destination, or journey state.
7. On re-entry, reconstruct the correct appearance at the authoritative logical position and resume an appropriate Idle/Walk state/phase without a visible teleport or frozen pose.
8. Avoid unnecessary skeleton/animation updates for off-screen or distant pedestrians. If logical movement continues at a reduced rate, ensure route progression and obstacle/collision safety remain correct.
9. Add diagnostics for logical population, active character slots, loaded/pending/failed appearance assets, pooled instances, skeleton count, LRU evictions, and per-frame assignment cost.

### Likely source touchpoints
- `src/game/experiments/north-heights-pedestrian-simulator-001.ts`
- `src/game/experiments/north-heights-pedestrian-characters-001.ts`
- `src/game/experiments/north-heights-pedestrian-asset-manifest-002.ts`
- `src/game/experiments/north-heights-city-8.ts`
- Pedestrian graph, avoidance, crossing, signal, and lifecycle tests.

### Stage 2 acceptance
- 100/100 logical pedestrian identities and journey state remain intact.
- No eager load of all 100 appearance GLBs; concurrent load and inactive cache limits remain bounded.
- Only player-proximate character assets/skeletons are active; activity centre remains correct while driving and walking.
- Pedestrians resume at correct locations and routes after leaving/re-entering an area.
- Crossing, obstacle avoidance, signals, mission reservations, and player collision behavior remain valid.
- No repeated load churn at residency boundaries, animation resets, floating poses, or visible pop-in.
- Measured CPU, memory, loading, and frame-time results improve or remain neutral while preserving the accepted crowd appearance.

## Stage 3 — Spatially streamed tree GLB instances

**Objective:** Preserve the full deterministic urban forest and exact owner-provided tree asset while submitting only nearby tree instances to Babylon.

### Scope
1. Verify the current tree asset, license/attribution record, placement seed, terrain grounding, and all consumers of `planNorthHeightsTrees004` / `placeNorthHeightsTrees004`.
2. Retain one imported source GLB and shared source meshes/materials. Do not import one GLB per tree and do not replace the accepted source with another asset.
3. Build or reuse a deterministic spatial cell index over `TreeLocation[]`. Each placement must retain a stable ID/index and immutable world transform.
4. Query only cells intersecting the player-centred tree residency radius. Use camera frustum/projected size as an optional secondary filter; camera orbit must not change which geographic cells are resident.
5. Replace repeated full placement scans and whole-population buffer rebuilds with cell-local instance buffers or another measured batching strategy. Reuse typed arrays/buffers where possible and bound allocations and GPU uploads.
6. Keep enter/exit hysteresis and a small prefetch margin in the direction of travel to avoid tree pop-in while driving. Do not allow a distant camera angle or vertical flight to pull the entire forest into residency.
7. Preserve every tree's X/Z location, terrain-derived Y, scale, yaw, source geometry, materials, and deterministic seed. Do not regenerate or randomize placements during movement or revisit.
8. Ensure multiple source meshes in the GLB receive identical instance transforms and matching active instance counts. Handle import failure and scene disposal without leaking source meshes or buffers.
9. If a cell has no active tree instances, remove its GPU submission/buffer residency while retaining its placement metadata for deterministic re-entry.
10. Add diagnostics for total authored placements, cells queried/resident, instances submitted, source mesh count, buffer bytes/uploads, and update duration.

### Likely source touchpoints
- `src/game/experiments/north-heights-trees-004.ts`
- `src/game/experiments/north-heights-visibility-gate-015.ts`
- `src/game/experiments/north-heights-city-8.ts`
- Existing tree placement, road clearance, terrain, and landscaping tests.

### Stage 3 acceptance
- One source tree GLB import per scene lifecycle; no per-tree GLB loads or per-tree Babylon mesh proliferation.
- All authored tree placements remain deterministic and spatially unchanged.
- Rendered instance count is bounded by player proximity and no longer requires rebuilding the entire nearby set from every placement on every refresh.
- No visible holes, sudden forest disappearance, floating trees, pavement/road intrusion, or tree relocation at cell boundaries.
- Desktop/mobile GPU buffer counts, CPU update cost, memory, and frame time are measured and compared with the pre-stage baseline.
- Scene teardown releases all imported meshes, materials, buffers, and cell resources.

## 5. Performance instrumentation and benchmark protocol

Use the existing OPT-001 instrumentation contract. If its implementation is not present on the selected base, first establish a minimal dev-only measurement path or explicitly record the instrumentation blocker; do not invent results.

### Required measurements
- Frame interval median/p95/p99 and count of frames exceeding 50 ms.
- CPU timings for traffic simulation, traffic rendering/LOD, pedestrian simulation, pedestrian character assignment/update, tree cell selection, and tree instance-buffer updates.
- Babylon draw calls, active meshes, triangles, and GPU frame time where supported.
- Traffic: logical agents, full/intermediate/dormant simulation tiers, visible full/medium/distant instances, controlled/reserved agents.
- Pedestrians: logical agents, active character slots, loaded/pending/failed appearances, skeletons, pooled slots.
- Trees: total authored placements, queried/resident cells, active instances, instance-buffer bytes and upload count.
- Asset load/parse/instantiate time, peak/resident memory estimates, and cold/warm cache distinction.
- Build SHA, device/browser/OS, screen resolution, DPR, mobile/desktop profile, and thermal/charging notes where available.

### Reproducible scenarios
1. Stationary player in a dense traffic/pedestrian/tree area.
2. Walking traversal through multiple blocks.
3. Driving traversal at accepted top speed through multiple blocks.
4. Stop-and-go traffic at a signalized junction.
5. Rapid camera orbit while the player remains stationary.
6. Camera zoom/height changes and vertical flight while player X/Z remains stable.
7. Leave an area, travel away, and return to verify continuity.
8. Repeated scene entry/exit and disposal to detect retained GLBs, skeletons, meshes, buffers, or observers.
9. Desktop and representative real mobile landscape hardware; clearly distinguish actual hardware from browser emulation.

Run before/after comparisons on the same device, build conditions, route, camera path, cache state, and sample duration. Profile disabled-mode overhead. Numerical targets must be set only after a reproducible baseline; use the master plan's proposed targets as hypotheses, not guaranteed outcomes.

## 6. Test strategy

### Automated
- Pure tests for player-location source selection, actor handoff, radius/hysteresis transitions, and stable entity identity.
- Traffic tests for 125-agent preservation, deterministic lane/junction behavior, reservations, signals, player-controlled exclusions, and far-agent re-entry.
- Pedestrian tests for 100-agent preservation, route/seed/appearance continuity, load concurrency, LRU eviction, assignment hysteresis, and scene disposal.
- Tree tests for deterministic placement IDs/transforms, cell membership, boundary queries, hysteresis, stable per-mesh instance counts, and disposal.
- Regression tests for existing traffic, pedestrian, vehicle, tree/road clearance, and world initialization behavior.

### Manual preview
- Inspect near, boundary, and distant tiers from on-foot and in-vehicle perspectives.
- Check transitions while moving at speed, stopping at junctions, reversing, camera orbiting, and revisiting locations.
- Confirm no visible pop-in at the immediate horizon, no collision gaps, no missing interactions, and no altered accepted art.
- Test both desktop and mobile landscape.

Passing automated tests alone is insufficient for visual acceptance.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Camera and player positions diverge | Activity centre comes from controlled actor/vehicle; camera only filters rendering. |
| Distant traffic stops at unsafe junction state | Preserve authoritative reservation/queue state; only reduce work after a deterministic progression design is proven. |
| Traffic teleports or duplicates on re-entry | Stable 125-agent identity and authoritative route state; no respawn-on-visibility. |
| Player-controlled or mission-reserved entity is demoted | Explicit pin/exemption state overrides proximity tiers. |
| Pedestrian routes reset when GLB is evicted | Logical simulator remains authoritative; renderer is a disposable representation. |
| GLB load churn at cell boundaries | Hysteresis, bounded queues, cancellation, LRU cache, and per-frame activation caps. |
| Tree instance uploads cause hitches | Cell-local buffers, buffer reuse, bounded uploads, and measured prefetch. |
| Tree placement changes after streaming | Immutable deterministic placement records and stable IDs. |
| Performance gains are claimed without evidence | Same-device baseline, opt-in instrumentation, raw exports, and owner review. |
| Preview-only systems are mistaken for production runtime | Trace route ownership and document exact active integration before editing. |

## 8. Execution protocol and approval gates

The implementation sequence is strictly:
**Stage 1 cars → Stage 2 pedestrians → Stage 3 trees.**

For each stage, follow the repository's established process:
**Inspect current main → record baseline → implement on an isolated branch → run focused and full regression tests → build → create preview only with separate authorization → visually inspect desktop/mobile → publish measured evidence → request owner acceptance.**

Do not begin Stage 2 until Stage 1 has passed its acceptance gate. Do not begin Stage 3 until Stage 2 has passed its acceptance gate. A failed experiment must be documented and decommissioned under the repository's DDD process; do not merge an unsuccessful branch.

### Current decision register

| Decision | State |
|---|---|
| Preserve all 125 Sedan agents | Locked by existing traffic doctrine |
| Preserve all 100 pedestrian logical agents | Locked by existing world optimization doctrine |
| Preserve all deterministic tree placements and source asset | Locked by existing tree/asset records |
| Use player/controlled-vehicle position, not camera, as activity centre | Proposed by this plan; owner confirmation implicit in the player-centred directive |
| Exact enter/exit radii and update rates | OPEN — Stage 1 starts with provisional 92m enter / 112m exit render-residency radii; validate and tune against profiling before acceptance |
| Exact simulation reduction strategy for distant traffic/pedestrians | OPEN — prove deterministic continuity and safety before implementation |
| Tree cell size and buffer strategy | OPEN — benchmark candidate configurations |
| Implementation authorization | GRANTED — Stage 1 only, North Heights experiment target, 2026-11-18 |
| Preview, merge, production deployment | NOT GRANTED |

## 9. Definition of completion

All three stages are complete only when the full logical populations and deterministic world layout are preserved, expensive render/asset/update work is bounded by player proximity, transitions are visually stable, desktop/mobile regressions are absent, and before/after evidence demonstrates measurable benefit.

**Owner approval required before implementation.** Stage 1 implementation authorization was subsequently granted for the North Heights experiment on 2026-11-18. Stages 2 and 3 remain gated on acceptance of the preceding stage.
