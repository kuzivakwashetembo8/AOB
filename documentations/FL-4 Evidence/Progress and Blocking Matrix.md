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

## Desktop diagnostic capture — user-provided 2026-10-09

**Evidence:** Three user-provided Chrome DevTools/screenshots plus an exported `gtd.fl4.v1` JSON diagnostic report. Environment: Windows 10 x64, Chrome 155, Vercel preview `dpl_AFqXF3ic9EVh8mCtuGSxpVrt9SY6`, FL-4 branch commit `9e1ac6e`. Collection time according to browser report: `2026-10-09T19:59:18.407Z`.

| Signal | Result |
| --- | ---: |
| CSS viewport and canvas | 811 × 633 |
| Canvas backing and Babylon render buffer | 811 × 633 |
| DevicePixelRatio / hardware scaling | 1 / 1 |
| Captured frames | 1,800 |
| Frame interval median / p95 | 66.6 / 183.2 ms |
| Render-call wall time median / p95 | 45 / 111.7 ms |
| Median-based approximate FPS | 15.02 |
| Draw calls median | 449 |
| Active meshes / active indices median | 130 / 172,146 |
| Total meshes / materials / textures | 588 / 81 / 57 |

**Confirmed:** No framebuffer undersampling in this specific desktop capture: backing-store, rendering buffer, and CSS dimensions coincide at DPR 1. Severe frame-time cost is observed, with render-call time a major contributor. Screenshots show repeated horizontal screen-space banding; cause has not been confirmed. No evidence yet that one component (shadow pass, CPU, GPU, texture filtering or Vercel SSO) is causal. DevTools was open, and changing dock/layout can change the measurement context.

**Interpretation guard:** `fpsApprox` derives from the **median** frame interval; it is not a whole-run FPS average. `renderMs` is wall time around Babylon scene rendering, not GPU timer output. A median 449 draw calls versus 130 active meshes does not mean each active mesh directly submits 3.45 draw calls; inspect shadow/depth/render passes and Babylon instrumentation before attributing cost.

**Proposed controlled comparison:** Repeat a 60–120-second sample with DevTools undocked or closed after instrumentation is active, same camera route, same desktop viewport size; record output. Then inspect rendering pass counts, shadow casters, active mesh/submesh counts and texture resolution/mip profiles. Separately obtain native landscape mobile DPR/backing-buffer measurements. Do not increase render resolution while median frame interval remains ~67ms without proving acceptable device headroom.

**Gate impact:** A01, A02, A03 and A05 now have partial real-desktop evidence; A02 and A03 are not yet passed because no before/after optimization comparison, GPU measure or matched repeat. FL4-04 remains unstarted pending identification of the dominant bottleneck. Real mobile validation and acceptance are blocked.

## Evidence qualification and release sequencing — user clarification, 2026-10-09

**Viewport qualification:** The measured 811 × 633 framebuffer was obtained with Chrome DevTools docked beside the game. It reflects the **reduced available browser viewport**, not the user's full-screen desktop playing area or the mobile PWA. At DPR 1 and hardware scale 1, matching CSS/backing/render dimensions only establishes **no additional framebuffer downscaling in that specific docked desktop condition**. Do **not** claim that 811 × 633 is GTD's typical desktop resolution or extrapolate it to mobile.

**Performance qualification:** The 1,800-sample approximately 15 FPS median-derived result was measured in that constrained, DevTools-open desktop setup. It is a valid diagnostic observation, but **not a device-wide or full-screen gameplay performance verdict**. Repeat at normal full-screen desktop dimensions, compare equal gameplay routes, and distinguish browser/DevTools overhead from rendering cost before accepting performance targets or optimizations.

**Mobile priority:** The user's **primary visual complaint is horizontal banding on mobile**. The installed mobile PWA has **not yet received the latest development builds**. Therefore, **no mobile improvement or regression can yet be attributed to recent FL-3/FL-4 code using the installed PWA**. The screenshots, telemetry and technical conclusions currently supplied are desktop-only. Mobile banding remains **OPEN / NOT TESTED ON CURRENT BUILD**, not diagnosed, solved or accepted. After a current-build mobile deployment, capture actual mobile landscape PWA data and compare screenshots at device pixel density; distinguish CSS/canvas aliasing, texture filtering, GPU/driver phenomena, display capture and PWA caching only with evidence.

**Required release gate / user-directed order:** When FL-4 development and desktop diagnostic work are finished, and **before proceeding to the next development milestone**, reconcile the FL-3 and FL-4 developments with canonical `main`, review and merge the full intended changes, then perform an **intentional Vercel production deployment** of that verified main commit. Check release SHA, deployment status and PWA cache/version propagation. This user request records the required sequencing; it is **not an instruction to merge or deploy prematurely right now**. Production rollout and updated PWA validation are critical to completing the user's real mobile assessment. If the canonical FL-4 acceptance gate requires real mobile testing before closure, treat production as a controlled release candidate or obtain current-build mobile validation via a supported preview before formally declaring FL-4 complete. Do not represent acceptance as satisfied solely by deployment.

