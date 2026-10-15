# GTD-VEH-005 — Steering Wheel Animation, Buggy Activation and Truck Drivability

Date: 2026-10-15
Status: TECHNICAL IMPLEMENTATION PLAN — DOCUMENTATION ONLY / IMPLEMENTATION NOT YET AUTHORIZED
Owner directive: “Mobile confirmed. Plan the next directive, steering wheel animation and buggy activation. The truck must be driven too. Plan in the repo.”
Repository: interlinkglobal/GTD
Planning baseline: main at cf12e5f2ef58bbe276cc5a18bfb5cbb2a5b44a78 (Fit004 release)
Environment: Babylon.js rendering, Rapier physics, TypeScript, fixed 60 Hz simulation, TanStack Start/PWA.
Baseline release: https://grand-theft-division.vercel.app/game

## 0. Signal, acceptance carried forward, and exclusions

- FIT004 seated-driver and foot-containment result is accepted on desktop by owner-supplied screenshots; the owner has now explicitly confirmed mobile as well. Preserve this achievement on Ferrari.
- The separate VEH-FIT-002/VEH-CABIN-FIT-003 floating-car and four-tire physical grounding concerns have NOT been signed off. A mobile acceptance of FIT004 does not retroactively certify every wheel-grounding scenario.
- Next objective: (A) animate the Ferrari's real interior steering wheel with coherent hands, (B) make the already parked Buggy directly player-drivable, and (C) make a separate truck player-drivable after identifying and qualifying its actual asset.
- These are player-controlled driving additions, not NPC traffic, pursuit AI, crash/damage simulation, vehicle commercialization, or a demand for a full spring/damper tire-traction solver.
- No vehicle implementation, asset replacement, merge or deployment is authorized by this document. Implement one isolated gate at a time; preserve the successful current production version as an A/B control.

## 1. Verified current main implementation (source review)

### 1.1 Imported vehicle inventory

- src/game/experiments/vehicle-probe-plan.ts defines EXACTLY two imported asset families in VEHICLE_PROBE_SOURCES:
  - id=offroad, “Forked off-road buggy — temporary specimen”; pinned Car-Game-ThreeJS car.glb, approximately 6,062,428 bytes, target length 4.05 m, accepted width multiplier 1.10.
  - id=sports, “Forked Ferrari — temporary specimen”; pinned JS-3D-Car ferrari.glb, approximately 1,681,572 bytes, target length 4.53 m, accepted width multiplier 1.05 and height multiplier 1.10.
- sourceForExistingSlot(index) alternates offroad and sports through deterministically sorted parked slots. src/game/experiments/imported-car-evaluation.ts creates individual per-slot vehicle-probe-anchor nodes, parents a shared imported template instance, calibrates measured dimensions and replaces static Rapier parked-car colliders.
- src/game/core/gtd-runtime.ts instantiates a FirstDriveTrial actor for imported slots where source=sports ONLY. Offroad slots remain parked, static and nondrivable.
- **TRUCK IDENTITY NOT VERIFIED:** The audited main source registry contains no third truck GLB entry; the repository file tree has no truck-named source asset. The offroad model is labeled Buggy in code. Do NOT rename it “truck”, assume it is the requested separate truck, invent a truck GLB path, or silently substitute a procedural placeholder. Establish the intended truck specimen and provenance at the dedicated qualification gate.

### 1.2 Existing reusable foundations and current Ferrari coupling

