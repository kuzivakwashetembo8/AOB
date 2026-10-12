# GTD-WORLD-002 — Ferrari L0 Physics Hardening: Failure Modes, Remedies and Inheritance
**Date:** 2026-10-12 SAST
**Scope:** `feat/gtd-world-002-ferrari-l0-20261012` only; neither main nor the parked buggy is modified.
**Status:** TypeScript, complete automated test suite and Vercel production-style preview build PASSED on commit `dfd90d9` (deployment `dpl_5FvcRxtQcNWbQ4SejZndPnkjjLWu`). Live human/device acceptance remains OPEN.
**Asset rights:** External Ferrari/buggy GLBs remain provisional evaluation specimens; not approved for commercial GTD release.

## Why this patch exists
The owner confirmed L0 forward, reverse, steering and entry/exit, then identified three residual problems:
1. **VM-G01 — Excessive curb-climbing**: The Ferrari can cross the elevated garage threshold as though it were a normal roadside curb. The original `0.24m` Rapier autostep limit climbs a *real* `0.21m` street curb **and** a *real* `0.22m` garage sill. There is only a 1cm height difference; generic height alone is not an adequate way to distinguish a drivable roadway curb from a no-drive building entrance.
2. **VM-G02 — Intermittent airborne/hovering movement**: The owner observed a Ferrari suspended above the street; occurrence has not been reproduced consistently. The previous controller descended at only `0.24m/s` and could remain visibly elevated after leaving raised pavement. This is a plausible *source-backed failure mechanism*, not proof it caused every reported frame.
3. **VM-G03 — Sliding appearance / inert wheels**: The car can travel but its wheel roll/steering is not visibly credible. The original trial used `TransformNode.rotation.x/z`; glTF nodes commonly have `rotationQuaternion`, which supersedes Euler transforms. Wheel motion was not guaranteed and the provisional wheel radius `0.32m` was not derived from the source. This remains to be confirmed in a live imported GLB. Do not claim tire traction/suspension.

## Source-grounded geometry and behavior
- `urban-surface-renderer.ts` authored parity curbs: a box of height `0.21m`, center Y `0.105`; top `0.21m`. Parity sidewalks are `0.11m` high.
- `generated-first-light-world.ts#registerGarageThresholdCollision`: portal collision box center `building origin + 0.11m`, half height `0.11m`; top `0.22m`. The portal is a genuine blocking volume. Do not secretly make it 2m high to defeat a controller.
- A road curb may be a low negotiable edge; the higher garage entrance has explicit **no-step** semantics for cars. A future legitimate driveway needs an authored ramp/driveway classification, not a hard-coded exception for all buildings.
- The L0 car is a bounded kinematic Rapier chassis at a fixed 60Hz, **not** an autonomous traffic agent and **not** a wheel-contact dynamics simulation.

## Resolution contract

| ID | Detection and evidence | Implemented resolution | Fail-closed behavior / acceptance |
| --- | --- | --- | --- |
| VM-G01 | Ferrari crossing the garage sill while ordinary street curbs remain accessible | Retain genuine curb autostep; tag the existing garage threshold Rapier collider as `vehicleNoStep`. Test swept chassis intersections with those exact tagged shapes before committing movement | Must stop before entering a garage through its physical raised sill, but climb an ordinary `0.21m` pavement curb. No invisible enlarged collision objects. Check front, rear and oblique approach on live map |
| VM-G02 | Suspended body after curb traversal, unexpected sudden elevation, support gap, or nonfinite state | Replace constant slow descent with gravity-integrated vertical state, ground snap, bounded upward displacement and measured support gap. Vehicle actor publishes `grounded`, `airborneSeconds`, `maxUnsupportedGroundGapMetres`; logs one sustained unsupported movement warning | A car cannot remain artificially suspended due to a fixed 0.24m/s descent. Do not teleport to fabricated ground, exceed the movement solver's constraints, or hide errors. Existing 60Hz single Rapier step remains authoritative |
| VM-G03 | No wheel roll, wheel-axis inconsistency, front tires do not steer, or rotating the entire shell | Independently identify `wheel_fl/fr/rl/rr` nodes, use authored quaternion orientation multiplied by roll/steer quaternions, measure radius from genuine imported wheel geometry when credible; roll only by actual signed travel, steer front axle only | Missing pivots yield `wheelRigReady=false` and `missingWheelPivots` (not a fake physics success). Human verifies moving spokes/tire markings in the real preview |
| VM-G04 | A future sedan needs bespoke Ferrari import hacks | Shared `StreetVehiclePhysicsProfile`, `StreetVehicleWheelMapping`, grounding integrator and `StreetVehicleWheelRig`, with Ferrari-specific adapters and thresholds | New sedan supplies its own calibrated dimensions, wheel names, radius, axis orientation, limits and approved assets. Does not reuse Ferrari branding or source-license assumptions |
| VM-G05 | Human exits at original boarding point or teleports back to car | Retain existing safe current-position disembark with physical ground/capsule queries and post-first-entry proximity check | Exits at B, re-enters at B. A cannot remotely board a vehicle at B |

