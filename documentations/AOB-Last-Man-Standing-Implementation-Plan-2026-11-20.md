# Age of Abundance — Last Man Standing
## Implementation Plan | 20–30 November 2026

**Status:** Implementation plan  
**Mode:** Single-player Last Man Standing (LMS)  
**Implementation window:** 20–30 November 2026  
**Release deadline:** 1 December 2026  
**Date clarification:** The request says “20–30 OCT”, but the stated working window is 20–30 November. This plan uses November 2026.

---

## 1. Product goal

Deliver a playable LMS mode inside the existing AOB city. The player starts with three available weapons—M4A1, MPX-9 and P-19—and must eliminate a fixed population of hostile operators (“ops”). The initial default population is 50 and must remain configurable for testing and performance tuning.

The round ends when every op is eliminated or the player is killed. The central quality requirement is convincing, reliable combat: weapons must sit correctly in the character’s hands, aim where expected, fire consistently, animate correctly, produce appropriate sound and visual effects, and apply predictable damage.

The city is the arena. Reuse the accepted AOB world, player movement, camera, rendering, collision and physics systems. Do not redesign unrelated world systems.

## 2. Core round loop

1. Start a new LMS round in the existing city.
2. Spawn the configured number of hostile ops (default 50).
3. Spawn the player at the established start location with M4A1, MPX-9 and P-19 available.
4. The player moves, selects a weapon, aims and fires.
5. Valid hits resolve through the game’s authoritative physics/collision layer and reduce target health.
6. At zero health, an op enters a one-way death state, stops participating in combat, increments the eliminated count exactly once and creates eligible drops.
7. The player collects ammunition, weapons and health pickups at authored city locations. Eligible defeated ops may also drop health.
8. The round is won when no living ops remain and lost when player health reaches zero.
9. Show the result and allow a clean restart.

**Round invariant:** every spawned op is counted once, every op is eliminated once, and a dead op cannot attack or generate duplicate drops.

## 3. Scope

### Included

- Single-player LMS in the existing AOB city.
- Configurable fixed enemy population, default 50.
- A common enemy actor contract supporting owner-provided alien, robot, police or soldier GLBs.
- Minimum enemy behaviours: spawn, idle/guard, detect/face/engage the player, receive damage, die and drop configured pickups. This is not a general AI system.
- Runtime integration of M4A1, MPX-9 and P-19.
- Weapon inventory/selection, firing cadence, ammunition, reload, recoil and hit feedback.
- Correct weapon-to-hand attachment, aiming alignment and weapon animation.
- Minimum player locomotion/aim/fire/reload animation transitions required for combat.
- Gunshot, reload, impact and death audio; muzzle flash, impact effects and tracer/projectile presentation where appropriate.
- Ammo, weapon and health pickups at authored locations, plus configured health drops from defeated ops.
- Player/op health, round state, HUD feedback, win/loss and restart.
- Performance, regression and release-candidate validation.

### Explicitly excluded

- Multiplayer, co-op, networking, matchmaking or leaderboards.
- Missions, story progression, quests, unlock trees, currency, shops or crafting.
- New city districts, world redesign, building-interior work, vehicle or pedestrian changes.
- Squad tactics, cover simulation, complex faction simulation or a broad AI framework.
- New weapon families beyond the three existing guns unless a replacement is necessary to resolve a blocker.
- Unrequested character abilities or unrelated movement redesign.
- Replacing the existing renderer, physics engine, camera or world simulation.
- Features that do not directly support the LMS round loop.

Scope changes require explicit approval and a release-impact assessment.

## 4. Technical approach and integration boundaries

### 4.1 Keep the gallery separate from gameplay

The /guns page is an inspection gallery, not the combat implementation. Its extracted weapon builders currently use Three.js, while the live AOB game runtime uses Babylon.js and Rapier. Do not mount the gallery renderer inside the live game or introduce a second renderer into the gameplay scene.

