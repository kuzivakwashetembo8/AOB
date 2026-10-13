# GTD-WORLD-003 — Main Branch Audit & Six-System Implementation Plan

**Date:** 2026-10-13 (SAST)  
**Audit ref:** interlinkglobal/GTD, production main at 2833566fb10b69e9df815bc7114188a25e4fba86  
**Status:** SOURCE AUDIT + PROPOSED IMPLEMENTATION PLAN; no engine/world/physics/vehicle behavior changed under this directive.  
**Document location:** documentation-only planning branch, not production main.  
**Owner's hard directive:** Do not commence Meridian world expansion or ambient traffic until (A) all existing buildings pull from dedicated image-derived texture families and (B) cars satisfy a reproducible, correct physical model.  
**Scope of this plan:** 1) generate image textures, 2) connect them to unique buildings, 3) diagnose/fix car physics, 4) create more Meridian vehicles, 5) expand beyond South Ward, 6) implement traffic law and ambient traffic.  
**Governance:** plans for workstreams 4–6 are design preparation only; their implementation remains blocked by acceptance of prerequisite gates.

## A. Evidence and audit methodology

Sources read directly from main:

- Materials: src/game/world-generation/{representation-materials,surface-textures,material-library,experimental-brick-material,building-generator,defaults,first-light-spec}.ts
- World topology: src/game/world-generation/{schema,road-graph,city-registry,urban-composition,block-lifecycle,block-streaming,streaming-policy,validation}.ts; src/game/world/{districts,generated-first-light-world,first-light-runtime-source}.ts
- Physics: src/game/vehicles/{drive-kinematics,first-drive-trial,street-vehicle-physics,street-vehicle-wheels,README}.ts or .md; src/game/physics/rapier-world.ts; src/game/core/gtd-runtime.ts
- Vehicle assets: src/game/experiments/{vehicle-probe-plan,imported-car-evaluation}.ts; src/game/vehicles/README.md
- Traffic: src/game/traffic/README.md
- Regression evidence: src/test/{ferrari-rapier-world-integration,street-vehicle-wheels-grounding,brick-material-trial-a,brick-material-trial-b,brick-surface-production-acceptance}.test.ts
- Governance: documentations/Research/GTD-RND-MAT-001*, GTD-RND-MAT-002*, documentations/Development/GTD-RND-MAT-003*, GTD-WORLD-002 Ferrari L0 Physics Hardening and Street Objects and Vehicle Movement Plan, and Meridian Game World Development SOT.

This is a source-level audit. No live desktop/mobile driving investigation, GPU profiling, independent tire-force tests, or new automated test execution was performed by this planning task. The preceding MAT-003 release validated 205/205 tests, but that passing suite is **not** proof of physically correct tire/traffic behavior.

## B. Current-state evidence (facts, not aspirations)

### B1. Building materials

1. first-light-spec.ts contains ten authored buildings, five segments across Mercer Street, Workshop Road and Foundry Lane, six road nodes and two T intersections.
2. MAT-003 accepted one image asset, public/brick-wall-image.webp (1774x871 WebP, ~639,570 bytes; source blob 7a6d9bfd8730f852c55d439ffe01a622bba5d1dc). experimental-brick-material.ts explicitly maps only sw-fl-south-apartment to compactA (1.350m horizontal tile) and sw-fl-garage to standardB (1.485m horizontal tile). Both load by default in /game and can be compared to procedural by ?gtdBrickTrial=0. The name/comment still contains historical 'trial' language, but the main deployment acceptance is explicit.
3. The other **eight** buildings have named *procedural* facade material families (brick, concrete, plaster, block, metal) and deterministic 64x64 / 128x128 RawTexture generation; that is not the requested dedicated image-texture coverage.
4. BuildingMaterialLibrary caches procedural StandardMaterial recipes by deterministic keys. Accepted WebP has a separate scene-scoped shared Texture lease. Neither constitutes a general-purpose source-asset registry with explicit building-by-surface assignments, version pinning, fallbacks, dependencies and quality tiers.
5. Current building-relative x/y and z/y UV projection fixes per-box brick scaling for the two allowed buildings, but the image applies to all faces of wall-role boxes. Garage interior-facing walls may thus receive the exterior treatment. Corner handedness, LOD transitions, mip seams and roof/trim assignments still need real-image acceptance.

### B2. Vehicle behavior

