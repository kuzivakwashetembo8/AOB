# GTD-POI-008 — P.O.I Rebrand, The Machine Camera and Ten Gameplay Refinements
## Comprehensive Technical Implementation Plan — PROPOSED / IMPLEMENTATION NOT APPROVED

**Date:** 2026-11-04  
**Repository:** `interlinkglobal/GTD`  
**Inspected baseline:** `main` at `0a5283da447e75ebd44eb350eebc1796797626f7` (revalidate branch HEAD and touched modules when implementation is authorized).  
**Status:** Documentation only; awaiting explicit owner approval for implementation.  
**Authoritative owner correction:** The existing loading UI **must remain exactly the same**. Only its **visible wording** may change to describe *The Machine loading/initializing*, instead of the game interface loading. No loading-screen visual redesign, animation, layout adjustment, component replacement, typography, colours, timer change or progress-logic change is permitted.  
**Change authority:** This document authorizes writing the plan itself, NOT gameplay source edits, asset modifications, feature branches, PR merges, preview deployments, production releases or background execution.

---

## 1. Intent and source-of-truth requirements

The existing G.T.D browser game is becoming **P.O.I — Person of Interest**. Preserve the established city, mission systems, Reese character, Finch headquarters and accepted mechanics while correcting ten specifically observed deficiencies. User-facing rebranding does not imply wholesale internal identifier, data-key, route or repository migration.

| ID | Owner requirement, preserved verbatim in meaning | Acceptance outcome |
| --- | --- | --- |
| POI-01 | Rebrand G.T.D to **P.O.I (Person of Interest)**. | The game presents P.O.I in its visible name, branding text and relevant metadata without breaking routes, saves, PWA or runtime. |
| POI-02 | Refactor **only the words** on the current loading UI to convey **“The Machine is loading.”** | Same loading UI and measured loading behaviour, new machine-oriented text; no restyling. |
| POI-03 | Increase the audibility of vehicle audio; replace continuous buzz with a flowing **low → moderate → high → moderate → low → loop** while driving. | Smooth, non-monotonic engine tone that audibly rises/falls, remains continuous and responds coherently to vehicle state. |
| POI-04 | Give Reese footsteps; walking and running have clearly different step rates. | Gait-aligned audible footsteps while moving on foot, with running distinctly quicker and silence at rest. |
| POI-05 | The woman at reception must always be animated (talking, waving, etc.). | Subtle, varied, naturally blended recurrent movement, not an unmoving statue or one frantic repeated gesture. |
| POI-06 | Road/sidewalk roughness detail is too zoomed in with sparse spots; show much **finer, denser noisy texture**. | Many small surface details across a given world-space area instead of large isolated patches. |
| POI-07 | A car obstructed by Reese or an NPC should **hoot** to prompt movement. | Spatial horn on genuine pedestrian obstruction, realistic cadence and pedestrian response without unsafe movement. |
| POI-08 | Enlarge **bottom-right** control buttons; remove Reese's airplane/fly button and flying ability but preserve the flight-navigation implementation for Machine POV. | Comfortable touch targets; Reese cannot fly; navigation internals remain available to camera mode. |
| POI-09 | Add a **camera** button immediately **before the hand** button in the top-right controls; switch to first-person aerial roaming without Reese, while Reese remains in his exact position. Click again to return to Reese; while camera is active, tapping a map location takes the **camera**, not Reese, to that location. | Two clearly separated authoritative locations: grounded Reese transform versus movable surveillance-camera pose; correct toggling and map travel. |
| POI-10 | Fix disconnected metal/steel frames on glass buildings, especially the approximately four floating glass panes around first-floor entrances. | Continuous mullions/transoms and correctly connected facade/entrance glazing with usable door openings. |

**The owner's agreement applies to all interpretations above, with the explicit POI-02 loading-wording-only correction overriding any prior suggestion of a visual Machine-themed loading redesign.**

## 2. Technical baseline observed in the repository

