# GTD-GROUND-003 — South Ward Land-Infill Corrective Patch Plan

**Date:** 2026-10-14  
**Scope:** Corrective patch plan following the first South Ward land-infill preview review  
**Status:** PLANNED / NOT IMPLEMENTED / AWAITING AUTHORIZATION

## 1. Objective

Patch the current South Ward land-infill implementation so that the brown-space replacement remains intact while correcting the first-pass realism failures.

The corrective goal is not merely “less brown,” but:

- **urban/suburban land-use balance**,
- **clear paved hierarchy**,
- **credible water treatment**,
- **improved material fidelity**,
- **removal of visual seams and false edge conditions**.

## 2. Patch goals

### G-01 — Rebalance South Ward toward urban hardscape
Grass must become secondary support rather than the default dominant filler. Pavement, forecourts, plain concrete, driveways, service yards, and parking should become more prominent where spatially justified.

### G-02 — Protect higher-priority paved categories from visual override
Once parking, service, driveway, or forecourt is allocated, it must remain visually visible and should not be buried by later residual grass assignment.

### G-03 — Convert water from painted class to formed feature
The pond must become a true shallow basin with smoother outline and real depth, including character descent to approximately torso height.

### G-04 — Remove the forced park base patch
The old pocket-green ground slab must be removed. Its props and vegetation may remain, but must rest on the new land-use system naturally.

### G-05 — Upgrade surface fidelity
Grass quality must be sharpened and pavement artifacts must be reduced.

### G-06 — Preserve future-network road continuity
Road edges near the playable boundary must not read like completed dead ends.

## 3. Scope boundaries

This patch **does include**:
- land-use weighting rebalance,
- hardscape/grass redistribution,
- parking visibility correction,
- pond shape and depth correction,
- grass material upgrade,
- pavement shading cleanup,
- removal of old park base patch,
- road-edge continuation treatment.

This patch **does not include**:
- new district generation,
- traffic AI,
- new building families,
- city expansion topology,
- final long-range water systems,
- full landscaping ecology system.

## 4. Corrective technical strategy

## 4.1 Land-use allocation correction

### 4.1.1 Introduce stronger hardscape-first residual logic
Residual open land in South Ward should no longer default primarily to grass.

**New residual ordering concept:**
1. protected roads/sidewalks/buildings/props
2. parking and service allocations
3. driveways and paved approaches
4. plain pavement / hardscape closure
5. localized grass / verge / planted zones
6. selective water only where explicitly allowed

### 4.1.2 Raise category precedence
The following categories must outrank generic grass:
- `PRK-01`
- `PRK-02`
- `SRV-01`
- `PAV-03`
- `PAV-04`
- `PAV-02`
- context-approved `PAV-01`

Grass categories should only win after these are resolved.

### 4.1.3 Re-weight South Ward context rules
South Ward neighborhood logic should be retuned to favor:
- building forecourts,
- pedestrian paving,
- service hardstand,
- small parking fields/pockets,
- plain concrete infill around active building edges.

Grass should remain concentrated in:
- verges,
- setbacks where justified,
- residual open plots,
- selected landscaping islands.

### 4.1.4 Explicit brown-space closure audit
Add a coverage diagnostic that reports final percentage/area by class, with emphasis on:
- pavement/hardscape share,
- grass share,
- parking share,
- service share,
- water share.

This will help verify that grass is no longer disproportionately dominant.

## 4.2 Parking visibility correction

### 4.2.1 Protect parking from overwrite
Parking regions must be frozen once classified so they cannot be replaced by later grass fallback.

### 4.2.2 Improve parking contrast
Parking should remain visually readable through:
- clearer asphalt/concrete distinction,
- visible bay markings,
- reduced surrounding grass encroachment.

### 4.2.3 Mercer Street targeted validation
A specific acceptance check should confirm that the Mercer Street parking area is visible and not hidden under grass.

## 4.3 Water feature correction

### 4.3.1 Replace blocky outline generation
Current cell-like water edges should be replaced with a smoother footprint generation pass.

Possible strategy:
- derive a coarse eligible basin region,
- smooth/merge edges,
- rasterize or mesh with softened perimeter,
- avoid visibly square stepped corners.

### 4.3.2 Add real basin depth
The pond should no longer be texture-only.

Patch target:
- create a depression in the pond footprint,
- use sloped banks or stepped depth transition,
- deepest central area should allow humanoid immersion to approximately torso level.

### 4.3.3 Define water collision behavior
Water requires clarified behavior:
- character can enter and descend,
- ground below pond remains physically supported,
- no instant clipping or floating,
- no uncontrolled physics instability.

### 4.3.4 Preserve low-cost rendering
Water should remain visually simple and stable:
- no expensive reflection system required,
- modest animated or static water finish acceptable,
- depth readability more important than advanced shader complexity.

## 4.4 Legacy green patch removal

### 4.4.1 Remove old pocket-green base surface
The dedicated sharp-edged old green slab should be deleted from the active ground composition.

### 4.4.2 Preserve props and vegetation where possible
Retain:
- trees,
- shrubs,
- bench,
- bin.

These should be re-seated against the generated terrain so they read as naturally placed objects rather than pieces of a separate authoring island.

### 4.4.3 Optional local soft landscaping support
If needed, allow a local generated green/planted context around those props, but only through the same new land-use system — not via an isolated bespoke patch.

## 4.5 Grass quality upgrade

### 4.5.1 Increase grass sharpness
Grass rendering must become more detailed and less blurry.

