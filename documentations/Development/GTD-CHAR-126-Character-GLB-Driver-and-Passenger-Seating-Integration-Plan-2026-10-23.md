# GTD-CHAR-126 — character.glb Driver and Passenger Seating Integration Plan

**Date:** 2026-10-23 (Africa/Johannesburg)  
**Repository:** `interlinkglobal/GTD`  
**Status:** DOCUMENTATION / ENGINEERING PLAN ONLY — implementation, preview deployment and merge of gameplay code not authorized by this document.  
**Target:** Adopt the existing UAL vehicle interaction and seated-posture foundation for the playable `character.glb`, with an additional passenger-seat role. Preserve the owner's accepted CHAR-125 running baseline.

## 1. Directive and required observable result

1. Voight (`character.glb`) can occupy each supported car's actual **driver-side** seat.
2. Driver's hands rest on the **physical steering-wheel rim** with softly bent elbows; they follow steering reasonably while driving.
3. The car remains fully drivable while the **same visible character.glb instance** is seated in it; heading, speed and camera are vehicle-authoritative.
4. Voight can instead occupy the **passenger-side** front seat, facing the car's front, with relaxed hands and no driver-input authority.
5. The head stays below the physical roof/roofline; thighs, knees, shins and shoes stay inside the cockpit, particularly above the cabin floor and outside door/underbody surfaces. No feet below the car, feet on the steering wheel, head through roof, or duplicated invisible collision actors.

This is a visual / animation / interaction integration, **not** a new driving physics solver. Exit remains safe and reversible. No vehicle dynamics or world edits are permitted during the character-fit gates.

## 2. Inspected evidence: current implementation (2026-10-23)

| Evidence | Verified behavior / constraint | Consequence |
| --- | --- | --- |
| `src/game/core/gtd-runtime.ts` (`command`, `toggleVehicleDriving`, `syncDriverSeat`) | The existing `vehicle` action selects nearby drivable cars; the `StreetVehicleActor` moves/steers them; car pose, camera and safe exit are maintained. `CHAR-105` **explicitly rejects** vehicle actions while `humanCharacterEnabled` is true. | Remove the restriction only behind a new character-seat verification gate; reuse vehicle authority. |
| `src/game/world/mercer-static-character-103.ts` | `character.glb` is a separate, user-authored, 1.78 m visually normalized instance. Its GLB has **zero animation groups** (CHAR-108 observation). It uses linked TransformNode skeleton joints, the CHAR-109 neutral pose and CHAR-110/120 retargeted walking/running clips. `setControlled(false)` currently resets it to Mercer Street. | Do **not** call the old `setControlled(false)` when boarding. Add an explicit occupied/seat mode to the SAME actor; preserve its model root and enablement. |
| `src/game/character/voight-humanoid-trial.ts` | UAL loads `Driving_Loop`, swaps into it through `enterDrivingPose()`, blends it in, restores idle on exit, and exposes a cabin-fit controller. | Reuse clip source/animation intention, not the UAL mesh/skeleton or the UAL-specific `enterDrivingPose` implementation verbatim. |
| `src/game/character/retargeted-walk-110.ts`, `retargeted-sprint-120.ts`, `scripts/char120-bake-ual-sprint.mjs` | Existing build-time transfer maps UAL animation to named linked human joints and rejects missing/invalid mappings. The walking player owns those joints and restores its baseline on `reset()`. | Reuse the **offline retarget / runtime playback pattern** for a seated driving source pose/clip; arbitrate joint ownership so running, idle and sitting never write the same joints concurrently. |
| `src/game/vehicles/driver-seat-placement.ts` | Ferrari seat is car-local and uses the authored `-Z` front / `PI` heading offset. | Adopt car-specific calibrated seat anchors, **not** hard-coded world-space offsets. |
| `src/game/vehicles/range-rover-drive-007.ts` | Accepted SUV driver baseline: vehicle-local +X .22 width, +Z .11 length, Y .57 vehicle height, heading along +Z. Footwell targets move feet forward from real hips; sole lift is bounded and provisional. | Start the new human's first seat calibration in the Range Rover; do not assume these fractions automatically fit a different human skeleton or prove real floor clearance. |
| `src/game/vehicles/coupe-driver-fit-016.ts`, `documentations/Development/GTD-VEH-017-Range-Rover-Seating-Template-for-BMW-and-Temerario-2026-10-19.md` | BMW's driver side is opposite the Rover's; Lamborghini roof height is much lower. Historical failure: BMW ended up on passenger side; Lamborghini head passed through roof and feet approached steering wheel. | Side, forward axis, heading and roof clearance are **independent model-specific facts**. Do not copy Rover offsets blindly. |
| `src/game/character/driver-cabin-pose.ts`, `driver-limb-landmarks.ts`, `driver-joint-space.ts` | UAL contact logic locates named limbs, creates wheel-rim and pedal targets, operates linked joints and snapshots/restores rotation baselines. Diagnostics distinguish limb-target proximity from verified cabin containment. | Extract/adapt reusable primitives. Create a `character.glb` canonical joint map and reject invalid reflected/parent-space solutions. |
| `src/game/vehicles/vehicle-cabin-envelope.ts`, `src/game/character/skinned-foot-geometry.ts`, FIT002/FIT003/FIT004 docs | Actual rendered shoe/calf sampling exists; validated floor mesh contact is stronger than provisional chassis-height heuristics. Previous solves sometimes worsened the pose or retained invalid rotations. | Use real skinned surface evidence; transactional IK that restores bad candidates. Explicitly mark roof/footwell evidence unknown until sampled. |

