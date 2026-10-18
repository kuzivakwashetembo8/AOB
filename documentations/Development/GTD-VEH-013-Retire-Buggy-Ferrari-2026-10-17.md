# VEH-013 — Retire Buggy and Ferrari from playable Meridia
**2026-10-17 | Branch** `feat/veh012-authentic-wheel-extraction-20261017`

## Owner directive
Stop loading Buggy and Ferrari. Remove them from the game. Keep the four other original GLB vehicles and their inherited driving controller.

## Change
- Remove the active `beginImportedCarEvaluation` call entirely. No `offroad` or `sports` HTTP requests, GLB decode, accepted Ferrari actors, or pending remote `settled` dependency.
- The standard generated First Light game creates **no old parked-car body/cabin/wheel meshes or their Rapier static colliders**. This exclusion occurs *at allocation time*, not by hiding already allocated meshes after creation. Original parked-car plan descriptors are not removed because separate street context placement audits reuse them; they do not imply rendered or collidable cars. Historical directly instantiated world generation retains its default for regression comparisons; the playable world explicitly disables it.
- Retired Buggy/sports checkpoints report `skipped`. `vehicle-loader` only resolves after the **four native local GLBs** actually settle; the post-import visible frame remains mandatory. The 60-second timer remains unchanged.
- No original GLB files are deleted from repository history. No shared Ferrari-derived kinematics, camera helpers, wheel-rig system, or player controls are deleted; those are still inherited by remaining drivable vehicles. Main and unrelated diagnostic reporting branch are unchanged.
- Original retained models: **Range Rover Sport 2018, Toyota Hilux 002, Land Rover Defender 001, Dodge HP**. Ferrari and Buggy no longer spawn or load in the active game.

## Tests and required visual checks
- Assert zero remote-importer invocation and zero Ferrari actor creation in the runtime; verify four local sources and unchanged native wheel adapter.
- Compare actual NullEngine world allocations to confirm *both* zero old car geometry and absence of old physics boxes; ensure world disposal leaves no collision objects.
- Confirm no retired network downloads in browser Network tab. Verify all four other vehicles render and can drive. Check first-frame visual readiness and elapsed load against the 01:00 budget. Removal does **not** prove cause or solution for a 7/8 first-render stall.
