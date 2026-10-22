# GTD-CHAR-120 — Natural Athletic Sprinting: Technical Implementation Schema

**Date:** 2026-10-22 (Africa/Johannesburg)  
**System:** G.T.D. / Meridian City / playable Voight (`character.glb`)  
**State:** **PLAN ACCEPTED — DOCUMENTATION-ONLY COMMIT; IMPLEMENTATION NOT YET STARTED**  
**Owner decision:** Harmony approved the authored/retargeted, athletic-human sprinting approach on 2026-10-22.  
**Authority:** This document is the execution schema and acceptance contract for the next isolated sprinting implementation.  
**Scope:** Activate real running for the imported playable Voight when Shift or the existing touch Run/Sprint button is held. Running means **increased actual ground travel speed AND a visibly natural athletic human running posture**, not just a faster character translation or sped-up walking cycle.

## 0. Authority, history, and scope boundary

- This is a **new single-capability sprinting gate** following the accepted 2026-10-21 CHAR-117, CHAR-118, and CHAR-119 walking milestones. It specializes the **running portion** of the historical `GTD-CHAR-112-running-and-jump-transitions-2026-10-21.md`. Jump transitions remain a separate, later scope; old CHAR-112 "not authorized in that pass" is historical, not a veto on the newly approved planning strategy.
- On 2026-10-22 Harmony approved the **strategy and its documentation**. This commit does not authorize a speculative implementation, preview deployment, merge, production release, driving/flight activation, or city changes. The implementation is to be executed in a **new dedicated branch** when explicitly directed.
- **Main is the accepted baseline.** The authorized documentation commit may land on `main`; production runtime files must remain byte-for-byte unchanged by this documentation task.
- The 20-villa Birch Avenue reconstruction is a later, independent world-development directive. Do not couple city generation to this character gate.
- No edits to `public/GLBs/Characters/character.glb`; no new runtime dependency on Three.js; Babylon.js and Rapier remain authoritative.

## 1. Acceptance contract (normative)

### Required behavior

1. With the imported playable Voight active, **movement + Shift (desktop)** or **movement + held Run/Sprint touch button** must enter an authored-looking **sprint**: Voight accelerates physically, takes alternating running strides, drives his elbows and arms appropriately, carries a natural athletic forward torso inclination, lifts his feet, and faces the direction of travel.
2. Release Shift/Run while maintaining directional input: transition **Sprint -> Walk**, reduce actual Rapier displacement to the accepted walking policy, blend to the accepted CHAR-119 gait; do **not** snap to the default T-pose, freeze limbs, or continue the sprint cycle at walking speed.
3. Release movement: **Sprint -> Idle** via a coherent deceleration/animation transition; restore accepted CHAR-109/117 standing arms, elbows, palm orientation, head behavior, and CHAR-119 subtle idle life/blinking without accumulated offsets.
4. Switch to vehicle or flight only during those later capability gates. Sprinting must **not** bypass the current imported-character restrictions; pressing a sprint button must not alter vehicle behavior, flight behavior, existing nonhuman actor speed, or world geometry.
5. Sprint intent **alone is not sufficient**: if blocked by a wall/obstacle, legs must not keep running in place indefinitely while Rapier reports zero real translation. Brief speed or support loss caused by a curb or transient collision must not flicker the gait.
6. Inputs must be equivalent on supported keyboard and mobile/touch controls; an interrupted/released touch hold must stop sprint intent reliably.

### Out of scope for this first gate

- Jump takeoff/air loop/landing transitions, combat movement, stamina, sprint sound, new camera mode, ragdoll, networking, driving, flight, traffic, Birch Avenue, new buildings.
- A production-grade Foot IK solver is **not** a prerequisite for initial flat-ground sprint acceptance. Terrain-adaptive IK is an independently measured follow-up refinement, never a substitute for the authored step.
- No procedural sine-wave gait, raw vertex deformations, arbitrary direct `Bone.rotate()` in a linked glTF skin, or artificially cycling the existing walking clip faster in lieu of a true sprint clip. All were either rejected predecessors or inadequate substitutes.

## 2. Verified source-of-truth facts, 2026-10-22

