# Meridia: First Light — Milestone 03 Implementation Plan

Status: FL-3 COMPLETED AND ACCEPTED (2026-10-09); FL-4 AUTHORIZED AND IN PROGRESS — measurement and acceptance gates outstanding. Production promotion remains separate.
Date: 2026-10-08
Project: GTD — Grand Theft Division
Predecessors: 01 GTD Shell (accepted); 02 Meridia Genesis (accepted).
Research: [Realistic 3D Browser Worlds](./realistic-3D-browser-worlds-research.md)
Technical source of truth: [Meridian Game World Development SOT](./Meridian%20Game%20World%20Development%20SOT.md)

## Mission

Prove that GTD can deliver a believable, interactive, performant urban scene in its chosen visual language: **grounded cinematic stylization**.

The target is not human photorealism. The target is a world a few implementations away from human realism: readable, stylized geometry with convincing proportion, material response, lighting, surface detail, motion, atmosphere, and physical interaction. Visual references include GTA: San Andreas and Payback 2, but GTD must use original geography, assets, signage, characters, vehicles, and art direction.

**First Light is a representation laboratory, not a South Ward district build.** No district-scale expansion begins until the visual construction method, interaction model, asset doctrine, and measured device behavior are validated.

## Experience target

Voight can walk through one original South Ward street corner, read it immediately as a believable working-class Meridian place, approach a local business, pass through one functional entrance into a compact interior, and return outdoors.

The scene must hold up under:
- normal third-person walking distance;
- close inspection of building corners, doors, ground surfaces, vegetation, and props;
- wider street framing;
- changing camera angles;
- motion, not only screenshots.

A visually successful still image is insufficient if the illusion collapses while moving.

## Reference observations incorporated into this plan

Casual Payback 2 screenshots supplied during planning produced several practical observations:

- **Trees:** likely hybrid assets: genuine low-cost 3D trunks/major branches plus layered alpha foliage cards arranged at multiple angles, with simpler distant representations. The crown preserves volume without dense leaf geometry.
- **Buildings:** largely simple box-like structural masses with facade textures carrying most apparent complexity: brick/block pattern, windows, shutters, grime, panel seams, storefront treatment, and aging. Selective geometry appears only where silhouette, openings, corners, or interaction justify it.
- **Ground planes:** roads, sidewalks, curbs, grass, paths, crossings, drainage edges, and surface transitions establish much of the urban credibility before high-detail assets do.
- **Density:** convincing urban readability does not require maximal prop counts. Correct categories, scale, spacing, ground contact, and composition can make a sparse scene feel coherent.
- **Failure mode visible at close range:** flat facade tricks weaken when viewed obliquely or very close. GTD should therefore spend real geometry selectively on hero edges, recesses, entrances, windows, trim, and other close-read features.

These observations are inspiration and technical reference only; no third-party asset, texture, layout, or distinctive design is to be copied.

## Proposed scope

- One coherent South Ward street corner: short primary street, side street or intersection, sidewalk, curb, road markings, drainage logic, and an alley/service passage.
- One **hero building**, proposed as a neighborhood garage unless amended: original facade, physically traversable entrance, compact enterable interior, correct collision, basic lighting, and one exterior-to-interior transition.
- Two or three supporting buildings: original structural shells/facades, non-enterable in this milestone.
- One identifiable local business frontage with original signage and restrained street-level storytelling.
- One parked vehicle.
- One tested urban tree asset and one reduced-distance representation if useful.
- One streetlight and a small set of street furniture sufficient to establish scale and composition.
- Existing Voight proxy remains acceptable for structural and interaction testing. A stylized rigged-character prototype may be evaluated later in this milestone but is not required to validate environment construction.
- One grounded cinematic lighting and atmospheric treatment.
- Simple proximity/door interaction and interior traversal.
- No combat, traffic AI, mission logic, district-wide NPC simulation, or drivable vehicle requirement.

## First Light Asset Doctrine

### General rule

**Use real geometry where interaction, silhouette, parallax, or close inspection requires physical truth. Use image-derived visual complexity where physical depth does not earn its runtime cost.**

