# GTD-WHEEL-001 — Universal Vehicle Wheel Onboarding and Drive Qualification Architecture

**Date:** 2026-10-17  
**Product:** Grand Theft Division (GTD), Meridia / Meridian City  
**Status:** PROPOSED ARCHITECTURE — DESIGN ONLY; implementation, asset changes, and rollout NOT authorized by this document  
**Priority:** P0 for usable vehicle driving; prerequisite for scaling ambient traffic  
**Source of truth:** This file on main. Separate review-branch experiments are evidence, not production acceptance.

## 0. Directive, evidence and boundaries

**Owner directive:** Every vehicle already present, newly authored, or imported into Meridia must have wheels which rotate and steer correctly in response to the game's actual commands. This must work even when a source vehicle was not originally constructed for wheel animation. A reproducible vehicle-onboarding process—not a succession of bespoke gameplay patches—must grant that capability.

**Observed:** The Range Rover Sport wheels steer and turn correctly during actual owner gameplay. Toyota Hilux, Land Rover Defender and Dodge HP move through Meridian but their wheels appear stationary; the motion resembles sliding. The user specifically confirmed this distinction on 2026-10-17. This observation overrides any implication that synthetic tests or a green CI build have established working wheel behavior for those three cars.

**Repository state when written:** At main c01b50867591ec4f4a18e7115e36f5800fd94ce5, the wheel experiments and four-car review are **not merged**. Review branch feat/veh012-authentic-wheel-extraction-20261017 at 29356c4a80bc7ead098bdbcc43242b6e6c02bee8 contains VEH-011, VEH-012 and VEH-013. VEH-013 removes Ferrari and Buggy from that *review build*; it does not change production main. The active proposed fleet for this design is Range Rover Sport, Toyota Hilux, Defender and Dodge. Do not restore Ferrari/Buggy to satisfy this wheel plan.

**Verified source code findings in review branch:**
- The shared StreetVehicleActor / FirstDriveTrial moves the Rapier chassis independently of StreetVehicleWheelRig. The driver can move a vehicle even with zero verified wheels.
- prepareRangeRoverWheelRig handles the accepted Rover's original wheels with calibrated source axes and measured pivots.
- prepareNativeFleetWheelRig depends on name, bounding-box, four-corner and axis assumptions. These assumptions are not guaranteed by arbitrary GLBs.
- splitOriginalMergedWheelGeometry attempts in-game triangle-island separation when all four independently rigged wheels were not found. Passing tests against synthetic cylinders did not qualify the owner's real assets.
- The Defender's actual source GLB was inspected and found to contain one combined Draco-compressed render mesh; its wheels are not authored as four separate transform nodes.
- The current new-vehicle actor construction passes false/false for its relevant alignment options and still accepts an unavailable wheel mapping. Road contact and wheel rigging therefore require independent calibration.
- The one-minute initial-playable-frame budget is separate from wheel qualification; do not perform expensive source-topology reconstruction during game startup.

**Non-goals:** This specification does not authorize new city streets, traffic AI, color variants, game-code edits, changing source GLBs in place, redesigning the accepted Rover, full dynamic tire friction physics, or resuming decommissioned WORLD-006 GEO-R1 implementation branches. It does not certify branded asset redistribution rights.

## 1. Required invariant and explicit qualification states

A rendered source model is not automatically a driving-ready vehicle. Every versioned model has a lifecycle:

    DISCOVERED -> INSPECTED -> CLASSIFIED -> RIGGED -> VALIDATED -> VISUALLY_ACCEPTED -> DRIVE_APPROVED
                                              \-> REPAIR_REQUIRED / REJECTED

An unqualified vehicle may be parked as an authentic static visual specimen for review, but it must not enter the approved player-driving or autonomous-traffic population. In particular, no 'drivable but without wheels' success state.

**Admission gate:** A vehicle is DRIVE_APPROVED only when all expected wheel assemblies have measured, separately controllable rolling pivots; all required steering pivots are bound; forward/reverse and steering commands produce correct transforms and visible movement; tires and rims travel together; road contact is supported; collision and exit/boarding remain valid; actual-source tests and owner/device visual acceptance pass. These results are tied to a cryptographic hash of the exact qualified asset plus manifest and rigging-tool version.

**Fail closed:** Do not replace an unknown wheel mapping with placeholder names, zero-wheel rigs, or silent chassis-only driving. Emit a precise diagnostic reason and retain the specimen in visual/repair status. No covert replacement tires or geometry edits are permitted. Approved geometric reconstruction for otherwise unusable source wheels is a separately reviewed onboarding output.

