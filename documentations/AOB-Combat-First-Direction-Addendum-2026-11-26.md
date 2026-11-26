# Age of Abundance — Combat-First Direction Addendum
## Product and Technical Direction | 26 November 2026

**Status:** Owner-directed product/engineering addendum  
**Applies to:** AOB Last Man Standing (LMS) implementation plan dated 20 November 2026  
**Release deadline:** 1 December 2026  
**Priority:** Player shooting and combat foundation first; ops/NPC implementation follows  
**Authority:** Owner direction confirmed 26 November 2026

---

## 1. Purpose

This document records the clarified combat direction for AOB and establishes how it relates to the existing LMS release objective.

AOB is intended to grow into a shooter with the combat feel and interaction expectations associated with games such as PUBG and Call of Duty. Over time, opponents may include different classes and visual species, including humans, aliens and monsters.

That longer-term direction is an architectural consideration, not a reason to expand the current release scope. The immediate objective remains the single-player LMS mode described in the 20 November implementation plan. The immediate engineering priority is to get the player shooting and combat experience right before investing in the broader ops/NPC layer.

This addendum supplements the LMS plan. It does not cancel, replace or silently expand it.

## 2. Priority and scope decision

The order of work is clarified as follows:

1. **Player shooting and combat foundation — highest immediate priority.** Establish reliable weapon handling, aiming, firing, ammunition, reload, hit resolution, damage and player combat feedback in the actual AOB runtime.
2. **Player combat completeness.** Verify the full weapon interaction loop, character/weapon presentation and health/damage behaviour before broadening the opponent implementation.
3. **LMS ops and NPC behaviour — subsequent priority.** Connect ops to the established combat foundation and implement only the minimum behaviours required by the LMS plan: spawn, detect/engage, attack where required, receive damage, die and participate in round accounting.
4. **LMS round completion.** Integrate the configured population, pickups, HUD, win/loss and restart as specified in the existing plan.
5. **Future opponent variety — post-foundation direction.** Use the established combat contracts to support different opponent visuals and behaviours without building a separate shooting/damage implementation for each species.

The release objective remains LMS. Deferring ops work until the player combat foundation is reliable is a sequencing decision, not a removal of ops from LMS acceptance.

## 3. Shared combat foundation

The player shooting implementation should establish reusable combat rules rather than a player-only collection of one-off effects.

The shared foundation should own, or provide stable interfaces for:

- weapon definitions and runtime state;
- equip, unequip and weapon switching;
- aim direction and weapon/muzzle transforms;
- fire cadence, ammunition consumption and reload;
- recoil, spread and weapon-specific tuning;
- authoritative hit resolution using the existing runtime physics/collision facilities;
- hit classification and damage application;
- health, damage and death state transitions;
- combat events/feedback needed by animation, audio, effects and UI.

The three current LMS weapons — M4A1, MPX-9 and P-19 — should use the same weapon runtime contract with per-weapon configuration. They must not become three independent firing systems.

The live AOB runtime remains the authority for simulation and combat timing. React/UI code should issue commands and consume snapshots/events; it must not simulate combat per frame. Preserve the existing Babylon.js and Rapier runtime boundaries unless code inspection demonstrates a specific blocker that requires an approved change.

## 4. Player and NPC responsibilities

The player and NPCs should share combat rules, not necessarily input or decision-making code.

- **Player controller:** translates player input into combat commands such as aim, fire, reload and switch weapon.
- **NPC/AI controller:** later translates AI decisions into the same supported combat commands.
- **Combatant contract:** exposes the common capabilities needed to receive damage, report health/death and participate in combat resolution.
- **Presentation/identity:** character model, skeleton, animation set, movement profile, resistances and distinctive abilities remain configurable per combatant.

This separation is intended to make later NPC integration cheaper and more consistent. It does not require building a general-purpose AI framework now.

A human opponent, alien or monster may have different movement, animations, attack style, resistances or abilities. Those differences should not require duplicating the core weapon firing, hit-resolution or damage rules when the same rules apply.

## 5. Immediate player-combat implementation sequence

Implementation should proceed in small, verifiable slices:

### 5.1 Character and weapon integration
- Inspect the actual playable character GLB hierarchy, hand bones, animation groups and weapon attachment behaviour in the live runtime.
- Establish reliable weapon attachment and aim/muzzle alignment.
- Treat the previously rejected Reese default-pistol removal attempt as a known failure record, not as an accepted implementation. Any renewed work must inspect the actual imported hierarchy and prove the no-weapon state visually and through runtime regression coverage.

### 5.2 One complete weapon path
- Prove one weapon end-to-end before expanding the weapon set.
- Validate equip, aim, fire cadence, ammunition consumption, recoil, hit query, damage and feedback.
- Add reload and verify repeatable aim → fire → reload → fire transitions without state lock or ammunition duplication.

