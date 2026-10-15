# GTD-VEH-FIT-002 — Driver Contact and Four-Wheel Road Integrity: Root-Cause Audit and Staged Patch Plan

**Date:** 2026-10-15 (SAST)  
**CURRENT STATUS (2026-10-15): G4 VISUAL ACCEPTANCE FAILED; PATCHING PAUSED BY OWNER.** G1–G3 code exists on the isolated experiment branch but is NOT accepted. Automated results remain historical; no further corrective source changes, deployments, main merge, production release or G6 initiation without a new owner directive. See Section 14 and the [G4 failure register](./GTD-VEH-FIT-002%20G4%20Visual%20Failure%20Register%20and%20Patch%20Freeze%20-%202026-10-15.md).  
**Repository:** `interlinkglobal/GTD`  
**Documentation branch:** `exp/veh-seat-001-ual-driving-loop-20261015` (never automatically promote this plan to main)  
**Runtime baseline:** `929bbd46327433b6807534e3731562fdde562625`  
**Accepted visual preview:** https://gtd-8ovbu8kiu-interlinkglobaltech.vercel.app/game?gtdSeat001=1  
**Accepted invariant:** Stage-1 driver root `cabinForwardFraction=-0.04` and the visually improved seat-back/torso relationship.  
**Related evidence:** `documentations/Development/GTD-VEH-SEAT-001 Accepted Driving Loop Milestone and Seat-Fit Findings - 2026-10-15.md`; `documentations/Development/GTD-WORLD-002 Ferrari L0 Physics Hardening - 2026-10-12.md`; `documentations/Development/GTD-WORLD-003 Main Audit and Six-System Implementation Plan - 2026-10-13.md`.

## 0. Decision and strict boundary

The owner's four desktop screenshots show (1) a now acceptable rearward seat-back position, (2) feet/lower legs visible beneath the Ferrari, (3) hands close to but not touching the steering wheel, and (4) wheels intermittently hovering above the asphalt, with prior episodes of wheel intrusion. This plan addresses those as **two character-presentation faults plus one physically independent vehicle-support fault**. They are NOT a single origin-offset problem.

**No changes to production or runtime have been made in this work item.** Source files and tests were inspected, but no GLB bone-pose telemetry, four-wheel road probes, browser console export, device profiling or in-engine test was executed. Distinguish a proven absent constraint from an unmeasured offset. Do not call an exact measured wrist/foot/tire displacement “verified” until a live diagnostic supplies it.

Historical preauthorization condition: this initial plan required the owner's approval. **Superseded by the owner's subsequent explicit authorization of G0 through G4.** Preserve main, all approved South Ward content, and manual intentional Vercel releases.

## 1. Root causes: source-proved facts versus measurements still required

### RC-01 — lower legs/feet intersect vehicle underside

**Direct evidence:** `src/game/vehicles/driver-seat-placement.ts` computes one XYZ/yaw pose for the whole humanoid. Its only Stage-1 change was local cabin fore/aft fraction `-0.12 -> -0.04`: `0.08 × 4.53 m ≈ 0.3624 m` toward the backrest. `aboveRoadHeightFraction=0.56` and lateral fraction `0.20` remain unchanged. `src/game/core/gtd-runtime.ts::syncFerrariDriverSeat` applies that one root transform. `src/game/character/voight-humanoid-trial.ts` loads a pinned UAL GLB and switches to its exact `Driving_Loop`, with no hip/knee/ankle/foot adjustment or car-local footwell target.

**Verified explanatory mechanism:** changing the character's entire fore/aft position cannot independently modify where the animated feet fall relative to the seat cushion/floor/pedals. The binary's generic driving pose is not retargeted to this Ferrari's cabin. Pedestrian normalization sets character height to `1.78 m` and its normalized visual origin to a fixed `-0.9 m` offset; neither is a driving-specific calibration.

**Not verified without runtime measurement:** exact penetration depth; whether one/both sole geometries cross the floor; source hip/ankle frame coordinates; accurate footwell floor height; influence of car heave on the screenshots. Do not attribute all exposed feet to car suspension: a correctly grounded car can still have invalid leg posing.

### RC-02 — hands hover instead of gripping the wheel

**Direct evidence:** `enterDrivingPose()` only switches skeletal animation groups. The `Driving_Loop` is a generic clip; there is no per-Ferrari wheel-hub/grip transform, two wrist contact targets, arm calibration layer, hand/finger grip stage or frame-update contact solver. The `0.3624 m` backward translation also moves the unchanged animated hands away from an unmoved steering wheel.

**Verified explanatory mechanism:** there is no positional contact constraint to enforce coincidence of the two hands and real steering wheel at any driving frame. A generic driving reach need not terminate at this GLB's steering-wheel rim.

**Not verified without measurement:** actual wrist-to-grip distances, which side fails by how much, whether hands are oriented toward rim, whether a simple shoulder/elbow overlay can reach without unnatural extension, and whether the steering rim has a stable pivot in this GLB.

### RC-03 — visual tire/road contact does not follow the chassis simulation

