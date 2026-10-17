# UI-DRIVE-009 — Driving-only mobile four-arrow layout

Date: 2026-10-17
State: APPROVED FOR IMPLEMENTATION — IMPLEMENTED ON ISOLATED REVIEW BRANCH. Preview/device acceptance pending; main and production unchanged.
Reference: owner-provided Payback 2 controller example; left side steering arrows, right side throttle/reverse arrows.

## User-facing behavior

Add a Settings > Mobile Controls > Driving control layout selection: Existing drag/joystick (default) or Four arrows. While the game snapshot context equals driving and the new preference is selected, show LEFT + RIGHT on the left side of the viewport and UP + DOWN on the right. UP accelerates; DOWN brakes/reverses; LEFT/RIGHT steer. Preserve all driving action buttons including Enter/Exit, pause, and camera look. Walking/flying immediately returns to the unchanged joystick/action UI. Desktop keyboard/gamepad remains operational. Persist only the user interface preference under the existing gtd-interface-settings local storage key. Old stored settings migrate to the current default; game saves are not modified.

## Steering feel — owner clarification (2026-10-17; SPECIFICATION ONLY)

**Non-negotiable:** The arrows are an ADDITIONAL, OPTIONAL driving control layout in Settings, **not** a replacement for the existing drag/joystick mode. The current drag/joystick behavior stays available, remains the default, and must not be modified by this proposal.

**Digital touch controls must produce analogue-like, time-dependent wheel steering**, as in the owner's Payback 2 example:

| Player action | Required visual and physical outcome |
| --- | --- |
| Brief left tap | Front wheels steer a small amount left for the duration of the press; if moving, the car undergoes a correspondingly modest left heading change. |
| Brief right tap | Mirror of the brief left tap. |
| Continued left hold | Front-wheel angle progressively grows toward bounded full left steering lock; while moving, the car commits to a sustained sharper left turn. |
| Continued right hold | Mirror of the continued left hold. |
| Release either arrow | Steering target immediately returns to **zero relative to the vehicle's current forward axis**, while the actual front wheel angle smoothly recenters according to the steering response. **Do not rotate the chassis back to its old heading**, snap the wheel mesh, auto-complete a fixed turn, or reset world yaw. |
| Hold UP + LEFT/RIGHT | Acceleration continues independently while the steering angle ramps. Lifting one finger changes only its own input, leaving the other held input uninterrupted. |

**Mechanism:** Buttons express held steering intent (-1, 0, +1), *not* a discrete fixed-angle turn command and not an instant full-lock wheel orientation. `stepDriveControl` already ramps actual `steeringRadians` toward a bounded target and back toward zero on release. The driven car's yaw derives from current forward/reverse speed and steering angle; its trajectory changes progressively, and a wheel recentered after a left turn points along the **new** vehicle heading. With no speed there is wheel steering but no chassis yaw; releasing to zero then restores wheels relative to that same current heading. The existing Ferrari/Range Rover model-specific pivot adapters must not invert this directional contract.

**Tuning is explicitly unresolved and requires owner approval before implementation.** The *current* drivetrain has `maxSteerRadians: 0.5` and `steeringResponseRadiansPerSecond: 2.8` (approximately 0.18 seconds to move from centered to maximum under uninterrupted full input). Consequently, do **not** promise that an arbitrary 100 ms tap is always imperceptibly small, or that a 500 ms hold is needed for full lock: evaluate the actual feel on desktop/mobile. The proposed arrows may need a vehicle-class/profile-aware steering-response curve or limited initial ramp, but this must be shared/compatible with existing driving logic and must **not** silently change the accepted drag mode. No press-duration threshold, fixed tap angle, extra yaw impulse or hardcoded per-car sign is authorized by this plan.

**Acceptance tests to add only after approval:** With matched initial speed, compare a short tap versus a longer hold (record actual steering-angle and heading delta; shorter must be less); verify both directions, centered wheel after release, preserved final chassis heading, stationary wheel-toe change with zero chassis yaw, reverse-steering consistency, hold UP+LEFT multi-touch, mid-turn release and recenter, and parity across Range Rover/Ferrari/new GLBs. Validate actual mobile-device input latency and continuous-frame behavior before choosing response time or curves. Never declare control feel validated from NullEngine tests alone.

**Historical review gate (superseded):** the owner initially withheld approval while these tap-versus-hold requirements were clarified. The owner subsequently explicitly approved implementation of both UI-DRIVE-009 and REL-010 on 2026-10-17. This paragraph records the sequence; it is not a current prohibition.

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
6. Tests: brief-tap versus extended-hold steering-angle and heading response (both directions), smooth recenter to current heading, no heading reset, stationary toe movement, reverse steering, two-finger diagonals, opposite directions, dropped pointer, blur, exit while holding accelerator, pause/resume, saved setting migration, keyboard/touch simultaneous arbitration, walk/drive context changes, mobile layout screenshots.
7. Device acceptance: verify low/high frame-rate phones, UI at 80–120% scale, forward and reverse, steering confidence and camera while driving.

## Failure modes and approval

Stuck throttle from missed release is safety/UX critical; stale source updates may cancel an active held direction; controls can overlap screen cutouts or vehicle exit. Guard by explicit per-pointer ownership and lifecycle cleanup. Provide before/after UI schematics and real-device landscape validation before requesting approval. No code/UI changes in this directive. Implementation requires explicit owner approval.

## Implementation handoff (authorized 2026-10-17)

- `settings-state.ts`: optional `drivingTouchLayout` with strict normalization; old saved settings default to drag.
- `settings-editor.tsx`: driving layout selector under Mobile Controls.
- `driving-arrow-holds.ts`: per-pointer independent left/right/up/down aggregation, with cancellation.
- `touch-controls.tsx`: real pointer-hold arrows only in driving context, on-blur/lostcapture/unmount cleanup. Existing joystick has equivalent cleanup; camera remains separately touch-draggable.
- `movement-input-arbiter.ts`: runtime input-source ownership prevents a stale keyboard or unrelated touch release from cancelling held driving arrows; diagonals keep both input axes at full intensity.
- `drive-kinematics.ts`, `first-drive-trial.ts`, `gtd-runtime.ts`: arrow-only 1.2 radians/second progressive steering (approx 0.42 s to full lock), with smooth recentering relative to CURRENT chassis heading. Existing drag/keyboard controller retains 2.8 radians/second. Same wheels/physics/actor reused for any drivable vehicle.
- CSS places left steering and right throttle/brake above safe-area insets, with separate accessible hit targets and the original action buttons retained.
- `src/test/driving-arrow-controls.test.tsx` covers setting, dual-pointer diagonal hold, pointer cancellation, input arbitration, tap/hold response and recenter.

**Acceptance still needed:** owner approves actual Android landscape layout/feel, including short taps, sustained turns, forward/reverse, switching drag/arrows, focus losses, camera swipes and Ferrari/Range Rover parity. Automated tests are not equivalent to a real-device touch trial. Do not merge/deploy production before release authorization.