Target improvements:
- higher-frequency detail,
- better contrast control,
- crisper sampling,
- more believable tonal variation.

### 4.5.2 Reduce “flat soft image” feel
Avoid a single soft blur field. Introduce enough texture structure to match the scene’s road/pavement sharpness more closely.

### 4.5.3 Keep visual simplicity appropriate for style
The grass should improve in quality without becoming photo-realistic in a way that clashes with the rest of the game’s cartoon-realism target.

## 4.6 Pavement cleanup

### 4.6.1 Remove vertical shading artifacts
Any vertical blurred striping or columnar shading should be removed entirely.

### 4.6.2 Preserve only acceptable joint logic
If pavement joint realism is retained, it should emphasize:
- horizontal slab rhythm,
- subtle seams,
- cleaner concrete read,
- no muddy cross-hatching.

### 4.6.3 Keep surfaces flatter and more urban
The pavement should visually support the road without calling attention to itself as a texture experiment.

## 4.7 Road-edge continuation correction

### 4.7.1 Remove terminal road caps
End-of-road hard caps or obvious cement termination patches must be removed.

### 4.7.2 Establish continuation presentation
At the boundary of the current playable slice, roads should visually imply continuation into future districts.

Possible implementation strategies:
- extend road and sidewalk treatment closer to the boundary edge,
- avoid rounded or blocky concrete pads,
- keep the terminal presentation neutral rather than conclusive.

### 4.7.3 Preserve expansion compatibility
This must not lock the road into an artificial final form that later interferes with real district expansion.

## 5. Proposed staged patch execution

## Stage P2.1 — Failure-register implementation setup
- document current failure modes in repository
- add patch-plan document
- preserve preview evidence references

**Output:** documentation only

## Stage P2.2 — Allocation rebalance patch
- retune land-use weighting
- increase hardscape defaults
- lower grass residual dominance
- protect parking/service/paving precedence

**Acceptance check:** visible reduction in grass dominance

## Stage P2.3 — Parking visibility patch
- stop grass override on parking
- improve parking readability
- validate Mercer Street case directly

**Acceptance check:** Mercer parking visibly present

## Stage P2.4 — Legacy patch cleanup
- remove old pocket-green ground slab
- preserve and re-seat props/vegetation

**Acceptance check:** no forced sharp-edged green island remains

## Stage P2.5 — Material fidelity patch
- sharpen grass
- simplify pavement shading
- remove vertical concrete banding

**Acceptance check:** grass sharper, pavements cleaner

## Stage P2.6 — Road-edge continuation patch
- remove blocky terminal cap behavior
- present outward road continuation correctly

**Acceptance check:** roads no longer read as finished endpoints

## Stage P2.7 — Water geometry patch
- smooth footprint
- carve basin depth
- support humanoid descent to torso depth
- keep stable and inexpensive rendering

**Acceptance check:** pond visually smoother and physically deeper

## Stage P2.8 — Integrated preview verification
- rebuild preview
- inspect aerial and near-ground views
- check allocation balance, parking visibility, pond realism, grass quality, road-edge behavior, and park cleanup

**Acceptance check:** all seven owner observations addressed in one coherent pass

## 6. Testing and verification plan

### 6.1 Runtime verification scenes
Review from:
- aerial survey view,
- Mercer Street frontage,
- Foundry/edge-road view,
- pond close-up,
- former pocket-green area,
- near-sidewalk pavement close-up.

### 6.2 Functional checks
Confirm:
- character traversal remains intact,
- no scene-break from ground changes,
- pond depth works physically,
- parking stays visible,
- roads remain coherent.

### 6.3 Visual acceptance checks
Confirm:
- hardscape/grass balance reads urban-suburban,
- grass is no longer soft/blurry,
- pavements are cleaner,
- no fake road ends,
- no forced green park slab.

## 7. Risks and controls

### R-01 — Overcorrection toward too much pavement
**Risk:** Grass is reduced so aggressively that South Ward becomes overly barren.
**Control:** keep landscaped strips, verge logic, and selected grass parcels.

### R-02 — Water basin introduces physics instability
**Risk:** Depressed pond geometry may break walking or collision behavior.
**Control:** keep basin local, shallow-gradient, and tested with controlled support logic.

### R-03 — Parking readability still too weak
**Risk:** Even with precedence fixes, parking may still be visually lost.
**Control:** increase contrast and preserve explicit markings.

### R-04 — Legacy patch removal leaves prop awkwardness
**Risk:** Trees/bench/bin may float or look poorly grounded after patch removal.
**Control:** re-seat props against final generated surface during cleanup.

### R-05 — Boundary-road presentation still looks artificial
**Risk:** Road-edge correction may still appear unfinished or too abrupt.
**Control:** evaluate road-edge treatment from both aerial and ground angles.

## 8. Repository deliverables to create upon authorization

Recommended documentation files:
1. `documentations/Issues/GTD-GROUND-002 South Ward Land Infill Preview Failure Register and Pass-1 Review - 2026-10-14.md`
2. `documentations/Development/GTD-GROUND-003 South Ward Land Infill Corrective Patch Plan - 2026-10-14.md`

Recommended implementation branch:
- `fix/ground003-south-ward-land-infill-corrections-20261014`

## 9. Authorization boundary

This document does **not** authorize code changes by itself.

**Next step required:** explicit owner authorization to patch.

Once authorized, implementation should proceed according to this corrective plan and return a new preview build for review.