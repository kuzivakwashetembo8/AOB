# GTD-VEH-SEAT-001 — UAL Driving Loop Milestone and Ferrari Seat-Fit Findings

**Recorded:** 2026-10-15  
**Status:** **Stage 1 rearward seat-back position visually accepted by the owner (2026-10-15).** Final driver fit **not accepted**: feet protrude through the vehicle underside, hands do not touch the steering wheel, and low side views show intermittent car-to-road clearance. All three defects documented; causes classified below; **no follow-on code or physics changes authorized**.  
**Branch:** `exp/veh-seat-001-ual-driving-loop-20261015`  
**Baseline:** `main` at `24a1ab738c650ebf7e71b40fed628ea80a154c78` (Ferrari L0 physics unchanged).  
**Original accepted foundation preview:** https://gtd-r31oppt1w-interlinkglobaltech.vercel.app/game?gtdSeat001=1  
**Stage 1 observed preview:** https://gtd-8ovbu8kiu-interlinkglobaltech.vercel.app/game?gtdSeat001=1 (`929bbd46327433b6807534e3731562fdde562625`; READY on Vercel). **The `gtdSeat001=1` flag is required:** otherwise `gtd-runtime.ts` deliberately hides the driver in driving mode. An unflagged READY build is not evidence of a failed driver mesh.  
**Reference:** Owner's four exterior/overhead preview screenshots of Voight driving beside the Mercer Street brick buildings (2026-10-15).  
**Related plan:** `documentations/Development/GTD-VEH-PHYS-001 Realistic Driving Foundation Comprehensive Technical Implementation Plan - 2026-10-15.md` (preserved for later staged work, **not** authorization to revive the abandoned multi-system patch).

## 1. Why this milestone matters

The imported UAL humanoid has a usable `Driving_Loop` animation in the game's actual running asset: the owner can visibly inspect Voight in the Ferrari cockpit, with a generally believable driving pose from above and the side. This is a significant improvement over the previous Ferrari L0 behavior, which deliberately hid the entire humanoid during driving.

**Owner's finding:** "This is a good position and I believe it should be documented." The basic seated-driver approach and its approximate location are a successful foundation. This does **not** mean the exact seat offsets, leg penetration, hand position, or wheel-grounding are accepted as final.

Preserve the narrow scope: make **one observable, reversible driver-presentation change at a time**. Do not couple seat work to steering, car physics, sound, speedometer, terrain, glass, grass, tree placement or traffic.

## 2. What is implemented and working

- `src/game/character/voight-humanoid-trial.ts` selects the existing UAL `Driving_Loop` animation group from the imported GLB. The trial changes into this clip only if present; it restores idle on exit. This is an existing skeletal animation, **not** a new handmade seated rig.
- `src/game/vehicles/driver-seat-placement.ts` computes a Ferrari-relative pose from the visual car anchor, heading, width/height/length, and an explicit local offset; no car-physics formulas are modified.
- `src/game/core/gtd-runtime.ts` enables the existing Voight render root on boarding, synchronizes its world pose with the car each fixed step, and restores pedestrian presentation on disembark.
- This behavior remains gated behind `?gtdSeat001=1`; the unflagged L0 baseline remains available.
- Focused tests cover driving-clip name selection, seat-position translation/rotation and invalid inputs. These tests verify deterministic positioning, **not** the real cabin fit shown in the screenshots.

Current Ferrari seat configuration:

```ts
export const FERRARI_SEAT_POSITION = {
  driverSideFraction: 0.20,
  cabinForwardFraction: -0.04, // Stage 1 preview, formerly -0.12
  aboveRoadHeightFraction: 0.56,
  headingOffsetRadians: Math.PI,
};
```

The Ferrari's authored nose faces local `-Z`. The actual change required to move Voight toward the **seat back** must be verified in that vehicle coordinate frame, including its imported/normalized orientation. Avoid moving by a camera-relative screen direction or guessing a global Z offset.

## 3. Owner-observed visual defects — primary scope

### A. Feet extending below the Ferrari

In the side images, portions of Voight's lower legs/feet appear below the vehicle's underside; at some locations they reach the road surface or appear to intersect it. This breaks the perception that the driver is seated *inside* the car.

**Likely mechanism, to be confirmed:** The imported `Driving_Loop` pose and the current seat-relative humanoid root offset are insufficiently aligned with this Ferrari's actual cushion, footwell and floor. A seat mount can be correctly synchronized while the limbs still clip through the car.

