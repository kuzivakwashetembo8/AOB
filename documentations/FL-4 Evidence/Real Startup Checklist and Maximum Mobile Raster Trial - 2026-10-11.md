# FL-4 — Real startup readiness and opt-in maximum mobile clarity trial

**Date:** 2026-10-11
**Branch:** `fix/fl4-real-startup-and-mobile-max-quality`
**Authority:** `Meridia First Light Implementation Plan.md` → `FL-4 Technical Implementation Plan.md`.
**Status:** Documented implementation candidate; **not deployed** and not device-validated.

## User confirmation and observed defect

1. User confirms the production DPR-aware rendering fix materially improved/crisped the mobile viewport. Record FL4-02 perceptual-sharpness improvement as accepted; this does **not** establish an FPS or stability pass.
2. User reports a startup-only freeze while parked cars load; once the cars load gameplay is smooth. Source proves the startup race: `beginImportedCarEvaluation()` starts unawaited `loadModels()`, while `GTDGameRuntime.bootstrap()` sends progress 100 and returns early. `game.tsx` then removes the overlay and starts input/renders before expensive vehicle loader/download/instantiation/collider work settles. The freeze and this ordering coincide; source inspection cannot establish the exact duration or which sub-operation occupies the main thread.
3. User requests an experimentally measurable highest-mobile-quality mode comparable to desktop, with actual constraints logged rather than assumed.

## Exact patch contract

- Keep the loading overlay until **actual** renderer creation, Rapier initialization, generated South Ward world construction, Voight creation, GLTF module readiness, each source-class GLB import and all corresponding slot/collider placements (or explicit failures), and a successfully rendered first frame.
- Replace hard-coded claim-like progress with a fixed list of **real checkpoint states**, driven only by runtime callbacks: pending, running, passed, failed, or not applicable. The percentage is calculated from terminal checkpoints, **not elapsed time or invented transfer progress**.
- Preserve imported-only visuals: missing/failed vehicles mean visibly empty, noncolliding parking slots; never display legacy procedural proxy cars. Report missing assets as **unavailable**, and permit gameplay after all requested import operations have genuinely settled.
- Do not turn failed renderer/physics/world/first-frame setup into 100% success. Preserve teardown: in-flight work must not reenter a destroyed game. Offer an explicit retry on fatal bootstrap errors.
- No simulated GLB progress, artificial timers, mocked asset completion, automatic timeout declaring success, or unmeasured performance claims.
- Keep normal graphics policy and existing saved `Auto/Balanced/Sharper/Native` presets unchanged. Only with `fl4Diagnostics=1`, allow `fl4QualityTrial=native` (hardware scaling 1.0, physical DPR) or `fl4QualityTrial=supernative` (0.8, 1.25× DPR per dimension, ~1.5625× physical raster pixels). Existing explicit `fl4Scale` overrides trial values for reproducible A/B, and the measured scale always appears in diagnostics.
- Record **real** rendered/backing pixel dimensions, device DPR, frame-time P50/P95/max, >50/100/250ms frame-gap counts, render-time max, scene geometry burden and imported-vehicle per-source load outcomes. The export stays entirely local unless the user shares the JSON.
- Supernative is an experimental stress test, **not a promised desktop-quality match or production default**. It can cause device-specific fill-rate pressure, throttling, crashes or WebGL context loss. Do not assert results before the actual phone trial.

## Acceptance procedure (real device required)

On the same landscape Android device in comparable camera/time/vehicle-loaded conditions:
1. Validate normal `Auto` session and that the startup checklist remains visible until the cars have settled or explicitly failed.
2. Visit `/game?fl4Diagnostics=1&fl4QualityTrial=native`, move and orbit after all checklist statuses resolve, export `Save FL-4 data`; note approximate 30–60 second warm/cold observation window and perceived sharpness.
3. Repeat with `/game?fl4Diagnostics=1&fl4QualityTrial=supernative`; compare the same view and motions, then export a second JSON. Stop if responsiveness or temperature becomes unacceptable. Optionally use `fl4Scale=...` as diagnostic hardware-scaling control.
4. Compare actual resolution and frame p95/max/long stalls; report native coverage, load failures and first-render delay. Human in-motion perception remains the acceptance authority. No claim of GPU utilization/thermal measurement without external instrumentation.
5. Recheck garage enter/exit, pointer drag, two-finger movement, pause/resume, vehicle collision and no procedural car fallback.

**Release gate:** separate user approval before Vercel preview or production. Source changes should pass `npx tsc --noEmit && npm run test && npm run build` in a suitable Node/dependency environment; if no runner is available, record that limitation. Full FL4-06 final acceptance remains open pending real device evidence.