- src/game/vehicles/first-drive-trial.ts exports StreetVehicleActor. It already accepts a StreetVehiclePhysicsProfile and StreetVehicleWheelMapping; FirstDriveTrial is the Ferrari compatibility adapter.
- src/game/vehicles/street-vehicle-wheels.ts has a four-pivot wheel rig and signed road-wheel roll/steer quaternion updates; FERRARI_WHEEL_MAPPING uses wheel_fl/fr/rl/rr. This animates road wheels, **not** the driver's interior steering wheel.
- src/game/vehicles/drive-kinematics.ts produces a 60 Hz DriveState including speedMps and steeringRadians, but DRIVE_LIMITS currently hardcodes Ferrari-class acceleration, wheelbase, steering response and max steering angle for every actor. Class-specific physics is therefore only partially generalized.
- src/game/vehicles/driver-seat-placement.ts, ferrari-camera.ts, local-boarding.ts and gtd-runtime.ts hardcode Ferrari-facing entry/exit, seat position, rear camera, nearestSportsCar, Ferrari HUD/objectives and the sportsCars registry.
- src/game/character/driver-cabin-pose.ts already finds the real Ferrari steering_leather rim for stationary hand-contact targets; steering_carbon is an inner trim mesh. The code caches static car-local grip contacts on boarding. This is NOT yet a verified rotating wheel/hand synchronization solution.
- The UAL Driving_Loop / FIT004 hierarchy is animated and has previously required parity-aware parent-space joint corrections and a small-footwell fitting investigation. Moving any wheel or hand targets cannot reinitialize or disturb accepted Ferrari pelvis, spine, legs or cabin positioning.
- Existing car support is kinematic with a single full-chassis Rapier cuboid. Prior independent Rapier reproduction showed that curb autostep can raise the chassis while tires remain over lower asphalt. Treat the resulting float as an OPEN geometry/physics support failure.
- Actual existing wheel names, wheel-rim hierarchy, forward axis, source rotation, cabin floor and seating fit are **only verified for Ferrari**. Buggy and truck cannot inherit Ferrari mapping merely because the class can accept a mapping object.

## 2. Cross-vehicle technical doctrine

1. One authoritative driving state per active vehicle. Driver wheel rotation, front tire steering, vehicle yaw and animation must all derive from the SAME fixed-tick steer state; no separate competing accelerators or clock sources.
2. Separate: imported visual hierarchy; source-specific metadata; wheel/steering/door nodes; physical chassis and supports; player boarding/seat placement; camera; UI; asset lifetime.
3. Registry key is an immutable vehicle instance ID tied to an imported parked slot; class ID is separate (ferrari, buggy, truck). Never key by mesh display name or brand.
4. Asset-specific parameters (real forward sign, four wheel pivot paths, wheel radius, wheelbase, steering joint axis, cabin references, exit clearance, turn envelope) must be measured and versioned, not derived from Ferrari constants.
5. Preserve current Ferrari appearance, Fit004 seated pose, hand targeting, keyboard arrows/WASD and mobile landscape controls unless the isolated feature's acceptance directly requires otherwise.
6. Do not lose a parked object on failure: successful actor creation and obstacle/collider handoff must be transactional. Incomplete imports remain parked with explicit diagnostics; no ghost/duplicate Rapier colliders.
7. Instrument before tuning. A failure to resolve the real steering-rim parent, four wheel pivots, or a safe seat/exit transform is a visible NOT-READY state, never an arbitrary mesh rotation or free-flight vehicle.
8. Do not claim legal redistribution or commercial usage rights from the fact that the GLB lives in a fork. Preserve source IDs and hashes; replacement by owned/cleared assets remains a future release requirement.

## 3. Stage SW-0 — Ferrari steering assembly forensic audit (read-only)

Inspect the actual pinned Ferrari GLB under Babylon:
- Enumerate all steering-related TransformNodes and child meshes (including steering_leather, steering_carbon, spokes, hub and center), with parentage, mesh transforms, material names and immutable source transforms.
- Identify a *single actual rotatable steering assembly*. If the source lacks one, design a generated pivot at the measured steering hub and reparent ONLY confirmed steering-wheel components, preserving their world matrices. Never rotate dashboard, steering column housing or full Ferrari.
- Establish hub center, the real shaft axis in steering assembly LOCAL coordinates, steering sign, rest quaternion and real full-rim mesh extent. Do not rotate around world Y by assumption.
- Confirm the existing car-local hand grip landmarks are on the true outer rim, and can be recomputed from the animated wheel assembly (not the static cached boot-time rim positions).
- Capture imported source proof (node path and GLB hash) in the diagnostic. Failure is a hard gate before animation.

Exit: source wheel assembly and signed local axle are unambiguously identified; nothing in the accepted game is changed by this diagnostic gate.

## 4. Stage SW-1 — Animated interior steering wheel (Ferrari only)

