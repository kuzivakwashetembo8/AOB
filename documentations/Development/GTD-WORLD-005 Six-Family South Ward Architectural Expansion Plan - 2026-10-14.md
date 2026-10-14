# GTD-WORLD-005 — South Ward Six-Family Architectural Expansion Plan
Date: 2026-10-14. Status: PROPOSED / PLAN ONLY. No new buildings, city geometry, shader features or traffic are authorized by this document.
Sources of truth: documentations/Meridia First Light Implementation Plan.md; documentations/Meridian Game World Development SOT.md; GTD-RND-MAT-004 surface taxonomy; GTD-RND-MAT-009 material-and-geometry doctrine; GTD-WORLD-004 architecture catalogue; GTD-WORLD-003 six-system prerequisites and open ground-infill failure register; GTD-RND-MAT-010 asset audit.

## 1. Objective and baseline
Transform South Ward from ten First Light anchor buildings into a believable working-class mixed-use neighbourhood with distinct material identities. Six submitted families cover BRK, WOOD, GLS, STN, MET and RND; 60 numbered file entries are NOT 60 unique, approved or usable exterior materials. The RND-10 source duplicates RND-01. No newly moved stone/metal/render family is active in the game yet.

Actual first-light-spec.ts defines TEN authored buildings: west support, garage, east support, south apartment, corner commercial, two skyline towers, rear residential, rear shop and rear workshop. The road graph has FIVE segments over Mercer Street, Workshop Road and Foundry Lane. The generator uses typed CitySpec -> district -> neighbourhood -> block -> lot -> building, with deterministic city version/lot ID selection. Existing accepted brick/wood/tower appearances and all physics/camera/vehicle states are frozen regression controls.

The unresolved WORLD-003 failure (generated pavement, parking and grass still visually absent, with 17-light shader error present but not conclusively mapped to ground materials) is a known open production issue. City expansion may expose it further. Do NOT bury it with cosmetic patches, assume tests prove it fixed, or silently mix ground fixes into building implementation.

## 2. Urban design north star
South Ward should read as old-to-new working-class residential and service fabric rather than a downtown glass business district. Keep street-level retail, mixed-use corner buildings, modest low-rise housing and garages, small warehouses/workshops, a clinic/community facility, cafes and occasional civic stonework. The existing two glass towers are high-rise exceptions and anchors, not a template for generic high-rise growth.
Realism requires architectural syntax: roof style must fit structural use; all buildings need accessible real doors; windows are regular by floor and do not start at wheel height; genuine ground-store shopfront glazing is an exception; service buildings must have physical bays; maintenance/downpipes/rails require scene geometry when visibly deep. Refrain from wood caps on towers or wooden skyscrapers. Do not turn textures into pre-painted building pictures.

## 3. Candidate building programme (initial target: 16 to 20 structures, subject to real lot clearance)
The numbers below are candidate counts, not committed map coordinates. Every instance must be generated through valid CitySpec lots and WORLD-004 profile IDs after validation. Start with the smallest material field trial, not all at once.

| Group | Candidate count | Eligible profile | Primary/secondary material roles | Required true geometry |
| --- | ---: | --- | --- | --- |
| Attached terrace/townhouse rows | 3-4 | ARCH-05 / ARCH-29 | BRK-02/04 or RND-01/02/05 walls; WOOD-01/03 porches | pitched/flat domestic roofs, real door per unit, stoop, predictable upper windows |
| Detached houses / small rentals | 2-3 | ARCH-04 | WOOD-01/06, RND-07 or BRK-03/08 | fenced/curtilage clearance, doors, porch, roof and utility pipe |
| Shops under apartments | 2-3 | ARCH-09 / ARCH-30 | BRK-01/09, RND-03/09 upstairs; GLS real shopfront | regular upper windows; ground shopfront openings, awning and entrance |
| Workshop / garage / light warehouse | 2 | ARCH-31 / ARCH-10 | MET-01/02/07 base finish + separate physical rib system; BRK/stone plinth | rollup bay aperture, pedestrian door, rainwater goods, pitched/shed roof |
| Clinic / community office | 1-2 | ARCH-06 / ARCH-03 | STN-01/08 entry; RND-01/06 body; GLS actual windows | canopy, service entrance, true glazing/trim |
| Neighbourhood civic landmark | 1 | ARCH-11 / ARCH-27 | STN-01/03/05 as primary; BRK-08 as secondary | genuine institutional front door, parapet/cornice geometry |
| Cafe / bar / small entertainment venue | 2-3 | ARCH-18 / ARCH-19 / ARCH-30 | BRK-06/07, limited MET-03/05 accent, WOOD-09 detail | recessed doors, storefront glazing, signage, physical canopy |
| Local apartment building | 1-2 | ARCH-29 | RND-02/05/09 + BRK-04/05/08, selective STN-08 plinth | 3-5 floors, floor-aligned windows, proper entry |
| Small market / utility annex | 0-1 | ARCH-32 / ARCH-26 | MET-02/10, BRK-07; NO RND-10 | stalls/canopy support or real louvres if used |

