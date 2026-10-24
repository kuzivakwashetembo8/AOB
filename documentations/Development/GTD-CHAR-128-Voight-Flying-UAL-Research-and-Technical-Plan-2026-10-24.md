> **DECOMMISSIONED — HISTORICAL RESEARCH ONLY (2026-10-24).** CHAR-128 failed owner visual acceptance after the final allowed correction. This document is preserved to explain the original UAL flight research, attempted implementation and known failure modes. **No code from this experiment is approved or present on main.** Do not resume the decommissioned experimental branch; its ref has been neutralized and is pending permanent deletion. See [Procedure DDD failure report](../DDD/GTD-CHAR-128-Voight-Flying-Decommission-2026-10-24.md) for the authoritative outcome and merge prohibition.

# GTD-CHAR-128 — Voight Flying: UAL Flight Research and Technical Implementation Plan

**Date:** 2026-10-24  
**Repository:** interlinkglobal/GTD  
**Branch:** feat/voight-flying-20261024  
**Base:** main at 37f493fccbc7490eb1cbca99595f8ce20a1d55c0 (accepted CHAR-127 jumping merge)  
**Status:** Historical and decommissioned. Implementation was attempted and rejected; no merge or production deployment.  
**Owner decision:** Approved. Owner explicitly authorized enabling Voight flight and requested a preview.

## 1. Objective and decision

Give the original Voight model, 'public/GLBs/Characters/character.glb', the same flight modes and recognizable flight body postures currently available to the provisional Quaternius UAL actor. Do not change Voight's visual identity or geometry. Preserve all accepted walking, running, jumping, on-ground, camera, and driving baselines.

**Finding:** GTD already implements a functioning Rapier-based flight movement/camera/input subsystem. The missing capability is on the original 73-joint Voight actor: GTD explicitly rejects the 'fly' action when the human character is enabled, and in the flight update path only animates the legacy UAL actor. Therefore this is primarily a **state arbitration, authored animation retargeting, and same-actor lifecycle** feature, not a new physics engine or unrestricted noclip mode.

## 2. Evidence and confidence register

### 2.1 Verified against live source files on main

- 'src/game/core/gtd-runtime.ts': lines near 887-914 explicitly reject the flying toggle for the human character; lines near 1079-1100 prohibit switching **into** human mode while flying; lines near 1213-1267 implement Rapier flight displacement, camera following, heading policy, and invoke only 'this.characterTrial?.updateFlightAnimation'. They do not call 'humanAsset()?.updateControlled' within the flight path. Thus merely lifting the fly-action guard is insufficient: Voight would be hidden/stale in the air.
- 'src/game/character/locomotion/inspection-flight.ts': the existing inspection flight uses 7.5 m/s ordinary horizontal travel, 12 m/s accelerated horizontal travel, 5 m/s ascent/descent, and a 145 m survey ceiling. Its kinematic displacement is delivered to the existing Rapier controller. Flight entry is only allowed in walking context. These are accepted GTD **motion constraints**, not timing parameters inferred from UAL's clips.
- 'src/game/character/locomotion/flight-pose.ts': pure pose policy selects the accelerated horizontal 'fly' only for forward/backward when requested. Normal directional motion uses directional hover; horizontal takes precedence over vertical for simultaneous inputs. 'flightFacingPolicy' delays accelerated reverse prone posture until travel yaw aligns within pi/9 radians (~20 degrees).
- 'src/game/character/voight-humanoid-trial.ts': Babylon imports UAL animation groups and blends active/outgoing animations over ~0.18 s; identifies flyIdle, fly, and six flyHover directions with case-tolerant clip lookups. Missing directional clips fall back to upright flyIdle, not to prone fly.
- 'src/game/world/mercer-static-character-103.ts': the original Voight actor is a separate, owned, in-world instance of character.glb, driven through a calibrated model root and linked Babylon TransformNode joints. The actor already owns CHAR-109 neutral, CHAR-110 walk, CHAR-120 sprint, and CHAR-127 jump players. Flight will target this SAME actor rather than spawn a second human or reintroduce the UAL mesh.
- 'scripts/char110-bake-ual-walk.mjs' and 'scripts/char127-bake-ual-jump.mjs': established build-time, 22-joint anatomical UAL-to-Voight retargeting using source 'Idle_Loop' frame 0 calibration, source/target parent-rest-space quaternion alignment, and compact JSON animation tracks. GLB runtime dependence on the external upstream model is unnecessary.

