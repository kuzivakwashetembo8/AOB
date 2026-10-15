# GTD-VEH-FIT-002 — Advanced-Reviewer 1.0 Technical Recovery Plan

**Reviewer / change owner:** Advanced-Reviewer 1.0  
**Date:** 2026-10-15 (Africa/Johannesburg)  
**Status:** Submitted for owner review. Documentation only. Implementation NOT started or authorized by this submission.  
**Repository:** interlinkglobal/GTD  
**Branch:** exp/veh-seat-001-ual-driving-loop-20261015  
**Reviewed head:** bf62d71139cc7429a87eeef11d841240987a6258  
**Reviewed runtime failure build:** 9fd9d76c092c8dea01a18fb945b9ff753522373c  
**Dependencies reviewed:** Babylon.js 9.29.0; Rapier 0.21.0.  
**Overall gates:** G1/G2 failed, G3 failed or unproven, G4 on hold. G6 remains closed.

## 1. Purpose, authorization and separation of work

Harmony requested a comprehensive technical plan before attempting the investigation's recommendation, with detailed explanations of findings, proposed changes and reasons. This document fulfils the planning requirement. It does not interpret the request as permission to resume implementation, deploy a preview or merge to main.

The existing G4 failure register remains the historical record. This plan proposes a bounded recovery sequence under the existing G1–G4 objectives. The AR1 stage identifiers below identify this reviewer's work; they do not create, rename or open a G6 milestone.

All commits attributable to this work will begin with **[Advanced-Reviewer 1.0]** and include a **Reviewer: Advanced-Reviewer 1.0** trailer. Each commit will state its stage, purpose, validation and outstanding limitations. The available GitHub connector controls Git author/committer metadata and does not expose custom author fields; this convention is explicit commit-message attribution, not a claim that Git author metadata was changed. If a subsequent authorized Git workflow permits custom author configuration, use the requested display name without inventing a personal email address.

Preserve unrelated team work. Use small, independently reviewable commits; check the branch head before each write and inspect intervening changes. Do not force-push or silently rewrite earlier attempts. A new implementation branch is not created by this documentation submission. Any later branch separation must preserve a recorded common baseline and the owner's chosen integration workflow.

## 2. Outcome required

Voight must remain visibly seated against the accepted Ferrari backrest, with both legs and shoes inside its footwell, knees clear of the door and dashboard, and naturally bent arms placing the hands on the actual steering rim. This must survive animation playback, vehicle translation and yaw, boarding and exit.

Tire-to-surface contact must be measured from the actual tire contact shape and the actual surface beneath each wheel. Spinning a stationary wheel must not change its measured radius or lift the vehicle. Ordinary flat-road contact must be consistent; curb and mixed-height support must be classified honestly.

A compiler pass, successful bone lookup, small wrist-to-centre distance, a KCC grounded flag or a Vercel READY status is not acceptance. Numeric measurements and the rendered result must agree.

### Preserved constraints

- Keep the existing UAL model, skeleton and Driving_Loop as the initial baseline.
- Preserve the accepted seat-root constants: driverSideFraction=0.20, cabinForwardFraction=-0.04, aboveRoadHeightFraction=0.56, headingOffsetRadians=PI.
- Preserve the 1.78 m character normalization and accepted Ferrari dimensions.
- Keep React outside the simulation loop; retain GameRuntime / RuntimeBridge ownership.
- Keep the existing driving control and collision behaviour while correcting measurement and cabin presentation.
- Do not hide feet, shrink the humanoid, enlarge the car, raise the entire driver, change scene handedness globally, alter roads to conceal gaps or install a replacement character.
- No traffic, new vehicles, broad physics rewrite, finger IK, damage, sound, environment changes or automatic production promotion.
- Keep main unchanged. Existing Vercel configuration disables deployment from normal commits.

## 3. Evidence reviewed and its limits

The investigation read the branch documentation, relevant runtime and tests, and the three supplied screenshots. Babylon source was inspected at the repository's pinned version. Small standalone mathematical calculations demonstrated reflection and bounding-box mechanisms.

No actual UAL/Ferrari asset integration test or live browser reproduction was executed during that investigation. The complete asset hierarchies, actual determinant at each affected joint, rendered skinning result and exact tire vertex geometry remain to be measured. Historical telemetry below is transcribed in the repository failure register, not a new measurement taken by this reviewer.

| Witness | Recorded result | What it establishes |
| --- | --- | --- |
| Screenshots 314–316 | Hands/legs visible through door and underside | Driver fit visibly fails |
| Latest contact residuals | Feet 0.8887 / 0.7128 m; hands 0.8220 / 0.7379 m | Current solve did not establish contact |
| Pose state | out-of-tolerance; appliedLimbs=[]; missing=[] | Joint names resolve; contacts fail |
| Tire AABB minima | Approximately -0.180 m world Y | Bounding-box minima, not proven tread contact |
| Rapier support | Approximately Y=0 | A physical support plane was hit |
| Visible surface witnesses | All four null | Tire-to-visible-surface clearance is unmeasured |
| Calibration state | verified=true; correction about -0.0733 m | Internal calibration fired despite absent visual confirmation |
| Optional wheel support | Disabled in latest screenshot URL | Latest failure does not test that subsystem |
| Historical automated suite | 287/287 tests, 72 files | Historical unit/build result, not real-asset visual acceptance |

All future evidence must include commit SHA, asset identity, feature flags, animation time, vehicle pose, sample frame and whether it came from a synthetic test or actual imported scene.

