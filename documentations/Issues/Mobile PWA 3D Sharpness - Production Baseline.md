# GTD-VIS-002 — Mobile PWA 3D Sharpness and Effective Rendering Resolution

**Recorded:** 2026-10-10 (SAST)  
**Status:** OPEN — VERIFIED PLAYER OBSERVATION, ROOT CAUSE UNVERIFIED  
**Priority:** HIGH for FL-4 image-quality investigation and eventual cross-device acceptance; **NOT** a blocker for independently scoped overnight architectural, vegetation or vehicle batches.  
**Category:** Rendering presentation / display-pixel-density / device validation  
**Affected surface:** GTD landscape mobile PWA, production build  
**Production release anchor:** `main` merge commit `af1adcdd8efaa53cc6c666079f3ff7613fd86bc5`; Vercel production deployment `dpl_DDkyZVyCpBCiNMDN9ApHmXWVf6BZ`, READY, `https://grand-theft-division.vercel.app/game`  
**Branch for ongoing development:** `development/meridian-fl4-optimization`  
**Canonical Source of Truth:** `documentations/Meridia First Light Implementation Plan.md`  
**Governing execution contract:** `documentations/FL-4 Technical Implementation Plan.md`, especially FL4-01/02/03/04/05/06 and criteria A01/A02/A05/A06/A08/A10/A12  
**Separate related issue:** `documentations/Issues/Horizontal Sky Banding - Non-blocking Visual Refinement.md` (GTD-VIS-001)

## 1. First current-build mobile validation: what is actually confirmed

Following the explicitly approved merge to `main` and intentional production release, the user installed/launched the **current production build** on mobile and provided **four landscape gameplay screenshots**. The user reports that movement and physics behave similarly to laptop/desktop and that production reached mobile successfully. The screenshots show a running Meridian City scene, generated buildings, roads, vegetation, parked vehicle proxies, Voight, the objective HUD, in-game time and touch controls.

This **supersedes older pre-release statements** that the installed mobile PWA had not received the recent development builds. The new screenshots are evidence of the current production experience, not hypothetical or stale-desktop-only observations.

**Confirmed through user experience:** The app is reachable and playable on mobile, with no reported movement/physics failure in these observations. This is useful practical feedback, **not** a full mobile lifecycle, frame-rate, thermal, collision regression or pixel-density benchmark; those checks remain open.

## 2. User's core observation, retained as product rationale

The user describes the mobile output as substantially less crisp than the laptop: approximately an older 720p television image, with slight noise/horizontal lines, while the desktop feels closer to a sharply rendered high-definition stylized/cartoony game. This is a **perceptual analogy**, not a measurement of an actual 720p framebuffer, physical display resolution or 4K desktop output.

**The problem to solve is the effective sharpness of the complete 3D scene**, not simply increasing the star-field source texture, changing art direction, upgrading all assets or covering it up with UI effects. The gamer should see coherent edges and material definition at a sustainable mobile frame rate, while the existing accepted controls, physics and atmosphere remain intact.

## 3. Screenshot observations (four supplied mobile landscape views)

| Region | Visible observation | Implication / certainty |
| --- | --- | --- |
| Overall Babylon-rendered image | Building outlines, Voight and distant street surfaces appear softer than the previously reviewed desktop previews | Qualitative image-quality difference; exact render-buffer cause **not measured** |
| Facades and windows | Brick/masonry detail, window rims and wall edges have visibly reduced definition | Could involve framebuffer undersampling, texture/detail filtering, screenshot resampling or a combination; **unknown cause** |
| Road and distance | Road texture/markings and distant objects appear blended or comparatively indistinct | Assess render scale, mipmap/filter behavior, antialiasing and ordinary perspective/distance |
| Foliage | Tree leaves lose some separation and individual foliage cards look less defined | Do not conflate this with FL4-VIS-B01–B03 planned **canopy-volume** improvement |
| HUD and controls | Touch controls, clock and mission text remain relatively readable compared with softened scene | Supports checking if blur is concentrated in the 3D canvas; **not conclusive** |
| Blue daytime sky | Fine, repeated horizontal banding is visible and contributes to the television-like appearance | Already tracked independently as **GTD-VIS-001**, cosmetic/non-blocking |
| Gameplay | User reports physics and movement are comparable to desktop | Positive user feedback, **not** timed or comprehensive automated validation |

