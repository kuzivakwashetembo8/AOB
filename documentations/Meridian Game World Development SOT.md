# Meridian Game World Development — Source of Truth

**Project:** G.T.D — Grand Theft Division  
**Document role:** Technical and world-development source of truth for the first playable 3D runtime and the evolution of Meridian City.  
**Canonical narrative source:** Google Doc — *Game Development*  
**Google Doc revision read:** `AHj4eMTgXtWHVyPO1LFGxqe39wsUQIxx1oSYco-uQ9vZXRpD4TxboxLwRXWEHL6fOmUtxTIC4axy6rV7ChQHlKANtC6vHI5_ds8euwKk-s8`  
**Repository:** `interlinkglobal/GTD`  
**Deployment policy:** GitHub `main` is canonical. Vercel deployment is intentional only.

---

# 1. Game World Summary

## Meridia

Meridia is the larger setting of GTD. Meridian City is the first playable city and the starting point of the game. Future cities may exist within Meridia without changing the identity or foundations established by Meridian City.

## Meridian City

Meridian City is intended to be one dense, believable urban environment whose internal contrast makes it feel substantially larger than its physical footprint.

The city is designed around recognizable human places rather than abstract gameplay biomes. The player should remember the specific garage, shop, diner, station, alley, apartment block, courthouse, rooftop, parking structure, clinic, or neighborhood where something happened.

Each district has four defining dimensions:

- a social function;
- an economic function;
- a criminal pressure;
- a visual identity.

Missions should emerge from these functions rather than treating districts as decorative backdrops.

## District Layout

### 1. Meridian Central
Commercial and institutional core: high-rises, municipal buildings, police headquarters, banks, corporate offices, hotels, parking garages, transit hubs, rooftops, and underground service infrastructure.

### 2. South Ward
Dense working-class residential territory with apartment blocks, corner shops, schools, churches, workshops, garages, basketball courts, informal markets, bars, and clinics. South Ward is the strongest starting territory for Voight and should establish neighborhood familiarity.

### 3. Old Meridian
Historic district of narrow streets, brick buildings, old theaters, family businesses, courthouses, older police precincts, pawn shops, bars, alleys, and layered underground infrastructure.

### 4. Harbor District
Container yards, docks, warehouses, customs facilities, freight depots, boatyards, industrial roads, and hidden storage. Natural territory for smuggling, stolen-vehicle export, and organized crime.

### 5. North Heights
Affluent neighborhoods, gated residences, luxury dealerships, private schools, country clubs, high-end retail, and corporate estates. Crime manifests through organized theft, corruption, fraud, kidnapping, and private security.

### 6. East Market
Busy mixed-use markets, small businesses, restaurants, street vendors, and immigrant communities. High pedestrian density and strong local identity.

### 7. The Strip
Nightlife corridor of clubs, restaurants, gaming halls, hotels, music venues, diners, and parking structures. Activity intensifies after dark and naturally supports surveillance, pursuits, and social missions.

### 8. Ironworks
Heavy industrial territory with factories, scrapyards, rail infrastructure, chop shops, trucking yards, machine shops, and abandoned plants. Important to the early Grand Theft Division story.

### 9. West End
A more neglected district containing vacant buildings, social housing, repair shops, small businesses, contested gang territory, and strong community networks. It must not be reduced to a generic “bad area.”

### 10. Meridian University District
Campus facilities, hospital, research buildings, student housing, sports grounds, cafes, and technology companies. Supports student life, protests, cybercrime, research theft, and medical emergencies.

### 11. Civic Square
City hall, courthouse, central library, public plaza, media offices, and government departments. Its importance grows with Voight’s public and institutional visibility.

### 12. Outer Ring
Highways, service stations, motels, logistics parks, suburban retail, dealerships, impound lots, and access roads. Gives driving gameplay room to breathe and connects dense districts.

## Anchor Locations

Meridian should contain recurring places that gain personal meaning through repeated use and events:

- Voight’s home;
- preferred garage or mechanic;
- familiar diner;
- local convenience store;
- hospital;
- police precinct;
- city hall and courthouse;
- impound yard;
- major chop shop;
- community center;
- nightclub;
- freight terminal;
- luxury vehicle dealership;
- trusted neighborhood businesses that accumulate history.

## World Familiarity

Early Meridian is largely anonymous to Voight. Progression should create both geographical and social familiarity.

The player gradually learns:

- which garage owner can hide a vehicle;
- which detective can be trusted;
- which shopkeeper notices things;
- which alley connects two blocks;
- which building or street is controlled by which faction.

Progression through Meridian is therefore not only map completion. It is accumulated knowledge of people and place.

