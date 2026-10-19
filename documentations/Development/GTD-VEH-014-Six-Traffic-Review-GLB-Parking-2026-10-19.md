# GTD-VEH-014 — Six imported traffic-review vehicles, South Ward
Date: 2026-10-19
Status: **Review branch; user visual acceptance and mobile load budget pending.**

## Scope and source
The user committed two new source GLBs on 2026-10-18:
- `public/Lamborghini+Temerario.glb` (4,499,268 bytes).
- `public/bmw_m4_competition_m_package (1).glb` (1,928,276 bytes).

Register both through existing `MERCER_EXTRA_GLB_SPECS` in `src/game/vehicles/mercer-additional-parked-glbs-006.ts`; do not build replacement geometry or touch the decommissioned MC-V01 city feature.

## Placements and guardrails
Mercer Street review parking, y=0, z=10.55, yaw=π/2, GLB dynamically fitted to real measured mesh bounds:
- Range Rover Sport 2018 x=-5.45 (unchanged; drive-eligible).
- Toyota Hilux 002 x=-13.45 (unchanged; drive-eligible).
- BMW M4 Competition x=-25.95 (new; parked visual and static collider only).
- Land Rover Defender 001 x=-31.90 (unchanged; drive-eligible).
- Dodge HP x=-39.70 (unchanged; drive-eligible).
- Lamborghini Temerario x=-47.55 (new; parked visual and static collider only).

Do not place either new GLB near x=-20.5, z=10.88; the original procedural parked car occupies that Mercer lane slot. Both new models have `visualOnly:true`, so they do not enter the existing driving loop; their colliders remain static. Source materials are preserved. No change to existing wheels, physics logic, character controls, roads, buildings, or lighting.

## QA and release gates
- Tests must verify all six asset IDs, immutable existing coordinates, input URLs, unique IDs and clearance from road props and each other.
- Existing native GLB loading checkpoint becomes six.
- No main release before owner accepts screenshots and mobile gameplay checks: model presence, orientation, road contact, lighting, collisions, parking clearances.
- The two new files add 6,427,544 bytes (6.43 MB decimal) to the concurrent import demand. Measure total load time rather than treating source-byte size as startup proof. Preserve the 60-second first-playable budget. No optimization/quality degradations authorized.
- Do not merge or reuse any MC-V01 code from the permanently decommissioned branch.
