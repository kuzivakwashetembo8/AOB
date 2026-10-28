# GTD-PED-001-VIS-004 — Pedestrian Ground Contact and Sidewalk/Curb Color Parity

**Date:** 2026-10-28  
**Branch:** `feature/north-heights-pedestrian-traffic-001`  
**Baseline:** `aac792806f61221b11ce09d940516b4cc07a4ad4`  
**Status:** Source inspection completed; document findings **before** any patch. Owner accepted the pedestrian movement system but withheld merge approval pending these two visual corrections.

## Verified findings

### VIS-004-A — NPC feet sink into sidewalks and zebra crossings

`src/game/experiments/north-heights-pedestrian-characters-001.ts` anchors every animated NPC at `ground(a.x,a.z)`, which is `northHeightsGround`, regardless of the underlying surface. It adds only `+.03` to the normalized character model's foot minimum, independent of the ground surface.

`src/game/experiments/north-heights-roads-003.ts` constructs sidewalk top surfaces at `northHeightsGround + 0.20m`, asphalt at `+0.075m`, and painted zebra stripes at `+0.078m`. The previous diagnostic dot renderer explicitly used `ground + .20 + dot-radius`. This difference is a directly demonstrated vertical-placement mismatch, independent of route logic.

North Heights buildings also have shallow foundation top `ground + .19m` and an interior white floor top `ground + .27m`; park grass follows terrain grade. A single constant `+.20m` for every pedestrian position would correct sidewalks but leave road crossings and park journeys vertically wrong.

### VIS-004-B — Curb side appearance differs from pavement top

`src/game/experiments/north-heights-reconstruction-001.ts` defines `pavement: #696964` and `curb: #85837b`. The top uses the normal lit pavement material; the curb fascia uses the separately colored material with `disableLighting=true`. The renderer `north-heights-roads-003.ts` computes geometric normals for curb sides but forces top-surface normals skyward. These different materials and lighting paths cannot guarantee identical apparent colors.

The accepted full-volume curb geometry remains in the branch (the branch was created from main at `6424eb15`). The pedestrian-stage road edits primarily expanded zebra markings. Do not discard or rebuild the accepted curb geometry.

## Proposed isolated corrective patch

1. Introduce a deterministic pedestrian support-height resolver using the **same** North Heights road-grid geometry as the road renderer: terrain baseline in parks, `+.20m` on sidewalk ribbons and junction corner pads, `+.075m` on asphalt/zebra crossings, and appropriate doorway/foundation contact near entrances. Do not alter any pedestrian x/z route, speed, crossing eligibility, population, identity or appearance selection. Use the resolver for NPC anchor Y on assignment and every update. Keep a small existing visual clearance and the existing optimized-GLB normalization.
2. Make curb fascia and pavement top share the exact same lit material and skyward-facing shading normal. Preserve existing physical curb thickness, positions, grade following, all five batched surface meshes, zebra stripes, road elevations, and performance characteristics. Avoid a new independent material or per-face objects.
3. Add focused tests for sidewalk/road/park/doorway support heights, corner samples, curb/pavement material identity and normal parity, and nonregression of accepted road/route structure. Validate with the Vercel build and an isolated preview; **owner visual acceptance remains required**.

## Explicit exclusions

- No edits to `NorthHeightsPedestrianSimulator001` journey lifecycle or graph topology.
- No pedestrian yielding or schedule policy (later stages).
- No change to 125 Sedan traffic, player movement, world layout, NPC GLB assets or the ten-appearance pool.
- No main merge or production deploy without owner approval.

## Acceptance gates

- Animated feet meet sidewalk tops, zebra asphalt and park ground without persistent visible penetration or levitation; entrances remain visually plausible.
- Sidewalk top and all exposed curb faces have the same visible base color, including corners and slopes, without black or dark special corner sides.
- All 100 independent pedestrian identities continue accepted building-to-building routes and crosswalk behavior.
- Test and preview success alone are not a substitute for owner visual sign-off.
