# Meridian City Generation — Step 4 Implementation and Handoff

Status: STEP 4 INTERACTION FOUNDATION COMMITTED ON DEPENDENCY BRANCH; FULL CI AND PLAYTEST VALIDATION PENDING  
Date: 2026-10-09  
Working branch: `automation/meridian-step4-verified`  
Parent: `automation/meridian-step3-verified` at `630d4760c19501b235dddf4afee0e0ffd11756ed`  
Step 1 dependency: `300b93258b0eb5094fcda046af61542164e2d54b`  
Target: `main` after verified checks and review  
Deployment: NONE

## Source-of-truth and dependency integrity

Read `documentations/For Overnight Schedules.md`, the five-step development plan, the dynamic building algorithm, First Light implementation plan, and game-world technical SOT before making changes.

GitHub confirmed `main` was still at `2828fc8236791bff427660b72c18090b8f155932`. Step 1, Step 2 and Step 3 were present in successive verified dependency branches, with Step 3 at `630d4760c19501b235dddf4afee0e0ffd11756ed`. The Step 4 branch was created directly from that commit. No previous generation work was restarted or discarded.

## Implemented

| File | Responsibility |
| --- | --- |
| `src/game/world-generation/interaction-plan.ts` | Pure deterministic collision-box planning, physical-window pane identification, semantic camera blocker boxes, authored and derived entrance anchors, ground-floor portals, shallow/cell interior metadata, bounds, addresses and location IDs. |
| `src/game/world-generation/rapier-adapter.ts` | Optional compound fixed-body registration using local cuboid colliders and the building root yaw; explicit collision deactivation. |
| `src/game/world-generation/building-generator.ts` | Optional Rapier registration, invisible ray-pickable Babylon camera blocker proxies, closed-door visual panels, structured physical outputs and independent LOD behavior. |
| `src/game/world-generation/index.ts` | Exports for the new Step 4 planning and Rapier APIs. |
| `src/test/building-interaction.test.ts` | Deterministic contract, garage portal, physical glazing, camera transparency, sealed doors, shallow interiors, Babylon ray picking, Rapier integration and LOD invariance regressions. |

The existing `src/game/world/first-light-world.ts`, `src/game/physics/rapier-world.ts`, and `src/game/core/gtd-runtime.ts` remain unchanged. This is an opt-in generated-building adapter, not a live First Light replacement.

## Physical semantics

Collision derives from `GeneratedBuildingPlan` primitives, not render meshes. Wall segmentation preserves authored garage openings and physical-window apertures. Transparent glass panes receive thin Rapier colliders but no camera blocker. Structural walls, roofs, parapets and sealed entrance panels receive camera blocker proxies when enabled. Camera blockers are Babylon meshes with `metadata.cameraBlocker = true`, `isPickable = true`, and zero visual visibility; they remain independent of visual LOD switching.

Simple-shell exterior-only buildings without physical apertures use one solid mass collider per mass. Buildings with apertures or accessible interiors use segmented structural colliders. The `detailed-interior` mode currently shares the structural proxy foundation; detailed mission-room geometry remains future work.

The adapter groups generated colliders under one Rapier fixed body, positioned and yaw-rotated like the Babylon building root. Each primitive collider has its own local translation and optional roof slope rotation.

## Entrances, portals and interiors

Authored physical door, garage, storefront and loading openings can expose stable `InteractionAnchor` and `InteriorPortal` records. Portal records contain world-space exterior/interior points, facing, width, height, building ID, opening ID and interior ID. Authored anchor IDs remain stable; generated IDs are derived from building/opening identity.

`none`: no traversable cell; authored door apertures receive physical closure panels when physics is attached.  
`shallow`: bounded ground-floor front-facing access, with a rear partition.  
`cell`: one ground-floor accessible cell behind valid physical entrances.

The First Light garage's authored `vehicle-entry` anchor and `vehicle-bay` opening resolve to the same portal. Its two rear windows remain physical glass and camera-transparent. Nonphysical generated storefront panels do not become entrances.

Spatial metadata exposes stable building ID, district, neighborhood, block, lot, name/address when present, origin, yaw, world AABB, footprint and absolute floor elevations. These outputs are intended for future missions, NPC navigation, dispatch, map systems and save state.

## Verification and limitations

The branch preserves the Step 1→2→3 ancestry. Source was written to GitHub and fetched back for manual import/API inspection. Regression tests have been authored, but a successful test/build result has **not** been established in this automation environment.

Previous Step 3 GitHub Actions runs failed before runner steps executed; those failures are not evidence that TypeScript, Vitest or Vite passed or failed. Direct GitHub clone and dependency installation are unavailable in the local sandbox. Before merge, run:

```sh
npm install --no-audit --no-fund
npx tsc --noEmit
npm test
npm run build
```

Then perform a real Babylon/Rapier playtest of the generated garage entrance, window collisions and camera rays, compare with bespoke First Light, and profile collider/blocker counts. Do not claim full runtime parity until this is done.

### Known incomplete work

1. Rapier `dispose()` currently **deactivates** the compound rigid body but leaves its allocation in the physics world until world teardown. This prevents active collision after disposal but is not leak-free repeated block streaming. Step 5 must implement safe full reclamation before repeated load/unload.
2. There is no live First Light migration, mission/UI prompt binding, NPC navmesh, door animation, multi-room interior, stairwell or upper-floor traversal.
3. Shallow interiors are front-facing ground-floor cells only; other authored apertures are sealed when not traversable.
4. Camera blocker geometry mirrors structural wall segments, which can be costly on tall buildings; batching/aggregation and runtime profiling remain necessary.
5. The generated garage is an architectural approximation, not a visually verified replacement for the hand-authored hero garage.
6. The Step 4 branch remains ahead of `main` and should not be merged before real checks and visual review. No deployment was performed.

## Step 5 handoff

Start from `automation/meridian-step4-verified` unless the entire Step 1–4 chain has safely reached `main`. Preserve all stable IDs, building/world transforms, authored openings, physical-glass behavior, portals, and independent LOD/physics semantics. Implement roads, lots, composition and streaming using these APIs, but **do not enable repeated load/unload** until the Rapier allocation lifecycle is corrected and tested. Keep the live First Light scene unchanged until side-by-side parity is demonstrated.

The intended player experience is a city where visible walls, windows, entrances and traversable spaces agree with the physical simulation.