**Geometry and contact audit:**
1. `src/game/world/first-light-runtime-source.ts` selects `generated-first-light` at runtime.
2. `src/game/world-generation/urban-surface-renderer.ts` draws `generated-parity-main-road` as a box with centre Y `0.015`, thickness `0.030`, visual top **Y=0.030 m**; rear road centre `0.018`, thickness `0.035`, top **Y=0.0355 m**. Visible centerline and crosswalk boxes are additional nonphysical overlays.
3. `src/game/world/generated-first-light-world.ts::createGround` creates the actual broad Rapier floor box at Y `-0.12` with half-height `0.12`, physical top **Y=0**. `registerUrbanNavigationCollision` registers curbs and selected sidewalk tops, **not the visual asphalt boxes**. Thus asphalt support and asphalt pixels are not an identical surface.
4. `src/game/experiments/imported-car-evaluation.ts::modelBounds` normalizes the Ferrari's floor with the **global minY among all imported meshes**, not with four actual wheel-tread minima; it separately applies trial shape multipliers **width ×1.05** and **height ×1.10** (through the asset fit). The normalized model floor therefore need not equal each tire bottom.
5. `src/game/vehicles/first-drive-trial.ts` creates ONE kinematic full-car cuboid collider with its centre at `anchor.y + dimensions.y/2 + 0.035`, i.e. its initial collider bottom is 0.035 m above visual-anchor Y. The kinematic character controller is created with a `0.02 m` offset. After each physics step, the same 0.035-m mapping is reversed to update the visual anchor.
6. Car driving uses `computeColliderMovement` for this cuboid, with `maxCurbAutostepMetres=0.24`, `groundSnapMetres=0.25`, bounded climb and gravity. Clearance is calculated relative to a **chassis box**, not the four actual wheel contact patches; the entire car can be lifted when the chassis collides with a curb/sidewalk. Earlier real-world run recorded maximum centre support gap `0.24418357610702512 m`; this was a **historical run maximum**, not proof of hovering at the moment sampled.
7. `src/game/vehicles/street-vehicle-wheels.ts` finds wheel pivots and uses measured/fallback radii to animate roll/steer only. It does not use those radii for collider floor support, vehicle pitch/roll, or wheel-ground sampling. `StreetVehicleActor.finish()` casts a **single downward support ray beneath chassis centre**, so its `grounded` status and maximum gap cannot certify tire contact for each wheel.
8. `src/game/physics/rapier-world.ts` advances Rapier once in `movePlayer()`; the driver branch of `gtd-runtime.ts` already uses prepare -> world step -> finish. Keep single-step ownership in any patch.

**Verified explanatory mechanism:** four different reference systems (rendered asphalt height, broad collision floor height, cuboid bottom/skin, imported model/tire position) are not bound by a tire-contact invariant. The car can be “grounded” at a chassis contact and nevertheless render wheels above/below the pictured road. The ~3-cm source-level main-road visual/physics separation and explicit 3.5-cm chassis offset are exact constants. They are **not** proof that their sum is the observed hover gap; skin behavior, asset wheel-minY, curb contacts and live pose must be measured.

**Still open:** Which collider actually supports each screenshot frame (world floor, 21-cm curb, 11-cm sidewalk, garage threshold or other world geometry)? Signed vertical gap under each tire? Which mesh vertex is the current imported asset's floorY? Are apparent wheel penetrations due to rendered road versus physical floor, or collider movement/transient autostep? Avoid declaring a single variable or adding a blanket upward/downward offset until telemetry resolves this.

### RC-04 — automated validation did not inspect the actual visual geometry

The current `src/test/veh-seat-001-ual-driving-loop.test.ts` tests clip-name selection and root pose mathematics. `src/test/ferrari-rapier-world-integration.test.ts` tests directional driving, curbs, thresholds and exit on a NullEngine scene with a **dummy car TransformNode**; `src/test/street-vehicle-wheels-grounding.test.ts` checks quaternion pivots and vertical policy, not wheel contact against live Ferrari geometry. Therefore a READY deployment and passing tests cannot establish footwell clearance, wrist-on-wheel contact or road/tire contact. The verification gap is a distinct root contributor to the regression reaching human review.

## 2. Stage dependency and approval gates

Use separate commits/preview checks; stages never silently absorb another discipline:

| Gate | Scope | Expected deliverable | Requires owner implementation approval? |
| --- | --- | --- | --- |
| G0 | Read-only geometry witness of existing running rig/car/road | Complete world-space contact measurements, screenshot/diagnostic correlation; identify highest contributing mechanisms | Yes, before writing instrumentation |
| G1 | Footwell/lower-limb adjustment only | Legs face pedals, soles stay inside footwell; preserve accepted torso and exterior world | Separate approval |
| G2 | Steering rim/wrist/arm adjustment only | Both hands touch actual wheel rim, relaxed elbows, no reach beyond natural length | Separate approval |
| G3 | Vehicle support/visual wheel integrity only | Four wheel tread/road top contacts satisfy tolerance over straight roads/curbs; no tire penetration or float | Separate approval |
| G4 | Integrated desktop/mobile and performance acceptance | Complete regression matrix, field evidence and owner sign-off | Separate release/merge authorization |

**Recommended order:** G0 -> G1 -> G2 -> G3 -> G4. G3 may be developed independently in its own branch after G0, but do not merge fixes into one unreviewable commit. The user retains control of every implementation gate.

## 3. G0 — instrumentation and direct verification specification

Create a reversible, read-only `VEH-FIT-002` diagnostic behind `?gtdVehFit002=1` on a nonproduction preview, or export measurements in the console without any persistent UI overlay. Preserve existing `?gtdSeat001=1` to render the driver. Never send user diagnostics off device automatically.

### 3.1 Common coordinate and reference capture

On real imported GLBs, sample **Babylon world matrices after skeletal animation evaluation**, including all ancestor transformations: Ferrari anchor, shape scaling, orientation and imported origin; Voight root, visual-root normalization and pose; actual wheel pivot orientations. Report axis convention, units (metres), Y-up, wheel-local front sign, timestamps, and sampled frame state.

Freeze stable scene references once per model load; avoid repeated `getChildMeshes()` and full skeleton scans every frame. Resolve named wheel pivots using existing mapping, then inspect descendant tire mesh vertices/bounds only during diagnostic sampling. Locate steering wheel rim/center and driver's seat/backrest/floor/footwell with either existing imported node landmarks **if real nodes exist**, or explicit noninvented mesh geometry landmarks chosen during one-time asset inspection. If geometry is not separable, report `unresolved` rather than fabricate a node name or contact point.

Resolve UAL left/right hip, knee, ankle, toe/sole, shoulder, elbow, wrist and hand landmarks from the imported actual skeleton (possibly via skinned vertices when suitable). Report bone presence, local and world transforms, active animation `Driving_Loop`, normalization and blend state. Never assume Mixamo names or a universal skeleton hierarchy.

### 3.2 Signed contact and penetration witnesses

