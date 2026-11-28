# AOB Combat Presentation — Three-Issue Implementation Plan

**Document status:** Planning only — awaiting owner approval before implementation or preview  
**Date:** 28 November 2026  
**Target release:** 1 December 2026  
**Repository:** `kuzivakwashetembo8/AOB`  
**Baseline branch:** `main`  
**Baseline commit:** `9b1141d86add8d27af376813ec76757f669d594b`  
**Planning branch:** `docs/combat-three-issues-plan-20261128`  
**Production baseline:** Vercel deployment `dpl_2fuF9t7bxtjrsX7mJ5PNiYWKpfBA`, READY on `main` at the baseline commit  
**Authority:** Owner-reported gameplay observations and explicit constraints recorded 28 November 2026

---

## 1. Purpose and approval boundary

This plan defines a bounded investigation and implementation approach for three player-combat presentation issues:

1. Shooting while walking produces a broken recoil/locomotion result, including sinking and forward sliding.
2. The current muzzle flame looks unrealistic and must be removed, while existing gunfire lighting must remain.
3. Automatic weapons, especially the M4A1, currently present like pistols instead of sustaining automatic-fire animation and sound while the trigger is held.

**This document is not implementation approval.** No gameplay code, assets, animation clips, audio assets, effects, weapon tuning, or production configuration are to be changed until the owner explicitly approves implementation. A preview deployment and runtime validation also require approval after implementation is ready.

The plan is intentionally limited to these three issues. It does not authorize new weapon mechanics, damage-system changes, projectile work, new muzzle effects, first-person changes, or unrelated combat polish.

## 2. Current baseline and known constraints

The latest accepted combat/locomotion baseline is commit `9b1141d86add8d27af376813ec76757f669d594b` on `main`. The owner previously confirmed the corresponding preview behavior was successful, and the production deployment for that exact commit reached READY. The new work must preserve that accepted baseline.

Relevant existing repository documentation:

- [COMBAT-001 — Third-Person Shooting Posture and Locomotion](COMBAT-001-Third-Person-Shooting-Posture-and-Locomotion.md)
- [COMBAT-002 — Automatic Rifle Sustained-Fire Presentation](COMBAT-002-Automatic-Rifle-Sustained-Fire-Presentation.md)
- [AOB Combat-First Direction Addendum](../AOB-Combat-First-Direction-Addendum-2026-11-26.md)

Relevant implementation locations already identified from the baseline:

- `src/game/character/reese-player-001.ts` — Reese's animation groups, composed weapon/locomotion clips, combat presentation entry point, muzzle world-position calculation, and character update state.
- `src/game/weapons/gun-runtime-001.ts` — M4A1, MPX-9 and P-19 weapon construction, weapon moving-part nodes, and authored grip/muzzle landmarks.
- The actual muzzle-effect implementation and the live weapon-fire/audio event owner must be traced during the approved investigation. Do not assume the character presentation adapter is the authority for gameplay firing cadence.

Known source-level details that should guide investigation, not predetermine the fix:

- Reese's `triggerCombat()` is explicitly documented as animation-and-audio-only; it must not silently acquire damage, raycast or projectile responsibilities.
- The character adapter has separate locomotion and combat timing state, including `combatRemaining`, gait selection, and weapon-specific firing clips. The moving-fire failure should be investigated at the interaction between those systems rather than treated as a ground-collider problem by default.
- Weapon muzzle position is derived from the equipped weapon's authored `muzzle` landmark. Preserve that source of truth if any remaining muzzle-positioned presentation is retained.
- M4A1, MPX-9 and P-19 share the weapon runtime adapter. Keep weapon-specific differences data/configuration-driven rather than forking the firing pipeline.
- COMBAT-001 and COMBAT-002 describe related behavior, but this owner-directed plan adds a strict muzzle-flame removal constraint that takes precedence over any older generic requirement to add or retain a muzzle flash.

## 3. Global non-negotiable requirements

