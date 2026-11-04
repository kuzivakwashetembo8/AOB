# GTD-POI-010 — Intersection, Podium, Curb, Combat Effects and Reese Jump
## Comprehensive Technical Implementation Plan — 2026-11-04

**Project:** P.O.I — Person of Interest
**Repository:** `interlinkglobal/GTD`
**Baseline:** `main` at `0ad26e44daf0dac2e0e1d893854c05c81d5b2b0a` (POI-009 merged)
**Document status:** PROPOSED — NOT AUTHORIZED FOR IMPLEMENTATION
**Planned feature branch, subject to approval:** `feature/poi-010-junction-curbs-combat-jump-20261104`
**Requested outcomes:** Fix permanently stopped intersection traffic, connect structural pillars to their podium slabs, put curb rounding on the road-facing corner, add muzzle sparks, allow rapid repeated pistol shots with matching sparks and sounds, and restore Reese's authored jumping animation.
**Authority:** Project owner; preview acceptance required before production merge.

**Scope interpretation:** This plan includes the two previously investigated open observations (traffic deadlock and podium-pillar disconnection) as well as the confirmed outward-facing curb correction and three new requests. These are six distinct work packages. Documentation approval does not imply permission to implement. Only source documentation changes are authorized in the current task.

---

## 1. Design intent and non-negotiable boundaries

- Preserve North Heights road network, existing street width, pavement materials, elevation and zebra crossing placement unless the corner mesh must be locally filled with asphalt as part of a genuinely rounded curb return.
- The correct intersection curb shape is the visible **road-facing convex corner** of the sidewalk, not the land-facing rear/outer corner. Four symmetric road-facing quarters must bend onto the carriageway at every four-way junction.
- The game retains physically solid vehicles, pedestrians and buildings: no solving gridlock by allowing cars to pass through obstacles, removing an NPC, releasing an occupied junction to a colliding vehicle, or teleporting traffic.
- The game retains the canonical 125-agent NH012 traffic simulation, existing driver controls, Finch navigation, Diane's authored Level 001 behaviors, and no extra GLB car downloads on game startup.
- Preserve full accessibility and existing mobile/desktop action controls. Rapid fire means **each discrete accepted press** produces a shot. Holding the button should not automatically become an unlimited full-auto stream unless later requested.
- Phase 1 combat is still presentation-only, now with a localized muzzle effect. **No projectile, bullet simulation, hit detection, damage, ammo, recoil-driven physics, muzzle impact decals, NPC combat reaction, health or police dispatch.**
- Reese's physical jump remains controlled by Rapier, not glTF root translation or animation lift. Falling off ledges must not cause involuntary jump takeoff poses at doors/curbs. Do not restore rejected character flight.
- Prefer modifying the existing native systems in place; no duplicate traffic engine, avatar, audio engine, world-construction path or animation rigs.

### 1.1 Source evidence (read-only inspection)