- `footSoleToFloor`: signed distance along a verified cockpit floor normal from each actual foot sole to the local target footwell surface; include forward-in-footwell containment, calf/shin intersections where possible, and visibility below the Ferrari underside. Negative means penetrated.
- `wristToGrip`: 3D distance between each current palm contact marker and independently measured left/right wheel-grip target, plus elbow flexion angle, palm orientation error and maximum reachable arm length.
- `tireRoadGap[FL,FR,RL,RR]`: world-space tire tread bottom Y minus **rendered asphalt top at each actual wheel X/Z**, with matched physical Rapier support hit Y, hit collider identity/category, wheel radius, source mesh tread bounds, chassis collider bottom and KCC `grounded`.
- Record visual-vs-physical asphalt surface delta, live chassis/root vertical offsets, support gap, vertical velocity, curb-autostep and snap state; distinguish center support from all-four-wheel contact.
- For each metric record `available:true/false`; display invalid data as `unmeasured`, never silently default to zero.

**Test matrix:** straight main Mercer road, Foundry rear road, side Workshop road, painted lines, near curb (without touching), 21-cm curb approach/ascent/descent, protected 22-cm garage sill, idle on level street, forward/reverse, 90°/180° headings, turns, and a safe drop-off if geometry exists. Sample several stopped frames and a bounded moving trace to distinguish static calibration from transient flight. Compare matching low side / overhead / rear screenshots.

**G0 exit:** A signed contact table for all real feet, wrists and tires; proof of actual scene references and which world mesh/collider was hit; diagnosis for visual tire float versus prior sinking; short raw diagnostic export with sensitive/unrelated user data excluded. If unavailable, stop and report missing witness before choosing offsets.

## 4. G1 — footwell fitting: minimal pose correction

**Goal:** Keep body seated against approved backrest while feet enter the cockpit floor/pedal space. No vehicle vertical lift and no root fore/aft rollback.

1. Freeze `FERRARI_SEAT_POSITION.cabinForwardFraction=-0.04`, along with seat lateral fraction/yaw and existing character height. Convert the measured footwell geometry from Ferrari local into Voight/UAL visual and skeleton coordinate spaces with full matrix composition, including nonuniform Ferrari scale.
2. Identify footwell floor and feasible calf-to-pedal path. Compute intended left/right foot contact destinations inside available footwell volume and below dashboard, with knees flexed and no visible shins outside the body. Treat any true car mesh floor clearance as inviolable; do not “fix” by hiding mesh materials.
3. Prefer a deterministic **small additive correction layered after the imported `Driving_Loop`** for hip/knee/ankle rotations, scoped to driving only. Check bone IDs and animation group target ownership; an additive track must be applied in a reliable per-frame animation phase so that the underlying GLB clip does not overwrite it.
4. If direct bone calibration cannot satisfy the measured limb geometry, evaluate a limited existing-rig two-bone leg solver (hip/knee/ankle) with stable knee bend and joint limits; NOT a replacement humanoid model or a generic procedural character engine. The fallback must be opt-in and isolated. Do not introduce a new GLB or pose system without explicit escalation.
5. Bound limb motion and avoid unnatural contortions. Disable these overrides on exit, flying/walking or missing clip; restore the canonical original walking animation accurately after any transition.
6. Test no lower-body visibility under chassis from left/right low side, underneath where possible, overhead and moving camera angles, including braking, reversing, turning, steering and a stopped car. Check body position remains against backrest and arms unaffected.

**Proposed measurable acceptance:** zero visible boot/shin/chassis penetration; floor containment with nonnegative signed clearance except separately intentional sole-to-pedal contact; feet forward relative to hips and anatomically believable knees; accepted torso root remains unchanged. Define numerical tolerance from G0 model resolution, not guess a vertical constant beforehand.

**Touched code (proposal):** `src/game/character/voight-humanoid-trial.ts` (driving-only pose layer), a new `src/game/character/driver-footwell-fit.ts` for tested pose constraints; `src/game/core/gtd-runtime.ts` only for explicit lifecycle binding; dedicated tests for bone-limit matrices and exit restore. `driver-seat-placement.ts` only if G0 proves an independent non-fore/aft correction is necessary, requiring owner reapproval.

## 5. G2 — steering-wheel contact without straight-arm reaching

**Goal:** Hands contact real Ferrari wheel rim with a controlled bend. No fake painted hands or rigidly extended arms.

1. At G0-confirmed real steering wheel center, plane/orientation and radius, define two valid left/right grip points relative to the Ferrari cabin/wheel transform; document grip convention before implementation. If wheel steering rotation animates, update grip points with the **real steering-wheel node** if present; if not, keep them fixed and document that limitation rather than invent mesh motion.
2. For each frame in driving pose, transform both grip points to the character skeleton frame, compare current wrist/palm positions and reachable joint-angle envelope. Distinguish hand **position**, hand **orientation**, and finger placement; matching one does not imply a real grasp.
3. First attempt a small driving-only shoulder/elbow/wrist offset or pose overlay layered after the clip. Require visible elbow flexion and a relaxed shoulder angle; retain the successful current overall reach. If unavoidable, introduce a bounded two-bone arm solver per side; lock other bones and keep original UAL skeleton.
4. Maintain contact through car turns, idle, motion and camera changes; do not conflate vehicle steering input with wheel mesh rotation if the wheel lacks an authored animated pivot. Update contact after the car's final world matrix but before the frame is rendered. Do not write physics velocities or move the car to follow the hands.
5. Exit/enter failure: no stale steering targets, avatar hand snap after disembark, or duplicated animation observers. Report target missing rather than silently counting a grip as passed.

**Proposed measurable acceptance:** hands visibly touch the steering wheel in top/side/rear interior/exterior frames; both grip errors within a G0-derived tight tolerance (initial engineering objective <= 5 cm for palm contact marker), no outstretched locked elbows and no chest-to-wheel regression. Separate finger fidelity from palm contact; no finger IK unless explicitly approved.

**Touched code (proposal):** new `src/game/character/driver-wheel-hand-fit.ts`, driving clip layer hooks, Ferrari visual-landmark adapter (not direct dependency on a Ferrari-branded skeleton). No new 3D art required unless real wheel markers prove absent.

## 6. G3 — wheel-to-road integrity: physically grounded, visually consistent

**Goal:** Each rendered tire's tread stays at the actual roadway support when stationary and moving; preserve collision correctness and intended 21-cm curb behavior. This is a **separate vehicle-physics task**, not a character foot-height fix.

### 6.1 G3-A: isolate baseline static errors

