# Meridian Authored Environmental Logic Transfer and FL-2 Closure Plan

Status: APPROVED TECHNICAL PLAN — IMPLEMENTATION PENDING GREENLIGHT  
Date: 2026-10-09  
Project: GTD — Grand Theft Division  
Repository: `interlinkglobal/GTD`

## Purpose

This document defines the next technical phase after the second Generated First Light comparison.

The current Generated First Light has already demonstrated that the difficult architectural problem is substantially solved:

- building placement is preserved;
- building massing is preserved;
- height hierarchy is preserved;
- facade grammar is substantially stronger;
- roof treatment is stronger;
- generated material identity is stronger;
- building archetype and role remain coherent;
- generated buildings are integrated with the Step 1–5 semantic and physical pipeline.

The remaining fidelity gap is now concentrated primarily in **environmental logic**, especially:

- road junction geometry;
- curb termination;
- sidewalk treatment;
- vegetation composition;
- pocket-green composition;
- street-level naturalism.

The authored First Light scene currently handles these areas more naturally than the generated version.

The correct technical response is **not** to copy the authored scene wholesale.

The correct response is to extract the authored environmental principles that are visibly successful, formalize them as reusable deterministic generation rules, and preserve the architectural improvements already achieved by Generated First Light.

The governing sequence is:

```text
PRESERVE GENERATED BUILDING WINS
        ↓
EXTRACT AUTHORED ROAD/CURB LOGIC
        ↓
REBUILD GENERATED JUNCTIONS
        ↓
EXTRACT AUTHORED VEGETATION LOGIC
        ↓
IMPROVE TREE + POCKET-GREEN COMPOSITION
        ↓
IMPROVE STREET-LEVEL NATURALISM
        ↓
LIVE FIRST LIGHT COMPARISON
        ↓
CONTROLLED PROMOTION
        ↓
CLOSE FL-2
        ↓
BEGIN FL-3
```

---

# 1. Current accepted baseline

## 1.1 Generated architectural systems are accepted as the stronger reference

The generated side now performs better than the authored side in several architectural areas.

These should be treated as **frozen unless a regression appears**:

- building coordinates;
- building footprint and placement;
- massing logic;
- height hierarchy;
- skyline role;
- facade bay logic;
- window rhythm;
- roof treatment;
- shared material-family architecture;
- deterministic facade variation;
- semantic building types;
- physical building semantics;
- Rapier collision generation;
- stable building IDs and anchors.

The authored scene should **not** be used as a target where it is visually weaker.

## 1.2 Authored First Light remains the environmental regression oracle

The authored scene remains the stronger reference for:

- road junction shape;
- curb continuity and termination;
- sidewalk behavior at junctions;
- visual softness of vegetation;
- canopy overlap;
- pocket-green composition;
- street-edge naturalism.

The purpose of the next pass is to extract these strengths into the generated pipeline.

## 1.3 Current generated defects to remove

The second comparison revealed visible procedural artifacts:

- circular or fan-like junction caps;
- radial curb geometry;
- fan-shaped sidewalk geometry;
- junctions that read as miniature roundabouts rather than normal urban intersections;
- vegetation that appears sparse and countable;
- canopies that are too isolated;
- green-space edges that are too clean and rectangular;
- street-context objects that can appear individually placed rather than environmentally integrated;
- generated ground surfaces that still read too uniformly clean.

These should be treated as the primary FL-2 closing defects.

---

# 2. Phase objective

The objective of this phase is:

> **Transfer the successful environmental logic from Authored First Light into reusable Generated First Light systems without regressing the generated architectural gains.**

The success condition is not screenshot similarity.

The success condition is:

> **Generated First Light should no longer expose obvious procedural artifacts in road flow, curb behavior, vegetation composition, or street-level grounding.**

---

# 3. Stage A — Freeze current generated architectural output

Before modifying environmental systems:

1. Preserve current building coordinates.
2. Preserve current building dimensions.
3. Preserve current building archetypes.
4. Preserve current skyline hierarchy.
5. Preserve current facade grammar.
6. Preserve current roof system.
7. Preserve current window/storefront generation unless required by a direct regression.
8. Preserve current material infrastructure.
9. Preserve current building collision and semantic interaction contracts.

Do not use this pass as an opportunity to redesign the buildings.

### Acceptance

The generated buildings should look materially the same before and after this environmental pass except where street contact requires a minor threshold or ground transition change.

---

# 4. Stage B — Extract authored road and curb logic

## 4.1 Goal

