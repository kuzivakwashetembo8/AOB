# GTD-WORLD-006 — Meridian City Expansion Architecture & Security-Gated Implementation Plan

> **DECOMMISSIONED GEO-R1 EXECUTION — OWNER STOP ORDER (2026-10-14).** The implementation branch `feat/world006-r1-visible-south-ward-pilot-20261014` and all `verify/world006-r1-*` verification branches are permanently withdrawn from consideration. **DO NOT MERGE, REOPEN, CONTINUE DEVELOPMENT, REUSE AS A BASE, OR DEPLOY THEIR COMMITS.** All R1 mobile previews failed visual acceptance despite green automated tests. The GEO-R1 experiment is closed as **FAILED**, not completed. See [GEO-R1 complete failure register](./Issues/GTD-WORLD-006%20GEO-R1%20Decommissioned%20Pilot%20-%20Complete%20Attempt%20and%20Failure%20Register%20-%202026-10-14.md). This order applies to the failed visible R1 implementation, not to the broader architectural planning document or the separately reviewed P0/P1 foundation; no new implementation is authorized by this note.


**Date:** 2026-10-14 (SAST)
**Directive:** Expand Meridian City from South Ward outward **before introducing ambient traffic**; add real building types and the recently generated surface materials; deliberately expose failures when South Ward techniques operate at city scale.
**Status:** TECHNICAL PLAN ONLY — NO IMPLEMENTATION AUTHORIZED. Security check and owner's subsequent explicit authorization are mandatory.
**Audited source:** interlinkglobal/GTD main @ 94228f5125ec977609f5b305a172ac530e206584
**Destination:** documentations/ (repository root documentation folder)
**Naming precision:** **Meridia** is the fictional larger setting; **Meridian City** is the first playable city within it. This plan expands Meridian City, not a second city in Meridia.

## 0. Decision, precedence, and non-negotiable constraints

**Sequence:** (1) secure the baseline; (2) expand the data/building/street systems and South Ward in bounded releases; (3) connect approved outward districts; (4) stress-test a substantially larger city with the current character, player vehicles, day/night and mobile PWA; (5) consider traffic later under a separate traffic acceptance programme.

The city must have **physical connectivity**: named streets with registered segments, actual sidewalks and intersections, believable lots, buildings with use-specific forms, collision and entrances. We will not synthesize a city by scattering buildings onto an infinite dark plane or replacing buildings with flat photographs.

**Previous gate reconciliation:** GTD-WORLD-003 explicitly blocked physical geographic expansion until material coverage G1 and corrected vehicle dynamics G2. WORLD-005 proposes a six-family pilot and further conditions. This new directive changes the *priority of preparing an expansion plan*, not automatically the previously imposed implementation gates. Before Phase E2/E3 geography work the owner/security gate must either (a) supply evidence accepting G1/G2 or (b) explicitly supersede their ordering, record residual risks, and authorize a bounded non-traffic preview. **Ambient traffic remains excluded regardless.** The known WORLD-003 ground-infill visual failure is NOT closed and may not be masked by adding buildings.

Owner must approve the target expansion frontier, first materials, mobile acceptance budget, and geographic adjacency map. Numeric building-count targets here are proposed staged load profiles, NOT factual current counts or a guaranteed performance envelope.

## 1. Evidence-backed existing baseline and implementation gaps

The audited production data is confined to:
- First Light: **10** anchored buildings, **5** road segments, **2** T-junctions, **4** blocks (including one public green block), **one** playable South Ward neighborhood inside **one** district. Source: src/game/world-generation/first-light-spec.ts.
- Registered streets: Mercer Street (two segments), Workshop Road (one connecting segment), Foundry Lane (two segments). Their labels are described as provisional in that specification; preserve names and IDs unless owner explicitly renames them. No new names in this plan are treated as currently implemented.
- World schema version 1: CitySpec → districts → neighborhoods → blocks → lots → BuildingSpec; world coordinates in metres, X east, Y up, Z south. Zero-yaw building front faces +Z. Eleven generic BuildingArchetype values; these are not eleven fully realized structural building profiles.
- Active runtime uses ACTIVE_FIRST_LIGHT_WORLD_SOURCE = "generated-first-light"; generated-first-light-world.ts still directly constructs FIRST_LIGHT_CITY_SPEC, building list, fixed ground, street context, hero garage, environment and static physics. It does **not** operate as a general streamed multi-district city.
- Existing pure-data and infrastructure modules include CityRegistry, road-graph, planNeighborhood, seeded-variation, validation, architecture-plan, building-generator, block-lifecycle, block-streaming and streaming-policy. Default **85m load / 125m unload** values are *unvalidated First Light defaults*, not approved driving/flight-scale thresholds.
- Current location HUD calls southWardLocationAt against **FIRST_LIGHT_CITY_SPEC.roads**, so it will mislabel or omit expanded streets unless replaced with active-world, district-aware spatial lookup.
- Architectural material appearance: **60 numbered WebP surface entries** in six families; **9 distinct IDs** assigned by default to the ten current buildings (five brick: BRK-01/04/07/09/10; two wood: WOOD-01/03; two glass: GLS-01/03). **51 IDs unassigned**. STN/MET/RND lack live runtime catalogs/selection; RND-10 has same Git blob as RND-01 and is BLOCKED. An assigned material is not automatically an owner-approved final building.
- Existing brick/wood/glass assignments are explicit experiment policies in building-generator.ts; this is not a generalized facade-zone registry.
- Ground: dynamic pavement, parking and grass attempt WORLD-003 **failed in owner visual checks**, notwithstanding passing NullEngine tests; browser logs showed a 17-light shader with GL_MAX_VERTEX_UNIFORM_BUFFERS = 12. Exact failing material remains unproven.
- Preserved interaction regressions: Voight walk/flight including normal S and Shift+S turn-then-fast flight, first garage interior transition, correct nearby car possession/exit, rear-follow driving camera, day/night lighting, street-label HUD, Android landscape PWA and image fidelity.

