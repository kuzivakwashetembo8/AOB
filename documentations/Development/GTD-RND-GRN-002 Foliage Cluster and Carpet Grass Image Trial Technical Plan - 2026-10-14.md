# GTD-RND-GRN-002 — Tree Foliage Cluster and Carpet-Grass Image Trial: Technical Implementation Plan

**Date:** 2026-10-14  
**Status:** PROPOSED / DOCUMENTATION ONLY / IMPLEMENTATION NOT AUTHORIZED  
**Parent research:** 'documentations/Research/GTD-RND-GRN-001 Image-Based Foliage and Carpet Grass Realism Doctrine - 2026-10-14.md'  
**Planning branch:** 'docs/grn001-foliage-carpet-grass-images-20261014'  
**Game-code starting point for any future experiment:** 'fix/ground004-grass-only-infill-20261014' at '1fa9f47182c160f142cc03a4adcfcfe87981c45e' unless the owner subsequently approves a different known-good base. **main** at documentation time is not the grass-only preview baseline.

## 0. Scope and implementation discipline

Goal: **prove or disprove** that two high-quality generated image assets improve G.T.D's perceived greenery realism with image repetition on *existing* geometrical structures.

Exactly **two candidate image assets** are in scope:
- **FOL-01**: one transparent realistic multi-leaf and fine-twig foliage cluster for tree canopy cards.
- **GRS-01**: one realistic, top-down, evenly trimmed carpet-grass image to repeat across the South Ward ground plane.

The owner has already reviewed the visual doctrine. Approval of this plan will authorize **only the proposed tests if explicitly stated**; it does not turn any preview image into a production asset by itself.

**One change, one test, one observation:** implement FOL-01 and assess it before moving to GRS-01. Do not bundle two visually unverified changes in a single acceptance decision or deploy a mixed trial that makes attribution difficult.

### Explicitly excluded

- A single-leaf per-card/per-blade system, many-cluster atlas, more tree species, branches/trunk changes, bark upgrade, tree count or placement, environmental wind or leaf physics.
- GRASS-B subtle mowing, GRASS-C mild wear, texture blends, randomly changing grass families, new tall-blade meshes, road-verge gradients or remapped land uses.
- Parking, paving, drainage, water, paths, terrain reshaping, road continuation, additional lighting or modifications to GROUND-004 physics.
- Changes to validated tree positions, foliage-card count (30), canopy seed/angles, collision, original road/sidewalk materials, hero buildings, glass/brick surfaces, Voight movement or Ferrari mechanics.
- Automatic production deployment or merge to main.

The test runs on the GROUND-004 environment only. Current baseline is an opt-in preview using '?gtdGround001=1'; do not silently replace the accepted fallback without a separate owner decision.

## 1. Baseline evidence and exact touchpoints

| Function / module | Existing implementation | Proposed adaptation |
| --- | --- | --- |
| 'src/game/world-generation/street-context-renderer.ts' → 'foliageTexture' | 256×256 procedural RGBA DynamicTexture, shared by trees/shrubs via one StandardMaterial | Load candidate FOL-01 as **one separately leased image texture and trial material**, initially bound to one owner-selected tree only; leave shrubs and other trees on procedural fallback |
| 'src/game/world-generation/tree-canopy.ts' → 'planTreeCanopy' | 30 image cards / tree, deterministic 10 groups × 3 planes; existing silhouette bounds | **No source modifications** for first test, except a read-only witness if necessary |
| 'src/game/world-generation/street-context-renderer.ts' → 'addTree' | Cards retain original size, yaw, pitch and translation; trunk and bark are real geometry | Keep physical structure; substitute selected card material only |
| 'src/game/world-generation/ground-land-use.ts' | All residual ground GRN-01, no competing surface types | Remain unchanged |
| 'src/game/world-generation/ground-land-surface.ts' | Generate 1280×1040 color/noise texture at 8 px/m | Preserve as original fallback, introduce conditional **repeating grass image** loader |
| 'src/game/world/generated-first-light-world.ts' → 'createGround' | Single 160m×130m flat mesh, z=20; material uses UV normalized over map; simple original Rapier collider | Apply metric UV repeat on an opt-in photo texture; preserve mesh footprint, indices, collision and accepted material state when trial disabled |
| 'src/game/core/gtd-runtime.ts' | GROUND-004 preview driven by 'gtdGround001' query parameter | Add independent proposed preview flags with explicit default OFF and clear A/B attribution; implement only after authorization |