Identify the specific geometric behavior in Authored First Light that makes its roads read naturally.

The authored implementation should be inspected as a behavioral reference.

Do not simply copy meshes.

Extract the rules.

## 4.2 Required authored behaviors to formalize

Document and encode:

- road centerline relationship;
- carriageway width;
- asphalt ownership;
- junction mouth width;
- curb cutback distance;
- sidewalk cutback distance;
- corner transition style;
- T-junction mouth handling;
- four-way junction handling;
- road-edge continuity;
- driveway curb interruption;
- garage apron connection.

## 4.3 Governing invariant

Preserve:

> **Asphalt owns the junction.**

This means:

- active road surface occupies the full connected junction;
- curbs stop before crossing an active carriageway;
- sidewalks stop or turn around the junction;
- no curb or sidewalk mesh crosses the asphalt mouth;
- no visible radial junction cap is generated unless the authored road type is actually a roundabout.

---

# 5. Stage C — Replace radial/fan junction generation

## 5.1 Goal

Remove the current generated visual language that exposes the generator.

The existing circular/fan treatment must be retired for ordinary junctions.

## 5.2 T-junction generation

A T-junction should be generated from:

- the continuing road;
- the terminating road mouth;
- rectangular/offset asphalt union;
- curb cutbacks on both sides of the incoming road;
- sidewalk continuation around the outer edges;
- conventional corner turns.

The resulting junction should read as a normal street connection, not as a circular node.

## 5.3 Four-way intersection generation

A four-way intersection should produce:

- continuous asphalt across the full junction;
- four clean road mouths;
- curb corners outside the asphalt;
- sidewalk corner surfaces;
- optional corner radius where visually justified.

## 5.4 Corner treatment

Corner treatment may use:

- short bevel;
- small arc;
- segmented quarter-turn;

but should never use a large radial fan that visibly dominates the junction.

## 5.5 Eliminate visible radial construction artifacts

Remove:

- junction-circle asphalt pads;
- large radial sidewalk fans;
- spoke-like curb segmentation;
- conspicuous polygon wedges.

### Acceptance

At ordinary gameplay view, the player should interpret the junction as a normal city street connection without noticing how it was generated.

---

# 6. Stage D — Generated curb and sidewalk system

## 6.1 Curb behavior

Generated curbs must:

- run continuously along road edges;
- stop before road mouths;
- turn corners naturally;
- restart after the junction;
- respect driveway openings;
- respect garage entrances;
- remain outside active asphalt.

## 6.2 Sidewalk behavior

Generated sidewalks must:

- align with curbs;
- stop or bend around intersections;
- preserve pedestrian continuity where possible;
- avoid road overlap;
- align with storefront and building thresholds;
- align with garage aprons.

## 6.3 Driveways and garage access

Support explicit curb-cut semantics.

A driveway/garage frontage should:

- interrupt curb height;
- preserve vehicle access;
- lower/flatten sidewalk transition where appropriate;
- preserve adjacent pedestrian surface.

## 6.4 Road hierarchy compatibility

The system should remain compatible with:

- alley;
- local street;
- collector;
- arterial;
- boulevard;
- future highway interface.

The First Light implementation only needs to validate the currently used classes.

---

# 7. Stage E — Road regression test suite

Add dedicated tests for environmental geometry.

## 7.1 Required road cases

Test:

1. straight road segment;
2. T-junction;
3. four-way intersection;
4. driveway curb cut;
5. garage curb cut;
6. First Light north/rear T-junctions.

## 7.2 Assertions

Tests should verify:

- asphalt polygons remain valid;
- sidewalk polygons remain valid;
- curbs do not cross active road mouths;
- sidewalks do not occupy carriageway;
- junction geometry is deterministic;
- no ordinary junction produces a radial/roundabout-style cap;
- curb cutbacks are non-negative and bounded;
- generated surfaces dispose cleanly.

## 7.3 Visual-regression helper metadata

Expose useful geometry metadata for inspection:

- junction type;
- connected road IDs;
- road-mouth bounds;
- curb endpoints;
- sidewalk endpoints;
- corner treatment.

This will make later debugging easier than inspecting mesh names alone.

---

# 8. Stage F — Extract authored vegetation logic

## 8.1 Goal

The authored vegetation currently reads more naturally despite being technically simpler.

The next system should capture the visual principles that make it work.

## 8.2 Preserve accepted tree doctrine

Generated trees must continue to use:

- segmented trunk;
- root flare;
- layered foliage cards;
- no explicit branch cylinders.

