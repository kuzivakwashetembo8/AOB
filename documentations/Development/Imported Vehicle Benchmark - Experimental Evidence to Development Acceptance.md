# GTD Imported Vehicle Benchmark — Experimental Evidence → Development Acceptance

**Decision date:** 2026-10-10  
**Decision authority:** GTD user / project owner, following repeated in-world desktop screenshot review.  
**Decision:** **ACCEPTED FOR CONTINUING GAME DEVELOPMENT / TECHNICAL USE ONLY**. The two existing example vehicle specimens are no longer merely disposable comparison objects: retain their calibrated representations in the evolving *development* Meridian City. **NOT commercially licensed; NOT approved for public production distribution or permanent final GTD art.**  
**Milestone relationship:** EXP-VEH-001 graduates into a **developmental vehicle-representation baseline**, but **FL-4 optimization/final acceptance remains OPEN**.  
**Canonical authority:** `documentations/Meridia First Light Implementation Plan.md`; FL-4 contract `documentations/FL-4 Technical Implementation Plan.md`.  
**Original evidence:** `documentations/Experiments/` EXP-VEH-001 specification, initial field observations, Iterations 2–4 and screenshots supplied by the user in the development conversation.

## 1. What was decided — precise scope

The owner approved both original *example* meshes to remain part of GTD's actively evolving game **in the development context**, not solely as temporary vehicles in a named experiment. The acceptance is **visual scale and delivery technique**: the off-road buggy's Iteration 3/4 stance and the sports car's Iteration 4 body proportions are the current **development comparison benchmark** in Meridian City. For subsequent development previews, their imported representation should be the default on the development branch, with an explicit `?gtdVehicleProbe=baseline` switch preserving the old procedural proxy control. The initial vehicle positions, count and generated city semantics remain unchanged.

This decision **does not** establish (a) permission to commercially use the asset files or trademarks, (b) final creative ownership, (c) a game-ready *original* GTD fleet sedan, (d) a reusable final vehicle-drivability rig, (e) acceptable CPU/GPU/mobile budgets, or (f) completion of FL-4. The reference assets are externally fetched under commit-pinned URLs; no third-party GLB binaries were checked into GTD. **A publicly accessible fork is not proof of asset relicensing.** Avoid treating any experiment preview as a cleared public commercial release. Restrict to development/evaluation, record third-party author credit where known, and replace or license before production. The original Ferrari branding and example off-road design must not be misrepresented as original GTD IP.

The previously chosen **first original GTD vehicle** remains an ordinary four-door civilian/fleet sedan: clear older/angular three-box legibility with restrained modern rounded surfacing, a single body/trim design, **color-only** initial variations, built for later drivable extensions. The example sports car and buggy **are not** that sedan.

## 2. Baseline that failed, and the discriminating problem

Initial GTD First Light parked cars were generated as a six-mesh approximation: two loosely automotive-shaped surfaces and four wheel cylinders, with a separate static Rapier collision cuboid. Despite deterministic placement and low rendering cost, screenshots showed a wedge-like toy. The user established a useful content-independent acceptance test: **would an object still be recognized as a vehicle if it were next to a tree or on grass, away from street context?** The proxy could not meet that threshold reliably. Repeated use of hard-coded boxes/polygons was not automatically the most efficient way to meet the target.

The user supplied Drive Quest screenshots as the **minimum visual-fidelity floor** for future GTD cars: sufficient front/side/rear silhouette, paint, glazing, wheels, body detail and road presence comparable in the owner's judgment to Payback 2 vehicle representations. Being a browser/PWA game **does not lower the intended artwork standard**; rendering resources and optimization are **measured engineering constraints**, not a justification for default block-like vehicles.

## 3. Evidence-driven chronology and reference points

