# GTD-CHAR-120F — Anatomical sprint arm-chain recovery
Date: 2026-10-22 (Africa/Johannesburg)
Branch: feat/char-120-natural-athletic-sprinting-20261022
Baseline: e08bdf6e81293d421aa029805bc0531e06bf5b05
Status: authorized implementation; visual acceptance pending.

## Defect
Owner references proper arm bending.png and proper arm swinging.png show the distinction between a bent elbow and a correctly carried running arm. Voight's hand can remain near the thigh or behind the hip despite increased local forearm rotation. Preserve accepted legs, travel speed, torso and walking.

## Code findings
CHAR-120C inverts the complete mean forearm quaternion rather than a calibrated elbow hinge. CHAR-120E rotates the upper arm toward a wrist target but fixes forearm flexion, does not constrain the elbow plane, and accepts relative error reduction rather than absolute anatomical success. Synthetic rigs do not establish actual character.glb silhouette correctness. The bake's bind-parent basis and playback's relaxed neutral basis differ; this is a contributor hypothesis to measure, not a proven isolated cause.

## Implementation plan (recorded before code)
1. Reconstruct the actual character.glb hierarchy and skin; verify its Git blob identity against the branch. Measure baseline shoulder/elbow/wrist positions over the authored sprint cycle.
2. Recover anatomical shoulder-elbow-wrist trajectories from the existing UAL Sprint_Loop at build time, in an explicit body frame. Preserve source timing; do not invent a new gait oscillator.
3. Map source directions and elbow bend onto target segment lengths. Define a reachable wrist target and an elbow pole from the source bend plane. Calibrate the target neutral arm frame, including its plane, before applying rotations.
4. Replace the old mean-inversion/wrist-only correction in the live sprint arm path with a coordinated arm-chain solution. Enforce finite transforms, safe geometry and exact neutral restoration. Blend with walking without accumulating per-frame corrections.
5. Verify actual-rig elbow angle, pole direction, wrist position, bilateral phase and yaw/scale behavior over a full cycle. Check untouched joint rotations against the baseline and inspect skinned side/front renders. Update obsolete tests that enshrine the superseded local-quaternion implementation, retaining regression protection.
6. Commit implementation and evidence; publish one intentional preview of the tested commit. Verify deployment status and release identity. Main and production remain unchanged.

## Acceptance
Leading forearm carried forward and upward, trailing elbow behind/beside torso with hand near the hip; no backwards folding, torso crossing, shoulder displacement or leg regression. Geometry tests are necessary but the owner retains final in-game visual acceptance.

## Execution
- Documentation committed first: b8955a79207ef7338dc3e18498e6a5ecbd250537.
- Verified actual character.glb Git blob: 609ec8da25b61e8e3eaea1975a014520c34a07c3.
- Implemented build-time armMotion directions from UAL Sprint_Loop in pelvis coordinates (+Y up, +Z forward; left +X). Source segment translations were audited: only pelvis translates, which cancels in pelvis-relative arm directions. Original 22 quaternion tracks and lower-body bake are unchanged. Exact first/last direction closure removes a small source seam mismatch.
- Runtime maps authored upper/lower directions onto actual target segment lengths. A paired-vector frame fixes upper-arm swing AND twist/bend plane; the forearm then bends within that plane toward the reachable wrist target. Both absolute elbow and wrist positions must pass a length-relative tolerance. Capture CHAR-109 neutral before playback; blend from accepted walk, reset every frame, and expose sprintArmFailures.
- The loaded sprint file must contain armMotion; an old cached quaternion-only file fails visibly instead of silently using the superseded correction. Legacy quaternion-only helpers remain for historical fixture compatibility but are not the live path for newly baked clips.
- Actual GLB hierarchy evaluated at 80 phases. Elbow flexion (0 degrees straight): baseline 23.3–57.1 degrees; candidate 78.8–93.9 degrees. Leading wrist below its shoulder: baseline 0.407–0.512 m; candidate 0.110–0.267 m. Candidate leading wrist stays more than 0.20 m forward of its shoulder.
- CPU skinning using actual vertex weights and inverse bind matrices inspected at side phases 0/50%, front phase 0%, three-quarter phase 25%. The raised leading forearm and rear elbow/hip carriage are visible; this is an offline skinned witness, not an in-game browser capture.
- All other local joint rotations were identical to baseline across the measured sprint cycle. Hand-local and finger poses are retained; this patch addresses the arm chain.
- Focused tests: 16/16 passed, including 6 new actual-GLB tests. Absolute elbow/wrist target error below 0.00002 model units across 80 phases; yaw, uniform scale and reflected root covered. Tests also require no torso-midline crossing, 75–100 degree flexion, continuous motion, neutral reset, walking preservation, unchanged non-arm joints and zero solver failures.
- Strict TypeScript check of changed runtime and test modules passed. Existing CHAR-120 lower-body sagittal audit passed, corrected symmetry ratio 0.979.
- Run npm run prebuild before npm test so actual-rig tests consume freshly baked assets.
- Preview deployment and complete repository build/test gate pending. Owner visual acceptance remains pending.

