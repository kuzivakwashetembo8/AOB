# GTD-VEH-CABIN-FIT-003 — Interior Boundaries and Foot Containment

Date: 2026-10-15. **CURRENT STATUS: IMPLEMENTATION FAILED OWNER VISUAL REVIEW — HOLD; documentation only.** Automated build/test PASS, live character-foot containment FAIL (primary), tire/road grounding after forward movement FAIL (secondary). AR1 remains the accepted baseline; no production merge. [See failure register](./GTD-VEH-CABIN-FIT-003-Visual-Rejection-and-Failure-Modes-2026-10-15.md).
Baseline: AR1 owner-approved seating on `exp/veh-seat-001-ual-driving-loop-20261015`.
Implementation branch: `exp/veh-cabin-fit-003-20261015`.

## Problem statement

AR1 has established **sitting**: accepted upper-body posture in the Ferrari. It has not established general **fitting**: actual shoe geometry may pierce the car's underside, and future Buggy/cars have different cockpit proportions. Owner request: preserve AR1, investigate the originating limb/mesh geometry, and implement a reusable real-interior-boundaries mechanism without speculative global offsets.

## Evidence and verified asset capabilities

The pinned Ferrari `ferrari.glb` contains a true `carpet` mesh with material `Carpet` and an interior source-space vertical span approximately Y=0.214–0.669 m, distinct from the exterior vehicle anchor. It must be sampled from its **actual triangles**, not assumed to be a plane or blindly use the bounding-box bottom. The pinned UAL `ual.glb` contains skinned meshes `Mannequin_primitive0` and `Mannequin_primitive1`, with independent `foot_l/ball_l/foot_r/ball_r` bone influences. In the actual Babylon.js 9.29.0 NullEngine, `skeleton.prepare(true)` followed by `mesh.getPositionData(true,false)` responds to bone transform updates; therefore the runtime can identify the *visible deformed shoe vertices* rather than only an ankle pivot. Identical GLB Git object hashes were checked against the earlier AR1 audit.

**Unverified at authoring:** The exact magnitude, per-foot side, and location of the owner's leaked mesh in the successful gameplay viewport. Screenshots support visual leakage, not millimetric clearance. The new diagnostics must establish those facts from runtime geometry. Never report a hypothetical sole offset as a measured one.

## Design contract

1. A `VehicleCabinDefinition` identifies the vehicle class and real imported surfaces supplying footwell support; it does not inherit exterior body dimensions as a floor reference.
2. Each specimen has independent `cabinfloor` evidence, with explicit states `verified`, `missing-surface`, `outside-floor-mesh`, `invalid-geometry`. The Ferrari points at the real `carpet` mesh; Buggy's cabin profile is **unverified** until its actual floor can be identified. Do not reuse Ferrari measurements.
3. A shoe-sole witness queries CPU-skinned points *predominantly influenced by that foot/toe's bones* and computes the lowest actual world-space shoe vertex; torso and arms are not involved. No global model shrinking, feet hiding or moving the entire vehicle.
4. A correction is eligible only if the floor and shoe witnesses are finite, the penetration is **small and positive**, the new ankle goal is reachable, the two-link IK step converges and a post-step shoe witness is not worse. Reject and restore the previously accepted AR1 leg pose for any failure.
5. Clearance goal: at least 10 mm; cap trial adjustment at 80 mm. If the leak exceeds the cap or lacks a stable floor, fail closed and report; do not improvise a larger shift.
6. Do not rescan all scene meshes each frame. Cache imported floor mesh and shoe vertex influences when entering, perform bounded audits/correction attempts after the driving animation is evaluated; provide read-only on-demand report.
7. Opt-in `?gtdCabinFit003=1` in addition to AR1's flags; default legacy AR1 remains unchanged. Exit restores AR1 baseline.
8. G4 acceptance still requires actual side/overhead views, no boot/hand/torso regression, and future mobile verification. Automated unit tests alone cannot authorize main merge.

## Gates

