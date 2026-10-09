# GTD Realistic Night Sky Implementation

Status: PROPOSED — AWAITING EXPLICIT IMPLEMENTATION AUTHORIZATION  
Date: 2026-10-09  
Project: G.T.D — Grand Theft Division / Meridia First Light, FL-3 Interaction and Atmosphere  
Repository: `interlinkglobal/GTD`  
Planning branch: `development/meridian-fl3-interaction-atmosphere`  
Scope: celestial rendering correction only; no gameplay, urban lighting, or environment-system redesign.

## 1. Decision and visual target

The existing city-night lighting is visually accepted and **LOCKED**, except where an independently verified regression requires a separately approved correction. Meridian must remain readable at midnight: Voight, roads, facades, building volumes, garage interior, and practical streetlights must retain the current illumination relationships.

The outstanding defect is the **representation of distant stars**. The current night sky looks like isolated square/pixel particles on a relatively flat navy background. The intended result is a vast atmospheric sky in which most stars are tiny, subtly luminous, nearly round points that register collectively rather than as inspectable objects. Ordinary player translation must yield effectively zero stellar parallax.

Visual references provided 2026-10-09: (1) a cinematic open-world night scene with thousands of fine stars, diffuse celestial haze, cloud/atmosphere layers, and terrain silhouettes; (2) GTD's current 05:27 view, showing isolated angular square stars. References are diagnostic, **not** permission to copy imagery, proprietary assets, visual branding, or an exact Milky Way design.

**Acceptance sentence:** When Voight looks up, the player perceives astronomical distance rather than discrete square-shaped objects suspended above Meridian.

## 2. Current implementation baseline (inspect again before modification)

Source: `src/game/world/environment-controller.ts` on the FL-3 development branch, reviewed against the current branch on 2026-10-09.

- `createStarTexture()` constructs a deterministic 2048 × 1024 RGBA `RawTexture`, sampling with `Texture.BILINEAR_SAMPLINGMODE`, named `meridian-procedural-star-field`.
- A seeded generator attempts 4,600 stars; horizon attenuation drops some attempts. Most candidates write one core texel; a smaller bright class writes an eight-neighbour ring; rare halos use another discrete ring. Actual rendered star count is **not** 4,600 and should be measured.
- `createSky()` uses nested sky/star spheres with `infiniteDistance = true`; the star material uses diffuse, emissive, and opacity references to the RGBA texture plus alpha blending.
- `apply()` controls sky colour, star visibility/alpha, fog, sunrise/sunset, sun, ambient and night-fill, streetlight and interior lights. Keep all pre-approved lighting parameters unchanged.
- The test `src/test/environment-controller.test.ts` verifies texture dimensions, basic environmental state, and disposal, but **does not** prove pixel shape, star density, depth impression, visual stability, or mobile performance.
- At prior inspection, Vercel preview for commit `14a0ec5` reported READY with 10 test files / 64 tests passing. That establishes build/test status, **not** sky visual acceptance.

Before editing, re-read the branch head and this file, compare latest changes, and confirm that this plan still matches actual code. Do not overwrite intervening work.

## 3. Root-cause hypotheses to validate

1. **Screen-space footprint and square geometry.** Bilinear sampling cannot make a large enough texel footprint genuinely circular; alpha coverage and projected UV gradients determine whether individual texels still appear as squares.
2. **Sampling and mip behaviour.** Mipmap generation, trilinear/anisotropic filtering, minification and texture LOD can introduce aliasing, disappearances, blockiness, or inconsistent intensity. Inspect actual texture/material settings and browser GPU output.
3. **Blending pipeline.** Referencing the same RGBA texture through diffuse, emissive and opacity may alter luminance/coverage nonlinearly. Verify effective alpha and blending instead of assuming the authored texel values map directly to perceived brightness.
4. **Distribution and scale.** A nominal 4,600 draws, reduced by extinction, may still leave the field sparse; visible stars may be biased towards too few brightness/size classes.
5. **Atmospheric integration.** The sky gradient, absence of faint diffuse structure and mechanical lower-band extinction may leave an artificial flat background.
6. **Projection and geometry.** Dome UVs, low sphere segmentation, seam/pole stretching and field-of-view may change apparent star size across view directions.