Treat the gallery as the visual/source reference for the three procedural weapon designs. Adapt the model builders to the existing Babylon scene or convert the models into a runtime-compatible representation. Preserve upstream MIT attribution and notices for extracted Claude-of-Duty source.

The live game runtime must own simulation, weapon state, collision and combat timing. React should send commands and display low-frequency snapshots/events, not simulate combat per frame.

### 4.2 Weapon rig and hand placement — highest priority

- Inspect the playable character GLB skeleton, hand bones, scale and imported animation groups in the actual runtime.
- Establish a named right-hand weapon socket and, if supported by the rig, a left-hand support target. Avoid weapon-specific world-space offsets.
- Give each weapon a tuned grip transform relative to the socket: position, rotation and scale.
- Attach the weapon root to the right-hand socket. Align the support hand to the foregrip/support point using a small IK or pose correction only if the existing rig supports it reliably.
- Define named muzzle, sight/aim, ejection and moving-part nodes. The muzzle transform is the authoritative origin for muzzle flash, shot direction and positional audio.
- Align the sight/ADS pose and shot query so the player’s aim and actual hit direction agree. Account for muzzle obstruction at close range.
- Ensure the weapon follows the character through idle, walk, run and turning without drift, clipping or separation.
- Validate visibility, equip/unequip, pause, teardown and restart behaviour.

If the character GLB lacks suitable hand bones or animation clips, record the exact limitation and use a bounded socket/pose fallback. Do not replace the character rig or destabilize accepted locomotion.

### 4.3 Shared weapon runtime

Use one weapon contract with per-weapon configuration; do not build three independent firing systems.

Each weapon definition should specify:
- stable ID and display name;
- magazine capacity, starting ammunition and reserve limits;
- fire mode and fire interval;
- reload duration and animation mapping;
- damage and range/falloff policy;
- spread, recoil impulse and recovery;
- grip, sight, muzzle and ejection transforms;
- firing, reload and empty-click audio;
- muzzle and impact effect configuration.

Required states: equipped, aiming, firing, reloading and empty. Reject invalid transitions, including firing during reload and reloading a full magazine. Use deterministic fire cadence and prevent repeated frame/input events from generating duplicate shots.

A shot must validate state/ammo, consume one round, play fire animation/audio, apply bounded recoil, emit muzzle feedback, resolve one authoritative hit query, apply damage once and produce impact feedback. Hitscan using the existing physics query is the default for the first playable version. Do not create a physical rigidbody projectile for every round unless profiling or weapon design proves it necessary. Decorative tracers must not be the authority for damage.

### 4.4 Character animation and handling

Reuse the existing playable character and movement controller. Integrate only the transitions needed for:
- weapon-ready idle;
- weapon-ready walk/run;
- aim/ADS;
- fire;
- reload;
- weapon switch;
- player hit/death response.

Prioritize a complete M4A1 path first. Once attachment, aiming, fire, reload and damage work, add MPX-9 and P-19 through the same contract. Use verified pistol clips for P-19 if present. Do not assume rifle/submachine-gun clips exist: inspect actual imported animation group names at runtime. Where clips are missing, use a restrained compatible fallback and record it.

### 4.5 Ops and supplied enemy GLBs

Create a common enemy/op definition independent of visual type. Each definition supplies a GLB path, scale/fit data, health, movement profile, weapon/damage configuration if armed, and drop policy.

The same combat logic must support aliens, robots, police and soldiers. Visual type must not be coupled to hit detection, damage or round accounting.

Minimum behaviour only:
- spawn at a validated city location;
- idle/guard until the player enters a configured detection range;
- face and engage the player when appropriate;
- receive valid damage;
- enter a one-way dead state at zero health;
- stop movement/attacks and disable inappropriate collision;
- create configured drops once;
- notify the round manager once.

Reuse existing character-controller/physics facilities. Do not introduce complex pathfinding, squad tactics or cover AI. If no stable navigation solution already exists, use authored guard/patrol points and bounded movement rather than adding a new navigation system during this schedule.

### 4.6 Pickups and health

