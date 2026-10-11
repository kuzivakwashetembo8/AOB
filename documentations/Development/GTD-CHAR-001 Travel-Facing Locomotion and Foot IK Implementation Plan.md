# GTD-CHAR-001 — Travel-Facing Locomotion, Gait Coordination and Foot IK

**Document status:** PROPOSED TECHNICAL IMPLEMENTATION PLAN — DOCUMENTATION ONLY; awaiting explicit implementation greenlight.
**Date:** 2026-10-11
**Project:** Grand Theft Division (GTD), Meridia / Meridian City
**Parent authority:** [GTD-CHAR-001 Technical Implementation Plan](../GTD-CHAR-001%20Technical%20Implementation%20Plan.md), particularly Stage 3 foundation trial, Stage 5 first playable character and gates G3/G5.
**Reference research:** [Voight Development Research](../voight-development-research.md); [Meridian Game World Development SOT](../Meridian%20Game%20World%20Development%20SOT.md).
**Implementation environment:** GTD Babylon.js + Rapier runtime; current opt-in experiment branch experiment/gtd-char001-meridia-humanoid. The existing main-branch prototype and current trial must both remain available for comparison.
**External technical reference:** interlinkglobal/three-player-controller, especially src/plugins/foot-ik/FootIK.ts, internal/twoBoneIK.ts, footPhase and predictivePlacement modules. Review its LICENSE (MIT; copyright 2026 屈航); preserve notices if any code is adapted. interlinkglobal/character-controller-sample-project is a separate comparison, not a replacement GTD runtime.

> Primary outcome: **Voight walks like a human.** A player should see one coherent body that looks where it travels, turns convincingly, places shoes on real ground, clears curbs and animates in proportion to collision-corrected travel. Gameplay on real devices, not invented numeric targets, determines whether the result feels natural.

## 0. Approved gameplay decision and scope

**Decision locked by user:** Ordinary exploration uses **travel-facing locomotion**. Forward, left, right and diagonal inputs indicate the direction of travel relative to the camera. Down/backward input requests the opposite travel direction: Voight turns about 180 degrees and then walks forward in that direction. **No backward-walk gait or sideways strafe in this stage.** Those modes may be added later only as explicit movement states (for example aiming/combat). Camera orbit/look remains independent.

**Implementation authorization:** Not granted by this document. The user authorized writing the plan; implementation, previews and any main/production promotion require separate greenlights. The current experimental humanoid is not the final, rights-cleared Voight model. Do not prematurely replace it with the canonical outfit, import unrelated art, introduce combat/vehicles, or rewrite the accepted city to compensate for character movement defects.

**Protected baseline:** Preserve camera-relative keyboard arrows and mobile joystick, touch look sensitivity, sprint, jump, Rapier character capsule, fixed-step movement, static collisions, autostep, snap-to-ground, street/garage/vehicle assets, live world and shader rendering, quality settings, pause → Settings → Apply & Resume, and real 8/8 startup witnesses. The recent character-trial world-rendering regressions demonstrate that a passing readiness gate alone is not sufficient; real visible city and character remain independent acceptance conditions.

**Conscious exclusions:** Initial backward-walking clips; aim strafing; combat; horse-like pivots, moving platforms beyond interface hooks; full-body physical ragdoll; final canonical asset selection; final wardrobe; car entry/driving animation; imported Three.js renderer or duplicated physics.

## 1. Confirmed code baseline and observed defects

### 1.1 Source-backed existing behavior