## 4. Findings: confirmed mechanism versus runtime hypothesis

### F1 — World rotation axes are converted incorrectly through a reflection

**Source:** src/game/character/driver-cabin-pose.ts, aim().

The implementation calculates cross(originalWorldDirection, desiredWorldDirection), transforms that axis through the inverse joint-parent world matrix, and constructs a positive-angle local quaternion. A cross product is an axial vector. Under a reflection it does not transform like an ordinary direction.

For an orthogonal transform R:
cross(Ru, Rv) = det(R) R cross(u,v).

If det(R) is negative, treating that cross product as an ordinary direction loses a sign. The resulting local rotation can move a joint away from its target. Increasing iteration count or rotation limits can amplify the failure.

Babylon 9.29.0's glTF loader, in a default left-handed scene, places the import below a root with rotation [0,1,0,0] and scale [1,1,-1]. GTD creates a default Scene and preserves the imported hierarchy. This gives a concrete reason to inspect reflection parity rather than assume ordinary positive-scale transforms.

**Mathematical reproduction, not actual rig evidence:** a one-metre limb initially pointing +Y, target +X, parent reflection diag(-1,1,1), step 0.19 radians:

| Measurement | Error |
| --- | ---: |
| Before correction | 1.414214 m |
| Existing world-axis conversion | 1.541985 m |
| Cross product calculated after direction conversion to parent space | 1.273688 m |

**Confidence:** the algorithmic defect is established for reflected parents. Whether every relevant UAL parent has negative determinant, and how much this explains the submitted frame, requires the AR1-0/1 asset check. Extra source transforms may change parity. Do not claim this is already a complete live root-cause proof.

### F2 — Failed corrections remain visible

The solver mutates linked joint rotations before computing residuals. If a solve fails the 0.06 m threshold, status changes to out-of-tolerance but the rotations remain. Reporting failure does not undo the deformation. cachedBaseline is restored on disable/exit, not on an unsuccessful individual solve.

Thus an unsuccessful solver can produce a visibly worse pose even while reporting no applied limbs.

**Required correction:** transactional candidate evaluation with restoration when error increases, transforms become invalid or anatomical/cabin constraints fail. Restoring the original driving clip prevents additional solver damage; it does NOT mean the original foot-clipping pose becomes acceptable.

### F3 — Targets are not calibrated to cabin contact geometry

The foot target is based on hip position plus 0.37 m toward the wheel and a height heuristic. cabin.position.y is treated as a floor reference, but it is a vehicle anchor, not a measured footwell floor.

Hand targets use a direction flattened into the world XZ plane and a constant Y below the wheel centre. That constructs a horizontal ring around the centre. It does not describe the tilted steering rim, hand orientation, or the space occupied by a palm.

Targets also depend on current hand positions, so they can change with animation or an already altered pose. The solver has no explicit elbow/knee bend plane, collision envelope or useful joint limits.

**Required correction:** authored, versioned contact landmarks tied to the Ferrari geometry, including separate wrist/ankle and palm/sole offsets. Freeze target placement during solver comparisons. Endpoint proximity alone cannot certify that the limb between the joints stays inside the car.

### F4 — Bounding-box minima are being used as tire tread

**Sources:** street-vehicle-wheels.ts and vehicle-fit-diagnostics.ts.

Babylon BoundingBox._update transforms the eight corners of the local bounding box. minimumWorld is the lowest transformed corner, not necessarily a vertex on the tire.

For a circular tire of radius r whose square cross-section bounds rotate through angle theta about its axle, box half-extent in world vertical can be:
r (abs(cos(theta)) + abs(sin(theta))).
The actual circular radius remains r.

At r=0.32 m and theta=45 degrees, box extent is 0.452548 m: 0.132548 m of fictitious downward extension. The earlier ~0.12876 m discrepancy is numerically consistent with this class of error, but the similarity does not prove the actual tire geometry, axle orientation or transform in that frame.

The false measurement enters sampleTireTreads(), import-time alignment, the one-time chassis mapping calibration, optional visual wheel travel and the diagnostic. Fixing only the printed number would leave the correction paths defective.

**Confidence:** use of an unsuitable measurement is confirmed. Exact magnitude on the Ferrari is unverified. Tire geometry must be distinguished from rims, brakes and other descendants; pivot correctness and source-local rotation axes must also be checked.

### F5 — Physical support is incorrectly treated as evidence of asphalt

settleMeasuredTireFloor() accepts approximately level Rapier hits near Y=0, assumes roadTop=0.030, changes the visual-to-body offset and sets verified=true. It does not require actual visible surface witnesses.

The world has a broad ground collider. A hit on that collider does not identify asphalt, sidewalk, parking, soil or the absence of a matching rendered patch. The visual diagnostic relies on selected mesh-name patterns and skips polygon roads.

**Required correction:** explicit surface identity and coverage, with separate physical and visual heights. No witness means unknown, never a zero clearance or successful calibration. The reason for the four null surface hits in the submitted frame is still open; do not assume it is only a naming bug.

### F6 — Animation overwrite is not supported as the default explanation

Babylon's normal render path evaluates animation before onBeforeRenderObservable. The existing pose callback therefore runs after normal animation evaluation. This weakens the claim that animation necessarily overwrites every correction in the same frame.

It does not prove correct skinning synchronization, absence of another writer, or clean handling of animation channels that are not keyed every frame. Actual callback ordering and linked-node-to-skeleton propagation still need one explicit trace.

### F7 — Existing tests do not exercise the failure mechanism

