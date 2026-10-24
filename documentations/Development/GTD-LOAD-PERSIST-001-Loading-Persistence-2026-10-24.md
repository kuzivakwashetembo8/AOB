# GTD-LOAD-PERSIST-001 — Loading Persistence

Date: 2026-10-24
Branch: loading-persistence
Base: 15eac86fafc4d4d22bff033c8f94f4020fae5390

## Directive
Once a game is loaded, preserve the live session when the player switches tabs/apps, opens GTD menus or the map, or accidentally uses browser Back within GTD. Returning must offer Resume without importing the world again. Intentional pause and automatic pause must retain the same player, vehicle, camera, physics and world state.

## Findings before implementation
- GamePage owns the runtime and canvas; its effect cleanup destroys the bridge and engine on route exit.
- LandscapeBoundary keys its entire child subtree by pathname, forcing remounts on every GTD route change.
- Window blur only releases keyboard input; no visibility/page lifecycle handler pauses simulation.
- Pause cancels the simulation frame, but does not clear every movement/action source at the engine boundary.
- The runtime save directory is a placeholder, not a connected game save system.

## Implementation plan
1. Move the game surface into a lazily mounted session host owned by the root. Mount only on the first /game visit and retain its exact canvas/runtime for subsequent GTD navigation. Remove pathname-based root remounting.
2. On blur, hidden, pagehide or freeze, pause synchronously and latch the pause menu. Route exits also pause. Return never resumes without an explicit Resume action.
3. Freeze scene animation and reset all input sources when pausing. Reset the timing baseline on resume; do not advance the world for elapsed background time.
4. Guard keyboard, mouse and touch handlers while the session is inactive. Loading may settle in the background, but must become paused before its first simulation frame.
5. Add behavioral regressions for session retention, hidden-during-bootstrap, lifecycle events, input release, and deliberate resume.

## Boundary
This is persistence of a living document, including browser back/forward cache restoration. A hard reload, navigating to an external document without back/forward caching, tab closure, OS process termination or browser tab discard destroys JavaScript/WebGL memory. A browser must reconstruct assets after those events. Exact durable recovery requires a versioned runtime save system covering all simulation state; no claim that a RAM-only pause prevents browser eviction will be made.

## Validation gate
Run lifecycle/retention regressions plus existing bridge/input tests. Record actual results here. No merge or deployment is authorized by this branch request; preview remains an intentional later milestone.


## Implementation completed
- `src/game/bridge/persistent-game-session.tsx` owns a lazy game surface under the stable root, retaining one canvas and runtime across menu/map/settings navigation.
- `src/ui/game-session.tsx` contains the existing game surface. `/game` remains the typed public route and supplies metadata; its persistent surface is rendered by the root.
- `use-session-pause.ts` latches automatic and manual pauses. Lifecycle handlers pause immediately, without waiting for a React effect. Returning never auto-resumes. Hidden/bootstrap completion transitions directly from ready to paused.
- The engine clears every held input channel and stops animation/simulation on pause. Resume resets both the fixed-step timing baseline and Babylon 9.29.0's exposed internal animation timestamp. The latter prevents the first resumed animation tick from consuming background wall time.
- Inactive sessions do not handle gameplay keyboard/mouse/touch input or trap focus. The session rereads device interface preferences when returning from standalone Settings and reapplies display sizing after the canvas becomes visible.
- Back/forward cache pagehide preserves the startup observation rather than recording a false aborted load.

## Verification completed
- 24 tests passed across seven suites: loading persistence integration, engine pause/resume, runtime bridge, in-game settings continuity, mobile touch camera, application routing, and deployed version decisions.
- The integration tests render the actual retained game surface and RuntimeBridge with a fake asset/runtime bootstrap. They prove one bootstrap/version check/canvas/runtime across repeated route exits, explicit Resume after hidden/blur/pagehide/freeze, loading interrupted by route/tab exit, inactive keyboard isolation, intentional pause retention, preference refresh, and destruction only when the host unmounts.
- Engine tests use the actual GTDGameRuntime and Babylon NullEngine. They verify frame cancellation, all input sources cleared, late input ignored, ready-to-paused before the first scheduled frame, idempotent resume, and zero animation wall-time catch-up.
- TypeScript `tsc --noEmit` passed for the full source tree.
- React review: root/session identities stable; runtime bundle lazy; no global mutable session singleton; all lifecycle/input subscriptions cleaned up; hidden pause dialogs do not capture focus; runtime remains behind RuntimeBridge.
- No deployment, mobile-device visual test or real browser discard recovery test was performed. Physical device acceptance remains pending. Asset loading and WebGL performance were not measured by these tests.

## Acceptance checklist
1. Load `/game`, move Voight and rotate the camera. Switch tabs/apps for at least 30 seconds. Return: the same world is paused, loading does not restart, and Resume continues from that position/view.
2. Repeat while driving and while holding movement. The vehicle remains in place during pause and does not continue accelerating from a stale control after Resume; existing physical velocity is retained.
3. Open Map, Main Menu and Settings, including browser Back/Forward within GTD. Returning to `/game` reuses the same canvas and displays pause controls without new asset imports.
4. Switch away while initial loading is incomplete. On return, loading either continues its original work or has completed into a paused session.
5. Confirm that a deliberate hard refresh/tab discard still performs initialization; it is outside this live-session persistence guarantee.