| Stage | User question or observed defect | Test / decision | Evidence outcome |
|---|---|---|---|
| 0 — problem definition | A car must be identifiable without the road giving away its meaning | Shift from tweaking a proxy to evaluating a foundational reusable car/asset pipeline | Visual benchmark and reuse intention explicitly settled before new research |
| 1 — target class | Future first GTD car should be civilian/fleet sedan, halfway between angular 1990s and softened contemporary four-door | Single geometry/trim archetype, initial variation **paint color only** | Original sedan is a separate forthcoming asset task |
| 2 — pipeline discovery | Does a browser prohibit high-quality imported vehicle geometry? | Two user-forked browser-game repositories, reference viewer, model comparison | High-quality preauthored `.glb` assets rendered in independent browser viewer |
| 3 — experimental integration | Can Babylon.js render the forked GLBs within *actual* Meridian rather than only an isolated viewer? | EXP-VEH-001 isolated branch; dynamic glTF loader, external pinned GLB URLs, alternating existing car IDs | User screenshots showed both imported models rendered from multiple in-world angles |
| 4 — first footprint test | Cars appeared like children's toys next to Voight, sidewalk and lane | Diagnose uniform normalization to one old collision envelope (1.66×1.48×3.84 m) | The overly constrained fitted scale, not a GLB format limitation, was a direct source-level explanation |
| 5 — class-size Iteration 2 | Preserve each model class, not force buggy to sedan dimensions | Set preliminary target *world length*: buggy **4.05 m**, sports **4.53 m**; preserve X/Y/Z ratios; match imported static collider | User: buggy now substantially more realistic in height; sports significantly improved; refined dimensions still requested |
| 6 — Iteration 3 | Buggy needed a wider stance; sports car looked vertically undersized | Buggy **width ×1.10**, height ×1.00; sports **height ×1.10**, width ×1.00; lengths unchanged | Owner accepted buggy proportions and found sports usable but slightly narrow |
| 7 — Iteration 4 | Would only 5% more sports width improve lane presence? | Sports **width ×1.05 vs Iteration 3**, keeping height ×1.10 and 4.53 m length; buggy unchanged | User's four-angle Iteration 4 screenshots: **“+5%, this is it. Lock it in.”** |
| 8 — promotion decision | Keep both imported examples available as development-world building blocks | Owner authorized elevation from experiment to **technical developmental status** | Recorded by this document; performance, licensing and FL-4 acceptance remain distinct |

**First verified technical pass:** experimental preview `dpl_AKgZ7kPtpnMg9WWrzMNQSdCmXiHB`, source SHA `63a22935eda3cd6fa99d48dd61b261dc157207b6`: sequential TypeScript / Vitest / build; **76 tests / 16 files passed**. Corrected source typing from first failed build; old proxy stayed visible while asynchronous import ran.

**Iteration 2 calibrated size:** `dpl_9Ai7mu64hqLRHDmD5zP78AQSHHDo`, source `b1147110de6e6a4e47b1b3383ede70397901a67a`: **77 tests / 16 files passed**; user captured comparable buggy/sports screenshots. User later inadvertently submitted one screenshot from this older URL to report missing Ferrari; inspection established that missing from one camera field of view does not prove an import failure.

**Iteration 3 accepted visual baseline:** `dpl_4eKaj7bvPhhTXEE27DGfJhnof8F1`, source `e44d0ca41044effe0bbc74b2606b42a47df7b682`, at `https://gtd-o8ycdj9vh-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1`: **78 tests / 16 files passed**; Ferrari confirmed visible in the correct preview, improving height relative to Voight.

**Iteration 4 ACCEPTED development visual benchmark:** `dpl_2jmyF5VqAYPTcoRAiNoc3S3fEQnR`, source `d6692aa989286ee9b49628057aa3a9323e6e9068`, at `https://gtd-4y3ikfozk-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1`: **78 tests / 16 files passed**, Vercel preview READY. User's final submitted screenshots show rear, front and three-quarter/side appearances from Meridian City; owner explicitly locked in the additional +5% width and accepted the buggy's present dimensions.

**What these screenshots actually prove:** the source GLBs can render legibly in the Babylon world; user-accepted proportional correction can be found through real visual feedback; multiple original parked slots remain populated; the assets work in the environment at believable *perceived* human-scale. They do **not** prove equal device performance, CPU/GPU memory behavior, license grants, car driving mechanics, exact tire-to-road physical fidelity or acceptable mobile native-pixel rendering. The user reported no *noticeable* slowdown in an earlier pass; **no paired p50/p95 FPS, draw-call, active-triangle, GPU memory or load-time report has been submitted**. User approval is visual/developmental, not quantified optimization acceptance.

