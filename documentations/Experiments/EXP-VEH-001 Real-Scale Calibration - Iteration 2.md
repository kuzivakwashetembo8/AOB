# EXP-VEH-001 — Iteration 2: Real-Scale Calibration

**Status:** Experiment-only calibration IMPLEMENTED; STRICT TYPESCRIPT, 77 AUTOMATED TESTS, AND BUILD VERIFIED; NON-PRODUCTION PREVIEW READY. Real in-world visuals/interaction/benchmark comparison remain to be measured. **No final vehicle adoption.**

## Decision and rationale

The user inspected six actual Meridian City preview screenshots on 2026-10-10 and confirmed the original forked GLBs render successfully in the city from all angles, with no visible slowdown. Their visual size relative to Voight, pavement and road lanes was unacceptably small, invalidating a representative performance comparison. The earlier experiment fitted each car uniformly INSIDE a shared 1.66 × 1.48 × 3.84 m envelope and used the smallest factor across dimensions. This forced a high buggy to satisfy sedan-like height and a sports car to fit a too-short visual length.

**Authorized remedy:** Calibrate each original GLB by target world length using **only one uniform scale**, preserving its authored width/height/length ratio and original wheels, materials, glazing and detail. No per-axis stretching and no fake additional triangles. Existing parked-item positions, yaw and deterministic item scales remain. The imported buggy and sports car are still temporary unlicensed specimens, not Meridian's eventual everyday sedan.

## Class target choices — trial assumptions, not measured source specifications

| Specimen | Trial target final in-world length | Meaning |
| --- | ---: | --- |
| Forked high-clearance buggy | 4.05 metres | Plausible compact off-road vehicle length; class approximation, not a manufacturer-certified dimension |
| Forked sports car | 4.53 metres | Plausible midsize two-seat sports car length; trial approximation, not a manufacturer-certified model dimension |

The procedural street item still records its original 0.92–1.04 scale value, but the imported visual fit explicitly compensates for that value. Therefore each successful imported specimen reaches its class-length target in world metres regardless of which existing slot it occupies. Width and height remain authored-model proportions, so they can be inspected in `finalVisualMetres` rather than being independently stretched. Exact world dimensions must still be captured from the running browser probe report.

## Technical implementation

- `src/game/experiments/vehicle-probe-plan.ts`: replaces universal fixed-envelope fit with class-specific target-length uniform scaling. Rotates models whose dominant authored axis is X to align with Meridian's longitudinal Z. Validates finite positive bounds/target.
- `src/game/experiments/imported-car-evaluation.ts`: passes the selected class target length and existing parking-slot scale into the fitter; records real final world dimensions and `colliderCalibrated` in `window.__GTD_VEHICLE_PROBE_REPORT__?.()`; replaces that slot's collider only after the import succeeds. On model load/fit failure the original proxy and collider remain available.
- `src/game/world/generated-first-light-world.ts`: adds a bounded experimental `replaceParkedCarCollider` operation; creates a Rapier static cuboid matching each successful imported model's derived width/height/length and existing position/yaw, removes the prior car collider and retains disposal ownership. No new car spawns or changes to original other world collisions.
- `src/test/imported-vehicle-experiment.test.ts`: verifies class target world length independent of parked seed scale, unchanged shape ratios, X-versus-Z orientation and invalid dimensions; exercises repeated Rapier parked-collider replacement and scene disposal without increasing collider/body counts.

**Consciously unchanged:** source assets, parked-car count, IDs, coordinates and yaw, seeded item scale values, materials, streets/curbs, buildings, Voight, garage physics, non-car colliders, and baseline URL mode. **Deliberately changed for imported cars only:** upon confirmed import, a replacement Rapier static cuboid now follows the final visual footprint. It remains a deliberately coarse cuboid, not wheel-accurate automotive collision. Unknown/failed imported specimens retain both old visuals and old colliders. Automated collision-count and disposal assertions are included, but physically walking around/into a size-correct car is still a separate **unverified browser acceptance gate**. Document any curb/road overlap without relocating the spawned vehicle.

