# Meridian Generated First Light Fidelity and FL-3 Transition Plan

Status: APPROVED — IMPLEMENTATION PENDING GREENLIGHT  
Date: 2026-10-09  
Project: GTD — Grand Theft Division  
Repository: `interlinkglobal/GTD`  
Canonical implementation branch at approval: `integration/meridian-generation-validation`

## Purpose

This document defines the next technical phase after the successful structural reconstruction of First Light through the Meridian City Generation Algorithm.

The Step 1–5 pipeline has now demonstrated that the authored First Light building arrangement can be reconstructed from structured, deterministic city data with high structural similarity in building placement, footprint, scale, massing, hierarchy, archetype role, facade planning, physical semantics, and city composition.

The next objective is therefore **not** to continue proving that the generator can reconstruct the city.

The next objective is to raise **Generated First Light** from structural parity toward visual and environmental parity, then transition project authority to **FL-3**.

The governing sequence is:

```text
Structural generation proof
        ↓
Broader visual fidelity
        ↓
Generated First Light parity review
        ↓
Controlled integration into main
        ↓
FL-3 becomes the governing source of truth
```

The implementation rule remains:

> **The generator removes repetition. It does not remove authorship.**

And the established technical-art rule remains:

> **Art decides what the player must believe; technology finds the cheapest reliable way to make them believe it.**

---

# 1. Current accepted baseline

## 1.1 Structural generation proof

The current generated First Light implementation has proven the following areas at the building level:

- stable building IDs
- stable coordinates
- semantic anchors
- deterministic seeded variation
- building archetypes
- typed city/district/neighborhood/block/lot/building/road contracts
- procedural massing
- facade/floor grammar
- reusable architectural templates
- segmented real openings
- roof generation
- shared material infrastructure
- window representation policies
- LOD infrastructure
- material caching
- batching/thin-instance policy with fallback
- Rapier collision generation
- collider reclamation
- camera blocker semantics
- physical glazing
- interaction anchors
- interior modes
- portals
- spatial metadata
- semantic road topology
- road-aware orientation
- neighborhood composition rules
- skyline classifications
- city registry
- block lifecycle/streaming foundations

The First Light comparison confirms that the generated ten-building set substantially reproduces the authored urban composition.

The current conclusion is:

> **First Light building reconstruction is structurally proven.**

Further work must not spend unnecessary effort re-proving placement, massing, scale, height hierarchy, or building-role reconstruction unless a regression appears.

## 1.2 Verification baseline

The controlled integration branch has passed:

- strict TypeScript
- real dependency installation
- Vitest
- Babylon NullEngine tests
- real Rapier lifecycle tests
- repeated generated-building collider reclamation
- production build

The strongest recorded verification gate produced:

- 8 passing test files
- 49 passing tests
- successful production build
- repeated Rapier load/dispose lifecycle validation

The authored First Light runtime remains intact and continues to serve as the regression oracle.

## 1.3 Comparison interpretation

The Generated First Light scene currently has strong building-level structural parity but incomplete environmental fidelity.

The remaining gap is primarily in:

- facade richness
- weathering
- surface variation
- secondary architectural detail
- window/storefront richness
- street-level grounding
- finished road representation
- curb/sidewalk detail
- road markings
- drainage
- vegetation
- props
- street furniture
- parked vehicles
- environmental lighting
- atmospheric integration

These deficiencies are important for visual quality but are no longer foundational generation-capability blockers.

---

# 2. Phase objective

The objective of this phase is:

> **Raise Generated First Light to a level where remaining differences from Authored First Light are primarily intentional art-direction choices rather than missing generation capability.**

This is a fidelity phase, not a generator-foundation rewrite.

All additions should extend the existing Step 1–5 system and preserve its reusable, deterministic, data-driven architecture.

---

# 3. Execution order

Work should proceed in the following order.

## Stage A — Final controlled-integration verification

Before substantial fidelity implementation begins:

1. Re-run strict TypeScript on the latest integration candidate.
2. Re-run the complete Vitest suite.
3. Re-run production build.
4. Re-run Rapier lifecycle tests.
5. Confirm generated building disposal returns rigid-body and collider counts to baseline.
6. Confirm no regression has entered authored First Light.
7. Confirm Vercel intentional-deployment guard remains restored after validation.
8. Record any remaining repository-wide lint debt separately from generator acceptance.

### Acceptance

This stage is complete when the current Step 1–5 chain remains reproducibly type-safe, tested, buildable, and physically stable.

---

# 4. Stage B — Facade material richness

## 4.1 Goal

Move generated buildings away from clean procedural surfaces and toward grounded cinematic stylization.

