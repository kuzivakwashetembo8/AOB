> **CURRENT DIRECTIVE — 2026-10-21 RETARGETING PIVOT:** The owner visually rejected the CHAR-110 sine/joint-procedural walking preview (moonwalking/no effective foot lift, no arm swing, over-fast translation). Procedural full-body gait is **not** an accepted primary solution. Read `documentations/Issues/GTD-CHAR-110-111-Procedural-Walk-Failure-Register-and-Retarget-Pivot-2026-10-21.md` and `documentations/Development/GTD-CHAR-110-Retargeting-First-Trajectory-Decision-2026-10-21.md` BEFORE modifying walking. Prefer validated offline UAL/Josh animation retargeting. Preserve CHAR-109 accepted standing. Historical instructions below are preserved for chronology and may be superseded.

# GTD Character Capability Transfer Program — CHAR-108–114
Date: 2026-10-21
Branch: feat/char-105-human-walking-toggle-20261020
State: planning first, implement 108/109 only; no main merge

Evidence: GTD human source glTF reports 73 bones and names LeftShoulder, LeftArm, LeftForeArm, RightShoulder, RightArm, RightForeArm. Earlier shoulder-pushing patches CHAR-105–107 failed; latest source-bone attempt showed T-pose. Preserve established movement facing direction. Josh ref: interlinkglobal/three-player-controller example/glTF.js and src/PlayerController.ts / AnimationSystem.ts / FootIK.ts. Josh example config: idle1, walk, run, jump/Jump_Loop/Jump_Land, fly/flyIdle/directional hovering, Driving_Loop, head mixamorigHead. These are configured clip references, not proof GTD's human contains them.

No production changes. Babylon + Rapier remain unless evidence demonstrates movement mechanics failure, not skinning, animation, or asset limitations.

## CHAR-110 — Retargeting Compatibility Gate

Audit Josh's josh.glb bind matrices, bone naming and clip channels versus GTD human. Build a source-to-target anatomical bone mapping, parent-axis/handedness/scale compensation, and coordinate-frame compatibility checks. Use a test-driven retargeter only if joint hierarchy and rest orientations can be reconciled. Reject naive copy-paste animation tracks. No importing Josh character art as Voight.

Phase order: 108 → 109 → 110 → 111 → 112 → 113 → 114. Gate: NOT AUTHORIZED for implementation in this pass.
