# G.T.D / NH-OPT2 — Stage 6 Owner Acceptance and Production Release Gate

**Date:** 2026-10-27  
**Project:** Grand Theft Division (G.T.D), North Heights, Meridia  
**Feature branch:** `feature/north-heights-optimization-2-20261027`  
**Owner's acceptance:** “Cruising. Merge and Deploy this milestone.”  
**Acceptance evidence:** Owner-supplied desktop Chrome gameplay screenshot from the Stage 6 preview showing the source-native moving Sedan driving on grass with the Stage 6 FREE DRIVE HUD and AUTOPILOT switch visible.  
**Accepted preview:** https://gtd-d0vycjiqu-interlinkglobaltech.vercel.app/north-heights-preview  
**Verified preview commit:** `3c5d977d9337b442597e112cbfcb7603561ee6f0`  
**Vercel preview deployment:** `dpl_DKCp6eS1Nk8h5acCGXApSMagFPyJ`, state **READY**.  
**Disposition:** **STAGE 6 GAMEPLAY ACCEPTED. OWNER EXPLICITLY AUTHORIZES MERGE TO MAIN AND PRODUCTION DEPLOYMENT.**

## Stage 6 accepted gameplay contract

- Continuous **speed-sensitive gradual steering**, immediately usable on streets, across lanes, on grass, and off-road. Hold Left/Right / A/D or corresponding mobile steering input; reversing changes steering response direction.
- Original accepted NH-012 Sedan remains the **same traffic agent ID and original GEN-VEH-009 body, glass and four source wheels**; no duplicate GLB, car model, collider chassis, or swapped renderer is created on takeover.
- Retains Stage 5 manual controls: **2.6 m/s² (+30%) acceleration**, **10.4 m/s (+30%) maximum speed**, reverse, braking, and coasting to a stop.
- Building walls and footprints are **mandatory hard solid obstacles**, resolved with whole-car oriented footprints and swept small movement steps to avoid tunnelling. Terrain, roads, grass and pavements remain freely traversable with graded-height contact.
- Trees, streetlamps and other cars are intentionally **pass-through** until later collision-physics work. This milestone neither adds nor claims vehicle-to-vehicle crash physics.
- The other **124 autonomous agents** retain their NH-012 traffic routes, speed and reservation rules independently. The original 125 moving Sedan roster and accepted color variation are not removed.
- **Autopilot handback** is available when the vehicle is near and aligned with a valid directed road lane. A displaced/off-road vehicle is **not teleported back** to the road. Stopped vehicle exit retains the off-road position.
- As separately directed, the **six GLB cars previously parked in North Heights are not imported, requested, preloaded, instantiated or driven there anymore.** Existing parking plots remain; shared asset files and other districts are unchanged.
- Voight, third-person camera, input/settings parity, mobile controls and PWA behaviors are preserved.

## Verification and owner sign-off

1. Branch-preview build passed all TypeScript and repository regression gates, including dedicated Stage 6 free-steering/building-collision/other-124-agent/no-six-GLB tests. Corrected legacy tests now assert removal of the six parked GLB runtime imports; the previously obsolete retained-GLB assertions were retired.
2. Vercel release output and service worker packaged successfully; `dpl_DKCp6eS1Nk8h5acCGXApSMagFPyJ` was verified **READY**, SHA `3c5d977d9337b442597e112cbfcb7603561ee6f0`.
3. Owner supplied direct Chrome gameplay evidence of free off-road traversal and responded **“Cruising. Merge and Deploy this milestone.”** This is explicit gameplay acceptance and production authorization.

## Release controls and open observations

- Merge **this feature branch into `main`**, preserving all Stage 1–6 code and documentation.
- Deploy the resulting **exact `main` commit** to the existing `gtd` Vercel **production** environment (not a preview alias), verify the production deployment reaches **READY** and record the deployed revision.
- Do not alter shared vehicle assets or reinstate six parked GLBs; do not delete the accepted traffic simulation.
- The preexisting `GTD-NH-OPT2-SDN-WHEEL-OBS-001` (rims spinning while tyre rubber appears stationary) **remains an open visual issue**; Stage 6 acceptance does not resolve it.
- Preserve historical feature branch/acceptance documents for later technical reference.

**Gate: USER APPROVED MERGE AND PRODUCTION DEPLOYMENT.**