## Meridian People

The city should feel inhabited by people with relationships, routines, obligations, destinations, and places where they belong.

Population exists in four layers:

1. **Recurring named characters** — people Voight repeatedly encounters and develops relationships with.
2. **Persistent local characters** — recognizable people attached to particular places and routines.
3. **Systemic citizens** — lighter identities with routines, destinations, reactions, and basic memories.
4. **Transient population** — legitimate temporary density such as tourists, commuters, delivery drivers, construction workers, event crowds, and hospital visitors.

### Population Principle

> Not every person needs a story, but every person should appear to have somewhere to be.

Time and place must affect behavior. A morning commuter in Meridian Central should not feel like a late-night patron leaving The Strip.

Population should be district-sensitive. South Ward should produce repeated local faces; Central should turn over heavily with commuters; Harbor should reflect industrial shifts; North Heights should include household and security labor; East Market should be dense and social; the University District should follow institutional cycles.

## Relationships Between People

Residents may hold lightweight relationships such as:

- family;
- coworkers;
- neighbors;
- friends;
- customers;
- employees;
- gang associates;
- police contacts;
- community groups;
- rivals.

These links allow consequences to propagate through human networks rather than stopping at the directly affected NPC.

## Relationship With Voight

Relationship states are deliberately non-exclusive. A person may simultaneously recognize, trust, owe, fear, hate, need, work with, or protect Voight.

The system should preserve contradiction rather than collapse human relationships into one approval score.

## Human History as Progression

Voight should not merely accumulate experience points.

He accumulates human history.

Recurring characters become important through events, consequences, and repeated contact rather than existing only as isolated mission dispensers.

## Game World Principle

**Meridia gives the game its broader setting. Meridian City gives it place. Meridian People gives it life. Together, people, places, and purpose form the Game World.**

---

# 2. Immediate Runtime Objective

The first playable milestone is intentionally small:

> Launch GTD, enter the game, and experience Voight standing in an empty piece of Meridia controlled by a real 3D runtime.

This milestone exists to prove the engine boundary and the fundamental laws of the future world before any serious content production begins.

The first runtime must prove:

- a real renderer attached to the existing `/game` canvas;
- a stable lifecycle from bootstrap through destruction;
- deterministic gameplay simulation;
- physics;
- a third-person camera;
- a placeholder Voight actor;
- unified desktop and touch input;
- movement and look;
- ground and obstacle collision;
- pause/resume;
- live runtime snapshots driving the existing HUD;
- clean teardown when leaving `/game`.

No district art, crowds, traffic, vehicles, missions, or world streaming should be introduced until this foundation is stable.

---

# 3. Runtime Technology Decision

## Renderer

Use **Babylon.js** for the first GTD runtime.

Reasoning:

- mature browser-native scene and render lifecycle;
- WebGL and WebGPU paths;
- strong glTF support;
- cameras, animation, materials, lighting, and tooling available without requiring us to build undifferentiated infrastructure;
- sufficiently low-level access for GTD’s future unconventional representation systems;
- lets the team spend experimentation budget on GTD-specific rendering rather than renderer boilerplate.

Babylon is infrastructure, not the game architecture. GTD-specific simulation and representation logic must remain ours.

## Physics

Use **Rapier/WASM** behind a dedicated physics boundary.

Rapier should own:

- collision bodies;
- character collision queries;
- rigid bodies where required;
- spatial queries;
- later vehicle and physical interactions.

Babylon meshes must not become the authoritative gameplay state.

## Simulation

Gameplay simulation uses a fixed timestep, initially targeting **60 Hz**.

Rendering may run at the display refresh rate independently.

The runtime should be structured so simulation state can later support interpolation, rollback-friendly logic, replays, deterministic tests, and worker-backed systems where useful.

---

# 4. Ownership Boundary

The existing application architecture remains authoritative:

```text
React / TanStack shell
        |
        | GameCommand
        v
RuntimeBridge
        |
        v
GTDGameRuntime
        |
        +-- simulation
        +-- input state
        +-- physics
        +-- world state
        +-- renderer
        +-- camera
        |
        | GameSnapshot / GameEvent
        v
RuntimeBridge
        |
        v
React HUD / menus / shell
```

## React owns

- routing;
- launcher;
- menus;
- settings;
- pause surface;
- HUD presentation;
- loading/error presentation;
- touch-control UI;
- application/PWA lifecycle.

## GTDGameRuntime owns

- render loop;
- fixed simulation loop;
- world state;
- actor state;
- player movement;
- physics;
- cameras;
- scene objects;
- gameplay timing;
- high-frequency input state;
- future AI and traffic;
- future streaming and representation selection.