### Architectural problem to solve

A real city needs **CitySpec-driven runtime composition**, **building profiles not free-form random boxes**, **bounded material-zone selectors**, **one semantic road/street/address system**, and **block-owned visuals and physics**. Extending arrays in first-light-spec.ts alone will produce increasingly unstable First Light special cases.

## 2. Geographic design: South Ward first, outward by certified links

### 2.1 Canonical geography vs conceptual districts

The Meridian Game World Development SOT defines **12 named district identities**: South Ward, Meridian Central, Old Meridian, Harbor District, North Heights, East Market, The Strip, Ironworks, West End, Meridian University District, Civic Square, Outer Ring. It does **not** prescribe a complete measured map or their exact adjacency. src/game/world/districts.ts is narrative metadata, **not 12 instantiated CitySpec district maps**.

The owner must approve a 2D district adjacency and terrain/landmark orientation diagram before choosing which district physically touches South Ward. Do **not** infer South Ward's neighbor solely from the order of that narrative list.

### 2.2 Nested growth rings, without inventing coordinates

| Ring / slice | What becomes physically present | Scale hypothesis / stop gate |
| --- | --- | --- |
| R0 — First Light anchor | Freeze 10 existing buildings, 5 road segments, park, garage and two towers; exact legacy IDs, ground, roads and play routes | Baseline invariants pass before expansion |
| R1 — South Ward infill pilot | 3–6 new lot-backed buildings on topology-validated existing/adjacent parcels, 1 each for stone/metal/render exposure where visually accepted | Confirm no overlapping buildings/roads and no First Light regression |
| R2 — South Ward connected blocks | Proposal from WORLD-005: 16–20 **additional** varied buildings across registered new lots, with side streets, service lanes and public facilities | Owner accepts street topology, materials, building silhouettes, entrances |
| R3 — wider South Ward | Further connected streets, small retail/residential precincts, workshop/service edge, school/clinic/court anchors; candidate total district load 50–80 buildings **only if measured** | Streaming, flight visibility, mobile memory, return-driving route gate |
| R4 — first adjacent district | Exactly one owner-approved neighboring district connected by a continuous real road link and visual transition, not a teleported scene switch | Citywide street/ID lookup, chunk crossover and district identity gate |
| R5 — outward network | Additional permitted districts one contiguous connection at a time; scenario stress targets ~150 then ~300+ authored/generated building **records**, not necessarily simultaneously rendered near meshes | Long-session/persistence, streaming/resource recycling and mobile QoS gate |

Density and geography must be constrained by right-of-way, setbacks, visibility, player familiarity and measured device budgets. Sparse correct buildings are preferred over 300 overlapping, inaccessible boxes. New land without true connection is background-only, explicitly not playable city.

### 2.3 District style policies

Use WORLD-004 eligibility, not random distribution:
- South Ward: ARCH-04/05/09/29/30/31 and community clinic ARCH-06; rare glass towers.
- Old Meridian: ARCH-27/29/30/18, old brick/stone, tighter streets.
- Meridian Central: ARCH-01/03/12, structured high-rise glass, civic/commercial podiums.
- Harbor District: ARCH-10/21/28/26 and terminals, industrial/loading routes.
- North Heights: ARCH-04/05/02 with large setbacks and occasional modern construction.
- East Market: ARCH-08/20/32/30/09, markets and mixed-use shopfronts.
- The Strip: ARCH-12/18/19/03, hospitality/nightlife.
- Ironworks: ARCH-21/22/10/26/31, manufacturing and service.
- West End: ARCH-02/03/09/29, neighborhood retail and civic resilience.
- University District: ARCH-14/15/06/29, academic/medical.
- Civic Square: ARCH-11/16/27/07/03, formal public/civic geometry.
- Outer Ring: ARCH-10/23/24/26/28, highway/services/warehousing.

These describe **use/visual identity**, not terrain coordinates, density promises, socioeconomic caricatures or certified adjacency.

## 3. World schema and versioned authoring

### 3.1 Preserve data invariants

