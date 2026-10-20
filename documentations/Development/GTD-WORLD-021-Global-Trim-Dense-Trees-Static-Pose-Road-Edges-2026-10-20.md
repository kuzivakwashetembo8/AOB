# WORLD-021 — Global Plank Removal, Full Leaves Canopies, Relaxed Static Character, Boundary Roads
Date: 2026-10-20
Status: experimental, isolated in feat/optimized-rover-hilux-static-character-20261020. Main remains unchanged.
Baseline: accepted OBS-103 optimized Rover (1.61 MB), optimized Hilux (0.32 MB), standing unanimated Mercer character.

## Trigger
Owner inspected TREE-020/MAT-020 preview and observed persistent plank/window/roof surrounds on brick buildings, few sparse dark foliage groups, static character with horizontally raised arms and outbound roads ending within grasslands.

## Changes
- MAT-021: Apply the generated-trim filter to every generated building rather than only wood-textured buildings. Drop all decorative trim roles (window frames, sill/lintel, parapet/fascia) and generated facade ornamental primitives. Retain image/texture walls, required doors/handles, glass panes, roof solids and skyline metal 3D frameworks.
- TREE-021: Preserve owner-authored leaves.glb as the only source-backed tree crown; deterministic 64 sprays per tree (10 accepted outer + 54 inward/middle/upper layered), using a single GLB import and reusable material instances. Distinct circles at 4.64–6.28 metres bridge the trunk gap and cover outer canopy silhouettes. Original 30-card procedural plan remains fallback only.
- OBS-104: Disable all animations on the independent 12 MB character.glb and rotate matched upper arm bones in world-space, based on shoulder-to-forearm directions, toward a down-at-sides standing position. No walking, physics, or AI. Log bone names when no compatible bilateral armature is found. Character keeps original position and scale.
- WORLD-021: Extend ends of all six east-west roads to x=-250/+250 and all four north-south roads to z=-188/+228. Keep existing width, sidewalks, curbs, materials, connectivity, lane markings and terrain area; no buildings added.

## Acceptance checks
- No generated trim-role mesh visible on any of the ten buildings. Every building retains window glass and image walls, structurally physical roof and doors. On glass towers preserve actual skyline metal mullion geometry.
- Leaf crowns look full and connect to straight trunks without sparse twigs. Benchmark first-playable-frame and FPS because 64 groups raises GPU scene instance counts.
- Static Mercer character stands arms down, without playing animation.
- Roads terminate at the terrain edges and physically support traversal.
- Full TypeScript, regression, offline pack, Vercel preview READY. Acceptance requires owner visual inspection; do not merge main.