1. src/game/vehicles/drive-kinematics.ts implements a bounded bicycle-style yaw-rate model at max 8m/s forward, 3m/s reverse, acceleration 4.5m/s², brake 9m/s², steer ±0.5rad and wheelbase 2.65m. These are current *trial values*, not measured vehicle-class specifications.
2. StreetVehicleActor in first-drive-trial.ts is a Rapier **kinematicPositionBased** rigid body with a single cuboid collider, moved by a KinematicCharacterController. Desired speed/yaw come from throttle/steer commands; the solver corrects travel against the world. It does **not** derive traction, braking or yaw from actual wheel-ground forces.
3. Existing hardening provides gravity-oriented descent, supported-ground state, snap/autostep, 0.21m curb climb, genuine 0.22m garage-sill no-step policy, separate safe disembark from current vehicle location, and quaternion wheel pivot animation.
4. WheelRoll uses *distance already travelled* to rotate source GLB pivots. The four visuals are **not** independent physical wheel bodies, springs, tire contacts, steering knuckles, or friction-force sources. Status of 'wheelRigReady=true' means the art pivots were found; it does not mean physically accurate dynamics.
5. The game's physics.world.step() remains inside MeridianPhysics.movePlayer(). The driving branch calls vehicle.prepare(), movePlayer({0,0,0}), then vehicle.finish(). A multi-agent traffic world needs one explicit centrally owned fixed simulation step and independent actor prepare/finish phases.
6. Documented owner-observed past failures: VM-G01 excessive garage threshold climbing, VM-G02 intermittent hover/floating, VM-G03 sliding appearance/inert wheels; fixes were desktop accepted as L0 but the nonreproducible hover mode and physical realism beyond kinematic L0 remain open. Treat newly reported symptoms as incidents with evidence, not confirmed duplicate root causes.
7. Further **source-supported risks, not claimed observed defects**: car yaw is updated from requested kinematic steering even when translational travel is obstructed, commanded speed can disagree with achieved velocity after collision, all four wheel-ground contact patches are absent, and an axis-aligned cuboid swept/rotated through tight static geometry cannot model narrow vehicle body clearance precisely. Reproduction is mandatory before an incident is labeled confirmed.
8. Only one Ferrari is controllable; the fixed parked buggy remains an evaluation asset. The Ferrari and buggy are remote GLBs with unresolved commercial rights. The Ferrari model's dimensions were calibrated with image-deformation trial multipliers, not official physics specifications. There is no approved original playable GTD fleet.

### B3. Geography, streaming, traffic

1. first-light-runtime-source.ts chooses generated-first-light. generated-first-light-world.ts synchronously creates all First Light buildings by resolveCityBuildings(FIRST_LIGHT_CITY_SPEC), plus present-day streets, props and garage.
2. src/game/world/districts.ts describes twelve Meridian district identities (Central, South Ward, Old Meridian, Harbor, North Heights, East Market, Strip, Ironworks, West End, University, Civic Square, Outer Ring). **Descriptions are not mounted playable geometry**; FIRST_LIGHT_CITY_SPEC currently contains only south-ward.
3. CitySpec, RoadGraphPlan, CityRegistry, BlockLifecycle and updateBlockStreaming are useful scaffolding, but current generated-first-light-world.ts instantiates the hardcoded South Ward spec directly; streaming is not yet the general runtime world owner.
4. Current road data has centerline nodes/segments, road widths, lane counts and T junctions. Road-graph.ts plans asphalt and curbs; projectToRoad returns a nearest segment tangent. There is **no directional lane graph** with legal side of road, lane connectors, turn restrictions, routes, signals, stop/yield rights, crosswalk rules, spawn/despawn or NPC agent controllers. src/game/traffic/README.md is a placeholder.
5. The project uses 8m wide/two-lane First Light local roads with 3.75m sidewalk definitions. Do not infer every Meridian future roadway should have those dimensions.
6. Road names are provisional in the code, not yet a legally accepted signed road-name catalogue. Choose driving side/jurisdiction before traffic implementation rather than assuming a side from user geography.

## C. Global dependency locks and delivery policy

**G0 — audit/measurement baseline** precedes coding. **G1 — all existing buildings have accepted image families** and **G2 — vehicle physical integrity accepted** are independent required prerequisites. **G3 — original Meridian fleet integration** depends on G2 for moving actors. **G4 — expansion beyond South Ward** and **G5 — ambient traffic activation** MUST remain blocked until *both G1 and G2 are signed off*. G5 also depends on lane metadata/connectors and at least one validated unbranded fleet vehicle from G3. G4/G5 architecture and asset specifications may be drafted but **not run in production** before these conditions.

