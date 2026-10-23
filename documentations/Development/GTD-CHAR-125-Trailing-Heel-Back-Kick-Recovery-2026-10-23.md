# GTD-CHAR-125 — Trailing-Leg Heel-Up Back-Kick Recovery

Date: 2026-10-23 (Africa/Johannesburg)
Baseline: CHAR-124 preview `gtd-jgj63g5bl-interlinkglobaltech.vercel.app/game` — 442/442 tests, accepted upper-body lean, arm carriage, and forward-leg presentation.
Branch: `feat/char-125-trailing-heel-backkick-20261023`
Status: Owner authorized documentation and implementation. **No merge to main or production** without visual approval.

## Owner's visual acceptance and defect

Three new mobile game views (front, back, side) show natural enough upright torso and arm carriage: **freeze the upper body**. Additional running illustrations emphasize the rear propelling leg's heel-to-glute motion in the flight/recovery phase. Current Voight jog lifts the advancing leg but the leg behind remains extended/near the ground before coming forward: a missing **back-kick**.

Desired cycle, on *both* sides:
1. Push off with trailing foot.
2. After toe-off, bend the *trailing knee* and raise its ankle/heel **upward behind the body**, while the thigh remains behind the pelvis.
3. Only then carry that recovering shin/foot forward.
4. Plant naturally with the existing foot-facing alignment.

A heel moving behind and upward in pelvis-local Y/Z, not simply a higher forward knee, is the physical acceptance condition. Accept meaningful lift before forward crossing, avoid sharp foot-pops, floaty stance, toe inversion and intersecting the thigh.

## Root cause identified in code
`src/game/character/retargeted-walk-110.ts` / `refineSprintLegs()` currently only Slerps the native `LeftLeg/RightLeg` knee pose toward its idle neutral by a small recovery-dependent weight (`0.38 - 0.075 · rearLegRecovery124(z)`). That slightly adjusts knee bend but **does not explicitly target any ankle height**. The foot-heading correction is independent and should remain. Also the pure trailing-Z gate does not distinguish propelling stance from the recovery swing.

## Isolated patch design
- Preserve all CHAR-124 torso pitch, arms, pelvis, upper-leg phase/timing, forward foot action, overall jog speed, shoe yaw, animation asset and vehicle logic.
- Introduce a *sprint-only*, smooth, bilateral recovery envelope based on the trailing ankle being behind the pelvis **and beginning forward return** (toe-off/recovery), with no adjustment to planted stance.
- After the existing knee-neutral correction, rotate the knee/linked shin toward a physically measured ankle target: **higher and slightly backward** in the pelvis frame. Use the existing `parentSpaceAimDelta` joint-space solver, not guessed local Euler axes; reject degeneracy and bound the correction. Do not edit the upper thigh or foot heading algorithm.
- A smooth ramp up and fade across recovery, no discontinuity at Z=0 or at the loop seam; scale with sprint blend and preserve reset/idle. The measured ankle-height increase behind the pelvis (relative to CHAR-124 baseline) is the acceptance metric, not only a mathematically valid knee angle.
- Add actual `character.glb` trajectory tests across 80 phases, both legs and yaw / scale / mirror rigs: recover higher **while foot is still behind**, knee fold within anatomical bound, toe continues facing forward, unchanged arm and walk/idle quaternions, no frame-pop.
- Run Vercel preview tests and offline packaging. Owner judges front, side, rear view before promotion.

## Implementation and measured verification
### Attempt 1 — rejected (not for preview)
- First actual-rig build stopped at TypeScript due to raw-ankle history naming collision; corrected without changing behavior.
- `dpl_F7mkdstMkBRPnkVCYgsNGVLiqdXM`: 440/446 tests passed, 6 failed in `char120f-actual-arm-chain.test.ts`. The paired actual-GLB test measured **60 trailing-recovery samples**, +**0.1602 m peak heel lift**, +**0.1098 m mean lift** while behind the pelvis, zero negative lift samples.
- This proves meaningful rear heel elevation, but the unbounded 3D shin re-aim also caused **49.64° maximum shoe heading** (existing limit <25°), **0.1792 m frame-to-frame relative ankle jump** (new limit <0.09 m), and **0.011 m stance deviation** (new limit <0.008 m). Unacceptable; preserve existing tests.

