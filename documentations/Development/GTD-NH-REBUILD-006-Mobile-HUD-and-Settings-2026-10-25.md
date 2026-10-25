# GTD-NH-REBUILD-006 — Mobile viewport and South Ward settings parity

Date: 2026-10-25
Branch: `trial/north-heights-reconstruction-001` ONLY.
Authority: user screenshot of NH-005 showing full-width metadata HUD and crowded mobile navigation; request: "Can't view properly on mobile. Contract [compact] metadata element. Include accepted controls & settings from South Ward e.g. quality settings."

## Change contract

- **One-line, collapsible metadata:** A small NORTH HEIGHTS · 006 info chip replaces the permanent HUD. Detailed load results, FPS, position, controls and licence acknowledgments appear only after tapping it. Loading and errors get a small temporary status toast; readiness clears the toast.
- **Short mobile navigation:** Compact sky, WALK/FLY, reset, settings and world actions. Buttons stay at top; no full-width top metadata slab covering tower or character.
- **South Ward mobile controls:** Reuse the exact `Joystick` from `src/ui/hud/touch-controls.tsx` with accepted GTD joystick size, opacity, scale, handedness, position and haptics; context-specific Jump/Run or Up/Down/Boost only, rather than obsolete combat/driving buttons. Arrows/WASD still work on keyboard. Optional desktop on-screen arrows honor `desktopControls`.
- **Shared GTD settings:** Embed `SettingsEditor` from existing in-session game settings. Import/save with `useSettings`, same `gtd-interface-settings` localStorage key as /game and /settings. Do NOT build a separate setting registry.
- **Settings action semantics:** quality preset (Low/Medium/High/Ultra) actually changes hardware render scale; `renderClarity` and `renderScalePercent` go through canonical `renderHardwareScale` including DPR and memory caps. FPS cap limits rendered frames; mouse/touch sensitivity and invert-Y affect camera; touch UI size/opacity/position/handedness and desktop-control toggles apply. Settings pause preview without tearing down Babylon or losing Voight's place. Existing unsupported options (e.g. driving layout, audio, foot IK debug) remain shared preferences, with an explicit note that their dependent systems are not present in this trial.
- **Performance:** Preserve existing South Ward world and /game code. Paused settings do not step physics. No duplication of character, vehicles or exported GLBs. NH-005 glass, road, Rapier and trees remain unchanged.
- **Accessibility:** Diagnostics chip exposes `aria-expanded`; settings uses dialog semantics and an Escape/close control. Buttons have accessible names and 32–48px touch targets.
- **Verification:** test quality scaling monotonicity, FPS limits and shared control preference styling; check desktop/mobile preview route and old main SHA unchanged. A passing build alone does NOT establish real-device layout fidelity or performance.

## Mobile visual acceptance gate

In landscape smartphone viewport, the city (including Voight) must remain visible behind only a single slim row of top actions plus joystick and contextual action buttons. Metadata should only occupy a significant area when explicitly expanded. Graphics settings should be selectable, scrollable and applicable without forcing a reload, restarting progress or navigating away. Test quality setting visually by comparing render sharpness/performance on the same device.

No production merge/deployment authorized.
