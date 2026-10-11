# GTD-CHAR-001 — Voight Character Development Technical Implementation Plan

**Document status:** USER-AUTHORIZED TECHNICAL PLAN — DOCUMENTATION ONLY. Five sequential implementation stages are proposed; no character asset acquisition, import experiment, runtime patch, branch promotion, or production release is authorized by this document alone.
**Date:** 2026-10-11
**Project:** Grand Theft Division (GTD) — Meridian City, Meridia
**Primary research:** [Voight Development Research](./voight-development-research.md)
**World authority:** [Meridia First Light Implementation Plan](./Meridia%20First%20Light%20Implementation%20Plan.md) and [Meridian Game World Development SOT](./Meridian%20Game%20World%20Development%20SOT.md)
**Asset methodology:** [Imported 3D Assets — Foundational Editing and GTD Standard Pipeline](./Development/Imported%203D%20Assets%20-%20Foundational%20Editing%20and%20GTD%20Standard%20Pipeline.md)
**Experimental precedent:** [EXP-VEH-001 — Meridian Imported GLB Vehicle Evaluation](./Experiments/Meridian%20Imported%20GLB%20Vehicle%20Evaluation%20-%20Technical%20Plan.md)
**Predecessor:** FL-4 formally closed by user. GTD-PERF-001 remains a separate graphics/performance follow-up; GTD-UX-001 in-session Settings continuity is already implemented and accepted.

## 0. Governing decision and release authority

**Character mandate:** Voight is an original, identifiable GTD protagonist *from his first appearance*, not a stock humanoid who will become recognizable only through story progression. His physical identity, proportions, face, outline, habitual posture, movement vocabulary and signature clothing must establish his presence immediately.

**Art strategy: Option B without discarding Option A.** The finished system supports a consistent physical identity and modular clothing, while the **initial release features one definitive canonical outfit** whose colors, form and outline help players recognize Voight at normal third-person and mobile viewing distances. Modular wardrobe capability is foundational infrastructure, **not** a requirement to ship several outfits during first integration. No recognizable appearance, name usage, likeness or costume is to be copied from an existing fictional character or actor.

**Technical strategy:** Hybrid creation: qualify a legally usable, editable human foundation; deliberately author Voight's original identity and clothes around it; use glTF/GLB as a runtime delivery format; integrate skeletal animation with the **existing** Babylon.js and Rapier systems. Both completely original scratch modeling and commercially authored foundations remain available if trials justify them; no supplier has been selected.

**Strict order:** (1) Define identity → (2) Qualify foundations → (3) Foundation Trial → (4) Develop permanent foundation → (5) Integrate first playable Voight. Each stage has a mandatory evidence-and-approval gate. This plan is not approval to execute any stage. Experiment work, source acquisition, main-branch changes and production release each require appropriate explicit authorization. Do not equate technical readiness, artistic acceptance, performance acceptance, commercial clearance and release approval.

### 0.1 Existing runtime contract observed on main (2026-10-11)

These are *current-source observations*, not future interfaces:

- **Visual:** src/game/character/voight.ts defines createVoightPrototype(scene), a TransformNode with a capsule body, sphere head and forward marker. There is no imported, skinned humanoid or current character-animation state machine.
- **Runtime:** src/game/core/gtd-runtime.ts creates the existing generated First Light world, loads/settles accepted vehicle GLBs, creates an ArcRotateCamera, instantiates the Voight prototype and runs fixed 1/60-second simulation steps. Player movement comes from camera-relative input; orientation and camera target follow the physics position.
- **Physics:** src/game/physics/rapier-world.ts owns a kinematic player capsule and Rapier KinematicCharacterController, including collision correction, autostep and snap-to-ground. The current collider is not a humanoid skin: changing the character's appearance must not implicitly replace its physics.
- **Input and lifecycle:** src/game/core/types.ts defines movement/look and action commands; src/game/bridge/runtime-bridge.ts mediates runtime bootstrap, pause, resume, commands and destruction. src/routes/game.tsx implements keyboard/touch input and same-runtime in-game Settings.
- **First-frame safety:** src/game/core/gtd-runtime.ts and src/game/core/world-render-warmup.ts presently use the exact mesh "voight-prototype-body" as a real draw witness. The startup checkpoint becomes ready only after the vehicle imports settle and a subsequent frame genuinely draws the ground **and** Voight. A character-model replacement **must migrate the witness contract**; deleting or renaming the proxy mesh without adjusting the actual draw evidence risks a startup failure or the prior sky-and-cars-only mobile regression.
- **Project style:** The established visual target is grounded cinematic stylization, approximately GTA: San Andreas / Payback 2 in readability, rather than facial photorealism at any cost. Normal third-person movement, near examination, mobile landscape and daytime/nighttime matter.
- **Performance controls:** Runtime render clarity and physical-display percentage already exist. Do not add competing sliders or reset the scene when changing graphics settings.

