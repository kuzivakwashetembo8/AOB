# GTD CONTINUATION HANDOFF — Current Source of Truth and Exact Next Action

**As-of:** 2026-10-10, after the FL4-02 mobile clarity patch and production-deployment verification.  
**Project:** G.T.D / Grand Theft Division, set in Meridia (starting city: Meridian City).  
**Task at interruption:** Stop expanding research; finish **Meridia: First Light / FL-4 Optimization and Final Acceptance**, specifically the landscape-mobile render-clarity/device-responsiveness gate.  
**Handoff type:** Durable new-chat resume brief. This is an operational index and current-state reconciliation, NOT a new milestone or replacement for the canonical planning documents.  
**Authoritative plan:** `documentations/Meridia First Light Implementation Plan.md`.  
**FL-4 execution contract:** `documentations/FL-4 Technical Implementation Plan.md`.  
**World engineering authority:** `documentations/Meridian Game World Development SOT.md`.

> **INSTRUCTION TO THE NEXT CHAT:** Read THIS ENTIRE DOCUMENT first, then check current GitHub `main`/production deployment SHA because changes may have occurred after this snapshot. Consult the linked canonical plan and most recent specific evidence record. **Do not re-implement an already merged mobile-resolution patch.** The exact next step is to seek/assess the user's phone evidence from the newly deployed clarity presets, and resolve only demonstrated FL-4 blockers. If a file or source is unavailable, say so, rather than reconstructing history from guesses.

## 1. Critical current status (latest verified reality, not historical snapshots)

At the time this handoff was written:

| Item | Verified state |
|---|---|
| GitHub repository | `interlinkglobal/GTD` |
| Current `main` HEAD **before this handoff document commit** | `946bf49fe516e0d39df42c9e5746d09e10d587b5` (docs-only commit on top of deployed game) |
| Deployed **game code** SHA | `894bcac57e181d93cd5f63a51d73c1331ce89387` (`main`) |
| Current production alias | `https://grand-theft-division.vercel.app/game` |
| Verified Vercel production deployment | `dpl_GmCRG4dtk1Q2kFb7r15iqRb9FpCL`; **READY**; production alias resolved to game-code SHA `894bcac...` |
| Latest implemented game patch | Device-pixel-ratio-aware mobile clarity presets: **Auto, Balanced, Sharper, Native**; runtime and Graphics settings wired; 4 targeted regression tests added |
| Latest specific evidence | `documentations/FL-4 Evidence/Mobile Native Pixel Coverage and Render Clarity Policy - 2026-10-10.md` |
| Latest device observations BEFORE the clarity patch | Touch-camera speed and decorative scanline overlay **user-confirmed fixed**. Imported red sports car visibly present. Whole 3D mobile view still looks **softer** than laptop, analogous to watching a smooth 480p–720p video; still screenshot appears sharper than live moving picture. A few intermittent freezes observed but **NOT reproducible or classified as confirmed recurring defect** |
| Clarity patch user field review | **NOT YET RECEIVED.** Do not claim the new settings cured visible softness or stalls on the actual phone |
| FL-3 milestone | **COMPLETED / USER-ACCEPTED 2026-10-09** |
| FL-4 milestone | **IMPLEMENTED IN MANY AREAS, CONDITIONALLY ACCEPTED DIRECTION, NOT YET UNQUALIFIED COMPLETE.** Real-mobile render-clrity/performance and final FL4-06 acceptance outstanding |
| Commercial GLB rights | **UNVERIFIED.** Public technical mobile-validation deployment is NOT model redistribution/trademark licensing clearance |
| Status of `development/meridian-fl4-optimization` | Branch exists but was behind later mobile `main`; do not assume it contains the newest runtime. At this handoff its HEAD was `4a7e82e2ea8602f5b3ddb14ad1001a4d1dff947c` |
| Production deployment policy | Vercel builds/deploys **deliberately** on request, not uncontrolled commit-triggering. Existing `main` promotion approvals do not authorize unrelated scope changes |

