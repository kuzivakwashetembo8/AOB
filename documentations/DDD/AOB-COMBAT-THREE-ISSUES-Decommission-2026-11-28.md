# Procedure DDD — Combat Three-Issue Implementation

**Date:** 2026-11-28 (Africa/Johannesburg)  
**Decision:** **FAILED / DECOMMISSIONED — NO MERGE, NO FURTHER IMPLEMENTATION ON THIS BRANCH**  
**Authority:** Owner instruction: “Try one more time, if it fails again, initiate DDD process.” The final authorized preview attempt failed.  
**Experimental branch:** `fix/combat-walk-fire-muzzle-auto-20261128`  
**Accepted baseline:** `main` at `9b1141d86add8d27af376813ec76757f669d594b`  
**Failed implementation head:** `32fa07fee3edda6042502e49c3d22814b3af1bd8`  
**Disposition:** Preserve this historical report on `main`; do not merge or cherry-pick the experimental runtime/test changes. Reset the experiment branch to the report-bearing `main` snapshot, then delete the branch manually if GitHub tooling permits. Production remains untouched.

## 1. Intended purpose

Isolated implementation of three combat presentation changes:
1. Retain ordinary walking lower-body locomotion while firing.
2. Remove visible muzzle flame geometry while retaining muzzle-positioned light.
3. Add continuous held-trigger automatic fire for M4A1 and MPX-9, with P19 remaining semi-automatic; release and invalid gameplay states stop firing. No arbitrary burst-duration or shot-count cap was intended.

No projectile, damage, ammunition or reload system was in scope.

## 2. Work performed

The experiment changed seven files relative to the accepted baseline:
- `src/game/audio/vehicle/procedural-vehicle-audio-021.ts`
- `src/game/character/reese-muzzle-spark-010.ts`
- `src/game/character/reese-player-001.ts`
- `src/game/experiments/north-heights-city-8.ts`
- `src/test/combat-automatic-fire-012.test.ts` (added)
- `src/test/lms-gun-muzzle-fx-011.test.ts`
- `src/test/reese-player-001.test.ts`

The work was committed on an isolated branch. No changes were merged to `main`, and no production deployment was requested or performed.

## 3. Build and test evidence

Two preview builds for this implementation failed:

| Deployment | Commit | Result |
| --- | --- | --- |
| `dpl_2DCzSTNvxUDnL5Di6458mz7xJr9d` | `9421137796cd1404c458a39aae2b28b5f8ef012f` | ERROR |
| `dpl_VzXvS6YrRgN3j9SZBBsAThiFSV57` | `32fa07fee3edda6042502e49c3d22814b3af1bd8` | ERROR |

The first failure exposed a source-contract test expecting the old `createReesePlayer001(scene)` call. That assertion was updated to reflect the callback-enabled actor construction, and a second preview was triggered as the final authorized attempt.

The second build completed the asset-audit/extraction, TypeScript and prebuild stages, then failed in Vitest:
- **828 tests passed; 3 failed** (831 total).
- **195 test files passed; 3 failed** (198 total).
- The final application build stage was not reached.
- One retained failure trace identifies `src/test/poi010-acceptance.test.ts` and a stale assertion expecting `length: 8` in `reese-muzzle-spark-010.ts`. The current requested implementation deliberately replaces the former visible spark pool with a light-only muzzle effect. The retained event slice does not expose the full details of the other two failing test files; their causes are therefore **unknown and not inferred**.

The second preview URL is `https://age-of-abundance-928mxoyyt-kuzivakwashetembo8s-projects.vercel.app`. The first is `https://age-of-abundance-i5236vugb-kuzivakwashetembo8s-projects.vercel.app`. Both are failed, abandoned previews and must not be promoted.

## 4. Failure assessment

**Conclusive gate failure:** The required full Vitest suite did not pass, so the branch did not qualify for a successful build or gameplay acceptance. The result is not evidence that the three gameplay changes are visually or functionally correct or incorrect; those runtime acceptance checks were not reached.

**Known process weakness:** The implementation was advanced to preview without first reconciling all legacy source-contract tests affected by the intended behavior changes. Updating one stale assertion did not establish a green focused suite or full regression suite before the next deployment.

**Unknowns:** The causes of two of the three failing test files are not available in the retained deployment event output. No claim is made about their root causes. The final application bundle was not built, and no browser/device gameplay acceptance was completed.

## 5. Protected baseline and rejected work

- `main` at `9b1141d86add8d27af376813ec76757f669d594b` is the accepted recovery point.
- All seven experimental code/test file changes are rejected for merge and cherry-pick.
- Do not carry the branch's automatic-fire audio, actor wiring, muzzle-light implementation, locomotion composition, or test changes into production.
- Preserve unrelated accepted character, locomotion, weapon, audio, vehicle and world systems on `main`.
- Both Vercel deployments are abandoned preview artifacts; neither is a production release.
- Do not attempt another build or feature repair on this decommissioned branch without a new explicit owner authorization and a separately scoped plan.

## 6. DDD closure gates

- [x] Final authorized retry failed; owner-authorized DDD condition met.
- [x] Captured deployment IDs, commits, URLs, test totals and known failure evidence.
- [x] Recorded unknown failure causes without inventing diagnoses.
- [x] No merge or production deployment performed.
- [ ] Reset experimental branch to the report-bearing `main` commit and verify zero code diff.
- [ ] Permanently delete `fix/combat-walk-fire-muzzle-auto-20261128` if a branch-delete capability is available; otherwise owner/manual GitHub deletion is required.
- [ ] Treat both preview URLs as abandoned; do not promote.

**Verdict:** Combat three-issue experiment rejected and decommissioned. The report is historical evidence only. `main` remains the sole accepted source baseline.
