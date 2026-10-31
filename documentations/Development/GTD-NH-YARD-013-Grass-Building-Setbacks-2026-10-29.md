# GTD NH-YARD-013 — Grass around North Heights buildings

Date: 2026-10-29
Status: owner-preview candidate, not merged.

## User-observed defect
Nearly every occupied North Heights building block shows a large, light concrete/white ground panel around the building. User annotated those panels green and requested the identical park grass rather than a new texture.

## Root cause
`buildNorthHeightsReconstruction` formerly passed the comprehensive `occupied` set (every generated building and both parking pads) to `createNorthHeightsBlockSurfaces008`. That generator treats `occupied` as a **concrete cap**, so it produced a visually pale 48.3m-wide pavement under almost every building. The underlying terrain was already grassy, and the existing park grass material is already procedurally textured via `attachNorthHeightsGrass004`.

## Change
Pass **only** `NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010` as the concrete parcels for this one surface-generation call. Both genuine parking facilities (NH-03-05, NH-04-07) remain paved. All other 98 parcels use the same batched `grass` material and the same `cap` geometry/elevation as park parcels. The separate broad `occupied` set remains unchanged for buildings and tree planning.

## Invariants
- No changes to road surfaces, markings, zebra crossings, 8m two-lane road width, sidewalks, or curbs.
- Block caps stop at ±24.15m from the block centre, leaving at least 7.85m to the nearest road axis; footpath ends at 7.75m.
- Building foundations, white interior floors and roof slabs, door openings, collisions, trees, streetlights, 125 traffic agents, NPCs, and UI untouched.
- No new textures, GLBs, runtime imports, point lights, or mesh-count expansion. Existing grass geometry batches all 98 green parcels into a single ground mesh; parking batches into another.
- Terrain remains grade-following using `northHeightsGround(x,z)`.
- The 2026-10-29 screenshots `Screenshot (644).png` and `grass yards.png` are owner review references, not committed game assets.

## Tests
`src/test/north-heights-green-building-yards-013.test.ts` asserts 98 green parcels, two parked concrete parcels, building centre coverage, grade follow, road/sidewalk clearance, and preservation of interior-white and road systems. Existing North Heights test suite remains relevant.

## Acceptance
Owner should inspect several downtown glass towers, residential blocks, hills, both parking lots, roads and curbs in desktop/mobile preview before approving merge. No production deployment in this feature branch.