**Explicit non-goals for the first character delivery:** NPC population, multiplayer avatars, facial dialogue, advanced combat, damage/injury animation, fully drivable cars, a complete costume catalogue, cinematic cutscenes or unrelated world/vehicle redesign. These retain future hooks, not present implementation scope.

## 1. Stage 1 — Define and approve Voight's identity

**Purpose:** Make the art decision before the asset decision. A source model may enable the character, but must not dictate his final face, body or personality.

### 1.1 Work package

1. **Visual identity brief:** Define intended age range, apparent physical maturity, original face/feature direction, physique, approximate stature relative to Meridian's doorways/cars, complexion/hair direction, recognizable posture and default demeanor. These are *design decisions awaiting review*; this document deliberately does not invent them.
2. **Silhouette sheet:** Develop front, rear, profile and three-quarter views; compare at desktop third-person size and mobile-landscape apparent character size, not only close-up renders. Verify recognition when face details are unavailable.
3. **Canonical outfit:** Select one signature combination of upper garment, lower garment, shoes and any justified accessories. Establish an original shape language and readable color/value accents, including rear-view elements. The outfit must communicate Voight at first spawn without relying on a police uniform or reproducing someone else's costume.
4. **Motion/personality brief:** Define baseline standing stance, weight distribution, head orientation, turning character, walking cadence and running demeanor. Distinguish a recognizable movement signature from unrealistic locomotion.
5. **Modular invariants:** Specify what remains constant across future outfits: face/cranial structure, height and fundamental proportions, posture/gait signatures, personal identifiers, and selected consistent visual cues. Identify which garments/accessories/colors may vary. Recognizability must survive reasonable wardrobe substitutions.
6. **Style-fit review:** Compare candidate art direction with existing pavement, buildings, lighting, cars and near/far camera framing at daylight, dusk and night. Avoid an ultra-photoreal skin shader if it visibly clashes with the rest of Meridian.

### 1.2 Deliverables

- Original identity brief and annotated front/back/side/three-quarter character sheets.
- At least one accepted canonical outfit specification, including material/fabric and palette direction.
- Silhouette recognition and distance-legibility evidence at realistic mobile/desktop framing.
- Approved **invariant-versus-variable** specification for later modular garments.
- Animation personality notes for the Stage 5 locomotion implementation.
- Approved anthropometric/scale reference, without arbitrarily changing the current Rapier collider.

### 1.3 Gate G1 — Art/identity authorization

**PASS only when:** The user has explicitly accepted the identity direction, canonical outfit and invariant/variable rules; at least four of five blinded reviewers can identify Voight's silhouette in a controlled comparison (provisional research criterion); required viewpoints remain distinctive at normal mobile third-person distance; designs avoid unlicensed copied likenesses or recognizable costume elements.

**BLOCK if:** Voight's recognizability depends only on detailed facial features unavailable at play distance, or if a vendor model is being selected before the design objective is established.

**Approval required:** User sign-off on the actual designs. Passing G1 does not approve candidate purchases or runtime changes.

## 2. Stage 2 — Qualify editable, distributable character foundations

**Purpose:** Research enough real options to eliminate technically, artistically or commercially unsuitable bases *before* experimentation.

### 2.1 Candidate categories, not endorsements

Investigate **at least three independently sourced foundations or pipelines** representing distinct approaches:

| Candidate class | Initial research lead | Intended comparator | Mandatory open questions |
| --- | --- | --- | --- |
| Open editable parametric human | MakeHuman and/or MPFB | Authoring control, editable shape, potential lowest licensing cost | Exact software-vs-exported-asset licensing, third-party add-ons, source availability, glTF-ready rigging/weights and final quality |
| Animation-ready humanoid | Adobe Mixamo **model and/or animation** | Efficient rig/locomotion pipeline and short initial setup | Adobe-specific license and game distribution limitations, source-model editability, original character ownership, retargeting, current availability |
| Higher-end production tool or fully documented asset | Reallusion Character Creator **or** an individually vetted commercial mesh | Advanced facial/body customization, skin/clothing and delivered source files | Exact package price/edition/export permissions, embedded PWA use, seller-specific licenses, perpetual access, performance and vendor dependence |

Other candidates (including DAZ, a specific CC0 Sketchfab asset, or scratch-authored mesh) can replace a class after evidence. Ready Player Me is **not** presumed an active available service; confirm operational status before considering it. MB-Lab and MPFB are distinct projects; do not merge their license claims.

The research's "Mixamo = CC BY 4.0", "all MakeHuman/MB-Lab assets = CC0", "paid = automatically royalty-free for browser distribution" and vendor cost claims are **not approved licensing facts**. Re-verify model and animation rights at the *specific asset/version/licence* level using current original publisher terms. The publicly served PWA asset can be copied by a client; a permission to *display* or *use in games* must not be assumed to grant unrestricted raw-model redistribution.

### 2.2 Candidate evidence record (required for each)

- Exact product/asset name, author/publisher, public URL, access date, download/export route, version, hashes and original source provenance.
- Product type (generator, mesh, animation, character bundle), authoring master (e.g. blend or other native format), export format(s), GLB conversion steps, rig/bind pose, joint list/weights, morphs and facial controls.
- Whether the head, body proportions, hair, clothing and textures can be edited in a maintained source file; cost and technical debt of garment re-skinning/retopology.
- Triangle count, bones, meshes/material slots, source texture dimensions, compressed/uncompressed sizes and animation/rig details *when measured*. Label unknown values unknown rather than fabricating them.
- Direct and indirect price: license/purchase, subscription and upgrade, conversion tools, artist hours, animation rights, additional wardrobes, proprietary export/runtime dependencies, and continued maintenance; quote currency/date and actual source terms.
- License permission matrix: prototype download, modification, creation of derivatives, commercial distribution **inside browser-accessible GTD**, re-hosting GLB files, attribution, resale-extraction restrictions, contractor access, native source delivery, sublicensing and ongoing availability.
- Explicit classification for **RIGHTS VERIFIED / RIGHTS UNCERTAIN / RIGHTS BLOCKED** and **TECHNICALLY ELIGIBLE / ELIGIBILITY UNCERTAIN / INCOMPATIBLE**, each with evidence link and reviewer/date.
- Explicit identity-fit and mobile feasibility assessment relative to Stage 1; do not accept an attractive model merely because it imports.

### 2.3 Gate G2 — Rights and shortlist clearance

**PASS only when:** At least three distinct comparator candidates have evidence dossiers, accurate current acquisition costs and reproducible import plans; candidates progressing to any distributable experiment have rights confirmed for the **actual trial distribution method**; each has sufficient editability/rig feasibility to test. Escalate ambiguous EULAs for legal review; do not treat a risk score as license approval.

**BLOCK if:** Ownership, author, source-file access, editable base or applicable game/browser license cannot be substantiated. A blocked candidate is rejected for integration even if visually exceptional.

**Approval required:** User authorization of the experimental shortlist and trial acquisition/usage terms. Purchases, subscriptions and public previews remain separately gated.

## 3. Stage 3 — Conduct the Voight Foundation Trial

**Purpose:** Replace estimates and vendor demonstrations with controlled, repeatable evidence. Experimental integration is reversible and has two subphases with independent gates: **isolated Babylon scene first**, actual **Meridian** only after further authorization.

### 3.1 Isolation and artifacts

