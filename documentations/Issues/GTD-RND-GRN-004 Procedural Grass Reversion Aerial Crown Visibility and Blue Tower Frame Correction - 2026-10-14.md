# GTD-RND-GRN-004 — Grass Image Rejection, Aerial Crown Visibility and Blue Tower Frame Correction

**Date:** 2026-10-14  
**Status:** Implemented on GRN-003 experimental branch; awaiting owner visual acceptance  
**Branch:** `fix/grn003-grass-tiles-aerial-foliage-20261014`  
**Reference:** Owner's GRN-003 aerial screenshot, generated preview `gtd-9cvk6had4-interlinkglobaltech.vercel.app`.

## Owner decisions

1. **GRASS IMAGE REJECTED.** GRN-002 photographic grass and the GRN-003 3/2/1-metre photographic tile-scale corrections did not provide believable dense carpet grass. Stop experimenting with image grass for South Ward; restore the already accepted **procedurally generated GRN-01 ground**. Future grass image proposals are explicitly out of scope unless reopened by a separate owner directive.
2. **AERIAL FOLIAGE NEEDS REAL VOLUME.** The first GRN-003 image-to-procedural crown switch left some trunks apparently bare in aerial inspection. Preserve close-up image foliage; ensure the existing deterministic, code-generated 3D canopy becomes visible at flight height regardless of shallow camera pitch.
3. **BLUE GLASS TOWER SHOULD HAVE STRIPS.** The previous owner-approved MAT-009 blue/west `sw-fl-skyline-west` architectural mode was intentionally stripless. This directive supersedes that design decision. Add physical mullions and horizontal floor transoms in the glass façades, following the grey tower's structural geometry scheme, without baking strips into the glass asset.

## Diagnosis and changes

### GRN-004-G — photo grass removed from runtime

The previous code loaded `/assets/ground/carpet-grass-01.webp` and replaced the procedural GRN-01 material under `gtdGrassImgTrial`, even though `createGroundLandTexture` already provided the accepted continuous grass. That image is no longer used or shipped in this branch. The renderer always owns a procedural texture with the established GRN-01 planner; old `gtdGrassImgTrial` and `gtdGrassTile` URL parameters are inert and cannot reactivate image grass.

No terrain-mesh, ground collider, road, sidewalk, parking, water, camera or player change occurs. GRN-002/003 grass findings remain historical documentation only.

### GRN-004-T — correct aerial foliage handoff

Earlier `chooseCanopyPresentation` required **both** altitude above crown and a downward view vector above a threshold. During flight, the ArcRotate camera can be high but almost horizontal, leaving nearly edge-on photographic foliage cards visible and the 3D lobes inactive. The revised policy chooses the generated **ten-lobe 3D crown** whenever the camera rises sufficiently above the local canopy, independently of pitch. Near-ground observation returns to the owner-accepted realistic photographic cluster cards. A smaller transition band maintains hysteresis, avoiding oscillation around the crown top.

No foliage image asset replacement, tree population change, new tree collision, new tree species or changes to shrubs. Result is still a visual prototype: physical crown volume takes precedence at altitude, but the owner must evaluate its appearance and whether the rounded lobe morphology is acceptable.

### MAT-009-B — physical strips on the blue/west tower

The existing `planSkylineArchitecturalGeometry` used to generate physical mullions and transoms **only** for `sw-fl-skyline-east` (grey). It now generates the same depth-projecting architectural boxes for `sw-fl-skyline-west` (blue) when glass-wall imagery is active. Both towers retain original UVs, one image for each wall, massing, roofs, colliders and tiered podium geometry. Blue retains its pale metal crown while grey retains its dark metal crown. Strips use the established structural metal material rather than drawn image strokes.

Existing MAT-009 tests that explicitly required the blue tower to have **no** grid are revised to assert the new directive, while keeping the rest of the glass, roof and collider regression checks.

## Acceptance gates

- **Ground:** Procedural grass is the only residual-land material on the opt-in GROUND-004 view; no image-grass runtime load, repeat-scale option, exposure or extra ground draw.
- **Trees:** Ground view shows photo foliage. At flight height and both steep and shallow camera pitch, 3D crown geometry must be visible instead of bare trunks. Descending restores image foliage without oscillation or geometric leaks.
- **Blue tower:** Real 3D vertical strips and floor divisions are visible up close on all façades and both masses, while blue GLS-01 remains continuous and its pale cap survives. No extra windows or physics changes.
- **Regressions:** TypeScript, existing Vitest full suite, world lifecycle and production preview build pass. Visual acceptance requires real-browser desktop flight and landscape mobile inspection before merging to main.

## Governance

This is a **preview-only** patch on the already active experimental branch. No automatic production deployment, accepted glass-image modification, environment lighting adjustment or merge is authorized. If the aerial geometry or tower strip appearance is rejected, make a single isolated correction against this documented baseline.
