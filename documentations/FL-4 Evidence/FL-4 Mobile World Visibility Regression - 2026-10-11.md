# GTD FL-4 — Android sky-and-cars-only incident and verified recovery

**Incident ID:** GTD-FL4-2026-10-11-WORLD-VISIBILITY-001  
**Date:** 2026-10-11  
**Timestamp standard:** UTC and Africa/Johannesburg (SAST, UTC+02:00) are distinguished below. Unless labeled *Meridian*, times are real-world timestamps.  
**Severity:** SEV-1 gameplay visual integrity / the game opened without its playable world.  
**Affected milestone:** Meridia First Light FL-4 (final mobile optimization and acceptance).  
**Symptom:** Mobile shows flat blue daylight background and three imported sports cars, with no visible ground, roads, sidewalks, buildings, trees, streetlights or Voight. The HUD and clock continue running.  
**Disposition:** **FIX VERIFIED ON USER'S ANDROID PREVIEW; INCIDENT CLOSED FOR THE SPECIFIC VISUAL FAILURE.** Production promotion is separately controlled.  
**Authoritative source:** GitHub repo `interlinkglobal/GTD`; `Meridia First Light Implementation Plan.md`; this file is the incident evidence/response ledger.

## 1. Evidence custody and timestamp integrity

All four user images are from landscape Android gameplay. Screenshot dates are attributed to the surrounding **2026-10-11** conversation. The images contain no EXIF capture timestamps; **09:11** is the visible Android status-bar time in the corrected preview screenshots, not verified EXIF acquisition time. Game clocks such as `14:39`, `14:41`, `15:10` and `15:33` are **fictional Meridian simulation time**, not local clock time and not precise incident timestamps. Screenshot ordering within a message does not independently prove capture chronology.

| Evidence | Context | Observations | Storage / provenance |
| --- | --- | --- | --- |
| Earlier production screenshots (three) | `grand-theft-division.vercel.app/game`; 2026-10-11 incident report | Flat blue sky; three red GLB sports cars appear detached; HUD, touch controls, objective and advancing Meridian clock; ground, Voight and surrounding world absent | Original screenshots supplied in ChatGPT conversation; not committed as binaries in this repository |
| `211389.jpg` | **Corrected preview**, Android status bar 09:11, Meridian **15:10** | Voight, street, sidewalks, buildings/facades, streetlight, imported red sports car, distant imported vehicles restored | 1536×691 JPEG; SHA-256 `b11141c10778de9988a5d4d6df7efa831fb2681633ac0100effd764b93f38ee3` |
| `211391.jpg` | **Corrected preview**, Android status bar 09:11, Meridian **15:33** | Same constructed street environment, Voight and foreground imported buggy, plus distant vehicles, facades and sidewalk | 1536×691 JPEG; SHA-256 `60b8b90d6e59f2aa355895b3242a88d6167c8785a7004020a169627b24d57ea4` |

The two corrected screenshots visibly show the exact branch-preview host:
`gtd-2qw2z6htj-interlinkglobaltech.vercel.app/game`.
User explicitly confirms: **"The error has been patched"** and authorizes incident closeout followed by merge. This establishes mobile visual recovery. It does not independently benchmark sustained FPS, all garage transitions, night conditions, or every world tile.

## 2. Exact release and source timeline

