# COMBAT-002 — Automatic Rifle Sustained-Fire Presentation

**Status:** Documented; implementation not yet assessed  
**Area:** Player combat presentation — automatic weapons  
**Target release:** 1 December 2026  
**Related direction:** [AOB Combat-First Direction Addendum (26 November 2026)](../AOB-Combat-First-Direction-Addendum-2026-11-26.md)

## Problem statement

Automatic weapons need a coherent sustained-fire presentation. Holding the trigger should produce repeated weapon firing motion and effects at the actual shot cadence, rather than a single-shot or pistol-like presentation.

## Required behaviour

1. Automatic weapons visibly cycle repeated firing animation while the trigger is held and shots are being emitted.
2. Muzzle flashes and other per-shot effects correspond to individual shot events.
3. Weapon recoil produces repeated impulses timed to the actual firing cadence.
4. Character recoil/absorption responds to those same impulses while maintaining a credible shooting stance.
5. Releasing the trigger ends the firing sequence cleanly; no new shot effects or recoil impulses continue after firing stops.
6. Firing cadence, ammunition consumption, muzzle effects, weapon movement and character response remain synchronised.
7. Weapon-specific tuning is supported. M4A1 and MPX-9 may have different cadence, recoil and animation characteristics while using the shared weapon runtime contract.

## Acceptance criteria

- [ ] Holding the trigger on an automatic weapon produces sustained firing events and corresponding animation/effects.
- [ ] Each muzzle flash is driven by an actual shot event.
- [ ] Weapon recoil repeats in time with actual shots, not as an unrelated one-off or unsynchronised continuous effect.
- [ ] Character recoil response is synchronised with shot events and does not play independently of firing.
- [ ] Releasing the trigger stops new shots and presentation cleanly returns to the appropriate non-firing state.
- [ ] M4A1 and MPX-9 support independent tuning without duplicating the shared firing pipeline.
- [ ] P-19/semi-automatic behaviour remains single-shot as configured and is not regressed.
- [ ] No muzzle effects, recoil or ammunition consumption occur when the weapon is not permitted to fire (for example, paused or round-ended states).

## Scope

**Included:** automatic-fire event timing, sustained weapon animation, per-shot muzzle effects, weapon recoil, and corresponding character recoil presentation.

**Excluded:** creation of the base third-person shooting stance (COMBAT-001); first-person camera/viewmodel framing (COMBAT-003); unrelated weapon-system expansion.

## Dependencies and sequencing

- Build on the supported shooting stance defined by COMBAT-001.
- Treat the authoritative weapon shot/firing event as the source of truth for synchronising animation, effects and recoil.
- Keep gameplay cadence and ammunition authority in the live AOB runtime, consistent with the Combat-First Direction Addendum.
- Do not create presentation-only firing loops that can drift from actual shot events.

## Verification required

Exercise sustained trigger hold, short bursts, trigger release, empty magazine, reload, pause/round-end guards, and per-weapon tuning in the actual runtime. Record build/runtime and observed results. Manual evaluation is required for recoil feel and visual/audio coherence. Mark unrun tests as not run.

## Release constraint

The 1 December 2026 release deadline is fixed. Prioritise deterministic event synchronisation and clean start/stop behaviour over elaborate weapon-specific effects. This document records requirements; it does not claim implementation or test completion.