- `src/ui/menus/bootstrap.tsx` renders the existing loading overlay, textual `GTD.` and `GRAND THEFT DIVISION`, 60-second budget display, diagnostics actions and `LiveLoadingInspector`. `src/ui/menus/live-loading-inspector.tsx` provides observed operation counts, search, groups and failure states. `src/ui/menus/real-loading.css` is the accepted presentation. Do not change the CSS or its DOM hierarchy for POI-02.
- `src/routes/index.tsx`, `src/lib/page-head.ts` and `public/manifest.webmanifest` contain visible GTD identity/metadata. The PWA manifest contains GTD-named icon file paths; filename migration is **not** equivalent to user-facing rebranding and must not break installed PWAs.
- `src/game/audio/vehicle/procedural-vehicle-audio-021.ts` already implements browser-generated engine harmonics/rolling noise, a per-vehicle voice allocator, separate player/traffic buses, a master/effects gain path, pause/visibility/mute behaviour and gesture-gated `AudioContext`. `src/game/audio/vehicle/vehicle-audio-model-021.ts` derives acoustic telemetry. The earlier `GTD-AUDIO-021` plan is background, not a new authorization.
- `src/game/character/reese-player-001.ts` owns Reese's playable character; `src/game/experiments/north-heights-city-8.ts` orchestrates runtime character, camera, audio, traffic, pedestrian integration and exposes the existing `walk | fly` mode. Flight capability must be separated rather than indiscriminately deleted.
- `src/ui/hud/touch-controls.tsx` declares `fly`, `descend`, `sprint`, `jump` and vehicle actions, filters their visibility and applies uniform action styling. `src/ui/hud/game-hud.tsx` provides the game HUD, metadata/info/pause controls and flight status. `src/ui/game-session.tsx` bridges React controls to the game runtime.
- `src/ui/hud/north-heights-map-010.tsx` renders an expanded 2D map with pointer pan/pinch/zoom and a special Finch HQ interaction. It **does not currently provide arbitrary map-point camera travel**. The 2D map coordinate transform must therefore be extended deliberately.
- `src/game/experiments/north-heights-finch-lobby-004.ts` imports the receptionist from the professional NPC GLB pool, looks for a seated animation group, loops it if available, otherwise applies a fallback seated pose. That baseline is not a continuous varied activity controller.
- `src/game/experiments/north-heights-pedestrian-simulator-001.ts` and `north-heights-pedestrian-avoidance-020.ts` contain the accepted local obstacle-bypass system. `src/game/traffic/nh012-traffic-simulator.ts` provides vehicle identities/state; collisions are developed separately in `src/game/vehicles/nh-solid-vehicle-collision-017.ts`.
- `src/game/experiments/north-heights-reconstruction-001.ts` builds the procedural city: `road` and `pavement` materials use `createSurfaceTexture` from `src/game/world-generation/surface-textures.ts`; facade and entry-opening code use actual geometry and metal/mullion materials. Distinguish these North Heights facades from older `src/game/world-generation/skyline-glass-geometry.ts` South Ward-specific towers; avoid fixing the wrong generator.
- `AGENTS.md` requires all engine changes to remain under `src/game`, game commands through runtime bridge, and intentional deployment milestones only. Main is canonical. No package, root architecture or source file was modified for this proposal.

## 3. Global constraints and engineering principles

1. **Scope discipline:** Implement exactly POI-01 through POI-10. Do not add new missions, interiors, traffic populations, skins, voice acting or Machine surveillance mechanics beyond the requested roaming camera.
2. **Compatibility:** Retain PWA/offline behaviour, app-shell versioning, existing `/world` and preview routes, device-local settings keys, game-save schemas, mission progress, existing 3-column action layout, map markers and vehicle control semantics unless a reviewed migration is required.
3. **Ownership:** Runtime owns positions, collision decisions, flight/camera controls and audio events; React displays low-frequency snapshots and sends discrete commands. A camera target must never masquerade as a game-player movement command.
4. **Performance:** Preserve traffic/pedestrian visibility gating and budgeted Web Audio voices; pool or instance facade assets, avoid repeated texture creation, per-frame React state and 125 simultaneous horns/engines.
5. **Determinism:** Keep simulation behavior stable. Sound and visual gestures may be cosmetic, but must not mutate traffic paths or mission state unless specified by POI-07 pedestrian avoidance response.
6. **No assumed IP permission:** P.O.I and Person of Interest are the owner's chosen development-facing name. Before any external commercial/public release, complete an independent title/trademark/third-party-character and likeness rights review; do not imply official association or license.

