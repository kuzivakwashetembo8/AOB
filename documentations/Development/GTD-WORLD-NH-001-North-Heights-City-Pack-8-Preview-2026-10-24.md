# GTD-WORLD-NH-001 — North Heights city-pack_8 preview trial

Date: 2026-10-24
Branch: trial/north-heights-city-pack-8
Status: preview only; not authorized for main.

## Source and rights
- Repo source: root \`city_pack_8.glb\`, Git blob \`d8b9fcb86b372dbb896642638f251a6e16dc3a3b\`, 13,338,312 bytes.
- The owner-supplied Git commit attributes "City pack 8" (https://skfb.ly/pFEVL) to Pasha under Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/). Preserve source attribution for any future integration; check rights for other bundled textures.
- Exact binary blob is re-referenced at \`public/GLBs/Infrastructure/city_pack_8.glb\` without re-encoding or loss.

## Scope
- Dedicated \`/north-heights-preview\` Babylon.js renderer. Only active through the district-directory North Heights entry or the direct preview URL.
- Imports the unchanged city pack with Babylon's glTF loader. Camera is unrestricted 3D fly-through, desktop arrow/WASD and mobile on-screen movement, pointer-drag to look.
- Visual witnesses: existing \`/GLBs/Characters/character.glb\` (Voight) and build-stage-verified \`/GLBs/Characters/ual.glb\`, both normalized to 1.78m. UAL idle loop plays if present. No collision or gameplay mission integration.
- Captures reported mesh count, triangle count, frame rate and scene import time in the preview; these are runtime diagnostics, not performance guarantees.
- Scene transform optionally normalizes implausible imported unit extents for test navigation, preserving the source binary; model-to-game scale needs visual acceptance.
- Scene uses no Rapier world, collisions, generated South Ward, traffic, shadows or other production vehicles. Performance should be evaluated in isolation first.
- No direct changes to \`/game\`, core runtime, accepted locomotion or Vercel production.

## Acceptance gate
1. Open North Heights from world directory; confirm exact imported city appears, not the default South Ward.
2. Confirm both actual imported characters are visible, proportionate, and not underground.
3. Fly over buildings and through streets on desktop and mobile. Observe FPS and frame stability.
4. Evaluate imported coordinate axes, material fidelity, city geometry and coherent pedestrian-scale heights.
5. If rejected, invoke Procedure DDD; do not merge preview branch into main.

## Known limitations
- This is a free-camera visual import proof only, not a playable district transfer or collision-enabled scene.
- Asset is not remeshed, optimized or culled; performance could be unacceptable on mobile.
- Voight standing pose is asset-native in this trial, not the approved game controller's adjusted native stance.
- Surface sampling for the two character witnesses may select a roof/obstructed site in some imported geometry. Adjust positions only after visual review.
