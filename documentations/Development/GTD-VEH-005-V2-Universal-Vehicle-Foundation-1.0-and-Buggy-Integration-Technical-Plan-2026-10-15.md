# GTD-VEH-005 V2 — Universal Vehicle Foundation 1.0, Steering Animation and Buggy Integration

**Date:** 2026-10-15  
**Status:** **TECHNICAL PLAN ONLY — SECURITY/SEC-CHECK REVIEW AND EXPLICIT OWNER IMPLEMENTATION AUTHORIZATION PENDING**  
**Repository:** interlinkglobal/GTD  
**Reviewed baseline:** main at \`896ceb744976c9bfde51076ba544d434b2b5081d\` (documentation-only update beyond the previously deployed Fit004 release \`cf12e5f2ef58bbe276cc5a18bfb5cbb2a5b44a78\`).  
**Canonical current playable reference:** https://grand-theft-division.vercel.app/game  
**Supersedes:** [GTD-VEH-005 original plan](./GTD-VEH-005-Steering-Wheel-Animation-Buggy-and-Truck-Drive-Activation-Technical-Plan-2026-10-15.md). Keep V1 for decision history; do not execute its ordering or third-truck stages.  
**Governing owner clarification:** “Truck” was a mistaken reference to the Buggy; exactly two current target vehicle classes are Ferrari and Buggy. “Buggy can move” means technical feasibility, **not an existing player-drivable runtime**. Every vehicle must inherit the universal Ferrari-proven foundation; differences must be vehicle-specific parameters or opt-in capabilities to a common physics model. The foundation, including the known floating/tire-contact defect, **must precede** steering-wheel animation and Buggy activation. Plan first → security/review and explicit authorization second → implementation last.

---

## 0. Executive contract — what this programme is and is not

**Objective:** turn the existing Ferrari-specific playable trial into a single deterministic, physically consistent, safely extensible vehicle runtime. Prove it on the Ferrari without losing the accepted experience. Then build a reusable cockpit steering-wheel/hand animation component. Finally activate the already imported, currently parked off-road Buggy by supplying measured vehicle metadata and the same runtime interfaces.

**Non-negotiable physics rule:** all vehicles use one simulation/constraint vocabulary: units (m, s, radians), gravity, integration clock, collision reporting, surface classification, ground-support decisions, obstacle protection, velocity and steering kinematics, and diagnostics. Each vehicle supplies bounded physical data (mass/inertia if eventually simulated, wheel positions/radii, wheelbase, track width, ground clearance, steering range, suspension travel if modeled, drive limits and the actual cabin geometry). **One algorithm, different parameterized outcomes.** The Ferrari is a *regression specimen*, not a universal parameter preset.

**What is not authorized now:** no source patch, branch implementation, new GLB import, change to mobile controls, game-world mutation, preview/deployment, merge, production flag change or decommission of Ferrari functionality. This file is a proposal for review. A successful plan review/security check does **not** itself authorize coding.

**In scope, in order:**
1. Universal Vehicle Foundation 1.0, including first-class tire-ground support and honest obstacle/chassis collision.
2. Ferrari steering-wheel assembly animation synchronized to the same steering state and Voight's hands.
3. Buggy asset qualification, drive activation, dedicated driver cabin fit and final multi-vehicle acceptance.
4. Independent evidence and release process throughout.

**Explicitly out of scope:** third truck; ambient traffic AI, pursuit, damage, fuel, multiplayer, commercial asset replacement, monetization, wheel-force feedback, and an unapproved full rigid-body vehicle/suspension model. Nothing in this plan reopens accepted night sky, building materials, tree/grass, position metadata, Ferrari imported scale or other world-visual baselines.

## 1. Evidence register — what main actually supports

1. \`src/game/vehicles/first-drive-trial.ts\` exports a configurable \`StreetVehicleActor\`, but its current translation is a **single kinematic Rapier rigid body with a full-chassis cuboid collider** driven by a Rapier kinematic character controller (KCC). It accepts a \`StreetVehiclePhysicsProfile\` and \`StreetVehicleWheelMapping\`. \`FirstDriveTrial\` remains the Ferrari compatibility adapter. The code explicitly identifies this as an L0 kinematic chassis prototype, **not independent wheel/suspension physics**.
2. \`src/game/vehicles/street-vehicle-physics.ts\` defines \`FERRARI_STREET_PROFILE\`: source forward sign -1, max autostep 0.24 m, snap 0.25 m, gravity 9.81 m/s², max climb 0.09 m/tick, and a fallback radius. These are *current Ferrari numbers*, not universal constants to copy blindly.
3. \`src/game/vehicles/drive-kinematics.ts\` operates at a bounded step with \`DriveState(speedMps, steeringRadians)\` but uses the module-level Ferrari \`DRIVE_LIMITS\` (including wheelbase 2.65 m). Vehicle-class dependency injection is incomplete.
4. \`src/game/vehicles/street-vehicle-wheels.ts\` animates real four-wheel named pivots and supports a spin-invariant tire contact profile. Optional visual wheel travel **does not** establish physical tire support. A missing tire/pivot must remain a failed witness, never be replaced by a fabricated support.
5. \`src/game/vehicles/vehicle-road-surface.ts\` can identify rendered asphalt/sidewalk surfaces; \`vehicle-fit-diagnostics.ts\` exposes read-only individual tread/visual-road/physics witnesses. These are building blocks for a stronger common ground-support authority, not proof that such a solver already exists.
6. \`src/game/core/gtd-runtime.ts\` currently registers \`sportsCars\`, \`drivingTrial\`, \`toggleFerrariDriving\`, \`syncFerrariDriverSeat\` and Ferrari-specific camera/interaction logic. It activates **sports** imports as \`FirstDriveTrial\`; the **offroad** imports are parked, not player-drivable. Ferrari Fit004 is enabled on the canonical production host; experimental ground fit and visual wheel travel are not.
7. \`src/game/experiments/vehicle-probe-plan.ts\` declares two pinned GLB source families: Ferrari \`sports\` (4.53 m target length; accepted width 1.05×, height 1.10×) and Buggy \`offroad\` (4.05 m target length; accepted width 1.10×). Existing parked car instances follow deterministic source selection. **No third truck exists in the proposed scope.**
8. \`src/game/character/driver-cabin-pose.ts\` and accepted Fit004 use the Ferrari's real steering rim/UAL \`Driving_Loop\`, bone parity-aware IK and foot/calf floor measurement. These have **owner desktop and mobile acceptance for the Ferrari's visible seated result**. Fit004 clearance is not equivalent to a certified closed three-dimensional cabin for other cars.
9. **Open defect:** GTD-VEH-CABIN-FIT-003 deep investigation reproduced a car-scale cuboid which autostepped ~0.10–0.20 m at the side of a raised curb while both sampled tire positions remained above lower road. KCC \`grounded=true\` did not imply tire contact. The exact owner-browser-frame geometry was not captured; the *failure mechanism* is source-supported and reproducible.
10. **Quality gate reality:** tests and a green Vercel build have previously coexisted with visually failed character-fitting/grounding experiments. Acceptance must include measured real imported assets **and** owner-observed desktop/mobile gameplay.

**Source-of-truth precedence:** current typed source and real pinned asset geometry → reproducible Babylon/Rapier diagnostics → current field screenshots/owner decision → documentation assumptions. This V2 intentionally distinguishes verified baselines from unmeasured geometry and future design choices.

## 2. Architecture: one runtime, multiple vehicle definitions

### 2.1 Logical dependency map (proposal, not existing modules)

\`\`\`text
User keyboard / mobile controls / pause
                  |
           DriveInputAdapter
                  |
     Fixed-tick VehicleSimulation (ONE owner)
        /            |             \
  DriveKinematics  GroundSupport   ChassisObstacles
  [vehicle tuning] [4 real tires]  [Rapier collisions]
        \            |             /
              VehiclePose
               /      \
  ImportedVisualRig    Camera/Boarding/DriverSeat
  [wheels/rim/LOD]     [vehicle-owned metadata]
               \      /
          RuntimeDiagnostics
                  |
 VehicleInstanceRegistry → FerrariProfile | BuggyProfile | future profile
\`\`\`

The arrows express data ownership, not a proposed second physics world. \`MeridianPhysics\` and its single fixed-step Rapier world remain the authoritative collision simulation. **One authoritative vehicle pose is committed once per tick.** Avoid simultaneous independent Babylon height correction and Rapier vertical commands that disagree. All decorative animations read the committed pose/steer state.

### 2.2 Proposed typed contracts

These are **interface outlines**, not source to paste unchanged:

\`\`\`ts
type VehicleClassId = "ferrari" | "buggy"; // extensible later
type WheelCorner = "frontLeft" | "frontRight" | "rearLeft" | "rearRight";
type SupportState = "supported" | "partial" | "airborne" | "blocked" | "unknown";

interface VehicleDefinition {
  readonly classId: VehicleClassId;
  readonly sourceId: string;                 // pinned manifest key, not arbitrary URL
  readonly version: number;
  readonly dimensions: { lengthM: number; widthM: number; heightM: number };
  readonly drive: DriveTuning;               // per-class bounded numbers
  readonly collision: CollisionProfile;
  readonly wheelRig: FourWheelSpec;          // verified asset-specific local pivots
  readonly groundSupport: WheelSupportPolicy;
  readonly steeringAssembly?: SteeringAssemblySpec;
  readonly seatAndCabin?: CalibratedCabinProfile;
  readonly cameraAndExit: CameraExitProfile;
}

interface WheelSupportWitness {
  readonly corner: WheelCorner;
  readonly pivotCarLocal: readonly [number, number, number];
  readonly tireRadiusM: number;
  readonly tireBottomWorldY: number | null;
  readonly renderedSurfaceY: number | null;
  readonly physicsSurfaceY: number | null;
  readonly surfaceId: string | null;
  readonly kind: "road" | "sidewalk" | "terrain" | "unsupported" | "unknown";
  readonly grounded: boolean;
  readonly confidence: "measured" | "unknown" | "invalid";
}

interface VehicleTickResult {
  readonly pose: VehiclePose;
  readonly velocityMps: number;
  readonly roadSteerRadians: number;
  readonly support: SupportState;
  readonly wheels: readonly WheelSupportWitness[]; // four unique corners
  readonly blockedReason?: string;
}
\`\`\`

**Validation:** immutable class specs, unique instance IDs, four distinct corners, physically plausible and finite dimensions/axes/radii, unambiguous local-to-world transforms, upper bounds on speed/steer/lift, and pinned trusted source assets. Invalid metadata blocks vehicle activation with a diagnostic; do not introduce fallback magic values that fabricate a PASS.

### 2.3 Separation of ownership and responsibilities

- **DriveInputAdapter:** current keyboard arrows/WASD and touch buttons, with normalized \`[-1,+1]\` steering/throttle; no second mobile code path with divergent speed or turn rules.
- **DriveKinematics:** shared bounded longitudinal acceleration/coasting/braking/reverse and bicycle-model yaw; accepts \`DriveTuning\`. Ferrari parameters remain exact accepted reference until changed by a separately authorized tuning gate.
- **VehicleGroundSupport:** computes real tire-footprint support and vertical eligibility, including support state; cannot use full-chassis \`computedGrounded\` as four-tire proof.
- **VehicleChassisObstacles:** retains walls, buildings, garage no-step boundaries, parked objects and controlled curb contact. A chassis collision can block motion but must not become an unexplained source of sustained vertical lift while the tire supports are on lower asphalt.
- **VehiclePoseIntegrator:** derives one legal world pose after both ground and obstacle decisions, commits to Rapier once and synchronizes Babylon from it.
- **VisualVehicleRig:** spins/steers real wheel pivots using traveled distance, animates steering wheel and optional details; **never independently teleports the physical chassis**.
- **VehicleCabinAdapter:** owns seat/camera/exit/Voight pose from a class-specific calibrated interior; Fit004 Ferrari profile remains the accepted reference, not a global default for Buggy.
- **VehicleRegistry:** manages one active driver and multiple deterministic parked instances, independent imported template nodes, collider ownership and lifecycle.

## 3. Vehicle Foundation 1.0 — mandatory first release workstream

### F0 — Freeze Ferrari/production baseline and establish causality

1. Record current \`main\` and READY production SHA, asset revision identifiers, GLB dimension witnesses, feature flag values, desktop/mobile control behavior, camera and FIT004 seated appearance. Preserve a reversible reference deployment.
2. Inspect *current production*, including fixed-step 60 Hz behavior, input steering signs, forward/back, curb, garage sill, stopped exit and move A→B. Do not infer acceptance from isolated test code.
3. Capture **before** tire/ground telemetry for four unique pivots plus chassis collider, visual anchor and road IDs. Include low/side/rear-underbody/top camera positions, same coordinates and heading, before/during/after movement. No silent manual repositioning between A/B runs.
4. Reproduce the edge-case from the documented Rapier experiment (chassis overlapping a 0.11/0.21 m curb while all tire centers sit over asphalt), plus a near-edge but completely unoverlapped control.
5. Define a golden \`FerrariDrivingSnapshotV1\` and immutable video/screenshot evidence for ground/contact, steering sign, exact existing speed and exit. Mark unknown measurements explicitly; screenshots cannot invent metres.

**Exit:** baseline reproducible and a mechanically measurable failure signature captured. If current gameplay cannot reproduce the exact floating event, still retain the deterministic independent collider-overlap test and state the difference.

### F1 — Isolate a common vehicle core without behavior change

1. Extract \`StreetVehicleActor\` into a class-neutral wrapper around \`DriveKinematics\`, \`VehicleGroundSupport\`, \`VehicleChassisObstacles\` and \`VehiclePoseIntegrator\`. Keep \`FirstDriveTrial\` as a Ferrari compatibility adapter until regression proof; do **not** rewrite the entire world loop.
2. Turn the module-level \`DRIVE_LIMITS\` into injected \`DriveTuning\` **while preserving the exact Ferrari defaults and signed yaw/forward orientation**. Baseline values are reference data, not universal physical laws.
3. Specify a single global step order: sample input → integrate speed/steer → propose swept planar motion → collide/obstacle-check → query tire support → resolve constrained vertical pose → commit Rapier → update Babylon → wheel visual animation → driver animation → camera/HUD → diagnostics. Specify how input state/pause behaves at zero or dropped frames.
4. Ensure \`MeridianPhysics\` steps its world **once per fixed tick**. Multiple active vehicle controllers cannot independently step Rapier. Correct teardown of instance-specific bodies/colliders/listeners/animation groups.
5. Add pure deterministic regression tests comparing the old Ferrari drive snapshot and the refactored code with identical tick/input traces, within documented numeric tolerances. No visible UX change should be accepted from an architectural refactor alone.

**Exit:** Ferrari A/B parity and full baseline pass. No Buggy activation, steering wheel motion, new camera behavior or graphics changes.

### F2 — Build a trustworthy per-wheel ground and visual-surface evidence layer

1. Read four **real** tire profiles from each imported model, use source-specific pivot coordinates and signed axle orientation, and sample contact on the real tire tread (not radius fallback as “verified”).
2. Query Rapier support and the matching rendered road/sidewalk/terrain surface at the same XZ tire footprint. Reconcile their known vertical offsets, and track metadata identity, normal, rise, confidence and support material. Actual asset mesh data and authored road polygons are primary witnesses.
3. Guard stale/unknown surfaces, gaps, steep slopes, garage thresholds, thin sidewalk edges, holes and changing terrain height. Represent \`UNKNOWN\` and \`UNSUPPORTED\` explicitly; never turn an absent ray hit into Y=0 or a false grounded state.
4. Cache immutable asset-space wheel shape, material identity and surfaces where valid. Sample only local relevant collision geometry each tick or when movement changes support; avoid \`getDescendants()\` or full city-wide triangle scans per frame.
5. Diagnose the consistent visual render-to-Rapier asphalt offset separately; do not apply one-time visual correction as a substitute for continuing physical support. A wheel animated in place is not proof of support.
6. Publish a nonmutating \`VEH-FOUNDATION-001\` diagnostic containing four wheel corner IDs, four tread and surface heights, four surface witness statuses, chassis contact, roll/pitch/yaw, obstacle block reason and tick/sample cost.

**Exit:** all four matched supports are sampled where real geometry exists; missing/wrong/unsupported samples correctly fail; metrics have a known schema and are reproducible in Babylon NullEngine and actual deployed browser.

### F3 — Correct grounding authority while retaining honest chassis collision

**Engineering choice:** prefer a **deterministic four-contact kinematic ground-support model** for Foundation 1.0, keeping Rapier obstacle collision. This is a bounded intermediate architecture appropriate to the current game, not a claim to full dynamic tire suspension. A full wheel-joint rigid-body model is a separately costed alternative, not a hidden dependency.

Plan of calculation (conditional proposal):
1. At each fixed tick, predict the four footprint positions for the proposed planar pose using the car-local wheel pivots.
2. Resolve eligible support candidates from correctly matched rendered geometry and Rapier collider evidence. Prevent a raised sidewalk outside all tire footprints from being selected as vertical **wheel** support just because it intersects the chassis cuboid.
3. Compute legal ride-height and pitch/roll from validated tire supports and the vehicle profile; bound body pitch/roll and suspension range to calibrated values. If the current Ferrari rig cannot express reliable pitch/roll without regressions, document a yaw-only Foundation subphase with strict support/error gates rather than declaring it a complete suspension simulation.
4. Use swept chassis collision for obstruction/no-step decisions. If a raised obstacle requires impossible chassis clearance or wheel support, **block horizontal travel**. Never solve by lifting the whole car above four lower road contacts or shrinking its collider.
5. Make road curbs a **capability defined by real wheel/ground-clearance geometry and vehicle configuration**; the shared solver handles them consistently. Retain the 0.22 m tagged garage sill's obstruction and 0.21 m ordinary curb scenario as explicit Ferrari regression cases. Autostep may need removal/reconfiguration for vertical decisions; any such change must retain walls/garage protection.
6. If fewer than four supports exist (bridge/dropoff/crest), use an explicit supported/partial/airborne policy based on geometry and gravity, not a blanket four-contact clamp. Preserve realistic transient airborne time and descent. **Do not invent support where all four road rays are missing.**
7. Integrate one authoritative kinematic body pose, including visual body-to-chassis/tire offset. The visual car and Rapier collision/body are not independently altitude-corrected by old calibration and new support code at the same time.
8. Ensure visual wheel compression is downstream presentation: it can display physically legitimate suspension travel if evidence exists but must not mask a floating chassis.

**Candidate acceptance targets** (provisional until F0 source/noise measurement; these are acceptance proposals, not verified Ferrari tolerances):
- Flat supported asphalt: each verified tread-to-rendered-road vertical gap within ±0.02 m after stabilization; no floor penetration beyond the agreed skin/mesh tolerance.
- Road support and physical collider sampling remain separately present; no “grounded=true” if all wheels are unsupported.
- Raised curb overlapping chassis **outside tire tracks** must not create >0.02 m sustained wheel separation while vehicle is declared wheel-supported. If a tire cannot reach the ground, state \`partial\`/\`airborne\` and show physically justified geometry or block travel.
- There must be no persistent false-hover after travel, no teleport correction, no unbounded oscillation, and no generation of a new underground/hidden-wheel regression. Transitions should be bounded per tick with real dt.
- Actual tolerances for rough pavement/curb/ramps must be calibrated and versioned per support state, not globally forced to “four tires always touch” even when physically airborne.

**Hard stop:** if support model and accepted Ferrari curb/garage navigation cannot both be made correct at this fidelity, stop and present a measured engineering choice (bounded kinematic support vs real rigid-body wheel suspension) for new authorization. Do not conceal the conflict with a higher collider box or invented road plane.

### F4 — Parameterize validated physical outcomes, preserve Ferrari fidelity

1. Introduce schema-valid \`VehicleDefinition\` and immutable \`VehicleInstance\` contracts. Start with a **single Ferrari class** wired to the common foundation.
2. Distinguish shared physics equations from per-class characteristics: length/width/height, ground clearance, wheelbase, track, tire radius, steering range/ratio, acceleration, braking, coast, reverse, stability and curb clearance.
3. Separate **asset geometry** from **tuning**. Measure import-space wheel pivot positions/axes, axle-to-ground offsets and chassis bounds from actual GLB; do not silently scale a car to compensate for physics.
4. Freeze Fiat/Ferrari? **No renaming:** keep \`ferrari-evaluation\` class ID and accepted 4.53 m target import dimensions until a separately approved migration. Retain source immutability, deterministic seed/slot ownership and provenance.
5. Prevent lifecycle regressions: one active vehicle; once parked it retains collision; enter/exit never teleports to entry point; camera behind driving car on entry; original mobile touch sensitivity and arrow-control direction preserved.
6. Enforce cleanup/rollback so old and new support representations are not both active. “Single authority” is testable: assert no duplicated support solver, no second setNextKinematicTranslation after the final commit.

**Exit:** Ferrari maintains owner-accepted response and Fit004 seated appearance, now with mechanically valid wheel-ground evidence. Foundation v1 is **not** “complete” if old floating scenarios remain unresolved.

### F5 — Ferrari regression and foundation acceptance gate

Matrix includes:
- level road parked, slow/fast, forward/reverse, braking, turning left/right, stop/restart, repeated boarding and exit;
- **0.11 m and 0.21 m** sidewalk steps, chassis-only overlap, wheel-supported actual curb ascent, near-edge road driving, lane crossing;
- **0.22 m tagged garage sill** and larger walls/props; cannot step through protected collision boundaries;
- one wheel on sidewalk, two on curb, four on flat road, crest, ramp, incline, descent, pothole and a true missing-ground/airborne interval;
- yaw/camera all directions, low-side, **low-upward underbody**, overhead, rear, mobile landscape while moving;
- fit/camera invariant: Voight's head, torso, hands and FIT004 leg geometry retain user-accepted result;
- desktop load, real mobile performance, PWA installation/reload, heat/battery concerns, freeze/hitch regression;
- debug schema and identity: all supports finite or explicitly null, no four-wheel pass from a single chassis \`grounded\` status;
- independent before/after acceptance of vehicle movement and world asset placement (no out-of-scope city changes).

**Mandatory owner gate:** Ferrari Foundation 1.0 must pass automated source/asset/physics tests, a READY isolated preview **and owner desktop/mobile visual evidence** before continuing to steering-wheel development. A passing Vitest suite alone is insufficient.

## 4. Steering System 1.0 — only AFTER Foundation 1.0 acceptance

### SW0 — Forensic rig qualification, no gameplay animation yet

- Audit actual pinned Ferrari \`steering_leather\` exterior rim, \`steering_carbon\` inner trim, shaft/hub/spokes and transform hierarchy. Establish one wheel assembly, original quaternion, steering-axis local vector, pivot center and limits. If no distinct rotatable parent exists, evaluate a non-destructive single pivot with world matrix preservation. Do not rotate the entire dashboard.
- Verify the rest-local left/right grip points are on actual rim geometry. Distinguish their world-space pose from current static car-local contacts.
- Capture source revision/name paths and independent transformation test: no new model clipping and exact restoration on dispose.

### SW1 — Reusable steering assembly animation

- Consume the **committed** shared drive state \`steeringRadians\`. Wheel animation uses class-specific ratio/maximum travel, not a new control model; should recenter with the accepted smoothing/dt.
- Wheel quaternion = original authored quaternion × signed local-axis steering rotation. No cumulative numerical drift, duplicated bone ownership or steering from raw touch inputs.
- Steering wheel animation updates only the real rim, spokes and hub. Front tire steering remains bound to the same input state. Rendering updates must not change Rapier body, Y pose, speed, collision decisions or camera.
- Export truthful diagnostics: source mesh, hub transform/axis, rest/commanded angle, road steer, sign, missing nodes and disposal state.
- A/B Ferrari at neutral, left, right, reverse, pause/resume, rapid alternating input, wheel center and re-entry.

### SW2 — Voight's hands follow the moving wheel

- Maintain existing UAL \`Driving_Loop\`, accepted seated root and FIT004 foot/calf corrections. Apply in a deterministic documented animation order: base animation → current wheel assembly → current grip world matrices → upper-limb IK → existing lower-limb corrections → world/camera render.
- Reuse reflected-parent-space joint mapping and rollback; hand targets must follow the actual rim under its rotation in the same frame.
- Measure palm-to-rim contact and verify elbow/wrist reach, steering sign and geometry, not only hand bone-to-wheel-center distance. On unreachable target reject this frame's correction and restore accepted torso/limb baseline. Do not drag Voight or alter seat position.
- No steering-column intersection, leg leak, bizarre stretching or mobile frame hitch.

**Approval:** SW1 and SW2 are separate patches and acceptances. Ferrari first. Only then define this rig as an optional common capability that the Buggy may implement if its real GLB supports it.

## 5. Buggy Integration — inherit Foundation, supply only its own properties

### BG0 — Actual pinned Buggy asset and class qualification

- Confirm \`VEHICLE_PROBE_SOURCES.offroad\` pinned GLB and actual imported dimensions. Retain 4.05 m target length and accepted +10% width. Inspect the real wheel topology, radius, spin/steer axes, source facing, paint/rubber meshes, seat, door/open side, footwell, steering wheel and original transform hierarchy.
- Record a \`BuggyVehicleDefinition\` with measured wheelbase, track, clearance, max steer, acceleration/braking and suspension/ground policy suitable for its geometry. Do not paste Ferrari wheel mapping, steering ratio, cabin profile or character root. The shared *algorithms* remain identical.
- Note missing feature evidence as \`not-calibrated\` or \`missing-rig\`, rather than inventing pivot IDs and claiming eligibility. Reject duplicated GLB nodes/instancing transforms that would animate multiple parked Buggy vehicles simultaneously.
- Confirm asset rights/provenance and mobile decode/memory budgets; temporary imports are development assets, not an implied commercial rights grant.

### BG1 — Reusable boarding/active-vehicle lifecycle

- Replace \`sportsCars\` and \`toggleFerrariDriving\` as exclusive active-driving selectors with vehicle-instance metadata. Keep a Ferrari compatibility bridge until full A/B regression passes. No world position changes or new imports as part of registry extraction.
- Unify proximity detection, F and mobile enter/exit, stop-before-exit, safe physical exit position B, camera behind active vehicle, movement controls, speed feedback and error messages. Do not reuse Ferrari's camera radius, seat heading or teleport offsets for Buggy without fit.
- On activation hand off parked rigid-body collision **transactionally**; on abort/dispose restore the parked collider exactly once. Never leave ghost collisions, duplicate active actors or missing parked cars.
- Only one active vehicle per player. Switching requires a valid exit and real nearby entry; no remote board or shared mutable wheel instances.

### BG2 — Drivable Buggy in the shared physics system

- Instantiate the same core VehicleSimulation with \`BuggyVehicleDefinition\` and the real Buggy tire rig.
- Verify neutral, left/right, forward/reverse, distance-based rolling spokes, speed vs acceleration, slope, real curb geometry, garage no-step, avoidance of walls, collision, pause/resume, multiple parked Buggy instances and stop/re-enter cycles.
- Uphold support and collision invariants from F3/F5. Greater clearance should lead to different plausible behavior *through parameters*, not Buggy-specific physics branches that bypass constraints.
- If no verified wheel/road/cabin/seat geometry exists, keep the Buggy in PARKED or \`DRIVABLE-EXPERIMENT\` status with explicitly limited visual-driver capability. An arbitrary hidden rider is a separately authorized presentation decision, not an accepted universal cabin fit.

### BG3 — Calibrate Buggy cabin and steering capability

- Build its own measured \`CalibratedCabinProfile\`: real floor and interior boundaries, seat root/height, footwell, pedals, steering grip, reach/collider envelope, exit side and vehicle-local pose. The **Fit004 algorithmic approach is reusable**; its Ferrari-specific carpet material, 165-mm correction and geometry samples are **not** universal constants.
- Validate UAL head/back/torso, full calf/foot and hand contact on imported Buggy model, not just bone endpoints; no limb exits underbody from low camera views.
- Reuse SW1/SW2 only if a real rotatable Buggy steering assembly and grip surfaces are qualified. Otherwise make missing steering-wheel animation an explicit capability flag and block feature acceptance rather than rotating arbitrary mesh geometry.

**Approval:** BG2 drivability and BG3 visibly fitted driver/steering are separate human acceptance gates. No Buggy main merge solely because the model moves.

## 6. Security, integrity and sec-check gate (must precede code authorization)

**Plan-level threat model:** Imported GLB/asset URLs, untrusted metadata/source hierarchies, player inputs, debug interfaces, scene and physics object lifetime, PWA cache consistency and excessive computational work can compromise stability. Mobile resource exhaustion and fabricated contact evidence are quality/safety failures even without malicious code.

Required controls:
1. **Trusted asset manifest:** allowlisted source URLs and immutable pins/checksums; no untrusted user-supplied remote GLB, script, shader source or executable data from a vehicle profile; verify provenance/redistribution rights before commercial publication.
2. **Strong input/schema validation:** finite physical numbers, realistic bounds and nonzero radii/wheelbase, four distinct wheel corners, supported axle enums, normalized input, deterministic step limits; never use \`eval\`, arbitrary URL interpolation, dynamic shader generation or unsafe deserialization of vehicle profiles.
3. **Physics authority:** a single active controller and Rapier step per tick, no duplicate bodies and no client-side debug API that writes vehicle/physics state. Disallow false support/grounded claims; prevent out-of-bounds teleports and collider bypass.
4. **Scene resource ownership:** every node, material, skeleton, animation, event handler, collider and diagnostic reference has defined ownership/dispose behavior. Watch shared imported templates (no cross-vehicle animation aliasing), leaks and stale references on exit/re-entry.
5. **Denial-of-service/performance:** immutable tire profiles, cached local geometry, spatially bounded surface queries, bounded IK iteration and steering updates, no scanning every city mesh or every skinned character vertex per frame. Captured mobile frame-time and memory budgets are required before broad activation; the previous Fit004 headless calibration had a measurable high-frame spike.
6. **Privacy and telemetry:** instrumented reports are read-only, local-only by default, explicitly invoked and bounded. Do not collect precise user location, player trace, environment details or screenshots automatically to third parties.
7. **Release discipline:** feature flags on isolated previews; destructive changes require explicit owner approval. Protect production Fit004 defaults; preserve a known-good commit and versioned rollback. Ensure PWA cached assets/service worker do not combine incompatible script and GLB versions after rollout.
8. **Repository verification:** run \`npx tsc --noEmit\`, \`npm test\`/\`npm run test\`, \`npm run lint\`, \`npm run build\`, GitHub workflow checks and available approved dependency/security scans. Treat code analysis/CI as separate from owner visual approval. Do not report a **sec-check PASS** until the actual named gate has returned an explicit result; current repository workflows include FL-4 and Meridian CI checks but no verified standalone sec-check run was performed for this document.
9. **Fail closed and document exceptions:** an absent road/tire/cabin witness blocks acceptance; no opaque default radius or “all wheels touching” fabrication. Every exception must carry source SHA, observable risk, mitigation, reviewer, and explicit authorization before implementation can rely on it.

**SEC-0 outcome:** REVIEW REQUIRED. This text does not assert external security approval or authorize implementation by itself.

## 7. Verification matrix, numerical evidence and anti-regression gates

| Gate | Required proof | Release-blocking failure |
| --- | --- | --- |
| Foundation parity | Same Ferrari input trace against prior SHA; equivalent yaw, speed, road feel, entry/exit, camera and FIT004 | Changed steering sign, speed, seat/feet, camera or controls without approval |
| Single world authority | Exactly one Rapier world step and one accepted vehicle pose per tick; no double Y solver | Duplicated body/authority or discontinuous pose |
| Ground evidence | Four named tire positions, four matched rendered/collider supports and confidence | Chassis \`grounded\` promoted as four-tire proof |
| Curbs/obstacles | 0.11/0.21 m edges, 0.22 m protected garage threshold, sidewalk straddle and wall | False wheel gap, illegal garage climb or wall penetration |
| Airborne handling | Partial/unknown/unsupported support, bounded gravity and recontact | Invisible road creation, forced four-wheel clamp or permanent hover |
| Driver/visual | Accepted Ferrari Fit004 pose and road-wheel roll | Shoe/calf leak, floating wheels, rolling while stopped |
| Steering rig | Real hub, axis, signed response, recenter and rollback | Dashboard rotation or source-transform drift |
| Hand IK | Palm-to-moving-rim, no torso/foot interference | Stretched arms, wrong parent parity or broken Fit004 |
| Buggy import | Pin, four named verified wheels, correct body length/forward axis | Guesswork mapping, shared node mutation, missing asset license |
| Buggy drive | All active/parked, controls, real collision, safe exit and camera | Multiple active drivers, ghost collider, position A exit |
| Mobile/PWA | Actual mobile landscape; frame timing, loading, freeze/heat/memory and touch gestures | Only headless tests passed or visible live lag |
| Security gate | Approved sec-check/CI and threats/rollbacks reviewed | Unsafe asset inputs, writes via debug API, skipped review |

**Evidence artifacts per stage:** exact source/asset SHA; model-data and screenshot comparison; deterministic numeric replay and Rapier/Babylon tests; CI typecheck/lint/test/build results; Vercel preview ID and tested flags; desktop and actual mobile observed frames; explicit PASS/FAIL/UNKNOWN; owner acceptance or stop instruction. Tests cannot rewrite an observed visual failure into a success.

## 8. Ordered execution programme and authorization checkpoints

| Stage | Work | Authority gate | Prerequisite |
| --- | --- | --- | --- |
| P0 | Documentation review, scope reconciliation, security/sec-check review | **Pending** | This V2 plan |
| F0 | Baseline SHA, exact asset witnesses, read-only four-wheel diagnostic capture | Explicit authorization required | P0 approved |
| F1 | No-behavior-change shared vehicle contracts/actor refactor | Separate authorization and preview | F0 evidence |
| F2 | Ground surface and tire witness authority | Separate authorization and review | F1 regression pass |
| F3 | Wheel-supported vertical/chassis collision correction | Separate authorization and review | F2 evidence |
| F4 | Per-class tuning injected; Ferrari parity preserved | Separate authorization and review | F3 support pass |
| F5 | Ferrari Foundation 1.0 full desktop/mobile acceptance | Owner sign-off | F0–F4 and security gates |
| SW0 | Real steering assembly audit, no movement changes | New directive | F5 accepted |
| SW1 | Ferrari steering rim/spoke/hub animation | Owner preview sign-off | SW0 source verified |
| SW2 | Voight grip IK follows same-tick wheel | Owner preview sign-off | SW1 pass |
| BG0 | Buggy wheel/cabin qualification + own class definition | Owner authorization | F5 passed; can run after SW2 |
| BG1 | Shared board/exit/active-vehicle registry | Owner preview sign-off | BG0 source; Ferrari parity |
| BG2 | Player-drivable Buggy under universal physics | Owner desktop/mobile sign-off | BG1 and F5 |
| BG3 | Buggy dedicated cabin/steering and UAL fit | Owner desktop/mobile sign-off | BG2 and qualified cabin |
| R5 | Final integrated Ferrari/Buggy release | Explicit production merge/deploy | All relevant gates accepted |

**Implementation rule:** one behavior-changing patch per isolated branch; write test and failure criteria before patch; merge only signed-off work; retain exact rollback. Discovery can be read-only in parallel, **but execution cannot jump past failed foundation/grounding gates**. If F3 uncovers a deeper need for real suspension, stop and revise the approved plan before implementing unbudgeted dynamics.

## 9. Reversal and failure ledger

- **FND-001:** visually floating car despite body \`grounded\` → reject new foundation; capture four tire supports, curb footprint, KCC displacement; revert to accepted Ferrari baseline.
- **FND-002:** shallow curb traverse breaks or garage sill becomes traversable → reject changed collision authority, preserve existing no-step safeguards.
- **FND-003:** wheel collision support absent/unknown but runtime reports PASS → reject evidence system, surface source mismatch must be resolved.
- **FND-004:** new source changes accepted Ferrari controls/steering sign/animation/feet → rollback only offending module and compare to frozen Fit004.
- **SW-001:** wheel assembly rotates wrong components or accumulates quaternion drift → restore imported source hierarchy/quaternion.
- **SW-002:** grip target or upper-body IK displaces the accepted seated pose or new foot leak → rollback upper-limb wheel coupling, retain Foundation/Fit004.
- **BG-001:** Buggy pivot/forward axis/cabin unknown → remain parked/preview with explicit blocker, never inherit Ferrari guess values.
- **BG-002:** collider transition leaves duplicates, no-step bypass or teleport on exit → reject active-vehicle registry patch.
- **PERF-001:** new per-frame surface/vertex scan causes mobile stutter or freeze → reject implementation; measure and cache, not hide low FPS behind motion blur.
- **SEC-001:** untrusted asset/profile insertion, leaking debug data or resource leak → stop release; require review and an auditable correction.

A failure must be documented without erasing green tests, accepted earlier milestones or the user's evidence. Never use speculative scene-wide Y offsets, hidden meshes, car shrink, or “working on desktop” as substitutes for physics, security and mobile approval.

## 10. Immediate next action / request for authorization

**Now:** publish V2 documentation and mark the original GTD-VEH-005 plan as superseded. Request plan/security review; **do not implement**.

**After a clean review and explicit user authorization:** perform F0 only—freeze current Ferrari Fit004 and collect support/contact ground-truth evidence. Report F0 measurements and remaining uncertainties, then seek separate F1 authorization. Steering-wheel animation and Buggy activation follow the approved chain, not ahead of it.

The user-approved outcome is a solid reusable engine for future vehicles: *import and qualify an asset, supply a measured profile, inherit the same world and control rules, then pass real physical, visual and mobile evidence*.