The pose lifecycle test uses an empty skeleton. Target tests check target distances without solving the real UAL rig. Grounding fixtures use synthetic tire geometry; one test manually translates tires downward by 0.129 m.

These are useful narrow tests but do not exercise a reflected imported hierarchy, actual skinning, a spinning tire's false bounds, real cabin containment or actual South Ward surface coverage. More tests of the same fixtures would not settle the issue.

## 5. Proposed architecture

### 5.1 One authoritative pose pipeline

Keep vehicle physics and accepted character-root synchronization as existing owners. The driver adapter owns only its explicitly listed joint rotations while driving.

Proposed order, verified against Babylon before use:

1. Remove the previous frame's procedural contribution before animation evaluation, restoring the stored animation baseline for owned joints.
2. Evaluate Driving_Loop and any permitted blend.
3. Synchronize/update required parent world matrices and capture the current animation-only joint baseline.
4. Transform stable car-local contact landmarks into world space.
5. Solve the selected chains from that baseline in a deterministic order.
6. Validate candidates and either commit their rotations or restore the baseline.
7. Confirm that linked bone matrices used for the rendered mesh reflect those results before skinning/draw.
8. Record post-application evidence from that same frame when capture is requested.

Use explicit observer lifetime. Restore/dispose before locomotion regains ownership on exit. Do not restore a stale driving pose after a new locomotion animation has been evaluated. Pausing animation, switching clips and joints without keyed channels must not accumulate corrections.

### 5.2 Correct rotation conversion before adding solver complexity

For a joint at a, end point b and target t:

- Obtain a fresh inverse parent world matrix.
- Convert (b-a) and (t-a) as directions into parent space.
- Normalize both in that space.
- Compute axis from their cross product and angle from their clamped dot product.
- Apply a bounded delta in parent space to the animation baseline/local quaternion using the multiplication order verified by tests.
- Refresh dependent transforms and measure the resulting world-space error.

Near-zero vectors, singular matrices and nonfinite values reject the candidate. Near-parallel directions need no rotation. Near-antiparallel directions require a stable calibrated bend axis; do not select an arbitrary noisy axis.

This simple form is initially limited to parent transforms whose linear part is orthogonal up to uniform scale, including reflection. Check that condition. Nonuniform scale/shear changes the angular metric and cannot be waved away with a determinant sign. If present in the UAL chain, stop the simple path and use a rig-local orthonormal solve with an explicit mapping back to joint rotations. Do not alter global import transforms to make the test pass.

First demonstrate one bounded correction step on one actual leg, then an actual arm. Only then decide whether the current bounded CCD iteration is sufficient.

### 5.3 Stable cabin landmarks and anatomical constraints

Define a versioned Ferrari driver-fit profile in an explicitly stated coordinate frame. Prefer the existing yaw/translation-only vehicle frame in world metres for the current KCC, avoiding accidental multiplication by the anchor's nonuniform model scale.

Profile data must be derived from the actual imported car and recorded with source asset identity and normalization parameters:

- Seat/backrest reference and protected accepted root.
- Left/right pedal or intended sole contact targets.
- Footwell floor, side limits, underside, dashboard and door clearance envelopes.
- Steering rim centre, actual plane/basis, radius or sampled shape.
- Separate left/right palm contacts on that rim.
- Palm-to-wrist and sole-to-ankle offsets from the actual character.
- Knee/elbow preferred bend directions, and measured joint-limit conventions.

A small overlay may show landmarks and simplified clearance volumes in a dedicated development fixture. It must not become a permanent gameplay overlay.

A two-link analytic solve with pole vectors is the bounded fallback if corrected CCD cannot give stable, natural bends. It uses measured segment lengths and constrains both minimum and maximum reach. It must not stretch bones. Avoid inventing specific hinge axes or degree limits before inspecting the source rig.

Containment must include limb thickness, toe/heel and palm orientation. Start with calibrated capsule/box envelopes; validate against actual deformed mesh witnesses in the fixture. A joint point above the floor is insufficient if the boot extends below it.

### 5.4 Tire contact geometry independent of spin

Identify true tire meshes and axle centres from the Ferrari hierarchy. Separate tire, rim, brake and unrelated descendants. Measure them in a non-spinning axle/contact frame.

For a sufficiently circular tire, store radial radius and half-width from actual geometry. Under a general linear transform A, a circular cylinder support extent along unit surface normal n can be evaluated from the transformed radial basis u,v and axle direction a:
extent = r * sqrt((n dot A u)^2 + (n dot A v)^2) + halfWidth * abs(n dot A a).
All bases and scale conventions must be specified so scale is not applied twice.

This is an approximation of the tire envelope, not a claim every tire is a perfect cylinder. Validate against transformed tire vertices across spin and steering samples. If the approximation exceeds tolerance, use a small measured convex support representation. Do not use bounding-box corners as the independent verifier.

Audit source spin/steer axes and nonuniform vehicle normalization. Genuine visible deformation or an off-centre rotating tire must be distinguished from bounds-only error. If present, report and scope that asset-transform repair separately instead of hiding it with suspension.

### 5.5 Surface query and visual-to-physics mapping

Build a bounded query from known surface ownership rather than scanning every mesh per wheel every frame. Reuse the generated surface geometry/specification, augmenting explicit support metadata or a development registry as needed.

For each wheel contact location, return:

- surface ID/type and lifetime/version;
- footprint/triangle containment result;
- rendered surface point and normal;
- physical collider hit point/normal and identity;
- self-exclusion and query validity;
- explicit missing, ambiguous or unsupported state.

