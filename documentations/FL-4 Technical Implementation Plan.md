# FL-4 — Optimization and Final Acceptance: Technical Implementation Plan

**Project:** G.T.D — Grand Theft Division / Meridia: First Light  
**Status:** IMPLEMENTATION AUTHORIZED — FL-4 IN PROGRESS; ACCEPTANCE AND DEPLOYMENT PENDING  
**Date:** 2026-10-09  
**Milestone:** FL-4, final First Light phase  
**Planning branch:** `development/meridian-fl3-interaction-atmosphere`  
**Canonical authority:** `documentations/Meridia First Light Implementation Plan.md`  
**Supporting authority:** `documentations/Meridian Game World Development SOT.md`  
**Baseline:** User-accepted FL-3, including garage traversal, collision and camera behavior, dynamic time/atmosphere, approved night illumination and realistic stars.

## 0. Authority, hierarchy and promise contract

This file is a **derived execution contract**, not a replacement for the canonical First Light plan. If interpretation, scope or implementation conflicts arise, `documentations/Meridia First Light Implementation Plan.md` governs, followed by the runtime architecture rules in `documentations/Meridian Game World Development SOT.md`. Stop and request clarification rather than silently broadening the milestone.

### Exact canonical FL-4 requirements

> - Profile CPU/GPU frame behavior where measurable, draw calls, triangles, texture use, memory indicators, scene load time, and re-entry behavior.
> - Test desktop and representative mobile browsers; document hardware, browser, resolution, devicePixelRatio, and thermal behavior where practical.
> - Introduce texture compression, batching, instancing, culling, LOD, and resolution policy only where measurements justify them.
> - Compare the optimized scene to the pre-optimization visual baseline so performance work does not silently degrade the art target.
> - Gate: explicit user visual approval plus acceptable measured responsiveness and stability on tested devices.

**Asset Doctrine distinction:** Section 4 of the First Light Asset Doctrine is **Street Props**; FL-4 is the separate **Optimization and Acceptance phase**. FL-4 evaluates the cost and fidelity of existing implementations of all applicable Asset Doctrine categories (buildings, vegetation, roads, props, vehicle proxy, Voight prototype, atmosphere). It does **not** commission missing high-fidelity vehicles, NPCs, districts, traffic or asset expansion.

**Promise/schema rule:** Steps `FL4-01` through `FL4-06` below are ordered work packages. Each includes actions, output evidence and a pass gate. Treat completion as objectively auditable: no step is marked COMPLETE without the stated artifacts and evidence. A profiling finding may justify **no optimization**; it never justifies inventing an intervention. Record `PASS`, `FAIL`, `BLOCKED` or `NOT APPLICABLE — REASON` for each check. No unmeasured FPS, resolution or savings claim is allowed.

## 1. Gamer-facing acceptance contract

When FL-4 succeeds, a player should encounter **the same accepted Meridian First Light world**, but with appropriately crisp native-display presentation, responsive walking/sprinting/camera movement, stable landscape-mobile rendering, reliable garage traversal, predictable pause/resume/re-entry and preserved day/night/stellar character.

This is not a commitment to 4K on every device, a fixed 60 FPS everywhere, new gameplay, new assets, photographic realism or an unqualified “ultra” setting. It is a commitment to measured, device-appropriate fidelity **without avoidable whole-screen softness** and without a performance regression accepted by assumption.

Observable outcomes to verify:
- **F1 Image clarity:** At normal viewing size, the scene no longer suffers unexplained system-wide blur from render scaling. If a device cannot maintain full native-resolution rendering, the resolution policy is explicit, measured, and quality-selected rather than silently degrading all devices.
- **F2 Fluid control:** Voight, pointer/touch camera and input respond without newly introduced hitches or camera artefacts.
- **F3 Mobile:** Landscape presentation, controls and screen-fit behave correctly across tested device dimensions and pixel ratios.
- **F4 World integrity:** Street, trees, facades, street props, garage threshold/interior, shadows and accepted night sky remain visually coherent.
- **F5 Reliability:** Repeated sessions, pause/resume, resize/orientation, cleanup and recoverable graphics-context scenarios behave consistently.
- **F6 Evidence:** Hardware-specific measurements and before/after captures document improvements and any unresolved limitations.