## FL4-02 controlled render-scaling experiment — 2026-10-09

Development commit `e1fbd5f81be3681ba33180eb9dcd694ca04d3861` introduces an **opt-in experiment only**: `/game?fl4Diagnostics=1&fl4Scale=VALUE` enables Babylon hardware scaling trial values between `0.75` and `2`. Without the diagnostics flag, or with absent/invalid trial values, the prior production/default formula remains untouched: `Math.max(1, devicePixelRatio / 1.5)`. This is a scientific A/B control, **not a performance optimization already accepted**.

To compare at the same camera path, test `/game?fl4Diagnostics=1` (baseline), `&fl4Scale=1.25` (reduced pixel workload) and `&fl4Scale=0.75` (higher pixel workload) on the **same device** in separate runs, with the same browser window dimensions and time of day. Collect `window.__GTD_FL4_REPORT__()`, screenshots and subjective banding/clarity assessment for each. Note that a scaling level of 0.75 means *more* rendered pixels than 1, while 1.25 means *fewer*. On high-DPR mobile, also capture the default baseline, native pixel-ratio candidate `1` (not necessarily GPU-sustainable), and performance fallback `1.5`. Record DPR, actual CSS/backing/render pixel dimensions and frame-time distribution; do not infer quality solely from the numerical scaling value. Distinguish fullscreen gameplay from DevTools-docked sampling.

**Stop condition:** if a trial notably reduces frame rate, stop that trial and retain default until the relevant GPU/CPU bottleneck is understood. No default hardware-scaling adjustment will be shipped on the basis of the previous 811 × 633 docked measurement.

## FL4-02 A/B visual review — user decision, 2026-10-09

The user compared three screenshots from diagnostic preview `dpl_2akYuvy9To7e2krGand69HvWovcw` (commit `616880bd317fce0149531e58a9a8d84d6eaa2148`), normal browser window, of baseline `?fl4Diagnostics=1`, lower-cost `&fl4Scale=1.25`, and higher-resolution `&fl4Scale=0.75`. **User verdict: baseline significantly superior to both scale experiments.**

**Disposition:** KEEP BASELINE rendering policy; REJECT both candidate scaling factors as default changes. An increased render buffer did not yield sufficient subjective fidelity benefit in these examples, while reducing resolution visibly softened detail. The three screenshots use different viewing positions and no per-variant FPS/frame-time measurements were supplied; therefore, this establishes *visual preference*, **not** comparative performance, root-cause or measurable optimization success.

Fine horizontal striations remain visible across the sky in all three screenshots. The source of the pattern is undetermined; resolution-factor manipulation alone has not convincingly solved it. The latest installed mobile PWA is not up to date; these screenshots are desktop-browser evidence **only**, not current-build mobile-band validation.

**Follow-up:** Do not make a default resolution-policy adjustment. Prioritize isolating the recurring sky banding/texture/filtering appearance from global canvas pixel scaling, and obtain representative mobile build evidence when feasible. The baseline is the approved comparator for future visual and perf regressions; do not mark FL4-02 PASS until matched viewports, instrumentation and real-mobile evidence support closure.

## FL4-04 diagnostic isolation — 2026-10-09

Source inspection identifies a 2048 × 2048 Babylon sun shadow generator with medium-quality percentage-closer filtering in `src/game/world/environment-controller.ts`, alongside the independent `meridian-sky-dome` and `meridian-star-dome` meshes. This establishes **candidate subsystems**, not root causes.

Development commit `02239d152f52636a849b6815a50c500d77856107` introduces two **diagnostics-only** controlled isolation modes, gated behind `?fl4Diagnostics=1`:
- `&fl4Probe=noSky`: disables the sky dome and star dome to assess whether horizontal striations survive without those surfaces. This mode is deliberately visually invalid as a gameplay presentation.
- `&fl4Probe=noShadows`: disables scene shadow rendering to assess the change in draw calls and frame-time. This mode is deliberately visually invalid as a final environment.

For comparison, also sample `?fl4Diagnostics=1` (unchanged baseline). Use the **same preview commit, native window size, camera view, Meridian time and movement path** for all three. Export `window.__GTD_FL4_REPORT__()` for each, allowing a 30–120-second sampling period. Mark any result with DevTools docked separately. A faster no-shadow probe is evidence of shadow-pass cost, **not** authorization to eliminate approved shadows. If banding persists without the sky mesh, look at screen-space capture/display or other materials; if it disappears, investigate sky material, sphere UVs, antialiasing and sampling before proposing a fix. Only user-validated observations can close the mobile banding concern.

Status: probes implemented on development branch; **no performance savings, visual remedy or actual cause established**.

## FL4 sky/shadow isolation: user visual outcome (2026-10-09)

