# GTD-RND-MAT-007 — Glass Family & Windowless South Ward Tower Field Trial

**Date:** 2026-10-13 (SAST)  
**Status:** owner-directed implementation in isolated preview branch. Not owner-accepted or production-merged.  
**Branch:** `feat/mat-005-south-ward-brick-fieldtrial-20261013`.  
**Architectural reference:** GTD-WORLD-004 / ARCH-01 (curtain-wall office tower) and MAT-006 finding that large timber towers are architecturally inappropriate.

## 1. Owner directive and actual asset provenance

The user committed ten optimized `public/Glass 1.webp`…`public/Glass 10.webp` files on `main` at source commit `e6c98ce365be6e416afa8991d72ab6c86ec6d9e7`. All ten are imported into the experiment branch under `public/assets/surfaces/glass/gls-01.webp` through `gls-10.webp`, retaining their exact original Git blob hashes and bytes (not resampled). **Every optimized file was verified by WebP header to be 1672 × 941 px**; manifest records origin, path, encoded size and SHA.

The ten committed visual samples represent **coloured glass curtain-grid finishes** (blue, charcoal, silver, aqua, teal, bronze, navy, green-grey, icy-blue, warm-grey). They do NOT yet represent the originally proposed ten physically distinct clear/frit/wired/channel/block glass systems. They are a valid colourway test asset collection, not proof of true glass transmission or refraction. Reconcile the surface taxonomy later with owner review.

## 2. Windowless tower replacement

| Existing South Ward ID | Prior surface | MAT-007 default | Massing |
| --- | --- | --- | --- |
| `sw-fl-skyline-west` | WOOD-09 premium timber | **GLS-01** neutral-blue curtain grid | 8 storeys, existing podium/tower silhouette |
| `sw-fl-skyline-east` | WOOD-05 vertical timber | **GLS-03** silver-neutral curtain grid | 10 storeys, existing podium/tower silhouette |

**Critical structural change:** both source building specifications now explicitly use `windowType:"none"`. The architecture planner creates **zero independent window/storefront openings**, no window panes, no decorative window frame meshes and no ghost window bay roles for these towers. Existing facade wall shells cover entire storey elevations and receive the glass-panel grid image with consistent metre-mapped UVs. A small decorative pedestrian entrance remains permitted and is not confused with a window.

Glass curtain walls are **continuous image-derived grids** in this stage. They are not photoreal glass transparency shaders, not physical holes through the structural shell and not furnished/glazed interiors. The image is kept opaque as in the brick/wood trial; `StandardMaterial` adds scene-light-responsive highlights. The images deliberately do not bake cloud/skyline object reflections, allowing visually consistent day and night treatment. True optical glass, structured mullion meshes and distinct podium material zones belong to a subsequent architectural fidelity gate if authorized.

The two towers retain existing location, dimensions, podium massing, existing roof primitives and Rapier exterior shell/interaction planning. Their former low-rise masonry facade details such as random downpipes/cornices are omitted. **WOOD-01 and WOOD-03** remain assigned only to two low-rise residential buildings. **Six existing brick assignments remain intact**.

## 3. Render implementation

- Canonical manifest: `public/assets/surfaces/glass/glass-family-manifest.json`.
- Typed registry: `src/game/world-generation/glass-surface-catalog.ts`; tower-specific surface policy: `glass-south-ward-field-trial.ts`.
- Shared image loader: `image-wall-material.ts`; source-URL lease, native WebP, procedural opaque fallback if unavailable, safe disposal.
- World-space grid repeat period: **27.000 metres wide × approximately 15.196 metres high**, corresponding to an approximate **12-column × 5-row** photographic grid. This gives ~2.25m pane bays and ~3.04m row height, plausible for 3.32–3.50m tower floors. Dimensions match source image ratio; review actual facade grid alignment across podium/tower boundaries visually.
- Single building glass material is shared by all its `wall` primitives; on two towers this is a bounded number of unique image sources. Each wall face uses image-aware physical UVs. At long distances the engine's existing LOD may substitute opaque mass proxies, which should be separately field inspected.
- **Not changed:** player/car Rapier physics, street network, garage and apartment BRK-01 accepted textures, four commercial brick witnesses, two low-rise timber witnesses and roofs.

## 4. Preview controls