- Use a dedicated experiment branch/worktree and isolated prototype routes or small Babylon test harness. Keep the current /game production character untouched and ensure test assets are lawful to host in the experiment's actual environment. A private test is not equivalent to commercial PWA redistribution.
- Use the existing GTD Babylon/core/loader versions where possible, avoid unreviewed package duplication, and validate candidate source with glTF Validator. Import with an asynchronous asset lifecycle (preferring a self-contained, reproducibly packaged GLB for the prototype) rather than assuming Blender source files load directly.
- Pin asset revisions/checksums, rig normalization, unit scale, authoring conversion recipe, texture packaging and all measurement settings. Preserve failure logs rather than silently replacing a candidate.
- Keep visual mesh separate from Rapier collider. Do not destroy accepted city geometry, physics, saved input or imported vehicle assets to fit a prototype.
- Record both original/source and optimized variants to expose the impact of compression/retopology rather than crediting optimizations to the source itself.
- For each candidate, capture source and exported bytes, geometry/skin and skeleton stats, animation inventory, original import success/failure, license classification, authoring edit test and one clothing swap/rebind feasibility check.

### 3.2 Trial A — Babylon isolated scene

For **each** shortlisted candidate:

1. Import to a clean Babylon scene, set consistent scale/axis/front orientation and attach a test camera/light.
2. Verify skinned pose, UV/materials, draw order, normal/tangent interpretation, PBR behavior, shadow appearance and geometry integrity.
3. Play idle, walk, turn and one jump/land example where clips/rigs permit; record retargeting and bone deformation errors. If unavailable, classify the missing work rather than failing the whole tool unfairly.
4. Verify the model can be disposed during/after async loading; no duplicate meshes, stale skeletons, resources or late callbacks on rapid re-entry.
5. Sample cold/cached load and initial visible frame; measure frame/render time distribution, draw calls (where measurable), triangles, bones, active meshes, textures, approximate GPU memory and native-resolution scale. Use real GLB byte sizes; include decoding and shader compilation.
6. Document model modifications required to satisfy approved Stage 1 identity, including clothing modularity. Compare labor assumptions and licensing requirements.

**Gate G3A:** Three comparable measured evidence packages and an interpreted cost/quality/risk matrix; repeatable scene loading and disposal; no critical glTF validation errors. Trial success is not equivalent to permanent-character selection.

### 3.3 Trial B — Meridian controlled integration (requires explicit follow-up authorization)

Only after G3A and authorization, introduce an **opt-in**, version-pinned comparison in the existing First Light Meridian runtime:

- At the unchanged semantic player spawn, align full body, feet, shadow and orientation with roads, pavements, vehicle scale, garage opening and camera distance. Compare front/back/profile/three-quarter and ordinary third-person views, day/night and indoor/outdoor.
- Preserve the exact existing Rapier kinematic controller, ground snapping, autostep, static collisions and camera obstruction behavior. Prototype skinning/animations follow measured collider translation/grounded state; **do not** hand direct horizontal root motion or body teleportation to a trial model.
- Preserve the accepted loaded off-road and sports-car GLBs and their startup settled condition. In a guarded opt-in test, update first-render **real-draw witnesses** for the candidate's visible skinned mesh while continuing to require generated ground and post-vehicle settlement. Do not relax the First Light 7/8 readiness contract.
- Compare the same scene conditions on the *same device/build*: current prototype baseline versus each candidate, with identical time of day, camera view, render clarity, physical pixel percentage, imported vehicles and warm-up. Test quality 100% and 125% physical display where hardware permits, plus an ordinary default graphics setting.
- Include touch/keyboard movement, directional turns, jump/landing, sprint, camera obstruction near garage walls, indoor thresholds, stationary pose, pause → Settings → Apply & Resume, restart, repeated enter/exit, partial network errors, and aggressive disposal during GLB loading.
- Record screenshots or short clips at matched viewpoints; judges distinguish silhouette readability, gait, outfit style consistency and artifacts. Collect diagnostic reports without a permanent full-screen overlay.

**Candidate metrics fields:** device/browser/OS/GPU where available, build SHA, branch, asset hash, trial and baseline IDs, viewport CSS dimensions/DPR/framebuffer dimensions, pixel percentage and settings, scene/location/time/weather, sample time and warm-up, asset download/decoded sizes, triangle/bone/mesh/material/texture counts, load/final-ready times, shader-first-frame delay, median/p95 frame **and** render times, long-stall count, draw-call/active-mesh changes, texture/CPU/GPU memory **estimates** separated from observed APIs, animation/ground/contact observations, world/vehicle integrity and test verdict. Never label JS heap memory as definitive GPU memory.