G0: locate Ferrari floor and foot vertices; report real per-side deficits.
G1: prove localized lower-limb correction does not affect torso/root.
G2: validate new foot sole min against actual floor triangles and require reversible acceptance.
G3: test missing/unsupported Buggy profiles fail safely; provide registration contract for later calibrated vehicles.
G4: TypeScript/Vitest/build and isolated Vercel preview; collect owner visual evidence.
G6 remains closed under the original VEH-FIT-002 agreement until G1–G4 visual acceptance.

No main merge or replacement of the accepted AR1 preview. Document new results/limitations here after tests.


## Implementation evidence and verification — 2026-10-15

**Source commit:** `0c46cfb14a5a6bd74d5ebfca1988dc70b343eed8` on `exp/veh-cabin-fit-003-20261015`, branched from the accepted AR1 experiment. **Vercel build:** `dpl_AFEW4AWeGS7use8yQ6Z7usevh7pT` — READY. TypeScript and full Vitest build gate passed: **74 test files / 297 tests, zero failures**. The five new interior-boundary/policy tests passed; source code bundles into the PWA. This automated result alone **does not** establish live shoe containment.

**New implementation:**
- `src/game/vehicles/vehicle-cabin-envelope.ts`: imported-mesh-backed floor maps, triangulated carpet footprint, car-local coordinates that travel with the vehicle, and specimen identity. An uncalibrated Buggy explicitly returns `uncalibrated-vehicle` rather than inheriting Ferrari data. The actual Buggy GLB has seats and pedals but does not present a verified dedicated carpet/floor support material matching the Ferrari; pending calibration.
- `src/game/character/skinned-foot-geometry.ts`: reads actual *current CPU-skinned* foot/toe vertex positions from the pinned UAL skeleton. This is distinct from heel/ankle joint positions and does not hide/skew meshes.
- `src/game/character/driver-cabin-pose.ts`: retains all accepted AR1 transformations, head/torso/seat alignment, animation phases and hand fitting; opt-in `cabinFit003` checks the real floor and both deformed shoe bottoms on a bounded 20-frame sample interval. Only a real, modest positive sole penetration (<=80 mm) can propose a targeted lower-leg solve. Each candidate must improve the measured sole clearance; otherwise both lower-leg joint rotations restore to their prior successful AR1 state. No vehicle Y adjustment, no torso/arm/global character adjustment.
- `voight-humanoid-trial.ts` passes both actual UAL skinned meshes rather than treating a bone as a shoe sole. `gtd-runtime.ts` wires only the explicit `gtdCabinFit003=1` preview parameter. Without it the existing AR1 behavior remains unchanged.
- `src/test/veh-cabin-fit-003.test.ts` tests real-triangle surface sampling, moving-car transforms, missing Buggy calibration, nonexistent floor coverage and safe bounded correction plans.

**Pinned real-asset audit (isolated Babylon.js 9.29.0 NullEngine):** Git blob hashes matched the earlier AR1 audit for the pinned UAL/Ferrari GLBs. The Ferrari `carpet` mesh yielded **180 horizontal-support triangles**, with sampled source cabin heights approximately Y=**0.216–0.231 m** in common forward-cabin positions, rising outside that region as the real geometry dictates. The UAL foot-sole witness located **98 foot/toe-dominated skinned vertices per side** across `Mannequin_primitive0` and `Mannequin_primitive1`. Using `skeleton.prepare(true)`, changing a real foot bone quaternion changed the CPU-skinned positions; this verifies that the probe can follow animated geometry, unlike the previous unskinned ankle-point approximation. It is **not** a numeric measurement of the successful in-game screenshot's residual shoe penetration; the live runtime must provide that.

**Isolated preview:** https://gtd-jmuh4d25r-interlinkglobaltech.vercel.app/game?gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1&gtdCabinFit003=1

