# EXP-VEH-001 — Iteration 2: Real-Scale Calibration

**Status:** Experiment-only calibration implemented; preview validation in progress. **No final vehicle adoption.**

## Decision and rationale

The user inspected six actual Meridian City preview screenshots on 2026-10-10 and confirmed the original forked GLBs render successfully in the city from all angles, with no visible slowdown. Their visual size relative to Voight, pavement and road lanes was unacceptably small, invalidating a representative performance comparison. The earlier experiment fitted each car uniformly INSIDE a shared 1.66 × 1.48 × 3.84 m envelope and used the smallest factor across dimensions. This forced a high buggy to satisfy sedan-like height and a sports car to fit a too-short visual length.

**Authorized remedy:** Calibrate each original GLB by target world length using **only one uniform scale**, preserving its authored width/height/length ratio and original wheels, materials, glazing and detail. No per-axis stretching and no fake additional triangles. Existing parked-item positions, yaw and deterministic item scales remain. The imported buggy and sports car are still temporary unlicensed specimens, not Meridian's eventual everyday sedan.

## Class target choices — trial assumptions, not measured source specifications

| Specimen | Trial target length before item-scale variation | Meaning |
| --- | ---: | --- |
| Forked high-clearance buggy | 3.80 metres | Plausible compact off-road vehicle length; class approximation, not a manufacturer-certified dimension |
| Forked sports car | 4.53 metres | Plausible midsize two-seat sports car length; trial approximation, not a manufacturer-certified model dimension |

A car's effective length also retains the already existing street-context scale factor (0.92–1.04), so final length can vary. The debug report now provides `finalVisualMetres` for each successful parking slot (width, height, length), making this explicit. Actual GLB bounds and the resulting dimensions must be captured from the browser rather than inferred from screenshots.

## Technical implementation

- `src/game/experiments/vehicle-probe-plan.ts`: replaces universal fixed-envelope fit with class-specific target-length uniform scaling. Rotates models whose dominant authored axis is X to align with Meridian's longitudinal Z. Validates finite positive bounds/target.
- `src/game/experiments/imported-car-evaluation.ts`: passes the selected class length into the fitting function; records final world dimensions in `window.__GTD_VEHICLE_PROBE_REPORT__?.()`.
- `src/test/imported-vehicle-experiment.test.ts`: verifies length-target equality, no geometric distortion, consistent X-vs-Z orientation handling and validation errors.

**Consciously unchanged:** existing parked-car source assets, count, IDs, coordinates, yaw, random item scales, materials, world geometry, Voight, Rapier static colliders, and baseline URL mode. The original static physics collider (1.76 m wide × 1.52 m tall × 4.0 m long, before item scaling) **will not match every corrected GLB**. This iteration is a visual-scale and graphics-cost experiment; **do not claim realistic collision correctness** until a separately instrumented matched-collider run is authorized and verified. Road-edge encroachment or sidewalk clearance differences should be documented, not hidden by repositioning.

## Evidence and next checks

1. Run strict TypeScript, all Vitest tests and Vite/Nitro build; pin actual deployment SHA and READY state.
2. Capture source bounds, trial target length, calculated uniform scale, final width/height/length from the per-slot browser probe report; inspect four camera directions with a nearby Voight reference and road marking.
3. Inspect wheels on road, roof heights, curb overlaps, high buggy clearances, and shifts from proxy to imported geometry. Do not assume real-world fit simply because length is plausible.
4. Compare `?gtdVehicleProbe=baseline&fl4Diagnostics=1` and `?gtdVehicleProbe=imports&fl4Diagnostics=1` on the **same new preview deployment**. Collect `window.__GTD_FL4_REPORT__?.()`, noting screen resolution, GPU, p50/p95 frame/render time, active indices, draw calls, load times and source caching. Repeat on landscape mobile.
5. Treat visual/physical collider mismatch as a known temporary limitation, not a passing physics result. The final sedan and material rights are outside this trial.

The earlier small-car preview remains available as an immutable historical comparator; never overwrite its findings with new measurements or imply that the renderer got more detailed when only world scale changed.
