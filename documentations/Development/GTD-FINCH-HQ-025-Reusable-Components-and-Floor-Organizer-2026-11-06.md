# GTD-FINCH-HQ-025 — Reusable Interior Components + Floor Organization Function

**Date:** 2026-11-06  
**Owner direction:** Finch HQ cannot require 53 independently modeled and re-exported floor scenes. Build reusable 3D components first, then use an organization function to assemble rooms into a floor.  
**Status:** Floor 3 approved for game preview; component/organizer pilot implemented on an isolated branch. **Scaling to all 53 floors is not yet approved.**  
**Branch:** \`feature/finch-floor53-room-skill-trial-20261106\`  
**Source-of-truth for building:** existing Finch HQ footprint, 53-level elevator, floor slab rings, facade glazing, and G.T.D mission state.  
**Narrative floor purposes:** GTD-FINCH-HQ-023 (53-floor purpose proposal).  
**Review gate:** GTD-FINCH-HQ-024 (AppDeploy evidence and explicit acceptance before exports).  

## 1. Why the former workflow is not scalable

The one-room workflow—manual design, AppDeploy scene, visual review, custom Babylon recreation, new gameplay preview and GLB export—creates substantial repeated work and design drift. A single changed desk model might require recreating a prop in dozens of floors. A layout adjustment may need a new AppDeploy prototype, manual G.T.D translation and re-testing. One ceiling/door fix should instead be made once in a reusable component or organizational rule.

**New target:** One shared *component catalogue*, one pure *organizer*, and two render adapters: an AppDeploy design-review adapter and a Babylon/Rapier G.T.D runtime adapter. Both must consume the **same versioned floor manifest**. Do not manually reconstruct accepted AppDeploy geometry a second time.

## 2. Architectural layers

\`\`\`text
53-floor purpose registry + approved room grammars + immutable floor seed
                      │
                      ▼
             Organization function
   ├─ floor geometry and lift/door constraints
   ├─ room zoning and corridor graph
   ├─ furnishing recipes / semantic attachments
   ├─ lighting fixtures and support anchors
   └─ generated normalized FloorManifest JSON
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
  AppDeploy 3D reviewer       G.T.D Babylon/Rapier
  (Function/Form gate)        (runtime/gameplay gate)
        │                           │
        └──── approved manifest ────┘
                      │
                      ▼
         Export / reusable GLBs / assets
\`\`\`

**Rule:** A review and a game runtime must show the same geometry and dimensions for a given manifest hash. If the two diverge, reject the export. The approved review is not permission to deploy a different independently authored room.

### 2.1 Components

Components are reusable semantic pieces: desk, task chair, dining table group, counter, shelving unit, partition section, door, kitchen/pantry bench, sofa, planter, rug, wall lamp, pendant, ceiling grid, monitor array, room signage. Every component declares:
- Stable ID, version, category and dimensions in meters.
- Origin, front direction, floor/wall/ceiling attachment face.
- Visual primitives or accepted optimized GLB, material/color variant.
- Contact envelope, collider policy, chair clearance and support requirement.
- Placement constraints: along a wall, centered in a zone, facing a feature, etc.
- Shared geometry key and runtime budget.

A component is not a room: a café counter can serve 30 cafes and a desk can serve hundreds of offices. Update its visual/collision definition once and all compatible floors update after controlled version migration.

**Current pilot code**:
- \`src/game/interiors/room-components-024.ts\` — shape/size catalogue independent of Babylon.
- \`src/game/interiors/organize-floor-024.ts\` — generic zone-to-component arrangement, validation, stable floor seed and room graph connectivity.
- \`src/game/experiments/finch-hq-floor3-program-024.ts\` — Floor 3 recipe derived from accepted AppDeploy concept.
- \`src/game/experiments/finch-hq-floor3-cafe-024.ts\` — lazy Babylon/Rapier adapter for approved Floor 3 trial.
- \`src/game/experiments/north-heights-finch-suite-005.ts\` — lifecycle integration; \`north-heights-city-8.ts\` supplies player-level update.

**Current technical limitation:** The original AppDeploy Floor 3 prototype was constructed separately in Three.js, so visual parity remains a required QA check. The next tooling milestone is a manifest serialization bridge that supplies both adapters without re-authoring the scene.

## 3. Organization function (proposed final API)

\`\`\`ts
type FloorInput = {
  buildingId: string;
  floor: number;
  purposeId: string;
  purposeGrammar: GrammarId;
  floorEnvelope: Polygon2D;
  shaftPolygon: Polygon2D;
  windows: readonly WindowSpan[];
  palette: FloorPaletteId;
  componentLibraryVersion: string;
  organizerVersion: string;
  seed: number;
};
type FloorManifest = {
  floorId: string;
  version: string;
  checksum: string;
  zones: RoomZone[];
  doorOpenings: ActualDoorOpening[];
  navigationGraph: Connection[];
  placements: ComponentPlacement[];
  fixtures: LightFixture[];
  physicalContacts: ColliderRecipe[];
};
function organizeFloor(input: FloorInput): FloorManifest;
\`\`\`

The function must:

1. Read the **real** width/depth, slabs, elevator opening, support height, facade window bays and story height, not hand-tuned mock coordinates.
2. Reserve the lift landing and a walkable corridor before placing props.
3. Map purpose to room grammars: office, conference, library, hospitality, studio, classroom, lab, operations, service or lobby, with Floor 53 as a curated protected suite.
4. Divide the useable floor into semantic rooms, then generate **real** doors and partition holes. The graph must connect every accessible room to the elevator and adjacent public corridor.
5. Place components from attachment/clearance rules; avoid trapped chairs, counters blocking windows, floating fixtures, false doors, and collisions with narrative NPCs.
6. Choose deterministic controlled variety based on the floor and template version. Same seed/version must reproduce identical geometry after refresh and re-entry.
7. Emit immutable JSON with every visual primitive, collision plan and light/fixture position grounded in the same layout.
8. Reject invalid plans rather than silently inserting furniture into corridors. A small connected fallback room is preferable to a visually detailed, unusable floor.
9. Never mutate Floor 53's curated Finch mission anchors, elevator or game controls.

## 4. Faster approval strategy: grammar families, not 53 manual builds

**Recommended review model (subject to owner approval):** Validate **a canonical design for each room grammar**, then assemble every floor from approved components and grammars automatically. Visual QA should use batch floor review with anomaly inspection and targeted spot checks, not require a fresh development iteration for every floor.

Initial reference suite:
- Floor 3 → hospitality / service / meeting (current accepted concept and game pilot).
- Floor 16 → multi-room office / software workstations.
- Floor 28 → operations / monitor wall / analyst zones.
- Floor 34 → laboratory / benches and equipment.
- Floor 45 → library / archival shelving.
- Floor 53 → protected curated exception; never regenerated.

The remaining lobby, studio, classroom and service families receive one reusable quality reference. Once a grammar passes, e.g. an office template, it can be combined in distinct ways on any office-designated level with the same components. Program data can be changed without rewriting the 3D rendering functions.

**Batch review UI proposal:** A single AppDeploy portal with floor dropdown, top-down plan, walk camera, ceiling inspector, window-view check and a diff/defect panel. Designers can compare all 53 manifests, group by grammar, spot layout outliers, and approve family-level changes without opening 53 separate preview sites. Approved manifest hashes can be exported in one batch. 

## 5. Performance and correctness

- Do not construct all 53 detailed room meshes at load. Keep only the occupied floor active and optionally prewarm the elevator destination.
- Reuse source meshes/materials and instantiate repeated props; no new high-poly GLB per table, monitor, cabinet or chair.
- Rapier contacts use the same transforms as the renderer and exist only for loaded floor content. Authoritative structural slabs remain unchanged.
- No new colliders in the glass elevator core; no redundant support floors or opaque window sheets.
- Minimum project target: 2.4m unobstructed primary arrival where geometry permits, 1.2m corridors and 0.9m door clearances. Test against actual Reese capsule and third-person camera.
- Upper-floor lighting requires a visible attached fixture; keep dynamic light counts bounded (Floor 3 pilot uses 3 shadowless practicals).
- Test mesh count, draw calls, frame-time p95, transform parity, deterministic regeneration, memory retention, elevator connectivity, mobile rendering and floor transitions.
- No Meshy billing or external paid asset generation without separate authorization and approved asset manifests.

## 6. Pilot implementation completed versus pending

| Capability | State |
|---|---|
| Owner-approved Floor 3 AppDeploy Function concept | Accepted |
| Reusable procedural component catalogue | Implemented on branch |
| Pure zone/rule organization function | Implemented on branch |
| Floor 3 G.T.D adapter with actual floor/shaft elevations | Implemented on branch, gameplay preview pending |
| Lazy Floor 3 props, light and collider lifetimes | Implemented on branch, runtime acceptance pending |
| Tests for room graph, deterministic assignments, collisions | Committed; deployment validation pending |
| Universal AppDeploy↔Babylon shared manifest exporter | **Not yet implemented** |
| Automatic 52-floor generator and batch review portal | **Not yet implemented / owner approval needed** |
| GLB export of accepted Floor 3 geometry | **Not yet performed** |
| Merge to main or production release | **Not authorized** |

## 7. Proposed next gate

1. Validate Floor 3 in actual G.T.D (elevator, feet/tile contact, café rooms, real doorway passage, materials, lighting, resource cost).
2. Approve the component catalogue / organization architecture.
3. Build the common manifest pipeline and one AppDeploy **multi-floor** review portal.
4. Prove two dissimilar grammar families (Floor 16 office, Floor 28 operations) without hard-coding room-specific Babylon meshes.
5. Only then authorize floor-program batch generation and reuse throughout the tower.

All 53 functional purposes in GTD-FINCH-HQ-023 remain the program proposal, not authorization to materialize 52 unreviewed layouts.
