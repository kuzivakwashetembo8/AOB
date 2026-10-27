# GTD-NH-OPT-011 — North Heights Optimization: Comprehensive Technical Implementation Plan

**Date:** 2026-10-27  
**Status:** DOCUMENTATION ONLY — AWAITING OWNER SCAN AND EXPLICIT APPROVAL  
**Repository:** `interlinkglobal/GTD`  
**Inspected canonical baseline:** `main` at `f03b2ba9355cb907cc3865623f699935be71770f` (2026-10-26, OPT-010 merged).  
**Proposed implementation branch AFTER approval:** `feature/gtd-north-heights-optimization-011-20261027` (create from a freshly reverified main head, not blindly from the historical SHA above).  
**Asset dependency:** User-selected GLB street lamp is **NOT YET PROVIDED** at plan authoring. Its integration is gated; no substitute asset is authorized.  
**Scope:** North Heights behavior, systems and scenery; shared engine modules only where unavoidable and with South Ward regression protection.  
**Authority:** Ten requirements and one-at-a-time clarifications issued by the owner on 2026-10-27. This document records the implementation proposal, not authorization to execute it.

> **Hard gate:** Do not modify gameplay code, import assets, create implementation branches, deploy previews, merge, or release under this plan until the owner explicitly approves it following scanning/review. Writing and committing this Markdown plan is the sole authorized repository modification. After approval, previews and merges/deployments remain independently permission-gated. For failed implementation attempts, record evidence and apply the established DDD policy.

## 0. Executive technical decision

Deliver a **coherent North Heights optimization**, not ten unrelated patches: (a) convert the 125 existing deterministic Sedan traffic agents into eligible proximity-drive targets without duplicating traffic or losing collision authority; (b) normalize Voight's flight heading, native lean and UAL-derived running gait; (c) introduce durable, local, versioned runtime saves, distinct from existing in-memory pause; (d) improve concrete, parcel land use, user-provided lampposts, tree composition, weather and spatialized audio without exceeding browser/mobile frame and load budgets.

The principal risk is **three disconnected state owners**: the route component manages North Heights clock/pause, the North Heights scene closure manages actor/vehicles/traffic, and visual thin instances draw Sedans without interactive vehicle actors. Implement durable state and vehicle ownership transitions **before** layering sound/weather/UI onto these subsystems. Every user-facing change must pass real Android-landscape and desktop observation; tests alone are insufficient.

## 1. Locked owner requirements / decision register

| ID | User note | Clarified acceptance contract |
|---|---|---|
| NH-OPT-01 | Voight drives general Sedan | **Every vehicle in GTD**, parked or moving, is eligible for driving based **only on proximity**. In North Heights that includes all 125 moving accepted Sedans plus parked six and any subsequently admitted playable vehicle. No parked-only, stationary-only, model or line-of-sight/obstacle gate on **entry eligibility**. Boarding a moving vehicle does not require it to stop. |
| NH-OPT-02 | Flight behavior | At ordinary flight speeds retain **existing heading**; add subtle forward/backward/sideways lean in travel direction matching UAL's apparent directional hover. Reverse flight does not rotate Voight. Only deliberate player turning or applicable accepted sprint alignment changes facing. Preserve accepted hover anatomy, ascent/descent head cues, full-speed horizontal flight and third-person camera. |
| NH-OPT-03 | Leave, pause, resume | Device-local **durable save**, surviving refresh, tab/browser closure and device restart; restore position, motion mode, current vehicle and relevant world simulation on the same device. No cross-device/cloud sync. Auto-pause on leaving; returning to a live session requires explicit Resume. |
| NH-OPT-04 | Curbs | Replace North Heights curb finish with **consistent realistic concrete texture** on all curb faces/corners, no unnatural black faces; preserve geometry and physics. This supersedes the flat/unlit single-grey material choice from OPT-010 for North Heights only. |
| NH-OPT-05 | Building yards | Replace exposed **outdoor** plain white building surrounds contextually: residential grass/gardens, commercial/civic concrete/pedestrian access, realistic parking where space and road access permit. Avoid arbitrary percentage allocations. Preserve intentionally white **interior** floor/ceiling slabs and enterable buildings. |
| NH-OPT-06 | Street lamps | Use the **exact owner-supplied realistic GLB(s)**, optimized for web and placed appropriately. Preserve functional nighttime illumination. Asset intake not started until user supplies models. |
| NH-OPT-07 | Vehicle sound | Realistic speed/RPM-correlated engine dynamics, accelerate/decelerate, braking, tires, horn/hoot; nearby traffic contributes distance-attenuated audio. Mobile/browser user-gesture and sound-budget restrictions apply. |
| NH-OPT-08 | Weather | Automatic weather transitions + **manual weather selection in shared Settings**. Misty white daytime clouds, daytime rain and nighttime storms including lightning with synchronized, distance-plausible thunder. Efficient rendering. |
| NH-OPT-09 | Urban forestry | **Dense but curated/context-aware** futuristic green city: tree-lined streets, courtyards, buildings, suitable spaces below elevated volumes, rooftop/terrace planting and planned pedestrian greens. **“A curated forest in a city, not a city in a forest.”** Reference images supplied by owner. Preserve visibility, clearances and performance. |
| NH-OPT-10 | Running | `ual.glb` **Sprint_Loop** is the authoritative reference for Voight's leg mechanics, stride, stance/swing and perceived speed. Retarget/analyze, do not replace with an invented procedural gait; preserve previously accepted arm anatomy and movement transitions. |

**Decision precedence:** For conflicts, the above 2026-10-27 owner requirements supersede prior decisions **only for the explicitly changed behavior**. In particular, NH-OPT-01's proximity-only entry conflicts with OPT-010's proximity-**and-accessible-path** test; remove the obstacle/path gate specifically from North Heights **boarding eligibility**, without compromising building collision while driving or safe exit placement. NH-OPT-04's textured concrete supersedes OPT-010's uniformly flat curb look in North Heights. Existing 125 identical Sedan *visuals* remain locked; do not regress to historical Taxi/Kangoo/Hatchback/BMW traffic appearance. The six separately parked playable models remain present.

