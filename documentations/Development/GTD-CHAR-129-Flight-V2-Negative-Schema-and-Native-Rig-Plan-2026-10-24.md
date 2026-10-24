# GTD-CHAR-129 — Voight Flight V2: Negative Schema and Native-Rig Implementation Charter

**Date:** 2026-10-24  
**Repository:** interlinkglobal/GTD  
**Branch:** feat/voight-flight-v2-native-rig-20261024  
**Branch origin:** clean `main`, commit `06399a5aaef46b5061db41c6206c70d3e218882c`. NOT descended from rejected CHAR-128.  
**Status:** Implementation authorized and first preview READY, owner visual acceptance pending. No merge or production deployment.  
**Owner direction:** "Open a new flight branch using the failed one as a negative schema. You now know everything that you should not do."

## 1. Decision

Attempt original `character.glb` flight from a **native-first pose construction** rather than projecting all UAL flight rotations onto Voight's different skeleton.

**Objective:** Voight can hover naturally, translate in all permitted flight directions and eventually transition to a convincing fast-flight posture, while preserving the existing physics, cameras, controls, accepted native standing pose, gait, jump and independently developed vehicle seating.

**Fundamental separation:**

- **Physics/control:** use the existing Rapier flight subsystem already proven by CHAR-002; no modification to its displacement, collisions or altitude rules.
- **Visual body:** solve only `character.glb`'s fully parented pose. Baselines and constraints come from Voight's **accepted native pose** and actual weighted/linked body, not from the UAL retarget.
- **Reference animation:** UAL supplies the **intent and phase vocabulary** (hover, direction, accelerated/prone), not a transferable local-joint coordinate system.

**Do not import, cherry-pick or reconstruct CHAR-128 code.** Its source findings are research inputs only. Its 17 feature-branch commits have been rejected under DDD.

## 2. Grounding: what was established versus not established

**Established by repository evidence and user screenshots:**
1. Legacy UAL has eight authentic flight source clips; the six directional hover clips are static one-frame poses. The game already moves and collides correctly in flight via Rapier.
2. Initial CHAR-128 enabled flight and moved the original Voight in the air. It repeatedly presented **visually twisted/outspread hands/arms and crossing legs** on mobile.
3. CHAR-128 R2 reduced local arm/leg rotations but did not neutralize ancestor pelvis and spine transformations. Distortion persisted.
4. R3 returned all 22 mapped joints to the standing basis for hover; a synthetic parented-rig global-wrist/foot test passed and the preview deployed. The owner invoked DDD. **There is no final R3 screenshot establishing a specific residual rendered defect**, so we cannot claim the exact cause of that final rejection.
5. CHAR-128's binary audit, GLB processing, automated tests and deployments demonstrated **technical movement feasibility**, not anatomical correctness in the original visible model.
6. The accepted CHAR-109 natural arms and subsequent accepted standing/walking/running/jumping behavior are existing assets that must be protected.

**Still hypotheses to verify on real Voight:** whether `walk.update(0)` is actually a visually settled standing pose during the transition; whether a fitted mesh-root transform, quaternion/rest calibration, hierarchy propagation, the single-frame UAL torso, or the fast-to-hover blend caused residual silhouette differences. No hypothesis may become a patch until measured.

## 3. Negative schema — forbidden repetition of CHAR-128

