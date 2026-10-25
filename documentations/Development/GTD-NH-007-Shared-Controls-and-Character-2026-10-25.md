# GTD-NH-007 — North Heights shared controls and character parity

Date: 2026-10-25

## Scope and source of truth
- Base: trial/north-heights-reconstruction-001 (NH-REBUILD-006).
- Preview-only integration branch: feature/nh-shared-controls-character-007.
- Reuse the authoritative South Ward TouchControls, DesktopControls, SettingsEditor and useSettings. Do not fork their buttons, icons, layout or storage keys.
- North Heights retains its isolated geometry, roads, Rapier collision and sky experiment. No production merge requested.

## Actions and engine capability
- The shared joystick and on-screen desktop directional pad drive the existing NH-005 Rapier controller.
- Jump/ascend, sprint/boost, descend and fly-toggle operate on the existing NH controls; native Space, Shift, Ctrl and G mirror South Ward. E and Q no longer incorrectly trigger ascent/descent.
- Combat, interaction, vehicle and context remain visible through the same common component. North Heights does not yet supply those features; pressing them produces a contextual explanation rather than suggesting a working car or combat system.
- Shared controls maintain pointer-release semantics, joystick reset on tab blur, haptics, handedness, positions and desktop-control preferences.

## Character model selection
- Enable Character **on**: Voight character.glb with his accepted GTD retargeted walk/sprint/jump controllers.
- Enable Character **off**: UAL ual.glb with GTD's original supported animations from loadMeridiaCharacterTrial.
- The chosen visual actor shares one NH-005 Rapier capsule, position, heading and follow camera. Switching never teleports the player, reloads the city or creates a second player collider.
- ual.glb is staged during prebuild from GTD's pinned three-player-controller source (not a new unverified model or CDN runtime dependency).

## Acceptance checkpoints
1. Landscape mobile: same joystick, eight action icons, handedness/size/opacity/position, touch look and hidden on keyboard input.
2. Desktop: same directional and action icons with tooltip hints; arrows/WASD, Space, Shift, Ctrl, G.
3. Apply shared Graphics presets, pixel clarity, frame rate, contrast, interface size, and character toggle; changes persist on route change and reload.
4. Walk/jump/sprint independently with Voight and UAL; ensure collisions and position are unchanged on toggle.
5. Unsupported world actions must explain their unavailable capabilities, not silently no-op. Audio and physical-debug options without corresponding NH trial subsystems remain persisted global preferences, not asserted as functional in North Heights.
6. Verify built preview and functional play test on mobile before merge; main is untouched.