1. Preserve the accepted standing-shoot behavior. The owner reports that standing fire is currently acceptable and no longer sinks; it is a regression-sensitive state.
2. Preserve the accepted armed walking stride and grounded-foot correction when the character is not firing.
3. Do not solve visual foot penetration by changing Rapier collision dimensions or physical movement authority without evidence that the physical capsule is actually at fault. The previous grounded correction was a rendered-fit/foot-contact correction; inspect that relationship first.
4. Remove the current visible muzzle flame. Do not replace it with another flame, particle, spark, flash mesh, decal, or alternative visual effect in this task.
5. Preserve existing gunfire lighting. Identify and isolate the light component before removing the flame component; do not disable a shared light or broad muzzle-effect container if that would remove the lighting.
6. Do not redesign the lighting, intensity, color, falloff, duration, or attachment position unless a defect is discovered and separately approved.
7. Automatic firing presentation must be driven by accepted firing events/cadence. No independent visual or audio loop may continue after firing has stopped or when gameplay disallows firing.
8. P-19/semi-automatic behavior must remain distinct from automatic M4A1/MPX-9 behavior.
9. Preserve pause, round-ended, reload, empty-magazine and other existing fire guards.
10. Do not add new combat simulation responsibilities to the character presentation layer.
11. Do not merge or deploy to production as part of the implementation workflow. The required release path is owner-approved preview, owner runtime acceptance, then a separately authorized merge/release action.

## 4. Workstream A — Fix shooting while walking: recoil, locomotion and ground contact

### 4.1 Observed problem

When Reese fires while walking, the standing-shoot case is acceptable, but the moving-shoot case still exhibits a combination of:

- the character sinking or appearing to lose proper ground contact;
- forward sliding rather than a normal planted walking stride;
- a recoil/shooting animation that appears to conflict with locomotion.

The owner describes the result as a broken recoil animation. Treat this as a combined animation-state, root/pose and foot-contact defect until runtime evidence isolates the cause.

### 4.2 Desired behavior

- Walking and shooting at the same time retains a recognizable, continuous walking cycle.
- The feet continue to contact the ground naturally through the stride; no visible vertical sinking or skating/forward drift.
- Shooting recoil is layered or timed so it does not replace, freeze, offset or fight the lower-body walking cycle.
- Upper-body weapon response remains readable and responsive to each accepted shot.
- The character does not lurch forward or gain unintended translation from a firing clip.
- Releasing fire returns smoothly to the accepted armed-walking pose.
- Standing fire remains visually unchanged from the accepted baseline.
- Running/fire rejection remains intact: this task does not authorize firing while running.

### 4.3 Investigation steps

1. Reproduce the issue in the current approved runtime with the M4A1 and record the exact movement/fire input sequence, camera angle and build identifier.
2. Capture a baseline comparison of: armed walking without firing, standing fire, walking fire, fire release while still walking, and transition from walking to idle while firing.
3. Inspect the selected animation groups and composed clips for the walking-fire path, including lower-body tracks, pelvis/root translation, hip/knee/ankle/foot channels and upper-body recoil channels.
4. Compare the moving-fire clip against the currently accepted armed-walk clip. Determine whether the firing clip replaces the gait, blends incompatible root tracks, has authored root translation, or has an unsuitable lower-body contribution.
5. Trace how `triggerCombat()`, `combatRemaining`, gait updates and animation transition/cross-fade logic interact frame-to-frame. Verify whether the combat timer temporarily suppresses the normal walking target or causes a gait transition to be restarted.
6. Inspect the current rendered-fit/ground-contact correction and its update order relative to animation evaluation, character anchor placement and Rapier-provided position. Confirm whether firing changes the rendered foot samples or only makes the pose visually lower.
7. Confirm whether the weapon/character recoil is represented by an animation clip, a transform impulse, or both. Avoid layering two independent recoil mechanisms.
8. Determine whether the reported forward sliding is caused by animation root motion, root-track composition, foot phase discontinuity, anchor translation, or a timing mismatch. Do not compensate with arbitrary counter-translation before identifying the source.
9. Review existing regression tests and add focused assertions for state selection and track composition only after the actual failure mechanism is understood.

