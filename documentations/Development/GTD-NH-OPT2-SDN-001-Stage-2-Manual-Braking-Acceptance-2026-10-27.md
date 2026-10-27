# GTD-NH-OPT2-SDN-001 — Stage 2 Manual Braking Acceptance
**Date:** 2026-10-27
**Project:** G.T.D — Grand Theft Division, North Heights
**Branch:** `feature/north-heights-optimization-2-20261027`
**Owner's acceptance:** "Stage 2 successful. Braking works." Follow-up directive: "Document then proceed to stage 3."
**Status:** **Stage 2 ACCEPTED — required G.T.D gameplay behaviour; Stage 3 APPROVED for implementation.** No authorization to merge to production main.

## Owner-accepted Stage 2 contract

The user can enter **any** of the 125 existing moving source-native Sedan traffic agents (Stage 1, previously accepted), remain aboard with Voight hidden, and use Down Arrow / S on desktop or the on-screen Brake control on mobile to **decelerate that particular traffic Sedan gradually to a stop**. Releasing the control returns the existing NH-012 AI to normal autonomous speed control; the traffic simulator remains the only authoritative source of vehicle position, heading, speed and route. Reverse is NOT enabled. Car colour, source body, glass and four source wheel assemblies remain the same native GEN-VEH-009 thin instances, with no second car actor, collider or wheel reconstruction. The 124 nonselected traffic agents continue under their existing rules. Holding the brake inside a junction retains the conflict reservation rather than permitting a second car to enter. Safe stationary exiting and Stage 1 camera behaviour are retained.

### Code ownership
- `src/game/traffic/nh012-traffic-simulator.ts`: `setDriverBrake`, `isDriverBraking` and simulation-step speed arbitration, including the turning-connector reservation hold.
- `src/game/experiments/north-heights-city-8.ts`: input mapping and per-frame driver request applied **before** 20 Hz `traffic.step()`. Blurring, pausing, and exiting clear held driver input.
- `src/ui/hud/touch-controls.tsx` and `src/ui/hud/desktop-controls.tsx`: passenger brake control.
- `src/routes/north-heights-preview.tsx`: Stage 2 hints and state.
- `src/test/nh-opt2-sedan-manual-braking-stage2.test.ts`: simulator regression tests.

### Accepted build and proof
**Commit:** `8a8da4aa747c426784e5382761e6f80506fbeec9`
**Vercel preview:** `https://gtd-qh8czgudu-interlinkglobaltech.vercel.app/north-heights-preview`
**Deployment:** `READY`; automated Stage 2 tests passed; owner visually tested and confirmed braking works.
**Owner visual acceptance overrides automated-only readiness.** This is now a required regression checkpoint; subsequent work must not break it.

## Unresolved observation and exclusions

The Stage 1 defect `GTD-NH-OPT2-SDN-WHEEL-OBS-001` remains **OPEN**: rims rotate visibly; surrounding tyres apparently do not. Root cause is not proven. Not part of Stage 3. Stage 3 must not edit the accepted tyre geometry, source extraction, visual matrix pipeline or wheel rig.

Stage 3 implementation authorization is now explicit. Stage 4 remains unapproved. Unrestricted off-graph driving remains a separate design outside the four-stage bounded lane-based scope. Production main remains untouched until explicit merge/deploy instruction.

## Stage 3 engineering limitation observed during code review

Existing NH-012 autonomous cars already request the maximum permitted cruise speed (8 m/s) and use `ACCEL=2 m/s²` whenever traffic safety permits. Therefore applying player throttle with the *same approved bounds* cannot accelerate past a safe unrestricted autonomous trace: at equal starting speed both traces may coincide. **Do not falsely claim a higher manual engine acceleration or invent a second mechanism.** Implement the explicitly requested manual accelerator arbitration and a visible input/status distinction; any change to engine power or autonomous cruise speed requires later owner review.

**Disposition:** STAGE 2 ACCEPTED / STAGE 3 IN PROGRESS / MAIN UNCHANGED.