**Measurement protocol:** Perform repeat trials using equal settled warm-ups (vehicle experiment precedent: at least ~30 seconds) and sufficiently long active windows (~120 seconds) for normal frame-time sampling. Export JSON plus device-conditioned screenshots; capture asset-load cold/cached comparisons. Diagnose temperature/throttling and missing or unsupported GPU/memory counters honestly.

**Initial research hypotheses, NOT accepted measured GTD budgets:** Hero mobile LOD ~5k–10k triangles, desktop ~15k–20k; initial mobile material textures ~1K, desktop up to 2K; mobile median frame time <33 ms, p95 <50 ms; desktop median <~16.7 ms; initial character ready in ~5 seconds on the specified connection. Treat model-specific memory thresholds in the research as inconsistent and provisional. Evaluate both **absolute** whole-city performance and **incremental cost versus unchanged baseline**; meeting an FPS number while compromising the rest of Meridian does not qualify.

**Gate G3B:** An evidence report for all candidates and baseline on actual authorized devices, confirmed real-world drawn frame, correct player collision/camera and pause continuity, a transparent quality-cost comparison, and an explicit top choice plus alternatives/rejection rationale. A model that hides the city, strips accepted cars, requires lower graphics settings without disclosure, or causes unrecoverable loading **fails**.

### 3.4 Selection formula for trial verdict

Use research's **provisional** relative criteria, with actual trial findings:

| Dimension | Research weight |
| --- | ---: |
| Original identity and style fit | 25% |
| Editability and authoring control | 20% |
| Skeleton/animation and Babylon compatibility | 20% |
| Mobile/desktop operating performance | 15% |
| Commercial rights and total cost | 15% |
| Extensibility for NPCs | 5% |

**Hard gates override scoring:** Legally ineligible, irreparable rig, unacceptable playable performance, corrupted world readiness or uneditable identity-critical elements are disqualifying regardless of weighted score. Score verified evidence separately from uncertainty; do not convert unsupported legal claims into numerical passes.

**Approval required:** User reviews trial evidence, then explicitly selects/authorizes a production foundation for Stage 4. No public deployment from Stage 3 without explicit rights clearance and separate deployment permission.

## 4. Stage 4 — Select and develop Voight's permanent foundation

**Purpose:** Turn the selected *foundation* into an original GTD-owned character asset, not a vendor-branded clone.

### 4.1 Canonical art and editable source

- Record selected foundation/version, accepted G3 evidence, source rights, derivative constraints and editable native master. Keep license/author/sourcing records, original source, modified source, textures and deterministic export recipe in an access-controlled asset archive appropriate to asset-license and repository size. Do not commit proprietary raw source against license terms.
- Sculpt/edit the approved Stage 1 anatomy and recognizable face; resolve topology, skin weights, UVs, hair, silhouette, skin/hair/clothing materials and original texture creation. Any likeness must be licensed or independently created; a purchased model alone is not proof of uniqueness.
- Author one **canonical** outfit in final colors/fabrics/shadow response. Establish modular interfaces for compatible shirt/jacket/pants/shoes/accessories so later wardrobes can be made independently. Limit exposed runtime material and mesh count, and hide covered body geometry to prevent clothing/body intersections.
- Define visually recognizable constant elements independently from interchangeable garment geometry. Test the canonical outfit and one **temporary compatibility garment** to prove the modular contract; this does not mandate an alternate released outfit.

### 4.2 Geometry, rig and animation contract

