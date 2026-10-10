# GTD Vehicle Research Foundations and Discovery Questions

**Recorded:** 2026-10-10  
**Status:** FOUNDATIONAL NOTES — RESEARCH QUESTION NOT YET DEFINED; NO VEHICLE DESIGN AUTHORIZED  
**Game:** Grand Theft Division (GTD), Meridia / First Light  
**Canonical Source of Truth:** `documentations/Meridia First Light Implementation Plan.md`  
**Existing subordinate doctrine:** `documentations/FL-4 Evidence/Vehicle Asset Doctrine Refinement - Task 3.md` and `documentations/FL-4 Visual Realism Decision Record and Implementation Plan.md`

> **Workflow correction:** The user directed that discussion and definition of the actual problem/questions must precede further research. Past assistant research findings can be retained as **foundation, not an answer, specification, artistic direction or implementation authorization**. Do not launch a new deep-research program, settle sedan styling, set mesh/triangle budgets or modify code until questions and success criteria are agreed.

## 1. Why this record exists

The morning FL-4 review found GTD's parked vehicles continue to read as abstract low-detail wedges: recognizable principally from their placement on roadways, not by a standalone shape. The user proposed a discriminating observation: *Would a gamer identify the object as a car if it stood on grass, away from roads and contextual road cues?* The current prototype does not reliably pass that inference test.

A previous assistant began researching real-car specifications, game-ready asset creation, glTF/Babylon and automotive hard-surface approaches **before** first discussing what question the research should answer. The findings are potential resources but should not dictate the design.

## 2. User-supplied comparison reference: Drive Quest