**Desired visual outcome:** Both feet and lower legs remain within the cabin/footwell; neither becomes visible beneath the chassis from side, rear or aerial camera angles. The legs should project forward toward the pedals in an anatomically plausible seated position.

### B. Torso and head too far forward

The upper body visually approaches the steering wheel, and the head comes close to the front windshield frame/tip. Voight should not look compressed into the dash.

**First corrective experiment:** Move the *entire existing driving character* a **small, measurable distance rearward toward the driver's backrest**, adjusting only seat-relative presentation position. Check head clearance from windshield/roof and chest clearance from steering wheel before touching joint angles. Do not shift or scale the car to compensate.

### C. Calibrated arms and legs, only after root-position correction

Moving the root rearward may change limb fit but cannot be assumed to solve foot clipping by itself.

- **Legs:** Preserve natural hip/knee bend, angle the thighs/knees appropriately, and extend the lower legs **forward into the Ferrari footwell/pedal area**, not vertically through the floor. Determine whether a small seated animation overlay/retarget or scoped bone adjustment is necessary *after* the root reposition.
- **Hands/arms:** Bring hands near the steering wheel, shoulders relaxed, elbows gently bent. The driver should look as if holding or guiding the wheel, **not** reaching fully forward with locked elbows.
- Favor minimal adjustment of the working `Driving_Loop` over building a general-purpose two-arm/two-leg IK solver. Avoid new animation downloads, new asset rigs or skeleton replacements for this localized experiment unless simple calibration demonstrably fails.
- Keep the character's body seated against the backrest during turns and movement; maintain one existing humanoid mesh/skeleton and the same boarding/exit lifecycle.

**Do not combine this with the wheel-grounding correction.** Solve one visible cause at a time.

## 4. Secondary observation — wheel/road contact is a separate physics issue

The owner again observed that the Ferrari's wheels do not consistently sit on top of the road. Depending on its position along the roadway, portions of the tires appear to penetrate the asphalt. This confirms the earlier **visual symptom** from VEH-PHYS-001; the exact underlying cause is **not established** by these screenshots alone.

Wheel-road penetration is a separate vehicle grounding/collider/contact issue. It may change the apparent height of the chassis relative to Voight's feet; **it must not be used as the explanation for all driver-foot clipping**, because cabin-floor posture can independently be wrong.

**Deferred physics requirement:** Ground support and wheel contact should keep the tire tread at the actual road surface on ordinary road sections, not persistently inside or floating above it. Measure wheel centres, true tire radius, road collider top and vehicle chassis support height over multiple locations before deciding the fix. Do not raise the entire car, paint over clipping, modify roads, or patch chassis physics while seat fitting is the current isolated objective.

This observation belongs in the later **wheel/road alignment gate** of VEH-PHYS-001; it is **not** a prerequisite for proceeding with small cabin-only seat-position adjustments, as long as their validation explicitly distinguishes the two defects.

## 5. Narrow sequential next steps — Stage 1 authorized; subsequent stages remain separate

1. **Rearward seat-root calibration only — IMPLEMENTED; VISUALLY ACCEPTED FOR SEAT-BACK POSITION ONLY.** `cabinForwardFraction` changed from `-0.12` to `-0.04`, a rearward shift of `0.08 × car length` (~0.36 metres for the 4.53-metre Ferrari). Keep `Driving_Loop` and Ferrari L0 unchanged. Compare side, top-down and rear views on the preview; reject if it worsens driver fit or boarding/exit. No vertical root adjustment, bone pose, arm, leg, vehicle wheel, car physics or collision changes were bundled.
2. **If required: footwell pose fitting only.** With the improved root offset frozen, measure foot positions relative to Ferrari floor/pedals. Attempt the smallest existing-clip-compatible lower-body adjustment. Do not raise the whole character merely to conceal feet.
3. **If required: steering-wheel arm fit only.** Adjust arm targets/bend after legs are settled. Keep elbows partially bent and hands near the wheel without overextending shoulders.
4. **Owner confirmation and acceptance.** Recheck boarding, idle driving, turns, moving car and exit. Side views must show no foot-through-ground/chassis; overhead must show head/torso clearance and natural hand positioning. Only then consider promoting the seat experiment to continuous development.
5. **Later, independent initiative:** Reopen the vehicle-grounding issue with wheel-contact measurements and its own isolated patch. Drifting, damage, sound and speedometer remain outside this milestone.

**Evaluation invariant:** No player driving physics, car acceleration, steering, Rapier colliders, wheel motion, road geometry or South Ward visual generation changes during VEH-SEAT-001 seat-fit work.

## 6. Approval boundary and current state

