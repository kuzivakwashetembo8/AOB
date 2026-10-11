# GTD-UX-001 — In-session Settings and Active Runtime Continuity

**Date:** 2026-10-11 (Africa/Johannesburg, UTC+02:00).  
**Status:** **IMPLEMENTED ON `main` / VERIFIED VERCEL PREVIEW; ANDROID EXPERIENCE REVIEW AND INTENTIONAL PRODUCTION RELEASE PENDING**.  
**Successor to:** FL-4, explicitly closed by user on 2026-10-11 at approximately 10:54 SAST.  
**Intent:** Opening settings while a player is in-session must **not** end the current Babylon gameplay session. This request does not add persisted save games, cross-route world retention, background tasks or any new durable world-state model.

## Pre-change failure mechanism

The `/game` pause menu linked to `/settings`. React Router unmounted `GamePage`, whose cleanup called `bridge.destroy()` and `GTDGameRuntime.destroy()`. Returning to `/game` created a fresh canvas, engine, Rapier world and vehicle-GLB loader and restarted all eight loading checkpoints. This is correct teardown for deliberately exiting gameplay, but **not** for editing graphics while paused.

## Implemented scope and contract

- A shared `SettingsEditor` holds the same Graphics, Audio, Controls, Accessibility, Interface and Mobile Controls fields used by the standalone `/settings` route, so gameplay does not fork an incompatible settings schema.
- `GamePage` now includes `panel="settings"` alongside pause/objectives/save. The Pause menu's Settings action **changes only this panel state**, not the route. The canvas, runtime bridge, Babylon scene, physics, imported car meshes and Voight's transform remain mounted.
- **Apply & Resume** stores existing settings in `gtd-interface-settings`, sends updated physical-resolution graphics fields through the existing `render-clarity` bridge effect and resumes the **same** runtime instance. User may exit the panel without applying.
- The shared editor receives persisted settings after asynchronous `useSettings()` hydration, preventing the standalone settings page from reverting to defaults when extracted into a reusable component.
- The in-game modal has width and viewport-height constraints and scrollable content for landscape handsets. Ordinary `/settings` navigation from main menu remains available.
- This does not claim unrelated quality preset / FPS / shadow settings suddenly control new engine internals; those old options retain their prior behavior. Verified live runtime graphics changes are specifically `renderClarity` and `renderScalePercent`.

**Source changes:** `src/routes/game.tsx`, `src/routes/settings.tsx`, `src/ui/menus/settings-editor.tsx`, `src/styles.css`.  
**Regression test:** `src/test/in-game-settings-continuity.test.tsx` verifies a real settings-editor UI change to Custom 125% reaches Apply & Resume and the `RuntimeBridge` can pause, issue the graphics command and resume **without calling destroy**.

## FL-4 export overlay root cause confirmed

The opt-in `Save FL-4 data` control originally appended directly to `document.body`. Standalone shell CSS applies `height:100%` to direct `body > *`, expanding the button vertically over the landscape viewport. On `main`, `src/game/debug/fl4-evidence-export.ts` now mounts the button inside the existing `.game-viewport`, with explicit `height`/`maxHeight=32px` and `maxWidth=170px`. Regression `src/test/fl4-export-mobile-layout.test.ts` confirms the placement and size. This is a **source-level fix and DOM contract**, not yet an independently captured Android post-release screenshot.

The reporter saw the old overlay on the **public production release**. As of this review, `grand-theft-division.vercel.app` is still on Vercel `dpl_9oZubtJR9i53wpHQ5GkN1LZMAjwT` / app `7157ec415d9d49052da220b218b14c2d9b329446` — the older version without the changed export button. Therefore **the UI on the old production build is expected to remain incorrect**, with PWA caching a possible *additional* stale-asset factor but not the demonstrated primary version discrepancy. Do not describe the fix as already shipped publicly.

## Build and release ledger

- **Verified application main commit:** `522204d0273810d9f39d1b2f24964d5d141dd9f7` (includes FL-4 formal closeout docs and GTD-UX-001 code).
- **Vercel preview:** `dpl_Gour491LLW6pvmfguDDEPQmKZiRY`, READY, `https://gtd-c07cme29b-interlinkglobaltech.vercel.app/game`, HTTP 200.
- **Validation:** `npx tsc --noEmit && npm run test && npm run build` PASSED. **109/109 tests in 26 files passed**, including new settings-continuity and export-button layout assertions; client/Nitro production-mode build completed.
- **Production:** intentionally not redeployed in this task without a distinct release instruction. `main` may be ahead of the production alias. Existing purposeful Git-build skipping remains the normal policy.

## User acceptance / follow-up

A single real-phone session test after an authorized release or from the preview: open `/game`, walk to a recognizable spot, pause → Settings → Graphics → Custom (e.g., 100%) → Apply & Resume. Confirm the avatar stays at the same spot with the same cars/world, **without the startup loading checklist**; pause again and repeat 125%, optionally changing back to Auto. With `?fl4Diagnostics=1`, confirm the Save FL-4 data control stays compact and clickable at the top, with no full-screen vertical obstruction. Test returning from Settings without applying, and ensure ordinary Return to Main Menu still tears down gameplay correctly.

A test build does not independently establish device touch ergonomics, actual FPS/thermal performance, full 100% physical-resolution coverage, or production PWA cache invalidation. Those outcomes require actual phone evidence. The FL-4 milestone itself stays **CLOSED**; graphics calibration is `GTD-PERF-001` and settings UX is `GTD-UX-001`.