Every workstream goes through: inspect current runtime -> document discrepancy -> implement behind explicit scope-controlled feature switch -> add headless/real-physics tests -> ship a preview -> owner desktop acceptance -> owner mobile/performance acceptance -> promote when explicitly authorized. Prefer existing renderer, Rapier world, CitySpec, seed and IDs; avoid hidden replatforming.

Do NOT:
- replace accepted authored collision geometry with painted boxes, image window photographs or fictitious vehicle barriers;
- convert the brand-encumbered Ferrari into a final Meridian-branded commercial asset;
- call deterministic visual wheel animation physics correctness;
- silently use procedural toy cars in live player/traffic proximity;
- claim a performance or browser quality result from a headless test;
- expand traffic/world prematurely to make demos appear inhabited.

## 1. Workstream MAT — Generate image-derived texture families

### MAT-0: Complete First Light family catalogue
Inventory exact material roles by building/facade: exterior masonry/wall, ground-level storefront, roof, coping/parapet, window frames, door/garage metal, base/sills, concrete/paving where appropriate. Record whether the surface must physically wrap a corner, where it touches openings, its normal metres-per-tile, distance LOD and shader path.

**Initial proposed image families (owner palette approval required):**
- masonry / warm red/brown running-bond brick (accepted existing material);
- masonry / dark or aged brick, light/pale brick (can be separate assets or carefully controlled tints if natural texture survives);
- concrete / weathered cast concrete and precast panels;
- masonry / painted or unpainted concrete block (CMU);
- plaster/render / warm paint and aged stucco;
- industrial / sheet or ribbed metal, door/shutter finish;
- rooftop / membrane, gravel or weatherproof metal where visible;
- storefront / metal trim and glazing (glass remains an engine-specific optical material; never just photograph windows into masonry).

One family is reusable by many buildings; 'dedicated' means each building has a **deliberate approved family assignment**, not that ten buildings demand ten identical downloads. Architectural identity comes from family + variant + palette + scale + weathering + facade-level composition.

### MAT-1: Authoring contract per image
A single repeatable wall swatch; frontal orthographic/no lens perspective; no decorative windows or lights baked into the diffuse texture; consistent physical module and joints. Source may be generated, photographed under acceptable rights or manually finished. Owner checks subject matter and scale. Define:
- asset ID and version; source/provenance/redistribution rights; source/master and shipped URLs;
- measured pixel dimensions, colour space, physical width/height, tileability directions, material category, opacity, allowed roles and variants;
- flat/albedo daylight-balanced WebP first; normal, roughness and ambient occlusion maps only as independent approved additions and only when aligned to the same source UVs;
- no shadows/reflections baked in that fight Meridian's day/night lighting; test against existing sun and lamps;
- approved master and optional mip/texture compression derivative for desktop/mobile; never blindly ship master dimensions.

**Seam workflow:** (i) design repeat bounds, with half-height mortar at top and bottom when a brick pattern requires it; (ii) running-bond A/B rows have complementary half-brick endpoints, not arbitrary edge mortar; (iii) equal source-edge color alone does not guarantee relief-grain continuity; (iv) compare 2x2 and 3x3 repeated tiles in daylight and steep-angle sampling; (v) correct edge bricks and mip bleed manually if necessary; (vi) compare pixel-level seams, brightness drift and world-mapped scale. Save diagnostic tiles beside the versioned master, not in shipped public unless needed.

### MAT-2: Asset packaging / budgets
Produce master -> seam-QA -> optimised WebP -> manifest -> small/mobile derivative if justified -> optionally KTX2/Basis GPU compression with verified compatibility/fallback. Test Safari/iOS and Android separately. Every load must have deterministic opaque procedural fallback and return a diagnosis if missing/corrupt. Track encoded bytes AND decoded GPU cost and mipmaps. For accepted 1774x871 RGBA8 image the uncompressed base is approximately 5.89MiB and full mip chain approximately 7.85MiB; the 639KB download is not GPU footprint. Set scene/texture budgets from baseline device measurements, not assumed marketing specifications.

**MAT deliverables:** Texture family library, at least six owner-reviewed base surfaces/variations as required by the ten-building audit, manifest entries, seam QA sheets, licensing register, memory/performance matrix, rollback mapping. Asset count is provisional; final family count follows facade audit and owner acceptance.

## 2. Workstream BLD — Connect families to unique buildings

### BLD-0: Registry migration
Separate (a) image asset identity, (b) family + acceptable variants, (c) physical-scale preset, (d) per-building/per-facade assignments and (e) material resource leasing. Evolve MAT-002 rather than duplicating a new brick-specific hardcoded switch.