1. `src/game/traffic/nh012-traffic-simulator.ts`: global per-junction exclusive reservations; `hasExitSpace` on outgoing edges; `reconcileJunctionReservations001()` is **currently gated** by `if(!this.dianePace001)return`. A stopped car occupying a connector can retain ownership while all queue candidates wait. Real reproduction must identify whether blocked exits, a stale reservation, collision recovery or pedestrian obstruction dominates.
2. `src/game/vehicles/nh-solid-vehicle-collision-017.ts`: civilian cars have collision clearance against other cars, structures, trees, lamps, Reese and visible NPCs. A pedestrian can prevent a vehicle from moving while the pedestrian also avoids cars.
3. `src/game/experiments/north-heights-reconstruction-001.ts`: each podium column has `y+podiumH/2+.18` center and `podiumH` height, giving a top of `y+6.58m` at `podiumH=6.4m`. Slab center is `y+podiumH+.9`, height `.55m`, bottom `y+7.025m`. This creates a **0.445 m visible vertical gap** for standard podiums.
4. `src/game/experiments/north-heights-roads-003.ts`: `roundedJunctionPavement` selects the land-facing `outerX/outerZ` corner from `x+sx*OUTER,z+sz*OUTER` and applies a **0.6m radius**. The target corner must be `x+sx*HALF,z+sz*HALF` (the corner closest to the intersection center), subject to sign/mirroring tests.
5. `src/game/character/reese-player-001.ts`: loads `/GLBs/Reese%20(1).glb` with at least 70 clips; already tries to resolve `jump_air` and `jump_land`, but `updateControlled` selects gait using `reeseSafeLocomotion007(speed,sprint)`, which ignores both `grounded` and `verticalVelocity`. This is a confirmed functional reason for the standing-in-the-air presentation.
6. Same Reese controller: `triggerCombat` rejects any shot during `combatRemaining>0`, rejects repeated shots for **260ms**, then sets another **0.26s** recovery. `play(group)` refuses to restart the currently active group. All three inhibit fast repeated pistol input.
7. `src/game/experiments/north-heights-city-8.ts` forwards Rapier `result.grounded` and `result.verticalVelocity` to the actor at 60Hz, and routes `action==="combat"` to one accepted `triggerCombat` event and one synthesized sound.
8. `src/game/audio/vehicle/procedural-vehicle-audio-021.ts` already synthesizes pistol sound via the shared interaction-unlocked Web Audio graph.
9. Connected source `interlinkglobal/3d-gen`, `src/core/anim/clips/actions.ts` defines `jump_start` (“Jump start”, 0.45s), `jump_air` (“Jump (in air)”, 0.8s loop), `jump_land` (“Jump land”, 0.6s), and `jump_running` (“Running jump”, 0.9s). There is also a separate motion-captured clip named “Jump”. The name `jump_air` does not directly normalize to “Jump (in air)”: exact exported group matching must be verified rather than choosing “Jump” accidentally.
10. `interlinkglobal/3d-gen`, `src/core/anim/clips/shooter.ts` defines `pistol_fire` as a 0.5s one-shot with an early muzzle-flip transient. A 0.5s authored clip must be **retriggered or retimed**, not stacked as a new full skeletal group per rapid press.

These are verified code characteristics, not proof that the screenshot's traffic stop was caused by a particular mechanism. A runtime reproduction remains necessary.

---

## 2. WP-010-01 — Persistent traffic congestion and intersection deadlock

**Goal:** Civilian traffic encountering ordinary junctions, blocked crossings and congestion must eventually advance when physically legal; no systemic permanent stop due to stale bookkeeping or cyclic priority.

### 2.1 Instrument before changing traffic logic
- Create a deterministic replay of the same 125-agent NH012 fleet, seeded as production (120125), with 20Hz simulation; run sufficiently long to distinguish a traffic light/queue pause from indefinite deadlock.
- Add opt-in, non-HUD diagnostics: junction key, reservation owner, connector ID, owning agent state, owner progress/last-advance tick, destination-edge occupancy, blocked-by agent ID and classification (pedestrian/car/static/terrain), and queue wait duration.
- Capture p50/p95/p99 stopped durations and cars moving in rolling 30s windows, including after the simulation settles. Diagnostic data must not require enabling visible Export JSON widgets or permanent network telemetry.
- Reproduce the owner's screenshot at an in-world crossroad with pedestrian crossing and multi-car queue, and compare with a pedestrian-free baseline.
- Verify that authorized stationary states (Finch starter parked Sedan, Diane final stop, driver brake) are not incorrectly classified as deadlock.

### 2.2 Correct reservation lifecycle
- Remove the conditional skip that prevents global stale-reservation reconciliation when Diane pacing is inactive, **without** ever clearing a reservation from a real car currently inside its connector.
- Reconcile based on actual agent existence, connector ID and junction ownership, transitions to manual driving/parking, and impact recovery; deterministic tie-breaking when more than one anomalous claimant exists.
- Define a reservation ownership invariant: at most one owner per junction; any owner is a real non-parked actor in the corresponding connector, except a transient explicitly versioned handoff within the same tick.
- A vehicle physically stuck inside a connector retains collision exclusion until its body is safely clear. Timeouts alone must not authorize another car to overlap it.

