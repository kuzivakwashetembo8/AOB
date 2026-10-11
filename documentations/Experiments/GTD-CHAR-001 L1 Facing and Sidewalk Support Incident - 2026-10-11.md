# GTD-CHAR-001 L1 — Facing-axis and raised-sidewalk collision incident

**Date recorded:** 2026-10-11 (user local UTC+02)
**Evidence received:** about 23:12 local; first browser screenshot displays 22:29, other screenshots do not expose reliable event timestamps. These are visible screenshot readings, not validated software timestamps.
**Environment:** Desktop Windows/Chrome, Vercel experimental preview `gtd-8lifvzrbl-interlinkglobaltech.vercel.app/game?gtdCharacterTrial=ual`; source `bb6e341d691556aebfb08f9164c1fb57a89187ed`.
**Severity/scope:** L1 visual locomotion acceptance BLOCKED; no evidence of broken horizontal Rapier navigation; `main` and production preserved.
**User-provided evidence:** four annotated desktop screenshots in the GTD conversation (2026-10-11); user marks the pressed arrow and visually observed travel.

## Observed behavior (source: user)

| Input | Horizontal direction observed | Humanoid facing/foot-cycle observed | Expected |
| --- | --- | --- | --- |
| Forward / ↑ | Moves forward | Faces screen right; walks visually to right | Back toward camera, forward along street |
| Back / ↓ | Moves toward camera | Faces left; legs appear to step toward left | Turn 180°, face camera and advance forward |
| Right / → | Moves right | Faces camera; feet strut camera-ward | Right toward intended travel |
| Left / ← | Moves left | Faces away from camera; foot cycle toward distance | Left toward intended travel |
| Across raised sidewalks/curbs | Character can traverse | Boots/lower legs sink into elevated mesh; on road foot contact appears acceptable | Capsule stands on corresponding raised support; later IK addresses individual swing/stance contacts |

**Do not describe this as four broken direction controls.** The horizontal input and Rapier displacement go the correct compass way; visual-forward calibration is rotated. Stepping/contact is a separate support-geometry defect.

## Source inspection and hypotheses

1. `src/game/character/locomotion/travel-heading.ts`: intended travel vector drives a root heading and movement parallel to that root via `sin(yaw),cos(yaw)`. The camera-relative root-translation direction is consistent with user screenshots.
2. `src/game/character/voight-humanoid-trial.ts`: imported rig's child `visualRoot.rotation.y` is **+90°** by legacy demo convention, while actor root now receives its own orientation. The consistent quarter-turn observed under all four controls is powerful evidence that the +90° child correction is wrong **for this Babylon trial**, although runtime inspection is still required to confirm the exact rig reference. Initial corrective trial: change default visual correction to 0°, retain in-game selector so the user can directly validate or reverse it.
3. `src/game/world-generation/urban-surface-renderer.ts`: First Light parity road geometry has asphalt top Y~0.03, sidewalks top Y=0.11 (mesh center Y=0.055, height 0.11), and curb top Y=0.21 (center Y=0.105, height 0.21).
4. `src/game/world/generated-first-light-world.ts`: ground collider ends at Y=0.0; `registerUrbanNavigationCollision` registers **curb** meshes only, not sidewalk slabs. Consequently Rapier may support capsule height on the ground plane while visible boots intersect elevated sidewalks. Absence of sidewalk collision is source-confirmed; amount of toe penetration during animation remains to be measured, not inferred exactly from a still image.
5. Baseline `MeridianPhysics` uses a kinematic capsule with autostep height 0.28 and snap-to-ground 0.22. These can climb registered raised obstacles, **but cannot support walking on an unregistered sidewalk slab**. Autostep does not replace collision geometry.
6. Foot IK remains a future L3/L4 deliverable; it is not a suitable excuse to mask incorrect support surfaces. Visual shoe offsets and swing-cycle intersections might remain after colliders are aligned.

## Correction scope (explicitly user-authorized investigate → document → patch → deploy)

- Keep physics-origin yaw and camera-relative input unchanged; initially set the trial rig-forward calibration to 0°, including the development reset default. Keep -90/0/+90/180 tuning choices for empirical comparison.
- Add collision support for the **existing First Light parity sidewalk meshes** at their actual rendered world bounds, alongside existing curb blockers. Do not add invented sidewalks, move the world, alter materials, change existing production collision defaults, or apply IK offsets.
- Gate raised-sidewalk collision by the **opt-in trial flag**, preserving both `main` and the nontrial branch preview behavior.
- Add regression evidence: every arrow's intended direction/facing calibration, snapshot of actual sidewalk-vs-curb bounds, Rapier standing-height comparisons on road and sidewalk and tests showing nontrial parity retains its original physics registration. Avoid claiming L3 ground-contact acceptance from static tests alone.
- Keep the export trace, pause-menu Apply & Resume, city/building/marking rendering, vehicles, fixed timestep and rollback.
- Deploy to Vercel preview only after TypeScript, tests and build pass. Return build SHA and link; user performs 4-direction orientation and curb crossing verification before L1 acceptance.

**Known limitations:** With no L3 foot calibration and no L4 IK, animated toe/heel positions can still penetrate curbs during swing phases even when capsule support is correct. This trial addresses the incorrect support surface and 90° visual heading; it does NOT claim human-quality gait or finished IK.

## Patch and deployment verification (2026-10-11)

- Branch: `experiment/gtd-char001-l1-travel-facing`; **not merged to main**.
- Preview: https://gtd-alge6grou-interlinkglobaltech.vercel.app/game?gtdCharacterTrial=ual
- Vercel deployment: `dpl_AdxqnBK2XniNmcHAmouqTbWV5Rjp`, source commit `97531c1946399157b03857bcb8799dd93e77dd19`.
- Build gate: `npx tsc --noEmit && npm run test && npm run build`; **36 test files / 143 tests passed**. Vercel READY and authenticated page HTTP 200.
- Corrected: `DEFAULT_TRAVEL_HEADING.visualForwardDeg = 0`; imported visual-root starts at 0° rather than +90°, with manual forward-axis selector retained.
- Added: opt-in physical support colliders for the **existing** First Light parity sidewalk meshes. The default world and its curb collisions remain unchanged.
- Measured Rapier regression: raised-sidewalk standing height > flat road; baseline without opt-in remains lower; both tests pass using actual world meshes and collision-corrected movement.
- Production at verification remained `9d5be65176f7711388db03c7ab82fb3500213e55` and was untouched.
- **Outstanding gate:** user must verify actual 4-direction visual orientation and road→curb→sidewalk crossing on browser/mobile; shoe swing-phase toe penetration may still require L3/L4 calibration and Foot IK. Do not infer completion from HTTP 200 or automated tests.