- Distinguish **world/physics root** (stable character actor position; semantics tied to existing capsule), **model/orientation/offset root** (aligning imported feet, scale and forward axis) and **skeleton deformation root/pelvis**. Do not require the bone named Hips to be at ground level; a robust mapper can handle different authoring hierarchies without transforming physics.
- Normalize to a documented metres scale, consistent up/forward convention, bind pose and humanoid joint mapping. Support hips/spine/head, upper/lower arms/hands and legs/feet, preserving per-skeleton adaptation when supplier names differ. Rig weights and skin bounds must remain stable during bending, running and outfit swaps.
- Export validated, versioned glTF 2.0/GLB runtime assets; choose embedded/external textures consistently per production delivery and cache strategy. Evaluate geometry compression (e.g. Draco), mesh/material merging, texture/KTX2 compression, skinning and shader tradeoffs with measured cold-load CPU as well as file size. Avoid assuming compressed bytes imply faster initial play.
- Define a reusable ActorVisual / CharacterRigAdapter boundary **conceptually**: lifecycle load/ready/dispose, identity+rights metadata, named visible-skinned-mesh references, attach to physics actor, update animation from observed velocity/ground contact/heading, outfit mount points, future LOD and diagnostic hooks. Exact TypeScript API is decided during authorized implementation after inspection; do not let asset file mesh names leak into generic world logic.
- Produce near/mobile geometry representations only where silhouette, material and performance evidence justify them. No fixed far billboard threshold for the hero without camera measurements.
- Plan an NPC reuse-compatible skeleton/animation *interface* but do not build pedestrian systems, crowds or extra identities now.

### 4.3 Gate G4 — Permanent asset readiness

**PASS only when:** User accepts final Voight identity/canonical outfit from multi-angle daylight/night/mobile captures; fully editable, rights-cleared master is preserved; exported package validates and reproducibly imports; skin/rig/animation mapping functions; compatibility garment swap works without seam/clipping catastrophe; source and runtime revisions can be traced; optimization decisions are backed by evidence.

**BLOCK if:** A branded/unmodified vendor avatar remains identifiable, character likeness/source rights are unclear, clothing modularity requires permanently remaking the whole rig, or runtime constraints break the approved silhouette.

**Approval required:** User authorizes first-playable runtime integration. This is not production release.

## 5. Stage 5 — Integrate the first playable Voight into Meridian

**2026-10-11 travel-facing clarification (explicit later user decision):** Stage 5 ordinary exploration no longer proposes backward-walk or strafe animation. Keyboard arrows/mobile travel intent must rotate the humanoid toward travel: down turns approximately 180 degrees and travels forward in that direction, and left/right turn toward their camera-relative movement direction. Smooth rotation, gait coordination, ground-contact calibration and reactive Foot IK are specified in the separate [Travel-Facing Locomotion and Foot IK Technical Implementation Plan](./Development/GTD-CHAR-001%20Travel-Facing%20Locomotion%20and%20Foot%20IK%20Implementation%20Plan.md). Its empirical, player-observed acceptance gates refine the provisional Stage 5 movement guidance below; they do not authorize implementation, promotion or production release.

**Purpose:** Replace only the prototype's visible form while preserving accepted game-world systems, delivering an animated person whose body motion corresponds to existing physics and inputs.

### 5.1 Runtime integration architecture

1. **Separate visual from actor state:** Retain MeridianPhysics as authoritative for location, collisions, grounded state and allowed displacement. Attach model visual root/animation controller to the *resolved* Rapier player position and facing. Calibrate foot-to-ground offset, pelvis height and camera target without bypassing collision.
2. **Async loading:** Treat Voight's runtime GLB/model resources as a real load checkpoint with cancel/dispose handling. Do not emit "voight done" until the required visible geometry, rig and essential clips are ready; never leak resources during unmount/re-entry.
3. **First-frame safety refactor:** Replace hard-coded "voight-prototype-body" witness with a runtime-selected actual rendered mesh/sentinel representing the permanent visible hero. On warm-up and load, require real draw submissions for *ground and Voight* **after** accepted vehicle settlement, not merely a generic scene render. A temporary diagnostic proxy may exist only as an explicit experiment fallback, not a hidden production substitute for missing licensed art.
4. **Animation controller:** Introduce states idle, start/stop transitions, walk, run (if differentiated by the control design), sprint, turn-in-place/turn-while-moving, jump/upward, airborne/fall and landing. Blend based on **observed Rapier-corrected displacement**, input and grounded state. Calibrate gait/stride and foot plant; use in-place locomotion with physics-driven translation initially unless G3 measurements authorize root-motion extraction plus collision correction. Do not drive the capsule from unconstrained hip animation.
5. **Existing input/camera:** Preserve touch look sensitivity, movement vectors, desktop arrow-key support, jump/sprint keys, third-person orbit and collision camera obstruction. Additional run/walk distinctions require explicit UX design, not silent control changes. Support normal pause → Settings → Apply & Resume with Voight in place and no world reload.
6. **Visual integration:** Maintain day/night material response, shadow grounding and near/far world coherence; avoid separate magic lighting that only works for the protagonist. Match camera target to visible body proportions and garage indoor scale without allowing camera clipping or moving street geometry.
7. **Disposal/performance:** Release imported GLB containers, skeletons, animation groups, materials/instances owned by the character, texture references and observers safely; avoid disposing shared city resources. Establish static and animated performance comparison with prior prototype on the same hardware/graphics settings.
8. **Regression:** Protect original Meridian world generation, accepted vehicle GLBs, garage approach/interior transition, Rapier collisions and accurate ready-world startup. Preserve loading progress, working PWA layout and compact diagnostics behavior.