## 2. Repository findings — inspected, with implementation consequences

### 2.1 Source architecture and accepted historical records

- `AGENTS.md`: engine confined to `src/game`; React communicates with `GameRuntime`/`RuntimeBridge` rather than running simulation ticks; shared presentation in `src/ui`; runtime saves are not interface preferences. A routine GitHub commit must not trigger intentional production deployment.
- `src/routes/north-heights-preview.tsx` owns an **independent, disposable** North Heights controller. Its effect creates `createNorthHeightsCity8`, cleanup destroys the scene, and local React state owns pause, clock, settings and vehicle display. Its pause screen explicitly says “Save runtime not connected in North Heights trial.”
- `src/game/bridge/persistent-game-session.tsx`, `use-session-pause.ts`, and `src/ui/game-session.tsx` retain the **/game** canvas/runtime across in-app navigation and pause on visibility, blur, pagehide and freeze. They do **not** durably save an evicted WebGL runtime. `GTD-LOAD-PERSIST-001` documents this limitation explicitly. The new North Heights save must not misuse local interface preferences as saved game state.
- `src/game/experiments/north-heights-city-8.ts` owns Rapier walk/fly, six parked `FirstDriveTrial` cars, camera, 125-agent traffic, and rendering in one closure. Walk currently uses **3.4 m/s** and “fast” **7.5 m/s**; flight uses **9 / 25 m/s**. Flight sets `headingYaw = atan2(desired.x, desired.z)` whenever horizontal motion exists; this visibly rotates Voight on reverse/strafe. Pausing clears held input and traffic accumulator but lifecycle save is absent.
- `src/game/traffic/nh012-traffic-simulator.ts` models 125 deterministic traffic agents with 20 Hz steps, seeded route assignment, junction reservations, lane following and agent IDs. Its snapshot exposes mutable agent objects and tick; a complete deterministic durable serializer must also capture hidden RNG/reservation state and any traffic-to-player ownership state.
- `src/game/experiments/north-heights-sedan-traffic-009.ts` draws 125 accepted, **source-derived Four Door Sedan** variants using thin-instance batches and camera-sensitive LOD; **there are no individual drivable Rapier actors** for those moving visuals. `GTD-GEN-VEH-009`, `GTD-OPT-010` and `src/test/gen-veh009-sedan-only-traffic.test.ts` lock the single-Sedan policy.
- `src/game/vehicles/local-boarding.ts` has an existing 3.5 m boarding radius and helpers enforcing planar sight/access tests. `src/game/experiments/north-heights-city-8.ts` currently searches only the six parked car map and reports “Approach a parked vehicle.” It hides both Voight representations during driving. `FirstDriveTrial` owns a Rapier kinematic vehicle and wheel rig, collision-aware driving, and safe live-position disembarkation. **Do not revive the failed interior-seat code**: `GTD-VEH-BASIC-001` and VEH-INTERIOR DDD retain the accepted hidden-driver fallback.
- `src/game/character/voight-humanoid-trial.ts` plays UAL `flyHoverForward/Back/Left/Right/Up/Down` where clips exist. `src/game/character/native-flight-129.ts` explicitly **does not retarget UAL quaternions** to `character.glb`; it applies anatomically calibrated hover and accepted **90° accelerated-flight** body pitch through a visual pivot. Ordinary native forward/side/back lean is absent. The failures in `GTD-CHAR-128` and the accepted negative-schema `GTD-CHAR-129` prohibit direct UAL bone-rotation copying.
- `src/game/world/mercer-static-character-103.ts` loads authored UAL-derived walk/sprint/jump data for Voight. `src/game/character/retargeted-sprint-120.ts` declares `HUMAN_SPRINT_SPEED_120 = 3.25 m/s`; the **North Heights 7.5 m/s fast speed** is materially different. Read `GTD-CHAR-120`, `GTD-CHAR-125` and gait acceptance tests before changing the running clip. Avoid a “faster animation fixes unnatural stride” false solution.
- `src/game/experiments/north-heights-reconstruction-001.ts` generates streets/blocks/buildings and game-generated box-shaped lampposts via `addStreetFurniture`; it sets an unlit curb material. `north-heights-roads-003.ts` creates curb faces and sidewalk corner pads. `north-heights-block-surfaces-008.ts` currently paints **occupied 48 m block tops as concrete** with little land-use differentiation. The white interior floor and ceiling surfaces in building generation are intentional, **not** outdoor lots to repaint.
- `src/game/experiments/north-heights-trees-004.ts` already loads owner-provided `/GLBs/Infrastructure/tree_low_poly_lowpoly.glb` **once** and instantiates its meshes. `north-heights-spatial-plan-010.ts` reserves parking lots. Rooftop tree placement and under-elevated-building capacity are not yet modeled. Respect the asset's attribution in existing records and avoid returning to the lag-inducing `leaves.glb` canopy.
- `src/game/experiments/north-heights-sky-002.ts` currently supports only `day/dusk/night` lighting/fog/stars. `src/routes/north-heights-preview.tsx` computes time separately from scene and increments a React timer. There is no rainfall/weather finite-state machine or lightning/thunder event source in this district.
- `src/ui/menus/settings-state.ts` and `settings-editor.tsx` provide the shared settings contract and storage. Existing `master/music/effects/muted` preferences should drive audio. The `src/game/audio` and `src/game/save` directories currently provide no integrated North Heights engine implementation.

### 2.2 Source-of-truth records that must be consulted in implementation

`documentations/Development/GTD-GEN-VEH-009-Sedan-Only-Traffic-2026-10-26.md`; `GTD-NH-012`; `GTD-OPT-010-Main-Branch-Optimization-Technical-Implementation-Plan-2026-10-26.md`; `GTD-LOAD-PERSIST-001`; `GTD-VEH-BASIC-001`; `GTD-CHAR-129`; `GTD-CHAR-120`; `GTD-CHAR-125`; `GTD-NH-008`; `GTD-NH-REBUILD-003`; `GTD-TREE-PLACE-001`; `GTD-OFFLINE-000`. All live paths are in `documentations/Development` unless the record lives at the documentations root. Failed branches are historical **negative evidence**, not import sources.