- On main, src/game/core/gtd-runtime.ts runs a fixed 1/60-second game simulation. Camera-relative movement is computed using camera forward/right vectors and desired input. The walk/sprint constants are 3.8 and 6.4 world units per second at the time of review. **These are existing code values, not validated natural-walking targets.**
- MeridianPhysics in src/game/physics/rapier-world.ts owns a position-based kinematic capsule, collision-corrected movement and grounded status. Its current Rapier settings include snap-to-ground 0.22, autostep maximum height 0.28 and minimum width 0.18 (world units). They are baseline settings to preserve/test, not instructions to blindly retune.
- Main already assigns the simple proxy root a heading from the desired movement vector via atan2(desired.x, desired.z), instantly. The proxy can slide laterally without visible leg incongruity.
- In the experimental branch, src/game/character/voight-humanoid-trial.ts imports a rigged UAL humanoid, normalizes its height near 1.78 world units, nests a separate visual root, and currently applies a fixed 90-degree visual-axis adjustment. It chooses idle/walk/sprint/jump from measured horizontal movement and grounded status, but the present animation update is not calibrated to actual stride distance or foot phase.
- The trial's translated model and animated legs rendered together with Meridian buildings/road markings in the user's latest accepted world screenshots. The user then observed: the body slides sideways while its feet walk in another direction, and feet/legs visibly intersect road/sidewalk/curb surfaces. These defects are accepted evidence; the previous world-render fix is not equivalent to locomotion acceptance.
- The referenced three-player-controller Foot IK implements multi-point sole sampling, foot-phase logic, planted versus swinging foot handling, pelvis raise/drop, constrained two-bone leg solving, knee pole stabilization, optional predictive placement and debug/tuning controls. Its code is in Three.js units and animation lifecycle; this is **technique reference**, not plug-and-play Babylon code.

### 1.2 Unproven questions to resolve in implementation

- The imported rig's true authored forward axis and whether the 90-degree model-root correction is producing double or inconsistent rotation after animation evaluation.
- Whether clip root/hips motion introduces unintentional translation or rotation, and how each chosen animation is authored (stride length, cadence, foot plant phase, mirrored keys).
- Relative locations of collider support plane, rendered asphalt/sidewalk/curb, normalized boot soles, ankle pivots and visual pelvis at load, idle and motion.
- Proper Rapier-vs-render-mesh contact query pairing at curbs and garage thresholds; world static collider coverage and its relationship to visible geometry.
- Real desktop and Android mobile costs (shader, skeleton, raycasts, animation, IK) and whether device power/quality modes need adaptive IK update frequency.

These are **measurements to obtain**, not reasons to block preparatory structure or guess hard thresholds.

## 2. Design principles and runtime ownership

1. **Physics is authoritative.** Rapier computes permitted world translation and grounded state. No unrestricted animation root motion, teleports or IK offsets may drive the capsule through collisions.
2. **The character is a transform hierarchy, not one rotatable mesh.** Suggested conceptual hierarchy: PhysicsActorPosition → TravelHeadingNode → VisualAxisCalibration → Rig/Skeleton → IK-adjusted pelvis and feet. Keep camera independent; avoid applying heading twice or rotating a skin root that also receives animated yaw.
3. **Use resolved motion.** State/animation is selected from **collision-corrected horizontal displacement per fixed tick** plus input intent/grounding, not just commanded speed. If blocked by a car or wall, the feet should stop cycling as if moving through it.
4. **Turn and travel may overlap.** A human can take steps during a turn. The first experiment must avoid substantial sideways displacement while the torso and planted feet point elsewhere; near-opposite inputs may temporarily slow translation while pivoting. This should be tuned through live observation, not predetermined as a fixed delay.
5. **Visual ground contact is distinct from capsule grounding.** Rapier knows where the capsule may travel; IK adjusts shoes/legs/pelvis to the accepted support geometry. Do not hide an incorrect world collision surface by forcing foot IK.
6. **Animation before IK, IK before render.** Evaluate/retarget the pose, then place the pelvis and legs for actual ground support. Restore or recompute the animation-origin pose every frame; never accumulate previous IK edits into the next cycle.
7. **Keep the first trial reversible.** Small independently togglable stages, opt-in branch/route, no production substitution, no world-material or vehicle fixes masquerading as character work.
8. **Empirical acceptance outranks guessed parameters.** Machine metrics explain motion and regressions. The determining art/UX gate is repeated human-in-the-loop play: does Voight actually walk like a human in Meridian?