## 4. Locked development-only current calibration

| Specimen | GLB reference / provenance | Length target | Transverse width factor | Vertical height factor | Status |
|---|---|---:|---:|---:|---|
| High-clearance off-road buggy | `interlinkglobal/Car-Game-ThreeJS` @ `f639c35978222d9701514fb35f0d7d965d4136aa`, `public/vehicals/car.glb` (~6.06 MB) | **4.05 m** | **1.10** | **1.00** | Accepted development benchmark |
| Sports car (originally Ferrari 458 representation) | `interlinkglobal/JS-3D-Car` @ `b2ce7c65e4e62e6486a39aed2c7dac89f7c0fa0f`, `models/ferrari.glb` (~1.68 MB) | **4.53 m** | **1.05** | **1.10** | Accepted development benchmark |

Factors multiply an initial uniform length fit; they are *not* the actual exterior widths and heights, which depend on each GLB's imported bounding dimensions. The `worldDimensions` and `finalVisualMetres` diagnostic telemetry can show measured fit after loading. **No silent further scale tweaks** without renewed evidence. Whole-object nonuniform adjustments also deform wheel shape, lighting details and windows; these are acceptable as experimental calibration but should be replaced by proper authored geometry for original production assets if noticeable.

## 5. Actual implementation — how the result works

**Pure specimen metadata / dimension plan:** `src/game/experiments/vehicle-probe-plan.ts`. Enumerates source IDs, commit-pinned `rootUrl`, file names, byte sizes, calibration length, transverse and vertical multipliers. `sourceForExistingSlot(index)` chooses deterministic alternating source assets from sorted existing parked-car semantic IDs. `planImportedVehicleFit(bounds,targetLength,slotScale,shapeAdjustment)` (a) validates finite positive dimensions; (b) infers source's longest ground-plane axis; (c) chooses a *uniform* length normalization, compensating for each existing seeded parking-slot scale; (d) applies controlled width/height corrections; (e) reports final model bounds and warnings. Original model geometry is not modified.

**Browser loader/renderer and lifecycle:** `src/game/experiments/imported-car-evaluation.ts`. Lazy-loads Babylon `@babylonjs/loaders/glTF` matching core version; obtains assets through `loadAssetContainerAsync`; keeps a source template container and uses `instantiateModelsToScene` to render multiple existing car slots. For each instantiation, inserts semantic transform nodes for centering, original orientation, uniform scale, class-specific correction, then planned street world position/yaw. Imported materials/glass/paint/wheels are retained for test fidelity. Imported meshes can receive/cast street shadows. Only after a successful model fit and collider update are the corresponding procedural visual meshes disabled.

**Physics:** `src/game/world/generated-first-light-world.ts` owns the static Rapier physics allocation. For a successfully imported car, `replaceParkedCarCollider(id,worldDimensions)` creates a new static cuboid at the existing parked-car origin and yaw, disposes its previous static collider, and retains ownership for end-of-world cleanup. Geometry and physics stay separate; a cuboid collision hull is deliberately approximate. There is no steering, wheels/axles simulation, traffic, vehicle entry or damage system.

**Runtime switch:** `src/game/core/gtd-runtime.ts` owns the vehicle representation lifecycle. Prior experiment URLs require `?gtdVehicleProbe=imports`; `?gtdVehicleProbe=baseline` leaves procedural cars. The newly authorized development integration may use imports as the *development default* while retaining the baseline override and allowing controlled fallback. **Production/main must remain on its existing source baseline and must not silently activate external models.**

**Fallback and risk:** Before remote asset loading resolves, original proxy cars are visible; after successful imports they disappear in a clearly visible, currently unpolished proxy→GLB switch. If remote source fetch/decode/normalization fails, retain the procedural car and its previous collider, recording `fallback` and the exact failure reason. Real shipping should use a licensed immutable local/CDN artifact, controlled preload/reveal and robust update/dispose handling rather than live GitHub raw URLs. The abrupt proxy swap and external-source runtime dependency are acknowledged developmental limitations, **not** license- or performance-acceptance gates being silently bypassed.

