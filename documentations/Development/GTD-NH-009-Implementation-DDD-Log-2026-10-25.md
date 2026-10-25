# GTD-NH-009 — Implementation and DDD Execution Log
Date: 2026-10-25
Branch: `feature/nh009-camera-geography-six-fleet-001` from main
Status: Feature preview candidate. Owner approval for implementation granted; not merged to main.

## GLASS decommission (approved)
Do not merge GLASS-001/002 commits. This branch was created from main and preserves all existing main glass rendering code unchanged (256x128 one-time `createGlassReflection005`, semi-transparent window materials, existing Fresnel, spherical lookup and four material batches). GLASS-001/002 imagery, central system, altered alpha/tints/quality/time-of-day logic remain confined to rejected branch `feature/glass-reflections-v1-001`. Rejection cause: persistent camera-distance shimmer/blocky reflection after both prototypes, visually unacceptable on owner mobile screenshots. No GPU root cause has been proven. Historical branch left intact for audit; no deletion authorized.

## Implemented
- Shared Controls -> Camera Distance 3–8m, default 4.5m; safe legacy persisted settings migration.
- South Ward third-person on-foot/flight uses same preference through existing `camera-settings` GameRuntime command, without changing driving camera overrides.
- North Heights terrain-grade camera policy reuses South Ward bounded orbit/obstruction principles, samples actual terrain and physical building bounds for walk and flight, prevents below-map XZ and ground penetration.
- Real North Heights municipal location atlas (22 corridors, 100 blocks, 6 areas). Controller emits changes to the existing GameHud `GameSnapshot.location`; no duplicate panels.
- Reuses South Ward's exact six GLB specs in a single Meridian Boulevard forecourt near x=9.65 and z=-119 to -74, outside 8m road + 3.75m sidewalk. Asset decoding concurrency capped at 2 on mobile; existing GLB fitting, derivative loading and Rapier collision retained; car y follows actual ground. Removes only tree(s) that would physically occupy these reserved parking bays.
- No new or speculative vehicle drive controls. Cars are parked and physically solid; original driving feature remains in the South Ward runtime.

## Validation
See `src/test/nh009-camera-location-fleet.test.ts`. Automatic code/type/test/build and browser/mobile screenshot acceptance are separate gates. Owner must accept preview before main merge. Mobile memory, GPU frame-time and six-vehicle load performance must be measured on device and cannot be claimed by static tests.
