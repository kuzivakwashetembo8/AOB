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

## Confirmed GLB result and CHAR-107 patch
The read-only GLB 2.0 JSON audit completed successfully on the Vercel build host.
Actual `public/GLBs/Characters/character.glb`: 12,197,104 bytes; 86 nodes;
**one skin with 73 joints**; explicit `LeftShoulder`, `LeftArm`,
`LeftForeArm`, `RightShoulder`, `RightArm`, `RightForeArm` joints.
The earlier assumption that a usable humanoid rig might be absent was WRONG.
This is not a mesh-only source.

CHAR-107 corrective attempt:
- Keep all source skin weights, authored vertices, original jacket topology and
  upper-body bind geometry intact. Stop the previous upper-arm geometric
  heuristics entirely: no percent-of-height guessed shoulder deformation.
- Invoke the existing `lowerStaticCharacterHands(entries.skeletons)` on the
  instantiated native armature after stopping source animation groups.
  Reorient only each real LeftArm / RightArm upper-arm bone toward down-at-sides,
  carrying forearms and hands with their joint hierarchy.
- Keep the existing lower-leg experimental phase, controller ownership,
  walking direction, and settings toggle unchanged. Actual foot stepping
  remains deliberately out of scope.
- Runtime diagnostics show the number of adjusted arm bones; expected TWO.
- New tests assert no upper-body vertex modifications in all phases and verify
  the exact source GLB contains the named native arm joints.
- The native rig is a capability, not proof that our procedural skeletal
  rotation produces an anatomically accepted neutral pose; owner preview is
  required. No merge authorization implied.

## Confirmed authored animation inventory (read-only audit, next build)
The source GLB has **zero authored animation clips** (animations = []). It
therefore has no embedded neutral idle or walk animation. Its 12 skinned meshes
and 73-joint armature are the actual supported posture mechanism. The nested
LeftShoulder > LeftArm > LeftForeArm and mirrored right-side chains are native
asset data; the previous custom shoulder vertex-warp is no longer appropriate.

## CHAR-107 verification
CI deployment for code commit 6769b5573a0fe6c35c1829257a4db5e5efb82b64
completed successfully on the isolated preview, including TypeScript, Vitest
and offline packaging: 433 game files; 0 missing mandatory resources.
This is **not** owner visual acceptance; the native joint correction is pending
front/side/rear inspection in GTD. Foot lifting and locomotion refinement remain
deferred. Main intentionally unchanged.
