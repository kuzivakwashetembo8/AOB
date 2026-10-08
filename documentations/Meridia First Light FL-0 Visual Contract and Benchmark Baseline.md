# Meridia: First Light — FL-0 Visual Contract & Benchmark Baseline

Status: ACTIVE
Date: 2026-10-08
Milestone: 03 — Meridia: First Light
Parent plan: [Meridia First Light Implementation Plan](./Meridia%20First%20Light%20Implementation%20Plan.md)

## Purpose

FL-0 establishes the visual contract and the measurement method that all First Light work will be judged against before structural world construction advances to FL-1.

## Approved visual contract

**Visual direction:** grounded cinematic stylization.

GTD should feel closer to GTA: San Andreas / Payback 2 than to photoreal human rendering, but with more grounded color, material response, lighting, surface aging, atmospheric depth, environmental coherence, and animation quality.

The target is a world that is intentionally stylized but only a few implementation layers away from human realism.

### Required qualities

- believable scale and proportion;
- readable, coherent silhouettes;
- grounded architecture and street geometry;
- materials that respond consistently to light;
- restrained saturation and contrast;
- visible but controlled wear, grime, patching, and age;
- convincing contact between objects and ground;
- atmospheric depth without obscuring weak assets;
- camera-distance resilience;
- no obvious representation collapse at common gameplay angles.

### Explicit exclusions

- human photorealism;
- hyper-detailed geometry for its own sake;
- bright arcade exaggeration;
- arbitrary prop density;
- post-processing used to hide weak structure;
- third-party asset copying or layout reproduction.

## First Light composition

Hero location: **South Ward neighborhood garage corner**.

The FL-1 structural scene should contain:
- one short primary street;
- one side street or intersection;
- sidewalk and curb system;
- road markings and drainage logic;
- one alley/service passage;
- one enterable neighborhood garage;
- two or three supporting building shells;
- one parked vehicle;
- one urban tree;
- one streetlight;
- restrained street furniture.

The garage is the hero building because it supports street-level storytelling, vehicle-related identity, a large traversable opening, useful exterior/interior contrast, and future GTD narrative expansion.

## Asset doctrine baseline

### Buildings
Simple structural shell + facade-driven richness + selective true depth + optional interior cell.

### Trees
3D trunk/major branches + layered alpha foliage cards + distance simplification.

### Ground
Simple geometry with strong curb, sidewalk, road, drainage, patching, markings, and material transitions.

### Props
True geometry only where silhouette, shadow, collision, or interaction requires it.

### Vehicles
Real 3D geometry with controlled fidelity, strong proportions, proper grounding, and later LOD.

### People
Rigged 3D at gameplay range; realism weighted toward anatomy, posture, gait, animation, lighting, and silhouette rather than expensive skin rendering.

## Current Genesis technical baseline

Repository inspection confirms:
- Babylon.js 9.29.0;
- Rapier 0.21.0 via `@dimforge/rapier3d-compat`;
- React 19.2 / TanStack Start / Vite 8;
- dedicated `GTDGameRuntime` owns Babylon, Rapier, camera, movement, fixed-step simulation, and rendering;
- fixed physics step: **1/60 s**;
- frame delta clamped to 100 ms;
- snapshots published at 12 Hz;
- engine hardware scaling currently limits effective DPR to approximately 1.5;
- React remains outside per-frame gameplay state;
- existing third-person camera-relative movement, jump, sprint, pause/resume, touch controls, keyboard controls, and optional desktop on-screen controls are preserved;
- current scene is still the Genesis test environment and is not an art benchmark.

## Benchmark method

FL-0 measurement exists to detect regressions and guide optimization. Research estimates are reference values only.

### Capture conditions

For each tested device/browser:
- record device model and OS;
- browser and version;
- viewport dimensions;
- devicePixelRatio;
- effective hardware scaling level;
- whether touch or keyboard input mode is active;
- whether the device is plugged in / thermally constrained where known.

### Reproducible scene captures

Until FL-1 exists, Genesis establishes the engine baseline.

Once FL-1 is available, define fixed capture positions:
1. street-wide view;
2. hero garage front at normal walking distance;
3. close oblique facade view;
4. doorway/interior transition;
5. tree near view;
6. wider corner view.

### Metrics to record where available

- FPS;
- CPU frame time;
- GPU frame time if exposed reliably;
- draw calls;
- active meshes;
- triangles;
- texture count / approximate texture memory where available;
- scene load time;
- pause/resume behavior;
- /game re-entry behavior;
- resize/orientation behavior;
- visible LOD or representation popping;
- obvious thermal degradation during sustained mobile play.

## Acceptance method

FL-0 is complete when:
- the visual contract is accepted;
- the asset doctrine is accepted;
- the hero building and corner composition are accepted;
- the benchmark procedure is reproducible;
- current Genesis runtime assumptions are documented;
- no deployment has occurred without explicit authorization.

## FL-0 implementation implications

Before FL-1:
- do not add citywide systems;
- do not optimize against guessed budgets;
- do not introduce advanced rendering techniques unless isolated and measurable;
- do not replace current input/runtime architecture;
- do not treat the Genesis test boxes as visual precedent.

The next technical milestone after FL-0 review is **FL-1: Structural Corner**.