**Important chronology correction:** Prior chat messages treated the DPR clarity fix as the NEXT patch to implement. Independent/concurrent repository activity already implemented it, committed it to `main` and deployed it. Source and production were rechecked while producing this handoff. The next chat should evaluate the EXISTING patch, not duplicate it or revert it out of confusion.

## 2. Immediately next steps — do these, in this order

1. **Reconfirm the latest code/deployment** through GitHub and Vercel; do not assume the handoff's source SHA will remain the latest forever.
2. Ask the user to open the current installed PWA (refresh/reopen after release), go to **Settings → Graphics → 3D render clarity**, and test **Auto** first. Use a consistent Meridian street camera view near Voight and the red sports car, inspect moving imagery, distant windows, road stripes, foliage and body silhouettes. This is the outstanding real-device acceptance gate. The screenshots from the PRE-patch session must not be described as after-patch results.
3. If Auto remains soft, test **Sharper** on the same device/view, then optionally **Native** briefly. Beware higher pixel fill work, expensive imported assets and possible frame hitches. **Balanced** is a supported fallback to legacy render density if frame pacing deteriorates.
4. **If practical**, open `https://grand-theft-division.vercel.app/game?fl4Diagnostics=1` with the desired Graphics clarity choice. Allow the buggy and sports GLBs to visibly appear; use **Save FL-4 data** and provide its JSON. Check `viewport.dpr`, `canvas.cssWidth/Height`, `canvas.backingWidth/Height`, `render.width/height`, `render.hardwareScalingLevel`, `pixelCoverage.nativeCoveragePercent` and sample frame/render p50/p95. This JSON is **not** automatically sent to ChatGPT.
5. Ask for a qualitative comparison: Does Auto or Sharper now feel sufficiently sharp **during movement**, and does dragging/two-finger play remain responsive? User's real in-motion experience is authoritative for visual quality; screenshot sharpness alone can mislead.
6. Treat occasional freezing as a **watch item**, not a confirmed regular bug. Only elevate after repetition with rough elapsed time, location/action/graphics preset and whether it happens while GLBs are loading, while rotating or during an otherwise settled scene. Do not invent GPU/thermal/network root causes.
7. If a genuine issue remains, use **document then narrow patch**: update the existing evidence register, implement a reversible correction in a dedicated branch, pass `npx tsc --noEmit && npm run test && npm run build`, deploy deliberately after authorization, verify alias, and request a precise in-game retest. Avoid unrelated redesign, new city areas or traffic systems.
8. When all stated FL4-01 through FL4-06 gates pass, or the user explicitly approves a documented limitation, record **explicit final acceptance** and update `documentations/Meridia First Light Implementation Plan.md` to FL-4 COMPLETED / FIRST LIGHT ACCEPTED. **Do not do so only because build tests passed.**

**Useful next-chat user request:** "Read `documentations/GTD CONTINUATION HANDOFF - FL-4 MOBILE VALIDATION - 2026-10-10.md` from `interlinkglobal/GTD` `main`, verify live source/deployment and continue FL-4 mobile clarity acceptance without reimplementing completed changes."

## 3. What the game is, and locked user requirements

