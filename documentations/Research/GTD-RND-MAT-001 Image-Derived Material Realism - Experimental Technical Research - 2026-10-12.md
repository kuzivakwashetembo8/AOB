# GTD-RND-MAT-001 — Image-Derived Material Realism
## Experimental technical research: high-resolution source imagery as surface material for existing Meridian geometry

**Recorded:** 2026-10-12 (South Africa time)  
**Project:** Grand Theft Division (GTD) → Meridia → Meridian → South Ward / Municipal Administration  
**Classification:** RESEARCH PROPOSAL — EXPERIMENTAL / NOT APPROVED FOR GTD BUILDINGS  
**Authority:** Owner discussion and comparative screenshots; technical analysis, not authorization to change the GTD visual standard.  
**Implementation boundary:** Only the **hero-image contamination defect** is authorized to be patched as part of the current Municipal Administration experiment. This document is a proposal only: it does not activate, import, generate, or deploy any high-resolution photographic material asset.  
**Current development branch:** `feat/gtd-world-002-municipal-administration-20261012` (not `main`).  
**Review state:** Pending concept/research, source-asset, performance and owner approval. Do not include in a production PR as an accepted game-building standard.

---

## 1. Narrative: how the idea surfaced

### 1.1 Before the error: the fake-brick criticism
During the South Ward infrastructure and building refinement, the owner repeatedly observed that procedural bricks looked **painted or sketched onto flat walls**. The buildings were recognizable as buildings: their sizes, windows, rows, corners, doors, roads and collision structure were already doing their jobs. The remaining objection was their **surface appearance**, particularly unconvincing brick joints and material depth. Increasing polygon counts was not necessarily the remedy.

Earlier South Ward work strengthened facade grammar, introduced seeded brick-relief procedural texture variants, widened pavements, added side doors and improved nighttime illumination. These advances did not settle the material-realism problem.

### 1.2 The unexpected image contamination
The first South Ward infrastructure preview deployed on 12 October 2026 showed the **homepage's photographic Meridian city hero image across parts of generated building facades**. The owner supplied multiple in-game screenshots: window frames and other geometric features remained spatially present, but sections of masonry appeared to be a detailed city photograph, including the original human figure in the promotional image.

This was **a bug**, not a deliberate material experiment, an approved image texture, or a controlled comparison.

**Source-code diagnosis (reviewed on current experiment branch):**
- `src/game/world-generation/surface-textures.ts` allocated a **128 × 128 RGBA buffer** for the new `brick-relief` texture but looped over only `SIZE = 64` rows/columns. The unfilled texels had zero alpha, leaving a large unintentionally transparent region.
- `src/ui/menus/shell.tsx`, `Scene({ game: true })`, still mounted the **launcher city hero image** inside `/game` behind the Babylon canvas.
- Those independent defects made the unrelated promotional image visible when building surfaces failed to remain opaque. The screenshots are consistent with this interaction; automated tests must verify the invariant rather than rely solely on the appearance.
- The authorized containment patch fully fills the buffer at its chosen size, enforces opaque masonry alpha, and removes the hero image from the gameplay DOM while retaining it on launcher screens. Regression tests target both conditions.

**Causal boundaries:** the defect does **not** demonstrate that Babylon deliberately selected the homepage JPEG as a wall material. The important visual observation is that **detailed photographic imagery, when seen within existing window/building geometry, can markedly alter the apparent richness of the world**. Do not preserve the image leak or use CSS compositing behind transparent masonry as a materials technique.

### 1.3 The owner's conceptual correction
The initial discussion considered photographic skylines, distant water and background scenery. The owner clarified that this was **not the primary proposal**. The new idea is to improve **specific materials on existing meshes**:

> A brick building remains a genuine 3D building. Replace the crude image/procedural appearance of the bricks with a carefully generated, seamless, realistic brick material applied to its existing wall mesh. Do not replace the building with a flat photograph of a building.

The same distinction extends to asphalt, paving, concrete, painted plaster, metal and other surface classes. Source imagery may be generated at high resolution and stylized toward **Meridian's own world realism**, not slavishly copied from Earth photographs.

