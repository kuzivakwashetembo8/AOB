# GTD-RND-GRN-005 — Native Tree Foliage and White Blue Tower Strips

**Date:** 2026-10-14  
**Status:** Preview correction implemented; awaiting visual acceptance.  
**Branch:** `fix/grn003-grass-tiles-aerial-foliage-20261014`

## Owner observation and decisions

- The high-fidelity photo leaf clusters were convincing in isolation but **visually incompatible with the semi-realistic procedural bark/trunks**. The camera-dependent switch into simplified 3D aerial lobes also did not deliver a consistent visual language. **Decision:** revert the full foliage photo/hybrid experiment and use the pre-existing procedural tree leaves at every viewpoint, including flight.
- The blue skyscraper now has the correct actual three-dimensional mullion/transom geometry, but its dark-grey finish is wrong. **Decision:** keep its physical strips and change their material to **white**. Grey/east skyline retains its original graphite metal strips and dark crown.
- GROUND-004's accepted **code-generated grass** remains authoritative; the photographic grass experiment stays rejected.

## Implementation boundary

1. `src/game/world-generation/street-context-renderer.ts` calls the original `addTree` with the original shared, procedurally painted `generated-tree-foliage-material`. No photo foliage loader, secondary photo material, camera-based swap, 3D aerial lobe mesh, extra image texture allocation or render-loop observer is generated. Shrubs retain the same generated foliage.
2. Remove foliage experimental options from `generated-first-light-world.ts`, `first-light-runtime-source.ts` and `gtd-runtime.ts`. Historical URL parameters `gtdFoliageImgTrial` and `gtdAerialFoliage` are inert; no longer authorize an alternate leaf mode.
3. Retire the foliage image runtime copy and the now-unused foliage asset loader and aerial view policy from this branch. Source-image research documentation and owner's original source assets elsewhere in the repository/history remain unchanged.
4. In `building-generator.ts`, select near-white `skyline-structural-metal` **only** when `spec.id === BLUE_GLASS_TOWER_ID`. Preserve grey tower's dark metallic frame. Preserve blue glass imagery, physical strips' shape, pale crown, massing and collision.
5. Retire tests that positively require photo foliage/hybrid behavior, replacing them with negative checks that all tree/shrub cards are procedural and stay enabled at pedestrian and flight views; add blue-white vs grey-dark frame assertions.

## Acceptance criteria

- Grass returns to the already accepted uniformly generated GRN-01 lawn.
- Every tree has the familiar semi-realistic code-generated canopy, including aerial views; no leaf image or camera-mode switch is visible.
- Blue glass tower: white vertical mullions and white horizontal transoms on both masses/four façades, clear physical depth close up, without grey grid coloring. Grey glass tower retains its dark metal scheme.
- All existing roads, buildings, vehicle movement, character movement and physical colliders remain unchanged.
- Strict TypeScript, Vitest regressions and manual preview build succeed; owner performs final visual acceptance before main merge.

**No production deployment or merge authorized.**
