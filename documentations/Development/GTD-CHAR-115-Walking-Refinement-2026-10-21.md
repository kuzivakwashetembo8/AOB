# CHAR-115 — Walking refinement — 2026-10-21

Status: experimental; preview approval required before merge.
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
The regression test reconstructs all source TransformNodes and skin bones, applies the accepted neutral controller, and runs the real walk player.
Visual naturalness remains subject to Harmony's preview approval. Numerical orientation checks are not visual acceptance.

## Review checkpoint
One Vercel preview after the three corrections and tests. Do not merge until approved.