## 3. Proposed components and data contracts (design, not created code)

- **TravelIntentMapper:** Maps existing GameCommand movement into a camera-relative normalized travel vector. Maintains held-input and diagonal semantics. Does not change desktop/mobile controls.
- **TravelHeadingController:** Owns current visual heading, target heading, angular velocity, turnaround state and settled direction; updates in fixed-step time using shortest-angle interpolation. Identifies exact/opposite input and chooses a stable turn side (no 180-degree sign jitter).
- **LocomotionCoordinator:** Receives intent, current heading, Rapier corrected delta, grounded/airborne status and sprint intent. Coordinates turn/translation concurrency, start/stop acceleration, animation state and phase. Does not own Rapier contacts.
- **CharacterRigAdapter:** Stores real authored forward axis, calibration quaternion, skeleton/bone mappings, root-motion handling and immutable bind-pose/sole geometry references. Works first with the UAL trial and later with the permanent Voight rig.
- **FootContactProvider:** Centralizes world-space support sampling against accepted static/kinematic support colliders, tags/filters, normals, surface height and visual-vs-collider divergence evidence. Does not raycast the character's own collider or arbitrary camera meshes.
- **FootIKSolver:** Optional, deterministic visual-only layer for left/right sole targets, planted-world anchors, constrained two-bone knees, pelvis compensation, heel/toe alignment and reset on unsupported/airborne states.
- **CharacterLocomotionDiagnostics:** Small opt-in runtime controls and export of time-stamped, actual character movement/contact/performance samples; no synthetic successful readings or intrusive fullscreen overlays.
- **Future LocomotionMode interface:** ExplorationTravelFacing is the sole active mode. Reserved future modes such as AimStrafe, WalkBackward, VehicleSeated and CinematicMotion must be explicit and never inferred from down-arrow input.

**Suggested code locations after approval:** src/game/character/locomotion/ for intent, heading, animation coordinator and rig adapter; src/game/character/ik/ for support probes and solver; extend src/game/physics/rapier-world.ts only with required read-only support-query services; add isolated test helpers in src/test/; keep trial-only debug configuration behind the existing opt-in character-trial condition. These are prospective paths, not files that exist now.

## 4. Runtime frame/update order

The intended ownership and order, subject to a Babylon-specific animation hook proof:

1. Sample existing keyboard/touch inputs and camera yaw once per game tick.
2. Construct camera-relative **intended travel vector**, not an animation or raw skeletal velocity.
3. Compute shortest heading error between intended travel direction and calibrated forward axis; smooth heading using the fixed time step and tuned angular response.
4. Produce horizontal translation for the **current facing/turning state**. Allow progressive translation during turns, but reduce implausible lateral sliding for large misalignment. Keep sprint intent and airborne steering documented.
5. Pass requested displacement plus gravity/jump to the existing Rapier kinematic controller; obtain corrected displacement, final body transform and grounded state.
6. Derive actual planar velocity, contact/support data and state transitions from corrected displacement. Track blocked movement separately from commanded movement.
7. Place the physics actor and heading/visual calibration hierarchy. Coordinate animation state, locomotion clip weight/speed/phase, foot contact transitions and movement-driven pose.
8. Restore/re-evaluate rig animation pose; run an explicit Babylon-safe **post-animation, pre-render** IK hook exactly once per rendered pose. Reconcile a 60 Hz movement tick with variable render rates without solving against stale transforms or twice-advancing animation.
9. Sample grounded left/right sole and support surfaces, compute pelvis target and constrained leg solves, blend weights and foot rotations, update skeleton matrices and render.
10. Record data in the optional trial report. Preserve existing startup, camera, quality/settings resume and disposal behavior.

**Timing safeguard:** The current render loop uses fixed-step physics plus scene.render(), and Babylon animation groups have their own rendering-cycle evaluation. Verify actual Babylon callback sequencing with a tiny post-animation test before wiring bone corrections. Do not assume Three.js mixer hooks have a one-to-one API equivalent.