Proposed contracts (illustrative):
~~~
SurfaceAsset { id, version, publicPath, pixelWidth, pixelHeight, sha, rights, opaque, fallbackFamily }
SurfacePreset { id, physicalWidthM, physicalHeightM, uvOriginPolicy, allowedRoles }
BuildingSurfaceAssignment {
  buildingId, exteriorWall, facadeOverrides?, base?, roof?, trim?, storefront?,
  familyId, variantId, presetId, weatheringSeed, fallbackId
}
~~~
Validation fails if a live authored building has no approved exterior-wall assignment, missing file, unsupported family/role, contradictory aspect/scale or duplicate unstable ID. A fallback remains *runtime safety*, not a substitute for successfully provisioning the dedicated family.

### BLD-1: Proposed First Light mapping for owner selection

| Exact building ID | Primary proposed exterior image family | Intent |
| --- | --- | --- |
| sw-fl-west-support | warm/dark residential masonry | inhabited, varied but related to apartment |
| sw-fl-garage | **ACCEPTED** red-brown brick, standardB | keep current material and garage opening |
| sw-fl-east-support | weathered concrete/precast | office / service building |
| sw-fl-south-apartment | **ACCEPTED** red-brown brick, compactA | do not visually regress |
| sw-fl-corner-commercial | painted block/render + shopfront trim | retain storefront distinction |
| sw-fl-skyline-west | weathered concrete or aged masonry | mid-distance skyline |
| sw-fl-skyline-east | pale precast / concrete | distinguish tower masses |
| sw-fl-rear-residential | residential masonry family, alternative tone | local continuity with non-identical homes |
| sw-fl-rear-shop | painted block or aged plaster | neighborhood retail identity |
| sw-fl-rear-workshop | industrial concrete/block with metal | workshop utilitarian finish |

These are **proposals**, not yet authorized image selections. Roof, base, facade fragments and doors receive explicit companion roles rather than indiscriminately inheriting wall images. Preserve materials/physical geometry of glass and door openings. Asset reuse is encouraged; unique identity does not equal wastefully unique texture files.

### BLD-2: Coordinate system and implementation
Keep building-relative metre UVs, real source aspect ratio, shared facade origin and tile repeat across window segmentation; never stretch whole images to wall width. Validate front/rear and side handedness, flipped facades, corners, roof caps and window reveals. Extract generalized ImageSurfaceLibrary (scene-owned asset cache/refcount), SurfaceAssignmentResolver and applyPhysicalSurfaceUV; adapt BuildingMaterialLibrary for source-backed resources without creating one Babylon Texture per building. Consider face-specific wall material IDs for garage exterior-vs-interior but do not alter portal collision. Keep batching policy: near hero walls can retain individual custom UVs; test true UV-transform batching/mesh merge for multi-block rollout instead of permanently multiplying draw calls. Maintain far LOD material quality and bounded streaming lifetime.

### BLD-3: Coverage/evidence gate — **G1**
- 10/10 First Light building IDs explicitly resolve to an accepted image-derived exterior family; no hidden materialRecipe-only wall fallback under normal successful loading.
- Each family has a valid source/version/path, repeat QA and correctly matched visual geometry; every major visible material role intentionally assigned or specifically exempted (e.g. shader-driven transparent glass).
- Exterior corners, flat/steep camera angles, near/far, day/night, doors/windows, garage bay and interiors visually reviewed.
- Missing/corrupt image fallback remains opaque/nonblocking, with a visible diagnostic; the baseline 2 accepted facades unchanged.
- Mobile and desktop image load, draw count, GPU estimated memory, frame time and perceived clarity measured relative to MAT-003; pass agreed budgets.
- Build, typecheck, complete regression suite, new coverage tests, owner sign-off. Zero missing assignments on a production manifest.

## 3. Workstream VEH-P — Identify and repair incorrect car physics

### VEH-P0: Reproduction first, not arbitrary constants
Establish a physics incident register with states: confirmed failure, regression covered by tests, hypothesis awaiting reproduction, or intentional kinematic L0 limitation. Known historical VM-G01 threshold, VM-G02 transient hover, VM-G03 wheel visuals should be retested, not automatically treated as still broken. Instrument a reversible on-device diagnostic overlay or downloadable JSON (no automatic personal data upload):
- simulation tick, actual input, desired/achieved velocity, acceleration, yaw and yaw rate;
- chassis pose, Rapier body pose, collider contacts, support gap and grounded interval;
- steering/visual wheel angles, wheel spin from distance, wheel pivot readiness;
- world surface/grade, curb/threshold semantics, fixed-step overruns, collision/penetration status;
- asset source + actual dimensions, frame/render time, mobile device tier.