1. Add G0 comparison assertions: for each tire at rest on flat Mercer, record `renderedRoadTopY`, `RapierRoadTopY`, `tireBottomY`, `wheelCenterY`, fitted radius and `chassisBoxBottomY`. Record current difference between visual road (0.030 m) and global collision floor (0 m).
2. Determine which vertex sets cause the imported `modelBounds().floorY` minimum. If the lowest rendered model feature is not tire tread, define a car-specific local visual floor-to-wheel contact offset from actual wheel geometry. Do NOT hard-code `0.32 m` wheel radius as a physical truth: fallback radius is an animation value.
3. Quantify effects separately: full-car box's built-in +0.035 m centre offset, controller 0.02 m margin, asset minY bias, and 0.030/0.0355-m asphalt-to-physical-floor delta. For each potential change, state whether it affects physics body, rendered mesh, road, or diagnostics.
4. On straight road **only**, choose the smallest coherent correction so the avatar/car world-coordinate systems share one authoritative surface. Prefer explicit visual-road/physical-road agreement or a measured vehicle contact adapter, not an arbitrary global camera/mesh lift. Preserve existing sidewalk/curb physical heights and foot support.

### 6.2 G3-B: four-wheel support invariant

1. After static alignment, extend vehicle support from one centre ray to **four tire-contact footprint probes**, using actual wheel pivot world matrices and geometry-derived radii/lowest tread positions; distinguish road from curb, sidewalk, building and no-step portal colliders.
2. For each active wheel, cast robust downward support rays/shapes in the authoritative Rapier world; ensure no self-hits, avoid querying decorative meshes, and cap ray ranges. Compare to the corresponding rendered surface height at that XY/XZ point for visual parity.
3. Produce a desired coherent car pose based on support of the contact set. On level ground use stable height; on shallow uneven ground calculate bounded pitch/roll if necessary; maintain all collision constraints. A four-wheel contact point set may not be coplanar: define suspension or compliance rules so one unsupported wheel is not falsely claimed grounded. **Do not impose four exact contacts when a car physically straddles a high curb or is airborne.**
4. Preserve safe dynamic behavior: finite bounded vertical velocity and displacement, nonpenetration by swept chassis collider, strict garage no-step footprint protection, 21-cm curb ascent, genuine obstacle blocking and exactly one central Rapier step. On high-speed/drop-off transitions, use controlled landing rather than visible snapping or teleporting.
5. Investigate whether to keep the existing chassis KCC with a wheel-informed support height correction as a focused GTD L0.5 stage or whether a separate suspension-ready shared vehicle actor is necessary. The second option requires new explicit authorization after an A/B prototype; **do not automatically replace driving physics with a full dynamic four-wheel solver**.
6. Integrate driver sync against the final car pose. Any pitch/roll extension must propagate via a full relative transform (quaternion/matrix) to the seated avatar so its approved seat-back alignment does not detach on elevation changes. Verify camera look/follow is stable and wheel roll/steer remain working.
7. Data lifecycle: cache four wheel references, destroy probes cleanly with vehicle, perform measured low-cost contact queries at fixed 60Hz, and do not add per-frame full-scene raycasts against all meshes. Handle missing pivot or missing asphalt gracefully, with truthful diagnostic fault state and safe L0 rollback.

**Proposed contact acceptance on verified flat drivable asphalt:** signed tread-to-visible-road gap targeted within +/-0.015 m at rest for all four tires, no visible floating or sinking at ordinary gameplay camera distance. For moving asphalt, use a G0-derived allowance of at most +/-0.03 m during bounded transient frames where contact is physically expected, with no persistent error; report larger gaps and classify genuine airborne/wheel-lift conditions separately. These are proposed engineering tolerances, **not measurements of the current preview**. Do not count road-paint plane intersections as chassis support.

**Touched code (proposal):** `src/game/vehicles/first-drive-trial.ts`, `street-vehicle-physics.ts`, `street-vehicle-wheels.ts` (read-only wheel geometry accessors, not fake visual rig), `src/game/world/generated-first-light-world.ts` / `urban-surface-renderer.ts` only after G0 confirms the least disruptive surface harmonization, a new vehicle support/contact module, dedicated real Rapier regression fixtures. Avoid changing every South Ward static collider as a workaround.

## 7. Verification contracts: no premature PASS

### Source and deterministic unit tests

- `VEH-SEAT-001`: preserve seat-root -0.04, forward/lateral/yaw axes, all cardinal headings, invalid-number rejection and Ferrari pose-follow test.
- New character tests: actual mapped skeleton joint set, no override when clip missing, deterministic pose layer after clip, frame-to-frame footwell clearance with captured real-model fixtures, valid elbow angles, grip world matrix under yaw and nonuniform scaling, enter/exit/flight/walking cleanup.
- New world geometry test: actual generated Mercer main/rear asphalt visual tops and registered broad Rapier floor support; ensure those heights cannot drift silently after fixes.
- New Rapier + imported wheel contact fixtures: four wheels measured from real geometry (or explicitly recorded fixture mesh), road surface Y != physics Y, car origin normalization minY != tire bottom, curb on one side, shallow drop, no-step garage, red/green support states, steering/rotation, reverse, high-speed collision, initial/late-frame transient, car entering/exiting.
- Headless tests cannot substitute for rendered screenshots or live GPU timing.

### Whole-app regression and deployment

Run existing `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` with repository-approved dependency versions; report counts and failures without guessing. Validate ready preview build from the exact head commit for each stage; do not confuse README/doc-only commits with actual runtime validation.

On real browser, inspect daytime and night views (lighting cannot hide the test), desktop high-density and mobile landscape/low-power. Verify flat street, sidewalk crossing, protected garage, spawn, nearby buildings, walking, flying, boarding, idle driving, turns, reversing, braking, stop-and-exit, player/camera viewpoint and renderer responsiveness. Record before/after static captures with the same vehicle X/Z/yaw and time-of-day; save diagnostic contact table. Require no new shader/world visibility regression, no freeze, no duplicate skeletons or long-lived observers.

Performance: compare median and P95 frame time, per-frame contact-query count, active meshes and memory/GC trend to **measured baseline** under equal graphics settings. Do not assert an arbitrary mobile FPS PASS from unit tests. If cost regresses materially, reduce diagnostic overhead first; if contact solver still exceeds agreed device budget, stop at gate and reassess scope.

