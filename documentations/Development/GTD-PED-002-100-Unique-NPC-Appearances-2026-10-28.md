# GTD-PED-002 — One-to-One NPC Appearance Integration
**Date:** 2026-10-28
**Branch:** feature/ped-002-100-unique-npc-appearances-20261028
**Baseline:** fd882f2cde039401f612170e6b0a998c2f360419
**Status:** 100-model visual integration accepted; pre-merge checklist item 01 implemented on preview branch. Awaiting remaining owner checklist items.

## Objective
Replace the 10 repeated models across the accepted PED-001 simulation with one unique GLB per each of 100 pedestrian IDs (PED-001 ⇄ GTD_NPC_001 through PED-100 ⇄ GTD_NPC_100).
Keep all 100 pedestrian positions, building origins, destinations, routes, animation states, curb grounding and 125 Sedan traffic unchanged.

## Performance isolation
- Do not fetch the entire 77,245,264-byte NPC library at startup.
- After first playable frame, use proximity-driven imports; bound to 1 mobile or 2 desktop imports concurrently.
- Keep a 12-mobile/24-desktop inactive container LRU cache; never evict active pedestrians to meet a budget.
- Instantiate at most one rig per frame, retain active/deactivation hysteresis and retain scene cleanup.
- **Pre-merge checklist 01 (2026-10-28):** no colored pedestrian dots, placeholders, or proxy meshes during asset loads, after failures, or during normal gameplay. Logical pedestrians remain independent; missing/invalid assets leave their NPC visually absent and log diagnostics.
- Remove the in-game model/dot switch and retire pedestrian-dot rendering code. Preserve the 100 unique model mapping and accepted walking/road interactions.
- 13 assets exceeding the 1,000,000-byte target remain deferred to a separate optimization branch.

## Preview acceptance
Confirm 100 distinct appearances, preserved pedestrian continuity, no changes to positions and traffic, no loading regressions, safe fly/drive transitions, and acceptable FPS on mobile and desktop.
Do not merge to main without owner acceptance.

## Pre-merge checklist 02 — default character and information control
- Verified on GTD main at fd882f2cde039401f612170e6b0a998c2f360419: `settings-state.ts` still had `enableCharacter: false`, and `GameHud` still rendered `INFO`/`HIDE INFO` text with separate button styling; the requested accepted adjustments were **not** implemented on main.
- Set shared default `enableCharacter: true` so Voight (`character.glb`) is the initial controllable avatar, with UAL still available as a manual setting.
- One-time migration key `gtd-voight-default-v1` upgrades legacy saved OFF values to ON (legacy OFF was the default); subsequent explicit user selection of UAL OFF is saved and respected across refreshes. All districts share one persisted setting.
- Replaced textual `INFO`/`HIDE INFO` with Lucide `Info` glyph and the same `Button variant="control"` design used by adjacent Pause; preserve header reveal and accessible labels.
- No changes to PED-002 models/routes, driving, collisions or pedestrian asset streaming.