### 2.3 Break cyclic gridlock without ghosting
- Build a small wait-for graph for blocked connector exits (junction/car dependencies) and detect strongly connected cycles, including an all-way-stop where nobody has safe exit clearance.
- Pre-admit cars only when expected downstream space is sufficient for the chassis to clear the conflict zone, not merely when a connector's starting point is free.
- Preserve deterministic first-legal-safe scheduling and fair queue priority; avoid starvation caused by an earlier arrival with a permanently blocked outbound lane. Allow alternative legal route selection only before a connector is committed and only when safe and mission-compatible.
- Keep collision checks continuous along each candidate motion, including the beginning and end of the connector. Never teleport an occupied agent.
- Investigate the car/pedestrian feedback loop: NPCs should clear crossings when physically possible, and approaching cars should yield safely rather than remain blocked by an avoidable stationary pedestrian.
- Maintain mission precedence for Diane's scripted drive and Finch routes. Recovery does not silently change authored destinations.
- Implement bounded recovery or replan with explicit reason codes when the owner is immobilized by a recoverable stale route. Where real physical occupancy precludes any legal solution, report a **true blocked state** rather than fabricating movement.

### 2.4 Exit tests
- In 125-car sustained simulations, no unexplained indefinitely reserved junction or frozen queue where a legal path exists.
- A pedestrian physically crossing causes a temporary yield, not a 5-minute permanent halt.
- No car-car, car-tree, car-building, car-Reese or car-NPC overlap.
- Stop-line spacing, driver manual takeover, after-impact recovery, Diane mission and auto-drive to Finch all regress cleanly.
- Add tests for reservation orphan reclamation, blocked exit, four-way cyclic wait, mixed car/NPC blocker, parked car, and original seed determinism.

**Primary files:** `src/game/traffic/nh012-traffic-simulator.ts`, `src/game/vehicles/nh-solid-vehicle-collision-017.ts`, `src/game/experiments/north-heights-city-8.ts`, pedestrian crossing/avoidance and targeted tests.

---

## 3. WP-010-02 — Connect building columns to overhead podium slabs

**Goal:** Four corner podium piers visually and geometrically meet the roof/portico slab without a floating ~44.5cm gap.

### 3.1 Geometry contract
- Derive the slab underside from the **same** slab placement constants instead of separately hard-coding a pillar height:
  `slabBottom = (y + podiumH + .9) - .55 / 2`.
- Derive the column base from its existing accepted ground/foundation connection (presently `y+.18`).
- Set `columnHeight = slabBottom - columnBase + seamOverlap`; tune `seamOverlap` to roughly **0.02–0.05m** so numerical/terrain precision does not leave a thin daylight crack.
- Set column center = `columnBase + columnHeight / 2`. Use a single helper for all four sign combinations and both shaft/no-shaft slab cases.
- Do not add a lateral block between columns: this would seal the lobby glazing or narrow the entrance. Preserve existing `stone-c` material, visual proportions, glass facade, ground skirting and open-entry navigation.
- For suspended slabs with elevator shafts, validate each multi-part `finchFloorRing004` slab underside and ensure each pillar meets the supporting piece under its footprint. Avoid extending an isolated column into a void in the elevator opening.

### 3.2 Acceptance
- Visual seam absent at eye level and high-angle flight-camera inspection in both bright day and night.
- Columns remain vertical and support slab at all four corners, without protruding through the upper slab surface.
- Finch and generic building entrances/elevators remain enterable; no collision blocker in door portal.
- Zero additional high-poly models; same batched primitive budget.

**Primary file:** `src/game/experiments/north-heights-reconstruction-001.ts`.

---

## 4. WP-010-03 — Correct road-facing curb return and curved sidewalk geometry