## 2. Guardrails and scope freeze

**Protected FL-3:** Garage exterior/threshold/interior physical passage; accurate collisions; camera obstruction and interior-radius adaptation; generated architectural semantics; fixed 60 Hz gameplay simulation; Babylon render ownership and Rapier physics; unified arrow-key/mouse and touch input; HUD minimalism; user-accepted night lighting and star morphology/time progression. Do not adjust their visual or functional behavior to inflate frame metrics.

**Allowed only after demonstrated need:** Render-resolution changes, antialiasing/texture sampling adjustments, texture compression, shared materials, batching/thin instancing, culling, LOD, improved resource lifecycle or load behavior, tightly scoped shader/render optimization. Every optimization needs a baseline, named bottleneck and comparative result.

**Explicit exclusions:** New districts, missions, traffic/NPC systems, playable vehicle model, new street-prop content sets, new character art, new weather, relighting, changing accepted stellar design, redesigning the city/garage, speculative engine rewrites, production promotion or unrestricted deployment. Preserve current intentional Vercel build controls.

**Authorization boundary:** Implementation was explicitly authorized by the user on 2026-10-09. This authorization permits FL-4 development/code edits, but does **not** authorize access to private user hardware, preview deployments or production promotion; obtain separate permission for deployment under the canonical plan.

## 3. Execution sequence — exact steps and deliverables

### FL4-01 — Freeze FL-3 baseline and instrument performance

**Actions (in order):**
1. Record branch HEAD SHA, package/runtime versions, active source-of-world selection, accepted FL-3 preview URL, viewport, device, DPR and image settings. Do not assume a previous preview equals the latest source.
2. Define reproducible camera positions and paths: street spawn; street-to-garage entrance; garage threshold; garage interior; garage exit; street facing skyline/trees; midnight looking at sky; sunrise/sunset transition; pause/resume; exit/re-enter `/game`.
3. Add **dev-only, opt-in** measurement instrumentation without per-frame React state ownership or shipping intrusive gamer HUD. Capture CPU frame duration, rendering frame duration/GPU timer when supported, FPS and frame-time distribution (including median/p95), draw calls, active meshes/triangles, materials/textures, estimated resource memory if measurable, initial scene load and re-entry durations. Label APIs unavailable on a browser as `UNAVAILABLE`; do not fabricate GPU timings.
4. Capture repeatable screenshot/video baselines at **actual rendered pixel dimensions**, not only CSS viewport sizes. Save desktop and mobile/landscape reference captures where devices are available.
5. Sample several-minute traversals at both daylight and nighttime, and repeated load/pause/resize/re-entry cycles. Record measurement method, sample duration, thermal/charging state where known.
6. Produce a bottleneck ledger ranking observed cost or failure categories; include explicit evidence when no bottleneck is found.

**Deliverables:** `documentations/FL-4 Evidence/Baseline.md` (or equivalent clearly linked file), benchmark raw data or reproducible capture method, device matrix, FL-3 screenshot/video references, ranked bottleneck table and source SHA. Evidence may include attachments outside Git where size or privacy prevents committing media; link exactly.

**Pass gate:** Baseline is reproducible and measurable; no optimization is authorized solely on an impression.

### FL4-02 — Diagnose mobile and sky/full-screen sharpness

