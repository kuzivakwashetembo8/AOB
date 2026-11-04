# GTD-INT-001 — Meridia Procedural, Fully Enterable Interiors
## Comprehensive Technical Implementation Plan — **PROPOSED / NOT APPROVED**

**Date:** 2026-11-04  
**Owner's decisions:** Every room enterable; generate believable interiors through Babylon.js code first, buy/import a small reusable set of optimized furniture GLBs only when a specific complex object fails the visual test. Exactly six starting categories: **Office; Apartment; Shop; Public Places/Lobbies/Corridors; Schools; Factories**.  
**Working context:** \`interlinkglobal/GTD\`, North Heights / Meridia, TanStack Start + Babylon.js 9 + Rapier, desktop and Android landscape PWA.  
**Document-only commit:** No interior generator, asset, scene, collision, UI, mission, or production release implementation is authorized by approving *the discussion*. This document requests a separate implementation approval.  
**Owner acceptance gate:** Explicit approval is required before writing implementation code, committing art assets, spawning furniture, or deploying interior prototypes. Individual stages must be previewed before expansion.  
**Precedence:** Existing gameplay and structural physics remain source-of-truth; do not casually override accepted world, Finch HQ, lifts, NPC missions, vehicle systems, lighting, PWA/offline behavior or UI.

---

## 1. Goal, intended experience and boundaries

The desired world is not an art gallery of identical fully populated rooms. Every physically represented room in an accessible building must have a working doorway and a traversable, believable, persistent *identity*, whether or not the room is mission-relevant. Reese may enter any room, return later, and encounter the same plan and stable layout. Floors must be reachable via the existing working lift system (stairs are not a prerequisite for the first release). Gameplay must continue smoothly when an interior is entered or left.

**Believability = functional spatial logic + believable furnishings + constrained variety + credible lighting + stable persistence.** A lower polygon desk placed against a wall with a chair and monitor is preferable to a costly decorative GLB floating in a hallway. Architecture comes before props.

This program is constrained to the six approved interior types; hotels, clinics, libraries and industrial offices are *subtypes* of Public/Apartment/Office or conditional uses, not seventh mandatory generator families. Do not introduce new class types without approval.

**Explicit exclusions from phase 1:** citywide generation, unlimited dynamic NPC room populations, destructible or movable furniture, live home decoration editor, custom room-by-room 3D modelling, blanket downloadable GLB packs, independent physical simulation of every prop, full furnishing of all 53 floors of Finch HQ, additional missions, or changes to existing externally observed interiors. These are optional future directives.

## 2. Verified integration baseline (read-only source inspection)

Current repository surfaces to extend, not replace:

- \`src/game/experiments/north-heights-reconstruction-001.ts\`: deterministic lots (stable \`id\`), \`Lot.family\` in \`glass|office|loft|residential|estate|civic\`, building dimensions and floor counts, facades/doorway and white interior floor slab generation. Its existing procedural materials and shared batch geometry remain intact.
- \`src/game/experiments/north-heights-building-lift-plan-019.ts\`: \`northHeightsBuildingShaft019\`, authoritative shaft location/floor count/heights and \`buildingLiftFloorHeight019\`; Finch special-case shaft. Do not put rooms, floors, walls or furnishings through these spaces.
- \`src/game/experiments/north-heights-building-lifts-019.ts\`: lazy cabin / only one active non-Finch elevator, current floor and passenger support. Preserve its lifecycle and camera enclosure.
- \`src/game/experiments/north-heights-physics-005.ts\`: original Rapier terrain/pavement, building wall openings, floor rings and capsule; physics is not derived from Babylon's visual collision toggle.
- \`src/game/experiments/north-heights-city-8.ts\`: North Heights render/update, camera, world load/teardown, runtime player and NPC controllers; all new interior operations must be integrated behind a thin adapter, *not* via React frame-by-frame logic.
- \`src/game/experiments/north-heights-finch-suite-005.ts\` and \`north-heights-finch-lobby-004.ts\`: Finch on Floor 53 and reception are narrative-specific, manually curated locations. **Do not furnish, repartition or restyle Floor 53** without explicit later approval; preserve receptionist, Finch, glass lift, mission positions and interaction radii.
- \`src/game/world-generation/schema.ts\`: canonical semantic building archetypes include residential, mixed-use, commercial, industrial, office, civic, hospitality, etc.; already contains \`InteriorMode\`, \`CollisionMode\` and \`CameraBlockerMode\`. The new interior planner should reuse/build on these contracts rather than making a disconnected city schema.
- \`src/game/world-generation/representation-materials.ts\`, \`surface-textures.ts\`: reusable procedural material/texture recipes; share and cache by role.
- \`AGENTS.md\`: \`src/game\` is simulation owner; \`src/ui\` is presentation; keep \`GameRuntime\`/\`RuntimeBridge\` architectural boundary when migrating from isolated North Heights controller; world save data belongs in the runtime save system, not new localStorage keys.
- Existing smoke/regression suite: \`src/test/gtd-level001-world-refinements-019.test.ts\`, \`finch-first-meeting-005.test.ts\`, existing world/physics/performance tests.

**Integration debt to acknowledge:** The current North Heights route is an isolated renderer/controller, not identical to the canonical game-runtime surface. First prototype may connect through a North Heights adapter but must specify a migration path and not bake the generator into the route or the 1,100-line city controller.

## 3. System design: separate data, geometry, presentation and physics

**Proposed modules (names provisional, do not create before approval):**

\`\`\`
src/game/interiors/
  interior-schema-001.ts           # versioned semantic contracts + stable IDs
  interior-type-resolver-001.ts    # mapping existing lot/archetype -> six categories
  interior-floorplan-001.ts        # deterministic 2D partitions, doors, path network
  interior-grammar-001.ts          # room purpose / furniture placement rules
  interior-assets-001.ts           # shared mesh/GLB registry, material and refs
  interior-renderer-001.ts         # Babylon meshes, instances, lifetime handles
  interior-physics-001.ts          # Rapier wall, doorway, furniture colliders
  interior-streamer-001.ts         # building/floor/room activation, prefetch, unload
  interior-lighting-001.ts         # room lighting and day/night window presentation
  interior-save-001.ts             # serialize only player-modified state
  interior-diagnostics-001.ts      # p95 load, heap, draw calls, live geometry count
src/game/experiments/north-heights-interiors-adapter-001.ts
src/test/interior-*.test.ts
\`\`\`

The planner is *pure TypeScript*: no Babylon, Rapier or DOM imports. It produces stable semantic plans. Renderer and physics consume the **same** plan; independently reinterpreting dimensions is prohibited. The streamer owns lifetimes and must dispose every Babylon instance, texture/material lease, GLB instance, animation group and Rapier collider it creates.

The exterior lot/visual window coordinates, elevator/floor ring, ground elevation and physical shell remain inputs. Existing NPC and mission interactions are **consumers** of the interior's semantic anchors; they do not authorize random NPC movement into a mission room.

### 3.1 Proposed versioned data contracts

\`\`\`ts
type InteriorCategory =
  | "office" | "apartment" | "shop"
  | "public" | "school" | "factory";

type InteriorId = string; // e.g. NH-04-06-L2:F12:R07
interface InteriorBuildingSpec {
  schemaVersion: 1;
  buildingId: string;
  archetype: string; category: InteriorCategory;
  seed: number;
  origin: {x:number; y:number; z:number};
  footprint: {width:number; depth:number; yaw:number};
  floorCount: number; floorHeight: number;
  windows: readonly WindowSpan[];
  entranceAnchors: readonly Anchor[];
  elevatorShaft: Readonly<ShaftPlan> | null;
  protectedNarrativeZones: readonly ProtectedZone[];
}
interface InteriorFloorPlan {
  floorId: string; floorIndex: number;
  supportY: number;           // same visible and Rapier floor elevation
  envelope: Polygon2D;
  corridors: readonly Polygon2D[];
  rooms: readonly InteriorRoomPlan[];
  doors: readonly InteriorDoorPlan[];
  navigableConnections: readonly Edge[];
}
interface InteriorRoomPlan {
  roomId: InteriorId;
  purpose: string; category: InteriorCategory;
  polygon: Polygon2D;
  doorwayIds: readonly string[];
  fixedFixtures: readonly PropPlacement[];
  optionalClutter: readonly PropPlacement[];
  materialVariant: string;
  lightingPreset: string;
  interactionAnchors: readonly Anchor[];
}
\`\`\`

\`WindowSpan\`, \`ShaftPlan\`, \`Polygon2D\`, \`Anchor\`, \`PropPlacement\` and \`ProtectedZone\` will receive their concrete definitions in Stage 0 after inspecting existing world/schema geometry. Do not duplicate established \`BuildingSpec\` types by copy/paste; adapt into this contract. Serialized schema includes an explicit version and migration handler.

Stable seed: \`hash(cityVersion,buildingId,floorIndex,roomId,grammarVersion)\`, **not** \`Math.random()\`, current time or array position. A save retains the world-generator version used when originally created or an explicit migrated snapshot; content updates must not silently rearrange a previously visited mission room.

### 3.2 Interior category resolution

Map canonical building archetypes and the North Heights \`Lot.family\` separately. Suggested defaults, subject to owner acceptance:

| Existing type | Interior category | Rules |
| --- | --- | --- |
| \`office\`, commercial glass towers | Office | Ground floor may use Public lobby |
| \`loft\`, \`residential\`, \`estate\` | Apartment | Apartment + common Public corridor |
| \`commercial\`, \`mixed-use\` storefront | Shop | Upper residential or office uses based on floor purpose |
| \`civic\`, public reception | Public | Schools only with explicit school zoning |
| \`industrial\`, \`warehouse\` | Factory | Production/storage with Public/Office service areas |
| \`hospitality\` | Public + Apartment-like lodging rooms | Reuse six categories; no new generator mandatory |
| Named schools | School | Must be explicitly tagged, not invented by random selection |

An office tower should not randomly contain an industrial furnace; a school should not have a private-bedroom floor. Use *building-level* functions plus *floor-level* zoning and *room-level* purposes. Special buildings are override-driven: Finch HQ has protected floors/zones and must **not** be changed by default.

## 4. Deterministic, accessible and plausible floor-plan algorithm

1. Acquire the real interior footprint and front-door alignment from the authoritative lot. Subtract wall thickness, shaft polygon, structural/service exclusions, visible window bays and any protected narrative rooms.
2. Determine floor archetype: street-level lobby/shop/service, typical floor office/apartment/classroom, industrial open hall or special approved room. Do not put tiny apartment units in a 53-floor glass tower unless explicitly zoned.
3. Reserve the *navigable spine* before subdividing space: front entrance → lobby → elevator/corridor → all doors. Generate a path-connected corridor graph across the usable polygon. Preserve shaft clearance and existing external door opening.
4. Partition only the residual space using constrained rectangular splits for Stage 1; allow irregular polygons later. No zero-area rooms, overlapping walls, sealed rooms, interior doors opening into walls or corridors ending at dead solid walls. Bounded deterministic retries then conservative fallback (a single large room, not a permanently inaccessible room).
5. Assign purpose based on building/floor context, window access, minimum dimension, and neighbors. Kitchens and bathrooms may be interior to a floor; window-facing rooms should exploit real exterior window bays.
6. Place working hinged or sliding door portals into the actual collision wall geometry. Only show doors that lead to valid traversable rooms. Room occupancy never depends on a mission unlock. Optional locks are explicitly exceptional mission mechanics, not a substitute for missing content.
7. Place furniture in anchored zones: wall-facing desks; beds against walls with space at the foot; shelves against shop walls; classroom rows oriented toward a teaching wall; factory machinery leaving safety aisles. Orientation is semantic, not random.
8. Run collision-free placement validation against doors, windows, hallway route, lift landing, existing geometry and other prop footprints; deterministic resample or omit a cosmetic prop. Preserve navigation width.
9. Guarantee floor-to-floor continuation and save reproducibility. Every \`roomId\` is reachable by at least one graph route from the building entrance on its served floor.

**Working geometry policy (proposed, tune against real character/camera dimensions):** walkable clear corridor target >=1.2 m, door clear opening >=0.9 m, no furniture within 0.7 m of door swing, retain >=0.6 m around core furniture where possible. These are game-design thresholds, not assertions of regulatory accessibility. Do not invent ramps, stairs or accessibility claims. If an existing footprint cannot satisfy these, fall back to fewer rooms or smaller furniture rather than narrower collisions.

*Important:* A visually closed wall without a collider or a solid collider behind a displayed door is a release-blocking defect. Window view, camera blocker and character capsule must agree with the physical room boundaries.

## 5. Believable contents: procedural first, selective GLB second

### Tier A: build from Babylon primitives (no downloads)

Wall and ceiling panels, skirting, floor tiles, switch plates, door frames, basic doors, table and desk tops/legs, counters, cubbies, bookcases, cupboards, basic cabinet faces, display shelving, lockers, simple lamps, monitor shells, chalk/whiteboards, storage pallets and crates, conveyor segments and machine housings. Reuse Babylon mesh templates and thin-instance or ordinary instances where appropriate.

### Tier B: optional small **approved** optimized GLB library

Objects likely to fail a primitive-only realism test: upholstered seating, sofas, office chairs, beds/mattresses, sanitary fixtures, high-detail factory machines and complex appliances. Start by evaluating 15–25 *shared asset families*, not one GLB per room. Each model needs a documented license/provenance, dimensions, forward axis, pivot, scale, wheel/rig status if applicable, material count, triangle count, compression suitability and Android decoding test.

**No acquisition authorization exists yet.** First attempt Tier A office proof. If it fails visually, nominate the exact 1–3 objects that require GLBs and obtain owner approval for their source. Avoid stock/unknown-license assets and the historical large-GLB traffic freeze failure.

### Tier C: inexpensive human-life cues

One or two meaningful low-cost signs of occupation per room: screen on, open notebook, mug on desk, phone, folded clothes, lit lamp, a chair slightly angled, plant, labelled shelf or cleaning equipment. Generate from a bounded clutter grammar. No scattered dozens of physics objects; many cues can be material decals or batched primitives. A believable room *may be sparse*.

### Materials and lighting

Use shared procedural texture atlases/material families for timber, cloth, paint, concrete, tile, metal and glass; reuse \`createSurfaceTexture\` where appropriate. Share material instances across rooms; avoid separate dynamic textures for every chair. Colour groups vary within category and consistent building palette. Respect existing see-through glass/window behaviour; room plan determines believable window silhouettes from outdoors without loading all props. Day/night affects window lighting and limited active interiors, not thousands of new shadow-casting point lights.

## 6. Six generators and functional grammars

| Category | Required first-pass spaces | Typical procedural items | Special constraints |
| --- | --- | --- | --- |
| **Office** | Reception/common corridor, work area, private office, meeting room | desks, chairs, monitor, cabinet, whiteboard | face desks away from walls/windows when sensible; chairs clear desk fronts |
| **Apartment** | entrance, living/sleeping area, kitchen, bathroom; larger units add bedrooms | bed/sofa, table, wardrobe, cabinets, sink-like fixtures | privacy doors, believable door sequence, avoid beds in corridors |
| **Shop** | shop floor, counter, stockroom, staff/service room | shelves, cashier counter, racks, crates | storefront visibility, customer walk aisles and service-side counter access |
| **Public/Lobbies/Corridors** | front entrance, lift lobby, waiting area, corridor, optional restroom | seating, signs, reception counter, planters | mission-specific reception remains curated; shared traversable circulation |
| **Schools** | corridor, classroom, staff office, restroom, optional science room | rows of desks, teaching wall, cabinets, bookcases | teacher sightlines and unobstructed row aisles; school type explicitly designated |
| **Factories** | production hall, storage/warehouse, service corridors, office/control room | machine bases, conveyors, pallets, shelves | high ceilings, truck/loading separation, large clear machinery paths |

Category generators share the same space-planning, door, collider, lighting and streaming infrastructure. Schools/factories are not a copy-paste office with different labels. Shop front windows should show merchandise; apartments should vary in privacy/lighting; corridors must always serve a useful destination.

## 7. Runtime streaming, performance and asset lifetimes

**Critical property:** *every room is enterable in the world model, but not every room is resident in GPU/physics memory*. This is the sole scalable approach at city scale.

Define independently:

- **Tier 0 — City silhouette:** existing exterior building shell, correct transparent/tinted windows and cheap day/night interior-window representation. No full rooms.
- **Tier 1 — Building approach:** prefetch the entrance, immediate lobby and likely first destination in view/near doorway; keep stable structural paths/collision for imminent navigation.
- **Tier 2 — Current floor:** generate corridor, door/room boundaries, nearby room proxies and collision before Reese could walk through. All visible doorways lead to enterable spaces.
- **Tier 3 — Current / adjacent rooms:** high-detail furnishings, active practical lights, small clutter, selective interactions and necessary furniture colliders.
- **Tier 4 — Return/persistence:** unload details with distance/hysteresis, retaining deterministic plans and modified-state overlays; rebuild the same room when the player comes back.

Use a **state machine**, not a naïve distance-only render callback:

\`\`\`text
UNSEEN → PREFETCHED → BOUNDARY_READY → ACTIVE → COOLING → UNLOADED
                                      ↖─ (re-entry) ─────┘
\`\`\`

Warm before crossing a doorway; if a required collider is not ready, preserve an intentionally bounded transition with feedback rather than allowing Reese to pass through a blank/solid room. Never generate a whole skyscraper's floors in one main-thread frame. Limit work per frame, spread geometry updates and GLB decode over frames as needed; cache immutable source geometry. Use a cancellation/version token to avoid late imports attaching to a disposed scene. Avoid duplicate work when player moves between elevator, corridor and room quickly. Preserve the accepted elevator's single live cabin.

**Renderer correctness:** Use \`InstancedMesh\`/thin instances for repeated static decorative geometry; switch to ordinary meshes when independent selection, animation, collision ownership or per-room visibility is required. Thin instances are not independent physics bodies. Batch same-material structural walls when possible without leaking through adjacent rooms. Freeze world matrices on static components where safe. Do not use one huge mesh that forces rendering dozens of unloaded rooms. Handle per-building origin and local-to-world coordinates consistently.

**Physics correctness:** Keep structural walls/doors/floor collision stable across room streaming transitions; optional furniture collision activated only near the room. Align Rapier support Y to visually rendered slab; never pile duplicate coplanar floor slabs. Existing roof/camera clamps and glass elevator cabin rules remain.

**NPC/mission correctness:** Initially NPCs do not spawn in rooms without explicit interior path + destination support. Preserve existing pedestrian routes, Diane surveillance and Finch trigger. Future interior NPC visits require separate nav and story approval.

## 8. Deterministic saving and return visits

World default layout is reconstructed from versioned seed and semantic building/room IDs. Save only deltas: door state, deliberately moved items (if later supported), mission annotations, discovered room status and local lighting overrides. Do not save thousands of redundant meshes or room JSON blobs for unvisited locations. Use existing runtime save conventions; no new unreviewed \`localStorage\` proliferation. Persist the generator version to avoid post-update shuffling. Validate older saves against new schema and support a fallback migration that retains accessible floor/room coordinates. The client should be able to leave the game and return without losing the identity of a room.

Offline: Code-generated primitives and preinstalled/approved optional furniture GLBs must remain available with the game's accepted PWA offline packaging. Do not automatically pre-cache gigabytes of furniture merely because all rooms are enterable. Test package inventory and service-worker behavior for both first install and return visit.

## 9. Performance budget, telemetry and limits (proposed gates, not measured facts)

First capture a baseline using the accepted North Heights preview on representative Android hardware (real landscape PWA) and desktop under stable conditions. The following are **targets for pilot negotiation**, not promises:

1. **No loading freeze** on entering one 100%-procedural office; heavy floor-planning work should be incremental or cached.
2. **Frame-time impact:** aim <=2 ms p95 main-thread increment during steady-state interior viewing on target mobile hardware; transient load spikes must be bounded and visible in telemetry. Frame rate must not regress materially from the same route outside the room.
3. **Memory:** budget +10–20 MiB *incremental active interior resident memory* for the initial mobile proof, measured after warmup. Set hard caps only after real device profiling. Avoid persistent retention after 10 repeat enter/leave cycles.
4. **Activation latency:** target <=500 ms p95 from doorway intent to a navigable and furnished office under warm/locally generated assets, without blank screens or phantom collision; early prefetch may make the experienced crossing instantaneous.
5. **Geometry:** use a fixed shared stock of templates; report active meshes, draw calls, active materials/textures, triangles, colliders and total GLB bytes. Cap *concurrent* detailed rooms, never the number of logically enterable rooms.
6. **Visual quality:** at normal third-person camera distance the room must clearly read as its intended function and contain nonfloating furniture, believable scale, a coherent entrance and one visually meaningful human-use cue.

Record device, browser/PWA mode, viewport and whether assets are cold/warm; a single fast desktop score is insufficient to authorize citywide rollout. If frame/memory goals fail, optimize or reduce active-room radius; do not delete enterability to mask the problem. Stop and investigate regressions of startup/offline flows.

## 10. Implementation stages and approval gates

**Stage 0 — Read-only audit and technical skeleton plan (no gameplay change).** Inventory building classes, coordinates/window openings, structural floors/lifts and actual PWA asset budget. Formalize schemas, transforms, navigability/collider contracts and instrumentation. Identify exactly one representative ordinary office building/floor that does not include Finch. **Gate:** owner approves selected building, proposed office reference target and measurable budgets.

**Stage 1 — One entirely code-generated office room, isolated preview.** Single existing empty office floor/room only: partition, one correct door, desk + chair + monitor + cabinet/shelf, floor/wall/ceiling materials, lighting and Rapier colliders. Do not use new GLBs in this stage. Existing adjacent corridors, lift, shell and gameplay stay untouched. Demonstrate entering, leaving, returning and camera collision from desktop/Android. **Gate:** owner visual and gameplay acceptance, not merely tests.

**Stage 2 — First performance and believability review.** Capture repeatable frame/memory/loading metrics; compare to current empty-room baseline. Resolve any primitive furniture that looks artificial. If necessary, propose exact GLB shortlist and a one-at-a-time A/B trial; do not bulk-import. **Gate:** accepted baseline asset rules and performance budget.

**Stage 3 — Multi-room, multi-floor office.** Build corridor connectivity, valid doors, reliable collision, deterministic persistence and streaming lifecycle; test all floors of selected office tower including elevator transfers and return visits. Mission buildings unchanged. **Gate:** 100% reachability + stability of every planned office room and no regression to the existing lifts.

**Stage 4 — Apartment and Shop grammars.** Reuse the accepted system to generate two additional building types. Validate kitchen/bathroom/privacy, storefront/service routes and minimal clutter. **Gate:** separate approval of both types.

**Stage 5 — Public/Lobbies/Corridors, Schools and Factories.** Add explicit zoning for school/factory building functions, proper hall/corridor roles, stockroom/classroom/production grammar and their navigation. Protect Finch and previously authored narrative rooms. **Gate:** all six categories visually distinguishable and structurally sound.

**Stage 6 — Citywide rollout with a feature flag.** Apply generator to nonprotected buildings progressively using LOD/streaming, deterministic identity, physics cleanup and save migration. Run stress tests in buildings with 1 floor, dozens of floors and 53 floors as appropriate; run offline/Android and mission regressions. **Gate:** owner accepts the actual playtest preview; only then authorize production merge/deploy.

Each stage uses a separate preview-validated commit or set of commits on the agreed feature branch. Do not merge merely because a build compiles. Failed experiments are isolated and reversible (DDD branch decommission if necessary).

## 11. Verification matrix / release blockers

**Pure generator:** stable room IDs and output hashes across sessions and differing camera framerates; constrained partitioning terminates with fallback; no intersecting rooms; usable footprints remain within building; shaft clear; zero sealed rooms; every room has at least one connected path from reachable corridor; stable override rules for protected missions.

**Visual/physics matching:** rendered and Rapier wall/door extents agree; room supports feet at correct Y; no floor z-fighting, door collider blocking an open portal, camera clipping, wall transparency artifacts or missing ceiling; elevators stop flush with intended floor. No static collider leaks after unloading; structural colliders retained while traversable.

**Resource lifecycle:** repeated enter/exits, fast floor jumps, camera rotation inside rooms, scene teardown during async GLB load, restart and offline PWA. GPU/memory counters return within measured envelope; source meshes/materials cached and shared; no hundreds of active lights.

**Game integration:** Reese walk/sprint/jump/fly transitions do not clip through generated doors; Finch's floor 53 remains protected and as accepted; receptionist stays seated; Diane Level 001 remains playable; no new NPC obstruction/teleport anomalies; no changes to road, sidewalk, car audio, map/UI layout or save checkpoint progression.

**Visual realism:** human scale checked against Reese; workstations reachable; no furniture across the door swing; room function recognizable without explanatory labels; warm/cool lighting responds sensibly to day/night; window/interior view matches actual room; 10 nearby rooms do not look copy/pasted despite shared model kit.

**Tests:** Vitest schemas, seeded planner, seeded mutation, connectivity, scene NullEngine construction/disposal, physics obstruction, load cancellation, save serialization, room-door replay and budget smoke tests. Add browser/device gameplay checklist and a baseline-versus-feature telemetry comparison. A green unit suite is **necessary but not sufficient** for a visual acceptance milestone.

## 12. Risk register and mitigation

| Failure mode | Consequence | Required mitigation |
| --- | --- | --- |
| Naïvely build every room in each skyscraper | Android freezes, long loading, excessive GLB bytes | Generate logical plan cheaply; stream visible detail and reuse shared templates |
| Door/shaft/window mismatch with existing building | Unreachable room, visible wall clipping or falling into elevator void | One authoritative geometry plan; same physical/visual coordinates and lint/test invariants |
| Too much randomness | Implausible furniture, room identity changes after reboot | Seeded constrained grammars and building/floor purposes |
| Furniture primitive appearance too toy-like | Visually unacceptable open-world interiors | Single-room acceptance trial; targeted optimized GLB substitution with approval |
| Too many lights and shadows | High GPU cost and inconsistent night lighting | Shared/material-emissive lighting, bounded near-room practical lights, no citywide shadows |
| Stream/unload collision race | Passing through walls, stuck player, blank room | Stable structural collision, staged activation before doorway, lifecycle cancellation |
| Existing saved games or mission rooms overwritten | Loss of progress or broken Finch/Diane sequences | Protected zones, versioned serialization, cross-version tests and explicit migration |
| Asset/license/cache bloat | Deployment slowdown, broken offline play | No bulk imports, provenance manifest, compressed budgets and PWA inventory tests |

## 13. Operational sequence and owner decisions

1. **Now:** Commit *this document only* under \`documentations/Development/\`; do not begin interiors.
2. **Now, after the document:** inspect/fix the separately authorized pending NPC/Finch/sidewalk preview build, if needed, without interpreting this interior plan as approval to implement interiors.
3. **Await explicit implementation approval.** Approved Stage 1 should target a single **ordinary Office** away from Finch HQ and with a direct accessible path from an existing lift.
4. If an asset is not convincing, request approval for a **specific** GLB replacement only after a code-generated visual prototype proves the need.
5. Do not expand to apartment/shop/public/school/factory or citywide rendering until the relevant stage passes the owner gate.

**Definition of final success:** Every designed room in Meridia has a functioning, traversable entry route, belongs to a plausible one of the six categories, remains stable when revisited, looks convincingly occupied at third-person viewing distance, preserves existing mission anchors, and does not materially regress Android/desktop frame time, memory or load behaviour. The system achieves this without having every interior loaded simultaneously.

**Approval status:** PENDING. This is a comprehensive technical plan, not an implementation log or authorization to ship.
