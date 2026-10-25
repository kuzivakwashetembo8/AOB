# GTD-NH-REBUILD-001 — North Heights procedural reconstruction (visual checkpoint A)

Date: 2026-10-24
Repository: interlinkglobal/GTD
Working branch: trial/north-heights-reconstruction-001
Baseline branch: trial/north-heights-city-pack-8 (commit 718a8067b88518278dd12b8f8c16e9a972adcc4d)
Production main: OUT OF SCOPE — no production edits, no merge, no production deployment.
Status: First procedural visual checkpoint under review, not accepted.

## Trigger / architectural decision

Harmony rejected the displayed quality of the imported 13,338,312-byte city_pack_8.glb:
105 city meshes, approximately 43,318 triangles according to the reviewed browser screenshot;
about 25 FPS on the reporting desktop, without reliable GPU-only profiling.
The source is "City pack 8" by Pasha, licensed CC BY 4.0 (https://skfb.ly/pFEVL).
This source remains credited because skyline density and urban block rhythm were used as
conceptual design reference. Its meshes, baked texture/material assets, and 3D geometry
are not reused by the reconstruction renderer.

The task is to build an ORIGINAL North Heights with similar block/skyline concepts,
not to optimize the rejected downloaded GLB or silently rename it as new geometry.
The provided screenshot is not a surveyed street plan, so placements are authored
deterministically from visual cues; do not claim exact building coordinates were
extracted from the model. Future forensic GLB analysis can refine the spatial schema.

## Visual checkpoint A implementation

1. Generate a typed deterministic NH lot inventory (BuildingSpec) with stable IDs
   NH-XX-YY-L1/2, positioning, footprints, height/floors and semantic archetypes.
2. Form a 10x10 urban block grid and 22 named road axes over a ~640m square,
   with repeatable gaps for pocket parks and view corridors.
3. Shape Y-up ridge topography, lower downtown terraces, and higher northern
   residential foothills. Build procedural terrain and roads independently.
4. Create glass/office towers, civic blocks, brick lofts, apartments, villas/
   estates with deterministic varied floors, podiums, crowns, parapets, rooftop
   fixtures, geometric window panes and building entrances.
5. Construct street pavement, lane paint, streetlights, gardens and clustered
   foliage as geometry. Group repeated box geometry with Babylon thin instances
   and shared materials. Mobile reduces distant-looking window grid density.
6. Preserve the existing free-flight viewport and both GTD character assets,
   including UAL standing/idle witness and character.glb inspection witness.
7. Place all new district code strictly in src/game/experiments, with the
   pre-existing trial-only /north-heights-preview entry route. No changes
   to /game, core physics, South Ward generation, PWA runtime or gameplay state.
8. Do not serve public/GLBs/Infrastructure/city_pack_8.glb on this branch.
   Preserve source original in repository root pending owner source retention
   decisions; the reconstruction never fetches it.

## Constraints and known limitations

- Free-flight inspection only, not a shipped interconnected city. No Rapier
  colliders, vehicle navigation, crowds, missions, pedestrian walkability or
  imported interiors. Street/door geometry is visual.
- The authored road grid preserves the *concept* of dense corridors but does
  not claim measured exact alignment with the rejected asset.
- The visual facade improvement comes from distinct geometry and palette, not
  external high-resolution textures. This checkpoint is not final photorealism.
- Thin instancing batches geometry but can still overdraw on mobile; FPS and
  memory must be measured on devices, not inferred from draw-call counts.
- World initial creation is synchronous. If visual checkpoint A is approved,
  move generation behind worker/chunked/streaming policy before scaling up.
- The office/estate skyline distribution should be reviewed against district
  identity: North Heights is primarily upscale/upland with a lower commercial
  tower transition toward Meridian Central.
- Existing UAL character comes from GTD's pre-existing pinned asset staging.
  Character witnesses are not provided by City Pack 8. The source model may
  still be present in root Git history but not used as runtime geometry.

## Review protocol

First preview: inspect desktop and mobile with the same route. Establish
recognizable tower skyline, ridgeline, street/parcel boundaries, and clear
original geometry. Confirm both character witnesses and fly controls. Monitor
load duration, FPS and WebGL errors. Do NOT merge or deploy to production
before visual owner acceptance. If rejected, follow Procedure DDD to document
and close the trial; accepted South Ward/world and character work must remain intact.
