# GTD-TREE-022 — Retirement of source-backed 3D leaves (2026-10-20)

Status: accepted by owner for merge into main.

## Controlled comparison
The owner tested two sessions on the same desktop browser:
- Normal preview with leaves.glb still loading at 03:09, twelve operations ongoing, 48.18s of long tasks.
- Preview with gtdObsNoLeaves=1 reached gameplay; perceived lag materially improved.
This implicates the source-backed foliage import / 64-per-tree scene instantiation path as a meaningful cause of delay. It is not proof of the sole remaining bottleneck, and no FPS measurements were provided.

## Implementation
Remove public/GLBs/Nature/leaves.glb (2,074,384 bytes), remove obsolete authored-leaves-019.ts GLB import/instantiation module, and remove every runtime call and 3D foliage tracking variable. The existing deterministic thirty-card procedural canopy is now the normal/only foliage for each tree. Its roots, materials, generator seed, and tree layout remain unchanged. Neither the old GLB nor the 64-source-clone group is requested, decoded, or instantiated.

Preserve the accepted South Ward roads, planks removal, static Mercer character, optimized Range Rover and Hilux, and the OBS-105/106 diagnostic systems. The obsolete gtdObsNoLeaves switch has no effect and is intentionally removed.

## Verification
Regressions: source GLB absent; procedural canopy remains deterministic; existing world, vehicle, offline pack and TypeScript tests pass. Build and main merge to be recorded separately. Performance should be measured on main after rollout. The GLB still exists in historical Git commits but is absent from the current working tree and new offline package.