**Extensible axle count:** The initial default is four road wheels on two axles; the schema and controller must also express 3-, 6-, 8-wheel, tandem-axle, truck, trailer, all-wheel-steering and special vehicle layouts. Do not hard-code four wheel corners as the universal runtime contract.

## 2. Separation of responsibility

1. **Asset ingest and normalization:** Validate files, licenses/metadata, transforms, material/mesh data, units, geometry, complexity and scale. Preserve immutable originals; produce reproducible derivatives.
2. **Wheel topology inspection and rig authoring:** Detect wheel assemblies, split actual original geometry when provable, repair source geometry if needed, create real hub-centered pivots, and normalize axes.
3. **Qualification service:** Execute geometry/kinematics/render tests on exact exported artifacts; produce signed/versioned report, explicit failure codes, and readiness state.
4. **Runtime asset loader:** Load only approved GLB + matching manifest for driving. Verify hash, schema, node and transform compatibility once on load. No geometry scanning/reconstruction in the game loop.
5. **Universal wheel controller:** Convert authoritative motion/steering from the existing player/AI drive controller into per-wheel rolling and steering transforms. Remain agnostic to model brand and source format.
6. **Telemetry and regression:** Capture wheel binding, command-to-visual response, contact and performance by asset hash, game SHA and qualification version, without confusing tests with observed owner acceptance.

The game engine controls **what wheels do**; onboarding guarantees that **the visual model provides controllable wheels**. The physics controller is not replaced merely to solve a visual rigging failure.

## 3. Source classification: import capability matrix

| Class | Source condition | Automated path | Manual/repair path | Approval constraint |
| --- | --- | --- | --- | --- |
| A: pre-rigged | Actual wheels exist as independent pivoted meshes/bones | Map nodes, calibrate axes, validate orientation and hierarchy | Only anomalies | All expected original wheels identified and working |
| B: separate, unrigged | Real tire/rim meshes are independently transformable, but poorly named, centered or parented | Geometric detection, construct steering and rolling hub pivots, preserve transforms | Inspect ambiguous grouping | Geometry unchanged and visual equivalence verified |
| C: baked/merged | Wheel surface triangles are embedded in one/few static car meshes | Offline decode and conservative component/topology isolation, reconstruct rims where safely authorized | Blender-assisted extraction and authoring for welded/ambiguous geometry | No chassis holes, dangling panels, wrong wheel parts or missing rims |
| D: absent/unusable | Incomplete, fused, distorted or nonexistent wheel geometry | Asset diagnosis and hub/clearance measurements | Source-based approved wheel assembly modeling/fitting and body repair | Original quality maintained or separately approved; no pretend original-preserving repair |

**Important:** No automatic method can promise lossless wheel extraction if wheel triangles share topology with chassis or lack separable semantic evidence. Class C and D may be human-reviewed. Automation must identify uncertainty, not silently mutate body geometry.

**Input formats:** GLB/glTF can be inspected directly. OBJ+MTL, FBX and BLEND require tool-supported ingestion/conversion before qualification; STL generally lacks material/rig hierarchy and requires reconstruction. Outputs for the browser are normalized rigged GLBs plus a manifest irrespective of source format. Conversion must preserve scale, coordinate frames, materials and provenance.

## 4. MVRS-1: Meridia Vehicle Rig Standard

Define an import-independent **Meridia Vehicle Rig Standard (MVRS-1)** with one canonical vehicle frame (+Y up; +Z forward; metres) and explicit transforms from every original source frame. GLB source orientations are a first-class metadata input, not an assumption derived from model names.

Reference hierarchy (names illustrative, IDs governed by the manifest):

    VehicleRoot
      ChassisVisual
      DriverSeatAnchor
      CameraAnchor
      Wheels
        axle0_left
          SteerPivot
            RollPivot
              TireGeometry
              RimGeometry
        axle0_right
          SteerPivot
            RollPivot
              TireGeometry
              RimGeometry
        axle1_left
          RollPivot
            TireGeometry
            RimGeometry
        axle1_right
          RollPivot
            TireGeometry
            RimGeometry

A pivot can exist even if the car has no separate decorative rim; conversely, real brake calipers and suspension arms must not inadvertently rotate as tire surfaces. Independent tire and rim source components must share a rolling pivot; brake discs/calipers require vehicle-specific evidence for their own motion.

