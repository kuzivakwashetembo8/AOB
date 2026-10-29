# GTD-WORLD-012 — South Ward decommission, North Heights primary world
Date: 2026-10-29
Branch: `feature/gtd-south-ward-decommission-20261029`
Base: `de898488215907efa104cf3971b88dd1ba513874`
Disposition: Implementation prepared for verification; not authorized for deployment by this record.

## Owner directive
South Ward must no longer be playable. It inherits the same disabled **Coming Soon** presentation as the other unready districts. North Heights is first in the `/world` directory and is the only available playable destination.

## Dependency review
The legacy South Ward game was mounted at the root via `PersistentGameSession` when `/game` was active. North Heights instead initializes `createNorthHeightsCity8` inside `/north-heights-preview`, with its own canvas, physics, traffic and pedestrian controller. North Heights nevertheless shares modules from `src/game` and common GLB assets with existing runtime code. Deleting those shared sources or wholesale asset directories risks breaking North Heights and regression tests.

## Non-destructive decommission
- Preserve all twelve district identities and original sector codes, but reorder North Heights (sector 05) to the first directory slot.
- Centralize the sole playable entry: sector 05 -> `/north-heights-preview`; all other sectors, including South Ward (02), map to null and receive disabled `Coming Soon` UI.
- Retire the direct `/game` deep link using TanStack Router `beforeLoad` redirect to `/world`.
- Remove the root-owned `PersistentGameSession` mount so legacy navigation cannot bootstrap South Ward's Babylon/Rapier runtime.
- Retire the historical `/first-light-comparison` route with the same redirect because it can bootstrap a South Ward-related scene outside the world directory.
- Keep the old implementation and assets in Git as inactive historical code. No changes to `src/routes/north-heights-preview.tsx`, North Heights simulation, shared physics, fleet, NPC rigs or world meshes.
- No production deployment or merge until validation and owner approval.

## Regression checks
`src/test/world-directory-south-ward-decommission.test.ts` asserts 12 unique district codes and North Heights first, exclusive North Heights route availability, redirects for direct South Ward and First Light legacy URLs, absence of root-mounted legacy runtime, and preservation of independent North Heights boot references.

Manual acceptance, when preview infrastructure is authorized: `/world` opens with North Heights selected; selecting South Ward and any other district displays the disabled Coming Soon button; `/game` and `/first-light-comparison` return to the directory without a legacy canvas; North Heights starts, walks, flies, drives, renders 125 Sedans and streams 100 NPC identities without change. Validate desktop/mobile and bookmarked PWA navigation after service-worker update.

Known pre-existing issue: main's LOAD-061 GitHub Actions verification fails; compare failures to baseline before attributing any CI failure to this change.
