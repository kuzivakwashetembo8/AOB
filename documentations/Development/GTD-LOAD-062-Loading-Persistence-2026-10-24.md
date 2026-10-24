# GTD-LOAD-062 — Loading Persistence

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