- **Name:** G.T.D = **Grand Theft Division**; a browser-installable landscape PWA GTA-like **3D action game**, intended for real gameplay and original technical/artistic work.
- **Setting:** Meridia; currently Meridian City / **South Ward First Light**. "People, places and purpose" is the world framing. More cities, missions, traffic, NPCs, helicopters, weather etc. are later directions, not First Light prerequisites.
- **Character:** Voight (single name). The narrative is a vigilante / developing "good guy," not primarily a criminal character. Stylized, believable world akin to grounded/cartoon-realistic GTA San Andreas / Payback 2, not the highest possible human photorealism.
- **Runtime:** React / TanStack Start app shell, Tailwind CSS, Vite/Nitro/Vercel; **Babylon.js 9** renders the 3D game; **Rapier** owns collision/movement; the game uses a **fixed 60 Hz simulation** and React must not own per-frame simulation state. The original Lovable shell is no longer the gameplay runtime.
- **Platforms:** Main gaming experience in **mobile landscape PWA** with a clear/immersive canvas; desktop keyboard/mouse supports arrow keys (preferred by user; WASD also exists), optional visible keyboard control hints and pointer lock. Game HUD should be minimal.
- **Mobile movement/control design:** on-screen **left movement joystick** and right action buttons. **NO second camera joystick.** Direct finger drag on otherwise unoccupied **3D canvas** orbits the camera. A second finger may move using left joystick while first/or another finger drags to look. HUD touch events must not steal the canvas pointer. No drifting after finger-up/pointer cancellation/blur. Desktop mouse remains unchanged.
- **Mobile camera sensitivity:** adjustable in `Settings → Mobile Controls` from 10 to 100, **default 60**, plus vertical inversion. Default gain about `0.0081 rad per CSS pixel`, ~4.05× the earlier slow `0.002` setting. This was **user-confirmed fixed** in actual mobile screenshots on 2026-10-10.
- **Visual style:** roads/pavements convincingly read as city infrastructure; believable articulated building windows/masonry, garages, tree trunks/umbrella canopy, skyline hierarchy, recognizable street furniture and dynamic sun/night/streetlamps/realistic distant stars. Keep the accepted FL-3 lighting and night sky.
- **Decorative scanlines:** an old `.scene-grid` repeating CSS gradient previously sat above Babylon canvas; `<Scene game />` now omits it. Menus may retain aesthetic grid. User confirmed the **horizontal overlay lines were removed**, revealing remaining scene softness. Do not reopen this as a sky-shader defect without new evidence.
- **Interaction:** South Ward garage entry/exit, physical collision, camera wall/roof obstruction, sky/vertical orbit and contextual interior lighting were confirmed in FL-3 on 2026-10-09. Preserve.
- **Deployment discipline:** intentionally select GitHub SHA/branch, run tests, create Vercel deployment and verify READY/alias. Never silently merge unrelated work, especially new designs or unlicensed art.

## 4. Accepted vehicles, rendering architecture and rights boundary

Two visually accepted **development specimen** GLB classes are the only car models in normal GTD gameplay:
- **Off-road buggy**: fork `interlinkglobal/Car-Game-ThreeJS`, pinned source commit `f639c35978222d9701514fb35f0d7d965d4136aa`, `public/vehicals/car.glb` (~6.06 MB); normalized target length **4.05 m**, width multiplier **×1.10**, height **×1.00**.
- **Red sports / Ferrari specimen**: fork `interlinkglobal/JS-3D-Car`, pinned source commit `b2ce7c65e4e62e6486a39aed2c7dac89f7c0fa0f`, `models/ferrari.glb` (~1.68 MB); normalized target length **4.53 m**, width **×1.05**, height **×1.10**.
- Current parked city arrangement has **5 off-road and 4 sports**, at seeded existing parking-slot positions; Rapier static cuboids calibrated on GLB success. Model instances and detailed camera-pass geometry remain present.
- The user **explicitly rejected showing the old procedural car geometry** while a GLB is loading, after failure, or as a far-distance proxy. On loading/failure **leave the parking space empty**, with no invisible legacy parked-car collider; successful import shows accepted GLB with model-sized collider. Never automatically revive old `distanceLOD` or `combined` modes. Only an **explicit nonproduction diagnostics baseline** permits old proxy comparison, not ordinary game rendering.
- Future GTD vehicle classes must be built by **legally modifying accepted/lawfully acquired GLB models** or importing additional suitable licensed models. The first original everyday car may ultimately be an authentic four-door sedan; the example buggy and Ferrari do not define original GTD's final commercial art.
- **Legal caveat:** GitHub fork/source publication does not prove rights in the original 3D asset, imagery, Ferrari trademarks or commercial redistribution. These models are **rights-uncleared development references despite their public mobile-testing deployment**. A commercial release needs asset-level review/replacement/clearance. Document: `documentations/Development/Imported 3D Assets - Foundational Editing and GTD Standard Pipeline.md`.
- Renderer cost: nine detailed car instances introduced significant mesh/shadow complexity. A controlled FL-4 experiment selected up to **4 significant shadow-casting submeshes per car**, preserving high-quality main-camera geometry. Same-code diagnostic observations: **834→352 registered shadow casters**, **932→465 median draw calls**, **~8.11M→3.71M median active indices**. However baseline sample histories were highly unequal (**41 vs 1800 frames**) with GLB loader stalls; **do not claim exact FPS speed-up** from these captures. Current production enables the tested `selectiveShadows` policy. Full-shadow diagnostic rollback remains available where gated.
- Historical status-report pitfall: importer telemetry `loaded` and `slots.status=imported` did NOT always match user-visible car rendering in an earlier shadow-enabled session. A later noShadows screenshot did visually confirm buggy and sports car. **Distinguish model lifecycle from visible framebuffer evidence**.
- Older prototype vehicle performance experiments are recorded at `documentations/FL-4 Evidence/Same-Build Desktop A-B - Imported Vehicles versus Procedural Baselines - 2026-10-10.md` and `documentations/FL-4 Evidence/Shadow Isolation - Imported Cars Visibly Loaded - 2026-10-10.md`. Their preview links/code SHAs are historical; do not use as current production.