Implement a small vehicle-specific SteeringAssemblyRig with explicit setup, update, report and dispose:
- Fixed-step input is the already smoothed DriveState.steeringRadians, NOT the raw left/right key or visual front-wheel quaternion.
- Intended mapping: steeringWheelRotation = normalizedRoadSteer * configurable full-lock hand-wheel angle; steering ratio and lock range are calibration parameters, not guessed source defaults. Preserve correct handedness and left/right reversal when moving backwards.
- Use original quaternion times signed local-axis rotation. Do not cumulatively apply a frame delta to the prior quaternion; return exactly to original rest orientation when steering returns to zero or the vehicle is disposed.
- Include bounded turn response and stable recentering driven by the existing simulation tick. At zero input the wheel returns smoothly to neutral; at idle the rotation still reacts if the road-wheel control model does.
- Rotate the full assembly including rim/spokes/hub consistently. Preserve wheel material, texture, PBR lighting and no unrelated GLB nodes.
- Publish diagnostics: source wheel root, axle, commanded road steer, steering-wheel angle, wheel center in car-local coordinates and restoration state.
- Temporary flag gtdSteerWheel005=1 for preview A/B; promote only after actual user desktop+mobile acceptance.

### SW-2 — Match Voight's hands to the moving rim

- Retain FIT004 foot and calf correction baseline. Existing Driving_Loop stays canonical.
- Derive two stable grip anchors in the steering assembly's rest-local frame. Each tick resolve them through the *animated* hub-to-car/world matrix after steering assembly update.
- Run driver upper-limb solving in a documented order after the base animation and after wheel rotation. Preserve prior-frame inverse corrections and reflected skeleton parent-space handling; never solve grip targets from last frame's wheel orientation.
- Define hands as physical palm/grip landmarks, not mere hand-bone centers. Verify realistic wrists/elbows at center, left and right wheel positions, including changing camera view.
- Clamp/unwind as needed to prevent forearm penetration or impossible reach; if actual grip becomes unreachable, hold accepted upper-body pose, report contact residual and reject rather than sliding entire Voight.
- Confirm that turning the wheel does not translate the seat root, move the Ferrari, alter steering dynamics, leak legs below the cabin, or cause unintended animation resets.
- Audio/horn, wheel force feedback, gear lever animation, hand-over-hand animation at extreme lock and instrument-panel animation are OUT OF SCOPE unless separately approved.

Acceptance: wheel visibly rotates in correct direction while tires turn, hands remain plausibly attached, center position returns without snap, head/back/feet remain at accepted FIT004 pose, across real desktop and mobile.

## 5. Stage MV-0 — Generalize the active vehicle registry without changing Ferrari

Introduce small, explicit contract types rather than copy-and-paste Ferrari conditions:
- VehicleClassDefinition: classId, source asset ID/hash, real dimensions, wheel mapping, forwardAxisSign, DriveTuning (forward/reverse speeds, acceleration, steering response, wheelbase), StreetVehiclePhysicsProfile, optional SteeringAssemblyDefinition, vehicle-specific SeatCabinProfile and camera/exit rules, interaction label.
- VehicleInstance: stable slot ID, class ID, imported anchor, actor, parked collider lifecycle state, active/parked state, diagnostics, disposed state.
- Replace the Ferrari-only sportsCars driving selection with activeVehicles indexed by real imported slot ID, but keep a compatibility facade or otherwise preserve the established Ferrari tests and debug report shape.
- Rename/refactor Ferrari-specific entry/exit and HUD operations to class-neutral forms only behind test coverage. Preserve F-to-enter/exit, stop-before-exit, player collision, safe-exit clearance, pause/resume, touch controls and camera drag.
- Parameterize DriveState control by a class-specific DriveTuning object; default to the EXACT Ferrari DRIVE_LIMITS for Ferrari to avoid silent driving-feel change.
- Implement a class-aware rear-follow camera and seat resolver. Adapt current first drive geometry from specific source axes rather than assume all imported models point -Z.
- Require a transactional handoff: imported parked collider released only after actual four-pivot actor, collision geometry and boarding validation succeed. On failure, the parked world remains rendered/collidable and the actor leaves no duplicate rigid body.
- Maintain exactly one player's active vehicle at a time; parked other vehicles remain static and cannot move as a side effect. No automatic traffic.

Acceptance: Ferrari production A/B functionally unchanged—same controls, steering sign, acceleration profile, camera, visible FIT004 driver, exit, all four tire animations. Tests must prove repeated enter/exit/dispose cycles and static-collider fidelity.

## 6. Stage BG-0 — Qualify the real off-road Buggy asset

**Identified source:** offroad, pinned fork Car-Game-ThreeJS/public/vehicals/car.glb; existing accepted parked scale and slot locations must be preserved.