**Required manifest fields:**
- schemaVersion; modelId; immutableSourceHash; qualifiedGLBHash; qualifiedArtifactURI; authoringToolVersion; qualificationReportId; state.
- units; source coordinate frame; normalized vehicle frame; sourceToVehicle transform, handedness and forward/up definitions; visual-to-physics chassis transform.
- chassis dimensions and collision envelope; wheelbase; axle positions; contact reference plane; parking/seat/camera anchors.
- wheels[] of arbitrary length: stable wheelId, axleIndex, side/location, hub node, steer node (nullable), roll node, exact associated source meshes/material primitives, center in normalized chassis coordinates, wheel radius (calibrated, not only fallback), lateral axle axis, rollSign, steerSign, steerable boolean, steer max, steering group, contact patch/support offset and rig-evidence confidence.
- geometry preservation summary, materials/textures and render validation hashes, warnings and explicit limitation codes.
- import/run performance budgets and optional LOD mappings for high/mid/far representation.

**Examples of machine-validated invariants:** expected node exists uniquely; no source mesh is assigned to incompatible wheel assemblies; wheel radii > 0, finite and within class-appropriate bounds; roll axes coincide with wheel axle normals; each hub lies near observed geometry center; axles and sides are not swapped; steering pivots do not rotate the whole chassis; animated meshes retain correct UVs, normals and tangents; source/derivative scale is consistent with chassis and Rapier collider.

The implementation should define a JSON Schema and a TypeScript type from a common versioned contract, backed by migration/converter tests. Avoid a handwritten manifest which reports success without test artifacts.

## 5. Asset normalization and topology repair pipeline

**Step 1 — Intake:** Accept owner-provided asset, compute SHA-256, record source filename, format, size, licensing/redistribution status, mesh/node hierarchy, material/texture count, animation tracks and compression extensions. The original is immutable. Apply size, complexity and archive-path safety limits before conversion. Never execute embedded scripts from untrusted authoring files.

**Step 2 — Decode and stage:** Run offline glTF/Blender-compatible tooling in a controlled, resource-limited environment; decode Draco/meshopt where present. Inspect normals, material primitives, skinned meshes and instancing; preserve multiple mesh materials and UV channels. Source coordinate transformation must be explicitly resolved.

**Step 3 — Wheel detection:** Combine node-name hints with actual spatial distributions, circular/toroidal structure, symmetry, contact plane, surface normals, mesh connectivity and optional author-supplied wheel-center annotations. Return per-corner/per-axle candidates with confidence and reasons. The Range Rover name/hub mapping is reference evidence, not a universal regex.

**Step 4 — Classes A/B rigging:** If each assembly is independently controllable, create real source-aligned hub transforms. Two independent pivots are preferred on steering wheels: steer about normalized vehicle local up, roll about each wheel's actual lateral axle axis. Reparent via preserved world transforms, retaining original materials, wheel visual center, offset and handedness. Keep hub nodes individually addressable after import and re-export.

**Step 5 — Class C extraction:** When wheels are baked into a combined mesh, attempt offline indexed connected-component analysis and measured circular surface clustering first. A source may be Draco-compressed but must be decoded and re-exported **once during onboarding**, not decoded and partitioned for each gameplay load. Source islands may include separate tires, rim faces and caps; all relevant wheel parts must be grouped while chassis panels and wheel arches stay with the body. Where components share vertices/welds, automated cutting is inherently uncertain: create a repair task with annotated proposed cuts; do not use arbitrary distance slicing in the live game.

**Step 6 — Class D reconstruction:** In Blender/editing tooling, model or fit approved wheel assemblies to measured axle positions, radii and wheel arches; preserve the original body silhouette to the greatest extent possible. Track whether changes are original extraction vs new modeled geometry. Owner approves appearance before rig qualification. Do not portray geometry replacement as lossless extraction.

**Step 7 — Export:** Emit new MVRS-1 qualified GLB derivative and manifest, source/derivative hashes, quality report and optional lower-LOD variants. Preserve immutable source and capability to reproduce every transformation. Reject glTF output that produces a visually valid wheel but no controllable pivot.

**Step 8 — Qualification:** Run real artifact through an offscreen/visible Babylon renderer and deterministic driving commands. Save screenshots/video frames and metrics. Auto-approve only when all mandatory tests are demonstrably met; otherwise manual asset review. Registry promotion is a separate explicit action.