### 2.2 Verified against the pinned upstream controller

Source: interlinkglobal/three-player-controller, pinned Git commit 'ca82bbc76a3b9b0afa80c73b60167adf6123b9b6'.

- 'example/glTF.js' defines UAL clip mapping, including eight flight animation names:
  - 'flyIdle'
  - 'flyHoverForward'
  - 'flyHoverBack'
  - 'flyHoverLeft'
  - 'flyHoverRight'
  - 'flyHoverUp'
  - 'flyHoverDown'
  - 'fly'
- 'src/PlayerController.ts' registers these mapping keys onto the model's provided animation clips (with fallbacks). The controller uses a separate flight mode and a model animation mixer; this is behavior reference only, since GTD runs Babylon.js + Rapier rather than Three.js.
- 'src/systems/AnimationSystem.ts': on flying, **forward + Shift** selects 'flying' (the aerodynamic horizontal pose), ordinary forward selects 'flyHoverForward', backward chooses 'flyHoverBack', lateral chooses 'flyHoverLeft'/'flyHoverRight', Space chooses 'flyHoverUp', and otherwise 'flyidle'. Its demonstrated selection priority is forward > backward > left > right > ascending > stationary. Although the configuration exposes a descending clip, this particular upstream flight selection block does **not** explicitly choose 'flyHoverDown'. GTD already has a descending state and should preserve it after validating the clip.
- **Intentional GTD variation:** GTD additionally supports accelerated **reverse** flight after facing alignment; the referenced upstream selector always hovers while reversing. Maintain GTD's accepted reverse-heading safety policy, not a blind port of the upstream branch ordering.

### 2.3 Confirmed prior GLB facts versus outstanding binary audit

- Existing CHAR-110 and CHAR-127 build records establish the exact original Voight 'character.glb' (73 joints, no embedded animation clips) and the pinned UAL (65 skin joints). CHAR-127 confirmed its actual source 'Jump_Loop' is 2.5 s and retargeted it successfully.
- This research inspected the controller mappings and GTD GLB-processing scripts but **did not directly decode the pinned UAL binary's eight flight tracks**. Therefore the eight names above are **configured upstream capabilities**, not eight individually binary-verified animation data sets. The first authorized implementation step MUST audit the actual pinned GLB's clips and keyframe data; no synthetic "authored source" claims are permitted.
- Especially unresolved: whether 'fly' (prone posture) is realized by the pelvis/spine joints, a model/root TransformNode rotation, or a mixture, and whether the directional clips animate root translation. Losing a source root pitch may produce a standing Voight moving horizontally at high speed.
- Also unresolved: actual per-clip duration, interpolation, keyframe counts, animation seams, root-vs-limb pose, and animation channels missing from the existing 22-joint retarget map.

## 3. Target flight states and expected posture

| State | UAL source clip key | Desired Voight pose | Trigger |
| --- | --- | --- | --- |
| Hover idle | flyIdle | Upright floating and stable, minimal limb movement | No flight movement |
| Forward hover | flyHoverForward | Modest controlled forward lean | Normal forward |
| Reverse hover | flyHoverBack | Controlled backward lean without forced 180° turn | Normal backward |
| Left hover | flyHoverLeft | Lateral left balancing lean | Left |
| Right hover | flyHoverRight | Lateral right balancing lean | Right |
| Hover ascent | flyHoverUp | Upright upward-reaching / lift-appropriate posture as **actually authored** | Ascending without higher-priority planar input |
| Hover descent | flyHoverDown | Upright controlled descent as **actually authored** | Descending without higher-priority planar input |
| Accelerated flight | fly | Deliberate near-horizontal, aerodynamic head/torso/leg alignment; never ordinary hovering | Shift + forward, or Shift + reverse after yaw alignment |

The pose table describes **desired visuals**, not claims that each UAL clip was visually or binary inspected. If an audited source pose is unsuitable, preserve the correct hover fallback and document the divergence instead of guessing skeleton angles.

State priority for the initial implementation follows the current GTD 'selectFlightPose': forward/back > left/right > ascent/descent > hover idle. Simultaneous forward + ascend moves diagonally in **physics**, while selecting the forward animation. Accelerated lateral/vertical travel need not imply horizontal prone pose. Hover remains visually active if Shift alone is pressed.

