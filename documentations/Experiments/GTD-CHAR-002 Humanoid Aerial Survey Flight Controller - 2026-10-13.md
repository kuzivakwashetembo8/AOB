# GTD-CHAR-002 — Humanoid Aerial Survey / Flight Controller

**Date:** 2026-10-13 | **Status:** implementation preview; owner QA pending.

**Objective:** temporarily permit the existing Quaternius UAL humanoid to fly above
Meridian City for visual world inspection while the image material families are reviewed.
This is a **development camera-survey movement ability**, not Voight's narrative
identity or permanent combat/physics design. No changes to GLB source assets,
city geometry, building materials, street vehicles or main deployment.

**Reference:** [interlinkglobal/three-player-controller](https://github.com/interlinkglobal/three-player-controller)
at pinned commit `ca82bbc76a3b9b0afa80c73b60167adf6123b9b6`,
`src/systems/InputSystem.ts`, `CharacterMovement.ts`,
`AnimationSystem.ts` and `example/footIK.js`.
The fork uses Three.js and its own collision engine; **GTD is Babylon.js + Rapier**.
We adapt its behaviour, not its control code or imported dependency.
The fork includes flying animation/idle/hover inputs for the UAL character.

## Operator controls

- `G` toggles flying while walking/on foot. `F` remains Ferrari enter/exit.
- `WASD` / arrow keys / joystick remain camera-relative horizontal movement.
- Hold `Space` (Jump) to ascend; hold `Ctrl` (Descend) to descend.
- `Shift` doubles as walking sprint / accelerated flight (7.5 to 12 m/s).
- Flight sticks in hover when no directional input; gravity pauses **only**
  while flying, resumes upon toggle-off. Space is held only for the time pressed.
- Touch & desktop HUD receive visible **Fly** and **Descend** actions,
  preserving left joystick, touch-camera swipe and existing vehicle HUD.
- Limit ascent to 145m above South Ward's origin for bounded visual surveys.

## Physics and animation policy

- Rapier's **existing kinematic capsule character controller** computes every
  flight translation including upwards and downwards motion. No direct position
  teleport, disable-collision/noclip or duplicate physics step.
- A request to fly when driving is ignored. Vehicle entry during flight is blocked;
  toggle flight off first. Exiting flight mid-air resumes gravity and usual
  grounded/curb-step locomotion.
- Camera remains the Babylon `ArcRotateCamera`; only follow radius expands in
  flight. Normal ground camera-distance selection resumes after landing.
- Existing loaded UAL animation groups select `flyIdle` / `fly` / directional
  `flyUp` / `flyDown` where available, otherwise idle fallback. Existing
  blending and gait continuity stay in place for walking.

## Verification / release gate

Unit test hover, toggle policy, ascend/descend, speed cap, finite deltas and
altitude ceiling; run full test suite/build; deploy preview from this branch.
Verify elevated camera panoramas, aerial collision against real rooftops,
flight and jump/vehicle control separation, keyboard and mobile PWA touch,
pause/resume, and reentry into walk mode. This is not accepted or merged to
production until explicit owner confirmation.
