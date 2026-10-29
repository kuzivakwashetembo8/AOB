# GTD-WORLD-OPT-001 — Meridia World Optimization Master Plan
Date: 2026-10-29
Status: FULL PLAN AUTHORIZED; implementation sequence accepted by project owner.
Reference: OpenSA architectural lessons; adapt concepts, do not copy AGPL code.
Owner instruction: preserve this plan in repository documentation so future sessions retain context.

## Mission
Scale Meridia's buildings, vehicles, pedestrians and environmental detail without sacrificing browser responsiveness. An entity's existence is independent of its rendered, animated or physics-active representation. Retain Babylon.js, Rapier and accepted G.T.D systems.

## Non-negotiable constraints
1. Preserve all 100 unique NPCs and 125 generated Sedan traffic agents.
2. Preserve accepted movement, flight, driving, collisions and controls.
3. Consistent gameplay systems across districts.
4. No colored diagnostic dots, floating placeholders or disruptive loading transitions.
5. Mobile and desktop compatibility.
6. Independently implement, benchmark and preview each optimization.
7. Never merge an unsuccessful experiment.
8. Preserve nearby collisions and vehicle accessibility.
9. Preserve loading persistence and save/resume behavior.
10. Document failed experiments and use DDD to decommission rejected branches.

## Ten work packages
OPT-001 Performance instrumentation: dev-only dashboard; FPS, frame intervals (median/p95/p99 and >50ms), draw calls, triangles, NPC counts, traffic counts, physics timings, asset download/parse/memory, load-to-playable, cell state. Export local JSON. Bound memory and profiler overhead.
OPT-002 Adaptive performance budgets: sustained frame-time controller progressively adjusts distant building detail, decoration, off-screen animation, distant vehicle LOD and effects. Hysteresis, gradual recovery, never delete simulated entities or compromise collision.
OPT-003 Central asset registry: asset IDs, types, sources, file sizes, dependencies, loading state, memory estimates, reference/caching state, district/cell ownership. Support GLBs, generated geometry, textures and environmental assets. Prevent redundant downloads.
OPT-004 Priority loading: A player/terrain/roads/critical nearby collisions/controls; B nearby buildings/vehicles/NPCs; C distant buildings/decorations; D adjacent districts/optional assets. Maintain loading UI and resume; never allow missing collisions near player.
OPT-005 Composite building LOD: LOD0 detailed nearby including glass/entrances/interiors; LOD1 simplified intermediate; LOD2 merged district geometry distant. Screen-space, camera, altitude and hysteresis aware; maintain silhouettes and separate physics.
OPT-006 Geographic streaming: cells own buildings, roads, environment, NPC/traffic references, collision and asset dependencies. Prioritize ahead of driving, wider skylines for flight; prevent seams, traffic interruption, unload/reload thrashing.
OPT-007 Persistent NPC simulation: active full, reduced, simulated without rendering, dormant minimal states. Maintain identity, position and behavior; avoid teleportation, frozen poses or floating NPCs.
OPT-008 Traffic simulation/render separation: identity/routes, simulation, visible rendering and player-controlled physics independent. Preserve 125 Sedans, colors, universal entry, driving, wheels, heading and terrain contact.
OPT-009 Selective physics: static world collisions separated from dynamic bodies; activate detailed dynamic physics near player; simplify distant representations; do not disable nearby obstacles merely because off-camera.
OPT-010 Unified district architecture: shared movement/flight, vehicles, NPC, traffic, weather, physics, loading, streaming, saving and performance systems; district-specific geographic data/configuration.

## Approved execution sequence
OPT-001 → OPT-003 → OPT-004 → OPT-005 → OPT-006 → OPT-007 → OPT-008 → OPT-009 → OPT-002 → OPT-010.
This differs from numerical order deliberately: adaptive budgets follow the mechanisms they control.

## Branch and review protocol
For each package: Inspect → Baseline → Document → Implement → Test → Preview → Evaluate → Accept or DDD.
Separate experiment branches based on latest accepted main (or accepted predecessor). Never merge without owner acceptance. Document commits, preview URLs, test outcomes, actual measurements and blockers. DDD means document failures and decommission rejected experimental branches.

## Benchmarks
Desktop/mobile: walking, driving, flying, stationary camera, rapid camera turn, dense NPC area, dense traffic area. Same-device comparisons with warm/cold cache distinguished. Proposed targets (validate baseline first): ≥30% fewer >50ms frames, ≥20% better p95, ≥25% faster playable loading, 100% population preservation, zero accepted gameplay regression, no visible streaming gaps or animation defects. Passing tests alone is insufficient.

## Risks and controls
LOD popping → screen-space hysteresis; streaming collision holes → prefetch critical collision; cache memory pressure → budgets/eviction; NPC animation jumps → state continuity; traffic discontinuity → authoritative simulation; quality oscillation → hysteresis; clipping → authoritative nearby static collisions; cross-district regressions → shared regression suite.

## Explicitly out of scope
Replacing Babylon.js or Rapier; rewriting game engine; deleting assets or reducing population for benchmarks; degrading accepted visuals; unreviewed dependencies; directly copying OpenSA AGPL source without licensing review; merging unaccepted experiments.

## Current implementation status at creation
Initial OPT-001 documentation contract merged via PR #67, merge commit 08fe6b6b61db0b146705a178b49f0dc9d73c13c2. OPT-001 instrumentation gameplay code not yet completed. Earlier NPC performance experiment PR #66 is separate; do not assume it is merged or enabled by default.

## Acceptance gates per package
OPT-001 dashboard works desktop/mobile; exported metrics; negligible overhead; no gameplay regression.
OPT-003 no duplicate loads; all existing assets render correctly.
OPT-004 faster playable state; safe nearby collisions; no placeholder anomalies or persistence regressions.
OPT-005 measured draw-call reduction without unacceptable pop-in, glass or interior regression.
OPT-006 seamless cell transitions without freezes, gaps or traffic discontinuity.
OPT-007 all NPC identities retained; natural re-entry animation and position.
OPT-008 preserve 125 vehicles, visuals, entry, steering and wheel behavior.
OPT-009 lower physics cost with no new clipping.
OPT-002 stable adaptive quality, reversible and without removing logical entities.
OPT-010 future districts reuse core systems without duplicating gameplay implementation.

## Priority
Start OPT-001 with actual instrumentation and measured baseline, then follow approved sequence. This master plan is the canonical continuity reference for future chats.