## 4. Approved architecture to preserve

- Retain one Rapier kinematic player and one Babylon ArcRotateCamera; do not swap physics engines or bypass collision.
- Retain 'G' for fly toggle and 'F' for vehicle interaction. Desktop arrows/WASD, mobile joystick, Space/Jump to ascend, Ctrl/Descend to lower, and Shift/Sprint for accelerated travel remain bound to existing GameActions.
- Retain flight speed and height limits from 'inspection-flight.ts'; do not change accepted flight speed or reverse facing while implementing anatomy.
- Apply animation only on Voight's existing linked GLB skeleton, leaving physics root, camera and ground collision unchanged.
- Retain existing 1.78 m normalization and target rest shoulder/palm orientation of CHAR-109. No T-pose, mirrored elbow, changed character mesh or duplicated source avatar.
- Preserve current offline/PWA strategy: source UAL may be staged at build time, but runtime consumes only compact, same-origin baked JSON tracks; do not load a second 3.7 MB UAL mesh for the original human. No unchecked vendor CDN dependency at game boot.

## 5. Ordered technical implementation plan — **not authorized yet**

### Phase A — Source truth and anatomy audit (first implementation gate)

Add 'scripts/char128-audit-ual-flight.mjs' (or extend the existing audited GLB parser) to read both actual local GLBs after 'stage-offline001-runtime.mjs'.

1. Verify the pinned UAL Git blob SHA, glTF magic/chunk lengths, actual animation names and required eight track names. Capture per-clip duration, key samples, sampler interpolation, channel targets and affected joints. Report missing clips explicitly. Do not infer source availability from demo config alone.
2. Characterize joint-space motion: source root, pelvis, spine, neck/head, shoulders, arms/hands, thighs, knees, feet/toes. Measure per-clip peak angular excursion and whether motion is cyclic/looping, static, or single transition. Check source animation root rotations, translations and scaling on all tracks, not just mapped joints.
3. Compute facing/forward/up frames from actual skeleton. In particular validate whether the 'fly' prone orientation is in the skeleton or the source root/model; audit parent-transform inheritance. Construct a side/front/rear diagnostic pose sheet or in-engine witness as part of the authorized implementation, not before.
4. Fail closed for missing critical joints, unsupported interpolation, non-finite/non-unit quaternions, sample discontinuities or incompatible parent parity. Report clip-specific exclusion rather than misclassifying it as imported successfully.
5. Record the pinned source's actual asset license provenance for redistribution and the generated derivative JSON. Quaternius publishes Universal Animation Library under CC0; confirm that these exact pinned bytes correspond to that released pack before shipping.

**A acceptance:** an actual binary-derived clip and pose-motion report showing eight tracks or an explicit missing-clip matrix, and a proven treatment for the 'fly' orientation/root-motion issue. No visual flight implementation until this gate passes.

### Phase B — Offline flight retargeting

Proposed paths: 'scripts/char128-bake-ual-flight.mjs', generated 'public/GLBs/Characters/char128-ual-flight.json'.

1. Reuse established CHAR-110/127 source 'Idle_Loop' frame-0 relative deltas and source-rest/target-parent local quaternion transforms on the same 22 anatomical joint roles. Maintain the accepted Voight neutral orientation and arm posture when exiting.
2. Bake each validated source flight clip at a fixed sampling rate with interpolation-preserving quaternions, normalized and time-scaled per clip. Keep source clip names, durations, sample counts, exact joint map, numeric hashes and per-joint max angular deltas in a versioned contract.
3. **Root-motion policy:** discard translational root motion from the visual clip, because Rapier supplies all displacement. Treat source root orientation separately: if essential to prone flight, reproduce only the audited rotation on a **visual-only child pivot** or a mathematically equivalent calibrated skeleton joint, never on Rapier's collider root or the camera. Do not invent fixed 90° Euler changes to compensate.
4. For pose loops, verify first/end consistency or define an explicit hold/seam policy based on actual source data. Reject incomplete tracks; preserve a safe hover fallback for individually unavailable directional clips. Define required base idle and accelerated presence separately from optional directional enhancements.
5. Keep one compact JSON bundle or another measured, cache-friendly scheme (not eight model GLBs). Measure generated asset bytes, additional decode/load time, and offline manifest integrity against GTD's ≤60s loading target.

