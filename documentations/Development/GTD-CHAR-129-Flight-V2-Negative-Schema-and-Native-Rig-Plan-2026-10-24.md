# GTD-CHAR-129 — Voight Flight V2: Negative Schema and Native-Rig Implementation Charter

**Date:** 2026-10-24  
**Repository:** interlinkglobal/GTD  
**Branch:** feat/voight-flight-v2-native-rig-20261024  
**Branch origin:** clean `main`, commit `06399a5aaef46b5061db41c6206c70d3e218882c`. NOT descended from rejected CHAR-128.  
**Status:** NEW EXPERIMENT — DOCUMENTATION/RESEARCH GATE. Implementation not yet authorized on this new scope.  
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

Creating this clean experimental branch and recording a negative design schema **does not** restore approval for CHAR-128 or authorize implementation. The next authorized development directive should explicitly enable **CHAR-129 Phase 0/1**. No previews, merges or deployments have been requested for this planning step.

**Guiding constraint:** Do not try to make Voight's anatomy resemble UAL's rig. Make Voight's existing anatomy fly.
