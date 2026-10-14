# GTD-RND-MAT-010 — Six-Family Asset Audit and Canonical File Migration
Date: 2026-10-14. Status: asset reorganization and planning; not a visual material release.
Base: main@709849884b29561f595c36c3aafc240d6fc0fe57.

## Verified inventory
Six material families (BRK, WOOD, GLS, STN, MET, RND) with 10 numbered images each were found on main. The 60 numbered entries represent 59 unique Git blobs because RND-01 and RND-10 are exact duplicates.

- WALL-01 brick: 10 already registered and stored in public/assets/surfaces/brick; approved anchor BRK-01 retained, with public/brick-wall-image.webp compatibility.
- WALL-02 wood: 10 already registered at public/assets/surfaces/wood; existing Wood N.webp root submissions have the same Git blob SHAs as canonical copies. Keep legacy root copies for now because existing registry and documents reference those source paths.
- WALL-03 glass: 10 already registered at public/assets/surfaces/glass; existing Glass N.webp root submissions have matching blob SHAs. Keep the originals as backward-compatible source references. Current GLS set comprises stripless opaque glass-look colourways, NOT the entire conceptual optical taxonomy.
- WALL-04 stone: 10 original Stone N.webp images relocated unmodified to public/assets/surfaces/stone with stn-NN-target-slug.webp names and a manifest.
- WALL-05 metal: 10 original Metal N.webp images relocated unmodified to public/assets/surfaces/metal with met-NN-target-slug.webp names and a manifest.
- WALL-06 render: 10 original RND N.webp images relocated unmodified to public/assets/surfaces/render with rnd-NN-target-slug.webp names and a manifest.

## Binary integrity and critical exceptions
Git tree entries use the exact source Git blob SHAs; no image generation, resampling, resizing or recompression occurred. Each moved source root path is removed in the same Git tree; each destination SHA is unchanged.
Important: RND 1.webp and RND 10.webp share Git blob 9067003ac1e1d29949672afc73da301246fedb13 (610166 bytes). The RND-10 canonical path is preserved solely for predictable identity, flagged BLOCKED_DUPLICATE_OF_RND_01. Do not assign it to a building as earth-pigmented finish until the owner replaces it with an actual distinct asset.

The filename slug describes a catalogue TARGET, not guaranteed image content. Particularly:
- The wood owner-approved WOOD-N family descriptors supersede older illustrative TIM-N concepts from MAT-004.
- Metal assets intentionally have no baked strips/physical ribs. Corrugations, pressed profiles, seams, perforated screens and real open mesh from the conceptual MET taxonomy must be separately modeled; do not infer them from image filenames.
- Existing glass colorways are not literal transparent optical GLS taxonomy variants.
- Neither actual pixel dimensions nor seamless edges of STN/MET/RND are independently verified by the GitHub binary metadata endpoint. All are asset-committed-unverified with explicit QA pending.

## No automatic runtime activation
Existing typed runtime catalogues cover brick, wood and glass only. The new three manifests are inventory/provenance records, not Babylon material plugins, render selections or new scene content. No gameplay, camera, physics, road, ground or world changes were made. These asset paths are not in the PWA pre-cache by virtue of existence alone.

## Validation required before overnight activation
1. Verify actual pixel dimensions, widths/heights, colour-space, original source provenance and rights.
2. Produce 2x2 and 3x3 material tiling visual samples; inspect all four edges at full-scale and minified; calibrate metre-per-tile UV settings.
3. Compare each source image to its intended catalogue material ID, especially metal with stripless appearance and the RND-10 duplicate.
4. Create typed STN/MET/RND catalogues and opt-in previews only with owner-selected accepted types, no uniform mass assignment.
5. Confirm baseline BRK-01, existing wood low-rise examples and blue/grey glass tower appearances remain unchanged; owner visually approves before promotion.

Release state: organisation completed; material visual acceptance and physical South Ward expansion remain separate, outstanding gates.