**Accepted for documentation:** UAL `Driving_Loop` use; visible Voight in the Ferrari; approximate correct general seat position; vehicle-relative synchronization; clear next posture target.

**Not accepted as final:** exposed feet; compressed windshield/steering-wheel clearance; hand/pedal precision; wheel-road penetration.

**Current action:** The owner visually accepted the rearward seat-back adjustment, but explicitly withheld full driver-fit acceptance. Identify and document remaining failure mechanisms; **await a separate authorization** before changing leg/arm animation, seat calibration or vehicle grounding. The UAL `Driving_Loop`, Ferrari physics, wheel contact, and all non-seat world generation remain unchanged.

**Status:** Seating mechanism and rearward torso alignment visually accepted as a foundation; footwell, hand/wheel contact and independent wheel/road geometry remain unresolved and unapproved.


---

## 7. Stage 1 visual verification and failure analysis — 2026-10-15

**Evidence:** Owner's four screenshots of the exact Stage 1 Vercel preview (`gtd-8ovbu8kiu`, `/game?gtdSeat001=1`), including straight side, rear-oblique overhead and lower side views of the Ferrari near the Mercer Street brick building. No screenshots were inserted into Git; the source evidence is the owner's review conversation. All claims below separate **what the screenshots show** from **what code proves** from **what still requires live measurement**.

### 7.1 Accepted successful behavior

- **PASS — root moved rearward into the seat back.** The owner specifically confirms Voight is now seated against the backrest appropriately. The side and overhead views show the head and torso farther from the forward windshield/dashboard region than in the preceding trial. This accepts **only the fore/aft root-position experiment**, not the complete seated animation or collision.
- **PASS — character renders when the experiment is enabled.** The screenshots demonstrate the actual humanoid in the cockpit with `?gtdSeat001=1`. Earlier unflagged testing hid the driver by design and was not a regression.
- **PASS — measured change is isolated.** `src/game/vehicles/driver-seat-placement.ts` changed `cabinForwardFraction` from `-0.12` to `-0.04`: `+0.08 × 4.53 m ≈ 0.36 m` rearward in the model's local frame. Driver lateral fraction (0.20), height fraction (0.56) and yaw offset (π) remain unchanged. Existing pose-selection and Ferrari drive physics were not altered by VEH-SEAT-001.
- **Not evaluated as passed:** real wheel/road contact, pedal positioning, exact steering-wheel grip, boarding/exit under all conditions, collision behavior while moving, performance on mobile.

### 7.2 Failure A — exposed feet/lower legs (confirmed)

**Observed:** Feet and portions of the lower legs remain visibly below the Ferrari's underbody. At least one lower leg/foot appears down at road level in the low side views even though the character's torso is inside the cabin.

**Cause supported by current code:** Stage 1 translates/rotates only the whole humanoid root (`ferrariSeatWorldPose` -> `syncFerrariDriverSeat`). It does **not** change the original GLB `Driving_Loop` animation or independently drive ankle, knee, hip or foot targets. The prior vertically protruding leg pose is therefore preserved; the root's Y stays `vehicle.y + 0.56 × vehicle.height`. Horizontal backrest correction cannot alone reliably fit the rig's feet into this Ferrari's lower cockpit.

**Unmeasured:** The local/world bone transforms of hips, knees, ankles and soles relative to the imported Ferrari's actual floor/footwell, and any foot pose that is currently occluded by the body. Exact degree and distribution of penetration cannot be inferred from screenshots.

**Candidate later corrective gate (NOT authorized):** Inspect character foot joints and car floor bounds at rest, then attempt the smallest lower-limb pose/calibration that clears the floor and keeps legs directed forward toward pedals. Do not simply raise the whole driver or hide feet; keep Stage 1 backrest offset fixed for this controlled comparison.

### 7.3 Failure B — hands extended but not contacting steering wheel (confirmed)

**Observed:** The arms are extended in a plausible driving direction, but the hands do not visibly touch/grasp the steering wheel. The owner accepts the general reach, not the missing contact.

**Cause supported by current code:** `loadMeridiaCharacterTrial` selects the imported `Driving_Loop` and plays its existing bone animation. `enterDrivingPose()` merely switches the clip. The seat-fit experiment only transforms the root and has **no steering-wheel-local targets**, left/right hand position calculation or arm/wrist calibration. Rearward translation naturally increases the distance from the hands to the wheel unless the animation or wheel-target attachment is separately aligned.