**Read historical acceptance and failure records:**
- `documentations/Development/GTD-VEH-SEAT-001 Accepted Driving Loop Milestone and Seat-Fit Findings - 2026-10-15.md`
- `documentations/Development/GTD-VEH-FIT-002-Advanced-Reviewer-1.0-Technical-Recovery-Plan-2026-10-15.md`
- `documentations/Development/GTD-VEH-CABIN-FIT-003-Interior-Boundaries-and-Foot-Containment-2026-10-15.md`
- `documentations/Development/GTD-VEH-CABIN-FIT-004-Targeted-Lower-Limb-Recovery-2026-10-15.md`
- `documentations/Development/GTD-VEH-017-Range-Rover-Seating-Template-for-BMW-and-Temerario-2026-10-19.md`
- `documentations/Development/GTD-CHAR-125-Trailing-Heel-Back-Kick-Recovery-2026-10-23.md`

**Evidence boundary:** code and documents establish existing mechanisms and previous visual findings. No new live browser fit measurements, actual steering-rim coordinates, passenger mounting points, roof mesh or cabin-footwell mesh have been measured for character.glb in this planning pass. These are mandatory G0 measurements, **not accomplished acceptance**.

## 3. Architectural decision

**Use one existing car actor, one existing human avatar instance, and one state machine.** No vehicle clone, no duplicate standing character and no independent passenger physics engine.

Proposed visual state union:

```ts
type HumanOccupancy =
  | { mode: "on-foot" }
  | { mode: "driver"; vehicleId: string; seatId: "front-driver" }
  | { mode: "passenger"; vehicleId: string; seatId: "front-passenger" };
```

The current `context: "walking" | "driving"` is insufficient to distinguish an occupant who does **not** control the car. Preserve existing driving mechanics but add an explicit occupant role/seat assignment. Runtime owns the transition; the human visual actor owns pose/rig; the vehicle adapter owns calibrated anchors and cabin landmarks. The **driver** applies existing throttle and steering to the existing `StreetVehicleActor`. A **passenger** never sends throttle/steering; it follows a vehicle driven by another authorized entity, or remains seated while a driverless vehicle is stopped. Do not invent autonomous driving to make the passenger move.

On entering a vehicle, suspend pedestrian movement and character-collider participation appropriately rather than leaving a ghost player collision at the boarding location. Retain the single Rapier player for eventual exit. Release held inputs, freeze pedestrian/root travel and clear any conflicting foot-IK. On leaving, restore the same `character.glb` into the safe exit position, restore collision and locomotion, and reset/rebase all seat-only joint rotations.

Do **not** reuse `setControlled(false)` for boarding: it returns the model to Mercer Street. Introduce an actor API, for example `enterSeat({seatRole,vehicleAnchor,profile})`, `updateSeat(dt,vehiclePose,steering)`, `exitSeat()` and a separate `setControlled` / on-foot lifecycle. Exact interface names are proposals.

## 4. Human seated animation transfer

1. **Inspect and pin skeleton basis.** Audit the actual character.glb's 73-joint target skeleton against UAL's 65-joint source; confirm `Hips`, `Spine`, `Spine1/2`, `Left/RightUpLeg`, `Left/RightLeg`, `Left/RightFoot`, `Left/RightToeBase`, `Left/RightArm`, `Left/RightForeArm`, `Left/RightHand`. Confirm each Bone links to the correct TransformNode; inspect joint-parent handedness and reflection parity. Unmatched joints must fail closed.
2. **Retarget UAL `Driving_Loop` offline** in a new `char126` build script using the established `char120-bake-ual-sprint.mjs` methodology. Export a small versioned local seating clip/pose for character.glb. Prefer first a measured, stable sampled seated pose; introduce subtle steering/idle loop motion only after fit is accepted. Do not rely on source clip names to imply that character.glb already contains an animation.
3. **Runtime animation ownership.** Before entering, `WalkPlayer110.reset()` and snapshot the current linked-joint neutral baseline. While seated, do not invoke the walking/sprinting or CHAR-125 heel-back-kick updates. Seat controller writes the mapped joints in one deterministic order: authored seated baseline → role-specific arms/legs → bounded hand/foot correction → pose/containment measurements. On exit, restore the unmodified CHAR-109 neutral and CHAR-110/120/125 gait behavior. Never blend seated IK into sprint.
4. **Pelvis/backrest first.** Fit pelvis and spine/head to seat cushion/backrest, without raising the full avatar to conceal foot penetration. Preserve 1.78 m identity and mesh scale; no arm stretching, limb scaling or car scaling.

