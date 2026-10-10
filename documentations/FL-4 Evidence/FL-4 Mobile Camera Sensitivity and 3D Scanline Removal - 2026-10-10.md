# FL-4 mobile — touch-camera sensitivity and removal of game-world scanlines

**Date:** 2026-10-10  
**Change:** User-provided Android landscape screenshots show an accepted red sports car and working on-screen left joystick/action controls, but (1) camera turning requires multiple slow long swipes, unsuitable during pursuit; (2) fine horizontal lines visually obscure road, sky, buildings and vehicles.  
**Status:** IMPLEMENTED ON `fix/fl4-mobile-touch-sensitivity-and-banding`; browser/device acceptance pending.  
**Base:** `main` `384fd41289cceecce695b8cf7f13abad25839f14`.  
**Pinned candidate app SHA:** `fa76cf12b3ddcb8f0444de8676c5cca2b5b85e40` (before documentation append).  
**Deployment, tests, main promotion:** pending confirmation in the closeout record.

## Evidence-led diagnosis

- Existing `src/game/core/gtd-runtime.ts` applied a hardcoded camera alpha movement `-0.002 rad / touch CSS pixel`, beta `+0.0016 rad / CSS pixel`, regardless of settings. A full 360° rotation required about **3142 total CSS pixels of horizontal finger travel**; on a typical landscape phone this demands repeated drags and produces the user-observed slow response.
- GTD already had a `sensitivity` slider in the Controls settings, but it was unused by the camera mouse input. A separate mobile slider is more appropriate for touch ergonomics.
- `Scene({game:true})` rendered the menu's decorative `scene-grid` overlay, a `repeating-linear-gradient(0deg, transparent, transparent 3px, background 4px)`. In `src/styles.css`, `.scene-grid` is positioned at z-index **-1**, while the Babylon `.canvas-host` is at **-2**. Within the isolated shell stacking context, this translucent 4px stripe **overlays** the 3D world. The repeated lines in the screenshots match this implementation and are not evidence of actual sky shader/dithering, texture UV errors or mobile GPU artifact.
- The menu/grid styling is intentionally retained on the landing/settings screens; the 3D game receives no `scene-grid` element. The scene's accepted day/night lighting, sky and imported model textures are unchanged.

## Implemented camera control

- `src/ui/menus/settings-state.ts`: add persisted `touchSensitivity`, **default 60**. Existing local settings hydrate against `defaults` so prior installations have a valid value.
- `src/routes/settings.tsx`: Mobile Controls category presents a **Touch camera sensitivity 10–100** slider and **Invert vertical camera swipe** toggle. Controls category correctly identifies **Mouse look sensitivity**, so desktop and mobile adjustment are separate.
- `src/game/input/touch-camera-sensitivity.ts`: map touch slider to radians per CSS pixel as `0.0015 + 0.00011 * clamp(sensitivity,10,100)`. At default 60 this is **0.0081 rad/px**, **~4.05× faster** than the prior fixed 0.002. A 350px swipe rotates ~**162.4°** versus ~40.1° previously. At min10 max100 it spans 0.0026–0.0125 rad/px. Beta gain is 75% of alpha and may invert Y.
- `src/game/core/types.ts` and `gtd-runtime.ts`: new `camera-settings` command receives current touch sensitivity and invert Y; the runtime applies the configured multiplier to each one-time `look-delta` while preserving fixed-update semantics. The camera remains pitch-clamped to the existing safe range, and finger lift/interrupt cannot create infinite rotation.
- `src/routes/game.tsx`: send `camera-settings` when runtime is loaded or settings change; also connect the preexisting desktop mouse sensitivity slider to mouse input without changing its default look rate.

**Scope boundary:** No change to Voight's movement velocity, hitboxes, controller action layout, approved vehicle models/calibration, world scale, buildings, time-of-day lighting, or existing procedural-generation rules. This is a UI input/shader-overlay finish change. Touch two-finger control ownership is preserved from PR #6.

## Automated and mobile acceptance

New `src/test/mobile-camera-sensitivity-and-banding.test.tsx` asserts slider bounds/default and safe normalization, adjustable rapid alpha, vertical inversion, and `<Scene game />` omission of the menu grid while ordinary `<Scene />` retains it. Existing `mobile-touch-camera.test.ts` continues to cover two-finger pointer ownership, gesture release and cancellation.

**Full automated gate:** `npx tsc --noEmit && npm run test && npm run build`; promote only after a pinned READY preview and successful chain.

**Physical-device pass:** open the updated GTD landscape PWA; orbit both directions using a single ~quarter/half-screen swipe; tune sensitivity in Settings > Mobile Controls (increase for rapid turning, decrease for precision), activate invert Y if desired, and retest after reopening the PWA. Ensure no horizontal scanlines over the road/sky/buildings; confirm actual textures remain and night lighting was not removed. Run with move joystick held while turning by finger, pause/reenter garage, verify stable camera on release and that the accepted red sports car/buggy still render. If *other* horizontal banding persists with decorative grid disabled, collect a screenshot and isolate actual renderer/sky/texture artifacts before further changes.

**Milestone/legal:** FL-4 final mobile acceptance remains subject to user observation; no automated test can certify perceptual rendering or sports-car redistribution licensing.
