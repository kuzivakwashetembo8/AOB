# Meridian First Light Generated Runtime Promotion, FL-2 Closure and Valid Deployment Plan

Status: IMPLEMENTED THROUGH PRE-PROMOTION VERIFICATION — MAIN PROMOTION AND PLAYABLE DEPLOYMENT PENDING
Date: 2026-10-09  
Project: GTD — Grand Theft Division  
Repository: `interlinkglobal/GTD`

## Implementation checkpoint — 2026-10-09

Implemented on `development/meridian-first-light-fidelity`:

- branch reconciled with current `main`; comparison now reports 0 commits behind
- reusable `GeneratedFirstLightWorld` owner created
- shared generated world owner now drives both `/first-light-comparison` and the live runtime path
- `/game` selects `generated-first-light` through a controlled authored/generated source switch
- stable semantic player spawn and camera-focus anchors added
- Voight runtime spawn now targets the generated world
- generated building collision, camera blockers, ground collision, and parked-vehicle collision integrated with the existing Rapier/player runtime
- fixed daytime shadow baseline moved into the reusable gameplay world
- complete generated-world disposal owns physics, materials, meshes, context, lighting, and shadows
- authored dark-asphalt/timber-curb visual language preserved as district-selectable streetscape data
- generated-world lifecycle regression tests added
- strict TypeScript, full Vitest suite, and production build passed on deployment `dpl_D1B1MoGhXcQrYmNJyFM6VemnguLf`
- deployment reached READY
- both `/game` and `/first-light-comparison` returned HTTP 200
- no grouped runtime errors were reported in the verification window
- Vercel automatic build guard restored to `exit 0`

Verification source commit:

`2f4396da06d8e38732e4ad15ccfaa5914791ff80`

Verification preview:

`https://gtd-jfd788f4f-interlinkglobaltech.vercel.app/game`

The remaining gates are targeted substantive lint, controlled promotion to `main`, intentional deployment from the exact promoted commit, and live user confirmation that Voight movement/camera/collision are correct in the generated world.

## Purpose

This document defines the exact technical sequence required to convert the currently accepted Generated First Light comparison candidate into the live playable First Light runtime, complete FL-2, and establish a valid deployment checkpoint before FL-3 begins.

The required visual outcome is:

> **Voight must be able to walk through the newly generated First Light world in the actual `/game` runtime.**

That is the decisive transition from comparison/proof infrastructure to accepted playable world infrastructure.

Implementation was explicitly greenlit on 2026-10-09. The generated-world runtime integration is implemented and has passed branch build/test/route smoke verification; controlled promotion and the final playable deployment gate remain.

---

# 1. Current accepted state

The current accepted Generated First Light candidate is on:

`development/meridian-first-light-fidelity`

Accepted candidate commit:

`abf3947b8c5f53287df4050c3dd30297ec1ca511`

Accepted comparison deployment:

`dpl_3j58hTLPSQyZY4nHgNegb2hL8tSa`

Accepted comparison route:

`/first-light-comparison`

The following systems have been visually and technically accepted in comparison form:

- ten generated First Light buildings;
- stable building IDs and coordinates;
- generated building massing;
- generated facade grammar;
- generated roof systems;
- generated material families;
- deterministic surface variation;
- generated physical collision;
- semantic interaction anchors;
- authored First Light road geometry parity baseline;
- authored curb and sidewalk parity baseline;
- authored-style tree geometry;
- authored bark and foliage texture behavior;
- structured vegetation and context placement;
- streetlights;
- parked vehicles;
- benches and bins;
- pocket-green treatment;
- fixed daytime directional shadows;
- Rapier lifecycle reclamation;
- NullEngine-safe generated-world tests.

The comparison candidate is no longer a proof-of-concept for building generation. It is now the source candidate for the playable First Light world.

---

# 2. Governing implementation outcome

The next implementation is successful only when:

> **The normal GTD `/game` route boots the generated First Light world, spawns Voight into it, and allows the existing movement/camera/input runtime to operate against the generated physical environment.**

The comparison route remains useful as a regression surface but must no longer be the only place where the generated world exists.

The generated world must become a gameplay runtime target.

---

# 3. Stage A — Reconcile the development branch with current main

The current development branch is ahead of and behind `main`.

Before further gameplay-runtime integration:

1. fetch current `main`;
2. identify the three `main` commits not present in the fidelity branch;
3. incorporate them without dropping any generated-world work;
4. resolve documentation-only divergence cleanly;
5. preserve the 13:00 SAST checkout log;
6. preserve all currently accepted generated-world commits;
7. confirm the resulting branch ancestry is coherent.

Do not perform a blind force update.

### Acceptance

- no accepted generated-world commit is lost;
- no current `main` documentation/state is lost;
- branch is no longer behind `main`;
- resulting candidate remains buildable.

