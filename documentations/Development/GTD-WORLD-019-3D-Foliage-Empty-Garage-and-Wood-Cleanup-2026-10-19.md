# GTD-WORLD-019 — authored three-dimensional foliage, empty spawn garage and timber-surround cleanup

Date: 2026-10-19
Parent: LOAD-062 review branch `fix/load062-recover-transient-glb-and-capture-failed-startup-20261019`
Scope: the **same existing review branch**, not a new/experimental city-center branch.
Status: implementation candidate, owner visual acceptance pending.

## 1. Authored 3D foliage

- **Authoritative latest asset:** `public/leaves.glb`, 2,074,384 bytes, Git blob `bae1b8731940915e7d55ebb399021058eaa1710c` from latest file commit `f86f7270d633ea6bcb63b6a6175e270bb307cc22` ("Realistic Leaves for City Central Trees", 2026-10-18). No editing, texture replacement or rasterization of the owner asset.
- Preserve accepted straight 5.05-m trunks, root flares and Rapier collision, and the deterministic TREE-PLACE-001 tree positions. All *authored* and *generated* trees use the same renderer.
- Load GLB once from `/leaves.glb`, then instantiate source-backed meshes/materials into **ten overlapping 3D foliage volumes per tree**, distributed along the previously accepted, seeded canopy centres (not ten downloads). Scale each copy uniformly using the actual 3D GLB bounding envelope. This creates a rounded, uneven crown without flattening the new 3D geometry into cards, and avoids separate materials/texture downloads per tree.
- Existing generated foliage cards are a **temporary fail-safe** while GLB is fetching. On successful source geometry instantiation disable them; on transport/parse failure keep accepted old visual instead of showing leafless trees. This optional aesthetic import does not block first playable amid the existing known >60s vehicle startup problem.
- Retain existing shrubs for now; user asked specifically for Meridian tree leaves. No new trees, geometry generated as pretend owner leaves, building materials or road changes.
- Runtime integration runs only in browser/WebGL; NullEngine tests intentionally retain old cards. Follow-up desktop/mobile visual proof is mandatory for source scale, canopy silhouette, leaf density, materials, memory, triangle load and shader compatibility.
- Performance risk: the original source is 2.07MB once on initial online fetch and many source-shared 3D canopy copies; memory/draw calls must be recorded before production approval. Offline installs are handled under OFFLINE-000–007, not this patch.

## 2. Spawn garage clearance

- The original procedural `hero-garage-interior.ts` placed workbench, tool cabinets, drawers, shelf, lockers, fridge, desk/chair/monitor, tool board, tires and ceiling lights. They are **all removed**.
- Keep only two structural, non-decorative meshes: plain concrete floor and interior-facing ceiling, so garage still renders as a believable enclosed, empty room and camera roof-hide logic still works. No hidden furniture or prop replacements.
- Remove the separate hard-coded furniture-box physics colliders and tire collisions from `generated-first-light-world.ts`. Preserve structural building collision, real door opening, spawn, and already accepted garage threshold contact. No invisible collisions from deleted fixtures.

## 3. Wood-surface residences: remove trim rather than texture

- Apply only to `sw-fl-west-support` (WOOD-01) and `sw-fl-rear-residential` (WOOD-03) when existing timber family exposure is active.
- Preserve the timber wall image material, existing physical UV tile scaling, all *wall* boxes, original windows, doors, massing, structural roof slabs and roof pitches. No glass-tower/brick-building changes.
- Remove **nonstructural separate timber-looking** roof/parapet perimeter surrounds, facade cornices, foundation/external floor bands, and door-frame bars around entrances. Door panels remain and handles stay visible as metal, not wood. Physical building shell, collision and door portals remain unchanged.
- This is an output/render-geometry policy, not a modification of the planning grammar or user-authored wood image files. Retain structural trim at windows not named in the request.

## 4. Gates

1. Test exact GLB SHA and nonempty VEC3 3D mesh primitives, exactly ten well-distributed canopy locations and unchanged deterministic plan/trunks. Do not claim actual GLB visual success based on metadata alone.
2. Verify empty garage via scene mesh inventory and absence of its prop-only collision additions. Confirm camera occlusion and doorway work.
3. Verify original wood wall textures, dimensions, roof enclosure and non-wood buildings unchanged, with target roof/door/exterior floor surround geometry absent.
4. Vercel build TypeScript + full Vitest + project deployment READY. Watch any failing preexisting garage assumptions; update test expectation to the new approved empty baseline rather than silently reinstating clutter.
5. Visual checkpoint: inspect a tree from road and aerial views; tree silhouettes should be volumetric, leaves not cartoon cards, material colors retained, FPS/mobile acceptable. Confirm garage empty without invisible obstructions and two wood residences have clean walls with roofs and door access intact.
6. Existing six vehicle source files, load error retry/diagnostic patch, BMW accepted seat, Lamborghini accepted direction, 10× South Ward roads and grass, Supabase production settings and 60s load contract remain unchanged.

No merge to `main` before explicit visual acceptance.
