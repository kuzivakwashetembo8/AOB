# GTD-CHAR-109 — Accepted Human Neutral Posture and CHAR-114 Handoff

Date: 2026-10-21
Branch under acceptance: `feat/char-105-human-walking-toggle-20261020`
Owner disposition: **CHAR-109 STANDING POSTURE ACCEPTED** following screenshot showing both shoulders relaxed, upper arms alongside the torso, forearms and hands hanging naturally, and normal jacket silhouette. This is a visual acceptance of standing, NOT acceptance of walking gait, running, flight, driving or final character graduation.
Integration decision: merge the accepted current progression to `main`. Do not implement the remaining directives in this closeout.

## 1. Exact source-asset facts (CHAR-108)

- Human: `public/GLBs/Characters/character.glb`, 12,197,104 bytes.
- GLB read-only audit: 86 glTF nodes, one skin with **73 joints**, 12 skinned mesh groups carrying joint indices and weights.
- Critical joint chain: `LeftShoulder > LeftArm > LeftForeArm` and `RightShoulder > RightArm > RightForeArm`, with downstream hand joints.
- Native animation inventory: **zero authored animation clips** (`animations: []`). A skeleton is not a walking or idle animation.
- Josh's three-player-controller `glTF.html` / `example/glTF.js` demonstrates authored clips and transition logic, but those sources are **not** proven retarget-compatible with the GTD human.
- The Quaternius UAL development humanoid has `Idle_Loop` and `Walk_Loop` and existing physics/camera integration. Those animations cannot be blindly copied into the human's unrelated rest hierarchy.

## 2. Failure history (what must not be repeated)

- CHAR-105: mesh-space shoulder guesses based on body height lowered hands but left upper arms raised; initial character model additionally walked facing backwards.
- CHAR-105 direction fix: removed erroneous static presentation yaw for playable model. Travel facing is now correct; preserve this working solution.
- CHAR-106: additional mesh deformation tried pulling shoulder and jacket vertices inward/down. This distorted sleeves, caused ballooning, did not relax actual shoulder joints, and was rejected.
- CHAR-107: tried directly rotating Babylon `Bone` objects. The model showed a T-pose because glTF skinning links bones to `TransformNode` objects whose transform is authoritative; skeleton preparation overwrote those bone-only changes.
- CHAR-108: binary rig audit established that the owner character is skinned and has real shoulder and arm joints but no authored clips.
- CHAR-109: corrected the authority mismatch and visibly solved the neutral standing posture. The user explicitly accepted the screenshot. No further shoulder geometry patches are authorized or required.

## 3. How the accepted CHAR-109 solution works

Code: `src/game/character/native-neutral-pose-109.ts`, `src/game/character/driver-joint-space.ts` and `src/game/world/mercer-static-character-103.ts`.

1. Import `character.glb` once, instantiate the human GLB and stop available animation groups (there are no source-authored clips).
2. `findLinkedArms109()` searches the real skeleton for matched `LeftArm/LeftForeArm` and `RightArm/RightForeArm`, verifies the forearm bone descends from the corresponding upper arm, and resolves the bones' actual linked Babylon transform nodes.
3. `createNativePoseController109()` forces up-to-date world matrices, measures the physical shoulder-to-elbow vector using `upper.getAbsolutePosition()` and `forearm.getAbsolutePosition()`, and defines a nearly vertical target (`(-0.10,-1,0)` left; `(0.10,-1,0)` right, normalized) with slight natural lateral cant.
4. `parentSpaceAimDelta()` converts both directions into the upper arm parent joint's *local coordinate frame*, checks the transform is sufficiently orthogonal and uniformly scaled (reflection permitted), and derives a quaternion. The rotation magnitude is bounded by **2.15 radians**; invalid, degenerate or ambiguous transforms are rejected.
5. Multiply the delta by each upper-arm's original local quaternion, apply it to the linked `TransformNode`, update world matrices and verify the shoulder-to-elbow direction improved. This moves the upper arm, forearm and hand via the skeleton/skin weights rather than modifying jacket vertices.
6. **Bilateral fail-closed gate:** if both arms cannot calibrate, restore the original rotations and mark the pose rejected. Normal success reports `native-joints` with both `leftArm` and `rightArm`.
7. Persist the accepted neutral quaternions. `ensure()` restores them only when another state update has changed a joint, so poses do not accumulate rotational drift or repeated corrections. Called during activation and controlled movement.
8. `human-walking-105.ts` no longer modifies upper-body vertices. Its remaining below-hip experimental two-phase deformation still produces visible foot dragging; this is **not** the solution for realistic walking.
9. Existing `Enable Character` in Settings selects the human while retaining the same Rapier capsule and camera/input controller. Default remains the development humanoid (OFF). Disabling returns the original humanoid. Correct model-facing relative to the travel direction is retained.

