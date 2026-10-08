# Meridia: First Light — Milestone 03 Implementation Plan

Status: PROPOSED — awaiting explicit scope approval. No implementation or deployment authorized.
Date: 2026-10-08
Project: GTD — Grand Theft Division
Predecessors: 01 GTD Shell (accepted); 02 Meridia Genesis (accepted).
Research: [Realistic 3D Browser Worlds](./realistic-3D-browser-worlds-research.md)
Technical source of truth: [Meridian Game World Development SOT](./Meridian%20Game%20World%20Development%20SOT.md)

## Mission

Prove that GTD can deliver a believable, interactive, performant urban scene in its chosen visual language: **grounded cinematic stylization**. Reference inspirations include GTA: San Andreas and Payback 2, but GTD must develop original art, geography, assets, and atmosphere. Realism is grounded in credible proportions, placement, materials, lighting, animation, and behavior, not photographic skin or extreme polygon counts.

**This milestone is a representation laboratory, not a full South Ward build.** No expansion to a district until the visual method, interactions, and device performance are validated.

## Experience target

Voight can walk through one original South Ward street corner, approach a shop or garage, pass through one functional entrance into a compact interior, and return outdoors. The scene should be recognizable as part of a working-class Meridian neighborhood without relying on explanatory UI.

The prototype must look coherent from three views: normal third-person walking camera, near-building inspection, and a wider street view. A successful screenshot alone is insufficient; it must hold up under movement and interaction.

## Proposed scope

- One coherent street corner: short street segment, intersection or side street, sidewalk, curb, road markings, drainage, and an alley or service passage.
- One **hero building** with original facade, physically traversable entrance, compact enterable interior, correct collision and basic lighting.
- Two or three supporting building facades or shells, not enterable in this milestone.
- One identifiable corner business or garage, including original signage and restrained street-level storytelling.
- One parked vehicle, one tree, one streetlight, and a small set of street furniture; enough for scale, composition and representation tests, not maximum prop density.
- Existing Voight proxy remains acceptable for early geometry/interaction tests; assess whether a first stylized rigged-character prototype is feasible before milestone sign-off. Do not confuse environment acceptance with final character-art acceptance.
- One lighting and atmospheric treatment demonstrating grounded cinematic stylization.
- Simple proximity/door interaction and navigation through the hero interior. No combat, traffic AI, mission system, citywide NPC simulation, or drivable vehicle required.

## Art and interaction rules

1. Physical truth where interaction requires it: structural meshes, doors, floors, stairs if present, collision proxies, traversable spaces, and future navigation boundaries.
2. Visual richness where physical geometry does not earn its cost: original textures, normal/roughness maps, decals, window depth, layered facades, selective parallax, and impostors.
3. Buildings are authored as composable objects: exterior shell, visual facade, openings/interaction anchors, collision proxy, optional interior cell, and distance representations.
4. Distinct asset strategies for buildings, people, vehicles, vegetation, and small props; do not impose a single image-to-3D technique universally.
5. Generated or reference imagery is input to original asset production, not a substitute for collision-ready geometry or a license to copy other games.
6. Prefer coherent, readable silhouettes and consistent material/lighting response over maximal detail.

## Execution phases — each requires review before proceeding

### FL-0: Visual contract and benchmark baseline
- Agree on a small reference board, palette, shape language, proportions, time of day, and realism exclusions.
- Inspect current Genesis runtime and measure baseline on available desktop/mobile devices.
- Establish reproducible capture positions, FPS/frame-time measurement, and resource diagnostics.
- Gate: approved visual direction and benchmark method.

### FL-1: Structural corner
- Implement street, sidewalk, curb, alley, building shells, hero entrance and interior, simple collision.
- Test Voight movement, camera obstruction, doorway crossing, physics and cleanup/re-entry.
- Gate: traversable layout with no obvious collision or camera failure.

### FL-2: Visual representation prototype
- Create original hero facade and supporting structures; material system, decals, windows, signage, street props and vegetation.
- Compare actual geometry with image-assisted detail; use normal/depth/parallax only where it survives movement.
- Define asset package convention and initial distance/LOD policies.
- Gate: visual review from fixed viewpoints and continuous walkthrough.

### FL-3: Interaction and atmosphere
- Implement reliable enter/exit interaction, interior visibility and basic lighting; test occlusion and camera behavior.
- Establish one consistent lighting setup, shadows, reflections and atmospheric distance treatment.
- Gate: exterior-to-interior journey remains believable and usable.

### FL-4: Optimization and acceptance
- Profile CPU/GPU frame times where measurable, draw calls, triangles, textures, memory, load and re-entry behavior.
- Test desktop and representative mobile browsers; document hardware, browser, resolution and thermal behavior.
- Introduce texture compression, batching/instances, culling and LOD only where measured costs justify them.
- Gate: user visual approval plus measured acceptable responsiveness and stability on tested devices.

## Acceptance criteria

- **Art:** User explicitly approves the grounded cinematic stylization; buildings, street and objects feel part of one believable place in motion.
- **Interaction:** Voight can traverse sidewalk/street, approach and enter/exit hero building without walking through solid walls or getting trapped; camera remains usable.
- **Representation:** A documented reusable building-asset structure separates structural geometry, visual treatment, collision and optional interior.
- **Performance:** Record device-specific frame times, FPS, draw calls, triangles, texture use where available, scene load time, and degradation under movement. Do not treat research estimates as universal limits. Target a responsive 60 FPS experience where hardware permits, with an explicit lower-tier strategy rather than concealed regressions.
- **Stability:** Re-enter /game, pause/resume, resize, mobile orientation and WebGL context handling are checked; failures recorded.
- **Delivery:** Source committed with reproducible asset provenance and licenses, before/after captures, performance notes, known limitations and acceptance record. Deployment only after explicit authorization.

## Technical safeguards

- Preserve dedicated Babylon runtime, Rapier/WASM physics and fixed-step update. React remains UI shell.
- No automatic Vercel deployment. Do not change deployment guard for routine commits.
- Preserve existing input semantics, mobile controls, optional desktop overlay and minimal HUD.
- Prefer progressive asset loading, bounded memory, simple physics colliders and cleanup.
- Prototype advanced methods (Gaussian splats, neural reconstruction, expensive parallax) behind isolated experiments, never as prerequisites.
- Measure first; optimize based on observed bottlenecks. Research's numeric draw-call/triangle budgets are hypotheses, not GTD specifications.

## Explicit exclusions

No complete South Ward district, pedestrian AI, city traffic, missions, procedural metropolis, final Voight model, fully furnished multi-floor buildings, or commitment to photorealism.

## Open approvals

1. Confirm milestone name **Meridia: First Light**.
2. Approve or amend the corner composition and hero building type (garage, convenience store, or another local business).
3. Confirm FL-0 as the first authorized phase; implementation remains blocked until approval.

## Decision log

2026-10-08: Shell and Genesis confirmed complete. Grounded cinematic stylization selected. First Light plan drafted for review, not yet greenlit.