**A/B baseline:** Remove only `gtdCabinFit003=1` from the test link to preserve the original accepted AR1 pose. Diagnostic `window.__GTD_VEH_FIT_002_REPORT__?.().character.fittedDrivingPose.cabinFit003` supplies the vehicle floor identity, shoe vertex evidence, the specific foot side(s), witnessed signed penetration and accepted per-side lift. Unknown geometry is a failed witness, not a completed fit. Examine live *low-side and overhead* screenshots and the report for any remaining foot protrusion; check exit and re-board, driving animation, sidewalk/curb and mobile before closing G4.

**Acceptance state, as of the build:** Source integration and 297 automated tests PASS. **Superseded by owner visual rejection below: fitting FAILED and secondary grounding FAILED.** Existing owner-accepted AR1 seat posture remains the reference; production `main` unchanged. **G6 remains closed.**


## Owner visual rejection — 2026-10-15 (current acceptance gate)

**Disposition:** **FAILED — STOP Cabin Fit 003.** Five owner-provided screenshots of the actual `gtd-jmuh4d25r` preview supersede the provisional visual-PENDING status of this document.

**Full failure record:** [GTD-VEH-CABIN-FIT-003 Visual Rejection and Failure Modes - 2026-10-15](./GTD-VEH-CABIN-FIT-003-Visual-Rejection-and-Failure-Modes-2026-10-15.md).

1. **PRIMARY: Leg/foot escape persists.** Yellow/orange limb geometry remains outside the Ferrari's underside despite the new triangulated cabin carpet and CPU-skinned foot witnesses. This is the dominant unsolved problem; G4 cannot be accepted. The exact leaked vertex, limb segment and mismatch with carpet/underbody have **not** been physically measured from these screenshots.
2. **SECONDARY: Ferrari visibly floats after moving forward.** Tire/road separation is clear from a low viewing angle looking upward. Overhead or direct side views may mask it, so they are insufficient to prove four-wheel contact. The owner observed this during/after forward driving. Do not claim that Cabin Fit 003 caused the floating absent a controlled A/B and live wheel-contact telemetry.
3. **Technical versus visual acceptance must remain separate.** `297/297` automated tests and Vercel READY remain true of this rejected code build. They **do not** establish realistic fitting or grounding.
4. **Accepted baseline preserved:** The owner-approved AR1 primary seated posture remains a success and must not be undone for a quick cosmetic change. Buggy and other vehicle cabin profiles are unverified.
5. **Action boundary:** This message requests **documentation of failure only**. No gameplay source patches, no re-tuning, no new deployment, no `main` merge. Keep the rejected experiment reproducible. G6 remains closed.

**Next phase, only if authorized:** diagnose external foot/calf/shoe mesh against a complete cabin and underbody volume, then separately diagnose wheel-to-road contact with low-angle view and live Babylon/Rapier measurements.

## Read-only technical root-cause investigation (2026-10-15)

See [Deep Root-Cause Investigation](./GTD-VEH-CABIN-FIT-003-Deep-Root-Cause-Investigation-2026-10-15.md) for the direct actual-asset reproduction and separate Rapier curb support test.

- **PRIMARY VERIFIED FAILURE PATH:** In a reconstruction using the actual Ferrari, UAL Driving_Loop and existing AR1 transforms, sole-floor clearance deficits were ~139.1 mm and ~137.9 mm; including the required 10-mm clearance, proposed lift exceeded the permitted 80-mm cap, producing `too-deep` on both feet and **zero applied lift**. The existing sensor also omits calf-dominated vertices, with 38 left and 36 right points falling more than 10 mm below sampled carpet.
- **SECONDARY REPRODUCED MECHANISM:** The full-size Rapier cuboid can step the whole body ~0.10–0.20 m upward upon encountering a raised sidewalk edge **outside the sampled tire positions**. KCC then reports grounded while the wheels are visibly disconnected from lower road. This is a mechanism-level reproduction, not exact telemetry of the owner's screenshot.
- **BOUNDARY:** AR1 remains owner-accepted for basic seating. The failed Cabin Fit 003 and road-grounding concerns remain unaccepted. The investigation is **documentation only**, with no further code/preview authorization. G4 open, G6 closed.