Do not reintroduce the removed falling-stick branch representation.

## 8.3 Extract authored visual principles

Formalize:

- canopy width;
- canopy-to-trunk proportion;
- foliage overlap;
- crown density;
- asymmetry;
- tree spacing;
- cluster spacing;
- edge relationship to road/sidewalk;
- relationship to green-space footprint.

## 8.4 Separate placement from rendering

Vegetation placement should answer:

- where trees belong;
- how many;
- how far apart;
- relationship to public space;
- relationship to road edge;
- relationship to buildings;
- pedestrian clearance.

Vegetation rendering should answer:

- trunk shape;
- root flare;
- canopy width;
- foliage-card count;
- foliage-card orientation;
- LOD.

These systems must remain independently tunable.

---

# 9. Stage G — Improve canopy generation

## 9.1 Goal

Remove the current isolated/lollipop-like appearance.

## 9.2 Canopy changes

Increase:

- horizontal crown width;
- card overlap;
- canopy irregularity;
- lateral spread.

Reduce:

- visible separation between foliage clusters;
- excessive vertical stacking;
- repeated symmetrical shapes.

## 9.3 Deterministic asymmetry

Use seed-derived variation for:

- canopy lateral offset;
- crown scale;
- crown rotation;
- vertical offset;
- foliage density.

The same tree seed must reproduce the same tree.

## 9.4 Trunk-to-canopy transition

The trunk should visually disappear into the foliage mass.

Avoid a visible gap between trunk top and crown.

### Acceptance

At medium and near distance, trees should read as one coherent organic form rather than a trunk plus countable cards.

---

# 10. Stage H — Pocket-green composition

## 10.1 Goal

Make the pocket green read as an established urban green space rather than a rectangular grass plane with several placed trees.

## 10.2 Placement rules

Use:

- clustered tree placement;
- overlapping crowns;
- non-grid spacing;
- controlled asymmetry;
- pedestrian clearance;
- road-edge clearance.

## 10.3 Ground treatment

Improve:

- grass color variation;
- subtle edge irregularity;
- worn edge near sidewalk;
- minor darker/lighter zones;
- restrained ground detail.

Avoid:

- perfect rectangular visual edges;
- obvious random noise;
- excessive prop density.

## 10.4 Supporting vegetation

Optionally add low-cost elements such as:

- small shrub clusters;
- low grass variation;
- small planter/edge vegetation;

only where they materially improve the read.

### Acceptance

The space should read as a small urban green area, not a procedural vegetation test bed.

---

# 11. Stage I — Street-level ground naturalism

## 11.1 Asphalt variation

Add reusable deterministic treatment for:

- repaired strips;
- patch zones;
- subtle tonal variation;
- occasional cracks;
- tire-darkened areas where appropriate.

## 11.2 Curb-edge wear

Add:

- dirt accumulation;
- tonal darkening;
- subtle wear;
- drainage staining.

## 11.3 Sidewalk variation

Add:

- panel variation;
- restrained patching;
- crack implication;
- repair zones;
- edge dirt.

## 11.4 Drainage cues

Introduce low-cost drainage representation where appropriate:

- gutter darkening;
- drain grate;
- curb inlet;
- shallow channel.

Do not over-model drainage.

## 11.5 General rule

Ground detail should reduce the “newly assembled model” appearance.

It should not become visual noise.

---

# 12. Stage J — Street furniture refinement

## 12.1 Goal

Keep contextual objects data-driven while making placement feel less isolated.

## 12.2 Required placement constraints

Streetlights, bins, benches, parked vehicles, and later props must respect:

- junction clearance;
- curb geometry;
- driveway clearance;
- garage access;
- building entrances;
- sidewalk walkability;
- public-space semantics.

## 12.3 Grouping

Where appropriate, place items in contextual relationships.

Examples:

- bench near pocket green;
- bin near bench or commercial edge;
- streetlight near curb edge but outside path;
- parked vehicles aligned with curb and road direction.

Avoid arbitrary isolated placement.

---

# 13. Stage K — Preserve current generated-side wins

During all environmental work, do not regress:

- architectural readability;
- skyline clarity;
- facade richness;
- roof treatment;
- window rhythm;
- material identity;
- building collision;
- semantic anchors;
- deterministic generation;
- stable IDs;
- Rapier lifecycle behavior;
- camera blocker semantics.

If an environmental change causes a building regression, fix the environmental system instead of weakening the building system.

---

# 14. Stage L — Second environmental comparison gate

After road and vegetation transfer is complete, run another live First Light comparison.

