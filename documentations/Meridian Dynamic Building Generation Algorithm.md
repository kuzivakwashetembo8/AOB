# Meridian Dynamic Building Generation Algorithm

Status: DESIGN SOURCE OF TRUTH — approved direction, implementation not yet complete  
Date: 2026-10-08  
Project: GTD — Grand Theft Division  
Related milestone: Meridia: First Light  
Related documents:
- [Meridia First Light Implementation Plan](./Meridia%20First%20Light%20Implementation%20Plan.md)
- [Meridian Game World Development SOT](./Meridian%20Game%20World%20Development%20SOT.md)
- [Realistic 3D Browser Worlds Research](./realistic-3D-browser-worlds-research.md)

## 1. Purpose

Meridian City must become large without requiring every building to be implemented as bespoke scene code.

The Dynamic Building Generation Algorithm converts declarative building data into a complete runtime building representation: massing, facade grammar, openings, optional interiors, collision, camera blockers, interaction anchors, materials, and distance representations.

The system does **not** mean that every building is random or that Meridian becomes an undirected procedural city. The city remains deliberately designed. Procedural generation is used as a production multiplier: designers describe buildings and neighborhoods through parameters, archetypes, constraints, and seeds; the generator produces consistent geometry and visual representation.

Core principle:

> **Design the city as data; generate the repetitive structure; hand-author only what earns bespoke treatment.**

## 2. Goals

The algorithm must:

- scale from a single garage to thousands of buildings;
- preserve grounded cinematic stylization;
- create clear differences between building uses and districts;
- keep dimensions physically believable;
- produce deterministic output from the same specification and seed;
- support exterior-only, shallow-interior, and fully enterable buildings;
- separate appearance from collision and interaction topology;
- support real doors/windows where interaction or close inspection requires them;
- create inexpensive supporting buildings and richer hero buildings from the same system;
- expose LOD and streaming hooks from the beginning;
- keep React out of per-frame world construction;
- remain compatible with Babylon.js rendering and Rapier collision;
- avoid committing GTD to a fully procedural metropolis before the representation grammar is proven.

## 3. Non-goals

The first implementation is not responsible for:

- autonomous urban planning;
- infinite procedural cities;
- procedural mission design;
- full structural engineering simulation;
- furnishing every room;
- generating final hero landmarks without art direction;
- replacing authored district layouts;
- generating photoreal assets.

Landmarks, mission-critical buildings, Voight's home, police facilities, hospitals, civic buildings, and other narrative anchors may use the generator as a base but can override any layer with bespoke geometry or art.

## 4. Hierarchy

Meridian is represented as a hierarchy.

```text
Meridia
└── Meridian City
    ├── District
    │   ├── Neighborhood
    │   │   ├── Block
    │   │   │   ├── Lot
    │   │   │   │   └── BuildingSpec
    │   │   │   └── public-space specs
    │   │   └── road graph
    │   └── district rules
    └── citywide skyline / infrastructure rules
```

The building generator starts at `BuildingSpec`, but receives contextual rules inherited from the lot, block, neighborhood, and district.

Example:

- South Ward can prefer brick, painted concrete, garages, narrow setbacks, service alleys, and 1–6 floor buildings.
- Meridian Central can prefer podium/tower forms, glass/concrete palettes, large setbacks, and 8–40+ floor buildings.
- Ironworks can prefer broad footprints, corrugated/industrial materials, loading bays, yards, and fewer windows.

The same generator can therefore produce district-specific architecture without separate engines.

## 5. Canonical BuildingSpec

The exact TypeScript shape may evolve, but the logical contract is:

```ts
type BuildingSpec = {
  id: string;
  seed: number;

  placement: {
    position: { x: number; y: number; z: number };
    rotationY: number;
    lotId?: string;
  };

  archetype:
    | "residential"
    | "commercial"
    | "mixed-use"
    | "industrial"
    | "garage"
    | "office"
    | "civic"
    | "hospitality"
    | "parking"
    | "custom";

  massing: {
    width: number;
    depth: number;
    floors: number;
    floorHeight: number;
    groundFloorHeight?: number;

    form?: "slab" | "row" | "podium" | "podium-tower" | "warehouse" | "courtyard";
    setbackFront?: number;
    setbackRear?: number;
    setbackLeft?: number;
    setbackRight?: number;

    podiumFloors?: number;
    towerWidthRatio?: number;
    towerDepthRatio?: number;
    towerOffsetX?: number;
    towerOffsetZ?: number;

    roofType?: "flat" | "parapet" | "pitched" | "shed";
  };

  facade: {
    materialFamily: string;
    palette: string;
    weathering: number;
    variation: number;

    groundFloorStyle?: string;
    upperFloorStyle?: string;

    windowType: string;
    windowWidth?: number;
    windowHeight?: number;
    windowSpacing?: number;
    windowInset?: number;

    trimStyle?: string;
    signageStyle?: string;
    balconyStyle?: string;
  };

  openings: {
    pedestrianEntrances?: number;
    garageDoors?: number;
    loadingDoors?: number;
    storefronts?: number;

    realWindows?: "none" | "hero-faces" | "all-visible-faces";
    doorPolicy?: "decorative" | "physical";
  };

  interior: {
    mode: "none" | "shallow" | "cell" | "multi-cell";
    accessibleFloors?: number[];
    depth?: number;
    roomTemplate?: string;
  };

  physics: {
    collision: "simple-shell" | "segmented-shell" | "detailed";
    cameraBlockers: "shell" | "segmented";
  };

  roof: {
    parapet?: boolean;
    equipmentDensity?: number;
    waterTank?: boolean;
    vents?: boolean;
    antenna?: boolean;
  };

  representation: {
    lodProfile: string;
    maxDetailDistance?: number;
    facadeCardDistance?: number;
    impostorDistance?: number;
  };

  overrides?: {
    bespokeMeshId?: string;
    materialOverrides?: Record<string, string>;
    disabledGeneratorLayers?: string[];
  };
};
```

Not every field is mandatory. Archetype defaults fill most values.

## 6. Archetype defaults

An archetype is a coherent starting grammar, not merely a label.

### 6.1 Residential
Typical defaults:
- moderate floor height;
- repeated window rhythm;
- entrance every one or more bays;
- warmer facade families;
- balconies optional;
- ground floor may be raised or mixed-use;
- shallow roof equipment.

### 6.2 Commercial
Typical defaults:
- taller ground floor;
- storefront glazing;
- signs/awnings;
- wider entrance rhythm;
- upper floors optional;
- more street-facing transparency.

### 6.3 Mixed-use
Typical defaults:
- commercial ground floor;
- residential/office upper floors;
- distinct base/middle/top facade treatment.

### 6.4 Industrial / garage
Typical defaults:
- broad bays;
- large doors;
- fewer windows;
- service yards;
- vents, shutters, loading geometry;
- simple interiors highly valuable.

### 6.5 Office
Typical defaults:
- regular window grids;
- concrete/glass/metal facade families;
- larger lobby;
- podium/tower forms;
- rooftop mechanical equipment.

### 6.6 Civic
Typical defaults:
- stronger symmetry;
- more deliberate entrance hierarchy;
- larger setbacks;
- fewer random variations;
- likely bespoke overrides.

## 7. Deterministic generation

Every building has a stable `seed`.

All optional variation is derived from that seed:
- window color variation;
- grime placement;
- missing/open blinds;
- facade panel alternation;
- rooftop equipment positions;
- AC-unit placement;
- sign selection;
- minor dimension offsets.

The same `BuildingSpec + seed + generator version` must generate the same building.

This matters for:
- saves;
- deterministic testing;
- reproducible screenshots;
- streaming/reconstruction;
- multiplayer or replay possibilities later;
- debugging.

Generated randomness must never use uncontrolled `Math.random()` in production world generation.

## 8. Generation pipeline

A building is generated in ordered layers.

### Stage 1 — validate specification

Validate:
- dimensions > 0;
- floor counts valid;
- openings fit available facade width;
- interior requirements are compatible with massing;
- collision mode is compatible with openings;
- no impossible setbacks;
- no unsupported archetype/material combination.

Invalid specifications fail loudly in development rather than silently producing broken geometry.

### Stage 2 — resolve inherited rules

Merge in:
1. global defaults;
2. district rules;
3. neighborhood rules;
4. archetype defaults;
5. lot constraints;
6. explicit BuildingSpec values;
7. bespoke overrides.

