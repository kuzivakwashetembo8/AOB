# GTD Character Capability Transfer Program — CHAR-108–114
Date: 2026-10-21
Branch: feat/char-105-human-walking-toggle-20261020
State: planning first, implement 108/109 only; no main merge

Evidence: GTD human source glTF reports 73 bones and names LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Earlier shoulder-pushing patches CHAR-105–107 failed; latest source-bone attempt showed T-pose. Preserve established movement facing direction. Josh ref: interlinkglobal/three-player-controller example/glTF.js and src/PlayerController.ts / AnimationSystem.ts / FootIK.ts. Josh example config: idle1, walk, run, jump/Jump_Loop/Jump_Land, fly/flyIdle/directional hovering, Driving_Loop, head mixamorigHead. These are configured clip references, not proof GTD's human contains them.

No production changes. Babylon + Rapier remain unless evidence demonstrates movement mechanics failure, not skinning, animation, or asset limitations.

## CHAR-114 — Vehicle Interaction and Character Graduation

Transfer enter/exit and seated human pose to accepted GTD fleet; per-vehicle cabin alignment, steering-wheel hand constraints, legs/foot clearance, no leaked colliders, performance and offline regression. Comprehensive desktop/mobile smoke test and reversible Settings Enable Character toggle. Accept human as default only after full ability parity and controlled performance. Babylon.js and Rapier are not replaceable on a presentation failure: replacement requires reproducible physics/controller inadequacy, comparative prototype and risk/cost approval.

Phase order: 108 → 109 → 110 → 111 → 112 → 113 → 114. Gate: NOT AUTHORIZED for implementation in this pass.
