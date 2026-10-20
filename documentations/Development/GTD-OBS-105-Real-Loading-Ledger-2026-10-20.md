# GTD-OBS-105 — Live Loading Ledger and Full Startup Profiling
Date: 2026-10-20
Branch: feat/gtd-observability-real-loading-ledger-20261020
Status: owner review preview, no merge authorized.
Owner finding: robust browser games run smoothly on same device/network; connectivity cannot be assumed primary cause of GTD lag. The eight-item fixed checklist includes two retired imports and obscures hundreds of real operations.

## Measurement doctrine
Never infer file decoding or GPU readiness from a completed browser download. Render UI solely from observed operations:
- Actual network resource timing (JS, CSS, GLB, textures, wasm, images, dynamic chunks); URL path only, no query/auth.
- One record per real Babylon/physics/world stage.
- One per actual building generation, terrain and road generation, street context planning/creation and collision batches.
- Per vehicle GLB import/parse and distinct Babylon scene instantiation, mesh fit and collider setup.
- Separate static character parse/instantiation and async 3D tree foliage import.
- Real first-world-draw and shader material warmup, with mesh/material/texture counts.
- Browser PerformanceObserver long tasks, total and maximum duration and supported JS heap metrics.
Every row records kind, operation id, current state (loading/loaded/failed), monotonic duration, bounded detail and optional transfer/decoded bytes. All statuses mean exactly what the measured stage supports. Console logs report begin/finish/failure and measured milliseconds. Data is exportable as JSON even while loading, before error.
The UI retains centered GTD branding and strict 60-second stopwatch, followed by a column-based, expandable inventory. No retired/planned placeholders and no invented completion %. No browser-native scrollbar chrome. Grouping is not evidence of success.

## Bounds & limitations
Resource Timing 'loaded' means browser transfer finished, not HTTP success or GLB readiness unless a supported responseStatus establishes failure. Cross-origin timing values may be zeroed. Request failures without an event must be represented by the loader stage error. Long Task API may not be present on all browsers; absence means unmeasured, not no stalls.
Never run React updates per model/tree/road event. A single once-per-second snapshot drives rendering. Cap rows at 1,800 to constrain diagnostics memory. URL path redacts queries and credentials. No arbitrary retries or 'restart network' prompting.
This first iteration records detailed evidence in the browser console and downloadable JSON. Remote persistence on browser crash remains a separate acceptance gate; existing startup server telemetry continues unchanged. Avoid claiming database collection of new item-level details until verified.

## Acceptance
1. Loader starts displaying only actual operations; no retired imports.
2. Completed transfers distinct from GLB decode, source instantiation and first playable frame.
3. Renderer/physics/world/building/road/tree/glass/character phases visible, measured.
4. Slow/failed operation clearly shows elapsed time/error in UI and JSON.
5. TypeScript, Vitest, asset qualification, offline pack and Vercel preview pass.
6. Desktop/mobile visual testing and performance overhead comparison before merge; no merge into main.