## 4. Detailed work packages

### WP-01 — P.O.I identity and metadata (POI-01)

**Goal:** Present the game to users as `P.O.I` / `Person of Interest`, replacing visible `G.T.D` and `Grand Theft Division` branding. Keep the game mechanics, geographic names and assets intact.

**Implementation steps after approval:**
1. Inventory user-visible strings in `src/routes/index.tsx`, `src/ui/menus/shell.tsx`, `src/routes/*.tsx`, `src/lib/page-head.ts`, `src/ui/menus/bootstrap.tsx`, settings/help/paused overlays, the about/build page and `public/manifest.webmanifest`. Separate brand copy from technical event IDs, historic documentation, diagnostics fields, data keys and paths.
2. Replace display title, short display brand, home intro copy and page/OG metadata where they explicitly name G.T.D; ensure any old Voight-centered copy is reconciled with the current Reese-centered game rather than blindly changing unrelated narrative content.
3. Maintain `start_url`, `scope`, service worker scope, asset path validity, package identity, `gtd-` CSS class names, internal identifiers, current settings and save keys unless there is independent reason for a migration.
4. Review GTD-baked graphics/icons separately. If graphics need textual replacement to meet visible rebrand acceptance, create an explicit asset substitution list and visual review; do not overwrite accepted art or break icon references during a text-only task.
5. Test installed PWA update and browser title/launcher state on both desktop and Android.

**Acceptance:** No visible old title in user-facing launcher/loading/metadata surfaces; all navigation works; persisted preferences and existing installs still open.

### WP-02 — Machine-themed **words only** within the *identical* loader (POI-02)

**Immutable visual/functional baseline:** `bootstrap.tsx`, `live-loading-inspector.tsx` and `real-loading.css` define the accepted loading screen. Preserve exactly its positioning, spacing, typography, colour palette, borders, opacity, animations, iconography, progress UI, timers, budget calculation, real operation ledger, filtering, error states, buttons, retry options, report downloads, accessibility semantics and persistence logic. No synthetic progress, fabricated completion, new transitions, graphic overlays, background animations or layout refactors.

**Copy-only substitution proposal (exact wording can be reviewed at acceptance):**

| Existing text/context | Proposed Machine-oriented visible copy |
| --- | --- |
| `GTD.` brand mark | `P.O.I.` in the same existing text element |
| `GRAND THEFT DIVISION` | `PERSON OF INTEREST` in the same existing heading |
| `GAME LOADING TIME` | `MACHINE LOADING TIME` |
| Loading/status heading or accessibility description | `THE MACHINE IS LOADING` / `Initializing The Machine`, fitted within the existing text slot |
| `Startup operations` | `Machine initialization` |
| `World generation` | `City reconstruction` |
| `Imported assets and decoding` | `Loading visual intelligence` |
| Other real operation labels | Contextual Machine terminology only when it accurately describes the underlying stage; raw telemetry data/IDs unchanged |

**Truthful telemetry constraint:** Keep the real distinction between loading, loaded and failed; do not mark unavailable systems online. Preserve functional text (such as Retry/Continue/Download) where changing it would make operation unclear. Retain the same 60-second loading budget and displayed timer behavior. Long text must be checked for overflow **without CSS/layout changes**; shorten copy instead.

**Tests:** Side-by-side screenshots at identical viewport sizes should be visually identical except glyphs/text lengths. DOM/CSS structure unchanged; diagnostics row count and failure/retry outcomes unchanged; no performance or load-resume regression.

### WP-03 — Engine audio loudness and natural rise/fall loop (POI-03)

