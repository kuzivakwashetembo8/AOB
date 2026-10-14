# GTD-RND-GRN-001 — Image-Based Foliage and Carpet-Grass Realism Doctrine

**Date:** 2026-10-14  
**World:** Meridia → Meridian City → South Ward  
**Status:** Research / image-asset experiment documented; NOT an implementation authorization or acceptance of either generated image  
**Reference runtime:** GROUND-004 grass-only preview, branch 'fix/ground004-grass-only-infill-20261014', commit '1fa9f47182c160f142cc03a4adcfcfe87981c45e'  
**Companion:** 'documentations/Development/GTD-RND-GRN-002 Foliage Cluster and Carpet Grass Image Trial Technical Plan - 2026-10-14.md'

## 1. Intent and owner decisions

The GROUND-004 preview established a visually accepted continuously grassy base for the current South Ward slice. This decision stays intact: **grass is the only residual-land ground-use category**, and roads, sidewalks, buildings, existing trees and props keep their existing independent geometry.

The owner proposes extending G.T.D.'s accepted image-based architectural-surface doctrine into greenery, where images provide high-quality organic microstructure and the existing 3D world supplies spatial structure. This encompasses:

1. **A single realistic leaf image**, attached repeatedly to branches; viable as a future fine-detail experiment, but NOT today's chosen first implementation.
2. **A transparent cluster image containing many leaves and some small twigs**, repeated around the existing tree canopy; today's selected foliage experiment.
3. **A realistic top-down carpet-grass texture**, repeatedly tiled over the existing flat South Ward ground; today's selected ground experiment.
4. **Future grass-family variation**: consistent short carpet grass in standard, subtly mown and mildly worn/uneven finishes. Catalogue is documented, but no additional grass images or blending logic will be implemented today.

Today's scope is **one foliage-cluster image and one carpet-grass image**, independently testable and reversible. No new tree placement algorithm, new species, canopy geometry, trunk/branch reconstruction, grass polygon classification, parking, ponds or pavement.

## 2. Visual doctrine: image supplies detail; world supplies depth

### 2.1 Buildings to vegetation transfer

Brick surfaces succeeded because the wall is predominantly planar and tiled texture conveys material detail cheaply. Glass façades further established that genuine 3D geometry is necessary wherever silhouettes and shallow-depth elements (mullions, strips, pipes) would otherwise look drawn.

Vegetation uses the same distinction, with different topology:

- Tree trunk and any primary branches: real 3D geometry; bark texture supplies fine-scale appearance.
- Foliage clusters: photo-realistic leaf-and-twig imagery on alpha-cutout oriented planes, **distributed through a 3D volume**.
- Entire-tree billboard: intentionally not the target because it collapses from oblique angles and flight views.
- Carpet grass: one horizontal ground plane remains flat by design; top-down trimmed grass imagery supplies microtexture without tall-blade illusions.

The goal is **perceptual consistency** at Voight's height, from street distance and during aerial survey. A higher-resolution picture alone does not prove improvement.

### 2.2 Leaf strategy alternatives

| Approach | Intended visual role | Advantage | Failure risk | Decision |
| --- | --- | --- | --- | --- |
| Individual leaf PNG with transparency | Leaf-level close-ups, later ultra-near detail | True outline, flexible count/angle/species | Extreme alpha overdraw, repeated leaf orientation, many cards | Document only; deferred |
| Multi-leaf foliage-cluster PNG with transparency | Crown volume in existing canopy cards | Natural internal variation, convincing leaf silhouettes at lower plane count | Obvious repeats, broad flat slabs, bright fringe, baked highlights | **First tree experiment** |
| Mixed atlas of multiple leaf/cluster shapes | Later species/LOD variation | Texture-sharing and less repeated silhouettes | More sampling/UV and authoring complexity | Future extension only |
| Full tree billboard | Very distant impostor LOD only | Cheap at long range | Flatness from ground/flight, species repetition | Not approved for this pass |