Prior to activating movement:
- Inspect actual glTF node hierarchy to identify four *independent* wheel pivots, radius and tread material (or certify that a non-destructive wheel subrig must be built), spin and steer axes, gear/body rotations and center-of-mass/chassis bounds.
- Validate intended front-facing axis and axle order (left/right cannot be inferred from wheel names without spatial verification); inspect doors/entry aperture, seat, steering rim and genuine footwell/floor surfaces.
- Retain baseline 4.05-m target length and +10% width accepted in parked mode. Changes to scale require separate approval; do not tune physics by silently stretching the asset.
- Check browser loading, meshes, draw calls and memory especially on mobile. Buggy GLB is materially larger in bytes than current Ferrari and shares scene with parked instances.
- Record independently any absent interior mesh, missing wheel node, missing steering assembly or unusual source material; fail closed for that capability. Do not substitute Ferrari's 3D cockpit clearance.
- Preserve exact fork provenance and unresolved commercial-rights status.

Exit: Buggy ClassDefinition backed by a real measured source rig and a clear feature-availability report.

## 7. Stage BG-1/BG-2 — Activate Buggy driving and then its driver fit

BG-1 (vehicle movement):
- Instantiate StreetVehicleActor only for successfully imported offroad slots using the Buggy's OWN wheel/pivot map, forward sign, wheelbase, speed/steer tuning, collider profile and ground-contact witness.
- Verify entering by proximity, steering left/right, tire rolling proportional to distance, reversing, braking, cornering, curb and garage protection, collision with static props, parked-to-active transition, stop/exit/re-entry, and camera follow. Prevent entering any unseen loading/failed asset.
- Verify any repeated parked offroad instance can independently become active without moving sibling instances (shared AssetContainer templates must not share mutable wheel transforms).
- Qualify tire-to-visible-road contact per corner. Do not inherit Ferrari's KCC auto-step false-grounded success; if an unsupported body rises over an edge, keep Buggy in experimental status.

BG-2 (humanoid):
- Build the Buggy's own safe cabin occupancy/seat/pedal/steering profile from its real geometry and run UAL Driving_Loop only after its actual fit is established.
- Reuse FIT004 lower-limb SOLVER interface and diagnostics, not Ferrari's hardcoded floor mesh or target shifts. Preserve realistic seated head, torso, hands, shins and shoes with separate profile and calibration evidence.
- Where the Buggy lacks a viable cockpit profile, status is DRIVABLE-EXPERIMENT / DRIVER-FIT-NOT-ACCEPTED: do not pretend Ferrari's successful fitted driver has been inherited, and do not visually expose limbs through the floor.
- An intentionally hidden driver is an explicit *temporary presentation exception* requiring owner approval, never an unannounced acceptance substitute.

Exit: owner can board and drive Buggy on real mobile and desktop, with accepted wheel-ground and visible-driver behavior under the agreed presentation gate.

## 8. Stage TR-0 — Identify and qualify an actual Truck specimen (blocking asset gate)

**Current repo fact:** no third truck source is defined in VEHICLE_PROBE_SOURCES. A truck is a distinct owner requirement, not an alias for the existing offroad Buggy.

Before implementation select and record ONE intended truck model/source:
- Asset URL/path, immutable revision/hash, permission/licensing evidence and exact intended type (e.g. pickup versus larger commercial truck). Type affects turning radius, height, curb clearance, steering ratio and cabin fit; do not infer it from the word “truck”.
- Actual GLB/gltf mesh availability, load size, body and cabin geometry, wheel count/axle topology, real source forward axis, steering linkage, usable driver seat and floor, parking position and realistic dimensions.
- Do not invent a truck mesh or replace the accepted parked Buggy with a different vehicle. If a source is not yet available, implementation stops safely at TR-0 and Buggy/Ferrari work may continue independently.
- Four road wheels are supported by the existing StreetVehicleWheelRig. A truck with more than four wheels or dual rear tires REQUIRES a deliberate multi-axle wheel-contract extension before enabling it; no silently discarded wheels.
- Define owner-approved import/parking-slot allocation without shifting existing deterministic Buggy/Ferrari placements. Moving slots requires a separately recorded world placement decision.