## 3. Proposed domain boundaries / module plan

After approval, branch from refreshed main and keep features separately revertible. Treat North Heights as a **serializable scene domain** with one authoritative simulation clock. Do not push simulation ticks into React.

| Domain | Intended owner | Proposed addition/change |
|---|---|---|
| North Heights controller | `src/game/experiments/north-heights-city-8.ts` | Narrow coordinator; exposes typed save/restore and weather commands, delegates independent subsystems |
| Traffic | `src/game/traffic/nh012-traffic-simulator.ts` | Ownership transitions, versioned snapshot/hydration, deterministic RNG and junction-restoration |
| Sedan drive handoff | new `src/game/vehicles/nh011-traffic-drive-handoff.ts` | Spatial candidate lookup, active-agent handoff and safe return to traffic/parking; reuse Rapier `FirstDriveTrial` |
| Traffic visual ownership | `north-heights-sedan-traffic-009.ts` | Exclusion by active traffic agent ID, drivable Sedan rendering from the same accepted source-derived identity and paint |
| Save | new `src/game/save/north-heights-save.ts`; optional `src/game/save/device-store.ts` | Typed atomic IndexedDB save adapter and migrations, small local fallback metadata; no cloud |
| Route/session | `src/routes/north-heights-preview.tsx`, `src/game/bridge` as appropriate | Life-cycle pause/save orchestration, restore gate, shared settings overlay |
| Locomotion | `src/game/character/native-flight-129.ts`, `locomotion/flight-pose.ts`, scene controller | Native *visual-only* directional lean with independent heading policy; UAL-derived sprint tuning |
| Parcel materials | `north-heights-block-surfaces-008.ts`, `north-heights-reconstruction-001.ts`, new pure land-use planner | Material classification, geometry with terrain elevation and collision-consistent entries |
| Kerbs | `north-heights-roads-003.ts` and shared material loader | Correct face UV/tangents, single concrete texture family, normal sanity |
| Asset lampposts | new `src/game/experiments/north-heights-lamps-011.ts` | One GLB import and lightweight instances, lighting budget, disposal |
| Greenspace | `north-heights-trees-004.ts`, spatial plan, new rooftop/clearance planner | Deterministic curated locations, undercroft/rooftop metadata, LOD |
| Weather | `north-heights-sky-002.ts` + new `north-heights-weather-011.ts` | Deterministic time/weather state, sky/rain/lightning controls and render tiers |
| Audio | new `src/game/audio/vehicle-audio-011.ts` and `weather-audio-011.ts` | One unlocked AudioContext, limited spatial voices, user settings |

Naming is a planning proposal, not evidence these new files exist. Do not create overlapping singletons; integrate existing subsystems with typed interfaces and explicit teardown.

## 4. Work packages and implementation algorithm

### WP-01 — Proximity-only boarding of every vehicle, including moving Sedans

**Input:** six parked drivable GLBs and 125 `NH012TrafficSimulator` visual agents. **Invariant:** each moving Sedan has exactly one world identity and at most one active visual/physical owner.

1. **Inventory/eligibility:** build a unified nearest-vehicle query from the parked car registry **and all 125 traffic positions**. Compute geometrically correct three-dimensional distance (with an accepted gameplay range initially matched to existing `VEHICLE_BOARD_RADIUS=3.5 m`); proximity **alone** determines display/activation eligibility. Do not filter by parked/moving, model, lane ownership, obstacle intersection, line-of-sight, speed, or “must be walking.” Avoid applying `nearestAccessibleCar` to this entry eligibility query. Keep collision geometry for **actual driving**, not boarding eligibility. Resolve ties deterministically by distance then ID, with small UI hysteresis only to avoid flicker (not an extra gate). Ensure near airborne Voight can enter if truly within 3D range.
2. **Moving Sedan takeover:** atomically reserve selected NH012 agent ID and its last pose/velocity/heading/paint. Transfer it from autonomous simulation to `playerControlled` ownership in the same fixed-step transaction. Suppress autonomous tick, stop-line and junction reservation handling **for that agent**; release its owned connector reservation safely. Keep its identity in the 125-agent roster. Do **not** create a 126th agent, duplicate body or leave an invisible traffic collider.
3. **Visual/physics handoff:** exclude the reserved agent from thin-instance render using the existing renderer exclusion parameter; materialize a single **accepted source-derived Sedan** near the vehicle, with matching 12-paint color, windows, original source wheel geometry, calibrated body bounds and correct forward orientation. Use a cache/pool that admits at most the active controlled instance per takeover; no per-frame GLB loading. Attach `FirstDriveTrial`/Rapier collider and reusable wheel control. Set vehicle world transform and a reasonable speed continuity from moving agent; preserve heading without 180° inversion and ensure no curb/road clipping. Hide Voight by the accepted VEH-BASIC-001 policy — **do not use rejected cabin-seat fitting**.
4. **Moving takeover safety:** steering and brakes become player authority on the very next simulation frame; clear pedestrian/flight controls and reset timing accumulator. Source traffic must not overwrite Rapier vehicle pose. Preserve camera behind the active car, HUD driving mode, hoot/action control, speed data. Retain the active car's identity and current pose for persistence.
5. **Return/exiting:** reuse the accepted stop-before-exit and collision-checked current-position disembarkation unless separately changed by owner; these rules govern **exit**, not entry eligibility. On exit choose a safe reinsertion protocol: only rejoin NH012 where a graph lane/junction can accept a vehicle without overlaps; otherwise keep this agent as a parked/idle world actor with stable ID until a safe rejoin. Never force/snap the car through a building or teleport another agent to clear space. Release/preserve renderer and physics ownership exactly once.
6. **Coverage:** proximity-drive on the original six existing parked cars, all 125 moving Sedans, and all future vehicle types through a common registered-capability adapter. “Every vehicle” means no permanent unsupported-model exceptions for vehicles actually present in the playable world; adapters lacking qualified physics are an explicit release blocker rather than a silent non-interactive decoration.
7. **Efficiency:** use a small spatial index or a low-frequency nearest-candidate scan (125 is tractable); no extra Rapier body per traffic car; no repeated loader or heavy mesh per agent; object pooling, stable IDs, no accumulated resources.

