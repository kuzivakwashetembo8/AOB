# GTD-FINCH-HQ-024 — Owner-directed floor-by-floor room production
## Build 3D Game Rooms → AppDeploy review → explicit acceptance → export

**Date:** 2026-11-06  
**Status:** ACTIVE WORKFLOW DIRECTIVE / FLOOR 3 FUNCTION REVIEW PENDING; NO ROOM EXPORT APPROVED  
**Parent floor-program proposal:** GTD-FINCH-HQ-023. The 53 purposes remain provisional until accepted individually.  
**Branch:** `feature/finch-floor53-room-skill-trial-20261106`  
**Owner directive:** Each room must be designed using Build 3D Game Rooms, rendered and reviewed through AppDeploy, accepted floor by floor, and **only then** exported for G.T.D integration. Do not automatically populate floors based on purpose metadata alone.

## 1. Scope and updated interpretation

- Prioritize a **curated, floor-by-floor approval workflow** over instantly procedurally furnishing all 53 floors in-game.
- Shared furniture/architectural grammars and deterministic room-planning tools can accelerate composition; each floor's authored output still requires its own interactive review and user acceptance.
- One floor can contain multiple rooms. A floor is not accepted unless its **complete room inventory**, physical circulation, fixtures, windows and key gameplay viewpoints are reviewed together.
- Use a separate AppDeploy review page per floor or a versioned, floor-selectable review portal that **does not overwrite an accepted review version**.
- Keep AppDeploy scene models independent from G.T.D. **No floor GLB/scene geometry or generated collisions are committed to the game until explicit owner acceptance of that floor.**
- Export a functionally complete floor module/GLB package, not a single rendered screenshot. The package must include exact floor ID, world-space transform, origin and axes, required opening schedule, room tags, collision map, material/texture manifest, fixture manifest, source evidence, hashes and performance results.
- The owner chooses subsequent floors; do not claim a floor accepted from an AppDeploy build success.
- Floor 53 remains the currently curated reference; carpet connection is still an unfinished polish task.

## 2. Per-floor review record

```json
{
  "floorId": "NH-04-06-L2:F03",
  "buildingId": "NH-04-06-L2",
  "floorIndex": 3,
  "purpose": "Cafe and casual meeting area",
  "roomIds": [
    "F03-ELEVATOR-LOBBY",
    "F03-CAFE-SEATING",
    "F03-SERVICE-COUNTER",
    "F03-BACK-PANTRY",
    "F03-MEETING-ROOM",
    "F03-WASHROOM-SERVICE"
  ],
  "stage": "function-preview",
  "reviewUrl": null,
  "functionApproved": false,
  "formApproved": false,
  "runtimeApproved": false,
  "exportApproved": false,
  "exportHash": null,
  "gameIntegrated": false
}
```

The above is a contract example; the AppDeploy URL and hashes must be filled from actual tool output, not inferred.

## 3. Production steps per floor

1. **Audit real geometry:** Use the existing 22.669 × 33.889 m tower footprint, per-floor height, elevator's real 5.1 × 5.1 m shaft, actual support plane, facade/window spans and third-person camera limits. No fake/covered elevator openings.
2. **Function:** Define purpose, mandatory rooms and circulation graph, room adjacency, usable floor area, hero, gameplay sightlines, palette, and performance budget. Create room-brief, opening schedule, furniture and fixture manifests. 2.4 m main arrival clearance as project target. Make a monochrome layout and accessible floor metadata.
3. **Interactive review (AppDeploy):** Show an actual 3D provisional room design from multiple camera stations, overhead/ceiling inspection, touch navigation, and true window/door openings. Label review status; do **not** expose any export or merge control before acceptance.
4. **Owner Function acceptance:** Owner confirms all rooms, layout, and openings for that floor or requests changes. Do not treat acceptance of only one room as full-floor approval.
5. **Form and asset production:** Compose accepted room geometry and furnishings in Blender where available, using procedural Babylon geometry when the accepted output is runtime-authored; optional external Meshy assets require separate reference review and spend authorization. Verify support contact, collisions, daylight, lamps and ceilings; no proxy-to-final substitution.
6. **Owner Form acceptance:** Only after geometry and render QA pass; no export until explicit approval.
7. **Runtime/export:** Produce optimized GLB or versioned Babylon room module plus manifest with collision and lighting data. Validate textures, scale, world origin, performance and scene-reload stability. The final runtime gate precedes publication/integration.
8. **Game preview:** Import floor to the G.T.D trial branch only after owner export authorization, visit by glass elevator, test third-person navigation, window visibility, props and memory. The owner performs the final gameplay acceptance.
9. **Next floor:** Retain evidence and final accepted version; proceed to another floor only after appropriate owner direction. Do not mass-convert unapproved AppDeploy proofs.

## 4. Floor 3 investigation (2026-11-06)

**Observed:** Player appears ankle/sub-shin submerged on Floor 3 and no tiles are visible in the submitted Android screenshot.

**Source inspection:** Existing Rapier static upper-floor ring slabs are authored at y = terrainY + 0.8 + (floor - 1) × floorHeight with half-height 0.07m. The prior visual tile system used 209 thin-instance segments grouped under nine materials. Its tests counted instances but did not prove visual rendering at a specific visited floor.

**Targeted revision:** Add four normal, non-colliding ground meshes for the currently occupied upper floor, aligned above the existing structural slab, in addition to distant-floor thin-instance decoration. Add a simulated Floor 3 test for overlay height and count. Do not add duplicate Rapier slabs or change Finch's elevator travel.

**Remaining uncertainty:** Screenshot alone does not establish whether the visual sinking is caused exclusively by the tile rendering gap, character/visual offset or an independent collision/support mismatch. Verify **both** feet contact and tile visibility in the next gameplay preview; retain as an open defect until user acceptance.

## 5. Floor 53 carpet (minor separate side quest)

The L arm previously turned before the first bookshelf bay and terminated ~0.6 m short of the actual bookcase front. Revised layout extends the vertical arm to intersect the horizontal runner **inside the first bookshelf span**, ending around 0.14 m before the cabinet face. Confirm at gameplay camera before closing.

## 6. Review checklist and acceptance

Reject a floor when there is inaccessible space, a decorative false doorway, props floating or clipping, overlapping service/visitor flows, blocked glass elevator landing, opaque city-facing windows, missing ceiling/lighting supports, misaligned floor heights, unbounded GPU or Rapier resource counts, or a changed original mission.

Floor 3 is first because it is the user's current observed test floor and the proposed café program is visually distinct from Finch's office. The stand-alone AppDeploy scene is a **Function review** only. All building exports, merges and new missions are withheld.

## 7. Next milestone

Deliver (a) Floor 3 gameplay fix preview for visual floor/carpets and (b) independent AppDeploy café Function preview. Present both URLs and request one-floor review. Do not represent this as completion of Floor 3 or authorization to populate the remaining floors.
