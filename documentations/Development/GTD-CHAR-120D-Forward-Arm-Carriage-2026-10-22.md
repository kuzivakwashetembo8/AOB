# GTD-CHAR-120D — Forward Arm Carriage: Running Lane Calibration

**Date:** 2026-10-22 (Africa/Johannesburg)  
**State:** **DOCUMENTED DEFECT — PATCH AUTHORIZED, OWNER VISUAL APPROVAL PENDING**  
**Branch:** `feat/char-120-natural-athletic-sprinting-20261022`  
**Previous milestone:** `GTD-CHAR-120C-Sprint-Forearm-Elbow-Direction-Correction-2026-10-22.md`  
**Reviewed CHAR-120C preview:** `https://gtd-5txlhiwl9-interlinkglobaltech.vercel.app/game`, release `3cb2756b0555a4fff26f1c717be2da50bdfe73de`.

## Owner observation, evidence and accepted preservation boundary

Two owner-supplied desktop captures (rear and frontal views on Mercer Street) show that the CHAR-120C forearm correction **now bends both elbows in the required direction**, but the arms fold predominantly **behind** Voight's torso. The owner confirms the movement should occur **beside the torso, with the leading hand able to travel somewhat in front**, and the trailing hand slightly behind the hip without tucking behind the back.

This is a separate geometric defect from CHAR-120A (weak overall arm movement), CHAR-120B (inadequate bend magnitude) and CHAR-120C (wrong elbow-flexion sign). **Do not revert CHAR-120C, increase forearm flexion, or retime the arms.**

**Accepted features locked:** `Sprint_Loop` leg and foot animation, actual sprint speed and pace, forearm mean-bend sign/magnitude (`meanGain=0.90` and inversion), upper-arm oscillation/cadence (`swingGain=1.35`), shoulder and clavicle local rotation, torso forward lean, head, hands/wrists local orientation, walking and neutral pose, vehicle/flying, world geometry.

## Root-cause hypothesis

The `sprintDelta()` retarget contains independently authored upper-arm and forearm local rotations. Correcting the elbow's local signed rotation does **not** guarantee correct global hand position: the upper-arm chain may still orient the whole elbow/hand assembly too far behind the character. Purely multiplying forearm bending will make the hands fold deeper behind the body rather than relocate the arm swing lane.

The accepted upper-arm **phase-varying swing** must remain untouched. The current implementation captures the target rig's neutral pose after CHAR-109 and uses linked Babylon `TransformNode` joints for FK. This makes it possible to derive a **single small fixed forward carriage adjustment**, expressed in the upper arm's parent-joint space, while keeping all authored oscillation unchanged.

## Isolated implementation specification

1. In `src/game/character/retargeted-walk-110.ts`, derive a small parent-space `Quaternion` for `RightArm` and `LeftArm` **once from their captured neutral-linked arm/forearm positions**. The anatomical reference is the vector from upper-arm pivot to the elbow (`ForeArm` transform) and the established character forward vector (hip transform, `Vector3.Forward()`), **not a guessed Euler sign or an arbitrary world-axis rotation**.
2. Target only a modest forward displacement of the elbow's resting line, provisionally **0.095 world units** at the elbow with a strict **0.35-radian** maximum parent-space aim correction (calibrated after visual inspection). This is a carriage bias, not swing amplification or an IK solver.
3. During sprint playback, after the existing authored pose and bilateral mirrored pose are applied, mix that fixed correction by the existing `weight * sprintWeight` and multiply onto each **upper-arm local quaternion once**. Do not change the `sprintDelta()` oscillation, forearm local quaternion, forearm flex sign or `Hand` local rotation; hierarchical FK carries the wrist as expected.
4. No added per-frame target chasing, raycasts, swing-phase-dependent correction, root/body translation, camera change, or duplicate application between updates. No runtime cost beyond two bounded quaternion applications on sprint frames.
5. The correction must be **bilateral** and calibrated in each side's real parent frame; maintain actual left/right opposing swing phases. If the target rig lacks the supported linked joints, skip this experimental forward offset without affecting established animation.
6. Preserve all previously accepted movement (walking, neutral, sprint legs, speed, input) and don't alter raw GLBs/JSON assets.

## Required tests and preview gate

- Unit test two parented synthetic linked rigs, one treated as the baseline. Confirm the new sprint correction moves **each elbow and each wrist forward along the hip's forward axis on average over a full gait cycle**, rather than merely changing a quaternion value.
- Verify shoulders, torso, hips, legs, forearms and hands **retain identical local rotations**, while the upper arms are the only changed local nodes on the sprinting rig; unchanged authored arm swing frequency/alternation.
- After sprint is released, the old accepted walking pose must return exactly. `reset()` must restore the captured neutral pose. No gradual accumulated arm-forward drift over loops.
- Run TypeScript, Vitest, build-time sprint and walking gait auditing, then a single Vercel preview; record exact git SHA and validate `/game`, release metadata and sprint asset.
- Visual acceptance only after the owner sees front, rear and side views: elbows run **alongside** the ribcage, the leading fist travels toward the lower chest, trailing fist remains near the hip; shoulders remain relaxed and hands/wrists unrotated. **Do not merge or promote to production** without owner approval.

## Execution record

- **22 October 2026:** owner confirmed CHAR-120C corrected elbow bend but revealed posterior arm-carriage defect. This technical plan committed before any CHAR-120D runtime changes.
- **Implementation, tests and preview:** to be appended with verified evidence after execution.

**Disposition:** development, visual review pending.
