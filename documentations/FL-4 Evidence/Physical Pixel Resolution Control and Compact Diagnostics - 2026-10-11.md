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
