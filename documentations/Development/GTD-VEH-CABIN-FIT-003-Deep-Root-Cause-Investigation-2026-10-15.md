# GTD-VEH-CABIN-FIT-003 — Deep Root-Cause Investigation

**Date:** 2026-10-15  
**Investigation mandate:** Diagnose both owner-rejected defects thoroughly, prioritizing the protruding lower legs. No gameplay patch or new preview is authorized by this investigation request.  
**Status:** DIAGNOSIS COMPLETED FOR TWO REPRODUCIBLE FAILURE MECHANISMS; EXACT BROWSER-FRAME FORENSICS PENDING.  
**Priority 1:** Foot and calf mesh penetrating Ferrari underbody.  
**Priority 2:** Ferrari suspension illusion / visible tire-road separation after forward movement.  
**Controls:** Accepted AR1 seating branch `exp/veh-seat-001-ual-driving-loop-20261015`; failed Cabin Fit 003 branch `exp/veh-cabin-fit-003-20261015`. Production `main` unchanged.

This investigation extends the [Cabin Fit 003 Failure Register](./GTD-VEH-CABIN-FIT-003-Visual-Rejection-and-Failure-Modes-2026-10-15.md). User evidence: five browser screenshots of [Cabin Fit 003 preview](https://gtd-jmuh4d25r-interlinkglobaltech.vercel.app/game?gtdCabinFit003=1&gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1), including a low upward camera angle showing tire-road separation.

## 1. Evidence taxonomy and limits

**Verified from source:** Identifiable code branches, geometry selection and vehicle-controller architecture.  
**Reproduced with pinned real assets:** Exact imported GLBs and the deployed fitting source in Babylon.js 9.29.0 NullEngine, using GTD's current normalization, seat pose and vehicle scaling; this is stronger evidence than a fabricated skeleton or a simple synthetic floor.  
**Reproduced independently in Rapier:** Vehicle-scale box controller raised by a sidewalk overlap while wheel positions remained over lower road; confirms a physical mechanism capable of causing the reported float.  
**NOT measured:** The precise per-vertex leak and tire gap of the user's five rendered browser frames, because no synchronized live `__GTD_VEH_FIT_002_REPORT__` payload was provided. No source edit can retroactively make those screenshot metrics known.

Do not convert a headless reproduction or a physics proxy test into a claim that an exact user screenshot has been numerically explained.

## 2. Priority 1 — confirmed Cabin Fit 003 refusal mechanism

### 2.1 Real pinned specimen and pose reconstruction

- Ferrari: `interlinkglobal/JS-3D-Car` at `b2ce7c65e4e62e6486a39aed2c7dac89f7c0fa0f`, GLB blob SHA `435197c5f9b56e08c114505ee019dedbc3d033a3`.
- UAL: `interlinkglobal/three-player-controller` at `ca82bbc76a3b9b0afa80c73b60167adf6123b9b6`, GLB blob SHA `e236f349526637a5c829c408d48ce9d8fcde9cff`.
- Runtime methods replicated without repository edits: `imported-car-evaluation.ts` uniform 4.53-m fit and accepted +5% width / +10% height; `voight-humanoid-trial.ts` normalization to 1.78 m and visual-root origin offset; `driver-seat-placement.ts` driver offset `(.20 * width, .56 * height, -.04 * length)` with +π heading; exactly the current `driver-cabin-pose.ts` AR1 code.
- Reference relative pose in the reconstruction: Ferrari anchor origin (0,0,0), car dimensions (2.36810365, 1.35840468, 4.53 m), humanoid root (0.47362073, 0.76070662, -0.1812) metres. Translation of the complete scene would not change any relative gap.
- Imported Ferrari `carpet` supplied **180 near-horizontal support triangles out of 524**; the carpet world AABB in this reconstruction spans Y~0.2352 to 0.7356 m. The feet in the sampled seat pose **both resolved against valid carpet triangles**, so `outside-floor-footprint` was *not* the cause of failure in this reproduction.

### 2.2 Exact stage outcomes from the imported-asset reproduction

| Stage | Left sole below sampled carpet | Right sole below carpet | Cabin Fit 003 response |
| --- | ---: | ---: | --- |
| Original `Driving_Loop` without AR1 IK | 383.3 mm | 383.3 mm | Not enabled |
| **Accepted-branch AR1 fitting (Fit003 off)** | **139.1 mm** | **137.9 mm** | Not enabled |
| **AR1 + Cabin Fit 003** | **139.1 mm** | **137.9 mm** | **`too-deep` / `too-deep`; both lifts remain 0** |

The defined minimum clearance is 10 mm, hence Fit003 would have to resolve approximately **149.1 mm left and 147.9 mm right** in the reconstructed pose. The configured upper bound is **80 mm** for a correction. In `vehicle-cabin-envelope.ts::planSoleClearance`, any requested lift beyond 80 mm returns `too-deep`. In `driver-cabin-pose.ts`, that branch does not call the additional IK solver and does not update the `offsetLift` state.

**Verified conclusion:** For this realistic imported-asset case, the new fitting layer was *intentionally inert* rather than a failed attempt to move the feet. This quantitatively explains why the AR1-to-Fit003 screenshot could retain an exposed boot even though floor and skinning detection worked. The numbers are reconstruction outputs, **not exact measured depths in the user's screenshots**.

It is **not safe** to raise the 80-mm cap blindly: that would not establish a reachable pose, ankle orientation, upper-leg containment, door clearance, or animation stability.

### 2.3 Independent calf/leg gap: current sensor cannot detect full failure

The UAL skin contains **98 foot/toe-dominated vertices** and **157 calf-dominated vertices per side** under the same 0.55 skin-weight threshold. `skinned-foot-geometry.ts` caches only foot/ball groups; it does *not* test the 157 calf points (nor the lower portion of thigh geometry). In the imported-asset AR1 posture, the read-only scan of calf points against the carpet produced:

| Sample | Left calf | Right calf |
| --- | ---: | ---: |
| Calf-dominated points mapped onto carpet triangles | 118 of 157 | 157 of 157 |
| Sampled points more than 10 mm below their carpet | **38** | **36** |
| Worst sampled difference below carpet | **49.0 mm** | **48.1 mm** |

Thus there is another directly reproduced penetration condition which the actual fitting sensor does not measure. A calf vertex below an interior carpet support surface is **not automatically proved to be outside the Ferrari's exterior body**; an exact underbody/sidewall collision test is still missing. However, the reported visible yellow limb could be from foot, calf, or both. Its origin cannot be classified from the old shoe-only diagnostic.

### 2.4 Why the original acceptance metric is insufficient

At the reconstructed AR1 pose, foot *bone endpoint* errors were only about **15.1 and 17.4 mm**, correctly passing the 20-mm bone-endpoint criterion, while the deformed shoe mesh still sat **~139 / 138 mm below the carpet**. This establishes that **bone target convergence is not shoe or calf containment**. One lowest shoe point is also insufficient to certify a 3D body-volume constraint: the existing `carpet` triangle map is a floor, not a closed passenger compartment with seat, pedal, firewall, doors and underside surfaces.

Specific source limitations:
- `planDriverContactTargets` sets a provisional foot target at `Math.max(vehicleFloorY + 0.22, hipMidpointY - 0.22)`; it is not derived from real pedal/footwell clearance.
- `SkinnedFootGeometry.measure()` returns the minimum Y vertex across the selected foot/ball set, then `floor.sample()` queries just that point's XZ location.
- If the *single lowest point* is outside the floor footprint, no correction is possible even if other vertices penetrate. This was **a possible code path, not the path observed in the imported-asset reconstruction**, where floor triangles were found.
- The success flag `appliedLimbs` indicates joint endpoint convergence only. Do not treat it as a full-mesh fit proof.

### 2.5 Primary recovery design (NO implementation authorized yet)

**F0 — Capture faithful evidence:** instrument/render the accepted AR1 and failed Fit003 pose from a fixed position, animation frame, car-relative transform and camera; obtain actual foot/calf/toe/world points, existing footwell probe results, joint chain state and exterior hull intersections.

**F1 — Establish true cabin occupancy:** build a **vehicle-specific interior volume** in *car-local* coordinates. Identify actual Ferrari `carpet`, firewall/pedals, side panels, seat front and relevant underside mesh boundaries. Store contactable floor patches and forbidden exterior volumes. Do not infer geometry from a single bounding box or fit Buggy to Ferrari measurements. Prefer a preprocessing or calibration stage over per-render heavy triangle scans.

**F2 — Find a feasible lower-limb configuration:** solve thigh/knee/ankle/toe constraints together, maintaining actual skeletal lengths and a realistic bent-leg driving posture. Optimize across the *entire deformed lower-leg mesh* rather than raising an ankle a fixed amount. Preserve all accepted torso/head/back/shoulder world transforms. Snapshot and restore every affected lower-limb joint on rejection (including foot/toe if adjusted).

**F3 — Acceptance invariants:** require no lower-limb vertices outside the authored clearance volume, feet visibly forward toward pedals, no impossible knee or ankle orientation, no underbody penetration from low/overhead angles, and no new AR1 pose regression. Calibrate a new independent `CabinProfile` for Buggy only after its geometry is audited.

## 3. Priority 2 — confirmed mechanism for floating Ferrari

### 3.1 Source facts

- `first-drive-trial.ts` creates a **single kinematic rigid body** with a **full rectangular cuboid collider** of the imported Ferrari dimensions, not four suspension supports. It owns its Rapier KCC, whose `computeColliderMovement` and `computedGrounded()` use the cuboid to decide movement.
- The profile allows a vehicle autostep of **0.24 m** and ground snap of **0.25 m**. The real South Ward test harness documents **0.21-m curbs**. The KCC can legally step the **entire cuboid** up over an obstacle at its edge.
- Each rendered wheel is updated through a visual wheel rig. The optional independent wheel-height adaptation `gtdFitWheel002=1` is disabled in the owner's five Fit003 screenshots; it was not a tested safeguard.
- `first-drive-trial.ts::settleMeasuredTireFloor` can perform a one-time visual/chassis calibration only when four wheels match asphalt. After `contactCalibrationVerified` becomes true, it does not continuously re-validate when the car moves onto a raised edge or straddles a sidewalk.
- The status `grounded` describes KCC cuboid contact; it **does not** establish any of the four wheel tread gaps.

### 3.2 Read-only Rapier reproduction using Ferrari dimensions

A separate, uncommitted Rapier sandbox script instantiated a 2.3681 m-wide × 1.3584 m-high × 4.53 m-long kinematic vehicle cuboid, allowed autostep 0.24 m and ground snap 0.25 m, and drove forward next to a 0.21-m raised sidewalk starting at lateral X=1.05 m. The collider half-width was 1.184 m while both sampled wheel positions sat at X=±0.89 m on flat road (Y=0).

| Scenario | Maximum cuboid bottom height | Surface beneath each sampled wheel |
| --- | ---: | ---: |
| Cuboid touching raised sidewalk at X=1.05, sidewalk height 0.21 m | **~0.23 m** | Both ~0.00 m |
| Same but raised sidewalk only 0.11 m | **~0.13 m** | Both ~0.00 m |
| Sidewalk pushed outside chassis, X=1.35 | **~0.03 m** | Both ~0.00 m |

When the raised strip overlapped the **chassis** without overlapping the tires, the whole car floated roughly 0.10–0.20 m over the ground beneath its tires. The KCC ultimately reported **`grounded=true`** while visible wheel support remained absent. **This is a directly reproduced collision/control mechanism** that can explain a car that looks grounded from above yet visibly floats from an upward-looking camera.

**Scene-specific limit:** The synthetic sidewalk positioning was chosen to exercise the code's failure mode; it is not proof that the exact sidewalk boundaries beneath the owner's car were X=1.05 m or that this was the only cause in that frame. The screenshots and user report establish the visual failure and its onset during forward travel, but do not contain wheel/road telemetry for source-level attribution.

### 3.3 Why Cabin Fit 003 itself is not proven to cause floating

The new Fit003 flag enters the character `setDrivingCabin(..., fitCabin, kind)` path. It manipulates lower-limb joint quaternions and foot-target offsets. It does **not** call the vehicle body translation, cuboid controller or road-fit functions. Car vertical motion remains under the inherited `StreetVehicleActor.prepare/finish` path. Thus Fit003 is **not a direct vehicle-height control** in the inspected source. A coincident floating failure was observed, but direct causation by the *new* foot fitter has not been established. Repeat a same-position, same-driving-path A/B with the sole `gtdCabinFit003` flag toggled before claiming a new regression.

### 3.4 Independent grounding recovery design

**W0 — Ground-truth witness:** render all four tire-contact points, corresponding asphalt/sidewalk mesh IDs/heights, Rapier cast-ray support, collider bottom, chassis anchor and `computedGrounded` every sampled movement interval. Collect data before/after curb interaction and from low/upward-looking camera. Never infer wheel contact from KCC `grounded`.

**W1 — Correct support model:** separate **chassis collision against obstacles** from **wheel/terrain support and visual pose**. A whole-car box should not be vertically supported by a narrow sidewalk edge outside all tire footprints. Choose and document the target fidelity before implementation: four grounded tire supports with pitch/roll limits (kinematic approximation) versus actual physical wheel suspension. Preserve wall and garage no-step protection.

**W2 — Regression matrix:** test full and partial curb overlap, sidewalks of heights 0.11 and 0.21 m, level road, ramps, garage thresholds, transitions while steering or reversing, and movement near sidewalk edges. Test both car occupancy states so character fitting and car height cannot conceal one another. Require finite four-wheel mesh-to-rendered-support gap readings, not only `grounded=true`.

## 4. Engineering decision and staged next steps

1. **Priority 1 first:** stop trying to repair a 149-mm mesh deficit with an 80-mm shoe-only adjustment. Replace the shoe-point clearance approach with a full lower-limb-to-cabin volume fit. Test/approve its behavior in the real pinned Ferrari before touching Buggy or other imported cars.
2. **Priority 2 separately:** the chassis box/autostep architecture can demonstrably lift the Ferrari while tires remain over flat road; inspect and correct support authority independent of humanoid fitting.
3. **Protect AR1:** preserve owner-accepted seatback/head/torso placement, `Driving_Loop`, reflected skeletal transforms, Ferrari scale, mobile controller behavior and previously accepted road limits. No speculative global Y offset, visual mesh hiding, whole-body shrink or blind over-cap lift.
4. **Evidence gates:** with actual pinned assets, tests must measure rendered skinned vertex containment and four separate wheel tread-to-world support invariants. A TypeScript+unit-test+Vercel READY result is **not** G4 visual acceptance.
5. **No code patches or deployments from this document.** Root causes have actionable mechanisms, but the user's current authorization is investigation, not implementation. `main` remains unchanged; G4 stays open and G6 stays closed.

## 5. Appendix — inspection trail

Code reviewed on `exp/veh-cabin-fit-003-20261015`:
- `src/game/character/driver-cabin-pose.ts`
- `src/game/character/driver-joint-space.ts`
- `src/game/character/skinned-foot-geometry.ts`
- `src/game/vehicles/vehicle-cabin-envelope.ts`
- `src/game/vehicles/driver-seat-placement.ts`
- `src/game/character/voight-humanoid-trial.ts`
- `src/game/experiments/imported-car-evaluation.ts`
- `src/game/experiments/vehicle-probe-plan.ts`
- `src/game/vehicles/first-drive-trial.ts`
- `src/game/vehicles/street-vehicle-wheels.ts`
- `src/game/vehicles/street-vehicle-physics.ts`
- `src/game/vehicles/vehicle-road-surface.ts`
- `src/game/core/gtd-runtime.ts`
- `src/test/ferrari-rapier-world-integration.test.ts`
- `src/test/veh-cabin-fit-003.test.ts`

Tooling: Babylon.js 9.29.0 NullEngine on the actual two imported glTF binaries with Draco decoder for Ferrari, the *unmodified* deployed driver pose modules bundled read-only, and `@dimforge/rapier3d-compat` for independent kinematic curb reproduction. Scratch scripts remained in an isolated temporary Vercel sandbox; **no source patch** or new build was made to conduct this investigation.