**Important limitation:** Screenshots do not independently disclose the phone's GPU, CSS viewport, true devicePixelRatio, backing framebuffer, actual rendered pixel resolution, thermal state, per-frame latency or browser/PWA screenshot processing. Do **not** derive these as facts from uploaded image dimensions or guess device hardware. Screen capture and image transport may also affect apparent sharpness.

## 4. Source-backed hypothesis: effective pixel-density cap on high-DPI devices

As of the released source, `src/game/core/gtd-runtime.ts` initializes Babylon with:

```ts
const baselineScaling = Math.max(1, window.devicePixelRatio / 1.5);
// ... only an explicitly enabled FL-4 diagnostic trial may override ...
engine.setHardwareScalingLevel(hardwareScale);
```

Babylon hardware scaling > 1 reduces the rendering buffer relative to the physical pixel dimensions implied by CSS size × devicePixelRatio, after rounding and engine-specific constraints. For devices with DPR above 1.5, the baseline expression tends to target around **1.5 rendered pixels per CSS pixel**, rather than full native DPR.

**Mathematical illustrations only, not observed phone metrics:**

| Example DPR | Baseline hardware scale | Approx rendered linear pixels / CSS pixel | Approx total rendered pixels relative to native |
| ---: | ---: | ---: | ---: |
| 1 | 1 | 1 | 100% |
| 2 | 1.333… | 1.5 | 56.25% |
| 3 | 2 | 1.5 | 25% |

These examples make **sub-native 3D rendering a credible leading hypothesis**, and help explain why desktop DPR 1 comparisons cannot settle high-DPI mobile fidelity. However, the user’s phone DPR and buffer sizes have **not** been measured, so do not call the hypothesis a proven root cause. Raising render resolution without a frame-time budget could compromise interactivity and thermals.

Prior desktop experiments compared `fl4Scale=1.25` and `0.75` to a baseline and the user clearly preferred the baseline **on desktop**. That result stands; it **does not** establish the best scale for the phone or license a global graphics-policy change.

## 5. Distinguish this issue from horizontal banding and asset doctrine

**GTD-VIS-002 / mobile sharpness:** Potentially systemic loss of 3D scene detail on a high-density mobile screen. Its priority is meaningful because it affects the perception of the *whole* game. Investigation lives in the already authorized FL-4 resolution/device-validation workstream.

**GTD-VIS-001 / banding:** Fine horizontal striations visible in daytime blue regions on desktop and now current-build mobile captures. User explicitly classified them as unnatural but non-blocking, not a gameplay error and not a reason to fixate. Do **not** reopen or upgrade its priority just because it co-occurs with 3D softness.

**Asset doctrine refinement:** Window grammar/building proportion, scaled leaf canopy mass, and conservative vehicle-proxy silhouettes are separate planned A/B/C art batches. They should not acquire a new mobile-experience mandate or be delayed until a device-specific sharpness fix exists. Their work can be judged visually in existing desktop previews and measured for draw-call or geometry impact.

## 6. Evidence-first, bounded FL-4 investigation (existing contracts, not a new program)

**FL4-01 / baseline:** Record exact current production build SHA, phone OS/browser/PWA context when supplied, orientation, CSS canvas W×H, backing buffer W×H, Babylon render W×H, devicePixelRatio, current hardware scaling, scene complexity, p50/p95 animation-frame intervals and Babylon `scene.render()` wall time. Use existing opt-in `?fl4Diagnostics=1` instrumentation; never claim `scene.render()` wall time is an independent GPU timer. If output cannot be retrieved from installed PWA, note access constraints and use a separate explicitly authorized diagnostic capture technique; do not add unrequested permanent debug HUD.

**FL4-02 / resolution diagnosis:** Under controlled same-device and same-scene conditions, compare the current baseline with *bounded*, opt-in resolution candidates that increase framebuffer pixels. Record actual buffer dimensions and frame-time impacts, not just the scalar setting. Test a clearly identifiable fixed viewpoint at daylight and nighttime, while preserving the accepted star morphology, streetlights, and UI. If quality improvement comes with unacceptable frame cost, reject or specify a quality fallback; never silently force full physical DPR.