## Hard rule

React must never own per-frame:

- player transform;
- camera transform;
- physics bodies;
- pedestrian updates;
- vehicle simulation;
- AI state;
- render objects;
- world streaming decisions.

---

# 5. Initial Code Structure

The runtime should begin with a deliberate, small structure:

```text
src/game/
  bridge/
    runtime-bridge.ts
    use-game-bridge.ts
    types.ts

  core/
    gtd-runtime.ts
    game-loop.ts
    clock.ts
    runtime-state.ts

  renderer/
    babylon-engine.ts
    scene.ts
    lighting.ts
    camera.ts

  physics/
    rapier-world.ts
    character-controller.ts

  character/
    voight.ts
    locomotion.ts

  input/
    input-state.ts
    command-mapper.ts

  world/
    test-world.ts

  debug/
    runtime-stats.ts
```

This structure is intentionally modest. Do not create dozens of speculative systems before they are needed.

---

# 6. Phase 1 — Runtime Bootstrap

Implement `GTDGameRuntime` as the concrete implementation of the existing `GameRuntime` contract.

Required lifecycle:

```text
idle
  -> bootstrapping
  -> ready
  -> running
  -> paused
  -> running
  -> destroyed
```

## bootstrap(canvas)

Must:

- accept the existing `GameCanvasHost` canvas;
- initialize Babylon;
- initialize the base scene;
- initialize the physics layer;
- create world resources;
- create camera resources;
- create the player actor;
- install resize handling;
- return only when the runtime is ready to start.

## start()

Must:

- begin render scheduling;
- begin fixed-step simulation;
- emit the initial live snapshot.

## pause()

Must:

- stop gameplay simulation and physics progression;
- preserve the currently rendered world;
- avoid timestep accumulation.

## resume()

Must:

- reset timing accumulation safely;
- continue without a large catch-up step.

## destroy()

Must cleanly release:

- Babylon engine and scene;
- Rapier world resources;
- event handlers;
- resize observers/listeners;
- animation frame handles;
- subscriptions;
- actor resources;
- references to the canvas.

Repeated entry and exit from `/game` must not leak runtime resources.

---

# 7. Phase 2 — Render Core

The first scene should deliberately be an empty spatial test environment.

Create:

- sky/environment background;
- directional light;
- minimal ambient/environment illumination;
- flat ground;
- atmospheric depth/fog if useful;
- a few simple geometric landmarks or collision blocks for visual orientation.

The point of this scene is scale and locomotion, not art direction.

Initial unit convention should be explicit and documented. Recommended baseline:

**1 world unit = 1 meter.**

Coordinate conventions must be fixed before content work begins.

---

# 8. Phase 3 — Physics Core

Initialize Rapier separately from Babylon.

The initial physics world requires:

- gravity;
- static ground collider;
- a small number of static test obstacles;
- Voight collision shape;
- ground-contact detection;
- movement queries or character-controller behavior.

Rendering follows authoritative runtime/physics transforms.

A Babylon transform should never silently become the canonical player position.

---

# 9. Phase 4 — Voight Prototype Actor

Voight begins as a technical actor, not final character art.

Initial representation may be:

- capsule collision body;
- simple humanoid proxy mesh, primitive body, or temporary glTF;
- forward-direction marker if useful during development.

The first Voight implementation must validate:

- human scale;
- standing height;
- ground contact;
- walking;
- sprinting;
- turning;
- jumping if included in the first pass;
- camera relationship;
- collision;
- pause/resume state;
- spawning and destruction.

Character art comes after movement feels correct.

---

# 10. Phase 5 — Unified Input State

The shell already emits normalized commands from desktop and touch controls.

The runtime should maintain an internal high-frequency input state rather than treating each command as an isolated gameplay event.

Core actions:

```text
move
look
sprint
jump
interact
enterVehicle
combatPrimary
combatSecondary
focus
pause
map
context
```

Desktop and mobile must drive the same runtime actions.

The runtime should not contain a separate “mobile movement system.”

## Movement

Desktop arrow keys are the primary movement convention. WASD remains a supported compatibility binding.

The mobile movement joystick feeds the same normalized movement vector. Touch-axis conversion must preserve direct spatial intent: moving the joystick left moves Voight left, and moving it right moves Voight right.

## Look

Mouse/pointer input and the right mobile joystick populate the same camera-look state.

## Buttons

Pressed/released state should be tracked where the gameplay action requires continuous input.

---

# 11. Phase 6 — Third-Person Camera

The initial camera should establish the foundation for GTA-like traversal without prematurely building cinematic camera systems.