**B acceptance:** validation of actual source-to-target joint samples, pose continuity, correctly oriented prone motion and minimal asset overhead, without any active in-game user-facing flight yet.

### Phase C — Voight flight animation controller

Proposed path: 'src/game/character/retargeted-flight-128.ts'; use the existing pure selector 'src/game/character/locomotion/flight-pose.ts'.

1. Create 'createFlightPlayer128' with an explicit input contract: enabled/transition, directional intent, horizontal speed, actual corrected vertical movement, accelerated flag, facing alignment and dt; expose a diagnostic report of active clip, weight, duration/phase, joints, missing clips and frame count.
2. Sample flight pose against the accepted calibrated rest and crossfade when transitioning between upright hover, directional hover and horizontal accelerated flight. Start from 0.18s established UAL blend as a **tunable baseline**, not a guaranteed final number.
3. Ensure flight overrides gait/jump writes while flight is active. Define a single ordered animation ownership policy: **vehicle > flight > actual jump/fall/landing > run/walk > idle**. No two controllers independently stamping the same joint after a reset.
4. On returning to walking, restore exact walking/sprint/idle joint basis without accumulative quaternion deltas; suppress stationary landing bounces on simple G toggles. On disabling flight in the air, allow gravity and the existing airborne state to resume until real Rapier ground contact.
5. On turn, preserve GTD heading and 20° accelerated reverse alignment policy; target quaternion playback must not rotate Voight backwards while physics is moving forward.
6. Reset/blend state when disabling Character, exiting the game, scene disposal or switching to vehicle context. No stale held input, hovering skeleton on the ground or shader/resource leak.

### Phase D — Existing runtime integration (minimum changes)

Affected files only after authorization:
- 'src/game/core/gtd-runtime.ts': remove the **human-character-only fly rejection** at the action handler while preserving walking-context restrictions; in the established 'flightEnabled' Rapier branch, update **the already-controlled original human asset** every tick with the physics position, corrected orientation and flight visual signal. The older UAL humanoid flight path remains available when Character is disabled. Retain the existing guard against turning Character mode on while already flying until explicitly tested.
- 'src/game/world/mercer-static-character-103.ts': load validated compact flight tracks and create the flight player on the current owned instance; expose 'updateControlledFlight' or one mode-aware 'updateControlled' to keep anchor position and visuals synchronized with Rapier (including the existing capsule center offset). Keep walking, sprint and jump controls intact.
- 'src/game/character/locomotion/flight-pose.ts': reuse rather than replace. If actual source/root-clip audit proves clip semantics differ, adjust only with tests, explicit documentation and owner visual verification.
- 'package.json': add build-stage flight auditing/baking to the existing pinned offline staging sequence, only after phase A/B pass.
- No edits to driver-cabin pose, vehicle interiors, car GLBs, vehicle physics, world generation or production branch.

### Phase E — Validation, preview and acceptance

Automated:
- Clip asset audit from the **actual GLB**, required names, channels, source hierarchy, local rest and root orientation.
- Quaternion and frame basis validity, handedness, left/right joints, source-to-target rotation, no T-pose or head inversion; no translation applied twice.
- Eight state selections, planar-over-vertical priority, Shift-only idle, normal backwards upright, Shift+S orientation gate, accelerated prone only when valid.
- Toggle on/off, hover with zero input, Space ascent, Ctrl descent, altitude cap, Rapier collision, reverse facing, midair disable/re-entry, exact neutral/gait restoration.
- Integration tests for asset mode: UAL remains legacy; original Voight visible in flight; jump unaffected after landing; no changes to driving contexts or F binding.
- Full typecheck, Vitest suite, build, PWA/offline packaging, source SHA and same-origin fetch, and mobile loading/performance checks.

Visual checkpoints (substantial changes only, one at a time):
1. **Hover checkpoint**: Character enabled, G toggles flight, Voight upright above Mercer Street, stable when stationary; Space ascent and Ctrl descent; desktop and mobile preview.
2. **Directional checkpoint**: forward, backward, left/right/up/down posture follows actual UAL source; no torso clipping, unnatural shoulder/elbow reversal or camera misalignment.
3. **Accelerated checkpoint**: Shift+forward flies horizontally; Shift+back transitions only after facing alignment; Shift release returns to upright; no yaw snap or model root/physics separation.
4. **Recovery checkpoint**: G toggle in midair and near-ground, gravity, landing and return to accepted walk/sprint/jump; repeated cycles; optional Character toggle and vehicle interaction do not break.