### 5.3 Shared weapon contract and remaining LMS weapons
- Once the first weapon path is reliable, bring MPX-9 and P-19 onto the same runtime contract.
- Keep per-weapon differences in configuration: fire interval, magazine, reload, damage, range, spread, recoil, grip/sight/muzzle transforms, animation mapping, audio and effects.
- Do not fork the firing or damage pipeline per weapon.

### 5.4 Player damage and combat closure
- Verify the player can receive damage through the same authoritative combat resolution model.
- Verify health boundaries, damage feedback, death and pause/ended-round guards.
- Ensure one shot produces at most one authoritative damage application.

The implementation must be validated in the actual game runtime. Source-string assertions or a successful compile alone are not sufficient evidence of working combat.

## 6. Ops/NPC integration boundary

Ops remain required for LMS, but broad NPC implementation should follow the player combat foundation.

When ops work begins, connect an op actor to the shared combatant and combat interfaces. The minimum LMS implementation remains the one in the 20 November plan:

- spawn a configurable population (default 50);
- detect, face and engage the player using bounded behaviour;
- attack the player where required by the LMS loop;
- receive damage through the shared resolver;
- transition to a one-way death state;
- stop attacking and participating after death;
- notify round accounting exactly once;
- create eligible configured drops at most once.

Do not introduce complex pathfinding, squad tactics, faction simulation, multiplayer or a broad AI architecture to establish this loop. Use existing movement/physics capabilities and bounded authored behaviour.

The shared foundation is intended to reduce later integration cost; it does not make NPC work automatic. NPC movement, targeting, attack decisions, animation, rig compatibility and performance still require their own implementation and validation.

## 7. Future opponent variety

The longer-term game direction may include human, alien, robot and monster opponents. The current release does not require all of these types.

Future opponent definitions should be able to configure, as needed:

- visual asset and rig/animation mapping;
- scale and movement profile;
- health and damage response;
- resistances or vulnerabilities;
- available attack capabilities and weapon configuration;
- AI behaviour profile;
- death presentation and drop policy.

Visual identity must remain separate from the underlying combat rules. A new opponent type should reuse existing combat interfaces wherever its mechanics permit. A genuinely different attack mechanic may require a new capability, but should not force a duplicate implementation of unrelated shared systems.

Do not build speculative alien/monster systems before the LMS release. Record future requirements when a concrete opponent design is approved.

## 8. Relationship to the 20 November LMS plan

The 20 November LMS implementation plan remains the source of truth for the release mode, including:

- single-player LMS in the existing AOB city;
- default 50-op population, configurable for testing/performance;
- M4A1, MPX-9 and P-19 starting weapons;
- pickups, health, ammunition, HUD, win/loss and clean restart;
- explicit exclusions and release discipline.

This addendum clarifies the engineering order: reliable player shooting/combat is the first critical path; ops/NPC implementation follows on top of it. The LMS plan's acceptance criteria remain in force. If the schedule becomes constrained, preserve a working end-to-end LMS loop and cut optional polish or future opponent variety before cutting required LMS functionality.

No new districts, multiplayer, story progression, shops, complex AI, new weapon families or alien/monster roster are authorized by this addendum.

## 9. Acceptance and evidence

Before treating the player combat foundation as established, record runtime evidence for:

- correct weapon attachment and alignment through the supported movement/aim states;
- deterministic fire cadence and ammunition consumption;
- reload completion and interruption/invalid-state handling;
- correct aim, muzzle origin and hit direction;
- one authoritative hit and damage application per valid shot;
- health, damage and death boundaries;
- no firing or ammunition consumption while paused or after combat/round end;
- repeatable weapon switching and cleanup without duplicate actors, listeners or effects.

Test evidence must identify the build/runtime and scenario actually exercised. Mark unrun tests as not run. Manual playtesting remains necessary for grip, animation, recoil feel, audio and visual feedback.

The LMS acceptance gates for ops, pickups, round accounting, victory/defeat, restart and 50-op performance remain separately required by the original plan.

## 10. Decision record

**Confirmed direction as of 26 November 2026:**

- LMS remains the immediate release objective.
- Player shooting/combat is the most important immediate engineering priority.
- Ops/NPC implementation follows after the player combat foundation is reliable.
- Player and NPCs should reuse shared combat rules through separate input/decision adapters.
- Human, alien and monster opponents are part of the longer-term direction, not additional scope for the 1 December release.
- This document is an addendum to the existing LMS plan; it does not authorize unrelated scope expansion.

**Definition of this direction being established:** the repository contains this decision record and implementation work is organized around the priority and boundaries above. This document alone does not claim that the shooting system is implemented, tested or accepted.