Every asset class receives its own representation strategy. There is no universal "image-to-3D" rule.

### 1. Buildings

**Representation strategy:** simple structural shell + rich facade + selective depth + optional interior cell.

Required layers:
1. **Structural shell**
   - primary building mass;
   - roofline;
   - corners;
   - real doorway/opening geometry where traversable;
   - major recesses where they materially affect camera movement or silhouette.
2. **Facade identity**
   - original wall textures;
   - restrained color zoning;
   - windows;
   - brick/block/concrete language;
   - grime, weathering, patching, paint variation;
   - storefront treatment and signage.
3. **Selective depth cues**
   - window recesses on hero faces;
   - sills;
   - awnings;
   - downpipes;
   - vents;
   - exterior lights;
   - utility boxes;
   - rolling-door frame;
   - trim where oblique viewing would otherwise expose flatness.
4. **Street grounding**
   - entrance thresholds;
   - curb/sidewalk alignment;
   - base staining;
   - drainage;
   - service access;
   - local clutter only where it supports use and history.
5. **Interaction package**
   - simple collision proxy;
   - interaction anchors;
   - optional interior cell;
   - future nav boundary hooks;
   - future LOD representations.

Supporting buildings may remain mostly shell + facade. Hero buildings receive the additional physical depth required for close viewing and entry.

### 2. Trees and vegetation

**Representation strategy:** genuine trunk/major branch geometry + layered foliage cards + distance simplification.

Near representation:
- real trunk mesh;
- limited major branch geometry;
- alpha-cut foliage cards arranged at varied angles;
- coherent silhouette;
- grounded shadow.

Mid representation:
- simplified trunk/branches;
- fewer foliage cards;
- shared material/atlas where possible.

Far representation:
- crossed cards, reduced cluster, or impostor if testing supports it;
- reduced/no expensive shadows.

The objective is believable urban vegetation, not botanical simulation.

### 3. Roads, sidewalks, curbs, and ground

**Representation strategy:** structurally simple surfaces with strong scale, material, and transition logic.

Priority details:
- curb height and edge profile;
- road width;
- sidewalk proportion;
- markings;
- drainage;
- patches;
- cracks;
- dirt accumulation;
- grass/soil transitions;
- driveway cuts;
- entrance thresholds.

Ground treatment is considered a first-class visual asset because it anchors every building, vehicle, prop, and character.

### 4. Street props

**Representation strategy:** real geometry only where silhouette, shadow, collision, or interaction requires it.

Examples:
- streetlight: simple true geometry;
- bench: simple true geometry;
- bollard: true geometry;
- wall AC unit: shallow mesh or facade detail depending on camera proximity;
- distant rooftop fixtures: texture/decal or simplified mesh;
- litter/sign stickers/graffiti: decals or texture layers.

### 5. Vehicles

**Representation strategy:** actual 3D geometry with controlled detail and strong proportion.

Priorities:
- recognizable silhouette;
- believable wheel size/track;
- body material response;
- proper ground contact;
- simple interior read where visible;
- LOD later as the vehicle system matures.

Vehicles are too interaction- and motion-sensitive to rely primarily on billboards at gameplay distance.

### 6. People

**Representation strategy:** genuine rigged 3D characters at close/medium range; simplified representations only at distance.

Priorities:
- believable anatomy;
- strong silhouette;
- restrained stylization;
- convincing gait, posture, and animation;
- clothing readability;
- simple but coherent skin/hair materials.

Character realism should come more from motion, proportion, lighting, and presence than expensive photoreal skin rendering.

### 7. Lighting and atmosphere

**Representation strategy:** grounded cinematic presentation rather than bright arcade exaggeration or photoreal simulation.

Priorities:
- restrained palette;
- readable sun direction;
- believable contact shadows;
- modest reflection treatment;
- atmospheric depth;
- interior/exterior contrast;
- no post-processing that hides weak geometry or materials.

## Art and interaction rules

