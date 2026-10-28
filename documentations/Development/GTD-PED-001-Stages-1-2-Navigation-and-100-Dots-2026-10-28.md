# PED-001 — Stages 1–2: Pedestrian Navigation Graph + 100 Colored Dots
**Branch:** `feature/north-heights-pedestrian-traffic-001`  
**Base:** main `6424eb15e599b23f1f9d31e0ce1ac546063256df`  
**Status:** IMPLEMENTED FOR PREVIEW; AWAITING OWNER VISUAL ACCEPTANCE

## Implemented
- Pure TypeScript pedestrian graph on accepted North Heights 11×11 street axes.
- Pavement centerline at ±6 m from road center (existing paving from 4 to 7.75 m).
- Building +Z doorway connectors using NH-010 entrance metadata.
- Park paths through unbuilt park blocks, with centre candidates chosen for tree clearance.
- Zebra crossing edges located at the actual NH-003 painted crossing offset. Added 26 deterministic junctions (preserving the 27 existing ones) and co-generated matching road paint so the 100-block pedestrian graph is connected. A disconnected initial graph was detected by tests and corrected before preview.
- 100 stable logical identities, independent walking speeds, randomized building destinations, 20 Hz simulation.
- Colored Babylon thin-instance dots with state palette: white departure, green sidewalk, blue park, yellow waiting (reserved), red crossing, purple arrival, gray inside (HUD-only).
- Existing 125 native Sedan traffic, Voight, controls and physics unchanged.
- Debug counters: population, visible dots, journeys completed, route failures.

## Explicitly NOT implemented yet
- Vehicle yielding and crossing reservations: Stage 4. In this early diagnostic, crossing dots can traverse roads while vehicles continue their existing simulation. This is not accepted pedestrian/vehicle safety behavior.
- Full building activity scheduling and adaptive visibility: Stage 5.
- Animated NPC GLBs, rigging, pooling: Stages 6–8.
- Walking-distance variation policy: OWNER PENDING. Destination selection is a provisional uniform sample from reachable building entrances, not a final journey-length distribution.
- Production merge/deployment: not authorized.

## Preview acceptance checks
1. Inspect green dots on existing pavements, blue dots in parks and red dots on zebra markings.
2. Follow dots from an actual +Z building doorway toward a second building.
3. Check 100 logical identities in diagnostics and the live moving-dot count near Voight.
4. Confirm 125 accepted Sedans still move and manual driving remains functional.
5. Inspect route failures and continuity while moving/turning camera.

## Next gate
Owner visually accepts Stage 1/2 dots before Stage 3 route-lifecycle refinements and Stage 4 crossing coordination.