## 5. FL-4 completed work and acceptance ledger

The numbered contract is **FL4-01 through FL4-06**. Current milestone status must not be flattened into "everything complete":

| Step | Accomplishment | Present gate |
|---|---|---|
| **FL4-01 measurement** | Opt-in `FL4Diagnostics` reports desktop frame interval, Babylon scene render wall time, draw calls, active meshes/indices, geometry/material/texture counts, registered shadow casters, pixel DPR/backing/render dimensions and startup time. Local JSON export button. Multiple pinned desktop measurements recorded. | **PARTIAL** — representative post-clarity phone capture/frame distributions are not yet verified |
| **FL4-02 sharpness** | Decorative scanlines removed and user accepted that fix; new `renderClarity` policy now on production, functional Auto/Balanced/Sharper/Native. | **PATCHED / AWAITING USER DEVICE VALIDATION**. No claims of guaranteed native output, 60 FPS or full cure |
| **FL4-03 device matrix** | Windows/Chrome desktop screenshots, landscape Android PWA play, touch orbit, left stick, HUD and imported red sports-car presence confirmed. | **PARTIAL** — real mobile pause/re-entry, garage, walking/sprinting stability and responsiveness after clarity changes remain |
| **FL4-04 measured optimization** | Imported-asset shadow participation lowered; selected shader/geometry work documented; approved full-detail cars, not procedural distance LOD. Render-clarity policy implemented based on source analysis. | **TECHNICAL CANDIDATE** — stable perceptual FPS/clarity on actual phone remains to confirm |
| **FL4-05 scene regression** | FL-3 garage/environment maintained, automated physics/disposal/input/lighting tests and positive screenshots. | **PARTIAL** — recheck after image clarity change at landscape mobile for critical controls, physics, shadows and atmosphere |
| **FL4-06 final approval** | User conditionally approved the final FL-4 candidate subject to removing obsolete car placeholders (done); main promotion explicitly authorized for phone validation; accepted touch/scanline corrections. | **OPEN** — clarity user evaluation, stability and explicit final FL-4 acceptance not yet recorded |

- Tests from the prior camera/scanline production release: **90/90 across 20 files** on app SHA `1fd9c648e26ffa70d16aba47005fcefa3e2e57a9`.
- New clarity patch: four targeted automated `src/test/fl4-mobile-render-clarity.test.ts` tests added, strict TypeScript/tests/build chain completed successfully and Vercel READY. The official clarity evidence document intentionally does **not** assert an aggregate new test count because provider logs were truncated when checked.
- The earlier "FL-4 Final Acceptance Report — Morning Reconciliation" contains historical "main unchanged" descriptions and cannot be read as the current production state; this handoff and current GitHub SHA supersede those particular historical statements. The canonical First Light plan still lists FL-4 as **IN PROGRESS** until formal user final acceptance.
- The user wants to **finish FL-4 before continuing unrelated game areas**. Prioritize decisive acceptance, narrow defects and documentation over open-ended asset/Payback investigation.

