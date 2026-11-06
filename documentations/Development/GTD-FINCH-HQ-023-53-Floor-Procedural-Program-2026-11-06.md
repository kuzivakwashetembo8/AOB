# GTD-FINCH-HQ-023 — Finch Headquarters 53-Floor Program and Procedural Interior Engine
## Comprehensive Technical Implementation Plan — PROPOSED / NOT APPROVED

**Date:** 2026-11-06  
**Status:** PROPOSED / OWNER REVIEW REQUIRED. This document is not approval to populate interiors or merge into main.  
**Pilot branch:** `feature/finch-floor53-room-skill-trial-20261106`  
**Reference:** The reviewed floor-53 proof contains Finch's mission trigger, furnished office, library, lounge and original glass lift. Its outstanding carpet correction is a separately tracked polish defect, not an acceptance signal for citywide room generation.
**Explicit approval boundary:** The owner has requested documentation for review, **not** room-generator implementation, a new mission, access locks, a merge, or production deployment. The existing 53-level floor-skin/glazing trial is a separate preview currently being tested.
**Architectural parent:** `GTD-INT-001` (Meridia fully enterable interiors) governs cross-building behavior; this `GTD-FINCH-HQ-023` plan is the Finch-HQ-specific implementation contract and pilot.

## Direction

- All 53 floors share exactly the same **tile geometry, tile size, grout pattern and material family**, differing **only in floor palette**. Visual skins do not replace or duplicate the existing white Rapier floor slabs. The accepted existing lift cutout remains at every upper floor.
- All Finch HQ facade glazing is visually clear, without dark blue opacity/strong reflection masking city visibility. Preserve the facade's real square apertures and align upper edges; retain the existing main entrance opening.
- Floor 53 is a **protected, curated suite** and its existing Finch actor, mission assignments, interaction radius and elevator coordinates must remain unchanged.
- The other 52 floors must **not** be hand-built. A deterministic procedural system constructs them from program, semantic room grammars, floor footprint, and existing building/elevator geometry.
- This program is intentionally a **fictional mixed-tenant office tower**. Public, commercial and ordinary tenant floors provide a plausible front to the restricted upper levels. Access tiers are narrative zoning suggestions, **not** authorization to lock floors or prevent player exploration.

## Per-floor program (proposal)

| Floor | Proposed purpose | Room grammar | Access concept |
|---:|---|---|---|
| 1 | Public reception and entry | lobby | Public |
| 2 | Building security and visitor verification | operations | Controlled |
| 3 | Café and casual meeting area | hospitality | Public |
| 4 | Visitor waiting and interview rooms | lobby | Public |
| 5 | Conference and event suite | conference | Public |
| 6 | Facilities control and building services | service | Staff |
| 7 | Tenant reception and shared workspaces | office | Tenant |
| 8 | Legal practice and consultation rooms | office | Tenant |
| 9 | Accounting and finance offices | office | Tenant |
| 10 | Insurance services offices | office | Tenant |
| 11 | Business consulting offices | office | Tenant |
| 12 | Architecture and design studio | studio | Tenant |
| 13 | Marketing and creative offices | studio | Tenant |
| 14 | Communications and public relations | studio | Tenant |
| 15 | Recruitment and human resources offices | office | Tenant |
| 16 | Start-up and software co-working | office | Tenant |
| 17 | Training and seminar classrooms | classroom | Tenant |
| 18 | Media production and editing suite | studio | Tenant |
| 19 | Executive boardrooms and meeting suites | conference | Tenant |
| 20 | Tenant lounge and amenities | hospitality | Tenant |
| 21 | IT helpdesk and device support | service | Staff |
| 22 | Software engineering workspace | office | Staff |
| 23 | Software testing and QA laboratory | lab | Staff |
| 24 | Product research and UX studio | studio | Staff |
| 25 | Network operations monitoring | operations | Staff |
| 26 | Analytics and reporting floor | office | Staff |
| 27 | Mapping and geospatial analysis | operations | Staff |
| 28 | Cybersecurity operations centre | operations | Controlled |
| 29 | Digital forensics workspace | lab | Controlled |
| 30 | Incident response coordination | operations | Controlled |
| 31 | Applied technology research | lab | Controlled |
| 32 | Reference library and reading rooms | library | Staff |
| 33 | Technical archives and documentation | library | Controlled |
| 34 | Hardware design and prototyping | lab | Controlled |
| 35 | Device evaluation and test labs | lab | Controlled |
| 36 | Data infrastructure control rooms | operations | Controlled |
| 37 | Resilience and continuity operations | operations | Controlled |
| 38 | Secure document processing | service | Controlled |
| 39 | Compliance and audit offices | office | Controlled |
| 40 | Executive support administration | office | Controlled |
| 41 | Personnel and organizational services | office | Controlled |
| 42 | Supplier and procurement offices | office | Controlled |
| 43 | Strategy and policy planning | office | Controlled |
| 44 | Private conference and negotiation rooms | conference | Restricted |
| 45 | Restricted records archive | library | Restricted |
| 46 | Secure communications hub | operations | Restricted |
| 47 | Intelligence assessment rooms | operations | Restricted |
| 48 | Systems integration and control | lab | Restricted |
| 49 | Special operations planning | operations | Restricted |
| 50 | Surveillance review and analysis | operations | Restricted |
| 51 | Mission coordination and briefing | conference | Restricted |
| 52 | Private study, quiet research and library | library | Restricted |
| 53 | Harold Finch's established office and library | curated-suite | Restricted |