**Actions (in order):**
1. On the same frame, record CSS canvas width/height, backing buffer width/height, Babylon render width/height, devicePixelRatio, hardware scaling level, browser visual viewport/zoom and display orientation.
2. Inspect Babylon engine initialization, resize handling, device-dependent scaling and antialiasing; verify WebGL/WebGPU capability differences and any post-processing, canvas CSS transforms or upscaling.
3. Confirm whether the softness occurs in **3D canvas output**, the UI overlay, star texture alone, or the whole composed screenshot. Distinguish perceptual anti-alias blur from undersized framebuffer scaling.
4. At a controlled frame/scene, compare current rendering against native-device-pixel rendering and sensible intermediate scaling candidates. Measure pixel clarity, p50/p95 frame time, memory and battery/thermal signals when available. Avoid modifying the accepted stellar texture merely because screen-wide rendering is soft.
5. Specify a device-aware, bounded resolution policy only after the comparisons. It should prefer sharp native/near-native rendering where sustainable, define quality fallback and maximum resource limits, respond correctly to resize/orientation, and expose deterministic settings for regression tests. Any dynamic scaler needs explicit hysteresis to avoid constant visible quality oscillation.
6. Check that on-screen touch controls, text/UI overlays and hit targets are not degraded by 3D scaling changes; preserve clear UI independently where practical.
7. Document the proven root cause(s), chosen policy, rejected alternatives and measurable trade-offs. If no cause is reproduced, report `NOT REPRODUCED` with device coverage and stop before speculative changes.

**Deliverables:** `documentations/FL-4 Evidence/Resolution Audit.md` with pixel-dimension table, root-cause evidence, candidate comparisons, proposed or implemented policy and representative screenshots.

**Pass gate:** Sharper output at sustainable frame time on tested devices; no accidental global blur, unstable resolution pumping, touch/viewport regression or opaque device downgrade. No guarantee of maximum native resolution on devices that cannot sustain it.

### FL4-03 — Validate representative desktop/mobile runtime conditions

**Actions (in order):**
1. Publish a device/browser test matrix: browser + version, OS, device/GPU class when available, CSS screen and drawing buffer dimensions, DPR, orientation, refresh rate and thermal observations where practically available.
2. Exercise the same FL4-01 walkthrough on desktop mouse/keyboard and mobile landscape touch. Include walking, sprinting, orbiting upward, both movement directions, garage entry and exit.
3. Exercise pause/resume; tab/background return; `/game` exit/re-entry; rapid resize; landscape orientation change; and, where feasible, graphics context interruption/recovery or an explicit limitation.
4. Record frame-time distributions, loading times, visual artefacts, input correctness, collider/obstruction behavior and observed memory growth after multiple entries. Mark **actual hardware** versus emulator/browser-device emulation clearly.
5. Classify defects by severity and separate pre-existing issues from introduced regressions. Fix FL-4-relevant failures only; seek approval for unrelated behavior changes.

**Deliverables:** `documentations/FL-4 Evidence/Device Validation.md` plus linked test logs/media and a pass/fail matrix. If real mobile hardware cannot be accessed, mark the mobile acceptance gate **BLOCKED**, not PASS.

**Pass gate:** Responsive behavior and stable lifecycle verified on representative real devices; failures tracked and dispositioned.

### FL4-04 — Implement only benchmark-justified optimizations

**Actions (repeat this micro-sequence for each proposed change):**
1. Name the measured bottleneck from FL4-01/02/03, including device, reproduction steps and baseline measurement.
2. Select the lowest-risk remedy relevant to that bottleneck; candidates include compression for memory/bandwidth, compatible geometry or material instancing for repeated props, selective culling, camera-distance LOD with non-distracting transitions, resolving needless material switches/draw calls, or resolution-policy changes from FL4-02.
3. Record affected Asset Doctrine category and how silhouette, collision, shadow, interaction, materials and visual depth remain correct. **Street props follow Doctrine Section 4:** real geometry where silhouette/shadow/collision/interaction requires it; cheaper mesh, decal or texture only where gameplay permits. A number match does not assign street props exclusively to FL-4.
4. Implement a single bounded change, preserve semantic gameplay/physics state, and provide before/after measurements under identical conditions.
5. Run focused automated tests and inspect close/oblique/distant camera angles and continuous motion for geometry, material, shadow, LOD popping, mesh disappearance, sky aliasing and interaction regression.
6. Keep change only when evidence shows a meaningful net improvement without unacceptable visual or stability cost; otherwise revert or document rejection. Do not bundle unrelated changes into one opaque optimization.