Use a shared pickup contract with types ammo, weapon and health.

- Place pickups at dedicated, named city locations with a clear collection radius.
- Ammo pickups replenish the correct weapon reserve and respect caps.
- Weapon pickups add the weapon to round inventory and provide a defined ammunition quantity.
- Health pickups restore a bounded amount and never exceed maximum health.
- Eligible defeated ops may drop health according to a simple configurable policy. A drop can occur only once per op.
- Collection must be atomic: a pickup can be collected once, even if multiple collision callbacks occur.
- Keep pickup placement data separate from city geometry so positions and quantities can be tuned without modifying the world.

The phrase “life bars from dead ops” is interpreted as **health pickups dropped by defeated ops**, not literal UI health bars.

### 4.7 Round manager and HUD

The round manager is the authority for lifecycle (ready, active, won, lost, paused), configured starting count, active/eliminated counts, player health, inventory, selected weapon, magazine/reserve ammunition and pickup state.

The HUD should show only what is required: player health, selected weapon, magazine/reserve ammo, remaining ops (for example, OPS 37 / 50), and round result/restart. React consumes runtime snapshots/events; it must not poll or simulate per-frame combat.

## 5. Delivery schedule

### 20 November — Baseline and technical spike
- Confirm the active runtime, playable character, camera perspective, input mapping and physics query APIs.
- Inspect the three weapon builders, their moving parts, character skeleton/hand bones and imported animation groups.
- Prove one weapon model can be created in the live Babylon scene and attached to the character hand socket.
- Record exact files/systems to touch and regression-sensitive dependencies.
- Establish a small deterministic combat test scene and test population.

**Exit gate:** a weapon attaches in the live runtime in the correct coordinate space without changing the accepted city or player controller. Missing rig/animation dependencies are documented.

### 21 November — Weapon rig and M4A1 presentation
- Implement reusable weapon root and grip/sight/muzzle/ejection socket definitions.
- Attach M4A1 to the right hand; align support hand if supported.
- Tune scale, grip, rotation, shoulder placement and camera-relative aim.
- Integrate weapon-ready idle and movement poses using verified clips or bounded fallbacks.
- Validate equip/unequip, pause and teardown.

**Exit gate:** M4A1 stays correctly held through idle, walk, run and turns without major clipping or detachment.

### 22 November — M4A1 firing and hit resolution
- Implement weapon state, fire cadence, ammo consumption and empty handling.
- Add muzzle-origin/aim-direction hit query through existing physics.
- Apply damage to a test target and verify one shot creates one damage event.
- Add recoil, muzzle flash, impact feedback and gunshot audio.
- Validate close-range muzzle obstruction and shot/aim convergence.

**Exit gate:** M4A1 fires reliably in the real game; ammo, recoil, sound, effects and hit results agree. No duplicate shots/hits.

### 23 November — Reload and combat animation
- Implement reload state and magazine/reserve transfer.
- Connect verified aim/fire/reload clips from the character GLB.
- Animate weapon moving parts only where named nodes exist and the motion improves readability.
- Add reload audio and start/completion/cancellation feedback.
- Test firing/reloading/switching and interruption edge cases.

**Exit gate:** aim → fire → reload → fire repeats without state lock, ammo duplication or animation desynchronization.

### 24 November — MPX-9 and P-19
- Add both weapons to the shared runtime contract.
- Tune grip, fire cadence, magazine, damage, recoil, spread, muzzle and audio per weapon.
- Reuse the M4A1 firing/hit pipeline; do not fork weapon logic.
- Map P-19 to verified pistol poses and use compatible fallbacks for other weapon classes.
- Verify switching, inventory and per-weapon ammunition.

**Exit gate:** all three starting weapons equip, aim, fire, reload and damage targets correctly with distinct tuning.

### 25 November — Op actor and fixed population
- Implement common op definition and actor lifecycle.
- Load one supplied representative enemy GLB and fit it to the existing physics/controller scale.
- Spawn a configurable test population, then verify the default 50-op setup.
- Add minimal detection, facing and engagement behaviour using existing systems/authored guard positions.
- Implement enemy health, hit response, death and one-time elimination accounting.