**Release policy:** Stage branches first; manual Vercel preview after passing gates; user desktop acceptance; user mobile acceptance; separate explicit authorization to merge/deploy main. The source Ferrari and UAL specimen remain evaluation assets with unresolved final product licensing/art sign-off.

## 8. Failure modes and reversible controls

| Failure mode | Guardrail | Rollback |
| --- | --- | --- |
| Pose adjustments get overwritten by UAL `Driving_Loop` | Apply scoped layer in tested phase after clip evaluation; verify each sampled frame | Turn off G1/G2 trial switch; restore unchanged clip |
| Feet hidden instead of fitted | Validate actual geometry distances and low-side visibility; no mesh/material masking | Restore G1 pose and keep accepted root |
| Arm reach mechanically impossible | Measure maximum reach and limits before solving; abort if no plausible grip | Restore G2 pose without changing seat |
| Misidentified GLB wheel/steering nodes | Validate real names, mesh descendants, coordinate handedness and transforms | Keep original adapter and report missing landmarks |
| Chassis floats due to edge/curb contact | Compare four support identities and full chassis swept collider; handle transitional wheel lift | Return to original KCC vehicle actor |
| Car sinks after global ground adjustment | Never shift world/roads wholesale without exact visual + Rapier parity and pedestrian regression | Revert isolated road/support change |
| KCC and wheel solver both move body | Keep one authoritative vehicle translation and one world step; forbid duplicate motion writes | Disable new contact policy |
| New pitch/roll detaches driver/camera | Recompute child pose from full vehicle world matrix, preserve established seat-back fit | Disable orientation extension |
| Missing asset/clip on mobile | Fail explicitly, no synthetic PASS or obsolete placeholder actor | Keep original L0 hidden-driver behavior if clip absent |
| Performance regression / memory leak | Cache nodes, bounded probes, dispose observers and diagnostics; measure P95/GC | Disable feature flag per stage |

## 9. Owner decision checklist (not implementation approval)

**Already approved:** Backrest/torso improvement from the `0.08 × length` rearward root translation. Retain it.

**Pending stage-specific approval:** G0 live diagnostics; G1 lower-leg fitting; G2 wheel-grip fitting; G3 tire/road support and possible narrow road-collider alignment; G4 integrated acceptance and promotion. A document commit does not authorize implementing any of these.

**Closure requirements:** Feet and lower legs do not visibly leak beneath the car, both hands make credible steering-wheel contact without straight elbows, all four tires rest on the rendered asphalt when physical contact is expected (without sinking or persistent gaps), existing South Ward physics and walking/boarding remain intact, and preview passes owner desktop/mobile verification.

**Next action:** Await explicit owner authorization. No runtime patch, preview generation, merge, release or production change under this research-and-planning request.


## 10. Implementation progress / diagnostic handoff — 2026-10-15

**Owner instruction:** Authorized G0 through G4. This authorization enables implementation in order, but **does not convert an unmeasured joint/wheel geometry guess into evidence or automatically approve production promotion**.

**Implemented G0:** An opt-in, on-demand `?gtdVehFit002=1` witness, created in `src/game/vehicles/vehicle-fit-diagnostics.ts`, queries actual wheel pivot descendants, world-space bounding geometry, visual parity asphalt tops, and Rapier downward support rays that exclude the Ferrari's own chassis. It also collects available UAL named bone landmarks, current driving animation and a steering-wheel candidate if the actual imported node is discoverable. This performs no per-frame scans or car/character mutations. A synthetic four-wheel/road regression fixture was added as `src/test/veh-fit-002-contact-witness.test.ts`.

**G0 browser handoff:** On the G0 preview, open `/game?gtdSeat001=1&gtdVehFit002=1`, board the Ferrari, then run in browser DevTools:

```js
copy(JSON.stringify(window.__GTD_VEH_FIT_002_REPORT__?.(), null, 2));
```

Paste the copied JSON and matching location screenshot into the development conversation. Repeat at one location with conspicuous wheel clearance and at one location with tire intrusion, if reproducible. The report function is absent unless the experiment was explicitly enabled. If `steeringWheel.found=false` or `character.bones.missing` includes expected joints, stop and inventory the actual imported GLB; do not guess identity/positions.

**G1–G3:** Not yet applied because G0's live actual-model contact distances (not available in a headless repository audit) are required for selecting correct arm/leg targets and discriminating chassis-contact versus road-surface causes. Source-level structural issues are confirmed, but exact correction values are not. G4 full user-facing visual acceptance remains pending. No production deployment or main merge made.