### Attempt 2 — corrective refinement
- Preserve the sprint phase condition (ankle behind pelvis, progressing forward after toe-off), neutral knee blend, upper body and foot-yaw solver.
- Replace unconstrained shin 3D target with a **pelvis-sagittal Y/Z-only aim**, fixing shin X exactly and retaining length. This avoids introducing lateral leg rotation.
- Slew-limit the heel-recovery envelope at at most `dt / 0.115` per frame and suppress new recovery onset when the baseline ankle is not clearly behind the pelvis. Both entry and exit are bounded, across the loop seam, reset and sprint-to-walk transition.
- No source GLB modification, no changes to original <95° knee or <25° shoe heading acceptance tests.
- Re-run strict TypeScript, 446 tests and Vercel preview build. Preview only on READY.

### Attempt 2 — rejected
- `dpl_AbAzU2ybeYUcXwrWRkZYrGS8jadQ` real-GLB phase comparisons: +**0.1573 m** peak lift, +**0.0707 m** mean lift in 60 recovery samples. Nevertheless, **49.64°** shoe-heading deviation (same original 25° gate), **0.1758 m** relative foot displacement in one step, **0.1561 m** residual front/stance disturbance. Six failures confined to actual-GLB suite. The sagittal target fixed the original shin X but left a rotated child foot orientation; the filtered gate also lingered into the forward/stance phase.
- Retain failure logs, preserve baseline and tests. No preview.

### Attempt 3 — corrective bounded joint-space blend
- Separate desired `goal` quaternion from its filtered joint-space application. Maximum angular correction changes at **4 rad/s**, with both phase and spatial envelopes. Apply a second smooth rear-only attenuation reaching exactly zero before forward crossing, not merely a temporal release.
- Reduce requested sagittal offset slightly to +0.16 m upward, -0.17 m posterior at full gate. Keep knee flex clamp 92°.
- Counter-aim only the *foot node* to restore its previously authored shoe direction **after the shin moves**. Continue the existing heading correction but reject only changes that **worsen** an already close-to-center toe rather than rejecting all close-center fixes.
- All original CHAR-124 upper-body, foot-heading, full-cycle and ordinary walk gates unchanged. Next build must pass all tests and be READY before preview.


### Attempt 3 — passing, preview ready
- Tested Git commit: `740bea0d73a83f172384a3a979f3a1ec26c95c6c` (code commit `7c09815365a4638fc353bc538153f9d710942728`).
- Vercel preview `dpl_DhLhhGANqWSUAAjTAxP5SfxE3ita` → **READY**, `https://gtd-ms7gzhos6-interlinkglobaltech.vercel.app/game`. No promotion or merge.
- Strict TypeScript passed. **446/446 tests passed** across 111 files including existing physical knee bend, shoe heading, mirrored rig transforms, wrist/arm continuation and the three new actual-GLB trailing heel comparisons.
- Per-rig actual `character.glb` (all three yaw/scale/reflection combinations, 60 recovery samples): **0.1449m peak additional rear heel lift**, **0.0606m mean lift**, zero negative lift samples, **0m stance deviation** and **0.0587m peak relative one-frame displacement** (limit 0.09m).
- Vite production build completed; offline shell and game assets packaged, mandatory inventory missing=0.
- Upper body and CHAR-124 gait speed are unchanged. Visual front/side/rear acceptance of the resulting back-kick is **pending owner review**, despite passing automated gates.

**Next checkpoint:** owner inspects the trailing leg: rearward heel must rise before forward leg swing without sliding/floating and without resetting current upper-body form. If accepted, discuss separate merge authorization.