| Subsystem | Current evidence / location | Impact |
| --- | --- | --- |
| Playable human asset | `public/GLBs/Characters/character.glb`; 73 linked skin joints; **zero source animation clips** (CHAR-108/110 audit) | Must supply a **retargeted** running clip; cannot enable a native `Sprint_Loop` on this GLB directly. |
| Authored reference | `interlinkglobal/three-player-controller`, `example/glTF.js` / `example/footIK.js`; pinned UAL `ual.glb` | UAL config names `Walk_Loop`, `Sprint_Loop`, `Idle_Loop`; use the actual staged/pinned binary and independently verify sprint channels before transfer. Josh `run` is reference, not presumed available in Voight. |
| Accepted walk | `src/game/character/retargeted-walk-110.ts`, `src/game/world/mercer-static-character-103.ts`; `char110-ual-walk.json` | 22 mapped anatomical tracks; accepted CHAR-119 1.65 m/s physical walk, 0.20s player weight fade, neutral-base restoration. **Do not overwrite this clip or its accepted refinements.** |
| Offline transfer | `scripts/char110-bake-ual-walk.mjs`, `scripts/char110e-native-bake.mjs`, `scripts/char110e-activate-native.mjs` | Existing per-joint source-to-target retarget and CHAR-110E corrected lower-body strategy are the reference. Do **not** restart the rejected global-frame/raw sine-walk experiment. |
| Human movement lock | `src/game/core/gtd-runtime.ts` | `HUMAN_WALK_SPEED_119=1.65` currently overrides sprint speed whenever imported Voight is controlled, even if `actions.has("sprint")`. General nonhuman sprint policy is 6.4 m/s; it is separate. |
| Existing inputs | `src/game/core/types.ts`, `src/ui/hud/desktop-controls.tsx`, `src/ui/hud/touch-controls.tsx` | `"sprint"` action already exists; desktop Shift and touch Sprint controls are exposed. Verify release and touch cancel; do not add competing UI. |
| Existing gait continuity | `src/game/character/locomotion/gait-continuity.ts` | Has `idle/walk/sprint/jump` state with actual-speed, intent, ground grace, and anti-flicker logic; import mode currently bypasses its animation selection. Reuse principles without forcing the UAL visual actor into ownership of Voight's rig. |
| Actual Foot IK status | `src/game/character/foot-ik-inspector-110.ts` | **Diagnostic only**; `fullTwoBoneIK:false`. It plots actual foot/knee positions, Rapier support and optional predicted landing. Never call this a working IK solve. |
| Fork animation reference | `three-player-controller/src/systems/AnimationSystem.ts`; `src/systems/CharacterMovement.ts` | Shift selects `running` rather than `walking`; movement uses run speed, 0.18s action fade. Transfer behavior, not Three.js machinery or demo speed units. |
| Fork IK reference | `three-player-controller/src/plugins/foot-ik/FootIK.ts`, `internal/footPhase.ts` | Foot phases from sample height/horizontal motion; pre-animation restore and post-animation correction; pelvis + two-bone IK; disable on flight, vehicle or airborne. Example uses 96 foot-phase samples and optional predictive placement. |

