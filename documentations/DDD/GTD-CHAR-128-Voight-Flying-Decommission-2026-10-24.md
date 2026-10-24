# Procedure DDD — GTD-CHAR-128 / Voight Flying

**Date:** 2026-10-24  
**Decision:** **FAILED — DECOMMISSIONED / DO NOT MERGE**  
**Authority:** Owner's directive: "Initiate DDD." This follows the explicit final-attempt rule: "Attempt one more patch, if it fails close the branch."  
**Abandoned branch:** `feat/voight-flying-20261024`  
**Final experimental commit:** `53cb926f813840b102e3aa4730efd525c8cc13fe`  
**Stable base:** `main` at `37f493fccbc7490eb1cbca99595f8ce20a1d55c0` (accepted CHAR-127 Jumping merge)  
**Disposition:** Only this documentation and the completed research findings may remain on `main`. No failed flight runtime code, build scripts, tests or assets are admitted. Flight development stops under CHAR-128.

## 1. Purpose and origin

Original goal: enable the owner's actual Voight model (`character.glb`) to use the same stationary hovering, directional flying and fast/prone flight postures provided by the Quaternius Universal Animation Library (`ual.glb`) while retaining GTD's existing Rapier flight physics, controls, camera and collision behavior. A separate experimental branch was requested to protect accepted character walking, running, jumping, vehicle seating and production.

Initial research identified two gaps: `gtd-runtime.ts` explicitly rejected toggling flight with the human character enabled, and the active flight update path animated the legacy UAL humanoid instead of Voight. The feature was authorized after documentation of CHAR-128.

## 2. Source research and verified technical evidence

- The pinned source UAL GLB was **3,749,364 bytes**. Its eight **actual** flight clips were verified in the binary: `flyIdle`, `flyHoverForward`, `flyHoverBack`, `flyHoverLeft`, `flyHoverRight`, `flyHoverUp`, `flyHoverDown`, and `fly`.
- The six directional hovering clips were authored **single-frame poses**, not animated loops. The `flyIdle` clip was two seconds. An initial baker incorrectly required multi-keyframe clips and was repaired to preserve valid static authored poses.
- UAL motion was mapped to **22 linked joint roles** of Voight's original 73-joint `character.glb` rig; 41 samples per clip. Resulting same-origin retargeted JSON was approximately **291 KB**. The UAL source had no nontrivial animated visual-root orientation differential in these clips: pose differences reside in the joint hierarchy.
- The Rapier flight controller, collision envelope, direction/altitude controls and mobile input already worked and were preserved. A branch-only runtime update enabled Voight flying and routed animation to the same original human mesh.
- Automated tests verified numeric quaternions, state selection, transitions, and (in the final attempt) global wrist/foot position recovery on a parented test rig. **These tests did not verify the owner's rendered GLB silhouette on mobile.**

## 3. Development and visual iteration timeline

| Phase | Work, preview or finding | Result |
| --- | --- | --- |
| Research and planning | Initial `8d781caf` documentation, source inspection, CHAR-128 implementation approval | Approved to experiment, not to merge |
| Initial source and runtime implementation | `044f997`, `033e8ab`, `b5d73d5`, `61000c3`, `045f1c6`, `084553d`, `58c7033`, `159e7be`; single-frame clip repair `159e7be`; first preview `gtd-d2vf0j49v-interlinkglobaltech.vercel.app/game` (release `ef088ed`) | Mechanism **worked**: Voight flew; user rejected unnatural arm twist and crossed legs |
| Hover corrective attempt R2 | `9765fa3` defect report; `2614f96` hover-child joint retention; `5e100a6` tests; preview `gtd-46hgdp0ka-interlinkglobaltech.vercel.app/game` | Rejected: mobile images still show twisted hands/arms and mixed/crossed legs |
| Final corrective attempt R3 | `810ef47` R3 documentation; `3e6379b` whole-joint-chain standing-pose parity; `53cb926` global-position tests; preview `gtd-8mvhlmh2l-interlinkglobaltech.vercel.app/game` | Build **READY**, CHAR-128 **8/8 tests passed**, but final visual acceptance was **not granted**. Owner explicitly invoked DDD. No further attempt authorized |

All previews above are historical experimental deployments, **not recommended production endpoints**.

## 4. Why it failed

**Primary failure: anatomical visual acceptance.** Importing UAL's anatomically valid flight joint rotations did not translate into a natural posture on Voight's different linked skeleton and resting shoulder/hip geometry. The original implementation reached its **functional movement** objective but did not satisfy its **rendered posture** acceptance gate.