Required behavior:

- third-person follow;
- orbit/look input;
- movement relative to camera heading;
- configurable follow distance;
- configurable height/shoulder relationship;
- smooth but responsive follow;
- pitch limits;
- later-compatible camera collision.

Camera state belongs to the runtime.

The shell must not calculate or animate camera transforms.

---

# 12. Phase 7 — Locomotion

Voight’s first locomotion model should favor correctness and responsiveness over animation sophistication.

Required:

- camera-relative movement;
- walking;
- sprint modifier;
- gravity;
- stable ground contact;
- obstacle collision;
- sensible turning;
- clean stopping;
- no frame-rate-dependent speed.

Movement must be driven by the fixed simulation timestep.

Animation blending can follow once movement physics and control feel stable.

---

# 13. Phase 8 — Runtime Snapshot Integration

The existing HUD currently consumes `GameSnapshot`.

Begin replacing placeholder shell state with real runtime values.

Initial live snapshot fields should include or derive:

- runtime lifecycle state;
- player position;
- player movement state;
- health;
- location;
- current gameplay context;
- speed;
- pause state;
- input mode where useful.

Initial location may be a technical designation such as:

`Meridia Test Ground`

or, once the first South Ward block begins:

`South Ward`

Snapshot emission should be lower-frequency than the render loop unless a UI element genuinely requires higher frequency.

---

# 13A. Gameplay HUD Contract

The gameplay HUD exists to communicate actionable information, not to expose implementation state or permanently narrate the game.

## Persistent baseline

Only controls that must remain directly accessible, such as pause, may be persistently visible.

## Conditional information

The following appear only when the state makes them useful:

- current objective, when objective display is enabled;
- heat, only when heat is above zero;
- health, when Voight is injured or the health state materially matters;
- interaction prompts, only when a real interaction is available;
- crosshair/weapon information, only in a combat context;
- speed/vehicle information, only while driving;
- navigation/map information, only when it represents real runtime world data.

## Information that does not belong in the normal gameplay HUD

Do not persistently display:

- development/runtime metadata;
- “walking / driving / combat” preview selectors;
- placeholder reputation states such as “unestablished”;
- static character labels such as “Voight // Protector”;
- technical test-ground labels unless required for development/debug mode;
- fake or schematic minimaps that are not driven by actual world state;
- control legends that permanently compete with the world.

Mission titles, district/location names, reputation changes, tutorials, and similar information should be event-driven or transient unless gameplay requires continuous awareness.

## Context prompt placement

Interaction prompts must not obscure Voight or the central play space. Desktop prompts should occupy a low-priority lower-screen region. On touch devices they should sit near the relevant action controls rather than over the character.

The central visual field belongs to the world.

---

# 14. Phase 9 — Pause and Lifecycle Validation

The current pause UI must become operational rather than decorative.

Acceptance behavior:

1. player moves;
2. pause opens;
3. simulation and physics stop;
4. camera/world remain visually stable;
5. resume occurs;
6. player continues without a physics jump or accumulated delta spike.

Navigation away from `/game` must destroy the runtime cleanly.

Returning to `/game` must produce a fresh valid runtime.

---

# 15. Phase 10 — Development Diagnostics

Add a development diagnostics surface available only in development/debug mode.

Useful initial telemetry:

- renderer backend;
- FPS;
- render frame time;
- simulation Hz;
- fixed timestep;
- accumulated simulation lag;
- player XYZ;
- player heading;
- grounded state;
- movement vector;
- active input mode;
- Rapier body count;
- Babylon mesh/draw counts where practical;
- runtime lifecycle state.

Diagnostics must not require React to subscribe to frame-rate data by default. A low-frequency diagnostic snapshot or engine-native overlay is preferable.

---

# 16. First Milestone Acceptance Test

The first world milestone passes only when the complete loop works:

1. Open GTD.
2. Select **Enter Meridian**.
3. `/game` mounts the existing canvas.
4. Babylon initializes successfully.
5. Rapier initializes successfully.
6. Loading state exits.
7. An empty Meridia environment is visible.
8. Voight is standing on the ground.
9. Desktop WASD moves him.
10. Mobile left joystick moves him.
11. Mouse/right touch input controls the camera.
12. Movement direction respects camera heading.
13. Voight cannot fall through the ground.
14. Voight collides with simple test obstacles.
15. Pause freezes simulation.
16. Resume works without a timing spike.
17. The HUD receives live runtime data.
18. Navigating away destroys the runtime.
19. Returning creates a fresh runtime without leaks or duplicated listeners.

Only after this passes should world construction begin.