More local data wins.

### Stage 3 — calculate massing

Produce one or more mass volumes.

Examples:

**slab**
```text
████████
████████
████████
```

**podium tower**
```text
   ████
   ████
   ████
████████
████████
```

Massing output includes:
- world-space bounds;
- floor elevations;
- facade faces;
- roof surfaces;
- entrance candidate zones;
- service/rear facade designation.

### Stage 4 — divide facades into bays

Each visible wall becomes a facade grid.

```text
| bay | bay | bay | bay | bay |
| win | win | win | win | win |
| win | win | win | win | win |
| shop|door |shop |shop |door |
```

Bay width is selected from:
- archetype defaults;
- facade dimensions;
- requested opening count;
- minimum structural pier width.

The algorithm must avoid fractional end-bays that produce visibly broken architecture. It may adjust spacing within tolerances or insert wider corner piers.

### Stage 5 — assign facade grammar

Each floor/bay receives a semantic role:
- wall;
- window;
- door;
- storefront;
- garage opening;
- loading opening;
- balcony;
- blank service panel.

Ground floor grammar differs from upper-floor grammar.

Corner buildings can receive independent street-facing grammars on multiple faces.

### Stage 6 — choose physical versus visual detail

For each facade feature:

**Use geometry when**
- it changes silhouette;
- Voight can touch/pass through it;
- oblique viewing exposes flatness;
- it casts an important shadow;
- it is within hero-detail policy.

**Use material/decal/image detail when**
- it is shallow;
- it is repeated;
- collision is irrelevant;
- it is not inspected closely.

Examples:

| Feature | Default |
|---|---|
| main doorway | real opening |
| garage door opening | real opening |
| hero window | inset/real glazing |
| distant window | facade element |
| brick joints | texture/normal |
| grime | texture/decal |
| downpipe | simple geometry near player |
| tiny rooftop vent | geometry only if silhouette-visible |

### Stage 7 — generate structural shell

Create:
- wall segments;
- floor/roof surfaces;
- openings cut by segmentation rather than expensive runtime CSG where practical;
- parapet;
- podium/tower pieces.

Prefer rectangular primitives and merged/static geometry where possible.

The generator should not create one draw call per brick/window.

### Stage 8 — generate windows

Window types are reusable templates.

A `WindowType` defines:
- dimensions;
- frame depth;
- frame material;
- mullion arrangement;
- glass material;
- recess depth;
- whether glass is physical;
- whether camera rays can pass;
- optional blind/interior card.

Window realization levels:

1. **decorative** — facade texture/card;
2. **recessed** — shallow frame + dark/glass surface;
3. **physical** — actual opening segmentation + glass collider;
4. **interior-linked** — physical opening connected to interior cell.

The current First Light garage is the prototype for level 3.

### Stage 9 — generate entrances

Entrances define both appearance and gameplay metadata.

Each physical entrance outputs:
- door/garage geometry;
- collision opening;
- `InteractionAnchor`;
- interior destination/cell reference if enterable;
- navigation portal for future NPC nav;
- camera-transition metadata if required.

### Stage 10 — generate interior representation

Interior mode determines cost.

#### none
Exterior-only. Doors may be locked/decorative.

#### shallow
A few meters of visible interior behind storefront/entrance. Useful for shops that do not require full traversal.

#### cell
One meaningful traversable room or floor. First Light garage uses this concept.

#### multi-cell
Multiple connected rooms/floors. Reserved for important buildings.

Interior geometry is independent from exterior facade detail, allowing an exterior-only building to gain an interior later without rebuilding the facade system.

### Stage 11 — generate collision

Collision uses simplified proxies, never visual mesh complexity by default.

Possible modes:

**simple-shell**
- one or a few boxes;
- exterior-only supporting buildings.

**segmented-shell**
- wall pieces around doors/windows;
- enterable buildings.

**detailed**
- stairs, internal walls, counters, mission geometry;
- only when interaction requires it.

Window glass may collide with Voight while remaining transparent to camera obstruction tests.

### Stage 12 — generate camera blockers

Camera blockers are semantic.

Opaque structural walls:
- block camera.

Open doors:
- do not.

Transparent windows:
- generally do not, unless design requires it.

Roof/ceiling:
- blocks camera where needed to prevent exterior clipping.