These are hypotheses, not established diagnoses. Inspect the baseline screenshots and capture new renders before selecting a change.

## 4. Implementation sequence (gated)

### Phase A — Baseline and instrumentation (no rendering changes)

- Record exact branch, SHA and preview URL; take reproducible frames at midnight, 05:27 and twilight, looking upward, across the horizon and during a slow camera yaw.
- Capture desktop and mobile/landscape views at native rendering sizes and the device pixel ratio. Record selected FOV, render scaling, material options and actual screen-space star footprint.
- Distinguish source star attempts, accepted candidate count, nonzero texture pixels, visible stars after projection, and draw/performance cost. Use seeded results for reproducibility.
- Establish a visual-diff baseline for street and garage at midnight; save night-fill, ambient, local-light settings as regression invariants.

### Phase B — Point-spread representation

- Preserve deterministic seeded generation and the infinite-distance dome while replacing any hard-edged cross, square or repeated geometric star signatures.
- Generate **subpixel-centred, radially weighted coverage** across adjacent pixels rather than stamping hard-edged 1 × 1 cores or fixed equal-valued neighbour rings. Vary subpixel location to avoid repeated templates and sharp cardinal/diagonal patterns.
- Evaluate premultiplied/straight alpha handling and material channel interactions. Choose a compositing route with predictable brightness and opacity; do not double-apply alpha unintentionally.
- Evaluate mip filtering, gamma/colour-space conversion and texture minification. Use a texture/material configuration that yields tiny softly circular pinpoints at the target render resolution. Do not simply blur the entire sky.
- Keep the great majority of stars extremely small; allow rare brighter points with only faint compact haloes. Avoid four-point flares entirely. Treat the ratios below as tuning starts, not requirements to override visual evidence: approximately 90–94% faint pinpoints, 5–9% somewhat brighter, <1% halo candidates.
- If a CPU-written panorama cannot achieve the required screen-space point-spread reliably across device scales, prototype a **minimal dedicated procedural star shader** (angular-direction-based points/coverage with controlled antialiasing). Prefer the simplest demonstrably correct approach; avoid a costly renderer rewrite.

### Phase C — Stellar field composition and astronomical scale

- Tune the **apparent** star count upward while keeping per-star prominence low. Measure rendered angular size and visible density at normal play FOV; do not optimize a raw generator count alone.
- Use a continuous brightness distribution with a strong bias toward dim stars, sparse bright accents, subtle star colour variance only if visually justified, and spatially nonuniform clustering rather than an obvious even grid.
- Prefer spherical/angularly coherent distribution so coverage does not stretch unnaturally at dome poles, the texture seam remains invisible, and yaw/pitch do not expose patterns.
- Account for the difference between a sky sphere's UV vertical axis and actual angular elevation. Implement atmospheric extinction **as a function of elevation above the visible horizon**, not arbitrary texture row alone; avoid a detectable horizontal cutoff.
- Maintain astronomical stability: translation of Voight must not shift stars; camera rotation reveals different celestial directions smoothly without particle-like motion or shimmering.
- If useful, test only a **very faint** large-scale stellar-density modulation or diffuse galactic band. This is an optional second-pass experiment; it must not become an oversized decorative Milky Way. The more elaborate moon/cloud/weather sky is **out of scope** for this patch.

### Phase D — Atmospheric cohesion without relighting

- Blend lower-elevation stellar contrast smoothly into existing twilight/horizon treatment, maintaining dimmer visibility near the horizon.
- A subtle spatially varying sky/haze layer may be evaluated only if it demonstrably enhances scale and does not alter scene illumination; sky appearance and light emitted onto streets are distinct systems.
- Preserve sky-night colour, scene fog, directional/ambient/night-fill intensities, garage lighting, practical streetlight colour/range/intensity, and time-of-day progression unless a specific untouched visual invariant cannot be met; any requested change to those values is a **separate approval gate**.
- Do not introduce conspicuous astrophotography-grade stars, complex weather effects or expensive volumetrics in this patch.

### Phase E — Verification and review

