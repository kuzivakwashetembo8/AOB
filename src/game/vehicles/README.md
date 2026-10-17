# Meridian Vehicle Runtime — GTD-WORLD-002

Status: EXP-VEH-002 Ferrari **L0 desktop accepted by owner** and authorized
for promotion to `main` for mobile validation, 2026-10-12.
This is **not** released traffic AI,
a sedan asset, tire dynamics, or a commercial Ferrari licensing determination.

## Reusable components

- `drive-kinematics.ts` — 60Hz acceleration, braking, reverse and steering math.
- `street-vehicle-physics.ts` — asset/class `StreetVehiclePhysicsProfile`,
  signed authored forward axis, grounded/airborne state, gravity and bounded step rise.
- `street-vehicle-barriers.ts` — oriented footprint collision for genuine
  `vehicleNoStep` world objects such as the 22cm South Ward garage sill.
- `street-vehicle-wheels.ts` — imported per-wheel node mapping,
  measured wheel radius and quaternion-based roll/steering that avoids GLTF
  Euler-vs-quaternion incompatibility; missing source pivots are exposed.
  New GLBs default to world-yaw toe, dynamically converting world-up into the
  hub parent frame instead of guessing a per-asset steering sign. Ferrari keeps
  its visually accepted legacy-local convention.
- `first-drive-trial.ts` — reusable `StreetVehicleActor` that accepts a
  physics profile and wheel mapping. `FirstDriveTrial` is its Ferrari test
  adapter retained for `GTDGameRuntime` compatibility.
- `ferrari-camera.ts` — source-specific rear-follow camera orientation,
  separated from the generalized vehicle actor.

A future licensed Meridian **four-door civilian sedan** should instantiate
`StreetVehicleActor` with a sedan profile, its verified wheel mappings and
calibrated collider bounds. Do not duplicate Ferrari code or inherit its
model-specific -Z orientation or wheel-axis assumptions by accident.

## Known limitations

The current system is a collision-aware **kinematic** driving controller.
It implements grounded and airborne movement, explicit doorway blocking, signed
wheel roll and visible front steering. It does **not** simulate individual
suspension springs, four tire friction contacts, load transfer, drivetrain,
differential, skidding, crash dynamics, NPC traffic or roadway AI. The existing
street elevation may still create abrupt motion requiring further live tuning.

Do not approve a visual/physical behavior from automated NullEngine tests alone.
On desktop and mobile, verify the real imported Ferrari's named wheel pivots
(`window.__GTD_DRIVE_TRIAL_REPORT__?.()`), travel-facing wheel rotation,
sidewalk/garage threshold difference, gravity after leaving elevation and
camera stability. A missing wheel pivot is a reported defect, not success.

Failure modes, root-cause evidence, protections and acceptance gates:
[VM-G01–G05 Physics Hardening](../../documentations/Development/GTD-WORLD-002%20Ferrari%20L0%20Physics%20Hardening%20-%202026-10-12.md).

Production/mobile release contract: car actor initializes automatically when the
genuine imported sports GLB loads in the generated world, without requiring
`gtdVehicleTrial=1`. Retained `drive-availability.ts` guards against missing
assets. The owner has verified `wheelCount=4`, `wheelRigReady=true`,
`missingWheelPivots=[]`, `grounded=true` and `airborneSeconds=0` on desktop.
**Mobile field acceptance is still pending.** Parked buggy, canonical humanoid
and FL-4 closure are preserved. Commercial source asset rights remain unresolved.
