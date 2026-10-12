# GTD-RND-MAT-003 — First Image-Derived Brick Surface: Production Acceptance and Mobile Verification

**Authority:** owner approval, 2026-10-13 (SAST)  
**Decision:** ACCEPTED — **first image-derived building design surface**, limited to two existing South Ward building IDs.  
**Verification:** desktop A/B visual inspection accepted for apartment A; garage B comparison introduced and production-approved for mobile verification; **mobile performance and visual acceptance still pending**.  
**Deployment target:** production `main`, `/game` **without any query parameter**.  
**Parent documents:** `GTD-RND-MAT-001` material research and `GTD-RND-MAT-002` per-building brick presets.  
**Implementation branch before promotion:** `feat/gtd-world-002-municipal-administration-20261012`.

## 1. Acceptance decision

The owner has explicitly authorized merging the latest Municipal Administration branch work to `main`, deploying for mobile verification, and removing the need for `?gtdBrickTrial=1`. The WebP brick image, applied to the **existing actual 3D building geometry**, is now the **first accepted design surface** for GTD. This upgrades the prior material **trial's deployment status**, but is **not** blanket approval to replace materials on every building or a new default photographic building-material policy.

The historic trial documentation remains evidence of the experiment at that point in time; its earlier "not yet accepted" states are superseded for the **specific accepted material and buildings** by this document. Broader photographic material families, facade photos, additional buildings, general-purpose PBR maps and offline-level certification remain out of scope.

## 2. Exact accepted scope

| Target | Building ID | Image file | Preset | Physical tile footprint |
|---|---|---|---|---|
| Mercer Street three-storey apartment | `sw-fl-south-apartment` | `/brick-wall-image.webp` | `compactA` | 1.350 × (1.350 × 871 / 1774) m |
| First Light hero garage | `sw-fl-garage` | `/brick-wall-image.webp` | `standardB` | 1.485 × (1.485 × 871 / 1774) m |

This reuses the owner-committed WebP, 1774 × 871px, ~640KB encoded, without changing or duplicating the underlying source. Garage bricks are 10% larger in physical appearance. The experimental `largeC` remains unavailable for runtime assignment. All other buildings retain the existing procedural visual materials.

## 3. Production activation behavior

- On `/game` (normal desktop/mobile load), `acceptedBrickSurfaceEnabled(new URLSearchParams()) === true`, therefore the two allowlisted buildings display the WebP brick surface automatically.
- On `/game?gtdBrickTrial=1`, the same accepted material behavior continues (backward-compatible historic experiment URL).
- On `/game?gtdBrickTrial=0`, the surface is explicitly disabled for **diagnostic A/B or emergency visual comparison only**, restoring prior procedural masonry on the two buildings. This opt-out does not gate normal rendering or add a player-facing setting.
- The material loader starts on a procedural fallback, then adopts the local same-origin WebP after image load. A failed transfer/decode preserves opaque procedural bricks rather than showing the homepage hero or hiding walls.
- Real window/door/garage opening geometry, Rapier colliders, authored garage entry, camera blockers and humanoid/vehicle controls remain governed by the existing building generator and physics implementation.
- The application still needs the network for initial streaming unless files are installed/cached by an independently validated offline subsystem; this decision does not certify offline gameplay.

## 4. Promotion and quality gates

1. Commit the default-on game policy and regression coverage on the existing experiment branch; preserve main's separately committed original source asset.
2. Verify the complete branch against the latest `main`: account for the owner-committed WebP and confirm that the PR is mergeable; do not force-push over independent main work.
3. Run TypeScript, focused MAT-001/002/003 + prior image-contamination tests, full repo tests and production build.
4. Merge reviewed branch through existing PR under explicit owner authorization; do not merge by blind ref replacement or use preview-only deployment as proof of production state.
5. Build and deploy the resulting **main commit** as production in Vercel. Confirm `READY` and production/main alias resolution; if aliases do not resolve or are protected, report the exact limitation.
6. Verify `/game` is accessible, the required WebP is included and delivered, and the runtime bundle selects **default-on** behavior; final gameplay visuals and mobile timings still require owner field inspection.
7. Record the merged commit, production deployment and observed limitations; do not claim field/mobile acceptance before user testing.

## 5. Mobile verification protocol

From the production URL, visit **`/game` with no query string**. Inspect both the apartment (A) and the garage (B), first during daylight, then at night. Confirm no visible textures popping to transparent or showing the homepage photograph; brick mortar courses, corners, windows and building geometry should remain intact. Walk close to both facades, drive the Ferrari, enter/explore the garage and exit; inspect near and far camera angles and touch responsiveness.

For performance evidence, report device/browser, selected render quality, first load time, perceived frame consistency, major freezes, texture load delay or console errors. Compare a repeat load and, if necessary, `?gtdBrickTrial=0` to isolate texture-load regressions. An unoptimized mobile result should prompt a measured fix rather than abandoning the accepted desktop material design.

## 6. Known limitations and rollback

- The same wall-role material applies to both faces of generated wall boxes. Some garage interior-facing wall surfaces may inherit the exterior brick image. That is a **known visual concern**, not a new physical wall, and is pending owner review.
- The WebP is a base-color appearance asset; shallow relief is largely baked into image pixels. Physical microdepth/normal and roughness maps have **not** been authorized.
- Bypassing thin-instance batching for the two assigned wall-role meshes may increase draw calls relative to procedural buildings. Measure mobile frame timing and GPU memory before expanding the surface system.
- The in-game `?gtdBrickTrial=0` diagnostic path is the immediate non-destructive visual rollback; a failed main deployment requires promotion of the last known-good deployment or a corrective/revert commit.
- New material families, larger `largeC`, all-building assignments and offline packs remain future directives with their own approval gates.

**Governance:** accepted as GTD's first specific design surface, **not** as automatic authorization for a citywide material migration. Mobile verification is the next checkpoint.
