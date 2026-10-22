# GTD-CHAR-120B — Forearm Flexion Only: Sprinting Refinement

**Date:** 2026-10-22 (Africa/Johannesburg)  
**Branch:** `feat/char-120-natural-athletic-sprinting-20261022`  
**State:** **OWNER-AUTHORIZED REFINEMENT SPECIFICATION — NOT YET VISUALLY ACCEPTED**  
**Parent:** `GTD-CHAR-120-Natural-Athletic-Sprinting-Technical-Implementation-Schema-2026-10-22.md`  
**Previous accepted-by-observation milestone:** `GTD-CHAR-120A-Sprint-Arm-Swing-Isolation-2026-10-22.md`.

## 1. Observed issue and owner acceptance boundary

The user reviewed the CHAR-120A sprint preview, including a side-on screenshot of Voight running near parked cars on Mercer Street with drawn arrows marking arm positions. The verdict was: **running legs successful, arm-swing speed and coordination successful, shoulder and upper-arm movement aligned with locomotion; the forearms are still not bent enough.** The arms look too nearly straight, despite marked improvement over the previous preview. The user requests **more energetic—but not maximal—elbow flexion** without changing the successful arm-swing amplitude.

**Frozen features for this gate:** Retargeted sprint and walk GLBs/JSON, pelvis, thighs, shins, feet, toes, actor speed/cadence, walk-to-sprint crossfade, shoulder/clavicle motion, both upper-arm animation tracks and their oscillation, torso inclination, neck/head, local wrist/hand rotations, walking posture and idle posture. Preserve actual lower-body and shoulder/walk behavior by automated regression, not assertion alone.

**Permitted animation output:** Only the local rotation of `LeftForeArm` and `RightForeArm` **when sprint is active** may change, gradually mixed by the existing sprint weight. The hands follow as children of those forearms; their **own local rotations stay unchanged**.

## 2. Hypothesis and minimal intervention

In `src/game/character/retargeted-walk-110.ts`, `sprintDelta()` decomposes each authored arm/forearm track into (a) the phase-varying rotation about the cycle center and (b) the authored source-relative mean rotation. CHAR-120A restored sprint arm swing, setting forearm `swingGain=1.10` and `meanGain=0.65`. The preceding observation indicates that **arm swing already has sufficient excursion** but the elbow remains too extended at multiple phases.

For the first CHAR-120B experiment, change only the **forearm's authored mean retention** from **0.65 to 0.90**, with zero change to `swingGain=1.10`, upper-arm gains (`1.35` swing/`0.50` mean), shoulder gain (`0.65`), arm phase, forearm oscillation amplitude, base restoration, or torso/legs. The UAL sprint source mean forearm rotation has an observed magnitude of approximately **0.96–0.98 rad (~55°)**, so the extra 0.25 factor adds approximately **0.24 rad (~14°)** of source-relative mean rotation; this figure is **not** equivalent to a measured elbow joint angle after retargeting. It must be judged by the resulting 3D silhouette.

**No generic elbow twist, procedural sine-wave, new geometry/mesh, changed shoulder aim, new IK solver or speed modification.** Keep one variable and one implementation locus so visual differences are attributable to forearm bend alone.

## 3. Anatomical and visual success criteria

- From the side, the leading hand travels forward/upward with a **more decisively flexed elbow**, rather than hanging below an almost straight arm. The opposite elbow remains bent as it drives backward.
- The elbow flexion is **moderate/athletic**—not folded maximally, not crushed inward toward the ribs, and not raised like a boxing guard.
- Preserve counterphase with leading leg, the previously accepted **pace of hand swing**, torso pitch and shoulder posture. Wrists do not twist or independently rotate.
- From behind/front, arm clearance remains natural and elbows do not force inward.
- On release from sprint, the accepted CHAR-119 walking and standing pose restores without a forearm snap or lingering bend.
- The previous broad interior-elbow visual target (~80–110°) is a *reference range* rather than a rigid requirement. Numerical quaternion increase alone cannot prove the actual anatomical angle: **visual approval remains the gate**.

## 4. Verification and visual checkpoint policy

1. Capture the current branch and accepted preview revision. Commit this document **before** the runtime adjustment.
2. Apply only forearm mean retention increase in `sprintDelta()`; leave shoulder/upper-arm oscillation and all other systems byte-identical.
3. Add a focused regression test of a full sprite cycle on an isolated linked-bone rig: compare with the pre-refinement `0.65` reference; verify increased forearm pose bias, identical cycle excursion and unchanged upper-arm, shoulder, torso, leg, hand local rotation; confirm standing/walking and reset unchanged. Preserve CHAR-120/120A test suite.
4. Run TypeScript, full Vitest, build-time source-to-target sagittal sprint gait audit and PWA pack checks. Do not call this visually accepted based on tests.
5. Provide **one new Vercel preview only after successful build**, showing the actual changed commit on `/build-version.json`, `/game` and sprint JSON present. Invite owner visual evaluation from side and rear.
6. No merge to `main` or production deployment unless the owner expressly accepts the result.

## 5. Execution register

- **2026-10-22 — Owner review:** CHAR-120A arm motion and shoulder coordination accepted as visually successful; forearm flex still underarticulated. Isolation of the new correction explicitly authorized. **This specification records intended implementation before changing runtime code.**
- **Runtime implementation:** commit `1f35e022cd78e49db01fcfc48c049cbbc9040b26`. Replaced only `meanGain=isForearm?.65:.50` with `meanGain=isForearm?.90:.50` inside `sprintDelta()`. Forearm cycle motion remains `swingGain=1.10`; upper arm remains `1.35/0.50`; clavicles/shoulders and all other animation/physics paths are unchanged.
- **Targeted test:** commit `b701c30f9d7eb8ff7b5912e85942937beb30f50f` extended `char120a-sprint-arm-isolation.test.ts` with a phase-sampled authored forearm bias test. It confirms that a 0.80-rad synthetic authored forearm offset creates the expected 0.72-rad retained pose at `meanGain=0.90`, while preserving the original cycle excursion; remaining local joints match the unaffected control; walking and reset restore.
- **Build and regression result:** Vercel preview `dpl_BgVMCJBQH9LfAJGdroUSkJEbzxXS` reached `READY`; **428/428 tests passed in 110 files**, TypeScript check passed, CHAR-120 authored sprint gait symmetry audit passed, PWA game/shell packaging completed with no missing mandatory resources.
- **Verified preview:** release `b701c30f9d7eb8ff7b5912e85942937beb30f50f`, `https://gtd-dsrtcjsyn-interlinkglobaltech.vercel.app/game`. Confirmed HTTP 200 for `/game`, `/build-version.json` (exact release SHA), and `/GLBs/Characters/char120-ual-sprint.json`.
- **Visual status:** **owner approval pending**. Synthetic/unit tests prove scope isolation, not final skinned elbow direction. Hold main and production unchanged until visual review.

**Disposition:** Developmental; pending owner visual acceptance.
