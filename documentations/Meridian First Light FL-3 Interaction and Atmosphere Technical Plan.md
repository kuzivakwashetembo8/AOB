# Meridian First Light FL-3 Interaction and Atmosphere Technical Plan

Status: IMPLEMENTED — VERIFIED VISUAL REVIEW CANDIDATE; USER ACCEPTANCE PENDING
Date: 2026-10-09  
Project: GTD — Grand Theft Division  
Repository: `interlinkglobal/GTD`

## Implementation checkpoint — 2026-10-09

Implemented on `development/meridian-fl3-interaction-atmosphere`.

Verified implementation head:

`ec81e6d0a6a8cc06455cc84f3ae0a2136b8efc63`

Implemented:

- authoritative `MeridianClock` with a 48-real-minute canonical day;
- 24-real-minute FL-3 accelerated validation cycle by default;
- direct developer time editing in the game HUD;
- Dawn / Noon / Dusk / Night presets;
- Paused / 48m / 24m / 6m cycle-speed controls;
- one runtime-owned `MeridianEnvironmentController`;
- time-driven sun direction, color, and intensity;
- time-driven ambient fill;
- basic sky dome;
- horizon/fog atmospheric response;
- streetlight illumination activated by night state;
- two local garage interior lights;
- retained single shadowed directional sun;
- generated South Ward garage interior representation;
- workshop bench, drawers, cupboard, shelving, lockers, fridge, desk, monitor, chair, tire stacks, wall tool board, and ceiling light fixtures;
- Rapier fixture collision for major interior objects;
- deterministic outside / threshold / inside classification from semantic garage bounds and portal data;
- interior camera-radius adaptation;
- selective roof visibility treatment while preserving semantic camera blockers;
- direct world/environment metadata surfaced through runtime snapshots;
- lifecycle disposal for environment, lights, sky, interior geometry, and interior collision.

Verification deployment:

- deployment: `dpl_6oDCRuWRDtssn6e1tbjeDjReCrCX`
- preview: `https://gtd-3iyzrye2b-interlinkglobaltech.vercel.app/game`
- source: `ec81e6d0a6a8cc06455cc84f3ae0a2136b8efc63`
- state: READY
- strict TypeScript: passed
- Vitest: **10 files / 63 tests passed**
- targeted substantive ESLint: passed
- production Vite/Nitro build: passed
- `/game`: HTTP 200
- `/first-light-comparison`: HTTP 200
- grouped runtime errors in verification window: none
- Vercel automatic-deployment guard restored to `exit 0`

The candidate is intentionally not promoted to `main` yet. FL-3 requires live review of the exterior/interior journey, time controls, atmosphere, night lighting, camera behavior, and visual credibility before acceptance and promotion.

## Purpose

This document defines the implementation plan for **FL-3: Interaction and Atmosphere** after successful acceptance of FL-2.

FL-2 has established that Generated First Light can operate as the live playable GTD world with:

- generated building architecture;
- accepted road/curb baseline;
- accepted vegetation representation;
- structured street context;
- generated physical collision;
- working third-person navigation;
- fixed daytime directional shadows;
- stable runtime lifecycle.

FL-3 must now make the world feel believable when Voight transitions between exterior street space and an enterable hero interior.

The governing player experience is:

> **Voight approaches the South Ward garage, enters it through a physically valid opening, remains visually and mechanically stable inside, and exits back to the street without the illusion collapsing.**

Implementation was explicitly authorized on 2026-10-09. The first comprehensive FL-3 candidate is implemented and verified on the development branch; user visual/gameplay acceptance remains pending.

---

# 1. FL-3 source-of-truth objective

The parent implementation plan defines FL-3 as:

- reliable hero-building enter/exit behavior;
- basic interior visibility control and lighting;
- one coherent exterior lighting, shadow, reflection, and atmosphere treatment;
- validation of exterior-to-interior visual transition and camera behavior.

The formal FL-3 gate remains:

> **The journey from street to interior remains believable, readable, and mechanically stable.**

---

# 2. Current runtime baseline

FL-3 starts from the accepted Generated First Light live runtime on `/game`.

Current accepted baseline includes:

- Voight walking successfully around the block;
- Generated First Light selected by the runtime source switch;
- stable semantic player spawn;
- generated building collision;
- camera blockers on generated walls/roofs;
- generated ground now marked as a camera blocker;
- fixed daytime shadow baseline;
- generated roads, sidewalks, vegetation, props, and parked vehicles;
- Authored First Light retained as rollback/regression reference;
- darker authored asphalt and timber curb styles retained as reusable district-level streetscape families.

Rolling FL-2 refinements that remain relevant during FL-3:

- verify camera-ground exclusion during extreme upward look;
- verify visually continuous road-junction asphalt after removal of raised junction pads.

These remain refinements, not blockers to FL-3.

---

# 3. FL-3 implementation principle

FL-3 should not widen scope unnecessarily.

The objective is not to build:

- a full city lighting simulation;
- weather;
- final interiors for many buildings;
- a mission system;
- final NPC behavior;
- final character art;
- full traffic.

The objective is to prove one complete and believable interaction loop:

```text
STREET
  ↓
APPROACH HERO GARAGE
  ↓
ENTER
  ↓
INTERIOR VISIBILITY + LIGHTING
  ↓
CAMERA REMAINS VALID
  ↓
MOVE WITHIN INTERIOR
  ↓
EXIT
  ↓
RETURN TO EXTERIOR
```

---

# 4. Stage A — Hero garage interior contract

## 4.1 Identify the hero building

The South Ward neighborhood garage remains the hero building for FL-3.

The generated building must expose explicit interior semantics rather than relying on visual mesh names.

Required semantic data:

- building ID;
- hero-building flag;
- primary entrance anchor;
- garage entrance anchor;
- interior bounds;
- interior floor plane;
- interior ceiling plane;
- interior wall segments;
- exterior-to-interior portal;
- interior-to-exterior portal;
- camera-blocker surfaces;
- collision surfaces;
- visibility group membership.

## 4.2 Interior mode

Use the existing generated-building interior framework.

For FL-3, the garage should support at least:

`interiorMode: cell`

The first interior does not need to be multi-room.

Minimum usable cell:

- floor;
- four enclosing wall boundaries where required;
- ceiling/roof relation;
- one primary traversable opening;
- optional rear glazing;
- physically coherent dimensions.

### Acceptance

The generated garage interior can be queried as structured data and instantiated predictably.

---

# 5. Stage B — Reliable enter/exit behavior

## 5.1 Entrance semantics

Entry must be based on a semantic portal or interaction anchor.

Do not use:

- mesh index;
- raw coordinate guess;
- visual-only door object;
- arbitrary collision disable.

The entrance should expose:

- world position;
- facing direction;
- width;
- height;
- target interior region;
- traversal state.

## 5.2 Traversal model

For FL-3, the preferred model is seamless physical traversal.

Voight should walk across the threshold using the same character controller.

Avoid teleporting unless physical traversal proves infeasible.

## 5.3 Entrance clearance

Validate:

- no collision lip traps the player;
- curb/sidewalk does not interfere with entry;
- door/garage threshold is flush enough for the current character capsule;
- opening dimensions exceed player-controller dimensions;
- camera has room to follow through the threshold.

## 5.4 Exit

Exiting must use the same physical opening and return naturally to the exterior.

### Acceptance

Voight can enter and exit repeatedly without:

- getting stuck;
- clipping through the wall;
- being pushed away by collision;
- camera snapping;
- becoming trapped inside.

---

# 6. Stage C — Interior collision and physical truth

## 6.1 Collision strategy

Use simplified collision where possible.

Required interior collision:

- floor;
- opaque outer walls;
- ceiling/roof only where player/camera interaction requires it;
- real glazing where already configured;
- threshold geometry;
- any structural obstacle materially relevant to navigation.

Do not generate high-detail collision for decorative trim.

## 6.2 Player capsule compatibility

Verify against the existing Rapier capsule and character controller.

Do not change player dimensions unless the interior exposes a genuine systemic incompatibility.

## 6.3 Repeated traversal

Test:

- enter;
- walk interior perimeter;
- approach rear window;
- return to entrance;
- exit;
- re-enter.

### Acceptance

No solid penetration and no controller instability.

---

# 7. Stage D — Interior visibility control

## 7.1 Problem

A generated building shell can produce visually incorrect results when:

- exterior wall meshes obscure the interior from the camera;
- roof/ceiling blocks the view unnecessarily;
- interior geometry renders when too far away;
- both exterior and interior surfaces z-fight or visually overlap.

## 7.2 Visibility states

Implement a minimal state model:

- `outside`;
- `threshold`;
- `inside`.

The state should be determined by player position relative to:

- interior bounds;
- portal plane;
- building semantic metadata.

## 7.3 Visibility policy

When outside:

- exterior shell visible;
- interior may remain selectively visible through real windows/openings;
- interior detail can be reduced if needed.

At threshold:

- exterior and interior both visible;
- no abrupt popping.

When inside:

- interior surfaces visible;
- roof/ceiling treatment should preserve camera usability;
- exterior facade geometry that blocks the camera may be selectively hidden or adjusted only where justified.

Do not globally hide the entire building when inside.

## 7.4 Transition quality

Avoid:

- hard one-frame visibility switches;
- full-building disappearance;
- roof popping at minor camera movement;
- duplicate surfaces.

### Acceptance

The player can cross the threshold without obvious representation collapse.

---

# 8. Stage E — Interior lighting baseline

## 8.1 Interior lighting goal

The garage interior should be readable but not uniformly bright.

The desired result is:

- darker than exterior daytime;
- still navigable;
- believable light spill from openings;
- basic local illumination;
- strong enough contrast to communicate indoor space.

## 8.2 Lighting components

Recommended minimum:

1. ambient interior contribution;
2. one or two localized interior lights;
3. entrance light spill;
4. window contribution or visual brightening;
5. limited emissive fixture treatment if useful.

## 8.3 Light ownership

Interior lights should belong to the generated hero building lifecycle.

They must dispose with the building/world.

## 8.4 Shadow policy

Do not enable expensive local-light shadows unless visually justified.

Initial policy:

- directional sun remains primary exterior shadow source;
- interior local lights may be unshadowed;
- rely on geometry, contrast, and restrained ambient light first.

### Acceptance

The interior is readable and plausibly darker than exterior without looking black or artificially lit.

---

# 9. Stage F — Exterior atmosphere baseline

FL-3 owns the first coherent atmosphere treatment.

## 9.1 Sky

Add a basic sky system.

Initial target:

- clear or lightly hazed daytime sky;
- no complex weather;
- no photoreal procedural atmosphere requirement.

Possible implementation:

- skybox;
- gradient dome;
- procedural sky material;
- simple physically-inspired sky if runtime cost remains low.

## 9.2 Horizon and atmospheric depth

Introduce subtle distance separation through:

- scene fog or height-light atmospheric approximation;
- distant desaturation;
- modest horizon haze.

Do not use heavy fog to hide geometry.

## 9.3 Exterior palette

Maintain grounded cinematic stylization:

- restrained sun warmth;
- cooler sky ambient;
- modest contrast;
- no arcade saturation;
- no excessive bloom.

### Acceptance

The exterior no longer reads as geometry under a black void.

---

# 10. Stage G — Basic day/night foundation

A full dynamic cycle is not required for the first FL-3 pass, but the architecture should support it.

## 10.1 Time-of-day state

Introduce a normalized environment state such as:

```text
timeOfDay: 0.0 ... 24.0
```

or equivalent.

Initial validated presets may include:

- day;
- dusk;
- night.

## 10.2 Sun behavior

Prepare:

- sun direction;
- sun intensity;
- sun color;
- shadow direction;
- shadow length.

Do not yet require continuous time animation if discrete presets are more stable.

## 10.3 Sky/ambient behavior

Environment state should drive:

- sky color;
- hemisphere/ambient intensity;
- fog/haze;
- exposure if used.

### Acceptance

Lighting architecture can transition later without rewriting the world.

---

# 11. Stage H — Streetlight illumination

Streetlight geometry already exists.

FL-3 should make it physically meaningful at night/dusk.

## 11.1 Light placement

Use the existing semantic streetlight context items.

Each streetlight should be able to own:

- light position;
- light direction;
- radius;
- intensity;
- color temperature;
- enable/disable state.

## 11.2 Visual target

User-approved direction:

- yellow-to-white local illumination;
- readable radius;
- restrained falloff;
- no oversized glowing spheres.

## 11.3 Performance

Do not enable all local lights with expensive shadows.

Use:

- bounded active light count;
- distance activation;
- no local shadows initially unless proven necessary.

