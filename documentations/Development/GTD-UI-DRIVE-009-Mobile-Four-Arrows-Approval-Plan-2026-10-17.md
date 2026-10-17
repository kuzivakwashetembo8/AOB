# UI-DRIVE-009 — Driving-only mobile four-arrow layout

Date: 2026-10-17
State: PLAN ONLY — OWNER APPROVAL REQUIRED. Do not implement in this directive.
Reference: owner-provided Payback 2 controller example; left side steering arrows, right side throttle/reverse arrows.

## User-facing behavior

Add a Settings > Mobile Controls > Driving control layout selection: Existing drag/joystick (default) or Four arrows. While the game snapshot context equals driving and the new preference is selected, show LEFT + RIGHT on the left side of the viewport and UP + DOWN on the right. UP accelerates; DOWN brakes/reverses; LEFT/RIGHT steer. Preserve all driving action buttons including Enter/Exit, pause, and camera look. Walking/flying immediately returns to the unchanged joystick/action UI. Desktop keyboard/gamepad remains operational. Persist only the user interface preference under the existing gtd-interface-settings local storage key. Old stored settings migrate to the current default; game saves are not modified.

## Runtime/input architecture

The React overlay controls only translate pointer intent into existing RuntimeBridge 'move' commands; simulation stays in GTDGameRuntime and stepDriveControl, without a second throttle or steering solver. Use per-direction active pointer identifiers. Aggregate horizontal input as pressedRIGHT minus pressedLEFT, and vertical as pressedDOWN minus pressedUP to match the existing joystick/keyboard sign. For simultaneous UP+LEFT, issue one continuous (-1,-1) intent until either pointer is released. Opposing pressed buttons cancel their axis deterministically. Ensure repeated pointer move is not needed to keep acceleration held.

Use pointer capture, touch-action none, pointerup, pointercancel, lostpointercapture, window blur, page visibilitychange, pause/unmount, and vehicle disembark cleanup. When a pointer is lost, release only its held direction; do not reset other concurrently pressed directions. Each lifecycle termination must explicitly send neutral input when no directional pointer remains. Use a source arbitration policy: keyboard, touch joystick/arrows and physical controller must not cancel one another with a stale neutral source event; choose last-active-source precedence or active-source ownership with a clear, tested takeover policy.

## UI geometry and accessibility

Landscape-first Android/iOS with safe-area insets, notches, translucent HUD overlays, pause/minimap hit areas and mobile browser viewport changes. Minimum touch target 48 CSS px, sufficient diagonal spacing to avoid accidental neighbouring input, adequate visual press feedback, opacity/scale preference integration, high-contrast accessibility labels, optional existing haptics, and reduced-motion adherence. Honor handedness only through an owner-approved layout rule: default placement is fixed LEFT steering / RIGHT acceleration; any mirror option must preserve predictable intent. Do not capture camera swipe pointer events outside controls; while holding accelerate, a second touch can drag the camera.

## Integration path

1. settings-state.ts: validated 'drag' or 'arrows' drivingTouchLayout setting with backwards-compatible default.
2. settings-editor.tsx: add a clearly labelled selector and short explanation in Mobile Controls.
3. game.tsx: select rendering from snapshot.context, current preference, paused state and input mode.
4. touch-controls.tsx and styles.css: accessible two-cluster layout, independent multi-touch hold and cleanup, no per-frame React setState.
5. Bridge/runtime: confirm input-source aggregation and prioritization; minimally patch source arbitration if needed.
6. Tests: two-finger diagonals, opposite directions, dropped pointer, blur, exit while holding accelerator, pause/resume, saved setting migration, keyboard/touch simultaneous arbitration, walk/drive context changes, mobile layout screenshots.
7. Device acceptance: verify low/high frame-rate phones, UI at 80–120% scale, forward and reverse, steering confidence and camera while driving.

## Failure modes and approval

Stuck throttle from missed release is safety/UX critical; stale source updates may cancel an active held direction; controls can overlap screen cutouts or vehicle exit. Guard by explicit per-pointer ownership and lifecycle cleanup. Provide before/after UI schematics and real-device landscape validation before requesting approval. No code/UI changes in this directive. Implementation requires explicit owner approval.
