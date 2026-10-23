# GTD-CHAR-124 — Compact Jog: Arm Gap, Torso Lean, Rear-Leg Recovery

Date: 2026-10-23 (Africa/Johannesburg)
State: documentation-first experiment. Owner authorized document, implement, preview; **not merge**.
Source: CHAR-123 review build `gtd-kvbhc5xvp-interlinkglobaltech.vercel.app/game`, `feat/char-123-urgent-jog-final-20261022@6d544f30092562b3f5dbe743695e7872c7740db7`.
Working branch: `feat/char-124-compact-jog-recovery-20261023`.

## Visual evidence and owner verdict
- Three mobile views (front 3/4 Workshop Road, true side Mercer Street, rear Foundry Lane) show **material improvement** to CHAR-123's upper body and credible hurried-jog feel.
- Two Payback 2 third-person rear-view comparison screenshots: character holds elbows close to lateral jacket seams; rear heel visibly folds upward before the leg swings forward.
- Remaining target corrections: **at least 8% less forward lean** during jog; *slightly tighter* elbow/arm-to-torso corridor; trailing foot lifts earlier during recovery, then steps forward (lift -> recover -> plant). No aggressive race sprint, sideways feet, foot dragging, torso collapse or wrist clipping.

## Causes and constraints
- Current CHAR-123 sprint-specific multi-spine additive pitch is `[1.15, 0.90, 0.65]` degrees, atop authored motion. Reduce **only** sprint component; retain walking back pitch `[2, 1.75, 1.25]` degrees and all clip/asset data.
- Current arm pose uses fixed mirrored pelvis-Z adduction `0.19 rad` and fixed pelvis-X chain pitch `-0.11 rad` before the proven CHAR-120F two-segment anatomical solver. Earlier nonlinear X compaction failed leading-wrist height/forward travel and 60 Hz quaternion continuity. Change at most **one small fixed mirrored rotation** to avoid phase discontinuity; retain the physical leading-hand height > -0.28m, forward > 0.20m, flex 75–100°, no torso crossing and full yaw/scale/reflection gates. If these fail, restore accepted arm angle and record limitation, not test relaxation.
- Current rear-leg correction moderates the knee toward neutral by `0.38 - 0.055 * trailing`, with trailing only beginning once pelvis-relative ankle is more than 0.09m behind. This delays recovery and can create a low heel. Start recovery nearer toe-off by reducing the trailing threshold (to approximately 0.02m behind) and slightly increasing heel fold while **retaining** the fast-jog <=95° knee bend, forward shoe <=25° heading, full-cycle continuity and walk isolation.

## Implementation plan, single contained branch
1. Modify only sprint additive spine pitch by >=8% (initial calibration **12%**). No walk/idle/spawn/camera/player physics changes.
2. Increase mirrored fixed arm adduction from 0.19 toward **0.215 rad** (about +1.43°), preserving existing fixed -0.11 rad pitch and same upper/lower rotational transform; preserve CHAR-120F joint-length/timing gates and check clipping.
3. Introduce a pure smooth `rearLegRecovery124(ankleForwardZ)` transition: start ~0.02m trailing, reach maximum ~0.24m behind. Increase retained knee source motion *only* during rearward recovery, smoothly and symmetrically with stride; leave stance leg, walk and shoe yaw algorithm unchanged.
4. Add tests for a) exact sprint pitch reduction, b) constant-length, constant-elbow arm mapping and narrower mean frontal envelope, c) rear recovery begins before CHAR-123 and is smoothly bounded, d) actual `character.glb` 80-phase knee/ankle motion, original arm target/continuity, shoe heading and all 3 rig transforms. **Do not weaken original acceptance thresholds.**
5. Run prebuild, strict TypeScript, all Vitest tests and offline build; deploy **preview only** if Vercel READY. Owner confirms from front, side, back. Main and production unchanged.

## Acceptance
- Fast jog, not sprint. Body more upright by at least 8% in added sprint lean.
- Arms visibly tighter to torso, no clipping or winged elbows, left/right mirrored and elbows anatomically bent.
- Rear foot rises *before* it advances, both legs alternately, without high-knee race pose or sideways foot orientation.
- No failure in previously accepted walk/idle or vehicle behavior.

## Implementation / verification record
Pending. Owner visual approval is the final acceptance gate.