Proposed files (subject to G0): `scripts/char126-bake-ual-driving.mjs`, `src/game/character/retargeted-driving-126.ts`, `src/game/character/human-seat-controller-126.ts`. Prefer extracting generic joint aim, foot sampling and fit witnesses instead of copying an entire UAL observer.

## 5. Seat frames, steering hands and physical containment

### 5.1 Vehicle-local seat profile

Each drivable vehicle supplies:
- authored front vector/sign and heading correction; **driver-side** label verified against its actual steering wheel, not an assumed left-/right-hand drive country;
- distinct `front-driver` and `front-passenger` car-local pelvis mounts, cushion height, backrest direction and passenger clearance;
- steering rim center, actual rim radius/plane/tilt, allowable 9-and-3 (or anatomically feasible 10-and-2) grip positions; wheel yaw/roll animation parent;
- bounded knee, pedal/footwell, dashboard, roof, door and floor landmarks, each with `measured` / `provisional` / `missing` evidence.

World transform each mount from the **live vehicle anchor** every fixed step. The previous Ferrari `-Z` and Rover `+Z` distinction is normative. Use explicit physical driver-side evidence per model, not the sign of a guessed world X coordinate.

### 5.2 Driver hands and wheel contact

Position the pelvis against the backrest **before** solving arms. Drive target palm/knuckle contacts from points on the actual steering **rim**, not from wheel center or inner trim (`steering_carbon` historically proved unsuitable). Start elbows down/outward, mildly flexed, wrists aligned with wheel plane and shoulders relaxed. Solve each shoulder→elbow→wrist chain with joint limits, elbow bend plane and rollback on worse residual, collision/rotation invalidity or near-straight hyperextension. Small live adjustment follows steering-wheel rotation. Do not drive wrist position directly from static world coordinates.

Measure wrist/palm-to-rim error and elbow plausibility separately. Contact <0.03 m is a **proposed target**, not proof of proper grip; visually confirm palm surface and thumb orientation. If actual wheel geometry is absent, report `unverified` and do not claim hands are touching.

### 5.3 Legs, shoes, head and roof

Thighs advance from hips, knees stay below dash and within cockpit, shins fold down/forward, toes aim at pedal/footwell without clipping cabin floor. Reuse real skinned shoe/calf sampling and floor intersection logic from FIT004; extend checks to head/roof (head and hair), knees/dashboard, arms/doors, and body/seatback. Sample **deformed mesh vertices or conservative anatomical capsules** against verified cabin geometry. An outer chassis bounding box or vehicle height percentage is insufficient evidence of a cabin floor/ceiling.

For each candidate adjustment, snapshot affected joint quaternions and restore on unreachable target, incorrect reflection, anatomy violation, penetration increase or non-finite result. No cumulative per-frame upward offsets; all targets are vehicle-local and reset on car/seat change. New proposed visible-geometry tolerances: no outward head/roof, feet/underbody, knee/dashboard or arm/door penetration; for measured foot-floor contact target <=0.003 m residual (matching FIT004 established measurement), with reporting of mesh coverage. Unknown geometry = **not certified**, not passed.

### 5.4 Passenger seat

Separate seat anchor and **passenger-specific seated pose**. No hands on steering wheel and no foot placement under pedals unless cabin geometry dictates it. Relax forearms over lap/thighs or at sides, knees in passenger footwell, head/torso under its side of roof. Use the same measured containment and pose restoration. Never change car heading, animation source rig, or driving controls when switching role.

## 6. Planned staged implementation and visual gates