### 4.4 Implementation approach, subject to findings

Preferred order:

1. Keep the Rapier-controlled actor position and existing grounded authority unchanged.
2. Keep the accepted armed-walk lower-body cycle authoritative during moving fire.
3. Apply only the required firing/recoil contribution to the upper body, or compose a dedicated moving-fire clip with lower-body gait tracks proven compatible with the accepted walking cycle.
4. Remove/neutralize unintended root translation from the moving-fire presentation if inspection proves it is the source of sliding. Do not indiscriminately strip translation from all animation tracks.
5. Ensure recoil is an impulse/presentation response to an accepted shot, not a timer that blocks locomotion for the duration of a one-shot animation.
6. Make transitions deterministic: fire start, repeated shot, fire release, gait change and return to idle must not leave stale animation groups or weights active.
7. Retain the existing ground-contact correction and adjust it only if measurements demonstrate that the firing pose requires a specific rendered-fit correction. Any such change must preserve standing-fire and non-firing walking behavior.

### 4.5 Acceptance criteria

- [ ] Armed walking without firing matches the accepted baseline.
- [ ] Walking while firing maintains a continuous, normal walking stride.
- [ ] Feet remain visually grounded without sinking or obvious forward skating.
- [ ] The firing response does not create unintended character/root translation.
- [ ] Recoil is visible and coherent without interrupting the lower-body gait.
- [ ] Releasing fire while continuing to walk returns cleanly to the armed-walk presentation.
- [ ] Walking-to-idle and idle-to-walking transitions remain stable during and after firing.
- [ ] Standing fire remains visually equivalent to the accepted baseline.
- [ ] Running/fire rejection remains unchanged.
- [ ] No animation group, observer, timer or transform state accumulates after repeated shots.

## 5. Workstream B — Remove the unrealistic muzzle flame and preserve gunfire lighting

### 5.1 Owner direction

The current visible flame emitted during shooting is unrealistic and must be removed. Existing gunfire lighting must remain. The owner explicitly wants the removal completed before any replacement effect is discussed.

**No replacement effect is included or implied by this plan.** A replacement muzzle effect requires a separate discussion and explicit approval.

### 5.2 Investigation steps

1. Trace the complete muzzle presentation path from accepted shot event to the currently visible flame.
2. Identify the flame-specific emitter/particle system, mesh, material, animation, texture or procedural effect responsible for the visible flame.
3. Separately identify the gunfire light source, including its creation, parent/attachment, enabled state, intensity and lifetime management.
4. Confirm whether flame and light share a wrapper, lifecycle object or cleanup function. Identify the smallest safe removal boundary.
5. Confirm whether the current flame is created per shot, reused, or kept alive through a pooled effect. Identify cleanup and disposal paths.
6. Check all supported weapons and fire states so the removal applies consistently without disabling the existing light.

### 5.3 Implementation approach, subject to approval

- Disable/remove only the flame-producing component and its flame-specific resources.
- Keep the existing gunfire light creation, positioning, activation, timing and cleanup path intact.
- If flame and light are currently coupled, separate their lifecycle responsibilities with the smallest possible change. Do not rewrite the whole effects system.
- Preserve muzzle landmark positioning for the retained light.
- Ensure repeated shots do not leave orphaned particle systems, meshes, materials, observers or timers.
- Do not add replacement particles, sparks, smoke, flash geometry, decals or screen effects.
- Do not modify weapon audio as part of this workstream; audio behavior belongs to Workstream C.

### 5.4 Acceptance criteria

- [ ] The current visible muzzle flame is absent when firing.
- [ ] Existing gunfire lighting remains present and visibly functional.
- [ ] The retained light still follows the correct equipped weapon muzzle location.
- [ ] Light activation and cleanup remain synchronized with valid shots.
- [ ] No new visual effect has been substituted for the removed flame.
- [ ] Repeated firing and weapon switching do not leak effect resources.
- [ ] Paused, ended-round, empty-magazine and otherwise invalid fire states do not produce a new flame or light event.