- Keep existing world ID, first-light IDs, player spawn and anchors stable. **Do not reseed or rearrange the 10 accepted buildings** when new city data is added. Avoid using one global generatorVersion increment to silently shuffle all old building surfaces and shapes; introduce per-lot stable generation revision and migration strategy.
- Separate authored: district boundary polygon, road segment, street name, lot, major landmark and enterable building; from bounded generated: facade variation, repetition, selected vegetation and eligible surface colourways.
- Add an explicit CityExpansionSpec or equivalent versioned data module that merges disjoint neighborhood/district records into a validated city snapshot. No on-the-fly arbitrary JS scene creation or one global growing hand-coded constructor.
- Proposed (design only) new records: StreetSpec, DistrictBoundary, RoadCorridor/Edge, LotAccess, ArchitecturalProfileRef, MassingTemplateRef, FacadeZoneAssignment, BuildingAccess, StreamingCellRef and ExpansionRevision.
- All authoring is schema-validated, referentially closed and deterministic. Separate persistent ID and user-facing display name; keep IDs stable through renaming and save formats.
- Support manifest-defined terrain height/elevation, including seam-safe ramps and garage/door approach heights, with a flat First Light compatibility adapter first. Do not insert terrain shifts under parked vehicles or the garage without a migration.
- Encode world coordinates as metres and clarify yaw/frontage/rotation on every data boundary. For far geographic extents, assess floating-point precision and a stable sector-relative render transform; never move Rapier bodies independently from rendered meshes.

### 3.2 Suggested versioned contracts (conceptual, not committed runtime code)

~~~ts
interface StreetSpec {
  id: string;                       // stable, no embedded display-only spelling
  displayName: string;
  districtIds: readonly string[];   // cross-district roads possible
  roadSegmentIds: readonly string[];
  status: "proposed" | "approved";
}
interface BuildingIdentity {
  id: string; districtId: string; neighborhoodId: string;
  blockId: string; lotId: string;
  profileId: string; massingTemplateId: string;
  designRevision: number;
}
interface FacadeZoneAssignment {
  zone: "street-wall" | "upper-wall" | "podium" | "tower-shaft" |
        "curtain-glazing" | "entrance" | "plinth" | "canopy" |
        "roof" | "service" | "trim";
  surfaceId?: string;               // BRK/WOOD/GLS/STN/MET/RND, approved only
  materialMode: "image-opaque" | "glass-optical" | "metal-finish" |
                "solid" | "geometry";
  metresPerRepeat?: [number, number];
  geometryProfileId?: string;       // real ribs, mullions, balconies, screens
}
~~~

Do not blindly replace BuildingArchetype, FacadeMaterial or existing CitySpec: implement a serializer/adapter with tests and a backward-compatible R0 snapshot. Maintain versioned migrations and a deterministic replay fixture across schema changes.

## 4. Building generation system modification (critical path)

### 4.1 Change from archetype-only generation to profile + role + lot intent

Current: architecture-plan and building-generator produce massing/bays/openings from generic resolved BuildingSpec; default facade trial IDs are special-cased by building name. Required: explicit selection of ARCH-01...ARCH-32 ArchitecturalProfile and MASS-01...MASS-15 MassingTemplate with **bounded components**, then facade-zone material selection.

Proposed dependency pipeline:

1. City registry validates and locates district, neighborhood, road, block, lot and public space.
2. Land-use planner filters allowed building function/profile, frontage, required driveway/service access, allowable floor-range and setback.
3. Profile resolver locks height class, actual floor/storey grammar, primary/secondary/forbidden material families and facade-zone layout.
4. Massing template resolver builds credible geometry from a **preauthored bounded grammar**, including simple/corner/slab/row/terrace/podium/curtain-wall/long-span/medical/civic/parking/etc.
5. Door/window module lays out actual cuts, entrance anchors, storefront exemptions, garage/loading apertures, balconies and physical thresholds with correct direction and height.
6. Facade-zone material resolver selects only an **accepted** material whose physics/optical form is compatible with its role; stable per-building ID and designRevision seed choices; no universal random material roulette.
7. Roof/trim/service detail generator chooses actual structures appropriate to profile (no wooden skyscraper caps, floating chimneys, or drawn structural strips). Detail only where silhouette, interaction, shadow or oblique view earns cost.
8. Rapier collision and camera-blocker builder derive from the same opening/massing plan, with exact owner lifecycle. Enforce walkable door/garage and clear sidewalk approach.
9. Representation manager emits near, mid, far/skyline and interaction assets (visual mesh and collider budgets separately), with material-lease and GLB ownership.
10. Block streamer acquires/releases the package atomically, with deterministic position/state restoration. Return typed diagnostics linking building, profile, lot, surfaces and costs.

### 4.2 Introduce all previously specified architectural building types through WORLD-004

All 32 WORLD-004 profiles remain canonical; this is the structural programme, not a request to generate 32 model instances at once:

| Generation tranche | Required profile IDs and forms |
| --- | --- |
| South Ward starter (priority 1) | ARCH-04 detached house, 05 townhouse, 09 mixed-use shops/apartments, 29 low-rise apartments, 30 corner shop, 31 garage/workshop |
| South Ward civic/community (priority 2) | ARCH-06 clinic, 11 civic administration, 14 school, 17 fire station, 18 restaurant/cafe, 19 bar/nightclub, 26 utility site, 27 heritage building |
| Expanded business/residential (priority 3) | ARCH-02 high-rise residential, 03 mid-rise corporate office, 10 distribution warehouse, 12 hotel, 13 multi-storey parking, 16 police station, 20 supermarket, 21 industrial factory |
| Higher-complexity city (priority 4) | ARCH-01 glass/metal skyscraper, 07 hospital, 08 shopping mall, 15 university/library, 22 foundry/heavy works, 23 fuel/service station, 24 bus terminal, 25 rail/metro station, 28 harbor/port warehouse, 32 market/retail arcade |

Every profile must explicitly declare floors, typical roof, facade zoning, door/bay geometry, acceptable materials, allowed district uses, collision model and LOD. Profiles 01/02/07/08/13/22/24/25 can require additional proof of multi-part structures/interiors before rollout. Do not conflate the existing 8/10 floor *trial podium towers* with completed ARCH-01 25–50+ skyscrapers.

### 4.3 Prepared massing modules, not thousands of one-offs

Reuse WORLD-004 MASS-01..15: 01 detached pitched house; 02 attached row; 03 slab; 04 corner storefront; 05 balcony tower; 06 curtain wall; 07 stepped tower/podium; 08 industrial wide-span; 09 civic/courtyard; 10 atrium/mall; 11 parking deck; 12 connected medical wings; 13 transport canopy/platform; 14 fuel canopy/service; 15 fenced utility enclosure.

Required template parameters: fixed prototype geometry and modular dimensions, number/spacing of facade bays, floor height, roof/body hierarchy, door/window counts, service access, collision profile, render complexity tier and valid surface zones. Template selection is authored/profile-bounded; deterministic variation can operate within measured parameter ranges.

### 4.4 Architectural acceptance invariants

- One accessible pedestrian entrance on each ordinary building; garage and industrial entries require an actual use-specific clearance. Interior portals only where the approved interaction mode needs them.
- Normal residential/office windows follow floor grid and do not start at vehicle-collision height; genuine ground-floor storefront glazing is an explicit separate grammar.
- No automatic ordinary windows on full glass-tower types; glass facade texture alone does not imply light-transmitting panes or building interiors.
- Tall conventional towers use metal/glass/concrete-appropriate structures, not full wood skins; only physically plausible wood accents.
- Stone course scale, wraparound UV, metal/profile depth, image seam continuity, facade shading and day/night material stability survive side views and proximity.
- Geometry collision boundaries, camera blockers, lighting ownership and door openings agree with rendered objects.
- Rendering/physics failures at scale stop rollout; a beautiful static capture never closes a traversal gate.

## 5. Surface asset integration and compatibility

Six current families each have 10 numbered WebPs: BRK, WOOD, GLS, STN, MET, RND. Presently nine surface IDs are assigned by default, and Stone/Metal/Render have **no typed live building selection**. RND-10 is blocked because its blob duplicates RND-01. Preserve existing BRK-01 accepted brick, low-rise wood examples, blue stripless GLS-01 and grey framed GLS-03 tower designs unmodified.

**Material pipeline modification:**
- Add verified canonical typed registry with familyId, surfaceId, asset path/hash, actual pixel dimensions, image aspect, provenance/usage rights, 2×2 tile seam result, metres-per-repeat, visual approval, allowed profiles/facade zones, optical/opaque mode, actual geometry profile and fallback. Do not set "accepted" based on filenames.
- Distinguish 60 asset IDs from only 59 unique blobs; blocked RND-10 is never auto-selected.
- Replace building-name-specific experimental mapping with an explicit, versioned facade assignment for new buildings. Legacy building overrides remain pinned as compatibility fixtures until individually approved for migration.
- Apply physically measured UV scale (no automatic stretching/cropping); continuous single-image UV on stripless tall glass facades; independent 3D mullions/transoms or metal strips where close-range parallax requires them.
- Metal cladding family images are **plain metal finishes**; corrugation, panel seams, open perforations, louvres and mesh are actual bounded geometry, not repeated baked lines.
- STN rough/ashlar/ledge/gloss variants and RND surface grain/wear are mapped by building use. Storefront glazing remains separate real or approved optical material, not falsely transparent glass-look wall WebP.
- Scene-scoped texture/material caches, async readiness, WebP/mipmap/LOD, correct disposal, asset streaming and mobile budget; no unconditional preload of all 60 assets.
- Security: keep image URI under a fixed trusted local path/manifest; never allow untrusted arbitrary URL interpolation or unsanitized shader source.
- New family tests verify runtime assignments by actual building/mesh/material, not just manifest counts.

**Initial pilot mapping (recommendations, not accepted assignments):**
- Stone: STN-01 limestone on a small civic/clinic entrance; STN-02 fieldstone as residential plinth; STN-08 travertine on medical/civic foyer.
- Metal: MET-01 base finish on a workshop/warehouse with separately modeled ribs; MET-02 painted standing-seam *finish* on service hall; MET-05 limited brushed entrance accents.
- Render: RND-02 townhouse walls, RND-05 older shop/apartment upper walls, RND-01 on a modest modern detached house.
- Other unused BRK/WOOD/GLS types only where bounded by profile and approved visual QA. One test building per family before wide coverage.

