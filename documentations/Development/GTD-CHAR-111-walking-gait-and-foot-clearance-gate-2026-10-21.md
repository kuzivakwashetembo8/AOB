# GTD Character Capability Transfer Program — CHAR-108–114
Date: 2026-10-21
Branch: feat/char-105-human-walking-toggle-20261020
State: planning first, implement 108/109 only; no main merge

Evidence: GTD human source glTF reports 73 bones and names LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Earlier shoulder-pushing patches CHAR-105–107 failed; latest source-bone attempt showed T-pose. Preserve established movement facing direction. Josh ref: interlinkglobal/three-player-controller example/glTF.js and src/PlayerController.ts / AnimationSystem.ts / FootIK.ts. Josh example config: idle1, walk, run, jump/Jump_Loop/Jump_Land, fly/flyIdle/directional hovering, Driving_Loop, head mixamorigHead. These are configured clip references, not proof GTD's human contains them.

No production changes. Babylon + Rapier remain unless evidence demonstrates movement mechanics failure, not skinning, animation, or asset limitations.

## CHAR-111 — Walking Gait and Foot-Clearance Gate

Replace CHAR-105 vertex-based simulated legs and foot dragging with evaluated native or safely retargeted Walk animation, including foot lift/plant, knee flexion, pelvic compensation and grounded capsule synchronization. Measure stride speed at 3.8m/s and animation cadence. Foot IK is a separate terrain correction, not a substitute for swing-phase stepping. Acceptance: front/back/side video, no sliding, preserved movement heading.

Phase order: 108 → 109 → 110 → 111 → 112 → 113 → 114. Gate: NOT AUTHORIZED for implementation in this pass.