This is separate from Rapier player collision.

### Stage 13 — roof generation

Roof grammar may add:
- parapets;
- HVAC blocks;
- vents;
- water tanks;
- antennas;
- access huts.

Density is archetype- and district-dependent.

Roof detail matters increasingly once vertical camera range, helicopters, and rooftop gameplay become active.

### Stage 14 — material assignment and variation

Material families are shared assets.

Examples:
- South Ward warm brick;
- stained concrete;
- painted block;
- dark storefront glass;
- corrugated metal;
- institutional concrete.

A building varies shared materials through:
- tint;
- weathering masks;
- UV offsets;
- decals;
- signage;
- localized grime.

This avoids one unique 4K texture per building.

### Stage 15 — LOD / representation package

Each generated building exposes multiple representations.

**Near**
- full structural shell;
- selected recesses;
- windows/doors;
- decals;
- roof silhouette.

**Medium**
- simplified shell;
- reduced shallow geometry;
- baked/reduced facade material;
- fewer rooftop objects.

**Far**
- simple volume;
- facade atlas/card;
- minimal/no collision.

**Skyline**
- very low-cost mass or impostor;
- atmospheric integration.

A building's interaction representation can remain loaded even while its visual representation changes.

## 9. Building generator outputs

The generator should return a structured object, not just a mesh.

```ts
type GeneratedBuilding = {
  root: TransformNode;

  render: {
    near: AbstractMesh[];
    medium?: AbstractMesh[];
    far?: AbstractMesh[];
  };

  collision: ColliderHandle[];
  cameraBlockers: AbstractMesh[];

  entrances: InteractionAnchor[];
  windows: WindowInstance[];

  interior?: GeneratedInterior;

  bounds: BoundingInfo;
  metadata: {
    buildingId: string;
    archetype: string;
    districtId?: string;
    lotId?: string;
    generatorVersion: number;
  };
};
```

This makes generated buildings usable by future systems:
- missions;
- NPC navigation;
- burglary/investigation logic;
- address system;
- property ownership;
- streaming;
- minimap;
- police response;
- saves.

## 10. Global building object versus per-building objects

The recommended architecture is **not one giant mutable global Building object**.

Instead:

- one global **BuildingGenerator service** defines algorithms and templates;
- one **BuildingCatalog** stores reusable archetypes/material/window/door definitions;
- many lightweight **BuildingSpec** records describe actual city buildings;
- one **BuildingRegistry** tracks instantiated/generated buildings.

```text
BuildingCatalog
      ↓
BuildingGenerator ← DistrictRules
      ↓
 BuildingSpec[]  ← authored city data
      ↓
GeneratedBuilding[]
      ↓
BuildingRegistry / streaming
```

This preserves scalability without putting all city state into one monolithic object.

## 11. Neighborhood and block generation

Once building generation is stable, a block can be described declaratively.

```ts
type BlockSpec = {
  id: string;
  lots: LotSpec[];
  buildings: BuildingSpec[];
  publicSpace: PublicSpaceSpec[];
};
```

A district file can contain hundreds or thousands of BuildingSpecs while remaining small compared with individually modeled geometry.

Templates may reduce repetition:

```ts
building("south-ward-rowhouse", {
  width: 8,
  floors: 3,
  seed: 1841,
  facade: { palette: "oxide-red" }
});
```

## 12. Relationship with the road graph

Buildings must be oriented and placed relative to a semantic road graph rather than arbitrary coordinates alone.

Lots know:
- street frontage;
- service/rear edge;
- corner status;
- sidewalk line;
- curb line;
- driveway access.

This enables the generator to:
- put storefronts on the correct face;
- avoid garage doors opening into walls;
- align entrances with sidewalks;
- create corner-building facades;
- reserve service access;
- keep setbacks coherent.

Road generation and building generation therefore share block/lot data, but remain separate systems.

## 13. Authored variation versus procedural variation

Three kinds of variation are allowed.

### Authored
Meaningful identity chosen by design:
- building use;
- height;
- facade family;
- enterability;
- placement;
- story-specific signage.

### Constrained procedural
Safe visual variation:
- grime;
- window tint;
- rooftop equipment;
- small facade offsets;
- AC units;
- minor sign variants.