## 6. Road graph, street naming, civic addresses and ground integration

### 6.1 Road graph is a physical constraint, not signage text

Keep existing schema road nodes/segments/intersections as foundational truth. Generalize from 8 m First Light local roads (two lanes + 3.75 m sidewalks, as currently authored) into district-appropriate alley/local/collector/arterial/boulevard/highway templates. Do not apply this one dimension to all city roads. Road class controls width, sidewalk, setback envelope, expected clearance and junction geometry. **Do not set fictional driving side, lane speeds or traffic jurisdiction here**; reserve traffic-only attributes for the later approved traffic programme.

Extension contracts:
- unique and connected node/segment IDs, intersections enumerating exactly their real incident edges;
- continuous drivable surfaces/junctions, sensible curb cuts and corner sidewalks with no wooden curb across active mouth;
- road elevation, grade and meeting heights correctly connected at tile/stream boundaries;
- right-of-way, bridge/tunnel reservations and broad future lane geometry without simulating traffic;
- pedestrian access and doors from lot frontage; service roads/driveways permitted only when topologically valid;
- parked/static assets and existing player vehicles remain collision-consistent with roads and new walls;
- no road is visually drawn over a building parcel or routed through the public green space.

### 6.2 Canonical Street Registry (new)

Split **street identity** from its multiple road segments. One StreetSpec has permanent ID and display name; each segment links to its Street ID. Segment split/merge MUST preserve the parent Street ID, and neighborhood/district lookup must come from this authoritative city registry.

Already encountered labels:
- Mercer Street: sw-fl-mercer-west, sw-fl-mercer-east.
- Workshop Road: sw-fl-workshop-link.
- Foundry Lane: sw-fl-foundry-west, sw-fl-foundry-east.

**Proposed names — UNAPPROVED fiction, not established map roads:**
- South Ward residential: Mason Street, Alder Avenue, Bell Court, Willow Lane.
- South Ward workshop/services: Mill Road, Cinder Street, Depot Road, Kiln Alley.
- Boundary collector candidates: Ward Avenue, Union Road.
Avoid name repetition without an intentional continuous same-street ID. Prioritize believable, human-memorable street continuity; not thousands of arbitrary generator-produced names. Owner to select/rename before committing street geometry or signage.

### 6.3 Address and player location rules

- Street name is authored per StreetSpec; number is assigned from actual lot frontage and a deterministic side-of-street policy once civic numbering convention is chosen. IDs are never derived from address number; building names and businesses can change without ID change.
- Define address ranges, parity/sides, alley/service suffix, intersections, special civic buildings and corner parcels (one primary address, optional secondary access). Buildings on a split segment keep the same civic street identity.
- Replace southWardLocationAt(FIRST_LIGHT_CITY_SPEC) with ActiveCityLocationResolver(position, controlContext), querying the player's current world position or the **actually driven vehicle**. Return district/neighborhood/street based on segment projection **plus** district boundary/lot containment; do not label a flight hundreds of metres outside the map as the closest South Ward street.
- Validate map transitions, labels, garage entrance, foot traversal, flying, vehicle entry/exit and corner edge ties. Camera, UI, signage and future police/mission events use the same registry.
- Create visible street-name signage/house-number assets under street-context renderer using small decals/text on actual props. No fake in-world sign that disagrees with HUD; signs respect street names/road orientation and are readable from street level. Review visual taxonomy and language before generation.

### 6.4 Ground as a separate FAIL-OPEN workstream, not assumed solved

WORLD-003 currently produces black/brown unfilled blocks in the live browser despite source-generated paving/parking/grass meshes. **Do not replicate the same planner blindly across a larger rectangle**; it expands GPU work and masks diagnosis. Plan bounded parcel-ground ownership by block, zoning types (grass/plaza/pavement/parking/service yard), safe material/light budget and layering with road topography, with source-of-truth lot polygons. Keep open WORLD-003 issue; owner's separate instruction is required to troubleshoot it. If owner chooses to expand without resolving, explicitly flag each unfilled block and make overall visual-completeness gate fail, while permitting limited structural topology tests if authorized.

## 7. Runtime generalization and city registry composition

New CityWorldController (proposed) consumes a validated CitySpec and orchestrates the existing interfaces. Preserve Babylon renderer, centrally stepped Rapier physics, React shell/UI and existing environment controller.

### 7.1 Avoid the First Light monolith

Replace the direct FIRST_LIGHT_CITY_SPEC usages in generated-first-light-world.ts with an adapter for the ten stable First Light objects plus a CityRegistry-backed world composition controller. The active playable city can include multiple districts but the existing garage, current two glass towers and nearby car logic must remain exactly recoverable.