**Goal:** A perceptible but controlled louder vehicle sound whose perceived intensity/pitch continuously cycles **low → moderate → high → moderate → low → repeat** during ongoing driving. No abrupt step transitions or single unvarying buzz.

**Architecture:** Extend the existing `AcousticState021` / `ProceduralVehicleAudio021` implementation; do not create a parallel always-on car sound system. Preserve user master/effects sliders, mute, independent radio/music source, gesture unlock, spatial attenuation, voice virtualization, pause/visibility and cleanup.

**Proposed synthesis model:** Maintain two cooperating envelopes: (a) causal base engine RPM/load from actual vehicle speed, throttle, braking and virtual gears, and (b) a slow bounded drive-cycle envelope with smoothed low/moderate/high/moderate/low phases. During sustained motion, the cycle varies harmonic distribution, filter cutoff, gain and mild RPM accent without overriding actual throttle. Accelerating must sound like acceleration; coasting and braking must fall; idle stays low and stable; reversing works. Use phase continuity with `AudioParam` ramps and bounded temporal modulation; prevent restart/click at each loop boundary.

**Loudness:** Calibrate player-vehicle gain upward relative to the current quiet baseline without clipping, distortion or drowning dialogue/music. Compare recorded output levels and listening tests on desktop speakers and Android; reserve headroom through existing compressor/master buses. No fixed gain multiplier is approved prior to listening.

**Validation:** Audio captures demonstrate rising/falling repeated phrases over a 20–30 s drive; a listener distinguishes idle, moving, accelerating, decelerating and braking; no sudden loudness discontinuities on loop or gear boundaries; radio and mute still work. Frame-rate drops do not change modulation timing.

### WP-04 — Reese walking and running footstep sound (POI-04)

**Goal:** Audible ground-contact steps distinct in rate for walking versus running; silence when stationary, airborne, seated/driving or camera-only roaming.

**Architecture:** Add a small managed footsteps voice/controller in `src/game/audio/` and connect it to the authoritative Reese locomotion state, ground contact and step timing from `src/game/character/reese-player-001.ts` and the North Heights runtime. Prefer available animation contact markers; if unavailable, use a gait-distance accumulator calibrated independently for walking and running, with left/right alternating contacts. Do **not** tie steps to render-frame count or a free-running sound timer.

**Sound production:** Reuse Web Audio's existing unlock/settings lifecycle or a shared effects bus. Procedural transient steps are a reasonable initial method, with natural slight variation in timbre and level; avoid new external file downloads until separately approved. Surfaces can support modest future tonal differences, but surface-category audio expansion is not a prerequisite here.

**Validation:** Walk/run recordings show distinct contact spacing and correct stop/start timing; slow walking does not produce sprint-rate steps; zero footsteps while Reese is standing still, jumping, in a car or while Machine POV flies. No duplicate triggers after pause/resume or scene re-entry.

### WP-05 — Receptionist continuous lifelike activity (POI-05)

**Goal:** The woman at Finch HQ reception has ongoing believable micro-movement and periodically talks/gestures/waves, without appearing to be a repeating mechanical loop.

**Architecture:** Enhance the current receptionist controller in `north-heights-finch-lobby-004.ts` without swapping the already positioned NPC, desk, lift or floor geometry. Inspect actual animation groups available in `PED002_NPC_FILES[24]` before choosing clips. Preserve accepted seated alignment, scale, chair fit, foot placement and desk clearance. Use the existing seated idle as a baseline where available; use short upper-body/head/hand gestures as bounded overlays or blended transitions. If clip library lacks usable gestures, implement limited procedural joint-space gesture animation and verify rig compatibility; do not apply rotations to unknown bones blindly.

**Behaviour:** Low-amplitude idle movement remains present; short speech-like hands/head movement and occasional wave occur after varied natural dwell times. During direct interaction, weight appropriate gestures more heavily. Do not produce constant full-arm waving, keyboard-like repeated patterns, clipping through furniture or gratuitous standing up. Pause and dispose the active groups/nodes properly.