## 6. Workstream C — Make automatic weapons sustain firing animation and sound

### 6.1 Observed problem

Automatic weapons currently present too much like pistols. Holding the shoot input on a rifle/long gun—particularly the M4A1—does not produce the expected maintained automatic-fire presentation. The owner wants sustained power and sound for an amount of time, rather than a pistol-like single-shot response.

### 6.2 Desired behavior

- Automatic weapons use repeated firing presentation while valid automatic fire is active.
- The weapon's firing animation/moving parts, weapon recoil, character recoil response and firing audio remain synchronized with actual accepted shot cadence.
- The automatic-fire sound has sustained presence while the automatic sequence is active; it must not sound like isolated pistol taps.
- Trigger release stops the automatic sequence cleanly.
- P-19 remains semi-automatic/single-shot according to its existing configuration.
- M4A1 and MPX-9 may have separate cadence, animation, recoil and audio tuning while sharing the same firing-event contract.
- No automatic presentation continues when the weapon is empty, reloading, paused, round-ended, unequipped or otherwise unable to fire.

### 6.3 Required discovery before implementation

1. Trace the actual input path for mouse, keyboard and touch fire. Confirm whether the input produces press/release state, repeated commands, or a single event.
2. Identify the authoritative fire/cadence owner and determine how an accepted shot is represented. The presentation layer must consume that event rather than inventing its own cadence.
3. Trace ammunition decrement and invalid-fire guards to establish when a shot is genuinely accepted.
4. Identify current M4A1, MPX-9 and P-19 fire configuration and whether the live runtime already distinguishes automatic and semi-automatic modes.
5. Identify the current rifle/pistol animation selection, weapon moving-part support in `gun-runtime-001.ts`, and any existing automatic-fire clips or authored weapon cycles.
6. Trace audio ownership, sound assets, playback mode, loop/one-shot behavior, voice lifecycle and cleanup. Determine whether the current pistol-like sound is caused by selecting the wrong asset, restarting a one-shot on every shot, or not maintaining an automatic-fire sound state.
7. Verify that audio and animation can both be driven from the same accepted firing state without duplicating gameplay cadence.
8. Establish what “for an x amount of time” means for this implementation. The duration/termination policy is not specified yet and must not be guessed.

### 6.4 Proposed firing-state model

Subject to inspection of the current runtime contract, use a small explicit state model rather than a presentation-only loop:

- **Idle:** no fire input or no valid equipped weapon.
- **Firing:** automatic weapon is held and the runtime accepts shots at its configured cadence.
- **Stopping:** input released or firing becomes invalid; prevent new shots immediately and stop/finish current audio/animation cleanly.
- **Blocked:** paused, reloading, empty, round-ended, unequipped or otherwise disallowed; no shot, recoil, muzzle-light or new firing-audio event may be emitted.

Each accepted shot should have a stable event/sequence identity and timestamp or cadence position sufficient for the presentation systems to synchronize. The event source remains authoritative for shot acceptance and ammunition. The animation/audio systems must not independently create additional shots.

### 6.5 Implementation approach, subject to approval

1. Reuse the shared weapon runtime and current authoritative shot path.
2. Configure firing mode and cadence per weapon. M4A1 and MPX-9 should use automatic behavior if that matches their existing design; P-19 must retain its semi-automatic behavior.
3. On automatic trigger hold, request/continue firing through the existing supported input contract. Do not implement an independent UI timer that bypasses runtime guards.
4. For every accepted shot, advance the weapon's firing animation/moving parts and apply a synchronized recoil impulse. Character recoil must remain compatible with Workstream A's moving-fire locomotion solution.
5. Maintain an automatic-fire audio state while valid automatic firing is active. Select/confirm the appropriate existing sound asset before considering any new asset. Avoid overlapping unlimited copies of a one-shot sound on each frame.
6. On release or invalidation, stop generating new shot events immediately; stop or gracefully release the sustained sound and settle animation/recoil state.
7. Handle empty magazine, reload, weapon switch, pause, round end, death/disable and component disposal as explicit stop conditions.
8. Keep semi-automatic input semantics separate: a held P-19 input must not accidentally become full-auto.
9. Do not add a new muzzle visual effect. The flame removal constraint in Workstream B remains in force.