A safe transaction must leave the original untouched after failure. Partial extraction must never leave a broken GLB in the approved asset registry.

## 6. Universal wheel motion semantics

**Input:** The existing Rapier/chassis driving controller provides authoritative vehicle pose, linear and angular displacement, longitudinal direction/speed, current control steering angle, moving/stopped state and the elapsed fixed-physics step. Player, touch, keyboard and AI route commands must pass through one normalized vehicle-control interface.

**Rolling:** For wheel i of effective radius r_i:

    deltaRoll_i = signedLongitudinalTravelOfWheel_i / r_i

Project measured physical displacement at each wheel hub onto that wheel's local road-tangent longitudinal direction; account for body yaw and varying left/right path length during turns. Do not spin tires in proportion to purely lateral skidding or raw throttle when no actual displacement occurs. Sign must reverse when backing up. Accumulate phase modulo 2π to avoid long-session precision drift. Calibrate lateral direction/roll sign from asset manifest and front direction, not global X/Z guessing.

**Steering:** Map authoritative signed steering input to steerable wheel pivots only. Default front-axle steering should follow wheel geometry; optional Ackermann steering uses measured wheelbase L, track T and turn radius R:

    innerAngle = atan(L / (R - T/2))
    outerAngle = atan(L / (R + T/2))

Clamp maximum steer and handle zero/near-zero radius safely. The inside wheel must visibly steer more, but equal-angle steering is an allowed transitional profile when wheel geometry has not yet been validated for Ackermann. Rear and additional steering axles can declare independent steering groups/signs; nonsteering axle hubs must not rotate about steering axis. Steering at rest changes steering angle without generating false rolling.

**Transform composition:** Preserve bind/author quaternions. Use axle-aware steering-pivot rotation and independent roll-pivot rotation so turning and rolling do not interfere; avoid overwriting one rotation with another. Do not rotate brake calipers, cabin, tires attached to wrong axle, or entire chassis. Parent transforms and nonuniform scales must be normalized before applying local-axis math.

**Collision and road contact:** Four visual wheels should meet actual street/curb geometry without hovering or sinking. Calibrate wheel contact surface against the **real Rapier road**, not merely the height of the visual pavement texture. Do not infer traction from visual wheel motion; suspension, slip, friction and dynamic wheels remain a separate physics design decision. Stop/Rapier blocking should stop rolling; turning controls should continue steering if that is allowed by the chosen model.

**Temporal behavior:** Update animated wheel transforms in the correct order relative to fixed Rapier stepping, chassis pose interpolation, and render update. No transient frame in which body position advances but wheels are rendered against old pivots; no velocity multiplication by frame rate twice. Use deterministic tests at variable FPS/2× time scale.

**Shared engine:** Model-specific metadata is permitted, bespoke per-brand wheel-control code is not the final target. The working Range Rover adapter should become a regression fixture and a migration example, not a permanently privileged code path.

## 7. Runtime admission contract and fallback

Runtime states per asset: VISUAL_ONLY, RIG_PENDING, RIG_READY, DRIVE_APPROVED, REPAIR_REQUIRED, REJECTED. RIG_READY is not sufficient for owner acceptance. On player entry or AI activation, verify the matching manifest/version has DRIVE_APPROVED, all expected wheel pivots are available, steering groups are valid and actor handoff is safe.

**On mismatch:** Keep vehicle parked as a visual specimen or mark unavailable with a visible test diagnostic; do not permit chassis-only skating or construct ghost/duplicate collision bodies. Do not block the entire game startup on an optional unqualified specimen. Source model may be shown for evaluation without declaring it traffic ready.

**Compatibility:** No loss of accepted Range Rover behavior, driver positioning, camera, boarding/exit, braking, reverse or road/curb physics. Preserve source-car identity and asset-hash evidence. Removing Ferrari/Buggy in review branch VEH-013 does not imply deleting reusable physics helpers; their existing controller logic may still be inherited by approved vehicles.

## 8. Observability and Supabase model

Startup LOAD-060/061 metrics are separate from wheel qualification. An existing Supabase startup run is **not** evidence that any wheels moved correctly.