**Validation:** Observe her continuously for at least 60 s from multiple angles. No frozen pose across long intervals, no visible cuts between actions, no body sinking, floating, desk penetration or unexpectedly looping wave. Existing Finch elevator/reception interactions unaffected.

### WP-06 — Finer, denser road/sidewalk texture (POI-06)

**Goal:** Fix **spatial frequency** of visible road and sidewalk imperfections. The observed “roughness” means small-scale aggregate/noise distribution, not merely altering the material's numeric PBR `roughness`/specular value.

**Architecture:** Inspect `north-heights-reconstruction-001.ts` material creation and `world-generation/surface-textures.ts` noise/UV scaling, as well as road/sidewalk geometry UV mapping. Adjust world-space repeat frequency or procedural noise frequency so the same 1–2 m patch shows noticeably more small pores/aggregate rather than a few enlarged blobs. Keep asphalt darker than sidewalks and preserve accepted curb concrete colour, road paint alignment, slope-following markings, geometric boundaries and foot/vehicle collisions.

**Technique:** Parameterize independently tuned `asphalt` and `sidewalk-paving` frequencies, with balanced low-frequency colour variation and high-frequency detail; use deterministic seeds and consistent metres-per-tile over joined meshes. If adding high frequencies, inspect texture filtering and mipmaps to prevent moiré, shimmering or excessive contrast at mobile camera distances. Reuse material/texture instances.

**Validation:** Matched near/mid/far screenshots before/after: many fine imperfections visible per unit area, no conspicuous repetition, no noisy shimmer during movement and no grass/texture spilling onto road surfaces.

### WP-07 — Pedestrian-aware automatic horn and response (POI-07)

**Goal:** A traffic or player-driven vehicle sounds an audible hooter when Reese or an NPC genuinely obstructs its forward motion, encouraging a safe pedestrian detour.

**Perception:** Detect pedestrian obstruction in a forward swept corridor using vehicle heading, speed, size, stopping distance and pedestrian position/radius. Include Reese and NPCs, but do not hoot at people safely on adjacent sidewalks or behind cars. Gate on impending blockage/prolonged stop, not each visual frame; collisions and collision avoidance remain independently authoritative.

**Sound:** Synthesize a recognizable bounded horn transient/held pulse through a spatial effects voice, reuse the existing user-gesture-unlocked AudioContext and settings. Introduce per-vehicle cooldown, burst-duration limits, distance attenuation and global simultaneous-horn budget to prevent a 125-car chorus. Respect paused/hidden/muted states. Engine audio and vehicle control remain active.

**Response:** Integrate an `onHorn(vehicleId, pedestrianId, obstructionPose)`-like event with existing `north-heights-pedestrian-avoidance-020.ts`. NPCs should plan a short safe lateral departure then rejoin their intended sidewalk/crossing route **only once the path is actually clear**. Do not force NPCs into adjacent lanes, cars, building geometry or teleport them; if no safe route exists, they wait while the car decelerates/stops. Reese is player-controlled; a horn alerts the player but must not forcibly move him.

**Validation:** NPC stopped in lane → car brakes/hoots → NPC safely moves aside if possible → car resumes. Reese in lane → horn but no auto-moving Reese. No horn for non-obstruction, no rapid repeat, no horn when an agent is behind the car and no endless traffic deadlock. Works during manual driving and autonomous traffic without spikes.

### WP-08 — Larger bottom-right controls and removal of Reese flight (POI-08)

**Goal:** Enlarge gameplay action hit areas without breaking the established equal-size three-column grid, device safe areas, driving control overlays or layout order. Remove the airplane icon and user-accessible Reese `fly` action entirely.

**Implementation:** Adjust responsive touch-action sizing/gaps in the existing `src/ui/hud/touch-controls.tsx` and relevant shared stylesheet. Start from a touch-hit-target floor of ~48–56 CSS px, then verify phone landscape viewport and desktop pointer usability; actual size is subject to visual/device acceptance. Ensure controls neither overlap gameplay content nor become clipped at narrow widths. Retain all existing working actions aside from character flight. Remove visible `fly` and `descend` from character action palette, keyboard affordances and HUD copy where they imply that Reese can physically fly. `sprint`, jump, enter/exit, interaction and driving remain functional.