**Reference:** Owner's marked Meridian screenshot versus photo of a real curved junction. The previous implementation rounded the wrong corner, on the **land-facing exterior** instead of the **road-facing interior**.

### 4.1 Topology and orientation
- For junction `(x,z)` and quadrant signs `sx,sz ∈ {-1,+1}`, choose the **road-facing** vertex `(x+sx*HALF,z+sz*HALF)`. The current code incorrectly passes `(x+sx*OUTER,z+sz*OUTER)`.
- Generate the street-facing quarter arc tangent to **both adjoining straight curb runs** and close its footprint to the remaining corner pavement. Treat the four quadrant signs symmetrically by transforming a local canonical quarter; do not hand-maintain four independent hard-coded arc directions.
- Verify polygon winding (Babylon up-facing triangles and vertical curb fascia outward normals). Current fan triangulation can be adapted, but the fan must remain inside the walkable polygon after cutting the road-facing corner.
- The land-facing outer corner remains **square**, or follows whatever accepted street-lot shape already exists. Never introduce secondary inward scallops, dark square caps, or exposed extra blocks.
- Keep the route surface continuous and curb fascia co-generated from the exact curved vertices. No separate dark overlay strip or non-collidable cosmetic shortcut.

### 4.2 Radius and continuity
- Replace the old fixed 0.6m land-side rounding with a **configurable road-side trial radius**. Initial candidate: **1.5–2.2m**, bounded by 3.75m sidewalk width and crossing clearance. Final value must be selected from screenshot comparisons, not asserted as user-approved.
- Tessellate according to maximum arc segment length (initial target ≤0.15–0.25m) to avoid a visibly hexagonal curb. Avoid z-fighting between curb fascia and pavement top.
- Because clipping a square road-facing pavement corner removes a triangular/curved wedge of top pavement, fill the **complementary exposed wedge with asphalt at the existing asphalt grade**. Otherwise it would reveal white/green terrain. Meshes must meet without overlap or cracks.
- Continue both sidewalk and road-facing curb lines exactly to arc tangencies. Verify that sidewalk strip start/end and corner patch boundaries match; ensure crossings remain at their existing elevations and never pass beneath the sidewalk.
- Preserve slopes using `northHeightsGround` sampling. Existing pavement top .20m and asphalt .075m above local terrain are invariant, and curb sidewalls descend smoothly.

### 4.3 Tests and acceptance
- Unit test all four quadrants using the signed streetward vertex and verify nearest junction corner is rounded, **outer rear vertex is not**.
- Test arc tangency to straight curb edges, no self-crossing, watertight polygon/fascia and absence of bare terrain, independent of street yaw/sign.
- Render one representative junction at ground height, elevated camera, day/night; compare to provided reference with owner before expanding to the complete city.
- Reese/NPC walking around the pavement retains normal footing and no new ledge or penetration.
- Preserve collision map/solid curbs and zebra approach positions. Cars follow lanes and cannot cut through pavement.

**Primary files:** `src/game/experiments/north-heights-roads-003.ts` and any corresponding collision-footprint generator. The collision system must follow the visual curb where it actually models curb contact.

---

## 5. WP-010-04 — Per-shot localized pistol muzzle spark

**Goal:** Each **accepted pistol firing event** produces a brief, believable spark/flash at Reese's gun muzzle, visible at normal gameplay camera distance.

### 5.1 Attachment and alignment
- Audit actual `Reese (1).glb` weapon mesh/material naming, right-hand bone and hierarchy first. Current code explicitly warns that the gun may not be a distinct mesh; do not invent a wrong muzzle location.
- If the pistol exists as a separate skinned or rigid mesh, derive its barrel tip from its local bounding geometry/coordinate direction. Otherwise attach one reusable child transform to a verified right-hand/weapon bone with a calibrated muzzle offset and rotation.
- The effect must follow Reese's **actual** pose, handedness, yaw, and active firing frame. No generic flash at his face, torso or screen center.
- Validate in third-person daytime, night, when Reese rotates, on slopes and during rapid firing.

