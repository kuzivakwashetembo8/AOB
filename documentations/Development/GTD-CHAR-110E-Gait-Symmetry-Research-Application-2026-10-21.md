# CHAR-110E — Research-Driven Alternating Walk Recovery (2026-10-21)
Status: A/B retarget experiment; **owner visual approval pending**. Branch: `experiment/char-110e-alternating-gait-audit-20261021`.

## Source-of-truth research
On main: `documentations/Research/Voight Foot IK.md` (research report committed by owner). It supersedes suggestions to make Foot IK invent missing locomotion. Foot IK begins after a correct authored gait and adapts contact/terrain.

## Verified problem: fore/aft asymmetry, not an absent left animation track
The new build-time script `scripts/char110e-sagittal-audit.mjs` samples the actual **UAL Walk_Loop**, the raw 22-joint target transfer, and CHAR-110D's fully corrected target cycle at 81 positions.

| Measure (pelvis-local foot Z; independent of travel direction) | Original UAL | Voight raw | Voight CHAR-110D |
|---|---:|---:|---:|
| Left-leading frames (lead greater than 3.5cm) | 40 | 24 | 24 |
| Right-leading frames (lead less than -3.5cm) | 39 | 53 | 53 |
| Maximum left lead magnitude | 0.6160 m | 0.2657 m | 0.2657 m |
| Maximum right lead magnitude | 0.5997 m | 0.9414 m | 0.9414 m |
| Left foot stride excursion | 0.6576 m | 0.6533 m | 0.6533 m |
| Right foot stride excursion | 0.6475 m | 0.6175 m | 0.6175 m |

Interpretation: Voight's **left track travels nearly as far as UAL's**, but its position is biased backwards by roughly 0.35m over most of the walking cycle. The right foot's leading phase is longer and exaggerated. This explains the owner's repeated step/catch-up observation. Both lead states technically exist (our old weak gate reported true), so the correct gate must measure *balance*, not just sign. Raw and post-processed clips have identical sagittal values, so CHAR-110C lateral and CHAR-110D foot/elbow patches did **not** create the source defect.

The untouched UAL glTF has 65 translation tracks; **only `pelvis` has nontrivial displacement (~0.0729m)**. Our current transfer throws away all translations. Pelvis bob/sway belongs in a subsequent bone-translation compatibility gate; it cannot alone explain a 0.35m left/right foot lead bias because pelvis-local foot lead cancels common hip translation.

## Alternative investigated
The existing custom `char110-bake-ual-walk.mjs` uses an aligned *global anatomical frame* for all bones plus source-parent-idle and target-parent-rest rotations. This cannot guarantee all joints remain in the matching reference frame. Babylon.js 9.29.0 has `AnimatorAvatar.retargetAnimationGroup` with per-bone source/target reference-pose compensation.

The isolated comparison `scripts/char110e-native-bake.mjs` applies the **same per-bone rest world-matrix change-of-basis used in Babylon 9's `AnimatorAvatar._retargetAnimationKeys`** to the leg tracks. It emits `.char110-native-walk.json` *without touching the deployed runtime clip*, to be measured by the same longitudinal gait audit. Only after the native result is substantially more symmetrical, and the existing leg-side and shoe-heading gates remain valid, may it replace the current lower-body track. The accepted CHAR-109 idle shoulders, CHAR-110D elbow treatment, single Rapier capsule and physics/debug settings remain unchanged.

## New acceptance gate required before preview
- Both feet take turns leading naturally (nominal 45–55% of measurable cycle on each side, with allowance for non-leading transitions).
- Forward vs backward maximum lead excursions are broadly symmetric (initial target ratio 0.75–1.35, not the present 0.282 ratio).
- No lateral crossing, toe heading regressions, knee reversals, discontinuity at loop join or standing-pose regression.
- Pelvis authored translation considered and measured independently.
- If full lower-body native retarget still fails, do not silently force another sinusoidal gait. Record the measurements and investigate source/target rest poses or author a properly retargeted GLB via a rig-aware offline workflow.
- Foot IK must remain optional and not be necessary for the character to walk.

## Change-control boundary
Previous experimental user preview `gtd-5951rmvzc-interlinkglobaltech.vercel.app` remains the historical reference for right-step/catch-up behavior. Research instrumentation and offline retarget A/B run on a separate branch. No changes to `main`, no production preview claim before the new gait gate passes.