Construct reproducible paths in the *real* South Ward: flat straight road; full-stop/reverse; standing full lock; left/right turns; sustained circle; curb approach at 0.21m; genuine no-step garage 0.22m; drop-off; sloped/crossfall transition; side-on impact with wall/parked car; tight-curve, interrupted high-speed steering; drive-exit-reboard. Record before/after reproducible cases, never invent a root cause from a screenshot.

### VEH-P1: Physics contract and simulation ownership
Choose with owner what 'correct physics' means for GTD. Recommended target **game-realistic wheel-contact motion** rather than claiming Formula-racing simulator precision:
- VehicleDynamicsSpec: mass and center-of-mass, collider proxy, wheelbase/track, four wheel positions and radii, suspension rest/travel/damping/spring constants, driven/braked axle, steering limit and speed sensitivity, drivetrain/gear behavior, torque/brake limits, per-surface tire longitudinal/lateral grip and slip response, drag/rolling resistance, collision response.
- Standard SI units and explicit local forward/up axes; imported visual nodes separately mapped to physics chassis.
- One central PhysicsTickCoordinator: (1) collect player/AI commands; (2) prepare all dynamic vehicle forces/contact queries and character requested movement; (3) **exactly one** Rapier world.step per fixed 1/60s tick; (4) sync wheel and chassis visuals; (5) publish telemetry/contacts. Preserve existing walking and garage collision invariants. No second hidden world.step for each car; no physics movement tied to whether Voight currently drives.
- Decide implementation after a spike against installed Rapier JavaScript API: dynamic rigid body plus four raycast/wheel suspension force applications, or alternative measured axle/contact constraints. Do not assume a built-in Rapier vehicle solver exists until the installed library's API is verified.

### VEH-P2: Concrete defect/risk remediation sequence
1. **Pose and contact synchronization**: compare actual Rapier translation/rotation and collision-resolved velocity with commanded speed/yaw. When blocked, stop accumulating fictitious speed and visual heading; prevent pivot-through of walls/vehicles.
2. **Grounding/floating**: distinguish suspended chassis, geometry collider offset, missed ray hits, road seam discontinuity, interpolation lag and real airtime. Four contact probes and support metadata replace sole centre ray assumption; keep true gravity, no visual snap teleport.
3. **Wheels and suspension**: retain reliable quaternion wheel pivots; attach each to its actual contact/spring state. Show spring compression, wheel roll, appropriate lateral steer and visible body pitch/roll (bounded, physically derived), not arbitrary bobbing.
4. **Traction, braking and steering**: replace purely commanded bicycle yaw with measured dynamics and velocity-aware controls; tune steering response vs speed, longitudinal acceleration/brake, friction, reverse and collisions across asphalt, curb, wet-looking materials where gameplay physics differs. Visual 'wet' appearance alone does not justify a friction change.
5. **Structural collision**: improve body collider geometry only when collision witnesses prove need; maintain correctly sized garage sill/camera and pedestrian interactions, safe exit, parked/static separation; avoid false invisible walls.
6. **Class calibration**: move Ferrari-specific limits/forward sign/wheel pivot names into a source adapter; test physics first on a neutral, rights-cleared unbranded sedan rig. Imported Ferrari remains comparison reference and licensing caution, not an unavoidable core dependency.

### VEH-P3: Exit gate — **G2**
Tests must cover time-step determinism and finite poses; acceleration/braking/reverse; straight tracking and symmetrical turning; stationary/full-lock collision; four-wheel contact and suspension load; curb vs garage sill; slopes/drop-offs; vehicle-to-wall and vehicle-to-vehicle collision; safe exits; pause/resume and state persistence. Numeric tolerances (stopping distance, grip/turning radius, settle time, body ground clearance, penetration tolerance) must be defined against the measured dimensions of each approved model **before** final tuning. Use real Rapier integration tests, automated long driving replay, browser/video witnesses and mobile control testing. A passing Euler quaternion animation test alone cannot close G2. Owner approves physical feel and absence of reproduced defects on desktop and mobile.

## 4. Workstream VEH-F — Generate original Meridian vehicles