If the live repository changes before implementation, re-audit signatures and file ownership; do not blindly apply this plan to a divergent branch.

## 2. Asset preparation and QA contract

### 2.1 Candidate provenance, naming and ownership

Candidate inputs are **the two images generated in this conversation on 2026-10-14**. They currently exist as chat image artifacts, not committed game assets. Their measured dimensions are 1254×1254. FOL-01 has RGBA and GRS-01 RGB.

Proposed committed, optimized names (not yet present):
- 'public/assets/vegetation/foliage-cluster-01.webp'
- 'public/assets/ground/carpet-grass-01.webp'

Keep original generated PNGs as *local/source artifacts or explicitly authorized source-asset files* with origin/date, approval state and content hashes. Add only optimized runtime assets to the PWA build in the first implementation. Use deterministic conversion commands and store their parameters in a small asset manifest, not an automated regeneration dependency.

**The generated outputs are candidates, not guaranteed compliant:** no automated creative redrawing during implementation without author approval; neutral technical preprocessing (cropping, tile-edge continuity, resizing, alpha cleanup, color normalization, encoding) is permitted only insofar as it retains the accepted asset's visual identity. If preprocessing materially changes appearance, return the images for explicit review.

### 2.2 FOL-01 quality criteria

- PNG source contains genuine alpha; do not replace transparent pixels with black, white or a checkerboard.
- Inspect all four margins and the isolated leaf/twig silhouette. Crop excess empty perimeter, preserve natural leaf tips, then rescale to a budgeted runtime size (provisional **1024×1024**, to be profiled and revised rather than assumed).
- The current candidate has extensive partial-alpha pixels and apparently no alpha-255 pixels in measured output. Diagnose and remap opacity deliberately; preserve anti-aliased tips but ensure solid leaf cores are substantially opaque. Prevent premultiplied-vs-straight alpha dark/green/yellow fringes.
- Review color on **black, white, blue-sky and G.T.D grass** backgrounds at native zoom. Require natural greens and restrained baked highlights.
- Store WebP with alpha and alpha-quality sufficient for sharp leaf silhouettes; choose lossless or high-quality with documented byte cost. Compare against PNG input. No mipmap halos or bright border outlines under zoom.
- Set alpha material semantics explicitly: evaluate alpha-test/cutout vs alpha-blend with actual overlapping 30 cards; avoid depth-sort artifacts, severe aliasing, unnatural translucency and self-glow. Diffuse and opacity references must use the correct alpha representation.
- No 4K texture mandate: browser GPU memory, alpha overdraw and PWA download are the controlling costs.

### 2.3 GRS-01 quality criteria

- Source is **overhead, dense, cut-short, consistently low-profile carpet grass**, with no fake tall tufts, dramatic sunlit directional shadows, paths or bare patches.
- The exported generated grass is **not proven tileable**. Numeric seam witness: opposite-edge channel differences exceed typical interior adjacent-pixel differences. Make it truly tile-compatible using edge-preserving offset/inpaint/healing or regenerate only under an additional explicit image approval; do not merely set texture addressing to REPEAT and hope.
- Validate using 2×2, 4×4 and 8×8 tiled previews before game wiring. No repeated bright corners, cross seams, regular bold bands, obvious isolated clump motifs or unnatural checkerboard. Perceptual visual check is mandatory alongside numeric edge metrics.
- Provisional runtime texture 1024×1024 (RGB/optimized WebP); mipmapped and anisotropic filtered; intended **world metre tile scale** specified in metadata. Test a small bounded set of scales (for example 3m, 5m and 7m tiles) **without changing the image**. Those numbers are experiments, not claims about real blade size.
- Calibrate greens against the accepted South Ward baseline. Current candidate is considerably bright in preview; test day and night under the existing night-lighting lock. Avoid baked illumination and new dynamic lights. If color alone requires adjustment, log the delta and obtain comparison evidence.
- Fully opaque texture, no fake depth, no new blade geometry. The flat surface remains physically identical to GROUND-004.