| ID | Forbidden behavior | Observed consequence or risk | Required replacement |
| --- | --- | --- | --- |
| N-01 | Clone/port `retargeted-flight-128.ts` or its build scripts into the new branch | Reintroduces rejected logic by inheritance | Design a new native-pose controller from accepted CHAR-109 semantics |
| N-02 | Assume UAL source quaternions directly express natural Voight anatomy | Different bind axes, parent frames and proportions twist arms/legs | Construct and check target poses in actual Voight world space |
| N-03 | Fix a wrist, elbow, knee or foot in isolation while ancestors still animate | Neutral child local orientation does not imply natural world geometry | Compute full parent-chain/world-space result and validate body clearances |
| N-04 | Infer correct rendered posture from synthetic/unparented test rigs alone | Tests passed while user screenshots still failed | Load actual `character.glb`, accepted standing rest, skin and real linked hierarchy in tests and diagnostic scenes |
| N-05 | Zero all 22 foreign animation deltas and declare success without rendered comparison | Previous R3 automated parity did not earn owner acceptance | Capture reference and result screenshots from actual original mesh; verify before a preview |
| N-06 | Apply post-retarget per-joint percentage caps as the principal anatomical design | Percentages cannot repair inherited frame errors | Pose design from native rest, solve visual endpoints and anatomical constraints first |
| N-07 | Let walking, jumping and flight players write the same joints without explicit ownership | Hidden blend contention; stale inherited posture | Centralize animation ownership with measured transitions and deterministic reset |
| N-08 | Move, pitch or translate the Rapier capsule to create a flight visual | Collision/camera/grounding drift | Keep visual-only pose transforms independent of physics root |
| N-09 | Treat flight toggle as complete just because Rapier player moves | Voight can be hidden, frozen, or incorrectly anchored in flight | Confirm actual visible original instance updates and follows physics every frame |
| N-10 | Reimport the UAL humanoid or source GLB at runtime as a hidden substitute | Duplication and load/memory cost; wrong character | Keep one original Voight visual mesh and independent compact pose parameters |
| N-11 | Suppress build and anatomy warnings because unit tests are green | False confidence; unacceptable silhouette | Block preview on measured geometric, screenshot and transition evidence |
| N-12 | Deploy every minor elbow adjustment or iterate through large preview fleets | Wastes limited deployment budget | Local/CI pose captures first; one meaningful preview only after substantial progress |
| N-13 | Touch vehicle seating, accepted walking/running/jumping, generated world or offline subsystem during flight work | Cross-branch feature regressions | Strict diff allowlist and regression suite before any preview |
| N-14 | Present guessed final failure mechanism as a proven root cause | Misleading engineering decision | Label evidence, hypotheses, and residual unknowns separately |
| N-15 | Merge without explicit owner visual acceptance | Direct violation of established quality gate | Preview → owner accepts → separate merge authorization |

**Enforcement:** Every implementation PR/change is checked against N-01…N-15. Any violation means return to local prototype/design review, not a preview deployment.

## 4. Proposed positive architecture — native character first

### Phase 0 — Establish a measured accepted baseline (MANDATORY BEFORE CODING FLIGHT)

1. Load the **actual** `public/GLBs/Characters/character.glb` under the same Babylon hierarchy and normalization used by the game. Apply `createNativePoseController109` and the accepted walking-system idle setup in the **same order and runtime conditions**.
2. Read from *real linked TransformNodes*: base and child local rotations, parent world matrices, global shoulders, elbows, palms/wrists, hips, knees, ankles, toes, actor's facing, and a torso midline. Capture both rest and one or more settled idle frames; don't assume rest = idle.
3. Save the accepted **pose reference** as a reproducible diagnostics fixture: model SHA, target height, parent hierarchy, baseline world endpoints/orientations and front/side/back visual captures. Never mutate source GLB mesh/skin.
4. **Compare direct flight intention against accepted baseline visually before motion**. If standing parity cannot be reproduced in the diagnostic harness, no flying patch begins.

### Phase 1 — Native hover, no UAL local-joint import

1. In a NEW scoped controller (proposed `src/game/character/native-flight-129.ts`) define hover by the baseline accepted standing skeleton **plus a minimal independently measured airborne offset if genuinely needed**. Default to *zero* relative joint motion until the real posed mesh is rendered and validated.
2. **Arms:** constrain shoulder–elbow–wrist chain against each character-side torso corridor; maintain left/right side, palms close to accepted orientation, only small natural lateral gap. Do not compute a single world up/down target independent of character yaw. Arm swing is not required for stationary hover.
3. **Legs:** constrain each ankle/toe to its own anatomical side of the pelvis midline; respect real hip width. Both legs may be straight and side by side initially. If one leg bends, use a small calibrated knee flexion that does **not** displace either ankle across the body midline.
4. Solve desired endpoints through a target-rig-aware algorithm (parent-space inverse kinematics, explicitly checked joint quaternion chain, or hard-coded calibrated original-Voight pose) rather than importing foreign UAL joint orientation. Choose the simplest reproducible option once measurements are available.
5. Use **bone/mesh world coordinates**, not unvalidated name-based left/right sign conventions. The GLB may have inverted handedness or unusual parent axes.
6. Any optional hover breathing or micro-motion follows acceptance of a **static, correct silhouette**; never introduce it before.

