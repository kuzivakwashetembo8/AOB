# GRN-002 — Accepted source assets, image-only trial manifest

**Date:** 2026-10-14  
**Status:** Experiment, not production visual acceptance  
**Source:** User-committed WebP image blobs added to `main` in commit `68e21a459beb4f3a32e27e23da6bcba04737da6b`. Binary bytes reused without re-encoding, so quality is preserved while source files remain available on main.

| Semantic ID | New runtime path | Source main path | Blob SHA | Source bytes |
| --- | --- | --- | --- | --- |
| FOL-01 | `public/assets/vegetation/foliage-cluster-01.webp` | `public/assets/surfaces/leaves-foliage.webp` | `d2ab289ede20bbf0438090db32037b0b32278875` | 1,780,256 |
| GRS-01 | `public/assets/ground/carpet-grass-01.webp` | `public/assets/surfaces/grass-carpet.webp` | `675c18b4873f1113bb6f70806beec5d2232877b9` | 3,785,918 |

**Note:** Neither file was recompressed or modified in this branch. This is intentional: we do not silently alter the user-approved appearance. Image resolution, effective alpha core quality, exact tile seams and browser GPU memory are visual/runtime QA criteria, not accepted facts. Both WebP files are already significantly sized; PWA network cost must be checked before production.

- FOL-01: one original tree only with `gtdFoliageImgTrial=1`; all existing trees with `gtdFoliageImgTrial=all`. Shrubs stay procedural.
- GRS-01: all residual grass with `gtdGround001=1&gtdGrassImgTrial=1`. Original GROUND-004 procedural fallback otherwise.
- Both toggled: `gtdGround001=1&gtdFoliageImgTrial=all&gtdGrassImgTrial=1`.
- Foliage-card count, tree placement, existing buildings, roads and Rapier physics stay unchanged.
- Grass tile is initially 5 metres per source image; image is repeated, not stretched over entire map.
- This is an image-trial acceptance gate. If seams, opacity halos, texture brightness or asset loading fail, revert the corresponding toggle without discarding the other.

Source research: `documentations/Research/GTD-RND-GRN-001 Image-Based Foliage and Carpet Grass Realism Doctrine - 2026-10-14.md`
Implementation plan: `documentations/Development/GTD-RND-GRN-002 Foliage Cluster and Carpet Grass Image Trial Technical Plan - 2026-10-14.md`
