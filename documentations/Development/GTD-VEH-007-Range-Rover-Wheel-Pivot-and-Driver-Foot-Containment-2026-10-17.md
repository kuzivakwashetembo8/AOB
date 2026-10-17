# GTD VEH-007 — Range Rover real-wheel animation and driver shoe containment

**Date:** 2026-10-17  
**State:** isolated implementation, build and owner in-world visual acceptance pending.  
**Owner evidence:** Range Rover appears intact on Mercer Street but all wheels remain unanimated; seated Voight's shoes penetrate the lower body and are visible under the chassis.  
**Branch:** `exp/veh006-original-sedan-g1-20261016`; draft PR #33. No production change.

## Existing accepted foundation

- GTD-VEH-005 V2: `StreetVehicleActor` has one authoritative physics/drive state; `StreetVehicleWheelRig` animates actual independently authored tire pivots using the car's distance travelled and steering radians, with quaternion composition. There is no independent wheel-physics solver.
- GTD-VEH-CABIN-FIT-004: actual skinned shoe-sole/calf geometry must be measured, and leg corrections must affect the animation pose rather than hide the driver, reposition the entire car or claim a non-existent interior floor.
- The Range Rover's source GLB has four independently named wheel meshes: `FL Wheel`, `FR Wheel`, `BL Wheel`, `BR Wheel`. The GLB's driving axis is X, tire axle Z; the displayed vehicle orientation is adapted by an asset-level 90° transform.
- Sedan remains delegated/pending and unloaded; `ergoninane-fast-71` is suspended. Ferrari/Buggy logic and assets remain unchanged.

## Scoped implementation

1. Import the owner Range Rover using `instantiateModelsToScene(..., true)` for independent wheel mesh transforms. Previously it used GPU `InstancedMesh` copies and then required hub-centred raw mesh origins.
2. Run `prepareRangeRoverWheelRig` once after the GLB is mounted and measured, before creating the shared `StreetVehicleActor`. It identifies exactly the four named real tire meshes, rejects extra/missing/degenerated inputs, measures their actual centre-world, and creates precisely four hub-centred Babylon `TransformNode` pivots while retaining each original tire's world matrix, real mesh, materials, and brake/body geometry. The existing shared wheel rig then drives the pivots from the car's fixed-step steering and distance. No mesh geometry or phantom tire is manufactured.
3. Keep `rangeRoverDriverSeatWorldPose` and the UAL `Driving_Loop`, reusing `SkinnedFootGeometry.measure()` after existing driving IK solves to sample true animated shoe vertices. Every twelfth visual frame, only shoes verified below the provisional SUV footwell trigger an upward adjustment of the cached leg tip target: 7.5 cm maximum per sample and 46 cm lifetime per boarding. No actor root, pelvis/car suspension or standing Voight lift is applied. This is a **provisional visual fit**, not certified carpet-floor collision clearance: unlike the Ferrari the source does not yet provide a separately verified carpet polygon.
4. The `driverContactReport` now exposes sampled frames, left/right correction, measured sole Y, and provisional status; no fabricated successful clearance claim.
5. Extend `veh007-range-rover-driving.test.ts` with a real off-centre mesh-hub scenario, verified pre/post imported tire positions, front/rear quaternion rotation distinction, and bounded measurable shoe correction.

## Visual review requirements

- On desktop and mobile board the Range Rover (F). Drive straight 5m and verify all four tire/rim meshes roll, then apply left and right turns and verify **only front wheels steer** while rear wheels only roll.
- Confirm tire hubs stay attached, brake/caliper geometry remains stationary relative to the chassis, and driving is consistent in reverse.
- From side/underside view during full stop and movement inspect both shoes/calf sections. Foot measurement may be available without complete interior floor certification; any persistent protrusion must remain an open failure and be corrected with actual witness evidence, never a masking trick.
- Unboard F and verify the normal avatar pose recovers. Ferrari/Buggy seating, wheels, world, and physics are unchanged.
- Keep G6 physics-collider envelope refinement and Sedan delegated task independent.

No production merge is authorized by this visual trial.
