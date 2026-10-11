# GTD-CHAR-001 — L0/L1 First Travel-Facing Turning Preview

**Date:** 2026-10-11
**Classification:** Experiment evidence and calibration register. **Not** L1 acceptance or final Voight approval.
**Implementation branch:** `experiment/gtd-char001-l1-travel-facing`
**Baseline branch:** `experiment/gtd-char001-meridia-humanoid`
**Parent plan:** [Travel-Facing Locomotion and Foot IK](../Development/GTD-CHAR-001%20Travel-Facing%20Locomotion%20and%20Foot%20IK%20Implementation%20Plan.md)
**Main and production:** Remain unchanged.

## L0 source-confirmed baseline

- `src/game/core/gtd-runtime.ts`: 60 Hz fixed simulation; camera-relative keyboard/touch movement; formerly immediate `atan2(desired.x,desired.z)` root rotation. No special backwards walk.
- `src/game/physics/rapier-world.ts`: authoritative kinematic capsule; position-based body starts near Y=0.92; capsule geometry is radius 0.35 plus cylinder half-height 0.55; controller offset 0.03; autostep height 0.28/min width 0.18; snap-to-ground 0.22. These are source values and do not prove correct shoe height.
- `src/game/character/voight-humanoid-trial.ts`: imported UAL rig normalizes to 1.78 world units and uses a separate +90-degree visual-axis correction, presently **unverified against each animation's actual forward axis**. Current clip animation is speed-threshold-based without foot phase/cadence calibration.
- Player-provided Oct. 11 trial screenshots visually confirmed rigged humanoid, buildings, road markings, vehicles and street furniture coexist in the running experimental Meridian world, but direction of body/feet diverged and soles penetrated asphalt and curbs. Do not treat a 8/8 startup as final visual proof.

## L1 implemented as reversible tuning experiment

- `character/locomotion/travel-heading.ts` provides a fixed-step, shortest-yaw controller, deterministic 180-degree tie handling, and movement aligned with the **current character facing**, not sideways intent. No backwards-walk or strafe mode.
- On large-angle reversal, translation can slow/pause until facing catches up. The chosen curve and default 420 deg/s turn rate are **provisional calibration guesses**, never agreed acceptance thresholds. Users can tune turn speed 90–900 deg/s and movement-while-turning without scene reload.
- `visualForwardDeg` exposes the imported rig's source-axis correction from -90 / 0 / +90 / 180 degrees for user observation. Preserve +90 as existing-reference initial value. Do not assert which value is correct before screenshot/video inspection.
- Only the `gtdCharacterTrial=ual` nonproduction preview is affected; no-query preview/main continues its original proxy motion.
- In-game Pause → Character locomotion (L1) offers settings, Apply & Resume, Reset and user-initiated movement JSON download. The report records real fixed-tick input, target/body heading, turning, corrected Rapier movement, grounded status and sprite/model metadata. No uploads.
- L2 animation cadence, L3 shoe geometry, L4 Foot IK and L5 predictive stepping are explicitly *not* claimed or enabled.

## Device acceptance pending (not simulated)

The user should compare the baseline and new preview on the same laptop/mobile device, ideally identical camera and time-of-day, and repeat:
1. Up, left, right and diagonals: observe face/body orientation relative to travel and feet.
2. Down: verify turn-around and then forward-facing travel, not a backward-walk.
3. Hold/release, abrupt left/right alternation and movement around the Ferrari and road junction.
4. Live test 2–3 turn-speed and movement-while-turning values, with screenshots or a short clip; keep the selected preset if it feels natural.
5. If visible chest/front is perpendicular or opposite to travel, test the forward-axis selector and record which correction looks correct. Do not try to solve the discrepancy by rotating both physics and skeleton roots.
6. Note curb foot-sink remains outstanding until L3/L4, not a reason to silently fake foot IK in L1.
7. Export the JSON trace if steering feels wrong; compare actual heading and corrected distance with input.
8. Confirm buildings, lane marks, vehicle imports, camera and Apply & Resume remain working.

## Verified build evidence

- Vercel preview: https://gtd-8lifvzrbl-interlinkglobaltech.vercel.app/game?gtdCharacterTrial=ual
- Deployment ID: `dpl_9mi4zNvQ2RRQWBFAQv5nDk9Meavf`.
- Deployed source SHA: `bb6e341d691556aebfb08f9164c1fb57a89187ed` (implementation and tests). This subsequent documentation commit is not part of that immutable preview.
- Build: Vercel reported **READY** and its authenticated HTTP fetch returned **200**. Build logs show the test command and successful production-mode Nitro/Vite build; no command failure was reported.
- Main/production: unchanged. Production deployment at verification remained `9d5be65176f7711388db03c7ab82fb3500213e55`.
- **Limit:** Automated verification does not prove the rig visually faces travel or that turning feels natural. No device gameplay acceptance claimed.

**L0 rig-axis calibration and L1 human-visible gate:** PENDING user evidence. Automated TypeScript/tests/build are separate technical gates; record actual results when Vercel finishes. No promotion to main or production.