1. Physical truth where interaction requires it: traversable openings, floors, stairs if present, collision proxies, and interior boundaries.
2. Visual richness where geometry does not earn its cost: original texture work, normal/roughness detail, decals, selective parallax, foliage cards, impostors, and layered facades.
3. No asset technique is accepted based on screenshots alone; it must survive camera motion and oblique viewing.
4. Generated or reference imagery is an input to original asset production, not a substitute for collision-ready geometry and not a license to reproduce reference games.
5. Prefer coherent silhouettes, proportion, material response, placement, and lighting over brute-force polygon counts.
6. Repetition is acceptable when composition, material variation, and placement make it believable.
7. Sparse but correct beats dense but arbitrary.
8. Every optimization technique must remain visually subordinate to the world; representation transitions should not call attention to themselves.

## Execution phases — each requires review before proceeding

### FL-0: Visual contract and benchmark baseline
- Confirm grounded cinematic stylization as the formal visual contract.
- Build a small reference board from user-supplied inspiration and original mood references.
- Define palette, shape language, architectural proportions, surface wear level, time of day, and explicit realism exclusions.
- Inspect the current Genesis runtime and measure a reproducible desktop/mobile baseline.
- Establish fixed capture positions, FPS/frame-time measurement, draw-call/triangle/resource diagnostics where available.
- Gate: visual direction, benchmark method, and asset doctrine approved.

### FL-1: Structural corner
- Implement street, sidewalk, curb, drainage cues, alley/service passage, building shells, hero entrance, and compact interior.
- Keep materials intentionally simple until scale and composition are correct.
- Test Voight movement, camera obstruction, doorway crossing, collision, pause/resume, cleanup, and re-entry.
- Gate: the corner reads spatially as a believable place and is traversable without obvious physics/camera failure.

### FL-2: Surface and representation prototype
- Develop original hero facade and supporting building facades using the building doctrine.
- Develop the first tree using trunk/branch geometry plus layered foliage cards.
- Establish road/sidewalk material language, window treatment, signage, decals, and restrained street props.
- Compare actual geometry against texture/image-assisted detail at several camera distances and angles.
- Define asset packaging conventions and first LOD/representation-switch policy.
- Gate: no major representation collapses during a continuous walkthrough or close oblique inspection.

### FL-3: Interaction and atmosphere
- Implement reliable hero-building enter/exit behavior.
- Add basic interior visibility control and lighting.
- Establish one coherent exterior lighting, shadow, reflection, and atmosphere treatment.
- Validate exterior-to-interior visual transition and camera behavior.
- Gate: the journey from street to interior remains believable, readable, and mechanically stable.

### FL-4: Optimization and acceptance
- Profile CPU/GPU frame behavior where measurable, draw calls, triangles, texture use, memory indicators, scene load time, and re-entry behavior.
- Test desktop and representative mobile browsers; document hardware, browser, resolution, devicePixelRatio, and thermal behavior where practical.
- Introduce texture compression, batching, instancing, culling, LOD, and resolution policy only where measurements justify them.
- Compare the optimized scene to the pre-optimization visual baseline so performance work does not silently degrade the art target.
- Gate: explicit user visual approval plus acceptable measured responsiveness and stability on tested devices.

## Acceptance criteria

- **Art:** User explicitly approves grounded cinematic stylization in motion, not only in still captures.
- **World credibility:** Street, ground, building massing, tree, parked vehicle, lighting, and props read as one place rather than separate demo assets.
- **Building representation:** Hero building demonstrates structural shell, facade identity, selective depth, physical entrance, collision, and compact interior.
- **Vegetation representation:** First tree demonstrates real trunk structure plus image-assisted foliage and maintains a convincing silhouette from tested angles/distances.
- **Interaction:** Voight can traverse street/sidewalk and enter/exit the hero building without penetrating solid geometry, becoming trapped, or losing usable camera behavior.
- **Performance:** Device-specific frame times/FPS, draw calls, triangles, texture use where available, scene load time, and degradation under movement are recorded. Research estimates are reference points, not universal GTD limits.
- **Stability:** /game re-entry, pause/resume, resize, mobile orientation, input mode, and WebGL context behavior are checked and any failures recorded.
- **Provenance:** Original/generated/source assets have clear provenance and compatible licenses.
- **Delivery:** Source, captures, measurements, known limitations, and milestone decision are committed before any production expansion.
- **Deployment:** Vercel deployment occurs only after explicit authorization.

