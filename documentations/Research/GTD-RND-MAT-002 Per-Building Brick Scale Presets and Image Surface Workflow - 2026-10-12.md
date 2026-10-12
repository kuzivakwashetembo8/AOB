# GTD-RND-MAT-002 — Per-Building Brick Scale Presets and Image-Surface Workflow

**Classification:** Experimental Research and Implementation Specification — **NOT an approved GTD-wide building material standard**  
**Scope:** Meridia / South Ward, owner-authorized two-building brick-image scale comparison  
**Record:** 2026-10-12 session; filed 2026-10-13 (SAST)  
**Branch:** `feat/gtd-world-002-municipal-administration-20261012` (draft PR #16; never auto-promote to `main`)  
**Parent research:** [GTD-RND-MAT-001 Image-Derived Material Realism](GTD-RND-MAT-001%20Image-Derived%20Material%20Realism%20-%20Experimental%20Technical%20Research%20-%202026-10-12.md) and [Brick Material Trial A](GTD-RND-MAT-001%20Brick%20Material%20Trial%20A%20-%20Single%20Building%20Implementation%20and%20Acceptance%20-%202026-10-12.md).

## 1. Purpose and experimental chronology

The South Ward generator was already able to build physically recognisable apartments, shops, garage bays, windows and collision walls. Its earlier procedural brick surfaces looked painted rather than constructed. A previous rendering defect exposed the homepage hero photograph through incompletely initialized RGBA brick textures; that defect was fixed and must **never** be reproduced as a texture technique.

The owner then authored a front-facing brick pattern, manually corrected its edge/mortar layout, optimized it and committed `public/brick-wall-image.webp` (WebP, **1774 × 871 px**, **639,570 bytes**, Git blob `7a6d9bfd8730f852c55d439ffe01a622bba5d1dc`). GTD-RND-MAT-001 applied it to one apartment under the opt-in query flag `?gtdBrickTrial=1`, using physical-scale UVs. Owner screenshots from multiple angles and times confirmed a substantial visual improvement without changing windows, roof mass or Rapier colliders. **That is visual acceptance of a local proof-of-concept, not technical/mobile acceptance or global adoption.**

The owner now requests a controlled scale comparison **within the same preview**: preserve the accepted smaller scale on the Mercer Street apartment and use the identical image with bricks appearing 10% larger on the existing garage. The test must be independently reversible and documented before widening the experiment.

## 2. Hard boundaries and invariants

1. **Existing structural geometry wins:** building mass, real door/window openings, solid decorative windows, garage bay, roof, sidewalks, traffic, camera blockers, physics and humanoid remain unchanged by material selection.
2. **Only wall-role masonry surfaces** receive the experimental WebP. Frames, glass, door leaves, trim, metal, LEDs and collision-only meshes retain their current materials.
3. **One owner-committed local asset, multiple physical scales.** No duplicate brick WebP per building and no image resizing, perspective warping or UV stretching to fit entire facades.
4. Explicit `/game?gtdBrickTrial=1` is required for all assignments. Without the flag, the previous procedural building materials remain.
5. Only `sw-fl-south-apartment` and `sw-fl-garage` are in this gate; no automatic allocation by archetype, district or proximity.
6. No scope expansion to normal/roughness maps, new image generation, authored facade photos, PBR migration, citywide assignment or offline-pack shipping.
7. Provenance, dimension validation, performance limits, fallback and cleanup must be recorded; Vercel READY and unit tests are **not** desktop visual acceptance.

## 3. Separation of image asset, scale preset and building assignment

Keep three independent definitions. This model is an intended contract; confirm that actual code implements equivalent behavior before claiming it complete.

### 3.1 Asset registry
```ts
interface ImageSurfaceAsset {
  id: "south-ward-red-brick-a";
  publicPath: "/brick-wall-image.webp";
  format: "image/webp";
  pixelWidth: 1774;
  pixelHeight: 871;
  opaque: true;
  fallbackRole: "wall";
  gitBlobSha: "7a6d9bfd8730f852c55d439ffe01a622bba5d1dc";
}
```
Asset identity is independent of building ID and scale. Preserve native pixel aspect (1774/871 ≈ **2.03674:1**), slightly wider than the originally targeted 2:1. Physical UV sizes must use this actual ratio, not a hardcoded 2:1.

### 3.2 Scale presets

| Preset | Intended comparison | Metres per horizontal image repeat | Metres per vertical repeat | Scale factor vs A |
|---|---|---:|---:|---:|
| `compactA` | Accepted apartment reference | **1.350 m** | **1.350 × 871 / 1774 ≈ 0.6628 m** | 1.00× |
| `standardB` | New garage experiment | **1.485 m** | **1.485 × 871 / 1774 ≈ 0.7291 m** | 1.10× |
| `largeC` | Reserved for later, NOT activated | **1.620 m** | **1.620 × 871 / 1774 ≈ 0.7953 m** | 1.20× |

A 10% bigger tile in *metres* produces 10% larger apparent bricks with **about 9.09% fewer repeats per metre**. The same source pixel count covers a greater physical area; this is a controlled trade-off against near-camera texel density.

### 3.3 Explicit assignment registry
```ts
type BrickScalePresetId = "compactA" | "standardB" | "largeC";
interface BuildingImageSurfaceAssignment {
  readonly buildingId: string;
  readonly assetId: "south-ward-red-brick-a";
  readonly role: "wall";
  readonly presetId: BrickScalePresetId;
}
const CURRENT_TRIAL_ASSIGNMENTS = [
  { buildingId: "sw-fl-south-apartment", assetId: "south-ward-red-brick-a", role: "wall", presetId: "compactA" },
  { buildingId: "sw-fl-garage", assetId: "south-ward-red-brick-a", role: "wall", presetId: "standardB" },
] as const;
```
Assignment lookup must be strict and typed (ID allowlist); absence of an entry, a disabled trial or an unsupported preset returns to standard procedural walls. Do not rely on a generic `garage` archetype label: `sw-fl-garage` is the existing **First Light vehicle garage** and the required comparison target.

## 4. Full image-surface asset workflow

**Owner source → asset registration → opt-in assignment → material resource → facade UV projection → renderer → acceptance → rollback.**

1. **Author and commit.** The owner creates or refines a front-facing image, engineers opposite-edge mortar/brick continuity, optimizes/converts to WebP and commits under `public/`. This image is the authoritative sample; do not create unapproved variants.
2. **Validate before loading.** Verify its exact path, intrinsic pixel dimensions, encoded bytes, image type and blob hash. Validate opacity and 2×2 repeat seams visually. Track any resampling/optimization explicitly as a different asset version; 1774×871 is acceptable for this experimental comparison despite not being a power-of-two dimension.
3. **Register asset independently of scale.** Distinguish asset IDs from physical UV-scale presets, building bindings and policy status. Share an image source among buildings; avoid duplicate network transfers and ideally share GPU internal texture resources through a scene-scoped lease. A duplicated Babylon wrapper or material is not proof of duplicate GPU pixel storage; measure rather than assume.
4. **Resolve an assignment.** Gate on `gtdBrickTrial=1`; look up an *exact* building ID. Only its role-`wall` meshes receive a brick material. No wildcard assignments.
5. **Load with safe fallback.** Begin with existing procedural masonry; asynchronously load local WebP. On ready, switch the shared material's diffuse/base-color channel to WebP. On load/error/unsupported format, retain fallback; never render transparent pixels, hero imagery or missing geometry. Late async completion must not update a disposed building.
6. **Compute physical UV coordinates** rather than mesh percentage scaling. Do not read `part.size` as an implicit UV scale constant across sections of differing dimensions.
7. **Respect openings.** Real window/door cut-outs already divide wall meshes. Visible, decorative glass may cover an intact collision wall. Image material stays on masonry faces only and must not obscure separate glass/frame/door/trim elements. Garage door/bay and interior portal are preserved.
8. **Rendering/batching.** Current Trial A bypasses thin instancing **only for the assigned building's masonry wall boxes**, because default thin-instance box UVs scale the image differently on each wall segment. All unrelated roles and buildings retain the current batching path. Long-term migration to batched facade meshes with local-UV transforms is a separate optimization proposal and must not be conflated with this trial.
9. **LOD and disposal.** Geometry/collider proxies and other generated features must preserve their baseline contracts. Asset/material leases require reference-counted cleanup when buildings/scenes are disposed, with no stale callbacks or double disposals.
10. **Compare and decide.** Use side-by-side same-camera, same-time screenshots from sidewalk distance, window-adjacent regions and building corners. Measure memory, frame time and loading separately. If quality/regression gate fails, disable the URL flag and keep procedural materials.

## 5. The mathematics: metres first, pixels second

For asset pixel dimensions `P_w=1774`, `P_h=871` and horizontal coverage `T_w`, calculate vertical coverage as:

```text
T_h = T_w × P_h / P_w
u = horizontal_position_metres / T_w
v = vertical_position_metres / T_h
```

The independent building-relative origin is **shared across all wall sections of a facade**, not reset at each primitive. On front/rear faces, horizontal distance derives from local `x`; on left/right faces it derives from local `z`. Height derives from local `y`. Consistent tiling requires matching handedness/mirroring at corners, explicitly checked from both directions. Partial repeats at the building ends must be allowed; never stretch a partial last tile to fill a wall.

**Numerical example:** a 13.5m garage-wide wall would use `13.5/1.485 ≈ 9.09` horizontal repeats under B, versus `13.5/1.35 = 10` under A. The image stays the same resolution; no new asset is created.

Shader sampling and mip selection should be inspected for far-view aliasing and near-view grain, especially because a larger physical repeat lowers texels per metre. The visual "brick size" is calibrated provisionally from the owner's actual pattern—not guaranteed standardized clay-brick dimensions.

## 6. Window and garage spatial constraints

- **Window adjacency:** the shared UV origin carries brick courses continuously across wall sections around windows; there is no separate photograph cut around each window.
- **Window realism:** the image contains only bricks/mortar, never photographic windows. Existing window geometry, transparent glass and optional solid backing remain independent. Image alpha must not create transparent leak-through.
- **Corners:** a face-local projection yields correct vertical mortar alignment but may expose corner seams, face mirroring or abrupt course termination; document those separately from horizontal stretch.
- **Garage frontage:** preserve real garage entrance aperture and Rapier doorway clearance. No wall box, overlay, collision plane or backing may be added over the open bay. The owner's comparison targets **external masonry**, not a new brick finish on the garage interior.
- **Structural integrity:** visual wall changes are not permission to move/remove wall colliders, change vehicle parking or block Voight's threshold.

## 7. Fallback, offline and resource budgets

The one WebP is ≈0.64MB encoded, but decoded RGBA8 base storage is approximately `1774×871×4` ≈ **5.89 MiB**, ≈**7.85 MiB** with mip chain, before any GPU-specific representation. Do not confuse file size with VRAM, or assume two buildings double GPU storage when reuse/caching is possible.

Preserve local same-origin asset paths so a future offline pack can include this file. This does *not* establish actual offline level support or caching. Future offline acceptance must cover pack completeness, eviction, version pinning, memory budget and fallback to a working procedural renderer.

Safety and failure cases: incorrect manifest path, 404 or corrupt WebP, stale scene completion, alpha/depth contamination, wrong colour space, stretched or differently sized bricks beside windows, visible repeat boundaries, reused material incorrectly disposed, texture missing under mobile texture support, excessive near-view aliasing, FPS/texture-memory regression.

## 8. Test plan and acceptance gates

| Test/gate | Required result | Status |
|---|---|---|
| Asset identity/dimensions | Owner's exact WebP, unchanged | Source verified in MAT-001 |
| Preset arithmetic | A=1.350m; B=1.485m; vertical scales follow source pixel aspect | Pending execution |
| Assignment isolation | Flagged apartment uses A, flagged garage uses B, other buildings procedural | Pending execution |
| UV continuity | Neighboring wall boxes sample consistent physical scale across windows | Pending execution |
| Garage bay/interior | Existing garage opening and interaction geometry unchanged | Pending execution |
| Resource lifecycle | Shared image material safe under multiple buildings and disposal | Pending execution |
| Regression | TypeScript, targeted and full suite, Vercel READY | Pending execution |
| Visual A/B | Owner screenshots of apartment + garage, comparable viewpoints and lighting | **OPEN** |
| Performance/mobile | Frame-time, texture/decode memory and loading comparisons | **NOT ACCEPTED** |
| Project-wide adoption | Written owner + security approval, measured evidence and rollout plan | **NOT AUTHORIZED** |

**Expected comparison URLs:** `/game` for original baseline, `/game?gtdBrickTrial=1` for concurrent A/B textures. Separate asset-versus-procedural comparison and A-versus-B scale comparison must not be confused.

**Rollback:** remove `?gtdBrickTrial=1`; preserve the existing procedural fallback and entire architectural physics graph.

## 9. Governing decision

The owner approved the **two-building trial comparison** and this documentation. That does **not** constitute approval for image-derived textures across GTD, expanded South Ward, additional image assets or the use of high-resolution image materials as a mandatory building standard. Trial C (`largeC`) remains defined but inactive; further building assignments require explicit approval.

Any observed success is experimental evidence; the final decision must consider the garage window/entry geometry, close-up brick dimensions, nocturnal materials, browser/mobile performance and image asset packaging.