Exclude the driven vehicle's collider. Apply sensible probe start, direction and range. Do not treat road markings, decorative patches or an unrelated collider as chassis support. A physical hit and visual surface must match spatially and semantically; a different visual height is recorded explicitly.

On flat asphalt, derive the visual-anchor/body relationship from validated tire support, KCC clearance and the actual surface height. Keep a single authoritative mapping. It must not depend on the wheel's spin angle or on whichever frame first triggers calibration. Validate at independent positions before labeling it verified.

Leave optional per-wheel displacement disabled while fixing this mapping. Reintroduce it only after flat-road contact is proven and its own gate is authorized.

### 5.6 Mixed-height support is a separate constraint problem

The current vehicle is a yaw-only kinematic cuboid. It has no physically simulated pitch/roll suspension. Four tires rigidly fixed to that body cannot all touch arbitrary noncoplanar surfaces. A broad chassis collider may also rest on geometry between the wheels.

A measurement repair cannot guarantee four-tire contact in those cases. Test and classify them. Bounded independent visual wheel travel may handle small differences if it preserves wheel arches, body clearance and the KCC collision envelope. If required travel exceeds limits, the body is supported by non-wheel geometry, or pitch/roll is necessary, stop and report the architectural limitation. Do not quietly introduce a new vehicle physics system or label this case passed.

## 6. Implementation stages and evidence gates

No stage below begins until implementation is authorized.

| Stage | Planned action and reason | Required exit evidence |
| --- | --- | --- |
| AR1-0: establish reproducible baseline | Pin actual assets; inspect transforms; build an isolated real-asset fixture; capture original and rejected pose paths | Asset identities, hierarchy, parent determinants/scale checks, repeatable screenshots, callback order and same-frame joint/skin witnesses |
| AR1-1: prove joint correction | Correct the coordinate conversion for one leg, then one arm; add transactional restoration | Actual-rig single-step error decreases for nondegenerate reachable cases; failed candidates restore; reflected and positive-parity regression tests |
| AR1-2: fit both legs | Calibrate footwell/sole targets and knee bend; preserve torso/root | Both shoes and legs contained across sampled clip cycle, no length changes, no door/floor escape |
| AR1-3: fit both arms | Calibrate actual rim contacts, palm offsets and elbows; retain accepted legs | Both palms contact rim naturally across sampled clip cycle; no chest, door or dashboard conflict |
| AR1-4: repair wheel evidence | Replace AABB-as-tread throughout consumers; establish actual surface query | Spin-invariant contact estimate, vertex cross-check, correct surface identity, missing data reported honestly |
| AR1-5: calibrate flat-road mapping | Use validated geometry and KCC clearance, independently of pose fitting | Four valid contact measurements and matching low-angle visuals at several headings/positions before and after driving |
| AR1-6: integrate and validate existing G4 scope | Combine only individually passed paths; verify lifecycle, motion and bounded mixed support | Desktop/mobile evidence, performance comparison, no locomotion/exit/control regressions; explicit exclusions for unsupported terrain |
| AR1-7: owner review and disposition | Submit exact preview and evidence once deployment is authorized | Owner visual decision recorded; no automatic main promotion |

AR1-6 is a local plan stage name, **not G6**. If that naming could confuse the team, use its full descriptive title in commit messages.

Each stage records Planned / Implemented / Automatically verified / Visually verified / Owner accepted separately. Do not derive an acceptance percentage from test count. Current implementation progress for this recovery plan is 0%.

## 7. Validation design

### 7.1 Focused mathematical and lifecycle regressions

- Positive scale, reflection, nested pre-rotations, several actor yaws and translations.
- Uniform normalization; explicit nonuniform/shear rejection or separately tested support.
- Parallel, antiparallel, singular, unreachable and nonfinite inputs.
- No bone length change or position/scale mutation by the rotation solver.
- Candidate restoration preserves exact baseline rotations within numerical tolerance.
- Ten seconds of repeated application, paused animation, clip restart, repeated board/exit and unkeyed rotations: no accumulation or retained driver correction.

### 7.2 Actual imported asset fixture

Use the exact pinned UAL and Ferrari GLBs, the same Babylon loader version, import hierarchy, car fit transforms, character normalization and accepted seat-root settings. Use recorded animation times for deterministic comparison, including the complete Driving_Loop cycle; retain continuous playback as a separate check.

At minimum compare:
A. original driving pose / accepted root;
B. rejected branch correction;
C. proposed single-chain correction;
D. proposed calibrated combined pose.

Headless geometry checks are necessary but insufficient. A browser render must confirm that the mesh uses the measured bones. Use orthogonal side, overhead, front-oblique and low-side views with the same framing. Capture skeleton/landmark overlays separately from clean owner-facing images.

### 7.3 Wheels and surfaces

- Spin 0–360 degrees with the axle stationary; include 22.5, 45 and 90 degrees.
- Test steering angles in the supported range, vehicle yaw 0/90/180/270 degrees and oblique yaw, actual car normalization, translation and repeated start/stop.
- Compare proposed support against actual tire vertices; log old AABB values only as a contrast witness.
- Query main road, rear road with its actual different rendered height, junctions, sidewalk, curb boundary, non-road ground and missing/disposed surface.
- Verify both cold spawn and after driving; no first-trigger-frame dependence.
- Disable optional wheel travel for the primary flat-road proof; test it separately only if within the authorized scope.

### 7.4 Provisional measurable acceptance thresholds