### VEH-F0: Fleet roles and provenance
First production aim: an **original four-door civilian sedan** designed for Meridian, then economical hatchback, fleet/utility van or light pickup, and a distinctive district service vehicle. A small approved roster beats a dozen superficial reskins. Each vehicle uses:
- rights-cleared/original authored model, own silhouette and brand-neutral visual identity;
- real calibrated local bounds, pivot/root axes, four correctly named/oriented wheels, tire radius, wheelbase and track;
- LOD0 near with high-quality wheel/material detail, LOD1/LOD2 reduced poly/detail, distant traffic impostor only beyond controlled draw distances; collision proxies separate from render mesh;
- materials/variant colour palettes with shared roughness/metal/paint assets;
- physics profile from accepted VEH-P, handling group and damage/interaction placeholders only if separately authorized;
- headlights/brake lamps/turn indicators driven by actual car state, not permanently glowing decals;
- manifest containing format, content hash, rights, download bytes, decode/GPU estimates, rig test results.

### VEH-F1: Production workflow
Concept brief/dimensions -> original shape and low-poly/high-poly design -> clean GLB pivot hierarchy and transform -> mesh/material/normal processing -> physics/raycast rig calibration -> deterministic adapter manifest -> driving test -> traffic representation tiers -> field QA. Image references are reference only, not stand-ins for required 3D source, editable joints or working behavior. Prefer original in-repo or approved CDN-hosted immutable assets with offline-manifest future compatibility; **do not** continue indefinitely on provisional forked Ferrari/buggy licensing.

### VEH-F2: Asset and physics separation
One VehicleCatalog entry per model with stable id, import URI, version, footprint/center, wheel mapping, contact physics profile, role and LOD. A VehicleFactory creates a vehicle shell and adapters, and optional PlayerDriver or AIController emits the **same input/force contract**. AI cannot move a mesh independently of actual collision when near player. The car source should not require named Ferrari-specific branches in gtd-runtime.ts.

### VEH-F3: Fleet release gate — **G3**
At least one original sedan licensed/owned for intended use, steering/braking/suspension/contacts tested with approved G2 solver and real GLB; no pivot missing, no wheel/body clipping, no false grounded reports, no different handling due solely to mesh scale. At least two visual variants and an additional complementary body type before any diverse ambient fleet launch. Measure mobile spawn, render, load and disposal cost.

## 5. Workstream GEO — Expand beyond South Ward (BLOCKED until G1 + G2)

### GEO0: City topology before asset spawning
Treat src/game/world/districts.ts as **narrative city identities**, not 12 playable district instances. Select one physically adjacent expansion zone only after owner fixes Meridian geography, neighboring district connection, road hierarchy and visual identity. Do not guess that the closest named district in the narrative must border South Ward. Define district and neighborhood IDs, world coordinate boundaries, street/parcel ownership, stable blocks/lot IDs, elevations and a continuous route back into South Ward.

### GEO1: Generalize First Light
Refactor generated-first-light-world.ts from a hardcoded FIRST_LIGHT_CITY_SPEC invocation toward a world-composition controller consuming CityRegistry/CitySpec. Preserve existing 10 buildings and native street physics exactly. Activate existing block lifecycle/streaming policy (85m load /125m discard are current defaults, **not yet validated expansion budgets**). Keep world and car physics step centrally owned; stream visual blocks, sidewalks, static colliders, vegetation, source textures and lights with matching acquire/release lifetimes, avoiding pop-ins within camera and vehicle stopping ranges.

### GEO2: Road and building continuity
Build one connected, collision-consistent physical urban grid with proper intersections and cut curbs. Define terrain/slope, straight/curved transitions, lanes/sidewalk surfaces, driveway/garage semantics, signage anchors, parking bays, bus/freight access and road class. Integrate new buildings only through same G1 material registry and asset budgets. Add correct scenery transitions rather than pasting a district-colored set of boxes.

### GEO3: Streaming/performance and replay gate — **G4**
Pass stable-seed city rebuild and exact ID reproducibility, collision and route graph connectivity, no vehicle fall-through, no physics gaps at chunk boundaries, delayed GLB/texture readiness and fallback, no surprise unload while moving, no multi-second mobile freezes, bounded scene/GPU memory after repeated crossings, proper return traversal to South Ward. Preserve playability at previous test-device quality settings. A small adjacent expansion with real continuity is better than 12 placeholder districts. **No implementation of GEO begins until G1 and G2 acceptance.**

## 6. Workstream TRAF — Traffic rules and ambient vehicles (BLOCKED until G1 + G2)

### TRAF0: Traffic jurisdiction/policy decisions
Owner must choose Meridian's driving side and road rules before concrete lane geometry; player locale is not a substitute for fictional city law. Define per-road speed limits, signage, lane count/direction, one-way rules, curb/parking permissions, priority control at junctions, crossings, road closures, stops and time-of-day density. Rules must derive from **authoritative road data** shared with the renderer and game physics, not independent if-statements per NPC.

