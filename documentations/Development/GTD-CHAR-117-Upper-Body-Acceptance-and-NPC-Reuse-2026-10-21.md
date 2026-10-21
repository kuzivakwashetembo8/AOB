# CHAR-117 — Accepted Upper-Body Posture and NPC GLB Reuse

Date: 2026-10-21 (Africa/Johannesburg).
Status: fully accepted by Harmony for Voight's standing and walking upper body; merge and production deployment authorized.
Accepted runtime: 4ee747980aa3c7fb6383d246c353d730aff8f069.
Reviewed preview: https://gtd-or9b1p15j-interlinkglobaltech.vercel.app/game
Asset: public/GLBs/Characters/character.glb.
Branch: Walking-Posture-Refinement.

## Acceptance gate and remaining scope

Harmony: “Significantly improved. Fully accepted. Merge with main and deploy.”
Harmony: “The upper body movement has been perfected. What remains is the stride (lower body) however this is significant acceptance gate that should be documented and merged.”

Standing upper-body posture, walking arm movement, elbows, shoulders and accepted palm facing are the preservation baseline. Lower-body stride refinement remains open. Earlier CHAR-116 lower-body acceptance preserved an improvement; it does not close the new stride refinement request. No further gait implementation is included in this release. Future stride changes must retain the accepted upper-body appearance and opposite arm/leg coordination.

The original CHAR-117 observation-only instructions and CHAR-116 no-deployment instruction are historical records. This explicit acceptance authorizes merging and deploying the complete accepted runtime plus this documentation.

## Source map

| Responsibility | Source |
| --- | --- |
| Linked-joint discovery, neutral arm calibration, palm preservation and pose ownership | src/game/character/native-neutral-pose-109.ts |
| World-direction to parent-local quaternion calculation and transform validation | src/game/character/driver-joint-space.ts |
| Offline-retargeted clip playback, cycle centering, bilateral timing, wrists and head | src/game/character/retargeted-walk-110.ts |
| Actual character-rig regression | src/test/char116-walking-posture.test.ts |
| Existing linked-node and walking regression | src/test/char109-linked-neutral-pose.test.ts; src/test/char115-walking-refinement.test.ts |
| Offline walk source generation | scripts/char110-bake-ual-walk.mjs; scripts/char110e-native-bake.mjs; scripts/char110e-activate-native.mjs |
| Before/after skinned diagnostic | CHAR-117-torso-skinned-comparison.png |

## Mechanism that reached acceptance

The successful result combines the previously established CHAR-109/115/116 playback with the CHAR-117 articulated neutral pose. It is not a new GLB, a skin-weight edit or a new source animation.

The failed predecessor used an upper-arm outward ratio of 0.06 per unit down, then rolled each forearm +/-0.24 radians around the wrist axis. That moved measured joints but did not create the required visible shoulder–elbow–wrist contour. CHAR-117 replaces that axial forearm roll with an independently aimed, gently bent forearm and increases upper-arm clearance.

### 1. Operate on linked TransformNodes

Normalize bone names to lowercase alphanumerics, identify LeftArm/RightArm and LeftForeArm/RightForeArm, and verify that each forearm descends from its upper arm within eight ancestors. Resolve each bone's getTransformNode(). These linked nodes are authoritative under Babylon's glTF loader: rotating only Bone objects can be overwritten by skeleton.prepare().

Voight has 73 skin joints. The tested hand path requires the linked Hand node to be a direct child of ForeArm. Preserve original mesh vertices, bind matrices, joint translations, skin weights and material data.

### 2. Capture the accepted palm frame before changing the arm

The exact Voight reference uses the earlier neutral upper-arm aim: normalized (-0.10,-1,0) for the named left arm and (+0.10,-1,0) for the named right arm. Temporarily apply that aim, capture the hand world matrix, then restore the original upper-arm quaternion before the new calibration.

Those name-based signs and world directions are a legacy reference specific to Voight's accepted palm pose; they are not a universal left/right convention. For another GLB, establish and capture its desired palm frame explicitly.

