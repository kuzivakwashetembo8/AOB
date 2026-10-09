# Step 4: generated building physical contracts

This note supersedes the Step 1–3 README statement that generated buildings have no physics integration.

The Step 4 API computes `planBuildingInteraction(spec, plan)` independently from render meshes. It exposes structural collision boxes, glass collision boxes, opaque camera blocker boxes, entrance anchors, portals, interior metadata and stable world-space bounds.

`generateBuilding(scene, physics, spec, context)` now registers collision when `physics` is non-null and creates independent invisible camera-blocker meshes by default in that case. Visual-only preview behavior with null physics remains unchanged. The generated building exposes `interaction`, `cameraBlockers`, `entrances`, `portals`, `interior`, `spatial`, and `colliderCount`.

Physical glass blocks character movement but not camera rays. Ground-floor cell and shallow front-access interior modes expose traversable portals; `none` interiors receive closed entrance panels when physics is present. Portal data does not itself implement mission prompts or NPC navigation.

The Rapier adapter currently deactivates collision on building disposal but retains its allocations until the physics world ends. Full reclamation is required before repeated block streaming. The live First Light renderer has not been replaced, and tests/browser parity are pending.
