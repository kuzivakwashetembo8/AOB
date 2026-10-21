# GTD CHAR-110D — Elbow/Foot Forward Alignment and Physics/Foot IK Inspection
Date: 2026-10-21
Branch: `feat/char-110d-ik-geometry-debug-20261021`
Status: experimental; owner visual acceptance required before merge.

## Context, accepted gains and remaining defects
Previous CHAR-110C corrected actual pelvic left/right centerline crossing; both legs stay in their respective lanes across the 41-frame baked walk clip. The owner confirmed improvement but supplied six screenshots of actual Voight walking and comparison to the fork's `example/footIK.html` demonstration.

Owner-observed CHAR-110D defects:
1. Right elbow moves inward with the wrong bend facing, while right palm facing already looks correct. Walking arm swing must look anatomically natural; no artificial stationary hand or extreme elbow.
2. Lower right leg and shoes turn inward, left shoe also angles outward. Toe/shoe heading must follow the character's travel direction.
3. UAL Foot IK reference demonstrates predictive contacts, debug geometry and adjustable pelvis/foot reach; settings need real physics/Foot IK debugging access.

Preserve: new authored gait and foot lift, CHAR-110C lane separation, CHAR-109 relaxed neutral, 1.5 m/s speed, full GLB identity, shared Rapier player capsule, 41-sample/1.3333-second authored walk and arm movement. Stride-length reduction remains deferred.

## Source and engineering decisions
Re-read `three-player-controller/example/footIK.js` plus `src/plugins/foot-ik/FootIK.ts`. The fork's player runs animation before IK; its foot plugin resolves authored hip/thigh/calf/foot/toe joints, casts ground rays, uses phase/stance detection, optional predictive placement and visual debug markers. Source uses Three.js, but GTD already uses Babylon.js and Rapier; port the *behavioral interfaces*, not the rendering/physics engine.

### Animation correction
`scripts/char110-verify-leg-lanes.mjs` continues to operate on the **real** UAL-retargeted `char110-ual-walk.json` after existing CHAR-110C lane correction. For the right forearm only, invert its idle-relative rotation delta to reverse the problematic bending sense; compose its inverse relative bone transform at `RightHand` to preserve palm facing in world skeletal space. Validate hand orientation mathematically. The patch does not change right shoulder or left arm neutral rest.

For shoe orientation, check each foot-to-toe direction projected into the target pelvis reference plane and search for minimum bounded ankle yaw towards the validated forward (-Z) axis. Do not rotate hips, root/camera or alter the ankle's Y translation. Validate both lateral foot lanes again after corrections. Numerical bone vectors are a proxy for shoe facing; owner must verify actual skinned shoe mesh.

### Physics and Foot IK settings
`src/ui/menus/settings-state.ts` and `settings-editor.tsx` add **Physics & Foot IK** beside existing categories. Existing game physics remains active, not separately turned off. Opt-in settings expose live collision ground points, actual kinematic player capsule geometry, left/right ankle and knee markers, detected ground contacts, predictive target markers, ray reach and prediction horizon. All are **off by default** and persisted to the existing settings store. `src/routes/game.tsx` sends changes through the existing RuntimeBridge; no page reload or extra world.

`src/game/physics/rapier-world.ts` exposes a ray against the real Rapier `World`, excluding the player's own capsule to avoid self-hits. `src/game/character/foot-ik-inspector-110.ts` renders optional Babylon spheres and a wireframe Rapier-equivalent capsule, after authored walking animation has been evaluated. Predictive probes use measured per-frame player displacement and raycast at the candidate future foot location. Markers are disposed, hidden when switching to default UAL, and do not affect gameplay colliders.

**Deliberate staged limitation:** this is a Foot IK inspection / predictive landing probe layer, **not yet a two-bone IK or stance-foot lock**. The settings say so explicitly. Do not present a ground marker as actual foot correction or claim a planted-foot solution. Next CHAR-111 gate may implement target-driven knee/ankle IK, pelvis adjustment, prediction for curbs, and surface-normal sole fitting after geometric diagnostics are accepted.

## Build and visual gates
1. Strict TS, all Vitest, source GLB bake and CHAR-110C lane checks; new marker lifecycle test must pass.
2. Source bake logs must contain `CHAR110_ELBOW_DIRECTION`, `CHAR110_SHOE_FORWARD` and `CHAR110_SHOE_LANES_AFTER` with finite values and zero centerline violation.
3. Actual mobile and desktop visual feedback on elbow bend, **palms remain correctly facing**, feet/shoes forward and gait foot lift. The model must return to CHAR-109 neutral at stop.
4. Pause → Settings → Physics & Foot IK: enable diagnostics; verify actual markers and capsule visible in-world; disable and confirm no residual meshes. Predictive targets only with motion. Confirm no unexpected load/FPS regressions.

Do not merge to main without explicit owner acceptance. Prior rejected procedural walking is permanently recorded in `documentations/Issues/GTD-CHAR-110-111-Procedural-Walk-Failure-Register-and-Retarget-Pivot-2026-10-21.md`.
