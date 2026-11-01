# GTD-POI-004 — Finch HQ White Lobby, Formal Receptionist, Central Glass Elevator and 53-Floor Round Trip

**Date:** 2026-11-01  
**Branch:** `feature/finch-headquarters-map-20261101`  
**Status:** Implemented on preview branch; production merge requires owner acceptance.  
**Owner acceptance basis:** Screenshot showing successful POI-003 entrance and furniture with exposed turf, left-offset metal lift and casual NPC.

## Requirements implemented

1. **White ground-floor interior:** Exclude the HQ footprint from the batched 100-parcel grass cap, retaining neighboring turf, and use a white, opaque floor covering the entire inside footprint at the existing walkable level. Avoid changing citywide yard/park textures or underlying pedestrian collision.
2. **Receptionist attire:** Change from `GTD_NPC_003` to `GTD_NPC_025` (Meridia character bible: Office Professionals, The Insurance Broker, wardrobe `formal`). Its physical GLB remains one dedicated idle receptionist independently instantiated from the existing roaming identity. Source: `interlinkglobal/3d-gen/data/gtd-meridia-character-bible-90.json` and canonical G.T.D NPC manifest. No new GLB generated.
3. **Centered elevator:** The original left-offset cabin is replaced by a single lift at the horizontal midpoint of the tower's rear (-Z) wall, leaving symmetric left/right clearances. Glass-sided moving cabin, wood-framed entry, sliding metal doors, visible glass shaft from ground to the 53rd floor, static surrounding lobby/shaft wall and desk colliders.
4. **Full vertical opening:** For building `NH-04-06-L2` only, split visual white slabs and Rapier floor collisions into four non-overlapping rectangles around a common 5.1×5.1m shaft void. Leave the 51 intermediate floor rooms unmodeled. Keep top landing and cabin platform aligned. The neighboring 53-floor tower remains unchanged.
5. **Two-way travel:** Once Voight stands inside the elevator, the UI exposes an up-arrow and **FLOOR 53** at the ground floor or a down-arrow and **GROUND FLOOR** from the top. Triggered travel closes the doors, moves the *same original Voight capsule, model and chase camera vertically together with the Babylon carriage* over 14 seconds, then opens and enables physical walking onto the upper-floor landing. Reverse traversal uses the identical system. Normal gravity and movement are suspended only while the trip is active.
6. **Safe physics lifecycle:** Disable the existing capsule collision only for vertical movement through the 52-level shaft, then reenable it on completed arrival; a temporary top platform collider supports the upper cabin. The door threshold collider disappears whenever an occupant is in its path. The original 125 traffic sedans, traffic route map, NPC population, movement controls, and mission systems are otherwise unchanged.

## Implementation modules

- `src/game/experiments/north-heights-finch-elevator-structure-004.ts` — shared building ID, floor plan, shaft void and ring geometry.
- `src/game/experiments/north-heights-reconstruction-001.ts` — visual slabs with only one continuous shaft opening.
- `src/game/experiments/north-heights-physics-005.ts` — matching Rapier slab geometry.
- `src/game/experiments/north-heights-block-surfaces-008.ts` — preserve outdoor grass, exclude HQ room footprint.
- `src/game/experiments/north-heights-finch-lobby-004.ts` — white interior, fixed glass shaft, animated elevator, doors, reception desk, formal idle NPC.
- `src/game/experiments/north-heights-city-8.ts` — player capsule/carriage synchronization, camera accommodation, floor interactions and scene lifecycle.
- `src/routes/north-heights-preview.tsx` — live directional arrow and travel progress.
- `src/test/finch-elevator-53-floors-004.test.ts` — full up/down travel, physical/visual shaft correspondence, formal receptionist and floor controls.

## Validation and owner review

Automated regression: verify 53-floor height delta, symmetric rear-wall shaft, open intermediate floors, exact alignment of render and Rapier openings, real continuous upward/downward movement in a Babylon NullEngine scene and disposal of colliders. Preserve the original POI-003 auto-drive and map tests.

Manual preview: walk into the white lobby (no grass), find the formally dressed receptionist behind the white desk, see a centered lift at rear wall, walk inside to show **↑ FLOOR 53**, press, view ascending through the transparent shaft, exit at floor 53 into a walkable white room, re-enter, select **↓ GROUND FLOOR**, descend, and exit to lobby.

**Not implemented:** Fully decorated Finch meeting suite, Finch NPC placement/dialogue, mission assignment, stops at intermediate levels, functioning intermediate floor interiors, alternate elevator cars or complex elevator dispatch. Separate later approval required.

**Production:** Do not merge/deploy to production until owner visual acceptance of the preview.
