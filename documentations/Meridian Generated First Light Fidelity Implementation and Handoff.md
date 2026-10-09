# Meridian Generated First Light Fidelity Implementation and Handoff

Status: REVIEW CANDIDATE — LIVE VISUAL ACCEPTANCE REQUIRED  
Date: 2026-10-09  
Branch: `development/meridian-first-light-fidelity`  
Verified implementation commit: `822e4efcee80b89cde90b196339c93d7c1330550`

## Scope

This handoff records implementation of the approved `Meridian Generated First Light Fidelity and FL-3 Transition Plan.md` through the second First Light comparison gate.

The purpose of this phase was not to re-prove structural generation. The Step 1–5 chain had already established stable building identity, deterministic generation, architecture planning, representation, physical semantics, road topology, and streaming foundations.

This phase addressed the broader fidelity layer required to make Generated First Light read as a credible neighborhood rather than an architectural reconstruction.

## Implemented systems

### 1. Deterministic procedural surface textures

Added `src/game/world-generation/surface-textures.ts`.

Uses Babylon `RawTexture` so the same system can run in browser and NullEngine verification.

Supported texture classes include:
- brick
- block
- concrete
- plaster
- metal
- glass
- asphalt
- paving
- roof membrane

Variation is derived deterministically from stable recipe keys.

Supported controlled variation includes:
- tint
- weathering
- grime
- patching
- UV offset
- surface-scale policy

### 2. Richer shared material families

Expanded `representation-materials.ts` and `material-library.ts`.

Added/expanded families include:
- warm brick
- dark brick
- pale brick
- painted block
- garage block
- weathered concrete
- institutional concrete
- plaster
- industrial metal
- storefront metal
- storefront glass
- clear glass
- roof membrane
- asphalt
- sidewalk paving

Materials remain scene-scoped and shared. Textures are cached by deterministic recipe instead of authored uniquely per building.

### 3. Secondary facade grammar

Expanded `facade-details.ts`.

Reusable detail vocabulary now includes:
- sill
- lintel
- mullion
- shutter
- awning
- vent
- AC unit
- utility box
- downpipe
- cornice
- sign band
- wall light
- foundation band

Detail placement remains deterministic, archetype-aware, and LOD-aware.

### 4. Window and storefront treatment

Generated windows/storefronts now receive stronger perceptual structure through:
- sills
- lintels
- mullions
- occasional shutters
- deterministic AC placement
- storefront mullions
- sign bands
- awnings where applicable
- improved glass material families

Physical-window and interaction semantics remain separate from decorative representation.

### 5. Generated road, sidewalk, curb, and marking geometry

Added `urban-surface-renderer.ts`.

It consumes the semantic road graph and generates:
- asphalt surfaces
- junction asphalt
- sidewalks
- longitudinal curbs
- junction curb arcs
- junction sidewalk strips
- center dashes
- stop lines

The existing rule remains authoritative:

> **Asphalt owns the junction.**

Curbs and sidewalks terminate around active road mouths rather than crossing them.

### 6. Structured street context

Added `street-context.ts` and `street-context-renderer.ts`.

Generated street context includes:
- vegetation
- streetlights
- parked vehicle proxies
- benches
- bins
- pocket-green surface

The planner derives context from explicit block data and semantic road geometry.

### 7. Vegetation doctrine preserved

Generated trees follow the accepted First Light representation:
- textured/colored segmented trunk
- root flares
- broad layered foliage cards
- no explicit branch cylinders

The removed falling-stick branch approach was not reintroduced.

### 8. First Light structured context data

`first-light-spec.ts` now contains structured placements for key reference context including:
- garage-side tree
- pocket-green trees
- garage streetlight
- pocket-green streetlight
- two parked vehicles
- bench
- bin

Additional road-derived streetlights and parked vehicles are deterministic rather than arbitrary runtime scatter.

### 9. Comparison route upgraded

