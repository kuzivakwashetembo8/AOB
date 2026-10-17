# VEH-008 — Permanent imported-vehicle visual steering convention

Date: 2026-10-17
State: IMPLEMENTED in isolated review branch; visual acceptance and production promotion not yet authorized.
Baseline: main 8c41fd4. Scope: shared wheel rig, Range Rover adapter, tests, vehicle subsystem guide.

## Root cause and evidence

The existing shared drive-kinematics solver produces the correct vehicle heading and turn. The separate wheel animation previously multiplied its steering input by an asset-specific steeringSign in a GLB-local basis. The accepted Ferrari uses -1; every Range Rover mapping constructor used +1, causing the genuine front tire meshes to turn opposite the intended player direction even while the chassis followed the correct steering. Existing vehicle tests checked wheel rotations and differences between front and rear quaternions, but did not certify left/right polarity. GLB importer parents can also have coordinate rotation or pitch changes that make a local steering axis unreliable for subsequent car models.

## Implemented technical change

1. New vehicles default to steeringMode world-yaw in the shared StreetVehicleWheelRig. The accepted Ferrari FERRARI_WHEEL_MAPPING explicitly retains legacy-local mode, preventing disruption to previous accepted wheel visuals.
2. Convert the global up vector into the authentic wheel hub's parent coordinate basis using its current inverse world transform, accounting for model roots / imported scene orientation. Apply the accepted negative-radian wheel visual convention shared with Ferrari rather than a new per-asset guess.
3. Pre-multiply the world-aligned steering quaternion before the GLTF hub base orientation; preserve original base quaternion, mesh geometry, hub center and materials. Compose signed rolling motion with the source's verified axle axis afterward.
4. Front-left and front-right steer; rear wheels roll only. Missing wheel pivots remain missing and do not trigger fake tire or chassis animation. Nonfinite steering and degenerate parent bases fail closed.
5. Range Rover mappings, including fallback and legacy discovery paths, now return world-yaw rather than +1 source-local steering; vehicle movement and yaw solver are untouched.

## Boundaries

The model still requires four independently named and correctly attributed source wheels, measurable tire hubs and a declared axle/spin axis; we do not claim perfect import from an unknown GLB. This is visual toe alignment, not Ackermann geometry, steering rack articulation, wheel-ground forces or suspension simulation. Babylon NullEngine tests are deterministic engineering evidence, not proof of actual in-game appearance.

## Verification and owner acceptance

- Automated: positive/negative steering results in opposite front-wheel toe, rear wheels not steered when stationary; arbitrary yaw/pitch GLB parent basis produces the same world steering; invalid input rejected; Ferrari legacy mode and rolling/reset remain unchanged.
- Actual desktop/mobile: F-board Rover in plain /game; steer left/right both while moving and stopped, observe visually aligned real front wheels with no chassis/rim drift; reverse, brake and confirm wheels roll. Test Ferrari/Buggy regression, road contacts, driver feet, egress and reboarding. Check physical wheel pivots rather than tire shader illusion.
- Release: isolated branch, PR and preview build; main deployment is not automatic in GTD. Sedan delegated/pending; ergoninane rendering remains paused. Do not mark final visual acceptance until the owner confirms.

## Rollback and maintenance

Reject new GLB imports whose wheel pivot attribution or local spin axes cannot be proven. Do not add per-model steering polarity switches. Ferrari legacy-local is a clearly bounded compatibility path; new models inherit world-yaw. Revert the review branch patch if the actual Rover toe does not visually match.