### Phase 2 — Flight-mode wiring (after hover anatomy passes)

1. Reuse `src/game/character/locomotion/inspection-flight.ts` unchanged: 7.5 m/s normal, 12 m/s sprint, 5 m/s vertical movement, 145 m ceiling and Rapier collision. Preserve the G toggle, jump/ascent, descent, Shift, arrows/WASD and mobile controls.
2. Update the actual visible original character in flight using current capsule position and heading with the documented 0.92 m visual foot-origin offset; do not spawn UAL or a second `character.glb`.
3. Define a single mode owner: vehicle > flight > jump/fall > walk/run > idle, with clear enter/exit, reset, and disabled-state behavior.
4. Begin flight from the settled accepted pose, then apply native hover pose. On landing, wait for real Rapier contact to reactivate walking/jump. On G toggle while mid-air, physics remains authoritative.
5. Directional movement can initially reuse the accepted hover anatomy while the body translates physically. Direction-specific leans require separately measured target postures with the same anatomical gates; no pressure to imitate every original UAL directional still if doing so breaks Voight's anatomy.

### Phase 3 — Accelerated horizontal flight, separately accepted

1. Do **not** blindly retarget `fly` as a package. Build a new target-rig-native aerodynamic pose with bounded body pitch and shoulder/leg placement; distinguish body visual pitch from camera/collider orientation.
2. Calibrate front and profile silhouettes of **Voight**, not UAL. Confirm his head/gaze, shoulders, bent arm orientation, ankle separation and feet direction throughout rotation from upright to prone.
3. Preserve existing `flightFacingPolicy` including fast reverse heading-alignment gate (within ~20 degrees). No instantaneous 180-degree reversal.
4. Crossfade only between **validated endpoint poses**. Verify both directions, hover → prone and prone → hover, including rapid interrupted transitions.
5. If fast flight fails visually, do not regress accepted idle hovering: this phase can be isolated and gated separately.

## 5. Test design — actual anatomy, not only code state

Tests on the **actual target GLB and skeleton hierarchy** take priority over reduced fixtures. The following are **proposed initial thresholds**, adjustable after direct baseline measurement, not claims that the accepted rest satisfies arbitrary absolute distances.

**Geometric checks:**
- At rest and settled hover, the horizontal side ordering of shoulders, elbows, wrists, hips, knees and ankles relative to the measured torso mid-plane must remain unchanged.
- Left/right ankle and foot-tip ordering may not invert. Calibrate initial minimum separation against accepted resting stance; provisional requirement >= 80% of baseline bilateral ankle separation and zero crossover events over the frame set.
- Wrist/elbow signed lateral coordinates must remain on their anatomical side; wrist orientation must deviate no more than a deliberately reviewed tolerance from the accepted palm orientation.
- Validate both local and world-space quaternions and endpoints; include parented hip and spine changes and actual mesh skin deformation. Geometry checks must be invariant under tested yaw/camera headings, not hard-coded to global X.
- Use front/side/rear screenshots captured from a fixed camera rig for every substantial hover and flight pose. Captures are **verification artifacts**, not automatically interpreted as proof of correct anatomy.
- Verify **zero corrections accumulate** over 100 repeated hover/land/fly transitions and when toggling the character model.

**Interaction and performance:**
- Hover stationary, each cardinal direction, diagonal inputs, vertical ascent/descent, accelerated forward/reverse, turn alignment, exit while midair, soft landing, resume accepted walk/run/jump.
- Compare Rapier capsule position/yaw and collision contacts to established physics baseline with and without native flight enabled.
- Full CHAR-109/110/120/127, existing UAL flight, vehicle, camera, offline/PWA and loading tests.
- No unnecessary additional GLBs or big client download. Preserve established mobile rendering/load budget, including the 60-second loading target.

