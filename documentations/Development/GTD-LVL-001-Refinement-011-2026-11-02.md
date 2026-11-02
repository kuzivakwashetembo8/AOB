# G.T.D — Level 001 Preview Refinement 011
Date: 2026-11-02
Branch: `feature/level-001-diane-20261102`
Source of truth: user's two screenshots of Finch HQ glass elevator and streets, plus ten owner corrections.
Status: **Implemented for preview / NOT accepted or merged.**

## Owner acceptance checklist

1. Reese's flying **pose animation** is disabled. Flight movement itself remains available; no custom flying lean/bank and no animation that replaces his neutral clip.
2. A grounded gait hysteresis preserves Reese's existing walk/run clip during short contact-state or speed fluctuations instead of restarting at frame zero. Retain the imported 70 clips and regular alternating steps.
3. Traffic junction reservations are reconciled against the physical owning car to clear orphaned intersection occupancy after congestion or collisions. Never ghost Diane's car through other physical cars.
4. The elevator direction button appears as an independent mid-right control, not a grid action, while retaining its existing dark transparent style.
5. Reese's initial hand state is empty; the top-right hand selector switches to a firearm and back. Detachable weapon submeshes are hidden by default and an attached lightweight fallback is available when the model includes a compatible right-hand bone. Future item slots can extend the selector.
6. The glass carriage uses aligned side/back walls, a full-width front with fixed side lights, two retracting glass leaves, and continuous glass floor and ceiling. All four corners meet.
7. Minimap draws nearby roads, sidewalks, rooftops and landscaping from **actual generated building footprints**, with the existing white player dot and anonymous mission POI. Mini view follows the player; expanded view covers the full actual city plan. Do not render a chessboard grid.
8. Camera inside a building or the elevator must stay within its room's horizontal footprint and vertical slab/ceiling limits; no camera peeking above roofs, below floors, or outside enclosing walls.
9. Reception professional must sit on the new plain white slab. Prefer imported sitting loop; when absent, a rigged-leg seated pose fallback is applied. Visual approval requires confirming the particular NPC supports this bone naming convention.
10. Pavement still respects the accepted 20cm raised geometry, now with rounded junction corners (~0.6m) and physically computed fascia normals to distinguish sidewalk tops from curb sides without black artifacts.

## Verification gates

- `npx tsc --noEmit`, project-wide Vitest, PWA/offline build, Vercel preview READY.
- Visual owner acceptance: walking cycle and neutral flight, weapon toggle, stuck Diane car recovery, standalone elevator button, closed all-glass lift, readable native map, interior camera clipping, seated receptionist, rounded shadowed sidewalks.
- No merge to `main` without owner greenlight.
- No claim of browser visual validation from static code or unit tests.