Proposed ownership:
- CityWorldController: authoritative active city snapshot, render/physics lifecycle, time, spatial services, update scheduling.
- CityRegistry + SpatialIndex: district/neighborhood/block/lot/street lookups and bounds; immutable IDs.
- RoadSceneSystem: road graph, junctions, sidewalks, ground-owned collision and rendered mesh sectors.
- BuildingDistrictSystem: profile/massing generator and per-zone image resources, portals, lighting.
- CellStreamer: load/unload near physics and mid/long-distance representations; pinned hero areas.
- EnvironmentalService: consistent day/night stars, streetlights, ambient fill (previously accepted lighting is locked).
- SpatialLocationService: player/vehicle/current street and address/HUD.
- Instrumentation: block IDs, resource leases, shader failures, world memory, physics proxies, current LOD, stream transitions.

### 7.2 Streaming model and flights/vehicles as stressors

The existing BlockStreamer has 85 m /125 m conceptual thresholds and creates assets per block; these defaults cannot adequately be assumed for faster cars or high-altitude flight. Make load horizon a function of camera visibility, player/vehicle speed, worst observed asset readiness time and stopping distance, while using separate near-physics, near-visual, distant skyline and offscreen budgets. Never unload active player car, the garage interior, a visible approach corridor or a building containing the player.

Use:
- stable sector origins and bounding volumes;
- near interactive geometry/colliders; mid static facades; distant lightweight skyline impostors / simplified geometry;
- hysteresis, prefetch in motion direction, and safe fallback when texture GLB loads lag;
- asset leases and collider handles disposed **once** on unload; lifecycle idempotent across pause, resume, soft reload, return and PWA reentry;
- pinned story/hero buildings only by explicit policy, not accidental global resident meshes;
- independent sky/atmosphere from block assets so repeated streets don't multiply lights and hit shader uniform limits.

Define finite max simultaneous resources based on measured desktop and Android devices; no arbitrary all-block creation during world startup. Streaming must not cause Rapier holes at boundaries.

## 8. Observability: explicit experiment to find what breaks

Growth's third purpose is to expose assumptions that were invisible in ten buildings. New phases must ship with a **fault register**, reproduction route and same-build comparisons against R0.

| Failure hypothesis | Test/reproduction | Evidence required | Severity trigger |
| --- | --- | --- | --- |
| World coordinates hardcoded to First Light | Spawn/travel outside South Ward; verify location, camera, parked car possession | actual position, district+street lookup, screenshot | wrong district or remote teleport = STOP |
| Generator IDs or seeds reshuffle old buildings | rebuild with identical seed then append a block | hash of old per-building geometry, surfaces, positions, ID/address records | any unapproved old hash shift = STOP |
| Disconnected or malformed road network | automated graph reachability + walking/driving traversals at every junction | route coverage, collider continuity, slope/curb screenshots | impassable player route = STOP |
| Buildings invade roads or overlap | world-space OBB/footprint and public-space clearance checks, doors/driveways | polygons and witness shots | overlap or inaccessible door = STOP |
| Façade material/geometry mismatch | 2x2 tiling, close oblique day/night, windows and ribs inspected | owner image comparison, shader readiness | broken depth or wrong family role = STOP |
| Infill stays unrendered | aerial + ground inspection, per-mesh shader/state isolation if separately authorized | visible pixels and material ownership, not NullEngine counts | remains known OPEN; no claim of resolution |
| Shader light uniform exhaustion | real browser WebGL2 material compile audit under 17+ scene lights | shader owners, light count, GL uniform budget, errors | shader compile errors = STOP |
| Street names/addresses break | cross district flight, car drive, close to corner, road split/rejoin | one StreetSpec ID and correct HUD/sign/civic mapping | label drift = STOP |
| Collision persists after stream unload | repeated out-and-back in player car + Voight; paused/restarted | Rapier handle census per cell and physical witness | ghost/fall-through = STOP |
| Texture/GLB/LOD leaks | repeated boundary travel, high-altitude camera, device reload | decoded texture counts, resident bytes, draw calls, heap and GPU indicators | monotonically growing resources = STOP |
| High-speed travel outpaces loading | Ferrari drive approaching unloaded districts; sprint/fly border | camera-visible pop-in/stalls, predicted horizon | safety loss or multi-second stall = STOP |
| Mobile blur/input regression | paired desktop/Android orientation, DPR and quality cases | same capture positions, frame times and resolution | unacceptable sharpness/control = STOP |
| Day/night city lighting instability | full dusk/night sweeps near/far skyline and streets | exposure, star distance, shader errors, light counts | accepted night lighting broken = STOP |
| Failure to preserve existing interactables | garage/doors/Voight flight/vehicle exit replay | recorded positions and pass/fail outcomes | any regression = STOP |

Maintain static fixtures for each source of truth plus **live visual browser checks**. Successful build and tests are necessary but not sufficient; WORLD-003 proved that.

## 9. Security check — mandatory authorization gate SC-0

**Security review must precede any implementation**, not merely deployment. Review owner-facing results and record explicit pass, conditional pass with risk acceptance, or fail. Do not guess a security clearance.