**Test order:** (1) offline rig metrics + fixed diagnostic imagery; (2) actual hierarchy/anatomy tests and transitions; (3) complete compile/test/build; (4) one substantive desktop/mobile preview; (5) owner visual decision. Tests never substitute for owner acceptance.

## 6. Checkpoints, deployment discipline and exit conditions

- **A — Reference capture:** no gameplay implementation, measured and rendered baseline from actual `character.glb`. If baseline inconsistent, stop and diagnose it before editing movement.
- **B — Upright hover posture:** standing-derived natural arms and non-crossing feet in an offscreen Babylon scene. The first preview, if needed, is only when this substantially improves on CHAR-128 and automated criteria pass.
- **C — Directional flight:** same anatomy during actual Rapier translation and state transitions; no regressions to controls.
- **D — Fast/prone flight:** independent silhouette, smooth transition and fast reverse alignment; visual acceptance required.
- **E — Merge gate:** only if all required postures are accepted, zero prohibited diff paths, regression suite green, and explicit owner merge authorization. Production deploy is separate.

**Hard-stop failures:** cannot reproduce accepted standing in the original model; real skeleton demonstrates crossing limbs despite passing synthetic tests; renderer/collision synchronization regresses; repeated patches repeat N-01 through N-15; or owner declines the visual trial. Document under DDD rather than repeatedly consuming previews.

## 7. Repo boundaries

**Permitted after explicit implementation approval:** a **new** native-pose flight module, exact-target geometry tests/fixtures, tightly scoped human flight display wiring, a fresh CHAR-129 report and minimal build wiring needed for accepted diagnostics.

**Prohibited:** copying CHAR-128 implementation files, introducing CHAR-128 build hooks or assets, editing vehicle cabin configuration, changing accepted CHAR-109/110/120/127 pose math, replacing Rapier physics, altering world generation, changing legacy UAL flight, or modifying production.

**Historical documents (read only):**
- [Procedure DDD failure analysis](../DDD/GTD-CHAR-128-Voight-Flying-Decommission-2026-10-24.md)
- [Archived CHAR-128 research](GTD-CHAR-128-Voight-Flying-UAL-Research-and-Technical-Plan-2026-10-24.md)

## 8. Approval boundary

Owner subsequently approved: **"Plan approved. Implementation flight with appropriate posture."** CHAR-129 implementation was authorized on the new native branch only. Preview is a distinct visual validation gate; merge and production deployment are still excluded.

**Guiding constraint:** Do not try to make Voight's anatomy resemble UAL's rig. Make Voight's existing anatomy fly.

## 9. Implementation and verification record — 2026-10-24

**Source branch:** `feat/voight-flight-v2-native-rig-20261024`. Implementation commit `17d8209142affe52d087fae78cf146b3a805d22c`.

### Native anatomy

The actual original `character.glb` passed a build-time joint-chain audit using its embedded GLB transform hierarchy (not fabricated UAL animation). Source bytes: **12,197,104**, SHA-256 `d03aa5aae26d3d61105017efffc324628da1770d5e57df4c94eff869ff94cf81`; 73 skin joints. Source-rest shoulder span **0.15364 native units**, heel/ankle span **0.26138 native units**. Signed foot lanes relative to the source shoulder axis: left **-0.130691**, right **+0.130691**; toe lanes **-0.173348** and **+0.173348**. Note these are *source bind/rest units*, not the final 1.78 m scaled character and not the CHAR-109 arm-corrected pose. A runtime baseline measurement is taken after accepted CHAR-109/110 controllers restore neutral, and is checked against subsequent hover frames.

### Native flight implementation