### 5.2 First playable action contract

| Stage 5 action | Minimum acceptance |
| --- | --- |
| Idle and breathing | Recognizable stable stance, visually grounded feet, no jitter or recurrent pose popping |
| Travel-facing movement (↑/↓/←/→, diagonal, touch) | Visual root and animation face camera-relative *travel direction*, including 180-degree reversal on down; no ordinary backward-walk or strafe; coordinate gait with *corrected* physical movement |
| Walk/run/sprint | Natural acceleration/transition intent, recognizable character gait, controlled foot slip, no unintentional speed changes |
| Standing/dynamic turning | Consistent heading, no mirrored left/right, no instantaneous skeleton spin on ordinary touch look |
| Jump/airborne/land | State transitions track actual Rapier grounded status; landing does not penetrate pavement or misalign feet |
| Near doors/garage/vehicle | Capsule blocks appropriate geometry; character mesh does not require moving world props or crossing walls; capture clipping and resolve appropriately |
| Camera/mobile | Human remains readable at normal landscape view, camera cannot enter obstruction geometry, touch sensitivity settings still work |
| Lifecycle | Startup waits for **real character+ground** drawn frame after vehicle load; pause/settings/resume preserves exact game runtime and position; exit/re-enter/failed import cleanup reliably |
| Lighting/performance | Maintains day/night visual identity and measured mobile/desktop budgets without regression of approved city/vehicle visibility |

**Deferred beyond first integration:** Full enter/exit-vehicle animation and vehicle driving, aiming, combat, weapon holding, advanced interactions, dialogue facial rig and injury reactions. The Stage 1 research's suggested EnterVehicle clip may be provisioned for future retargeting, but **is not a prerequisite for first-playable acceptance** given the user's explicitly staged scope.

### 5.3 Automated and device regression suite

**Unit/contracts:** Asset metadata and rights gate, resolved scale/orientation, rig mapping, animation-state transitions, physical-vs-rendered displacement, grounded jump/fall/land, no uncontrolled root motion, lifecycle dispose/reload, costume swappability.

**Babylon rendering tests:** glTF import and animation render in an actual engine, skin/material/visible bounds, night/day screenshots where runnable, preservation of render witness after replacement, failure to mark ready on missing ground, missing hero draw, vehicle not settled or scene render exception.

**Rapier/world tests:** Same player spawn and camera-relative motion, curb and garage thresholds, static vehicle collision, real imported vehicle retention, camera ray blockers, indoor/outdoor transitions and player capsule invariants.

**UI/browser tests:** Keyboard arrows and touch gestures, on-screen mobile controls, resume with same runtime, physical pixel slider, native resolution and 125% option, no full-screen diagnostics button, PWA landscape and cache invalidation behavior.

**Manual acceptance:** Matched-view evidence from actual Android and desktop (and iOS when available), movement circuits and 180/360-degree turns, jump/landing and clipping inspection, repeated pause/resume, daylight/dusk/night, cold/cached starts, extended thermal/play sessions, long frame-stall observation. Test real body and original streets/cars simultaneously.

### 5.4 Gate G5 — First-playable approval and release

**PASS only when:** Original visual identity is legible in active gameplay, no prototype capsule/forward marker remains exposed in normal mode, essential locomotion works with Rapier and camera, world startup contract remains intact, device/quality settings behave, same-runtime settings continuity remains intact, commercial rights are cleared, benchmark deltas are recorded and tests plus direct user visual acceptance pass.