**R2 faulty assumption:** Correcting only child arm and leg joint local rotations was insufficient because source-applied rotations to `Hips` and `Spine` ancestors continued to move those limbs in world space. The tests used mainly independently linked or unparented bones and validated local quaternion weights, not the full live rig silhouette and bilateral spatial clearances. Consequently "locally neutral arms" still appeared twisted, and legs crossed.

**R3 mitigation:** All 22 mapped joints in every upright hover state were restored to Voight's accepted standing basis; fast horizontal `fly` stayed authored. A new parented-skeleton test verified recovery of actual global wrists/feet after accelerated flight; all eight CHAR-128 tests passed. **Nevertheless the owner did not accept the experiment and invoked DDD.** No fresh R3 screenshot or specific final defect was provided with that directive; therefore the record does **not** claim to know the final rendered failure mechanism. It is a conclusive owner rejection, not proof that the R3 numerical implementation was incorrect.

**Contributing factors:** Separate skeleton proportions; assumptions imported from UAL poses; interaction of source parent-joint transforms with the accepted CHAR-109 native neutral basis; overreliance on synthetic fixture tests rather than a visible multi-angle original GLB audit; static hover source poses versus dynamically blended native postures; and iteration/deployment costs.

## 5. What succeeded and what can be learned (without salvaging code)

1. Existing Rapier flight, keyboard/mobile input, camera, ceiling and collision are sound and independent of CHAR-128. The legacy UAL humanoid flight path on `main` is preserved.
2. A genuine source GLB audit is mandatory before retargeting. Single-key directional hover clips are valid and require different handling than looping tracks.
3. For character.glb, a correct local quaternion map alone cannot guarantee body-space biomechanics. Future prototypes should inspect **actual live parented joint world positions**, bilateral arm/leg separation, and source-to-target rest calibration across a complete motion sequence.
4. Static hovering and prone accelerated flying are different animation problems. Solving hover with a standing-pose fallback may trade away the distinctive original UAL hovering behavior. This tradeoff needs an explicit owner decision in any **newly authorized** design.
5. Future evaluation should use offscreen/in-engine multi-angle captures or GLB pose diagnostics **before** repeated deployment previews, and avoid experimenting on the active user production path.

These are **research findings only**, not authorization to cherry-pick or merge components of the failed feature.

## 6. Scope of rejected branch changes

The GitHub compare of `main` to `feat/voight-flying-20261024` found **17 branch-only commits** and exactly these eight modified/added paths:

| Path | Treatment |
| --- | --- |
| `documentations/Development/GTD-CHAR-128-Voight-Flying-UAL-Research-and-Technical-Plan-2026-10-24.md` | Preserve as **historical, failed** research documentation only |
| `package.json` | **Reject** CHAR-128 build hooks |
| `scripts/char128-audit-ual-flight.mjs` | **Reject**, no production import |
| `scripts/char128-bake-ual-flight.mjs` | **Reject**, no production import |
| `src/game/character/retargeted-flight-128.ts` | **Reject** |
| `src/game/core/gtd-runtime.ts` | **Reject** CHAR-128 flight-mode changes |
| `src/game/world/mercer-static-character-103.ts` | **Reject** flight animation integration |
| `src/test/char128-voight-flight.test.ts` | **Reject**, experimental test only |

These changes must not be merged, selectively copied, deployed to production, or presented as accepted CHAR-128 capability. Accepted CHAR-127 jumping, gait, neutral posture, and the independently developed Rapier / UAL flight subsystem are **out of scope** for decommissioning. Prior successful work must not be reverted.

## 7. Decommissioning acceptance criteria and state

- [x] Owner explicitly invoked DDD; feature and visual refinement discontinued.
- [x] Original objective, investigated data, corrections, test evidence, and final rejection documented.
- [x] Branch change inventory and safe boundaries established against `main`.
- [x] Report saved to **main** (documentation only).
- [x] Experimental branch ref **force-reset with expected SHA** from `53cb926f813840b102e3aa4730efd525c8cc13fe` to the documentation-only current `main` commit `f2f67339102cc4923a3e9da217cb0c006d6d1a59`. GitHub compare verified `identical`, zero ahead/behind and **zero changed files**. The branch cannot accidentally deliver the rejected feature code in its current state.
- [ ] Branch ref **permanently deleted**. The connected GitHub actions expose ref updates but not deletion; **the branch name still exists**, pointing to `main`. Complete deletion in the repository's Branches page: `feat/voight-flying-20261024` → delete. Do not claim full deletion until it is confirmed.
- [x] Previously created preview URLs are historical artifacts only; no CHAR-128 production deployment was initiated. Production alias was not reassigned as part of DDD.

**Final verdict:** **CHAR-128 is decommissioned and unsuitable for merge.** Any future Voight-flight work requires a newly scoped, approved proposal, independent branch and revised anatomical test plan; do not resume this branch.
