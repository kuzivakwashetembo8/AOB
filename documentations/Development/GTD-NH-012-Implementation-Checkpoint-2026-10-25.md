# GTD-NH-012 — Directed-lane traffic / moving-dot implementation checkpoint

**Date:** 2026-10-25
**Branch:** feature/nh-012-moving-dot-traffic, forked from main commit b36961d7240f252b6bfb0063301c92ce0e7ee522
**Plan and initial SEC-CHECK:** documentations/Development/GTD-NH-012-North-Heights-Directed-Lane-Traffic-Dot-Simulation-Plan-2026-10-25.md on planning/nh-012-dot-traffic-network
**Release:** experimental preview only, no merge to main.

## What the branch implements

- A real **directed** topology derived from the existing 11×11 road-axis coordinates: 121 nodes, 220 physical spans, 440 directed lanes, smooth cubic connector paths at intersections, right-hand prototype lane convention.
- Microscopic traffic simulator in pure TypeScript: 125 deterministic agent identities (6 model references and the original 30 approved model-colour combinations, 5 fifth copies), source-vehicle lengths/widths, fixed 20Hz stepping, per-lane following and stopping, junction first-arrival queueing, exclusive connector reservations, legal routing toward seeded destination nodes and no immediate U-turn transitions.
- Read-only Babylon visualizer: four thin-instanced, emissive coloured dot states (moving cyan, braking amber, stopped red, turning purple). Position is sampled from simulation, raised to road height. No per-agent mesh/GLB/Rapier collider; dots are a **diagnostic proxy only**.
- North Heights flight and walk controls, six accepted drivable NH-010 vehicles, terrain, glass buildings, parking area, player character, minimap and settings preserved. Traffic runs on an isolated branch, no NH-011 125-full-GLB experiment imported.
- Pause stops simulation and prevents tab-resume time leaps. Dots and simulation disposed when North Heights preview closes; separate machine state from player-driven car physics.
- Test suite exercises graph/turn continuity, fleet identities, deterministic 1100-step replay, lane footprint gaps, junction reservation bookkeeping and 25/75/125 agent counts.

## Implementation boundary and SEC-CHECK

**Prototype law:** right-hand traffic, unsigned all-way-stop and deterministic first-arrival priority. No actual traffic signs/lights are changed.
**Physics scope:** Traffic is mathematically lane-bound and longitudinally collision-aware, not a complete Rapier car dynamics or player-traffic collision system. No collision claim for parked GLBs, Voight or player-driven moving car at this stage.
**Rendering:** Exactly 4 Babylon master dot meshes; geometry size is intentionally diagnostic, not authentic vehicle display.
**AI autonomy:** Vehicles genuinely move and turn per simulator decisions; dots never invent movement.
**Source:** No asset compression, remeshing, extra GLBs, external telemetry or APIs.
**Testing:** TypeScript, Vitest, repository build and device preview are mandatory gates. A READY deployment is not proof of visual/physical acceptance.
**SEC-CHECK:** design scope PASS; runtime correctness and phone performance require preview verification; real GLB traffic and production rollout remain gated.
**Next:** inspect deployed dots in low-level flight, verify natural movement/turning/braking, compare mobile and desktop, and obtain owner acceptance before any merge/deployment to main.