**Preservation:** Do not delete reusable flight math, speed modes or camera movement handling. Refactor flight movement into a camera-only navigation controller as defined in WP-09; runtime must reject remaining character-flight pathways if triggered through stale keys, debug or commands.

**Validation:** Reese never becomes airborne via former flight control; previously working walk/jump/drive controls still work; larger targets are reliably clickable in desktop and touch tests; no layout collision with arrows, HUD, minimap or pinch gestures.

### WP-09 — Detached Machine first-person camera and map-directed travel (POI-09)

**Goal:** The Machine can roam the city in first-person aerial view independently of the ground-bound Reese. **Reese remains at his exact actor position when entering camera mode**; exiting returns to his position and ordinary third-person view.

**UI contract:** Add a camera-shaped control immediately **to the left of the existing hand** button in the top-right Hand / Info / Pause cluster. Match existing control shape/size/style and tooltip semantics. Press once = enter Machine POV; press again = leave Machine POV. Camera mode uses no Reese mesh, avatar flight animation or trailing third-person avatar image. It is navigation of a camera, not character movement.

**Runtime state model (proposed):**
- `PLAYER_GROUNDED` or legitimate vehicle-driving state: Reese's authoritative transform/ground collision and missions continue normally.
- `MACHINE_POV`: snapshot/reference Reese's true position and third-person camera parameters; suppress any Reese locomotion input and prevent camera commands from updating the Reese transform or creating character flight/hover state. A separate `MachineCameraPose { x,y,z,yaw,pitch }` moves using adapted legacy flight input and camera orientation. Keep Reese rendered standing at the anchored position in world space for external scene continuity, but not visible from the Machine POV unless the roaming camera deliberately looks at his location; the **camera does not render Reese as its attached avatar**.
- On exit, restore standard follow camera around Reese's authoritative world position, with stable orientation and collision constraints. No player warp, no velocity spike, no jump/fall trigger, no mission skip and no save-state contamination.

**First-person travel:** Adapt reusable directional flight/controller math without calling the character's `setMode("fly")` path. Preserve camera movement speed/vertical control and collision/bounds safety; clamp within modeled city extents and use sensible minimum ground clearance. Avoid entering opaque walls or breaking elevator camera constraints. Both touch and keyboard must navigate; drag look is preserved. Machine POV is an independent session mode, not an alternate Reese animation.

**Map navigation:** Extend `NorthHeightsExpandedMap` with a camera-target callback **only when Machine POV is active**. Distinguish short tap/click from the existing pan and pinch gestures using a movement threshold and pointer identity. Invert the map's existing `viewBox`, zoom, pan and world→map transforms to derive correct `x,z`; reject outside-world selections. Map-point travel sets only `MachineCameraPose` (`x,z` target, safe `y` determined from local terrain plus altitude offset), NEVER player position. Preserve the existing Finch HQ marker auto-drive semantics in normal mode. In Machine POV, explicit destination selection should not accidentally start vehicle navigation or a mission. Keep the player marker tied to Reese, not the camera.

**Event ownership:** Mission proximity, pedestrian collision, vehicle availability, Finch chat radius, physical pickups, checkpoint/save and map `YOU ARE HERE` remain anchored to **Reese**. Render viewpoint and audio listener follow the detached camera. NPC and traffic simulations do not pause solely because Machine POV is active. Pause/menu, route change, scene disposal and browser resume must safely release or restore the detached camera. On-foot activation is the recommended initial gate: do not silently eject Reese from a moving vehicle; specify any vehicle-mode extension only after review.