### 1.4 Comparative Payback 2 images
The owner supplied four screenshots of *Payback 2* (two indoor and two outdoor), where walls, cladding and pavements appear detailed despite visually simple underlying form. The images motivate the hypothesis that **material art and lighting, rather than extensive mesh subdivision**, account for much of their apparent surface richness. They do **not** establish Payback 2's exact renderer, shaders, material assets, compression scheme or geometry: those require actual source/profiling evidence.

### 1.5 Research status
The user requested an exploration of the approach, **not acceptance** of it for GTD buildings. It is a speculative efficiency and realism hypothesis arising from an error and a visual comparison. No new photographic building assets are to be used as a result of this document alone.

---

## 2. Objective, boundaries and definitions

**Research objective:** determine whether image-derived, carefully optimized, physically coherent materials can improve Meridian's **perceived near-field and mid-field surface realism** more effectively, or at less cost, than adding detailed brick/pavement geometry, while preserving structural geometry, camera, physics, lighting continuity, mobile responsiveness and future downloadable/offline level packs.

**Primary measurement:** an A/B improvement in material credibility from controlled player-camera viewpoints and changing daylight conditions, not image resolution or screenshot sharpness alone.

Three independent layers must remain separate:

1. **Geometry / physics:** building mass, facade planes, corners, thresholds, windows, recesses, doors, sidewalks, raised curbs, Rapier colliders, navigation and interaction. These remain genuine 3D objects.
2. **Surface material:** repeatable color/albedo, normals, microsurface roughness, optional occlusion and material variation; applied through reliable mesh UVs/material assignments. An image never invents a doorway or makes a painted bump physically traversable.
3. **Lighting / atmosphere:** Meridian's existing sun, night, artificial lights, shadows, fog, color/exposure and reflections. Texture assets must react coherently rather than carry conflicting baked sun/shadow scenes.

**Separate out of scope:** photographic fake buildings, billboard-only interactive worlds, landscape sky replacement, water replacement, street furniture, NPCs, more world geometry, a new character pipeline, full PBR rollout, changing scene ownership, or declaring Payback's internal technique as fact. These may have distinct research workstreams, not be silently bundled into this one.

---

## 3. Candidate assets and material taxonomy

| Family | Existing geometry to retain | Proposed image-derived material inputs | Near-camera concerns |
|---|---|---|---|
| Residential brickwork | solid wall boxes, structural corners, authored openings | seamless brick **base color**, normal, roughness; optional AO | true brick dimensions, seams, window edges, repetitive tiling |
| Concrete and painted plaster | building mass/walls | fine-grain albedo, roughness, occasional restrained normal | no baked graffiti/shadows unless authored; believable colour family |
| Sidewalk and paving | sidewalk/curb geometry, joints/collision | modular tile albedo, normals and roughness | joint scale, alignment, curb transition, wet/dry response |
| Asphalt and parking | existing road meshes and junction ownership | road aggregate, wear, restrained cracks, normals/roughness | line markings remain separate; no perspective baked into texture |
| Roof membranes | existing roof mass and parapets | roofing grain/seams with roughness | horizontal UV orientation, seam continuity |
| Metal / service hardware | 3D pipes, doors, frames, poles | painted/galvanized metal detail and roughness | correct metallic vs painted response; avoid chrome-like overgloss |
| Glass | actual window geometry | controlled tint/smudges/roughness, optional reflection pipeline | avoid opaque photo windows and false rooms; manage transparency separately |

**First proposed experiment:** a **single already existing South Ward brick building**, with its current geometry, Windows, doors and collision held constant; replace only one wall material assignment under an explicit experimental flag. Compare against the exact existing procedural material and ideally a separate procedural-relief baseline.

Do not generate photographs of complete storefronts or apartment blocks for this experiment: unique windows, doors, view-dependent perspective, text, human figures and baked skylines invalidate a repeating wall material.

---

## 4. Production method: generating useful material imagery

### 4.1 High-resolution master, optimized runtime derivative
A master generated at 2048 or 4096 pixels can preserve source details for cropping, seamless retouching and future channel maps. **Master resolution does not equal gameplay texture resolution.** Deliver the lowest resolution that resolves the material's required screen-space pixels at the test camera distance. A 4K file is not inherently higher quality at a 200px screen footprint.

