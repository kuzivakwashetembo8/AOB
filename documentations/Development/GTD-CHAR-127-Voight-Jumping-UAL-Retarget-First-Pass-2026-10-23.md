# GTD-CHAR-127 — Voight Jumping: UAL Baseline, Physics Coupling and First Preview
Date: 2026-10-23
Branch: feat/voight-jumping-20261023
Status: experimental, visual acceptance pending; no main merge or production deploy.

## Scope and isolation
Implement jumping for `character.glb` (Voight) using the pinned `ual.glb` animation, not a new mesh, manual vertex edits, or the concurrent vehicle seating branch. Preserve the accepted CHAR-109 neutral and CHAR-110/CHAR-120/CHAR-124/CHAR-125 walking/sprint improvements. Rapier remains the sole authority for displacement, collision and grounded contact.

## Verified repository observations
- `character.glb` has 73 joints and **zero native animation groups**; `ual.glb` contains 65 skin joints and authored motion.
- Existing build-time CHAR-110 baker maps 22 anatomical joints from UAL to `character.glb`, using UAL's first `Idle_Loop` frame as the delta baseline. This calibration is necessary to avoid applying the idle shoulder correction twice.
- UAL's runtime controller selects `Jump_Loop`/`Jump_Start` and `Jump_Land` if they are present in the imported binary. Clip configuration alone is not proof of a particular clip. The new build must verify actual source animations.
- GTD's UAL player already selects the jump visual gait, but the custom `character.glb` is controlled by `createWalkPlayer110` and its update receives only speed, dt and sprint. The Rapier character jumps on `jump` while grounded with launch speed 5.4 m/s and gravity 9.81 m/s²; custom character animation ignores grounded and vertical velocity. This is the primary defect.
- Runtime file `src/game/world/mercer-static-character-103.ts` owns the custom linked skeleton. Main transition wiring resides in `src/game/core/gtd-runtime.ts`.

## Biomechanics and image observations
User-provided Mason Kresge/Sketchfab screenshots show airborne flexed hips and knees, legs tucked under the torso, asymmetric/splayed arms for balance. It is **one airborne reference pose**, not a complete vertical-jump cycle. A squat posture sustained through the whole trajectory would read as sitting in the air.

External evidence: Countermovement jumps involve downward hip/knee/ankle flexion, powerful hip/knee extension and ankle plantar flexion at takeoff, brief flight and knee/hip flexion on landing. Coordinated arm swing materially contributes to takeoff (McMahon et al., Strength & Conditioning Journal 2018, DOI 10.1519/SSC.0000000000000375; Harman et al., PubMed 10404494; sports biomechanics text, Figure 1.22).

## First-pass implementation contract
1. Reuse CHAR-110's verified build-time joint mapping and source-rest-to-target-local quaternion conversion to bake the real UAL `Jump_Loop` into a compact 22-joint JSON; reject missing source clip, bad accessors, skin-map gaps, degenerate quaternion values and excessive angular deltas. The initial baked motion is provisional until the preview confirms its anatomical phase semantics.
2. On a new, separate runtime `JumpPlayer`, sample only that authored UAL jump motion into Voight's linked TransformNodes, blending against the accepted neutral/gait pose. The physics capsule alone controls the actual jump arc. Never apply GLB root translation to the actor.
3. Enter airborne visually when Rapier signals a real jump, independent of horizontal movement; keep the body's motion authored rather than synthesizing a crouch using guessed Euler axes. Crossfade back to the currently correct walking or sprinting source after landing.
4. Preserve neutral/restoration on walking toggle off and destruction. Zero airborne updates when flying or driving. Maintain existing camera, movement speed, physics and seat integration.
5. Add tests for clip integrity, airborne activation and landing restoration.

## Visual acceptance gate
At /game with Character enabled: jump from standstill and during forward walk; check in front, profile and rear views. Confirm feet rise clear of the pavement, thighs and knees visibly flex without crossing/clipping, arms balance rather than T-pose, heading is unchanged, no ghost walk during flight, landing posture returns smoothly to walking/idle, and repeated jumps do not accumulate rotations. Check mobile controls and 60-second loading target.
If initial trial fails the anatomy or phases, refine the retarget and re-preview *on this branch only*. Do not ship to main without owner review.

## Branch boundaries
Do not touch driver-cabin-pose, driver-joint-space, car assets, seat anchors or seating branch; do not merge. This research is based on code and screenshot inspection. Live rendered character correctness is not asserted until a preview has been inspected.

## First preview result — 2026-10-23
- Implementation commit: `982ceed54f5ddd39a205429d7bbfafc148c17bab`.
- Vercel deployment: `dpl_FrRNJCuBLLvRpeyU8pFzEMejVTuL`, state **READY**.
- Preview: https://gtd-cyu61u1bg-interlinkglobaltech.vercel.app/game
- Confirmed pinned source: real `Jump_Loop` of **2.5 seconds**; build-time UAL idle-relative retarget successfully produced **41 samples × 22 target joint tracks**. Output: `char127-ual-jump.json`, **33,292 bytes**.
- Observed source-derived peak absolute joint deltas (radians): left thigh 0.664, left knee 1.591; right thigh 0.329, right knee 0.632; left upper arm 0.957, right upper arm 0.971. These are animation audit measurements, **not** visual acceptance or confirmation of anatomically correct direction.
- New CHAR-127 regression tests: **3 passing**; Vercel complete release packaging and build finished successfully.
- Physics integration: existing Rapier jump speed/gravity untouched; custom character controller now receives authoritative grounded and vertical velocity; UAL-derived linked-joint jump overrides gait only during actual flight and fades after impact.
- Known limitations: no pre-takeoff anticipatory physics delay; only the real UAL `Jump_Loop` was sampled in this first pass (not distinct Jump_Start/Jump_Land), and the clip is time-warped across the physical ballistic arc. Shoulder/leg appearance, game feel, mobile input and contact clipping require owner-side visual inspection.
- Status: **experimental first preview**, independent of seating, main unchanged, no production deployment.
