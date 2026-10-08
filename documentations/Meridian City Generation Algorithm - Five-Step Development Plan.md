# Meridian City Generation Algorithm — Five-Step Development Plan

Status: PROPOSED IMPLEMENTATION PLAN  
Date: 2026-10-09  
Project: GTD — Grand Theft Division  
Parent architecture: [Meridian Dynamic Building Generation Algorithm](./Meridian%20Dynamic%20Building%20Generation%20Algorithm.md)  
Current milestone context: Meridia: First Light

## Purpose

The Meridian City Generation Algorithm is the system that turns Meridian from a manually assembled prototype into a data-driven city that can be expanded rapidly without sacrificing visual coherence, interaction quality, or performance discipline.

The objective is not to generate a random city. The objective is to encode the architectural and urban grammar of Meridian so that new districts, blocks, roads, and buildings are created mostly by authoring structured data and reusable rules rather than writing new Babylon scene code for every asset.

The five foundational implementations are deliberately ordered because each one becomes the contract for the next:

1. World Schema & Deterministic Data Model
2. Procedural Architecture Generator
3. Representation, Materials & Asset System
4. Physical Interaction & Spatial Semantics
5. Urban Composition, Roads & Streaming

The final success condition is simple:

> A new neighborhood should usually be new data, not new rendering code.

---

## Step 1 — World Schema & Deterministic Data Model

### Objective

Represent Meridian City as a hierarchy of explicit, deterministic data structures that describe what exists, where it exists, and which rules govern it.

This step creates the vocabulary from which every later system operates.

### Core deliverables

#### 1.1 Canonical data contracts

Implement typed contracts for:

- `CitySpec`
- `DistrictSpec`
- `NeighborhoodSpec`
- `BlockSpec`
- `LotSpec`
- `BuildingSpec`
- `RoadNodeSpec`
- `RoadSegmentSpec`
- `IntersectionSpec`
- `PublicSpaceSpec`
- `PropPlacementSpec`
- `VegetationPlacementSpec`

The hierarchy should follow:

```text
City
└── District
    └── Neighborhood
        └── Block
            ├── Lot
            │   └── BuildingSpec
            ├── PublicSpace
            └── Road frontage relationships
```

#### 1.2 BuildingSpec implementation

The existing Dynamic Building Generation document defines the logical contract. This step implements the actual TypeScript version.

Minimum first-version fields:

- id
- seed
- position
- rotation
- archetype
- width
- depth
- floors
- floor height
- massing form
- facade material family
- window type
- entrance count
- garage opening count
- interior mode
- collision mode
- camera-blocker mode
- roof type
- LOD profile

#### 1.3 Archetype defaults

Create reusable defaults for at least:

- residential
- mixed-use
- neighborhood commercial
- garage/workshop
- warehouse/industrial
- office
- podium/tower

Each archetype defines expected ranges and defaults rather than final geometry.

#### 1.4 District rule inheritance

Implement rule inheritance:

```text
Global defaults
→ District rules
→ Neighborhood rules
→ Archetype defaults
→ Lot constraints
→ BuildingSpec overrides
```

Local values override broader rules.

This lets South Ward and Meridian Central use the same generator while producing visibly different architecture.

#### 1.5 Deterministic seeded variation

Implement a seeded pseudo-random utility.

All generated variation must derive from:

```text
building seed
+ generator version
+ stable feature key
```

Examples of seeded variation:

- window tint
- facade discoloration
- signage variation
- rooftop equipment placement
- AC-unit placement
- minor dimensional differences
- grime intensity
- blind state

No uncontrolled `Math.random()` should be used in city generation.

#### 1.6 Schema validation

Add development-time validation for:

- invalid dimensions
- impossible floor heights
- openings that do not fit facades
- negative setbacks
- interior mode incompatible with building size
- garage doors without road/service access
- windows intersecting corners
- unsupported material/archetype combinations

### Acceptance criteria

Step 1 is complete when:

- First Light buildings can be described as BuildingSpecs.
- The same spec/seed produces identical output inputs every run.
- South Ward rules can modify defaults without changing generator code.
- Invalid specs fail predictably.
- Buildings can be inspected as data without opening scene-construction code.

### Strategic payoff

This step converts the city from code into information.

Without this foundation, every later automation becomes brittle.

---

