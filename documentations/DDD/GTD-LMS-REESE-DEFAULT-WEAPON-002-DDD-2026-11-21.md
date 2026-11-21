# Procedure DDD — LMS Reese Default-Weapon Removal Attempt 002

**Date:** 2026-11-21 (Africa/Johannesburg)  
**Decision:** **OWNER-REJECTED — DO NOT MERGE — DO NOT REDEPLOY**  
**Authority:** Owner reported after testing the preview: “The gun is still in his hand.” Owner directed DDD and confirmed the procedure should be checked against this codebase.  
**Rejected branch:** `fix/remove-reese-default-pistol-002`  
**Accepted main baseline at DDD inspection:** `12d35d71e556df4a968777cd6e9cad726f34544a`  
**Rejected preview candidate:** `905ba95f9dae927f596a57c59c63a9f7d2fb6c71`  
**Preview deployment:** `dpl_GGXExcjLqAFtfvNprwFLaG5LNKBt` — READY, **REJECTED / NOT FOR TESTING OR PRODUCTION**  
**Preview URL:** https://age-of-abundance-6vk2o34xw-kuzivakwashetembos-projects.vercel.app  
**Branch comparison:** 2 commits ahead of main, 0 behind; 2 changed files. No pull request found.

## 1. Owner acceptance result

The attempted fix did not meet the acceptance condition. Reese still visibly holds the default pistol when the hand/no-weapon state is selected. This is a confirmed owner-observed gameplay failure. The preview's READY status is build/deployment evidence only and does not override the visual rejection.

## 2. Change inventory

The branch-only diff against the accepted main baseline contains:

- `src/game/character/reese-player-001.ts` — 19 additions, 3 deletions. Adds a right-hand-bone lookup, checks rigid mesh ancestry beneath the resolved hand transform, disposes meshes classified as legacy weapons, and continues to manage the three extracted LMS weapon roots.
- `src/test/gtd-reese-finch-refinement-007.test.ts` — 4 additions, 3 deletions. Adds source-text assertions for the hierarchy-based removal condition and related weapon setup.

The branch is two commits ahead. The final preview commit is `905ba95f9dae927f596a57c59c63a9f7d2fb6c71`; an earlier branch commit is `0650691aafde1c7c0458042b8f4e1c1578646cce` (“fix(lms): report missing hand mount instead of legacy GLB pistol”).

## 3. Failure analysis

**Confirmed:** The runtime removal implementation did not remove the visible pistol in the owner's tested no-weapon state.

**Implementation boundary:** The removal code only classifies a mesh as hand-attached rigid geometry when all of these are true: the mesh has no skeleton, a right-hand transform node was resolved, and the mesh's ancestor chain includes that exact transform node. It also applies name/material matching. The code logs a warning if no legacy weapon mesh is matched.

**Likely failure classes — not yet proven:** the pistol may be represented as skinned geometry, attached through a different node/transform hierarchy, grouped beneath a different parent, or otherwise omitted by the import's enumerated mesh set. The right-hand bone name/transform-node resolution may also differ from the assumed naming/parenting. The owner's observation proves the current filter is insufficient; it does not identify which of these mechanisms is responsible.

**Validation gap:** The added regression test checks for source-code strings. It does not load Reese's actual GLB, enumerate its imported mesh/bone hierarchy, assert that the embedded pistol geometry is absent, or exercise the hand → weapon → hand state transition. Therefore it could pass while the actual pistol remains visible. The READY deployment and source-level assertions were insufficient acceptance evidence.

## 4. DDD containment

1. Preserve this failure record on `main` as the audit trail.
2. Do not merge, cherry-pick, or selectively copy either branch commit or its runtime/test changes into production.
3. Do not create another preview or attempt another patch under this rejected branch.
4. Keep the accepted main baseline and all unrelated accepted AOB work untouched.
5. Mark the existing READY preview as rejected and not for testing or production. No new deployment is authorized as part of DDD.
6. Remove the rejected branch reference. If the connected GitHub capability does not permit physical branch deletion, use the documented guarded reset-to-main fallback, verify the branch has zero diff from main, and explicitly report that the ref remains and is not physically deleted. Do not describe a reset ref as a deleted branch.
7. Any future investigation requires a new explicit owner instruction and must start from the then-current main. It must inspect the actual Reese GLB hierarchy at runtime and add a regression that proves the pistol geometry is absent in bare-hand state and remains absent after repeated equipment transitions.

## 5. Final disposition

| Item | DDD disposition |
| --- | --- |
| Runtime removal patch | **REJECTED — NOT MERGED** |
| Source-string regression assertions | **INSUFFICIENT — NOT ACCEPTANCE EVIDENCE** |
| Preview deployment | **READY but REJECTED** |
| Main baseline | **PRESERVE UNCHANGED except this DDD record** |
| Further work on this attempt | **HALT** |

**Procedure DDD outcome:** Attempt 002 is rejected. Preserve the incident analysis only; do not reuse its implementation as an accepted fix.


## 6. Execution record — 2026-11-21

- DDD record committed to `main` at `5066439effdf273b6c50b26f952388dbbd81a6e1`.
- Rejected branch ref was moved to that accepted main commit using a guarded force-with-lease against expected old head `905ba95f9dae927f596a57c59c63a9f7d2fb6c71`.
- Post-operation comparison confirms `fix/remove-reese-default-pistol-002` is **identical to main**: 0 commits ahead, 0 behind, 0 changed files. The branch name/ref still exists; the available GitHub actions do not expose physical branch deletion. This is a reset ref, **not a deleted branch**.
- The Vercel preview remains READY and addressable. The available Vercel actions do not expose deletion of a completed deployment. It remains rejected and must not be used for testing or production.
- No production deployment was created or promoted by this DDD operation.