| Gate | One substantive change | Objective evidence / pass rule |
| --- | --- | --- |
| **G0 — Audit / calibration** | Inventory target/source bones and actual seat/wheel/floor/roof coordinates; confirm per-car driver side and orientation. | Joint map complete; each source landmark marked verified/provisional/missing; no gameplay edits. |
| **G1 — Seated human pose** | Offline retarget UAL's seated pose to the same `character.glb` and introduce strict on-foot↔seated joint ownership. Use a stationary Range Rover as first target. | Plausible pelvis against backrest, head under roof, limbs bent; walking/sprinting remains byte-for-byte unaffected. Initial significant visual preview. |
| **G2 — Real driver fit** | Add car-relative driver anchor and bounded thigh/shin/foot fit, then shoulder/elbow/wrist rim contact. | Driver occupies correct side; both hands on rim; feet above real/provisional footwell with evidence labeled correctly; zero visible roof/underbody penetration. Preview from side, frontal and rear camera at roof/door height. |
| **G3 — Driving integration** | Permit character.glb driver boarding; reuse actor, physics, controls, camera and safe exit. Bind avatar seat to moving/turning vehicle and wheel angle. | Arrow-up drives forward, left/right steering unchanged; human remains fully inside through motion/yaw; no duplicate collision ghost or locomotion playback; exit to same human with original gait. Significant preview. |
| **G4 — Passenger** | Add front-passenger role, mount and relaxed pose; expose deliberate seat choice without breaking existing F-to-drive. | Correct side and heading; no steering-wheel hands or driving authority; seat remains attached to car; exit restores walking. Significant preview. |
| **G5 — Vehicle matrix** | Per-model seat adapter calibrations for currently loaded six native cars. Apply BMW opposite-side and Lamborghini reduced roof clearance as explicit regression cases. | Every supported model passes physical side, heading, wheel reach (driver), head/foot containment and safe exit; failed model remains gated, not globally overridden. Previews only for substantial model completions. |
| **G6 — Regression / promotion review** | Full tests, typecheck, mobile/desktop render checks, offline packaging and loading checks. | Existing UAL drive, CHAR-109 neutral, CHAR-110 walk, CHAR-120/125 run, car controls and performance unchanged within measured tolerance. Owner accepts visuals before merge/deploy. |

**Preview principle:** Do not issue a deployment for each tiny bone-angle adjustment. Only substantial completion of a gate warrants a preview. Record screenshots, measured character-cabin residuals, commit SHA and vehicle identity.

## 7. Proposed tests and observability

Add `char126-rig-map.test.ts`, `char126-driving-retarget.test.ts`, `char126-seat-lifecycle.test.ts`, `char126-driver-contact.test.ts`, `char126-passenger.test.ts`, `char126-cabin-envelope.test.ts`, and `char126-car-orientation.test.ts` under `src/test/`. These filenames are **proposed**, not existing files.

- Actual source and target GLB bone-map completeness, quaternions finite/normalized, no reflection sign inversion, no T-pose regression.
- Character remains **same mesh/skeleton instance** through enter, drive, exit; walking/running controllers suspended and restored without dirty joint state.
- Vehicle transforms at multiple yaw angles, forward and reverse, bumps/stationary points. Role assignment never confuses driver and passenger.
- Driver grip follows physically measured wheel/rim contacts, not wheel hub. Check steering 0, full left and full right.
- Actual head/hair vs roof, shoes/calves vs floor/underbody, and knees/arms vs dashboard/door. Output a coverage metric; missing surfaces cannot pass.
- Stationary and moving boarding/disembark invariants: preserve existing speed gate (`0.25 m/s`) and safe-exit placement; no phantom collider left at entry.
- Regression: existing car acceleration/reverse/steering/yaw, Rapier physics, camera, CHAR-125 trailing heel, CHAR-109 idle arms, PWA offline game and cold/warm loading target <=60 s.

Suggested diagnostic report: `__GTD_CHAR126_SEAT_REPORT__` with `asset`, `role`, `vehicle`, `poseMount`, `headingCorrection`, `jointMapStatus`, `clipStatus`, `handRimErrorMetres`, `shoeFloorPenetrationMetres`, `headRoofClearanceMetres`, `measuredCabinCoverage`, `candidateRollbacks`, `collisionGhostDetected`, `exitRestored`, and `sourceCommit`. Avoid heavy geometry sampling every frame: sample at boarding and bounded periodic checkpoints.

## 8. Failure controls and explicit exclusions

**Stop/rollback conditions:** model faces backward, wrong physical seat, hand stretches over wheel, foot exits under chassis, head clips roof, missing rig joint, invalid joint-space reflection, invalid/unknown floor falsely reported clear, retained seat rotations after exit, invisible collision at old position, or any accepted driving/CHAR-125 gait regression. Revert the one offending seat gate, **not** the entire driving subsystem.

**Out of scope now:** new vehicle dynamics, passenger NPC artificial intelligence, autonomous driver, traffic AI, car interior redesign, model geometry changes, road-height patches, shrink-to-fit tricks, hiding penetrating mesh, global skeleton/scene handedness changes, production deployment, or changes to accepted UAL driving.

## 9. Implementation authorization checkpoint

**Status at documentation commit: study and plan only.** No character-seating implementation, tests, preview deployment or main gameplay changes have been applied by this directive. Start with G0 joint/cabin measurements and G1 isolated retarget only after a separate implementation instruction. Maintain the accepted running posture as a frozen regression baseline.
