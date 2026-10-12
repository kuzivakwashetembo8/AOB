# GTD-WORLD-002 / SO-MA — Municipal Administration
## Generator-Wide Window Grammar, South Ward Street Objects, and Efficient Visual Assets

**Date:** 2026-10-12 (SAST)  
**Status:** PROPOSED — AWAITING SEC-CHECK REVIEW AND EXPLICIT IMPLEMENTATION AUTHORIZATION  
**Document authority:** Technical implementation proposal for the project owner's review; it is not an approval, security clearance, active task or deployed implementation.  
**Planning baseline:** GTD `main` at `035044683722aea97bd9140be9ab7730dfa575e6`; canonical gameplay `/game`.  
**Workstream:** GTD-WORLD-002 Street Objects (SO); **working session name:** Municipal Administration.  
**First implementation experiment after authorization:** Two owner-created, optimized, three-dimensionally credible **OPEN** and **CLOSED** shop boards, correctly mounted on one South Ward storefront.  
**Release policy:** Source in an isolated code branch, preview evaluation, owner desktop/mobile visual acceptance; never merge, deploy, or silently reinterpret SEC-CHECK without explicit authorization. Uploading two assets to `main` does **not** authorize mounting or spawning them in the game.

### Executive decision

South Ward is a **dense, working-class residential area** of apartment buildings, corner shops, schools, churches, workshops, garages, basketball courts, informal markets, local bars and clinics. It is Voight's prospective home and starting territory. Make its streets **legible, recognisable and lived-in** without replacing the already-working buildings, canonical humanoid, imported car or renderer with a complex new simulation.

The implementation must establish two **city-generator-wide systems**, validated first in South Ward:

1. A **deterministic, architecturally coherent facade opening grammar**: uninterrupted horizontal rows and vertically aligned window columns; no arbitrary per-window dropout; for buildings of two storeys or more, **no generated ordinary ground-floor windows by default**, with expressly modelled and documented exceptions only.
2. A **semantic street-object and asset-placement system**: purpose-driven, reusable objects, including owner-designed shop signs, municipal fittings and neighbourhood-specific details. Use inexpensive actual 3D geometry when silhouette, parallax, shadow or collision requires it, and high-quality baked visual assets for flat details. Avoid per-object simulation, uncontrolled external fetches and unnecessary draw calls.

A third supporting capability is a **versioned asset-pack contract** to permit future offline levels. The current service worker does *not* yet guarantee downloaded offline level packs; do not claim offline support or block this street-object vertical slice on a premature full offline implementation.

### Source-of-truth and baseline findings

- [Original GTD-WORLD-002 plan](./GTD-WORLD-002%20Street%20Objects%20and%20Vehicle%20Movement%20Plan%20-%202026-10-12.md): SO-0 inventory, SO-1 object selection, SO-2 deterministic placements, SO-3 render/physics and evidence requirements. The **vehicle workstream is already owner-accepted on desktop and mobile**, so do not rerun it under this plan.
- [Meridian Dynamic Building Generation Algorithm](../Meridian%20Dynamic%20Building%20Generation%20Algorithm.md): architecture from deterministic `BuildingSpec` and contextual rules, not arbitrary randomness; special narrative buildings may be authored.
- [Window audit and correction evidence](../FL-4%20Evidence/Window%20Placement%20Correction%20Specification.md): previous **height/sill** corrections for tall storeys have been integrated into `architecture-plan.ts`. This document addresses **layout grammar and ground-floor use**, which remain insufficient.
- `src/game/world-generation/architecture-plan.ts` currently produces facade bays, but `bayRole` (approximately lines 148–157) alternates blank bays on residential side facades, and per-window seeded thinning (approximately lines 228–231) removes otherwise aligned windows independently. Multistorey building floor zero is also generally eligible for ordinary windows.
- `src/test/fl4-window-grammar.test.ts` currently contains a placeholder, not an architectural invariant test.
- `street-context.ts` and `street-context-renderer.ts` currently understand six kinds: tree, shrub, streetlight, parked-car, bench and bin. Existing props have stable IDs, transforms and seeded variation. `generated-first-light-world.ts` owns collision integration; keep it single-owner.
- `first-light-spec.ts` establishes Mercer Street, Workshop Road and Foundry Lane, two T-junctions, authored streetlights/trees/park bench/bin and an initial set of buildings. The labels exist in road data but there are no complete real-world street-name signs or business-name boards.
- `facade-details.ts` supports facade accents, awnings, sign bands, vents and utility boxes, but does not supply a tested library of readable shop signage.
- `street-context-renderer.ts` includes shared procedural materials and textured foliage; do not discard these efficient features. Some `generated-` visual meshes are comparative placeholders; maintain the accepted real imported vehicle specimens.
- `vite.config.ts` configures VitePWA `generateSW`, with runtime caching for shell pages, scripts/styles/fonts and limited branding images; **it does not declare a complete offline South Ward asset installation/download contract**. `src/lib/pwa.ts` controls worker registration. No claim of offline-play readiness is supported solely by having a PWA worker.