## Evidence and next checks

1. Run strict TypeScript, all Vitest tests and Vite/Nitro build; pin actual deployment SHA and READY state.
2. Capture source bounds, trial target length, calculated uniform scale, final width/height/length from the per-slot browser probe report; inspect four camera directions with a nearby Voight reference and road marking.
3. Inspect wheels on road, roof heights, curb overlaps, high buggy clearances, and shifts from proxy to imported geometry. Do not assume real-world fit simply because length is plausible.
4. Compare `?gtdVehicleProbe=baseline&fl4Diagnostics=1` and `?gtdVehicleProbe=imports&fl4Diagnostics=1` on the **same new preview deployment**. Collect `window.__GTD_FL4_REPORT__?.()`, noting screen resolution, GPU, p50/p95 frame/render time, active indices, draw calls, load times and source caching. Repeat on landscape mobile.
5. Assert `colliderCalibrated: true` only after a successful import; validate the enlarged collider against Voight and the curb with actual gameplay traversal. A matching static box does not prove accurate wheel/body physics, and a fallback uses its original collision. The final sedan and material rights are outside this trial.

The earlier small-car preview remains available as an immutable historical comparator; never overwrite its findings with new measurements or imply that the renderer got more detailed when only world scale changed.

## Revision control for calibrated-collider experiment

**Implementation baseline:** `b1147110de6e6a4e47b1b3383ede70397901a67a` (experiment branch; production `main` untouched). **Pinned verification deployment:** `dpl_9Ai7mu64hqLRHDmD5zP78AQSHHDo` — **READY** at game-code SHA `b1147110de6e6a4e47b1b3383ede70397901a67a`. `npx tsc --noEmit && npm run test && npm run build` passed; **16 test files and 77 tests passed**, including the new static-collider replacement and disposal regression. Vercel preview: `https://gtd-gn2raagb1-interlinkglobaltech.vercel.app`. This iteration supersedes the initial small-car visual-envelope normalization for the experiment **only**, without revising the historical evidence record. Because the imported vehicle uses external, rights-unverified third-party models, any acceptance is limited to a controlled technical experiment.

**Repeatable evidence capture**: open the same SHA with `?gtdVehicleProbe=imports&fl4Diagnostics=1` and `?gtdVehicleProbe=baseline&fl4Diagnostics=1`; compare the same car count and camera/time conditions, inspect `window.__GTD_VEHICLE_PROBE_REPORT__?.()` for `fit.worldDimensions`, `finalVisualMetres`, `colliderCalibrated` and slot errors; then inspect `window.__GTD_FL4_REPORT__?.()` for p50/p95 frame/render times, draw calls and active indices. Record mobile and desktop separately. Without exported numbers, no frame-rate or collision outcome should be declared proved.

## Verified preview comparison (2026-10-10)

- **Real-scale imports:** `https://gtd-gn2raagb1-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1`
- **Same-build original proxy control:** `https://gtd-gn2raagb1-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`

**Demonstrated by build/automated tests:** source compiles; 77 tests pass; replacement collider allocations/disposals retain the expected physics body/collider count. **Not yet demonstrated:** rendered final measured width/height from actual GLBs, full-size alignment and curb clearance in the browser, real user interaction with replacement colliders, p50/p95 rendering cost in matching conditions, loading/presentation behavior, mobile performance or IP/license suitability. The source asset images and quality are NOT a committed GTD art choice.

In-browser experiment telemetry: `window.__GTD_VEHICLE_PROBE_REPORT__?.()` — check each successful slot's `status`, `finalVisualMetres`, `fit.worldDimensions`, `colliderCalibrated`, `warnings` and `failure`. Rendering telemetry: `window.__GTD_FL4_REPORT__?.()` — retain raw JSON for the identical device, clock time, viewpoint and hardware scale. The original source-fork assets are referenced remotely and have not been copied into GTD.
