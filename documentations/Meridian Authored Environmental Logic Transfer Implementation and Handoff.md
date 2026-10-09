# Meridian Authored Environmental Logic Transfer Implementation and Handoff

Status: REVIEW CANDIDATE — LIVE VISUAL ACCEPTANCE REQUIRED  
Date: 2026-10-09  
Branch: `development/meridian-first-light-fidelity`  
Verified implementation commit: `99e2533421740183dae282ec7450301bdd69f700`

## Purpose

This handoff records implementation of the approved `Meridian Authored Environmental Logic Transfer and FL-2 Closure Plan.md` through the live comparison gate.

The implementation intentionally preserves the Generated First Light architectural gains while transferring the strongest environmental principles from Authored First Light into reusable deterministic systems.

## Preserved generated-side wins

The following were intentionally not redesigned:
- stable building coordinates and IDs
- building footprint/massing
- skyline hierarchy
- facade grammar
- roof treatment
- window rhythm
- material-family architecture
- building collision
- semantic interaction anchors
- deterministic building generation

## Road and curb transfer

### Orthogonal junction planning

`road-graph.ts` no longer plans ordinary T/four-way junctions as circular asphalt discs with radial curb arcs.

Generated junctions now expose:
- four-corner rectilinear asphalt ownership
- explicit road mouths
- straight curb segments split around those mouths
- rectilinear sidewalk corner patches
- `cornerTreatment: "orthogonal"`
- deterministic half-extent metadata

The First Light 8 m roads resolve to an approximately 11.6 m authored-style junction ownership box.

### Asphalt ownership

The established invariant remains:

> **Asphalt owns the junction.**

Curbs and sidewalks do not cap or cross active road mouths.

### Road markings

Center dashes remain data-driven.

Stop lines at T-junctions are restricted to the terminating stem road rather than being generated indiscriminately on through roads.

### Garage curb cut

The South Ward garage now produces a semantic curb cut from its `garage-entrance` anchor and facade opening.

The curb is split around the vehicle opening and a shallow transition replaces the full-height curb through the access zone.

### Street-level naturalism

The generated road representation now includes restrained:
- gutter-edge darkening
- drainage grates
- asphalt repair patches

These are deliberately low-cost grounding cues rather than a dense decal system.

## Vegetation transfer

### Tree representation

Generated trees now follow the successful Authored First Light principles:
- segmented lower trunk
- tapered upper trunk
- root flares
- ten foliage cluster positions
- three crossed foliage cards per cluster
- broad horizontal crown
- deterministic cluster jitter/scale/rotation
- trunk visually enters the crown
- no explicit branch cylinders

### Pocket-green composition

The pocket green now includes:
- broader deterministic tree canopy scaling
- irregular grass perimeter rather than a perfect rectangle
- procedural grass tonal variation
- deterministic grass variation patches
- four low shrub clusters
- retained bench/bin context
- deterministic placement

### Placement vs rendering

Placement remains data/semantic driven in `street-context.ts`.

Rendering remains independent in `street-context-renderer.ts`.

This preserves future scalability and tuning.

## Regression coverage

`urban-generation.test.ts` now verifies:
- First Light contains five road segments and two T-junctions
- First Light junctions are orthogonal and four-cornered
- each T-junction has three road mouths
- curb segments are straight two-point segments
- active road mouth remains uncapped
- a synthetic four-way intersection is orthogonal rather than radial
- stop lines occur only on the First Light T-stem road
- garage curb cut exists on the assigned frontage road
- garage cut width is derived from the physical opening
- street context remains deterministic
- pocket-green shrubs are present
- pocket-green trees use broadened canopy scaling
- generated road/context meshes render under Babylon NullEngine
- generated curb-cut and drainage meshes exist
- disposal returns Babylon scene mesh ownership to baseline

Existing architecture, interaction, representation, routing, and Rapier lifecycle tests remain active.

## Verification

Controlled Vercel verification:
- deployment: `dpl_CSfcpJvM1GhXY5nJBcAqmobUz3tE`
- preview: `https://gtd-o0hijyby3-interlinkglobaltech.vercel.app/first-light-comparison`
- source commit: `99e2533421740183dae282ec7450301bdd69f700`
- state: READY

Verification command:

```text
npx tsc --noEmit && npm test && npm run build
```

Results:
- strict TypeScript passed
- 8 Vitest files passed
- 54 tests passed
- Babylon 9.29 NullEngine generation/disposal tests passed
- Rapier 0.21 interaction/lifecycle tests passed
- 50-cycle collider/body reclamation stress test passed
- production Vite/Nitro build passed
- Vercel deployment reached READY
- intentional deployment guard restored to `exit 0`

## Targeted lint verification

A targeted substantive ESLint run was executed against the world-generation modules and `urban-generation.test.ts` with the repository's historical Prettier rule disabled for this gate.

- deployment: `dpl_GHPvY7U6BfY6SQedzWiDHAUngM26`
- source commit: `99e2533421740183dae282ec7450301bdd69f700`
- ESLint findings: none reported
- terminal Vercel state: expected `STATIC_BUILD_NO_OUT_DIR`

The Vercel terminal error is not a lint failure: the lint-only build command completed without emitting ESLint diagnostics, then Vercel rejected the deployment because a lint command intentionally produces no `dist` output.

Repository-wide historical formatting debt remains separate from this candidate.

## Review focus

The next action is live review of the comparison interface.

Inspect:
- disappearance of circular/fan junction artifacts
- curb termination around both First Light T-junctions
- sidewalk corner behavior
- garage curb cut
- broader/overlapping tree crowns
- pocket-green naturalism
- road wear/drainage cues
- preservation of current generated building quality

The actual interface is the acceptance surface; screenshots are supporting documentation only.

## Promotion rule

Do not promote this branch to `main` solely because automated verification is green.

Promotion requires explicit live visual acceptance.

After acceptance:
1. rerun final TypeScript/tests/build/lifecycle/lint gates;
2. controlled-promote the complete generated chain;
3. preserve Authored First Light temporarily as regression reference;
4. formally close FL-2;
5. make FL-3 in `Meridia First Light Implementation Plan.md` the governing source of truth.

> **Keep what Generated First Light already does better. Extract what Authored First Light still does better. Convert those authored strengths into reusable deterministic systems.**