The material system must remain shared and reusable.

Do **not** create a unique bespoke material implementation for every building.

## 4.2 Material families

Expand or refine reusable families for:

- warm brick
- dark/red brick
- pale brick
- painted block
- garage block
- weathered concrete
- clean institutional concrete
- plaster/stucco
- industrial metal
- storefront metal
- clear/dark/tinted glass
- roof membranes
- parapet surfaces

## 4.3 Deterministic material variation

Variation should be deterministic from building seed and semantic feature key.

Candidate variation channels:

- hue/tint offset
- value variation
- roughness
- UV offset
- UV scale within safe authored bounds
- grime intensity
- lower-wall dirt
- rain streaks
- patching
- paint fading
- surface repair
- decal selection
- roof discoloration

No uncontrolled `Math.random()` should be introduced.

## 4.4 Ground-contact treatment

Generated buildings should visually meet the street.

Add reusable treatment for:

- darker foundation strip
- moisture/grime near ground level
- threshold material changes
- garage apron transitions
- storefront base trim
- service-edge wear

### Acceptance

- Same archetype buildings no longer appear cloned.
- Material variation remains coherent within South Ward.
- Buildings remain visually readable at gameplay distance.
- Material cost does not scale linearly with building count.

---

# 5. Stage C — Secondary architectural detail

## 5.1 Goal

Add the architectural detail that makes generated buildings look occupied and intentional without abandoning reusable generation.

## 5.2 Reusable facade-detail catalog

Expand reusable templates for:

- awnings
- vents
- louvers
- air-conditioning units
- utility boxes
- downpipes
- drainpipes
- shutters
- trim
- cornice strips
- parapet caps
- roof vents
- rooftop HVAC
- service conduits
- wall-mounted lights
- signage mounts
- address plates
- stains
- patching
- graffiti/decal hooks

## 5.3 Detail placement rules

Details should be placed using semantic constraints.

Examples:

- AC units should prefer upper floors or service facades.
- utility boxes should prefer service/rear ground level.
- awnings should prefer commercial/storefront openings.
- signage mounts should align with commercial frontage.
- roof equipment should respect roof form.
- drainpipes should follow facade edges or roof drainage logic.

## 5.4 LOD policy

Secondary detail must obey representation tier.

Near:
- real geometry for strong depth cues

Medium:
- reduced detail count or shallow geometry

Far:
- baked/material implication only

Skyline:
- omit except silhouette-critical equipment

### Acceptance

- Generated buildings remain coherent rather than noisy.
- Detail density supports building archetype.
- Important close-range buildings gain depth.
- Distant buildings remain cheap.

---

# 6. Stage D — Windows and storefront treatment

## 6.1 Goal

Windows and storefronts should become one of the strongest perceptual fidelity systems.

## 6.2 Window tiers

Retain and improve the four representation intents:

1. decorative
2. recessed
3. physical glazed
4. interior-linked

Near important buildings should use true recess/parallax where useful.

Supporting buildings should use the cheapest convincing representation.

## 6.3 Window variation

Deterministic variation may include:

- glass tint
- darkness
- reflection intensity
- blind/curtain implication
- frame color
- mullion pattern
- dirt
- occasional opaque/covered window

Avoid random visual noise that destroys facade rhythm.

## 6.4 Storefront system

Storefront generation should support:

- larger glazing
- structural mullions
- entrance integration
- fascia/sign band
- shallow interior darkness
- canopy/awning hooks
- threshold
- side/service distinction

Storefronts should remain archetype-aware and road-frontage-aware.

### Acceptance

- Windows do not read as repeated stickers.
- Storefronts clearly communicate commercial function.
- Physical windows retain correct camera/collision semantics.
- Close oblique inspection does not reveal major representation collapse.

---

# 7. Stage E — Street-level grounding

## 7.1 Goal

Generated buildings must connect convincingly to generated streets.

The city should no longer read as architecture placed on a generic plane.

## 7.2 Road mesh generation

Convert semantic road plans into finished Babylon road geometry.

Road generation should account for:

- segment width
- road hierarchy
- junction ownership
- lane count
- intersection shape
- surface material
- road-edge transitions

## 7.3 Junction rule

Preserve the established rule:

> **Asphalt owns the junction.**

Curbs and sidewalks must terminate around active asphalt.

They must never visually or physically cross active road connections.

Support:

- straight continuation
- T-junction
- four-way junction

## 7.4 Sidewalk and curb generation

Generate:

- sidewalk surfaces
- curb faces
- curb tops
- cutbacks at intersections
- driveway/garage transitions
- pedestrian openings where required