## 6. Latest mobile evidence (2026-10-10) — do NOT misattribute to clarity patch

The user supplied two actual landscape gameplay screenshots (`211250.jpg` and `211246.jpg`, 1536×691 screenshot pixel dimensions as recorded in issue evidence) from the production session immediately BEFORE the new `renderClarity` implementation. The screenshots show:
- Voight in third-person among city streets and materialized architecture;
- accepted red sports car with recognizable silhouette, rear/front details and road/wheel position;
- left movement joystick, right-hand action buttons and mission/time HUD;
- horizontal decorative scanlines **absent**; sky/roads/facade detail now visible enough to diagnose softness;
- user verbally confirmed **both** prior issues fixed (fast camera control and removed horizontal overlay).
The user reported that a still screenshot looks **sharper than the actual live moving 3D canvas**. They compared live sharpness to a fluid 480p–720p YouTube image, while laptop rendering looked appreciably clearer. These are **subjective analogies**, NOT the actual render-buffer dimension, DPR or measured 480p/720p encoding.
They noticed occasional freezes after movements, **not consistently tested** and explicitly declined to label it a pattern. Do not turn this into a confirmed recurrent performance regression absent reproducible data.
- The original image uploads are chat attachments, **not automatically tracked in GitHub**. Ask for them again only when image-level comparison actually requires bytes; the descriptions and screenshots' filenames remain in the repository evidence.
- The correct current user-facing next step is testing the newly deployed clarity presets, not re-reviewing whether banding or camera sensitivity was fixed.

## 7. The new DPR-aware mobile raster policy — exact current code semantics

Primary source `src/game/renderer/render-clarity.ts` defines:

| Graphics → 3D render clarity | Pixels rendered per CSS pixel (bounded by display DPR) | Intended use |
|---|---|---|
| **Auto** (default) | `min(DPR, 1.75)` on coarse-pointer/touch devices; `min(DPR, 1.5)` on non-coarse desktops | Modest improvement vs old mobile baseline; preserve desktop behavior |
| **Balanced** | `min(DPR, 1.5)` | Known previous-density performance fallback |
| **Sharper** | `min(DPR, 2.0)` | Optional stronger visual detail |
| **Native** | `DPR` | Full physical display pixel density; highest fill cost, not a universal default |

Babylon hardware scaling is **inverse**: `hardwareScalingLevel = max(1, DPR / min(DPR, targetPixelsPerCssPixel))`. Setting above one renders fewer pixels and compositor upscale can soften the canvas. Do not confuse the scalar's direction; bigger hardwareScale means **lower** resolution. For **illustrative DPR 3** the old density/Balanced uses ~25% native physical pixel count, Auto ~34%, Sharper ~44%, Native 100%. The user's actual browser DPR is **not measured** in this conversation.

`src/game/core/gtd-runtime.ts` initializes with the Auto policy; `src/routes/game.tsx` sends persisted `render-clarity` command after bootstrap; resize recomputes scaling. An explicit `?fl4Diagnostics=1&fl4Scale=<0.75..2>` test override still wins over saved setting; **do not use this URL while assessing normal player presets**, unless performing an explicit controlled A/B.
The old `Settings.resolution` dropdown `Native / 75% / 50%` **was inert**. Old saved "Native" was intentionally NOT migrated to the new heavyweight Native preset automatically, preventing surprise performance regressions.

**Current verified code deployment:** code SHA `894bcac57e181d93cd5f63a51d73c1331ce89387`; Vercel `dpl_GmCRG4dtk1Q2kFb7r15iqRb9FpCL`; alias `grand-theft-division.vercel.app` READY. Docs-only `main` SHA immediately before this handoff was `946bf49fe516e0d39df42c9e5746d09e10d587b5`. Exact record `documentations/FL-4 Evidence/Mobile Native Pixel Coverage and Render Clarity Policy - 2026-10-10.md`. Test `src/test/fl4-mobile-render-clarity.test.ts`.