**Build evidence:** A G0 preview was requested on Vercel from `5e9d9c7` (READY at https://gtd-k7h1dipba-interlinkglobaltech.vercel.app/game?gtdSeat001=1&gtdVehFit002=1). The initial fixture run (`41c373d`) correctly failed one new test because the synthetic Rapier query pipeline had not been stepped before sampling. The corrected fixture (`ba35e945`) has passed the project's Vercel production-style build gate, which executes `npx tsc --noEmit && npx vitest run && npm run build`. The new G0 preview is **READY**: https://gtd-7hem47h4u-interlinkglobaltech.vercel.app/game?gtdSeat001=1&gtdVehFit002=1. This verifies the build and automated suite, not the actual live GLB bone, tire or steering-wheel measurements. The G0 build is not visual approval of the yet-unimplemented G1–G3 patches.

**Control:** Owner authorization for G1–G4 stands. Resume implementation after the real G0 telemetry has established the missing geometric measurements, without requesting redundant authorization.


## 11. Authorized implementation and actual source witness — October 15, 2026

**Input:** The owner supplied five captured frames of the G0 diagnostic preview and an exact live `gtd.veh-fit-002.contact.v1` JSON from a stopped Ferrari after ~57 m of travel. Vehicle pose at the measured stop: visual anchor `(-21.3946,0.19306,11.3973)`, yaw `4.75403`; chassis dimensions `(2.3681,1.3584,4.53)`; KCC `grounded=true` although wheel support varied side-to-side.

**Actual support map (metres):**

| Wheel | Bottom tread Y | Visual asphalt | Rapier support Y | Visual road gap | Surface explanation |
|--|--:|--:|--:|--:|--|
| Front left | 0.04464 | N/A | 0.11000 | N/A | Sidewalk-side support, not asphalt; visual sidewalk top Y=0.11 |
| Front right | 0.04754 | 0.03000 | ~0.00000 | +0.01754 | Tire floats ~17.5 mm above rendered asphalt |
| Rear left | 0.04464 | N/A | 0.11000 | N/A | Sidewalk-side support, not asphalt; visual sidewalk top Y=0.11 |
| Rear right | 0.04464 | 0.03000 | ~0.00000 | +0.01464 | Tire floats ~14.6 mm above rendered asphalt |

The 0.11-m raised sidewalk physically supports one pair of wheels while the opposite pair sits over ground whose Rapier top is 0.0 m. **A single rigid, yaw-only full-chassis collider cannot independently conform all tire contacts to differing surface heights.** The imported wheel geometry also has a local tread minimum about 0.148 m **below** the visual anchor at the observed pose; the old chassis collider bottom was 0.035 m **above** the anchor. Thus collider floor and true tire floor were ~0.183 m apart for this reference pose (geometry-sampled, not a guessed wheel radius).

**Human skeleton:** Old G0 probe matched only `spine_01` because it assumed Mixamo-style labels such as `LeftUpLeg`; this pinned specimen uses Unreal-style source naming conventions. Generic fuzzy substring matching was rejected. A scoped alias resolver now covers `pelvis`, `thigh_l/r`, `calf_l/r`, `foot_l/r`, `ball_l/r`, `upperarm_l/r`, `lowerarm_l/r`, `hand_l/r` and the Mixamo alternatives. The new diagnostic exposes the source skeleton's entire real bone name inventory for subsequent direct verification, rather than claiming a hand or foot is correctly fitted merely because it has a candidate alias.

**Steering wheel:** Real GLB rim-part mesh `steering_carbon` found, center `(-21.0177,1.0716,11.7447)`, reported bounding radius ~0.18165 m. This is a geometry candidate, **not certified finger contact**; per-hand clearance is included in the new live pose diagnostic.

### 11.1 G1/G2 implementation (feature-gated)

- `src/game/character/driver-limb-landmarks.ts`: deterministic source name-to-joint mapping with partial-rig fail-closed behavior.
- `src/game/character/driver-cabin-pose.ts`: Babylon before-render pose adapter attached to the **actual imported rig**. It samples a cached steering-wheel mesh and solves two-bone calf/thigh-to-foot and forearm/upperarm-to-hand chains using parent-local quaternion updates, bounded rotation steps, and explicit reach limits. Foot targets go forward inside the cockpit, above the original underside reference; wheel grips use the actual measured rim mesh. No mesh hiding, no synthetic character.
- `voight-humanoid-trial.ts` and `gtd-runtime.ts`: driving-only lifecycle binding, walking/flight restoration and observer cleanup. The accepted `cabinForwardFraction=-0.04` root remains unchanged.
- **A/B flags:** `gtdFitPose002=feet` for G1 only, `gtdFitPose002=hands` for G2 only, `gtdFitPose002=1` for both. Each requires the original `gtdSeat001=1` flag. All pose fitting is **disabled by default**. The live geometry report includes active mode, source bones, applied limb chains, world-space contact targets and residual contact errors.
- **Acceptance open:** Real UAL joint binding, collision-free feet, and visual steering contact must still be inspected in browser, not declared from source/typecheck alone.

### 11.2 G3 implementation (feature-gated)

- `street-vehicle-wheels.ts` now measures the minimum actual mesh tread geometry of each of four imported wheels; the median per-wheel tread-to-anchor offset is accepted only when all 4 agree within 65 mm. An unknown/partial foreign rig leaves the existing physics intact.
- `first-drive-trial.ts` can align the physical full-chassis cuboid bottom with that measured tread plane, instead of the fixed +35-mm origin offset, on `gtdFitGround002=1`. This also settles an initial imported car above its known First Light ground support to prevent collider spawn penetration. The Rapier move, curb protection, garage sill guard, and one-world-step ownership remain unchanged.
- Separately, `gtdFitWheel002=1` permits limited 130-mm independent *visual wheel suspension travel*: four downward Rapier supports exclude the vehicle chassis; each actual wheel pivot is shifted toward the rendered asphalt/support surface with bounded per-step motion. The raycaster cannot certify traction; chassis KCC stays authoritative. This is an L0.5 contact presentation adapter, **not** four rigid-body springs or a claim of force-based driving physics.
- G0 diagnostic now reports which tires sit over raised sidewalk versus rendered asphalt; no-road is not a false deficiency if that wheel is located over a sidewalk. Four independent tread-to-visual-support errors can be inspected after correcting pose.
- **Acceptance open:** The actual Ferrari and world must meet stable tread/surface gaps in three streets and curb/threshold conditions without unnatural spring droop. Any case that needs more than bounded prototype suspension must be escalated, not hidden. No final acceptance without actual game screenshots.

### 11.3 G4 regression gates and release controls

New automated suites:
- `veh-fit-002-bone-mapping.test.ts`: Unreal/UAL naming plus importer prefixes and incomplete foreign rig.
- `veh-fit-002-pose-lifecycle.test.ts`: foreign-rig fail-closed, feet-only mode, cleanup on driver exit.
- `veh-fit-002-suspension.test.ts`: mesh-derived tire base, independent raised-side versus road-side travel, bounded displacement, relaxation and unchanged chassis root.
- `veh-fit-002-contact-witness.test.ts`: ground/visible asphalt discrepancy, opt-in disabled state, and corrected actor collider calibration with real synthetic tire meshes.
- Existing `veh-seat-001-ual-driving-loop.test.ts`, `ferrari-rapier-world-integration.test.ts`, `street-vehicle-wheels-grounding.test.ts` and mobile/world integration tests remain mandatory. Vercel project build gate runs `npx tsc --noEmit && npx vitest run && npm run build`.

**Evidence rule:** Vercel READY confirms TypeScript, tests and bundle, not the live GLB fit or desktop/mobile visual acceptance. Record exact deployment SHA, successful test totals and owner screenshots separately. Do not merge main or publish a production release without that review.

**Combined preview flags:**
```
/game?gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1&gtdFitWheel002=1
```
For controlled comparisons, toggle just one `gtdFitPose002` mode and either/both G3 flags.

**G4 rejection triggers:** visibly protruding shoes or shins; floating/non-gripping hands; persistent wheel/road separation or tire intrusion on the intended support surface; regression to acceptable backrest alignment; failure to exit back to original walking animation; curb/garage no-step regression; severe mobile frame drops.

**G6 embargo:** The owner specified that G6 only becomes available **in documentation** *after G1–G4 pass tests*. There is currently no implemented or defined G6 milestone here. Do not introduce G6 source code or invent G6 scope. The G6 documentation gate remains CLOSED until G4 automated and live visual acceptance is recorded.


## 12. G4 automated QA result and owner-facing visual gate — 2026-10-15

**Source commit inspected and built:** `ed5c04a3b716ab80d7ede242e4b3facf6288e6dd` on `exp/veh-seat-001-ual-driving-loop-20261015`. Manual Vercel preview deployment `dpl_E33jfHBMF93yguJB2DocbuTV9E2v`: **READY**, HTTP 200 from `/game` with combined experimental flags. Preview:

https://gtd-ap7tug0i3-interlinkglobaltech.vercel.app/game?gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1&gtdFitWheel002=1

Vercel build pipeline `npx tsc --noEmit && npx vitest run && npm run build`: **PASS — 71 test files / 283 tests, 0 failures, build successful**. The G1/G2 source naming, isolated pose lifecycle, G3 wheel-floor and independent contact fixture, and G0 synthetic witness all passed. Previous headless fixture failure `No camera defined` was corrected by creating a real Babylon `FreeCamera`; it was not a runtime game fault. This test gate does **not** include a separate `npm run lint` invocation.

**Human and device acceptance remains open.** A successful NullEngine rig test does not prove that the pinned real UAL mesh visually fits this Ferrari, that the wheel/body presentation is plausible over the 0.11-m mixed sidewalk-road profile, or that mobile performance is acceptable. The owner must inspect the exact READY preview. Expected verification in an actual browser:
1. Low side view: no soles/shins visible beneath car, no body float or curb-related tire penetration.
2. Rear-oblique top view: both palms contact the real steering rim; elbows are not locked or unnaturally contorted; torso remains against the accepted backrest.
3. Drive/turn/reverse, cross curb/road positions and stop: all four tread gaps align with the actual supported road/sidewalk, no persistent spring overextension.
4. Exit/enter and walk: original locomotion pose and safe boarding lifecycle restored.
5. Mobile landscape: playable and no material performance/quality regression.

The optional A/B controls use `gtdFitPose002=feet` or `hands`, or `1` for both, `gtdFitGround002=1` for real tread-derived collider alignment and `gtdFitWheel002=1` for per-wheel visual contact. `gtdVehFit002=1` exposes `window.__GTD_VEH_FIT_002_REPORT__()` containing both original and enhanced wheel and skeleton contact metrics, including `fittedDrivingPose`.

**Overall status:** G1/G2/G3 code: implemented and automated-verified, NOT yet visually accepted. G4 automated: PASS; G4 desktop/mobile acceptance: PENDING. Production main: unchanged. **G6 documentation gate: CLOSED** until owner-visible G1–G4 acceptance, with no invented G6 work.


## 13. Owner visual rejection, second geometry sample, and corrective implementation (2026-10-15)

**Gate decision:** G4 **REJECTED by direct owner screenshots and live `gtd.veh-fit-002.contact.v1` telemetry.** This supersedes any interpretation that the prior 283/283 automated PASS established real-model correctness. G6 remains embargoed until renewed G1–G4 testing and owner visual acceptance.

**Evidence:** Owner's four screenshots of preview `gtd-ap7tug0i3` with full G1–G3 flags enabled, plus a copied 572-line contact report from the actual UAL/Ferrari runtime. Car at rest: visual anchor `(-25.644403, 0.018824, 9.181983)`; yaw `1.45379`; Ferrari `2.3681 × 1.3584 × 4.53 m`; `grounded=true`; speed 0 m/s.

| Physical/visual check | Reported value | Consequence |
| --- | --- | --- |
| Four real tires on flat road | signed gap -0.128759/-0.128759/-0.128760/-0.128760 m | **ALL FOUR tires penetrate rendered asphalt ~129 mm** although collision tops at Y≈0 and visible road top at Y≈0.030 |
| Constructor chassis tire mapping | `treadAligned=true`, `chassisFloorOffsetMetres≈+0.0000004` | Initial calibration accepted an incorrect near-zero tread/reference offset; later real tread at Y≈-0.09876 relative to visual anchor Y≈+0.01882 |
| G3 visual travel | 0.014–0.017 m | Stale cached pivot-to-tread height supplied false near-contact condition, so wheel travel did not correct a real 129-mm penetration |
| Skeleton | All 16 mapped limb roles present, `missing:[]` | The original GLB bone-name discovery issue is solved; no missing-joint explanation for continued limb failure |
| G1 left/right foot target errors | 1.2953 m / 0.9881 m | Target generated from `wheelCenter + forward*0.18`, beyond the natural footwell/reachable bone chain, shoes protrude from lower body |
| G2 left/right hand errors | 0.4711 m / 0.2931 m | 9/3 grip targets too far from seated UAL shoulders to satisfy the two-bone reach guard; **neither hand listed under `appliedLimbs`** |
| G1 status | `status=active`, `appliedLimbs=[leftFoot,rightFoot]` | False success classification: IK function reported **attempted**, not **converged**, even with error greater than one metre |

**Corrective source changes, pending new verification:**

1. **G1/G2** `driver-cabin-pose.ts`: the foot target planner now uses *actual hips* plus 0.37m forward and anatomically contained Y instead of locating feet beyond the steering wheel. Hand grip candidates are derived from each hand's nearest reachable section of the *actual* wheel rim rather than fixed, unreachable 9/3 points. Post-solve residual errors are checked; only <=0.06m residual counts as `appliedLimbs`, otherwise status explicitly becomes `out-of-tolerance`. Pure target-planner regression tests reproduce the owner's measured hips/wrists/rim instead of fabricated perfect coordinates.
2. **G3** `street-vehicle-wheels.ts`: cache actual descendant wheel meshes and **resample current transformed tire tread bottom Y** after spinning/steering. Remove stale constructor pivot-to-tread offset as the authoritative wheel support value.
3. **G3** `first-drive-trial.ts`: when enabled, compare all FOUR tire treads to independent Rapier support while stopped/slow on *confirmed flat roadway*. A single bounded, fail-closed recalibration aligns visual anchor-to-chassis floor only when four support rays are at the true Y≈0 street level (not sidewalk Y=.11 or a curb) and the tread heights agree. Physics body remains authoritative and is not teleported. New regression fixture deliberately reproduces ~129mm post-instantiation geometry mismatch and expects flat-road correction without masking irregular-road states.
4. **G4** New `veh-fit-002-live-targets.test.ts` checks foot target reach/forward direction and nearest-rim hand targets from the exact rejected live joint/steering center. Expanded `veh-fit-002-contact-witness.test.ts` checks the missed calibration. Build and in-browser validation remain required.

**Important limits:** No guarantee that the actual UAL animator responds geometrically to the IK corrections until new live post-fix errors and screenshots establish it. The flat-road one-time calibration does not constitute a full four-wheel suspension solver. If the four support heights differ (sidewalk/curb), the offset reconciliation deliberately refuses to infer a single contradictory tire floor. Preserve approved seat root `cabinForwardFraction=-0.04`, usual driving, walking, no-step garage protection, mobile presentation, and original physics. No production merge. **G6 remains CLOSED.**


### 13.1 Second corrective preview — automated gate PASS, visual acceptance pending

**Source commit deployed:** `9fd9d76c092c8dea01a18fb945b9ff753522373c` on the isolated `exp/veh-seat-001-ual-driving-loop-20261015` branch. **Vercel deployment:** `dpl_4ZMc3Ro2kWxtVjoRmrxJVmej7XER`, status READY, HTTP 200 for the exact combined test URL:

https://gtd-f9qnp8sij-interlinkglobaltech.vercel.app/game?gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1&gtdFitWheel002=1

**Build evidence:** `npx tsc --noEmit && npx vitest run && npm run build` completed successfully; **72 test files passed / 287 tests passed, 0 failed**. The new `veh-fit-002-live-targets` tests (3) confirm target reach geometry from the owner's measured UAL/Ferrari coordinates. The expanded `veh-fit-002-contact-witness` fixture (4) confirms the original 129-mm tire penetration can be detected and corrected after post-import mesh geometry changes **when four wheel contacts are on level road**. The first new synthetic contact test failed due to its own omitted visible asphalt scene mesh; the final test correctly includes both rendered road top (Y=0.030 m) and Rapier floor (Y=0). No test assertions were removed to obtain a green run.

**Explicit unverified gates:** This does NOT establish real GLB foot penetration clearance or true palm contact in the running browser, nor wheel support at the sidewalk/curb mixed-level case. The owner must capture low-side and overhead views again and examine `window.__GTD_VEH_FIT_002_REPORT__?.()`: expect `car.status.roadContactCalibrationVerified=true` on an ordinary flat-street stopped sample, four finite `visualSupportGapMetres` close to zero, and `character.fittedDrivingPose` showing measured residual errors no longer at the previously rejected 0.99–1.30 m feet / 0.29–0.47 m hands. `appliedLimbs` now means error <=0.06 m rather than “solver attempted”, and `out-of-tolerance` is an explicit failure status.

**G4:** Automated PASS, real desktop/mobile visual validation PENDING; preserve backward seat calibration. **G6:** no new code and no invented specification; documentation milestone remains pending the user's visual gate. Main/production unchanged.


## 14. Final owner rejection — all current corrective work frozen (2026-10-15)

**Override of earlier implementation permission:** The owner supplied three additional screenshots and a full actual-game telemetry dump from preview `gtd-f9qnp8sij`, then instructed: **“Document all the recent failure modes then pause patching.”** This is now the current instruction. It **supersedes** any earlier statement in Sections 10–13.1 to resume immediately after measurements.

**Primary failure register:** [GTD-VEH-FIT-002 G4 Visual Failure Register and Patch Freeze - 2026-10-15.md](./GTD-VEH-FIT-002%20G4%20Visual%20Failure%20Register%20and%20Patch%20Freeze%20-%202026-10-15.md). This dedicated document records eight failure modes with their visual witnesses, exact numeric telemetry, regression history, uncertainty, source references, and remaining questions.

**Latest measurable rejection facts:**
- UAL driving animation and all limb bones resolve, but `fittedDrivingPose.status="out-of-tolerance"`, `appliedLimbs=[]`. Residuals: left/right feet **0.8887/0.7128 m**, left/right hands **0.8220/0.7379 m**. Both boots and hands remain visibly outside Ferrari bodywork.
- `steeringWheel.found=true`; wrist-to-wheel-*centre* distances about **0.992/0.898 m**; no actual grip established.
- Four imported wheel mesh bottoms at **Y≈−0.180 m**, physical Rapier supports at **Y≈0**; all four corresponding **visual surface measurements are null**. Thus there is no valid signed actual tire-to-*visible*-asphalt measurement in the latest sample even though car appears unsupported in the screenshots.
- `roadContactCalibrationVerified=true` and `roadCalibrationCorrectionMetres≈−0.0733 m` coexist with missing visible-road witnesses; that boolean is a calibration event, **not validation of true visual contact**.
- Latest screenshot query omitted `gtdFitWheel002=1`, so `visualWheelSupportEnabled=false` and all wheel travel=0. The final run tests the **ground calibration** and pose, not the optional per-wheel visual suspension.
- The previous experimental preview failed visual acceptance with all four visual tire gaps about **−0.12876 m**. The final preview adds an unresolved no-road diagnostic state; **do not report it as a proven numerical tire clearance fix**.
- The last full automatic verification `287/287` across `72` files and Vercel READY **does not outweigh the live G4 rejection**.

**Gate state and explicit freeze:** G0 evidence captured; G1 FAILED; G2 FAILED; G3 FAILED/UNPROVEN; G4 FAILED and **ON HOLD**. Preserve the accepted rearward seatback/root configuration. **No more patching, optimization, diagnostic code changes, branch promotion or Vercel preview generation until the owner explicitly authorizes resumed work.** No new G6 source or documentation scope; **G6 CLOSED**. Production `main` unchanged.