## 7.5 Road markings

Add data-driven marking support for:

- center lines
- lane lines
- edge lines where applicable
- crosswalks
- stop lines
- parking marks where appropriate

## 7.6 Surface details

Add controlled detail for:

- drainage
- patches
- cracks
- stains
- utility covers
- road repairs
- curb wear

These should use material/decal systems where possible rather than excessive geometry.

## 7.7 Building-street transitions

Verify:

- storefront doors meet sidewalk elevation
- garage doors meet apron/road geometry
- service doors do not open into impossible spaces
- thresholds are not floating
- lots align correctly with frontage

### Acceptance

- Roads read immediately as connected streets.
- T-junctions are visually correct.
- Curbs do not cross asphalt.
- Buildings appear grounded rather than placed.

---

# 8. Stage F — Contextual props and vegetation

## 8.1 Goal

Restore urban life and visual context using structured placement.

Do not return to arbitrary hand-scattering as the primary method.

## 8.2 Vegetation

Reintroduce vegetation through:

- neighborhood rules
- block rules
- public-space specs
- deterministic placement specs

For current accepted tree representation:

- segmented textured trunk/root flare
- layered foliage cards
- no explicit branch cylinders
- broader umbrella-like canopy
- immediate tree readability

Near/mid/far tree representations should remain scalable.

## 8.3 Street furniture

Add reusable templates for:

- streetlights
- bins
- benches
- bollards
- utility cabinets
- poles
- signs
- hydrant-style infrastructure where appropriate
- barriers where semantically justified

## 8.4 Parked vehicles

Parked vehicles should use structured placement rules.

Placement constraints should include:

- road edge
- orientation
- junction clearance
- driveway clearance
- garage clearance
- collision registration

## 8.5 Occupational/context props

Use props to reinforce building function.

Examples:

Garage/workshop:
- bins
- tires
- tool/storage silhouettes
- service clutter

Commercial:
- signage
- awnings
- display/entrance emphasis

Industrial:
- loading context
- pallets/crates
- service equipment

Residential:
- restrained domestic context
- bins
- entrances
- balcony detail where supported

### Acceptance

- Props reinforce place identity.
- Vegetation returns without breaking the accepted tree doctrine.
- Placement is deterministic and semantically plausible.
- Prop density does not overwhelm browser performance.

---

# 9. Stage G — Neighborhood composition refinement

## 9.1 Goal

Preserve First Light identity while increasing visual richness.

The current ten-building reference set remains authoritative for the parity exercise.

## 9.2 Preserve stable world identity

Do not casually change:

- building IDs
- block IDs
- lot IDs
- road IDs
- building coordinates
- major dimensions
- skyline roles
- semantic frontage
- primary entrance meaning

Any deliberate change should be documented.

## 9.3 Controlled divergence

Generated First Light does not need to become pixel-identical to Authored First Light.

Differences are acceptable when they are:

- intentional
- visually better
- architecturally coherent
- compatible with South Ward identity
- deterministic
- documented

Unexplained drift is not acceptable.

### Acceptance

- The generated neighborhood is recognizably the same First Light composition.
- Added richness does not break deterministic identity.
- Architectural differences read as art direction, not generator instability.

---

# 10. Stage H — Second First Light comparison gate

## 10.1 Comparison method

Use the live comparison interface.

Do not rely on screenshots alone for acceptance.

The screenshot may be used as documentation, but the primary review should use the actual interactive interface.

## 10.2 Review categories

Review separately:

### Building fidelity
- position
- footprint
- height
- massing
- facade rhythm
- windows
- storefronts
- roofs
- materials
- secondary details

### Environmental fidelity
- roads
- junctions
- sidewalks
- curbs
- road markings
- drainage
- ground transitions
- vegetation
- props
- streetlights
- parked vehicles

### Runtime fidelity
- collision
- camera blockers
- physical windows
- entrances
- interior access
- interaction anchors
- disposal
- streaming readiness

## 10.3 Review principle

The target is not numerical pixel similarity.

The target is:

> **Remaining differences are primarily intentional art-direction choices, not missing generation capability.**

### Acceptance

The Generated First Light environment should be visually credible in:

- normal walking view
- driving-scale view
- continuous walkthrough
- close oblique facade inspection

No major representation collapse should occur.

---

# 11. Stage I — Controlled promotion to main

Promotion should happen only after:

- TypeScript passes
- tests pass
- production build passes
- Rapier lifecycle remains stable
- First Light comparison is accepted
- no authored-runtime regression is found

## 11.1 Integration strategy

Preserve the authored implementation until generated parity is accepted.

