# GTD-NH-OPT2-SDN-001 — Stage 3 Manual Acceleration Acceptance

**Date:** 2026-10-27
**Branch:** `feature/north-heights-optimization-2-20261027`
**Owner acceptance:** "Stage 3 accepted, proceed to stage 4."
**Status:** STAGE 3 **ACCEPTED**; Stage 4 **AUTHORIZED**; no main merge authorized.

## Locked Stage 3 contract

Voight can enter an existing NH-012 moving Sedan, remain in the accepted third-person passenger camera (Stage 1), use Down/S or mobile Brake to stop with priority (Stage 2), and hold Up/W or mobile Gas to request bounded manual forward acceleration (Stage 3). NH-012 remains the sole 20Hz authority for position, heading, traffic speed, following distance, all-way-stop queue and exclusive junction reservations. Analog requests below full travel ask for proportional acceleration; full Gas uses the same 2 m/s² maximum the autonomous controller already uses. It does **not** create artificial acceleration above the existing autonomous traffic limit of 8 m/s, accelerate through an occupied junction, reverse, create a duplicate car physics body, or replace the accepted native geometry, wheel pivots or glass.

**Evidence:** Stage 3 preview Vercel deployment READY at `https://gtd-mqb7qqtyg-interlinkglobaltech.vercel.app/north-heights-preview` (Git commit `d098be7ad207e0e19bc29614ba9591aa3fa0e567`). Six Stage 3 simulator checks and the complementary mobile Gas/Brake lifecycle tests were introduced alongside existing accepted Stage 1 and Stage 2 regressions. **Owner confirmed success.**

**Files:** `src/game/traffic/nh012-traffic-simulator.ts`, `src/game/experiments/north-heights-city-8.ts`, `src/ui/hud/touch-controls.tsx`, `src/ui/hud/desktop-controls.tsx`, `src/routes/north-heights-preview.tsx`, `src/test/nh-opt2-sedan-manual-acceleration-stage3.test.ts`, `src/test/nh-opt2-sedan-assisted-pedals-stage3.test.tsx`.

## Authorization for Stage 4

The owner explicitly authorizes the next milestone of the existing four-stage technical implementation plan: **Left/Right turn selection at the next legal lane-network junction**. The intended controls choose one legally defined road connector; they do not produce arbitrary yaw/free-angle steering, cross lane boundaries, or enable parking/off-graph motion. Maintain Stage 1–3 invariants, one traffic agent, the accepted GEN-VEH-009 native body and four wheel assemblies, and the six unrelated parked GLBs.

**Open recorded defect:** `GTD-NH-OPT2-SDN-WHEEL-OBS-001`: rims visibly rotate, tyres appear static. It is not authorized for repair in Stage 4.

**Release:** Stage 4 preview-only until owner visual acceptance. No production main merge/deployment.