### 2.4 Preliminary resource guidance

A decoded 1024² RGBA texture uses approximately **4 MiB**, about **5.3 MiB with full mip chain**, excluding transient decode/storage. A 1024² RGB asset may still occupy RGBA-like GPU storage depending on upload format. The 1254² source file sizes are not representative of GPU residency. One shared instance per asset/scene; never allocate a new image texture per tree or per grass tile. Record real browser memory and upload readiness rather than promise a hard VRAM total.

## 3. Preview isolation and material routing

### 3.1 Proposed switches

Use independent, default-OFF flags (names illustrative; exact final identifiers confirmed in PR):

- '?gtdGround001=1' — approved grass-only preview scene prerequisite.
- '&gtdFoliageImgTrial=1' — FOL-01 trial on a selected existing tree, leaving other trees and shrubs unchanged.
- '&gtdGrassImgTrial=1' — GRS-01 ground image trial, while the original procedural image remains the fallback.

Do not enable both experiments together until they have each received **separate** visual decisions. When reviewing grass, foliage can remain procedural; when reviewing foliage, grass remains existing procedural GRN-01. These switches are experimental surface routing only. No global runtime image change with the flag absent.

### 3.2 Foliage integration

1. Use current stable 'StreetContextItem' tree ID to select exactly **one** visible existing tree (owner-approved test subject near a clear line of sight). Selection must not depend on mutable enumeration order.
2. Keep 30 canopy cards, their positions, 3D orientation, one existing tapered trunk and the same physical tree collider.
3. Prepare a dedicated FOL-01 StandardMaterial, shared only across the selected tree's cards. Other tree and **all shrub** materials remain the prior procedural texture. This prevents cross-contamination from the shared current foliage material.
4. Request the static asset once at scene init, with load/error/fallback handling. A missing/invalid file restores the procedural material without a blank or invisible crown. Expose image loaded/ready state in development witness.
5. Confirm alpha-test/depth-write/culling behavior, card normal/lighting response and night look on real desktop/Android GPUs. Do **not** add individual leaf meshes, branch cylinders, additional light sources or transparent material variants per tree in the first trial.
6. Use one controlled screenshot sequence: original vs FOL-01 at front, side, overhead and ground-up angles; daylight and existing night lighting. Observe whether silhouette repetition or planar crossing still makes the image obviously synthetic.
7. If accepted as an image technique, separately decide whether to extend it to the remaining trees. **No automatic broad rollout** under the one-tree experiment.

### 3.3 Grass integration

Only after FOL-01 result is recorded (accepted, rejected or explicitly deferred), change the GROUND-004 render path **in another isolated PR or commit/evidence packet**:

1. Keep 'planGroundLandUse' exactly GRN-01; no grass patch zoning, mixed land use or terrain mesh changes.
2. Keep the existing single 160×130m grass plane, world bounds and collision. Replace its procedural 1280×1040 diffuse texture with one asynchronously loaded GRS-01 tile only under flag.
3. UV scale must be computed from **world metres**, not screen dimensions. With the current normalized map UV, multiply U by 160/tileSizeM and V by 130/tileSizeM (and verify orientation). Set address mode to repeat; maintain neutral material lighting and PWA-safe load path.
4. Apply anisotropy/mips as measured; test camera motion to avoid shimmering or distance blur. Do not stretch the full image once across the entire playable district.
5. Keep roads, sidewalks, buildings, park props, streetlights and their accepted materials visually unchanged. Avoid any new base or overlay mesh.
6. If the grass image fails to load or cannot repeat safely, use the current procedural 'ground004-grass-only' finish. No brown fallback.
7. Evaluate the same *one* grass image at three metric tile sizes as an intentional parameter study; select only after owner sees street, mid-distance and flight comparisons, including mobile landscape.

## 4. Sequenced implementation work packets and gates

