# GTD game input

Input is dispatched through the `GameCommand` interface and the runtime bridge; the renderer retains camera ownership.

## Mobile landscape camera — touch-drag

The second (right-hand) camera joystick has been retired for FL-4 mobile acceptance. On touch devices, drag a finger on the **unobstructed 3D game canvas** to orbit the third-person camera, like desktop mouse-look. A finger on the **left movement joystick** or an action/HUD button remains owned by that control; a second independent finger can simultaneously orbit on the game world.

Implementation: `touch-camera-drag.ts` registers native pointer events on the canvas and claims only its first active touch pointer. It sends one-time pixel deltas as `GameCommand {type:"look-delta"}`; the runtime consumes those values once on the next fixed update, so low FPS cannot convert one gesture into a constantly held camera velocity. Single-pointer ownership, pointer capture, OS cancellation, loss of capture, blur and unmount cleanly clear the drag. The game canvas has `touch-action:none` to suppress accidental page pans.

The existing desktop pointer-lock/mouse-look remains unchanged, and touch events must never acquire desktop pointer lock. The left joystick and action controls remain present and fully functional.

**Mobile acceptance:** on the real device, test horizontal/vertical orbit on a clear canvas region, simultaneous movement plus camera drag with two fingers, jump/sprint while looking, releasing the screen (no drift), pause/resume (no accumulated rotation), garage obstruction behavior, touch action/HUD targeting and landscape PWA no-page-scroll. The automated `src/test/mobile-touch-camera.test.ts` checks event ownership, cancellation, reset and cleanup; it does not substitute for physical-device visual approval.

Any future asset/gameplay changes must preserve the interaction boundary: canvas gesture = camera; left joystick = movement; HUD controls = actions.