**Validation scenarios:**
1. Record Reese's transform → enter Machine POV → travel across multiple districts/bounds → return → Reese's position is numerically unchanged within floating-point tolerance and normal third-person mode resumes.
2. Enter Machine POV → open expanded map → tap a valid point → camera reaches the selected world coordinate while Reese and mission progress remain unchanged; tap distinct points consecutively; return correctly.
3. Map panning/zooming/pinching must not inadvertently move the camera. Existing Finch HQ routing while **not** in camera mode remains correct.
4. No missing/stuck Reese, uncontrolled first-person flight through walls, double cameras, broken input ownership, unbounded altitude, sound-listener lag or persistent flight state after a refresh.
5. Existing map, lift and interior camera behaviours remain unaffected.

### WP-10 — Correct metal-frame and entrance glass connections (POI-10)

**Goal:** Physically credible continuous architectural joints at North Heights glass building facades and ground-floor doorways. No isolated floating panes, especially the observed group of roughly four panels around entrances.

**Investigation:** Instrument and inspect the `createFacade`/portal/podium paths within `north-heights-reconstruction-001.ts`, particularly entrance-face handling, door opening dimensions, floor-zero pane generation, frame placement, `city.box` transforms and the extra podium glass blocks near the entrance. Identify whether the detached appearance results from independent offsets, unmatched depth, incorrect facade local coordinates or absence of connecting mullions/transoms. Validate separate glass/office family variants and Finch HQ, which has special geometry.

**Correction:** Derive facade panels and rails from one facade-local coordinate system. Align edges to the primary wall planes with explicit corner conditions; add continuous vertical jambs, a header/transom, base connections and metal supports joining ground-level panes to their upper wall/sidewall structure. Adjust or eliminate decorative panes that remain unsupported. At entrance portals, preserve the *real* passage width and height, the working door opening and transparent-glass aesthetic; frame must not obstruct Reese, NPCs, elevators or the new fully enterable interior work. Respect the current collider geometry and do not insert full-wall blockers across doors.

**Validation:** Front, rear and corner inspections of representative glass/office towers, first-floor entrances, Finch HQ and multiple seeded buildings at day/night. No hovering panes, visible frame gaps or glass protrusions; no blocked doors, clipped people or unexpected draw-call explosion.

## 5. Integration order and stage gates

The following order reduces coupling and lets owner acceptance isolate failures. Exact task branch naming will be determined only on implementation authorization; keep code changes off `main` until accepted.

| Stage | Content | Dependencies | Owner-facing evidence |
| --- | --- | --- | --- |
| S0 | Baseline audit, instrument current performance, screenshots and audio clips | None | Version/commit fingerprint and baseline |
| S1 | POI-01 identity + POI-02 loader **copy only** | S0 | Home, loading, title/metadata and PWA screenshots; loading visual diff |
| S2 | POI-03 audio dynamics/loudness + POI-04 footsteps | S0 | Recorded idle/cruise/run/walk tests, sound settings checks |
| S3 | POI-05 receptionist animation | S0 | Seated reception 60 s capture |
| S4 | POI-06 fine road/sidewalk texture + POI-10 facade geometry | S0 | Identical-camera comparative before/after captures |
| S5 | POI-07 horn and safe NPC obstruction response | S2, existing pedestrian avoidance | Lane block/clear scenario and sound capture |
| S6 | POI-08 larger controls + POI-09 Machine POV and map selection | S0; reuse existing flight machinery | Mobile control comparison, flight/map/return demonstration |
| S7 | Cross-system QA and regression gate; owner preview review | S1–S6 | Test report, preview link only if authorized; no automatic deploy |

**Release discipline:** Do not substitute “merged” for “accepted.” Document each stage's failures and corrective actions. No production deployment without explicit owner approval. If a build link is generated, return the link and let the owner report any build failure; do not continue monitoring logs after providing a generated deployment link unless asked.

## 6. QA and test matrix