## Deployment repair: failed staging build on 22 October 2026

- Failed URL: `https://gtd-b13i4asbb-interlinkglobaltech.vercel.app/game`; deployment `dpl_EurUuUyAQhBsYg1GzvFYUeZZAeWv`, commit `8d05594712ddb70a3412de55df9b1f20dbffbfd6` (state `ERROR`; `lint_or_type_error`).
- Exact compiler diagnostic: `src/test/char120f-actual-arm-chain.test.ts(78,103) TS2379`. An attempted legacy fixture set `armMotion: undefined`, incompatible with the optional `SprintClip120.armMotion` under `exactOptionalPropertyTypes: true`. The fixture must **omit** the key; production types remain strict. This test-only correction was already present when the repair was inspected.
- Additional build-order mismatch: the Vercel build command runs `npx tsc --noEmit && npx vitest run && npm run build`. The new actual-GLB test reads `char110-ual-walk.json` and `char120-ual-sprint.json` at module initialization; both JSON artifacts are intentionally untracked. Without earlier generation, Vitest fails before `prebuild` runs automatically under `npm run build`.
- Repair commit `488d0bbb1bfff94f24e165ebfb1bd1316cbd4e5f` adds guarded `npm run prebuild` to the new test's clean-checkout fixture preparation. The generator runs only if either JSON fixture is absent. No sprint runtime, GLB, gait, geometry or physics implementation was changed by this commit.
- Replacement deployment `dpl_EC2Q6mGKApdtbKscABjhy4Pc9DYV` was created using that repair commit. **Build and visual verification pending at the time of this log.** Do not consider a passing TypeScript check evidence of an accepted sprint animation.

## CHAR-120F staging recovery follow-up — validation in progress

- The original staging deploy `dpl_EurUuUyAQhBsYg1GzvFYUeZZAeWv` failed before tests at strict TypeScript `TS2379`; the fixture omitted optional `armMotion` rather than assigning `undefined` in `97b90b14a9d3bfcdd3adb0be933fb8cc7fdf0a98`.
- Initial replacement `dpl_8z4FsayTFYVnrJRiSHt2FF9v3hPm` passed TypeScript and **431 individual tests**, but had one test *collection* failure in `char120f-actual-arm-chain.test.ts`: `src/test/setup.ts` references global `window`, while that test requested `@vitest-environment node`. The reported Vercel error code `ENOENT` was not an adequate description of the actual test log; the **logged cause was `ReferenceError: window is not defined`**, not an animation solver failure.
- Independent fixture commit `488d0bbb1bfff94f24e165ebfb1bd1316cbd4e5f` already adds guarded generation for the untracked sprint/walk JSON if missing. Build-order fix `30cb027eaed7ef4e364fd17393efbc5734366017` further invokes `npm run prebuild` before `npx vitest run` from `vercel.json` so all prebuild-derived fixtures exist before test collection. `npm run build` still handles its documented lifecycle as before.
- Targeted test environment fix `f1bf653f5a25973693fa6f95145d2a786b484908` changes only that Vitest directive to `@vitest-environment jsdom` so the shared `window`-dependent setup is supported. No CHAR-120F runtime joint solver, raw GLB, authored sprint track, vehicle or world code was changed in these recovery patches.
- Obsolete queued deployment `dpl_Bg9QkXxje1h6cUNa1V32YC262NYf` was canceled after an improved test-environment fix became available; separate older deploy `dpl_EC2Q6mGKApdtbKscABjhy4Pc9DYV` failed its test collection.
- **Successful replacement:** `dpl_HqfT9UBs8dN3RrjFsBjiKz6HZREh` deployed code release `f1bf653f5a25973693fa6f95145d2a786b484908` to `https://gtd-6qfclsjli-interlinkglobaltech.vercel.app/game`. Deployment state **READY**; strict TypeScript passed; **437/437 tests passed in 111 files**, including all six CHAR-120F actual-GLB arm-chain tests. The walking/sprint bake and gait audits passed, and PWA inventory reported **442 resources / zero missing mandatory**. Verified HTTP 200 on `/game`, `/build-version.json` (exact release SHA), and `/GLBs/Characters/char120-ual-sprint.json` (41 `armMotion` samples on both sides). No runtime solver, GLB, world, or driving code was changed for this deployment repair. **Owner visual sprint acceptance still pending; `main` and production untouched.**

## Owner visual acceptance — 2026-10-22

- **Owner decision:** The CHAR-120F running posture is **accepted**. The 2026-10-22 15:10 mobile browser screenshot on the verified preview `https://gtd-6qfclsjli-interlinkglobaltech.vercel.app/game` shows recognizable, acceptable sprint arm and leg articulation. The owner explicitly calls the result a significant improvement and authorizes merge to `main` followed by production deployment before further refinements.
- **Acceptance scope:** The current complete sprint posture / baseline, not all possible future refinements. Protect accepted walking, driving, flying, gait cadence, game assets and CHAR-120F arm chain from regression.
- **Production release:** Merge commit and deployment URL to be verified separately. No alteration of approved runtime behavior in the acceptance documentation commit.
