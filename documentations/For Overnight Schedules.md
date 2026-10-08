# For Overnight Schedules

Status: ACTIVE EXECUTION STANDARD  
Date: 2026-10-09  
Project: GTD — Grand Theft Division  
Repository: `interlinkglobal/GTD`  
Branch: `main`

## Purpose

This document is the execution standard for the five overnight Meridian City Generation Algorithm schedules.

Every overnight agent must read this document first, then read the linked implementation documents, then inspect the current repository state before making changes.

The five schedules are not independent experiments. They are a dependency chain.

```text
Schedule 1
World Schema & Deterministic Data Model
        ↓
Schedule 2
Procedural Architecture Generator
        ↓
Schedule 3
Representation, Materials & Asset System
        ↓
Schedule 4
Physical Interaction & Spatial Semantics
        ↓
Schedule 5
Urban Composition, Roads & Streaming
```

Each later schedule must build on the committed work from earlier schedules.

The intended outcome is not simply more code.

The intended outcome is a city-generation pipeline where Meridian can expand rapidly because its buildings, roads, blocks, lots, materials, interaction rules, and streaming behavior are generated from structured, deterministic data.

Core principle:

> **A new building should usually be new data, not new rendering code.**

Secondary principle:

> **Meridian should feel authored at the city scale, even when much of its physical representation is generated.**

---

## Required reading before implementation

Every overnight agent must read:

1. `documentations/For Overnight Schedules.md`
2. `documentations/Meridian City Generation Algorithm - Five-Step Development Plan.md`
3. `documentations/Meridian Dynamic Building Generation Algorithm.md`
4. `documentations/Meridia First Light Implementation Plan.md`
5. `documentations/Meridian Game World Development SOT.md`

The repository state is authoritative for implementation details.

Do not assume the previous schedule succeeded. Verify committed files and current code before building on them.

---

## Global execution rules

All five overnight schedules must follow these rules.

### 1. Preserve existing architecture

Maintain:

- React as application/UI shell
- Babylon.js as world/render runtime
- Rapier as physics runtime
- fixed 60 Hz game simulation
- normalized input bridge
- engine ownership of per-frame gameplay state
- existing camera-obstruction behavior
- existing First Light visual improvements unless intentionally superseded

Do not move per-frame gameplay state into React.

### 2. Build incrementally

Prefer:

- small reusable modules
- typed contracts
- deterministic systems
- explicit interfaces
- data-driven composition
- regression-safe migration

Avoid:

- monolithic generator classes
- global mutable city objects
- hardcoded one-off building logic
- premature over-generalization
- destructive rewrites of working First Light code

### 3. Verify before claiming success

At minimum:

- inspect modified files after writing
- ensure imports/types are coherent
- verify no obvious duplicate/conflicting definitions
- preserve current world boot path
- document known limitations

If a build/test environment is available, use it.

Do not claim runtime success without evidence.

### 4. Commit meaningful units

Each schedule should commit coherent implementation work to `main`.

Commit messages must describe the actual implementation.

Update relevant documentation/decision logs after code changes.

### 5. No automatic deployment

Do not trigger Vercel deployment automatically.

Deployment remains a deliberate review milestone after substantial visual or systemic progress.

### 6. First Light is the regression laboratory

The current First Light section is the reference implementation.

Do not discard it.

Use it to validate:

- building proportions
- facade behavior
- physical openings
- collision
- camera interaction
- road junction logic
- materials
- skyline
- vegetation relationships
- generation parity

The city-generation system should gradually replace bespoke First Light construction only when generated parity is proven.

---

# Schedule 1 — World Schema & Deterministic Data Model

## Intention

Schedule 1 gives Meridian stable world identity.

From a gamer perspective, this is the point where the city stops being merely a visual arrangement of meshes and starts becoming a persistent, queryable world.

The player may not immediately see a large graphical difference, but this implementation determines whether every building, road, block, entrance, and neighborhood can retain a stable identity across sessions and systems.

The gamer-facing promise is:

> **Meridian knows what everything is and where it is.**

## Gamer benefit