- `/game`: default both glass towers + six brick and two low-rise timber structures in the branch preview.
- `/game?gtdGlassFocus=GLS-05`: switches **only the east skyline tower** to any exact GLS-01 through GLS-10 ID; the west remains GLS-01.
- `/game?gtdGlassField=0`: disables the new glass **image** and uses the original procedural fallback wall finish. The towers still have **no punched window geometry** since the architecture conversion is independent from the texture comparison switch.
- `/game?gtdWoodField=0`: disables two low-rise wood image trials only, preserving the glass towers.
- `/game?gtdBrickField=0`: disables the four experimental commercial brick images, preserving the two accepted brick facades and the glass tower facade.
- Reload page after changing a parameter. Malformed GLS IDs do not change asset selection.

## 5. Tests and acceptance

Automated checks: original immutable blob SHAs and measured dimensions; exactly two controlled skyline assignments; no window panes, window frames, windows or storefront openings/bays; roof/physical wall primitives retained; collision boxes present; all ten South Ward buildings still have one assigned image family under default trial; UV mapping preserves image proportions; reversible field/focus controls; all previous accepted BRK-01 facades unchanged. Run typecheck, targeted tests, complete suite and production build before preview release.

Field QA pending owner: actual curtain-grid appearance at street/rooftop distance, day/night reflections and highlights, image tiling at outer corners and podium transitions, no phantom window frames, no residual timber, no GPU/draw-call regressions and acceptable mobile clarity. Do not claim full physical glass or optical reality based on flat facade photographs.

**Release state:** visual research trial only. No merge to `main` or implementation of new geography/ambient traffic without explicit further instruction. The GTD-WORLD-003 building-material and vehicle-physics gates remain in force.


## 6. MAT-007 continuation — pure-glass/no-strip comparison (2026-10-13)

**Scope:** owner-directed research preview on this branch. The earlier grid-image state in sections 1–5 is historical; this section supersedes its texture/provenance descriptions for the latest preview.

The owner committed ten new optimized **unframed** glass WebPs to `main` in commit `1962cc060f066991ba1f338ab4466bc3e8f20553` under `public/Glass 1.webp` through `public/Glass 10.webp`. This branch imports the **exact Git blobs** into `public/assets/surfaces/glass/gls-01.webp` through `gls-10.webp`, replacing the ten earlier embedded-grid WebPs while preserving corresponding GLS colorway identities and the two-tower mapping (west GLS-01, east GLS-03; east focus control still supports all ten).

Only glass surfaces change: **no horizontal or vertical strip images, no new procedural mullions, no separate window geometry, no changes to the building massing, doors, collision, player, physics, brick, wood, or vehicle systems**. The building shell retains the previous UV repeat period solely for an apples-to-apples visual test. Once judged in-game, a later authorized stage can add 3D architectural framing with measurable depth.

Updated manifest and registry store each owner-uploaded blob SHA and encoded byte count; prior 1672x941 dimensions are not carried forward as proven properties of the newly optimized files. Tests now read the replacement WebP headers in the build/test workspace and accept VP8X, VP8, and VP8L encodings, validating image dimensions, wide aspect and Git blob identity. The contents are image-derived glass-look shaders with Babylon scene-light specularity, not a physical optical transmission model.

**Owner acceptance gate:** compare unframed glass at street and rooftop distances, in day and night conditions. Only add real 3D frame geometry after inspection and separate authorization. **Do not merge to `main` as part of this comparison.**

### Replacement asset provenance

| Glass ID | Source on main | Blob SHA | Bytes |
| --- | --- | --- | --- |
| GLS-01 | `public/Glass 1.webp` | `63e28510351276f89779059ba4d0cc31f3fe14a9` | 1130340 |
| GLS-02 | `public/Glass 2.webp` | `2bf577e231def28f8b4f58edf8a2cbdd4996c249` | 1146512 |
| GLS-03 | `public/Glass 3.webp` | `56f7be1b468f103b2ceecbb9226e1d00feab4834` | 1128766 |
| GLS-04 | `public/Glass 4.webp` | `18fdc7ffeb99b17686512614c90059925b06009e` | 1092460 |
| GLS-05 | `public/Glass 5.webp` | `51c15e0c190761361a1d962198fc26ad2adff449` | 1087504 |
| GLS-06 | `public/Glass 6.webp` | `90029f12d85c3f55cea6df0e0bf255bdfc3f9310` | 1189218 |
| GLS-07 | `public/Glass 7.webp` | `1f2c8b0f99c0f357a875da98431ae0a97150fc85` | 1098142 |
| GLS-08 | `public/Glass 8.webp` | `f02a9dc208631ba4880cdc4c4d3c4b67182f2a30` | 1105606 |
| GLS-09 | `public/Glass 9.webp` | `3e19c18c115cadfcbd348e7dd9dc1d639fe2cb29` | 1117930 |
| GLS-10 | `public/Glass 10.webp` | `2199b0905106b90eadadbe28f168f4b95a08fe62` | 1110404 |
