# EXP-VEH-001 — Iteration 3: Measured stance and height experiment

**Date:** 2026-10-10  
**Authority:** User explicitly authorized implementation after reviewing the previous size-calibrated cars in Meridian City.  
**Status:** Controlled visual-and-collision calibration; final art direction and performance limits **not decided**.  
**Branch:** `experiment/meridian-imported-car-probe`. **Never merge or deploy to production without separate authorization.**

## Evidence that motivates the change

The user observed the second iteration in Meridian: the off-road buggy now has a more convincing real-world vehicle height, but its narrowness still makes it look toy-like. The sports car's overall impression improved, but the user asked for about 10% more height. Both observations are based on actual in-game screenshots, not hypothetical vehicle specifications. The final GTD sedan is still the agreed original everyday civilian fleet four-door; neither third-party GLB is a long-term art selection.

## Implemented single-variable calibrations

| Experimental specimen | Stable world length | Iteration 3 dimension change | Dimensions held at Iteration 2 baseline |
|---|---:|---|---|
| Off-road buggy | 4.05 m | **Width × 1.10** (a modest first trial responding to "a bit wider") | Height and length |
| Imported sports car | 4.53 m | **Height × 1.10** (user-requested approximately 10% increase) | Width and length |

**This is an explicit bounded nonuniform scale experiment, not an automotive modeling doctrine.** A whole-mesh X-axis stretch slightly widens wheels and parts as well as stance; Y-axis stretch enlarges wheel/tire cross-sections vertically. The objective is to quantify the on-screen change before deciding whether a future original asset should instead be remodeled with correct wheel-track and body geometry. Avoid interpreting a visually satisfactory scaled specimen as evidence that arbitrary axis scaling is an acceptable final asset technique.

### Implementation boundaries

1. `src/game/experiments/vehicle-probe-plan.ts`: records separate width/height multipliers per specimen, preserves original class-specific target *world* length, and exposes post-calibration `shapeAdjustment` plus final `worldDimensions` through `planImportedVehicleFit`.
2. `src/game/experiments/imported-car-evaluation.ts`: applies width/height multipliers on the **parked-car local X and Y axes after asset orientation**, leaving forward Z/length normalization unchanged. The imported asset's source geometry, mesh count, original materials, identities and number of cars do not change.
3. The existing static Rapier replacement collider receives exactly the newly calculated width, height and length. It is only a cuboid approximation, not wheel-accurate collision or driving physics.
4. Existing parked-car IDs, yaw, positions, street geometry, art and mechanics remain unchanged. The baseline query switch still shows original procedural cars.
5. Automated tests compare both adjusted and unadjusted fits, confirm 10% intended delta at multiple deterministic parking-slot scales, verify length remains constant, and reject invalid calibration numbers.

## What will be measured (not asserted in advance)

- Real widths/heights/lengths per loaded slot in `window.__GTD_VEHICLE_PROBE_REPORT__?.()`, including post-calibration `fit.shapeAdjustment`, `fit.worldDimensions` and `colliderCalibrated`.
- Perceived full-size visual fit against Voight, road width, wheel contact, curb clearance and model morphology in close side, front/rear and elevated views.
- Collider/visual agreement on walking and jumping around parked cars.
- Matched raw frame-time, draw-call and scene statistics from `window.__GTD_FL4_REPORT__?.()`; user-visible perceived performance is qualitative only until profiler output exists.
- State transitions: original proxy visible during import then GLB appears. This UX issue is unchanged by the experiment.
- Comparative baseline links must use the **same pinned deployment SHA** with `?gtdVehicleProbe=baseline&fl4Diagnostics=1` versus `?gtdVehicleProbe=imports&fl4Diagnostics=1`.

## Decision procedure

Record the user's actual screenshots and profiler numbers after the adjusted preview. If widening the buggy or making the sports car taller causes obviously deformed wheels/body shapes, do not silently revise the trial: document that observation and use it to decide whether to adjust the authored asset instead of making further whole-asset deformations. No arbitrary FPS threshold, materials/textures ownership conclusion, traffic/multi-copy acceptance, or production asset choice is authorized. Other methods (original code-generated geometry, GLB authoring with Spline, licensed marketplaces, script-assisted Blender) remain valid candidate approaches.

**Initial experiment runtime import rights:** Source forks are not a commercial license grant; third-party GLBs remain remotely referenced technical examples for a disposable preview, not final GTD assets.

## Verified deployment and automated gates

**Source/application SHA:** `e44d0ca41044effe0bbc74b2606b42a47df7b682` (code modifications in preceding experiment commits, this SHA adds the first iteration-3 evidence record).  
**Vercel preview:** `dpl_4eKaj7bvPhhTXEE27DGfJhnof8F1` — **READY**, `https://gtd-o8ycdj9vh-interlinkglobaltech.vercel.app`.  
**Build chain:** `npx tsc --noEmit && npm run test && npm run build` — **PASSED**. **16 test files; 78 of 78 Vitest tests passed.** Application build compiled successfully. TypeScript errors: none.

- **Imported adjustment trial:** `https://gtd-o8ycdj9vh-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1`
- **Matched old-proxy control:** `https://gtd-o8ycdj9vh-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`

**Evidence not yet collected:** in-browser imported bounds after both adjustments, visual/physics overlap at curbs, player-car contact, frame-time and draw-call comparisons, mobile results, rights status. This deployment validates compilation/test gates only; it does not validate in-world aesthetic acceptance or runtime cost.

**Recommended next user observation:** At similar camera and Voight distance, compare body width relative to lane/curb and tire appearance for the buggy, cabin/body height and tire shape for the sports car. Use `window.__GTD_VEHICLE_PROBE_REPORT__?.()` for exact slot dimensions and `window.__GTD_FL4_REPORT__?.()` for measured rendering counters. Do not treat these screenshots as an adopted sedan specification without additional independent testing.
