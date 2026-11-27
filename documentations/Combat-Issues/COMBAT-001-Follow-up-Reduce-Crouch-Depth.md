# COMBAT-001 follow-up — Reduce third-person shooting crouch depth

**Status:** Dual crouch implementation committed; automated validation and visual acceptance pending on the existing COMBAT-001 feature branch  
**Date:** 27 November 2026  
**Parent:** [COMBAT-001 — Third-Person Shooting Posture and Locomotion](COMBAT-001-Third-Person-Shooting-Posture-and-Locomotion.md)  
**Branch:** `feature/combat-001-third-person-shooting-posture`  
**Pull request:** [#12 — COMBAT-001 implementation](https://github.com/kuzivakwashetembo8/AOB/pull/12)

## Report

The first implementation was not accepted because its firing posture is overly crouched and reads as a deep bend/squat.

## Visual references on main

Reference assets were committed in `d4ec01e358e1c78de0ef043145c8538b4d7ab937`:

- `public/AOB Unaccepted Crouch Position.png` — rejected: excessive knee/hip flexion and too much vertical lowering.
- `public/COD Accepted Crouch.webp` — target: modest lowering, relatively upright torso, controlled knee flexion, stable athletic base.

The accepted COD image is the visual authority for the revised stance.

## Required correction

- Reduce lower-body crouch depth substantially; avoid the deep-squat silhouette.
- Keep the pelvis only modestly lowered and knees softly flexed.
- Keep the torso mostly upright with a natural forward combat lean.
- Preserve a stable base and the authored rifle-ready upper-body pose.
- Apply the restrained posture consistently to stationary and moving fire.
- Avoid snapping, exaggerated bobbing, foot sliding, or conflicting run/fire presentation.

## Scope

Only revise COMBAT-001 posture/locomotion presentation. Do not implement COMBAT-002 sustained-fire cadence/recoil or COMBAT-003 first-person viewmodel/camera changes.

## Acceptance

1. Stationary firing reads as a slight combat crouch, not a full crouch.
2. Moving fire retains the same restrained height and an upright upper body.
3. Run/fire rejection remains intact.
4. Transitions remain coherent, with planted foot contact and no visible snapping/sliding.
5. The revised posture is inspected in the Vercel preview from the normal third-person camera.

**Release target:** 1 December 2026.  
**Merge policy:** PR #12 must remain draft and must not be merged until the revised posture is visually accepted.
## Owner clarification — separate low crouch from gun-ready stance

The previously rejected deep crouch is not to be discarded. It is the intended dedicated low-crouch/cover posture. The armed player controls now have two distinct states:

- **Gun-ready crouch (default):** minimal knee/hip bend while holding or firing a weapon. The normal armed idle, moving-fire and firing compositions use a 12% authored-crouch contribution blended toward neutral.
- **Low crouch (explicit toggle):** retain the previous 38% crouch contribution. Render a down-arrow button directly above Sprint while armed; clicking toggles the deeper cover posture on/off. Hide the control when unarmed, driving, or in detached camera flight.

Both touch and desktop action pads expose the toggle. The low-crouch state is routed to Reese's actor and is cleared when the player disarms. The existing running/shooting exclusion remains unchanged.

**Implementation note:** automated validation and visual acceptance remain pending. The current North Heights preview is a character-control exercise, not the LMS production mode. Do not merge before visual review.