## A. Outcome and acceptance image

A player arriving in South Ward should infer the function and identity of a street from its buildings and street objects before any NPCs arrive. Its working-class identity is conveyed through **inhabited, maintained spaces alongside age, repairs and modest informal commerce**, not blanket grime or uniformly neglected buildings. An apartment block must look like a plausible apartment block; a corner shop must have its own name, hours and OPEN/CLOSED sign; a workshop and clinic should be identifiable by their appropriate frontages and equipment.

Create repeatable landmarks near the future **Voight home**: a recognisable corner shop, identifiable road junction, nearby workshop, park/court and locally consistent signage. **Do not choose or label a particular building as Voight's canonical home without the owner's subsequent location decision.** Streets may expand only after the generator and placement system work on the existing corridor.

Photorealistic textured signage should remain crisp from ordinary walking range without making a whole 3D building into a 2D facade image. On mobile, no forced resolution reduction, world-blur overlay, added first-frame deadlock, or excessive texture budget may be used to mask bad placement.

## B. Scope, exclusions and release invariants

**In scope:** window-row/column rules across the building generator; archetype-specific floor-zero classification; authored opening exception registry; facade collision checks; two owner-supplied OPEN/CLOSED boards; reusable semantic object recipes; visual/collider placement of signs, bins, infrastructure and chosen municipal props; source image/GLB validation; shared material/texture lifecycle; performance and optional offline pack metadata; QA on First Light.

**Proposed second-wave catalogue:** residential wheelie bins, communal refuse containers, shop-name signs, hours boards, price/SPECIAL boards, street-name plates, STOP/GIVE WAY/school-zone signs, hydrants or municipal access covers, bollards, utility cabinets/meters, manhole/drain details; later, bus shelters, traffic-signal hardware, community notices and market stalls. Select content based on *where a believable purpose exists*—not even distribution.

**Out of scope for this authorization:** expanding South Ward road/building footprint; assigning Voight's home; NPCs or traffic AI; operational traffic signals; individual shop economics, inventories or real-time business simulation; opening every store interior; city-wide weathering overhaul; new shader engine; commercially publishing external imported vehicles; replacing accepted Voight locomotion or Ferrari physics; implementing a full offline level manager before its separate gate.

**Release invariants:** preserve canonical humanoid, First Light road geometry, Rapier roadside/garage collision, the playable Ferrari and parked buggy, accepted nighttime atmosphere, first playable frame, mobile touch and camera sensitivity, quality settings/Apply & Resume, existing imported GLB loading checks and disposal. Do not reintroduce proxy cars or the obsolete capsule.

## C. Generator-wide facade grammar (WG)

**C1 — Resolve facade intent before openings.** For each `ResolvedBuildingSpec`, face, exterior mass, floor and bay, derive a `FacadeGrammar` from city → district → archetype → lot/building override. Proposed fields:

```ts
interface FacadeGrammar {
  columnPolicy: "continuous-grid" | "authored-sections";
  groundFloorPolicy: "solid-default" | "designated-storefront" |
    "explicit-authored-openings";
  bayPitchMeters?: number;
  regularWindows: "all-eligible-bays" | "none";
  authoredExceptions?: readonly {
    openingId: string; reason: string; floors: readonly number[];
    facade: FacadeSide;
  }[];
}
```

These are **proposed** shapes, not statements about existing source types. Prefer extending `BuildingRules`, existing `BuildingSpec.openings`, `PlannedOpening` and bay planning rather than adding a redundant city system. Keep the authored/window collision semantics from `interaction-plan.ts`.