## Proposed reusable room grammars (10)

1. `lobby`: security counter, clear entry aisle, waiting groups, signage, public circulation.
2. `office`: desks, manager cabins, small break space, shared meeting room, storage.
3. `conference`: configurable seating, presentation screens, breakout rooms, circulation.
4. `hospitality`: café counters, dining, lounges, restrooms, public seating.
5. `studio`: media/editing equipment, creative desks, production tables.
6. `classroom`: learning desks, teaching wall, whiteboards, small training support.
7. `lab`: workshop stations, benches, cabinets, safe transit corridors.
8. `operations`: monitors, analysis desks, large planning displays, incident tables.
9. `service`: controls, cabinets, maintenance support, equipment access.
10. `library`: shelves, archives, reading tables, quiet study or secure records.
11. `curated-suite`: Floor 53 only; entirely exempt from procedural replacement.

## Generation architecture to propose before implementation

- Data contract: `BuildingId + floor(1..53) + purpose + grammar + palette + stableSeed + generatorVersion`. A fixed map of 53 **purposes** is configuration, not 53 hand-authored room meshes.
- Read true building footprint, facade/window columns, actual floor elevation, real shaft cutouts and elevator exits. Reserve a >=2.4m arrival aisle from the lift before partitioning.
- Partition only accessible footprint around the shaft; derive corridors and door openings from one room-plan graph. Every visible door must lead to a genuine walkable destination; do not generate false door facades. Use room purpose to determine appropriate furnishings and surface treatment.
- Deterministic seeds based on immutable building+floor+room+grammar version; produce different layouts between floors but regenerate unchanged layouts when returning.
- Reuse the same furniture meshes and GLB sources across rooms; varied materials/rotation/density achieve diversity without hundreds of new unique GLBs. No paid external asset generation without separate approval.
- Render just current floor + next reachable floor as player approaches or rides elevator; free GPU resources and room-level physics for distant floors. The already-authored white slabs, shaft and transparent facade remain permanent.
- Create stable Rapier barriers for active rooms, protect elevator cabin movement, prevent dead corridors and furniture blocking mission/NPC interactions, and retain the current third-person gameplay camera.
- Floor 53 overrides (fully furnished and mission-active) remain unchanged. Floors 1–52 use procedural grammar. A program change requires an explicit generator version migration to avoid silently reshuffling existing rooms.
- Acceptance stages: (A) visual floor skins and clear glazing on actual game; (B) owner-approved floor program; (C) generate **one** representative lower floor (recommended Floor 16); (D) test elevator arrivals, contact/collision, quality and performance; (E) gradual floor activation; (F) citywide interior system separately.


---

## 4. Design decision and boundaries

**Decision proposed:** Implement Finch HQ as a **single deterministic building interior system** whose 53-floor purpose registry controls room selection, not as 53 handcrafted environments or 53 simultaneously loaded 3D scenes.

The already rendered structure, city simulation, tower identity, valid glass elevator, NPCs, mission dialogues, facade, floor ring, and player movement remain authoritative. Room generation supplies *only* authored logical floor plans, interior partitions, furnishing instances, decorative lighting, and their matching collisions.