## 5. Work packages, experiments and approval gates

### L0 — Frozen baseline and source calibration (no gait changes)

- Capture same-device screenshots/video of current opt-in UAL trial and production/main proxy, with exact build SHA, device/browser, graphics quality, time of day and camera viewpoint.
- Record actual model forward axes: root axes, visual normalization transform, authored locomotion clip facing, bone axes, left/right footwear, pelvis and scale. Turn off one correction at a time only inside the isolated experiment.
- Inspect animation clips and measure displacement *embedded in the clip* versus intended in-place animations. Measure nominal stride distance and cadence from foot bones as data, not an assumed walk speed.
- Log actual Rapier collider support height and visible road/sidewalk/curb surfaces. Check garage threshold and curb collision alignment on at least one repeatable position each.
- Confirm current world remains fully visible (buildings, asphalt, lane stripes, trees, cars, garage). Keep a no-query preview control for isolation.

**Exit L0:** Verified forward-axis mapping and calibration basis, a reproducible short movement circuit, contact coordinate system, matched evidence of known sliding/penetration and identified rig chains. User confirms comparative baseline.

### L1 — Smooth travel-facing rotation

- Separate camera yaw, movement intent, physics actor position, travel-facing heading and fixed visual-axis correction. Adopt quaternions or shortest-angle yaw math compatible with the actual rig; never accumulate arbitrary yaw at both nodes.
- Implement a continuous turn controller with angular damping/acceleration or rate limiting (implementation determined in trial); support an approximately 180-degree reversal with a deterministic sign rule. Preserve heading at zero input and turn-in-place/turn-while-moving behavior when needed.
- Prevent pronounced skating during large angle changes. Explore gradual translation attenuation tied to measured heading error and actual allowed motion, with adjustable controls; **do not mandate that the character always finishes turning before taking a step**.
- Preserve camera-relative arrow-key semantics: up forward; down turns around to travel toward camera; left/right turn toward lateral travel; diagonals turn toward blended travel. Match corresponding joystick directions.
- Keep camera orbit independent. A camera swipe alone must not spin Voight when stationary unless a separate approved look/facing mode is introduced.

**Test circuit:** idle→up; up→left/right; continuous figure-eight; alternating left/right; diagonal; down from idle and from a run; full 180/360 turns; repeated inputs at changing mobile FPS.

**Exit L1:** The body and feet face travel sufficiently to avoid obvious sideways sliding. No mirrored axes, sign-flip oscillation, uncontrolled spin or broken camera/physics. Human gamer tunes rate in live Meridian play. Record observed turn duration/displacement, but do not invent a required number before play.

### L2 — Animation cadence and gait/heading coordination

- Separate requested velocity, Rapier-corrected horizontal velocity and skeletal animation phase. Maintain a small explicit locomotion state model: idle, initiate, walk, sprint, decelerate/stop, turn, airborne/jump, land (states can be blended; avoid unnecessary code).
- Calibrate in-place locomotion animations to ground travel; preserve capsule-authoritative translation. Adjust playback rate/crossfade based on observed speed and measured clip stride. A blocked capsule should not run a full walking cycle.
- Blend start/stop and yaw/turn behavior. Prefer available compatible clips; if turn-in-place is not in the model, use controlled root orientation plus a natural-compatible transitional gait rather than pretending to have such an animation.
- Establish foot contact phase markers by inspecting clips (manual annotation or automated analysis validated in-game). Avoid guessing right/left stance timing by clock phase alone.
- Preserve sprint/jump controls, including correct return from airborne to grounded and animation fallback when a clip is absent.
- Record angular error, corrected distance, stride-progress versus world progress, active clip/weights, motion mode and visible lateral foot slip.