### 5.2 Visual design
- Use lightweight Babylon-native, **pooled procedural geometry or a small bounded GPU particle emitter**, with emissive white-yellow/orange flash, ~30–90ms primary bright phase and brief diminishing sparks. No network textures, separate GLBs, smoke/cloud loops or persistent point lights per shot.
- Small spark cone oriented along the pistol barrel, not bright screen-filling explosions. Consider optional tiny warm bloom only if existing renderer budget permits it. Do not call it a bullet or tracer.
- Use a fixed capacity effect pool, e.g. 8–16 simultaneous short-lived bursts, recycling expired emitters. Never allocate new meshes/materials per shot in the main render loop.
- Respect pause, detached Machine camera, UI-blocked gameplay, weapon unequip and actor disposal. Clearing/unequipping must remove pending flashes.
- The effect's source of truth is a **committed shot event**; animation/sound/spark use the same event ID.

### 5.3 Acceptance
- One spark for each successful shot and none for blocked/unarmed punch presses.
- Flash originates at the pistol barrel throughout active pose/recoil; no visual bullet exists.
- No accumulation of particles, glow or leaked Babylon objects after repeated taps, camera switches or route changes.
- If the weapon cannot be located reliably, stop and report asset requirement instead of displaying a misleading arbitrary-world spark.

**Primary files:** Reese player visual component, new small procedural muzzle-effect helper, `north-heights-city-8.ts`.

---

## 6. WP-010-05 — Tap-accurate rapid pistol firing, effects and audio

**Owner intent:** Repeated quick presses should produce more shots, correspondingly more muzzle sparks, and proportionally more synchronized pistol reports, rather than being silently discarded by a long cooldown.

### 6.1 Input semantics and single source of truth
- One **distinct pointer/keyboard press edge** in armed state requests one shot. Pointerdown + click must not double-count one physical press. A held pointer alone is not automatic firing in this iteration.
- Keyboard repeated `keydown` must not become an unintended machine-gun macro; discrete key release/repress is the keyboard equivalent. If the owner later authorizes hold-to-fire, implement that as a separate selectable mode.
- Existing UI/mission protections remain: paused, driving, elevator travel, Finch dialogue, expanded map and Machine camera cannot fire.
- Produce a central `ShotAccepted` event with monotonically increasing ID, timestamp, actor pose/yaw and muzzle attachment. **Only accepted events** trigger one synchronized animation retrigger + flash + sound.
- Remove the **260ms pistol lock** as the limiting factor and decouple shooting from the old `combatRemaining` one-shot lock. Retain a minimal device/render safety gate only to prevent physically impossible duplicate triggers; do not discard ordinary fast human taps.
- Punch continues to use its own deliberate longer recovery; it is not part of the rapid-pistol change.

### 6.2 Recoil animation playback
- `play(group)` currently does nothing if the group is already active. Add an explicit, bounded **restart of the existing pistol animation group** on each new accepted shot, rather than allocating another group for each tap.
- The source `pistol_fire` duration is 0.5s. Retiming or replaying the short early firing transient is acceptable if the muzzle-flip looks natural at fast cadence; continuous aiming remains the underlying pose and returns immediately when firing stops.
- Do not reset walk/run/riding locomotion on each tap or alter Rapier position. Limit spine/arm track overlap in a rig-compatible way and preserve character heading.
- Every registered tap should be acknowledged immediately. Define objective event counting, e.g. **N valid discrete taps = N shot events = N muzzle flashes = N audio start events**, with no silent 260ms suppression under human tap bursts.

