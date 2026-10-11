# FL-4 / GTD-PERF-001 — Physical-pixel graphics settings and compact diagnostics

**Date:** 2026-10-11
**Status:** Direct-to-`main` implementation authorized by user, build and device verification required.
**Reference release:** `7157ec415d9d49052da220b218b14c2d9b329446` / `dpl_9oZubtJR9i53wpHQ5GkN1LZMAjwT`.
**Related evidence:** `FL-4 Real Mobile Native and Supernative Diagnostic Comparison - 2026-10-11.md` on `review/fl4-one-hour-closure-2026-10-11`.

## User requirements and evidence

- Provide graphics-resolution tuning **to all gamers**, not only developers. Make physical native **100%** reachable so the actual phone may be tested; provide a bounded optional supersampling tier for comparison, with safe reversal. Do not equate 100% physical pixels to 1080p/4K artwork or 100% objective quality.
- Preserve accepted Auto default and legacy modes rather than silently forcing far more pixel work on return users.
- Both user Android JSON exports identify `devicePixelRatio=1.875`; the nominal Native case used scale `1.0` and drew `819×384` vs `1536×720` physical expected; the nominal Supernative used `0.8` and drew `1066×480` vs `1600×720` physical expected. These were misnamed tests. Actual one-to-one physical backing density requires approximately `1 / devicePixelRatio` Babylon hardware scale (manual mode) when viewport canvas is CSS-sized.
- The diagnostic save button visibly stretches the full landscape viewport as a central narrow rectangle on mobile standalone. Source: `mountFL4EvidenceExport` appends its button directly to `document.body`, while `src/styles.css` includes `html[data-display="standalone"] body > * { height: 100%; ... }`. Positioning did not override its inherited full-height CSS layout. Attach button *inside* the existing game viewport and explicitly constrain its dimensions.
- Older reports include very uneven sampling (Native 8 frames, Supernative 479). No matched warm-run performance claim. Higher pixel load can increase GPU work and cause frame-time spikes; reset/fallback should remain available.

## Change design

1. Correct manual Babylon engine hardware scaling: use a manual scaling policy rather than combining an implicit adapt-to-device ratio with individually set hardware-scale values. For `Native` choose `1 / devicePixelRatio` and `Custom 100%` the same. A `Custom` slider exposed in **Settings → Graphics** offers 50–125% *per dimension* relative to actual CSS×DPR pixels in 5% steps. `125%` is experimental supersampling with 56.25% more pixels than the 100% reference if not resource-capped. Preserve existing `Auto / Balanced / Sharper` scaling for users who do not opt in. Do not silently change player settings on launch.
2. Persist `renderScalePercent` in existing settings storage, sanitize legacy/invalid values, extend `render-clarity` bridge command to carry the chosen percent, and apply the choice on runtime boot/hydration and browser resize. Changing the slider explicitly selects `Custom`; named presets remain independent.
3. Recalibrate diagnostics `fl4QualityTrial=native|supernative` to 100%/125% physical density on this observed Babylon/Chrome mode, and allow valid scale overrides in the physical range. Exported `canvas.backingWidth`, `render.width`, and `pixelCoverage.nativeCoveragePercent` remain the ground truth; **100% is a target pending actual phone verification**.
4. Restrict extreme framebuffer growth with a fixed render-target pixel/axis budget; document any resource-capped result rather than claim native perfection. Do not change GLB loading, world warm-up, game camera, physics, simulation, and character art.
5. Mount an unobtrusive compact diagnostic button within `.game-viewport` with explicit 32px height/maximum width (no full-height body child). Its label changes to `Saved` after export; exports remain click-initiated, local-only, and unchanged in schema.
6. Test saved-setting compatibility, the slider-to-bridge contract, DPR1 and DPR1.875 native resolution math, 125% supersampling and resource cap, diagnostics override priority, and export styling/placement. Run strict TypeScript, complete tests, and build before deployment.

**Approval boundary:** User requested direct `main`; no alternate feature branch or broad FL-4 re-opening. Production remains an intentional deployment only, separately verified after code validation. Display/render fidelity, FPS and device warmth are not inferred from build success.


## Implementation and verification (11 October 2026)

**Direct-to-main application commit:** `1109e6be521c9bbf05502f63eedfee5409893b26`; no feature branch or PR. The implemented files are `src/game/renderer/render-clarity.ts`, `src/game/core/gtd-runtime.ts`, `src/game/debug/fl4-quality-trial.ts`, `src/game/core/types.ts`, `src/ui/menus/settings-state.ts`, `src/routes/settings.tsx`, `src/routes/game.tsx`, `src/game/debug/fl4-evidence-export.ts`, and regression tests.

**Strict verification:** Vercel preview `dpl_7mVSb7Sp9NtbCkXWPBuj5xdrmnWk`, READY, exact app SHA `1109e6be521c9bbf05502f63eedfee5409893b26`. Full chained `npx tsc --noEmit && npm run test && npm run build` **PASSED**: **107/107 tests across 25 test files**, production-mode Vite/Nitro build complete. Preview HTTP `200` at `https://gtd-196035xvx-interlinkglobaltech.vercel.app/game`. Earlier check failed strict optional TS types for CSS dimensions; this was fixed before the final successful run. No observed on-device graphic/thermal results from the corrected code are available yet.

**Physical scaling model:** Babylon engine now uses `adaptToDeviceRatio=false` for deterministic manual scaling; `Native` and `Custom 100%` request `hardwareScalingLevel=1/DPR`, not `1`. `Custom` slider ranges `50%–125%` in 5-point steps; **Auto remains unchanged** as a safe default to preserve existing accepted player rendering workloads. Rendering is capped to **4096 pixels per axis and 6 million total framebuffer pixels**, so any resource-limited device may achieve less than its requested native/supersampled target. Real render buffers in the FL-4 evidence export must verify the result. New diagnostics `native`/`supernative` targets are 100%/125% physical by calculation; not yet validated by actual Android captures.

**Mobile export UI root cause corrected:** PWA CSS rule `html[data-display="standalone"] body > * { height: 100%; ... }` previously stretched a diagnostic button appended directly to `document.body` to the entire screen height. Now it is mounted within the existing `.game-viewport` and explicitly styled `height: 32px; max-height: 32px; max-width: 170px`. Dedicated DOM regression test verifies it is not a direct `body` child. Production PWA has **not** yet been updated by this work.

**QA next steps:** Test the preview in mobile landscape with **Settings → Graphics → 3D render clarity → Native** or move the **Physical display resolution** slider to **100%** (selecting Custom), apply settings, then open/re-enter game with `?fl4Diagnostics=1` and save JSON. Expected on earlier reported DPR1.875 and 819.2×384 CSS canvas is approximately **1536×720 physical render pixels**, **provided engine sizing matches math and render safety caps do not bind**; this is an expectation, not a measured success. Optional `125%` target approximately 1920×900 for the same CSS canvas, up to caps. Compare p50/p95/long-stall counts and visible responsiveness, not screenshots alone. Export button should remain compact. Start with Auto for rollback if needed.

**Release discipline:** The verified artifact is a **preview deployment** (Vercel `target=null`), not public production. The existing production alias remains `dpl_9oZubtJR9i53wpHQ5GkN1LZMAjwT` at app SHA `7157ec415d9d49052da220b218b14c2d9b329446`; do not report a production update. Explicitly request/obtain intentional production deployment authorization separately. User asked direct-to-main code writes, not an unrelated automatic production push.
