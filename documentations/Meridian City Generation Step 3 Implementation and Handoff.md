# Meridian City Generation — Step 3 Implementation and Handoff

Status: STEP 3 VISUAL REPRESENTATION FOUNDATION COMMITTED ON DEPENDENCY BRANCH; FULL CI/RENDER VALIDATION BLOCKED
Date: 2026-10-09
Working branch: `automation/meridian-step3-verified`
Parent: `automation/meridian-step2-verified` at `81efbb65ea4eef3c65dc858f31a647864629d380`
Step 1 dependency: `300b93258b0eb5094fcda046af61542164e2d54b`
Target branch: `main` (not merged)
Deployment: NONE

## Branch integrity

Read `documentations/For Overnight Schedules.md`, the five-step plan, the dynamic-building design, the First Light plan and the game-world SOT before implementation.

GitHub compare confirmed Step 2 was **12 commits ahead of main and zero behind**, containing Step 1 plus the Step 2 architectural plan and Babylon adapter. The Step 3 branch was created from the exact Step 2 tip rather than from stale `main`. After implementation, Step 3 was 17 commits ahead of `main`, zero behind, and five commits ahead of Step 2. No previous city-generation files were discarded.

**Step 4 must start from `automation/meridian-step3-verified` unless all three steps have safely reached main.** Do not regenerate or overwrite the Step 1/2 foundations.

## Implemented

| File | Responsibility |
| --- | --- |
| `representation-materials.ts` | Stable material family catalog for brick, concrete, painted block, garage block, industrial metal, plaster, storefront glass, institutional concrete, asphalt and sidewalk paving; deterministic seeded, quantized tint recipes; weathering, grime, patching and UV metadata. |
| `material-library.ts` | Babylon StandardMaterial cache scoped to a scene, keyed by family/role/tint bucket; explicit leases and disposal; caller-owned sharing across buildings. |
| `facade-details.ts` | Pure seeded facade-detail planner with reusable sill, mullion, shutter, awning, vent, AC unit, utility box and downpipe templates; signage/grime/patch/graffiti decal-hook contract. |
| `representation-lod.ts` | Four visual tiers (near, medium, far, skyline), per-profile metre thresholds, 12% hysteresis and visual-only window tier policy. |
| `building-generator.ts` | Optional facade details, shared material library, thin-instance batching by role/render class, mass-proxy LOD switching and explicit resource disposal; preserves the Step 2 default output and existing API. |
| `index.ts` | Public exports for Step 3. |
| `src/test/representation-generation.test.ts` | Regression tests for recipes, catalogs, deterministic details, LOD/hysteresis, physical-window semantics, shared material leases, thin instances, proxy switching and disposal. |
| `src/game/world-generation/README.md` | Usage example, ownership rules, rendering boundaries and limitations. |
| `.github/workflows/meridian-generation-verify.yml` | Extended non-deploying verification workflow to include the Step 3 branch. |

### Materials

`materialRecipe(spec, generatorVersion, role)` uses the Step 1 feature-keyed PRNG. Tint is quantized into eight buckets so multiple buildings can share GPU materials; weathering, grime, patching and UV values remain per-building deterministic metadata for future texture/atlas and decal work. A caller may pass `BuildingMaterialLibrary` to multiple `generateBuilding` calls and must dispose it after disposing those buildings. Supplied materials are never disposed by the generator.

The current Babylon adapter uses `StandardMaterial`, not a complete physically based texture system. Metal/roughness response is approximated through specular parameters. The color palette is original GTD data.

### Details and windows

Optional `planFacadeDetails` returns extra visual box primitives and decal hooks. Detail budgets vary by LOD profile and do not change authored openings, wall segmentation or collision. Existing Step 2 physical and interior-linked windows retain their cut-through semantics. `windowRepresentation` selects a visual tier only and **does not** turn a decorative pane into a traversable aperture or modify physics.

Decal hooks are descriptive metadata. There is no authored atlas, projected decal renderer, texture offset binding or automatic signage typography in this step.

### LOD and batching

`generateBuilding` accepts optional:

- `materialLibrary` — share materials across buildings;
- `enableFacadeDetails` — add deterministic detail primitives;
- `batchingMode: "individual" | "thin-instances"` — group compatible primitives by role and render class;
- `initialDistance` — initial representation selection.

The returned `GeneratedBuilding` exposes `representationTier`, `setRepresentationTier` and `setRepresentationDistance`. Near and medium retain structural geometry; medium suppresses secondary details/fixtures. Far and skyline use one box proxy per mass, created lazily. Thin instances reduce mesh/draw-call count for repeated boxes; their individual primitive IDs are preserved as batch metadata, not as pickable meshes.

LOD **does not** currently free the hidden near-shell geometry. Streaming (Step 5) must own loading/unloading, and visual crossfades/transition quality require browser review. No measured GPU timings or FPS claims are made.

### First Light compatibility

The live `src/game/world/first-light-world.ts`, Rapier physics, camera blockers and player runtime were **not modified**. Generated building rendering remains a separate preview-capable adapter. Existing Step 2 defaults remain compatible: when details and batching are not requested, the renderer still creates one mesh per architectural primitive and no mass proxies until a distant tier is requested. This intentionally avoids silently changing the live world.

## Verification evidence

- GitHub branch ancestry was checked: Step 3 descends directly from the Step 2 tip, which contains Step 1.
- GitHub comparison confirms only Step 3 modules/tests/docs/workflow changed relative to Step 2; no First Light runtime or physics files were changed.
- Modified source was fetched back and inspected for imports/exports, nonempty content, matching type contracts and conflict markers.
- Deterministic test cases and Babylon NullEngine lifecycle tests were committed.
- The non-deploying GitHub Actions verification workflow **failed before executing any listed job steps**. The run for `66382bb7e7095c081b5acc6a0866722fea3ea551` is at https://github.com/interlinkglobal/GTD/actions/runs/37868276286; its job reports no runner name and an empty step list. The next run after the facade-detail refinement also failed with no executed steps: https://github.com/interlinkglobal/GTD/actions/runs/37868365190. This is an execution/runner-level blocker, **not evidence that typecheck, tests or build passed or failed**.
- Local repository dependencies are unavailable in the sandbox and direct GitHub cloning is blocked by network DNS. Therefore `npx tsc --noEmit`, `npm test`, `npm run build`, lint, Babylon browser preview and measured performance were **not executed** in this run.

Do not merge on the assumption that authored tests have passed. Restore a working runner or obtain a full local checkout with dependencies, then run typecheck, tests and build; fix any failures, perform a First Light side-by-side visual comparison and profile mesh/draw-call counts before acceptance.

## Known limitations / remaining work

1. Material weathering/grime/patching/UV hooks are not yet bound to actual facade atlases or decals; only tint variation is rendered.
2. Window tiers have visual selection policy, but no atlas-based far windows or true per-window geometric LOD swap. Far/skyline use simple mass proxies, which hide apertures and may pop.
3. Geometry-only details are deliberately sparse and may need authored clearance constraints around doors, corners and service access.
4. Thin instances improve grouping but remove per-primitive mesh picking; Step 4 must derive collision, interaction and camera blockers from the semantic plan, not visual mesh names.
5. The hidden near geometry stays allocated after switching to far proxies. Block streaming and resource budgets belong to Step 5.
6. No live First Light scene migration, measured performance, shadow review or visual parity is claimed.
7. The Step 1/2/3 dependency chain remains on a branch rather than `main`. Merge is blocked on real CI and visual review.

## Step 4 handoff

Use `automation/meridian-step3-verified` as the dependency branch. Preserve `planBuilding`, `GeneratedBuildingPlan`, authored opening IDs, ground-centre/yaw coordinates, `BuildingMaterialLibrary` ownership, and LOD-independent physical semantics. Build Rapier collision, camera blockers, interaction anchors and portals from the architectural plan rather than individual thin-instanced render meshes. Do not assume far proxies represent physical geometry. Continue to leave the live First Light renderer unchanged until collision and camera parity are demonstrated.

No automatic deployment.
