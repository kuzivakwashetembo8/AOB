# GTD-LMS-GUN-002 — Reese Long-Gun Stance Implementation Record

**Date:** 2026-11-26  
**Status:** Implementation committed; Vercel Preview READY; runtime visual review pending  
**AOB source branch:** `main` at `4d01815a87cbde2002d1ea7f95714c88d1eb61e1`  
**Working branch:** `feature/lms-reese-long-gun-stance-002`  
**Scope:** M4A1 and MPX-9 two-handed long-gun handling; preserve P-19 pistol handling

## 1. Source-of-truth and branch decision

The previously used Preview branch, `feat/cod-muzzle-flash-fpv-integration`, is not equivalent to `main`.

GitHub comparison reported:

- `main` is 4 commits ahead of the former Preview branch.
- The former Preview branch is 1 commit ahead of `main`.
- The refs have diverged; the old branch contains the earlier technical plan commit.

Per owner direction, implementation was therefore started on a new branch from `main`, not by continuing the diverged Preview branch. The working branch was created at the then-current `main` HEAD.

## 2. AOB implementation changes

### `src/game/character/reese-player-001.ts`

- Added explicit weapon classification: `m4a1` and `mpx9` are long guns; `p19` is not.
- Added pure selection helpers for the long-gun locomotion clip family.
- Bound the existing Reese GLB animation groups using the 3d-gen export display names:
  - `Rifle idle (low ready)`
  - `Rifle aim idle`
  - `Rifle fire (single)`
  - `Rifle walk (aiming)`
  - `Rifle run`
  - `Rifle sprint`
- Long-gun idle, walk, run and sprint now select the corresponding rifle animation groups.
- Long-gun combat selects `rifle_fire`; P-19 continues to select the existing `pistol_fire` and `pistol_aim` groups.
- Added runtime diagnostics that report the resolved rifle clip names and measure the left wrist against the selected weapon's authored `gripL` landmark. A support-hand error above 40 mm is reported as a warning.
- Existing weapon mounting continues to use the established right-hand mount and `gripR` alignment. The Rapier capsule, locomotion controller, first-person presentation, hidden-driving behavior, weapon allocation and muzzle effect paths were not intentionally redesigned.

### `src/game/weapons/gun-runtime-001.ts`

No change. The existing weapon metadata already contains `gripR`, `gripL` and `muzzle` landmarks for the three weapons. The implementation consumes the existing `gripL` metadata for runtime alignment diagnostics.

### Tests

Updated `src/test/reese-player-001.test.ts` to cover:

- Resolution of the authored rifle clip display names.
- M4A1/MPX-9 versus P-19 weapon classification.
- Idle/walk/run/sprint clip selection.
- Rifle-fire versus pistol-fire routing.
- Use of the authored support-grip landmark and preservation of the P-19 aim path.

The final Vercel build executed **809 tests across 197 test files: 809 passed, 0 failed**. TypeScript checking also passed. The first full run had one failed assertion in this new test file: the test expected non-optional `root.metadata?.gripL`, while the implementation correctly uses `root?.metadata?.gripL`. The assertion was corrected and the complete suite rerun successfully.

## 3. 3d-gen source inspection (read-only)

Owner authorized access to `3d-gen`. The repository was inspected to verify the animation and export contracts. **No files in 3d-gen were changed.**

Relevant findings:

- `src/core/anim/clips/shooter.ts` defines the rifle idle, aim, single/automatic fire, reload, walk, run, sprint, strafe and crouch clip family. Rifle samples contain left- and right-hand IK targets.
- `src/core/anim/evaluate.ts` resolves the rifle support-hand target from the fitted weapon frame and runs two-bone arm IK. The support-hand target is a wrist target in chest space.
- `Animator.frameOf()` applies the support-hand solve before returning the frame. `Animator.bake()` samples the resulting full skeleton pose, so the arm pose is baked into the animation data rather than requiring the 3d-gen evaluator at AOB runtime.
- `src/export/glb.ts` writes each exported glTF animation's name from `BakedClip.name`. The display names listed in Section 2 are therefore the correct explicit aliases for the source clip catalogue.
- `src/core/rig/socket.ts` defines the `WeaponR` socket as a child of the right hand, centred from the closed-fist landmarks.

The AOB runtime uses the existing embedded Reese GLB and does not load a second character or import the 3d-gen runtime.

**Asset verification limitation:** the GLB binary itself was not decoded during this source audit. The source catalogue and exporter establish the expected names and animation construction, but do not prove that the checked-in AOB GLB contains every expected rifle group. AOB now logs the resolved group names when the asset loads; the Preview/runtime check must confirm that all required groups resolve.

## 4. Runtime verification required

Before treating this implementation as accepted, verify the Preview build and actual runtime:

1. **Complete:** Vercel Preview deployment for `feature/lms-reese-long-gun-stance-002` reached `READY` for commit `c4bbc53411b9927715fc6c0bce4ed2a3e2d86d54`.
2. The runtime diagnostic resolves all six rifle groups from the actual Reese GLB.
3. M4A1 idle, walk, run, sprint and fire use the rifle clip family.
4. MPX-9 idle, walk, run, sprint and fire use the rifle clip family.
5. The support wrist-to-`gripL` diagnostic is within 40 mm for both long guns; inspect the actual hand contact visually as well.
6. P-19 retains the existing pistol aim/fire animation path.
7. Repeated weapon switching does not leave stale poses or attachments.
8. First-person head hiding, hidden-driving visibility, locomotion and Rapier collision behavior remain unchanged.

If either weapon's support-hand error exceeds the threshold, or visual contact is poor, do not mask the discrepancy with arbitrary weapon rotation. Revisit the per-weapon support target/animation fit and document any required 3d-gen change here before changing that repository.

## 6. Current verification status

| Check | Status |
| --- | --- |
| Branch created from current `main` | Complete |
| AOB long-gun animation selection implemented | Complete |
| P-19 pistol route preserved in code | Complete; runtime regression pending |
| 3d-gen source inspected | Complete; read-only |
| AOB tests | Complete; 809/809 passed across 197 files |
| TypeScript check | Passed |
| Lint | Not run |
| Vercel build | Passed; deployment reached READY |
| In-runtime clip binding confirmation | Pending; actual preview asset group names still need runtime confirmation |
| Visual grip/shoulder/weapon-switch QA | Pending owner/runtime review |

## 5. Preview deployment

- **Status:** READY (Preview only; not production)
- **Branch:** `feature/lms-reese-long-gun-stance-002`
- **Built commit:** `c4bbc53411b9927715fc6c0bce4ed2a3e2d86d54`
- **Preview:** https://age-of-abundance-d080mk3sb-kuzivakwashetembo8s-projects.vercel.app/north-heights-preview
- **Branch alias:** https://age-of-abundance-git-featur-1c7736-kuzivakwashetembo8s-projects.vercel.app/north-heights-preview

The Vercel build ran the repository's configured asset audit/extraction, TypeScript check, prebuild scripts, Vitest suite, and production build. The Preview is available for owner review. Automated page inspection did not load the protected/preview URL, so this record does not claim runtime clip-binding or visual acceptance.

## 7. Scope and release boundary

This implementation is limited to Reese's existing M4A1, MPX-9 and P-19 handling. It does not add weapons, ballistics, damage, projectiles, NPC combat, multiplayer behavior, new input bindings or a second character/arms rig.

No merge to `main` or production deployment is authorized by this implementation record. The Vercel Preview is for review and verification only.
