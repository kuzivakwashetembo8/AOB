# FL-4 Evidence — Implementation Progress and Blocking Matrix

**Status:** IN PROGRESS — NOT ACCEPTED  
**Date:** 2026-10-09  
**Canonical authority:** `documentations/Meridia First Light Implementation Plan.md`  
**Execution contract:** `documentations/FL-4 Technical Implementation Plan.md`  
**Branch:** `development/meridian-fl4-optimization`  
**Starting state:** FL-3 user accepted; development source branched at FL-4 authorization.  
**Deployment:** No FL-4 deployment requested or created. The execution contract requires separate deployment permission.

## Confirmed source audit

The accepted FL-3 `src/game/core/gtd-runtime.ts` creates a Babylon `Engine` and calls:

```ts
engine.setHardwareScalingLevel(Math.max(1, window.devicePixelRatio / 1.5));
```

In Babylon, a larger hardware-scaling value generally lowers backing/render buffer size relative to CSS pixels. At DPR 2, this expression gives ~1.333 scaling and approximately 1.5 rendered pixels per CSS pixel rather than the screen's full 2 device pixels; at DPR 3 it yields a scaling factor 2, again approximately 1.5 rendered pixels per CSS pixel. These are **theoretical calculations**, not device measurements. This is a plausible contributor to user-observed mobile softness, **not a confirmed root cause**. It does not explain possible non-canvas UI softness without screenshot/canvas measurements.

Source audit additionally verified the runtime's 60 Hz fixed physics step, scene rendering independent of that simulation step, lifecycle disposal, garage interior classifications and accepted FL-3 sky pipeline. No gameplay or lighting changes made during FL-4 instrumentation.

## Implemented code

- `src/game/debug/fl4-diagnostics.ts`: optional bounded 1,800-frame telemetry window. Tracks JS frame scheduling intervals, scene render call duration, Babylon draw-call counter via `SceneInstrumentation`, active mesh/index counts, scene resource counts, canvas CSS/backing dimensions, render dimensions, DPR, hardware scaling, and browser identification.
- `src/game/core/gtd-runtime.ts`: initializes instrumentation only for `?fl4Diagnostics=1`; exposes `window.__GTD_FL4_REPORT__()` in the browser console and removes it on runtime destruction; no added React state per frame; no default rendering-resolution change.

### How to capture reproducible evidence

On an **explicitly approved development preview** of this branch, load `/game?fl4Diagnostics=1`, walk the fixed paths for 30–120 seconds, then run:

```js
copy(JSON.stringify(window.__GTD_FL4_REPORT__(), null, 2))
```

Repeat at street, garage threshold/interior, night sky, and after orientation/resize. Save the resulting JSON beside screenshots taken at native device size. Take identical captures against the accepted FL-3 baseline before changing the resolution policy. Diagnostics do not require telemetry upload and do not send browser metrics to servers.

Note: `renderMs` measures the JavaScript `scene.render()` call wall time, **not precise GPU duration**. `frameMs` is animation-frame scheduling interval, not a separate CPU time measure. Draw calls and active indices are Babylon's scene counters. GPU timers, texture byte footprints, thermal state and real device battery characteristics remain unavailable without extra instrumentation or device tools. FPS is an interval-based approximation, not a guarantee of perceptual smoothness.

## Ordered package outcomes

| Package | Status | Verified work | Unfinished gate |
| --- | --- | --- | --- |
| FL4-01 Baseline | PARTIAL | Source audit, opt-in telemetry implemented | Same-device samples, raw JSON and repeatable FL-3 captures |
| FL4-02 Resolution audit | PARTIAL | Found DPR/hardware-scaling formula and documented predicted undersampling | Actual CSS/backing/render measurements, candidate sharpness versus FPS |
| FL4-03 Device validation | BLOCKED | Test protocol in implementation contract | Representative real desktop/mobile runs, resize/reentry/context evidence |
| FL4-04 Optimization | NOT STARTED | Candidate bottleneck identified as hypothesis | Measured cause, same-device before/after justification |
| FL4-05 Regression | BLOCKED | Invariant list documented | Build/tests and real visual comparisons |
| FL4-06 Acceptance | BLOCKED | Gate and evidence template established | Approved preview, complete performance evidence and explicit user acceptance |

## Acceptance register

| ID | Status | Evidence gap |
| --- | --- | --- |
| A01 | PARTIAL | Environment/viewport measurements not captured |
| A02 | BLOCKED | No device frame-time samples; no GPU timings |
| A03 | PARTIAL | Instrumentation implemented, counters not yet measured |
| A04 | BLOCKED | Load/reentry data and memory growth not measured |
| A05 | PARTIAL | Source-level scaling hypothesis only |
| A06 | BLOCKED | No physical mobile/browser validation |
| A07 | BASELINE ACCEPTED; FL-4 REGRESSION PENDING | FL-3 garage/user acceptance established |
| A08 | BASELINE ACCEPTED; FL-4 REGRESSION PENDING | FL-3 night sky and lighting accepted |
| A09 | NOT STARTED | No benchmark-justified optimization approved by evidence |
| A10 | BLOCKED | Mobile orientation, reentry and graphics-context checks pending |
| A11 | NOT VERIFIED | No new TypeScript, full Vitest or lint execution has been obtained |
| A12 | BLOCKED | Final visual and responsiveness acceptance not requested |

**No user-facing metrics, benchmark improvements or completed FL-4 phases are claimed.** In particular, a lower-resolution render may account for perceived blur, but the rendering scale will not be changed blindly before measured device comparison.

## Required next evidence and permissions

1. Obtain a separate authorization to build a **non-production FL-4 diagnostic preview**, in keeping with the canonical deliberate deployment policy.
2. Capture native desktop and real landscape-mobile telemetry and screenshot pairs for accepted FL-3 versus FL-4 diagnostic branch. Record tested hardware/browser/DPR and thermal constraints.
3. Diagnose under-resolution or other blur mechanisms from observed pixels and frame timings, then implement the lowest-risk quality policy only when measured benefits justify it.
4. Run automated verification on actual source; do not equate a prior FL-3 READY deployment with new FL-4 validation.
5. Complete FL4-03 through FL4-06 and obtain visual acceptance. Update the canonical milestone only then.

**Stop condition:** FL-4 MUST NOT be represented as complete or visually validated until the real-device and user-acceptance gates are evidenced.