## Step 2 — Procedural Architecture Generator

### Objective

Convert BuildingSpecs into believable structural architecture.

This is the core geometry engine.

### Core deliverables

#### 2.1 BuildingGenerator service

Create one reusable generator responsible for:

```ts
generateBuilding(scene, physics, spec, context)
```

It should return a structured `GeneratedBuilding`, not merely a mesh.

#### 2.2 Massing generation

Support first-version massing families:

- slab
- row
- warehouse
- podium
- podium/tower
- corner building

The generator calculates:

- footprint
- floor elevations
- facade faces
- roof surfaces
- front/rear/service faces
- setback zones
- opening candidate zones

#### 2.3 Floor and facade grid

Divide each facade into:

- floors
- bays
- corner piers
- entrance zones
- service zones

Avoid visibly broken partial bays at corners.

The generator may slightly adjust bay widths within tolerance to preserve clean architectural rhythm.

#### 2.4 Facade grammar

Implement semantic facade roles:

- wall
- window
- entrance
- storefront
- garage opening
- loading opening
- blank service panel
- balcony placeholder
- trim band

Rules should differ by archetype and floor.

Example:

```text
Mixed-use building

Upper floors:
window | wall | window | wall | window

Ground floor:
shopfront | entrance | shopfront | service
```

#### 2.5 Reusable architectural templates

Create reusable template definitions for:

- windows
- doors
- storefronts
- garage openings
- loading bays
- parapets
- awnings
- vents
- AC units
- roof equipment

BuildingSpecs reference template IDs rather than rebuilding details.

#### 2.6 Real opening segmentation

Where physical depth matters, wall geometry must be segmented around:

- doors
- garage openings
- selected windows

Prefer segmentation over expensive runtime boolean/CSG operations.

#### 2.7 Roof generation

Support:

- flat
- parapet
- pitched
- shed

And optional rooftop elements:

- HVAC
- vents
- antenna
- access hut
- water tank

### Acceptance criteria

Step 2 is complete when:

- changing width, floors, depth, window type, and archetype produces a valid building without generator-code changes;
- at least three distinct South Ward building archetypes are generated from data;
- generated facades remain coherent from street level;
- the generator can reproduce current First Light supporting-building massing closely enough for replacement;
- the same generator can produce both a one-floor garage and a multi-storey tower.

### Strategic payoff

This is where city-scale acceleration begins.

Once stable, adding a building becomes parameter editing instead of scene-programming.

---

## Step 3 — Representation, Materials & Asset System

### Objective

Make generated architecture visually believable while keeping the runtime cost bounded.

The geometry generator answers "what shape is it?"  
This layer answers "what does it look like, and how expensive is that representation?"

### Core deliverables

#### 3.1 Material family catalog

Implement shared material families such as:

- South Ward warm brick
- weathered concrete
- painted block
- dark storefront glass
- industrial metal
- plaster
- institutional concrete
- asphalt
- sidewalk paving

Materials should be reusable across many buildings.

#### 3.2 Controlled material variation

Allow per-building variation through:

- tint
- roughness
- UV offset
- weathering amount
- grime
- patching
- decal layers
- local dirt near ground level

Avoid unique high-resolution textures for every building.

#### 3.3 Window representation tiers

Support:

1. decorative facade window
2. recessed window
3. physical glazed window
4. interior-linked window

The generator selects the level according to:

- building importance
- distance
- enterability
- facade visibility
- performance profile

#### 3.4 Facade detail system

Add reusable detail categories:

- trim
- shutters
- vents
- drainpipes
- utility boxes
- signage
- awnings
- AC units
- facade stains
- graffiti/decal hooks

Geometry is used only where silhouette, depth, shadow, or interaction justifies it.

#### 3.5 Representation LOD

Every building receives a representation profile.

Suggested tiers:

**Near**
- full shell
- recesses
- selected real windows
- doors
- detail props

**Medium**
- simplified shell
- reduced shallow geometry
- facade material carries more depth

**Far**
- simplified volume
- facade atlas/card
- minimal active geometry

**Skyline**
- very low-cost mass or impostor
- atmospheric integration

#### 3.6 Shared asset catalogs

Introduce catalogs for:

- facade materials
- window templates
- door templates
- storefront templates
- roof props
- decals
- signage

These should be referenced by stable IDs.