1. **Repository change hygiene:** single-purpose preview branch from pinned main SHA; require diff review, dependency/lockfile review, no unexplained package fetches, no generated secrets or debug credentials in source. Documentation changes do not authorize app permissions.
2. **Data validation:** reject duplicate IDs, undefined road refs, malformed coordinates, NaN/infinity/negative sizes, impossible heights, bad polygons, overlapping lots, cyclical dependency relationships and excessive entity/texture requests. Put explicit upper bounds on the size of any untrusted city/manifest input. Return precise path errors rather than partially initializing scene.
3. **Asset provenance:** inspect licenses and ownership for generated/imported artwork, textures, GLBs and any fonts; SHA-pin asset bytes where appropriate; fixed local asset base paths; never execute code embedded in untrusted asset metadata or load arbitrary remote scripts/shaders.
4. **Text/UX injection safety:** treat city/street/building names, signs, address labels and any user-written text as untrusted data. No insertion of unsanitized HTML or script into React/DOM; proper escaping for generated decal/text surfaces; clamp lengths.
5. **WebGPU/WebGL/physics resource safety:** guard shader permutations, light counts, textures, mesh and collider amplification; maximum assets per block, finite matrices and valid Rapier collision shapes. Graceful fail closed for gameplay interactions and visual fallback where noninteractive.
6. **PWA and Vercel boundaries:** inspect service-worker precache scope, integrity/cache invalidation, production vs preview isolation, CORS/manifest behavior, no surprise background asset preloads, preserve existing deployment environment/secrets and manually authorized production promotion.
7. **Persistence and migrations:** no arbitrary deserialization to executable objects; versioned city snapshots and recoverable save-state IDs; verify backward compatibility and rollback of prior player positions and active vehicle context. Never reinterpret prior asset IDs as new ownership without migration.
8. **Threat simulations:** malformed city file, duplicate building IDs, zero-length roads, giant district dimensions, directory traversal in asset path, malicious street HTML, asset timeouts, shader compile failure, GPU/device loss and block streaming race. Record reproducible passes/failures.
9. **Project integrity:** check that the new architecture cannot execute remote commands, alter GitHub/Vercel credentials or deploy without explicit actor action. No secrets are written to logs or diagnostic exports.

**SC-0 output:** dated Security Review Record with reviewer, pinned commit, tested checks, gaps, owner-approved mitigations and specific authorized phase. **Until SC-0 and owner authorization are documented, there must be zero game, world, rendering, physics, traffic or production changes.**

## 10. Phased implementation tickets, gates, deliverables

| Phase | Work package | Implementation deliverables (future, not done) | Exit gate |
| --- | --- | --- | --- |
| P0 | Audit and security baseline | pinned main, snapshot of current 10 buildings + 5 roads, tests, live desktop/mobile screenshots, security threat review | SC-0 security pass and owner approval |
| P1 | City schema and street registry | versioned CitySpec compositing, address/street IDs, location resolver, validated district boundary, baseline compatibility adapter | CITY-DATA-1: stable R0 snapshot, full ID/reference/graph tests |
| P2 | Building profile/massing registry | WORLD-004 ARCH-01..32 / MASS-01..15 contracts, use-based zones, validation, physically plausible openings and roofs | BLD-SPEC-1: generated model family witnesses and no R0 geometry drift |
| P3 | Six-family materials pilot | verified catalogues STN/MET/RND, owner-chosen one building each, UV/light/real geometry policy, asset leases | MAT-EXP-1: real near/far/day/night visuals and QA; RND-10 remains blocked |
| P4 | R1 South Ward slice | 3–6 real new lot-backed buildings with connected access and no new traffic, from one coherent local CitySpec | GEO-R1: walk/fly/drive, collision, entry, screenshot signoff |
| P5 | R2 South Ward neighborhood | 16–20 additional proposed WORLD-005 buildings in small batches, real streets/intersections/public spaces and street names | GEO-R2: repeated deterministic full traversal, no resource leaks, owner identity acceptance |
| P6 | Activate block/city streaming | sector-based visual/physics/camera/asset lifetimes, speed-adaptive prefetch, far skyline, mobile LOD | STREAM-1: round-trip resident memory and no world holes |
| P7 | R3 wider South Ward | connected workshop, residential and community edges, measured 50–80 record scenario only if safe | GEO-R3: measured PC/Android and high-speed crossovers |
| P8 | R4 first outward district | owner-approved actual adjacency, one genuine cross-district road and context transition | GEO-R4: continuous traversal and correct location/asset policy |
| P9 | R5 more of Meridian | repeat for later connected districts and increasing records only within measured budgets | CITY-SCALE: progressive stress suite and documented caps |
| P10 | Separate traffic readiness handoff | freeze connected roads and reserve future lane/rule data; **NO traffic agents** | later traffic project authorization, not part of this directive |

**Mandatory sequencing dispute resolution:** Earlier GEO gates G1 and G2 remain active. P4–P9 physical world implementation may not proceed until their acceptance, or an explicit, scoped owner override after security review. P0/P1/P2 technical preparation is independent and can be authorized earlier without creating districts. P3 material field trial needs owner approval and its own browser validation. This plan does not itself change policy.

Suggested implementation branch topology: docs on main; future phase branches prefixed feat/world006-pN-*; build and tests; Vercel preview by explicit action; owner field acceptance; PR with evidence and risk register; **manual main merge + production deploy only with separate explicit permission**. No deploy-per-commit.