**Important tradeoff:** proximity-only entry deliberately permits boarding from opposite sides of walls within the range. This conflicts with the earlier accessible-path policy. Honor the new directive explicitly, record the physical implausibility as an accepted entry rule; continue to enforce vehicle/building collision once under control.

**Tests:** moving takeovers mid-straight and mid-junction; same-color identity; exact ownership transfer; wheel/yaw continuity; all 125 candidates eligible; no 126th car; junction reservation leaks; no double renderer; parked six unchanged; fly-mode proximity; safe exits on slopes; wall adjacency; sustained 20 Hz determinism of non-controlled cars; save/load while driving.

### WP-02 — Directional flight lean, stable heading and native anatomy

1. Separate `travelVector`, `headingYaw`, camera orbit and `visualLean` into distinct variables. Currently NH city overwrites `headingYaw` on every horizontal flight step. **Remove auto-facing** for non-sprint travel; accept explicit player heading/camera turn controls as authoritative. Moving backwards, sideways and diagonally must not rotate toward velocity.
2. Introduce a **visual-only tilt** on the calibrated `character.glb` flight pivot, not on the Rapier player capsule or camera. Use the UAL hover clips as **pose/reference evidence** for sign and magnitude, but derive modest forward/back pitch and sideways roll with native rig constraints. The legacy clips may be static frame poses; animate interpolation/blending over time instead of expecting motion from one-frame clips. Blend left/right and forward/back diagonals continuously. Proposed first-pass limit ~8–12° ordinary travel lean (tune by owner preview, not as an immutable requirement); idle eases to accepted hover.
3. Compose tilt with `CHAR-129`'s existing accepted head direction cues, one permanently bent leg, wide arms, ankle pitch, idle float and accelerated **horizontal prone** posture. Maintain existing 90° accelerated pitch; on sprint, only apply existing accepted heading alignment as specified by `flightFacingPolicy`. No additive joint rotation drift, mirrored elbow/knee changes or direct UAL quaternions.
4. Implement camera/character/world separation tests: reverse without turn; strafe left/right; diagonals; vertical travel; turn while strafing; sprint-forward; sprint-reverse transition; sprint release to ordinary backwards flight; third-person camera, feet and arm clearance.
5. Reference files: `native-flight-129.ts`, `locomotion/flight-pose.ts`, `mercer-static-character-103.ts`, `voight-humanoid-trial.ts`, `north-heights-city-8.ts`. Preserve `GTD-CHAR-129` geometry verification and DDD negative schema.

### WP-03 — Durable same-device pause/save/resume

1. **State model** `NorthHeightsSaveV1`: schema/version, build compatibility, UTC save timestamp, stable world seed and config revision, actor ID/character selection, position, heading, flight/walk mode, camera orbit and distance, grounded/airborne velocity if safe, active vehicle identity/pose/heading/linear speed and ownership, parked vehicle poses, all NH012 agent data (edge/connector IDs, lane s, headings, speeds, destinations, turn/wait state, current tick), RNG state, junction reservations, player-controlled agent state, world clock and time scale, weather mode/type/seed/timers, relevant interaction/interior identifiers, other world changes actually present. Do not serialize Babylon meshes, JavaScript closures, WebGL handles, Rapier pointers, audio nodes or React component instances.
2. **Single authoritative snapshot:** expose `controller.captureSave()` and `controller.restoreSave(validated)` (or equivalent) using a fixed-step transaction and save-safe vehicle handoff; pause simulation first and capture a coherent instant. Add restoration setters to relevant traffic and Rapier-facing subsystems rather than mutating private arrays ad hoc. Persist only data valid for current North Heights; version and migration guard.
3. **Storage:** IndexedDB in origin scope using a two-slot/last-known-good pattern, transaction atomicity, schema validation, payload checksums, timestamps and corrupt-save fallback. Maintain a compact metadata/localStorage recovery hint only if needed; avoid filling localStorage with large state blobs. No personal/account data, Supabase or cloud. Saved character/world state belongs to `src/game/save`; shared `Settings` remain interface preferences.
4. **Lifecycle:** on `visibilitychange`, `pagehide`, `blur`, `freeze`, route exit and manual pause, **synchronously latch pause and clear held inputs**, capture a coherent snapshot, enqueue durable write; on normal active play also checkpoint periodically (proposed <= 20 s with throttled write coalescing) and on board/exit, weather manual change, important world transition. Don't rely solely on `beforeunload` or promise that async IndexedDB completes after a forced mobile process kill. If termination interrupts the final write, recover the **most recent committed checkpoint**, explicitly showing its timestamp.
5. **Rehydration order:** create renderer and collision/world, build graph and accepted visual assets, construct player and parked vehicles, validate local save, hydrate traffic RNG+reservations+agents and player-owned drive object, restore physics transform, activate exactly one character/vehicle owner, set camera and world clock/weather, then publish first playable frame **paused** with a Resume/Start New choice. Do not simulate elapsed real-world time while inactive. Handle restore incompatibility with safe new game option and preserve old save for diagnostics where feasible.
6. **In-app navigation:** retain live North Heights scene across local GTD route changes where practical (analogous to existing /game persistent host), or reliably remount from save if lifecycle scope cannot be reused; isolate ownership to prevent two simultaneous Babylon engines. Preserve the established `/game` retention semantics and root typed routes.
7. **Robustness:** handle storage disabled/quota, private browsing, stale version/PWA offline update, save-write failure, rapid hidden/visible oscillation, repeated pause/resume, no tab focus, device restart, restoring while driving, replay determinism and corrupt/tampered records. Indicate “Saved locally,” “Saving,” “Save failed,” and recoverable checkpoint truthfully; never claim crash-proof preservation of the last uncommitted frame.