Do not deploy for a plus/minus one-frame or minimal limb adjustment. Show meaningful visual improvements on dedicated **preview URLs**, request owner's acceptance before merging to main. Production deploy is a separate explicit authorization.

## 6. Failure modes, constraints and contingency

| Risk | Mechanism | Countermeasure |
| --- | --- | --- |
| Prone UAL clip retarget looks upright | Pose tilt stored on source root rather than mapped skeleton | Audit animated root; apply *visual-only* calibrated orientation, not collider pitch |
| Feet/arms point wrong way | Source and target rest axes/parity differ | Source-parent-to-target-parent quaternion retarget, sample witnesses, bilateral checks |
| Hover anim plays walk/jump simultaneously | Independent pose writers within one fixed tick | Single ownership priority and exclusive flight update path |
| Original Voight disappears while flying | Human visual actor currently omitted in flight branch | Update existing human actor anchor and pose on Rapier flight ticks |
| High-speed reverse snaps 180° | Premature use of horizontal clip | Preserve existing yaw alignment gate and travel-heading limiter |
| Flight release leaves crouch/T-pose | Poor blend/reset basis | Capture CHAR-109 neutral; exact reset and air-to-ground transition tests |
| Empty/missing source clip | Demo config names unverified in actual GLB | Binary capability gate; named safe hover fallback; report missing source |
| Flight bypasses roofs or changes speed | Visual animation accidentally controls player root | Retain collision through Rapier and unchanged displacement constants |
| Mobile lag, >60s loading | Additional GLB or repeated runtime decoding | Compact offline retarget data; bounded sample count, load profiling |
| Seating changes leak across branch | Shared character root and transform ownership | No seat-file edits; isolate branch and mode lifecycle tests |

## 7. Explicit scope limits

Not included: NPC flying AI, combat-in-flight, city flight missions, new jetpack model, wings/equipment, flying vehicles, reauthoring Voight's GLB, procedural joints that imitate unavailable authored clips, deployment to main, or a changeset to the independent vehicle cabin mapping work.

The eight clip configuration names and upstream movement behavior are verified by source inspection; their per-clip binary data and final Voight silhouettes remain **unverified until Phase A and visual checkpoints**. This is an implementation research plan, not a completed feature or preview.

## 8. References

- GTD 'main': https://github.com/interlinkglobal/GTD/tree/main
- Upstream UAL demo config pinned: https://github.com/interlinkglobal/three-player-controller/blob/ca82bbc76a3b9b0afa80c73b60167adf6123b9b6/example/glTF.js
- Upstream AnimationSystem pinned: https://github.com/interlinkglobal/three-player-controller/blob/ca82bbc76a3b9b0afa80c73b60167adf6123b9b6/src/systems/AnimationSystem.ts
- Upstream PlayerController pinned: https://github.com/interlinkglobal/three-player-controller/blob/ca82bbc76a3b9b0afa80c73b60167adf6123b9b6/src/PlayerController.ts
- Prior GTD-CHAR-002 flight posture and aerial survey reports: '/documentations/Experiments'
- Prior GTD-CHAR-113 flight transfer plan and GTD-CHAR-127 jumping implementation: '/documentations/Development'
- Quaternius official source/CC0 publication: https://quaternius.com/packs/universalanimationlibrary.html
- Quaternius pack release listing and versions: https://quaternius.itch.io/universal-animation-library

## 9. Approval gate

**Requested decision: Approve / revise this plan before any code changes.**

No implementation, preview deployment or production update is authorized by this document alone.

## 10. Implementation evidence — 2026-10-24

**Source audit:** Actual pinned UAL (3,749,364-byte GLB) contains eight of eight requested flight clips: flyIdle, flyHoverForward, flyHoverBack, flyHoverLeft, flyHoverRight, flyHoverUp, flyHoverDown and fly. UAL pelvis ancestors are Armature > root > pelvis. Directional hover poses are authored as single-key animations at time zero. flyIdle lasts two seconds. The original baker demanded at least two keys; the flight-specific baker now holds the actual static poses without synthesizing animation.