This implementation should eventually enable:

- stable addresses
- consistent building identity
- persistent locations across sessions
- reliable mission targeting
- navigation and GPS
- police dispatch
- map labeling
- world-state saves
- location-aware NPC behavior
- district-specific identity
- future property and ownership systems
- reliable references to rooftops, entrances, garages, interiors, and service areas

A mission should eventually be able to refer to:

> "214 Mercer Street, South Ward"

instead of relying only on an arbitrary waypoint.

## Coordinates

Coordinates answer:

> **Where is this?**

Each important world entity should have a deterministic position.

Relevant examples:

- building origin
- lot origin
- road node position
- road segment geometry
- primary entrance
- service entrance
- garage entrance
- interior spawn
- rooftop access
- loading bay
- helipad
- floor elevation

Coordinates must remain stable unless the authored city layout changes.

This matters for:

- navigation
- missions
- saves
- pursuit logic
- helicopter systems
- rooftop gameplay
- vertical navigation
- map systems

## Building IDs

IDs answer:

> **Which exact object is this?**

A building must have a permanent machine-readable identity even if its visible name changes.

Example:

```ts
{
  buildingId: "SW-B041-L03",
  districtId: "south-ward",
  blockId: "SW-B041",
  lotId: "SW-B041-L03",
  position: { x: 184.2, y: 0, z: -92.7 }
}
```

The player does not need to see this internal ID.

The game needs it for:

- missions
- persistence
- NPC memory
- ownership
- damage state
- interiors
- doors
- map references
- police response
- case intelligence

## Addresses and building numbers

Addresses answer:

> **How would a person in Meridian refer to this place?**

Examples:

- 214 Mercer Street
- 88 Division Avenue
- 17 Harbor Road

Addresses may be authored or derived from:

- road
- block
- lot
- frontage order

They should remain stable.

## Names

Names answer:

> **What does this place mean socially?**

Examples:

- South Ward Auto Works
- Meridian General Hospital
- Civic Exchange Tower
- Kestrel House

The visible name is human-facing identity.

The internal ID is machine-facing identity.

Both can coexist.

## Position anchors

A building is more than one coordinate.

The schema should support semantic anchors such as:

```ts
building.position
building.primaryEntrance
building.serviceEntrance
building.garageEntrance
building.roofAccess
building.interiorSpawn
building.loadingBay
building.helipad
```

Future systems should reason about these anchors instead of arbitrary mesh positions.

## Required implementation

Schedule 1 must implement or establish:

- `CitySpec`
- `DistrictSpec`
- `NeighborhoodSpec`
- `BlockSpec`
- `LotSpec`
- `BuildingSpec`
- road node/segment/intersection specs
- stable IDs
- deterministic seeded variation
- archetype defaults
- inheritance rules
- validation
- semantic position anchors

## Acceptance standard

Schedule 1 is successful when:

- current First Light buildings can be represented as data
- same spec + same seed yields the same generated inputs
- district rules can alter defaults without generator code changes
- IDs and coordinates are stable
- invalid specs fail predictably
- world entities can be referenced semantically

---

# Schedule 2 — Procedural Architecture Generator

## Intention

Schedule 2 turns structured building data into actual architecture.

This is where the city-generation idea becomes visibly real.

The gamer-facing promise is:

> **Meridian can now build its own architecture from rules.**

## Gamer benefit

The player should ultimately benefit from:

- much faster city growth
- greater architectural variety
- more believable building proportions
- stronger facade rhythm
- wider skyline variation
- distinct building types
- fewer cloned placeholder boxes
- reusable improvements propagating across many buildings

A single generator should be able to produce:

- a one-storey garage
- a residential row
- a corner shop
- a warehouse
- a mixed-use block
- an office slab
- a podium tower

by changing data rather than writing new scene code.

## Building types in GTD

Building type must be gameplay metadata, not only visual styling.

At minimum, support archetypes such as:

- residential
- mixed-use
- commercial
- garage/workshop
- industrial
- warehouse
- office
- civic
- hospitality
- parking

Later specialized types may include:

- medical
- police
- educational
- transport
- utility

The long-term gamer-facing distinction is important.

In GTD, a garage should not merely look like a garage.

The world should know it is a garage.

That semantic classification can later influence:

- vehicle access
- service bays
- mission selection
- NPC activity
- opening types
- security behavior
- interior expectations
- police logic

Likewise, an office building can imply:

- lobby
- business hours
- security
- elevators
- rooftops
- mechanical floors

A residential building can imply:

- apartments
- residents
- entrances
- balconies
- restricted/private areas

An industrial building can imply:

- loading bays
- truck access
- yards
- machinery
- service entrances

## Comparison target

The goal is not to claim GTD has prettier or larger buildings than GTA.

The goal is that GTD buildings are more explicitly systemic:

> **GTD buildings know what they are, where they are, and what they can be used for.**

Compared with Payback 2, buildings should move beyond primarily environmental city-shaping assets.

Compared with GTA, GTD should aim for a more explicit semantic building model even if the visual asset budget is smaller.

## Required implementation

Schedule 2 must establish:

- reusable `BuildingGenerator`
- structured `GeneratedBuilding` output
- massing families
- floor logic
- facade bay generation
- corner handling
- semantic facade grammar
- window placement
- door placement
- storefronts
- garage/loading openings
- reusable architectural templates
- roof generation
- segmented real openings where required

## Facade grammar expectation

The generator must not place arbitrary repeated rectangles.

It should understand patterns like:

```text
Residential upper floors:
window | wall | window | wall | window

Commercial ground floor:
shopfront | entrance | shopfront | service
```

## Acceptance standard

Schedule 2 is successful when:

- changing dimensions/floors/archetype changes output without generator-code edits
- several distinct South Ward building types are data-generated
- facade rhythm remains coherent
- a garage and a tower can come from the same generator
- existing First Light support buildings can begin migration to generated equivalents

---

# Schedule 3 — Representation, Materials & Asset System

## Intention

Schedule 3 makes generated architecture visually believable.

Schedule 2 may produce correct geometry.

Schedule 3 prevents it from looking like procedural test geometry.

The gamer-facing promise is:

> **The city may be generated from rules, but it should not look generated from rules.**

## Gamer benefit

The player should see:

- fewer cloned-looking buildings
- richer material identity
- believable wear
- different glass treatments
- facade variation
- improved depth
- secondary architectural details
- stronger district atmosphere
- large city scale without catastrophic rendering cost

Two buildings can share the same structural archetype while differing through:

- brick tone
- concrete wear
- glass tint
- grime
- signage
- facade accents
- shutters
- awnings
- rooftop equipment
- utility boxes
- vents
- drainpipes

## Material strategy

Implement reusable material families such as:

- warm brick
- weathered block
- painted concrete
- dark storefront glass
- industrial metal
- plaster
- institutional concrete

Variation should come from:

- tint
- UV offset
- weathering
- roughness
- decals
- ground-level grime
- patching

Avoid one unique large texture per building.

## Window representation tiers

Windows should support distance/importance-aware representation.

Suggested levels:

1. decorative facade window
2. recessed window
3. physical glazed window
4. interior-linked window

Near important buildings can spend geometry.

Distant buildings should remain cheap.

## LOD expectation

The player should ideally not notice representation transitions.

Suggested tiers:

**Near**
- full shell
- real/recessed details
- important windows
- facade props

**Medium**
- simpler shell
- fewer shallow details
- material carries more visual complexity

**Far**
- simplified volume
- facade atlas/card

**Skyline**
- very cheap mass or impostor

## Visual doctrine

Follow the established GTD principle:

> **Use real geometry where interaction, silhouette, parallax, or close inspection requires physical truth. Use image-derived or material-driven complexity elsewhere.**

The goal is not brute-force realism.

The goal is perceptual credibility.

## Required implementation

Schedule 3 should establish:

- material catalog
- facade material families
- deterministic material variation
- reusable window templates
- reusable door/storefront templates
- facade detail catalog
- rooftop detail catalog
- LOD profile hooks
- batching/instancing policy
- shared asset IDs
- representation tiers