### Acceptance

At night, streetlights visually affect the ground and nearby facades.

---

# 12. Stage I — Reflection and material response

FL-3 should establish restrained material response rather than full reflection simulation.

Priority surfaces:

- glazing;
- wet-looking or polished materials only if justified;
- vehicle body;
- metal storefront details.

Use low-cost techniques first:

- environment intensity;
- simple reflection texture;
- specular tuning;
- Fresnel where appropriate.

Avoid:

- expensive screen-space reflections as a requirement;
- reflection probes everywhere;
- mirror-like city surfaces.

### Acceptance

Glass and metal respond coherently to lighting without dominating the scene.

---

# 13. Stage J — Camera behavior at exterior/interior transition

This is a central FL-3 gate.

## 13.1 Exterior camera

Preserve current behavior:

- third-person orbit;
- wall obstruction compression;
- ground exclusion;
- vertical look range.

## 13.2 Threshold behavior

At the garage entrance:

- camera should not snap through facade walls;
- camera should not remain outside while Voight enters deeply inside;
- camera should compress smoothly where necessary;
- recovery should remain damped.

## 13.3 Interior behavior

Inside:

- camera radius may need temporary bounds;
- ceiling and wall blockers remain active;
- transparent glazing should not behave like opaque wall blockers;
- camera must not move outside the physical interior if doing so reveals invalid geometry.

## 13.4 Ground exclusion

Explicitly validate the recent patch:

- extreme upward look must not move camera below terrain;
- downward/oblique angles must remain usable.

### Acceptance

Camera remains usable throughout approach, entry, interior movement, and exit.

---

# 14. Stage K — Environment state system

Avoid scattering atmosphere variables across unrelated modules.

Create one environment controller or state owner responsible for:

- time-of-day;
- sky;
- sun;
- ambient light;
- fog/haze;
- streetlight activation;
- environment intensity;
- future weather hooks.

Possible interface:

```ts
EnvironmentState
EnvironmentController
```

The system should remain renderer/runtime-owned, not React-owned.

---

# 15. Stage L — Generated-world integration

The reusable `GeneratedFirstLightWorld` should become the owner or coordinator of FL-3 environmental systems.

World lifecycle should include:

- hero interior;
- interior lights;
- environment controller;
- sky;
- streetlight lights;
- visibility state;
- shadow state.

Disposal must cleanly remove all added resources.

---

# 16. Stage M — Automated test coverage

Add tests for:

## Interior semantics

- hero garage has an interior;
- entrance anchor exists;
- portal dimensions valid;
- interior bounds finite.

## Traversal

- opening dimensions exceed player capsule;
- threshold does not contain blocking collider.

## Visibility state

- outside/threshold/inside classification deterministic;
- interior bounds classification correct.

## Environment

- day preset deterministic;
- night preset deterministic;
- streetlights disabled by day;
- streetlights enabled by night.

## Lifecycle

- interior lights dispose;
- sky/environment resources dispose;
- world body/collider counts return to baseline;
- repeated create/dispose remains stable.

## Headless safety

Browser-only atmosphere features must:

- degrade safely under NullEngine;
- avoid canvas/WebGL-only assumptions in tests.

---

# 17. Stage N — Browser validation matrix

Validate the live `/game` route.

## Exterior

- sky visible;
- atmosphere coherent;
- shadows correct;
- road-junction continuity retained;
- camera-ground patch validated.

## Garage approach

- entrance readable;
- threshold visible;
- interior can be visually understood before entry.

## Entry

- movement stable;
- collision correct;
- camera remains outside solids;
- lighting transition believable.

## Interior

- readable;
- no black void;
- no overexposure;
- no wall/roof disappearance failures;
- rear glazing behaves correctly.

## Exit

- lighting returns naturally;
- camera expands cleanly;
- no visibility pop;
- no collision trap.

---

# 18. Stage O — FL-3 visual review candidate

The next valid visual review build should show:

1. Voight walking outside;
2. visible sky and exterior atmosphere;
3. approach to the South Ward garage;
4. entry through the real opening;
5. usable interior lighting;
6. stable interior camera;
7. exit back to daylight;
8. optional dusk/night preset if sufficiently stable;
9. visible streetlight illumination if night preset is included.

