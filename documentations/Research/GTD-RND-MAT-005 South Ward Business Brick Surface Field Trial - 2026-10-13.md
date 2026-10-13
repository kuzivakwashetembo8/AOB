# GTD-RND-MAT-005 — South Ward Business Brick Surface Field Trial

**Date:** 2026-10-13 (SAST)  
**Decision:** owner-authorized experimentation on existing South Ward business facades using the nine newly organized BRK candidate images. **BRK-02–10 remain experimental, not yet accepted surfaces.**  
**Implementation branch:** `feat/mat-005-south-ward-brick-fieldtrial-20261013`, derived from the brick catalogue branch `docs/gtd-world-003-six-system-audit-plan-20261013`. **No merge to `main` without a separate owner decision.**

## Question

Before authoring the nine remaining building-wall families, does deploying several new BRK images on real South Ward structures expose problems in repeat seams, mortar continuity, scale, close-range sharpness, city composition, daylight/night performance, WebP GPU memory or building material lifecycle that should inform the entire future pipeline?

## Exact test assignments

| Building (world-local x,z metres) | Proposed role | Candidate | Why |
| --- | --- | --- | --- |
| `sw-fl-corner-commercial` (29.2,18.6) | Mercer Street corner retail/commercial | **BRK-04** buff/yellow | High-contrast, light brick next to frames/storefront surfaces; available for controlled image swapping |
| `sw-fl-rear-shop` (5,59.2) | Foundry Lane retail/shop | **BRK-10** whitewashed | Applied paint/whitewash treatment around commercial fenestration |
| `sw-fl-rear-workshop` (36,59.5) | Foundry Lane industrial/workshop business | **BRK-09** reclaimed mixed | Dense aged colour and brick-to-brick variation near industrial trim |
| `sw-fl-east-support` (8.8,-6.7) | Mercer Street office/support building | **BRK-07** charcoal engineering | Strong dark texture under day and night light; distance readability |

**Accepted baseline remains unchanged:** `sw-fl-south-apartment` BRK-01, compactA 1.350m tile, and `sw-fl-garage` BRK-01, standardB 1.485m tile. The other four generated First Light buildings retain their procedural wall material. The four business assignments do **not** imply final architectural suitability; the owner decides after screenshots.

## Preview controls

- `/game` — four candidate business surfaces **plus** the accepted apartment/garage, on this field-trial preview only.
- `/game?gtdBrickField=0` — turns off only the four candidate placements, leaving the apartment and garage accepted BRK-01 unchanged. Compare from the same viewpoints and time of day.
- `/game?gtdBrickFocus=BRK-05` — change **only** the Mercer corner commercial building to BRK-05; the rear shop, workshop and east office remain on their assigned candidate textures. This works with any exact **BRK-02…BRK-10** ID; invalid IDs and BRK-01 cannot override.
- `/game?gtdBrickTrial=0&gtdBrickField=0` — all photographic brick surfaces opt out to existing procedural fallback for diagnostic baseline.

**Note:** Query parameters do not dynamically update an already-running game. Reload to apply them. This branch's default-on preview field flag is experimental and must be changed or explicitly approved before any future production merge.

## Source and renderer constraints

- Exact owner-optimized WebPs reused from `public/assets/surfaces/brick/`; no image resizing, repacking or re-encoding. Candidate resolution = **1790 × 879**, BRK-01 = **1774 × 871**.
- Each candidate tile is assigned **1.485 metres horizontally** and `1.485 × 879/1790 ≈ 0.7293 metres vertically`. Identical physical area across all candidate styles isolates colour/texture contrasts from scale differences; BRK-01 remains at prior A/B values. All facade fragments use world-metres mapped consistently in each building's coordinates.
- Only `wall` primitives change. Storefront glazing, doors, window frames, metal and trim retain their original material and real geometry; collision handles and authored openings must match normal `planBuilding` output.
- Candidate walls temporarily bypass thin-instance box batching, as in MAT-001/002, to maintain per-wall physical UV alignment around windows.
- A scene-scoped **per-URL** Babylon WebP lease shares textures among any users of the same BRK surface and safely releases the image only after its last material subscriber is disposed. Failed image decoding/loading must retain opaque procedural walls, not hide geometry.
- The existing legacy BRK-01 `/brick-wall-image.webp` remains the authoritative deployed image URL on the two accepted buildings.
- This measures *a visual field trial*, not definitive performance/tiling correctness; BRK assets' perfect edge seamlessness has not yet been certified.

## Resource estimates and experimental questions

The four additional candidates contribute **1,198,670 bytes** (~1.14 MiB) encoded total, beyond the 639,570-byte existing BRK-01 image. If all four are loaded simultaneously, decoded RGBA8 + an uncompressed full mip chain is approximately **8 MiB per candidate**, so approximately **32 MiB** extra texture storage before device-specific GPU format differences. This is an estimate, not measured VRAM or an FPS result. Keeping the same loaded scene in a browser does not necessarily release unreferenced textures until teardown.

Record measurements and witnesses for:
1. **Close:** brick sizes relative to Voight, mortar course alignment across windows, natural corners, 2×2/3×3 seams, sharpness at 1m/3m.
2. **Far:** repeating colour-pattern visibility and aliasing across street and at long building distance; light- versus dark-brick contrast.
3. **Lighting:** same building at noon, dusk and night; any overbright whitewash, baked highlights or charcoal crushing to flat black.
4. **Opening integrity:** glazing/frames, real entrance clearance, shutter, shop signs and roof trim unchanged; visual exterior-vs-interior side-face inheritance.
5. **Performance:** device/browser, quality tier, texture load time, stable and worst frame time or FPS, draw calls, VRAM estimates, mobile sharpness, freezes, fallback errors and reload churn.
6. **Comparison:** original procedural candidate-off view `gtdBrickField=0` vs enabled at same camera pose/time, plus one-by-one BRK-02…10 on identical Mercer commercial facade.

## Acceptance and stop rules

- Existing two accepted BRK-01 buildings must remain visually and functionally identical. No additional authored geometry changes or Rapier collider changes.
- All ten canonical BRK assets retain correct hash and source dimensions; no silent resampling.
- Unit tests must verify exact four allowlisted assignments, no inadvertent assignment to other buildings, BRK focus validation for all nine options, no geometry/window opening changes, physically scaled UVs and original accepted material isolation.
- Preview must pass TypeScript, targeted tests, full regression and build. Browser screenshots and mobile numbers are still owner acceptance gates, not claims from headless tests.
- **No work on WALL-02 timber or other eight families is initiated by this trial.**
- **No expansion or ambient traffic until earlier building-family and vehicle-physics gates are satisfied.**

## Report template

| ID | Daylight 1m/3m | Night 1m/3m | UV/seam | Window/door | Mobile clarity | Frame/load | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BRK-04 corner | pending | pending | pending | pending | pending | pending | research |
| BRK-10 shop | pending | pending | pending | pending | pending | pending | research |
| BRK-09 workshop | pending | pending | pending | pending | pending | pending | research |
| BRK-07 office | pending | pending | pending | pending | pending | pending | research |
| BRK-02,03,05,06,08 | compare via focus | compare via focus | pending | pending | pending | pending | research |

**Decision gate: OPEN.** Only the owner can accept individual candidate designs and authorize assignment/production promotion.