Source masters should remain outside the runtime build unless explicitly justified. Runtime images must be versioned and local/same-origin, with source provenance, intended physical coverage and content hash.

### 4.2 Image generation requirements
For bricks:
- Seamless, orthographic, tileable **material swatch only**; no whole facade, windows, doors, shadows from lampposts or objects, people, branding or sky.
- Clear real-looking individual brick edges and mortar separation. Preserve **Meridian-approved** colors, bond pattern, brick sizes and wear, not necessarily an exact Earth reference.
- Stable physically plausible light/dark microvariation; **no directional lighting baked into color** that conflicts with Meridian night/day.
- Seamless on all four edges or document a deliberate non-tileable hero material requiring UV-bounded application.
- Enough statistically varied bricks to avoid noticeable repetition from Voight's normal walking range.

For other materials substitute the analogous physical grammar: aligned paver joints, aggregates, plaster grain or metal coatings, as appropriate. Visually validate color space, gamma, clipping, seams and repetition **before** engine integration.

### 4.3 Material channels (progressive, not mandatory)
- **BaseColor/Albedo:** sRGB image of surface color with neutral/removed directional lighting. Not a picture of a scene.
- **Normal:** linear-data tangent-space normals encoding shallow surface relief. Can be generated or estimated from well-controlled height data, then visually verified for correct axis/handedness. A normal map alters highlights, **not actual mesh silhouette/collider**.
- **Roughness:** linear grayscale microfacet response; for bricks generally high roughness, for glazed paint or damp paving lower. Do not confuse albedo darkening with roughness.
- **Metallic:** usually 0 for brick/asphalt/plaster; metal-bearing materials require sensible metal/paint separation.
- **AO:** subtle cavity contact modulation, best for mortar crevices, should not globally darken surfaces or double-apply scene ambient occlusion.
- **Height/parallax:** *optional future investigation* for micro-relief. Parallax mapping is view/shader-cost-sensitive; tessellation/displacement is explicitly outside the initial test.
- **Emissive:** reserved for genuinely luminous assets (LEDs, lamps, signs), not masonry.

Phase 1 can compare albedo-only against the existing material. Phase 2 could add normal/roughness only if basic A/B passes and performance budget permits.

### 4.4 Repeat tiling, physical scale and visual consistency
Adopt explicit **metres per tile** and texel-density targets. UVs must be predictable across facade mass dimensions, floors and LOD; orient mortar horizontally, prevent window edges from stretching, and maintain scale when a building is resized procedurally.

Never use an ad hoc `uScale/vScale` without measuring the physical area of that mesh. Tiling frequency should reflect plausible brick courses and paver dimensions. Check at corners where adjacent walls have independent UV origins; require appropriate seam handling.

Small deterministic color/roughness variations between buildings may reuse the same base material and minimize GPU duplication; avoid generating a completely separate set of 4K textures for each structure. Atlas packing is optional and may be *worse* than independent seamless material tiles because of UV wrap, mip bleeding and repeat compatibility. Evaluate material-by-material.

---

## 5. Proposed integration with the existing GTD system

**Existing verified foundation:**
- `src/game/world-generation/representation-materials.ts` contains deterministic quantized recipes such as `brick`, `brick-relief`, `concrete`, `paving`, `asphalt`, with tint/weathering/UV hooks.
- `surface-textures.ts` creates 64/128px procedural `RawTexture`s and repeats them.
- `material-library.ts` is a **scene-scoped reference-counted shared `StandardMaterial` library**.
- `building-generator.ts` assigns materials by primitive role, preserving generated facade geometry and building physics ownership.
- Babylon.js 9.29.0 currently powers the renderer; the existing StandardMaterial approach approximates roughness/metal response. A complete PBR system has **not** been implemented merely by this research.
- GTD's modern surface system supports deterministic building recipes, LOD, thin instances and resource disposal. Preserve these rules.

**Non-executed candidate contract (illustrative, not current source):**