- `scripts/char129-audit-native-rig.mjs`: mandatory build audit, verifies exact original GLB, critical named joints, parent topology, bilateral source-rest signed spatial lanes.
- `src/game/character/native-flight-129.ts`: new native-only controller using the captured accepted CHAR-109/110 joint rotations. Zero foreign UAL flight joint deltas and zero frame-accumulation; stationary/directional hover retains the entire accepted resting skeleton, including its pelvis and all spine parents. Anatomical world-space wrist/ankle lanes are checked with actual linked transforms after the game imports the original character.
- `src/game/world/mercer-static-character-103.ts`: reuses the exact original character.glb instance. A visual-only waist pivot plus equal and opposite offset (0.95 m each) preserves the exact unpitched standing model hierarchy; accelerated flight pitches the **visual rig only** progressively to approximately **67° forward**. All 22 mapped limb local rotations remain unchanged; arm/palm and left/right foot spacing move rigidly. Walking and jumping controllers reset before native-flight capture and regain ownership when flight is turned off.
- `src/game/core/gtd-runtime.ts`: human flight toggle and existing Rapier motion path now update the visible native actor. Existing UAL flight remains available when Character is disabled. Speeds, gravity/collisions, 145 m ceiling, camera and mobile controls unchanged. No car interior, world-generation or CHAR-128 source files imported.
- `src/test/char129-native-flight.test.ts`: **5/5 tests passed**, including native intent selection, turning while hovering, nonidentity arm and leg baseline, rigid accelerated pitch with no collider pitch, return-to-native pose after fast motion, a deliberately crossed-leg rejection, and real owner GLB source contract.

### Build result / visual checkpoint

Vercel **preview READY**: https://gtd-62ykqf6cd-interlinkglobaltech.vercel.app/game  
Deployment `dpl_9w1pFDHatX5N7hvtEL8kmryBfoKS`. The full build completed successfully, including the existing GTD regression suite, the native GLB audit, Babylon/Vite output, and PWA/offline packaging (**0 mandatory assets missing**). The preview points to the explicit implementation commit above.

**Visual acceptance pending.** A successful numeric/parented test is NOT evidence that the newly posed skinned mesh looks correct from front/side/rear angles. The next checkpoint is owner inspection on desktop/mobile of zero-input hovering, left/right leg separation, natural relaxed hands and arms, accelerated pitch, fast-to-hover return, landing, and walk/run/jump recovery. Any acceptance is to be explicitly recorded; no automatic merge.

**Branch isolation verification required before merging:** diff contains only this native flight controller, its audit and tests, minimal actor/runtime/build wiring and CHAR-129 documentation. Vehicle seating and accepted gait/jump code must remain unchanged.

## 10. CHAR-129-FI-001 — FlyIdle balance and gravitational cues (owner accepted V2 baseline, 2026-10-24)

