# GTD-PED-001 — Stage 3: Building-to-Building Journey Lifecycle
**Date:** 2026-10-28
**Branch:** `feature/north-heights-pedestrian-traffic-001`
**Stage:** 3 only, awaiting visual acceptance
**Baseline:** Stages 1–2 accepted by owner after screenshot review.

## Owner's observation
The owner noted that 100 people feel sparse across a city of this size. This is recorded as a **future population-density and scalability consideration**, not permission to alter the approved 100-agent baseline or skip stage gates. Keep 100 identities until a separately authorized population decision.

## Implementation
- Preserve the existing pedestrian graph, crossing geometry, 125 Sedan simulation, and seven-color dot renderer.
- Add explicit building-to-building lifecycle: inside → departure at source doorway → sidewalk/park/zebra route → arrival at target doorway → inside → next journey.
- Track stable identity, heading, departure count, completed journeys, last arrived building, traveled distance, park visits, crossing traversals, per-agent reroutes, and stranded state.
- Determine connected components and restrict initial origins and destinations to mutually reachable building entrances. Report unreachable buildings; never fabricate an in-street spawn.
- Deterministic per-agent random seeds and staggered inside times; destination choice remains provisional and uniform **without any minimum/maximum walking-distance policy**.
- Bound route-selection attempts, cache successful paths, and provide mid-edge rerouting without changing current coordinates or progress.
- Validate arrival at actual doorway coordinates; no silent mid-street completion.
- Keep pedestrians fully logical while out of view; dots remain camera-distance culled.
- Add Stage 3 diagnostics and automated tests for repeat journeys, continuous motion, unreachable buildings, mid-edge rerouting, and park path connectivity.

## Deferred
- Stage 4: pedestrian crossing wait/reservations and yielding by Sedan traffic.
- Stage 5: day/night schedules, soft visible density and continuity tuning.
- Stage 6+: animated Ara GLBs.
- Owner's walking-distance variation policy remains pending.

## Acceptance
Preview and verify dots can depart real doorways, move through existing sidewalks and park routes, arrive at another doorway, disappear inside, and later depart again. Verify route failures remain zero on normal city geometry. Do not merge or deploy production without separate authorization.