**What remains unknown:** the phone's real CSS viewport, browser DPR, Babylon render/backing pixels under each preset, render/frame p50/p95 after warm-up, player-perceived moving sharpness, heat/fill cost, and whether the sporadic freeze is related to graphics. **Do not present the code-level mechanism as a device-measured resolution cause or approved cure.**

## 8. Technical files a fresh assistant should inspect first

Review in this order (GitHub `main` unless an active, newer branch is explicitly provided):

1. `documentations/GTD CONTINUATION HANDOFF - FL-4 MOBILE VALIDATION - 2026-10-10.md` (this file).
2. `documentations/Meridia First Light Implementation Plan.md` — canonical phases, FL-3 and FL-4 status.
3. `documentations/FL-4 Technical Implementation Plan.md` — exact FL4-01…06, acceptance A01…A12, no invented performance targets.
4. `documentations/FL-4 Evidence/Mobile Native Pixel Coverage and Render Clarity Policy - 2026-10-10.md` — latest patch and production test procedure.
5. `documentations/Issues/Mobile PWA 3D Sharpness - Production Baseline.md` — original GTD-VIS-002 issue (older policy and history; read the newer clarity record for current fix).
6. `documentations/FL-4 Evidence/FL-4 Mobile Camera Sensitivity and 3D Scanline Removal - 2026-10-10.md` — two recently user-accepted mobile fixes.
7. `documentations/FL-4 Evidence/FL-4 User Acceptance Exception - Imported Vehicles Only.md` — binding no-placeholder, no-toy-distance-LOD vehicle policy.
8. `documentations/Development/Imported 3D Assets - Foundational Editing and GTD Standard Pipeline.md` — source/edit/license rules.
9. `documentations/FL-4 Evidence/Same-Build Desktop A-B - Imported Vehicles versus Procedural Baselines - 2026-10-10.md` and `Shadow Isolation - Imported Cars Visibly Loaded - 2026-10-10.md` — historical performance evidence.
10. `src/game/renderer/render-clarity.ts`, `src/game/core/gtd-runtime.ts`, `src/routes/game.tsx`, `src/routes/settings.tsx`, `src/ui/menus/settings-state.ts`, `src/game/debug/fl4-diagnostics.ts`, `src/game/debug/fl4-evidence-export.ts`, `src/test/fl4-mobile-render-clarity.test.ts`.
11. `src/game/experiments/imported-car-evaluation.ts`, `src/game/experiments/fl4-vehicle-optimization.ts`, `src/game/world/generated-first-light-world.ts`, `src/game/physics/rapier-world.ts`.
12. `documentations/Meridian Game World Development SOT.md` if later world/dynamic-building stages resume *after FL-4 closes*.

**Historical docs caveat:** some original implementation plans mention procedural car proxies and distance LOD as a past experiment, and some evidence files describe `main` as untouched or describe older production SHAs. Those are dated historical statements. Do not resurrect already rejected vehicle proxies or assume old release statuses are current.

## 9. Build/branch/merge discipline and tool-specific resumption

