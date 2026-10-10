# FL-4 — User acceptance exception: imported development vehicles only

**Date:** 2026-10-10  
**Authorization:** User replied **"Yes with one exception"** to the FL-4 closeout candidate: there is no reason to render older procedural car templates while waiting for accepted off-road buggy and sports-car GLBs; future car designs must be derived from editing accepted vehicles or importing additional suitable 3D assets. This is a binding GTD **development art policy**, not permission to distribute the two third-party models commercially.  
**Branch:** `review/fl4-final-acceptance-candidate`; **source app SHA:** `1125249db71dcdcd85cd10e055f6f565c16ae689`; **verification state:** VERIFIED — Vercel `dpl_DYUR4hFCRpxR4r1SjwNHmKjAadwt` READY; TypeScript, 83/83 tests across 18 files, and application build passed.  
**Release boundary:** technical development only. `main` and production remain unchanged.

## 1. Approved vehicle representation policy

The *default development game* has just two approved parked-vehicle reference classes: the imported off-road buggy and the imported sports car. Keep exact approved original GLB geometry/materials, calibrated proportions, static parked placement IDs, street positions, yaw and count (5 buggy; 4 sports), pending license clearance.

**Do not display the old procedural/placeholder car graphics** in the import path:
- not while loader code initializes,
- not during GLB download/decoding/instantiation,
- not after a model import failure or timeout,
- not while the camera is far from a car, and
- not as a future source of new vehicle classes.

**On initial world creation:** the existing vehicle proxy meshes are synchronously disabled **before the first gameplay render frame**. The original parked-car static Rapier boxes are simultaneously suspended; no invisible proxy collider remains where the actual GLB has not yet appeared.

**On accepted GLB success:** instantiate the accepted model at its current calibrated dimensions and existing position, register its static model-sized Rapier collision and accepted shadow policy, report the model as `imported`. This activates only the imported vehicle, not two superimposed visuals.

**On accepted GLB failure:** the slot remains **visibly empty and non-colliding**, with an explicit `failed` status and error reason in existing FL-4 diagnostics. Failures must not silently reintroduce old models. Visible empty spaces reveal dependency failures and preserve credible game visuals. Load latency can still produce initially empty parking spaces and late vehicle appearance; that is a known asset-delivery limitation and should not be confused with a declared instant-render success.

**On camera distance changes:** no previous `distanceLOD`, `combined`, or procedural-backfill behavior is allowed. The approved GLB remains visually full-detail at all view distances while active. If future rendering budgets require LOD, derive it from an edited/optimized licensed vehicle asset rather than a geometry-unrelated toy-like procedural substitute.

**Only historical diagnostic exception:** explicit `?gtdVehicleProbe=baseline` retains a manually selected procedural comparison view on nonproduction preview for prior A/B reproducibility. This is not ordinary GTD gameplay, an automatic fallback, or an approved future vehicle design.

## 2. Technical implementation and tests

- `src/game/experiments/imported-car-evaluation.ts`: replaces asynchronous legacy-proxy-then-import transitions with immediate `suppressLegacyParkedCarPlaceholders(world)`; keeps accepted imported GLBs, materials, per-car fit, instantiation, source error reporting, and shadow registration. Removes no-longer-authorized procedural distance-LOD transition/observer. Report includes zero visible legacy templates/zero distant proxy slots.
- `src/game/world/generated-first-light-world.ts`: new `suspendParkedCarColliders()` disposes the nine old car physics boxes and removes their registrations while imports are absent. Existing `replaceParkedCarCollider()` accepts a known slot with no preexisting collider, creating an appropriately sized body after successful import. Other static collisions, walking camera and garage remain unchanged.
- `src/game/experiments/fl4-vehicle-optimization.ts`: valid modes are `full` and `selectiveShadows` only. Obsolete `distanceLOD`/`combined` flags cannot restore old cars.
- `src/test/imported-vehicle-experiment.test.ts`: asserts all six template meshes per car are disabled, colliders for the known parked slots disappear until import success, repeated suspension is safe, body-sized collider replacement does not leak bodies, and world disposal restores the original resource count.
- `src/test/fl4-vehicle-optimization.test.ts`: asserts all obsolete LOD query modes reject the procedural fallback, while the selected shadow optimization remains explicitly gated.

**Legacy renderer code retained for comparison and historical testing is NOT an approved art-output pipeline.** The approved new vehicle pipeline is model import/inspection → licensed edit/derivation → GTD-calibrated asset → runtime integration → physics/material/shadow/LOD tuning → measured QA, consistent with `documentations/Development/Imported 3D Assets - Foundational Editing and GTD Standard Pipeline.md`.

## 3. Closure disposition

The user has **accepted the closeout candidate subject to this one mandatory visual exception**. The exception is implemented in this branch but its **build and actual user-device visual demonstration must be verified** before treating the resulting build as fully accepted. The existing canonical FL4-02 mobile-sharpness and FL4-03/05 real-play/landscape regressions are not retroactively claimed passed without evidence. Known commercial/redistribution license obligations remain independent of FL-4 technical development acceptance.

On a READY preview:
1. Confirm no procedural cars appear at any time; initially empty parking spaces while remote GLBs load are now intended behavior.
2. Confirm the buggy and sports model both eventually appear, at accepted street scale, with acceptable light/contact shadowing.
3. Walk into each once it appears to confirm physical blocking, and through an unloaded empty slot (if accessible) to confirm there is no invisible collider.
4. Verify South Ward garage traversal, Voight, streets, trees, day/night and basic desktop/landscape-mobile controls remain functional.
5. Update the First Light canonical milestone register only after supported acceptance gates have been dispositioned; **do not automatically promote to public production**.

The intent is to close FL-4 efficiently without additional speculative research or unrelated art tasks.

## Verified immutable closeout test build

The exact code SHA `1125249db71dcdcd85cd10e055f6f565c16ae689` successfully completed the chained `npx tsc --noEmit && npm run test && npm run build` command; **83 tests passed across 18 test files**. Nonproduction Vercel preview `dpl_DYUR4hFCRpxR4r1SjwNHmKjAadwt` is **READY** at `https://gtd-9r7dn47x2-interlinkglobaltech.vercel.app/game?fl4FinalReview=1`. This verifies code compilation, correct unit/integration acceptance policies and deployment readiness, not real-device visual loading, mobile sharpness or acceptable frame time. The accepted imported-only vehicle presentation should be validated once in a real browser at this exact SHA; FL4-02 mobile issue GTD-VIS-002 and performance concerns remain disclosed and open until evidenced or deliberately dispositioned.
