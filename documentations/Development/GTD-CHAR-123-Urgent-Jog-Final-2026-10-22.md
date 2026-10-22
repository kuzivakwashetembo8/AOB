# GTD-CHAR-123 — Urgent jog, final daily experiment (2026-10-22)

## Owner's correction and visual evidence
Source: CHAR-122B accepted *directional improvement only*, screenshots from Foundry Lane at 22:09/22:11 on mobile. Front and rear: conspicuous air gap between elbows/upper arms and torso. Shoulder action excessive. Torso leans too far forward, giving a competitive racing sprint; Voight should appear to be **hurrying to his car at a fast jog**, not racing. Legs face forward better than before, but the trailing leg should show more distinct swing/recovery lift, particularly from rear view.

This changes the **intended gait**, not just its anatomical correctness.

## Accepted baseline and rejected approaches
Start from branch `feat/char-122b-sprint-leg-heading-20261022`, verified Vercel READY / 440 of 440 tests passed, commit `982dca28125549eb863afe2b1f787d59cf40b880`. CHAR-122B's current knee bend 83.18° and shoe deviation 14.04° in the actual-GLB cycle are improvements, not final proof of visual acceptance.

Do **not** copy CHAR-121 or CHAR-122 failed arm-direction edits: ad hoc pelvis-X direction contraction distorted the accepted leading-wrist forward travel and produced arm rotation discontinuities (previous tests required per-frame quaternion qdiff <0.003). Preserve CHAR-120F's absolute joint-space two-segment arm reconstruction.

## One-patch experimental spec
1. Replace racing presentation with a compact urgent jog: lower multi-spine forward lean during sprint, reduce shoulder rotational contribution and upper-body rocking. Leave walking untouched.
2. Add **post-IK** modest smooth anatomical upper-arm adduction (reduce side gap) without modifying the authored direction samples or the two-segment solve. Rotate the upper arm and attached forearm together by a limited angle in the pelvis frontal plane. This retains the elbow-bend angle and most forward/back motion. The rotation must be continuous, symmetric, stable at all phases, and kept small enough not to destroy accepted side articulation.
3. During trailing-leg recovery only, moderate less of its natural knee flexion to lift the heel/ankle. Keep knee angle within the fast-jog acceptance cap and preserve existing toe-forward correction and left/right step alternation.
4. Keep game movement/control physics, GLB asset, other activities, accepted walk/idle and vehicles unchanged. No production merge.
5. Verify by strict TypeScript, whole test suite including **real GLB** arm/leg checks across 0/1.3/-2.4 yaw, different scales and reflection, and full Vercel READY deployment. Require side/front/rear owner visual comparison before acceptance.

## Acceptance
- Front/rear elbows closer to jacket side seams while elbows remain visibly flexed, not pinned into chest.
- Calmer shoulders and more upright trunk; arm pump proportionate to urgent jog, not athletic sprint.
- Side gait retains alternate stepping and foot orientation; rear trailing shoe/heel visibly recovers higher.
- No arm pops, shoulders clipping, foot inversion, or walking/driving regression.
- Final checkpoint: preview on new branch, no merge to main.

## Verification record
Pending patch and build. One final experimental attempt today. Record failures if not ready.