---

# 4. Stage B — Record formal visual acceptance

Update the First Light implementation documentation to record that the following have been accepted:

## Architecture

- Generated First Light building composition;
- building placement;
- massing;
- skyline hierarchy;
- facade grammar;
- roof treatment;
- window/storefront treatment;
- material treatment.

## Environment

- authored First Light road-layout parity baseline;
- authored curb/sidewalk parity baseline;
- authored-style tree baseline;
- structured street context;
- fixed daytime shadows.

## Retained authored district-style assets

Explicitly preserve:

- darker authored asphalt appearance;
- wooden curb/edge design.

These are not deprecated assets.

They must be retained as future district-selectable style families.

### Acceptance

The decision log should distinguish:

- accepted First Light geometry/runtime behavior;
- reusable alternate district visual families.

---

# 5. Stage C — Define the generated First Light runtime owner

The current generated implementation must be moved from comparison-only orchestration into a reusable runtime-world module.

Create or formalize a generated First Light world owner, responsible for:

- generated buildings;
- generated urban surfaces;
- generated vegetation/context;
- Rapier-generated collision;
- material library ownership;
- shadow caster/receiver registration;
- lifecycle disposal;
- stable semantic world metadata.

The runtime-world API should expose a clean lifecycle such as:

```text
createGeneratedFirstLightWorld(...)
→ GeneratedFirstLightWorld
→ dispose()
```

The generated world owner must not depend on React.

React remains UI/application shell only.

---

# 6. Stage D — Preserve the existing GTD runtime contract

Do not rewrite `GTDGameRuntime` merely to accommodate Generated First Light.

Preserve:

- fixed 60 Hz timestep;
- current input bridge;
- mobile controls;
- desktop keyboard controls;
- arrow-key semantics;
- camera obstruction behavior;
- vertical camera range;
- player movement;
- Rapier character controller;
- snapshot bridge;
- React/runtime ownership boundary.

The generated world should conform to the existing runtime contract.

The runtime should not be redesigned around the generator.

---

# 7. Stage E — Replace the authored gameplay world with Generated First Light behind a controlled switch

Do not immediately delete the authored First Light implementation.

Introduce an explicit world-source selection mechanism.

Recommended initial modes:

```text
authored-first-light
generated-first-light
```

For the first playable generated candidate:

- `generated-first-light` becomes the selected `/game` world;
- authored mode remains available as rollback/regression reference.

This can be a temporary internal constant, runtime flag, or clean configuration object.

Do not expose unnecessary developer controls in the player-facing UI.

### Acceptance

Switching world source must not require rewriting the engine.

---

# 8. Stage F — Spawn Voight into Generated First Light

The generated world must provide a valid player spawn.

Use a stable semantic spawn anchor rather than a fragile mesh-relative assumption.

Required spawn properties:

- known walkable ground;
- outside generated solid geometry;
- outside vehicle colliders;
- adequate camera clearance;
- near the South Ward garage corner;
- same general First Light gameplay context.

Recommended semantic identity:

`south-ward-first-light-player-spawn`

Spawn should be represented as structured world data or a stable semantic anchor.

Do not hardwire spawn to a generated mesh index.

---

# 9. Stage G — Generated-world Rapier integration

Generated building collision is already proven in isolation.

The next gate is full integration with the existing player controller.

Validate:

- Voight cannot walk through generated building walls;
- Voight cannot walk through generated parked vehicles;
- physical garage glazing behaves correctly;
- doors/openings intended to be traversable remain traversable;
- sidewalks do not accidentally block movement;
- curb geometry does not trap the controller;
- road surfaces do not introduce collision steps;
- generated ground height remains compatible with current capsule dimensions;
- world collision loads before active movement begins.

The current player capsule and movement controller should remain unchanged unless a genuine incompatibility is found.

---

# 10. Stage H — Camera behavior inside Generated First Light

The existing third-person camera obstruction system must operate against generated camera blockers.

Validate:

- opaque generated walls block camera;
- transparent glazing does not behave like an opaque camera blocker;
- camera does not pass through generated buildings during normal movement;
- garage interior/exterior transitions remain usable;
- recovery after obstruction remains smooth;
- vertical look range remains unchanged;
- tall generated buildings remain viewable.

Generated camera-blocker semantics must remain independent of visual LOD.

---

# 11. Stage I — Integrate accepted fixed daytime shadows into gameplay runtime

The accepted comparison shadow baseline should move into the playable generated runtime.

For FL-2 gameplay:

- retain one fixed directional sun;
- retain the accepted fixed shadow direction;
- retain 2048 shadow-map baseline if performance permits;
- buildings cast;
- trees cast;
- vehicles/major props cast;
- roads/ground/grass receive;
- transparent foliage participates.

Do not implement FL-3 dynamic lighting yet.

