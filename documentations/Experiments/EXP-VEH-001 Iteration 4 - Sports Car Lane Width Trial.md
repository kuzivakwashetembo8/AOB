# EXP-VEH-001 — Iteration 4: Sports-car width and lane-occupancy trial

**Date:** 2026-10-10  
**Status:** USER-AUTHORIZED, implementation committed; source/presentation/performance acceptance pending.  
**Scope:** isolated `experiment/meridian-imported-car-probe` branch only. No final sedan specification or GTD production deployment.

## Decision history and research rationale

The user reviewed four screenshots of Iteration 3 (`dpl_4eKaj7bvPhhTXEE27DGfJhnof8F1`, application SHA `e44d0ca41044effe0bbc74b2606b42a47df7b682`), accepted the sports-car overall shape and current vertical size as plausible, and requested a **further +5% sports-car width trial** to determine whether occupying more lane width improves perceived scale. The buggy had previously reached an acceptable size and is out of scope for this iteration.

**Working principle:** The actual experiment informs the eventual vehicle specification; this numeric factor is not prescribed vehicle-design doctrine. The two GLBs remain rights-unverified third-party test specimens. This does not authorize copying vehicle branding or adopting either temporary model for GTD's future civilian sedan.

## A/B intervention

| Variable | Iteration 3 accepted comparator | Iteration 4 trial | Isolated delta |
|---|---:|---:|---|
| Sports-car width multiplier | 1.00 | **1.05** | **+5% width** |
| Sports-car height multiplier | 1.10 | 1.10 | unchanged |
| Sports-car target world length | 4.53 m | 4.53 m | unchanged |
| Buggy width multiplier | 1.10 | 1.10 | unchanged |
| Buggy height multiplier | 1.00 | 1.00 | unchanged |
| Buggy target world length | 4.05 m | 4.05 m | unchanged |
| Number of parked items, original locations/yaws, geometry file sources | unchanged | unchanged | none |

The runtime already applies scaling to the *local transverse X* after source-axis orientation and before world yaw, so the +5% affects car width without changing longitudinal length. All components of the imported car, including tires, mirrors, glass and cockpit, are stretched by the same transverse-axis factor; this is intentional as a fast comparison technique, **not** proof that a final production asset should be non-uniformly scaled instead of remodeled. The Rapier static cuboid receives the new computed width, with original height/length retained. Its coarse collider is not an exact automotive collision mesh.

## Code changes and assertions

- `src/game/experiments/vehicle-probe-plan.ts`: only the sports specimen's `widthMultiplier` changes from `1` to `1.05`. The buggy specification, source URLs and published length hypotheses are unaffected.
- `src/game/experiments/imported-car-evaluation.ts`: existing per-axis parent scaling is reused; no new geometry, loaders, rendering passes, physics systems or parked-car items.
- `src/test/imported-vehicle-experiment.test.ts`: updates the experimental contract and adds explicit comparisons for width ×1.05 against the prior sports multiplier of 1.00 across deterministic parking slot scales of 0.92, 1.00, 1.04, while verifying identical world height, length and uniform base scale. Existing collider lifecycle/physics allocation tests remain.

## Evidence-gathering protocol

**Historical accepted comparator:** `https://gtd-o8ycdj9vh-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1` (Iteration 3).  
**Iteration 4 candidate:** link and pinned source SHA to be recorded only after the full Vercel `npx tsc --noEmit && npm run test && npm run build` chain finishes.  
**Same-build procedural baseline:** new Iteration 4 preview's `/game?gtdVehicleProbe=baseline&fl4Diagnostics=1` route, if the preview succeeds.

Capture similar front, side, rear and elevated views at comparable distance from Voight, the same lane and parked-car slot, and the same daylight/time setting. Record whether wider wheels/body still look anatomically plausible, whether side mirrors/tires distort, and whether the vehicle encroaches on the curb or crosses the central line. Compare `window.__GTD_VEHICLE_PROBE_REPORT__?.()` for per-slot `fit.worldDimensions`, `shapeAdjustment`, `finalVisualMetres`, `colliderCalibrated` and any warnings/fallback errors; use `window.__GTD_FL4_REPORT__?.()` for same-device frame/render time and draw-call counters.

**Important:** Scaling does not itself add source triangles or mesh subparts. However, screen coverage, shadowing, interactions and contact can change, so FPS/physics consequences must be measured and cannot be inferred solely from passed tests or screenshots.

## Acceptance gates

1. Strict type checking, full tests and production-mode build all pass.
2. Import preview is READY and original proxy baseline remains accessible; production and `main` remain unchanged.
3. Sports-car visible size improves or worsens as judged from matched in-world evidence; buggy remains visually unchanged.
4. Successful imported slots have corresponding static collider width and no extra leaked Rapier handles.
5. Runtime GPU cost, full-world interactions and final automotive art selection remain **OPEN** pending recorded browser/device evidence.

**Rollback:** Existing accepted Iteration 3 deployment remains pinned and unmodified; drop the iteration-4 commit or use that exact preview if the new trial produces an inferior result. No production promotion is authorized by this experiment.

## Verified deployment and automated evidence — 2026-10-10

**Pinned application SHA:** `d6692aa989286ee9b49628057aa3a9323e6e9068` on `experiment/meridian-imported-car-probe`. **Vercel:** `dpl_2jmyF5VqAYPTcoRAiNoc3S3fEQnR`, **READY** at `https://gtd-4y3ikfozk-interlinkglobaltech.vercel.app`.

The deployment used `npx tsc --noEmit && npm run test && npm run build`. **Result: PASS** for TypeScript, **78 of 78 tests across 16 files**, and the final Vite/Nitro application build. The new test verifies that the width-only intervention produces +5% transverse width at multiple parked-slot scales while height and longitudinal length stay identical to the previously accepted Iteration 3 proportions. Both builds remain immutable and separately accessible.

- **Iteration 4 imports, experiment:** `https://gtd-4y3ikfozk-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1`
- **Iteration 4 source-identical procedural controls:** `https://gtd-4y3ikfozk-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`
- **Iteration 3 accepted GLB model comparator:** `https://gtd-o8ycdj9vh-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1`

**Important qualification:** These gates establish that the implementation compiles, automated geometry math and collision lifecycle tests pass, and an isolated Vercel preview is ready. They **do not** establish acceptable lane presence, in-world absence of body/tire stretching artifacts, complete user-device physics or performance cost. Visual and telemetry findings must be recorded from a real browser before deciding whether to retain the additional width.

**Production** `main` is untouched. Vehicle files are still externally sourced, rights-unverified technical specimens; no final vehicle/GLB pipeline has been adopted.
