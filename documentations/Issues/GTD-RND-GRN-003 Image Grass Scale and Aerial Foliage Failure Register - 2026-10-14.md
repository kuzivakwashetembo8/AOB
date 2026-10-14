# GTD-RND-GRN-003 — Image Grass Scale and Aerial Foliage Failure Register

**Date:** 2026-10-14  
**Status:** Owner-observed GRN-002 preview limitations / corrective experiment authorized  
**Source trial:** `feat/grn002-image-foliage-carpet-grass-20261014`, Vercel preview showing `?gtdGround001=1&gtdFoliageImgTrial=all&gtdGrassImgTrial=1`  
**Corrective branch:** `fix/grn003-grass-tiles-aerial-foliage-20261014`  
**Governance:** Both failures can be studied independently; do not merge or promote to production without owner visual acceptance.

## 1. Evidenced success

- The committed image assets load sufficiently for foliage and grass to appear in the combined preview.
- Existing character, buildings, road and ground silhouettes remain intact in the owner's aerial screenshot.
- Image foliage is **visually convincing from ground level** according to the owner. It should be preserved in ground/near-ground camera mode.
- GROUND-004 grass-only geometry remains the preferred, approved procedural fallback. The owner has not accepted the GRN-002 image grass.

## 2. F-01 — Image-based grass has the wrong visual scale

**Owner observation:** Large sharp photographic details dominate open land. Instead of dense, fine maintained carpet-grass microdetail, the plane looks like an enlarged photographic crop or a coarse leafy surface. The photo does not convincingly read as many small repeated material tiles.

**What the code attempted:** `grassMetricRepeat(5)` configures 32×26 repetitions across a 160×130-metre flat ground. The ground itself already has four vertices and normalized 0–1 UVs, and the photo texture sets `uScale`, `vScale` and REPEAT wrapping after load.

**What has NOT been proven:** The screenshot alone cannot establish whether the sampler ignored UV repeats or whether **5 m per tile is simply far too large** for the photographic detail inside the source image. It cannot prove the texture is seamless. The current rendered result is unacceptable, regardless of the cause.

**Single-variable patch:** Preserve the same owner-committed WebP, flat mesh, collider, building and roads. Make the image repeat as much smaller metric tiles (explicit **3 m, 2 m and 1 m** trials), record expected U/V repeat counts, verify actual texture transforms after load and test aerial/ground-level perspectives. The actual image must be sampled at its original aspect ratio, not distorted to `object-fit: cover` across South Ward. Use hardware texture wrapping, not thousands of additional ground meshes.

**Required acceptance:** Visually credible dense short-cut carpet grass, fine scale, no dominating macro clumps, visible seams, checkerboards or distance shimmer. If all three fail, revert the image material independently to **GROUND-004 procedural carpet grass**. Do not introduce extra grass geometry, new assets, shader noise or multiple grass species as an unapproved rescue.

## 3. F-02 — Tree photo foliage collapses under aerial inspection

**Owner observation:** The same leaf-cluster cards that look realistic at pedestrian height are exposed as crisscrossed 2D pictures when viewed from above. Four-way oriented planar foliage is not a convincing aerial crown.

**Source mechanism:** Current trees retain 30 intersecting planar cards in 10 clusters. The GRN-002 image is one highly realistic cluster reused on those cards. A better image cannot remove the planar geometry silhouette seen from the flight camera.

**Authorized patch:** Retain the original cards and image material for near-ground observation. Add a separate **real 3D, deterministic, low-poly volumetric canopy representation** for aerial inspection, built from modest interlocking lobes around existing crown centres. Switch representations using the **actual camera position relative to each crown and downward viewing angle**, NOT merely whether Voight pressed flight. The current procedural card art may be retained as a fallback material, but switching from photo cards to merely another flat-image card material will not satisfy a truly volumetric aerial objective.

**Transition requirement:** Use two thresholds/hysteresis to avoid flickering at the camera changeover. No duplicate simultaneous alpha drawing, no new tree positioning, no physics/collider edits, no independently simulated leaves or new tree species. Preserve tree and shrub independent material ownership. Record near-ground, intermediate and overhead screenshots and device frame time to evaluate whether true 3D lobes provide better silhouettes without a large performance regression.

**Important limitation:** A lobe prototype is not a finished hyper-realistic organic tree. If its simplified silhouette also fails realism, report the outcome rather than add unapproved branches, textures or complex models.

## 4. Acceptance/rollback matrix

| Experiment | Keep fixed | Test | Rollback |
| --- | --- | --- | --- |
| GRN-003-G | Current GROUND-004 land-use/collider and committed single carpet image | Different metre-scale repeats (3, 2, 1); seam and close-to-flight quality | Switch photo grass OFF; original procedural GRN-01 |
| GRN-003-T | Tree planting, trunk, bark, 30 photo cards/tree, shrubs | Camera-conditioned material/representation change with **volumetric aerial geometry** | Switch hybrid OFF; original photo-only or fully procedural canopy |
| Combined | Accepted results of preceding isolated tests | Day/night desktop and Android landscape, flight movement | Independent photo grass/tree flags |

## 5. Changes explicitly excluded

No new streets, parking, pavement, water, land-use categories, foliage atlases, photo processing, tree population/distribution, collision changes, new world regions, increased night ambient fill, production deployment, or automatic merge. Source WebPs remain unchanged. GROUND-004 stays the rollback standard for failed grass-image experiments.

**Decision state:** Two corrective experiments authorized by the owner, pending actual visual acceptance from a new preview. No implementation is accepted merely because TypeScript, Vitest or Vercel report success.
