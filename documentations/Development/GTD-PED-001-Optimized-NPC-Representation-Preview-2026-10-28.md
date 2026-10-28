# GTD-PED-001 — Optimized NPC representation preview (owner-directed)
**Date:** 2026-10-28
**Branch:** `feature/north-heights-pedestrian-traffic-001`
**Stage:** Character-representation preview after owner acceptance of Stage 3
**Production:** No merge/deployment authorized

## Owner directive and stage ordering
The owner explicitly accepted Stage 3 and requested the next preview **with multiplied optimized NPCs**. This is a targeted advancement of the character-representation work from planned Stages 6–7. Planned Stage 4 (vehicle yielding at zebra crossings) and Stage 5 (activity scheduling and advanced continuity) remain **not implemented**; they are not falsely represented as accepted or completed. Crossing geometry and pedestrian graph behavior are preserved, but cars are not yet required to yield.

## Implementation
- Exactly 100 logical pedestrian identities; same deterministic Stage 3 building journeys, routing, parks, crossings, speeds and destinations.
- Appearance mapping: 10 optimized Ara GLBs, 10 identities per appearance. Files are the exact existing owner-optimized `public/GLBs/Characters/GTD_NPC_*.glb`, total 7,285,620 bytes (6.95 MiB); unoptimized originals are not loaded.
- Load the ten optimized assets **after** first playable frame, once each. Validate skeleton, geometry, Idle and Walk clips before switching.
- Pool model/skeleton/animation instances per appearance, with one new rig instantiated per frame at most. Reuse slots when agents enter buildings or move out of range. No per-agent network imports.
- Retain conservative activation radius and larger deactivation radius, with no fixed ten-model hard clip. A character already in the activation envelope is not evicted because a closer agent arrives.
- Each active instance independently follows its stable logical identity's x/z, heading and grounded y. Waiting plays Idle, other walking states play Walk. No new Rapier bodies.
- In-game top-center toggle switches optimized characters and original state-colored diagnostic dots. Dot mode remains available for controlled comparison.
- Diagnostics: 100 identities, active and pooled rigs, ten loaded appearances, journeys, reroutes, stranded agents, park/crossing activity, FPS.
- Scene cleanup disposes pooled rigs, animations and loaded containers. Failed imports retain diagnostic dots and do not block the initial playable frame.

## Review criteria
Verify 10 distinct appearances repeated among 100 agents, natural walking and facing direction, doorway exit/entry continuity, no unexpected visible pop-in/out during walking/driving/flying, no repeated downloads, and no material performance regression against Stage 3 dots. Assess 125 Sedan traffic remains operational. Keep Stage 4 crossing-yield and Stage 5 schedules as separate explicit acceptance gates.

## Population note
Owner observed that 100 people appear sparse in the large North Heights city. Record this as a future density/scale question; this preview does not raise the population.