TR-1 (drive): register the verified truck model in the class/instance registry. Calibrate its own transmission/control limits, length-dependent collision/turning, wheel positions, steering, entry/exit, rear camera distance and ground support. Keep Ferrari physics immutable.

TR-2 (driver): fit Voight to the real truck cabin, reach the actual rim and pedals, prevent head/feet passing through its interior, and verify realistic height/camera/ground contact. Activate on keyboard and mobile touch. Test tight Mercer Street sections and avoidance of walls, junctions and garages at its measured dimensions.

Exit: the truck is drivable, not merely a parked model moved by transforms. No claim of success until exact source is established and independently tested.

## 9. Separate mandatory vehicle-grounding verification — WG-005

Known incident: a vehicle previously appeared to float after driving forward, particularly from underneath; upper/side views could conceal the gap. A full Rapier chassis-box autostep can lift body height while tire footprints are still over lower road. FIT004 mobile acceptance did not certify wheel-contact physics.

- Capture four named tire tread minima from actual imported meshes, visible asphalt/sidewalk surface top, corresponding Rapier ground collider support, body/chassis bottom, curb distance and KCC grounded flag. Sample before and after each forward/reverse motion and when straddling a sidewalk.
- Test Ferrari baseline independently of steering animation; test Buggy and Truck on the identical street locations with class-specific width and wheelbase.
- Require meaningful support at EACH tire, or an explicitly evidenced airborne state; a green “grounded” checkbox is insufficient.
- Prevent chassis-side curb autostep from creating a sustained visual tire gap while wheel footprints remain over lower road. If this reproduces, stop the activation workstream and open a bounded physics fix with its own before/after evidence; do not conceal it with global car Y offsets or larger wheels.
- Separate the physical support patch from steering-animation and UAL cabin changes. Do not treat optional visual wheel travel as physical suspension or permit it to cover an invalid chassis pose.
- Mandatory side, overhead, low-upward and rear-underbody views at stopped, forward and reverse travel, on asphalt, near curb, on a junction and near the garage sill.

This is a RELEASE BLOCKER for Buggy/Truck drivability. Existing accepted Ferrari seating remains preserved even if grounding needs its own correction.

## 10. Tests, diagnostics and evidence

Automated gates:
- Source rig audits: duplicate/missing pivots, orientation sign, local axle, invalid bounds, absent frame interpolation, broken glTF hierarchy, no wheel/tire mesh, finite matrices.
- Steering assembly: clockwise/counterclockwise, zero-center, rapid alternating steering, reverse, pause/resume, reload, dispose, multiple instances, steering reaction while idling; no compound incremental quaternion drift.
- Hand-to-rim: same-tick wheel and grip matrix updates, correct transform ownership, mirrored UAL bone-parent hierarchy, IK rollback, contact tolerances, no torso or sole movement, driving animation lifetime.
- Class registry: deterministic slot ownership, source failure handling, missing Truck asset gate, parked collider release/restoration, multi-vehicle activation not simultaneous driving, stable camera/exit handling, shared model instance isolation.
- Motion: class-specific controls without accidental Ferrari tuning drift; wheel roll distance matches traveled distance, no yaw-axis inversion, no teleport on exit, max curb/garage barriers and no-step.
- Road support: per-wheel rendered and Rapier support telemetry, moving ground witness stability, ramps, sidewalk straddle, left/right turn, reversing, full stop, airborne and unsupported state.
- PWA/mobile: portrait-to-landscape enforcement, on-screen arrow/vehicle interactions, pointer drag to orbit camera, touch sensitivity setting, page reload, pause/resume, battery/performance observation, asset loading memory and stutter at boarding.

Live evidence matrix: owner desktop + actual mobile for each class; Ferrari steering wheel at neutral / hard left / hard right; two-handed grip frames; Buggy moving/turning/reversing; Truck moving/turning/reversing; all three in low underbody camera view while crossing road-edge geometry.

Acceptance observability should expose, as applicable: active vehicle instance ID/class/source, actor/asset state, steering command, rim angle and axis, grip target error per hand, wheel rig readiness and missing pivots, wheel radii/roll/steer, four tire/road contacts, KCC grounded, current support type, cabin fit state, speed, distance, camera mode and start/stop/exit event. Diagnostics remain read-only; no diagnostic endpoint should mutate gameplay state.

Use existing Vitest, Babylon NullEngine and Rapier tests for mechanics, plus real browser/mobile screenshots. Static test pass alone cannot establish a believable wheel/hand animation or road contact.