These are proposed engineering thresholds, not measurements already achieved. Confirm their feasibility against asset geometry during AR1-0; changes require explanation in the plan/evidence rather than silently loosening tests.

| Measure | Proposed threshold / rule |
| --- | --- |
| Solved palm/sole target position | <=20 mm per contact across the sampled clip cycle; measure contact offsets, not only joint origins |
| Body/cabin containment | No visible external penetration; target >=10 mm margin to non-contact simplified cabin envelopes; validate real mesh |
| Limb lengths | Relative drift <=0.1%; no deliberate scaling |
| Stationary tire support variation due solely to spin | <=2 mm for calibrated circular support; actual-vertex residual separately reported |
| Tire support model vs transformed tire vertices | <=5 mm across sampled spin/steer states, or replace the approximation |
| Flat-road signed tire-to-visible-surface gap | Existing +/-15 mm gate retained for all four wheels, with valid surface identities |
| Candidate worsening | Never commit a candidate whose residual worsens beyond a small numerical epsilon (proposed 0.1 mm), or violates constraints |
| Missing evidence | Unknown/fail; never zero, success or verified |
| Root preservation | Accepted seat transform unchanged; movement derives from the same vehicle pose |

Wrist/ankle targets alone cannot pass the palm/sole criterion. A single stopped sample cannot pass an animation or driving-duration criterion. Visible artifacts override a numerical pass.

### 7.5 Integration and performance

Verify boarding, stopped driving, acceleration, braking, reversing, turning, camera orbit, exit and return to walking/flight. Recheck low-curb behaviour and garage no-step protection without changing handling.

Cache rig mappings, contact profiles and surface indices. Bound solver iterations and avoid full-scene or full-skinned-mesh scans in normal gameplay; expensive mesh checks belong to the fixture or on-demand capture. Measure solver CPU time and frame-time distributions with fit disabled/enabled on desktop and the owner's mobile device under the same quality settings. Report numbers and visible stability; no invented universal performance threshold or mobile pass without a mobile run.

Run focused tests first. Before an authorized preview, run the repository's TypeScript, relevant integration tests and build gates; retain the required full release checks. Do not use green checks as a substitute for the actual-asset fixture.

## 8. Anticipated file scope

| File / area | Intended role |
| --- | --- |
| src/game/character/driver-cabin-pose.ts | Correct frame conversion, deterministic solve, transactions, lifecycle and honest result states |
| src/game/character/driver-limb-landmarks.ts | Validate bone mapping only if actual asset inspection reveals ambiguity; avoid unnecessary changes |
| New narrowly named driver-fit profile module under src/game/vehicles | Versioned Ferrari cabin/contact landmarks and calibrated tolerances |
| src/game/character/voight-humanoid-trial.ts | Integrate explicit animation baseline/adapter lifecycle only as required |
| src/game/vehicles/street-vehicle-wheels.ts | Actual tire contact representation and removal of AABB feedback |
| src/game/vehicles/vehicle-fit-diagnostics.ts | Same-frame, contact-aware witnesses and explicit missing evidence |
| src/game/vehicles/first-drive-trial.ts | Evidence-based mapping; replace assumed calibration success without changing control laws |
| Existing world surface query/metadata area | Bounded explicit surface ownership and coverage; no visual road redesign |
| src/game/core/gtd-runtime.ts | Minimal stage/adapter integration if necessary; retain runtime ownership |
| src/test and development fixture | Mechanism regressions plus actual pinned-asset evidence |
| documentations/Development | Stage records, test evidence, decisions and reviewer attribution |

This is a proposed scope, not permission to edit every listed file. Each change must be tied to a verified failure or its necessary validation.

## 9. Failure policy and fallback decisions

| Condition | Response |
| --- | --- |
| Actual parent is not mirrored or defect does not reproduce | Record that result; examine quaternion multiplication, transform freshness and source chain geometry before changing solver strength |
| Correct joint nodes move but skinned mesh does not | Investigate linked-node/skeleton update and actual witness skeleton identity; stop target tuning |
| Corrected CCD reduces error but yields implausible bends | Use calibrated pole vectors / bounded two-link solution; do not increase unrestricted iterations |
| Contact targets are unreachable with accepted root and scale | Report measured reach deficit and cabin constraints; request a specific seat/pose decision rather than stretching limbs |
| Real imported asset cannot be loaded in the fixture | Mark actual-asset gate blocked; do not substitute a synthetic PASS |
| No valid visible support or ambiguous surface | Keep calibration unverified and retain baseline mapping; fix evidence first |
| Tire approximation disagrees with vertices | Refine the measured support shape; do not tune chassis height against the approximation |
| KCC chassis support prevents four-tire fit on mixed terrain | Report the architecture boundary and obtain a separate decision on body/suspension changes |
| Regression in walking/flight/exit | Revert the isolated adapter stage and fix ownership/restoration before continuing |
| Performance exceeds the measured budget | Reduce allocations, cache and bound work; do not remove required correctness checks from acceptance |
| Owner rejects the rendered outcome | Gate remains open regardless of tests or residuals; preserve the rejected evidence |

Rollback is scoped to this reviewer's commits. Do not remove unrelated team commits. Runtime experimental flags should keep the original accepted root/animation path available for comparison, with all enabled flags recorded in evidence. A fallback baseline may still contain known defects and must be labeled accordingly.

## 10. Commit, preview and evidence protocol

Proposed commit style:

[Advanced-Reviewer 1.0] docs(VEH-FIT-002): submit technical recovery plan