This is a valid substantial-visual-change deployment point.

---

# 19. FL-3 acceptance criteria

FL-3 is complete when:

1. hero garage entrance is physically reliable;
2. Voight can enter and exit repeatedly;
3. interior collision is stable;
4. interior visibility logic is stable;
5. interior lighting is readable;
6. exterior sky exists;
7. exterior atmosphere is coherent;
8. fixed/dynamic sun architecture is established;
9. streetlights can illuminate the scene at night/dusk;
10. reflection/material response is coherent;
11. camera remains stable across exterior/interior transition;
12. camera cannot cross underground;
13. generated-world lifecycle remains leak-free;
14. mobile/desktop input remains unchanged;
15. live `/game` review is visually accepted.

---

# 20. Performance policy

FL-3 should not aggressively optimize before behavior is correct.

Measure:

- added light count;
- shadow cost;
- environment texture cost;
- scene frame time;
- interior/exterior transition cost;
- mobile impact.

Prefer:

- one shadowed directional sun;
- unshadowed local lights;
- bounded active streetlights;
- simple sky;
- restrained fog;
- simple reflection environment.

Optimization beyond that belongs primarily to FL-4.

---

# 21. Non-goals

Do not during FL-3:

- expand to another district;
- implement weather;
- add full traffic;
- add pedestrians;
- build missions;
- replace Voight proxy;
- implement final vehicle physics;
- build multi-floor interiors;
- add dense interior furnishing;
- enable heavy post-processing;
- add expensive local-light shadows by default;
- prematurely begin FL-4 optimization work.

---

# 22. Rolling refinements carried into FL-3

Two accepted FL-2 refinements should be verified while implementing FL-3:

## Camera-ground exclusion

Status:
patched on `main`.

Expected behavior:
camera obstruction ray treats generated ground as a blocker and prevents underground orbit.

## Junction asphalt continuity

Status:
patched on `main`.

Expected behavior:
First Light T-junctions render from overlapping continuous carriageways without raised square asphalt overlays.

These refinements do not redefine FL-3 scope.

---

# 23. Deployment policy

No deployment after every commit.

Deploy only when the FL-3 visual change is substantial enough to require review.

The preferred first FL-3 deployment candidate should include:

- hero garage traversal;
- interior lighting;
- exterior sky/atmosphere;
- stable camera transition.

If streetlight/night work is stable at the same point, include it.

Deployment procedure remains:

1. verify exact commit;
2. temporarily permit Vercel deployment;
3. deploy intentionally;
4. confirm READY;
5. verify `/game`;
6. inspect runtime errors;
7. restore guard to `exit 0`.

---

# 24. Documentation requirements

During implementation, update:

- `documentations/Meridia First Light Implementation Plan.md`;
- this FL-3 plan;
- implementation/handoff note;
- decision log.

Record:

- exact commits;
- tests;
- build status;
- deployment ID;
- preview URL;
- known limitations;
- visual review outcome.

---

# 25. Definition of success

The FL-3 implementation is successful when:

> **Voight can walk from the generated South Ward street into the generated hero garage, remain inside with believable visibility, lighting, collision, and camera behavior, then walk back outside into a coherent atmospheric exterior without the world visibly or mechanically breaking.**

---

# Final governing sequence

```text
VERIFY FL-2 ROLLING REFINEMENTS
        ↓
FORMALIZE HERO GARAGE INTERIOR SEMANTICS
        ↓
RELIABLE PHYSICAL ENTER / EXIT
        ↓
INTERIOR COLLISION
        ↓
INTERIOR VISIBILITY STATE
        ↓
INTERIOR LIGHTING
        ↓
EXTERIOR SKY + ATMOSPHERE
        ↓
TIME-OF-DAY FOUNDATION
        ↓
STREETLIGHT ILLUMINATION
        ↓
MATERIAL / REFLECTION RESPONSE
        ↓
CAMERA TRANSITION VALIDATION
        ↓
AUTOMATED TESTS
        ↓
LIVE /GAME WALKTHROUGH
        ↓
SUBSTANTIAL VISUAL REVIEW DEPLOYMENT
        ↓
FL-3 ACCEPTANCE
        ↓
FL-4 OPTIMIZATION AND ACCEPTANCE
```

No implementation work should begin from this document until explicit greenlight is given.