### TRAF1: Directed lane-level road graph
Extend RoadSegmentSpec with operational fields or a versioned adjacent TrafficRoadSpec:
- directional lane geometries (centerlines/polyline curves), width, direction, speed, class, allowable turns, entry/exit;
- junction approach/stop lines, conflict zones, permitted turn connectors, yield/stop/signals and signal phases, clearances and permitted crosswalk intervals;
- pedestrian crossing polygons, walk/right-of-way rules and parking access;
- edge/connector validation, route A* or Dijkstra cost, deterministic random destination/turn choices, route replan behavior.
An 8m two-lane South Ward road is a starting physical template, not a hardcoded full-city constraint.

### TRAF2: Agent behavior
Agent state machine: unspawned -> entering lane -> cruise/car-follow -> approach junction -> yield/stop/signal -> traverse conflict zone -> route transition -> exit/park/despawn. Use bounded acceleration/braking, sufficient headway from actual achieved speed, leading vehicle detection, anticipation near stop lines, turn indicator intent and recovery from blocked lane. Prevent collisions with Voight, parked vehicles, the player-driven car and environment; no ghost movement through cars or magical high-speed teleporting.

### TRAF3: Shared physics/control path, scalable LOD
At near range, AI vehicles use approved VehicleFactory and same VehicleDynamicsSpec/contact/collision layer as player-owned cars, with *AI input* instead of a different mesh teleport algorithm. At medium/far range, allow lower-frequency decisions, simplified dynamics/visual representation while maintaining deterministic safety and continuity at promotion boundaries. Use population and memory caps based on device/frame budgets. Intersection arbitration and deadlock prevention should be deterministic and inspectable, not just randomized delays. Spawn only at verified road-network ingress points and outside immediate player view; never spawn overlapping active agents. Persist/restore traffic only if save-state requirement approved.

### TRAF4: Progressive rollout and controls
Start with a closed **single lane loop / dedicated safe test route**, one vehicle, no pedestrians; then two cars headway/following; then a real First Light T-junction yielding and turning; then player-car interactions; then crossings/pedestrian priority; finally time-of-day traffic density and expansion boundary continuity. A corridor with two dead ends should have legal turnaround or explicit entry/exit semantics, not cars oscillating arbitrarily. Signals only after authored signal hardware/phase contracts exist; use stop/yield priority at unsigned T-junctions in earlier trials when approved. Traffic density and model mix must fit district identity and measured mobile budgets.

### TRAF5: Safety and acceptance gate — **G5**
Zero illegal lane transitions or oncoming-lane driving in deterministic test circuits; all authored stop/yield controls respected; no overlap on spawn; junction occupancy exclusive at conflict intervals; vehicles stop safely for pedestrians and obstruction; bounded queue/unstick behavior without clipping; deterministic route replay across world-chunk boundaries and pause/resume; near cars have physical contact and visual wheel/steering parity; no visible pop-in or surprise unload. Performance target is an agreed number of simultaneously active *near* dynamic cars at the measured reference device quality and budget, not an untested arbitrary fleet count. Day/night lights, road speed signage, collisions, player proximity and graceful overload throttling all require owner field acceptance.

## D. Implementation ordering, tickets and tangible deliverables