**C2 — Layout invariant:** for a given face/mass, establish one eligible column set (stable indices, width and pitch) and reuse it on successive ordinary-window floors. All generated ordinary-window sills in a given floor band use the same vertical datum. Rows are level and window tops/bottoms follow a coherent height grammar. No "window-window-window-gap-gap-window..." unless the gap is a documented architectural section (entrance bay, stairwell core, structural blank facade panel, balcony, workshop bay etc.). Variation may change glass tint, blinds, trim or weathering **without changing column occupancy**.

**C3 — Eliminate arbitrary omissions:** remove per-window seeded thinning, including the side-facade `index % 2` blank-bay rule, from the standard grid profile. Seeded variation may pick an **entire facade pattern** or a documented structural section, never drop individual windows independently. A narrow wall with too little span for a valid window can be explicitly windowless.

**C4 — Ground-floor rules:**

| Archetype | Two+ storeys: generated floor zero | One storey | Overrides |
|---|---|---|---|
| Residential / apartment | Solid by default; pedestrian doors and approved access openings are distinct | Modest ordinary windows may be appropriate | Authored ground windows must declare rationale and meet collision rules |
| Office / civic / hospitality | Solid/no *ordinary* windows by default in this stage | Appropriate front glazing only if intentionally selected | Named lobby/reception/accessible storefront exemption |
| Commercial / corner shop / tuck shop | Deliberately designated ground-level *storefront* glazing and signs | Lower glazing allowed | Ground-level glazing is a separate kind from ordinary residence windows |
| Mixed-use | Designated commercial frontage only; otherwise solid base | Per declared use | Upper stories use regular grids |
| Industrial / workshop / garage | Service doors/bays; only deliberately specified low glazing | Lower workshop/service windows permitted | Existing authored garage geometry protected |
| Parking / warehouse | Generally solid or service openings, not forced generic grids | Same | Authored, validated exceptions |

**Interpretation:** user's rule is “ordinary generated windows begin on the **second floor** for 2+ floor buildings.” That is a stricter aesthetic rule than claiming real architecture can never have ground-floor glazing. Intended shops, reception lobbies, schools/clinics and hero buildings remain authorable **with a named, documented exception**.

**C5 — Sill, proportion and collision:** retain the recent floor-height-based window sill/height correction for tall storeys; apply it to eligible floor bands only, not as a replacement for grid logic. Ensure facade glass/frame surfaces are flush/recessed appropriately relative to structural walls and the Rapier collision shell. For a non-interactive facade, a car striking a ground facade must hit the wall's intended collision surface rather than protruding “window blockers”; actual accessible/physical glass is a distinct reviewed collision feature. Do not turn cosmetic windows into traversable doors.

**C6 — Authored precedence:** preserve original garage bay, physical garage rear windows, designed portals and known interior/interaction anchors. An authored opening overlapping a grid cell reserves the full intended bay or an expressly authored section. Do not silently remove the nearest random column, change building IDs, alter geometry massing or re-seed the world. Exceptions must be testable and appear in the validation report.

**C7 — Programmatic tests:** on every generated facade, test stable floor-column sets and monotone row elevations; no unauthorized floor-zero windows; no overlapping openings; no windows crossing mass boundaries; stable `BuildingSpec + seed + generatorVersion` output; minimal wall thickness/colliders; shop/garage authored exclusions; podium/tower sectional alignment; identical plan before/after rendering LOD. Replace the placeholder `fl4-window-grammar.test.ts` with meaningful exhaustive/property-like fixture tests. Snapshot existing ten First Light buildings to identify intentional exceptions and expected visual deltas.

## D. Street-object system (SO)

**D1 — Define one semantic object registry.** Extend existing `PropPlacementSpec` / `StreetContextItem` with a validated template reference; separate the **asset definition**, **world placement**, **interaction/collision policy**, and **presentation variant**. Avoid expanding a single massive renderer `if/else` for every future city object. Suggested concepts:

```ts
type StreetObjectFamily =
  | "municipal" | "residential" | "commercial"
  | "road-safety" | "community" | "workshop";
type StreetObjectAnchor =
  | { type: "facade"; buildingId: string; facade: FacadeSide; bayId?: string; height: number }
  | { type: "road"; segmentId: string; distance: number; side: -1 | 1; setback: number }
  | { type: "junction"; junctionId: string; approachId?: string }
  | { type: "public-space"; publicSpaceId: string; x: number; z: number }
  | { type: "authored"; position: WorldPosition; yawRadians: number };
interface StreetObjectTemplate {
  id: string; family: StreetObjectFamily; assetId: string;
  dimensionsMeters: { width: number; height: number; depth: number };
  attachment: "wall" | "post" | "ground" | "road-marking";
  collision: "none" | "simple-box" | "simple-cylinder" | "authored-shape";
  lodClass: "flat-detail" | "small-prop" | "hero";
  castsShadow: boolean;
  semanticUse: string;
}
interface StreetObjectPlacement {
  id: string; templateId: string; anchor: StreetObjectAnchor;
  variantId?: string; seed: string | number;
}
```

Implementation may adapt these sketches to current schema; do not add runtime per-frame React state or new physics owners. Data schemas require versioning and input validation. Template/placement IDs are stable across rerenders, saves, LOD and offline packs.

**D2 — Placement pipeline:** authored landmark placement first, then district/neighbourhood density and archetype zoning, then seeded candidates, then exclusion/clearance validation, deduplication and render planning. Semantic constraints:
- Street-name plate: junction/corner with matching road-graph name and facing, not fabricated road labels.
- STOP/GIVE WAY and school-area signs: actual appropriate approaches/locations, with fixed viewing direction and no invisible blocking footprint.
- Shop-name board, OPEN/CLOSED, hours and specials: on a **real commercial frontage**, offset from entrance/window frames and garage openings, naturally readable from the sidewalk.
- Residential refuse bins: apartment entries/collection points and reachable curbs, not in pedestrian travel lanes or random parks.
- Hydrant and service access: accessible and unobstructed; approximate municipal conventions chosen for the fictional city; don't assume every external reference applies to South Ward.
- Drain/manhole cover: surface-aligned cheap decal or thin geometry without a protruding blocker.
- Bollard: only where pedestrian/vehicle protection or access separation has a reason; collider should match visible solid.
- School/clinic/church/workshop/basketball/market/bar equipment: only after the matching site is actually authored. Do not conjure a clinic from an asset tag.
- Streetlights/trees/park furniture: keep accepted existing placements until comparing same-camera baseline; changes must not disrupt night lighting or curb/Voight movement.

**D3 — Clearance and world ownership:** use road-edge/sidewalk boundaries, actual storefront/door sweeps, curb cuts, crosswalks, garage portals, camera line-of-sight and existing Ferrari/Voight Rapier bodies. Prototype review targets: a clear pedestrian path of approximately **1.2–1.5 m** where geometry permits, no collision on the road travel lane, clear garage approach and no object base below terrain. Final clearance policy to be based on actual sidewalk widths and device tests; do not assert those preliminary figures as current city guarantees. For visible solid props, register/deregister a simple fitted Rapier collider via the existing generated world lifecycle; flat sign/art assets should not create blocking colliders unless their physical frame protrudes significantly.

**D4 — Render architecture:** group small static items by shared geometry/material when it reduces measured cost; thin-instance regularly repeated geometry only when unique ID/picking/collision and per-object orientation remain supported. Use simple mesh for a convincing 3D silhouette, textured quads for flat art, decal-like surface geometry for road details, and restrained compound objects where near-field parallax matters. Prefer shared materials and signed rotation/scale transforms. Keep day/night behavior tied to the existing Meridian clock/environment (no separate light update loop for shop signs).

**D5 — Object record:** every addition must document `id`, semantics, placement source, asset provenance, mesh/texture count, scale in meters, physical footprint/collision mode, texture sampling and mipmaps, LOD policy, nighttime visibility, mobile render cost and failure fallback. For visibility/accessibility, legible written signs matter; unreadable source art must be rejected rather than accepted as “decorative realism.”

## E. Two owner-created OPEN/CLOSED shop boards: first vertical slice

**E0 — Asset handoff (owner).** The owner generates two visually coherent, realistic **OPEN** and **CLOSED** signboard assets, optimizes them and places them in `main`. Accept either optimized **glTF 2.0 GLB** with a physically credible shallow body plus baked art, or verified texture artwork that is mounted on one small in-engine sign body; record which medium arrived. Do not assume generated images automatically contain correctly editable 3D geometry. The first source upload is **asset intake**, not a deployment or a signal that code integration was approved.

