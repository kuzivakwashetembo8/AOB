# Meridian City Generation — Step 2 Implementation and Handoff

Status: ARCHITECTURAL PLAN + BABYLON VISUAL ADAPTER COMMITTED ON DEPENDENCY BRANCH; FULL RUNTIME/CI VALIDATION PENDING  
Date: 2026-10-09  
Dependency: Step 1 commit `300b93258b0eb5094fcda046af61542164e2d54b`  
Working branch: `automation/meridian-step2-verified`  
Target branch: `main`  
No deployment performed.

## Source-of-truth and branch integrity

Read `documentations/For Overnight Schedules.md` and the five-step plan first. Step 1 was not on `main` at the start of this run. GitHub compare verified that `automation/meridian-step1-verified` was exactly one commit ahead of `main`, with no commits behind, and contained the full Step 1 schema/defaults/validation/First Light inventory.

Step 2 was branched directly from that verified Step 1 commit. No Step 1 files were discarded or replaced. The branch retains both steps in its ancestry.

`main` was intentionally not advanced without a verified build/runtime review. The previous automation had been unable to move its Step 1 commit to `main`; the dependency is therefore preserved on this branch for the next agent. A fast-forward/PR review is required before the project can treat `main` as having Steps 1 and 2. Do not recreate Step 1 from scratch.

## Implemented

| File | Implementation |
| --- | --- |
| `src/game/world-generation/architecture-templates.ts` | Stable template IDs and default frame/pane/roof-fixture dimensions for windows, doors, storefronts, garage/loading bays, HVAC, vents, antenna, water tank and roof-access hut. |
| `src/game/world-generation/architecture-plan.ts` | Pure deterministic `planBuilding(spec, generatorVersion)` with massing, floor elevations, facade bays, archetype-aware grammar, authored/auto openings, wall segmentation, roof pieces and world-space footprint. |
| `src/game/world-generation/building-generator.ts` | Babylon `generateBuilding(scene, physics, spec, context)` adapter, structured `GeneratedBuilding` result, owned-material management, mesh metadata and explicit disposal. |
| `src/game/world-generation/index.ts` | Public exports for the Step 2 API, retaining Step 1 exports. |
| `src/game/world-generation/README.md` | Usage, coordinate conventions, Step 2 boundaries. |
| `src/test/architecture-generation.test.ts` | Regression cases for ten First Light records, determinism, physical garage/window cutouts, no auto/authored overlap, massing families, roofs, parameter variation, Babylon NullEngine disposal. |
| `.github/workflows/meridian-generation-verify.yml` | Branch-only non-deploying typecheck/test/build workflow. |

### Massing

Supports `slab`, `row`, `warehouse`, `corner`, `podium`, and `podium-tower`. Podium forms produce two stacked masses when multiple floors exist, with smaller upper footprints. Every plan records floors, mass extents, roof elevations and footprint coordinates. The upper masses remain centered in this first implementation; offset towers are a future authored extension.

### Facade grammar

Each mass is subdivided by facade and floor into corner-pier-safe, evenly spaced bays. Archetype and floor determine the role: wall, window, storefront, service, entrance or garage. Ground-floor commercial/mixed-use/hospitality fronts can receive decorative storefront panels; warehouses and garages remain service-oriented. Auto windows use stable feature-keyed variation, never uncontrolled randomness.

Authored openings from Step 1 are authoritative. Automatic facade openings avoid those authored openings and do not create unregistered traversable entrances. Template IDs allow Step 3 to replace cheap visuals without changing spatial semantics.

### Real opening segmentation

Walls are segmented into horizontal strips and disjoint spans around `cutThrough` openings. This avoids runtime CSG and prevents a solid wall box from filling a garage door or physical window aperture. Garage/loading/pedestrian authored openings remain open; physical/interior-linked windows get glazing. Decorative/recessed windows are currently surface panels, not physical cutouts.

### Roofs

Supports flat, parapet, pitched and shed roofs with deterministic lightweight fixture placement. Roof pieces are generated as reusable primitive descriptions, not hand-authored meshes.

### Renderer boundary

The pure plan contains no Babylon, Rapier or React dependency. The Babylon adapter instantiates local-space boxes under a transform root using the Step 1 ground-centre/yaw convention. It exposes the plan, root, meshes and a `dispose()` method. Materials supplied by callers remain caller-owned; fallback materials are owned/disposed by the generated building.

The `physics` argument is deliberately unused in Step 2. Rapier collision, camera blockers, interior portals and navmesh semantics belong to Step 4. **Do not mistake visual openings for proven physical traversal.**

## Verification evidence and limits

Verified directly against GitHub:
- The Step 2 branch descends from the exact verified Step 1 commit.
- All added files were fetched back and inspected for expected imports/exports, conflict markers and nonempty content.
- `main` remained behind the working branch and did not lose any Step 1 dependency.
- The existing `src/game/world/first-light-world.ts` and physics/runtime modules were not modified.
- A dedicated test suite and non-deploying CI workflow were committed.

**Not verified in this automation environment:**
- Actual `npm install`, `npx tsc --noEmit`, `npm test`, `npm run build`, lint and browser runtime visual parity. The local sandbox has TypeScript but not the repository dependency installation, and no GitHub status checks were reported at the time of handoff.
- The tests are authored, not claimed as passed.
- The generated shell is not yet wired into the live First Light scene, by design.
- Mesh counts, performance, shadow behavior, LOD transitions and material visual quality are not yet profiled.

Before merging, execute the real repository checks and a separate Babylon preview comparison of First Light. Resolve any TypeScript or runtime issues found. Do not deploy automatically.

## Known technical limitations

- Geometry is a first-pass box-based shell; complex silhouettes, stepped setbacks, true roof gables, balcony volumes and custom mass offsets are not yet modeled.
- A decorative storefront is visual, not automatically an accessible entrance. Authored entrances are required for physical semantics.
- Some decorative/recessed windows are surface panels; selective real recess depth and richer materials belong to Step 3.
- Physical openings are segmented geometrically but do not yet have corresponding Rapier/camera blocker contracts.
- Rendering currently creates individual boxes; batching, instancing, shared material catalogs and distance-aware representation belong to Step 3.
- Generated facade bays do not currently reserve specialized stairwell, lift-core or signage regions.
- A cross-mass authored opening must fit wholly on one mass; the planner rejects openings spanning a podium/tower transition.
- Authored First Light data is an approximate semantic inventory; pixel/mesh parity with bespoke First Light art has not been demonstrated.

## Next agent: Schedule 3

**Start from `automation/meridian-step2-verified` unless `main` has safely incorporated both Step 1 and Step 2.** Inspect ancestry and repository state before editing.

Use `planBuilding` and `generateBuilding` as the structural API. Implement shared materials, controlled variation, facade details, window representation tiers, batching/instancing and LOD without breaking stable building IDs, authored openings, local/world coordinate conventions or the segmentation contract. Keep the live First Light renderer unchanged until a visually and physically verified replacement is ready.

Before reporting completion, run the real checks if possible, preserve a coherent branch/commit handoff, state the exact merge/deployment status and do not claim parity without an actual scene comparison.