**Automated verification:** `src/test/imported-vehicle-experiment.test.ts` checks deterministic parked placement count/IDs, both source references, exact width/height/length factor behaviors at several seeded slot scales, axis orientation and invalid factors, Rapier collider replacement without persistent body/collider count growth, world disposal and stable old resources. Browser screenshots provide separate user acceptance.

## 6. Quality standard and decisions this work **does not** settle

The immediate visual-development test is **recognition and coherent physical scale at playable third-person distance**, judged relative to Voight, lane/curb, facades and street lighting. This is distinct from a source license, original authorship, drivable-vehicle system or device-wide performance guarantee.

- **Accepted in context:** imported GLB format and renderer *can* meet GTD's quality floor; current calibrations accepted; examples may remain in development as technical assets.
- **Unverified:** published model ownership/commercial-use license, per-model attribution obligations, use of manufacturer names/badges in release, exact CPU/GPU costs, many-copy scaling, mobile landscape sharpness/FPS, collision shape fit at all contacts, loading and repeated re-entry with network errors, whether sources are stable/reliable enough for general staging.
- **Future asset contract:** secure clear rights/produce an original sedan and other props, modify asset's geometry/material/structure to GTD identity, then measure and accept. *Do not treat “public GitHub fork” as a transferable asset license.*
- **Retained alternatives:** procedural original geometry, browser-assisted Spline, licensed model libraries, Blender-assisted authoring on a stronger desktop, and code-authored Blender/GLB hybrids. The positive GLB result **prioritizes** the reusable asset-import workflow; it does not invalidate those authoring options. Blender need not be installed on the user's current laptop.

## 7. Developmental promotion and nonproduction safeguards

The implementation is to be incorporated into `development/meridian-fl4-optimization`, leaving `main` / `grand-theft-division.vercel.app` unchanged. Vehicle example assets become a **development baseline** only after the import default/preservation change passes TypeScript/tests/build and a source-accurate preview is prepared. The prior isolated experiment preview remains immutable as a comparator. Production release approval, licensing review and original vehicle design remain separate future gates.

**Important scope precedence:** FL-4 originally excluded commissioning *new high-quality vehicle libraries*. This **specific, later user authorization** permits retention of two example import specimens within game *development* as a cross-cutting asset-pipeline research result. It does not retroactively mark original FL-4 vehicle-performance requirements complete or give license to introduce unrelated content. Track vehicle development separately while carrying its measured render cost into FL-4's whole-scene acceptance.

## 8. Next verification before other vehicles

1. Verify first cold load, cached load, unsuccessful remote load/fallback and re-entry in development-default mode; capture `__GTD_VEHICLE_PROBE_REPORT__?.()` and console errors.
2. Capture identical user-device `__GTD_FL4_REPORT__?.()` metrics and screenshots for accepted imports vs procedural baseline, same SHA/time/walkthrough, with desktop and real mobile landscape documented separately.
3. Record per-instance meshes, actual triangles/indices, draw calls, materials/textures, allocation/disposal, loading transfer and p50/p95 frame/render durations. Count missing browser GPU/thermal data explicitly rather than inventing it.
4. Inspect curb/lane fit, ground contact, Rapier collision and interior/garage nonregression from player and fixed views. Repeat with extra car copies only under a separately scoped population benchmark.
5. Obtain original model creator/licensing evidence or replace with original GTD assets before commercial/public promotion. Do not remove provenance notes.
6. Advance the canonical FL-4 checklist independently; unresolved mobile softness, window-grammar visual corrections, device validation, optimization decisions and explicit closure gates stay OPEN.

**Decision record:** The owner's direct instruction “+5%, this is it. Lock it in.” completed visual calibration. The subsequent instruction “This experiment must now be lifted from experimental to developmental status ... both example vehicles ... officially part of the game (technical, not commercial production)” converts the accepted comparison result into **developmental authority**, subject to the limits above.