**If a device fails:** Do not hide the error with a silent procedural body or drop accepted cars/world. Keep the stage on a reversible development build, optimize/retarget, then remeasure. FL-4 stays formally closed; record any new regression under CHAR-001 rather than rewriting its historical status.

**Production requires its own explicit promotion instruction** following READY build, tests, domain alias check and actual mobile acceptance. Do not infer deploy authorization from acceptance of this plan.

## 6. Evidence ledger and decision records

For each gate, publish a brief dated stage handoff under documentations/Development or Experiments with: user approval reference; commit+branch; provenance and license sources; before/after screenshots; device/browser/display scale; tests and exact result counts; profiling logs or JSON; disposition; known uncertainties; rollback procedure; and remaining authorizations.

Track five independent statuses on any proposed final character: **VISUAL IDENTITY APPROVED**, **SOURCE/RIGHTS VERIFIED**, **ANIMATION/PHYSICS VERIFIED**, **PERFORMANCE ACCEPTED**, **PRODUCTION RELEASE AUTHORIZED**. Absence of any status cannot be concealed by a favorable trial score.

### 6.1 Proposed artifact layout (not yet created)

- documentations/Development/GTD-CHAR-001 Stage 1 Voight Identity Decision.md
- documentations/Development/GTD-CHAR-001 Stage 2 Foundation Qualification.md
- documentations/Experiments/GTD-CHAR-001 Stage 3 Foundation Trial.md
- documentations/Development/GTD-CHAR-001 Stage 4 Original Character Asset Handoff.md
- documentations/Development/GTD-CHAR-001 Stage 5 First Playable Acceptance.md
- A future authored-asset archive and game-character source/runtime modules **only when their relevant stages are authorized**; no vendor asset or confidential license evidence is committed publicly by implication.

### 6.2 Reuse of existing evidence, without assuming compatibility

Leverage src/game/debug/fl4-diagnostics.ts, existing imported-vehicle evaluation reports, src/game/core/world-render-warmup.ts and the in-game settings/pixel-scaling controls as baseline infrastructure. Extend only when a character-specific metric or witness is missing. Frame-time and memory evidence must disclose measurement limits and cannot be retroactively assigned to Voight based on unrelated vehicle benchmarks.

### 6.3 Known research uncertainties requiring resolution

- The committed research presents some licenses (particularly Mixamo and community asset packs) as generic commercial permissions without asset-specific current primary-source proof; legal clearance is an unresolved Stage 2 activity.
- MakeHuman versus MPFB versus MB-Lab product identity, content ownership and export workflow must be recorded distinctly.
- The research suggests incompatible rig-root conventions (pelvis at hips versus root ground origin). We adopt a **separate physics/world root and skeletal/pelvis root**, subject to trial validation.
- The research alternates between a GLB containing embedded textures and GLB plus external texture files. A single packaging/cache specification must be chosen and validated.
- Babylon scene handedness, Blender glTF axis conversions and skinning conventions must be checked against the project's installed Babylon.js version, not copied verbatim from research.
- Reported polycount, memory, texture and load-time guidance is preliminary, sometimes inconsistent and mostly not measured in GTD. It defines trial hypotheses rather than contractual current capability.
- Neither Voight's facial features nor canonical outfit design has been user-approved; Stage 1 cannot be silently bypassed.
- The user-facing action "run" may require a new control distinction: today's core runtime exposes WALK_SPEED and SPRINT_SPEED. Stage 5 should validate movement terminology and avoid adding undocumented inputs.

## 7. Work authorization boundary

**Authorized now:** Creation and repository commit of this technical implementation plan, in exactly the five approved stages and order.

**Not authorized now:** Character sketches treated as final, choosing or purchasing a vendor product, downloading or publishing third-party humanoid GLBs, experiments, runtime edits, committing binaries, modifying the live character, deploying preview/production or expanding game scope.

**Next requested approval:** Stage 1 — Voight identity and canonical appearance definition. Its human-visible creative deliverables must be reviewed and approved before the candidate evaluation stage proceeds.

**Final doctrine:** We are making **Voight**, not merely installing a man-shaped asset. A foundation is a tool; originality, recognizable silhouette, physical credibility, browser fit, documented rights and real in-world behavior determine acceptance.
