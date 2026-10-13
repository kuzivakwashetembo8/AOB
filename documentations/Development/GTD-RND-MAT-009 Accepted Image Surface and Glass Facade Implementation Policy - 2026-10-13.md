# GTD-RND-MAT-009 — Accepted Image Surface & Glass Façade Implementation Policy

**Date:** 2026-10-13 (SAST)  
**Decision authority:** Owner's visual decisions following MAT-003, MAT-006, MAT-007 and MAT-008.  
**Status:** Approved **architectural/rendering policy**, pending visual confirmation of MAT-009 grey-tower correction.  
**Scope:** Existing South Ward building materials. This document does not authorize new surface families, city-wide reassignment, production merge or unverified optical effects.  
**Precedence:** This policy supersedes earlier glass grid/strip and silver-capping recommendations in MAT-007 §1–7 wherever they conflict. Earlier documents remain experimental history.

## 1. Non-negotiable model: surface versus physical structure

Use **image-derived textures to define material appearance** (colour, grain, mortar, image-based tone and restrained sheen). Use **real scene geometry** for physical silhouette and every structure whose depth changes lighting, shadows, camera parallax, contact or interactions: windows, doors, drainage pipes, supports, mullions, transoms and architectural trim. Textures must never pretend to provide the depth of structural elements. No baked cloud/skyline reflections are required for believable glass.

**Material continuity is a separate axis from geometry.** A convincing photograph on a mesh can still fail when different wall boxes restart the image or baked highlight abruptly. Choose the correct UV model per material and per façade mode. Preserve original building massing, doors, collision and camera semantics.

## 2. WALL-01 — Brick (BRK)

**Accepted anchor:** BRK-01 image wall surface on `sw-fl-south-apartment` and `sw-fl-garage`; approved on `main` without a preview query parameter (see MAT-003). Other BRK colourways are registered/trialled but are **not automatically production-accepted**.

- Keep wall, opening and supporting structure as real geometry, with brick patterns mapped onto actual wall surfaces.
- Apply **physical metre-based UVs** across wall sections. The accepted BRK-01 apartment uses `compactA` (1.350 m wide per source repeat); garage uses `standardB` (1.485 m). These presets control visual brick size without altering image resolution.
- Preserve brick and mortar course consistency at seams, corners and window recesses. Study repeats and seam edges before expanding assignments.
- Doors, windows, ledges, corner joints and dimensional detail are independently authored; an image cannot create an opening or collision.
- Prohibit full-building façade pictures as substitutes for geometry, oversized masonry on skyscrapers, and implied 3D trim baked into imagery.

## 3. WALL-02 — Wood (WOOD)

**Accepted family direction:** image-backed low-rise timber surfaces on real geometry, currently `WOOD-01` on `sw-fl-west-support` and `WOOD-03` on `sw-fl-rear-residential` in the branch. WOOD-01…10 are registered assets; individual style selection, performance and deployment beyond the two examples retain their separate approval gates (MAT-006).

- Preserve natural grain/plank direction, board proportions, appropriate tiling and native source aspect ratios. Current trial physical tile width is 1.620 m, with style-specific height.
- Use only where plausible: low-rise houses, residential supports and selected neighbourhood structures. An image is not an open slat, deep overlap, structural beam or physical joinery.
- **Prohibit wood on modern skyscraper bodies, glass towers, high-rise crowns, skyline podium roof caps and metal-framed curtain-wall trims.**
- The earlier WOOD-05/09 tower experiment is historical and has been superseded by glass architecture. Do not infer broad permission to apply timber to all buildings from asset registration.

## 4. WALL-03 — Glass (GLS)

**Accepted visual/material direction:** ten owner-committed pure-glass WebP colourways `GLS-01…10` at `public/assets/surfaces/glass/`, with NO embedded mullions, horizontal lines or object/cloud reflections. These are **opaque glass-look appearance surfaces** in the current Babylon experiment—not a claim of physically correct transmission/refraction or interiors. The owner approved two different architectural modes:

### Mode A — Continuous, unframed/stripless
- Reference: west/blue tower, `sw-fl-skyline-west` / `GLS-01`.
- One *consistent image asset* and **one building-wide UV coordinate system** across every façade wall primitive and every podium/tower mass. Do not restart UVs per box, floor or mass.
- Glass appearance and lighting must read continuously, with no repetitive block boundaries, abrupt brightness shifts, drawn fake separators, or grid geometry.
- **Zero 3D mullions and zero 3D transoms.** Keep physical massing, actual openings and ordinary roof construction; roof trim must not resemble timber. The currently accepted blue-tower appearance is the reference; do not change its colourway, UV crop or roof treatment as part of the grey correction.

### Mode B — Continuous glass under real 3D framing
- Reference: east/grey tower, `sw-fl-skyline-east` / `GLS-03`; east focus control may temporarily substitute any other GLS colourway without changing its structural system.
- Apply the **same full-height, building-wide UV continuity policy** to its *single glass material asset*. A physical mullion does not license per-cell image restarts or light-band resets. The authored image gradient should flow beneath the metal lines.
- Use separate **physical vertical mullions and horizontal transoms** on each façade, aligned to actual floor height, including the podium/tower setbacks. Metal bars have measurable depth and coherent corner geometry, lit by the scene rather than baked into the image.
- **Roof and crown must continue the SAME framing language.** Top-edge perimeter rails should connect visually to vertical mullions and transoms. Metal profile/colour is continuous with the dark framing system, not a contradictory white/silver cap. Remove the pale rooftop strip/slab treatment from framed towers.
- Restrain live specular light so it adds soft, plausible glints instead of harsh rectangular highlight transitions. Use the continuous image as the base; do not install a second per-panel reflection image or a tiled highlight layer.
- Do not add glass-pane window objects, CSG holes, collision proxies or transparency-only tricks. Existing `windowType: none` curtain-wall designation remains correct.

## 5. Explicit behavioural matrix

| Requirement | Brick low-rise | Wood low-rise | Stripless glass | Framed glass |
| --- | --- | --- | --- | --- |
| Core appearance | Image tiled at physical brick scale | Image tiled at physical board scale | One continuous image / building UV | One continuous image / building UV |
| Body / silhouette | Real geometry | Real geometry | Real geometry | Real geometry |
| Distinct image-baked frame bars | Never | Never | Never | Never |
| Structural 3D mullions/transoms | As architecture requires, not image-derived | As architecture requires, not image-derived | **None** | **Required** |
| Roof termination | Plausible independent roof | Plausible low-rise roof | Subtle non-wood treatment | **Dark frame-system perimeter rails** |
| Source continuity criterion | Brick mortar/course seams | Grain/plank seams | No image resets between wall boxes or masses | Same, even beneath bars |
| Current approval extent | BRK-01 apartment + garage production | Low-rise family direction, preview placements | Blue visual reference, preview | Grey physical frames accepted in principle; corrected glass/crown pending owner QA |

## 6. MAT-009 change contract and verification

**Allowed on the existing MAT preview branch only:**
1. Generalise `continuousBlueGlassUV` into a shared continuous glass UV mapper, retaining exact numerical mapping for the blue reference.
2. Apply shared mapping to **every** active grey-tower GLS colourway. A single GLS image is used over the full building envelope; no 27 × 15.2 m repetition beneath mullions.
3. Keep grey mullion/transom dimensions, floor alignment, physical depth and material; extend verticals into the topmost dark perimeter rails, not a white cap.
4. Convert **grey only**: roof perimeter caps become dark architectural frame metal, existing roof slab and applicable roof trim lose the pale/silver material. **Blue is unchanged.**
5. Preserve all roof, wall and collision geometry, pedestrian door, shading, other building assignments and existing ten brick, ten wood and ten glass source assets.

**Automated proof required:** image sources unchanged, grey and blue full-building UVs including podium-tower transition, GLS focus support, grey frame heights/top terminations/material, absence of white cap on grey, blue stripless state, no regressions to brick/wood assignments, collision and scene disposal. Validate with TypeScript, targeted tests, build and isolated preview. **Visual proof still required:** close/far, corners, podium seam, grey gradient continuity, roof top and day/night; owner explicitly confirms before any next material begins.

## 7. Release gate

Do not merge into `main` or treat this preview as final acceptance without explicit owner instruction. MAT-009 ends at a testable preview plus evidence. Only after visual confirmation do we proceed to the next material family (WALL-04, stone, unless the owner redirects).
