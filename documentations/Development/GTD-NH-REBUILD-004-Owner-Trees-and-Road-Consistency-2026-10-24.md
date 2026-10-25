# GTD-NH-REBUILD-004 — Real tree GLB and road junction consistency

Date: 2026-10-24
Branch: \`trial/north-heights-reconstruction-001\` (nonproduction experiment)
Source screenshots: owner-reviewed REBUILD-003 flying view reports 142 buildings, 14,991 instances, one 23 FPS sample at 23:44 local time. Those numbers reflect that single screenshot only; not a benchmark.
Production / \`main\`: **do not merge, rebase or modify**.

## Acceptance delta from NH-003

User expressly accepted the REBUILD-003 glass architecture; preserve its physical square glazing and building tint/facade proportions. Defects:
1. Generated tree canopies remain visually artificial.
2. Road system is visually inconsistent between individual road segments/intersections.

## Owner tree asset
- \`public/GLBs/Infrastructure/tree_low_poly_lowpoly.glb\` imported from the **exact owner-committed Git blob** \`f643a1a02e92610de3ae56a7708026eebb303ce4\`, 173,352 bytes.
- Source/main commit \`56c55dfd4d4f1a1ccd4798ad1e5e0caaeb2574af\` used **only as read source**. Tree is copied by Git tree SHA; no main merge.
- Attribution from owner commit: "Tree low poly lowpoly" (https://skfb.ly/pO6MX) by 00amza, CC BY 4.0. Preserve credit in preview, source docs and future distribution.
- SceneLoader imports only once, normalizes actual bound height to ~7.3m, retains model materials and draws mesh instances from original geometry. Keep imported source hidden; do not load old leaves.glb or synthetic foliage cards.
- Deterministic placement plans across vacant pocket parks and block setback verges. Avoid roadway and paved sidewalk envelopes.
- Mobile slightly reduces tree density. Real performance must be measured on mobile and desktop; source file size alone does not prove runtime cheap.
- On loader error, show explicit tree import error instead of silently rendering fallback cube foliage.

## Asphalt / streets
- Prior NH-003 implementation drew TWO full-length coplanar axis ribbons crossing at every junction. Thin lifted 8x8 pads were attempts to hide it, but could cause grey/black conflicts and discontinuities.
- NH-004 splits each longitudinal and lateral road into **junction-exclusive 8m carriageway segments**, terminated at each intersection edge. Each intersection receives **exactly one** at-grade 8x8 asphalt quad at the same road surface elevation.
- 3.75m pavement and .205m curbs remain separate and above asphalt, with curb vertical faces and crossings. No automatic road crossing of pedestrian sidewalks.
- All uses of South Ward asphalt and paving material recipes remain shared.
- Regression test checks one covering asphalt quad per central four-way junction, as well as curb face height; additional unit test checks tree placement >7.75m from every road axis.
- No gameplay collision or vehicle lane/navigation integration is claimed by this visual-only trial.

## Gates
- Vercel build/tests READY, preview 200.
- Actual GLB fetch succeeds, HUD reports nonzero GLB trees and mesh-instance count; no synthetic foliage cards remain.
- Owner checks 3+ intersections from multiple altitudes and confirms coherent dark asphalt, pedestrian sidewalk/curbs and lane markings across blocks.
- Owner confirms visual realism of supplied tree model, no scaling/attachment glitches.
- Measure reported FPS relative to same approximate camera view; do not assert improvement purely from test/build status.
- Owner glass facade remains accepted baseline. No main changes without explicit authorization.

## Known risk
A 173KB GLB may still have unexpectedly many draw-call/material partitions. If FPS degrades, reduce **placement density/visibility range** before changing the accepted glass facades. The GLB is not a proxy for South Ward's code-grass texture; grass ground retains the same deterministic naturalistic palette.