**E1 — Required file manifest and validation:**
- Fixed descriptive names (`south-ward-shop-open`, `south-ward-shop-closed`), original source/master kept outside the runtime bundle or in an explicitly designated source-art folder; optimized runtime variants committed to a versioned asset directory.
- Actual physical board dimensions in metres, forward (+Z/-Z) face, origin/pivot, front/back and mounting offset; no unintended scenery or photographic background planes. Backplate/frame and shadows only if they earn geometry.
- Readable exact lettering; corresponding OPEN/CLOSED designs share consistent dimensions, pivot, frame, material style and daytime/nighttime visibility. Avoid fake metallic depth baked into an impossible silhouette.
- Optimized WebP for opaque/alpha artwork after checking visual fidelity; PNG only where required; evaluate GPU-compressed KTX2 **only after** Babylon-compatible import/decode measurement. Square 256–512 px or correctly aspect-matched equivalent initially; final size chosen by real on-screen pixel coverage. Do not assume an aggressively compressed image necessarily uses little GPU memory.
- Prefer atlas/share material after the initial two assets are verified. If the two boards have different file/UV mappings, normalize in the **asset preparation tool** rather than adding runtime hacks.
- No remote URLs, executable extensions, unexpected external URI dependencies, scripts, active HTML/SVG, unnecessary GLB extras/extensions, secrets or rights-uncertain third-party content. Enforce allowed formats, decoded dimensions, encoded bytes, valid glTF buffers/textures, sane vertex/mesh counts, bounded model bounds, and content hashes.
- Commercial ownership/provenance: owner-created input recorded with tool/source and rights declaration; project does **not** inherit Ferrari external-model rights from this approval.

**E2 — Runtime board contract:** one designated corner-shop facade, stable anchor and mounting height, small visible 3D depth, proper outward orientation, no z-fighting/glass overlap, no collision with sidewalk or Voight's head. Initially keep one explicitly selected board **static** and the other available as a variant: *do not* implement business-hours simulation, shops opening, inventories or NPC operations. In a later separately accepted enhancement, one shop state can switch based on existing Meridian time without loading another scene or rebuilding geometry. The pair must be reusable by another shop through data, not a special-case `if (buildingId === ...)`.

**E3 — Missing-asset behavior:** never block first playable frame on decorative signage or spawn a blurry proxy claiming a successfully imported sign. Log the failed asset ID and skip the sign safely; preserve building/world/character/vehicle startup. The accepted preview must confirm actual authored board render, not only a mesh name, HTTP 200 or file presence.

## F. Asset production, loading and future offline levels

**F1 — Master-to-runtime pipeline:** generate/source high-quality masters → inspect provenance/rights and embedded text → crop/alpha cleanup → correct brightness/normal and material response → resize to measured screen coverage → generate mipmaps → compress suitable runtime images/GLB → compute manifest/content hash → publish shared asset definition. Do **not** deliver 2K/4K masters to the live scene merely because the source is high resolution.

**F2 — Geometric rule:** 2D textures provide visual detail, not physical thickness. Signs, cabinets, litter bins and hydrants require credible three-dimensional silhouette; flat posters, labels, painted markings and window notices generally do not. A sign with a thin frame may use a shared box + one texture plane. Rectangular opaque shop boards need not use transparent textures; cutouts may require alpha test. Avoid large transparent blended quads and sort issues.

**F3 — Memory/network cost:** record encoded bytes, decoded texture dimension, GPU format, mip overhead, triangle count, material count, draw calls and actual closest/furthest viewing size per asset. Example planning only: uncompressed RGBA 2048² ≈16 MiB before mipmaps, while RGBA 512² ≈1 MiB before mipmaps. Smaller files do not automatically mean proportional VRAM savings. Profile compressed GPU textures separately from WebP transfer. Compare an unchanged production route against the exact same mobile/desktop view; set numeric budgets from the baseline rather than asserting a made-up FPS guarantee.

**F4 — Shared loading and lifecycle:** use the existing Babylon scene resource owners and renderer boundaries, memoize/shared-load each asset once per level, instance or reuse material where justified, refcount/dispose leases, cap concurrent decodes during initial entry and defer decorative downloads until gameplay-critical loads settle. Preserve established import witness/first-frame gates. Asset failure must not crash `GTDGameRuntime` or dispose objects owned by a different instance.

