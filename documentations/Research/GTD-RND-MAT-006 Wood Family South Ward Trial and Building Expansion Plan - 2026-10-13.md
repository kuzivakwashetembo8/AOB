# GTD-RND-MAT-006 — Wood Family Preview and South Ward Building Expansion Plan

**Record:** 2026-10-13 session, authoring date 2026-10-13 (SAST)  
**Status:** preview implementation / not production accepted. **World expansion and ambient traffic have not been implemented.**  
**Branch:** `feat/mat-005-south-ward-brick-fieldtrial-20261013`, incorporating canonical WOOD-01 through WOOD-10 image blobs from the owner's latest `main` commit.  
**Dependencies:** GTD-RND-MAT-004 catalogue, GTD-RND-MAT-005 brick business trial, GTD-WORLD-003 implementation gates.

## 1. Original image handling

The owner committed `public/Wood 1.webp` … `public/Wood 10.webp` to `main` (source commit `7fd302035da686c82bd16204ea7b432cf5f66f57`). The ten exact Git **blob SHAs** were copied into the working preview branch as:

| ID | Canonical path | Style |
| --- | --- | --- |
| WOOD-01 | `/assets/surfaces/wood/wood-01-natural-horizontal.webp` | Natural horizontal timber |
| WOOD-02 | `/assets/surfaces/wood/wood-02-dark-stained-horizontal.webp` | Dark stained horizontal siding |
| WOOD-03 | `/assets/surfaces/wood/wood-03-weathered-grey.webp` | Weathered grey boards |
| WOOD-04 | `/assets/surfaces/wood/wood-04-rustic-barn.webp` | Rough rustic barn wood |
| WOOD-05 | `/assets/surfaces/wood/wood-05-vertical-timber.webp` | Vertical timber |
| WOOD-06 | `/assets/surfaces/wood/wood-06-painted-white.webp` | Painted white wood |
| WOOD-07 | `/assets/surfaces/wood/wood-07-pastel-painted.webp` | Painted pastel wood |
| WOOD-08 | `/assets/surfaces/wood/wood-08-reclaimed-mixed.webp` | Reclaimed mixed-tone wood |
| WOOD-09 | `/assets/surfaces/wood/wood-09-premium-timber.webp` | Polished premium timber |
| WOOD-10 | `/assets/surfaces/wood/wood-10-charred-dark.webp` | Charred/dark slats |

No byte-level recompression, resizing or paint adjustment was made. The optimized assets total **21,507,412 encoded bytes (~20.5 MiB)**, but only the four assigned surfaces load in the default comparison. Exact intrinsic pixel dimensions will be populated from WebP-header tests when a binary-capable runner executes: do not confuse the originally specified landscape ~7:4 image-generation frame with a verified pixel count.

The user-facing IDs WOOD-01…10 now govern this family. The older conceptual `TIM-01…TIM-10` labels in MAT-004 are **historical provisional taxonomy**, not duplicate digital assets. WOOD-01…10 supersede them for future mappings. The styles and direction are governed by the owner's wood-family list, not by past illustrative TIM descriptions.

## 2. Material registry and resource management

- Canonical manifest: `public/assets/surfaces/wood/wood-family-manifest.json`; typed registry: `src/game/world-generation/wood-surface-catalog.ts`; exact source SHA and byte size per variant; `asset-committed` statuses until owner accepts field visuals.
- Cross-family resource implementation: `src/game/world-generation/image-wall-material.ts`. `createImageWallMaterial` performs one source-URL texture lease per scene, uses the existing opaque procedural wall recipe while loading or on failure, and releases a WebP image only when its final subscriber is disposed. BRK-01's original production path and material naming remain compatible.
- Physical UV mapping uses wall-building-relative local metres (not per-box scaled UV percentages), preserving course/plank sizes around window sections. The provisional wood tile is **1.620m wide × 1.620 × 4/7 ≈ 0.926m high**, pending calibrated source-size/seam review. Actual glass, doors, metal trim and physics/colliders stay unchanged; wood is assigned to role-`wall` box faces only.
- Current exterior wall boxes share a material on both sides. Interior-facing masonry/wood may inherit the exterior appearance, an acknowledged visual issue. Wood-paneled tall towers are a deliberately extreme **test of image mapping and texture repetition**, not approved permanent construction materials.
- Image-wall wall boxes bypass thin instancing while they require per-primitive physical UVs; profile mobile draw calls and image GPU storage before scaling to many more structures.

## 3. South Ward preview assignments

Six brick-image buildings remain as MAT-003/005 configured; the **four previously procedural** buildings receive provisional wood in the test environment:

| Building ID | Default image | Scenario |
| --- | --- | --- |
| `sw-fl-west-support` | WOOD-01 natural horizontal | Low-rise residence, close grain + knots |
| `sw-fl-rear-residential` | WOOD-03 weathered grey | Long residential facade, repeat rhythm |
| `sw-fl-skyline-west` | WOOD-09 premium timber | Tall tower facade, far-distance mips and repeated patterns |
| `sw-fl-skyline-east` | WOOD-05 vertical timber | Tall facade, vertical grain and seams |

**No approved brick selection is changed:** `sw-fl-south-apartment` and `sw-fl-garage` retain BRK-01, and commercial shop/workshop/office brick candidates retain MAT-005 assignments. All ten existing First Light buildings now have image-backed wall materials in this **preview**, but that is **not** proof that all placements are architecturally appropriate, approved or mobile performant.