**FL4-03 / representative mobile validation:** Check native landscape behavior, tap target clarity, camera control, walking/sprinting, garage entry/exit, orientation/resize, background/resume, PWA re-entry and thermal changes where practical. Keep screenshots and metric exports tied to build SHA and device/browser identity; distinguish user observation from tool-driven or automated tests.

**FL4-04 / permitted changes:** Only when measurements isolate the issue should a mobile-aware or device-tier-aware resolution policy, filtering/antialias option or another minimal remedy be implemented. Select the least intrusive implementation, preserve desktop baseline and controls, and record before/after device data. No photorealistic asset overhaul, global resolution forcing or speculative shadow/lighting rewrite.

**FL4-05/06 / regression and acceptance:** Compare matched mobile and desktop scenes for legibility, visual crispness, rendering latency, gameplay/physics equivalence, stars, shadows, streetlights and resource stability. User visually approves the resulting image and performance trade-off. Document the decision and any remaining device-specific limitations; a passing Vercel build alone is insufficient.

### Suggested diagnostic report minimum

```text
Source release / SHA:
Device, OS, browser/PWA mode:
Portrait/landscape status and viewport CSS WxH:
devicePixelRatio:
Canvas CSS WxH:
Canvas backing WxH:
Babylon getRenderWidth/Height:
Hardware scaling level:
Native pixel coverage % (reported, not guessed):
Sample count and scene/time/path:
frameMs p50/p95:
renderMs p50/p95 (JS wall time, not GPU):
FPS approximation and method:
Screenshot references:
Qualitative clarity vs desktop baseline:
Control/garage/camera regressions:
Thermal/graphics-context information if available:
Decision, test limitations and reviewer:
```

## 7. Severity, acceptance, and overnight task ownership

**Classification:** High-priority image-quality **finding** within existing FL-4 scope; unresolved. The player can continue using the mobile game. The issue should influence final cross-device acceptance, but **does not stop** the overnight window/building, tree-canopy or parked-vehicle-proxy visual batches.

**Exactly the appropriate overnight integrations:**

- **01:00 — Windows/buildings (batch A):** Keep original architectural work unchanged. No mobile-resolution work added.
- **02:00 — Tree canopy (batch B):** Keep original vegetation work unchanged. No mobile-resolution work added.
- **03:00 — Vehicles (batch C):** Keep original proxy representation work unchanged. No mobile-resolution work added.
- **04:00 — Performance and regression:** Read this issue and integrate mobile sharpness into **existing FL4-01/02/03/04/05 evidence review**. Source audit, comparison protocol, diagnostics or a justified minimal fix only; do not fabricate missing real-device data and do not displace core performance work.
- **05:00 — Final audit/preview:** Read this issue, carry its evidence and open gates into the final report, distinguish confirmed current-build mobile gameplay from *unmeasured* resolution/performance, and list practical after-release validation or patch actions. Do not mark cross-device sharpness PASS without evidence or self-approve FL-4.

These are **annotations to existing schedules** and **not** five new mobile workstreams. Each scheduled run must honor the canonical Source of Truth and user-approved boundaries.

## 8. Why this choice was made (future audit trail)

The user intentionally promoted the current FL-4 state to production for a real-mobile baseline before the five overnight development previews. That release reached the phone, and its movement/physics worked. The resulting screenshots revealed a screen-wide 3D clarity discrepancy previously inaccessible to desktop testing.

Recording it now preserves the distinction between:
1. **What players actually observed** — mobile image softness; game playable.
2. **What code makes plausible** — a capped effective render density on high-DPI screens.
3. **What still needs measurement** — true buffer size, device headroom and frame-time/quality trade-off.
4. **What is not broken** — user-reported movement/physics and independently tracked cosmetic sky banding.
5. **Who should address it** — existing 04:00 performance work and 05:00 audit; **not** the three art-refinement schedules.

**Disposition:** Continue FL-4 and the agreed overnight plan unchanged except for targeted diagnostic/audit awareness. No immediate rendering change, no additional automatic production deployment, and no premature FL-4 closure.