**Exit gate:** real Android Chrome standalone PWA and desktop tests for switch tabs, navigate GTD, refresh, close browser, force-stop browser/device restart, offline restoration; compare position, selected vehicle, traffic agent ownership, world clock/weather and input release. The human resumes intentionally; weather/traffic do not fast-forward in the background.

### WP-04 — Consistent realistic concrete curb textures

1. Asset audit: locate or author a **small licensed/locally generated** realistic tiling concrete albedo with optional lightweight roughness/normal if mobile permits. Use compressed WebP/KTX2 as supported; avoid multiple giant surface bitmaps. Record texture source/licence and asset size.
2. Apply common concrete material family to curb vertical faces, tops and corner areas. Existing roads code generates **vertical curb faces** while sidewalk **tops** are another mesh/material; select UV coordinates by world-space arc length/height and ensure visually continuous transition. Do not smear a horizontal photographic texture onto a 0.2 m vertical face; calibrate texel density.
3. Resolve double-sided face normals/winding and black corner artifacts in `north-heights-roads-003.ts`. Replace blanket unlit fudge only after verifying lit concrete does not reintroduce dark faces; use reliable normal and ambient term, not exaggerated contrast. Maintain correct 0.20 m curb reveal, autostep and crossing/grade geometry, integrated road markings and north-up map.
4. Compare day, dusk, night and rainy lighting, zoomed curb corners, slopes and crossroads. Add source/geometry assertions that all visible curb meshes have correct material/UV coverage; no black seams or z-fighting.

### WP-05 — Context-aware outdoor building yards and parking

1. Create a pure seeded **parcel land-use classifier** using existing `Lot.family`, archetype, width/depth, road approach, doorway orientation, reserved bays and neighborhood context. Output non-overlapping surface polygons tagged `grass`, `concrete`, `parking`, `pedestrian`, `tree-well` and any roof/terrace candidates.
2. For residential/estate: larger planted setbacks, small paths to accessible doors. For office/retail/civic: hardscaped frontages and purposeful service/parking, with tree wells and open foot routes. For narrow/steep lots: conservative paving rather than floating grass or physically impossible parking. Keep registered NH-010 parking lot and six dedicated bays intact.
3. Build terrain-following batches with stable UV scale and elevation layering. Eliminate outdoor white polygons only; explicitly leave **interior white floors/ceilings** in enterable buildings. Preserve doors/no physical door, walking through thresholds, sidewalk continuity and collisions. Never let parks/parking spill into roads, windows or walls.
4. Parking **geometry alone is not vehicle spawning**; mark valid bay rectangles, turning access and driveway paths before placing any additional parked cars. No unrequested increase to traffic population.
5. Validate deterministic identical seeds, no overlaps, slopes, aerial readability, readable grass/concrete proportions by building context and performant batching.

### WP-06 — Owner-supplied GLB realistic street lamps (ASSET BLOCKED)

1. **Asset handoff contract:** await owner GLB file(s), confirm filenames/paths, provenance/licence and permission to use, source units/axis, bounding box, pole height, luminaires, mesh/material count, UVs/textures, animation count and cost. Do not select or generate a replacement GLB preemptively. Add to `public/GLBs/Infrastructure` only after asset supplied and this plan's approval.
2. Offline preprocess using the established GLB inspection/conversion pipeline: reject broken geometry, excessive draw calls or external unlicensed textures; consolidate materials, simplify unnecessary hidden detail, optimize textures/mesh, preserve physical recognizable silhouette, quantize/compress only if decoder+PWA budgets pass. Set an evidence-based per-model mobile triangle/download/draw-call budget during intake (not arbitrary 5 MB approval).
3. Replace `addStreetFurniture` primitive pole/arm/head instances with repeated mesh instances/thin instances of a **single loaded GLB** or a small provided collection. Position against road side and sidewalks with setbacks, constant height, correct grounded base and terrain slope, no driving or pedestrian obstruction; do not clone an entire SceneLoader hierarchy per street.
4. Preserve light at night: use emissive lamp materials for visible glow and a **camera-near bounded pool of real lights** (or accepted deferred approximation) for street illumination, with day/dusk/night dimming, physically plausible range and no shadow-casting light per lamp. Night rain/wet visual contrast may change appearance but cannot spawn unlimited point lights.
5. Audit instancing bounds, disposal, ContextLost recovery, PWA packaging and real Android FPS. Produce photo/reference and in-game split comparison. **This work package cannot pass the approval-to-merge gate until the owner's actual asset is received and qualified.**

### WP-07 — Realistic vehicle audio: player and surrounding traffic

1. Create **one** user-gesture-activated Web Audio mixer for effects, owned by active gameplay; do not attempt autoplay when the page opens. Feed it measured vehicle speed and inputs (throttle/brake/steer/horn); distinguish idling, acceleration load, steady cruise, coasting, braking and tire roll. Layer/pitch-shift a **small licensed source bank** (or clearly labeled synthesized prototype pending sound acceptance). Avoid falsely calling a synthesized placeholder “realistic production audio.”
2. Drive engine rate/pitch/filter/gain from speed plus simplified engine load, smoothed to avoid zipper/jump artifacts; separate braking and tire loop envelopes. Horn fires from the accepted hoot control with rate limit and release handling; add touch/mobile binding without changing previously approved driving layout.
3. For NH012 traffic, sample representative **audible nearest** cars and their instantaneous state, not every rendered instance. Distance attenuation plus optional stereo panning/spatial positions; pool voices and impose strict per-device ceiling (initial experiment: player 2–4 loops + 4 nearby ambient voices on mobile, more only with measured headroom). Far traffic contributes bounded ambience rather than 125 AudioNodes.
4. Respect `master`, `effects`, `muted` in shared settings; pause/suspend audio on hidden state, muted, unloaded route and save restore until next gesture. No sound when the game is paused. Avoid unintended silent engine feedback when browser autoplay is blocked; show audio-enable affordance only after permitted user action.
5. QA: idle/accelerate/speed/brake/hoot, inside other moving traffic, near/far attenuation, mobile audio unlocked/blocked, concurrent nighttime rain, repeated boarding, browser visibility, memory leaks and thermal drain. Preserve future model-specific audio extensibility but do not require differentiated per-model libraries under current B scope.