New proposed (not yet migrated) data model:
- vehicle_asset_versions: modelId, sourceHash, derivativeHash, format, original/derived byte sizes, manifest version, source provenance, current readiness state, artifact references.
- vehicle_rig_qualifications: qualificationId, modelVersion, pipeline version, classification A/B/C/D, wheel count expected/detected, pivot mapping evidence, test result, issues/warnings, accepted reviewer and accepted timestamp.
- vehicle_wheel_test_runs: build SHA, device/browser class, scenario, rig version, physical displacement, per-wheel commanded and actual rotation, steer angle, tire-road-contact error, asset import ms, main-thread stall and FPS/frametime percentiles.
- wheel repair queue: source/version, error codes, annotated ambiguous parts, proposed edits, human approval and derivative output. Do not store model binary in JSON rows.

Protect tables with row-level security, minimize telemetry and keep service-role credentials server-side. Limit logging rate: capture wheel problems on drive startup and sampled test scenarios, not high-frequency game telemetry from every frame. The diagnostic contract must expose per-wheel bound/failed states, actual transforms, and reasons, including 'wheel_source_welded_to_chassis', 'ambiguous_hub', 'wrong_roll_axis', 'source_mesh_missing', 'road_contact_unverified'.

## 9. Test matrix and quantitative acceptance

**Synthetic logic tests** are permitted as unit tests, but **real owner source GLBs/qualified derivatives** must be tested before approval.

Test across these command scenarios for each declared steerable wheel and each road wheel:
1. Forward on level road: rolling sign and traveled-distance ratio match verified calibrated radius; no stationary wheel illusion.
2. Reverse: roll sign reverses; no discontinuous phase snapping.
3. Left/right turn, including steering at standstill: only declared steerable axles yaw; no rear-wheel steering unless configured.
4. Moving curved path: left and right wheel travel/roll correctly diverge; wheels do not appear to skid.
5. Brake and obstructed motion: wheels cease rolling when physical displacement ceases.
6. Road contact on flat road, slight grade, curb, uneven street and different shadow/LOD conditions: no noticeable tire-ground gap or penetration.
7. Rig integrity under animations: no missing rim face, detached body, torn UV, duplicated surface, reversed normals or disappearing wheels.
8. Boarding, exiting, parking, re-entering: collider ownership and camera/Voight remain correct, including drive-state UI.
9. Source change / wrong manifest: qualification invalidated; model not silently admitted.
10. Actual desktop and Android playback with screenshots/video evidence; approval comes only after observed quality.

**Initial proposed measurable tolerances for engineering calibration** (not claims about current assets): wheel-center/axle deviation <= 0.03 m after normalization; left/right axle-center disagreement <= 0.03 m; visual tire contact deviation <= 0.05 m on accepted flat road; rolling distance from wheel phase within 5% of actual longitudinal hub travel in a straight-line constant-speed test; steering sign correct 100% of tested left/right cases. Set and record tolerances per vehicle category and device only after the Rover baseline is measured; never silently loosen them to force a pass.

**Performance gate:** preserve the 60,000 ms cold-start-to-first-actually-playable-frame SLO; benchmark asset delivery, decode, mesh/material counts, shadow/render cost and shader compilation. The rigged derivative should not force per-load topology analysis. Compare mobile and desktop warm/cold startups, but do not claim cohort p95 from fewer than sufficient observed real sessions. Benchmark near/mid/far animated wheel LODs as traffic count scales toward 125 logical vehicles.

**Acceptance artifact:** Each qualified model needs a manifest, hash list, automated metrics, visual before/after captures, in-game drive capture and explicit owner acceptance. 'Tests passed' or 'GLB loaded' alone cannot close this gate.

## 10. Scalability for the 125-car traffic directive

- Store one original and one or more qualified derivatives per model; use shared meshes/textures where Babylon import permits, but independent pivot transforms per vehicle.
- Author five material/paint variants per model without rerigging each source if geometry is identical; material reuse must not accidentally clone independent high-poly meshes.
- Near field: full rig, steering and wheel roll, appropriate tire contact and visual fidelity.
- Mid field: preserve correct apparent turning/rolling with reduced geometry and/or lower animation update cadence; avoid visible snapping.
- Far field/offscreen: logical traffic agents and culled/LOD presentation; resume correct wheel phases as vehicles become visible.
- Do not spawn 125 heavyweight render instances at once simply to satisfy a logical fleet count. Test 0/1/5/25/50/75/100/125 traffic-instance cohorts, actual render indices and cold startup. Preserve 60-second attention-window objective.
- Fleet geography and traffic laws remain separately gated; this document does not authorize city expansion.

## 11. Concrete per-model qualification campaign