The user compared baseline, `fl4Probe=noSky`, and `fl4Probe=noShadows` screenshots from preview `dpl_7d5ZYrL34PijoyrCLViFQBfo6yix`. **Horizontal banding remains visible in all configurations.** The user also reports that a full blue banded frame appears briefly on ordinary game startup, before other world objects render; the isolated blue frame screenshot was captured during the no-shadow trial but the user explicitly confirms this is **not** unique to that option.

**Conclusions supported by evidence:** Sky dome visibility and shadow-pass activation are not sufficient explanations for the repeated horizontal stripes; disabling either did not eliminate the visible issue. The early blue frame narrows the diagnostic priority to the initial frame rendering/background/compositing path. The temporary sky/shadow toggles are controls, **not final graphical changes**. No FPS numbers were provided for these probes, so shadow cost is **not quantified**. These are desktop-browser screenshots; mobile running the newest PWA remains unverified.

**Source audit:** In `src/game/core/gtd-runtime.ts` the scene starts with `scene.clearColor`, then creates the world/atmosphere; the world controller in `src/game/world/environment-controller.ts` creates sky sphere material and later writes `scene.clearColor` and fog values. Startup calls `scene.render()` after world setup, while the subsequent scheduled rendering is independent. The noSky toggle sets named meshes disabled; a blue gradient still appears in the screenshot, so the next tests must first verify what material/mesh/canvas layer renders the visible blue field, whether the toggle actually affects the observed pixels, and whether a later code path re-enables it. An invariant, flat clear colour alone would not produce an elevation-dependent blue gradient, so do not prematurely conclude a framebuffer defect.

**Next planned diagnostic controls (not yet completed):** Inspect the background composition and world lifecycle; instrument sky-mesh enabled/visibility and current clearColor values in the diagnostic report; test a one-time flat magenta/neutral clear frame or temporary material swap restricted to diagnostic preview, including a no-world scene, and compare at identical resolution. Investigate browser CSS compositing, screen capture and texture aliasing only after identifying the active layer. Avoid changing locked night lighting, accepted stars, normal render scaling or city physics. No rendering fix has been accepted.

## Issue triage supersession — user decision, 2026-10-09

**Authoritative disposition for horizontal banding:** `documentations/Issues/Horizontal Sky Banding - Non-blocking Visual Refinement.md` (`GTD-VIS-001`). The user explicitly classified horizontal sky banding as a **LOW-severity, cosmetic, non-blocking visual phenomenon** that does not obstruct gameplay or materially impair UX. It is **not an FL-4 stop condition or a mandatory root-cause investigation**, notwithstanding earlier exploratory language in this evidence log calling the banding a priority or a defect requiring immediate isolation. Such earlier characterizations are now superseded.

Continue FL-4 profiling, justified optimization, stability verification, and device validation without fixating on a banding remedy. Preserve its evidence and disclose it as a known limitation; investigate progressively if justified. A live mobile validation requirement for **overall resolution, performance, controls and runtime stability** remains in force independently of this cosmetic banding. No rendering correction is implied or authorized by this classification alone.

## FL4 baseline telemetry verification batch — 2026-10-09

**Development branch:** `development/meridian-fl4-optimization`  
**Pinned verification SHA:** `488c1411c3cf8915521bf81816b7d969e5ec181a`  
**Vercel preview:** `dpl_Hrq6Rbn2uQBvY5K7HJQSaqNcropp` — `https://gtd-96mr1kocq-interlinkglobaltech.vercel.app` — **READY**.  
**Build override for this preview:** `npx tsc --noEmit && npm run test && npm run build`. Verification reached the tests and subsequent successful Vite production build; **strict TypeScript passed, 11 test files / 67 tests passed, build completed**. This is developer/CI verification and not a measured live-device performance improvement.

Implemented:
- `src/game/debug/fl4-metrics.ts`: deterministic percentiles, median-derived frame-rate approximation, device-pixel coverage.
- `src/game/debug/fl4-diagnostics.ts`: adds native pixel coverage, shadow caster count/map dimension and initial scene timing to opt-in reports; preserves bounded sample history and resource disposal.
- `src/game/core/gtd-runtime.ts`: captures boot-to-ready and first-render wall time without modifying normal rendering policy, fixed-step gameplay or locked lighting.
- `src/test/fl4-metrics.test.ts`: three new tests; all passed in Vercel verification.

**Current FL-4 disposition:** improved measurement instruments (FL4-01/02), source code regression verification partly satisfied (FL4-05), still no baseline-vs-optimized same-device performance comparison to justify substantive visual optimization (FL4-04). Real landscape-mobile test and final visual approval remain outstanding (FL4-03/06). Keep banding as cosmetic non-blocking `GTD-VIS-001`. No changes to production or `main`.

**Progress reporting:** The previous 35% estimate is subjective, not an official quantitative milestone. Stronger telemetry and 67 passing tests increase implementation confidence but cannot legitimately establish >=75% FL-4 completion while live mobile evidence, measurable performance interventions, and final acceptance are pending. Do not use synthetic samples as real device benchmarks.