**Deliverables:** `documentations/FL-4 Evidence/Optimization Ledger.md` containing per-change ID, source commit, hypothesis, affected category, prior metrics, new metrics, screenshots, automated check, disposition and reviewer notes. A justified `NO CHANGE REQUIRED` is a valid result for an unproblematic subsystem.

**Pass gate:** Every retained optimization has measurements, traceable source diff, visual comparison and no accepted gameplay regression.

### FL4-05 — Whole-scene fidelity and systems regression

**Actions (in order):**
1. Compare accepted FL-3 and optimized FL-4 from matched viewpoints/times/scaling. Include architecture, South Ward street network, curbs, vegetation, street props, parked vehicle proxy, garage exterior/interior, interior roof visibility, light pools, shadows, sky and stars.
2. Repeat movement, physics, garage traversal, interior camera handling, time presets and day/night transitions. The previously approved lighting and stellar style must remain unchanged.
3. Verify Babylon/Rapier ownership boundary, fixed-step simulation, snapshots, pause/resume, disposal/re-entry, stable input semantics and mobile/desktop controls.
4. Run strict TypeScript, relevant lint checks, full available Vitest suite, production build and any additional render/scene regression tests. Report **commands, counts and actual results**, identifying unavailable CI coverage and pre-existing failures.
5. Produce before/after screenshots at **same pixel dimensions** with reference labels and relevant moving-video comparison. Flag any difference in brightness, geometry silhouettes, reflections, shadows or star morphology.

**Deliverables:** `documentations/FL-4 Evidence/Regression Report.md`, automated logs and matched visual comparisons.

**Pass gate:** No newly introduced significant gameplay, image-quality, state, lifecycle or stability defects; unresolved failures are explicit, not silently waived.

### FL4-06 — Final acceptance, deliverables and promotion gate

**Actions (in order):**
1. Consolidate actual observed before/after metrics for the tested device matrix, plus resolution-policy decisions, visual comparisons, optimization ledger, remaining limitations and repeatable reproduction notes.
2. Assemble a full First Light review walkthrough that exhibits street, skyline, tree/props, garage threshold/interior/exit, daytime, dusk and the accepted night sky.
3. Produce a **review preview only after explicit deployment approval** and verify it is READY on exactly the declared source commit; verify routes and logs to the extent tools allow. A successful build or HTTP 200 does not alone establish client-side visual acceptance.
4. Present the user with measurable performance/stability evidence and gamer-facing outcomes: crispness, fluidity, mobile landscape experience, reliable transitions, preserved world appearance.
5. Request **explicit user visual acceptance** and confirmation that responsiveness/stability on actually tested devices is acceptable. Do not self-approve by automated tests.
6. On user acceptance, update canonical `documentations/Meridia First Light Implementation Plan.md` with FL-4 outcome, evidence references, limitations and decision date. Leave `main`/production promotion behind separate explicit authorization.

**Deliverables:** `documentations/FL-4 Evidence/Final Acceptance Report.md`, review preview and traceable acceptance record (only when approved), and canonical Source-of-Truth milestone update on successful acceptance.

**Pass gate:** User approves visuals; measured responsiveness and stability acceptable on documented devices; all earlier gates complete or explicitly scoped and approved. Only then mark `FL-4 COMPLETED` and `FIRST LIGHT ACCEPTED`.

## 4. Machine-checkable acceptance register