Research links: [fork glTF example](https://github.com/interlinkglobal/three-player-controller/blob/master/example/glTF.js), [fork Foot IK example](https://github.com/interlinkglobal/three-player-controller/blob/master/example/footIK.js), [fork animation system](https://github.com/interlinkglobal/three-player-controller/blob/master/src/systems/AnimationSystem.ts), [fork FootIK](https://github.com/interlinkglobal/three-player-controller/blob/master/src/plugins/foot-ik/FootIK.ts), [fork foot phases](https://github.com/interlinkglobal/three-player-controller/blob/master/src/plugins/foot-ik/internal/footPhase.ts).

**Historical accepted artifacts:** `GTD-CHAR-117-Upper-Body-Acceptance-and-NPC-Reuse-2026-10-21.md`, `GTD-CHAR-118-Slight-Forward-Walking-Torso-2026-10-21.md`, `GTD-CHAR-119-Experimental-Character-Refinements-2026-10-21.md`. **Failure register:** `../Issues/GTD-CHAR-110-111-Procedural-Walk-Failure-Register-and-Retarget-Pivot-2026-10-21.md`. **Foot IK research:** `../Research/Voight Foot IK.md`.

## 3. State and data schema

Logical states (visual authority only):

```text
IDLE --movement--> WALK --movement+sprintHeld--> SPRINT
IDLE --movement+sprintHeld--> SPRINT (accelerate through physical speed)
SPRINT --!sprintHeld && movement--> WALK
SPRINT --!movement--> IDLE (deceleration and safe fade)
WALK --!movement--> IDLE
movement blocked / real speed absent beyond grace --> IDLE
true airborne --> later JUMP gate; no grounded foot placement while airborne
```

Proposed TS contract (schematic, **not implemented**):

```ts
type HumanLocomotionState = "idle" | "walk" | "sprint";
type HumanLocomotionSample = {
  dtSeconds: number;                 // 60-Hz fixed-step input
  wantsMovement: boolean;            // keyboard / touch arbiter
  sprintHeld: boolean;               // Shift or held touch Sprint
  actualPlanarMps: number;            // collision-corrected Rapier displacement / dt
  grounded: boolean;
  hasBlockingContact: boolean;       // derived from verified motion/surface, if available
};
type HumanLocomotionCommand = {
  state: HumanLocomotionState;
  selectedClip: "idle" | "char110-ual-walk" | "char120-ual-sprint";
  targetTravelMps: number;            // physical speed, not merely playback rate
  blendWeight: number;                // normalized and bounded
  cycleRate: number;                  // calibrated against displacement / stride
};
```

**Ownership:** One fixed-timestep runtime selects a target locomotion state and physical speed. One Voight linked-TransformNode animation player owns the current pose. Rapier retains collision, grounding and corrected translation. React/touch UI sends commands, not animation/simulation ticks. Flight/driving later own their own states; no simultaneous animation controllers write the same limb nodes.

## 4. Build-time authored sprint retarget (first implementation phase)

1. Start a **new sprint-specific branch** from the latest accepted `main`; record the starting SHA. Preserve the current `character.glb` and all accepted walking/idle outputs. No auto-deploy.
2. Audit **actual pinned** UAL source `Sprint_Loop` on the staged file: runtime-independent GLB animation count, duration, channel coverage, joint map, interpolation, left/right step symmetry, contact and arm swing. Reject if missing, malformed or incompatible; never silently fabricate a substitute.
3. Use the established **22-joint anatomical map** (hips, three spines, neck/head, bilateral shoulders/upper arms/forearms/hands, bilateral thighs/knees/feet/toes). Export a **separate** offline asset, proposed `public/GLBs/Characters/char120-ual-sprint.json`; new versioned `gtd.char120.ual-sprint.v1` schema and validator. Use no UAL GLB or Three.js mixer download at runtime.
4. Retarget joint motion relative to verified source `Idle_Loop` and Voight's **accepted calibrated standing/arm pose**. Use validated per-joint reference frames and the successful CHAR-110E lower-body approach. Preserve anatomical frame signs, handedness, shin bending direction, target parent-child links and quaternion normalization. Include a separate measured decision on pelvis translation/bob: do not blindly copy source root motion into the Rapier actor.
5. Do **not** hardcode the sprint cycle to the walking duration (1.333333s), fixed 41 frames or walking `walkTargetMps`. Determine true sprint source duration. Define a deliberate sample count (41 minimum candidate, increase on evidence), validate full seamless loop and all required tracks. Record keyframes, angular peaks, shoe clearance, longitudinal alternation, and artifact size.
6. Keep head/gaze stable enough for running and preserve palms oriented with their forearms. Running is more energetic than walking: allow a natural **elbow bend and forward/back arm drive**, but avoid raised/locked shoulders, inward-crumpled elbows, forced straight forearms or arms continuously crossing the chest. Transfer authored motion first; make bounded, evidence-based refinements only if visible defects require it.
7. Audit the torso's forward pitch. The accepted **five-degree distributed walk inclination is for walking**, not an additive requirement to double during sprint. Provisional visual sprint inclination is an **athletic moderate forward lean** (initial review band approximately 8–12 degrees total apparent torso pitch, to be calibrated visually from the actual clip). Avoid an unnatural sharp waist hinge, excessive hunch, or head pointing at the ground.
8. Run deterministic offline anatomical checks before any preview: alternate lead feet; no left-step/catch-up loop; foot clearance and toe direction; knees bend in the correct plane; no cross-body foot travel; controlled hand swing; neutral restoration; valid loop seam. A numerically moving skeleton does **not** imply visual acceptance.

## 5. Runtime activation and movement mechanics (second phase)

- Add a separate sprint player/clip or cleanly extend the existing player to **blend exactly one authored pose on the existing cloned Voight rig**. Keep accepted `Walk_Loop` track keys, CHAR-117 palms/elbows, CHAR-118 walking-only spine treatment, CHAR-119 forearm/idle/blink logic unchanged in walk/idle states.
- Read the existing `sprint` held action, only when imported Voight is controlled, grounded and directional input exists; physical speed must transition toward **provisional 4.0 m/s sprint target** from the accepted **1.65 m/s walk target**. The provisional target is a design parameter, not a claim about natural running speed or a final locked value. General 6.4 m/s legacy sprint remains untouched.
- Use acceleration and deceleration rather than instantaneous speed teleportation. Provisional calibration: approach a sprint over roughly 0.35s and transition back over roughly 0.30s, subject to visual and physical testing; do not let input release lag or wall collision cause phantom continued running.
- Keep the existing 60Hz Rapier fixed step. Sample `actualPlanarMps` **after** collision resolution for animation cadence and any foot-placement prediction. Account for turning/capsule displacement so clipping or barriers never produce full-speed running legs with zero travel. Reuse the `gait-continuity.ts` grace logic or equivalent for brief ground/speed drop; make intent/state and actual speed observable separately.
- Blend imported human walk/sprint/idle with a provisional **0.18–0.25s** visual crossfade, not a raw replace/pop. Synchronize cycle phase at stance contacts where feasible to avoid changing stance feet mid-step. Drive cycle rate by **measured stride length × cadence vs actual displacement**, not a simple constant that yields shoe skating. Clamp playback rate and surface the clamp in diagnostics.
- Do not apply walking-specific `refineLegs`, forward inclination or elbow adjustment uncritically to the sprint clip. Each correction is gated by gait state; restore a captured base each tick, avoid cumulative quaternion multiplication, preserve reset/disposal semantics.
- Preserve current `enable-character` switch semantics and action clearing. Confirm repeated held keys, focus loss, `pointercancel`, touch lost capture, control changes, and reset all clear sprint as expected. Do not duplicate/replace the existing Shift and touch Run/Sprint controls.
- Do not enable driving/flight for `character.glb` in this branch. Both retain today's explicit blocks until their own approvals and clip integrations.

## 6. Foot IK: diagnostic first, separate activation gate

The fork's Foot IK uses **authored locomotion playback first**, then reads foot phase, samples collider support, applies bounded pelvis offset and solves a two-bone leg chain. This is transferable as a method, not copy/paste code, because GTD uses Babylon linked nodes and Rapier terrain.

- In the first sprint implementation, retain the current `foot-ik-inspector-110.ts` as **diagnostics only**. Compare animation with probes/predicted contacts on flat South Ward pavement; verify that the authored sprint works convincingly **with an IK solver disabled**.
- If foot-ground defects remain after an approved running cycle, open a **separate scoped IK task**: offline left/right stance/swing/contact phase sampling, runtime sole-ground traces against Rapier, bounded pelvis adjustment, ankle aim and two-bone knee solving. Apply **after** authoritative animation updates and restore the IK corrections before the next tick.
- IK should respect the planted/swinging phase; avoid glueing a swinging foot to the ground. Suspend it on actual airborne travel, vehicle use and flight. Rate-limit/quality-gate additional collider casts on mobile, measure FPS/frame cost, and allow instantaneous rollback.
- Never claim `foot-ik-inspector-110.ts` already performs IK: its current report explicitly says `fullTwoBoneIK:false`.

## 7. Quality gates and substantial visual checkpoints

Each gate must be completed before moving to the next. **Preview links are for substantial improvements only**, not every degree or keyframe tweak.

| Gate | Evidence / pass criterion | Preview? |
| --- | --- | --- |
| **G0 — Preservation baseline** | Capture main SHA, asset hashes, accepted standing/walking images, default speed, animation frame tests, input/release behavior. No change to walk/idle. | No |
| **G1 — Offline sprint transfer** | Pinned source checked; separate complete 22-joint sprint clip; loop seam; alternating lead feet (target lead-time balance roughly 45–55% where meaningful, not just existence of both signs); knee plane, shoes and arm swing; clean standing restoration. Record failures if incompatible. | No |
| **G2 — Real integrated sprint** | Keyboard Shift and held mobile Run choose sprint; actual Rapier speed increases and eases; authored sprint plays on **character.glb**; idle/walk/sprint transitions preserve accepted posture. Provide desktop **and** mobile preview, and a source commit SHA. | **Yes — first substantial checkpoint** |
| **G3 — Running silhouette and contact** | Side/front/rear, diagonal turn and stop/start observation: convincing torso lean, strong but natural contralateral arm swing, elbows facing outward/back naturally, bent knees, visible toe clearance, real alternating left/right lead, no cross-foot crossing, sliding, skating, floating, body twist, clipping or repeated T-pose. Flat ground first; step/curb with actual ground diagnostics second. | **Only if substantial corrections are made** |
| **G4 — Regression + owner acceptance** | Walking CHAR-117/118/119 regression tests and actual on-device visual parity pass; no change in driving, flight, imports, city/world, offline/PWA behavior; verify TypeScript/build/tests; mobile performance and loading measured. Owner reviews preview and explicitly accepts or requests changes. | Reuse G2/G3 preview if same accepted binary |

**Required scenarios:** at rest; begin walking; press Sprint during walking; start moving while holding Sprint; release Sprint during motion; abruptly release movement; repeat quickly; reverse/turn while sprinting; run into wall; cross pavement/curb; restore standing/idle; switch device controls; use touch hold then cancel; compare front, side, rear and three-quarter. Measure actual world displacement and cycle cadence. Inspect mobile as a real device/user experience, not only a unit test.

**Suggested telemetry:** `requestedState`, `actualState`, `sprintHeld`, `intentMagnitude`, `actualPlanarMps`, `targetSpeedMps`, `playbackCycleSeconds`, `effectiveCycleRate`, `clipBlend`, `grounded`, `contactPhaseLeft/Right` if measured, `lastTransition`, `blockedSeconds`, and frame-time metrics. Keep diagnostics bounded and opt-in; do not spam expensive per-frame UI rendering.

## 8. Failure modes and rollback policy

| Failure | Diagnostic priority / response |
| --- | --- |
| "Sprint" only moves the avatar faster | Reject: mandatory **authored sprint clip plus athletic pose** is absent. Do not promote speed-only change. |
| Sprint is merely faster walking | Reject: wrong clip; confirm `Sprint_Loop` is independently baked, selected and presented. |
| Bent/inverted legs, one leg catches up, crossing shoes | Inspect target parent frames and sprint FK foot trajectory; compare both left/right lead phases; do not substitute sine-wave gait. |
| Arms crumple inward, T-pose, palms twist | Restore accepted 109/117 pose; inspect clip-relative rotation, linked `TransformNode` parenting and per-state wrist/elbow corrections. |
| Foot sliding or visibly nonphysical sprint | Compare actual Rapier speed, cadence/stride ratio, planted foot motion and collider movement; IK is not the first remedy for mismatched stride. |
| Abrupt pose changes or idle leakage | Investigate crossfade weights, clip phase continuity, single pose writer, base restoration and reset. |
| Mobile performance deterioration | Profile animation update, allocations, draw/load impact; avoid allocating at 60Hz; reject unmeasured IK add-on. |
| Vehicle/flight/accepted walking regression | Stop; revert only sprint-branch changes. Do **not** roll back previously accepted CHAR-117–119, working driving/wheel code, or world data. |

**Branch rule:** if a sprint experiment fails its visual acceptance gates, keep its findings in `documentations/Issues`, decommission the experiment according to the applicable DDD process if ordered, and leave `main` unchanged. The accepted walking code remains the recovery point.

## 9. Execution order and completion criteria

1. Open a dedicated sprint development branch **after implementation authorization**.
2. G0 baseline and source-binary audit; preserve accepted 117/118/119.
3. G1 offline `Sprint_Loop` retarget and anatomical validation.
4. G2 runtime selection, real speed transition, gait/cadence blending, keyboard/touch control and first substantial preview.
5. G3 visual owner review and only necessary, isolated fixes; treat Foot IK as a separate optional enhancement if clear evidence demands it.
6. G4 tests, mobile/desktop review and **owner acceptance**. Only then request permission for merge/deploy. Later tackle driving, then flying, then optionally Birch Avenue under separate directives.

**Definition of done:** Pressing Shift/Run while Voight is moving makes him **physically faster and visibly run like a naturally athletic human** with coordinated legs, torso and arms. Releasing it restores yesterday's accepted walk/idle without visual or input regressions. No claim of completion is valid without an owner-reviewed, working preview.

**Current disposition (2026-10-22):** **Schema approved and documented. Implementation not performed; no runtime file, GLB, physics, existing sprint logic, Foot IK solver, deployment or city layout modified by this document.**