### 3. Derive outward from anatomy and articulate the upper arm

Compute the vector from the opposite upper-arm origin to this upper-arm origin, flatten Y and normalize. This is outward; do not infer its sign from the bone name.

Let O be that outward unit vector and D=(0,-1,0). The accepted upper-arm target direction is:

    normalize(0.24 * O + D)

The 0.24 ratio corresponds to approximately 13.5 degrees outward from vertical. Measure the actual shoulder-to-elbow world vector, solve the delta in the upper arm parent's frame with a 2.15 radian maximum, then apply:

    upperTarget = normalize(delta * upperOriginal)

Recompute linked world matrices and reject a candidate if it increases the aiming error. The shoulder node itself is not raised or rotated by neutral calibration.

### 4. Aim the forearm independently; do not merely twist its surface

After upper-arm calibration, measure the actual elbow-to-wrist world vector. Derive forward F by transforming local +Z through the torso ancestor (the upper-arm parent's parent), flatten Y and normalize. Voight is upright in a Y-up scene and that ancestor has the audited forward basis.

The accepted forearm target direction is:

    normalize(0.08 * O + D + 0.20 * F)

Solve that direction in the forearm parent's frame, which is the upper-arm node, with a 0.65 radian maximum. Apply:

    forearmTarget = normalize(elbowDelta * forearmOriginal)

A stronger lateral upper-arm cant plus a smaller lateral forearm cant and a small forward component produces an elbow that is distinct from the waist and a gentle forearm bend. It creates the visible opening above the hands without requiring a shoulder shrug.

### 5. Restore palm facing through the wrist's parent frame

With the corrected forearm world matrix, compute the local hand matrix using Babylon's matrix order:

    handLocal = acceptedPalmWorld * inverse(correctedForearmWorld)

Decompose that matrix and apply its normalized rotation quaternion to the hand. Do not replace joint translation or scale. The accepted standing palm orientation is retained to floating-point tolerance. During walking, the wrist remains fixed relative to its corrected forearm; the palm follows the swinging arm naturally rather than being locked in world space.

Store original and target rotations. If either arm's calibration fails, restore the stored original rotations for both arms rather than leaving a unilateral correction. ensure() restores fixed target quaternions when overwritten, rather than adding rotations repeatedly. The walking player must own moving-arm playback while active; do not reassert a static neutral pose after every walking update. reset() restores the captured bases.

### 6. Preserve the established moderate, coordinated walking playback

createWalkPlayer110 captures its bases after the neutral correction. It consumes the validated 41-sample offline-retargeted UAL walk clip and applies quaternion deltas to those bases.

For Arm, ForeArm and Shoulder tracks, form a hemisphere-aligned normalized quaternion sum over the first 40 keys, excluding the duplicate cycle endpoint. This is the cycle center. At each interpolated phase:

    centered = normalize(sample * inverse(center))
    delta = slerp(identity, centered, gain)
    movingPose = normalize(delta * correctedBase)

| Track | Accepted walking gain |
| --- | --- |
| Upper arm | 0.42 |
| Forearm | 0.35 |
| Shoulder | 0.55 |

This removes the old persistent forward bias and reduces excessive excursion while preserving source timing. The source keys remain unchanged.

Voight's bilateral frames were audited as X reflections. The left Shoulder/Arm/ForeArm/Hand chain is derived from the right chain half a cycle later, reflecting quaternion (x,y,z,w) to (x,-y,-z,w), including the corrected absolute neutral base. The right hand uses its base quaternion; the left hand uses the reflected right-hand base. This mirrored half-cycle preserves opposite-side timing. The X-reflection mapping is Voight-specific and must not be copied to a different rig without auditing its frames.

The player blends in/out over 0.20 seconds, treats speed above 0.12 m/s as moving, caps dt at 0.05 seconds and scales cadence by speed/1.5 within [0.35,1.35]. Existing head stabilization preserves the neutral head orientation relative to the actor root while the torso moves. These are retained playback settings, not new CHAR-117 modifications.

### 7. Use parent-local rotations correctly

parentSpaceAimDelta transforms BOTH original and desired world direction vectors through the inverse parent linear transform before forming their cross product. This is necessary when reflected joint frames are present; transforming a world-space cross-product axis afterward can give the wrong sign.

The helper accepts orthogonal, uniformly scaled parent frames, including reflection. It rejects nonuniform scale beyond a 1.001 ratio, shear, near-zero directions and ambiguous near-antiparallel directions. Do not bypass these checks to force an unfamiliar NPC rig through Voight's calibration.

## Exact accepted profile

| Parameter | Voight value |
| --- | --- |
| Upper direction | normalize(0.24 outward + down) |
| Forearm direction | normalize(0.08 outward + down + 0.20 forward) |
| Upper aim cap | 2.15 rad |
| Forearm aim cap | 0.65 rad |
| Walking arm / forearm / shoulder gains | 0.42 / 0.35 / 0.55 |
| Bilateral phase offset | Half a cycle |
| Hand policy | Preserve accepted standing world frame; fixed corrected local wrist during walking |
| Geometry policy | Original GLB, bind matrices and skin weights unchanged |
| Lower-body changes in CHAR-117 | None |

## Reuse procedure for future NPC GLBs

1. Audit the actual GLB before calibration: semantic bone mapping, linked-node hierarchy, joint local axes, actor forward/up, scale and reflections, hand parentage, bind matrices, skin weights, available animation tracks and clothing volume.
2. Map its upper-arm/forearm/hand semantics to this controller. The current discovery recognizes normalized LeftArm/RightArm/LeftForeArm/RightForeArm/LeftHand/RightHand names; other naming schemes need an adapter.
3. Establish the NPC's accepted palm reference. Do not reuse Voight's legacy name-sign capture blindly.
4. Use Voight's direction ratios and gains as the initial profile. Recalibrate directions and clearance for the NPC's proportions, sleeve volume and joint bases. The existing controller assumes Y-up, an upright calibration pose and the audited torso +Z direction.
5. Retarget locomotion to that NPC's bind frames. Reuse the half-cycle X-reflection only if its bilateral joint frames satisfy the same reflection relationship; otherwise compute a suitable basis mapping or retain independently validated bilateral tracks.
6. Construct the neutral controller first and capture the walking bases afterward. Keep ownership of neutral calibration, moving playback and reset explicit so controllers do not fight.
7. Validate actual skinned silhouettes from matched front, side and three-quarter views at rest and throughout a full walk cycle. Inspect elbow bend, armpit-to-waist clearance, palm facing, sleeve deformation and opposite-leg arm timing together.
8. Compare protected torso/leg transforms, verify reset and transition behavior, run regression and type checks, and obtain an NPC-specific visual acceptance. Preserve this accepted Voight implementation as the reference.

The process is reusable. The current constants, legacy palm signs, semantic-name mapping and quaternion reflection have only been accepted for Voight; this release does not claim that arbitrary GLBs are automatically supported.

## Verification and preservation evidence

- Three targeted regression files, five tests passed; targeted controller TypeScript check passed.
- Actual-rig checks retain palm orientation, outward elbow clearance above 0.055 m and a gentle 0.18–0.45 rad arm/forearm bend, while leaving non-arm neutral rotations unchanged.
- Standing plus 160 sampled walk phases: pelvis, torso, head and lower-body world matrices exactly match the pre-CHAR-117 baseline (maximum difference 0).
- CPU skinning of original GLB triangles was inspected in matched views. The candidate frontal gap beside the waist at world Y=1.12 m stayed approximately 0.028–0.047 m across those samples. These measurements are diagnostic and specific to this asset/pose, not an NPC-wide gap requirement.
- The Vercel preview built successfully and /game returned HTTP 200.
- Harmony subsequently reviewed that preview and fully accepted its upper body. This human review closes the acceptance gate that numerical checks alone could not close.

Future stride work must compare against runtime 4ee747980aa3c7fb6383d246c353d730aff8f069 and protect this upper-body result. A changed gait may require phase coordination review even when arm code remains unchanged.
