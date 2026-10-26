# GTD-GEN-VEH-009 — Single Accepted Sedan, Entire Moving Traffic Circuit
Date: 2026-10-26
Branch: feature/gtd-sedan-only-traffic-009
Base: 2d302c9b1fa4ab6d2f15402898a731ec7c19fe6d
Status: owner-authorized implementation; preview visual acceptance pending.

## Directive
Only Four Door Sedan is approved. All 125 moving North Heights traffic views must be this exact extracted sedan, recolored in a deterministic 12-color palette. Other extractions remain review-only. BMW remains excluded.

## Architectural boundary
Retain NH-012 seed 120125, 125 agent identities, lane graph, 20Hz integration, per-lane following, stop lines and exclusive junction reservations. The earlier NH-013/014/015 model-ID overlays are historical simulator classifications only; they do not select visual vehicle geometry.
Switch the North Heights traffic renderer at one call site to GEN-VEH-009. It constructs only GEN-VEH-008-qualified native Sedan paint/glass/trim/rear-light and four original-source wheel assemblies, uses thin-instance batching and actual measured hubs for turning/rolling, and applies 12 stable paint variations derived from immutable agent IDs. No browser-time source-GLB loading or diagnostic dots.

All non-sedan vehicle definitions, 3D source GLBs and extraction statuses are retained for future repairs in the Vehicles gallery; none is selected by this traffic renderer. The parked/drivable six existing vehicles are separate NH-010 parked-car gameplay assets, not part of the 125 simulated moving traffic agents. Their behavior is unchanged.

## Gates
1. Automated: 125/125 visible source-sedan instances, at least 8 distinct colors, 4 original wheel pairs, body/glass intact, zero dots, no other model renderer used, NH012 deterministic simulation unchanged.
2. Preview: visually confirm all 125 are sedan shapes, direction correct in each lane/junction, windows present, wheels attached/steer/roll on hills; no unrelated parked cars mistaken for traffic.
3. Check Chrome Android FPS/memory due to 78,936 sedan body triangles before any main merge.
4. Owner must explicitly accept preview. Do not merge or deploy to main automatically.