```ts
interface ExperimentalMaterialAsset {
  readonly id: string;
  readonly surfaceFamily: "brick" | "concrete" | "paving" | "asphalt";
  readonly assetVersion: string;
  readonly metersPerTile: { u: number; v: number };
  readonly baseColorPath: string;    // local allowlisted image
  readonly normalPath?: string;      // optional linear data
  readonly roughnessPath?: string;   // optional linear data
  readonly gpuCompression?: "ktx2" | "none";
  readonly hashes: Readonly<Record<string, string>>;
  readonly fallbackRecipeKey: string;
}
```

**Suggested integration boundary (after explicit authorization only):**
1. Keep `MaterialRecipe` as the deterministic *semantic selection* layer. Attach optional `experimentalAssetId` through a **separate allowlisted experiment overlay**, not global automatic assignment.
2. Resolve local versioned assets through a validated manifest; never dynamically build URL strings from untrusted player text or fetch arbitrary remote photographs.
3. Load shared assets once per scene/pack; use an owned resource manager for GPU material/texture leases, async errors, fallback and disposal.
4. When an image is unavailable or unsupported, **fall back deterministically** to the existing tested procedural brick material without blocking character/world first frame or losing collision.
5. Keep physical building geometry, Rapier collision and authored openings unchanged. LOD transitions should not trigger visible texture popping or reloading storms.
6. Prefer existing StandardMaterial for an **albedo-only minimal prototype**. Evaluate Babylon PBRMaterial for normal/roughness in a later phase; compare shader cost on target devices. Do not quietly replace the scene's entire material architecture.
7. Never use the homepage hero image, site DOM background, accidental alpha holes or CSS transparency as a material source. Asset paths and material assignments must be explicit.

Any new code, scripts, project dependencies, model imports or runtime asset loading must be approved through a distinct experiment authorization and the project's security/checkpoint process.

---

## 6. Cost model, budgets and quality assurance

### 6.1 Filesystem size is not GPU size
For **uncompressed RGBA8** textures, approximate decoded base memory (without mipmaps):
- 512 × 512: **1 MiB**; with full mip chain ≈1.33 MiB.
- 1024 × 1024: **4 MiB**; with mip chain ≈5.33 MiB.
- 2048 × 2048: **16 MiB**; with mip chain ≈21.33 MiB.
- 4096 × 4096: **64 MiB**; with mip chain ≈85.33 MiB.

These figures are **per texture channel**, not per building or automatically per reusable asset. WebP/JPEG compression shrinks transfers but decoded GPU textures can still occupy RGBA-sized storage. Multiple map channels multiply memory. Shared texture leases across many buildings substantially reduce duplicated allocation.

KTX2/Basis GPU block compression might improve runtime memory and streaming on supported hardware, but requires correct transcode support, texture-type selection, quality assessment and fallbacks. Measure it; do not claim that all devices share the same compressed format. Normal maps especially need a compression/artifact review.

### 6.2 Proposed performance measurements (not invented commitments)
For the same desktop/mobile device, camera path, time-of-day and render-quality settings, capture:
- generated procedural control vs albedo-only image-derived variant vs albedo+normal+roughness candidate;
- image transfer bytes and network requests, initial/return visit latency, decoding and GPU upload time;
- draw calls, unique textures/materials, compressed format, decoded estimated VRAM and mip behavior;
- median/p95/p99 frame times, visible stalls, mobile thermal and battery behaviour when practical;
- nearest/widest camera angles, visible tiling, seam alignment and nighttime readability.

Choose actual project budgets only **after baseline measurement**, not before. If the image-derived solution consumes more than the measured mobile headroom or lowers fidelity when walking past corners, reject it or reduce map channels/resolution.

### 6.3 Visual witness and artifact audit
Fixed viewpoints: straight-on daylight, 45° corner during walking, near brick/mortar inspection, medium distance, midday, dusk and night. Require side-by-side screenshots at identical player/camera poses and exposure. Rotate around a facade to verify that windows, doors and physical edges remain 3D and that the material itself does not contain impossible parallax.