| Real time (UTC) | SAST | Event and immutable identifier |
| --- | --- | --- |
| 2026-10-11 06:23:54Z | 08:23:54 | PR #10 first-frame deadlock fix merged to `main`: `1b7bba05a048e44c7e8183ef56605e4e8007bc68`. This corrected the prior 7/8 waiting screen by accepting Babylon's general after-render event. |
| 2026-10-11 06:24:07.993Z | 08:24:07.993 | Vercel production deployment **created**, `dpl_VCP8H6eWkaqTadBC8xspiLZcw135`. |
| 2026-10-11 06:25:26.160Z | 08:25:26.160 | That production deployment reached **READY** and was associated with `grand-theft-division.vercel.app`. READY means build/alias availability, **not playable scene integrity**. |
| 2026-10-11 (screenshot clock not available) | Not independently established | User supplied three landscape screenshots of the **blue sky plus cars** production failure. |
| 2026-10-11 06:46:24Z | 08:46:24 | First incident document committed on `fix/fl4-visible-world-startup`: `922471c8ec578e60b64fbb289948b74da14cb43f`. Documentation preceded source remediation. |
| 2026-10-11 06:54:33Z | 08:54:33 | Source/test candidate application commit `9286070525c938517d60760db7fc4e712d727574`. |
| 2026-10-11 06:54:54.859Z | 08:54:54.859 | Isolated Vercel preview `dpl_6tK916MWEMvEJ4NRuqYNdsBuouSg` created from above application commit; target is preview (**not production**). |
| 2026-10-11 06:56:30.532Z | 08:56:30.532 | Preview reached **READY**. Strict TypeScript, 104/104 tests in 24 files and `npm run build` passed; `/game` returned HTTP 200. |
| 2026-10-11 06:57:14Z | 08:57:14 | Prior incident verification notes committed: `8c6949faa0ce12fbc9e726c9b8b111f024adfb72`. |
| 2026-10-11, Android clock **09:11** (no EXIF timestamp) | 09:11 displayed | User submitted **two corrected-preview screenshots**. Meridian clock 15:10 and 15:33. Ground, roads, facades, protagonist, vehicles are visibly restored. User accepts correction and authorizes merge after documentation. |

The deployment identifiers and Git SHA values are authoritative for comparing broken/working builds. Never infer a screenshot's UTC capture instant from fictional Meridian game time.

## 3. Source-based technical narrative: what failed

1. `createGeneratedFirstLightWorld(scene, physics, ...)` synchronously creates the ground, streets/sidewalks, generated buildings, vegetation and lighting/scene context. `createVoightPrototype(scene)` creates the protagonist. The accepted GLB vehicle importer intentionally removes **only** legacy procedural parked-car placeholders; it does **not** intentionally remove the city.
2. The original startup-freeze remediation correctly made the game wait for actual GLTF module imports, vehicle GLBs, mesh instantiation and slot-collider readiness, instead of dismissing the loading screen before cars finished. **However it also withheld all `scene.render()` work until after the vehicle pipeline settled.** Shader/material/texture initialization could therefore be deferred until the gameplay transition.
3. The next 7/8-deadlock workaround replaced an unbounded `scene.whenReadyAsync()` wait with `scene.render()` plus `Scene.onAfterRenderObservable`. **This was a false acceptance criterion:** an on-after-render notification only proves a render pass happened. It does **not** prove that critical meshes were submitted/drawn. The actual Android screenshots demonstrate a successful render pass containing sky and imported cars **without** the constructed world.
4. We do **not** have a GPU trace or shader compilation capture from the failing phone. The precise underlying reason other geometry failed to draw is therefore **not proven**. Deferring material warm-up and not validating mesh visibility are the **supported architectural failure path**, not a claim to have identified a particular failed shader. Other potential mechanisms (camera mismatch, frustum/occlusion, GPU/context state) are not ruled out by the old screenshots.
5. Reproducing the defect on actual device was more probative than Vercel server logs, the HTTP 200 response, and the previous 101/101 NullEngine tests. The automated suite had incorrectly tested only a scene-render callback.

## 4. Remediation merged candidate: precisely what changed

**Application candidate branch:** `fix/fl4-visible-world-startup`.  
**Application commit validated by preview:** `9286070525c938517d60760db7fc4e712d727574`.  
**Files:** `src/game/core/gtd-runtime.ts`, `src/game/core/world-render-warmup.ts`, `src/test/fl4-visible-world-startup.test.ts`.

The patch:

- Starts **real** Babylon render warm-up frames **behind the existing loading overlay while GLB cars are importing**. These are not mocked mesh statuses, artificial progress percentages, or playable simulation frames. Vehicle downloads, slot instantiation and collider completion remain actual awaited dependencies.
- Sets the initial ArcRotateCamera target from **Voight's actual spawn** before attempting world draws, rather than keeping a displaced focus until a later physics tick.
- Installs concrete `Mesh.onAfterRenderObservable` witnesses on named **`generated-first-light-ground`** and **`voight-prototype-body`**. They are real meshes not registered as shadow casters in the current world. A generic `Scene.onAfterRenderObservable` or visible car **cannot** satisfy this gate.
- Waits for **a new post-vehicle-settlement world frame** with both witnesses seen before marking final checkpoint done and allowing `runtime.start()`. It does not bypass vehicle asset readiness.
- Uses a finite **12-second post-import real-render deadline**. If no complete witness frame appears, bootstrap throws a diagnostic error describing ground/Voight draw states; the loading overlay is retained. This replaces a silently broken playable world with actionable failure.
- Cancels pending render work on completion, teardown or failure. Leaves accepted imported-only vehicle policy, collision semantics, clarity presets, art and controls untouched.

**Constraint:** Witnesses guard ground and Voight, not every generated road, building, tree or the actual visible pixel colors. User screenshots close the visual-regression acceptance loop for the corrected preview; future broader regressions should add representative building/road/vegetation witnesses or real browser/WebGL screenshot comparisons rather than claim these two witnesses cover everything.

## 5. Verification, failed attempts, and acceptance

The branch had three verification iterations, **none merged prematurely**:

1. Initial Vercel build failed strict TypeScript: `AbstractMesh` does not expose the render observable required here. Changed the witness contract to Babylon `Mesh`; no production change.
2. Next build passed type checking but had **103 passed / 1 failed** because a newly written NullEngine test incorrectly demanded a completed world draw on the very first synchronous scene-render call. This was a **test premise error**, not proof that a mobile world was rendered; the test was refined to assert disabled ground cannot pass. The positive warm-up test exercises real sequential frame ticks and actual mesh witnesses.
3. Validated preview `dpl_6tK916MWEMvEJ4NRuqYNdsBuouSg`: **strict TypeScript passed; 104/104 tests passed in 24 files; production-mode build passed; Vercel READY; HTTP 200**. Then **the user visually confirmed the recovered world on the actual Android preview at the host listed above**.

**Acceptance scope:** closed for "blue sky + cars only" with restored street, buildings, protagonist and imported cars, supported by device screenshots and user confirmation. Other FL-4 performance/quality/garage/night-cycle acceptance remains independent and must not be silently marked passed.

## 6. Recurrence prevention: mandatory release gates

**Rule A — Do not confuse service availability with game readiness.** Passing TypeScript, Vitest, build, Vercel READY and HTTP 200 are necessary software checks but cannot prove GPU scene composition. Every rendering/bootstrap change must include an actual landscape mobile screenshot of **Voight + ground + road/sidewalk + facade/urban context + accepted GLB vehicles** before promotion.

**Rule B — Do not weaken the dependency chain.** Real model-loading and collider completion are required, but Babylon render warm-up must not be starved. Neither a fictional progress-bar completion, generic on-after-render callback, nor a global `whenReadyAsync()` wait by itself constitutes a successful playable-world frame.

**Rule C — Fail visibly with evidence.** If named ground or Voight draw evidence is absent after vehicle settlement, do not dismiss the loading UI. Preserve the error text, stage, missing-mesh booleans, branch SHA, deployment ID, hardware and graphics preset. Keep the old known-working deployment available for comparison.

**Rule D — Compare code and images with the same release.** In a regression, always record both **GitHub SHA** and **Vercel deployment ID/alias**. A local PWA/service worker may retain an older bundle. Record whether test was PWA or Chrome-tab, cold load vs reload, URL, full device browser UI and the simulated game clock separately from real wall time.

