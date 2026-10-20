# GTD Character Capability Transfer Program — CHAR-108–114
Date: 2026-10-21
Branch: feat/char-105-human-walking-toggle-20261020
State: planning first, implement 108/109 only; no main merge

Evidence: GTD human source glTF reports 73 bones and names LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Earlier shoulder-pushing patches CHAR-105–107 failed; latest source-bone attempt showed T-pose. Preserve established movement facing direction. Josh ref: interlinkglobal/three-player-controller example/glTF.js and src/PlayerController.ts / AnimationSystem.ts / FootIK.ts. Josh example config: idle1, walk, run, jump/Jump_Loop/Jump_Land, fly/flyIdle/directional hovering, Driving_Loop, head mixamorigHead. These are configured clip references, not proof GTD's human contains them.

No production changes. Babylon + Rapier remain unless evidence demonstrates movement mechanics failure, not skinning, animation, or asset limitations.

## CHAR-109 — Native Neutral-Pose Controller

Establish a relaxed neutral A-pose using the owner's LeftShoulder/RightShoulder, LeftArm/RightArm and forearm hierarchy, original glTF bind/local transforms and skinning. Prefer the existing authored idle clip if verified and visually neutral. Otherwise compute bone-space upper-arm corrections using rest-local quaternions and transform directions in ancestor space; never modify skinned vertex positions or guess shoulder coordinates from bounding boxes. Keep a persistent neutral-pose controller invoked after pose resets, with idempotence, safe failure when joints unavailable and diagnostics of applied joints. Acceptance: shoulders and upper arms hang anatomically at sides, no jacket deformation, no T-pose, both witness and controlled actor correct; first visual checkpoint. Walking legs unchanged.

Phase order: 108 → 109 → 110 → 111 → 112 → 113 → 114. Gate: implement and verify separately; no automatic owner acceptance.

## Engine root cause and implementation
Babylon glTF skinning documentation specifies bones are linked to TransformNodes and their transforms are continually copied from the nodes. The previous CHAR-107 direct Bone.rotate() operated on a non-authoritative object and was overwritten. Correct solution is to aim linked LeftArm/RightArm TransformNodes in the coordinate frame of their linked parent, using measured shoulder-to-elbow joint positions and bone-rest orientation. Preserve original skinning, vertices, jacket geometry and all GLB assets.

Implementation CHAR-109 uses findLinkedArms109 and parentSpaceAimDelta, retaining a stable quaternion for each upper arm. Both arms must calibrate and improve direction to down-at-sides; otherwise fail closed rather than leave an asymmetric pose. A persistent ensure() invoked through character control restores the two saved neutral quaternions if changed; it must not accumulate rotations. Existing experimental leg motion, physics, heading and Settings switch are unchanged. Do not merge before actual visual front/side/rear confirmation.

Source: Babylon Documentation glTF Skinning https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/importers/glTF/glTFSkinning.md
