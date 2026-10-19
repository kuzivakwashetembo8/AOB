# GTD-VEH-015 — BMW M4 Competition and Lamborghini Temerario driving onboarding

Date: 2026-10-19
Implementation classification: **ISOLATED DRIVE REVIEW / owner visual acceptance pending**
Predecessor: VEH-014 six-car static lineup accepted by owner.
Authoritative established process: GTD-WHEEL-001 and accepted WHEEL-002 solid-wheel/color recovery.
Do not merge Meridian Central MC-V01 or any DDD-decommissioned implementation.

## Objective

Drive both new owner-committed GLBs using the same Rapier kinematic actor, collision handoff, forward/reverse, turning, keyboard/touch arrows, boarding, exit and rear follow camera already accepted on Range Rover, Hilux, Defender and Dodge. The user called the new coupe a Mercedes; the actual deposited GLB is a BMW M4 Competition, not a Mercedes.

Only these two cars receive new wheel onboarding. No traffic AI, paint variants, vehicle imports, city modifications, lighting or UI changes. Existing six physical car coordinates and the four accepted drive actors are unchanged.

## Real-source measurements and methods

### BMW M4 Competition M Package

- Original immutable source: `public/bmw_m4_competition_m_package (1).glb`, 1,928,276 bytes; SHA-256 `476dde9af8c54c3e05d30c0664fa27e63a69957c632fcba3c792a95ae9e074be`.
- The Sketchfab-style source is **30 meshes** and frequently duplicates vertices per triangle, so the Toyota/Defender/Dodge single-mesh connected-island algorithm cannot be safely reused.
- Crucially, the source has a dedicated `WHeelsandrims_2` group with three source material primitives. The offline VEH-015 code partitions each actual source wheel triangle into a unique spatially separated front/rear and left/right wheel quadrant; no body mesh is touched. Each triangle's full face must stay in one wheel quadrant and each corner must satisfy envelope/symmetry checks. Failure makes the result `repair-required` with the original GLB as fallback.
- Verified output at candidate build: all 20,702 original wheel-group triangles partitioned exactly (front-left 5,059; front-right 5,057; rear-left 5,294; rear-right 5,292). Source materials, rendering modes, primitive attributes and normalization flags are checked again after GLB re-export.
- Candidate derivative: `/wheel001-generated/bmw-m4-competition.glb`, 1,445,280 bytes; SHA-256 `54a1781d523c55a592b44ebd878695e375ef4ca02f0ea1456b63cca4dea9a55c` from the 2026-10-19 offline trial.
- Four pivot names: `MVRS_bmw-m4-competition_<corner>_PIVOT` with complete three-material geometry beneath each. The final build regenerates the derivative rather than committing generated GLBs to the source repository.

### Lamborghini Temerario

- Immutable source: `public/Lamborghini+Temerario.glb`, 4,499,268 bytes; SHA-256 `9c5b6f5cc08da3eedaeed33cf59e44117b140f4a2d3dad894009921c06d00b79`.
- Actual source contains 782 render meshes and **four explicit, independent original wheel-control nodes**: `CTRL_Wheel_FL`, `CTRL_Wheel_FR`, `CTRL_Wheel_RL`, `CTRL_Wheel_RR`. These nodes contain the original wheel/tire/rim components, so no derivative geometry or generic topology slicing is required.
- The source is longitudinally oriented on its original X axis, with lateral wheel axle along Z; imported fitting aligns the vehicle's length to game +Z while wheel rolling stays around source-local Z. The original FL control starts with its own small authoring toe angle; preserve that base quaternion.
- Admission requires exactly four nonempty named control assemblies under the original source. A combined unrigged model remains parked; no wheels are invented.

## Runtime transaction and acceptance gates

- The existing vehicle loader imports BMW's qualified candidate derivative and Lamborghini's unmodified source. `prepareNativeFleetWheelRig` resolves the four actual pivots, then `evaluateWheelRigAdmission` verifies that each contains original wheel geometry.
- The cars inherit `FirstDriveTrial`, `extraDriveProfile` (+Z forward) and standard Rapier world collision. The parked static collider is released only after the dynamic actor is created successfully, preventing invisible collision duplicates.
- If rig qualification or dynamic actor creation fails, do **not** falsely claim it is drivable; keep the model parked and record its explicit failure. Never route either new vehicle through expensive runtime wheel-extraction.
- Retain real-wheel steering, signed rolling, reversing, actual road/tire contact policy, driver entry/exit, seated character and third-person camera. Compare geometry with the original static VEH-014 preview.
- No change to Range Rover accepted wheel logic, original Hilux/Defender/Dodge source-wheel meshes, or retired Ferrari/Buggy imports.

## Checkpoints

1. **Source geometry (passed for BMW):** 20,702 original wheel-group triangles = 20,702 attributed to exactly four pivots; no missing/duplicate geometry, normalized vertex attributes intact; candidate registry records hashes.
2. **Source hierarchy (passed for Lamborghini):** original `CTRL_Wheel_*` nodes and descendant wheel meshes discovered. Runtime Babylon pivot binding must still be verified.
3. **Build/test (pending until Vercel READY):** existing and VEH-015 tests, TypeScript/Vite build, exact GLB derivative availability, no incomplete wheel rigs entering drive system.
4. **User visual/driving review (pending):** BMW and Lamborghini in South Ward, press F to drive, accelerate, brake, reverse, turn both directions, inspect front steer and wheel roll (including tire and rim moving together), stop/exit/re-enter, ensure no stationary wheel duplicate, white/washed-out paint, wheel-ground clipping, silhouette damage or ghost collider. Verify desktop and mobile.
5. **Mobile cold start (pending):** first-playable-frame 60-second budget, including all six GLBs; recording/build readiness does not prove device-level performance.

Review acceptance and merge to `main` require separate owner confirmation.