**Retarget result:** Eight source clips, 41 samples each, 22 anatomically mapped target joints, zero missing. Baked char128-ual-flight.json size is 291,235 bytes. All eight clips have zero animated root-orientation differential; the accelerated prone posture is articulated on the skinned skeleton, not caused by a model-root pitch. Fast fly arm maximum source-relative peak: 1.013 rad; leg peak: 0.819 rad. Hover leg peak: 1.511 rad. These are skeletal telemetry, not final visual acceptance.

**Runtime:** G flight toggle enabled when Character is active. Existing Rapier trajectory, collisions, camera, speed caps, vertical controls and altitude ceiling remain unchanged. The same original character.glb instance receives updates via updateControlledFlight, with exclusive flight animation ownership over its walk and jump layers. The UAL fallback actor remains separate. No seat, vehicle, city or production files changed.

**Regression:** The first full build after retarget passed TypeScript and 452/453 tests. The remaining test was a jsdom source-inspection test with invalid file URL, not an animation failure. That fixture was patched to use process.cwd(), and final full-build verification is required before preview acceptance.

**Gate:** Green preview build, visual inspection of idle/directional/prone/landing, explicit owner acceptance. No merge or production deployment without separate authorization.

## 11. CHAR-128H — Owner feedback: hovering posture refinement (2026-10-24)