The generated half of `/first-light-comparison` now includes:
- generated buildings
- procedural surface materials
- secondary facade details
- generated road surfaces
- generated sidewalks
- generated curbs
- markings
- pocket green
- trees
- streetlights
- parked vehicles
- bench/bin context
- Rapier building collision

The comparison UI additionally reports urban mesh and context-item counts.

## Verification

Controlled Vercel verification:

- Deployment: `dpl_FxyZMkpJVm7VLt6Xn6wGBEQhvjiN`
- URL: `https://gtd-e1l5djxss-interlinkglobaltech.vercel.app/first-light-comparison`
- Deployment state: READY
- Source branch: `development/meridian-first-light-fidelity`
- Source commit: `822e4efcee80b89cde90b196339c93d7c1330550`

Verification command:

```text
npx tsc --noEmit && npm test && npm run build
```

Verified:
- strict TypeScript passed
- architecture-generation tests passed
- building-interaction tests passed
- city-generation tests passed
- representation-generation tests passed
- urban-generation tests passed
- block-streaming/Rapier lifecycle tests passed
- 50-cycle generated collider/body reclamation test passed
- production build passed
- Nitro/Vercel output generated successfully
- deployment reached READY

The Vercel intentional-deploy guard was restored to `exit 0` immediately after the verification deployment was created.

## Targeted lint verification

A targeted substantive ESLint run was executed against the generated-world modules, comparison runtime/route, and generation tests with the repository's historical Prettier rule disabled for this gate.

The ESLint command completed without reporting a lint violation. The Vercel validation deployment then failed only because a lint-only command does not create the project's expected `dist` output. That terminal Vercel error is therefore not an ESLint failure.

- Lint validation deployment: `dpl_6CSL4Jk95sU3wKaMSVe42QcWAg2s`
- ESLint findings: none reported
- Terminal deployment result: expected `STATIC_BUILD_NO_OUT_DIR` after successful lint command

Repository-wide historical formatting debt remains separate from this fidelity candidate.

## New/expanded regression coverage

The fidelity tests now cover:
- richer material recipes
- surface texture policy
- facade detail catalog expansion
- foundation-band generation
- deterministic road markings
- deterministic street-context generation
- stable unique context IDs
- expected vegetation/light/vehicle/prop categories
- NullEngine generation of road/context geometry
- complete road/context disposal

Existing Rapier and architecture tests remain in place.

## Review scope

The current candidate is intended for live-interface comparison against authored First Light.

Review should focus on:

### Buildings
- retained placement/massing parity
- material richness
- facade variation
- window treatment
- storefront identity
- secondary detail
- street contact

### Urban environment
- road readability
- correct T-junction ownership
- curb termination
- sidewalk continuity
- road markings
- pocket-green readability
- vegetation
- street furniture
- parked-vehicle context

### Runtime
- no visible representation collapse
- stable generated scene bootstrap
- no authored-side regression
- acceptable browser performance

The review should be performed in the actual interface. Screenshots are documentation only, not the primary acceptance method.

## Known remaining refinement areas

This candidate does not claim completion of every visual system.

Potential later refinement remains for:
- richer signage content
- drainage and utility covers
- more sophisticated crack/repair decals
- additional occupational props
- more varied vehicle art
- final high-quality streetlight treatment
- night illumination
- sky/day-night atmosphere
- deeper environmental lighting

Night lighting, sky, day/night progression, and atmospheric behavior belong primarily to FL-3 after this generated-fidelity gate is accepted.

## Promotion rule

Do **not** merge this candidate into `main` solely because automated verification passes.

Promotion requires:
1. live First Light visual review
2. user acceptance of generated fidelity
3. confirmation that remaining discrepancies are intentional or acceptable
4. controlled integration into `main`

The authored First Light remains the regression oracle until generated parity is accepted.

## Next state after acceptance

After live acceptance:
1. integrate the verified generation/fidelity chain to `main`
2. preserve authored First Light until redundant code can be safely retired
3. record FL-2 as complete
4. make FL-3 in `Meridia First Light Implementation Plan.md` the governing next source of truth

> **The generator removes repetition. It does not remove authorship.**