#### 3.7 Batching and instancing policy

Define when to use:

- standard meshes
- merged static meshes
- instances
- thin instances
- material sharing
- atlases

The generator should not produce one expensive active mesh per window where avoidable.

### Acceptance criteria

Step 3 is complete when:

- multiple buildings share materials without looking identical;
- supporting buildings look complete enough to belong in gameplay rather than blockout;
- close hero buildings have real/selective depth;
- distant buildings are measurably cheaper;
- LOD changes are not distracting during normal movement;
- a neighborhood can contain substantial architectural variety from a relatively small material/template library.

### Strategic payoff

This is what prevents procedural generation from looking procedural.

The system gains visual breadth without linearly increasing asset-production cost.

---

## Step 4 — Physical Interaction & Spatial Semantics

### Objective

Ensure generated buildings are part of the game world, not merely rendered scenery.

Every visible structural decision must agree with player collision, camera behavior, entrances, and future NPC navigation.

### Core deliverables

#### 4.1 Automatic collision generation

Generate simplified Rapier colliders from building semantics.

Modes:

- simple shell
- segmented shell
- detailed interior

Do not use high-detail rendering meshes as default collision geometry.

#### 4.2 Camera blocker generation

Create camera blockers separately from physical collision.

Rules:

- opaque wall → camera blocker
- open entrance → not blocker
- transparent window → generally not blocker
- roof/ceiling → blocker where needed
- shallow/decorative facade detail → usually ignored

#### 4.3 InteractionAnchor system

Generated physical entrances expose structured anchors:

```ts
{
  type: "door" | "garage" | "service" | "storefront";
  position;
  facing;
  buildingId;
  interiorTarget?;
}
```

This becomes useful later for:

- missions
- prompts
- NPC navigation
- door behavior
- police response
- save state

#### 4.4 Interior modes

Implement the first three modes:

**none**
- exterior only

**shallow**
- visual/interactable depth near storefront

**cell**
- one meaningful traversable interior space

Multi-cell interiors remain later.

#### 4.5 Interior/exterior portals

A generated enterable building should expose:

- entrance portal
- interior bounds
- camera blocker boundaries
- future navmesh connection
- stream/load hooks

#### 4.6 Physical windows

Where configured, generated windows can have:

- real wall opening
- frame
- mullion
- glass
- collision
- camera transparency

The First Light garage becomes the regression reference.

#### 4.7 Spatial metadata

Every generated building should know:

- street-facing side
- rear/service side
- entrances
- accessible spaces
- bounds
- address/lot relationship
- archetype
- district/neighborhood
- building ID

### Acceptance criteria

Step 4 is complete when:

- Voight cannot walk through generated solid buildings or parked structural elements;
- physical entrances align with visible openings;
- the camera does not incorrectly cross opaque walls;
- one generated building supports enter → traverse → exit behavior;
- selected real windows behave correctly;
- future systems can query buildings by semantic information rather than mesh names.

### Strategic payoff

This is where generated architecture becomes game architecture.

It avoids the trap of constructing a large city that must later be retrofitted for interaction.

---

## Step 5 — Urban Composition, Roads & Streaming

### Objective

Turn generated buildings into Meridian City.

This step combines road topology, blocks, lots, building placement, district identity, skyline hierarchy, and runtime streaming.

### Core deliverables

#### 5.1 Semantic road graph

Represent roads as connected topology rather than independent rectangular strips.

The graph contains:

- nodes
- road segments
- lane counts
- road widths
- intersection types
- sidewalk widths
- curb geometry rules
- crossing points
- road hierarchy

Road hierarchy examples:

- alley/service road
- local street
- collector
- arterial
- boulevard
- highway

#### 5.2 Junction generation

Support:

- straight continuation
- T-junction
- four-way intersection
- later multi-lane intersections

Road surface owns the junction.

Curbs and sidewalks are generated around the junction boundary and must never cross active asphalt.

#### 5.3 Block generation

Roads define block boundaries.

Each BlockSpec contains:

- polygon/bounds
- lot arrangement
- public spaces
- service access
- frontage rules
- district/neighborhood context

#### 5.4 Lot generation and placement

Lots define legal building placement:

- front edge
- rear edge
- side boundaries
- street frontage
- corner status
- setbacks
- driveway/service access

The building generator receives this context.

