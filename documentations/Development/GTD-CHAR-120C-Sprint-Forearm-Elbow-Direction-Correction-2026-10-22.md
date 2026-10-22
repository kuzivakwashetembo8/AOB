# GTD-CHAR-120C — Sprint Forearm Elbow-Bend Direction: Defect, Evidence and Repair Gate

**Date:** 2026-10-22 (Africa/Johannesburg)  
**Branch:** `feat/char-120-natural-athletic-sprinting-20261022`  
**State:** **DEFECT DOCUMENTED / SINGLE-FACTOR PATCH AUTHORIZED / VISUAL ACCEPTANCE PENDING**  
**Parent schema:** `GTD-CHAR-120-Natural-Athletic-Sprinting-Technical-Implementation-Schema-2026-10-22.md`  
**Direct predecessor:** `GTD-CHAR-120B-Forearm-Flexion-Only-2026-10-22.md`  
**Defective observed preview:** `https://gtd-dsrtcjsyn-interlinkglobaltech.vercel.app/game` (release `b701c30f9d7eb8ff7b5912e85942937beb30f50f`).

## 1. Owner's visual observation and demonstrated target

The owner supplied three frontal/rear screenshots of playable Voight in South Ward on 22 October 2026. The first has red annotations identifying outward/downward arm extension. The second presents a green, visually adjusted **required** posture, with elbows bent naturally and hands traveling toward the chest/hip. The third, from the rear, shows the incorrect diagonally extended forearms. **The hands are bending in the wrong direction.**

This differs materially from CHAR-120B's earlier hypothesis of insufficient flexion *magnitude*. In the defective preview, the forearm's source-relative flexion was increased from 0.65 to 0.90 and the effect became more visible **in the wrong direction**. The now-accepted sprint leg action, speed, torso inclination, shoulder rhythm and upper-arm hand-swing tempo should not be modified. Moving the wrists, changing the upper arms, or increasing the same misdirected mean would not solve the defect.

**Actual visual acceptance target:** As each shoulder/upper arm swings, the forearm bends in the **anatomically inward/forward elbow plane**, placing the leading fist toward the lower chest and keeping the trailing elbow flexed with the hand nearer the waist. The fists' local orientation stays unchanged; elbows must not fold unnaturally across the chest, move laterally outward or remain locked straight. Alternating left/right motion must stay counterphased with the legs.

## 2. Technical evidence and suspected cause

In `src/game/character/retargeted-walk-110.ts`, the sprint animation takes authored UAL `Sprint_Loop` quaternion `q`, splits `q * inverse(cycleMean)` (phase varying motion) from `cycleMean` (rest-relative bias), and reconstructs the forearm at `swingGain=1.10`, `meanGain=0.90`. Both components currently preserve the source-retargeted signed mean, regardless of whether that sign bends Voight's own elbow **toward or away from the chest**.

The owner-facing screenshots reveal why **nonzero elbow rotation is not sufficient** as a unit-test acceptance criterion. The current `char120a-sprint-arm-isolation.test.ts` tests that positive X mean bends more; it does not check the *correct sign* for the target anatomy. Both arms also participate in CHAR-115's mirrored right-to-left pose mechanism; a unilateral edit risks asymmetric direction.

**Proven precedent:** `documentations/Development/GTD-CHAR-110D-Elbow-Shoe-and-FootIK-Debug-2026-10-21.md` previously documented **inverting a retargeted idle-relative right-forearm delta** to correct inward, anatomically wrong elbow flexion during walking, preserving palm direction. For sprint, first isolate the **cycle-mean bend only**, retaining the authored oscillating forearm swing and preserving all previously accepted locomotion.

## 3. Minimal authorized correction schema