## Evidence and acceptance sequence
1. Inspect original world collision geometry; do not infer thresholds from screenshots alone.
2. Run real Rapier tests using a simulated `0.21m` road curb, protected `0.22m` garage sill, tall wall, drop-off, and actual vehicle-size chassis. Include a signed steering regression.
3. Run wheel rig tests with four glTF-style quaternion wheel pivots, forward/reverse signed travel, front steering and deliberate missing-pivot case. Pass tests with a sedan profile to demonstrate transferability.
4. Pass TypeScript checking, all repository tests and production-style Vercel preview build. No merge or production deployment.
5. **Owner browser validation (mandatory):** approach ordinary road curb, approach the actual South Ward garage sill, drive off sidewalk onto road without unnatural hover, visually watch every wheel turn/roll, move from A to B and exit safely. Repeat on mobile. Report screenshot/video/diagnostic `window.__GTD_DRIVE_TRIAL_REPORT__?.()` (local browser-only; no automatic upload).
6. Log remaining defects and adjust geometry/profiles, *not* traffic AI. Only owner can close VM-G01–G03.

## Important limitations
- Kinematic autostep is not genuine tire compression, suspension articulation, pitch/roll, weight transfer, slip or traction. Stable independent wheel transforms are the intended next realism increment.
- Center chassis ground support is not four independently simulated tire contacts; curb ascent is limited and may require further visual chassis interpolation.
- No assertion of the user's intermittent float's exact root cause until it is reproduced and its telemetry reviewed.
- Live glTF wheel hierarchy must be read through actual runtime diagnostics; names provided by the original Ferrari source controller do not prove every instantiated Babylon transform is present.
- Commercial licensing of the source Ferrari remains unresolved.

## Implementation evidence update (2026-10-12)
- Focused real-Rapier tests passed for 0.21m road-curb ascent, 0.22m tagged garage-threshold obstruction, 2.2m solid wall, signed steering, chassis descent from raised pavement and safe position-B exit.
- Quaternion wheel tests passed for four named glTF-style pivots, rolling distance, front steering, missing-pivot reporting and a custom sedan-style actor profile.
- The full repository test command, TypeScript type-check and production-style Vercel build completed successfully at runtime SHA `dfd90d938c35a76e4c2c81b83b95f328322453c0`.
- The build is source-code/NullEngine validated; **actual live-world wheel pivot count and occasional floating have not been independently reproduced/visually accepted**. Preview: https://gtd-h7gg535w5-interlinkglobaltech.vercel.app/game?gtdVehicleTrial=1
- Since only README/documentation changed after the validated runtime commit, the ready preview remains that exact tested runtime.

## Owner desktop acceptance and promotion authorization — 2026-10-12, 12:13 SAST

**Directive:** The project owner accepts EXP-VEH-002 Ferrari L0 fundamental movements as a correct development-stage baseline, explicitly authorizes merging the trial branch into `main` and requests a live production deployment for mobile testing. This is a **desktop gameplay acceptance**, not completion of subsequent car-physics refinement, mobile acceptance, commercial licensing, or ambient traffic AI.

**Owner-observed movement:** Forward/reverse, steering, acceleration, ordinary curb climbing, garage resistance, wheel roll/front/rear response and overall convincing car motion meet this stage's expectations. Intermittent floating was not reproduced in the latest owner session; retain VM-G02 diagnostic safeguards and treat future occurrences as separate regressions.

**Browser diagnostic supplied by owner (raw values, one snapshot):**

| Field | Owner-observed value |
| --- | --- |
| Experiment / asset slot | `EXP-VEH-002` / `sw-fl-authored-car-rear` |
| Vehicle class / context | `ferrari-evaluation` / `driving` |
| Speed / grounded / airborne duration | `0 m/s` / `true` / `0 s` |
| Observed driven distance | `1509.7046646873114 m` |
| Observed greatest support gap | `0.24418357610702512 m` |
| Tagged no-step threshold blocks | `420` ticks |
| Wheel pivots | `4`, `wheelRigReady: true`, `missingWheelPivots: []` |
| Rapier pose | `x=-5.184538841247559, y=0.9073792099952698, z=4.597155570983887` |
| Configured curb autostep | `0.24 m` |

The gap value is a **maximum observation over the run**, not evidence of a current floating condition: this screenshot sample explicitly reports `grounded: true`, `airborneSeconds: 0` and `speedMps: 0`. The 420 blocked ticks confirm the no-step guard executed; they are not a count of collisions or failures.

**Console note (not a vehicle error):** The preview browser reported a cross-origin `manifest.webmanifest` fetch blocked after Vercel's SSO middleware redirected the resource to `vercel.com/sso-api`. This is a **preview deployment authentication/manifest issue** distinct from Rapier movement, player controls and wheel simulation. Re-check manifest access on the canonical production domain; do not classify it as a Ferrari failure.

**Promotion rule:** After automated regression/build verification, make the accepted Ferrari controllable by default on main and the canonical production gameplay route **without** requiring `?gtdVehicleTrial=1`. Preserve the imported GLB startup gate, single car actor, parked buggy, canonical humanoid, collision protections and direct play controls. Development/evaluation asset rights remain unresolved; the production URL is a test environment, not a commercial distribution rights determination. No claim of full traffic AI, tire physics or final sedan model.

**Outstanding gate:** **Mobile acceptance OPEN** until owner tests on a mobile device. Consider touch/joystick behavior, 60Hz movement stability, no unexpected visual quality regressions and camera controls. This owner promotion does not automatically close the earlier nonreproducible VM-G02 symptom.
