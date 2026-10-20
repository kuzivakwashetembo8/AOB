# GTD Character Capability Transfer Program — CHAR-108–114
Date: 2026-10-21
Branch: feat/char-105-human-walking-toggle-20261020
State: planning first, implement 108/109 only; no main merge

Evidence: GTD human source glTF reports 73 bones and names LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Earlier shoulder-pushing patches CHAR-105–107 failed; latest source-bone attempt showed T-pose. Preserve established movement facing direction. Josh ref: interlinkglobal/three-player-controller example/glTF.js and src/PlayerController.ts / AnimationSystem.ts / FootIK.ts. Josh example config: idle1, walk, run, jump/Jump_Loop/Jump_Land, fly/flyIdle/directional hovering, Driving_Loop, head mixamorigHead. These are configured clip references, not proof GTD's human contains them.

No production changes. Babylon + Rapier remain unless evidence demonstrates movement mechanics failure, not skinning, animation, or asset limitations.

## CHAR-109 — Native Neutral-Pose Controller

Establish a relaxed neutral A-pose using the owner's LeftShoulder/RightShoulder, LeftArm/RightArm and forearm hierarchy, original glTF bind/local transforms and skinning. Prefer the existing authored idle clip if verified and visually neutral. Otherwise compute bone-space upper-arm corrections using rest-local quaternions and transform directions in ancestor space; never modify skinned vertex positions or guess shoulder coordinates from bounding boxes. Keep a persistent neutral-pose controller invoked after pose resets, with idempotence, safe failure when joints unavailable and diagnostics of applied joints. Acceptance: shoulders and upper arms hang anatomically at sides, no jacket deformation, no T-pose, both witness and controlled actor correct; first visual checkpoint. Walking legs unchanged.

Phase order: 108 → 109 → 110 → 111 → 112 → 113 → 114. Gate: implement and verify separately; no automatic owner acceptance.