A cluster should contain dozens of physically coherent leaves and short connecting twigs. It must have real transparent holes between separate leaves, natural asymmetry, restrained highlights, neutral lighting and a silhouette that does not form a repetitive circular blob when crossed with other planes. It must **not** contain a complete isolated tree trunk or surrounding scenery.

### 2.3 Ground grass doctrine

The owner's reference images establish two different classes, not a continuum to blend indiscriminately:

- **Reject:** tall visible strands, upward-growing clumps, long directional blades, exaggerated tuft silhouettes. These suggest a meadow rather than an even lawn when painted onto flat geometry.
- **Accept:** dense, short, trimmed **carpet grass** seen straight down, fine grain, restrained unevenness, no exaggerated depth, no obvious hard borders or visible seams.

Carpet grass can vary without becoming country grass or stadium turf. All variants keep blade height and species language consistent. Future candidates:

| Future grass family ID | Meaning | Target distribution | Today's status |
| --- | --- | --- | --- |
| GRASS-A / carpet-standard | Tightly cut, dense, moderately uniform maintained grass | Primary South Ward baseline | **One image to trial** |
| GRASS-B / carpet-subtle-mow | Faint maintenance-direction bands with very low contrast | Occasional logically maintained spaces | Documented; deferred |
| GRASS-C / carpet-mild-wear | Slightly duller or uneven-green short turf, no exposed dirt dominance | Ordinary residential/working-class transitions | Documented; deferred |

No quota, surface randomizer, grass-class blend, tall mesh tufts, wind response or newly scattered lawn objects are authorized by this documentation. The accepted residual classification stays GRN-01 for **all** available ground; image variants later change *appearance*, not land-use identity.

## 3. Current verified repository representation

Source reference: 'src/game/world-generation/street-context-renderer.ts', 'src/game/world-generation/tree-canopy.ts', 'src/game/world-generation/ground-land-use.ts', 'src/game/world-generation/ground-land-surface.ts', and 'src/game/world/generated-first-light-world.ts', all at the GROUND-004 reference commit.

- Current tree trunk: one real tapered cylinder (about 5.05 scene metres high at unit scale), four root-flare pieces, procedural bark material.
- Current crown: 30 double-sided image cards per tree, in 10 three-plane clusters, controlled by a deterministic 'planTreeCanopy'; current leaf image is a **256×256 DynamicTexture** painted programmatically. No genuine large branching skeleton.
- Foliage material uses a shared diffuse/opacity texture, alpha-capable blending/test mode and two-sided cards. **Shrubs share that same foliage material**; replacing it globally would unintentionally alter shrubs. The first trial must isolate a selected tree, not accidentally every tree and shrub.
- Current approved grass planner is exclusively GRN-01 over the 160 m × 130 m GROUND-004 slice. The grass renderer creates an **8 pixels/metre procedural color texture** of 1280×1040, with no parking or water assignments. The original flat ground and Rapier support remain in use; accepted road and building surfaces sit over the ground.
- Ground texture coordinates presently span the entire footprint with clamp addressing; true photographic tiling needs explicit metric UV repeat/wrap. A single photo stretched over all 160×130 m would look blurry or enormous, not realistic.

## 4. Existing candidate images: research artifacts, not approved game assets

The conversation produced two candidate image outputs on 2026-10-14:

| Candidate | Source resolution | Channels | Purpose | Known first-pass qualification |
| --- | --- | --- | --- | --- |
| Carpet-grass reference output | 1254×1254 | RGB PNG | GRASS-A, overhead trimmed maintained grass | Detailed but **not established seamless**; bright palette must be judged against the game's accepted ground/night lighting |
| Foliage-cluster reference output | 1254×1254 | RGBA PNG | One multi-leaf/twig cutout for existing foliage cards | Transparency exists, but alpha fringe/opacity must be checked; generated highlights may be too bright or repetitious |

These previews exist in the conversation image outputs; **neither is committed to GitHub, optimized as a game WebP, wired into Babylon, or runtime-accepted.** No local sandbox filename is a repository URL.