**F5 — Future offline contract, preparation not immediate implementation:** model a `south-ward/<pack-version>/manifest.json` containing `assetId`, path, SHA-256/content hash, required/optional, byte size, format, dependency list and pack/schema version. Build a user-visible *install level* workflow in a later separately authorized phase: check quota, download/cache all required same-origin resources to a versioned namespace, verify hashes and completeness, atomically mark the pack installed, and load entirely from the installed pack offline. Handle interrupted downloads, storage eviction, stale caches, schema upgrades and rollback. An incomplete pack must never report “offline ready.” Browser storage persists conditionally, not forever. Protect service-worker update and canonical shell startup from added level-cache rules. Current VitePWA shell caching is **not** a proof that 3D levels are offline-capable.

## G. Engineering tasks, ownership and gates

| Gate | Task | Required evidence | Exit state |
|---|---|---|---|
| **MA-0 / SEC-CHECK** | Review this plan, asset intake rules, repo changes/permission boundaries, threat scenarios, rollout/rollback, offline data safety and dependencies | Explicit SEC-CHECK disposition and owner authorization (record decision/conditions); no inferred approval | **BLOCKED until externally authorized** |
| **MA-1 / Asset intake** | Validate the two owner-uploaded OPEN/CLOSED boards against E1; snapshot main SHA and identify a real corner-shop frontage | Exact files/sha, dimensions, provenance, GPU/network budget, screenshots of unmodified world | Board assets qualified; no placement yet |
| **MA-2 / Board vertical slice** | Dedicated feature branch: place one board on an appropriate building, register variant, reuse existing scene and materials | Correct appearance/wall mount and readability by day/night; Voight/Ferrari collision unaffected; stable IDs; safe missing-asset behavior | Preview-owner approval; no main merge without explicit greenlight |
| **MA-3 / Window grammar** | Generator-wide layout/ground-floor correction and meaningful tests | Row/column equality, explicit exceptions, preserved authored garage/interiors, full building suite, collision test and matched screenshots | No arbitrary window holes or undocumented low windows |
| **MA-4 / Municipal catalogue** | Add first approved objects through semantic placement engine and common renderer/collider pipeline | Tested placement near Mercer/Workshop/Foundry; legible named shops/streets; no obstructed routes or nonsensical distributions | Selected catalogue owner-accepted |
| **MA-5 / Device + lifecycle** | Complete typecheck, tests, build and real browser desktop/mobile evidence | First/cached load, p50/p95 frames, draw calls, VRAM estimates where measurable, static/touch/vehicle routes, pause/resume, day/night, disposal | No performance or world/character/vehicle regression |
| **MA-6 / Release** | Owner approves PR merge/deployment and records exceptions | Reviewable PR, same build SHA, Vercel READY, canonical URL, user visual acceptance, rollback SHA | Street-object baseline can be promoted |
| **MA-7 / Future expansion** | Extend South Ward, identify Voight's home and reuse generator/object language; separately plan offline level installation | Additional authoring/size/streaming/security budget and explicit authorization | **Excluded from this first implementation plan** |

**Execution:** after SEC-CHECK and owner greenlight, **the first integrated experiment is the two shop boards**, followed by generator-wide window correction before introducing many new streets. MA-2 and MA-3 may be worked in parallel only when asset mounting and facade construction conflicts are understood. At every gate, record file/commit SHA, preview URL, observed result, failed test, diagnosis, fix and outstanding issue. A green automated test is not a substitute for real in-game screenshots.

## H. Security and SEC-CHECK submission checklist

SEC-CHECK is an **external decision gate**. The repository review branch is **documentation only**; neither this text nor the board upload self-authorizes implementation.