## 11. Staged implementation / decision gates

| Gate | One change at a time | Exit test | Status |
| --- | --- | --- | --- |
| V0 | Freeze exact main SHA and mobile-approved FIT004 baseline | Versioned rollback and comparison | PLANNED |
| SW-0 | Inspect actual Ferrari steering hub, rim and grip assembly | Real source node/axis verified | PLANNED |
| SW-1 | Animate just the Ferrari's interior steering assembly | Wheel turns and centers without body/physics changes | PLANNED |
| SW-2 | Couple Voight's hands to rotating rim | Two contact points follow real rim; FIT004 pose retained | PLANNED |
| MV-0 | Introduce reusable vehicle class+instance registry | Ferrari A/B unchanged and colliders/exit valid | PLANNED |
| BG-0 | Audit Buggy's real independent wheel/cabin source | Measured Buggy profile or explicit blocker | PLANNED |
| BG-1 | Activate Buggy driving (isolated preview) | Board, steer, brake, reverse, exit, road support | PLANNED |
| BG-2 | Fit humanoid to Buggy cabin, if approved/qualified | No penetration or false seated presentation | PLANNED |
| TR-0 | Identify actual separate Truck source | Approved pinned asset and axle/body/cabin inventory | BLOCKED ON ASSET IDENTITY |
| TR-1 | Activate Truck with its own class profile | Drivable, steering and collision sound, independently measured | AFTER TR-0 |
| TR-2 | Fit humanoid to Truck cabin | Safe interior foot/hand/head and exit | AFTER TR-1 |
| WG-005 | Verify/correct chassis-vs-four-wheel grounding independently | No unsupported floating in low/upward view | OPEN — release blocker |
| REL-005 | Full desktop/mobile regression and owner acceptance | Feature-specific signed approvals before main/deploy | NOT AUTHORIZED |

**Recommended delivery order:** first SW-0 → SW-1 → SW-2 (visible improvement with limited blast radius); then MV-0 → BG-0 → BG-1 → BG-2; qualify TR-0 independently as soon as a real asset is identified, then TR-1/2; enforce WG-005 throughout and before promoting Buggy/Truck. Do not implement all stages in one branch.

## 12. Failure and rollback ledger

- SW-F01 — only rim mesh turns while spokes/hub stay static: reject component selection, restore entire import hierarchy.
- SW-F02 — wheel turns but palms stay fixed or clip through rim: reject SW-2, preserve accepted AR1/FIT004 arm/torso/feet state.
- MV-F01 — switching vehicles changes Ferrari driving feel or flips steering: reject generalization, revert Ferrari profile exactly.
- MV-F02 — duplicated Rapier parked collider blocks the activated Buggy/Truck: reject transactional handoff.
- BG-F01 — independent wheel pivots unverified or model pivots shared across imports: remain parked; do not rotate body as a visual fake.
- BG-F02 — Buggy has no real verified footwell: movement may remain preview-only, but visible-driver acceptance is withheld.
- TR-F01 — Truck GLB absent/unapproved, source ambiguous or wheel count unsupported: stop at asset qualification; do not label Buggy as Truck.
- WG-F01 — chassis grounded while tires float above asphalt: fail active-vehicle physical acceptance; require independent measured support correction.
- PERF-F01 — asset decoding, rig IK or steering hierarchy introduces mobile hitch/freeze: revert only offending stage, keep owner-accepted production baseline.

Every failure entry must include reproducible source SHA, feature flags, screenshot angle, observed vs expected, real measurement and owner acceptance state. No cosmetic height shifts or mesh hiding to suppress these failures.

## 13. Release boundary and owner decisions

Documentation-only authorization today. Source files, physics, GLB assets and production deployment are unchanged by publishing this document. Each implementation stage requires explicit authorization and human-visible comparison.

**Known open decision before TR-0:** the exact Truck model/asset and intended class are not established in the current repository. An approved GLB/location/license or explicit instruction to create a new vehicle asset is needed before truck onboarding can begin; do not infer this from the Buggy's label or silhouette.

After owner approval of each milestone, merge only the accepted isolated work, then deploy Vercel and verify canonical production commit, desktop and mobile behavior. Preserve the accepted night sky, world assets, Fit004 seated Ferrari and independently tracked grounding limitations.