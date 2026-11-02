# GTD-REESE-001 — Agent Reese replaces the playable Voight visual

**Date:** 2026-11-02
**Owner instruction:** Latest `main` commit `223e994000e2efee05fe41a0eb232312497ea642` — `Agent Reese\n\nReplace Voight (character.glb) with Agent Reese (Reese (1).glb).`
**Working branch:** `feature/agent-reese-player-20261102`
**Status:** Preview implementation, pending owner visual/gameplay acceptance; do not merge to production without approval.

## Asset and goal

Source is `public/GLBs/Reese (1).glb`, committed directly by the owner. The runtime URL is `/GLBs/Reese%20(1).glb`. Keep the source untouched; no GLB rebaking, optimizing, or renaming on this branch. The source was exported from Ara 3D Gen as a skinned GLB with 70 embedded animations.

Replace only the **default playable visual** in North Heights. Preserve the existing character-controller inputs, Rapier player collision/ground queries, world spawn, controlled flight movement, third-person camera, vehicle entry/exit, local settings and the independent UAL alternative. The former `character.glb` and its hand-retargeted controllers remain available as fallback/archive code, but should not be imported for the default actor.

## Implementation

- `src/game/character/reese-player-001.ts` loads the owner GLB through Babylon's local loader and instantiates its skeleton and source animation groups. It validates a game rig (60+ bones), 70 animation groups and usable idle/walk/run clips; failures reject startup instead of silently showing a placeholder.
- GLB source faces +Z according to Ara export conventions. Model geometry is centered and normalized visually to the same 1.78m footprint as the existing player. The Rapier capsule remains unchanged.
- Use exported idle, walk, run, jump/fall and land clips directly, rather than assuming the former Voight skeleton's hardcoded joint names.
- Walking and sprinting switch with a short 180ms animation blend. Flight remains supported through a visual-only torso pivot: the exported 70-clip catalog has no authored dedicated flight clips, so the neutral clip is combined with lean/roll rather than pretending flight animations were transferred.
- Driving keeps the approved invisibility policy: the controlled character is not rendered inside the vehicle. Exiting restores the same instance.
- `src/game/experiments/north-heights-city-8.ts` now creates this player. The UAL option remains available behind existing settings; Finch, HUD, camera, traffic and world state are unchanged.
- `src/test/reese-player-001.test.ts` covers clip selection and checks that the correct renderer is wired to the existing world.

## Acceptance checklist

1. Open the isolated North Heights preview. Confirm Reese appears by Finch HQ beside the yellow car, standing upright with appropriate outfit and **Shoes 03** from the owner-approved exported asset.
2. Observe idle, walk, run, jump/fall and landing. Inspect feet alignment, coat clipping, heading/facing and camera placement.
3. Inspect third-person flying: forward/reverse, lateral and ascending/descending. Physics is unchanged, but visuals use fallback torso lean because the GLB does not export a native flight set.
4. Enter a Sedan: the player visual must disappear. Exit: Reese must reappear at a safe roadside location.
5. Enter Finch HQ, travel to floor 53 and confirm the approved introduction still triggers. This implementation does not change the approved dialogue text, which still refers to “Mr. Voight”; identity/story text changes require a separate narrative decision.
6. Compare frame rate and loading cost against the previous playable actor. Imported GLB is larger than the legacy character; no performance claim is made without field testing.

**Validation gate:** a successful Vercel build confirms deployment only, not all human-visible poses. Owner gameplay acceptance precedes merge.