| Model | Known evidence | Required onboarding |
| --- | --- | --- |
| Range Rover Sport 2018 | Owner visually confirmed wheels turning correctly; bespoke four-hub adapter exists | Record existing source-hash, wheel hierarchy, axes/signs, real rolling + steering capture and contact as **reference fixture**; preserve visuals/controls |
| Toyota Hilux 002 | Original renders and drives, but owner reports wheels stationary; generic name-based detection not sufficient | Inspect actual source hierarchy/topology; repair pivot placement or split wheels offline, then run exact-artifact wheel tests |
| Land Rover Defender 001 | One Draco-compressed combined render mesh; owner reports wheels stationary | Controlled offline Draco decode + topology audit; real geometry separation or supervised authoring; re-export independently controllable tires/rims |
| Dodge HP | Original renders and drives, but owner reports wheels stationary; no verified wheel extraction mapping | Audit source nodes, wheel geometry and transform axes; classify A/B/C/D, qualify repaired derivative or queue human authoring |

Do not assume the Toyota and Dodge share the Defender's topology. Do not mark any of the three as repaired until the actual owner-provided GLBs pass real-source qualification.

## 12. Implementation plan with owner gates

**W0 — Architecture and acceptance freeze (documentation-only).** Accept this MVRS-1 design or request changes; capture exact current visual evidence, hash source assets and identify baseline revision. Gate: written acceptance of model/asset qualification contract and scope.

**W1 — Rover golden specimen.** Instrument and export the accepted Range Rover's actual wheel map, movement/steering transforms, tire contact and visual evidence as golden reference. Add deterministic real-GLB regression. Gate: no change in accepted driving experience, and baseline metrics recorded.

**W2 — Asset analyzer, classification and manifest.** Implement offline mesh hierarchy/geometry probe and MVRS-1 schema; output inspectable classification, wheel candidate confidence and actionable failure codes. Run all four real GLBs. Gate: accurate class per source, no geometry mutation on ambiguous input.

**W3 — Non-destructive rigging for class A/B.** Implement source-aware pivot normalization and preserved-world-transform reparenting; qualify Toyota/Dodge if their originals allow it. Gate: original visual quality intact and command-driven wheels confirmed on actual models.

**W4 — Offline class C/D repair.** Pilot the Defender source. Automate separation only for provable surfaces; use supervised Blender editing for welded or ambiguous tires, preserving rims/materials/body. Export immutable derivative plus manifest and report. Gate: before/after inspection and first successful Defender drive with animated tires.

**W5 — Universal runtime integration.** Refactor into manifest-backed wheel controller, admission policy and shared player/AI command interface while preserving accepted Rover behavior and existing Rapier physics. Gate: no four-model chassis-only drive state, four accepted wheel systems, and no ghost colliders.

**W6 — Performance + device validation.** Benchmark actual desktop/Android startup and render quality, wheel/contact tests, cold/warm. Gate: 60 s or better under accepted representative test conditions, with root-cause diagnostics for overrun, no graphics-quality regressions.

**W7 — Onboarding productization and fleet scale.** Automate artifact registry, CI, repair queue and Supabase qualification data, then test color variants, LOD and traffic-scale wheel animation. Gate: a previously unseen sample asset can be processed end-to-end with declared exceptions, not hand-coded in the game.

A phase is not auto-authorized by completion of the preceding one. Human acceptance controls modifications to original branded GLBs, reauthored geometry and promotion to main. All review variants must stay isolated from failed/decommissioned WORLD-006/GEO-R1 branches.

## 13. Deliverables, ownership and closure criteria

Required planned artifacts:
- MVRS-1 JSON Schema, TypeScript contract and sample per-model manifest.
- Offline source audit CLI, classification report and reproducible conversion/repair pipeline.
- Original/derived GLB artifact registry with provenance and immutable source retention.
- Four verified rig manifests, wheel geometry validation evidence and owner-approved clips.
- Shared per-wheel runtime steering/roll controller, compatible with existing Rapier and UI.
- Regression suite using *actual source assets*, plus real device visual tests.
- Qualification dashboards/limited Supabase telemetry and documented failure procedures.
- 125-car-scale performance evidence without violating the 60-second startup SLO.

**Definition of done:** Every currently approved drivable GTD model has independently functioning, visibly correct wheels in actual gameplay; future models cannot acquire DRIVING_APPROVED without the same proven capability; non-rigged models can be repaired/qualified without recurring game-runtime hacks; real device performance and accepted rendering quality are preserved.

**Authority statement:** This is a codebase technical proposal. No implementation permission is implied by creating or committing this file.