**Acceptance / rollback anchor.** Owner visually approved the initial native-flight V2 preview as a **perfect starting baseline** (https://gtd-62ykqf6cd-interlinkglobaltech.vercel.app/game ; implementation SHA `17d8209142affe52d087fae78cf146b3a805d22c`). Treat that commit and deployment as the immutable return point. No merge to main until subsequent flyIdle acceptance.

**Owner reference:** uploaded mobile screenshot depicting a superhero afloat above a road. It demonstrates three subtle departures from standing: slightly open but relaxed arms, one flexed leg in its own anatomical lane, and a nearly imperceptible ~2-second rise/fall and fore/aft float. The requested appearance is **not** a broad T-pose, twisted wrists, a crossed-leg pose, or rigid invisible-pavement standing. The existing source `ual.glb` has a 2s flyIdle clip, but its foreign joint rotations remain rejected; duration and intent only may be studied.

**Scope:** adjust **flyIdle only** on original `character.glb`; directional hover retains V2 original anatomy, accelerated forward flight retains visual-body pitch and Rapier/controller remains unchanged. Build-time GLB, renderer load budget, acceptably seated/grounded/running/jumping assets unchanged.

**Target-pose construction in actual linked skeleton coordinates:**
1. On enter, snapshot the accepted CHAR-109/110 neutral pose and global left/right shoulders, elbows, wrists, pelvis, knees, ankles. Calibration is **transactional**: joint rotations are rolled back after sampling targets, and invalid/worsening/overlarge transforms fail closed to accepted standing.
2. Slight outward **upper-arm abduction**: aim each actual shoulder→elbow vector outward from the measured midline by approximately 5.5% of the measured bilateral shoulder span, maximum 0.15 rad. Forearms, hands, clavicles and spine have **no independent twists**; palms continue to follow the accepted arm posture naturally.
3. One (right) leg relaxed: gently advance the knee (~5.5% of thigh length) through the native upper-leg joint, then raise/retract that side's ankle (~8% of thigh length up, ~2.5% back) by flexing only its native lower-leg joint, each with a capped local rotation. Left leg remains exactly straight/accepted. No source UAL retarget or arbitrary world Euler on linked joints.
4. Verify that ankle and wrist lanes remain left/right ordered; feet remain separated at least 80% of the accepted baseline. Reject candidate if spatial checks fail; restore baseline and report reason.
5. Hover accent ramps in/out over ~0.24s via target-local Quaternion.Slerp. All base local rotations are reset before each write, preventing accumulated arm/leg drift. On leaving flight, restore exact baseline and zero all visual offsets.

**2-second continuous float:** add to the existing visual-only torso pivot, never the physics capsule or camera, a smooth 2.00s sinusoidal cycle: vertical amplitude **<= 0.012 m** and fore/aft amplitude **<= 0.007 m**, phased to create an understated non-mechanical float. Fade in with flyIdle weight and fade out when directional/fast flight starts. Subtlety is deliberate: no high bobbing or jerky movement.

**Gates:** 
- Parent-space aim on the actual linked target, not imported source pose.
- Runtime fail-closed candidate; test geometric lane clearance at every substantive phase and verify no accumulated pose drift over hundreds of frames/repeated toggles.
- Tests for upright idle hand widening, bent right knee/raised foot without crossing, left leg invariance, 2s periodicity, zero visual offsets outside flyIdle, and full accepted-pose restoration on landing.
- Full build (including native GLB audit, CHAR-109/110/127 regressions and offline pack); **one preview** for human front/side/rear acceptance. No main merge or production.

### CHAR-129-FI-001 implementation / build evidence

**Implementation commit:** `2fcd5fa4de4ff1a8db92c0f0a91e5fffa3fe4bfd` (includes prior implementation/testing commits); only original `src/game/character/native-flight-129.ts`, focused tests, and this document differ from the already-accepted V2 branch state.

**Native pose:** `captureIdleTargets()` begins with accepted CHAR-109/110 rest, samples actual linked `LeftArm`/`RightArm` and `RightUpLeg`/`RightLeg` joints via `applyAimStep`, rejects any failures, cross-lane geometry or unacceptable foot/wrist separation, then restores every source joint immediately after capturing proposed pose quaternions. During `flyIdle`, Slerp writes only those four target joints; forearms, hands, spine, left leg and Rapier root retain their accepted bases. Enter/exit and loop updates remain nonaccumulating. Other directional and accelerated flight states restore to V2 neutral as the new idle weight fades.

**2-second bob:** continuous `sin(2π t/2)` with vertical amplitude 0.012m, 90-degree-shifted fore/aft amplitude 0.007m, blended by the flyIdle envelope and applied to the existing visual flight pivot alone. No camera/Rapier displacement.

**Verifications:** 8/8 CHAR-129 native flight tests plus **3/3 tests involving the actual unmodified 73-joint `character.glb` hierarchy** at yaw 0, 0.8 and -1.2 radians passed. Old native pose, jumping and UAL flight regression suites also passed. Mandatory build-time original GLB audit passed and Vercel full build completed successfully. Offline packages complete; **missing mandatory assets = 0**.

**Review preview:** https://gtd-ke509tl32-interlinkglobaltech.vercel.app/game, deployment `dpl_HhenYRt3MwkPPRHnrr9MDWSF2hsf`, state READY, pinned implementation SHA above.

**Baseline:** https://gtd-62ykqf6cd-interlinkglobaltech.vercel.app/game, commit `17d8209142affe52d087fae78cf146b3a805d22c`. This previously owner-accepted visual posture remains the rollback point; V2 experiment not merged to main.

**Next gate:** human acceptance of posture from front, side and rear, of the right foot/knee and subtlety of two-second motion. Tests cannot certify the perceptual result. No main merge or production deployment authorized.