### Comparison controls

- `/game` — the complete brick + wood trial on all ten South Ward buildings. Preview-only, not a production change.
- `/game?gtdWoodField=0` — disable wood on the four new assignments only; compare old procedural geometry/materials, with six brick buildings unchanged.
- `/game?gtdBrickField=0` — disable the four experimental business bricks only, with original two accepted bricks and four wood buildings unchanged.
- `/game?gtdWoodFocus=WOOD-08` — place any exact WOOD-01…WOOD-10 surface on the west-side residence for identical-geometry comparisons, keeping the other three wood placements intact.
- `/game?gtdBrickFocus=BRK-06` — existing MAT-005 corner business brick comparison.
- `/game?gtdWoodField=0&gtdBrickField=0` — retains only accepted apartment/garage brick walls for baseline performance comparison.

Parameters apply on page reload. Invalid surface IDs do not change assignments. All experimental activations are confined to the named preview branch.

## 4. Measurable data before more family authoring

1. Inspect each surface in day/dusk/night: grain orientation, board scale, tone and baked-highlight conflicts; compare the painted white and charcoal variants under night lighting.
2. Examine seams at the top/bottom and right/left for plank phase and mismatched knots. Repeat tiling 2×2 / 3×3 and long-wall real UV exposures; do not claim seamlessness based only on source prompts.
3. Inspect windows, door frames, roof/trim relationships, wall corners and both exterior and interior faces; on skyline towers compare long-range mip aliasing and obviously repetitive grain.
4. Record network compressed bytes, image decode latency, frame-time 95th percentile, GPU/draw-call estimates and game freezing on reference desktop/mobile. Encode size != decoded memory; only four wood variants should load during normal preview (unless developer selects another focus variant).
5. Inspect `gtdWoodField=0` paired screenshot at identical camera and game time to quantify benefit versus procedural, and compare both families at nearby street viewpoints. Only after owner review set asset statuses to accepted.

## 5. Proposed South Ward building growth — design-only plan

The user expects **100 total building-surface styles** eventually, so Meridian needs more **distinct facade witnesses** without multiplying all 100 images in one camera frame. The plan is a staged research and future implementation roadmap, **not an authorization to start roads/traffic or extend the deployed world under today's request**.

### Phase 0: Close first family-pair field gate
- Use the existing ten buildings to validate BRK and WOOD surface QA, meter-scale mapping, and GPU loading.
- Catalogue building geometry signatures (narrow shop, broad shop, industrial workshop, residential terrace, skyline, garage). Record which styles look plausible and which require smaller facade accents only.
- Confirm the shared image-surface registry and wrapper to avoid bespoke procedural branches per family.
- Freeze a maximum active-image budget for mobile from measured frame/memory data.

### Phase 1: Prepare a dedicated surface-testing architectural block
- Once owner approves physics and geographic expansion gates, select a small **adjacent South Ward parcel extension** or connected lane with a continuous legal road/sidewalk. No floating disconnected test islands or new ambient traffic.
- Generate **4–6 distinct building silhouettes** (compact shop, townhouse, low-rise clinic, workshop, multi-storey commercial, service building), using existing `CitySpec`, `BuildingSpec`, authored windows/doors and Rapier colliders. Preserve access, block setbacks and real-world scale.
- Each building must support changing surface IDs at runtime/dev preview through a typed assignment layer; surface change must not rebuild physics.
- Instantiate **only those buildings visible within calibrated streaming radius**, not a brute-force 100-material city.

### Phase 2: Family coverage progression
- When each later WALL family receives its ten assets, choose one or two architecturally plausible **new witness buildings** and reassign existing test shells where appropriate. Expand physical parcels only when distinct building geometry is necessary to test a construction style.
- Track coverage separately as `assetsCommitted`, `surfacesTested`, `visuallyAccepted`, `assignedBuildingCount` rather than assuming 100 digital images imply 100 new buildings.
- Glass gets optical shader and real openings, metallic cladding may need profile geometry, stone and masonry need mortar/reveal scale checks. Avoid forcing all ten families into one generic image-only wall renderer.

### Phase 3: Connected district expansion (GTD-WORLD-003 G4)
- **Gate:** full building-surface assignment coverage and owner-accepted correct vehicle physics, as originally instructed, remain requirements before activating new geography. Work on specifications/prototypes may occur independently.
- Implement city-registry-driven spatial continuity, stable road/lot IDs, sidewalk and collision connections, streamed materials/colliders and world-crosser replay with no dropouts.
- Validate the route back to First Light, memory retention after crossing blocks, safe loads while driving and no texture loss at LOD boundaries. Require owner's desktop/mobile preview approval.

### Phase 4: Later ambient traffic (separate authorization)
- Traffic remains blocked until city lane graph and validated shared wheel physics, rules of the road, and suitable original vehicles are ready. No traffic code is modified by MAT-006.

## 6. Verification and owner decision

Automated checks: exact ten wood IDs; all ten original Git blob SHAs and encoded sizes unchanged; WebP headers and actual dimensions; exclusive and reversible 4-wood + 6-brick assignment coverage; correct physical UVs and unchanged authoring plans/doors/colliders; no texture leaks across building disposal; safe invalid query handling; TypeScript, full regression and browser build.

Owner decision is **open** for individual WOOD types, the aesthetic suitability of the two test towers, real mobile loading cost, source seam correction, long-term material naming and when to activate the proposed building test block. **Do not merge to `main` without a new explicit directive.**