### WP-08 — Automatic and manual weather / cloud / rain / night lightning

1. Use a deterministic `WeatherState` with `mode: automatic|manual`, `condition: cloudy|clear|rain|thunderstorm`, transition timer, intensity, seed, and lightning event schedule. Time of day is separate from condition. Default daytime **soft misty white cloud layers**, not black storm sky. Automatic transitions should vary plausibly and be stable under pause/save/reload. Manual mode remains selected until user returns to Auto.
2. Extend existing sky dome/material/fog and lighting palette. Implement camera-relative low-overdraw layered cloud cards/procedural shader or texture (test on hardware), gradual density/transparency and color shifts; rain as local camera-centered GPU-friendly instanced particles/strips, recycled in a volume, with depth/roof-awareness if affordable. Avoid full-city rain particle simulation, large transparent fullscreen sheets and heavy real-time volumetric clouds.
3. For night storms, schedule bright **short lightning illumination pulses**, optional distant cloud-bolt silhouette, localized fog/sky/scene light response, and **correlated thunder audio** with plausible delay and variable gain (no hardcoded flash+thunder every frame). Lightning may occur only in appropriate storm conditions; no effect on gameplay input or save determinism. Respect reduced-motion/flash accessibility choice with an explicit lower-flash presentation while retaining weather semantics.
4. Weather audio and rain effects feed the single audio mixer and user volume controls. No sound over paused/hidden game; reset stale timers safely on resume. Rain does not automatically change collision/friction physics unless separately approved. Keep existing day/dusk/night cycle and Vercel/offline support.
5. Add shared Settings selector (**Automatic, Clear, Cloudy/Misty, Rain, Thunderstorm** or equivalent). One settings model used by both /game and /north-heights-preview; in South Ward, avoid a falsely active control if weather is not yet implemented there—either clearly North Heights scoped in shared UI or guarded by actual runtime capability. Persist preference, current selected mode and current weather world state separately and correctly.
6. Verification: daytime mist, bright/cloudy contrast, daytime rain, nighttime rain+lightning+thunder, manual override, auto return, save/reload exact deterministic sequence, paused clock, standalone mobile thermal/render budget and accessibility.

### WP-09 — Dense, intentionally composed futuristic urban forestry

1. Reuse `tree_low_poly_lowpoly.glb` source and the accepted South Ward planting grammar; do **not** re-enable `leaves.glb` or clone expensive source hierarchies.
2. Build deterministically seeded **plantable polygons** from vacant blocks, yard classification, street verges, promenades, tower podiums/terraces, flat roof footprints and genuinely open **undercrofts** with measured overhead clearance. Current buildings may be solid down to the ground: **do not fake a tree inside a solid wall**. Only create undercroft planting where the building geometry is intentionally elevated/voided AND player collision/navigation remains correct; otherwise mark site unavailable.
3. Classify density by site: strongly green pedestrian corridors and selected roof gardens, rows of spaced streetside trees, softened commercial plazas, residential yards, occasional courtyard clusters, lightly vegetated downtown landmarks/approaches. Preserve architecture, natural skyline views, crosswalk visibility, driving turning radii, rooftop access and walking clearances. Avoid uniform stochastic “trees everywhere.”
4. Rooftops/terraces require explicit surface anchors, believable planters/soil beds, parapet and rooftop utility clearance, tree scale appropriate to structural/site area, collision only where traversal exists, and no floating trees above glass. Roof physical-load capacity is a visual/gameplay plausibility proxy, not real engineering certification.
5. Optimize reusable mesh instances or lower-cost distant representations, horizon/altitude LOD, static spatial chunk activation/culling, no duplicate foliage sources; measure **triangle count, draw calls and actual mobile memory**, not only tree count. Batch grass/soil materials with parcel plan. Proposed staged density comparisons: baseline, moderate, dense; owner accepts composition and performance rather than an arbitrary mandatory number.
6. Verify from aerial, street-level, rooftop and underneath real open spans. The two 2026-10-27 owner reference screenshots are **design reference images**, not gameplay performance evidence.

### WP-10 — UAL-authored running gait and realistic speed

1. Establish a side-by-side measurement scene with UAL `Sprint_Loop` (reference) and `character.glb` `char120-ual-sprint.json` (current retarget), equal scale/ground datum/camera/time sampling. Inspect normalized foot and knee trajectories, stance duty cycle, trailing heel lift and back-kick, stride symmetry, cadence, horizontal displacement, ankle pitch, arm collision, support foot sliding and heading alignment. The UAL reference is **authoritative**, not a clip to play directly on incompatible native joints.
2. Audit the entire **North Heights movement-speed chain**: its current on-foot 3.4/7.5 m/s stepping does not match `HUMAN_SPRINT_SPEED_120 = 3.25 m/s`. Align physical travel speed to clip cadence/stride and desired natural feel, preferring the accepted authored motion and coherent meter-per-second parameters. Do not blindly adopt 7.5 m/s or alter South Ward's accepted speed without a separately approved regression.
3. Reuse build-time retarget and rig-audit scripts (`scripts/char120-*` and `char110-*`) with joint-space safeguards; correct lower-limb tracks and blending where **measured** deviation exists. Preserve CHAR-120F accepted arms, CHAR-125 trailing-heel kick, CHAR-129 flight, CHAR-127 jump and standing/walking. Change only defective lower body/speed transitions, use no physics-free root teleport.
4. QA real `character.glb`: front/side/rear 60 FPS captures at ordinary walk, jog/sprint, accelerating and decelerating, uphill/downhill, turns, stops, jump transition, entry to flight, foot-ground clearance and no leg crossing. Test both UAL mode and native character mode on mobile/desktop. User visually approves the resulting stride and pace.

## 5. Integration work order and gates