Preliminary numerical checks of the saved previews (not a rendering certification):
- Carpet image mean opposite-edge RGB difference: approximately **39.4** (left/right) and **37.5** (top/bottom), versus approximately **24.7/24.4** mean adjacent-pixel differences inside the image. This indicates seams may be visible when repeated. A generation prompt requesting seamlessness is not proof of a seamless output.
- Foliage alpha: approximately **47.2% fully transparent**, almost all remaining pixels partially transparent; the exported sample had no alpha values at exactly 255 in the inspected buffer. This could produce overly soft foliage, fringe/halo or alpha-sort artifacts without asset processing.

These are reasons to **QA and optimize**, not reasons to discard either visual concept. A successful preview requires confirming true transparency, leaf scale, edge cleanliness, color balance and alpha behavior in Babylon.

## 5. Repetition as a deliberate technique

### Tree repetition

Reuse one high-quality foliage cluster on the existing cards. Preserve current card count and positional/orientation seeds for the first A/B comparison so the image is the only controlled variable.

Risk: using the same distinctive twig/leaf silhouette 30 times may be visibly artificial. Test the same tree from **front, side, underneath and directly above**, both nearby and distant. Variation in yaw/pitch in existing geometry may help, but no unapproved extra species, cards, independent leaf meshes or randomized geometry in the first trial. If repetition remains obvious, report it; reserve multi-atlas variety for later approval.

### Grass repetition

Use one processed tile reused many times across the existing ground plane. The photo must have a consistent metre scale (initial tile size is a testable hypothesis, not an accepted constant), near-seamless borders, no baked directional sunlight or large distinctive clumps.

Aerial view can expose repeated bright/dark patches as clearly as street view exposes low texture density. Validate multiple tile scales **as a material setting** on the same chosen asset; do not introduce extra images or surface-use categories to conceal a poor tile. Use mipmaps and anisotropic filtering as appropriate; no unrelated geometry changes.

## 6. Failure modes to look for

| Failure code | Foliage or grass | Mechanism and symptom |
| --- | --- | --- |
| IMG-01 | Foliage | Bright green/yellow/white fringe around transparent leaf silhouettes caused by RGB bleed and alpha sampling |
| IMG-02 | Foliage | All leaves look translucent or haloed due to source alpha below full opacity or inappropriate blend/depth settings |
| IMG-03 | Foliage | Identical large clusters form repeated silhouettes, X-shaped billboards, or exposed planar intersections in flight view |
| IMG-04 | Foliage | Large alpha polygons overdraw repeatedly and reduce Android FPS or produce sorting flicker |
| IMG-05 | Foliage | Photo's baked directional lighting conflicts with G.T.D's night conditions |
| IMG-06 | Grass | Clearly repeated tile boundaries, checkerboard or regularly stamped clumps |
| IMG-07 | Grass | Stretched photo, wrong physical blade scale, mip blur at movement or excessive sharpening shimmer |
| IMG-08 | Grass | Saturation or light/dark inconsistency with existing buildings and day/night world |
| IMG-09 | Grass | Carpet image accidentally implies raised/long blades rather than maintained level lawn |
| IMG-10 | Both | Regression in PWA cache, image readiness, lost texture after reload/context change or disposal leak |

## 7. Decision framework

A feature passes only if it improves the perceived scene across its intended viewpoints **without altering accepted geometry or functionality**. In this experiment:

- The foliage experiment is accepted or rejected independently from grass.
- The grass experiment does not use a successful foliage result as its own proof.
- Owner screenshots and live browser observation are decisive for aesthetics.
- GPU cost, texture upload readiness, build/tests and mobile fidelity remain separate engineering gates.
- Either asset can be rejected while the other succeeds.
- Any later variety family (single leaves, multiple cluster atlases, GRASS-B/C) needs a new explicit design and implementation decision.

## 8. Release governance

The image-generation outputs are **candidate sources** only. Proposed optimized filenames and URLs in the companion plan are **future destinations**, not assertions that assets exist.

Do not upload game assets, alter source, modify character physics, update tree placement, enable a new PWA release, merge into main, or deploy from this research document. This is a technical/visual doctrine for future authorized experiments.

**Final state: documented; awaiting owner review of the companion implementation plan and separate implementation authorization.**
