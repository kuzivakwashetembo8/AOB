# GTD VEH-008 — Toyota Hilux production parking promotion

Date: 2026-10-17
Status: Implementation verified in isolated branch; production release pending final verification.

## Scope
- Render the *existing* owner-committed 17.2 MB GLB at `public/toyota hilux 002.glb` on `/game` **without query parameters**, next to the Range Rover on Mercer Street.
- Range Rover Sport 2018 remains default-on and drivable via Ferrari/Buggy established actor; no changes to its source GLB or player controls.
- Toyota position `(-13.45, 0, 10.55)`, road-aligned yaw `π/2`, expected visual envelope approximately 2.15×1.87×5.25 m; parked-only visual import and measured static collider. No Toyota driving actor, seat pose or guessed wheel animation.
- Suspend Sedan (delegated/pending) and `ergoninane-fast-71` as before. Preserve Ferrari and Buggy.
- Only 4 files promoted from the isolated review branch: parked GLB registration, runtime guard, targeted tests and this release document. UI, cache, and experimental wheel steering changes remain isolated.

## Validation
- Source `src/test/veh008-toyota-parking.test.ts` verifies registration, safe prop/road clearance, non-Rover static status and fit.
- Require full TypeScript/Vitest/build before main promotion, then confirm a production-style `/game` response plus both public GLB endpoints.
- Real mobile first-playable time not measured by these tests. Toyota adds a 17.2 MB GLB and can increase latency; enforce owner acceptance budget of 60 seconds in performance review and defer claims of mobile signoff without measurements.
- Future movement requires separate owner authorization and physically measured Toyota wheel rig/cabin.

## Inventory
- Production intended vehicle types: Ferrari, Buggy, Range Rover (drivable); Toyota (static).
- Separate pending assets: GTD original Sedan (delegated); ergoninane-fast-71 (rendering paused). Six distinct named vehicle sources under management, four active in-world after this release.