## 14.1 Review categories

### Architecture
- unchanged building placement;
- unchanged massing;
- facade quality preserved;
- roof quality preserved.

### Roads
- T-junction shape;
- asphalt continuity;
- road-mouth shape;
- centerline readability;
- absence of circular junction artifacts.

### Curbs
- termination;
- corner turning;
- road-mouth clearance;
- garage/driveway cuts.

### Sidewalks
- intersection behavior;
- curb alignment;
- entrance alignment;
- pedestrian continuity.

### Vegetation
- canopy width;
- canopy overlap;
- crown irregularity;
- pocket-green composition;
- trunk/canopy integration.

### Ground
- asphalt wear;
- sidewalk variation;
- curb-edge dirt;
- grass-edge naturalism;
- drainage cues.

### Context
- streetlights;
- parked vehicles;
- benches;
- bins;
- general composition.

## 14.2 Review method

The primary acceptance method is the actual live interface.

Screenshots may be used to annotate and document findings but are not the sole basis for acceptance.

---

# 15. Acceptance criteria

This phase is accepted when:

1. Generated buildings retain the current accepted gains.
2. T-junctions no longer use visible circular/fan geometry.
3. Curbs do not cross active road mouths.
4. Sidewalks do not overlap asphalt.
5. Junctions read as conventional urban intersections.
6. Driveway and garage curb cuts are correct.
7. Trees have broader, more cohesive canopies.
8. Vegetation placement no longer appears sparse or grid-like.
9. Pocket green reads as a coherent urban green space.
10. Street-level surfaces no longer appear uniformly clean.
11. Street furniture placement respects contextual constraints.
12. Generated environmental geometry remains deterministic.
13. Generated environmental resources dispose cleanly.
14. Existing TypeScript/tests/build/Rapier lifecycle remain green.
15. Remaining visual discrepancies are primarily art-direction choices rather than missing environmental-generation capability.

---

# 16. Final verification before promotion

After live acceptance:

1. Run strict TypeScript.
2. Run all Vitest suites.
3. Run road-junction regression tests.
4. Run vegetation determinism tests.
5. Run Babylon NullEngine lifecycle tests.
6. Run Rapier repeated disposal tests.
7. Run production build.
8. Run targeted substantive lint.
9. Confirm Authored First Light still boots.
10. Confirm Generated First Light comparison still boots.
11. Confirm Vercel automatic-deployment guard is restored.

---

# 17. Controlled promotion

Do not promote until visual acceptance is explicit.

After acceptance:

1. integrate the verified Step 1–5 chain;
2. integrate generated-fidelity work;
3. integrate authored environmental-logic transfer;
4. preserve authored First Light temporarily as a regression reference;
5. avoid deleting authored code until generated replacement is fully accepted;
6. update implementation documentation;
7. promote to `main` deliberately;
8. do not enable automatic deployment.

---

# 18. FL-2 closure

FL-2 may be closed only when:

- architectural generation is accepted;
- road generation is visually and topologically credible;
- curb/sidewalk behavior is accepted;
- vegetation representation and composition are accepted;
- street-level grounding is accepted;
- live comparison no longer exposes major procedural artifacts.

The completion statement should be:

> **Generated First Light reconstructs the authored environment with reusable deterministic systems while preserving or improving the visual result.**

---

# 19. Transition to FL-3

Once FL-2 is closed:

> **`documentations/Meridia First Light Implementation Plan.md` FL-3 becomes the governing next source of truth.**

FL-3 should then focus on:

- day/night foundation;
- sky treatment;
- environmental lighting;
- localized streetlight illumination;
- atmospheric treatment;
- interaction refinement;
- gameplay-space credibility;
- continued camera and physical-world refinement.

Weather remains later unless FL-3 explicitly advances it.

---

# 20. Non-goals

Do not:

- rebuild the city-generation foundation;
- change stable building identities without cause;
- rework successful building massing;
- regress generated architecture to match weaker authored buildings;
- copy authored meshes one-for-one when rules can be extracted;
- reintroduce branch cylinders;
- use roundabout-style geometry for ordinary intersections;
- hand-place the entire environment;
- add uncontrolled randomness;
- prematurely expand into a new district;
- begin FL-3 atmosphere work before this FL-2 environmental gate is accepted.

---

# Final governing rule

The next implementation should be selective, not destructive:

> **Keep what Generated First Light already does better. Extract what Authored First Light still does better. Convert those authored strengths into reusable deterministic systems.**

No implementation work should begin from this plan until explicit greenlight is given.