**Rule E — Regression coverage.** Keep `fl4-visible-world-startup.test.ts`: disabled-ground rejection, real Babylon mesh witness behavior, render failure handling, and post-GLB settlement before game startup. Add device-browser/WebGL visual integration tests when possible; NullEngine cannot certify visually correct shaders, pixels or every generated object. Do not replace this evidence with success-shaped mocks.

## 7. On-call runbook if the symptom ever returns

1. **Record without modifying production:** Take a landscape screenshot/video of the failed scene including HUD and URL; capture device clock and timezone, game-clock readout, phone model, OS/browser, graphics preset, PWA vs tab, network state, whether controls move, and whether all eight loading checks passed. Preserve image hash and any actual EXIF timestamp.
2. **Determine the failure category:** (a) Stuck at 7/8 → inspect startup checkpoint + vehicle promise + first-frame readiness; (b) 8/8 but sky/cars only → investigate world mesh draw witnesses and camera; (c) Voight and ground draw but facades/roads absent → inspect generated mesh counts/enable states, representation-tier/LOD, materials, frustum and thin instances; (d) world disappears after input → inspect camera obstruction, WebGL context, materials and streaming/lifecycle changes.
3. **Compare exact baselines:** Fetch `main` SHA and Vercel production deployment SHA and compare against last user-accepted working candidate, `9286070525c938517d60760db7fc4e712d727574` (preview) and this incident. Avoid assuming the HEAD of `main` is the same as production.
4. **Collect available diagnostics:** On a diagnostic session use `/game?fl4Diagnostics=1`, export its **local** FL-4 evidence JSON if bootstrap reaches ready; preserve reported viewport/DPR/backing pixels, frame gaps, scene mesh/material/texture counts and GLB status. If startup fails before export, preserve overlay error and build a *separate opt-in* pre-bootstrap dump of real `scene.meshes`, `isEnabled`, `isVisible`, `isReady`, camera target/frustum, mesh render notifications and WebGL context status. Do not invent missing GPU measurements.
5. **Isolate and reproduce:** Create a separate branch; document the defect **before** patching. Add a failing regression test reflecting the real missing-world condition, check the actual Babylon mesh callbacks and visibility/occlusion behavior, patch only the proven failure, verify `npx tsc --noEmit && npm run test && npm run build`.
6. **Visual preview acceptance:** Deploy **preview only**, compare before/after from same phone and scene/time/graphics conditions, and require user confirmation of ground, roads, sidewalks, buildings, trees where visible, Voight and parked cars. Also check controls and garage traversal; identify unsupported checks as pending, never invented passes.
7. **Controlled promotion:** Merge to `main` only after explicit authorization and incident document update. Production deployment is a **separate intentional gate**; never assume merge authorizes a deploy. Preserve old release SHAs and link any new incident to this runbook.

## 8. Closure and release boundary

**Device visual recovery:** confirmed by two Android screenshots and user's explicit acceptance on 2026-10-11.  
**Branch:** `fix/fl4-visible-world-startup` (source verified).  
**Baseline affected:** production `1b7bba05a048e44c7e8183ef56605e4e8007bc68`, Vercel `dpl_VCP8H6eWkaqTadBC8xspiLZcw135`.  
**Corrected preview:** app `9286070525c938517d60760db7fc4e712d727574`, Vercel `dpl_6tK916MWEMvEJ4NRuqYNdsBuouSg`, URL `https://gtd-2qw2z6htj-interlinkglobaltech.vercel.app/game`.

**User authorization:** document incident, **then merge**. No new production deployment was requested in this instruction. Update this ledger with the merge SHA once the merge succeeds. The code-level root cause is a too-weak startup acceptance contract with render work deferred until after vehicle loading; a specific GPU/material readiness defect remains unproven.

## 9. Subsequent changes

This section is reserved for the actual merge commit, merge timestamp (UTC and SAST), any explicitly authorized production deployment, and any further device acceptance. Never backfill speculative timestamps.