## Acceptance standard

Schedule 3 is successful when:

- generated buildings sharing archetypes do not look cloned
- supporting buildings no longer read as blockout
- important buildings retain close-range depth
- distant buildings are cheaper
- city scale can increase without linear visual asset cost
- LOD transitions are not distracting in ordinary play

---

# Schedule 4 — Physical Interaction & Spatial Semantics

## Intention

Schedule 4 turns generated architecture into gameplay space.

The gamer-facing promise is:

> **The city now has physical rules that match what the player sees.**

A visible doorway should behave like a doorway.

A solid wall should behave like a wall.

A transparent window should not behave like an opaque camera barrier unless deliberately configured.

## Gamer benefit

The player should gain:

- reliable collision
- fewer geometry mismatches
- more believable camera behavior
- scalable enterable buildings
- meaningful entrances
- service access
- rooftop access
- physical windows
- better mission traversal
- future NPC pathing foundations

## Collision

Generated buildings should create simplified Rapier collision automatically.

Suggested modes:

- simple shell
- segmented shell
- detailed interior

Rendering geometry should not automatically become collision geometry.

## Camera blockers

Camera obstruction is semantic and separate from collision.

Rules should broadly follow:

- opaque structural wall → blocker
- open doorway → not blocker
- transparent window → usually not blocker
- roof/ceiling → blocker where needed
- decorative facade detail → usually ignored

## Interaction anchors

Generated buildings should expose anchors such as:

- main entrance
- garage entrance
- service entrance
- storefront entrance
- roof access
- interior spawn

Example shape:

```ts
{
  type: "door" | "garage" | "service" | "storefront",
  position,
  facing,
  buildingId,
  interiorTarget
}
```

These anchors will later support:

- missions
- NPC navigation
- prompts
- police behavior
- save state
- case intelligence
- scripted and emergent interactions

## Interior modes

Initial interior levels:

**none**
- exterior only

**shallow**
- limited visible/interactive depth

**cell**
- one meaningful traversable interior

Later:

**multi-cell**
- multiple rooms/floors

This allows thousands of semantically real buildings without requiring thousands of full interiors.

## Required implementation

Schedule 4 must establish:

- automatic collider generation
- camera blocker generation
- `InteractionAnchor`
- semantic entrance metadata
- physical-window rules
- interior mode foundation
- interior/exterior portal metadata
- building bounds
- accessible-space metadata

## Acceptance standard

Schedule 4 is successful when:

- Voight cannot pass through generated solid architecture
- visible entrances match collision openings
- camera behavior agrees with wall/window semantics
- at least one generated building is enterable and escapable
- real windows behave correctly
- future systems can query semantic building data instead of mesh names

---

# Schedule 5 — Urban Composition, Roads & Streaming

## Intention

Schedule 5 turns the building-generation system into a city-generation system.

This is where roads, blocks, lots, buildings, districts, skyline, and streaming begin operating together.

The gamer-facing promise is:

> **Everything composes into an actual city.**

## Gamer benefit

The player should begin to experience:

- roads that genuinely connect
- coherent intersections
- correct curb termination
- meaningful blocks and lots
- street-facing entrances
- believable garage/service placement
- district identity through urban composition
- deliberate skyline hierarchy
- larger playable geography
- more stable browser performance through streaming
- city-aware gameplay systems

## Road graph

Roads must become connected topology rather than independent rectangles.

The graph should represent:

- nodes
- segments
- widths
- hierarchy
- lanes
- sidewalks
- curbs
- crossings
- intersection types

Road hierarchy may include:

- alley
- local street
- collector
- arterial
- boulevard
- highway

## Junction ownership

The road surface owns the junction.

Curbs and sidewalks wrap around active asphalt.

They must not cross through road connections.

Support at least:

- straight continuation
- T-junction
- four-way intersection

This directly addresses the current First Light curb/junction discrepancy.

## Blocks and lots

Road topology should define or inform blocks.

Blocks contain lots.

Lots provide:

- street frontage
- side boundaries
- rear/service side
- corner status
- setbacks
- driveway/service access

The building generator then receives correct placement context.

## Road-aware architecture

A building should know:

- which face is primary street frontage
- which face is service/rear
- where storefronts belong
- where garage doors may exist
- which faces can remain blank
- whether it is a corner building

This prevents visually plausible but geographically nonsensical generation.

## Neighborhood composition

Neighborhoods should control ranges such as:

```ts
{
  floorRange: [1, 7],
  commercialFrontage: 0.35,
  garageFrequency: 0.12,
  materialFamilies: ["warm-brick", "painted-block", "weathered-concrete"],
  setbackProfile: "tight",
  skylineAnchors: 2,
  treeDensity: 0.28
}
```

These are constrained authored rules.

Do not generate arbitrary randomness that destroys district identity.

## Skyline hierarchy

Height should be intentional.

Use broad bands such as:

- local low-rise fabric
- neighborhood anchors
- district towers
- central skyline

This improves:

- city identity
- navigation
- visual composition
- vertical gameplay
- future helicopter use

## Streaming

Likely streaming unit:

- block
- or small block cluster

Expected lifecycle:

```text
approach block
→ load specs
→ generate/load representation
→ register physics/interactions
→ upgrade detail when near
→ downgrade/unload when distant
```

The gamer should experience a large city without requiring all detailed geometry and physics to remain active simultaneously.

## City registry

Future systems should be able to ask:

```ts
city.getBuilding(buildingId)
city.getBuildingsInBlock(blockId)
city.getNearestGarage(position)
city.getRoadAt(position)
```

This is foundational for:

- missions
- police response
- case intelligence
- navigation
- traffic
- NPC routing
- informants
- world persistence

## Required implementation

Schedule 5 should establish:

- semantic road graph
- junction generation
- curb/sidewalk termination rules
- `BlockSpec`
- `LotSpec`
- road frontage relationships
- road-aware building orientation
- neighborhood composition rules
- skyline hierarchy hooks
- city registry
- initial block-streaming lifecycle

## Acceptance standard

Schedule 5 is successful when:

- road connectivity is both topologically and visually correct
- curbs no longer cross active road junctions
- buildings face the correct streets
- blocks/lots have consistent semantics
- a neighborhood can be generated mostly from structured data
- First Light can begin reconstruction from city data
- block resources can load/unload cleanly
- larger city scale no longer implies proportional hand-written world code

---

# What the five schedules mean together

The gamer-facing progression is:

```text
Schedule 1
The city knows what everything is.

Schedule 2
The city can build its architecture.

Schedule 3
The architecture looks believable.

Schedule 4
The architecture behaves like gameplay space.

Schedule 5
Everything composes into an actual city.
```

The engineering progression is:

```text
Data
→ Geometry
→ Representation
→ Interaction
→ Urban System
```

The production progression is:

```text
Hand-build every object
        ↓
Describe reusable architecture
        ↓
Describe blocks and neighborhoods
        ↓
Generate repeatable city structure
        ↓
Reserve bespoke work for places that matter
```

---

# Overnight handoff discipline

Each scheduled agent must leave the next agent a usable repository state.

Before finishing:

1. Commit all coherent changes.
2. Update relevant documentation.
3. Record what was implemented.
4. Record what remains incomplete.
5. Do not hide known regressions.
6. Preserve First Light bootability.
7. Do not deploy.
8. Do not assume the next agent will infer undocumented intent.
9. Favor stable contracts over rushed breadth.
10. If the full schedule scope cannot be completed safely, finish the strongest coherent subset and document the remaining work.

The overnight objective is cumulative progress, not five isolated bursts.

---

# Final standard

The algorithm is successful only if it makes Meridian faster to author **without making Meridian feel generic**.

The player should eventually experience a city that is:

- large
- coherent
- persistent
- geographically legible
- architecturally varied
- physically consistent
- semantically meaningful
- performant
- expandable

The system exists to remove repetitive implementation work while preserving deliberate design.

> **The generator removes repetition. It does not remove authorship.**
