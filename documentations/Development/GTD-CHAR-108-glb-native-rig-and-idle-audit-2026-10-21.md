# GTD Character Capability Transfer Program — CHAR-108–114
Date: 2026-10-21
Branch: feat/char-105-human-walking-toggle-20261020
State: planning first, implement 108/109 only; no main merge

Evidence: GTD human source glTF reports 73 bones and names LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Earlier shoulder-pushing patches CHAR-105–107 failed; latest source-bone attempt showed T-pose. Preserve established movement facing direction. Josh ref: interlinkglobal/three-player-controller example/glTF.js and src/PlayerController.ts / AnimationSystem.ts / FootIK.ts. Josh example config: idle1, walk, run, jump/Jump_Loop/Jump_Land, fly/flyIdle/directional hovering, Driving_Loop, head mixamorigHead. These are configured clip references, not proof GTD's human contains them.

No production changes. Babylon + Rapier remain unless evidence demonstrates movement mechanics failure, not skinning, animation, or asset limitations.

## CHAR-108 — GLB Native Rig and Idle Audit

Capture the owner character.glb glTF JSON inventory: source SHA/bytes, nodes, skinned mesh primitives, joints, bind matrices, skin attributes and exact animation names/channels. Verify an actual native idle clip only if present; never infer idle from a skeleton or pose screenshot. Compare Josh's named Mixamo hierarchy and animation sources; animation retargeting is not automatically safe. Acceptance: reproducible binary audit, validated capability table, no gameplay modification.

Phase order: 108 → 109 → 110 → 111 → 112 → 113 → 114. Gate: implement and verify separately; no automatic owner acceptance.

## Observed binary result — verified in Vercel asset audit
Actual source: one skin, 73 joints and 12 skinned mesh groups with both JOINTS_0 and WEIGHTS_0. **animations: []** and nativeIdle: null. Thus this character has no native idle/walk/run/fly/driving clips. Source node hierarchy explicitly contains LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Exact source quaternions and local translations were logged as CHAR108_GLB_EVIDENCE by the binary audit.

Josh's glTF demo references idle1, walk, run, three-stage jump, directional flight and Driving_Loop. These are configured for the fork's Josh asset, not for the GTD human. Clip retargeting remains deferred to CHAR-110.
