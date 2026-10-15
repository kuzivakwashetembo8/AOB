# GTD-VEH-SEAT-001 — UAL Driving Loop Milestone and Ferrari Seat-Fit Findings

**Recorded:** 2026-10-15  
**Status:** Initial seated driver visually accepted as a working foundation; **seat fit remains incomplete**. **Stage 1 rearward-only root adjustment implemented on the isolated preview branch; awaiting visual acceptance.** Leg and arm changes are deferred until this single-variable trial is reviewed.  
**Branch:** `exp/veh-seat-001-ual-driving-loop-20261015`  
**Baseline:** `main` at `24a1ab738c650ebf7e71b40fed628ea80a154c78` (Ferrari L0 physics unchanged).  
**Preview observed:** https://gtd-r31oppt1w-interlinkglobaltech.vercel.app/game?gtdSeat001=1  
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

1. **Rearward seat-root calibration only — IMPLEMENTED FOR REVIEW.** `cabinForwardFraction` changed from `-0.12` to `-0.04`, a rearward shift of `0.08 × car length` (~0.36 metres for the 4.53-metre Ferrari). Keep `Driving_Loop` and Ferrari L0 unchanged. Compare side, top-down and rear views on the preview; reject if it worsens driver fit or boarding/exit. No vertical root adjustment, bone pose, arm, leg, vehicle wheel, car physics or collision changes were bundled.
2. **If required: footwell pose fitting only.** With the improved root offset frozen, measure foot positions relative to Ferrari floor/pedals. Attempt the smallest existing-clip-compatible lower-body adjustment. Do not raise the whole character merely to conceal feet.
3. **If required: steering-wheel arm fit only.** Adjust arm targets/bend after legs are settled. Keep elbows partially bent and hands near the wheel without overextending shoulders.
4. **Owner confirmation and acceptance.** Recheck boarding, idle driving, turns, moving car and exit. Side views must show no foot-through-ground/chassis; overhead must show head/torso clearance and natural hand positioning. Only then consider promoting the seat experiment to continuous development.
5. **Later, independent initiative:** Reopen the vehicle-grounding issue with wheel-contact measurements and its own isolated patch. Drifting, damage, sound and speedometer remain outside this milestone.

**Evaluation invariant:** No player driving physics, car acceleration, steering, Rapier colliders, wheel motion, road geometry or South Ward visual generation changes during VEH-SEAT-001 seat-fit work.

## 6. Approval boundary and current state

**Accepted for documentation:** UAL `Driving_Loop` use; visible Voight in the Ferrari; approximate correct general seat position; vehicle-relative synchronization; clear next posture target.

**Not accepted as final:** exposed feet; compressed windshield/steering-wheel clearance; hand/pedal precision; wheel-road penetration.

**Current action:** First, single-variable seat-root refinement implemented under owner authorization. Await **visual approval or rejection** of the rearward offset before any leg, footwell or hand/steering-wheel change. The UAL `Driving_Loop`, Ferrari physics, wheel contact, and all non-seat world generation remain unchanged.

**Status:** Seating mechanism demonstrated; rearward pose placement submitted for visual review; arms/legs still require independent follow-on decisions; wheel-grounding defect remains a deferred physics issue.