1. **Threat inventory:** malicious/oversized file, glTF external-resource dereferencing, unsupported compression/extension, forged MIME, decompress bombs, deeply nested hierarchies, HTML/SVG/script ingestion, unexpected executable code, untrusted texture URI or dependency, shader/material compile failures, same-origin fetch misuse, authored text containing unescaped markup.
2. **Validation:** content-type allowlist and magic-byte/parse check, metadata schemas, size/dimension/vertex bounds, local-only URI dependencies, safe error handling and explicit asset provenance/licensing. Reject invalid formats **before runtime integration**. Don't load arbitrary owner files from a client-supplied URL.
3. **Runtime safety:** no eval/dynamic script injection, user-generated text escaped or baked into textures, no new sensitive storage, no third-party runtime network dependence, bounded resource loading, memory/dispose correctness, no alteration of vehicle/character startup witnesses.
4. **Caching/offline safety:** no blanket cache-everything strategy, no misleading offline-ready state, versioned atomic asset manifests, cache migration and rollback, service-worker scope review, no protected/private endpoints cached, no replacing the established shell policy without a separate reviewed gate.
5. **Repository governance:** new engine behavior on isolated feature branch; code review/diff contains no binary masters unexpectedly bundled into `/game`, no secrets, licenses documented; TypeScript, Vitest, build and real preview tests; no auto-production merge. Log SEC-CHECK decision and conditions explicitly.
6. **Rollback:** retain current `main` commit and canonical production baseline, support disabling new object placement by a narrow feature flag during trials without reverting unrelated Ferrari/humanoid work, remove/restore versioned cache safely, and compare startup/collision/first-frame metrics to baseline.

**SEC-CHECK must decide:** whether this plan and its asset intake controls may proceed, whether any restrictions must be met before even the two-board experiment, and whether a subsequent code/security review is required before the production merge. Record its actual verdict verbatim; do not manufacture approval.

## I. Visual/physics/performance acceptance matrix

| Category | Positive acceptance | Reject if |
|---|---|---|
| Window grammar | Second+ floors form predictable full rows and vertically aligned columns in each section; authored exceptions traceable | Arbitrary missing middle windows, random stair-step columns, ordinary low ground-floor windows on 2+ floors |
| Building physics | Wall/glass/portals retain intended Rapier collision; vehicle meets wall, not protruding cosmetic window | Ghost collision, visible wall penetrations, lost garage door or clipped window |
| Shop boards | Readable OPEN and CLOSED art, plausible 3D mounting, correct scale/orientation and daylight/night visibility | Huge flat photographic panel, blurry lettering, z-fighting, floats/blocks doorway or walk path |
| Street objects | Each has an intelligible municipal/residential/commercial purpose and real anchoring | Random scattering, overpopulated sidewalks, props in road/garage/curb cut |
| Reuse | Change asset ID, building anchor or neighbourhood rules without adding a special-case renderer function | Recopy meshes/scenes per shop, duplicate physics owners, stateful React per prop |
| World continuity | Humanoid/Ferrari, city, night sky, shadows, Apply & Resume, touchscreen/camera remain accepted | Obsolete capsule, proxy cars, loading deadlock, mobile raster drop or clipping regressions |
| Asset performance | Measured acceptable transfer/decode/VRAM/draw calls vs same-device baseline and zero missing owned assets | Claims based on file size alone, unmeasured “free” PNGs or dozens of independent texture fetches |
| Offline future | Versioned manifest/provenance specified and auditable; future install verifies complete pack | Claim that present shell worker automatically means South Ward levels work offline |
| Security | Explicit SEC-CHECK verdict and verified safe source assets; source/preview/rollback are traceable | Inferred approval, external untrusted asset URLs, undocumented code/asset promotion |

### Measurements and evidence protocol

Use fixed-route, fixed-camera, fixed-time-of-day screenshots before/after on the **same desktop and mobile devices**, including garage frontage, Mercer Street commercial corner, two T-junctions, pocket park, low curb, an apartment block, shop-front close-up and night view. For each: initial and cached load, board visual pixel coverage, scene draw calls/meshes/materials, transfer bytes, decoded/estimated GPU bytes, p50/p95 frame intervals, stutter, collider contacts, scene disposal and loader failure recovery. Keep metrics labelled *unknown* if unavailable—never zero. A failing case must be entered in a defect register with source, reproduction, expected vs observed outcome, remedial decision and retest.

**Final review questions for owner / SEC-CHECK:**
1. Approve first shop-front selection and exact dimensions/mounting for uploaded boards.
2. Confirm “solid-first” floor zero for all 2+ storey archetypes except **documented, explicitly authored** storefront/lobby/special building intent.
3. Select the second-wave street-object subsets after board/window results rather than authorizing all props simultaneously.
4. Confirm any release limitations for offline asset storage, third-party provenance and shop artwork.
5. Give **explicit implementation authorization** separately from accepting this technical plan.

**Present state:** Plan only. No facade/prop/render/physics code changed, no boards mounted, no assets manufactured, no deployment initiated, no SEC-CHECK result asserted.
