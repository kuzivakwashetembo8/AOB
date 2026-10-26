# GTD-GEN-VEH-006-PERF-AB — BMW moving-traffic cost isolation
Date: 2026-10-26
Status: Controlled A/B experiment, unapproved for production
Reference (detailed): feature/gtd-generated-vehicles-001 @ f251ece8f003f3a8af11c83c4575f495a9472cb3
Comparison (light): experiment/gtd-bmw-lightweight-traffic-ab-001

## Owner observation
BMW M4 body extraction visually succeeded, but Android North Heights gameplay appears glitchier; wheel rolling/steering is not visibly convincing, with incline/road contact issues. The user authorizes dropping the moving BMW if it contributes to slow play.

## Measured structural cost, not device FPS
Prebuild GEN_VEH_006_NATIVE reported:
- Source GLB: 1,928,276 bytes; source triangles across nonwheel meshes: 158,137
- Output TypeScript source: 8,093,738 UTF-8 bytes before compression
- Five exterior groups (triangles): paint 20,173; glass 1,382; trim 93,006; frontLight 36,447; rearLight 772 = 151,780
- Wheels combined: frontLeft 5,059, frontRight 5,057, rearLeft 5,294, rearRight 5,292 = 20,702
- Total 172,482 triangles per displayed BMW (draw material groups across thin instances)
- NH012 deterministic manifest allocates 21 BMW identities (20 paint variants + 1 extra) among the fixed 125 traffic actors.
- BMW worst-case geometric work: 3,622,122 triangles/frame if all 21 instances are rendered, before material/shader costs. This is a worst case estimate; not a measured GPU draw count or Android p95.
- Detailed BMW visuals use five body thin-instance buckets and eight wheel thin-instance buckets; runtime matrices are updated on simulation ticks. The renderer sets alwaysSelectAsActiveMesh on these buckets, removing ordinary mesh-level distance culling.

## Experiment design
Control A = existing feature branch detailed source BMW. Test B = isolated light branch:
1. Preserve all 125 agents, routes, speeds, paint variation, traffic movement and turning logic. **Do not remove BMW identities from simulator.**
2. Remove BMW-specific high-resolution body/wheel rendering from the North Heights traffic module. All BMW IDs now use already implemented native procedural coupe + generic lightweight wheels.
3. Remove BMW static source-geometry import and unused extraction from this branch's runtime/build pipeline, avoiding the 8.09MB precompression source addition.
4. Preserve accepted Range Rover, Lamborghini body/wheel geometry and ongoing Lamborghini sparse spoke-rim patch unchanged across both versions.
5. Preserve original parked/drivable BMW GLB as an unchanged player-controlled asset. No changes to collisions, roads, parking lots or physics.
6. Commit comparison branch independently. Never merge B into main before user preview acceptance and performance comparison.

## Acceptance/decision
Compare A and B on the SAME Android device, graphics quality, town spawn, camera path and approximate traffic exposure. Collect startup latency, browser memory if available, median FPS, p95 frame time, long-frame stalls, visual BMW alternatives, and visible wheel contact on inclines. B must exhibit better frame pacing without unacceptable visual regression to justify removing BMW's detailed moving traffic. Both designs remain preserved in GitHub regardless.

BMW source-derived 3-step extraction is archived as successful work but should not be iterated further until performance is proven adequate. No claim that the BMW is the sole cause of all North Heights glitches without controlled measurement.