**Automated, where feasible**
- Pure audio-model tests: drive-cycle continuity, envelope bounds, paused/unpaused/mute levels, footstep contact cadence at walk vs sprint, no duplicate steps, horn trigger/cooldown and aggregate voice budget.
- Pure map conversion tests: world coordinate ⇄ 2D point round trip, zoom/pan inversion, out-of-bounds reject, tap-versus-drag/pinch differentiation.
- Pure camera state tests: `MACHINE_POV` cannot mutate Reese transform, exit returns to player, mode cleans up on pause/dispose, driving gate, mission location remains player-based.
- Pure pedestrian tests: horn stimulus triggers valid alternative, no unsafe forced diversion, agent rejoins route only when clear and no deadlock/retrigger loops.
- UI tests: fly action absent for Reese; camera placed immediately before hand; 3-column action set preserved; textual loading string changes without changes to DOM/CSS structure or the actual ledger.
- Geometry tests: facade rail endpoints intersect expected structural surfaces, glass sits within facade planes, door portal clearance preserved and no new entry obstruction.

**Manual desktop + Android landscape PWA**
- Home/title/launcher/install display; all routes and existing settings/save data.
- Loading screen visual compare at fixed viewports with measured loading timer, real success/fail and resume flows.
- Driving with traffic, engine cycle against speed, horns and audio balance; stop, reverse and manual vehicle entry.
- Reese walking vs running footsteps on roads/curbs, jump, collisions and background/foreground.
- Receptionist observation and Finch interactions, full elevators/enterable door checks.
- Textures at day/night, varied camera distances, smooth motion and wet/lighting variants if already supported.
- Enlarged touch controls on narrow landscape; walking, driving and Machine camera routes; map tap/zoom and long-distance camera return.
- Frame-time, draw calls, JS heap and audio voices relative to S0; zero sustained unbounded growth.

**Pass/fail priority:** Fail and correct any loss of established playability, mission state, accepted control layout, real loading diagnostics, map usage, FPS stability, or transparent building access. Subjective audio and textural fidelity require direct owner preview acceptance, not a self-declared automated pass.

## 7. Risks, tradeoffs and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| A loader visual redesign slips in under “Machine theme” | Violates explicit owner correction | Restrict loader files to textual substitutions; unchanged CSS/DOM; screenshot diff |
| Renaming internal `gtd-` CSS and storage keys globally | Cache/settings/PWA breakage | Rebrand user-visible copy, retain compatibility keys and asset paths |
| Extra engine gain produces clipping or overwhelms radio | Audio fatigue/unusable controls | Listening calibration, compressor/headroom tests, sliders respected |
| Engine modulation divorced from speed | Artificial “wah-wah” loop | Base state derived from real speed/load; cycle adds bounded texture |
| Footsteps not synced with character motion | Sliding/double steps | Animation contacts or distance accumulator, hard gates on grounded movement |
| Receptionist animations affect rest pose/seating | Clipping/sinking through desk | Retarget inspection, upper-body blend and multi-angle seating checks |
| Finer textures shimmer on mobile | Visual regression and GPU cost | Proper world-space tiling, mipmaps, bounded contrast and texture pooling |
| Horns fire every update across 125 cars | Audio cacophony and CPU hit | Obstruction-based event + debounce + cooldown + spatial/budget gate |
| Camera navigation accidentally moves Reese or advances mission | Critical gameplay corruption | Separate camera pose/controller, invariant assertions and mission tests |
| Map taps are confused with drags or Finch marker | Accidental travel/autodrive | Explicit camera-mode handler, pointer threshold, inverse transform tests |
| Glass structural joints block portals | Breaks entering buildings/elevators | Shared portal dimensions and collider penetration testing |

## 8. Definition of done and explicit approval boundary

Each requirement POI-01 through POI-10 must demonstrate the corresponding owner's observable outcome in Section 1. Overall completion requires: (a) all ten accepted in a preview, (b) no regressions in missions, NPC avoidance, car steering/collisions, elevators, world visual standard, loading diagnostics, controls, save/offline, (c) performance and audio lifecycle checks, and (d) explicit authorization for merge/deployment.

**Current decision:** **PLAN WRITTEN; IMPLEMENTATION AWAITING APPROVAL.** No source code changes, sound generation, geometry updates, branding changes, branches, merges or deployments are authorized by this document.

**Approval request:** Approve `GTD-POI-008` as a comprehensive technical implementation plan, or provide corrections. Execution begins only after a separate explicit owner instruction.