1. Retain the current `sprintDelta()` decomposition, `swingGain=1.10`, `meanGain=0.90`, upper arm `1.35/0.50`, shoulder `0.65`, sprint cycle/phase, local wrist restoration, and CHAR-119 walking-specific forearm correction.
2. For **sprinting forearm mean bias only**, reverse its signed quaternion relative to the neutral/rest-calibrated frame: `sprintMean = inverse(center)`. Preserve the *phase-varying* `q * inverse(center)` as-is, so swing tempo/excursion does not change. Do not invert entire authored sprint keys or change the arm track.
3. Apply on **both** `RightForeArm` and `LeftForeArm` through the same forearm-only path. The runtime's existing bilateral reflection `mirror()` and 180° phase relation remain authoritative when the imported target rig provides mirrored linked bones. No additional per-arm rotation in global/world space.
4. Keep the quaternion normalized, compose exactly once per update from the captured accepted rest, and fade the correction only through the **existing** sprint blend. No new smoothers, time shifts or runtime IK in this gate.
5. Add a regression test with a real parented synthetic linked-bone chain and world-space wrist positions: holding the identical upper arm, the corrected forearm must drive its wrist **toward the model's forward direction** instead of backward, while maintaining the same sweep excursion. Compare unchanged upper-arm/shoulder, torso, legs and wrists; verify exact walk/idle restoration and no left/right divergence. The prior CHAR-120B test expecting a positive mean must be updated because it encodes the known-bad sign.
6. Run full TypeScript, Vitest, UAL/Voight sprint-leg sagittal gait, offline PWA pack verification and a single isolated Vercel preview. User must visually accept actual skinned front, rear and side views before any merge to `main`.

This is a **single-parameter-direction experiment**, not a claim that quaternion inversion has already been anatomically verified on the rendered `character.glb`. A visually incorrect result should be recorded and corrected surgically, not masked by increasing magnitude or changing shoulders.

## 4. Protected invariants and stop conditions

- **Frozen:** Imported `character.glb`, UAL authored clip, `char120-ual-sprint.json`, baked walk, hips/legs/feet, torso, shoulder/clavicle and upper-arm local quaternions, speed, grounded physics and inputs, hand local quaternion, standing/walking, vehicle/flight systems, world.
- **Pass:** Existing accepted gait and upper-arm swing continue unchanged while the forearms visibly turn the anatomically correct way, alternating with the legs; no right/left mismatch or hand inversion.
- **Stop:** Displaced shoulder, crossed elbows, hands folded inward unnaturally, backwards palms, regression in walking or legs. Do not silently broaden scope.
- **Merge:** No branch merge or production deployment without explicit owner acceptance.

## 5. Execution register

- **2026-10-22 — Defect documented before code change:** user-supplied red/green annotated frontal poses and rear view establish wrong **direction** of both elbows as opposed to mere magnitude. Authorized scoped patch and post-improvement preview.
- **Runtime correction committed:** `23dd37e607c3f331bc661b88feb5c4d3a090eccf` changes only `sprintDelta()`: for forearms, substitute `Quaternion.Inverse(center)` before composing the retained 0.90 signed mean. Keep the 1.10 authored oscillation unchanged. Upper-arm, shoulder, hand local transform, torso, gait phase, legs, physics and walking paths are untouched.
- **Directional test and first failed attempt:** `199d70ae0f9188692c6b4f71f7f013117b820442` introduced a bilateral forward-wrist position witness across the authored cycle. The first Vercel attempt `dpl_6QSukMpRNfaKnRSbJ97MoD1V3NVd` ran **427/428** tests: its sole failure was the new test's inflexible assertion requiring >0.07 m at *every* frame, while one naturally swinging wrist advanced 0.06139 m. No runtime issue or walking/leg regression was reported. That test threshold was not a meaningful biomechanical requirement and is retained here as an instructive failed gate.
- **Corrected cycle criterion:** `3cb2756b0555a4fff26f1c717be2da50bdfe73de` modifies only the test: capture both hands' forward wrist position *relative to their own elbow* through >80 frames; require positive mean displacement, predominantly forward sign and preserved oscillation excursion, instead of a hard per-frame minimum. The signed forearm mean is negative on the parented target rig, opposite to the proven-defective direction; other joint local transforms remain unchanged. These are test-rig guarantees, not proof of appearance on skinned Voight.
- **Verified build:** Vercel deployment `dpl_7A6szHe37GKVx1veEnMeJ57RH1Uk` reached **READY** with **428/428 tests passed across 110 files**, TypeScript checks, CHAR-110 walking and CHAR-120 sprint gait audits, and PWA inventory/package completed (no mandatory resources missing).
- **Preview release:** `3cb2756b0555a4fff26f1c717be2da50bdfe73de`, `https://gtd-5txlhiwl9-interlinkglobaltech.vercel.app/game`. HTTP 200 verified on `/game`, `/build-version.json` (correct SHA) and `/GLBs/Characters/char120-ual-sprint.json`.
- **Owner verdict:** Visual inspection **pending**. No merge to `main`, production deployment, change to world, driving or flying.