1. **One building, one configuration source:** \`NH-04-06-L2\`, 53 floors, existing width ~22.669 m and depth ~33.889 m. Use actual \`lot.overrides\`, not these approximate measurements in renderer code.
2. **Immutable floor assignment:** The 53-row table above is the **initial program proposal**; accept it as data before room generation starts. No floor is randomly re-zoned at runtime.
3. **Variable room layout:** Each floor's grammar outputs rooms of plausible sizes and purposes with a stable seed. Different floor plans remain deterministic and revisit-safe.
4. **Visual baseline:** Identical tiled geometry across floors, with color-only variations; city-visible glazing on Finch HQ. Existing structural slabs and elevator holes are retained without collision duplication.
5. **Accessibility:** **Every defined floor and room is enterable** through an actual door and reachable from the existing glass elevator. The Access column above is fictional organizational context only. It does not authorize locked floors, missing doorways or invisible blockers.
6. **Special override:** Floor 53 is **not procedurally partitioned**. The Finch encounter, Finch.glb, desk grouping, library, lounge and mission trigger remain curated. The incomplete carpet refinement is handled as a separately reviewable visual correction.
7. **No paid asset generation:** Stage 1 uses Babylon.js procedural geometry and already approved/reusable GLBs. External Meshy generation, purchases and API spending require an independent function/asset gate and explicit spend permission.
8. **No scenario expansion:** No new mission logic, mission progression, surveillance functionality, security interactions, NPC staffing, background computing or plot changes as part of this plan.

### 4.1 Meaning of “dynamic”

- **Dynamic configuration:** 53 purposes selected by immutable floor IDs from the registry, not manually placed furnishings.
- **Dynamic planning:** Partitions, doorways, service spaces and circulation graph generated from footprint, shaft exclusions, and grammar constraints.
- **Dynamic furnishing:** Props selected from reusable asset families and fitted to the generated room footprint, anchors and purpose.
- **Dynamic runtime:** Room instances and their optional physics/light sources created near the player, recycled after leaving, and restored identically.
- **Not dynamic:** Flooring geometry, structural support slab positions, elevator shaft coordinates, Finch mission anchor, floor identities, or procedural room layout spontaneously changing when revisited.

## 5. Purpose to room-program mapping

The fixed purposes in the 53-floor table should choose from **ten reusable grammar families**, with \`curated-suite\` used only by Floor 53. These are specializations of the **six approved Meridia interior categories** (Office, Apartment, Shop, Public/Lobby/Corridor, School, Factory). They are not a new citywide taxonomy. A lab or monitoring floor is an *office/service specialization*; a café is a *shop/public specialization*.

| Grammar | Source category | Required functional modules | Optional modules | Signature furnishing | Navigation and visibility |
|---|---|---|---|---|---|
| \`lobby\` | Public | lift landing, reception, public waiting, corridor, washroom/service space | interview cubicles, directory | counter, grouped seats, signage, planters | unobstructed lift-to-reception route; no faux exits |
| \`office\` | Office | shared work area, private office, small meeting room, storage, service | kitchenette, printer room | desks, monitors, storage units, partitions | chairs face work surfaces, usable chair/door clearance |
| \`conference\` | Office/Public | entry, meeting hall, AV wall, breakout area, service/storage | private boardroom | tables, seats, screen, acoustic panels | sightlines to presentation, accessible perimeter |
| \`hospitality\` | Shop/Public | customer seating, counter, prep/service, washroom, circulation | café terrace-facing seating | counter, tables, stools, menu, shelving | service behind counter, customer aisle separate |
| \`studio\` | Office | open studio, edit/design booths, review room, storage | camera set | work benches, displays, rig props, cabinets | keep workstation access and studio sightlines |
| \`classroom\` | School | teaching wall, desk clusters, corridor, staff/storage | computer lab | student desks, teacher station, boards | clear rows, screen visibility, room-to-door route |
| \`lab\` | Office/Factory | benches, instrument area, controlled storage, meeting/control zone | calibration room | instrument benches, cabinets, test rigs | no props across paths, context-aware safety zoning |
| \`operations\` | Office | shared monitoring/control desks, briefing table, wall displays, service | private analysis room | monitor arrays, display walls, task lights | preserve reading distance and walkway to every station |
| \`service\` | Public/Office/Factory | maintenance or support area, equipment/storage, secure office, service corridor | dispatch desk | racks, utility cupboards, desks | do not model functional elevators/shafts as rooms |
| \`library\` | Public/Office | shelves, reading places, catalogue/archive, study or support | rare-record archive | shelving, reading tables, table lamps | aisles sized to player/camera; no impenetrable bookcases |
| \`curated-suite\` | Protected override | existing Floor 53 Finch office | none procedurally | accepted office furniture | mission and camera behavior unchanged |

### 5.1 Per-zone functional character

**Floors 1–6: Public arrival and services.** Floor 1 retains the pre-existing reception and real glass-elevator entrance. Floor 2 is an open, explorable visitor/security check-in area (not a gameplay lock). Floors 3–5 are visitor destinations with functional circulation to café seating, interviews and events. Floor 6 is an equipment/support floor with believable utility rooms and a service desk.

**Floors 7–20: Tenant offices and hospitality.** Tenants share common corridor logic but differ in purpose-specific desk density, meeting-room proportion, furniture, acoustic partitions, materials and object grouping. Avoid sixteen floors of identical “desk grids.” Floor 16 is the recommended first generated reference because it exercises office partitions, shared workstations and a meeting zone without complex machinery.

**Floors 21–30: Computing and operational work.** Use the same building footprint and elevator, but replace generic meeting-heavy zoning with controlled workstation arrangements, shared monitor groups, laboratories and incident rooms. Special monitoring screens may be decorative/inert initially; they must not imply a live external data feed.

**Floors 31–43: Research, services and administration.** Mix bench/drawer, reading/stacks, office and service grammars. Keep industrial-looking equipment restrained within believable office-tower room heights and the existing 3.1–3.35m storey constraints; do not create a two-storey factory inside a single tower floor.

**Floors 44–52: Restricted fictional operations.** Make rooms feel quieter and more private with appropriate lighting, circulation and props, but **do not lock doors or restrict Reese**. No story-driven security checkpoints until explicitly approved. Floor 52's study/library aesthetic may share curated furniture materials with Floor 53, but its partitions remain generated.

**Floor 53: protected Harold Finch suite.** Existing mission position, dialogue, camera/third-person play, furniture and character remain curated. Generator sees \`protectedOverride: "finch-floor53"\` and must never add walls, spawn random workstations, move Finch or restyle the suite.

### 5.2 Controlled variations

For each grammar define **room-count bands** and **density envelopes** rather than random object counts. Example indicative floor plans, to be tuned to actual useable area:

| Example | Program composition | Variation knobs |
|---|---|---|
| Floor 3, café | counter/prep, seating, service, washroom/corridor | table groups, color palette, counter placement |
| Floor 12, design | open studio, 2–3 work pods, critique room, storage | collaborative table layout, displays, partitions |
| Floor 16, software | work area, 1–2 enclosed offices, meeting room, kitchenette/service | desk clusters and screens, room orientation |
| Floor 28, cybersecurity | monitoring bullpen, briefing room, analyst alcoves, service | console grouping, screens, task lights |
| Floor 34, hardware | work benches, sample cabinets, test room, meeting/office | bench distribution and cabinet density |
| Floor 45, archive | shelving, retrieval area, reading desks, records office | shelf modules, aisle topology, lighting |
| Floor 52, study | private library, seating, desk/study, reading niches | shelf depth, lounge mix, desk position |
| Floor 53, Finch | existing office and mission assets | **no procedural variations** |

Each floor uses the same tile pattern; only the approved \`tilePaletteIndex\` differs. Furnishings may vary under controlled grammar rules, but flooring may not acquire a different tile size or geometry without a new decision.

## 6. System architecture and proposed source tree

**Do not implement until the owner approves this plan.** Names below are recommended file boundaries, not already-existing files.

\`\`\`
src/game/interiors/
  types-001.ts                  # stable IDs, rooms, doors, partitions and anchors
  deterministic-seed-001.ts     # stable hash and random stream
  floor-planner-001.ts          # pure TypeScript 2D partition/door graph
  room-grammar-001.ts           # purpose-specific subplans and furnishing placement
  room-assets-001.ts            # reusable procedural meshes and opt-in GLB catalog
  renderer-001.ts               # Babylon geometry, batch/instances and disposal
  colliders-001.ts              # Rapier wall/door/furniture contact maps
  room-lighting-001.ts          # low-cost contextual practical lights
  interior-streamer-001.ts      # prefetch/activate/unload state machine
  interior-persistence-001.ts   # saved deltas and schema version migration
  diagnostics-001.ts            # load, performance, error, and memory metrics
src/game/experiments/
  finch-hq-floor-program-024.ts # exactly 53 fixed floor program entries
  finch-hq-interiors-024.ts     # thin Finch-HQ-specific adapter, not the engine
src/test/
  finch-floor-program-024.test.ts
  finch-interior-planner-024.test.ts
  finch-interior-streaming-024.test.ts
  finch-interior-gameplay-024.test.ts
\`\`\`

**Relationship to existing code:**

- \`north-heights-reconstruction-001.ts\` — authoritative \`Lot\`, shell, facades and support slabs. The engine reads, never re-creates, the geometry contract.
- \`north-heights-finch-elevator-structure-004.ts\` — authoritative \`finchShaft004\`, 53-floor count, \`finchFloorRing004\` and actual elevator cutout.
- \`north-heights-finch-lobby-004.ts\` — existing glass-cabin travel and floor selection; integrate through a small observe/prefetch hook without replacing the current lift.
- \`north-heights-finch-suite-005.ts\` — protected curated Floor 53 and mission anchor.
- \`north-heights-finch-floor-surfaces-023.ts\` — already proposed/deployed-to-preview 53-floor visual tile treatment. **Do not clone this work inside the interior generator.**
- \`north-heights-city-8.ts\` — own the engine integration lifecycle and update loop through one thin adapter, not floor-specific patches to the controller.
- \`north-heights-physics-005.ts\` — existing Rapier physics supports floors, shafts and player; add only actual generated partitions and necessary near-field furniture contacts.

### 6.1 Versioned floor-program contract

\`\`\`ts
type FinchFloorNumber = number; // validate integer in [1, 53]
type ProgramGrammar =
  | "lobby" | "office" | "conference" | "hospitality"
  | "studio" | "classroom" | "lab" | "operations"
  | "service" | "library" | "curated-suite";
type AccessDescriptor = "public" | "tenant" | "staff" | "controlled" | "restricted";
type Region2D = Readonly<{ vertices: readonly [number,number][] }>;

type FinchFloorPurpose = Readonly<{
  floor: FinchFloorNumber;
  purposeId: string; // stable e.g. "finch-f16-software"
  displayName: string;
  primaryGrammar: ProgramGrammar;
  secondaryGrammars: readonly ProgramGrammar[];
  accessDescriptor: AccessDescriptor; // narrative, not access enforcement
  tilePaletteIndex: number;
  protectedOverride?: "finch-floor53";
}>;

type InteriorFloorPlan = Readonly<{
  schemaVersion: 1;
  planVersion: string;
  buildingId: string;
  floor: FinchFloorNumber;
  supportY: number;
  elevatorOpening: Region2D;
  arrivalRegion: Region2D;
  outerFootprint: Region2D;
  circulationGraph: readonly {from:string;to:string}[];
  rooms: readonly InteriorRoomPlan[];
  doors: readonly InteriorDoor[];
  props: readonly InteriorPropPlacement[];
  lights: readonly InteriorLightFixture[];
}>;
\`\`\`

Proposed runtime accepts \`Readonly<FinchFloorPurpose>\` as an input. The program registry is the *only* authoritative list; preview UI, floor metadata and tests consume it. A \`Map<floor, plan>\` may cache current plans but is not a second source of truth. Stable \`purposeId\` survives changes to displayed labels.

**Versioning:** \`seed = hash("GTD-NH", buildingId, floor, purposeId, grammarVersion)\`. Separate geometry and palette versions. A saved floor retains the original generator version or a migrated authored snapshot, not a new layout every time a deployment changes.

### 6.2 Deterministic plan and collision parity

One pure TypeScript planner should output polygons and authored anchors in the local building coordinate system. Its renderer and collider builder both consume the **same** placement and transform data. Every door's visual opening must equal its navigable gap and its Rapier gap.

\`\`\`text
lot + floor purpose + version
          ↓
true footprint - lift shaft - structural exclusions - window bays
          ↓
reserve lift landing + route spine + protected regions
          ↓
partition residual space into semantic rooms
          ↓
place doors → verify connected circulation graph
          ↓
place furnishings and required path clearances
          ↓
validate all bounds and topology
          ↓
Babylon view + Rapier contacts + streamed fixture/light handles
\`\`\`

1. Resolve per-floor **actual support elevation** from the existing Finch elevator/floor ring. Floor 1 is the current ground lobby; floors 2–53 are the already-authored upper levels. Do not guess floor elevations from a visual tile mesh.
2. Start from the true local footprint and subtract the **full elevator shaft rectangle**, existing exterior framing/wall material, and any protected actor/camera zones. Never write a floor across the shaft.
3. Reserve the lift landing first. Target **>=2.4m** initial navigable arrival channel, narrowed only if real geometry makes the target impossible and an exception is reviewed.
4. Construct a corridor graph before partitions. Recalculate path widths using Reese's actual Rapier capsule and third-person camera envelope. Working floor corridors aim for **>=1.2m** clear path; **>=0.9m** door clear openings. These are project targets, not claims of building-code compliance.
5. Partition the remaining area with bounded deterministic rectangular splits; create an appropriate mixture of public and private rooms. Do not allow room overlap, zero-area partitions, disconnected corridors or self-intersecting polygon paths.
6. Identify which walls abut exterior window bays. Prioritize meeting rooms, work areas and lounges on real glazed facades; place service/storage rooms farther inside. Never put shelves across all windows just to maximize furniture count.
7. Create true door holes using wall segments/Boolean cuts; give each opening an ID, lintel/jamb where appropriate, destination room and matching Rapier boundary. A visually closed wall with a missing collider or a visual opening with a blocking collider is **release-blocking**.
8. Reserve mandatory furniture contact/interaction envelopes and compute top-down 2D overlap before object placement. Reject or omit a noncritical prop rather than squeezing the path; no arbitrary physics pushes after generation.
9. Validate the graph from the elevator to **every room**. If a candidate layout fails, retry using the same bounded seed stream. If retries exhaust, fall back to a **single connected functional room**, never a sealed decorative corridor.
10. Floor 53 short-circuits generation: return the existing curated suite unchanged.

## 7. Shared object library and visual standard

The room's distinctive identity should come primarily from **layout, functional grouping, lighting and a small reusable asset catalog**, not from thousands of unique assets.

**Tier A — shared procedural objects:** basic walls, partitions, desks, shelving, simple chairs, conference tables, worktops, lamps, rugs, framed screen planes, cabinets, counters, washroom fixture proxies and small clutter. Reuse shared \`StandardMaterial\` / \`PBRMaterial\` by asset family and palette; use instancing or thin instances for repeated noninteractive static props where appropriate.

**Tier B — opt-in curated assets:** use existing vetted GLBs for high-salience shapes that look implausible as primitives (upholstered chairs, couches, complex lab machines, monitors or specialty furniture). Record provenance/licensing, native dimensions, forward axis, attachment face, triangle and material counts, size, memory and Android decoding cost. Only import after specific visual acceptance.

**Tier C — future Meshy generation:** not part of the present approval. Asset concept and paid spend must pass the installed Build 3D Game Rooms Function and Asset Generation gates separately. Never infer a Meshy spending authorization from “proceed with interiors.”

**Theme continuity:** Finch HQ uses the same believable earth-tone office vocabulary as Floor 53, with purpose-specific details and color variations. Preserve see-through exterior glazing, furniture grounding and ceiling-light attachment. Avoid misplaced floating lights, carpets ending in empty space, chairs facing walls, repetitive deserted “showroom” layouts and unlit active fixtures.

### 7.1 Lighting

- **Existing architecture:** keep North Heights global sky, city sunlight and day/night behavior; no per-floor artificial sky.
- **Authored fixtures:** semantic manifest entries include location, orientation, fixture shape, wall/ceiling/floor support, intensity, range, falloff, color temperature and day/night rules.
- **Only active floor lights are live.** Use a small number of dynamic practicals per loaded area; use emissive materials, material variation or lightweight baked treatments for decorative strips and deep corridor ambient cues.
- **Visually attached:** lamp feet on finished floor, sconces touching real walls, and ceiling pendants suspended from valid roof/ceiling supports. A luminous rectangle floating in a window is not acceptable.
- **Time states:** office daylight has plausible ambient and subdued practicals; nights shift to warm task lights, but **glass remains transparent** enough to see the city. Validate against city skyline by day and at night.

## 8. Runtime streaming and resource ownership

**Premise:** All floors and rooms exist as stable logical records. Only a small subset has furnished 3D content in memory at any one time.

The initial Finch-only streamer should implement:

\`\`\`text
UNLOADED ─→ PLANNED ─→ PREWARMING ─→ STRUCTURE_READY ─→ VISIBLE
                 ↑                             │           │
                 └────────── DISPOSED ←─ COOLING ←─────────┘
\`\`\`

| Trigger | Action | Hard guarantee |
|---|---|---|
| Reese approaches HQ/lobby | prewarm Floor 1 entry plan | existing front door, receptionist and elevator remain functional |
| Elevator target is selected | plan/prefetch destination floor during existing elevator transit | no teleport into an unbuilt room, no change to travel duration |
| Elevator arrives | activate destination corridor, doors and required collision | player can walk through the real door and stand on the existing slab |
| Reese enters a room | load high-fidelity near-room props, contacts, practical lights | avoid pop-in in camera view; no invisible collision |
| Reese leaves the floor | cool and release old room meshes, fixtures, lights and disposable colliders | stable floor plans persist; no leak |
| Reese returns | regenerate from same IDs/version + saved deltas | same room identity and layouts |

**Bounded resources:** One active floor, with a small prewarmed destination and/or doorway-adjacent area. Maintain existing city/traffic rendering during lift travel. Avoid eagerly instantiating all 52 procedural floor scenes. Existing all-level tile skins and facade remain static; do not unload structural slabs.

**Cancellation and lifecycle:** A monotonically increasing request token prevents late asset loads from attaching to a disposed floor. Reference-count shared materials/GLBs; unload per-floor instances without disposing shared sources. Free Rapier handles exactly once. Handle fast successive elevator destinations, refresh, pause/resume and session exit.

**Level-of-detail:** Structural boundary geometry on the active floor remains correct even if furniture has not finished loading. Decorative instances may initially appear at lower detail, but never allow passing through unbuilt required walls or corridors. No glowing proxy dots or temporary random furniture.

## 9. Persistence, save compatibility and diagnostics

The planner emits reproducible geometry from stable seeds. Only changes caused by the player or mission logic (if later introduced and approved) require persistent deltas. At this stage, generated furniture is static: returning to a floor must reconstruct the same layout without storing thousands of object transforms.

Persisted metadata should include \`buildingId\`, \`floor\`, \`generatorVersion\`, \`purposeId\`, \`planHash\` and any state delta. Reuse the existing game save facility; do not scatter unrelated \`localStorage\` keys. Save/resume must survive refresh, page hide/show and the existing PWA offline behavior. Ship a version migration or explicit fallback for incompatible snapshots.

Diagnostics should count build duration, activation duration, current floor, planned rooms, loaded meshes, thin-instance count, material/texture leases, live lights, collider count, draw calls and frame-time deltas. Surface **no persistent debug export panel** during gameplay. Keep concise development logging and optional internal diagnostics.

## 10. Performance budgets — targets for owner approval, NOT measurements

The following are proposed acceptance targets, **not achieved benchmarks**:

| Dimension | Proposed budget / requirement | How tested |
|---|---|---|
| Impact on existing initial game load | Must not generate 52 furnished floors during initial city build | trace initial gameplay-ready event |
| Active floor steady frame cost | Additional <=2ms p95 main-thread on representative Android landscape device versus comparable empty floor | repeatable 60s controlled walk |
| Per-floor activation | No >50ms blocking synchronous planning step; chunk or yield render work | performance timeline p95/max long tasks |
| Visual arrival | Corridors and collision ready before player exits elevator | accelerated travel and rapid floor selection tests |
| Dynamic lights | Target <=4 active shadowless practical lights within one near-room cluster; test wider room requirements separately | runtime light-count inspection |
| Static decorative objects | Prefer shared material/mesh families, instancing and LOD; do not introduce one GLB download per workstation | GLB/network inventory |
| Live floors | One active, at most one warm target (besides preserved building shell) | resource counters after switching levels |
| Residency/leaks | Repeated 1→16→53→1 loop must return to stable live resource counts | 20-cycle stress test |
| Offline | All required procedural code and preapproved GLBs available under existing offline package rules | Android PWA re-entry offline |
| Collision | Zero blocked valid doors, missing structural contacts or elevator obstructions | deterministic route and collision probes |
| Visual finish | No floating props, clipped silhouettes, discontinuous ceilings or opaque office windows | gameplay screenshots + camera sweep |

Budgets may be adjusted based on measured baseline before expanding beyond the pilot. The user’s target handset and actual frame rates must be recorded rather than assumed.

## 11. Testing matrix and rejection criteria

1. **Program schema:** exactly 53 unique integer floor IDs, exactly one purpose per floor; valid grammar and palette; Floor 53 protected; no missing floor.
2. **Geometry:** floor elevation matches real visual slab and Rapier support; no duplicate physical slabs; glass elevator core remains open and visually see-through.
3. **Connectivity:** graph traversal from elevator reaches every generated room; every displayed doorway has a real cutout and collision-consistent route; camera remains inside building bounds.
4. **Furniture placement:** desk/chair seating direction, shelf-to-wall contact, lamp supports, no prop on corridor route, no overlap with door swing or existing NPC/actor.
5. **Runtime invariants:** preserve original Finch meeting dialogue and trigger; preserve other mission flags, starting character, existing elevator controller and HUD control layout.
6. **Visual quality:** compare Floor 16's furnished output to the accepted Floor 53 aesthetic from the *actual game camera*, not only a standalone Three.js demo. Check day/night windows and lights with both an orthographic diagnostic camera and live Reese camera.
7. **Determinism:** generate/unload/regenerate same floor across refresh and seed migration tests; stable plan hash until intentional generator version change.
8. **Streaming:** abort pending loads while changing floors; resource counts return to baseline; no unbounded pending imports or duplicate lights/colliders.
9. **Performance:** test on mobile landscape and desktop, with crowd/traffic outside still running. Reject major frame-time regression, freezes, excessive GLBs or upload stalls.
10. **Failure and rollback:** if the generation algorithm cannot validate an accessible room plan, refuse the invalid layout and return a conservative **connected** empty fallback. Disable the new adapter with a feature flag instead of damaging structural world data.

**Release blockers:** floor unreachable, invisible Rapier barrier, glass facade obscuring city, mission trigger moved, missing/disconnected elevator opening, permanent black room, uncontrolled asset memory growth, crash or regression of current accepted 53rd-floor gameplay.

## 12. Proposed incremental implementation milestones and authorization gates

| Stage | Deliverable | Dependencies and acceptance | Status |
|---|---|---|---|
| **0 — Baseline audit** | review trial branch tile/window results, measure real slab and shaft; document carpet defect separately | current 53-floor visual preview successfully builds and passes owner observation | Separate existing trial |
| **1 — Approve program** | this exact 53-floor purpose list, grammars, protected Floor 53 rule, no locks | **owner's explicit plan approval** | **NOT APPROVED** |
| **2 — Pure planner** | versioned schemas, deterministic seed, floor zoning, corridor/door graph, no rendered furniture | unit tests cover Floor 1, Floor 16, Floor 28, Floor 45, Floor 52, Floor 53 override | Pending |
| **3 — Floor 16 pilot** | actual Floor 16 layout: offices, workstations, meeting room and service space, streamed via elevator | visual preview + collision / navigation tests + owner acceptance | Pending |
| **4 — Second grammar pilot** | Floor 3 café OR Floor 28 operations — select to expose non-office grammar defects | owner acceptance and performance envelope | Pending |
| **5 — Family coverage** | implement remaining grammar families, shared assets and fixture system | tests of every grammar; UI/elevator/mission regression | Pending |
| **6 — Progressive 1–52 rollout** | 52 generated floors, one active at a time, stable return/persistence and optional palette tuning | 53-floor gameplay tour and 20-cycle stress suite; owner acceptance | Pending |
| **7 — Review and merge gate** | final checklist + preview link + metrics and rollback plan | explicit owner instruction to merge/deploy. No automatic merge. | Pending |

**Recommended owner decision at Stage 1:** Approve the floor-purpose matrix as a coherent fictional tower layout, authorize Floor 16 as the first generator test, and require two independent approvals before proceeding to Floor 3/28 or all-floor rollout. Later citywide interiors reuse \`GTD-INT-001\` rather than inheriting Finch-specific purpose data.

## 13. Branch, commit, review and rollback policy

- Remain on \`feature/finch-floor53-room-skill-trial-20261106\` for documentation and existing surface/glass trial until owner says otherwise. The generator should be staged in the same feature branch **only after** its implementation is authorized; no change to \`main\` for review.
- Every stage commits a testable, isolated change set with a traceable manifest. Keep Floor 53's curated suite and encounter assertions as required regression tests.
- Generate real preview links from the established G.T.D Vercel project on the feature ref; do not substitute a separate third-party room viewer for actual G.T.D runtime acceptance.
- Do not treat a Vercel build success as proof of layout, aesthetics, collision or mission readiness. User gameplay observation is the release gate.
- If the generator blocks the elevator, breaks missions, or causes severe performance loss, disable only the generator adapter or revert its isolated commits. Retain existing successful Floor 53 suite and all accepted city physics.
- **No automated merge, production deployment, or external asset billing** is authorized by this plan.

## 14. Decisions requested

Please review and either approve or amend:

1. **Purpose registry:** all 53 specific proposed floor assignments in section 2.
2. **Open-world rule:** all rooms accessible; access descriptors fictional only.
3. **Implementation approach:** deterministic, shared reusable room grammars, not manual per-floor furnishing.
4. **First generated target:** Floor 16 (software co-working), then one distinct grammar pilot.
5. **Protected curated exception:** Floor 53 remains mission-specific, with no auto-furnishing.
6. **Performance/quality gates:** proposed limits and measured Android acceptance.

**Approval sought:** approval of the comprehensive *technical implementation plan* and Stage 2–3 scope only. A separate owner acceptance is required before Stages 4–7 or merge.


## Explicit hold

Documentation-only revision. Existing 53-floor tile/glazing preview is already under build review; this plan has not generated any new room, altered an elevator/mission, or approved a merge. All procedural furniture and partition work remains behind explicit owner approval.