### 6.6 Owner decision required: sustained-fire duration

The requested “x amount of time” is currently undefined. Before coding, confirm whether the intended behavior is:

- sustain only while the shoot input remains held, stopping immediately on release; or
- sustain for a configured maximum/automatic burst duration, with a defined restart or cooldown rule; or
- sustain for another explicitly specified duration/termination condition.

The implementation plan recommends **hold-to-fire for automatic weapons, bounded by magazine, reload, pause and round-state rules**, because it is the most direct interpretation of automatic trigger behavior. This is a recommendation, not an approved design decision. Do not hardcode a duration until the owner confirms it.

### 6.7 Acceptance criteria

- [ ] Holding M4A1 fire produces repeated accepted shots at its configured cadence.
- [ ] M4A1 presentation reads as sustained automatic fire, not a pistol-like single shot.
- [ ] MPX-9 uses the same automatic-fire contract with its own configuration.
- [ ] Automatic weapon animation/moving parts and recoil are synchronized with accepted shots.
- [ ] Automatic-fire audio sustains appropriately and does not sound like repeated isolated pistol taps.
- [ ] Releasing the trigger stops new shots immediately and ends the sound/presentation cleanly.
- [ ] Empty magazine, reload, pause, round end, weapon switch and other invalid states stop firing presentation.
- [ ] P-19 remains semi-automatic and does not fire continuously merely because the input is held.
- [ ] Ammunition consumption equals the number of accepted shots; presentation does not create phantom shots.
- [ ] No new muzzle flame or replacement visual effect is introduced.

## 7. Integration and execution sequence

The workstreams are related and should be executed in this order to reduce regression risk:

### Phase 0 — Approved investigation only

- Obtain explicit owner approval to begin implementation work.
- Reproduce and record all three issues against the exact baseline deployment/build.
- Trace the source paths listed above and record the actual root causes.
- Resolve the sustained-fire duration/termination decision.
- Confirm that the current flame and retained light are separate or define the smallest safe separation.

**Gate:** No code changes until investigation findings and any required owner decisions are recorded.

### Phase 1 — Moving-fire locomotion and recoil

- Correct the walking-fire animation composition and state transitions.
- Preserve accepted standing fire, armed walking, grounded correction and run/fire rejection.
- Add focused regression coverage.

**Gate:** Runtime preview demonstrates normal walking while firing, no visible sinking/sliding, and unchanged standing fire.

### Phase 2 — Flame removal only

- Remove the flame component.
- Preserve the existing gunfire light.
- Verify effect lifecycle and resource cleanup.

**Gate:** Runtime preview shows no flame and the existing gunfire light still operates.

### Phase 3 — Automatic weapon sustained presentation

- Implement the approved automatic-fire state/cadence integration.
- Synchronize weapon animation, recoil and sustained audio with accepted shots.
- Preserve P-19 semi-automatic behavior and all invalid-state guards.

**Gate:** Runtime preview demonstrates M4A1 and MPX-9 sustained fire, clean release/stop, and unchanged P-19 behavior.

### Phase 4 — Integrated regression and owner preview

- Exercise all three workstreams together.
- Deploy a preview from the exact reviewed implementation commit.
- Provide the preview URL and a concise change/test record.
- Wait for owner runtime acceptance. Do not merge or promote production without separate authorization.

## 8. Regression and verification matrix

All runtime checks must identify the tested deployment/build and record observed results. A source assertion or successful compile is not runtime acceptance.

