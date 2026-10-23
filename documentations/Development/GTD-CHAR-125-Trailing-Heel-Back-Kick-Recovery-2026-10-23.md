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
Pending commits and CI. Keep failures documented, do not weaken existing posture gates.
