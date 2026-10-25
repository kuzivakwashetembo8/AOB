# GTD-NH-REBUILD-005 — Continuous two-lane roads, native Voight physics, glass reflections

Date: 2026-10-25
Branch: `trial/north-heights-reconstruction-001`
Main/prod: strict exclusion. Do not merge/rebase/release to main before owner approval.

## Defect and root cause

The user annotated an overhead North Heights screenshot: one set of streets rendered convincing grey/tarmac (green arrows), while the perpendicular corridors rendered black/brown (red arrows). Inspection of `north-heights-roads-003.ts` identified a deterministic face-winding defect: all +X road ribbons and crossroads pads had **downward-facing normals**, while +Z had upward-facing normals. In the renderer this made nominally identical asphalt materials dramatically different by compass axis. Simply covering those roads with overlays was not an acceptable fix.

## Changes

1. **Road mesh face normals** — reverse triangle winding for X-oriented strips and XZ intersection pads. Preserve single-ownership junction geometry from REBUILD-004, South Ward asphalt texture, 8m carriageway, 3.75m paved sidewalks, curb geometry and white pedestrian stripes. Unit tests now assert all asphalt, sidewalk and painted crossings have consistently positive Y normal components.
2. **Physics-authoritative player** — keep prior free-fly inspector as a toggle, but default the preview to a walking controller. Use the accepted `createMercerStaticCharacter(scene)` animation/pose system for the user's exact native `character.glb`; do not substitute UAL. UAL remains a stationary comparison witness.
3. **Actual Rapier world** — create a separate `MeridianPhysics` world for this trial, preserving the accepted kinematic capsule, autostep, snap-to-ground and gravity conventions. Create fixed static trimesh colliders for *the exact rendered* terrain, asphalt and sidewalks. For each authored building, create one footprint/height static box collider; avoid per-triangle building collision. Ground source contains the same sloping road geometry, not an arbitrary flat global floor.
4. **Walking camera and inputs** — retained keyboard arrows/WASD, pointer/touch drag, Shift sprint, Space/E jump. A walk/fly mode toggle preserves aerial inspection. Third-person camera follows the native character and Rapier capsule. Fixed 60Hz physics stepping avoids frame-rate-dependent ground motion.
5. **Glass light response** — preserve the **accepted square window geometry, transparent aperture, consistent tint per building and dark inset interiors** from REBUILD-003. Add a shared low-resolution static sky/city spherical reflection texture plus Fresnel and higher specular response for four existing glass material buckets. This is a performance-conscious approximation, *not* an accurate reflection probe or ray tracing.
6. **Preserved** — imported owner GLB trees / grass, North Heights buildings/sky, district layout, South Ward production code, all live gameplay routes.

## Gates

- Automated test asserts both cardinal road-direction normals face upward and central intersection maintains single geometry ownership.
- Rapier test creates a capsule with a real terrain/road/sidewalk collision surface and fixed building-footprint box; verifies player cannot cross building.
- Deployed isolated Vercel preview loads Voight, shows WALK mode, allows walking/jumping, runs GLB tree rendering, can toggle FLY for inspection.
- Browser visual acceptance still required for continuous road coloration across **all** intersections, sidewalk behavior, building/terrain collision, glass reflection quality and performance. Do not state tests prove visual acceptance.
- If FPS regresses, profile collision-broadphase and transparency overdraw; do not remove accepted square panes or replace trees with synthetic cube canopies.

## Risks

- Kinematic trimesh collider collision on slope edges may need follow-up close-up testing. This preview does not introduce vehicle collision/traffic and does not integrate North Heights into the default GTD /game runtime.
- Camera in WALK mode is intentionally free to orbit into architecture; a future camera ray obstruction test may be needed. The gameplay player collider is authoritative.
- Reflection map is a small generated panorama, not physically sampled scene reflections. Transparency remains intentionally approximate for browser performance.

No production merge or release authorized at this checkpoint.
