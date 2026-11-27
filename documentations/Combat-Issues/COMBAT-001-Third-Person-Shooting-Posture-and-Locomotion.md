# COMBAT-001 — Third-Person Shooting Posture and Locomotion

**Status:** Implemented on feature branch; automated validation passed; runtime visual acceptance pending  
**Area:** Player combat presentation — third person  
**Target release:** 1 December 2026  
**Related direction:** [AOB Combat-First Direction Addendum (26 November 2026)](../AOB-Combat-First-Direction-Addendum-2026-11-26.md)

## Problem statement

The third-person character needs a coherent supported firing posture across stationary and moving states. Ordinary standing or locomotion presentation should not be mistaken for a deliberate combat stance while firing.

## Required behaviour

1. **Stationary firing:** the character adopts a lowered, supported stance, with bent knees and a stable base.
2. **Moving while firing:** the character uses a controlled crouch-walk/creep while retaining a weapon-ready shooting posture.
3. **Running:** running and firing are mutually exclusive. The player cannot fire while in the running state, and the run animation must not be presented as a shooting animation.
4. **Whole-body pose:** the posture must involve the full body, particularly pelvis and legs, rather than relying only on upper-body or arm posing.
5. **Transitions:** movement, aim, firing and release transitions should remain coherent and readable.

## Acceptance criteria

- [ ] Stationary fire visibly uses a lowered, supported stance.
- [ ] Moving fire visibly uses controlled crouched/creeping locomotion.
- [ ] Gameplay state prevents firing while running.
- [ ] Running animation and shooting animation do not conflict or blend into an implausible hybrid.
- [ ] Pelvis, legs, torso and arms contribute coherently to the pose.
- [ ] Transitions avoid visible snapping, foot sliding and conflicting animation blends.
- [ ] The pose is readable from the normal third-person gameplay camera.

## Scope

**Included:** third-person character rig/animation integration, shooting posture, locomotion state transitions, and the run-versus-fire restriction.

**Excluded:** automatic weapon shot cadence, per-shot muzzle effects and recoil synchronisation (COMBAT-002); first-person camera and viewmodel framing (COMBAT-003).

## Dependencies and sequencing

- Establish the base shooting stance before tuning repeated character recoil.
- Coordinate with COMBAT-002 so any recoil response is layered onto a valid stance and driven by actual firing events.
- Keep this work independent of first-person viewmodel/camera changes.

## Verification required

Validate in the actual AOB runtime with stationary fire, movement while firing, run input while firing, and transitions between these states. Record the tested build/runtime and observed results. Do not mark criteria complete based on source inspection or compilation alone.

## Release constraint

The 1 December 2026 release deadline is fixed. Prefer a stable, readable implementation over optional animation embellishment. This document records requirements; it does not claim implementation or test completion.


## Implementation record — 27 November 2026

**Branch:** `feature/combat-001-third-person-shooting-posture`  
**Pull request:** [COMBAT-001 implementation](https://github.com/kuzivakwashetembo8/AOB/pull/12)

Implemented in `src/game/character/reese-player-001.ts`:

- Resolve the authored `Crouch aim idle` and `Crouch walk (aiming)` clips from the Reese GLB.
- Use crouched full-body idle/walk presentation while a weapon is equipped.
- Compose weapon-specific firing clips from crouch lower-body tracks and the corresponding rifle/pistol upper-body firing tracks.
- Reject gunfire while the current locomotion state is running; cancel an in-progress shot presentation when the actor transitions into a run.
- Preserve the existing movement authority, weapon attachment, and muzzle-event path.

Regression coverage was added in `src/test/reese-player-001.test.ts`.

**Automated validation:** `npx tsc --noEmit` passed; Vitest passed **809 tests across 197 files**; Vite/Nitro production build completed and the Vercel preview deployment reached READY.

**Runtime acceptance remains pending.** The available character exercise route is the North Heights preview, where Reese is currently instantiated. This work does not claim LMS production-mode integration. Do not check off the visual acceptance criteria until stationary fire, moving fire, run/fire rejection, transitions, foot contact, and the normal third-person camera have been inspected in that runtime.