The programme must be clipped to feasible, non-overlapping lots. If road and pedestrian access cannot be maintained, reduce the count. No uniform selection across 60 assets and no fake extra buildings hidden inside texture sheets.

## 4. Six-family material policy, per facade zone
- BRK (01): preferred authentic street-wall material for older apartments, residences, small shops and garage. BRK-01 accepted live reference: apartment compactA repeat 1.350m and garage standardB 1.485m. Preserve physical metre UV, mortar alignment, real openings.
- WOOD (02): primary on plausible small timber buildings only; otherwise doorway, porch, balcony or annex accents. Use actual WOOD registry labels and source aspect ratio. Do not apply wood to tall office/skyline bodies.
- GLS (03): keep the blue tower stripless with continuous whole-building UV and grey tower with continuous image beneath actual 3D mullions/transoms and dark framing roof. These are opaque glass-look colourways; new shop glazing needs its own transparent/window component, not a simulated photo.
- STN (04): use ashlar/lime stone on civic walls or plinths, fieldstone on low-rise/pier foundations, slate/sandstone as appropriately sized stone finish and marble as limited premium entry feature. Scale courses and veins physically; large texture relief does not imply real structural collision.
- MET (05): images convey base metal finish, light response, oxidation and fine surface grain only. Ribs, corrugations, folds, cassettes, real open perforations, mesh, seams, roof flashing and support structure must be actual lightweight mesh or explicitly approved shader technique where physical depth matters. Keep sheet orientation continuous at corners and roofs; never bake object/cloud reflections.
- RND (06): primarily monolithic wall coating on housing, community buildings, older shops and apartment upper sections. Preserve sand/trowel texture with no fake panel grids. RND-04/08 need convincing aggregate scale; RND-09 cracks are surface-only. RND-10 is BLOCKED duplicate and MUST NOT be assigned.

Single building should have one deliberate principal façade finish and at most a small number of plausible secondary/accent zones: street wall, upper wall, entry, plinth, roof/canopy, rear/service and real glazing. Assign by architectural profile and building use, NOT unrestricted random selection.

## 5. Proposed implementation architecture (not yet code)
A. Asset QA registry: independently measure 30 new images, verify exact blob SHAs, dimensions, repeats, appearance IDs, rights and acceptance statuses; add typed STN/MET/RND exports only after verification. Fields include familyId, surfaceId, sourceRevision, byteSha, eligibleFacadeZones, materialMode, approvedProfiles, physicalTileMetres, fallback and geometryProfile. Prevent blocked or unreviewed assets from automatic assignment.

B. Building profile data: apply WORLD-004 ARCH-01..32 eligibility and MASS-01..15 bounded massing strategies. Existing BuildingArchetype and FacadeMaterial must not be replaced by free-form string hacks; add separately typed facade-zone assignments, not a random global six-family draw.

C. Deterministic city composition: allocate new registered road nodes/segments, blocks and lots using established city rules. Maintain stable lot ID and seed so adding one plot cannot reshuffle accepted buildings. Use setback/footprint, road-frontage, door pedestrian access, adjacent building separation and car-route clearance checks. Proposed axes are Mercer Street mixed-use side parcels and Foundry Lane service/residential transition. Exact coordinates MUST be calculated from the actual road/lot graph, not invented in planning.

D. Bounded geometry: reuse actual doors, windows, massing/roof templates, downpipes and facade profile strips. Add only shapes with needed silhouette/contact/shadow; model physically open metal screens and garage apertures rather than painted pixels. Geometry may be thin-instanced when safe; physics/visibility blockers should match collisions.