---

# 17. What We Deliberately Do Not Build Yet

Do not add the following to the first runtime milestone:

- full Meridian map;
- final South Ward architecture;
- final Voight model;
- crowds;
- AI;
- traffic;
- driveable vehicles;
- weapons;
- combat;
- missions;
- interiors;
- streaming sectors;
- weather;
- day/night simulation;
- procedural population;
- save-game state;
- multiplayer;
- backend dependencies.

The objective is to prove the laws of the world before populating the world.

---

# 18. Transition to South Ward

Once the empty-world milestone is stable, the first environmental development target becomes a compact South Ward test block.

Proposed initial block:

- one primary street;
- one side street;
- sidewalks;
- one alley;
- two to four building facades;
- one garage;
- one corner business;
- parked vehicle props;
- streetlights;
- traffic signal;
- trees;
- street furniture and neighborhood props.

This block is not intended as final content. It is the first environment used to validate:

- human scale;
- street scale;
- traversal;
- sightlines;
- camera behavior;
- collision complexity;
- asset loading;
- representation switching;
- environmental composition;
- eventual vehicle movement.

---

# 19. Creative Rendering Systems After Runtime Stability

The GTD rendering philosophy must begin shaping Meridian early, but only after the foundational runtime is stable.

The first representation experiments should focus on high-leverage world assets.

## Trees

Test image-derived foliage using combinations of:

- alpha extraction;
- estimated depth;
- derived normal information;
- layered depth slices;
- minimal trunk geometry;
- view-dependent foliage cards;
- wind deformation;
- distance-based representation switching.

## Building Facades

Investigate:

- depth-assisted facade cards;
- parallax interiors;
- window variation;
- procedural signage;
- camera-aware substitutions;
- geometry only where silhouette/parallax requires it.

## Distant City

Investigate:

- skyline layers;
- atmospheric depth;
- parallax;
- impostor structures;
- time-of-day lighting treatment;
- representation LOD.

The core rule remains:

> Use the cheapest representation that preserves the intended visual illusion.

---

# 20. Future World Architecture Reservations

As Meridian expands, the runtime should eventually support clearly separated systems for:

- ECS/entity storage;
- world sectors/chunks;
- world streaming;
- asset manifests;
- representation LOD;
- asset synthesis;
- depth cards;
- impostors;
- procedural variation;
- world composition;
- pedestrians;
- traffic;
- vehicles;
- AI;
- missions;
- relationship/history systems;
- district simulation;
- save-state persistence;
- worker orchestration;
- profiling and telemetry.

These are architectural reservations, not instructions to implement everything now.

---

# 21. Source-of-Truth Rules

This file governs technical implementation of Meridian world development unless a later explicit decision supersedes it.

When implementation and this document diverge:

1. determine whether the code reflects an intentional newer decision;
2. if intentional, update this SOT in the same development cycle;
3. if unintentional, bring implementation back into alignment.

The *Game Development* Google Doc remains canonical for creative world, character, narrative, and high-level architectural intent.

This SOT is canonical for the technical implementation of the 3D world runtime.

---

# 22. Current State

Current implementation state:

- application shell is complete and remains the React/TanStack presentation layer;
- PWA behavior and mobile landscape behavior are verified;
- Lovable-specific dependencies and metadata are removed;
- GitHub `main` is canonical and Vercel deployment remains intentional only;
- Babylon.js 9.29.0 is attached behind the existing `GameCanvasHost`;
- Rapier 0.21.0 compat is the authoritative collision/character-motion boundary;
- `GTDGameRuntime` implements bootstrap, start, pause, resume, destroy, command, snapshot, and event contracts;
- the simulation runs on a fixed 60 Hz timestep while rendering follows the browser frame rate;
- Meridia Test Ground exists as the first deliberately empty world;
- Voight exists as a temporary technical humanoid proxy backed by a Rapier capsule;
- desktop arrow keys are the primary movement binding, WASD remains compatible, and mobile touch movement feeds the same runtime movement state;
- mouse pointer-lock look and mobile right-stick look feed the same runtime camera state;
- ground and static obstacle collision are connected;
- runtime lifecycle and movement state feed the existing HUD snapshot bridge;
- pause/resume and route teardown are connected to the actual runtime;
- touch horizontal movement direction has been corrected so gesture direction matches character direction;
- the gameplay HUD has been reduced to actionable/conditional information instead of persistent development metadata;
- no production deployment has been requested for this runtime milestone yet.

**Next validation milestone:** build and experience **Voight standing and moving in Meridia Test Ground**. Only after that validation passes should South Ward environment construction begin.
