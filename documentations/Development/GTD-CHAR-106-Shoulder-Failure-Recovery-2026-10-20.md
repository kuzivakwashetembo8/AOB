# GTD-CHAR-106 — Shoulder Posture Failure, Prior Patches and Recovery Audit
Date: 2026-10-20
Branch: feat/char-105-human-walking-toggle-20261020
Status: INVESTIGATING; do not merge without owner visual acceptance.

## Owner-observed failure
Current screenshot (23:06) shows an inflated / flared upper sleeve and shoulder mass while hands are pulled down and inward. Owner supplied a second reference of an anatomically relaxed jacket-wearing man, with shoulders at rest, upper arms vertical at torso, elbows near waist and hands loosely beside thighs. Facing/travel direction **was corrected and is accepted**; preserve it. Foot dragging is acknowledged but deferred until standing/moving posture acceptance. The new human remains optional under Settings > Controls > Enable Character.

## Failed attempts (do not repeat without evidence)
1. CHAR-105 initial: infer shoulder position from model height/width and rotate mesh vertices downward ~82°; hands hang but upper arms remain up and walking facing is backward.
2. CHAR-105 direction + posture corrective commit dd107dac59: set playable model's authored-forward compensation to 0, bringing heading into alignment (accepted); shift the guessed shoulder pivot and tighten vertex blending; upper arm jacket silhouette still raised.
3. CHAR-106 previous patch commit 69c9ec1895: move proximal shoulder points in and down with height ratios. Unit tests pass; visual regression worsened: sleeve balloons and shoulder stays outwards; moves hands inward but does not lower true shoulder. Owner explicitly rejected.

## Mechanistic findings
- src/game/character/human-walking-105.ts calls posturePoint105() on raw mesh vertex positions, classifying arms only by world-space x/y and an approximate pivot at cx +/− 0.15 * total model height, sy = ground + .79*height.
- It does not identify arm joints or skin weights; jacket, chest, and sleeves can occupy overlapping projected x/y. Moving selected vertices distorts topology, especially near shoulders.
- src/game/world/mercer-static-character-103.ts already contains lowerStaticCharacterHands(skeletons), a joint-space shoulder→elbow rotation helper, but its current loader never invokes it. Source animation groups are stopped; bespoke per-vertex cache is used instead.
- GTD's existing playable UAL humanoid uses actual skeletons with named Idle_Loop/Walk_Loop clips and animation-group blending; interlinkglobal/three-player-controller fork similarly uses a Three.AnimationMixer and authored idle and locomotion clips, not coordinate-based vertex squeezing. Do not import Three.js just for this fix.
- A GitHub connector cannot directly decode large raw binary GLB data; a local build-time audit must establish skins, joints, animation channels and whether an idle pose truly exists. No assertion of a usable rig is justified before this audit.

## New recovery gate
A. Run read-only GLB binary JSON audit, record exact skin/node/animation capabilities.
B. If compatible skeletal arm bones exist, retire procedural arm vertices for skinned meshes; use actual joint rotations. Preserve original jacket geometry, arm length, mesh skin weights and all gameplay physics; no walking changes.
C. If authored neutral idle exists, prefer it over a computed pose, but confirm it affects the intended model and is not T-pose.
D. If rig or pose is absent, DO NOT invent a complete rig via x/y deformations. Report supported fallback and request a rigged asset or targeted manual rigging.
E. Test static and controlled characters, front / side / rear; unit tests are supporting evidence, not visual acceptance.

No code modifications to main; no accepted road, car, tree, world, input or camera changes.