The following is the proposed **post-approval** branch execution order. Group related files/validation into small commits, avoid repeated unnecessary preview builds, and preserve one rollback checkpoint per domain.

| Gate | Deliverable | Dependency and owner acceptance |
|---|---|---|
| **G0** | Refresh `main` SHA; baseline screenshot/perf/audio/memory/load suite on desktop + Android; record pre-existing failures; create isolated branch | **Owner approves this plan first**; baseline may not silently import abandoned branches |
| **G1** | Deterministic state/ownership APIs, typed save schema and traffic transfer test harness (no extra visual polish) | 125 identities conserved, cross-domain state snapshot is coherent, no auto-traffic mutation of claimed vehicle |
| **G2** | Proximity-only driving (parked+moving) with accepted Sedan visual/physics handoff, wheel and camera | Owner previews moving and parked capture; no duplicate, obstacle-driving, lane-reservation or crash regression |
| **G3** | Versioned local save, lifecycle latch, paused rehydrate and HUD save truth | Owner tests browser close/refresh/device restart; fallback behavior and offline PWA verified |
| **G4** | Flight heading + native lean and running UAL reference tuning | Owner reviews front/side/back flight and running videos/screens, accepted prior poses intact |
| **G5** | Curb texture + outdoor parcel use/parking boundaries | Owner approves street/yard comparison and intersection walkability |
| **G6** | Structured urban forestry and rooftop/undercroft planting | Owner approves curated density at rooftop and pedestrian perspective; hardware budget passes |
| **G7** | Vehicle + traffic spatial audio, then weather visuals/audio/settings | Audio activation/voice limit, weather transitions, lightning timing, pause/save tested |
| **G8** | GLB streetlight pipeline and replacement | **Blocked until owner supplies actual GLB**; model inspected/optimized; functional night lights; visual signoff |
| **G9** | Consolidated all-10 end-to-end regression, fresh rebase/merge review, final Android + desktop preview | Explicit owner acceptance of comprehensive preview; separate authorization required for merge and production deployment |

**Alternative scheduling:** G8 may happen earlier if the owner supplies the lamp promptly; it must never block planning or the other isolated branches of work. Combine integration previews only after local tests and approved checkpoints; do not expend deployment limits on speculative revisions.

## 6. Test plan, evidence and performance budget

### 6.1 Preexisting regression suites to run

`src/test/gen-veh009-sedan-only-traffic.test.ts`, `nh012-directed-lane-traffic.test.ts`, `nh010-parking-interiors-map.test.ts`, `vehicle-local-boarding.test.ts`, `street-vehicle-wheels-grounding.test.ts`, `loading-persistence.test.tsx`, `loading-persistence-runtime.test.ts`, `char129-native-flight.test.ts`, `char129-fi005-persistent-flight.test.ts`, `char120-athletic-sprint.test.ts`, `north-heights-rebuild003-roads.test.ts`, `north-heights-rebuild004-tree-placements.test.ts`, `north-heights-rebuild008-ui-flight.test.ts`, `in-game-settings-continuity.test.tsx`. Run full `npm test`, `npm run lint`, TypeScript `npx tsc --noEmit`, and `npm run build`; distinguish *actual run result* from proposals. Note `prebuild` generates derived files, so inspect changed-file diff before committing.

### 6.2 New minimum targeted tests

- `nh011-all-vehicle-proximity-and-moving-takeover.test.ts`: 125 traffic candidates, six parked, proximity only, no stationary/filter requirements, correct 3D range, stable tie handling, wall adjacency and fly proximity.
- `nh011-traffic-ownership-and-rejoin.test.ts`: atomic handoff, fixed 20 Hz, junction reservation release, no double car, no collision penetration, safe exit, deterministic resume/rejoin, no identity loss.
- `nh011-native-flight-directional-lean.test.ts`: no heading rotate on ordinary reverse/strafe, correct local tilt signs, sprint/horizontal and native anatomy regressions.
- `nh011-save-schema-lifecycle.test.ts[x]`: typed save roundtrip, indexed transaction/version/checksum, pause input flush, visibility/pagehide, restoring driving/walking/flight, RNG and junction determinism, offline browser restart, corrupted and quota storage fallback.
- `nh011-curb-concrete-uv.test.ts`, `nh011-context-parcel-layout.test.ts`, `nh011-roof-undercroft-planting.test.ts`: intersection geom/material tests, no outdoor white yards in targeted zones, no roofs/doors/streets blocked, reproducible placement.
- `nh011-lamp-asset-qualification.test.ts`: exact supplied model, no procedurally rendered replacement, GLB validation and bounded night lighting; leave gated until asset arrives.
- `nh011-vehicle-audio-budget.test.ts`: user-gesture gate, dynamic pitch/tire/brake/horn, spatial distance and voice cap, mute/pause/dispose.
- `nh011-weather-state.test.ts`: deterministic automatic/manual conditions, time-of-day, lightning/thunder pairing, reduced-motion, save/restore and UI capability.
- `nh011-ual-running-speed-gait.test.ts`: UAL-to-native limb evidence, foot-contact cadence and travel-speed consistency without rejected arm/leg regressions.

### 6.3 Manual scene matrix

Review **desktop keyboard**, **desktop mouse/camera**, **Android Chrome landscape**, **installed Android PWA with network**, and **offline installed PWA** (where expected functionality is already supported). Record device model/browser build/viewport/quality/power mode. For each important scene use the *same* walking/flight/driving route at mid-day, dusk and rainy night; measure load and FPS after warmup, worst-1% frame durations, memory, draw calls, active vehicles, active audio voices and battery/thermal warning observations. Include adjacent buildings, slopes, distant Sedan traffic, 125 vehicles, dense rooftop greenery, moving-car capture, save while driving and repeated leave/return.