## 11. Verification package and measurable gates

**Structural tests:** pure data ID uniqueness, schema migrations, exact old geometry snapshots, class-specific building plan/generator cases, physically real openings, material eligibility, seed stability, road-node incidence, intersection mouth/corner cuts, frontage+address identity, lot collision and no public-space overlap.

**Runtime tests:** enter/exit garage and buildings; walk, sprint, hover normal/backward, Shift+S turn; fly aerially across sectors; drive current imported cars from Mercer to Foundry and outward; enter and exit actual local vehicle at its position; pause, resume, reload, reverse route, unload/refetch with full Rapier collider/mesh count parity.

**Material tests:** STN/MET/RND texture seam and actual appearance review; deterministic per-zone assignment, no stone/wood placed implausibly, metal structural ribs modeled separately, GL glass strips/wall UV/caps remain accepted. Capture multiple range/angle/time-of-day witnesses per new template.

**Performance metrics required before choosing numeric limits:** startup to usable frame, median and p95 frame time/FPS, device raster scale and quality, active meshes/draw calls/triangles, live materials/textures and decoded bytes, shader compile/GL uniform errors, Rapier body/collider counts, asset load/LOD transition latency, worst observed high-speed approach, peak and post-return memory, device temperature/throttling if observable. Test real Android landscape PWA and desktop with identical routes. Define owner-approved budgets from R0 results, not invented global targets.

**Release artifacts:** data schema diagram, explicit approved adjacency map and real measured lot coordinate plan, new street list with IDs and addresses, architectural profile-to-surface matrix, generator compatibility diff, collision/road-check report, asset SHA/provenance registry, known failure ledger, daylight/night/walk/drive/fly screenshot matrix, mobile regression summary, deterministic build hashes and tested preview URL.

Any one **STOP** fault blocks promotion until fixed or explicitly scoped/accepted as a known defect by the owner. Ground-infill failure must remain listed as an open issue; building coverage is not an acceptable substitute for fixing it.

## 12. Implementation authorization matrix

| Owner decision | Effect if approved | Default before approval |
| --- | --- | --- |
| Security check SC-0 completed and recorded | Permits only specifically authorized phase(s) | NO implementation |
| G1 materials and G2 vehicle policy | Enable physical geography phase or documented exception | Earlier expansion gate remains blocked |
| Pick first South Ward growth frontier | Permit road/lot coordinates and street names to be finalized in map authoring | No invented adjacency or names |
| Approve STN/MET/RND samples | Permit bounded assignment to compatible building types | Registry-only, no forced visual adoption |
| Approve measured device budgets | Permit sector/LOD thresholds and city record targets | Planning hypotheses only |
| Approve future preview/release | Allow explicit preview, later separately main/deploy | No automatic deployment |
| Approve traffic, driving side/rules | Separate post-city programme | TRAFFIC STRICTLY OUT OF SCOPE |

## 13. First security-gated execution packet (recommended)

Once SC-0 passes, request explicit approval for **P0 and P1 only**: capture verified baseline and refactor city/street registry behind a feature flag, proving the original R0 game remains byte-for-byte or visually identical in relevant spatial/motion contracts. Then request a separately authorized small P2/P3 material-profile pilot before any new buildings. This isolates failure modes and avoids repeating a WORLD-003-style source/test-green yet browser-black issue at city scale.

The first physical city expansion should be *a connected, inspectable part of South Ward*, not a wholesale procedural rebuild or simulated district list. The last step of every slice is returning safely to the familiar First Light garage.

## 14. Document hierarchy and change-control index

This plan synthesizes but does not erase:
1. **Meridia First Light Implementation Plan** — accepted physical/art/mobile doctrine; FL-4 closed.
2. **Meridian Game World Development SOT** — district meaning and technical runtime contract.
3. **Meridian Dynamic Building Generation Algorithm** and **Meridian City Generation Algorithm — Five-Step Development Plan** — deterministic architecture and street/streaming fundamentals.
4. **GTD-WORLD-003 Main Audit & Six-System Implementation Plan** — material G1 / physics G2 gate and traffic exclusions.
5. **GTD-WORLD-004 Architectural Building Catalogue** — ARCH/MASS profile IDs and district eligibility.
6. **GTD-WORLD-005 Six-Family South Ward Architectural Expansion Plan** — 16–20 candidate additional buildings, role-based materials.
7. **GTD-RND-MAT-009** and **MAT-010** — material image-vs-physical geometry policy and 60-asset provenance audit.
8. **GTD-WORLD-003 Ground Infill Failure Register** — unresolved shader/ground visual incident with failed previews.

When implementation conflicts with the earlier SOT, inspect whether it is an expressly approved later decision. Record a migration in both the SOT and phase decision log, never silently discard it. Proposed changes must be added as small, reviewable, reversible increments.

---

**FINAL LOCK:** This document is a technical design deliverable only. It changes no code, scene, assets, materials, road map, player physics, traffic or deployments. Implementation awaits completion of the security check and owner authorization.