**Exit gate:** 50 ops can be spawned/tracked; damage and death are reliable; each death decrements the active count exactly once. One enemy type works end-to-end.

### 26 November — Enemy attacks and player damage
- Add the minimum enemy attack path needed for a real gunfight.
- Resolve enemy shots/hits against the player through existing physics and health.
- Add player damage feedback and player death state.
- Ensure dead ops cannot attack, receive further combat damage or remain active.
- Test simultaneous player/op damage and zero-health edge cases.

**Exit gate:** player and ops can damage one another; player death ends the round; dead ops never fire again.

### 27 November — Pickups and city placement
- Implement ammo, weapon and health pickup types.
- Author a deliberate set of pickup locations across accessible city areas.
- Configure quantities and weapon-specific ammunition replenishment.
- Add eligible health drops from defeated ops.
- Add collection feedback and atomic one-time collection handling.

**Exit gate:** pickups update only the intended inventory/health values, respect caps and cannot be collected twice. Dead-op health drops work.

### 28 November — Complete round loop and HUD
- Connect round start, fixed population spawn, player loadout and active/eliminated counts.
- Add health, weapon, ammo and remaining-ops HUD values.
- Implement victory at zero living ops and defeat at zero player health.
- Add pause/resume and clean restart without duplicate actors, pickups, audio or subscriptions.
- Verify all supplied enemy GLBs intended for initial release are selectable through configuration.

**Exit gate:** a complete round starts, plays, ends in victory or defeat, and restarts cleanly.

### 29 November — Integration, performance and regression QA
- Run the full round at 50 ops on target desktop and mobile/browser configurations.
- Profile frame time, memory, asset loading, draw calls, animation updates, physics queries and audio/effect allocation.
- Check for per-frame allocation churn, unbounded projectile/effect objects and undisposed scene resources.
- Test all three weapons, supplied enemy GLBs, pickup types and both round outcomes.
- Regression-test player movement, camera, collision, city rendering, vehicles/world simulation and pause/resume.
- Fix release-blocking and high-impact defects only; defer nonessential polish.

**Exit gate:** no known blocker in the core LMS loop; 50-op performance is acceptable on agreed target devices; no critical AOB world regression.

### 30 November — Release candidate and freeze
- Run final smoke tests from a clean game start.
- Verify victory, defeat, restart and repeated rounds.
- Verify weapon attachment, animation, sound/effects, hit detection, ammo and pickups.
- Verify enemy count integrity and that dead ops are inactive.
- Produce and inspect the release-candidate build; record build identifier and actual test results.
- Freeze feature work. Only release-blocking defects may be changed after this point.
- Record known issues and rollback path.

**Exit gate:** release candidate is stable and suitable for the 1 December release decision. A successful compile is not proof of playability; tests must be recorded as actually run.

## 6. Acceptance criteria

### Round and enemies
- A round starts with the configured population; default is 50.
- HUD counts are correct; every op spawns and dies exactly once in round accounting.
- Victory is impossible while a living op remains.
- Supplied enemy GLBs can be configured without changing combat logic.

### Player and weapons
- Existing AOB movement and camera behaviour remain intact.
- M4A1, MPX-9 and P-19 are available at round start.
- Each weapon is correctly attached and remains aligned through movement and turns.
- Aim direction, muzzle direction and hit query are consistent.
- Fire cadence, magazine consumption, reload and switching are deterministic.
- Each weapon has appropriate firing/reload audio and muzzle/impact feedback.
- Recoil is controllable and does not destabilize the camera.

### Combat and pickups
- Valid shots apply damage once; invalid shots during reload, empty state, pause or ended rounds do not.
- Ops can damage the player; player death and all-op elimination produce the correct result.
- Dead ops cannot attack or generate duplicate drops.
- Ammo, weapon and health pickups work at configured locations and respect caps.
- Eligible dead ops drop health at most once; collected pickups cannot be collected again.

