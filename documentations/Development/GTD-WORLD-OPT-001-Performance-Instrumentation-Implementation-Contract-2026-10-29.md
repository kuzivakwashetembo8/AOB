# GTD-WORLD-OPT-001 — Performance instrumentation implementation contract

Status: authorized; experimental implementation in progress. Base: main at ed75343b03d4bb7bab25323f27ea7ca71cafc086. No merge or deployment authorized by this document.

## Purpose
Build a development-only, low-overhead performance dashboard and exportable benchmark to measure North Heights on desktop and mobile. Preserve all 100 NPC identities, 125 Sedan traffic agents, accepted controls, physics, and save/resume behavior.

## Metrics
- requestAnimationFrame frame interval: median, p95, p99, count >50ms, rolling sample count; label tab-background intervals separately.
- CPU timings: NPC renderer update, traffic update, physics step, world update, and asset-loading tasks where accessible.
- Babylon engine instrumentation: draw calls, active meshes, triangles, GPU frame time when supported; explicitly mark unsupported counters rather than inventing measurements.
- NPCs: active, pooled, loaded/pending/failed appearances, skeletons.
- Traffic: total simulated and rendered agents, by LOD when available.
- Loading: navigation-to-playable, model downloads, parse and instantiation timing.
- Streaming: current and pending cells once OPT-006 exists; initially display not implemented.

## Design constraints
Opt-in diagnostic mode only; bounded ring buffers, monotonic timestamps, no per-frame logging, no high-frequency React state updates, and negligible disabled-mode overhead. Export JSON containing build SHA, device class, scenario label, sample interval, metric units and missing-data reasons. Keep measurements local unless user explicitly exports them. Respect paused/background tab state. Do not modify simulation cadence or NPC visibility decisions.

## Benchmark scenarios
Stationary, walk, drive, fly, rapid camera rotation, dense NPC, dense traffic; run baseline and instrumented on same device and build. Record median/p95/p99 frame intervals, >50ms frame counts, startup time, and visual regressions. Measure diagnostic overhead by comparing profiler on/off.

## Acceptance gate
Dashboard functional on desktop and mobile; exported results reproducible; no noticeable instrumentation-induced stutter; no population reduction; no gameplay regression. Numerical performance targets for later packages must be evaluated against this measured baseline. Preview and owner acceptance required before merge.

## Dependencies and implementation order
OPT-001 instrumentation → OPT-003 asset registry → OPT-004 priority loading → OPT-005 composite LOD → OPT-006 geographic streaming → OPT-007 NPC simulation → OPT-008 traffic separation → OPT-009 selective physics → OPT-002 adaptive budgets → OPT-010 district unification.

## Current blockers
No verified browser runtime measurements yet. The prior NPC optimization PR #66 is not merged and its feature flags remain opt-in; keep OPT-001 based on main and measure that baseline without assuming PR #66 is deployed.