Do not delete working authored code simply because generated equivalents now exist.

Migration should be incremental:

1. promote generation infrastructure
2. preserve authored scene
3. use generated path behind controlled route/flag
4. replace individual bespoke systems only after parity
5. remove redundant authored code only when no longer needed

## 11.2 Deployment discipline

Deployment remains intentional.

Do not re-enable automatic commit-trigger deployment.

Use the existing Vercel ignore-build guard discipline.

---

# 12. Stage J — Complete FL-2

This fidelity phase closes the remaining FL-2 representation-generation work.

FL-2 should be considered complete when:

- structural generation is proven
- generated buildings are visually credible
- roads and urban grounding are generation-driven
- environmental detail is sufficiently restored
- no major representation collapse occurs
- generated First Light is accepted against the authored reference

The project should **not** expand into another district merely to demonstrate scale before this acceptance.

First Light remains the regression laboratory.

---

# 13. Transition to FL-3

After Generated First Light fidelity is accepted, the project transitions to FL-3.

At that point:

> **`documentations/Meridia First Light Implementation Plan.md` FL-3 becomes the next governing source of truth.**

The emphasis changes from city reconstruction to interaction and atmosphere.

Expected FL-3 areas include:

- day/night foundation
- sky treatment
- environmental lighting
- localized streetlamp illumination
- stronger atmospheric treatment
- interaction refinement
- physical/gameplay-space credibility
- continued camera behavior refinement where necessary
- player/environment interaction quality

Streetlights should provide localized yellow-to-white illumination at night.

Weather remains later unless FL-3 explicitly advances it.

---

# 14. Non-goals for this phase

Do not:

- rebuild the Step 1–5 architecture from scratch
- re-prove already accepted building massing
- generate a new full district prematurely
- add uncontrolled random visual variation
- create unique rendering code for every building
- use expensive geometry where material/detail representation is sufficient
- replace semantic IDs with mesh-name dependencies
- tie camera blockers to visual LOD
- compromise collision stability for visual detail
- introduce automatic deployment
- remove authored First Light before generated parity is accepted

---

# 15. Performance discipline

Every fidelity addition must consider browser cost.

Prefer:

- shared materials
- atlases where appropriate
- deterministic material variants
- instancing/thin instances when supported
- merged geometry where appropriate
- LOD
- impostors/cards for distant detail
- simple collision
- semantic camera blockers
- block lifecycle ownership
- controlled prop density

Performance should be evaluated using realistic First Light scene composition, not isolated microbenchmarks only.

---

# 16. Regression requirements

The following existing behaviors must remain protected:

- current Voight movement
- current camera obstruction behavior
- vehicle static collision
- garage physical rear windows
- garage interior readability
- vertical look range
- current tree branch removal
- road-junction curb correctness
- First Light scene bootability
- deterministic building generation
- stable world IDs
- Rapier collider reclamation

---

# 17. Definition of success

This plan is complete when all of the following are true:

1. Generated First Light retains the accepted structural building parity.
2. Generated facades have materially richer surface identity.
3. Weathering and deterministic variation reduce cloning.
4. Windows and storefronts support convincing close-range inspection.
5. Secondary architectural detail is reusable and archetype-aware.
6. Roads are generated as finished visual geometry.
7. Curbs and sidewalks correctly respect road junctions.
8. Street-level transitions visually ground buildings.
9. Vegetation and contextual props are restored through structured data.
10. Physical semantics remain correct.
11. Rapier lifecycle remains leak-free under repeated generation/disposal tests.
12. Performance remains suitable for the browser target.
13. Generated First Light passes live comparison review.
14. Remaining discrepancies are primarily intentional art-direction choices.
15. The verified generation chain is promoted to `main` in a controlled manner.
16. FL-2 is formally closed.
17. FL-3 becomes the governing next phase.

---

# Final governing sequence

```text
VERIFY CURRENT STEP 1–5 CHAIN
        ↓
RICHER MATERIALS + WEATHERING
        ↓
SECONDARY ARCHITECTURAL DETAIL
        ↓
WINDOW + STOREFRONT FIDELITY
        ↓
ROAD + SIDEWALK + CURB + STREET GROUNDING
        ↓
VEGETATION + PROPS + STREET CONTEXT
        ↓
NEIGHBORHOOD COMPOSITION REFINEMENT
        ↓
LIVE FIRST LIGHT PARITY REVIEW
        ↓
CONTROLLED PROMOTION TO MAIN
        ↓
CLOSE FL-2
        ↓
FL-3 BECOMES SOURCE OF TRUTH
```

No implementation work should begin from this document until explicit greenlight is given.
