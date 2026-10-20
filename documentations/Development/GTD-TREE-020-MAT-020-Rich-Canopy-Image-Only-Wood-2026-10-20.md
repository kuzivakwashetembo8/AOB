# GTD-TREE-020 / MAT-020 — Rich 3D tree canopies and image-only wood facades

Date: 2026-10-20
Branch: `feat/optimized-rover-hilux-static-character-20261020`
Status: Isolated owner review; no merge to main
Predecessors: TREE-019/MAT-019/WORLD-019 (already partially on main); owner-approved OBS-103 optimized vehicle + static Mercer character

## Recovery analysis
Historical WORLD-019 source is already present on the accepted OBS-103 branch. `authored-leaves-019.ts` loads original `/GLBs/Nature/leaves.glb` once, then creates 10 source-sharing 3D spray groups per tree. `wood-exterior-cleanup-019.ts` removes some roof/door/foundation trim only on the two assigned wood-image buildings; window frames, sills, lintels, decorative pipes and other generated surrounds remain. No safe full historical patch that satisfies both new owner directives was found; extend these two existing modules rather than revert or merge closed branches.

## Changes
1. **WOOD / MAT-020**: every building with a wood-family image wall goes through one filter before Babylon geometry construction. Remove every nonstructural generated `trim` primitive including window frames, parapets, cornices, sills/lintels, roof edges, foundation/floor bands and door surrounds. Remove generated facade fixtures including downpipes/pipe collars. Keep brick and glass buildings untouched. Preserve image-based wall boxes and UV scale, windows and glass panes, doors/panels, metal handles, structural roof shells, collision and layout. No global editing of image texture files, road geometry, hero garage, or accepted Mercer models.
2. **TREE / TREE-020**: preserve 10 owner-authored GLB-based outer leaf sprays per tree and add exactly 6 inward lower sprays near the 5.05m straight-trunk tip, total 16 GLB source-sharing groups per tree. Lower sprays at local height 4.70–5.22m close the visible gap between branches/trunk and canopy; old outer spread remains unchanged. All 16 are deterministic using the original tree seed and generator version. No additional tree placements, GLB GETs, imported materials, foliage texture sources, trunks or colliders. Original 30 fallback cards remain hidden on successful GLB import, only shown on load failure.
3. **Acceptance baseline**: owner's new static `character.glb` remains standing on Mercer Street unanimated; optimized Rover (1,605,108B) and optimized Hilux (323,576B) stay in the active six-car scene; oversized Rover/Hilux originals are not reintroduced.

## Risk and acceptance gates
- One shared 2.07MB source GLB download remains; approximately 60% more tree spray *instances* than TREE-019. Additional mesh instances can raise draw calls/CPU/GPU pressure despite shared source geometry. Observe mobile and desktop FPS, memory, time to first frame, visual silhouettes.
- Verify every assigned wood-image building contains no trim / generated facade-detail meshes, but preserves original wall image material, structural roof and physical door/window openings.
- Verify 16 deterministic crown groups, lower inner overlap, 30 fallback cards, original trunk height and tree coordinates.
- Run complete TypeScript / Vitest / Vercel production-format build. Preview READY is not equivalent to visual acceptance.
- Visual checkpoint: compare close-up wood buildings, side-by-side tree crowns, accepted standing character and optimized Rover driving. Do **not** merge with `main` without explicit authorization.