| Stage | Work packet | Deliverable | Acceptance / halt |
| --- | --- | --- | --- |
| D0 — review | Owner reviews GRN-001 doctrine and GRN-002 plan, candidate images and constraints | Signed decision; no game change | **Hard stop until separate authorization** |
| A0 — asset prep | Inspect source images, preprocess one alpha foliage and one tileable grass, make reproducible asset manifest and compare optimized output against sources | Exactly two candidate runtime assets, asset-size/alpha/seam evidence | If topology/color/opacity compromised, no render integration |
| F1 — one-tree image trial | Add isolated foliage material routing, stable selected tree ID, fallbacks and witness; preserve all 30 existing cards | Foliage-only opt-in preview | Owner tests close/mid/flight/day/night; approve/reject foliage individually |
| F2 — foliage gate | Record visual/technical result; revert if rejected | FOL-01 disposition and screenshots | **Do not implicitly approve grass** |
| G1 — one-grass image trial | Repeat same grass image over unchanged GRN-01 plane using metric UVs, procedural fallback; no image variations | Grass-only opt-in preview | Owner tests ground/mid/flight, day/night, real browser seam/scale |
| G2 — grass gate | Record tile scale, seam, color, fidelity and performance results | GRS-01 disposition and screenshots | **Do not conflate with foliage result** |
| R1 — optional approved combination | Only if both individually accepted and owner separately requests combination: activate both in a controlled preview | Combined visual regression report, not production rollout | Owner accepts merged visual |
| R2 — controlled promotion | Test mobile/PWA/cache; prepare clean PR / release evidence | Merge or manual deployment proposal | Separate authorization for merge and production |

**Do not collapse the foliage and grass implementation gates just because the assets were generated on the same day.** Documentation can cover both; visual tests should remain isolated.

## 5. Verification matrix

### 5.1 Asset and pure automated checks

- Exactly one FOL-01 runtime image and one GRS-01 image at designated paths, each with recorded hash, pixel dimensions, decoder channel behavior, file bytes and license/provenance.
- FOL-01 actually has transparent holes and opaque-enough cores; validate edge alpha, RGB fringe against four backgrounds and alpha sampling. No all-transparent or fully flat-opacity texture.
- GRS-01 has an opaque, top-down grass image; edge seam thresholds are measured and tiled contact sheets saved for owner inspection. Numeric seam pass alone is insufficient.
- 30 cards for the selected tree, same positions/yaws/pitches as baseline; current other trees/shrubs continue to use procedural texture.
- Ground land-use remains a single GRN-01 class with the original 20,800 mapped metre-sized samples. No pond, new pavement, parking, landscaping strip, extra mesh or changed collider.
- Both flags OFF yields equivalent tree/grass material bindings to GROUND-004 (aside from explicit harmless names/witness when required). Missing asset triggers deterministic fallback without startup failure.
- Asset fetch path, load timing, PWA cache behavior and lifecycle/disposal tested; no repeated fetch or GPU image allocation per tree/tile.
- Strict TypeScript, Vitest, production build and PWA worker publication succeed. Headless tests do not replace GPU-pixel review.

### 5.2 Runtime visual and interaction witnesses

| View / scene | FOL-01 | GRS-01 |
| --- | --- | --- |
| Voight directly beside the test tree | Leaf shape, transparency, cross-plane seams, branch contact | Blade scale, no stretched image, no floating texture |
| Across Mercer Street | Crown mass and silhouette from distance | Natural short lawn, no strong tiled pattern |
| Flight survey above rooftops | Crown top visibly dense, no X-billboard signature | Tile repeat/edge visibility across broad contiguous ground |
| Ground-up camera | Leaf undersides and card intersections | Oblique texture sampling, perspective, no shimmering |
| Existing night lighting | Realistic contrast; no baked sunshine or bright halos | Stable green within accepted night light; no additional lights |
| Android landscape graphics preset | Draw calls, alpha overdraw, load readiness and frame time | PWA asset readiness, VRAM, sharpness and mip quality |

For matched scene/camera/device/quality preset: record median/P95 frame times, pixel resolution/scaling, texture/material count, draw calls, upload bytes and GPU shader errors where available. **Proposed** acceptance ceiling: no sustained >10% P95 frame-time regression from image-only change at the same preset; revise after measuring a real baseline and identifying device-specific noise. No first-frame blank crowns or blank/black ground is permitted.