Record image source, generated prompt/source class, optimization recipe, channel color spaces, UV scale, file sha, pack version, device, frame metrics, screenshot references and observed defects. A high-quality image in an isolated viewer is not sufficient acceptance in Meridian.

---

## 7. Offline levels, ownership and security

A potential future asset pack might contain `south-ward/materials/v1/{brick-base,brick-normal,brick-roughness}` or compressed equivalents, indexed by a versioned manifest with SHA-256, required/optional status, total bytes, dimensions and fallback recipe. Such a pack is **proposed**, not an installed offline level.

GTD's current VitePWA cache does not demonstrate reliable offline installation of whole 3D levels. A separate future offline gate would need user-initiated installation, quota checks, atomic completeness state, interrupted-download recovery, eviction handling, rollback and consistent pack/schema migration. An incomplete or evicted pack must not be labelled offline-ready.

Restrict runtime asset paths to known same-origin records, accepted MIME/magic types, bounded encoded/decoded dimensions and memory, no active SVG/HTML/script payloads, no untrusted external URLs and no unauthorized third-party copyright material. Preserve provenance for generated images and imported originals; no assumption of unrestricted rights for reference images from other games.

Accessibility/UX concerns include extreme texture contrast, glare, repeating high-frequency patterns, aliasing/moiré, HDR exposure, visually inconsistent brick scales and distracting artificial shadows. Inspect all day/night and quality settings.

---

## 8. Experimental design and decision gates

| Gate | Question | Required evidence | Status |
|---|---|---|---|
| **FIX-01** | Is the accidental homepage image contamination eliminated? | Fully filled opaque masonry buffers, no hero image mounted behind `/game`, focused regression tests, fresh preview and owner inspection | **Patch implemented; live owner confirmation pending** |
| **RND-00** | Does the owner want an image-derived material trial at all? | Separate explicit conceptual authorization and defined asset scope | **NOT AUTHORIZED** |
| **RND-01** | Can a seamless Meridian-style brick swatch be generated with clean maps? | Original master and optimized derivative, provenance, physical scale, seam/normal inspection | **NOT STARTED** |
| **RND-02** | Does it outperform the existing procedural look on *one* building? | Identical geometry/lighting A/B, near/dusk/night walking video or images | **NOT STARTED** |
| **RND-03** | Is it efficient enough for browser/mobile? | Decoded VRAM, file bytes, p95 frame time, load spikes, shared-material leasing | **NOT STARTED** |
| **RND-04** | Is broadening to more surface families justified? | Owner and SEC-CHECK acceptance of style, performance, ownership, failure handling | **NOT AUTHORIZED** |
| **RND-05** | Should it become a GTD building-material standard? | Independent explicit architectural/design approval, documented rollout/rollback | **NOT ACCEPTED** |

**A/B falsification criteria:** if imagery creates visibly fake shadows, seam discontinuities, stretched bricks, shader/VRAM regressions, broken offline dependency handling, untraceable provenance or no meaningful improvement at gameplay camera distances, the hypothesis has not passed. Do not retain a visually impressive close-up at the expense of coherent movement and performance.

### Proposed first asset, if later authorized
One **seamless brick material** for one already-generated South Ward building, first albedo-only, then optional normal/roughness. All building meshes, windows, doors, lighting, colliders and street layout must be byte-for-byte/functionally preserved where practical. No "all buildings" switch, no 4K raw transfer by default, no additional billboard city image.

---

## 9. Explicit approval statement

**This document is an experimental technical research proposal, not an official GTD building-design decision or adopted rendering strategy.**

The owner has **not** accepted high-resolution image-texture assets as the standard for Meridian buildings, has **not** authorized a new photographic material build, and has **not** authorized replacing existing procedural materials, whole facades, sky, water or horizons. The observed image contamination must be removed, not preserved as an implementation technique.

Work that *is* authorized in this turn is limited to patching the accidental photographic-image rendering defect, regression testing, and documenting the hypothesis. Any genuine material-asset experiment requires **separate explicit owner authorization**, scoped objectives, security review and new visual-performance acceptance evidence.

**Outcome requested now:** restore correct graphics; keep the material-realism hypothesis on record so future decisions can be made with evidence rather than assumptions.