| Area | Scenario | Expected result |
|---|---|---|
| Locomotion | Armed walk, no fire | Accepted walking stride and grounded contact remain unchanged |
| Locomotion | Stand still and fire | Existing acceptable standing-fire behavior remains unchanged |
| Locomotion | Walk and fire repeatedly | Continuous walking, stable foot contact, no sinking or forward sliding |
| Locomotion | Release fire while walking | Smooth return to armed walking |
| Locomotion | Walk to idle during fire/release | No snap, frozen gait or stale recoil |
| Locomotion | Attempt to fire while running | Existing run/fire restriction remains in force |
| Effects | Fire each supported weapon | No visible muzzle flame; existing gunfire light remains |
| Effects | Repeated shots and weapon switch | Light follows the equipped muzzle; no orphaned effect resources |
| Effects | Pause/round end/empty/reload | No new invalid muzzle-light event |
| Automatic fire | Hold M4A1 trigger | Repeated accepted shots, sustained rifle presentation and sound |
| Automatic fire | Short M4A1 burst then release | Clean stop; no continuing shots, sound or recoil |
| Automatic fire | Hold MPX-9 trigger | Automatic behavior with its own configuration |
| Semi-auto | Hold P-19 trigger | Semi-automatic behavior; no unintended full-auto |
| Guards | Empty magazine/reload | Automatic presentation stops and cannot bypass ammo rules |
| Guards | Pause/round end/weapon switch | Firing, sound and recoil terminate cleanly |
| Lifecycle | Repeated fire, equip/unequip, dispose | No duplicate listeners, timers, audio voices or Babylon resources |

Automated coverage should focus on deterministic contracts: weapon firing mode, accepted-shot cadence, stop conditions, animation-state selection, and effect/audio lifecycle ownership. Manual runtime review is required for foot planting, perceived recoil, weapon animation quality, sound coherence and the absence of the flame.

Do not mark an unrun scenario as passed. Record it as **Not run** with the reason.

## 9. Risk assessment and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Moving-fire clip replaces or conflicts with gait tracks | High — core movement presentation remains visibly broken | Preserve lower-body gait authority; inspect composed tracks and root motion before tuning |
| Fix changes rendered fit/ground correction globally | High — standing or ordinary walking regresses | Limit changes to moving-fire composition unless evidence proves a shared correction defect |
| Flame and light share lifecycle code | Medium/High — required gunfire lighting disappears | Identify and separate flame/light ownership before removal |
| Automatic audio is looped independently of shot acceptance | High — sound continues after release or invalid state | Drive audio state from the authoritative firing state and explicit stop reasons |
| Animation cadence drifts from gameplay cadence | High — visual shots do not match ammunition/actual shots | Use accepted shot events as the single source of truth |
| P-19 accidentally becomes full-auto | High — weapon identity and balance regress | Preserve explicit per-weapon fire mode and add held-input regression coverage |
| Scope expands into new effects/audio assets or combat simulation | High — release schedule risk | No replacement muzzle effect or unrelated combat changes without separate approval |
| Preview is built from a stale commit | High — false acceptance | Verify exact source commit and deployment metadata before requesting owner review |

## 10. Release sequencing and scope control

The target release date is 1 December 2026. The implementation window is short. Prioritize correctness and regression prevention over visual embellishment.

If time becomes constrained:

1. Fix the walking-fire defect without regressing accepted standing fire or grounded walking.
2. Remove the unrealistic flame while retaining the current light.
3. Implement only the minimum reliable automatic-fire state, animation and audio behavior that can be validated.
4. Defer optional animation embellishment, new sound assets, and all replacement muzzle effects.

Do not weaken existing pause, ammo, reload, round-end or run/fire guards to make the presentation appear active.

## 11. Approval checklist

Implementation remains blocked until the owner explicitly approves this plan and resolves the sustained-fire duration decision.

- [ ] Approve investigation and implementation of the three workstreams.
- [ ] Confirm automatic-fire termination policy: hold-to-fire, configured burst duration, or another specified rule.
- [ ] Confirm no replacement muzzle effect is to be designed or implemented in this scope (the current plan assumes none).
- [ ] Approve creation of an implementation branch and code changes.
- [ ] Approve preview deployment after implementation is ready.
- [ ] Review the preview and provide runtime acceptance before any production merge/promotion is considered.

**Current status: AWAITING OWNER APPROVAL. No implementation or preview deployment is authorized by this document.**