### 5.3 Owner visual pass/fail criteria

**FOL-01 passes** only if leaf clusters look substantially more natural than procedural graphics at street and close range; retain a believable 3D canopy during walk-around, ground-up and flight; no obvious repeated single-shape wallpaper, broken transparency or material light mismatch.

**GRS-01 passes** only if it reads as evenly cut, dense carpet grass, is visibly sharper without becoming tall/blade-like, tiles with no distracting seams or repeated artifacts at the approved metre scale, and harmonizes with current buildings, road/sidewalk materials and accepted night view.

**Failures are isolated**: if FOL-01 fails, restore old tree material and preserve grass. If GRS-01 fails, restore 'ground004-grass-only' procedural texture while retaining whatever foliage result was independently approved.

## 6. Risks, alternative decisions and measured unknowns

| Risk | Basis | Mitigation |
| --- | --- | --- |
| F-01 excessive translucency and halos | Preliminary RGBA distribution of generated foliage | Normalize alpha at source, choose alpha-test/cutout only after actual WebGL look; preserve anti-aliased edges |
| F-02 obvious repeated clump | One image sampled across 30 cards | Controlled one-tree multi-angle proof; stop/reject before adding multiple clusters |
| F-03 shrub contamination | Current foliage texture/material shared by trees AND shrubs | Separate material routing and tests explicitly asserting shrubs unchanged |
| F-04 mobile overdraw/shader cost | Overlapping double-sided alpha geometry | No card-count growth; GPU profiling and shader/material reuse |
| G-01 non-seamless photo | Measured opposite-edge mismatch | Tile remediation plus visual tiled-contact sheet before UV integration |
| G-02 inappropriate texture scale | 1254² source stretched/oversized without metre repeat | Metric UV calibration at 3 candidate tile sizes; select based on screenshots |
| G-03 overly neon/bright grass | Candidate image relative to existing preview color | Preserve base reference, compare night/day, minimal documented neutral grade |
| G-04 mipmap or alpha edge halos | Transparent texture minification & texture encoding | Texture settings, edge bleed treatment and mobile verification |
| R-01 mixed-state PWA | Assets published under existing cache/service worker | Hashed/versioned filenames, manual deployment, switch fallback & reload tests |
| R-02 unrelated world regression | Grass-only baseline is unmerged | Branch from known-good GROUND-004; file-scoped diffs and preserved GROUND-004 regression suite |

Assumptions that must be checked during implementation: runtime material flags and Babylons's current texture UV orientation, actual grass image power-of-two resize quality, PWA caching mechanics, source art provenance and requested cross-device performance. No need to assume generated images are already production-perfect.

## 7. Proposed repository deliverables after future implementation authorization

- Two processed image assets at the stated 'public/assets/...' locations, plus manifest with dimensions, bytes, hashes, format, scale, alpha treatment and provenance; source images retained separately as approved.
- Minimal grass material loader and canopy material switch with independent flags; old procedural fallbacks retained.
- Tests for tree/shrub isolation, unchanged canopy geometry, uniform GRN-01 classification, texture tiling/alpha validity, asset failure fallback and disposal.
- Screenshots and measured browser resource evidence for each isolated experiment; owner-signed decision record distinguishing trial from accepted design surface.
- Separate implementation PR(s) from the GROUND-004 base; **not** a merge into main or an automatic production deployment.

## 8. Authorization and next action

**Current authorized activity:** documentation and plan drafting only. Two image examples were already generated in conversation; they have not been copied into the repository or wired into G.T.D.

**Next proposed action, requiring explicit owner authorization:** start A0 asset QA and F1 **one-tree foliage-only visual preview**; record acceptance before G1 grass. If the owner instead authorizes the entire plan, still execute sequentially and pause on genuine test failures, asset mismatch or unexpected gameplay regression.

**Final disposition: AWAITING OWNER APPROVAL. No images committed, code changed, implementation tests run, or preview/production deployments made under this documentation task.**