| ID | Requirement | Minimum evidence | Required outcome |
| --- | --- | --- | --- |
| A01 | Baseline | SHA, scene path, settings, device specs, measurement protocol | Reproducible |
| A02 | Frame behavior | FPS + CPU/frame-time distribution; GPU if available | Before/after compared |
| A03 | Rendering workload | Draw calls, triangles, texture/material indicators | Counted or limitation explained |
| A04 | Memory/loading | Memory indicators, load, multi-entry results | No uncontrolled regressions |
| A05 | Pixel clarity | CSS/backing/render dimensions, DPR, matched screenshots | Avoidable blur diagnosed and addressed |
| A06 | Mobile | Real landscape-mobile device and browser findings | User-visible output tested |
| A07 | Interaction | Street→garage→street, physics and camera tests | Existing correct behavior preserved |
| A08 | Atmosphere | Matched daylight, dusk, night, star field, streetlights | No unauthorized relighting/degradation |
| A09 | Optimizations | Ledger with bottleneck, change, measurements, disposition | No speculative optimizations |
| A10 | Lifecycle/input | Pause, resume, resize, re-entry, controls, context where possible | No new critical regressions |
| A11 | Code verification | Commands, TypeScript/lint/tests/build logs and counts | No introduced blockers |
| A12 | Final acceptance | Reviewed preview/version, user approval, caveats | Explicit acceptance recorded |

**Evaluation convention:** Each ID receives status `PASS/FAIL/BLOCKED/NOT APPLICABLE` plus evidence location, environment, source SHA and rationale. A known fail cannot be renamed an optimization success. “Unsupported GPU timer” or “thermal sensor unavailable” is disclosed, not invented. Numerical budgets (FPS, p95 milliseconds, draw-call ceiling, GPU memory) must be proposed from FL4-01 measurements and user-approved before they become hard pass/fail thresholds. The target of 60 desktop FPS or 30–60 mobile FPS mentioned in discussion was illustrative, **not** a committed SOT requirement.

## 5. Required implementation-report template

For each work package `FL4-0N`, write:

```text
Step ID / status:
Authority clause from canonical First Light plan:
Starting branch and commit SHA:
Target devices, browser/OS, CSS size, render size, DPR:
Baseline evidence and date:
Hypothesis / issue:
Implemented changes (or NO CHANGE REQUIRED):
Files / commits / preview URL:
Benchmarks before / after / measurement method:
Visual comparison reference:
Test commands and exact outcomes:
Accepted visual/gameplay invariants checked:
Known limitations / failures / blocked checks:
Decision: PASS / FAIL / BLOCKED / N/A (reason):
Authorization / reviewer decision (where required):
```

## 6. Pauses, stop conditions and scope changes

- Stop when an observed problem requires changing locked night lighting, the accepted stellar representation, Voight movement/physics behavior or the garage world layout. Seek a **separate** design approval.
- Stop if prospective optimization introduces a measurable regression without an acceptable, user-reviewed tradeoff.
- Stop if reliable real-device testing is unavailable for a mandatory mobile acceptance claim. Report blocker and request access/evidence rather than claiming completion.
- Any new gameplay, city/asset content, production deployment, or broader system redesign requires separate scope authorization.
- FL-4 was activated by the user's 2026-10-09 authorization, **not** by publication of this plan. Current authoritative phase state is **FL-3 COMPLETED; FL-4 IN PROGRESS**, with actual device testing, optimization proof, final acceptance and deployment still gated.

## Visual realism addendum — decisions and controlled batches

The user-reviewed tree-canopy, window/storey and parked-vehicle observations, their **why** rationale, proposed implementation steps (FL4-VIS-A01–A04, B01–B03, C01–C03) and acceptance register VIS-01–VIS-10 are recorded in [FL-4 Visual Realism — Decision Record and Implementation Plan](./FL-4%20Visual%20Realism%20Decision%20Record%20and%20Implementation%20Plan.md).

This addendum is a subordinate, separately gated visual-fidelity refinement. It does **not** replace canonical FL4-01–FL4-06 performance/device requirements, authorize new vehicle gameplay, or override the First Light Source of Truth. The visual batches are documented for future review; implementation requires explicit authorization. The non-blocking sky-banding issue remains independently tracked in `documentations/Issues/`.

## 7. Definition of Done

FL-4 is complete only when all six ordered packages have auditable evidence, required acceptance checks are satisfied or specifically approved as limitations, rendering sharpness and device-dependent performance are validated without compromising the FL-3 art and gameplay contract, and the user explicitly accepts both visuals and responsiveness/stability. The canonical Source of Truth must then be updated, and **only then** is the First Light milestone closed. Production/main promotion remains a distinct decision.
