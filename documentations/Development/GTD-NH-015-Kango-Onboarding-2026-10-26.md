# GTD NH-015 — Renault Kangoo source-WHEEL traffic onboarding
Date: 2026-10-26
Branch: feature/nh-014-taxi-traffic-pilot
Status: source-derived rendering implementation; preview and owner visual review required.

## Purpose
After correcting the taxi's backwards driving and limited front steering, introduce the Renault Kangoo **before** any of the existing six parked/drivable default cars. The NH-012 125-agent simulator remains the only traffic intelligence.

## Asset inspection / provenance
- Original author commit contains Renault Kango.glb and optimized *alternate* Renault Kango Optimized.glb (326,092 bytes); do not count as two vehicle types.
- The optimized file is Draco compressed, 13 flat glTF nodes, 12 meshes, 41 material-separated primitives, ~225,960 triangles. Saving bytes did not reduce triangle count.
- Authored source is Z-up, with raw X lateral, raw Y longitudinal, negative Y nose/headlights, raw Z wheel-centre height, parent scale 0.00024016942.
- Four real wheel assemblies are fused across materials: _0-tire and _0-alu span the positive-X pair; Rat textile 2 and chrome08 210 cover the other original side/wheel surfaces. Source primitives live on glTF meshes 4/5; source wheel hubs lie near raw x +/-72, y +/-150, z 31.
- Build-only script scripts/nh015-rig-kango-wheels.mjs decodes those ORIGINAL source Draco triangles and splits by measured corner quadrants into four hub-centred pivots (source-attached rims and rubber). It is fail-closed on source grouping changes; neither overwrites source nor creates procedural cylinder tires.
- Babylon normalization rotates -90 degrees about visual X before geometry fitting, turning author Z-up into game Y-up and original nose into fitted positive Z. Source GLB orientation is unverified visually until preview. Four imported wheel assemblies spin about original X, front wheels steer with shared WHEEL-001 world-yaw adapter, rear wheels only roll.

## Runtime / budget
- Assign exactly six free NH-012 logical identities after the 8 accepted sedans, 12 hatchbacks, 8 taxis. Remain 91 dots. Preserve original agents' routes, speed, X/Z, junction logic, 20Hz cadence and deterministic replay.
- Use one source-derived asset container, maximum one new instantiation per render frame and at most 4 active Kangoo meshes within 375m. Over-budget/distant agents retain diagnostic dots. Actual source geometry remains heavy; no claim of mobile performance sign-off.
- Use NH-013 four-wheel graded-ground contact, connector curvature steering with per-tick hold, front toe gain x1.6 capped 0.85rad, and a high-flight discovery radius. All traffic bodies are visual followers and do NOT introduce Rapier contacts.
- Preserve the six accepted driving-ready owner vehicles in North Heights parking without changing their traffic policy. Do not merge to main until acceptance.

## Visual acceptance
Inspect several taxis and Kangoo vans for front direction, non-sliding tyre rolls, natural full front turns, asphalt uphill contact, body shape, original finishes, flight discovery, LOD/fps implications, and pause/resume cleanup on desktop+mobile.

## SEC-CHECK
Uses only project-local owner source binary; no external services. Wheel processing happens in Vercel/node build, not the browser. Missing derived geometry fails closed to diagnostic dots. No new network requests except the existing same-origin GLB asset. No modifications to player controls, simulation, original six or public main.
