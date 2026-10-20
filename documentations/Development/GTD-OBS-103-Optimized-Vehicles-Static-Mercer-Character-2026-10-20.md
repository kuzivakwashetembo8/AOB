# OBS-103 — Optimized Rover & Hilux; Static Mercer Character
Date: 2026-10-20
Status: Isolated preview implementation; NOT MERGED

## Source evidence
main at 0daacdc97a234caf6a632e3256b03c7499e9823a contained:
- Rover original: `public/GLBs/Cars/Range Rover Sports 2018 (.GLB).glb` (24,349,788 bytes).
- Rover optimized: `public/GLBs/Cars/Range Rover Sports 2018 (.GLB) (1).glb` (1,605,108 bytes).
- Toyota Hilux: `public/GLBs/Cars/toyota hilux 002.glb` (323,576 bytes). The earlier 17,214,188-byte version is ALREADY absent from the current tree; no second unoptimized file remained to delete.
- New owner character: `public/GLBs/character.glb` (12,197,104 bytes).

## Changes
1. Delete Rover's large original; preserve optimized Rover bytes as canonical filename with no duplicate `(1)` name. Record 1,605,108-byte size.
2. Retain already-replaced optimized Hilux and correct its source size metadata to 323,576 bytes. Do not resurrect older Hilux version from Git history.
3. Move `character.glb` to `public/GLBs/Characters/character.glb` with exact Git blob identity. No GLB may remain in the category root.
4. Render it on the southern Mercer Street sidewalk at x=-19.5, z=13.35, target height 1.78m, non-playable, static, with ALL imported and instantiated animation groups stopped. No idle/locomotion/update loop or physics collider. Preserve the existing Voight protagonist.
5. Include the static character in the world's visual-load readiness to prevent false startup success.
6. Keep current vehicle parking, fit, controls and other five model instances unchanged. No heavy-vehicle suspension from prior unmerged experimental branch is carried over.
7. Update offline inventory mandatory resources and regression checks.

## Limits and acceptance
The 323,576-byte optimized Hilux includes Draco/WebP compressed mesh geometry and no separately named wheel nodes; optimization alone is not proof that wheel rigging remains valid. Rover's original wheel pivot name-specific assertions do not transfer automatically to the new optimized asset. Check actual browser preview for visual and driving fidelity, and distinguish failure of GLB decoding, orientation, and wheel/seat rigging. Do not claim that asset-size optimization solves a rendering defect.

Acceptance: Vercel build, 396-test suite, wheel preprocessing and offline packaging successful, followed by visible in-browser verification of both vehicles and standing character on Mercer Street. No merge to main without explicit approval.