### 6.3 Audio and performance
- Reuse the existing procedural `playCombatCue("shoot")` path and its single shared, interaction-unlocked Web Audio context. Every accepted shot emits a fresh short report.
- Independent short sound tails may overlap as in real rapid firing, but cap peak gain via shared bus/headroom to avoid severe clipping and protect mobile listeners. Do not concatenate stale sounds or restart the whole AudioContext per tap.
- Prefer pooled or preallocated short audio nodes where sensible, and dispose/release every ended node. Monitor active voice peak under 10, 20 and 40 rapid taps.
- Audio settings (master, effects, mute, pause, hidden-tab) continue to apply, with no audio playback if unavailable/locked.
- Short effects can overlap, but each shot should remain visually distinct. Recycle a bounded pool and preserve one event count even if the effect has to coalesce rendering under extreme synthetic rates.

### 6.4 Acceptance
- Ten clearly separate human taps accepted without arbitrarily rejecting taps inside 260ms.
- Ten accepted shots produce ten distinct spark emissions and ten initiated shot reports (subject to user audio mute), with correct camera/weapon orientation.
- No bullet meshes, ammo/health damage, recoil-driven camera teleport, mission changes or NPC combat reaction.
- Long rapid burst does not freeze the browser or create unbounded meshes, event listeners or AudioNodes.

**Primary files:** `reese-player-001.ts`, `north-heights-city-8.ts`, `touch-controls.tsx`, `desktop-controls.tsx`, shared procedural audio, muzzle helper.

---

## 7. WP-010-06 — Genuine Reese takeoff, airborne and landing animations

**Observed symptom:** Reese changes height during a jump, but visually remains upright in a standing pose.

### 7.1 Confirm the cause and actual export
- Source confirms physics passes the required `grounded` and `verticalVelocity` to `updateControlled`, but `reeseSafeLocomotion007` ignores both and chooses only idle/walk/run. The existing `groups.jump`, `groups.fall`, `groups.land` are therefore never selected in normal movement.
- Before export, inspect all 70 **actual instantiated** AnimationGroup names and their controlled bones. 3D-gen provides `jump_start`, `jump_air` (“Jump (in air)”), `jump_land`, `jump_running`, `fall` and mocap `Jump`. The current alias lookup for `jump_air` can accidentally match the separate “Jump” rather than “Jump (in air)”.
- Define explicit, case/format-tolerant clip roles (takeoff, air loop, fall, touchdown, optional running jump), with exact normalized/display-name priority; reject mismatched skeleton or unpopulated clip targets.
- **Import/export fallback only if clips are genuinely absent, malformed or incompatible.** Use `interlinkglobal/3d-gen` with the existing Reese preset and the current rig; export/retarget only required animation channels, or intentionally rebuild the single Reese GLB when necessary. Never add another full skinned character as a game-time dependency.
- Record clip names, length, track count, skeleton compatibility, and asset file byte-size delta in documentation. Any changed GLB must retain 70 required clips and all existing accepted movement/combat animations, material assignments, correct scale, and gun visibility.

### 7.2 Physics-driven visual state machine

```text
GROUNDED_IDLE or GROUNDED_MOVING
  jump input accepted by physics -> TAKEOFF (jump_start or running-jump entry)
  upward non-grounded samples      -> AIRBORNE (jump_air)
  downward non-grounded samples    -> AIRBORNE/FALL (matching clip)
  physics regained grounded       -> LANDING (jump_land once)
  landing clip ends                -> IDLE / WALK / RUN
```

- Detect the actual **accepted jump impulse** or reliable grounded→airborne edge, not just any single `grounded=false` sample. Doors, curbs, slopes, frame hitch and elevator updates must not trigger a false takeoff animation.
- Preserve vertical foot alignment: Rapier capsule handles world Y and collision, while glTF root translation/lift from keyframes is excluded or confined to a visual pivot so it cannot double-add physical jump height.
- Blend takeoff/air/landing with existing accepted 75ms transition logic or measured bounded blend; no T-pose or snap to idle midair.
- Takeoff is a one-shot, air is looped while airborne, landing is a short one-shot at actual contact. Allow intentional subsequent jump after physical re-grounding; do not retrigger from a held jump key if physics rejects it.
- Preserve run/walk head, heading, third-person camera, hands/gun pose and jump behavior on mobile controls. If shooting during jump is unsupported, enforce clear blocking rather than allowing audio spark while actor is in unrelated clip.
- Keep falling from rooftops distinct from authored jump takeoff. Future landing-impact requirements remain separate unless already implemented.