| Order | Work package | Scope / output | Dependency / release rule |
| --- | --- | --- | --- |
| 0 | AUD-01 — evidence capture | 10-building role map; car physics incident traces; metrics at desktop+mobile; real repo/file manifest | Start immediately as audit/QA |
| 1 | MAT-01 — texture authoring | owner-reviewed family art direction, source/version/rights, orthographic tiles, seam sheets | G1 component |
| 2 | MAT-02 — source registry | shared ImageSurfaceLibrary, per-family presets, opacity and fallback, KTX2 assessment | G1 component |
| 3 | BLD-01 — building bindings | 10 explicit assignments and per-role material surface mapping; UVs, corners, LOD and garage test | G1 component |
| 4 | BLD-02 — acceptance | 10/10 manifest, screenshots, mobile texture/memory profiling, full regression and visual sign-off | **Closes G1** |
| 5 | VEH-P01 — instrument and reproduce | incident register, deterministic road/collision course, measurements for kinematic gap | G2 component; can run concurrently with MAT |
| 6 | VEH-P02 — shared tick / solver spike | central fixed step and measured dynamic tire-contact prototype; preserve player+car baseline | G2 component |
| 7 | VEH-P03 — physics correction | chassis contact, suspension, steering/grip/brake, collisions and wheel visuals | G2 component |
| 8 | VEH-P04 — acceptance | quantitative replay, real car rig calibration, desktop+mobile sign-off | **Closes G2** |
| 9 | VEH-F01 — original Meridian sedan | rights-cleared original source, rig, physics/LOD manifests, QA | G2 for active integration |
| 10 | VEH-F02 — fleet variety | hatchback, utility/service body; validated variants and shared factory | G3 |
| 11 | GEO-01 — first expansion neighborhood | topology and spatial plan, owner-selected adjacency, connected street/network | **Cannot start implementation until G1 + G2** |
| 12 | GEO-02 — streaming district slice | physically contiguous visual+Rapier map with proper acquire/discard | G4 |
| 13 | TRAF-01 — rulebook and lane graph | traffic side, intersection priorities, directed lanes/connectors/crossings | Plan early; implementation gated G1 + G2 |
| 14 | TRAF-02 — deterministic AI corridor | 1 -> 2+ vehicles, follow/stop/turn, shared near physics and measured far LOD | G2 + G3 + lane graph |
| 15 | TRAF-03 — production district traffic | junction controls, pedestrians, traffic density and cross-chunk simulation | G4/G5 + owner approvals |

**Parallelism:** while image families are authored, gather car physics evidence and test a solver on an isolated experiment branch. This does not violate the release gate. Do not simultaneously publish world expansion or ambient traffic into main.

## E. Cross-cutting engineering and quality checks

- File and ID integrity: one immutable asset registry; no unlicensed imported vehicle becomes commercial stock; deterministic city and car IDs; complete source-attribution manifest.
- Collision/render independence: real 3D geometry and Rapier colliders authoritative, no texture masks as physical windows, no oversized invisible threshold blockers, explicit garage interior semantics.
- Observability: capture loaded image families, fallback counts, texture bytes, GPU allocation estimates, image load latency, draw calls, per-agent simulation time, wheel contacts and physics timestep warnings; separate frame-time from simulation time.
- Mobile compatibility: preserve existing mobile pixel-coverage clarity and camera/touch settings; compare same build with explicit isolated feature flags and quality tier. Establish reference device and performance targets from baseline **before** lock-in.
- Asset/version cleanup: dispose/unload building material leases, physics collider handles, wheel rigs and traffic agents in one lifecycle; repeated district boundary crossings and pause/resume must not grow memory or multiply colliders.
- Release process: docs/branch scopes, reviewed changes, TypeScript and full tests, real Rapier tests, Vercel preview, owner visual acceptance, then independently authorized main merge; record rollback and deployment SHA.

## F. Decision log and questions to settle before implementation

1. **Texture aesthetic:** approve the ten-building provisional family mapping and decide whether roof/trim/metal count in the first 100% image-derived coverage gate. Recommendation: every prominent exterior surface must be explicitly treated; shader-driven glass remains an exempt, purpose-built material.
2. **Physics fidelity:** confirm goal is a credible four-contact dynamic road-car model (recommended) rather than Ferrari L0 kinematic visual improvements only. Record acceptable braking, curb, turn, suspension and collision witnesses from game-play footage.
3. **Original vehicles:** approve first sedan's proportions/identity and source-license requirements before imported reference cloning. Determine minimum initial fleet count after performance measurements.
4. **Geography:** choose which geographically adjacent district/neighborhood connects to South Ward; district descriptions do not specify the road edge; decide block dimensions, terrain and major street plan.
5. **Jurisdiction and safety:** decide Meridian left/right driving side and legal intersection priority before lane graph implementation.
6. **Release/budget:** select target desktop/mobile reference devices and what constitutes acceptable stable frame performance, loading delay, GPU memory, and near dynamic car population.

## G. Immediate authorized next steps

**Start only G0, G1 preparation and VEH-P0 diagnosis:** capture baseline screenshots/physics telemetry, obtain building-family approval, create image-source and UV test fixtures, inventory existing ten buildings, and reproduce vehicle defects with the current Ferrari. No world expansion, ambient cars, additional road networks or new auto-driving behavior should begin until G1 and G2 are independently signed off. Produce a written evidence report at each gate.

**Audit conclusion:** the accepted brick image method is a credible, narrowly proven renderer capability; the playable city material coverage, true vehicle physical dynamics, rights-cleared reusable fleet, directed lane traffic graph and multi-district streaming runtime remain development work. The proposed plan uses existing Babylon + Rapier + deterministic CitySpec foundations rather than replacing them.