**Reference experience:** [Drive Quest — Car Game](https://www.crazygames.com/game/drive-quest---car-game) (CrazyGames), as shown in two 2026-10-10 user screenshots. These images are references for observation and comparison **only**; GTD should design original cars and respect the game's own representation doctrine. There is no permission to reproduce specific existing 3D assets or vehicle branding.

### Image observations, not an approved asset target

- The yellow player car is immediately identifiable from a rear three-quarter/third-person view as a sedan: body and roof outline, rear windscreen, side mirrors, separated trunk lid, tail lamps, bumper, wheel placement, and contrasting tire/glass/paint surfaces communicate the object without needing road context.
- Oncoming blue and teal vehicles in the second screenshot carry plausible vehicle cues from a distance: front fascia/grille, headlamp shapes, body side surfaces, windshield and wheels.
- The cars appear visually coherent in shape, proportions, material differentiation, lighting and contact with the road. It is *not yet established* which features are most necessary for GTD to reach adequate recognizability, or how many geometry/material passes its car renderer uses.
- The user's side observation: GTD's current generated **buildings appear significantly better to them** than Drive Quest's buildings, despite Drive Quest having more realistic-looking vehicles and a more cohesive car-game environment. Treat this as a useful **art-direction and prioritization observation**, not objective cross-engine quality benchmarking or a mandate to abandon GTD's existing building approach.
- Screenshots show appearance, not the competitor's underlying asset pipeline, draw calls, triangle count, shaders, mobile performance or licensing.

## 3. Foundational findings from the earlier research synthesis

These are starting hypotheses and resource categories to investigate **after** research questions are established:

1. **Silhouette and proportion.** Vehicle recognition often depends on wheelbase, cabin-to-hood/trunk relationship, pillar/profile shape, wheel arches and front/rear differentiation. The current GTD six-mesh proxy separates few of these. Specific relative importance and fidelity floor require empirical tests.
2. **Semantic parts and material identity.** Distinct paint, glass, rubber, lamp and trim responses can reinforce recognition. Adding geometry or shader complexity is not inherently equivalent to higher fidelity.
3. **Asset versus physics.** It is reasonable to keep the visual sedan mesh separate from Rapier collider(s), wheel physical behavior and future traffic/vehicle gameplay. Before building a reusable master asset, decide if the first sedan is exclusively parked/static, foundational for future drivability, or something in between.
4. **Potential asset authoring / interchange.** Blender and glTF/GLB alongside Babylon asset-loading/reuse tools are possible production tools, subject to actual repository/runtime and team workflow review. This is **not** a decision to switch off the current procedural pipeline.
5. **Real-car dimensional reference.** Earlier research offered a contemporary Toyota Corolla sedan as an indicative real-world size benchmark (about 4.6 m long, 1.8 m wide, 1.4–1.5 m high, ~2.7 m wheelbase, depending on market/model year). These are approximate and must be checked against a selected source/model year if later used as strict values; this is **not** an instruction to reproduce a Toyota model or choose modern styling.
6. **Performance should be measured, not assumed.** The current six-mesh rule protects a small prototype cost but is not a universal optimum. Prior assistant suggested a tentative 1,500–4,000-triangle nearby-sedan range. This is **an unvalidated brainstorming budget**, not an approved GTD requirement or authoritative industry limit. Authoritative benchmarks must use GTD's active scene and target device tiers.
7. **Candidate source families for future targeted evidence:** experienced vehicle artists discussing modeling topology, proportions and optimization (e.g. Polycount community); practical production engine guidelines (e.g. Unreal/Epic vehicle preparation); Khronos real-time asset and glTF guidance; Blender export documentation; Babylon.js scene and asset-instancing references. None should be cited as answering a question that has not yet been asked.

**Source and certainty guard:** These points summarize a prior assistant's exploratory research; the exact versions, publications, links and transferability to GTD have not been rechecked in this documentation step. Revisit authoritative original materials when narrowing the problem; record exact citations and evidence for any consequential specifications.

## 4. Questions to settle in conversation BEFORE targeted research

**Primary scoping question:** *What job should GTD's first original sedan perform?*

- **A — First Light recognition asset:** a static, parked, reliably identifiable sedan; prototype constraints dominate, later drivable vehicle may be a different asset.
- **B — Foundational reusable vehicle:** initially parked for FL-4, but intentionally structured for eventual wheels/doors/animation/drivability and multiple LODs, without implementing driving now.
- **C — Other:** describe the desired scope explicitly.

Only after that decision should we settle, in order:

1. **Recognition threshold:** Which front/side/rear/distance/context-free views must a gamer recognize? Is the Drive Quest screenshot a floor, stretch target, or just an example of recognizable proportions?
2. **Art direction:** Contemporary rounded, older angular, blended grounded stylization, or other original fictional Meridian sedan; do **not** infer preference solely from reference screenshots.
3. **Interaction scope:** Static parked or eventual drivable as structural design input; requirements for independent wheels, bounds, damage/doors, and collision can be deferred or anticipated.
4. **Performance tier and multiplicity:** Expected number of simultaneous visible vehicles, camera distance, mobile and desktop budgets, LOD strategy and GPU cost measurements.
5. **Production method:** Procedural geometry, authored GLB, hybrid, or comparison prototype; choose after acceptance metrics are clear.
6. **Fidelity minimum and stop rule:** The *smallest* asset that meets recognition from all required angles, fits GTD art direction and keeps scene responsiveness.

**Research contract to be written later:** For each agreed question specify what information needs to be found, authoritative primary and practitioner sources, expected data/visual examples, objective acceptance metric, unknowns and how the resulting decision will affect GTD. Do not collect references for their own sake.

## 5. Relationship to other FL-4 work

- The approved tree canopy is accepted for FL-4, and the window-placement rule with functional storefront exceptions is being discussed separately.
- **Vehicle visual recognition remains open** despite source integration and passing technical builds.
- Existing First Light Source of Truth restricts this phase: parked car representation and validation only; no automatic permission to add drivable traffic or gameplay.
- This foundational note does not modify the active vehicle mesh, collider, asset doctrine, acceptance report, task schedules, production baseline or milestone status.

## 6. Explicit decision gate

**Next interaction is a conversation**, starting with the sedan's intended role. No more external research, screenshots generated, code commits, deployment or asset authoring unless separately requested/authorized. Record the user's selected research question and then commission narrowly scoped evidence gathering.

## 7. Decision recorded — foundational GTD sedan (2026-10-10)

**User choice: B — Foundational reusable vehicle.** This resolves the primary scoping question in section 4. The first original Meridian sedan will initially be shown as a parked vehicle, but its **asset organization, semantic part boundaries, pivots and dimensions should be suitable for future extension into driving, steering, wheel/door animation and vehicle-family reuse**. This is a forward-compatibility obligation, **not authorization to implement driving mechanics, interiors, doors, traffic or full vehicle physics during FL-4**.

**Why this matters:** The current recognizable-only proxy is insufficient as the long-term master asset. Architecture research must compare ways of making a model reusable without prematurely implementing later gameplay systems. The actual modeling method, geometry budget, LOD, vehicle silhouette/style, and which parts require independent meshes **remain undecided** until the user clarifies the intended quality/recognition benchmark.

**Next conversation gate (before further external research):** Decide whether the user-supplied Drive Quest sedan visuals are (1) a minimum visible quality target, (2) an aspirational reference, or (3) only evidence of shape/context-independent vehicle recognition. Then formulate narrow research questions about reproducible vehicle modeling and Babylon/Rapier integration. Do not launch new research or alter the game until those questions are established.

## 8. User quality-benchmark decision — 2026-10-10

**User decision:** The user-supplied [Drive Quest — Car Game](https://www.crazygames.com/game/drive-quest---car-game) vehicle screenshots are a **minimum reference standard for the visible quality of GTD's first sedan**, not merely examples of automobile recognizability or an aspirational optional level. In the user's assessment, these vehicles are comparable in realized quality to Payback 2 vehicle art and notably surpass the car realism in earlier Grand Theft Auto titles. This comparison records the user's design judgment; it is not a measured technical ranking of these games.

**Generalized rule:** Browser deployment, installability as a PWA, or a web rendering engine **does not imply any automatic lowering of permissible vehicle-asset quality**. Do not assume that a browser game must settle for a box-like or visibly unfinished low-polygon vehicle. Technical budgets need to be established from real GTD frame times, draw calls, loading/memory constraints, device classes and deliberate level-of-detail choices, **after** agreeing on fidelity requirements. Conversely, this standard does not authorize unbounded polygon counts or expensive shaders.

**Required visible cues at minimum:** A coherent original sedan with convincing front, side and rear silhouettes; recognizable cabin, hood and trunk; meaningful glazing and pillar structure; properly integrated wheels/tires and arches; recognizable front and rear fascia, headlights and taillights; believable relationships among paint, rubber, glass and shadowed body surfaces; adequate edge quality and material response at ordinary in-game camera distances. The Drive Quest screenshots serve as a **visual-quality benchmark**, not a source of copyrighted geometry, branding, plates, logos or source assets.

**Architectural scope retained:** User previously selected **B — foundational reusable vehicle**, initially parked but structurally prepared for later drivable/interactive GTD vehicle systems. No driving logic, traffic system, full mechanical simulation, asset import or renderer change is authorized by this decision.

**Open question to discuss next before further research:** What *type of original sedan* should define Meridian's first vehicle family (e.g. ordinary daily-use compact/midsize sedan versus sporty/performance four-door sedan)? This sets proportions, fascia, window-line/body design and appropriate source references independently of the agreed minimum rendering fidelity. Ask and settle with the user before commissioning more technical research or an implementation contract.