### 7.3 Acceptance
- Standing and running jump visually include knee bend/arm motion, airborne pose, and landing recovery, synchronized to physical takeoff and ground contact.
- No standing-in-midair appearance, no animation lift altering gameplay vertical position, no incorrect mocap “Jump” chosen for `jump_air`.
- No involuntary fall/jump on door thresholds, slight curbs, or the Finch elevator.
- No new Reese GLB unless explicit clip audit proves needed, and no increased first-playable load beyond accepted budget.
- Existing pistol aim/fire and punch remain available after landing.

**Primary files:** `src/game/character/reese-player-001.ts`, `src/game/experiments/north-heights-city-8.ts`, physics movement state (if necessary), and 3D-gen export only if required.

---

## 8. Staging and work dependency sequence

This is a **proposal**; executable branch creation and edits require subsequent explicit approval.

| Stage | Package | Validation gate |
|---|---|---|
| 00 | Freeze baseline and collect deterministic reproductions | 125-car reservation/stop metrics, four signed curb screenshots, column-gap measurements, real Reese animation name inventory, tap-event baseline |
| 01 | WP-010-02 structural pillar join | Four connected corners, no lobby obstruction, procedural model count stable |
| 02 | WP-010-03 road-facing curb returns | One trial intersection approved before global rollout; four quadrants, road fill, collision/path alignment |
| 03 | WP-010-06 Reese jump | Existing clips first, explicit takeoff/air/land, physics-foot stability; 3D-gen fallback gated |
| 04 | WP-010-04 + WP-010-05 muzzle effect and repeated firing | Same accepted shot-event pipeline, pooled sparks, one audio per accepted press, high-rate stress test |
| 05 | WP-010-01 intersection congestion | Deterministic cycle/reservation diagnostics first, route/clearance repair, long-duration seeded replay |
| 06 | Integrated regression, performance, preview | TypeScript, full Vitest, production build pipeline and manual P.O.I mission audit; deliver preview only |

**Risk priority:** Traffic recovery has the highest world-state and mission coupling; isolated geometry and visual animation adjustments can be accepted first. Do not silently combine traffic and pistol changes in the same source commit. One feature branch, smaller reversible commits, no branch proliferation.

---

## 9. Mandatory testing matrix

### 9.1 Automated
- Geometric unit tests: every quadrant, arc nearest junction, tangent intersection coordinates, polygon orientation/coverage, no bare-terrain wedge, fascia continuity, radius bounds. Test nonzero terrain gradients.
- Podium coordinate tests: top of each pillar >= bottom of its supporting slab with 0.02–0.05m overlap, no top-through slab, shaft/ring geometry and entrances.
- Collision and traffic tests: 125 agents, seed 120125, 20Hz long-running deterministic replay, zero orphan junction reservations, blocked-exit cycle, physical car conflict, competing NPC crossing, Diane intermediate turn, manual driver reservation handoff, no gridlock under legally passable conditions.
- Input edge tests: pointerdown/click deduplication, pointer cancel, keyboard release, modal/paused/vehicle restrictions, rapid tap event count and 0.5s authored animation restart.
- FX unit tests: one accepted shot -> one muzzle flash emission, correct world muzzle transform, bounded emitter count, cleanup on route/unequip/pause, no flash from punch or rejected shot.
- Audio tests: one valid press -> one shoot cue start; overlapping short tails with bounded peak gain, mute/suspend and stopped cleanup.
- Jump tests: exact clip mapping, grounded jump entry, airborne rise/fall, landing once, false-ground sample suppression, held jump and repeated jump sequences, running jump, traversal into lift/doorways, no double root lift.