Later examples, only after authorization:
- [Advanced-Reviewer 1.0] test(VEH-FIT-002): capture actual-rig reflection failure
- [Advanced-Reviewer 1.0] fix(VEH-FIT-002): correct joint-space rotation and rollback
- [Advanced-Reviewer 1.0] fix(VEH-FIT-002): calibrate footwell contacts
- [Advanced-Reviewer 1.0] fix(VEH-FIT-002): calibrate steering-rim contacts
- [Advanced-Reviewer 1.0] fix(VEH-FIT-002): replace tire-box contact measurements
- [Advanced-Reviewer 1.0] fix(VEH-FIT-002): validate flat-road support mapping

Commit bodies include Stage, Why, Changed, Validation, Remaining limitations, and the Reviewer trailer. Keep driver and ground corrections separate until both have independent evidence.

A preview is an intentional milestone, not a consequence of a normal commit. Before requesting or using deployment authorization, prepare the exact reviewable code, verification results and flag combinations. Record deployment-to-commit correspondence. No merge to main or production deployment is implied by plan approval or a preview passing.

Evidence record fields:
- reviewer, stage, commit SHA, actual asset hashes/versions;
- feature flags and correction mode;
- source hierarchy and coordinate conventions;
- animation time, vehicle yaw/position and frame;
- animation baseline, candidate and committed end/contact positions;
- parent determinant/scale classification and rollback reasons;
- tire geometry support, surface ID/normal, visible and physical heights;
- residuals, containment results, screenshots/video and device;
- performance comparison, known limitations and owner decision.

## 11. Sources and reproducibility references

Repository sources below are relative to reviewed commit bf62d71139cc7429a87eeef11d841240987a6258 unless noted.