**Automated**
- Extend `src/test/environment-controller.test.ts` and/or a focused star-generator test suite with deterministic seed/repeatability, texture size and sampling configuration, disposal, valid alpha range, brightness-population distribution, and tests for extinction continuity and no obvious repeated cross-pattern (where pixel data is accessible).
- Add seam and pole / angular sampling tests if the representation changes.
- Re-run the full available tests, production build, TypeScript checks and lint. Report the *actual* commands, failures and outcomes. Existing unrelated lint debt must be distinguished from introduced errors.
- Verify memory/resource lifecycle and that time presets and night/dawn transitions still work.

**Visual (mandatory before acceptance)**
- Compare the GTD scene against user-supplied references as principles, not asset-copy targets.
- At native desktop and landscape mobile resolution, test midnight, pre-dawn (including ~05:27), twilight, low-angle views and zenith.
- Check no square texels, hard crosses, repeated sprite motifs, blocky clusters, visible UV seams, hard extinction bands, shimmer, excessive haloing or obvious parallax.
- Inspect while standing, walking, rotating the camera, changing FOV if supported, and entering/exiting the garage.
- Validate that Voight, road edges, facade volume, streetlight pools and garage remain as readable as the accepted baseline. Side-by-side captures are required.
- Compare responsiveness/render stability and FPS or frame times against a same-device baseline; any material regression requires profiling or rollback rather than assuming acceptable cost.

## 5. Explicit non-goals and change boundaries

**Do not** adjust existing city-night brightness, increase global illumination, change streetlight pools, alter gameplay/camera/physics/UI, add gameplay objects, migrate the world generator, change deployment policy, or promote to `main` as part of the sky patch.

Do not depend on the reference game's proprietary textures, models or astronomy art. No deployment or branch promotion without a deliberate review decision.

Retain `infiniteDistance`; moving the dome to very large world-space coordinates does not solve perceived distance and may harm precision.

## 6. Acceptance matrix

| Gate | Pass criterion | Evidence |
| --- | --- | --- |
| G1 — Source integrity | Celestial-only diff; approved lighting constants and local light behaviour preserved | Reviewed diff and regression assertions |
| G2 — Point morphology | Stars look fine, round or softly irregular; no inspectable square texels or cross templates | Zoomed captures at target device pixels + real-size frames |
| G3 — Perceived depth | Distant, collective stellar field; varied luminance, tiny angular footprints and no translation parallax | Camera-view/movement video plus side-by-side reference comparison |
| G4 — Atmosphere | Smooth horizon extinction, no arbitrary line, no exaggerated galaxy | Zenith-to-horizon captures at midnight/pre-dawn |
| G5 — Stability | No obvious shimmer, pole/seam artefact or time-transition popping | Rotation and dawn/dusk video |
| G6 — Performance | No material device-specific frame-time, allocation or memory regression | Same-device before/after measurements |
| G7 — Existing game | City and garage lighting, interactability and FL-3 functions unchanged | Night street/garage captures; tests/build |

No numerical star-size, count or FPS threshold is asserted without device measurements; define measurable tolerances from Phase A and report them before calling the patch accepted.

## 7. Delivery protocol / authorization

1. **Current state: PLAN ONLY.** This document authorizes neither changes to rendering code nor deployment.
2. After explicit user greenlight, implement Phases A–E in small coherent commits on the active development branch, reporting any necessary scope deviation before proceeding.
3. Deliver source diff, test/build report, benchmark observations, baseline-versus-new screenshots/videos, remaining known limitations and the exact preview commit/deployment identifier if a preview was separately authorized.
4. Await the user's **visual acceptance** before considering the celestial defect closed.
5. Keep production promotion and any subsequent lighting or large-scale atmosphere initiatives as independent decisions.

## 8. Governing project documents

- `documentations/Meridia First Light Implementation Plan.md` — FL-3 milestone and scope.
- `documentations/Meridian Game World Development SOT.md` — technical world authority.
- `documentations/For Overnight Schedules.md` — project verification and intentional-deployment standards.
- This document is the **task-specific implementation plan** for the realistic night-sky correction and does not supersede the above documents beyond the explicitly locked lighting requirement.