## Technical safeguards

- Preserve the dedicated Babylon runtime, Rapier/WASM physics, and fixed-step update.
- React remains the application/UI shell and does not own per-frame gameplay state.
- No automatic Vercel deployment.
- Preserve established input semantics, mobile controls, optional desktop controls, and minimal HUD behavior.
- Prefer bounded memory, progressive loading, simple physics colliders, and clean lifecycle disposal.
- Advanced representations such as Gaussian splats, neural reconstruction, or expensive parallax remain isolated experiments and are not milestone prerequisites.
- Measure first; optimize observed bottlenecks. Numeric draw-call/triangle targets from research are hypotheses until tested on GTD hardware.
- Do not prematurely build generalized city systems before the First Light representation grammar is proven.

## Explicit exclusions

No complete South Ward district, pedestrian AI system, city traffic system, missions, procedural metropolis, final Voight model, fully furnished multi-floor buildings, final vehicle physics, dense crowd simulation, or commitment to photorealism.

## Approved decisions

- Milestone name: **Meridia: First Light**.
- First Light Asset Doctrine: approved.
- Hero building type: **South Ward neighborhood garage**.
- FL-0: authorized.
- Deployment: still requires explicit authorization.
- FL-1 accepted after camera behavior review.
- FL-2 accepted on 2026-10-09 after successful generated-world navigation review.
- FL-3 completed and explicitly accepted on 2026-10-09 following user-confirmed garage traversal, camera, collision and visibility checks, and realistic night-sky visual acceptance.
- FL-4 implementation authorized on 2026-10-09. FL-4 is **IN PROGRESS**, with performance measurement, real-device validation and final user acceptance outstanding. Follow `documentations/FL-4 Technical Implementation Plan.md` and the traceable `documentations/FL-4 Evidence/` register.

## Decision log