Explicitly defer:

- moving sun;
- time-of-day shadow movement;
- streetlamp light contribution;
- night shadows;
- dynamic shadow-quality adaptation;
- atmosphere-linked lighting.

---

# 12. Stage J — Preserve authored road and curb visual families

Before cleanup or promotion, formalize the authored visual assets as reusable style definitions.

At minimum preserve:

## Road family

Example semantic family:

`south-ward-dark-asphalt`

Properties may include:

- base color;
- roughness;
- wear;
- markings contrast;
- drainage coloration.

## Curb/edge family

Example semantic family:

`timber-road-edge`

Properties may include:

- timber material;
- dimensions;
- weathering;
- district applicability.

These families do not need to be used in Generated First Light immediately if the current accepted visual treatment remains preferable.

The requirement is preservation for later district use.

---

# 13. Stage K — Runtime resource ownership and disposal

The playable generated world must have one clear owner for generated resources.

Verify clean ownership for:

- building meshes;
- urban meshes;
- context meshes;
- materials;
- textures;
- shadow-generator registrations;
- Rapier rigid bodies;
- Rapier colliders;
- transform nodes;
- building registries;
- interaction metadata.

On world disposal:

- all generated scene resources must release;
- all generated Rapier resources must return to baseline;
- no duplicate render loops;
- no retained event handlers;
- no stale shadow casters;
- no material-library leaks.

---

# 14. Stage L — Runtime smoke tests

Add or extend automated coverage for the generated gameplay-world path.

Minimum tests:

1. generated First Light can be created under Babylon NullEngine;
2. generated First Light can be disposed;
3. player spawn exists;
4. spawn is finite and valid;
5. generated buildings register collision;
6. world body/collider counts return to baseline after disposal;
7. repeated world create/dispose remains stable;
8. authored mode remains constructible if retained behind switch;
9. generated world exposes expected semantic location metadata;
10. fixed daytime shadow setup is browser-runtime only or safely bypassed under headless engine where necessary.

---

# 15. Stage M — Browser gameplay validation

Automated tests are insufficient for final acceptance.

Run the actual `/game` route and inspect:

## Movement

- Voight walks;
- runs/sprints if currently supported;
- turns correctly;
- mobile left/right remains correct;
- desktop arrow-key direction remains correct.

## Physics

- buildings block;
- vehicles block;
- windows behave according to physical policy;
- ground movement is stable;
- curbs do not snag the controller.

## Camera

- camera stays outside opaque generated walls;
- transparent windows remain visually usable;
- camera recovery remains familiar;
- vertical look remains adequate.

## Environment

- generated buildings match accepted comparison;
- roads/curbs match accepted parity;
- trees match accepted browser rendering;
- shadows match accepted comparison;
- no missing materials or textures.

---

# 16. Stage N — First playable Generated First Light comparison

Before final deployment, compare:

`/first-light-comparison`

against:

`/game`

The generated half of the comparison and the actual gameplay world should agree materially in:

- building layout;
- facade treatment;
- roads;
- curbs;
- vegetation;
- parked context;
- shadows.

Differences caused by gameplay camera/character presence are expected.

Unexpected visual divergence is a blocker.

---

# 17. Stage O — Final verification gate

Before promotion/deployment:

1. strict TypeScript;
2. complete Vitest suite;
3. architecture-generation tests;
4. city-generation tests;
5. representation tests;
6. interaction tests;
7. road/environment tests;
8. generated-world lifecycle tests;
9. 50-cycle Rapier reclamation stress test;
10. production build;
11. targeted substantive lint;
12. comparison route smoke test;
13. game route smoke test;
14. gameplay movement inspection;
15. camera obstruction inspection;
16. generated collision inspection.

Record exact commit SHA used for verification.

---

# 18. Stage P — Controlled promotion to main

Only after all gates pass:

1. promote the reconciled verified generated-world chain to `main`;
2. preserve authored First Light source as regression reference;
3. do not delete authored world code in the same promotion;
4. preserve alternate road/curb style families;
5. update handoff documentation;
6. update First Light decision log;
7. verify `main` ancestry after promotion.

No automatic deployment should be enabled.

---

# 19. Stage Q — Valid deployment point

This plan defines a valid deployment milestone.

The deployment is valid when:

> **Voight is visibly walking in the newly generated First Light world on the normal `/game` route.**

This is materially different from the comparison route.

The deployment must demonstrate:

- generated world boot;
- live player movement;
- generated collision;
- working camera;
- accepted road/curb environment;
- accepted trees;
- accepted fixed daytime shadows;
- existing UI/input shell still functional.

The deployment should be intentional and manually gated.

The Vercel guard should:

1. temporarily permit the deployment;
2. deploy the verified `main` commit;
3. confirm READY;
4. verify `/game`;
5. restore the ignore-build guard immediately.