**Visual verification:** the owner-supplied October 20 screenshot shows relaxed shoulders with upper arms alongside the torso, and the owner explicitly declares the pose successful. Exact FPS/stride measurements were not supplied; do not infer walking quality from the accepted standing pose.

## 4. Current directive status

| Directive | Scope | State after acceptance |
|---|---|---|
| CHAR-108 | Source rig + animation audit | Complete |
| CHAR-109 | Human neutral standing posture | **Accepted; safe to merge** |
| CHAR-110 | Josh/UAL-to-human animation retargeting compatibility | **Pending, next work** |
| CHAR-111 | Realistic walking, planted feet, actual swing and stride | Pending; foot dragging known |
| CHAR-112 | Running and jumping transition states | Pending |
| CHAR-113 | Flying and airborne poses, controls | Pending |
| CHAR-114 | Human vehicle interaction + graduation to full feature parity | Pending final gate |

**Naming distinction:** CHAR-111 is explicitly the realistic walking milestone. CHAR-114 is the *culmination* of walking + running/jumping + flight + vehicle capability graduation. By CHAR-114 walking must already have been accepted, but CHAR-114 is not where gait first begins.

## 5. Morning starting point — do not implement during closeout

**Gate A: CHAR-110 compatibility only.** Read `documentations/Development/GTD-CHAR-110-retargeting-compatibility-gate-2026-10-21.md` first. Obtain Josh's actual rig/clips as assets and inspect per-joint hierarchy, local rest/bind frames, scale and quaternion axes. Prepare explicit source-to-target bone mapping and reject mapping if source parent chains, rest orientations or handedness cannot be safely reconciled. Confirm clips exist in the source asset, not merely in JavaScript demo configuration. Keep Babylon.js + Rapier as the runtime architecture.

**Gate B: CHAR-111 genuine stride after CHAR-110 passes.** Replace the currently cached synthetic leg-vertex poses with a validated *skeletal* `Walk` cycle, through retargeted authored animation or deliberate per-joint procedural gait if retargeting fails. Independently verify hip, thigh, knee, ankle and foot transforms. Required states: idle, heel lift, swing with knee flexion, forward foot clearance, foot plant, weight transfer, opposite-leg alternation; keep hands and shoulders in approved neutral pose at standstill. Couple cadence/stride length to measured speed (current walk target **3.8 m/s**) and prevent foot sliding while planted. Then adapt ground contact with Foot IK; IK alone does not create a walk cycle. Preserve correct facing and collision/camera continuity.

**Gate C: measurable checkpoints.** Compare front, side, back views at rest and in motion, start/stop and turning, both arrow/WASD and touch, and sidewalk/road transitions; check feet actually lift and plant, jacket/arm skinning remains stable, collision capsule does not drift, no extra asset/GLB load, first-frame readiness and real frame time remain acceptable. First substantial preview after actual gait advancement; obtain explicit owner acceptance before CHAR-112.

**Later, only in order:** CHAR-112 running and jump takeoff/air/landing; CHAR-113 directional hover/flight/landing; CHAR-114 enter/exit, per-vehicle seated pose, steering/foot placement, mobile controls, complete offline/performance regressions. Graduate human as default only after all accepted, maintaining a reversible settings fallback until then.

## 6. Freeze and handoff constraints

No gait or flight changes in this closeout. Keep accepted pose as the baseline and do not reintroduce T-pose or arm/jacket vertex squeezing. No Three.js engine migration; reference Josh for clip/state/IK ideas, map into Babylon runtime after validation. Original UAL model remains working fallback. Keep branch-based development, visual checkpoints for substantial changes, documentation-first, and no new feature merge without verification.
