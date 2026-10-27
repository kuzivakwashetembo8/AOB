# GTD-NH-OPT2-SDN-001 — Stage 5 Owner Acceptance and Completion

**Date:** 2026-10-27  
**Project:** G.T.D — Grand Theft Division / North Heights  
**Branch:** `feature/north-heights-optimization-2-20261027`  
**Owner decision:** “Stage 5 successful.”  
**Current instruction:** “Document stage completion, stage 6 is still conversing stage.”  
**Stage 5 status:** **IMPLEMENTED, OWNER-ACCEPTED, COMPLETE.**  
**Release gate:** Feature branch only. No instruction to merge into `main` or deploy to production.

## Accepted Stage 5 feature contract

G.T.D's accepted source-native moving Sedan may now leave automated lane-speed authority and enter a distinct **manual in-lane** mode while preserving its original identity, thin-instance body, source wheel rig, accepted third-person camera, and interaction with the 125-agent NH-012 traffic world.

1. **Manual forward throttle:** Up/W or mobile Gas accelerates at **2.6 m/s²** and permits **10.4 m/s** top speed. These are **30% higher** than the base NH-012 autonomous 2.0 m/s² acceleration and 8.0 m/s maximum.
2. **Manual reverse:** Down/S first brakes, then drives backward along supported lane/connector geometry. Reverse speed is bounded. Vehicle alignment and one car identity persist.
3. **Coasting:** Releasing driving controls decelerates toward zero instead of silently returning to autonomous propulsion.
4. **Localized manual junction decisions:** Left/Right may choose a legal curved road connector when in the **8-metre approach region**, without waiting for normal traffic queue, reservation or greenlight permission. Premature requests are ignored, not queued.
5. **Temporary intentional traffic overlap:** A manual Sedan may pass through moving traffic rather than wait for or physically collide with it. Actual car-to-car collision physics remains a separate, unimplemented feature.
6. **Autonomous handback:** Press **P** or use the HUD's manual/autopilot switch to return to the accepted original NH-012 autopilot when riding. Subsequent autonomy uses the existing traffic route/speed systems.
7. **Traffic invariants:** The remaining autonomous traffic agents preserve their own speed, spacing, junction and simulation logic. Vehicle instances are **not** replaced with a new Rapier chassis/GLB.
8. **Road boundary constraint in Stage 5:** Manual driving is still restricted to existing lane/connector trajectories. **This restriction is accepted for Stage 5; it does not apply to the prospective Stage 6 design.**

## Evidence

- **Accepted Stage 5 preview:** https://gtd-dzpazbiyp-interlinkglobaltech.vercel.app/north-heights-preview
- **Accepted implementation commit:** `f2867f2a5a31796026f310dce2d2110b82764ea5`
- **Vercel:** Deployment `dpl_M6QSzcpedtUjBf33wqbh6AtHjUSK` reached **READY**.
- **Automated tests:** All **150 test files passed**, including new dedicated Stage 5 manual-lane-control regressions.
- **Owner:** Explicitly reviewed gameplay and declared “Stage 5 successful.”
- **Original Stage 5 plan:** `documentations/Development/GTD-NH-OPT2-SDN-001-Stage-5-Full-Manual-In-Lane-Driving-Implementation-2026-10-27.md`.

## Locked requirements / known issues

The previously accepted Stage 1 autonomous boarding, Stage 2 brake override, Stage 3 accelerator and Stage 4 traffic legal-turn controls remain accepted feature history and regression contracts. The known defect `GTD-NH-OPT2-SDN-WHEEL-OBS-001`—rims visually spinning while surrounding tyres appear stationary—**remains open, not fixed or accepted as resolved**.

## Transition to Stage 6 — strictly discussion

The owner proposed allowing **premature turning, other-lane travel, and off-road movement with full manual freedom**, while leaving the automated traffic agents untouched. This is a **proposed architecture direction only**. It does **not** amend the accepted Stage 5 implementation, authorize patches, create a new vehicle physics system, authorize a Stage 6 preview, or permit a main merge/deployment.

**Owner's explicit gate: “stage 6 is still conversing stage.”** Do not begin Stage 6 implementation without subsequent authorization.

**Disposition: STAGE 5 LOCKED / STAGE 6 CONVERSATION ONLY / MAIN UNCHANGED.**
