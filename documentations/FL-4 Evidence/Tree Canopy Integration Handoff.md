# FL4-VIS-B02/B03 — Integration and Handoff

**Status: PARTIAL / NOT VISUALLY IMPLEMENTED.** The pure deterministic planner `src/game/world-generation/tree-canopy.ts` and focused Vitest tests are committed. Attempts to replace the existing 875-line `street-context-renderer.ts` via GitHub's file-update tool were rejected by connector safety checks. The renderer **still uses its original fixed ten clusters and 30 planes**, so the current game/preview does **not** show the proposed new crowns.

**Required bounded integration (pending):**

1. In `src/game/world-generation/street-context-renderer.ts`, import `planTreeCanopy` from `./tree-canopy`.
2. Add `generatorVersion: number` to `addTree` after `foliageMaterial`; pass `city.generatorVersion` at the existing `addTree(scene, item, meshes, nodes, trunk, foliage)` call.
3. Replace only the `const clusters = [...]` and `clusters.forEach(...)` block inside `addTree` with `const crown = planTreeCanopy(item, generatorVersion);` and a loop over `crown.cards`. For each card, create the existing double-sided plane using `placement.width/height`, `position.set(placement.x,y,z)`, `rotation.y=placement.yaw`, `rotation.x=placement.pitch`, parent to the existing root, and reuse `foliageMaterial`. Preserve `isPickable=false`, `receiveShadows=false`, naming, `meshes.push`, trunk/root flares and all physics code.
4. Keep exactly 30 planes per tree, no new texture/material/shader or collider. Verify before/after real draw calls, p50/p95 frame times, camera occlusion, sidewalks, facades and garage.
5. Capture matched small/large, near/far, daytime/nighttime screenshots and request user visual approval. Until then VIS-02 and FL4-VIS-B03 are **BLOCKED**.

**Task 3 boundary:** Continue the scheduled parked-car proxy scope; do not silently take over this blocked tree integration. Task 4 may reconcile it if code editing and performance evidence permit; task 5 must report the unclosed visual gate. Never label a successfully deployed but visually unchanged preview as a canopy improvement.