- The repo's active production branch is `main`, not the older optimization branch; the exact `main` HEAD can change when this documentation is committed. Use GitHub commit history and current Vercel alias before editing.
- Runtime code is in `src/game/core/gtd-runtime.ts`; React shell under `src/routes` / `src/ui`; settings persisted to browser key `gtd-interface-settings`; asset model URLs in `src/game/experiments/vehicle-probe-plan.ts`.
- Prefer a named `fix/fl4-...` branch for further code changes. Record patch plan BEFORE editing source; implement bounded change; add relevant regression tests; run `npx tsc --noEmit && npm run test && npm run build`; ship only after explicit user approval and Vercel READY verification; verify the deployed alias maps to exact commit SHA.
- Prior PR trail: `#3` initial mobile baseline; `#4` accepted imported-only development cars; `#5` main deployment for mobile validation; `#6` canvas touch camera replacing right camera joystick; `#7` faster adjustable touch input and removal of scanline overlay. The more recent clarity policy was committed directly to `main` as a chain ending in game commit `894bcac...` plus docs SHA `946bf49...`.
- For GitHub/Vercel actions use the currently installed integration tool interfaces (not guessed schemas). Verify explicit user authorization before merging/releasing; Vercel auto builds remain intentionally disabled. An earlier authorization to deploy for mobile validation applied to the FL-4 changes; do not interpret it as unlimited permission for unrelated changes.
- When producing evidence, source-linked code SHA and the user capture's URL, timestamp, device/browser, graphics clarity mode and frame history must accompany every measured conclusion.
- User prefers **document before patch**; avoid long, speculative research now. Follow the numbered implementation plan rather than free-floating enhancement lists.
- Never claim GPU frame-time, GPU memory, thermal sensor output, FPS mean, perfect 60 FPS or commercial model license coverage without actual evidence.

## 10. Broader work beyond FL-4 — keep deferred

The user is developing a living Meridian City and has in earlier work scoped a dynamic city/building generator, rule inheritance, street/block/lot semantics, deterministic city seeds, architecture massing/facade grammar, reusable materials/LOD, GPU batching, geometry/collision/streaming, and credible traffic/people later. Earlier staged branches for Steps 1–3 existed before generated First Light became the live runtime. The live runtime now uses `ACTIVE_FIRST_LIGHT_WORLD_SOURCE = "generated-first-light"` in `src/game/world/first-light-runtime-source.ts`; never mistake archived branch reports for absence of the current implementation.

The user discussed Payback 2's efficient traffic look and might someday provide screenshots/references; **no verified claim about Payback's internal rendering engine or actual mesh/traffic technique has been established from observing its front-end**. New city development, AI traffic, additional cities, 3D people, original playable automobiles, weather and future missions are **not current FL-4 tasks**.

Once FL-4 has explicit user acceptance, read the broader `documentations/Meridian Game World Development SOT.md` and any current follow-on schedule before choosing the next task. Do not automatically declare FL-4 done or initiate another district's implementation.

## 11. Suggested field-review exchange for resumption

The next chat can respond, after verifying current code/deployment:

> "The GTD clarity patch is already live. It adds Graphics → 3D render clarity (Auto, Balanced, Sharper, Native). Please test Auto and Sharper in the mobile landscape PWA from the same street viewpoint. Does the 3D scene look appreciably sharper *while moving*, and is gameplay still responsive? If occasional freezes repeat, describe the route, duration and selected clarity mode. We can use Save FL-4 data under /game?fl4Diagnostics=1 to confirm DPR/render pixels/frame-time before making further changes."

On **positive** user evidence, classify which FL4-02/03/05 gates are now passed; ask only for essential missing information, then seek explicit FL4-06 acceptance without another open-ended research loop. On **negative** user evidence, document exact problem and fix only the demonstrated bottleneck. The PWA screenshots with the improved touch controls and no scanlines already count as accepted results for those two issues.

## 12. What this handoff does and does not claim

This file preserves:
- Source-backed current implementation and verified production identity;
- user decisions and acceptance boundaries from this conversation;
- active mobile clarity/possible-freeze concerns;
- next actions, source files, testing protocol and legal constraints;
- pointers to detailed FL-4 evidence and canonical project plans.

It **does not** incorporate raw screenshot binary assets, personal device performance data that was never supplied, any invented GPU/thermal measurement, a guarantee that all third-party assets are licensed, or retroactive approval of FL-4. The handoff itself is a docs-only GitHub change and must not be confused with a new game-code release.

**LAST VERIFIED IMPLEMENTATION AT DOCUMENT CREATION:** app code SHA `894bcac57e181d93cd5f63a51d73c1331ce89387`, production Vercel READY `dpl_GmCRG4dtk1Q2kFb7r15iqRb9FpCL`, current user-facing next step **mobile Auto/Sharper validation plus any reproducible freeze data**.