# VEH-012 — Authentic wheel isolation and drive animations

**17 October 2026 | Branch:** `feat/veh012-authentic-wheel-extraction-20261017`

## Scope
The five-model traffic-review source remains unchanged: Ferrari, Range Rover Sport, Toyota Hilux, Land Rover Defender 001 and Dodge HP. All keep their existing single Rapier controller, walking/boarding/exit, collision logic, paint, and native meshes. The decommissioned city expansion stays closed. The Buggy remains skipped **only in this five-model preview**; it is not deleted from production.

## Confirmed source issue
The actual Defender 001 GLB has a single render mesh `material`, one primitive and mandatory `KHR_draco_mesh_compression`. Its authored wheel shapes are NOT independent glTF wheel nodes. Name-only wheel rigging cannot rotate them. Unverified wheel pivots never justify spinning the chassis or synthesizing new cylinders.

## VEH-012 native mesh split
After Babylon decodes the original GLB, find its independent indexed triangle islands. Search for four real, symmetric, circular tire regions in the fitted chassis coordinate frame, measure front/rear axle locations and source-space tire axes. Only if four real, distinct wheel surfaces pass geometry, symmetry, radius, and uniqueness checks:

1. Move **exact original wheel triangles and their materials/UVs** into four compact native wheel submeshes.
2. Place four measured hub pivots. Preserve original world pose and remaining body geometry.
3. Reuse the existing `StreetVehicleWheelRig` quaternion update for steering and roll (front wheels turn, all wheels roll).
4. Avoid duplicated visual or physical wheel placeholders. No new colliders or independent simulation.

If the source geometry is welded to the body or the tires cannot be proved to be four isolated islands, return **unverified** and do not mutate mesh data. This is a conservative source-geometry extraction attempt, **not** proof that the live Draco Defender will pass. Toyota and Dodge continue to use their native source wheel nodes when available; the merged-wheel fallback is only for an exact single-mesh source.

## Acceptance
Run real Chrome and Android previews. For all five cars, check (1) tires actually rotate with movement; (2) fronts visibly steer while rears do not; (3) tire center/road height matches accepted road geometry; (4) rims and tires rotate together, without holes; (5) no chassis/body surface detachment or flicker; (6) reversing correctly reverses wheel roll; (7) steering still changes Rapier trajectory; (8) startup stays under 60s. Preview unit tests alone do NOT constitute visual acceptance.

If four original tire geometries are not separable (especially the Defender), the next authorized step is source GLB mesh editing to create proper wheel nodes, not procedural substitutes.

## Original rim faces (final isolation rule)

The source glTF can merge the rubber tread, outward-facing circular rim and
inner disc into one material with separate **triangle islands**. VEH-012 groups
an island with a validated tire only if its complete extent is inside that
tire's measured cylindrical envelope, it is centered at the real hub, and it
has a meaningful radial span. Those original surfaces pivot and rotate
together. Chassis and wheel arches (far outside that envelope) remain intact.