**Exit L2:** On flat road, feet visibly travel at the body's pace, stops do not resemble treadmill jogging, 180 turns are physically understandable, and walking/sprinting can be evaluated without IK hiding cadence defects. User confirms feeling before proceeding to IK.

### L3 — Static rig and ground-contact calibration

- Identify exact Babylon Skeleton bones for hips, upper/lower legs, ankles, feet and toes on both sides. Validate hierarchy, bind-pose length and local/world axes; fail clearly when required bones are unavailable.
- Determine center/sole/heel/toe local offsets from *actual shoe geometry* and normalized rig, separately from ankle pivots. Map all distances to Meridian world units; reject copying raw Three.js demo values or scale factors.
- On road, raised curb, sidewalk, garage threshold and gentle slope, inspect physics collider bottom, rendered surface Y, static shoe penetration/gap, animated pelvis height and support normal.
- Provide physics support queries with filters for ground/walkable curbs; compare collision query against graphical mesh where necessary. If visual and collider surfaces diverge materially, fix the underlying ground specification, not its appearance through IK.
- Establish the expected behavior at unreachable/invalid surfaces: no strong leg stretch, knee reversal or fake support on vertical walls; disengage/reduce IK and preserve the stable animated pose.

**Exit L3:** Both shoes can be grounded in idle without needing excessive pose deformation. Sole-to-surface offsets and collider/reference geometry are validated, with mismatch evidence and no changes to accepted city unless separately authorized.

### L4 — Reactive Foot IK (first complete human-walking candidate)

- Adapt the fork's *algorithmic concepts*, not its Three.js object graph: cast multiple sole samples (heel, toe and lateral points), choose support at acceptable slope/contact, compensate shoe thickness, find world-space sole target and orientation.
- Use measured animation foot phases: stance/planted foot attempts to stay fixed relative to world support; swing foot follows the authored gait, with bounded anti-penetration lift. Include release/blending to avoid snapping when leaving contact.
- Solve left and right foot targets, compute bounded pelvis raise/drop consistent with knee reach, then solve hip–knee–ankle two-bone chains with stable knee pole, angular reach constraints and smooth foot surface alignment.
- Use an explicit previous-frame pose restore/reset policy to avoid IK accumulation, plus no-contact/jump/airborne reset. Prevent double transforms from a parented visual root, root-axis correction and skeleton changes.
- Keep IK **visual-only**; it must not shift the player capsule or trigger artificial obstacle crossing. React to Rapier's actual collision-corrected support and animation state.
- Make this implementation switchable in the trial: Off, Reactive (On), Debug. No second game engine/renderer, no permanent always-visible debug geometry.
- Test seams and curbs with both shoe profiles: foot on road / foot on curb, approach straight and oblique, up and down, slow turn on curb, garage threshold, idle at edge, jump and land.

**Exit L4:** User sees believable shoe contact and pelvis response at the exact locations that formerly swallowed the boots, with no knee flips, excessive hip bouncing or animation/IK fighting. Quantitative data supports the visual assessment.

### L5 — Conditional predictive placement, only if Reactive has demonstrated a limitation

- If reactive IK cannot clear approaching curbs without visible penetration, introduce the fork's ideas for clip foot-phase prediction, plausible landing probes, foot reach, obstacle clearance, toe arc and anchored landing surface.
- Replan only when needed; keep the swing path continuous and fallback to reactive IK if surface information is unreliable.
- Include limits on probe cadence, allowed slope, maximum landing offset, foot raise/drop, knee bend and pelvis adjustment—first bounded by anatomy and world geometry, then tuned by actual user observation.
- Architect support-local anchors for later moving platforms but do not implement moving-platform locomotion or vehicle foot IK in this iteration.
- A/B test Reactive against Predictive on identical curb/garage routes. Ship predictive only if it creates a visible benefit commensurate with mobile cost; no assumption that “more IK” means better movement.

**Exit L5 (conditional):** An observed problem is eliminated without introducing foot snapping, stepping through obstacles or unacceptable performance regression. Otherwise remain on Reactive and explicitly defer prediction.