---

# 20. Stage R — Deployment acceptance

The deployment is accepted if:

- `/game` loads successfully;
- Voight is visible;
- Voight can walk in Generated First Light;
- camera behaves correctly;
- player collision behaves correctly;
- no major visual regression appears compared with the accepted comparison;
- browser console/runtime reports no blocking error;
- deployment returns expected HTTP response;
- automatic deployment guard is restored.

This constitutes the first accepted playable deployment of the generated Meridian world architecture.

---

# 21. Stage S — Formal FL-2 closure

After successful playable deployment, record FL-2 as complete.

Recommended closure statement:

> **FL-2 complete: Generated First Light now reconstructs the accepted South Ward environment through reusable deterministic world-generation systems and operates as the live playable GTD world with Voight movement, physical collision, camera behavior, environmental context, and fixed daytime visual grounding intact.**

The comparison route should remain temporarily available as a regression/debug surface.

---

# 22. Stage T — Transition authority to FL-3

Only after FL-2 closure:

> **FL-3 in `documentations/Meridia First Light Implementation Plan.md` becomes the governing next source of truth.**

FL-3 then owns:

- sky;
- basic day/night cycle;
- dynamic sun;
- changing shadow direction and length;
- localized streetlamp illumination;
- night lighting;
- atmospheric treatment;
- interaction refinement;
- continued physical-world credibility.

Weather remains later unless explicitly advanced by FL-3.

---

# 23. Non-goals

Do not during this plan:

- build another district;
- delete Authored First Light;
- rework accepted building generation;
- replace the input system;
- replace the player controller;
- rewrite camera architecture;
- begin full FL-3 day/night;
- add traffic AI;
- add pedestrian AI;
- add missions;
- add final character art;
- add full city streaming expansion;
- enable automatic Vercel deployment.

---

# 24. Primary risks

## Branch divergence

Risk:
Development branch is currently behind `main`.

Mitigation:
Reconcile before runtime integration or promotion.

## Comparison/runtime visual drift

Risk:
`/game` may instantiate the generated world differently from the comparison route.

Mitigation:
Extract one reusable Generated First Light world owner used by both.

## Physics mismatch

Risk:
Generated collision proven in tests may interact differently with the live character controller.

Mitigation:
Explicit browser gameplay validation.

## Camera mismatch

Risk:
Generated camera blockers may differ from authored assumptions.

Mitigation:
Preserve semantic blockers and perform interior/exterior traversal tests.

## Resource leakage

Risk:
World-source switching or repeated development reloads may retain resources.

Mitigation:
Single lifecycle owner and repeated disposal tests.

---

# 25. Definition of success

This plan is complete when all of the following are true:

1. Development branch is reconciled with `main`.
2. Visual acceptance is documented.
3. Generated First Light exists as a reusable runtime-world module.
4. `/game` selects Generated First Light.
5. Voight spawns from a stable semantic anchor.
6. Voight can walk through the generated environment.
7. Generated buildings collide correctly.
8. Generated vehicles collide correctly.
9. Generated openings remain usable.
10. Camera obstruction works against generated blockers.
11. Accepted road/curb parity is preserved.
12. Accepted tree appearance is preserved.
13. Fixed daytime shadows are preserved.
14. Authored road/wood-curb visual families are retained for future districts.
15. Generated world disposal returns physics/resources to baseline.
16. Strict TypeScript passes.
17. Full tests pass.
18. Production build passes.
19. Live browser gameplay validation passes.
20. Verified chain is promoted to `main`.
21. Intentional Vercel deployment reaches READY.
22. `/game` visibly shows Voight walking in Generated First Light.
23. Deployment guard is restored.
24. FL-2 is formally closed.
25. FL-3 becomes the governing next phase.

---

# Final governing sequence

```text
RECONCILE WITH MAIN
        ↓
RECORD VISUAL ACCEPTANCE
        ↓
EXTRACT REUSABLE GENERATED FIRST LIGHT WORLD OWNER
        ↓
WIRE GENERATED FIRST LIGHT INTO GTDGameRuntime
        ↓
SPAWN VOIGHT IN GENERATED WORLD
        ↓
VALIDATE COLLISION + CAMERA + INPUT
        ↓
PRESERVE ACCEPTED ROADS + TREES + SHADOWS
        ↓
VERIFY RESOURCE LIFECYCLE
        ↓
RUN FINAL AUTOMATED + BROWSER GATES
        ↓
CONTROLLED PROMOTION TO MAIN
        ↓
INTENTIONAL DEPLOYMENT
        ↓
VOIGHT WALKS IN GENERATED FIRST LIGHT
        ↓
CLOSE FL-2
        ↓
FL-3 BECOMES SOURCE OF TRUTH
```

No implementation work should begin from this document until explicit greenlight is given.
