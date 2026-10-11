# FL-4 mobile world visibility regression — 2026-10-11

**Severity:** High / scene is visually unusable. **Disposition:** open; no `main` merge or production deployment authorized until device-level confirmation.

## Ground-truth observation

User submitted **three landscape Android screenshots** after production deployment `dpl_VCP8H6eWkaqTadBC8xspiLZcw135` at GitHub `main` `1b7bba05a048e44c7e8183ef56605e4e8007bc68`.

Each screenshot contains a flat blue daylight/sky field, the HUD (garage objective, game clock, touch controls), and three imported red sports cars floating with no visible city context. **No ground, roads, sidewalks, buildings, trees, streetlights or Voight are visible.** The HUD time advances from ~14:39 to ~14:41; the game UI has passed bootstrap and is updating. The screenshots do *not* prove that game meshes were disposed or never constructed, nor that physics, shaders, frustum culling, occlusion, or GPU context loss is the precise mechanism. Imported GLB visibility establishes some WebGL/scene drawing continues.

## Source inspection and falsifiable hypothesis

- `createGeneratedFirstLightWorld` synchronously constructs ground, road/sidewalk geometry, generated buildings, trees, garage props, lights and collision; `createVoightPrototype` also constructs visible meshes.
- `beginImportedCarEvaluation` suppresses **only** named procedural vehicle placeholders and their colliders; this routine does not intentionally hide city geometry.
- In pre-checklist gameplay, the render loop started while external GLB downloads were pending. The 2026-10-11 startup refactor inverted the ordering: no `scene.render()` until the full GLTF load/instantiation pipeline resolved. An intermediate fix awaited `scene.whenReadyAsync()` before first render, hanging at 7/8 on the actual phone. The subsequent bypass marks the scene ready on `onAfterRenderObservable`, which fires for *any* render pass, even one displaying only sky and cars. The screenshot confirms **completion is falsely equated to visual completeness**.
- Strong working hypothesis: delaying all scene render work until after imported car preparation postpones or starves shader/material/texture/world preparation; bypassing global readiness allows incomplete output. An independent camera placement/culling problem remains possible; instrument genuine world-mesh draw evidence to distinguish them. This hypothesis must be confirmed or rejected by an actual preview run.

## Scoped branch remediation / proof obligations

1. Preserve genuine GLB asset, slot and collider checkpoint semantics, imported-car-only visual policy, accepted mobile sharpness/touch behavior, nighttime atmosphere, and FL-4 rendering-quality presets.
2. With the loading overlay still visible, allow the **real Babylon scene** to render warm-up frames concurrently with GLB loading. Do **not** start simulation/input or dismiss the overlay while warming up. Restore camera targeting around Voight's actual spawn **before** first render.
3. Require real draw-pass evidence from existing named `generated-first-light-ground` and `voight-prototype-body` meshes. A Babylon frame/after-render event alone is insufficient. Witness callbacks must be registered on real meshes, never synthetic completion booleans.
4. After vehicles settle, require a fresh **post-import** frame in which both world witnesses are drawn, before reporting eighth checkpoint and starting gameplay. If evidence is missing after a bounded number of actual render attempts, surface an explicit failed-startup error and keep the loading overlay, rather than silently opening a broken game or indefinitely showing WORKING.
5. Avoid unintended shadow-map render evidence by choosing ground and Voight, which are not registered as shadow casters in current live world.
6. Add unit/integration tests with actual Babylon NullEngine meshes and render notifications. Validate cancellation and errors. Build `npx tsc --noEmit && npm run test && npm run build` in an isolated Vercel preview, without merging.
7. **Acceptance requires human visual proof** of the actual generated ground, roads, facades, trees and Voight together with imported vehicles on the user's mobile landscape device, plus continued control/collision behavior. A passing NullEngine test or READY preview alone does not prove this fixed.

## Release boundary and comparison

- Broken production baseline (preserve): `1b7bba05a048e44c7e8183ef56605e4e8007bc68`, `dpl_VCP8H6eWkaqTadBC8xspiLZcw135`.
- Candidate branch: `fix/fl4-visible-world-startup`. **No auto-merge to main.**
- The Oct-10 accepted last known complete-world scene and visually accepted imported vehicles remain the intended reference. Do not change world objects, materials or the look of the two approved imported car sources while testing.
- Exact cause and final fix status: **unverified until live WebGL/device observation**.

## Branch implementation and verification ledger

- **Implementation candidate:** GitHub commit `9286070525c938517d60760db7fc4e712d727574` on `fix/fl4-visible-world-startup`. Modifies `src/game/core/gtd-runtime.ts`; introduces `src/game/core/world-render-warmup.ts` and `src/test/fl4-visible-world-startup.test.ts`.
- **First candidate verification:** strict TS blocked on an `AbstractMesh`/concrete `Mesh` callback type error. Corrected in the branch; no production effect.
- **Second candidate verification:** 103 passing, one failing test because it required a *synchronous, first-NullEngine-render* witness despite graphics initialization being allowed to require genuine sequential frame attempts. The positive readiness contract is covered by the separate warmup test; the invalid initial-frame assertion was replaced by a negative test that disables ground and confirms the gate refuses incomplete output.
- **Validated third candidate:** Vercel preview `dpl_6tK916MWEMvEJ4NRuqYNdsBuouSg` built from app commit `9286070525c938517d60760db7fc4e712d727574`: **READY**; `npx tsc --noEmit` passed; **104/104 Vitest tests across 24 files passed**; `npm run build` completed; preview `/game` returned HTTP 200. These are compile/server/build checks, **not proof** of Android visual correctness.
- **Preview for actual user mobile assessment:** https://gtd-2qw2z6htj-interlinkglobaltech.vercel.app/game — Vercel team authentication may be required. Open in landscape and assess complete world (ground/roads/buildings/trees/Voight), cars, movement, and pause/return. If a startup error occurs, capture its exact text and a screenshot; the error will report ground/Voight draw evidence rather than falsely declaring 8/8.
- **Production unchanged:** `main` is still `1b7bba05a048e44c7e8183ef56605e4e8007bc68`. No PR merge, production deployment or other world-art modifications authorized or performed. Keep this candidate pending on-device visual confirmation.

**Follow-up if incomplete:** If ground/Voight witnesses never draw, use reported boolean evidence to investigate generated `StandardMaterial` readiness/shader compilation, sky depth/culling and mobile WebGL capabilities; do not bypass the gate a second time or cover scene failure with HUD. If witnesses draw but buildings/trees remain absent, widen the witnesses to representative road/building/tree meshes after inspecting the scene and camera, and confirm visible pixels in the actual device.
