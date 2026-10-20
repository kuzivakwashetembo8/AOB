# GTD-CHAR-105 — Imported Human Controller / Walking Gate
Date: 2026-10-20
Branch: feat/char-105-human-walking-toggle-20261020
Status: experimental preview; walking verification only. Main unchanged.

## Objective
Reuse the already imported owner-character character.glb at Mercer Street as a
selectable actor through Settings > Controls > Enable Character. Keep the working
UAL humanoid as the default. Do not add another physics character controller,
duplicate game loading, or alter vehicles, roads, canopies, building finishes.

## Behavior
- The Settings switch is persisted with default OFF. When enabled while in normal
  walking mode, save the humanoid's world position and heading, hide its visible
  model, teleport the existing Rapier kinematic actor to the human's Mercer
  Street position and follow it with the existing camera and movement controls.
- Reuse WASD/arrows/touch movement for normal walking speed 3.8 m/s.
  Apply original world collider logic, ground, camera, headed travel.
- On disable, return the imported human to the Mercer spot, restore the prior
  humanoid pose and the same saved Rapier player position. Do not multiply actor
  bodies, collision state, or GLB assets.
- The imported model's T-pose is changed by a bounded reversible per-vertex
  pose cache. Arm lowering is always applied even without identifiable GLB
  armature; two alternate walking leg poses are interpolated at <=~11 updates/s
  while moving. Imported source animation groups remain stopped. This is a
  procedural verification pose, not proof of a properly animated character rig.
- Flying and entering vehicles are deliberately blocked while Character mode is
  enabled. These abilities remain on the UAL humanoid pending separate tests;
  prior driving and flight implementation is not modified.
- Switching while already driving or flying is refused.
- Walking is the only accepted initial exercise. No assumption about actual
  source GLB animation clips. Profiling should verify this local deformation
  does not meaningfully hurt FPS or memory.

## Visual acceptance
1. Imported character visibly lowers both arms, doesn't T-pose.
2. Enable Character shifts playable movement/camera to Mercer model.
3. Arrow keys/WASD and touch move the same physically grounded model, with
   alternating leg stride instead of sliding entirely rigid.
4. Disable restores the original humanoid, its prior location and controls;
   no duplicate or frozen players.
5. Default OFF retains the previous production state and controls.
6. Rapier, vehicle, first-frame, offline and performance telemetry regressions.
7. No merge until owner confirms appearance and walking fidelity.

## Known risk
The source character GLB has not been established to have a complete named
humanoid skeleton or reusable Walk clip. The procedural mesh deformation is a
visual-only experimental substitute. If a proper skeletal asset becomes
available, replace this with rigged per-bone motion, without changing controller
ownership.