- documentations/Development/GTD-VEH-FIT-002 G4 Visual Failure Register and Patch Freeze - 2026-10-15.md
- documentations/Development/GTD-VEH-FIT-002 Driver Contact and Four-Wheel Road Integrity Technical Patch Plan - 2026-10-15.md
- documentations/Development/GTD-VEH-SEAT-001 Accepted Driving Loop Milestone and Seat-Fit Findings - 2026-10-15.md
- src/game/character/driver-cabin-pose.ts
- src/game/character/voight-humanoid-trial.ts
- src/game/vehicles/driver-seat-placement.ts
- src/game/vehicles/street-vehicle-wheels.ts
- src/game/vehicles/vehicle-fit-diagnostics.ts
- src/game/vehicles/first-drive-trial.ts
- src/game/experiments/imported-car-evaluation.ts
- src/game/experiments/vehicle-probe-plan.ts
- src/game/world/generated-first-light-world.ts
- src/game/world-generation/urban-surface-renderer.ts
- src/test/veh-fit-002-pose-lifecycle.test.ts
- src/test/veh-fit-002-live-targets.test.ts
- src/test/veh-fit-002-contact-witness.test.ts
- src/test/street-vehicle-wheels-grounding.test.ts
- [Babylon 9.29.0 glTF loader root conversion](https://github.com/BabylonJS/Babylon.js/blob/9.29.0/packages/dev/loaders/src/glTF/2.0/glTFLoader.pure.ts), _createRootNode().
- [Babylon 9.29.0 bounding-box implementation](https://github.com/BabylonJS/Babylon.js/blob/9.29.0/packages/dev/core/src/Culling/boundingBox.ts), _update().
- [Babylon 9.29.0 scene implementation](https://github.com/BabylonJS/Babylon.js/blob/9.29.0/packages/dev/core/src/scene.pure.ts), animation evaluation and pre-render notification order.

UAL source: interlinkglobal/three-player-controller at ca82bbc76a3b9b0afa80c73b60167adf6123b9b6, example/public/glb/ual.glb; recorded blob e236f349526637a5c829c408d48ce9d8fcde9cff, 3,749,364 bytes.

Ferrari source recorded by the branch: interlinkglobal/JS-3D-Car at b2ce7c65e4e62e6486a39aed2c7dac89f7c0fa0f, models/ferrari.glb. Verify the binary hash and actual runtime source before fixture acceptance.

Mathematical examples in Section 4 are explanatory counterexamples. They are not imported-asset test results and must not be presented as live GTD verification.

## 12. Decision requested after submission

Review this plan as the proposed recovery scope. Implementation remains at 0%, G4 remains on hold, and G6 remains closed. The first implementation deliverable, if authorized, is the actual-asset baseline and one-chain transform proof. Target tuning and ground correction follow only after their stated evidence gates.


## 13. Authorized implementation and actual pinned-asset witness — 2026-10-15

**Authorization:** The owner expressly authorized implementation of the full AR1 recovery plan and requested a new preview. This supersedes the document's original implementation-freeze language solely for AR1-0 through AR1-7. It does not constitute acceptance of the rendered correction or permission to merge `main`. All implementation commits carry the required `[Advanced-Reviewer 1.0]` prefix and reviewer trailer.

### 13.1 AR1-0 — real binary evidence (COMPLETE for asset identity and mechanism)

An isolated Vercel Node 24 sandbox downloaded exactly the branch-pinned GLBs and verified their Git blob SHA-1 identifiers:

| GLB | Bytes | Verified Git blob SHA |
| --- | ---: | --- |
| Quaternius `ual.glb` | 3,749,364 | `e236f349526637a5c829c408d48ce9d8fcde9cff` |
| Ferrari `ferrari.glb` | 1,681,572 | `435197c5f9b56e08c114505ee019dedbc3d033a3` |

Both binaries were loaded in Babylon.js **9.29.0 NullEngine** (using a Node FileReader shim and locally supplied Draco decoder for the Ferrari's required `KHR_draco_mesh_compression`). Real UAL parent world determinants: `pelvis≈−0.99999988`, `thigh_l≈−0.99999994`, `calf_l≈−1.00000148`, `foot_l≈−1.00000137`, `upperarm_l≈−1.00000002`, `lowerarm_l≈−1.00000029`, `hand_l≈−1.00000031`. **The suspected reflected parent hierarchy is therefore confirmed on the actual imported specimen, not merely a mathematical hypothetical.**

On that imported UAL rig, one positive bounded hip correction using the new parity-aware `applyAimStep` reduced the sampled foot-target residual from **0.0894427 m to 0.0359137 m** (`parentDet≈−1`). This verifies direction improvement for one particular reachable target at one sampled pose. It does **not** establish completed footwell fitting or all-animation-frame IK convergence.

The Ferrari GLB loaded with 58 source nodes; all four named `wheel_fl/fr/rl/rr` pivots have 6 child meshes each, including an explicit `tire` mesh using material `Tires`. The true `steering_leather` mesh is a distinct outer rim; `steering_carbon` is not the rubber/leather grip ring. Its wheel pivots have source Y≈0.358 m and imported tire geometry radius≈0.358 m. Draco-decoded source tire mesh vertex clouds each contain **1000 positions**; front tire local width≈0.2474 m, rear width≈0.2722 m. The real Babylon imported front-left tire yielded `radiusLocal≈0.3580423632`, half-width≈`0.1237117723`, confidence `verified-shape`, and measured spin-independent bottom height variation **≈0.00000681 m** across rolls 0, 22.5, 45, 90, 180 and 360 degrees. This satisfies the mechanism's spin-invariance premise, not the final in-game road-contact gate.

**Explicit limits:** This is a live imported-asset NullEngine and compressed-mesh audit, not a browser GPU/skinning screenshot, a 53-clip-cycle motion study or fully calibrated seat/cabin floor envelope. Those remain G4 evidence requirements.

### 13.2 Implemented changes by stage

| Stage | Implementation | Current evidence / remaining gate |
| --- | --- | --- |
| AR1-0 | Source hash, actual GLB hierarchy and determinant check; contact reporter now exposes actual joint-parent reflection signs, confidence and geometry IDs | Real binary identification and mirror hierarchy established; full asset fitting scene still awaits desktop |
| AR1-1 | New `driver-joint-space.ts`: transform BOTH directions into parent's local frame before cross product; reject singular/nonuniform frames and worsening candidates; transactional correction rollback; remove prior procedural rotations before Babylon's animation update | Reflected-parity synthetic regressions and real imported UAL single-chain step PASS; full clip-cycle constraint acceptance pending |
| AR1-2 | `driver-cabin-pose.ts` retains accepted rearward seat root and performs bounded ankle/knee fitting with static car-local trial targets, rollback and explicit residual thresholds | Implemented, but the target is still a **provisional heel/footwell proposal**, not verified real mesh containment; no G1 closure yet |
| AR1-3 | Prefer actual `steering_leather` rim; sample vertex-backed left/right grip anchors at boarding, cache in Ferrari-local coordinates, avoid previous inner-carbon spherical/horizontal approximation | Implemented; true palm-vs-rim orientation and clearance need owner-facing verification |
| AR1-4 | New `wheel-contact-geometry.ts`: per-pivot vertex-derived round-tire radial support independent of wheel roll; unverified mesh identity fails closed. Existing wheel-height consumers and diagnostics use the same representation | Actual imported Ferrari wheel with rotation sweep PASS to 0.007 mm variation; local rubber material and mesh identity established |
| AR1-5 | New `vehicle-road-surface.ts`: genuine parity-road bounds and generated asphalt polygon triangle containment; `first-drive-trial.ts` calibration accepts **four named, matching** visual-asphalt + physical support witnesses; removes hardcoded inferred `roadTop=0.030` acceptance | Synthetic Rapier/road tests pass in prior build; full Mercer and mixed-sidewalk scene coverage pending |
| AR1-6 | Focused parity, rollback, tire-spin, surface-null and legacy full-suite tests; optional wheel travel remains isolated behind `gtdFitWheel002` | Automated Vercel gate and real desktop/mobile review tracked separately; no silent G4 completion |
| AR1-7 | Intentional Vercel deployment from exact code commit; current reviewer ownership and G4 status recorded | Preview and owner visual decision required; `main` not promoted |

The preview remains separately feature-gated. The initial review should enable `gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1` and leave `gtdFitWheel002` **off** for clean KCC visual-road calibration. Later inspect optional wheel travel in a separate A/B, not as a concealed prerequisite.

**Acceptance protocol:** The real in-game report must show properly found rubber tire evidence and four asphalt IDs, with non-null physical and rendered contact witnesses and no exterior limbs. `fittedDrivingPose.status="contact-only-unverified-cabin"` is **not full acceptance** even if joint endpoint residuals are small: actual boot/palm surface and cabin containment remain visually unverified. Owner screenshots can reject the result regardless of test count.

**G6:** Still CLOSED until the AR1 combined implementation satisfies the pre-existing G1–G4 automated **and real rendered** acceptance criteria. No G6 content has been invented or implemented.


## 14. Owner-accepted seated recovery and residual foot leak — 2026-10-15

**Outcome classification:** **MAJOR SUCCESS — PRIMARY SEATED POSITION ACCEPTED; MINOR RESIDUAL FOOT CLIPPING OPEN.** This is a new owner-observed milestone following Section 13 and **supersedes the earlier “overall seating unsuccessful” visual conclusion** for this AR1 preview only. Earlier failures remain preserved as historical evidence; they must not be deleted or silently reclassified as successful.

**Owner instruction:** “The problem has been largely solved. Voight is sitting successfully in the intended position however his feet are slightly peaking from underneath the car. This is the exact patch you don't want to just jump into because it is small, we must not risk breaking a success mode for a quick fix. Document that the solution worked however Voight's feet is slightly leaking outside of the bottom of the car.”

### 14.1 Accepted visual result and evidence

- **Preview:** https://gtd-7r0gftpf1-interlinkglobaltech.vercel.app/game?gtdFitGround002=1&gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1
- **Experiment branch:** `exp/veh-seat-001-ual-driving-loop-20261015`.
- **Preview's previously reported code commit:** `4d6ad7228b99f9288ca5ea8768be77b64b1ab95e`; deployment `dpl_7Wb7Sqg3Wx8BNqv4i3dtxiDKRf3Y` was reported READY. This documentation update is **not** a new deployment.
- **Submitted evidence:** Two owner screenshots of the running desktop/browser preview, captured 2026-10-15 approximately **16:34** and **16:39** local, at **South Ward / Foundry Lane** during in-game night. Screenshots are attached to the conversation; their binary content has not been copied into the repository.
- **Owner-accepted:** Voight now appears to occupy the **intended seated position inside the Ferrari**. The previous severe out-of-cabin body/arm displacement is not visible in these two images. The head and upper torso appear appropriately seated behind the windshield and the character remains visibly inside the driver cabin.
- **Residual visible defect:** At least one small yellow/orange **foot or boot section remains visible below the Ferrari's lower body / undercarriage**, most apparent from the low-rear/side angle. The original owner describes the feet as **slightly peeking from underneath**. This is a localized mesh-containment issue in the otherwise accepted driving pose, not grounds to undo the recovered seated position.
- **Limits of the evidence:** These screenshots and owner assessment establish **successful primary seated appearance**. They do **not** establish millimetre-accurate footwell clearance, both hands' exact palm contact with the steering wheel, four-wheel road contact at multiple locations, driving/exit cycles, or mobile performance. No new diagnostic JSON accompanied these two images; do not invent distances or declare full G4 acceptance.

**Feature-flag control:** The displayed URL includes `gtdFitGround002=1`, `gtdSeat001=1`, `gtdVehFit002=1`, and `gtdFitPose002=1`. It **does not** include `gtdFitWheel002=1`. The latter visual wheel-travel subsystem remains outside this screenshot's test scope.

### 14.2 Success-preservation contract

**Freeze the visibly accepted cabin posture as the new observational baseline.** Specifically:

1. Preserve the accepted seat-back / head / chest alignment, original character scale, Ferrari import scale, driver root, and current driving animation integration.
2. Preserve the successful AR1 reflected-joint parent-space conversion, bounded corrections, animation lifecycle ordering and transactional rollback. Do not revert these merely to hide the residual shoes.
3. Do **not** apply a speculative global Y offset, whole-character translation, uniform shrink, wheel/chassis-height change, animation replacement, mesh hiding or destruction, or arbitrary new inverse-kinematics target to eliminate the small visible piece. Such broad changes risk regressing the larger accepted improvement.
4. Treat the outstanding issue as **one isolated footwell containment defect** requiring precise visual/mesh evidence and an independently reviewable future correction, not as a justification for immediately rebuilding seating or vehicle physics.
5. Before any later implementation, preserve reproducible baseline screenshots from equivalent low-side/rear and overhead angles, identify which foot/mesh (if any) crosses which actual underbody surface, and compare against the successful preview using the **same flags and pose**.
6. Any later candidate must be reversible and acceptance-gated: no exterior feet, no new arm/torso/head drift, no seated pose regression, no car/road or controller regressions, and no meaningful mobile-performance degradation. Evidence must come from the actual imported UAL and Ferrari assets, not synthetic-only tests.

**Authorization boundary:** The user requested **documentation and restraint**, not a new patch. Accordingly **no gameplay code modification, no new build/preview deployment, and no production merge** are authorized by this message. Await an explicit future instruction before investigating by source mutation or fixing the boot leak.

### 14.3 Updated acceptance classification

| Area | Current state | Evidence |
| --- | --- | --- |
| Voight principal in-car seat positioning | **SUCCESS — owner accepted visually** | Two new nighttime desktop screenshots and explicit owner approval of intended position |
| Underbody foot/boot containment | **OPEN — minor visible leak** | Yellow/orange foot geometry protrudes below Ferrari |
| Hand-to-rim exact contact | **NOT CONFIRMED by these views** | No close diagnostic or targeted grip image |
| Four-tire rendered road clearance | **NOT CONFIRMED by these views** | No four-wheel geometry/road-contact telemetry |
| G4 combined acceptance | **PARTIAL; NOT CLOSED** | Core seated appearance passed, residual foot containment and remaining checks open |
| G6 | **CLOSED** | Prior prerequisite of complete G1–G4 acceptance not satisfied |
| Production | **UNCHANGED** | Isolated preview branch only |

**Next action:** Hold the accepted implementation unchanged. When the owner explicitly authorizes further work, begin with a diagnosis-only, foot-specific containment assessment; do not jump straight to a patch.
