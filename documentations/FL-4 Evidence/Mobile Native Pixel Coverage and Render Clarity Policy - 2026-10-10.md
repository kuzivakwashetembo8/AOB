# FL-4 — Mobile native pixel coverage and responsive clarity policy

**Date:** 2026-10-10  
**Status:** CODE IMPLEMENTED, development benchmark deployment and real-device acceptance pending.  
**Code SHA pinned for verification:** `7fbabdf2574664c1ac97805bd97211a8a4efb303` on `fix/fl4-mobile-render-clarity`.  
**User source:** Two Android landscape screenshots supplied in conversation, `211250.jpg` and `211246.jpg`, each 1536×691 screenshot pixels. Screenshots show the fixed banding and fast touch-orbit and illustrate softer world geometry/road/facades than laptop rendering. User says screenshot *still images appear sharper than actual running viewport*, subjectively comparable to a smooth 480p–720p video. Intermittent freezes after a few movements are **OBSERVED, NOT YET A REPRODUCIBLE FAILURE**; do not mark as a confirmed recurrent defect or assert a sole cause.

## Source-confirmed blur mechanism

`src/game/core/gtd-runtime.ts` contained:

```ts
const baselineScaling = Math.max(1, window.devicePixelRatio / 1.5);
engine.setHardwareScalingLevel(baselineScaling);
```

Babylon hardware scaling divides physical backing dimensions by the scaling factor. On DPR=3, the old implementation rendered approximately 1.5 rendered pixels per CSS pixel and then upscaled to a native 3 pixels per CSS pixel, **25% of the total physical display pixel count**. At DPR=2.5, coverage was **36%**. The UI `Settings.resolution` options `Native / 75% / 50%` were never passed to the game engine, so selecting Native could NOT correct the observed whole-scene softness.

The user's screenshots prove perceived blur but **do not establish their device's actual browser DPR, CSS canvas dimensions, real-time render size, GPU utilization, screenshot capture pipeline or periodic stalls**. The source scaling policy is an established plausible *primary* system-wide softness source, not proof that texture/material sampling has no role.

## FL4-02 intervention (reversible, measured device-by-device)

Replace the inert resolution field with a real graphics preset persisted as `renderClarity`. Old stored `resolution: "Native"` is **deliberately not interpreted as a newly explicit full-DPR instruction**: because the old control was inert, doing so would silently multiply GPU fill workload for existing users.

| New Graphics preset | Render pixels per CSS pixel | Purpose |
|---|---:|---|
| **Auto** (new default) | **min(DPR, 1.75)** on coarse-pointer/touch devices; **min(DPR, 1.5)** on desktop | Moderate mobile clarity increase with desktop parity and no full-native guarantee |
| **Balanced** | **min(DPR, 1.5)** | Immediate rollback to old render resolution for mobile performance |
| **Sharper** | **min(DPR, 2.0)** | Optional higher-definition mobile presentation |
| **Native** | **DPR** | Exact full physical pixel density, potentially substantially more rendering work |

`hardwareScalingLevel = max(1, DPR / min(DPR, targetDensity))`. This is DPI-aware and never forces supersampling beyond full physical pixels. Diagnostic `?fl4Diagnostics=1&fl4Scale=<number>` A/B overrides remain authoritative even when the user has a saved graphics preset.

**Illustrative coverage:** on DPR3, previous/ Balanced 25%, Auto approximately **34%**, Sharper **44%**, Native **100%** physical pixel count. On DPR2, previous/Balanced 56%, Auto ~77%, Sharper/Native 100%. These are arithmetic outcomes for the stated DPR and CSS area, **not measured current phone pixels or FPS**. The default's fill-rate burden can rise ~36% on high-DPR mobile versus old 1.5px/CSS (1.75² / 1.5²). We intentionally avoid default Native because earlier imported-GLB scenes exhibited very large render costs and the user has observed sporadic freezes.

### Code locations

- `src/game/renderer/render-clarity.ts`: pure preset normalization, density and hardware-scaling calculation.
- `src/ui/menus/settings-state.ts`: persists the new `renderClarity` choice, safely hydrates older settings without interpreting old nonfunctional `resolution` as expensive Native.
- `src/routes/settings.tsx`: Graphics → 3D render clarity.
- `src/game/core/types.ts`: new `render-clarity` command, no changes to original input commands.
- `src/routes/game.tsx`: sends saved clarity choice to runtime after Babylon boot and on subsequent setting hydration.
- `src/game/core/gtd-runtime.ts`: Auto is the safe initial rendering policy; updates Babylon hardware scaling on selected mode and viewport resize while honoring explicit FL-4 test scales.
- `src/test/fl4-mobile-render-clarity.test.ts`: four tests for DPR1 desktop parity, old/current pixel coverage, opt-in Native and invalid settings inputs.

**Protected features:** imported 3D sports/off-road GLBs, selective shadow participation, Voight and physical collision, camera sensitivity and touch controls, accepted stars/day-night lights, geometry and building textures. No decorative scanlines are added back. FPS and texture quality settings remain unchanged; graphics mode is the specifically wired new control.

## User mobile benchmark / acceptance gates

1. On original GTD PWA on actual mobile device, start with **Graphics → 3D render clarity → Auto**, close/reopen if necessary. Use the same camera angle by Voight/the accepted sports car on street, inspect vehicle edges, distant windows, road striping, sharpness while moving and after standing still. Accept only if the whole frame looks clearly improved.
2. If still soft, compare **Sharper**, then **Native** for a short controlled trial. Note potential frame stalls, temperature/throttling, UI touch delay or crashes. Use **Balanced** as a supported emergency rollback to earlier fill work; do NOT label auto Native or promise 60 FPS.
3. Open `/game?fl4Diagnostics=1` with the chosen Graphics preset, wait for both GLB models to appear, choose **Save FL-4 data** and upload JSON when possible. `render.hardwareScalingLevel`, `render.width/height`, `canvas.backingWidth/Height`, `viewport.dpr`, `pixelCoverage.nativeCoveragePercent` and frame/render p50/p95 determine whether actual device resolution and stable frame times improved. Full-screen screenshots alone cannot yield CSS DPR and live render workload.
4. If freezes become recurrent, supply repeatable route/actions and rough duration. Then isolate GLB/network loading, shader warmup, GC, GPU fill pressure and device throttling using **actual captured evidence**, not speculation.
5. If no further user/device confirmation arrives, categorize `FL4-02` as **improvement candidate awaiting verification**, not COMPLETED. FL4-06 mobile and overall acceptance remain conditional.

**Production authorization:** this code is an FL-4 development change; existing explicit approval to deploy to `main` for mobile confirmation should not be construed as licensing/rights clearance for third-party imported models or approval of unrelated game features. Explicitly verify pinned build and the production alias on each release.