**Performance acceptance:** Existing NH-REBUILD-003 target: first playable state preferably within **60 seconds**, desktop preferably **>40 FPS** at comparable positions, smooth mobile at its real tuned resolution. Use actual measured baseline and require **no material regression** in Android median/1%-low frame times, first-playable loading, PWA pack bytes, main-thread stalls, GPU memory and battery/thermal behavior; any tradeoff beyond noise must be reported with screenshots and numbers for explicit owner acceptance. Proposed engineering guardrails (tune against baseline): stable 125 logical agents / 20 Hz unchanged; only one active materialized traffic Sedan; bounded distant traffic visual tiers; <= a small nearest traffic-audio voice pool per phone; no one-light-per-pole shadow path; no all-city rain particle pool; amortized save writes; reuse tree/lamp GLB instances. **Do not assert an FPS improvement without hardware evidence.**

### 6.4 Definition of done / visual evidence

For each gate: (1) source SHA and file diff, (2) tests command and actual result, (3) measured frame/load/audio/asset budget on named device, (4) real preview URL if owner authorized its creation, (5) screenshots/video from *running browser* rather than concept render, (6) known limitations, (7) owner accept/reject decision. Final checklist requires all ten entries independently accepted. No cross-district visual/control or offline regressions.

## 7. Risk register, mitigations and fallback

| Risk | Consequence | Mitigation / fallback |
|---|---|---|
| Moving traffic is only a thin-instance | Boarding creates duplicate invisible/nonphysical Sedan or stalls simulator | Ownership transaction, reserved ID, one materialized controllable Sedan, exclusion from visual batch and NH012 autonomous updates |
| Proximity-only entry through walls | May feel unrealistic, despite being explicit requirement | Preserve requested rule; keep post-entry physics, collision and safe exit. Document rather than override user with hidden accessibility gate |
| Handoff at junction | Stale reservation blocks 125-agent circuit | Release/transfer reservation transactionally; simulate and validate thousands of ticks before preview |
| Durable save after mobile process kill | Pagehide async write interrupted; “exact last frame” lost | Periodic committed snapshots, atomic last-known-good slot, honest checkpoint timestamp; distinguish live-RAM resume from recovery |
| Save schema evolution/PWA updates | Crash loop or stale GLB asset references | Version/migration, compatibility and validation; recovery choice without destructive overwrite |
| Direct UAL rotations on native rig | Repeats CHAR-128 twisted arms/legs | Native visual pivot only; preserve CHAR-129 GLB joint-space acceptance |
| Moving-speed/clip mismatch | Fast foot sliding, odd gait after retarget | Align actual motion speed, gait cycle and arc length; UAL authoritative, preserve accepted arms/heel |
| Concrete UV/normals | Dark curb ends, z-fighting, stretched texture | World-space UV, tested normals, split seam ownership, day/night inspection |
| Uniform parcel landscaping | Disconnected entrances/roads and fake outdoor white fixes | Pure contextual seeded planner, threshold and collision checks; keep white interiors |
| Heavy user street lamp GLB | Main-thread stall, download/lighting budget | Owner file audit, dedup instancing, capped light pool; block G8 if unaffordable, do not substitute |
| Dense rooftop/undercroft trees | Trees intersect solids, invisible/costly geometry | Measured clearance, surface anchors, LOD/culling, collision/navigation checks |
| 125 ambient sound emitters | WebAudio CPU/memory and Android audio breakage | Nearest-voice virtualization, strict mixer quota, gesture activation, full dispose |
| Storm transparency/lightning | Overdraw/flash accessibility/performance | Mobile weather tiers, reduced flash, no volumetric sky or 125 lights |
| Shared Settings changes | South Ward displays broken/false weather controls | Capability-scoped presentation while sharing a settings schema |
| Preview/deploy pressure | Inadequate review, daily deployment limit | Small commits, automated tests, fewer consolidated owner checkpoints, no automatic merges/deployments |

**Rollback:** feature gates behind branch-local configuration until accepted; independent domain commits, revert each failing work package without deleting prior accepted source assets or disrupting historical records. Failed approach: capture commit IDs/test logs/screenshots, document attempted/rejected strategy, then execute DDD after authorization. Never resurrect retired vehicle extractions, Ferrari/Buggy production traffic or native GLB flight bone retargeting.

## 8. Explicit scope exclusions

- No return of Taxi, Kangoo, Hatchback, Rover, BMW, Ferrari or Buggy as **125 moving traffic** visual variants; the moving circuit stays one approved Sedan design with 12 paints. Parked distinct six remain independently drivable.
- No cabin-seat correction or driver-visible posture; current hidden driver remains.
- No vehicle count increase beyond the 125 autonomous/controlled identities; landscaping parking spaces do not imply additional cars.
- No cloud/cross-device saves, account sync, new backend or telemetry service.
- No unsupported claims of exact state preservation across abrupt OS kill after the last successful checkpoint.
- No unapproved slippery-road physics, weather-induced vehicle handling changes or new missions.
- No street lamp replacement before the owner-provided file is received; no alternate model selection.
- No gameplay code changes to `main` during documentation phase; no preview/deploy/merge without explicit subsequent consent.

## 9. Approval/acceptance register

| Gate | Status at document authoring |
|---|---|
| Ten requirements answered | **Complete** |
| Latest main architecture inspected | **Complete**, inspected baseline SHA above |
| Comprehensive technical plan committed to /documentations | **Documentation-only action requested** |
| Owner-supplied lamp GLB received | **Pending** |
| Owner plan scan/review | **Pending** |
| Owner explicit implementation approval | **NOT GRANTED** |
| Feature branch created | **NOT AUTHORIZED YET** |
| Gameplay changes made | **NONE AUTHORIZED** |
| Preview deployment | **NOT AUTHORIZED** |
| Merge or production deployment | **NOT AUTHORIZED** |

### Next instruction required

The owner reviews/scans this plan. Only after **explicit approval**: re-read `main`, capture fresh baseline, open `feature/gtd-north-heights-optimization-011-20261027`, record G0 evidence, and begin G1–G9 in the owner-approved sequence. Process the owner's lamppost GLB as an independent asset qualification dependency on arrival; amend the plan if its real properties change feasibility before implementation.

---
**This record is a specification and approval gate, not an implementation or performance claim.**
