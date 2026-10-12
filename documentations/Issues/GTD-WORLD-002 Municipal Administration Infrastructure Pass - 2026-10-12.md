# GTD-WORLD-002 — South Ward Municipal Administration: Infrastructure Pass
**Date:** 2026-10-12 · **Branch:** `feat/gtd-world-002-municipal-administration-20261012` · **Status:** IMPLEMENTED ON PREVIEW BRANCH, OWNER DESKTOP ACCEPTANCE PENDING · **Release:** no production/main merge.

## Owner evidence and seven corrections

The owner inspected `gtd-8zcc08f19-interlinkglobaltech.vercel.app/game` and requested seven refinements before returning to standalone street props. These are generator and physical streetscape corrections rather than permission to reintroduce failed hydrants/OPEN-CLOSED signs.

| Gate | Failure mode / original cause | Corrective implementation | Remaining acceptance |
|---|---|---|---|
| IA-01 | Arbitrary dark vertical window bars from optional `facade-shutter` trims and chimney-like rooftop HVAC/vent/access/water-tank elements generated stochastically | Remove window shutter placements and random rooftop fixtures; preserve standard frames, deliberate roof parapets, authored openings and window-row/column grammar | Walk around Foundry/Mercer buildings; no black floating bars or generic chimney stacks |
| IA-02 | Flat, featureless brown terrain between lots | Create zoned South Ward residential paving (laid grid/joint texture), maintained grass, three marked parking/service pads as surface-level geometry. No new model imports or extra physics bodies | Street/corner gaps no longer empty brown; no surface fighting against road or sidewalk, no new dead zones or floating geometry |
| IA-03 | Inaccessible-looking apartment/office/commercial buildings have no visible pedestrian door | Generator gives every building at least one ground-floor side/rear pedestrian door if not already authored; door panel and handle visible, `cutThrough=false` and building physics wall remains intact. Garage bay preserved, doors are not falsely marked interactive | Each of 10 First Light buildings visibly has a plausible door; future buildings inherit same contract |
| IA-04 | Brick walls resemble painted-on rectangles with little mortar depth | Maintain existing smooth/painted brick subset; stable seeded subset now gets 128×128 running-bond procedural brick surface with stronger joints, bevel highlights and recessed edges. No per-brick mesh/collider. | Different facades have visibly distinct masonry; no tile flicker, objectionable repeated stretched patterns or VRAM spike |
| IA-05 | Voight walks through curb fronts / feet sink into sidewalk | Use already-approved Rapier autostep for actual ascents (0.28m limit), enable existing physical sidewalk-top colliders for the canonical play session, and briefly cue existing jump/step animation on **grounded Rapier-reported** upward ascent. No invented physics jump, no raising player through walls or new foot IK claim | Walk/sprint from road onto real sidewalk. Feet are supported by collider; existing model clip visibly negotiates curb. Note: not full foot IK |
| IA-06 | Parity T-junctions use overlapping coplanar asphalt rectangles and look like a cheap patch/flicker | Mercer and Foundry longitudinal roads OWN T-junction asphalt; Workshop Road ends exactly at each road's surface boundary (z12 and z44), rather than crossing/overlapping. Keep road markings and crossroads semantics; no layered square junction pad | Walk/drive over both T-junctions at day/night and from oblique/top views; no asphalt z-fighting, road gaps or spikes |
| IA-07 | Sidewalks too narrow for pedestrians and future NPCs | Update First Light road-segment metadata to 3.75m sidewalks, align parity sidewalk meshes and curb spans, keep 8m road widths and defined T mouths, retain raised collider support | Both sides of Mercer, Workshop, Foundry show increased pedestrian clearance without road/sidewalk overlap or obstructing garage access |

## Scope and protected baselines
- Preserve the accepted South Ward location HUD, Ferrari driving and parking, existing buggy, 3D round metallic downpipes, window row/column grid, existing functional streetlights, shopfront LED baseline, and garage interior/door.
- DO NOT reintroduce unconfirmed OPEN/CLOSED signs, hydrants, bins, custom municipal props or unrelated NPC/business logic. The next object remains owner-selected and one-at-a-time only.
- Preserve every existing road/street name, static collision ownership, Vercel app path `/game`, PWA base, time/night cycle and default quality settings. Object geometry remains cheap and offline-friendly.
- The first-light special parity mesh branch is corrected in place; the generic `planRoadGraph` remains the source for additional districts. Later ward expansion should not duplicate First Light's hard-coded corridor rectangles.

## Verification / test witness
- `municipal-south-ward-infrastructure.test.ts`: fixture and shutter removal, per-building pedestrian doors, hard and painted brick coexistence, nonoverlapping T-junction ownership, sidewalk metadata and actual curb animation gate.
- Existing architecture/urban/humanoid/vehicle/lighting regression tests and TypeScript/build gate remain mandatory.
- NullEngine proves correct scene geometry and lifecycle but **does not** substitute for live visual proof or a physical walkthrough.
- On laptop: inspect Foundry Lane window/roof facade, Mercer garage threshold and side-door, empty plots between buildings (parking/grass/laid concrete), both T-junctions (pan camera and drive), sidewalk/road ascent and Ferrari behavior. Record before/after screenshots for any defect.

**Status:** Working branch only. Visual owner acceptance and any merge/deployment require a separate explicit decision.