E. Material lifetime: reuse the existing scene-scoped createImageWallMaterial and BuildingMaterialLibrary or compatible leases; share texture resources by URL, enforce opt-in exposure, mipmaps and proper release. Buildings never download all 60 WebPs by default. Preserve mobile PWA storage and image budgets.

F. District integration: update building address metadata from road graph, street/zone tags, indoor entrances, LOD and block lifecycle/streaming; no traffic subsystem or second-city work. The known WORLD-003 ground shader and missing infill are a separate research stream and explicit release risk.

## 6. Sequenced gates for overnight work
**P0 — Baseline inventory / guardrails (audit only).** Freeze main SHA, ten existing building IDs, five roads, player spawn, parked sports cars, glass UVs, existing brick and wood assignments, current mobile quality settings. Record daylight/night baseline screenshots and test output. Deliver an asset/architecture matrix for every current and candidate building. Halt on missing source-of-truth facts.

**P1 — Three new material pilots (requires owner authorization).** Confirm STN/MET/RND pixel dimensions, 2x2/3x3 edge tiling and metre-calibrated UV; fix RND-10 only on explicit owner input. Trial one carefully selected building/zone each: stone civic plinth, metal warehouse wall without fake ribs, render townhouse; maintain brick/wood/glass controls. Capture near/far/night/mobile. Gate MAT-QA: owner visual acceptance, not only tests.

**P2 — Architecture prototypes.** Implement one townhouse row, one commercial frontage, one service/warehouse hall and one civic/clinic entrance on preview-only isolated candidate lots. Validate architectural zoning, windows starting on correct floors, real door, roof details, collisions and low-cost LOD. Gate BLD-STRUCT: stable model geometry and independent physical trim.

**P3 — Valid block and lot generation.** Only after previous WORLD-003 prerequisite gate G1 (surface coverage) and G2 (correct/reproducible vehicle physics), plus explicit user approval, extend typed road/lot graph. Stage batches of no more than six new buildings; run overlap/collision/road metadata checks per stage. No static coordinate patching into scene constructors.

**P4 — Style diversity/optimization.** Add owner-approved variants gradually across roles and plots; measure texture heap/decode and GPU usage, shader light count and performance on Android landscape vs desktop using matched scenarios. Preserve selected frame quality and no clipped geometry, broken window rhythm or visibility bands. Gate PERF: user accepts device comparisons.

**P5 — Preview review and controlled promotion.** Build/tests, final asset-to-building mapping, unique building count, screenshot matrix day/night/street/aerial, desktop/mobile tests, physical vehicle travel and enter/exit, user-visible preview. Do not merge/deploy until owner approval; ambient traffic remains separately gated.

## 7. Evidence and failure-mode register
- Static inventory passes do not mean surface textures are visually seamless or assigned.
- RND-10 is byte-duplicate of RND-01; block its proposed earthy render ID.
- Owner MET strips-free image policy conflicts with literal corrugated/perforated taxonomy geometry; record image-vs-geometry independently before labeling prototypes accepted.
- Legacy TIM vs WOOD and conceptual GLS vs owner colorway variant naming remain intentional historical mismatches.
- WORLD-003 still renders dark/unfilled terrain; do not claim ground infill fixed by adding buildings or speculate that 3-light cap solves browser shader compilation.
- Watch GL_MAX_VERTEX_UNIFORM_BUFFERS (12 observed) and reported LIGHTCOUNT 17 shader variant; locate owning material before any shader fix.
- Keep Voight hover/accelerated reverse flight, correct Ferrari local entry/exit, rear-follow camera, night lighting, street metadata and all First Light movement working.
- Check windows/doors from the sidewalk and from flight; no phantom first-floor window at vehicle collision height, no attached timber skyline caps, no flat image posing as physical detail.
- Preserve texture source SHAs and asset provenance; user accepts visual fit before production.
- Maintain manual Vercel deployment discipline (do not deploy on every commit).

## 8. Expected artifacts, ownership and decision gate
The implementation branch should contain a proposed candidate lot/profile catalogue, per-building surface assignments, collision and LOD proof, a test/benchmark register, desktop/mobile screenshots and a concise PR handoff. Each phase requires its owner decision and explicit implementation authorization.

**The next decision is scope:** material-only pilot versus a bounded new block, or full proposed expansion. Do not treat this documentation request as permission to create 16–20 buildings overnight.