#### 5.5 Road-aware building orientation

A generated building automatically knows:

- which facade faces the primary street
- where storefronts belong
- where garage doors may exist
- where service access belongs
- which faces are suitable for blank walls
- whether it is a corner building

#### 5.6 Neighborhood composition rules

A neighborhood defines ranges such as:

```ts
{
  floorRange: [1, 7],
  commercialFrontage: 0.35,
  garageFrequency: 0.12,
  materialFamilies: [...],
  setbackProfile: "tight",
  skylineAnchors: 2,
  treeDensity: 0.28
}
```

These are constrained production rules, not uncontrolled randomness.

#### 5.7 Skyline hierarchy

Introduce deliberate height bands:

- local low-rise fabric
- neighborhood anchors
- district towers
- city-center skyline

This prevents a procedurally generated city from becoming uniform.

#### 5.8 Block streaming

Use block or small block cluster as the likely world-streaming unit.

Streaming lifecycle:

```text
approach block
→ load specs
→ generate/load representation
→ register collision/interactions
→ upgrade LOD as player nears
→ downgrade/unload as player leaves
```

Important interiors can stream independently.

#### 5.9 City registry

Maintain indexed access to:

- districts
- neighborhoods
- blocks
- lots
- buildings
- roads
- interaction anchors

Future systems should be able to ask:

```ts
city.getBuilding(buildingId)
city.getBuildingsInBlock(blockId)
city.getNearestGarage(position)
city.getRoadAt(position)
```

#### 5.10 First Light conversion test

Convert the existing manually authored First Light section into:

- road graph data
- block data
- BuildingSpecs
- generated buildings

Compare against the manually built version.

Only after parity should rapid city expansion begin.

### Acceptance criteria

Step 5 is complete when:

- roads connect topologically and visually;
- blocks and lots are derived consistently from the road layout;
- building fronts face correct streets;
- a neighborhood can be generated mostly from structured data;
- First Light can be reconstructed substantially from the city-generation system;
- blocks can be loaded/unloaded without leaking physics/render resources;
- city scale can increase without a proportional increase in hand-authored code.

---

## Overall Development Gates

The five steps are sequential foundations, but development can overlap after contracts stabilize.

The recommended gates are:

```text
Gate A
Step 1 complete:
city can be described as deterministic data

Gate B
Step 2 complete:
data reliably becomes architecture

Gate C
Step 3 complete:
architecture meets the visual language

Gate D
Step 4 complete:
generated architecture is physically playable

Gate E
Step 5 complete:
playable architecture composes into a scalable city
```

No phase should be considered successful merely because it generates more geometry.

The quality bar remains:

- believable
- deterministic
- interactive where required
- visually coherent
- performant
- maintainable
- scalable

---

## Recommended First Implementation Target

The first end-to-end proof should not be an entirely new district.

Use **First Light as the regression laboratory**.

The implementation target is:

```text
current manually authored garage corner
        ↓
describe with BuildingSpecs / road data
        ↓
generate equivalent scene
        ↓
compare visual, collision, camera, and performance behavior
        ↓
remove redundant bespoke scene code
```

Once the generated version reaches parity, the same system can create the next South Ward blocks much faster.

---

## Expected Acceleration

Before the algorithm:

```text
new building
→ write Babylon construction code
→ write facade code
→ write collision
→ write openings
→ place manually
→ debug individually
```

After the algorithm:

```text
new building
→ select archetype
→ provide dimensions / overrides / seed
→ generator builds representation
```

Before the algorithm:

```text
new neighborhood
→ manually create every street and building
```

After the algorithm:

```text
new neighborhood
→ define road graph
→ define blocks/lots
→ assign district rules + BuildingSpecs
→ generate
```

The intended outcome is sublinear production effort: a city ten times larger should require substantially less than ten times the architectural implementation effort.

---

## Final Principle

The Meridian City Generation Algorithm should not remove design.

It should remove repetition.

Human design remains responsible for:

- district identity
- road hierarchy
- landmarks
- important buildings
- narrative spaces
- visual direction
- unusual exceptions

The generator is responsible for:

- repetitive structure
- consistent geometry
- facade grammar
- physical contracts
- reusable visual representation
- deterministic variation
- scalable instantiation

> **Meridian should feel authored at the city scale, even when much of its physical representation is generated.**