### L6 — Integrated world/device validation and staged handoff

- Verify normal third-person exploration at mobile landscape and desktop resolutions with the full real Meridian environment and nine imported car placements (as represented in the trial), not an isolated humanoid on a testing grid only.
- Preserve existing collision, camera obstruction, pause/resume, touch sensitivity, time-of-day lighting, native-quality options, startup 8/8 real-draw evidence and graceful failure reports.
- Compare locomotion Off/Orientation-only/Coordinated/Reactive/Predictive under matched view and world conditions. Separate world and vehicle startup costs from incremental per-frame character/IK cost.
- Keep a disabled-by-default rollback switch and baseline preview. No automatic merge to main, production deploy or declaration of final Voight foundation.
- Capture user-rated visual acceptance and exact device evidence; create a short documented gate decision that records what works, what does not and deferred work.

**Exit L6:** Actual user acceptance of believable human locomotion, with mobile and desktop evidence, no regressions to city and vehicle rendering, and reproducible performance results. This authorizes requesting the next implementation decision, not a production release.

## 6. In-game calibration workflow: derive acceptable parameters from play

**Doctrine:** We cannot know in advance what heading turn speed, animation cadence, turn/translation coupling, stride length or pelvis response will *feel* like in this game. Do not set invented “realistic human” thresholds as pass/fail criteria. All proposed numeric settings are experimental values, not accepted game constants.

Create a small **trial-only**, non-blocking development panel in the existing settings/pause UI or a dismissible compact overlay. It must not sit across the character, obscure the phone controls, force a world restart when applying changes, or resurrect the historical FL-4 fullscreen data button.

Candidate live controls (separate groups; only expose controls implemented in current gate):

| Rotation / locomotion | Animation | Ground contact / IK | Diagnostics |
| --- | --- | --- | --- |
| Turn responsiveness / angular cap | Playback-to-speed factor | Sole offset, foot skin thickness | Show facing vs requested vector |
| Turn acceleration/damping | Walk/sprint transition blend | Max foot reach/drop/raise | Show actual capsule path |
| Translation while turning | Minimum movement/deadzone | Pelvis raise/drop response | Show left/right contact targets |
| 180-degree-turn convention (debug) | Foot-phase/plant threshold | Knee bend and pole stabilization | Render time and IK workload |
| Live reset-to-baseline | In-place/clip mode (trial) | Reactive/predictive Off/On | Export user-initiated JSON |

**Calibration process:**

1. Enter an unchanged, named Meridian route, select a recorded preset and capture 10–20 seconds of baseline normal gameplay; keep camera, time of day, display clarity and input mode noted.
2. Change one class of variables at a time without reloading Meridian. Repeat an identical movement circuit. Make a short visual judgment: too slow/fast to face? Sideways slide? Feet cycling too fast? Foot sinking? Hip bobbing? Does steering still feel responsive?
3. Store bounded preset values only when the gameplay observation improves. Human approval is primary; diagnostic deltas help explain why.
4. Repeat at least one side-by-side A/B cycle against the old preset. Compare idle, straight walk, abrupt reversal, curb approach, sidewalk crossing and garage threshold.
5. Validate the winning preset on mobile **and** desktop. Do not auto-claim identical appearance at different FPS; use fixed time-based behavior, record device conditions and adjust adaptive performance only when measured.
6. The user selects a visually accepted default. Lock the selected values with date, SHA, device, comparative video/screenshots and reason. Automated tests then protect the *accepted behavior* and safety invariants rather than retroactively blessing guessed constants.

User qualitative questions: “Does he look where he is walking?”, “Does his torso lead/settle naturally?”, “Do feet appear planted instead of skating?”, “Does he step onto the curb rather than sinking into it?”, “Do a quick 180 and sprint feel controllable?”, “Does it still look right on phone?”

## 7. Observability and evidence (real measurements, not mock progress)

For each session record:

- Build commit/branch, date-time, experiment mode, input mode, device class/browser/OS and available hardware details, viewport CSS size, DPR, framebuffer and graphics settings.
- World location/route, camera orientation, time of day, baseline/preset identifier; original car/world visibility state.
- Desired input vector, camera-relative intended travel vector, target heading, displayed heading, angular error, actual angular rate, corrected Rapier planar velocity/distance, grounded state, sprint/jump and current animation clip, weight, phase and playback multiplier.
- Estimated stride advance versus actual displacement per planted phase; left/right foot contact state, ray/shape query hit/collider identifier, hit point/normal, shoe sole–support gap/penetration, horizontal plant slip and invalid/unknown contact count.
- Pelvis IK offset, foot IK weight, leg reach/clamp, knee bend/pole degeneracy events, ray/shape query counts and per-frame IK execution time.
- Median/p95 frame time and render time, long frames, approximate frame rate and comparison with the identical branch without IK; sampling overhead itself should be measured.
- Optional compact annotated screenshots/videos and human preference selections; missing telemetry is **unknown**, not zero.

An exported report includes real timestamps, sample counts, capture duration, configuration, metric units and known limitations. Not all GPU memory or actual photons are observable from Web APIs. Reports are opt-in, downloaded locally and never automatically uploaded. Measurements should avoid disproportionate runtime overhead; use sampled summaries and bounded buffers.

## 8. Acceptance method: first see a human, then formalize tests

### 8.1 Human-visible acceptance circuit

| Scene/maneuver | What must look correct |
| --- | --- |
| Idle on flat road | Balanced standing; two shoes on visible asphalt without sink/gap/jitter |
| Up, left, right, diagonals | Body turns toward travel, steps advance in the same direction, camera still independent |
| Down input | Predictable ~180-degree turn followed by forward-facing travel; **no backward-walk animation** |
| Walk → sprint → stop | Gait and velocity agree; no treadmill cycles when blocked or idle; smooth recovery |
| 90/180/360-turn while moving | Natural turn response and controlled translation; no feet walking in a different compass direction |
| Road → curb → sidewalk | Foot swing clears obstacle; stance foot contacts support; pelvis and knee stay plausible |
| Oblique curb approach and return | No foot sink, snapping, knee flip or character floor tunneling |
| Garage threshold and near walls | Correct collision and planted foot behavior; IK does not push the capsule through geometry |
| Jump, airborne, land | IK releases in air and re-engages after supported landing; no old planted-foot anchor left behind |
| Android touch vs desktop keyboard | Same movement semantics and believable appearance despite differing input resolution and frame rate |
| Quality changes and pause/resume | No loading reset, animation discontinuity, duplicated observers or stale foot anchors |

### 8.2 Automated safeguards, not guessed aesthetic verdicts

- Pure vector/quaternion tests: forward-axis calibration, shortest signed yaw, +/−π wrap, deterministic exact reversal, diagonal normalization, opposing input transitions and zero-input heading retention.
- Deterministic fixed-dt tests: no movement when input released; no turn-rate change induced by FPS; turning output and translation remain bounded; stable priority of airborne/sprint states.
- Integration: collision-corrected movement controls animation rate; blocked motion does not command a full gait; no horizontal root motion alters Rapier; world/static collision preserved.
- Rig contract: explicit bone mapping, valid rotations, valid nonzero leg chain lengths, reachable/invalid target handling, knee bend limit, no NaNs, pose reset idempotence, independent left/right contacts.
- Surface tests: flat ground, curb top/face, sloped ground, two different support heights, missing/invalid hits, fall and jump; no false grounding against building walls or character self-collision.
- Babylon timing: render poses only after animation and IK, with no double-apply under multiple fixed ticks per render or one fixed tick across multiple render frames.
- Browser/device regressions: visible original Meridian, generated building/road-marking witnesses, imported cars, loaded humanoid, stable camera, touch arrows, quality change and Apply & Resume.
- Regression data references a **user-accepted run** and tracks measured deltas. A numerical heading time or shoe-gap tolerance becomes binding only after approved empirical calibration; safety limits (finite transforms, bounded reach, no collider penetration) may be guarded immediately.