### 9.2 Integration and manual
- Compare a screenshot from one original square corner and one corrected circular return at the same camera pose; test all four city orientations.
- Inspect Finch-like podium in bright daytime and in the dark from street and roof-camera view.
- Play city for long enough that traffic across several junctions remains productive and clearance recovers after a blocked crossing. Confirm cars remain physical.
- Fire single shots and fast sequences of ~10 and ~30 distinct taps on mobile and desktop. Capture shot, spark and audio-event counts. Judge visual quality at daylight/night and camera zoom distances.
- Perform jumps from rest, while running, beside a wall, off a curb, on upper floors, on a rooftop and near the elevator. Recheck accepted Reese locomotion.
- Verify full P.O.I-009 compatibility: map transition/sounds, control grid size, joystick label, Finch mission, Diane mission, character audio and person-person avoidance.

### 9.3 Build and performance
Run the repository's complete build chain, including wheel-source audit, extraction, TypeScript noEmit, prebuild, Vitest and production bundle. Any failed test must be diagnosed rather than disabled for a green badge.

Record before/after:
- p50/p95 frame time and peak draw-call/particle count on mobile and desktop;
- traffic cars moving and stuck durations per 30s rolling interval, active reservation count/age, illegal overlaps;
- app startup vehicle GLB network requests (**must remain zero except permitted Sedan**) and first-playable elapsed time;
- Reese rig/GLB bytes, actual animation clip names, active groups;
- number of distinct tap events, shots, sparks, audio report starts, active sound voices and FX pool occupancy.

**Non-negotiable target:** No substantive regression from accepted P.O.I-009 gameplay smoothness, startup behavior or input ergonomics. Report actual measurements, not invented performance gains.

---

## 10. Failure modes and rollback

- **Traffic:** Never use a timeout to move a solid car through another car. If cycle resolution requires a route choice, only change an uncommitted lane choice and preserve the driver's or mission's route contract. Instrument ownership and physical clearance before modifying scheduling.
- **Curb:** Rounding the wrong quadrant again is an explicit failure. Reject if it generates four inward scallops, exposed grass under asphalt, missing collision sides or black/grey coplanar blocks.
- **Podium:** Reject changes that appear connected visually but create a solid barrier across a previously enterable lobby.
- **Muzzle:** If the GLB weapon attachment is unresolved, stop with a reportable asset issue instead of placing a spark at Reese's hand origin.
- **Rapid fire:** Never fake one-to-one counts by triggering audio/flash when actor shot was rejected. Recoil must be visibly retriggerable at fast tap cadence. Enforce technical resource caps through rendering/voice management rather than a hidden, unexplained 260ms user-input suppression.
- **Jump:** Distinguish deliberate jump from false grounded samples. Do not replace the correct source clips with a manually invented crouch when 3D-gen already provides authored jump data. Avoid adding a second GLB at startup.
- **Reversible:** Each package is isolated in a commit with rollback capacity; test against the previous P.O.I-009 baseline.

---

## 11. Definition of done and owner acceptance

1. Traffic at playable junctions progresses when collision-safe paths exist. No unexplained permanently stopped lines or stale junction owners.
2. Building podium pillars physically and visually meet the corresponding overhead slab.
3. Pavement corners visibly round toward the **road**, matching the owner's red-marked correction and photo; the land-facing corner remains unaffected.
4. Each pistol shot emits a short, properly positioned spark at the muzzle.
5. Repeated deliberate taps produce matching rapid firing animation, sparks and sound, with no arbitrary 260ms lockout and no damage, bullets or hit detection.
6. Reese uses appropriate authored takeoff, in-air and landing animation instead of a standing pose in midair; 3D-gen re-export only if verified necessary.
7. Tests, production build, loading, FPS, missions, radio and third-person camera pass without regression.
8. Owner receives a feature preview after implementation and build initiation. No merge to `main` or production deployment without explicit approval. Once preview URL is issued, do not monitor logs unless user reports build failure.

### Approval checkpoint
- **Plan written/committed:** documentation only.
- **Six proposed work packages:** pending explicit implementation authorization.
- **Source code modified:** no.
- **Deployment initiated:** no.
