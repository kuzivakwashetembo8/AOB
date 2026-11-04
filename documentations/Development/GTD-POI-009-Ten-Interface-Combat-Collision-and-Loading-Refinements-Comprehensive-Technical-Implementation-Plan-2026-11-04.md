# GTD-POI-009 — Ten Interface, Combat, Collision and Loading Refinements
## Comprehensive Technical Implementation Plan — 2026-11-04

**Project:** P.O.I — Person of Interest (formerly Grand Theft Division / G.T.D)  
**Repository:** \`interlinkglobal/GTD\`  
**Baseline:** \`main\` at \`0ef15c9e0dccfb3ab9b0be72f074e77c04e337e1\`  
**Document status:** PROPOSED — IMPLEMENTATION NOT AUTHORIZED  
**Planned implementation branch (after owner approval):** \`feature/poi-009-ten-refinements-20261104\`  
**Planning owner:** Game development  
**Acceptance authority:** Project owner  
**Scope:** Ten owner observations; one explicit combat-scope decision  
**Non-goals:** Damage, hit detection, projectile or bullet meshes, NPC injury/death, new weapons, mission redesign, vehicle-fleet changes, redesign of accepted loading screens.

> **Authorization boundary:** Committing this document is documentation only. Do not change runtime code, install new assets, merge a feature branch, or deploy as a result of this plan. Implementation needs separate explicit approval. After approval, preview changes on a feature branch; merge/deploy production only with owner authorization.

---

## 1. Executive decision and constraints

Implement the ten refinements as ten tracked work packages on one implementation branch, with small validated commits and a final integrated acceptance preview. Prefer measured interventions in existing systems over new parallel implementations.

The owner has **approved animation-and-audio-only combat** for this first iteration: punching and pistol firing may play Reese animations and procedural sounds, but shall not perform raycasting/hit detection, spawn bullets/projectiles, lower health, apply impulses, alter NPC AI or mission outcomes, or produce damage indicators.

**Non-negotiable preservation:**
1. Reese is the active player avatar, not legacy Voight. References to Voight in old code or observations do not authorize switching character.
2. The Machine POV is a detached camera, never flight of Reese's body. Map teleport in this mode moves the camera only.
3. Preserve the accepted three-column action layout; add the combat button without rearranging established controls.
4. The **exact 20%** action-button growth is measured against the current effective button dimensions, not the pre-POI-008 sizes.
5. Do not slow first-playable load with animation imports, GLB vehicles, extra audio downloads, or new character actors.
6. Preserve Finch HQ, floor 53, all-building elevators, mission dialogue, Diane Level 001, radio, Sedan driving/traffic, NPC identities/routes, and existing physics.
7. All gameplay popovers/modals inherit a common glass-control design language; existing loading artwork, geometry and loader behavior remain unchanged.
8. No deployment monitoring after providing a deployment link, per owner workflow. On failure reports, inspect that deployment's logs and correct the actual error.

### 1.1 Repository observations (read-only audit)

- \`src/ui/hud/north-heights-lift-keypad-019.tsx\` displays a five-column floor grid with \`overflow-y-auto\`, inside a \`max-h-[74vh]\` panel.
- \`src/ui/hud/touch-controls.tsx\` includes the literal \`MOVE\` label; \`visibleTouchActions\` currently shows jump/sprint/vehicle (or Machine camera ascent/descent), not a dedicated combat action.
- \`src/styles.css\` ends with POI-008 overrides: normal touch-action buttons are **58 px square**, short-landscape buttons **54 px square**. Desktop HUD action buttons have a **42 px** default.
- \`src/ui/hud/game-hud.tsx\` owns the DEV TIME CONTROL popover. \`src/routes/north-heights-preview.tsx\` owns the VEHICLE MUSIC control and hand/gun selector. Styling currently differs.
- \`src/ui/hud/north-heights-map-010.tsx\` renders the expanded map conditionally. Immediate mount/unmount causes an abrupt transition; map pan, zoom, route selection and camera-target selection are existing supported features.
- \`src/game/character/reese-player-001.ts\` imports \`/GLBs/Reese%20(1).glb\`, **requires at least 70 embedded animations**, but actively resolves only idle/walk/run/jump/fall/land. No verified combat animation binding exists yet. A separately identifiable pistol mesh/material is detected via names, but the code warns if the weapon is inseparable.
- \`src/game/experiments/north-heights-pedestrian-avoidance-020.ts\` supplies swept, offset-based obstacle avoidance; \`north-heights-pedestrian-simulator-001.ts\` currently passes a callback for vehicles, trees and lamps, not a complete nearby-person set.
- \`src/game/physics/rapier-world.ts\` uses **one Rapier kinematic Reese capsule**. NPC positions are mainly logical and do not currently have a shared person-person collision contract with Reese.
- \`src/game/experiments/north-heights-city-8.ts\` already initializes 125 generated Sedan traffic agents and states **zero moving and parked vehicle GLB imports**. This is a hypothesis to verify from actual browser resource requests, not grounds to remove other vehicle files.
- \`src/game/camera/third-person-camera-constraints.ts\` clamps pitch to \`[-0.57,+0.46]\` radians, far short of upward sky viewing. It also provides terrain and building-blocker safeguards to preserve.
- \`src/game/audio/vehicle/procedural-vehicle-audio-021.ts\` has an interaction-unlocked, settings-aware Web Audio graph. Existing effects are generated at runtime without audio-file downloads.

### 1.2 Definitions and acceptance vocabulary

- **Baseline screenshot:** current production preview measured before changes.
- **First-playable:** existing loader milestone when the world is rendered and controls respond, not when every optional NPC or scene detail has loaded.
- **Modal:** an in-game modal, popover, panel or gameplay overlay. Full-screen loading/splash and route-level pages are not to be redesigned.
- **Unarmed:** Reese is in hand mode; combat control triggers a punch.
- **Armed/aiming:** Reese's existing upper-right hand selector is switched to its gun/crosshair state; combat control triggers a pistol firing cycle.
- **Shot:** an animation-and-sound event only; it has no physics or damage semantics.
- **Collision-free:** two active character body footprints do not visibly overlap when both occupy the same vertical level.

---

## 2. Implementation architecture and ownership boundaries

A single route/HUD game session remains the UI owner. \`createNorthHeightsCity8\` remains the gameplay controller. \`createReesePlayer001\` remains the visual animation owner, \`NorthHeightsPedestrianSimulator001\` the NPC movement owner, and Rapier the player/world physics owner. The audio subsystem is reused; avoid an independently auto-created AudioContext per feature.

Use these candidate interfaces, refining exact names after implementation inspection:

\`\`\`ts
type CombatVisualMode009 = "unarmed" | "armed";
type CombatVisualAction009 = "punch" | "shoot";

interface CombatVisualStatus009 {
  mode: CombatVisualMode009;
  busy: boolean;
  lastAction: CombatVisualAction009 | null;
  lastAcceptedMs: number;
}

interface GameGlassPanelProps009 {
  children: React.ReactNode;
  kind: "popover" | "panel" | "dialog";
  className?: string;
}
\`\`\`

\`GameAction\` already has a \`combat\` member, so reuse that public command rather than adding an incompatible parallel input event. Keep the current \`setReeseHandItem("hand"|"gun")\` selector and derive the combat icon and allowed visual action from that single authoritative state. Do not persist transient attacks. Keydown/pointerdown and keyboard accessibility must trigger the same action pathway.

For NPC avoidance, define a shared spatial occupancy abstraction with stable IDs, XZ coordinates, vertical layer/height and effective radius. Avoid overloading the car-only collision service with character identity and mission state. The NPC simulator decides logical proposals; Rapier must prevent Reese from penetrating local NPCs.

---

## 3. Work package POI-009-01 — Compact elevator keypad and bespoke scrollbar

**Source:** \`src/ui/hud/north-heights-lift-keypad-019.tsx\`; shared HUD styles.

**Implementation:**
1. Retain all existing building floor counts, five-column floor numbering, current-floor indicator, disabled-floor rules, click/selection callback and close action.
2. Replace panel \`max-h-[74vh]\` with a responsive, shorter design target of **55dvh maximum** (further constrained by safe areas, landscape and minimum usable height). Keep a fixed header and footer; only the floor-button viewport scrolls.
3. Replace browser-visible scrollbar artwork with a **custom narrow glass scrollbar**. Preferred reliable approach: native overflow remains scrollable but its native track is visually hidden; draw a positioned track and rounded translucent thumb reflecting \`scrollTop\`, \`clientHeight\`, and \`scrollHeight\`. Thumb travel and drag-to-scroll must be mathematically linked to content scroll. Use \`ResizeObserver\` or equivalent layout measurements, with cleanup.
4. Visually inset the track so it is shorter than the button viewport, e.g. 8–10 px at top and bottom. Keep the floor grid's usable width clear of the thumb; no number-button overlap.
5. Preserve mouse wheel, touch flick momentum, trackpad, keyboard focus and PageUp/PageDown, Home/End. Hide thumb when contents do not overflow. Offer reduced-motion behavior without changing scrolling.
6. The keypad remains accessible over the actual 53-floor Finch lift and a low-floor generic lift; open/close does not reset floor state.

**Acceptance:** scrollbar does not resemble default browser chrome; thumb can be dragged; all 53 floors remain reachable; on a small landscape device the panel never clips beyond safe bounds; floor commands remain correct.

---

## 4. Work package POI-009-02 — Remove the visible movement label

**Source:** \`src/ui/hud/touch-controls.tsx\`.

Remove only the visual \`<span className="joystick-label">MOVE</span>\`. Retain \`role="group"\` and \`aria-label="Movement joystick"\`, touch gesture capture/release, thumb positioning, haptics settings and both handedness layouts. Check saved CSS layout rules that reference \`.joystick-label\`; remove unused selectors where safe.

**Acceptance:** zero displayed \`MOVE\` text on the bottom-left joystick; unchanged movement vectors and pointer-release behavior; screen readers still identify the control.

---

## 5. Work package POI-009-03 — Exactly 20% larger right-hand action buttons

**Sources:** \`src/styles.css\`, \`src/ui/hud/touch-controls.tsx\`, \`src/ui/hud/desktop-controls.tsx\`.

**Authoritative pre-change dimensions and target dimensions:**

| Context | Existing square | Target square (exact ×1.20) |
|---|---:|---:|
| Standard touch | 58 px | **69.6 px** |
| Short landscape touch (\`max-height:440px\`) | 54 px | **64.8 px** |
| Desktop on-screen action pad | 42 px | **50.4 px** |

The desktop target applies to on-screen action pad controls only, not unrelated top-right camera, pause or hand selectors.

- Use CSS custom properties / \`calc(base * 1.2)\` or literal fractional CSS pixels; do **not round** to 69/70 or 64/65 px.
- Maintain three equal-width columns, equal button height, existing accepted action ordering, fixed button aspect ratio, and same user-configurable global control scale/opacities.
- Account for the additional third combat action and the resulting final row; recalculate safe-area inset and bottom/right positioning to avoid screen edges and overlapping joystick, minimap or driving pedals.
- The requirement applies to the complete button hit area; icon sizes may increase proportionally for legibility without creating larger visual padding than the button itself.
- Audit specificity: older 48/42 px declarations must not override the final 69.6/64.8 px values through media-query order.

**Acceptance:** computed browser styles show exact target dimensions in the relevant viewports; all three columns remain aligned; no overlap with other HUD elements or platform safe areas.

---

## 6. Work package POI-009-04 — One coherent glass-control panel design

**Sources:** \`src/ui/hud/game-hud.tsx\`, \`src/routes/north-heights-preview.tsx\`, \`src/ui/menus/session-overlays.tsx\`, \`src/ui/hud/north-heights-lift-keypad-019.tsx\`, \`src/styles.css\`.

**Design contract:** in-game overlays share the same dark **translucent glass**, subtle background blur, thin neutral border, white readable text, unified corner radius, light shadow, control hover/focus feedback and consistent spacing rhythm as \`Button variant="control"\`. Layout and accessibility may vary by panel type.

1. Establish one reusable semantic panel primitive or common \`.poi-game-glass-panel\` style token set, consumed by all newly touched modals.
2. Refactor **DEV TIME CONTROL** from the existing bespoke \`bg-black/90\` popup to the shared glass treatment. Preserve time entry, dawn/noon/dusk/night controls, cycle speed, keyboard focus and live time updates.
3. Refactor **VEHICLE MUSIC** control from \`bg-black/75\` to the same treatment. Preserve live radio status and ON/OFF action; no playback/radio architecture changes.
4. Normalize other gameplay popovers/dialogs (lift keypad, mission dialogue/completed panel and expanded-map chrome) by styling **only**. Settings and pause flows retain their established structure and semantics.
5. Use shared variables for glass opacity, blur, border, radius and focus ring. No bespoke panel backgrounds for newly created modals.
6. Ensure sufficient text contrast against bright daytime streets and orange night windows; avoid fully opaque fills unless needed for readability.
7. Retain reduced-motion, accessibility roles, tab order and escape behavior.

**Explicit exclusion:** The Machine loading screen remains visually and functionally unchanged under previous owner acceptance. No redesign of landing pages, splash images or story UI.

**Acceptance:** DEV TIME CONTROL and VEHICLE MUSIC visibly match the action-button glass design; controls still work; no independent modal color treatment.

---

## 7. Work package POI-009-05 — Animated map mount/unmount and generated toggle sound

**Sources:** \`src/routes/north-heights-preview.tsx\`, \`src/ui/hud/north-heights-map-010.tsx\`, \`src/styles.css\`; settings-aware audio pathway.

**Transition design:**
- Replace direct \`{mapOpen && <ExpandedMap/>}\` destruction with \`closed/opening/open/closing\` phases or a mounted/display state pair.
- Open: approximately **200 ms**, modest opacity fade and scale from ~0.97 to 1; no large flying transition. Close: approximately **160–200 ms** reverse. These are preliminary tuning targets, not fixed gameplay timing.
- Closing remains mounted, blocks unwanted gameplay pointer events as appropriate, then unmounts on transition completion; provide a timeout/failsafe for browsers that skip transition-end events.
- Handle all exit routes with one close function: X button, Escape, successful Finch destination selection, and successful Machine map-camera teleport.
- Keep existing pan, pinch-zoom, reset, click-to-route and click-to-teleport callbacks unchanged. Prevent animation-triggered accidental double selection and duplicated sounds.
- Respect \`prefers-reduced-motion\`: use immediate or near-immediate visual transitions while retaining function.
- Generate short open and close cues using Web Audio oscillators/noise envelopes, routed via game settings-aware effects volume. No MP3/WAV fetch, no early AudioContext creation; unlock from the actual map click/keypress gesture.
- Audio must be correctly muted on pause, \`document.hidden\`, and effects mute. Do not play multiple map cues for one user action.

**Acceptance:** perceptible smooth open and close; each action makes one subtle cue when audio is enabled; no dangling map state or invisible overlay preventing resumed play; Machine camera teleport and Finch routing remain correct.

---

## 8. Work package POI-009-06 — Third contextual combat action button

**Sources:** \`src/ui/hud/touch-controls.tsx\`, \`src/ui/hud/desktop-controls.tsx\`, \`src/game/core/types.ts\`, \`src/routes/north-heights-preview.tsx\`, \`north-heights-city-8.ts\`.

**Mode and icon contract:**
- Empty-hand state: combat action icon = fist; accessible label \`Punch\`.
- Gun-equipped state (existing top-right hand/crosshair selector): combat action icon = pistol/gun; accessible label \`Fire pistol\`.
- Top-right selector continues to alternate empty hand and gun/aim states; do not add a second conflicting equipped-state source. Armed state means aiming for this first implementation.
- Put the third action into the accepted **three-column** right-hand pad, after existing applicable actions, without reordering current buttons.
- Provide the equivalent desktop action affordance and an accessible keyboard path (existing \`GameAction="combat"\`; verify current key binding conflict before assigning).
- Hide/disable combat while driving, riding an elevator, in a modal, paused or in detached Machine camera mode. If mission dialogue is in progress, suppress it without dropping dialogue state.
- Use rising-edge pointer/key semantics. Release/blur/cancel clears pressed state; a held key must not trigger uncontrolled firing.
- No NPC interaction, vehicle entry or hand-selector regression.

**Acceptance:** fist when unarmed; gun/fire icon when armed; correct action reaches the controller; no combat action when movement is not in a permitted grounded state.

---

## 9. Work package POI-009-07 — Reese punch/aim/shoot animation and sound

**Asset discovery gate:**
1. Inspect the **actual 70** AnimationGroup names and target bones in \`/GLBs/Reese%20(1).glb\`; record available punch, idle-armed/aim and shoot/recoil clips rather than guessing their names.
2. Extend \`findReeseClip001\` with explicit, collision-safe matching for any found clips. Ensure the selected animation is authored for the same rig and not a misleading clip with a similar label.
3. If an animation is absent, locate the owner's **3D-gen repository** and the source animation. Validate access, skeleton hierarchy/coordinate convention, rest pose, bone targeting, scale and frame span. Import **animation data only**, not an additional complete avatar. A missing or incompatible asset is a named implementation gate, not a reason to fake a result.
4. Record the manifest/clip identifier and diagnostics. Keep optional combat clips lazily loaded or bundled into the existing player asset without increasing startup critical path; no new 70-animation GLB duplicate.
5. Inspect whether the pistol is truly separable from the Reese model. Honor current weapon mesh/material visibility logic; if it is inseparable, flag the defect rather than inventing an unrelated weapon.

**Animation state machine (suggested):**

\`\`\`text
GROUNDED + UNARMED
  punch press -> PUNCH_ONESHOT -> recovery -> grounded locomotion
GROUNDED + ARMED/AIMING
  shoot press -> SHOOT_ONESHOT -> bounded recovery -> grounded aim/locomotion
DRIVING / ELEVATOR / MACHINE_CAMERA / PAUSE
  no combat action
\`\`\`

- Preserve Reese's Rapier capsule position, heading, foot-ground contact, locomotion and accepted body proportions. Combat is primarily an animation-layer concern.
- Prefer upper-body-only animation blending/masking if the clips and skeleton permit it; otherwise use bounded full-body one-shots while stopped and return cleanly to idle/walk/run. Never leave a static T-pose or frozen gait.
- One button press = one accepted attack event, gated by clip/cooldown. Repeated taps remain responsive and **must not stack simultaneous Babylon animation groups or duplicate sound nodes**. Suggested initial pistol ceiling ~4–5 shots/second (to be tuned against animation length); punch slower (~1–2 actions/second).
- Firing direction is **Reese's actual facing yaw**, not an arbitrary world axis. The aim pose should align with the established actor heading, preserve third-person orbit rules and avoid snapping the physics body. No requirement to render bullets.
- Produce a short pistol report, mechanical recoil/click and optional brief aim/equip cue; punch gets a whoosh. Effects use the shared game sound settings, browser gesture unlock and headroom compression. Limit simultaneous voices; dispose nodes promptly.
- Do not create raycasts, damage events, knockback, HP changes, death reactions, police response, ammo/reload or impact effects in this work package.
- Report optional combat-clip readiness independently from mandatory first-playable readiness.

**Acceptance:** visible unarmed punch and armed firing on Reese, audio synchronized with each accepted event, consistent repeated tapping, facing-correct orientation, no bullets/damage/NPC reactions, clean return to locomotion and zero extra player GLBs.

---

## 10. Work package POI-009-08 — Bidirectional human avoidance and collision

**Sources:** \`north-heights-pedestrian-simulator-001.ts\`, \`north-heights-pedestrian-avoidance-020.ts\`, \`north-heights-city-8.ts\`, \`north-heights-physics-005.ts\`, \`game/physics/rapier-world.ts\`, and a new compact proximity/occupancy helper.

**Current issue:** The NPC avoidance callback sees static/vehicle clearances, not nearby dynamic NPCs and Reese as a uniform class. Reese is physically represented in Rapier while other NPCs are mostly XZ logical agents.

**Design: two linked layers.**

**A — logical NPC–NPC and NPC–Reese avoidance (20 Hz):**
1. Index all active, visible/logical exterior walkers by deterministic cell keys (proposed ~2–3 m grid; tune to body radius). Include Reese at his actual physics XZ position and Y layer.
2. Freeze a **snapshot** of occupancy at the start of each simulation tick. Generate each NPC's proposed motion against that snapshot, then resolve pairwise conflicts and commit accepted positions. Avoid sequential updates whose result changes when agent array order changes.
3. Use realistic planar radii (starting ~0.30–0.35 m), small clearance margin, relative velocity and anticipated direction to detect head-on and crossing paths.
4. Prefer sidestepping at bounded offsets, yielding to oncoming agents when the sidewalk is narrow and returning smoothly to the original path. Stable identity-based right/left preference prevents symmetric oscillation. Add bounded backoff and alternate lane choice for prolonged obstruction.
5. Integrate with existing \`pedestrianObstacleStep020\` so a sidestep remains swept-clear of Sedan hulls, trees, lamps, walls and curb/portal constraints.
6. Preserve authored mission-reserved NPC positions and routes; scripted beats take precedence, while others yield. Do not teleport pedestrians or create floating colored proxies.
7. Partition by floor/height so a pedestrian on the ground does not block Reese above in a multi-storey building. An agent entering/leaving a doorway must have an explicit portal transition state to avoid spawn-overlap.

**B — Reese versus NPC physical protection (fixed-step):**
1. Reese retains the single existing Rapier kinematic capsule.
2. Provide a **bounded pool of nearby NPC physical/query proxies** (or an equivalently rigorous swept planar gate) so the next Reese movement cannot tunnel through a local NPC. Sync proxies before each player physics movement.
3. Avoid creating one expensive dynamic physics actor per distant NPC. A near-player radius with a capped pool and lifecycle is preferred; verify in the prototype that crowd density cannot exceed the cap without losing collision.
4. Reese must not forcibly push scripted NPCs out of place or unexpectedly block the elevator. Use height-aware clearance and disable/detach proxies when agents are logically inside or far away.
5. NPCs must similarly avoid Reese using their logical occupancy check. **One-way avoidance is insufficient**.
6. Handle spawn overlaps explicitly and test two NPCs from the same entrance, opposing sidewalk traffic, crowded zebra crossing and Reese walking into a standing NPC.

**Performance and stability:**
- Maintain existing 100-agent population, asset pooling and ~20 Hz logical tick; spatial hash query complexity should scale with local neighbors rather than all agent pairs.
- No full-frame all-pairs checks, no constantly recreated Rapier bodies, no high-frequency console logs.
- Target no statistically meaningful gameplay FPS regression; compare at least p50/p95 frame-time and peak count of nearby physics proxies to the baseline.
- Track \`avoids\`, \`yields\`, \`blocked\`, \`stuckOverThreshold\` and minimum observed interpersonal separation as developer diagnostics (not visible permanent HUD).
- Add deterministic tests for reciprocal avoid, passing, edge congestion, height separation and mission reservation.

**Acceptance:** Reese and active NPCs cannot visibly pass through one another; NPCs route around one another and Reese without permanent freezing, ghosting or long-standing oscillation; missions and pedestrian journeys still complete.

---

## 11. Work package POI-009-09 — Sedan-only vehicle startup asset gate

**Sources:** \`north-heights-city-8.ts\`, \`north-heights-sedan-traffic-009.ts\`, route imports, loading ledger, asset manifest/preload paths, gallery routes and generated-vehicle build scripts.

1. Record browser Network/PerformanceResourceTiming during a cold first load at desktop and mobile. Enumerate all \`.glb\` requests with start and completion timestamp, response bytes if available, initiator, and whether they are vehicle assets. Separate car assets from trees, Reese, Finch and NPCs.
2. Confirm the current 125-agent generated Sedan visual path loads no non-Sedan source GLBs. The existing comment that parked GLBs are disabled is evidence of intent, **not** proof of the observed network waterfall.
3. Remove every confirmed **non-Sedan vehicle GLB** from the gameplay entrypoint's eager import, asset manifest, preloader or start-time promise chain. Route optional gallery/editor vehicles through lazy, user-initiated imports instead.
4. Do not delete Dodge, Range Rover, Hatchback, Lamborghini, BMW or any other source car models. Preserve IDs, extraction scripts, audit artifacts and future opt-in access.
5. Do not force Sedan GLB downloading if the existing native Sedan mesh already supplies production traffic. "Except Sedan" is a maximum permitted vehicle-source class, not a requirement to download a redundant Sedan GLB.
6. Keep compile/build-time model processing conceptually separate from **browser first-playable** loading. A Vercel prebuild script may inspect archived assets without adding network cost to the player's game boot.
7. Ensure no car source silently loads after the first playable frame except an explicitly invoked feature; keep the gallery deliberately decoupled.

**Acceptance:** zero non-Sedan vehicle GLB requests during the first-playable interval on cold and warm loads, 125 unchanged native traffic agents and drivable behavior, no missing Sedan wheels/collisions, all original car files retained, no startup-time regression. Log the actual measured difference rather than claiming savings when baseline already equals zero.

---

## 12. Work package POI-009-10 — Sky-capable third-person camera, safe ground limit

**Sources:** \`src/game/camera/third-person-camera-constraints.ts\`, \`north-heights-city-8.ts\`; camera tests.

**Current constraint:** \`clampNorthHeightsPitch\` forces pitch into \`[-0.57,+0.46]\` radians. Current third-person orbit computes a direction from yaw/pitch, shortens against blockers and lifts above graded terrain.

**Implementation:**
1. Allow near-vertical upward orientation for Reese's third-person camera. Suggested stable engineering limit **approximately -1.55 radians (~-88.8 degrees)** rather than exact -π/2, which is singular for yaw/orbit and may flip the view. This should appear unrestricted to a player looking at the sky.
2. Keep a deliberately constrained downward pitch (initial tuning around +1.0 to +1.2 radians, subject to collision tests) to avoid subterranean peeking and inverted camera motion.
3. Preserve the existing terrain sampling (8 line-of-sight samples), ground clearance of at least **terrain +0.85 m** for normal third-person positioning, collision boxes, camera radius adjustment and camera XZ map bounds.
4. Confirm extreme orbit angles do not induce camera flipping, clipping, sudden relocation, roof penetration or elevator shaft escape. Preserve specialized Finch cabin camera restrictions.
5. Use one canonical pitch clamp for pointer/touch updates and third-person resolution. Detached Machine camera behavior remains separate; do not move Reese when orbiting skyward.
6. Test indoors, at ground-level road slope, near walls, on rooftops and at city boundary on both mobile and desktop.

**Acceptance:** Reese's camera can look almost directly overhead to open sky; cannot place viewpoint beneath terrain or below roads; wall/elevator collision and stable heading still function.

---

## 13. Implementation stages, gates and ownership

All code stages occur **only after approval** on \`feature/poi-009-ten-refinements-20261104\` branched from the then-current main. Recheck for main changes and rebase safely if needed; preserve owner-approved work.

| Stage | Contents | Proof / exit condition |
|---|---|---|
| 00 | Baseline & telemetry | Cold-load GLB waterfall, frame-time baseline, screenshots of current keypad/buttons/panels/map, inventory of Reese animation names, tests pass before editing |
| 01 | UI fundamentals (WP-01 to WP-04) | Exact sizes verified, 53-floor scroll works, MOVE absent, glass style parity, no HUD overlap |
| 02 | Map and camera (WP-05, WP-10) | Open/close animation+sound; Machine teleport and Finch routing unchanged; sky viewing does not tunnel below terrain |
| 03 | Combat control and assets (WP-06, WP-07) | Repeated punch/aim/shoot animations and generated audio only; no damage/projectiles; assets validated |
| 04 | Human movement (WP-08) | Deterministic person-person avoidance plus Reese physical nonpenetration; 100 NPCs retain journeys and performance |
| 05 | Startup gate (WP-09) | Resource timing proof of zero non-Sedan vehicle GLB requests, preserved asset library, no loading regression |
| 06 | Integrated regression/preview | TypeScript, Vitest and app build pass; user receives feature preview; do not merge/deploy before owner's acceptance |

**Order rationale:** fast isolated UI tasks first, then map/camera, then combat asset dependency, then complex human proximity system, then performance proof and integrated QA. If Stage 03 asset discovery is blocked, retain working branch, report exact missing/incompatible clip and avoid fake acceptance; independent stages may still proceed.

**Working method:** one branch, one responsible subsystem per commit, no feature-on-feature branch proliferation, preserve easy rollback. Keep the documentation identifier in commit/PR descriptions. User acceptance is the merge gate.

---

## 14. Test strategy and regression matrix

**Static/build gates:** \`npx tsc --noEmit\`, \`npx vitest run\`, \`npm run build\`, and the repository's full Vercel build pipeline (including required wheel audit/prebuild). Update tests whose old assumptions no longer match explicitly approved behavior; never disable tests to make green builds.

**Unit tests proposed:**
- \`poi009-lift-scrollbar.test.tsx\`: DOM viewport, thumb geometry/scroll mapping, all floors, close/keyboard.
- \`poi009-touch-action-scale.test.tsx\`: mode-dependent 1.20 sizing, 3-column order, new icon, no MOVE label.
- \`poi009-glass-panel.test.tsx\`: common class/tokens, time controls, vehicle music accessibility.
- \`poi009-map-transition.test.tsx\`: phase sequence, repeated click suppression, callback preservation, reduced motion and audible toggle hook.
- \`poi009-combat-visual.test.ts\`: unarmed/armed mapping, repeated press cooldown, blocked modes, zero hit/damage codepath, animation recovery.
- \`poi009-reese-animation-contract.test.ts\`: verified clip names, skeleton compatibility or explicit failure; test without network.
- \`poi009-human-proximity.test.ts\`: deterministic neighbor resolution and no penetration, opposing walkers, spawn portals, floors, Reese blockers.
- \`poi009-sedan-startup-gate.test.ts\`: no eager source-glb imports for non-Sedan vehicles, asset files still exist, gallery lazy import.
- \`poi009-camera-sky.test.ts\`: near vertical up, ground clearance, wall and cabin safety, stable yaw.

**Existing regressions to preserve:**
- North Heights shared controls, mobile driving arrows, 3-column action layout and old key bindings.
- Machine camera toggle/return, expanded map zoom/pan/tap-to-move camera, Finch map auto-drive and pending mission markers.
- Reese GLB pre-existing 70-animation contract, weapon visibility, locomotion/footstep cadence.
- Elevator floors, floor 53 and receptionist, lift motion and cabin camera.
- NPC deterministic routing, obstacle avoidance, mission-reserved agents, horns, no-dot visual requirement.
- 125 native Sedans, wheel/source fit, traffic collisions, drivable vehicles, no passenger ghost capsule.
- P.O.I loading visuals, startup stopwatch, offline/PWA and saved settings.

**Manual acceptance matrix:**
1. 53-floor and 6-floor elevator, mouse wheel, scrollbar drag, keyboard, Android landscape.
2. Mobile 58→69.6 px and compact 54→64.8 px, right/left-hand settings, buttons unobstructed.
3. Time popover on high-contrast day/night, music control while driving, common glass appearance.
4. Map toggled 20 times, Escape/X/route/teleport, pinch+pan, no stuck overlay.
5. 20 rapid punch presses, armed aim and 20 rapid shots; one animation/sound per accepted event and no damage.
6. NPC vs NPC and Reese vs NPC at walkway, doorway and crossing, both directions, no pass-through or stuck loop.
7. Cold startup, traffic and source-asset request inspection; verify no non-Sedan car GLB requests.
8. Skyward orbit, rooftop, interior, hilly road and Finch elevator; no under-ground camera.

---

## 15. Measurement, performance and failure controls

**Measure before/after:**
- cold and warm **time to first playable frame**, with accepted existing target **≤60 seconds**;
- requested vehicle GLB count and transfer bytes before first playable;
- total GLB requests split by vehicles/characters/trees;
- frame-time p50/p95, dropped-frame count and loading frame stalls on reference mobile/desktop runs;
- active/proxied nearby NPC bodies, spatial neighbor checks per 20Hz tick, stuck/yield counts;
- active Web Audio nodes, muted/paused behavior and memory cleanup;
- rendered effective button width/height and map transition duration.

**Failure controls:**
- A missing combat clip must be reported explicitly; do not substitute unrelated animation or idle animation and call it shooting.
- A physically solid NPC must not cause player softlock in a narrow doorway; add deterministic yielding/temporary release with state awareness, not ghosting through humans.
- Never solve crowd problems via teleporting or removing NPCs from a player's view.
- If custom scrollbar drag fails on a browser, retain **native scrolling functionality**; nonfunctional custom chrome is not acceptance.
- If near-vertical camera creates a roof/interior clipping problem, isolate the camera constraint and fix collision logic; do not remove the terrain safety floor.
- If an optional audio effect fails or the browser blocks AudioContext, gameplay remains usable, and failure is recorded without a modal.
- If non-Sedan network requests already equal zero, document zero net transfer savings rather than regressively rewriting the vehicle architecture.
- On any build failure, retrieve that specific deployment's Vercel events only when the owner reports it; fix exact TypeScript/test/build failure on the same feature branch.

**Rollback boundaries:** each work package is independently revertible. No database migration, global storage-key rename, asset deletion, production release or history rewrite is authorized.

---

## 16. Definition of done and explicit approval gate

### Required owner-visible results
1. Compact lift keypad and working custom short scrollbar.
2. No visual MOVE label, same joystick behavior.
3. Exactly 20% larger action buttons in each supported viewport.
4. Unified translucent glass panels including DEV TIME CONTROL and VEHICLE MUSIC.
5. Smooth map open/close with one settings-aware generated cue each way.
6. Third contextual fist/pistol combat button, consistent with current hand selector.
7. Reese punching, aiming, and repeated pistol firing with synchronized audio; no damage, hit detection or bullets.
8. Reese/NPC and NPC/NPC bidirectional nonpenetrating movement with credible sidestepping.
9. No non-Sedan vehicle GLB requests during critical startup; all archived vehicles remain.
10. Sky-capable Reese camera with persistent terrain, rooftop, wall and elevator safeguards.

### Code quality
- All TypeScript, tests and production build pass.
- Instrumentation supports evidence for each acceptance claim.
- The preview loads and each high-risk scenario has been manually exercised or is explicitly marked unverified.
- Approved loading UI, P.O.I story progress, sound/radio and Machine camera are preserved.
- A single preview URL is supplied; deployment failure monitoring is owner-driven.
- **No merge/deploy to production without explicit owner acceptance.**

### Approval record
- **Owner-approved design decision:** Combat Phase 1 = animation and audio only, no hits/damage.
- **Other ten observations:** Owner supplied; details above proposed for technical approval.
- **Implementation approval:** PENDING.
- **Authorized action now:** Documentation only.
