# GTD Character Capability Transfer Program — CHAR-108–114
Date: 2026-10-21
Branch: feat/char-105-human-walking-toggle-20261020
State: planning first, implement 108/109 only; no main merge

Evidence: GTD human source glTF reports 73 bones and names LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Earlier shoulder-pushing patches CHAR-105–107 failed; latest source-bone attempt showed T-pose. Preserve established movement facing direction. Josh ref: interlinkglobal/three-player-controller example/glTF.js and src/PlayerController.ts / AnimationSystem.ts / FootIK.ts. Josh example config: idle1, walk, run, jump/Jump_Loop/Jump_Land, fly/flyIdle/directional hovering, Driving_Loop, head mixamorigHead. These are configured clip references, not proof GTD's human contains them.

No production changes. Babylon + Rapier remain unless evidence demonstrates movement mechanics failure, not skinning, animation, or asset limitations.

## CHAR-112 — Running and Jump Transitions

Implement walk/run acceleration transitions, authored/retargeted running cycle, jump start/air loop/landing pose, movement physics synchronization and state blending. Reuse existing Rapier capsule and traversal constraints unless measured failures prove it cannot satisfy requirements. Compare Josh three-stage jump logic only after CHAR-111 passes.

Phase order: 108 → 109 → 110 → 111 → 112 → 113 → 114. Gate: NOT AUTHORIZED for implementation in this pass.
