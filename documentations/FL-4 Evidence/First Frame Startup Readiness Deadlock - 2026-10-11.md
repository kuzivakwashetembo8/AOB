# FL-4 first-render startup deadlock — 2026-10-11

**Observed on production:** User screenshot of GTD's actual landscape-mobile loading overlay shows seven verified startup checkpoints completed, with **Render first completed scene** indefinitely **WORKING**. Screenshot is evidence of the visible symptom, not a measured duration or browser-internals trace.

**Affected production baseline:** GitHub `main` at `80541ae93c01c91deedc9c705ec4c6d11d9f2e0a`; Vercel READY deployment `dpl_6Et4WepJYVEB2Du34UJXrjhGiYBK`.

## Source-level diagnosis

The runtime's seventh checkpoint is emitted only after `await importedCarProbe.settled` has completed, which is a genuine completion promise for the asynchronous GLTF loader, off-road and sports GLB imports, instantiation and parked-car collider updates. At that point the loader reports `7/8` with those imports marked passed.

The eighth checkpoint begins, but `GTDGameRuntime.bootstrap()` then performs `await scene.whenReadyAsync()` **before** its first `scene.render()` invocation. A Babylon scene's global readiness can remain pending for unresolved mesh/material/effect/texture readiness and is not equivalent to successful completion of an actual frame. This guard lacks a finite resolution path and prevents gameplay from starting. Screenshot plus source confirm the blocking sequence, without identifying exactly which scene resource (if any) kept Babylon global readiness pending.

## Approved scoped fix

1. Keep all genuine non-simulated checkpoint events, real `importedCarProbe.settled`, loader failures, and the imported-vehicles-only/no-legacy-proxy rule unchanged.
2. Replace the global `scene.whenReadyAsync()` dependency with a real first-render completion gate. `scene.render()` must return without throwing **before** the final checkpoint is passed and the runtime becomes ready. Do not set checkpoint complete on a failed first render or after teardown.
3. Verify the first render with a Babylon NullEngine-backed regression that exercises an actual Scene and validates that its `onAfterRenderObservable` ran before completion is signaled; test that rendering failure cannot report success.
4. Preserve mobile graphics trials and all accepted art/control behavior. No unrelated renderer, physics or world-generation edits.
5. Run `npx tsc --noEmit && npm run test && npm run build` on Vercel preview and again for the exact production merge commit; release only if successful. Verify GitHub `main`, deployment READY, production alias and an HTTP response. **Actual phone UX verification remains user-owned and pending.**

**Failure response:** Keep the loading overlay and report the runtime bootstrap error if synchronous first-frame submission fails. Do not mark a failed render as READY, hide the error or fabricate successful readiness.

**Status at documentation creation:** scoped fix planned; no execution/real-device acceptance claimed.