**Evidence:** Owner mobile screenshots from the experimental Voight flight preview (https://gtd-d2vf0j49v-interlinkglobaltech.vercel.app/game) compared with legacy UAL hovering. Flight toggle, vertical motion, and free flight are accepted; **merge remains blocked** on original Voight's upper/lower limb posture.

**Defect A — Arms:** In hovering and directional hover the wrists/elbows sit excessively opened/twisted relative to the accepted CHAR-109 standing posture. The authored UAL joint deltas are mechanically valid but source rig shoulder/forearm ranges are not anatomically portable to Voight. The existing retarget applies all 22 UAL joints at full strength; CHAR-109 defines Voight's correct resting arm orientation.

**Defect B — Legs:** Hover leg animation brings shins/feet across the centerline. The issue is imported hover thigh adduction with the UAL knee pose. Neutral Voight geometry has already acceptable separate left/right lanes; preserve neutral hip and foot heading, and selectively retain a mild bend in just one knee.

**Owner acceptance target:** Floating arms remain at sides with the standing pose's small torso gap and neutral palms. Left/right feet remain in their own lanes. A slight knee bend in one leg is allowed, not mandatory. Hover and directional hover inherit these safeguards; high-speed horizontal *fly* must remain independently authored. Flight motion/collision/camera/UI, walking, sprinting, jumping, and vehicle seating remain unchanged.

**Root cause from code:** In 'src/game/character/retargeted-flight-128.ts', the animation loop uses 'sample(tr.keys, normalized).multiply(tr.joint.base)' for each joint, including shoulders, upper arms, forearms, hands, thighs, knees and feet. There is no calibrated hover-specific anatomical constraint. Existing 'walk?.update(0,input.dt,false)' supplies the CHAR-109-derived neutral baseline before every flight frame; the flight retarget overwrites it.

**Authorized correction:** Add a pure, auditable hover joint-weight function and blend flight deltas from the verified CHAR-109 neutral joint basis. For **flyIdle**:
- Shoulders, arms, forearms, hands: neutral, with zero authored twist.
- Left/RightUpLeg: neutral hip lanes, zero adduction.
- LeftLeg (knee): neutral; RightLeg (knee): retain at most 18% of the authored motion for the optional subtle airborne bend.
- Feet and toes: neutral relative headings, preventing the soles turning across the body.
- Spine/head: retain authored flight motion.
For **flyHoverForward/Back/Left/Right/Up/Down**, preserve the same no-twist shoulder/hand and hip/foot rules. Upper arms and forearms may retain no more than 5% of UAL authored local delta for faint responsive balancing; the right knee no more than 22%. For accelerated horizontal **fly**, preserve 100% of the original animation on all joints (this specific feedback concerns floating/hover).

**Implementation constraints:** Use Quaternion.Slerp from the cached accepted neutral joint pose to the validated source-derived flight pose; not Euler axis guessing, not arbitrary world-space translation, and not a change to GLB/bind transforms. Apply after playback sampling but before the existing 0.18 s mode crossfade. Keep the correction testable as a pure function and avoid additional per-frame scene-wide matrix recomputation. No added runtime asset.

**Automated gates:**
1. Assert zero imported shoulder/upper-arm/forearm/hand twist and thigh/foot/toe perturbation in flyIdle, while preserving source head/spine and a small asymmetric knee.
2. Assert the six directional hover clips share lane/arm caps and do not leak constraints into fast fly.
3. Assert hover-to-fast and fast-to-hover blend remains finite and bounded, neutral arm pose is reproducible on repeated flights, and no missed mandatory joints.
4. Full TypeScript/automated regression and successful preview build. The render posture remains subject to human mobile visual acceptance; a passing test is not equivalent to visual proof.

**Branch and gates:** Keep on 'feat/voight-flying-20261024', update this document before code, deploy **one substantial preview** after tests, with no merge to main or production deploy until owner acceptance.

## 12. CHAR-128H-R3 — Final corrective attempt, owner feedback (2026-10-24)

**Directive:** Owner supplied three additional mobile screenshots from preview gtd-46hgdp0ka showing crossed/twisted legs and abnormal wrist/arm direction after the second corrective preview. ONE final patch is authorized; if visual inspection fails, record DDD failure, close/delete the branch, and do not merge. No new features or production deployment.

**Root cause, corrected:** R2 applied zero authored rotation only on *child* shoulder/arm/forearm/hand, upper leg, shoe and toes but retained UAL deltas on their **parent** nodes 'Hips' and 'Spine'/'Spine1'/'Spine2'. The import's parent transforms thus continued to rotate arms and legs in world space even though the individual child local quaternions matched CHAR-109. R2's test rig contained *unparented* joints and checked individual local rotations against Identity, so it could not detect a pelvis/spine-induced crossing of the fully linked character. There was also a residual right knee import that may visually cross despite neutral thighs.

**R3 fail-safe intervention:** For all seven upright flight states ('flyIdle' and all six 'flyHover*' clips) zero UAL skeletal animation deltas on **all 22 mapped joint transforms**, not only extremities. This exactly reproduces the accepted native standing skeleton established by CHAR-109 and preserved by CHAR-110 while the existing Rapier capsule translates in three dimensions. Refrain from preserving source torso/hip motion and remove even the optional knee bend: user said one bent leg *can* be used, not that it must. Prioritize uncrossed legs and untwisted hands over ornamental hover animation. Accelerated horizontal 'fly' retains all 22 source-authored deltas and root handling unchanged; crossfade 0.18 seconds remains.

**R3 test contract:**
- Assert that every mapped UAL hover clip returns **zero** skeletal delta in CHAR-128's pure retention policy, including Hips/Spine/Spine1/Spine2/Neck/Head, all arms and both lower limbs.
- In a parented rig with independent shoulder and hip spacing, deliberately supply large **pelvis and spine** rotation tracks plus crossed thigh/wrist tracks; after settled hover, compare joint global positions and orientations to the accepted preflight pose (not to identity quaternions). Check bilateral wrist and ankle separation and that neither child crosses the central body axis.
- Exercise hover → fast fly → hover, checking the normal pose is restored after the existing crossfade and fast fly is not neutered.
- Preserve unrelated walking, jumping, driving and offline regressions.
- After one full green build provide one new preview URL for owner visual inspection. **No second visual corrective patch** if rejected; initiate Procedure DDD and delete this feature branch without a merge. If tests/build fail and cannot be resolved without further behavioral changes, decommission rather than serially patching.

**Confidence:** Standing posture parity is a stronger engineering guarantee than individually capped UAL joint rotations; owner confirmation is still required for rendered visuals and game feel. This explicitly trades UAL hover gesture fidelity for accepted natural posture while preserving flight mechanics and accelerated motion.

## 13. Final disposition (Procedure DDD, 2026-10-24)

Owner rejected the last visual trial and ordered DDD. All 17 branch-only commits are rejected; the successful numerical tests do not establish visual acceptance. Flight animation code, build hooks, and branch tests must not be merged into `main`. The accepted pre-existing UAL flight control system remains unchanged. See the DDD report linked above.
