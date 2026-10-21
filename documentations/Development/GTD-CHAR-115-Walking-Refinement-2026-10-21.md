# CHAR-115 — Walking refinement — 2026-10-21

Status: accepted by Harmony on 2026-10-21; merge and production deployment authorized.
Branch: codex/char115-walking-refinement.
Baseline: accepted CHAR-110E main commit 60c2523c7b029c9ad5edf0f867c7eb58391abc8f.

## Requested corrections
Keep the head straight along travel; correct the left upper-arm/elbow orientation; remove right wrist bending/twisting during walking.

## Findings
CHAR-110D in scripts/char110-verify-leg-lanes.mjs reverses RightForeArm and counter-rotates RightHand. That compensation preserves the earlier palm orientation but introduces a dynamic wrist rotation. The left forearm did not receive the equivalent elbow correction. The target GLB has bilateral joint frames related by X reflection: quaternion (x,y,z,w) becomes (x,-y,-z,w). Small bind-pose differences remain in forearms and hands.

## Implementation
Runtime playback mirrors the accepted right shoulder/upper arm/forearm absolute local rotations onto the left at half-cycle phase. This transfers both elbow flexion direction and upper-arm orientation without imposing same-phase arm motion. Both wrists use the relaxed right wrist reference (mirrored on the left), following the forearms without extra wrist animation. Original rest rotations are restored when stopping/resetting. Head orientation is stabilized relative to the actor root by counteracting the animated ancestor rotation; actor heading is retained.

No source mesh, skin weights, stride tracks, cadence, or vehicle logic is changed.

## Validation
Existing playback tests: 2 passed.
Actual character.glb hierarchy + deployed accepted 41-frame clip: 160 samples; head angular drift <= 2.99e-8 rad, right wrist local angular drift 0; arm swing remains active; reset restores standing.
The regression test reconstructs all source TransformNodes and skin bones, applies the accepted neutral controller, and stresses the real walk player with a deterministic 41-frame clip. The accepted deployed clip was also checked locally against the actual rig; the repository test does not depend on generated UAL files that only exist after prebuild.
Harmony reviewed the preview and confirmed: “This is much better, the elbow issue has been fixed.” This confirms the elbow correction; further walking refinements may still follow.

## Review checkpoint
Accepted preview: https://gtd-h76rt18fr-interlinkglobaltech.vercel.app/game
Tested runtime commit: 814780af59da9aa0825b1b1c09a390e107dbc4ae.
Harmony authorized documenting the improvement, merging to main, and deploying production.

## Defect location and recovery lesson
- Elbow asymmetry originated in the retarget correction pipeline: `scripts/char110-verify-leg-lanes.mjs` inverted only `RightForeArm`, leaving the left chain with a different bend convention.
- The same block applied a compensating `RightHand` quaternion each frame; that preserved an earlier palm-facing target while producing the unwanted wrist bend/twist during walking.
- Head rotation in `src/game/character/retargeted-walk-110.ts` previously accumulated both the sampled head rotation and animated pelvis/spine/neck rotations, allowing tilt relative to travel.
- The accepted fix resides in `src/game/character/retargeted-walk-110.ts`: mirrored half-cycle arm playback, relaxed wrists, and actor-root-relative head stabilization. The GLB mesh itself was not defective or rewritten.
- Future retarget changes should check both limb chains in their actual mirrored local frames, and evaluate elbow and wrist together rather than retaining a compensation solely because the palm facing was previously accepted.
