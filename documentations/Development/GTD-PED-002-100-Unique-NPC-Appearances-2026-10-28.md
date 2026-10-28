# GTD-PED-002 — One-to-One NPC Appearance Integration
**Date:** 2026-10-28
**Branch:** feature/ped-002-100-unique-npc-appearances-20261028
**Baseline:** fd882f2cde039401f612170e6b0a998c2f360419
**Status:** Preview only; pending owner visual and performance acceptance.

## Objective
Replace the 10 repeated models across the accepted PED-001 simulation with one unique GLB per each of 100 pedestrian IDs (PED-001 ⇄ GTD_NPC_001 through PED-100 ⇄ GTD_NPC_100).
Keep all 100 pedestrian positions, building origins, destinations, routes, animation states, curb grounding and 125 Sedan traffic unchanged.

## Performance isolation
- Do not fetch the entire 77,245,264-byte NPC library at startup.
- After first playable frame, use proximity-driven imports; bound to 1 mobile or 2 desktop imports concurrently.
- Keep a 12-mobile/24-desktop inactive container LRU cache; never evict active pedestrians to meet a budget.
- Instantiate at most one rig per frame, retain active/deactivation hysteresis and retain scene cleanup.
- If a GLB is missing/invalid or pending, show a state-colored diagnostic dot until a valid skeleton with Idle and Walk loads.
- Dot toggle hides/restores character instances. 13 assets exceeding the 1,000,000-byte target are deferred to a separate optimization branch.

## Preview acceptance
Confirm 100 distinct appearances, preserved pedestrian continuity, no changes to positions and traffic, no loading regressions, safe fly/drive transitions, and acceptable FPS on mobile and desktop.
Do not merge to main without owner acceptance.