### Forbidden randomization
Anything that can damage urban logic:
- arbitrary entrance placement;
- random floor counts ignoring district silhouette;
- garage door opening into a tree/wall;
- random materials that break neighborhood identity;
- inaccessible interior portals.

## 14. Performance doctrine

The building system should reduce, not multiply, runtime cost.

Rules:
- share materials and textures;
- atlas repeated facade components where beneficial;
- instance repeated props/window modules where appropriate;
- merge static non-interactive geometry after generation when safe;
- use simplified collision;
- avoid thousands of individual active meshes for facade repetition;
- stream by block/neighborhood;
- generate deterministic buildings off the main critical path where possible in future;
- preserve LOD hooks from the first version.

Performance budgets remain empirical and device-specific.

## 15. Streaming model

Future city streaming unit: preferably block or small block cluster.

A streamed block:
1. loads BuildingSpecs;
2. resolves district/archetype assets;
3. instantiates near/far representations appropriate to distance;
4. registers physical/interactable buildings when required;
5. unloads visual and physics resources cleanly when outside retention range.

Important interiors can stream independently from exterior shells.

## 16. Asset provenance

Generated geometry is original runtime output.

External/generative inputs used for materials or facade references must retain:
- source;
- license/usage right;
- generation prompt/workflow where relevant;
- modifications;
- final asset ownership/provenance record.

Reference-game screenshots remain inspiration only and are never direct texture sources.

## 17. Failure conditions

The generator has failed if:
- buildings visibly look like uniformly randomized boxes;
- every facade repeats the same grid;
- road-facing entrances appear on wrong faces;
- windows float or penetrate corners;
- collision disagrees with visible openings;
- enterable buildings have camera blockers across open doors/windows;
- massing ignores district skyline;
- generated detail causes excessive draw calls;
- LOD transitions are obvious in ordinary gameplay;
- procedural variation overwhelms neighborhood identity.

## 18. First implementation sequence

The system should be introduced incrementally after First Light has proven the representation grammar.

### BG-0 — data contract
Implement:
- BuildingSpec;
- archetype defaults;
- deterministic seed utility;
- validation.

No visual change required.

### BG-1 — supporting shell generator
Generate:
- rectangular/slab mass;
- floors;
- facade faces;
- repeated window grammar;
- shared materials.

Use current supporting South Ward buildings as regression references.

### BG-2 — openings and interaction
Generate:
- segmented doors;
- physical windows;
- collision shell;
- camera blockers;
- interaction anchors.

Use the First Light garage as the reference case.

### BG-3 — massing families
Add:
- podium/tower;
- warehouse;
- row building;
- corner building;
- setbacks.

### BG-4 — interior modes
Add:
- none;
- shallow;
- cell;
- later multi-cell.

### BG-5 — representation/LOD
Add:
- near/medium/far;
- block streaming hooks;
- batching/instancing policy.

### BG-6 — neighborhood conversion
Replace manually declared First Light support buildings with BuildingSpecs and confirm visual/collision parity.

Only after parity should generator-based expansion accelerate.

## 19. Acceptance criteria

The Dynamic Building Generation Algorithm is accepted when:

1. At least three visibly distinct South Ward building archetypes are produced from data.
2. Building dimensions and facade grammar remain believable at street level.
3. An enterable generated building supports a real opening, interior, collision, camera obstruction, and return to exterior.
4. A non-enterable building is substantially cheaper than the hero building.
5. Repeated generation from the same seed is deterministic.
6. Changing width/height/floors/window type changes the building without code edits.
7. District-level rules visibly influence generated buildings.
8. No generator output breaks the current camera or physics contracts.
9. First Light can be represented substantially through BuildingSpecs rather than bespoke scene code.
10. Performance remains acceptable on the milestone's tested desktop and mobile devices.

## 20. Strategic conclusion

The objective is not procedural generation for its own sake.

The objective is to make **Meridian City authorable at city scale**.

The city should ultimately be described through meaningful high-level data—roads, blocks, lots, archetypes, dimensions, materials, interaction classes, and deliberate exceptions—while the engine manufactures the repetitive physical representation.

This converts development effort from repeatedly constructing individual buildings into continuously improving one reusable architectural grammar.

> **A new building should usually be new data, not new rendering code.**
