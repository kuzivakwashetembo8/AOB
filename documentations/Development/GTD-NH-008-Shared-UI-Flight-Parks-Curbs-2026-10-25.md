# GTD-NH-008 — Global UI parity, third-person flight and landscape corrections

Date: 2026-10-25
Branch: feature/nh-shared-controls-character-007 (preview-only, not merged).

## Screenshots / defects
1. North Heights rendered bespoke DAY/FLY/reset/settings/world buttons in the gameplay header and a blue/dark local modal frame, unlike South Ward's objective, Meridian time/location and pause HUD and full-screen settings.
2. Flight moved an unaccompanied FreeCamera away from both GLB characters, leaving no third-person avatar.
3. Empty park blocks were black/dark and tree sites lacked the accepted green grass. Building lot surrounds needed a plain concrete/pavement finish, not continuous turf.
4. Curbs and sidewalks showed thin surface lines; desire actual vertical kerb reveal with unpatterned top.

## Reused source components
- src/ui/hud/game-hud.tsx: identical objective/location/time/pause header in South Ward and North Heights.
- src/ui/hud/touch-controls.tsx and desktop-controls.tsx: identical input affordances.
- src/ui/menus/session-overlays.tsx: a single GTDSettingsOverlay and GTDSessionPauseActions consumed by the production game session and the North Heights trial.
- src/ui/menus/settings-editor.tsx / settings-state.ts: single editor and saved settings preference, with the same full overlay layout.
- src/game/world-generation/ground-land-surface.ts: South Ward grass pixel sampler consumed by both South Ward and North Heights.
- src/game/physics/rapier-world.ts: existing shared player collider/controller for walk and flight; no second player.

## Geometry rules
- Empty 10×10 NH park lots use the shared South Ward grass, following grade with batched surface meshes.
- Built blocks are concrete. Any tree planting within developed blocks receives only a small green well around the trunk.
- Sidewalks have plain cement material with no tile lines. Curbs remain raised on geometry and retain actual vertical faces; no top decorative curb ribbon.
- All newly visible land-cover surfaces receive Rapier collision meshes, matching rendered ground.

## Flight rules
- G / plane action changes movement mode, not camera type. Neither model disappears and the camera orbits behind the same controlled actor.
- UAL plays its supported flight/idle groups; Voight uses native flight controller. The existing Rapier capsule retains the world position, collides with buildings and grounds after flight exit.
- No first-person camera is introduced.

## Acceptance gates
- Test in mobile landscape and desktop both models: walk, flight, ascent/descent, sprint, camera orbit, return to walk, pause resume.
- Confirm header parity with South Ward; settings category layout must be identical.
- Inspect several empty parks and built setback trees, cement block interior, sidewalk edges, crossings; verify no z-fighting or new seams.
- Review the isolated Vercel build and tests before user acceptance. Main is untouched.