### Stability and performance
- Restart does not duplicate actors, pickups, listeners, audio or effects.
- Pause/resume does not advance combat or consume ammo while paused.
- Teardown disposes weapon/enemy assets and temporary effects.
- The 50-op round stays within the agreed performance budget on target devices.
- Existing city, movement, camera, collision and world systems remain functional.

## 7. Key risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Gallery models use Three.js; live runtime uses Babylon.js | High | Adapt/port geometry for Babylon; keep gallery isolated |
| Character GLB lacks rifle clips or stable hand bones | High | Inspect on day one; define sockets; use bounded pose fallbacks |
| Wrong weapon coordinate space or muzzle origin | High | Hand-local grip transforms and named muzzle/sight nodes; validate against targets |
| 50 animated ops overload devices | High | Incremental population tests; shared geometry/materials; cap effects and update work |
| Navigation becomes a new subsystem | High | Existing movement/physics and simple authored guard positions only |
| Duplicate damage/death/drop callbacks | High | Central authoritative, idempotent hit/death transitions |
| Audio/effects accumulate or leak | Medium | Bound lifetimes, pool where useful and enforce teardown |
| LMS changes regress accepted AOB systems | High | Isolate LMS modules; avoid city/world edits; regression-test after integration |

## 8. Engineering boundaries

Keep one authority for each concern:
- **Round manager:** lifecycle, population, counts, win/loss and restart.
- **Weapon registry/config:** three weapon parameters and named transforms.
- **Weapon runtime:** equip, aim, fire, reload, recoil, ammo and animation events.
- **Combat resolver:** authoritative hit query, hit classification and damage.
- **Op actor:** enemy GLB, health, minimal behaviour, death and drop trigger.
- **Pickup manager:** authored pickup definitions, collection and inventory/health updates.
- **Player combat adapter:** connects existing player, hand socket, animation and health.
- **HUD adapter:** consumes runtime snapshots/events only.

Exact filenames should follow existing repository conventions after inspection. Do not rewrite or relocate unrelated systems to fit this conceptual layout.

## 9. Test strategy

Progress through deterministic scenarios:
1. One player, one stationary target, one M4A1.
2. One player, one target, all three weapons.
3. One player, one moving/attacking op.
4. Small mixed op group and pickup set.
5. Full 50-op round in the city.

Automated tests should cover weapon state transitions, ammo arithmetic, damage boundaries, one-time death accounting, pickup idempotency, win/loss conditions and restart cleanup. Runtime integration tests must cover the real Babylon scene, character socket, physics hit query and imported GLB clips. Manual playtesting must verify grip, animation timing, sound/effect quality and perceived recoil; automated tests cannot establish those qualities.

Record each test as passed, failed or not run, including device/browser, build identifier and reproduction notes. Never treat a successful compile as proof that the game is playable.

## 10. Release discipline

- Confine changes to LMS and the minimum adapters needed for existing runtime integration.
- Do not change accepted city population, traffic, buildings, world geometry or unrelated simulation systems.
- Preserve the extracted weapon source notices and license attribution.
- Do not merge or deploy production solely because a preview build succeeds.
- After 28 November, triage blockers against the 1 December deadline; defer nonessential polish.
- Freeze feature work on 30 November and validate the release candidate.

## 11. Definition of done

LMS is done when a player can launch a round in the real AOB city, start with M4A1, MPX-9 and P-19, move and aim naturally, fire with correct weapon placement/animation/audio/effects, hit and eliminate a configured population of 50 ops using supplied enemy GLBs, take damage and die, collect ammo/weapons/health at authored locations and from eligible defeated ops, and reach a reliable win or loss state with a clean restart—without destabilizing the existing AOB world.

**Priority if time is constrained:** (1) correct weapon attachment and aim; (2) reliable firing and hit/damage; (3) player/op health and round completion; (4) reload/ammo/pickups; (5) animation/audio/effect polish; (6) optional visual refinements. The game must work before it is embellished.