### 8.3 Formal gates

| Gate | Required evidence | Blocking failure |
| --- | --- | --- |
| L0 | Axis/rig/terrain calibrated; reproducible baseline | Unknown authored forward or unsuitable support geometry |
| L1 | Turn-focused actual play accepted | Sliding compass mismatch, reversal instability, wrong controls |
| L2 | Gait + speed + turn play accepted on flat surface | Treadmill feet, wrong sprint/stop cadence, uncontrolled root motion |
| L3 | Collider/support/sole geometry verified | Treating physics mesh mismatch as visual-only error |
| L4 | Reactive feet/pelvis work on real curb/garage | Penetration, knee flip, unstable pelvis, pose accumulation |
| L5 optional | Prediction gives demonstrated benefit | More complexity without player-visible improvement |
| L6 | Same-device A/B, mobile+desktop, full world, clean regression | Startup/world regression, control mismatch, unacceptable cost |

**Final acceptance is a user decision from actual gameplay, not a mathematically prescribed “human” threshold.** Numbers serve comparison, diagnosis and regression.

## 9. Risks, controls, future extensibility

- **Rig forward-axis / handedness:** Validate actual Babylon world axes; do not blindly keep/remove the source 90-degree correction. Transform order must be explicit and tested.
- **Character and city renderer interference:** Earlier experiments lost buildings/road markings because experimental shaders ignored thin-instance transformations. Avoid world shader changes in a locomotion task; require all accepted city components in every trial.
- **Foot penetration is not always an IK bug:** Check Rapier static collider representation, curb geometry and shoe sole offsets. Never shrink or relocate the city globally to make one imported model appear grounded.
- **Animation/IK fighting:** Guarantee one authoritative animation pose evaluation then bounded IK. Reset on clip swaps, pause/resume, model change, jump and disposal.
- **Input lag vs realism:** Over-slow turning harms play. Use a tunable turn/travel blend, especially for rapid direction change or running; gameplay responsiveness is part of naturalness.
- **Performance:** Cap/adapt support queries and debug drawing only after measurement. Candidate adaptive IK modes must not produce visibly different physical movement or hide collision failures.
- **Asset provenance:** Fork's MIT code license and UAL example model animation/redistribution rights are separate. Retain notice as needed; never treat trial success as permanent commercial clearance.
- **Future actions:** Mode interface and rig abstraction preserve possibility of strafing, backward gait, seated driving, aiming, weapons and wardrobe variation, but none are necessary to declare this locomotion trial successful.
- **Rollback:** Remove/disable opt-in locomotion plugin and return to last known good trial/production baseline; restore original material and city behavior without recompiling or replacing live assets. Keep before/after SHA and deployment URL in evidence.

## 10. Proposed implementation order, handoff and authority

**After explicit greenlight**, implement in this order, committing/tests at each gate:
L0 baseline → L1 calibrated facing → L2 gait/cadence coordination → L3 static support calibration → L4 reactive Foot IK → L5 predictive *only if evidence demands it* → L6 comparative acceptance.

Each gate should deliver: (a) preview URL with same full Meridian environment, (b) short human-readable changes, (c) compact, optional live tune controls and downloadable evidence, (d) actual automated test results, (e) matched mobile/desktop images or video, (f) accepted/rejected observations and candidate settings, (g) rollback SHA. **Do not batch every gait and IK feature into one unreviewable patch.**

**No implementation authorized by documentation creation. No code edit, character model replacement, branch merge, production deployment or performance pass may be inferred from this plan.**

**Next authorization to request:** Begin L0–L1 on the experimental character branch, with in-game comparison and a first travel-facing rotation preview. Later packages progress only after the evidence/acceptance at their gates.
