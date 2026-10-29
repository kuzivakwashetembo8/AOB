# GTD NH REF-014 — DDD Decommission Record
Date: 2026-10-29
Disposition: **REJECTED — DO NOT MERGE**
Branch: `feature/gtd-north-heights-refinement-014-20261029`
Last candidate commit: `b365aca03445d4fb1430c9faac27df468c81696f`
Final deployment: `dpl_whJFYWkCSJs1LsEmCbrmxYMYPkvN` — ERROR
Base main at branch creation: `82333debb74b4fd74004b9037becf40fb819dfe1`

## Authorization and decision
The owner ordered DDD immediately following the second withdrawal and the last failed deployment. The entire REF-014 branch is rejected; do not cherry-pick or merge changes to production without a new explicit approval. Production main remains the accepted baseline.

## What was attempted
1. Mobile action layout: fixed bottom-row buttons and upper contextual actions.
2. Mobile steering controls: vibration investigation; **withdrawn** by owner.
3. Time-of-day transitions, walking-speed slider, HUD cleanup, tree exclusion.
4. Roof support and parapet colliders. Owner **accepted roof standing height**, but rejected pass-through parapets in earlier preview.
5. Voight flight-facing orientation: multiple neck/head counter-rotations; owner still observed face-down flight.
6. High-fall landing: rig jump recovery, velocity-weighted bilateral knee flexion, and a later Rapier pre-impact speed handoff. Owner still saw instant standing before final build; latest handoff never received successful visual confirmation.
7. Street lamps: replaced generated poles with instanced GLB from `public/GLBs/Infrastructure/Modern Street Lamp.glb`.
8. Building surroundings: park-grass infill instead of white concrete except parking.
9. Curb-side shading: mildly angled normals.
10. Updated tests for changed grass and curb acceptance contracts.

## Build and preview evidence
- `dpl_8TNNrhm6HwcQkpnEw2gMxVKzN4Rn`: TypeScript failed: `updateControlled` expected at most seven arguments but received eight; `impactSpeed` was not in scope.
- `dpl_HUT46fx2CGd3BTpKcy4BHoryLPur`: TypeScript passed, 640 tests passed, two tests failed: `north-heights-rebuild008-surfaces.test.ts` expected paved occupied lots; `ped001-vis004-ground-curb.test.ts` expected fully upward curb normals.
- `dpl_whJFYWkCSJs1LsEmCbrmxYMYPkvN`: final candidate reported ERROR. No successful final preview acceptance.
- Earlier visual feedback: rooftop foot elevation fixed; parapet collision, landing and flight orientation failed. Arrow haptics withdrawn.

## DDD disposition
- Preserve main unchanged. The 51 commits ahead of the branch base and 22 changed files are **not accepted** as a unit.
- Retain this record on main as the audit trail.
- Do not deploy or continue REF-014. Any future recovery should start from the then-current main on a newly authorized branch and use this record for diagnosis.
- The branch should be deleted only using an authorized GitHub branch-deletion capability; do not substitute deleting individual files or rewriting main. Branch deletion may require a separate operation if connector lacks deletion.