**Unmeasured:** True steering wheel position/rotation in the imported Ferrari rig and both hands' world-space pose across idle/turning animation frames. No claim that the imported `Driving_Loop` includes wheel-contact constraints.

**Candidate later corrective gate (NOT authorized):** Measure steering-wheel grip target and both wrists, then try a minimally scoped arm/shoulder/elbow animation retarget or overlay with slightly bent elbows; avoid locked-reaching arms or a full IK subsystem unless simpler constraints fail. Evaluate after footwell fit.

### 7.4 Failure C — Ferrari appears suspended above road (confirmed visual symptom; physical cause open)

**Observed:** The low side views show conspicuous space between the road and one or more tire bottoms, making the car appear to hover. Previous observations separately showed intermittent tire penetration. Screenshots establish a **visual contact failure**, not the precise Rapier collision surface or a permanent airborne state.

**Known mechanism and limitation from code:**
- `src/game/vehicles/first-drive-trial.ts` instantiates a **kinematic position-based rigid body** with a single full-car **cuboid collider** (`x/2, y/2, z/2`) whose center is derived from the visual anchor plus half vehicle height and a 0.035-m offset. Movement/contact is computed for that collider by Rapier's kinematic character controller. This is *not* four-tire suspension.
- `src/game/vehicles/street-vehicle-physics.ts` applies downward travel with ground snap, gravity and bounded curb autostep; `StreetVehicleActor.finish()` transfers the chassis body pose back to the imported visual anchor. Autostep or non-wheel collider support may lift the whole vehicle above the location where the rendered tires should contact asphalt; the low viewpoint reveals the difference.
- `src/game/vehicles/street-vehicle-wheels.ts` rotates and steers imported wheel pivots; its measured/fallback wheel radii are used for *animation*, not to choose chassis ground height. It has no per-wheel contact constraints or suspension model.
- `first-drive-trial.ts` exposes `grounded`, `airborneSeconds` and `maxUnsupportedGroundGapMetres`, but its diagnostic support ray is sampled beneath the **chassis centre** with respect to the collider bottom. That value alone cannot establish all four tire-tread gaps or distinguish tire intersection from chassis support on nearby curbs/geometry.

**Root-cause assessment:** **Confirmed architectural mismatch** between chassis-box contact and tire contact; **not yet proven** which concrete factor dominates these screenshots. Possible contributors to test separately include wheel-center/radius versus body-box bottom offsets, imported asset floor-normalization, curb/sidewalk collision under the chassis box, active autostep or temporary airborne movement, and inconsistencies between road render height and Rapier ground top. Avoid attributing every case to one factor without contact probes.

**Required evidence before choosing a correction:** At several static and moving road positions, compare actual world-space wheel centers, tire radii, four road/curb Rapier hit points beneath the wheels, rendered road-surface Y, chassis/cuboid bottom Y, collider-grounded flag and vertical state; include straight/rotated vehicle orientations and prior locations showing tire sinking. A low-angle visual gate should require all four tire treads at the actual road top within a justified tolerance; wheels must neither float nor penetrate. This is a **separate VEH-PHYS-001 gate**, not a side effect of the driver posture patch.

### 7.5 Validation gaps, priorities and change boundary

- **Tests present:** unit checks that the `Driving_Loop` name is selected when present, that the Ferrari seat root follows translation/heading, and that the rearward root displacement is 0.08 vehicle-length for four vehicle yaws.
- **Tests absent:** in-engine skeleton bone-to-car mesh floor clearance, hand-to-steering-wheel contact, and four-wheel road contact based on mesh and Rapier geometry. Consequently, passing TypeScript/Vitest/Vercel build gates could not demonstrate visible fit; the user's screenshots are the acceptance evidence.
- **Order proposed, NOT authorized:** (1) keep accepted fore/aft seat-back root constant; inspect and calibrate footwell/leg pose, (2) inspect and calibrate two hand/wheel contacts, (3) independently diagnose car wheel-to-road support across locations and curbs. The physics item can be planned separately without mixing its patch with character animation.
- **Preserve:** existing UAL model/working `Driving_Loop`, boarding/exit lifecycle, accepted Stage 1 rearward offset, Ferrari drive handling and physics until a specifically scoped authorization is given.
- **Awaiting owner instructions:** This documentation records findings only. No changes to character pose, assets, runtime logic, collision, ground, wheels, tests, deployment or production promotion are approved by this record.

**Stage 1 decision:** **Rearward torso/backrest alignment ACCEPTED. Overall seated-driver presentation NOT ACCEPTED. Physical four-wheel road contact NOT ACCEPTED.** Investigation documented; implementation paused.
