# GTD post-acceptance correction and Toyota Hilux static review — 2026-10-17

**Status:** Implemented on isolated review branch; owner visual acceptance and promotion to main pending.

## Owner acceptance evidence

Owner supplied Android landscape screenshot and expressly confirmed optional driving arrows work. Preserve existing Drag as selectable default; no physics, arrow ramp, touch camera or Range Rover steering modifications are required by this patch.

## UX corrections implemented

- Vehicle context renders ONLY the vehicle entry/exit action button in the touch actions cluster. It hides pedestrian Interact, Jump, Sprint, Combat/Aim, Context and Fly/Descend actions; these remain available in walking context. Left steering and right throttle/brake arrow groups remain available in Arrow mode. Drag mode remains available and unchanged except unnecessary action buttons are hidden while driving.
- `SettingsEditor` replaces every native `<select>` with the already-installed application's Radix Select primitive, retaining the same persisted strings and select options. Trigger is a labelled, keyboard accessible combobox. Menu items are rendered in an application-managed popup with safe touch targets, scroll viewport and consistent GTD styling; browser/Android native choice UI is no longer required.
- Escape closes the open select popup before closing the pause dialog. A dismiss/cancel should not silently apply an unsaved setting.

## Toyota Hilux 002 — visual-only GLB review

- Source: `public/toyota hilux 002.glb` (existing 17.2 MB asset, not recreated or converted). URL must be precisely `/toyota%20hilux%20002.glb`.
- Render authentic GLB with inherited materials/meshes/textures using the shared visual fitting/grounding loader, *not* procedural mock shapes.
- Place on the same Mercer Street carriageway as the accepted Range Rover, along the x road axis at (-13.45, 10.55), separate from the Range Rover at (-5.45,10.55), with conservative 5.25 × 2.15 × 1.87 m visual envelope. Preserve source proportions; fit to envelope and ground from actual source bounds.
- Toyota remains **static**, with an asset-sized Rapier parked collider. No Range Rover drive actor, no Ford/buggy motion, no seat pose, no invented wheel pivots. Range Rover remains the only drivable extra SUV in this lot. Validation checks asphalt, planted props and other parked vehicles before any asset loading; all imported geometries must settle before gameplay.
- Sedan remains delegated/pending and unmounted, ergoninane remains paused/unmounted.
- Owner acceptance: inspect actual Toyota source for orientation, color/material fidelity, real window/tire meshes, grounded wheels, scaled proportions and separation from Rover; document observations before any driving integration.

## QA and production policy

Automated tests verify action visibility in and out of vehicle, settings options, imported parking contracts, static status and clearance in generated Mercer planning. Visual reality requires owner screenshot. Roll back only review-branch patch on failure, not production. Deployment is manual, Git-triggered deployments disabled. Do not merge without explicit owner approval.
