# COMBAT-003 — First-Person Weapon Viewmodel and Aiming Presentation

**Status:** Documented; implementation not yet assessed  
**Area:** Player combat presentation — first person  
**Target release:** 1 December 2026  
**Related direction:** [AOB Combat-First Direction Addendum (26 November 2026)](../AOB-Combat-First-Direction-Addendum-2026-11-26.md)

## Problem statement

The current first-person presentation requires the player to look downward to see the weapon. This compromises target visibility and makes weapon aiming feel disconnected from the camera's view direction.

The required solution is a camera-relative weapon/viewmodel presentation. The camera should remain oriented toward the play space and target; the weapon should be positioned relative to the camera.

## Required behaviour

1. **Idle/normal view:** the weapon rests naturally within the first-person frame without requiring the camera to tilt down to inspect it.
2. **Aiming:** the weapon raises into a visible, side-offset aiming position while the camera remains oriented toward the target.
3. **Aim indicator:** the reticle/aim guide remains at the centre of the screen.
4. **Firing:** weapon animation and recoil remain visible in the first-person frame while the player continues looking toward the target.
5. **Camera independence:** do not tilt the camera downward merely to expose the weapon. Change weapon/viewmodel presentation relative to the camera instead.
6. **Transitions:** idle, aiming, firing and release transitions should be stable and should not introduce unintended camera movement.

## Acceptance criteria

- [ ] In normal first-person view, the weapon is visible in a natural resting position while the camera looks level into the play space.
- [ ] Entering aim raises/repositions the weapon into a clear, side-offset aiming presentation.
- [ ] The reticle/aim indicator remains centred on screen.
- [ ] Camera target-facing orientation is not forced downward to expose the weapon.
- [ ] Firing animation and recoil are visible without requiring the player to look away from the target.
- [ ] Idle, aim, fire and release transitions avoid abrupt viewmodel pops and unintended camera movement.
- [ ] Weapon framing preserves central target visibility and does not unnecessarily obscure the reticle/target area.
- [ ] Weapon aim/muzzle alignment remains consistent with the authoritative aim direction and hit-resolution path.

## Scope

**Included:** first-person camera-relative weapon/viewmodel placement, aiming presentation, and visibility of first-person firing/recoil animation.

**Excluded:** third-person shooting posture and locomotion (COMBAT-001); underlying automatic-fire cadence and per-shot effect synchronisation (COMBAT-002); unrelated HUD or camera redesign.

## Visual reference

Use the COD-style reference screenshots supplied/discussed for this task as visual direction. Translate the reference into in-game framing and transition checks. Do not expand scope to unrelated HUD, weapon, or gameplay features from the reference title.

## Dependencies and sequencing

- Coordinate firing/recoil visibility with COMBAT-002, but keep viewmodel framing independently testable.
- Preserve the shared combat architecture and runtime authority described in the Combat-First Direction Addendum.
- Do not solve weapon visibility by changing the camera's aim direction or by shifting the centre reticle off-centre.

## Verification required

Validate idle, aim enter/hold/release, firing, recoil, target tracking and weapon alignment in the actual first-person runtime. Confirm that the camera remains target-facing and the reticle remains centred. Record build/runtime and observed results; manual visual evaluation is required. Mark unrun tests as not run.

## Release constraint

The 1 December 2026 release deadline is fixed. Prioritise correct framing, target visibility and stable transitions over additional first-person features. This document records requirements; it does not claim implementation or test completion.