- 2026-10-08: GTD Shell confirmed complete.
- 2026-10-08: Meridia Genesis confirmed complete.
- 2026-10-08: Grounded cinematic stylization selected as the visual direction.
- 2026-10-08: First Light plan drafted as a representation laboratory rather than a South Ward district build.
- 2026-10-08: User-supplied Payback 2 references reviewed. Tree strategy refined toward 3D trunk/branch structure with layered foliage cards; building strategy refined toward simple structural shells with facade-driven richness and selective depth; ground treatment elevated to first-class visual importance.
- 2026-10-08: First Light Asset Doctrine incorporated.
- 2026-10-08: User granted explicit greenlight. Milestone activated; neighborhood garage confirmed as the hero building; FL-0 authorized. Deployment remains separately gated.
- 2026-10-08: FL-0 visual contract and benchmark method established. First FL-1 structural/representation pass committed: South Ward street corner, enterable garage shell, supporting buildings, ground hierarchy, procedural foliage-card tree, streetlight, parked vehicle, shadows, and updated runtime spawn/location.
- 2026-10-08: A deliberate review deployment was created from commit `5f84ecfef91d98c63fc2a13b508833fecf4067bb`. Build completed successfully and `/game` returned HTTP 200 with no grouped runtime errors at verification time. Automatic deployment guard was restored.
- 2026-10-08: Review accepted the structural direction. Road/sidewalk readability and building depth were validated. Highest-priority defect identified: third-person camera could cross solid walls while Voight remained collision-constrained inside the garage.
- 2026-10-08: Camera obstruction handling implemented using target-to-camera ray tests against explicit camera-blocking geometry, fast inward compression, damped recovery, reduced near clip, and solid garage roof collision.
- 2026-10-08: First Light neighborhood section expanded beyond the original corner with a rear cross street, connected sidewalks/curbs, pocket green, additional trees/streetlight, rear residential row, local shop, workshop, and second parked vehicle. Expansion remains a representation test section, not a complete South Ward district.
- 2026-10-08: Camera behavior accepted as familiar and adequate for the current milestone. FL-1 accepted; FL-2 opened.
- 2026-10-08: Vehicle proxy received a real static collision body so Voight can no longer walk through parked cars.
- 2026-10-08: Hero garage rear wall was rebuilt around two real glazed window openings with physical glass, frames, mullions, and camera-transparent glazing.
- 2026-10-08: FL-2 material language introduced using procedural asphalt, sidewalk slab, brick, concrete, and garage-block surface textures. Citywide moving traffic remains deferred because it belongs to later systemic work rather than this representation milestone.
- 2026-10-08: Review confirmed garage glazing, building material treatment, and the direction of FL-2. Vegetation still read as abstract green geometry, and road junctions did not yet communicate a continuous city road network strongly enough.
- 2026-10-08: Grass received a blade/noise surface texture; foliage cards were revised toward pointed leaf sprays with stem cues and irregular transparency. Main/side/rear-road junctions received explicit asphalt junction pads, center markings, and pedestrian crossings so the road graph reads as continuous infrastructure.
- 2026-10-08: Basic day/night sky remains intentionally deferred to FL-3 because the implementation plan assigns exterior lighting and atmosphere there. Weather remains a later complexity layer after basic atmospheric behavior is validated.
- 2026-10-08: User authorized the next FL-2 implementation pass with reference imagery reinforcing previously agreed tree silhouette, road-network, and city-massing targets.
- 2026-10-08: Tree representation upgraded with bark-textured segmented trunks, root flares, asymmetry, wider umbrella-like canopy spread, and additional branch structure.
- 2026-10-08: Road geometry corrected so sidewalks/curbs terminate around intersections rather than crossing active asphalt; main and rear junctions now read as uninterrupted road connections.
- 2026-10-08: South Ward skyline hierarchy expanded with textured podium/tower masses and repeated window rhythm to introduce believable vertical city context without leaving FL-2 scope.
- 2026-10-08: Dynamic Building Generation Algorithm documented as the architectural scaling strategy for Meridian: declarative BuildingSpecs, archetype defaults, deterministic generation, facade grammar, openings/interiors/collision/camera blockers, LOD, streaming, and district inheritance.
- 2026-10-08: Tree branch cylinders removed because they read as falling sticks rather than growth; textured trunk/root-flare structure now disappears directly into the foliage canopy.
- 2026-10-08: Main and rear junction curb/sidewalk segmentation corrected to leave exact asphalt openings, and side-street edge geometry shortened so it does not intrude into the rear junction.
- 2026-10-08: Third-person vertical camera range expanded so Voight can look substantially upward toward tall buildings and future helicopters/stars while preserving camera obstruction handling.

- 2026-10-09: Generated First Light visual parity accepted for architecture, authored road/curb baseline, authored-style vegetation, structured street context, and fixed daytime shadows. The darker authored asphalt and timber curb/edge aesthetic is retained as a future district-selectable streetscape family rather than deprecated. Generated First Light has been wired into the live `/game` runtime candidate behind a controlled authored/generated source switch; final promotion and playable deployment acceptance remain pending.

- 2026-10-09: Live Generated First Light review accepted FL-2 as successful enough to proceed. Navigation around the block works. Two rolling refinements were recorded rather than treated as blockers: (1) extreme upward camera orbit could place the camera below terrain, so generated terrain is now a semantic camera blocker governed by the same obstruction system as walls/roofs; (2) the literal raised T-junction asphalt pads read like carpet patches, so First Light parity rendering now relies on the already-overlapping continuous carriageways instead of separate junction overlays. FL-3 Interaction and Atmosphere is authorized and active.

- 2026-10-09: FL-3 implementation candidate completed on `development/meridian-fl3-interaction-atmosphere`. Added authoritative Meridian time/environment state, 48-minute canonical day with 24-minute accelerated validation rate, editable HUD time controls, dynamic sun/sky/ambient/fog response, night streetlight illumination, a populated and locally lit South Ward garage interior, major interior fixture collision, semantic outside/threshold/inside state, interior camera-radius adaptation, and selective roof visibility. Candidate `ec81e6d0a6a8cc06455cc84f3ae0a2136b8efc63` passed strict TypeScript, targeted ESLint, production build, and 10 Vitest files / 63 tests. Review deployment `dpl_6oDCRuWRDtssn6e1tbjeDjReCrCX` reached READY; `/game` and `/first-light-comparison` returned HTTP 200 with no grouped runtime errors. Main promotion remains gated on live FL-3 review.

- 2026-10-09: **FL-3 CLOSED — USER ACCEPTED.** User confirmed that Voight can enter the South Ward garage, move around inside, and return to the street without collision, camera, physics or visibility problems. This completes the FL-3 street-to-interior-to-street interaction gate in addition to the accepted environment/day-night lighting and realistic night sky. Source audit confirmed the runtime retains fixed 60 Hz simulation, Rapier-owned movement/collision, runtime-owned environmental/interior state, camera adaptation, and resource disposal. Acceptance is user gameplay validation plus existing test/build evidence; no claim of new device-specific performance benchmarking is made. The blurry screen/mobile render-output-resolution observation remains an open **FL-4 optimization/resolution-policy candidate**, not a blocker to FL-3 closure. FL-4 has not been authorized or started. No production/main promotion is implied by this milestone decision.

- 2026-10-09: User authorized the FL-4 implementation contract. Development work isolated on `development/meridian-fl4-optimization`; introduced opt-in diagnostic instrumentation for actual canvas/framebuffer dimensions, DPR, frame-time distributions and draw calls. Source audit identified potentially sub-native rendering from existing hardware scaling, but physical device measurements have not yet confirmed it. The canonical FL-4 acceptance gate remains OPEN; no production promotion and no authorized FL-4 deployment. Evidence and blockers recorded in `documentations/FL-4 Evidence/Progress and Blocking Matrix.md`.

- 2026-10-10: **Controlled production baseline for mobile PWA comparison:** User expressly authorized and GitHub PR #3 merged the current development baseline to `main` at `af1adcdd8efaa53cc6c666079f3ff7613fd86bc5`; Vercel production deployment `dpl_DDkyZVyCpBCiNMDN9ApHmXWVf6BZ` reached READY. Real mobile PWA screenshots and user traversal confirmed the current game reaches mobile and movement/physics feel comparable to desktop. **FL-4 remains IN PROGRESS, NOT ACCEPTED.** User observed the Babylon-rendered scene is appreciably softer than desktop; root cause and mobile hardware performance not yet measured. This finding is comprehensively recorded as `documentations/Issues/Mobile PWA 3D Sharpness - Production Baseline.md` (GTD-VIS-002), owned by FL-4's existing optimization/device-validation steps. It **does not** expand the independent 01:00 windows, 02:00 canopy or 03:00 vehicle scheduled visual refinements into mobile-performance work. User-classified cosmetic sky banding remains non-blocking under GTD-VIS-001. The production baseline is frozen for comparison with overnight previews; future deployment decisions and FL-4 acceptance remain distinct.


- 2026-10-10 morning, FL-4 active: With user authorization to finish blocked overnight work, the standard GitHub write workflow successfully integrated **tall-storey-aware windows**, **existing canopy planner into live foliage cards**, and **six-mesh shaped parked vehicle proxies** into their real generated-world renderers. See `documentations/FL-4 Evidence/Morning Integration and Pre-Continuation Patch - 2026-10-10.md` and `documentations/FL-4 Evidence/Final Acceptance Report.md`. One integrated candidate passed strict TypeScript, automated tests and build; latest revisions require matching verification. Visual review and desktop/mobile real-device performance measurements remain mandatory. **FL-4 remains IN PROGRESS, NOT ACCEPTED.** The original `main` production comparison SHA `af1adcdd8efaa53cc6c666079f3ff7613fd86bc5` remains unchanged; no unattended promotion is authorized.
